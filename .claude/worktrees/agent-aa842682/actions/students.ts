"use server";

import { db }                    from "@/prisma/db";
import { revalidatePath }        from "next/cache";
import bcrypt                    from "bcryptjs";
import {
  EnrollmentStatus,
  EnrollmentType,
  SubjectEnrollmentStatus,
}                                from "@prisma/client";
import { enrollStudentAnnually } from "@/lib/db-helpers/annual-enrollment";

// ════════════════════════════════════════════════════════════════════════════
// TYPES
// ════════════════════════════════════════════════════════════════════════════

export type UpdateStudentPayload = {
  studentId:  string;
  schoolId:   string;

  firstName:   string;
  lastName:    string;
  otherNames?: string;
  dob:         Date;
  gender:      string;
  nationality: string;
  parentId:    string;
  imageUrl?:   string | null;

  NIN?:               string;
  bloodGroup?:        string;
  village?:           string;
  religion?:          string;
  medicalConditions?: string;
  disability?:        string;
  previousSchool?:    string;
};

export type TransferStreamPayload = {
  enrollmentId:    string;
  studentId:       string;
  newStreamId:     string;
  newClassYearId?: string;
  schoolId:        string;
  transferredById: string;
  reason?:         string;
};

export type PromoteStudentPayload = {
  studentId:         string;
  fromEnrollmentId:  string;
  toClassYearId:     string;
  toStreamId?:       string | null;
  toTermId?:         string;
  toAcademicYearId?: string;
  schoolId:          string;
  promotedById:      string;
};

// ════════════════════════════════════════════════════════════════════════════
// GET ALL STUDENTS (with active enrollment)
// ════════════════════════════════════════════════════════════════════════════

export async function getStudentsWithEnrollment(schoolId: string) {
  try {
    const students = await db.student.findMany({
      where: { schoolId },
      include: {
        parent: {
          select: { id: true, name: true, phone: true, email: true },
        },
        user: {
          select: { id: true, loginId: true, status: true, lastLoginAt: true },
        },
        enrollments: {
          where:   { status: EnrollmentStatus.ACTIVE },
          orderBy: { createdAt: "desc" },
          take:    1,
          include: {
            classYear: {
              include: {
                classTemplate: { select: { name: true, code: true } },
              },
            },
            stream:       { select: { id: true, name: true } },
            term:         { select: { id: true, name: true, termNumber: true } },
            academicYear: { select: { id: true, year: true } },
          },
        },
      },
      orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
    });

    return { ok: true, students };
  } catch (error: any) {
    console.error("❌ getStudentsWithEnrollment error:", error);
    return { ok: false, message: error.message || "Failed to fetch students", students: [] };
  }
}

// ════════════════════════════════════════════════════════════════════════════
// GET SINGLE STUDENT (full profile)
// ════════════════════════════════════════════════════════════════════════════

export async function getStudentById(studentId: string, schoolId: string) {
  try {
    const student = await db.student.findFirst({
      where: { id: studentId, schoolId },
      include: {
        parent: {
          select: {
            id: true, name: true, phone: true, email: true,
            address: true, occupation: true, relationship: true,
          },
        },
        user: {
          select: {
            id: true, loginId: true, email: true, phone: true,
            status: true, lastLoginAt: true, isVerfied: true,
            failedLoginAttempts: true, lockedUntil: true,
          },
        },
        enrollments: {
          orderBy: { createdAt: "desc" },
          include: {
            classYear: {
              include: {
                classTemplate: { select: { name: true, code: true, level: true } },
              },
            },
            stream:       { select: { id: true, name: true } },
            term:         { select: { id: true, name: true, termNumber: true } },
            academicYear: { select: { id: true, year: true } },
            promotedFrom: {
              select: {
                id: true, classYearId: true, streamId: true,
                classYear: { include: { classTemplate: { select: { name: true } } } },
                stream:    { select: { name: true } },
              },
            },
            promotedTo: {
              select: {
                id: true, classYearId: true, streamId: true,
                classYear: { include: { classTemplate: { select: { name: true } } } },
                stream:    { select: { name: true } },
              },
            },
            subjectEnrollments: {
              include: {
                streamSubject: {
                  include: {
                    subject:      { select: { id: true, name: true, code: true } },
                    subjectPaper: { select: { id: true, paperNumber: true, name: true, paperCode: true } },
                  },
                },
                subjectResult: {
                  select: { totalPercentage: true, finalGrade: true, gradeDescriptor: true },
                },
                aoiScores:    { orderBy: { enteredAt: "desc" }, take: 5 },
                aoiUnits:     { orderBy: { unitNumber: "asc" } },
                examMarks:    { orderBy: { enteredAt: "desc" }, take: 10 },
                paperResults: {
                  include: {
                    subjectPaper: { select: { paperNumber: true, name: true, paperCode: true } },
                  },
                },
              },
              orderBy: [
                { streamSubject: { subject:      { name:        "asc" } } },
                { streamSubject: { subjectPaper: { paperNumber: "asc" } } },
              ],
            },
          },
        },
      },
    });

    if (!student) return { ok: false, message: "Student not found", student: null };

    return { ok: true, student };
  } catch (error: any) {
    console.error("❌ getStudentById error:", error);
    return { ok: false, message: error.message || "Failed to fetch student", student: null };
  }
}

// ════════════════════════════════════════════════════════════════════════════
// UPDATE STUDENT
// ════════════════════════════════════════════════════════════════════════════

export async function updateStudent(data: UpdateStudentPayload) {
  try {
    const existing = await db.student.findFirst({
      where:  { id: data.studentId, schoolId: data.schoolId },
      select: { id: true, userId: true, firstName: true, lastName: true, imageUrl: true },
    });
    if (!existing) throw new Error("Student not found.");

    const parent = await db.parent.findFirst({
      where: { id: data.parentId, schoolId: data.schoolId },
    });
    if (!parent) throw new Error("Parent not found.");

    const student = await db.student.update({
      where: { id: data.studentId },
      data: {
        firstName:         data.firstName,
        lastName:          data.lastName,
        otherNames:        data.otherNames ?? null,
        dob:               data.dob,
        gender:            data.gender,
        nationality:       data.nationality,
        parentId:          data.parentId,
        imageUrl:          data.imageUrl ?? null,
        NIN:               data.NIN ?? null,
        bloodGroup:        data.bloodGroup ?? null,
        village:           data.village ?? null,
        religion:          data.religion ?? null,
        medicalConditions: data.medicalConditions ?? null,
        disability:        data.disability ?? null,
        previousSchool:    data.previousSchool ?? null,
      },
    });

    if (existing.userId) {
      await db.user.update({
        where: { id: existing.userId },
        data: {
          name:      `${data.firstName} ${data.lastName}`,
          firstName: data.firstName,
          lastName:  data.lastName,
          image:     data.imageUrl ?? null,
        },
      });
    }

    revalidatePath(`/school/${data.schoolId}/users/students`);

    return { ok: true, student };
  } catch (error: any) {
    console.error("❌ updateStudent error:", error);
    return { ok: false, message: error.message || "Failed to update student" };
  }
}

// ════════════════════════════════════════════════════════════════════════════
// DELETE STUDENT
// ════════════════════════════════════════════════════════════════════════════

export async function deleteStudent(data: {
  studentId: string;
  schoolId:  string;
}) {
  try {
    const student = await db.student.findFirst({
      where:  { id: data.studentId, schoolId: data.schoolId },
      select: { id: true, userId: true, admissionNo: true, firstName: true, lastName: true },
    });
    if (!student) throw new Error("Student not found.");

    await db.$transaction(async (tx) => {
      await tx.student.delete({ where: { id: data.studentId } });
      if (student.userId) {
        await tx.user.delete({ where: { id: student.userId } });
      }
    });

    revalidatePath(`/school/${data.schoolId}/users/students`);
    revalidatePath(`/school/${data.schoolId}/finance/fees/accounts`);

    return {
      ok:          true,
      admissionNo: student.admissionNo,
      name:        `${student.firstName} ${student.lastName}`,
    };
  } catch (error: any) {
    console.error("❌ deleteStudent error:", error);
    return { ok: false, message: error.message || "Failed to delete student" };
  }
}

// ════════════════════════════════════════════════════════════════════════════
// TOGGLE STUDENT STATUS
// ════════════════════════════════════════════════════════════════════════════

export async function toggleStudentStatus(data: {
  studentId: string;
  schoolId:  string;
  active:    boolean;
}) {
  try {
    const student = await db.student.findFirst({
      where:  { id: data.studentId, schoolId: data.schoolId },
      select: { id: true, userId: true },
    });
    if (!student) throw new Error("Student not found.");

    await db.$transaction(async (tx) => {
      await tx.student.update({
        where: { id: data.studentId },
        data:  { isActive: data.active },
      });
      if (student.userId) {
        await tx.user.update({
          where: { id: student.userId },
          data:  { status: data.active },
        });
      }
    });

    revalidatePath(`/school/${data.schoolId}/users/students`);

    return { ok: true, active: data.active };
  } catch (error: any) {
    console.error("❌ toggleStudentStatus error:", error);
    return { ok: false, message: error.message || "Failed to update student status" };
  }
}

// ════════════════════════════════════════════════════════════════════════════
// TRANSFER STUDENT TO DIFFERENT STREAM (within same term)
// ════════════════════════════════════════════════════════════════════════════

export async function transferStudentStream(data: TransferStreamPayload) {
  try {
    return await db.$transaction(async (tx) => {
      const enrollment = await tx.enrollment.findFirst({
        where:  { id: data.enrollmentId, studentId: data.studentId },
        select: {
          id: true, termId: true, academicYearId: true,
          classYearId: true, streamId: true, status: true,
        },
      });
      if (!enrollment) throw new Error("Enrollment not found.");
      // FIX [5]: Use enum — EnrollmentStatus.ACTIVE
      if (enrollment.status !== EnrollmentStatus.ACTIVE) {
        throw new Error("Can only transfer from an active enrollment.");
      }

      const newStream = await tx.stream.findFirst({
        where: {
          id:          data.newStreamId,
          classYearId: data.newClassYearId ?? enrollment.classYearId,
        },
      });
      if (!newStream) throw new Error("Target stream not found.");

      const targetClassYearId = data.newClassYearId ?? enrollment.classYearId;

      // FIX [5]: Use EnrollmentStatus enum
      await tx.enrollment.update({
        where: { id: data.enrollmentId },
        data:  { status: EnrollmentStatus.TRANSFERRED },
      });

      const newEnrollment = await tx.enrollment.create({
        data: {
          studentId:      data.studentId,
          classYearId:    targetClassYearId,
          streamId:       data.newStreamId,
          termId:         enrollment.termId,
          academicYearId: enrollment.academicYearId,
          status:         EnrollmentStatus.ACTIVE,
          enrollmentType: EnrollmentType.TRANSFER,
          promotedFromId: data.enrollmentId,
        },
      });

      let subjectCount = 0;

      const streamSubjects = await tx.streamSubject.findMany({
        where: {
          streamId:    data.newStreamId,
          termId:      enrollment.termId,
          subjectType: "COMPULSORY",
          isActive:    true,
        },
        select: { id: true },
      });

      if (streamSubjects.length > 0) {
        await tx.studentSubjectEnrollment.createMany({
          data: streamSubjects.map((ss) => ({
            enrollmentId:    newEnrollment.id,
            streamSubjectId: ss.id,
            isCompulsory:    true,
            isAutoEnrolled:  true,
            // FIX [5]: Use SubjectEnrollmentStatus enum
            status:          SubjectEnrollmentStatus.ACTIVE,
          })),
          skipDuplicates: true,
        });
        subjectCount = streamSubjects.length;
      }

      revalidatePath(`/school/${data.schoolId}/users/students`);

      return { ok: true, newEnrollment, subjectsEnrolled: subjectCount };
    });
  } catch (error: any) {
    console.error("❌ transferStudentStream error:", error);
    return { ok: false, message: error.message || "Failed to transfer student" };
  }
}

// ════════════════════════════════════════════════════════════════════════════
// PROMOTE STUDENT TO NEXT CLASS / YEAR
// ════════════════════════════════════════════════════════════════════════════

export async function promoteStudent(data: PromoteStudentPayload) {
  try {
    return await db.$transaction(async (tx) => {
      let toAcademicYearId = data.toAcademicYearId;
      if (!toAcademicYearId) {
        const activeYear = await tx.academicYear.findFirst({
          where: { schoolId: data.schoolId, isActive: true },
        });
        if (!activeYear) throw new Error("No active academic year found.");
        toAcademicYearId = activeYear.id;
      }

      let toTermId = data.toTermId;
      if (!toTermId) {
        const activeTerm = await tx.academicTerm.findFirst({
          where: { academicYearId: toAcademicYearId, isActive: true },
        });
        if (!activeTerm) throw new Error("No active term found.");
        toTermId = activeTerm.id;
      }

      const fromEnrollment = await tx.enrollment.findFirst({
        where:  { id: data.fromEnrollmentId, studentId: data.studentId },
        select: { id: true, status: true, classYearId: true },
      });
      if (!fromEnrollment) throw new Error("Source enrollment not found.");
      // FIX [6]: Use EnrollmentStatus enum
      if (fromEnrollment.status !== EnrollmentStatus.ACTIVE) {
        throw new Error("Can only promote from an active enrollment.");
      }

      const toClassYear = await tx.classYear.findFirst({
        where: { id: data.toClassYearId, academicYearId: toAcademicYearId },
      });
      if (!toClassYear) throw new Error("Target class not found in the active academic year.");

      if (data.toStreamId) {
        const toStream = await tx.stream.findFirst({
          where: { id: data.toStreamId, classYearId: data.toClassYearId },
        });
        if (!toStream) throw new Error("Target stream does not belong to the target class.");
      }

      const existingNewEnrollment = await tx.enrollment.findFirst({
        where: { studentId: data.studentId, termId: toTermId, status: EnrollmentStatus.ACTIVE },
      });
      if (existingNewEnrollment) {
        throw new Error("Student already has an active enrollment in the target term.");
      }

      // FIX [6]: Use EnrollmentStatus enum
      await tx.enrollment.update({
        where: { id: data.fromEnrollmentId },
        data:  { status: EnrollmentStatus.COMPLETED },
      });

      const newEnrollment = await tx.enrollment.create({
        data: {
          studentId:      data.studentId,
          classYearId:    data.toClassYearId,
          streamId:       data.toStreamId ?? null,
          termId:         toTermId,
          academicYearId: toAcademicYearId,
          status:         EnrollmentStatus.ACTIVE,
          enrollmentType: EnrollmentType.PROMOTED,
          promotedFromId: data.fromEnrollmentId,
        },
      });

      let subjectCount = 0;

      if (data.toStreamId) {
        // Enroll in compulsory subjects for ALL terms in the target academic year
        subjectCount = await enrollStudentAnnually(tx, {
          studentId:      data.studentId,
          streamId:       data.toStreamId,
          classYearId:    data.toClassYearId,
          academicYearId: toAcademicYearId,
          baseTermId:     toTermId,
        });
      }

      revalidatePath(`/school/${data.schoolId}/users/students`);
      revalidatePath(`/school/${data.schoolId}/users/students/${data.studentId}`);

      return {
        ok: true, newEnrollment,
        fromEnrollmentId: data.fromEnrollmentId,
        subjectsEnrolled: subjectCount,
      };
    });
  } catch (error: any) {
    console.error("❌ promoteStudent error:", error);
    return { ok: false, message: error.message || "Failed to promote student" };
  }
}

// ════════════════════════════════════════════════════════════════════════════
// RESET STUDENT PASSWORD
// ════════════════════════════════════════════════════════════════════════════

export async function resetStudentPassword(data: {
  studentId:   string;
  newPassword: string;
  schoolId:    string;
}) {
  try {
    const student = await db.student.findFirst({
      where:  { id: data.studentId, schoolId: data.schoolId },
      select: { id: true, userId: true, admissionNo: true },
    });

    if (!student)        throw new Error("Student not found.");
    if (!student.userId) throw new Error("Student has no user account.");

    const hashed = await bcrypt.hash(data.newPassword, 10);

    await db.user.update({
      where: { id: student.userId },
      data:  { password: hashed, failedLoginAttempts: 0, lockedUntil: null },
    });

    return { ok: true, admissionNo: student.admissionNo };
  } catch (error: any) {
    console.error("❌ resetStudentPassword error:", error);
    return { ok: false, message: error.message || "Failed to reset password" };
  }
}

// ════════════════════════════════════════════════════════════════════════════
// UPDATE STUDENT LOGIN CONTACT
// ════════════════════════════════════════════════════════════════════════════

export async function updateStudentLoginContact(data: {
  studentId: string;
  schoolId:  string;
  phone?:    string;
  email?:    string;
}) {
  try {
    const student = await db.student.findFirst({
      where:  { id: data.studentId, schoolId: data.schoolId },
      select: { id: true, userId: true },
    });

    if (!student)        throw new Error("Student not found.");
    if (!student.userId) throw new Error("Student has no user account.");

    if (data.phone) {
      const phoneConflict = await db.user.findFirst({
        where: { phone: data.phone, NOT: { id: student.userId } },
      });
      if (phoneConflict) throw new Error(`Phone ${data.phone} is already in use.`);
    }

    if (data.email) {
      const emailConflict = await db.user.findFirst({
        where: { email: data.email, NOT: { id: student.userId } },
      });
      if (emailConflict) throw new Error(`Email ${data.email} is already in use.`);
    }

    await db.user.update({
      where: { id: student.userId },
      data: {
        ...(data.phone ? { phone: data.phone } : {}),
        ...(data.email !== undefined ? { email: data.email ?? null } : {}),
      },
    });

    revalidatePath(`/school/${data.schoolId}/users/students`);

    return { ok: true };
  } catch (error: any) {
    console.error("❌ updateStudentLoginContact error:", error);
    return { ok: false, message: error.message || "Failed to update contact" };
  }
}

// ════════════════════════════════════════════════════════════════════════════
// WITHDRAW STUDENT
// ════════════════════════════════════════════════════════════════════════════

export async function withdrawStudent(data: {
  enrollmentId: string;
  studentId:    string;
  schoolId:     string;
  reason?:      string;
}) {
  try {
    const enrollment = await db.enrollment.findFirst({
      where: {
        id:        data.enrollmentId,
        studentId: data.studentId,
        student:   { schoolId: data.schoolId },
        status:    EnrollmentStatus.ACTIVE,
      },
    });
    if (!enrollment) throw new Error("Active enrollment not found.");

    await db.enrollment.update({
      where: { id: data.enrollmentId },
      data:  { status: EnrollmentStatus.DROPPED },
    });

    await db.student.update({
      where: { id: data.studentId },
      data:  { isActive: false },
    });

    revalidatePath(`/school/${data.schoolId}/users/students`);
    revalidatePath(`/school/${data.schoolId}/users/students/${data.studentId}`);

    return { ok: true };
  } catch (error: any) {
    console.error("❌ withdrawStudent error:", error);
    return { ok: false, message: error.message || "Failed to withdraw student" };
  }
}

// ════════════════════════════════════════════════════════════════════════════
// GET TERMS BY ACADEMIC YEAR
// ════════════════════════════════════════════════════════════════════════════

export async function getTermsByAcademicYear(academicYearId: string) {
  try {
    const terms = await db.academicTerm.findMany({
      where:   { academicYearId },
      select:  {
        id: true, name: true, termNumber: true,
        isActive: true, startDate: true, endDate: true,
      },
      orderBy: { termNumber: "asc" },
    });
    return { ok: true as const, data: terms };
  } catch (error) {
    console.error("getTermsByAcademicYear error:", error);
    return { ok: false as const, data: [], message: "Failed to fetch terms" };
  }
}

// ════════════════════════════════════════════════════════════════════════════
// GET STREAMS BY CLASS YEAR
// ════════════════════════════════════════════════════════════════════════════

export async function getStreamsByClassYear(classYearId: string) {
  try {
    const streams = await db.stream.findMany({
      where:   { classYearId },
      select:  { id: true, name: true },
      orderBy: { name: "asc" },
    });
    return { ok: true as const, data: streams };
  } catch (error) {
    console.error("getStreamsByClassYear error:", error);
    return { ok: false as const, data: [], message: "Failed to fetch streams" };
  }
}

// ════════════════════════════════════════════════════════════════════════════
// ENROLL STUDENT IN A TERM
// ════════════════════════════════════════════════════════════════════════════

export async function enrollStudent(data: {
  studentId:      string;
  classYearId:    string;
  streamId?:      string | null;
  academicYearId: string;
  termId:         string;
  // FIX [7]: Typed as the enum rather than a loose union string
  enrollmentType: EnrollmentType;
  schoolId:       string;
  enrolledById:   string;
}) {
  try {
    return await db.$transaction(async (tx) => {
      const student = await tx.student.findFirst({
        where: { id: data.studentId, schoolId: data.schoolId, isActive: true },
      });
      if (!student) return { ok: false as const, message: "Student not found or inactive." };

      const classYear = await tx.classYear.findFirst({
        where: { id: data.classYearId, academicYearId: data.academicYearId },
      });
      if (!classYear) return { ok: false as const, message: "Class not found in this academic year." };

      const term = await tx.academicTerm.findFirst({
        where: { id: data.termId, academicYearId: data.academicYearId },
      });
      if (!term) return { ok: false as const, message: "Term not found in this academic year." };

      if (data.streamId) {
        const stream = await tx.stream.findFirst({
          where: { id: data.streamId, classYearId: data.classYearId },
        });
        if (!stream) return { ok: false as const, message: "Stream not found in this class." };
      }

      const existing = await tx.enrollment.findFirst({
        where: { studentId: data.studentId, termId: data.termId },
      });
      if (existing) {
        return { ok: false as const, message: `Student is already enrolled in ${term.name}.` };
      }

      const enrollment = await tx.enrollment.create({
        data: {
          studentId:      data.studentId,
          classYearId:    data.classYearId,
          streamId:       data.streamId ?? null,
          academicYearId: data.academicYearId,
          termId:         data.termId,
          enrollmentType: data.enrollmentType,
          status:         EnrollmentStatus.ACTIVE,
        },
      });

      if (data.streamId) {
        const streamSubjects = await tx.streamSubject.findMany({
          where: {
            streamId:    data.streamId,
            termId:      data.termId,
            isActive:    true,
            subjectType: "COMPULSORY",
          },
          select: { id: true },
        });
        if (streamSubjects.length > 0) {
          await tx.studentSubjectEnrollment.createMany({
            data: streamSubjects.map((ss) => ({
              enrollmentId:    enrollment.id,
              streamSubjectId: ss.id,
              status:          SubjectEnrollmentStatus.ACTIVE,
              isCompulsory:    true,
              isAutoEnrolled:  true,
            })),
            skipDuplicates: true,
          });
        }
      }

      revalidatePath("/school");

      return {
        ok:      true as const,
        message: `Student enrolled in ${term.name} successfully.`,
        data:    { enrollmentId: enrollment.id },
      };
    });
  } catch (error) {
    console.error("enrollStudent error:", error);
    return { ok: false as const, message: "Failed to enroll student. Please try again." };
  }
}

// ════════════════════════════════════════════════════════════════════════════
// TRANSFER STUDENT TO A DIFFERENT STREAM
// ════════════════════════════════════════════════════════════════════════════

export async function transferStudentToStream(data: {
  enrollmentId: string;
  newStreamId:  string;
  schoolId:     string;
  reason?:      string;
}) {
  try {
    return await db.$transaction(async (tx) => {
      const enrollment = await tx.enrollment.findUnique({
        where:   { id: data.enrollmentId },
        include: { stream: { select: { id: true, name: true } } },
      });

      if (!enrollment) return { ok: false as const, message: "Enrollment not found." };
      // FIX [8]: Use EnrollmentStatus enum
      if (enrollment.status !== EnrollmentStatus.ACTIVE) {
        return { ok: false as const, message: "Only active enrollments can be transferred." };
      }

      const newStream = await tx.stream.findFirst({
        where: { id: data.newStreamId, classYearId: enrollment.classYearId },
      });
      if (!newStream) return { ok: false as const, message: "Target stream not found in this class." };

      if (enrollment.streamId === data.newStreamId) {
        return { ok: false as const, message: "Student is already in this stream." };
      }

      // FIX [8]: Use SubjectEnrollmentStatus enum
      await tx.studentSubjectEnrollment.updateMany({
        where: { enrollmentId: data.enrollmentId, status: SubjectEnrollmentStatus.ACTIVE },
        data:  { status: SubjectEnrollmentStatus.DROPPED },
      });

      await tx.enrollment.update({
        where: { id: data.enrollmentId },
        data:  { streamId: data.newStreamId },
      });

      const streamSubjects = await tx.streamSubject.findMany({
        where: {
          streamId:    data.newStreamId,
          termId:      enrollment.termId,
          isActive:    true,
          subjectType: "COMPULSORY",
        },
        select: { id: true },
      });

      if (streamSubjects.length > 0) {
        await tx.studentSubjectEnrollment.createMany({
          data: streamSubjects.map((ss) => ({
            enrollmentId:    data.enrollmentId,
            streamSubjectId: ss.id,
            status:          SubjectEnrollmentStatus.ACTIVE,
            isCompulsory:    true,
            isAutoEnrolled:  true,
          })),
          skipDuplicates: true,
        });
      }

      revalidatePath("/school");

      return {
        ok:      true as const,
        message: `Student transferred to ${newStream.name} successfully.`,
        data:    { newStreamId: data.newStreamId, newStreamName: newStream.name },
      };
    });
  } catch (error) {
    console.error("transferStudentToStream error:", error);
    return { ok: false as const, message: "Failed to transfer student. Please try again." };
  }
}