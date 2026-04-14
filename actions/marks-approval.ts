// actions/marks-approvals.ts
"use server";

import { db }             from "@/prisma/db";
import { revalidatePath } from "next/cache";
import { ExamType, MarkStatus } from "@prisma/client";

// ════════════════════════════════════════════════════════════════════════════
// GET APPROVALS OVERVIEW
// Returns all stream subjects grouped by class → stream for the active term,
// with high-level mark counts (no per-student detail yet).
// ════════════════════════════════════════════════════════════════════════════

export async function getMarksApprovalsData(schoolId: string) {
  try {
    const activeYear = await db.academicYear.findFirst({
      where:   { schoolId, isActive: true },
      select:  {
        id: true, year: true,
        terms: {
          where:   { isActive: true },
          select:  { id: true, name: true, termNumber: true },
          orderBy: { termNumber: "asc" },
        },
      },
    });
    if (!activeYear)           return { ok: false as const, message: "No active academic year found" };
    const activeTerm = activeYear.terms[0];
    if (!activeTerm)           return { ok: false as const, message: "No active term found" };

    const streamSubjects = await db.streamSubject.findMany({
      where: { termId: activeTerm.id, isActive: true, stream: { school: { id: schoolId } } },
      select: {
        id:          true,
        subjectType: true,
        stream: {
          select: {
            id: true, name: true,
            classYear: {
              select: {
                id: true,
                classTemplate: { select: { id: true, name: true, level: true } },
              },
            },
          },
        },
        subject:      { select: { id: true, name: true, code: true } },
        subjectPaper: { select: { id: true, name: true, paperNumber: true } },
        studentEnrollments: {
          where:  { status: "ACTIVE" },
          select: {
            id: true,
            examMarks: { select: { id: true, status: true } },
            aoiScores: { select: { id: true, status: true } },
            aoiUnits:  { select: { id: true, status: true } },
          },
        },
      },
      orderBy: [
        { stream: { classYear: { classTemplate: { level: "asc" } } } },
        { stream: { name: "asc" } },
        { subject: { name: "asc" } },
      ],
    });

    type SubjectEntry = {
      streamSubjectId:  string;
      subjectName:      string;
      subjectCode:      string | null;
      paperName:        string | null;
      paperNumber:      number | null;
      totalStudents:    number;
      examDraft:        number;
      examAwaitingCH:   number; // SUBMITTED — waiting for class head approval
      examReadyForDOS:  number; // CLASS_TEACHER_APPROVED — class head signed off, DOS can act
      examApproved:     number;
      aoiDraft:         number;
      aoiAwaitingCH:    number;
      aoiReadyForDOS:   number;
      aoiApproved:      number;
      hasAnyMarks:      boolean;
      allApproved:      boolean;
    };

    type StreamEntry  = { streamId: string; streamName: string; subjects: SubjectEntry[] };
    type ClassEntry   = { classYearId: string; className: string; streams: StreamEntry[] };

    const classMap = new Map<string, ClassEntry>();

    for (const ss of streamSubjects) {
      const classYearId = ss.stream.classYear.id;
      const className   = ss.stream.classYear.classTemplate.name;
      const streamId    = ss.stream.id;
      const streamName  = ss.stream.name;

      if (!classMap.has(classYearId)) classMap.set(classYearId, { classYearId, className, streams: [] });
      const classEntry = classMap.get(classYearId)!;
      let streamEntry  = classEntry.streams.find(s => s.streamId === streamId);
      if (!streamEntry) { streamEntry = { streamId, streamName, subjects: [] }; classEntry.streams.push(streamEntry); }

      let examDraft = 0, examAwaitingCH = 0, examReadyForDOS = 0, examApproved = 0;
      let aoiDraft  = 0, aoiAwaitingCH  = 0, aoiReadyForDOS  = 0, aoiApproved  = 0;

      for (const se of ss.studentEnrollments) {
        for (const m of se.examMarks) {
          if (m.status === MarkStatus.DRAFT)                  examDraft++;
          if (m.status === MarkStatus.SUBMITTED)              examAwaitingCH++;  // needs class head first
          if (m.status === MarkStatus.CLASS_TEACHER_APPROVED) examReadyForDOS++; // class head signed off
          if (m.status === MarkStatus.APPROVED)               examApproved++;
        }
        for (const m of se.aoiScores) {
          if (m.status === MarkStatus.DRAFT)                  aoiDraft++;
          if (m.status === MarkStatus.SUBMITTED)              aoiAwaitingCH++;
          if (m.status === MarkStatus.CLASS_TEACHER_APPROVED) aoiReadyForDOS++;
          if (m.status === MarkStatus.APPROVED)               aoiApproved++;
        }
        for (const m of se.aoiUnits) {
          if (m.status === MarkStatus.DRAFT)                  aoiDraft++;
          if (m.status === MarkStatus.SUBMITTED)              aoiAwaitingCH++;
          if (m.status === MarkStatus.CLASS_TEACHER_APPROVED) aoiReadyForDOS++;
          if (m.status === MarkStatus.APPROVED)               aoiApproved++;
        }
      }

      const totalMarks = examDraft + examAwaitingCH + examReadyForDOS + examApproved
                       + aoiDraft  + aoiAwaitingCH  + aoiReadyForDOS  + aoiApproved;
      const allApproved = totalMarks > 0
        && examDraft === 0 && examAwaitingCH === 0 && examReadyForDOS === 0
        && aoiDraft  === 0 && aoiAwaitingCH  === 0 && aoiReadyForDOS  === 0;

      streamEntry.subjects.push({
        streamSubjectId: ss.id,
        subjectName:     ss.subject.name,
        subjectCode:     ss.subject.code,
        paperName:       ss.subjectPaper?.name ?? null,
        paperNumber:     ss.subjectPaper?.paperNumber ?? null,
        totalStudents:   ss.studentEnrollments.length,
        examDraft, examAwaitingCH, examReadyForDOS, examApproved,
        aoiDraft,  aoiAwaitingCH,  aoiReadyForDOS,  aoiApproved,
        hasAnyMarks: totalMarks > 0,
        allApproved,
      });
    }

    return {
      ok:   true as const,
      data: {
        academicYear: activeYear.year,
        termName:     activeTerm.name,
        termId:       activeTerm.id,
        classes:      Array.from(classMap.values()),
      },
    };
  } catch (error: any) {
    console.error("❌ getMarksApprovalsData:", error);
    return { ok: false as const, message: error?.message ?? "Failed to load approvals data" };
  }
}

// ════════════════════════════════════════════════════════════════════════════
// GET FULL MARKS DETAIL FOR ONE STREAM SUBJECT
// Called when the approver opens a subject to review before approving.
// Returns every student's BOT/MTE/EOT marks and AOI scores with statuses.
// ════════════════════════════════════════════════════════════════════════════

export async function getStreamSubjectMarksDetail(streamSubjectId: string) {
  try {
    const ss = await db.streamSubject.findUnique({
      where:   { id: streamSubjectId },
      include: {
        subject:      { select: { id: true, name: true, code: true } },
        subjectPaper: { select: { id: true, name: true, paperNumber: true, maxMarks: true } },
        term:         { select: { id: true, name: true } },
        stream: {
          select: {
            id: true, name: true,
            classYear: {
              select: {
                id: true,
                classTemplate: { select: { name: true } },
              },
            },
          },
        },
        studentEnrollments: {
          where:   { status: "ACTIVE" },
          orderBy: { enrollment: { student: { lastName: "asc" } } },
          include: {
            enrollment: {
              select: {
                student: {
                  select: { id: true, firstName: true, lastName: true, admissionNo: true, gender: true },
                },
              },
            },
            examMarks: {
              include: { exam: { select: { id: true, name: true, examType: true, maxMarks: true } } },
              orderBy: { exam: { examType: "asc" } },
            },
            aoiScores: {
              include: { aoiTopic: { select: { id: true, topicNumber: true, topicName: true, maxPoints: true } } },
              orderBy: { aoiTopic: { topicNumber: "asc" } },
            },
            aoiUnits: {
              orderBy: { unitNumber: "asc" },
            },
            subjectResult: {
              select: { projectScore: true, projectOutOf: true },
            },
          },
        },
      },
    });

    if (!ss) return { ok: false as const, message: "Stream subject not found" };

    // Fetch assessment config to know if project is enabled
    const classYearId = ss.stream.classYear.id;
    const termId      = ss.term.id;
    const assessmentConfig = await db.classAssessmentConfig.findUnique({
      where:  { classYearId_termId: { classYearId, termId } },
    });
    const hasProject     = (assessmentConfig as any)?.hasProject     ?? false;
    const projectMaxScore = (assessmentConfig as any)?.projectMaxScore ?? 10;

    // Gather all unique exams across students (consistent columns)
    const examMap = new Map<string, { id: string; name: string; examType: string; maxMarks: number }>();
    for (const se of ss.studentEnrollments) {
      for (const em of se.examMarks) {
        if (!examMap.has(em.exam.id)) examMap.set(em.exam.id, em.exam);
      }
    }
    const exams = Array.from(examMap.values()).sort((a, b) =>
      ["BOT", "MTE", "EOT", "MOCK", "ASSIGNMENT"].indexOf(a.examType) -
      ["BOT", "MTE", "EOT", "MOCK", "ASSIGNMENT"].indexOf(b.examType)
    );

    // Gather all unique AOI topics
    const topicMap = new Map<string, { id: string; topicNumber: number; topicName: string; maxPoints: number }>();
    for (const se of ss.studentEnrollments) {
      for (const sc of se.aoiScores) {
        if (!topicMap.has(sc.aoiTopic.id)) topicMap.set(sc.aoiTopic.id, sc.aoiTopic);
      }
    }
    const aoiTopics = Array.from(topicMap.values()).sort((a, b) => a.topicNumber - b.topicNumber);

    // Max AOI units across students
    const maxUnits = ss.studentEnrollments.reduce(
      (max, se) => Math.max(max, se.aoiUnits.length), 0
    );

    return {
      ok:   true as const,
      data: {
        streamSubjectId: ss.id,
        subjectName:     ss.subject.name,
        subjectCode:     ss.subject.code,
        paperName:       ss.subjectPaper?.name ?? null,
        paperNumber:     ss.subjectPaper?.paperNumber ?? null,
        className:       ss.stream.classYear.classTemplate.name,
        streamName:      ss.stream.name,
        termName:        ss.term.name,
        exams,
        aoiTopics,
        maxUnits,
        hasProject,
        projectMaxScore,
        students: ss.studentEnrollments.map((se) => {
          const student    = se.enrollment.student;
          const examByType = Object.fromEntries(se.examMarks.map(em => [em.exam.examType, em]));
          const aoiByTopic = Object.fromEntries(se.aoiScores.map(sc => [sc.aoiTopic.id, sc]));
          const unitByNum  = Object.fromEntries(se.aoiUnits.map(u  => [u.unitNumber, u]));

          const allExamStatuses = se.examMarks.map(m => m.status);
          const allAOIStatuses  = [...se.aoiScores.map(m => m.status), ...se.aoiUnits.map(m => m.status)];
          const allStatuses     = [...allExamStatuses, ...allAOIStatuses];

          const hasAny             = allStatuses.length > 0;
          const allApproved        = hasAny && allStatuses.every(s => s === MarkStatus.APPROVED);
          // "hasSubmitted" = class-head approved → DOS can act; "hasAwaitingClassHead" = SUBMITTED, not yet cleared
          const hasSubmitted       = allStatuses.some(s => s === MarkStatus.CLASS_TEACHER_APPROVED);
          const hasAwaitingClassHead = allStatuses.some(s => s === MarkStatus.SUBMITTED);
          const hasDraft           = allStatuses.some(s => s === MarkStatus.DRAFT);

          return {
            enrollmentId: se.id,
            studentId:    student.id,
            admissionNo:  student.admissionNo,
            name:         `${student.firstName} ${student.lastName}`,
            gender:       student.gender,
            examByType,
            aoiByTopic,
            unitByNum,
            projectScore: (se as any).subjectResult?.projectScore ?? null,
            projectOutOf: (se as any).subjectResult?.projectOutOf ?? projectMaxScore,
            hasAny,
            allApproved,
            hasSubmitted,
            hasAwaitingClassHead,
            hasDraft,
          };
        }),
      },
    };
  } catch (error: any) {
    console.error("❌ getStreamSubjectMarksDetail:", error);
    return { ok: false as const, message: error?.message ?? "Failed to load marks detail" };
  }
}

// ════════════════════════════════════════════════════════════════════════════
// APPROVE ALL SUBMITTED MARKS FOR A STREAM SUBJECT
// ════════════════════════════════════════════════════════════════════════════

export async function approveStreamSubjectMarks(data: {
  streamSubjectId: string;
  approverId:      string;
  schoolId:        string;
  slug:            string;
}) {
  try {
    const { streamSubjectId, approverId } = data;
    const now = new Date();
    // DOS may only approve marks that the class head has already signed off
    const dosApprovable = MarkStatus.CLASS_TEACHER_APPROVED;

    const [e, a, u] = await Promise.all([
      db.examMark.updateMany({
        where: { studentSubjectEnrollment: { streamSubjectId }, status: dosApprovable },
        data:  { status: MarkStatus.APPROVED, approvedById: approverId, approvedAt: now },
      }),
      db.aOIScore.updateMany({
        where: { studentSubjectEnrollment: { streamSubjectId }, status: dosApprovable },
        data:  { status: MarkStatus.APPROVED, approvedById: approverId, approvedAt: now },
      }),
      db.aOIUnit.updateMany({
        where: { studentSubjectEnrollment: { streamSubjectId }, status: dosApprovable },
        data:  { status: MarkStatus.APPROVED, approvedById: approverId, approvedAt: now },
      }),
    ]);

    const total = e.count + a.count + u.count;
    revalidatePath(`/school/${data.slug}/academics/approvals`);
    revalidatePath(`/school/${data.slug}/academics/streams`);
    return { ok: true as const, message: `Approved ${total} mark record(s)` };
  } catch (error: any) {
    console.error("❌ approveStreamSubjectMarks:", error);
    return { ok: false as const, message: error?.message ?? "Failed to approve marks" };
  }
}

// ════════════════════════════════════════════════════════════════════════════
// UNAPPROVE (REVOKE) ALL APPROVED MARKS FOR A STREAM SUBJECT
// Sets APPROVED → SUBMITTED so the teacher can correct and resubmit.
// ════════════════════════════════════════════════════════════════════════════

export async function unapproveStreamSubjectMarks(data: {
  streamSubjectId: string;
  slug:            string;
}) {
  try {
    const { streamSubjectId } = data;

    const [e, a, u] = await Promise.all([
      db.examMark.updateMany({
        where: { studentSubjectEnrollment: { streamSubjectId }, status: MarkStatus.APPROVED },
        data:  { status: MarkStatus.SUBMITTED, approvedById: null, approvedAt: null },
      }),
      db.aOIScore.updateMany({
        where: { studentSubjectEnrollment: { streamSubjectId }, status: MarkStatus.APPROVED },
        data:  { status: MarkStatus.SUBMITTED, approvedById: null, approvedAt: null },
      }),
      db.aOIUnit.updateMany({
        where: { studentSubjectEnrollment: { streamSubjectId }, status: MarkStatus.APPROVED },
        data:  { status: MarkStatus.SUBMITTED, approvedById: null, approvedAt: null },
      }),
    ]);

    const total = e.count + a.count + u.count;
    revalidatePath(`/school/${data.slug}/academics/approvals`);
    revalidatePath(`/school/${data.slug}/academics/streams`);
    return { ok: true as const, message: `Approval revoked — ${total} record(s) returned to submitted` };
  } catch (error: any) {
    console.error("❌ unapproveStreamSubjectMarks:", error);
    return { ok: false as const, message: error?.message ?? "Failed to revoke approval" };
  }
}

// ════════════════════════════════════════════════════════════════════════════
// APPROVE ALL MARKS FOR AN ENTIRE STREAM
// ════════════════════════════════════════════════════════════════════════════

export async function approveStreamMarks(data: {
  streamId:   string;
  termId:     string;
  approverId: string;
  schoolId:   string;
  slug:       string;
}) {
  try {
    const { streamId, termId, approverId } = data;
    const now = new Date();

    const ssIds = (await db.streamSubject.findMany({
      where:  { streamId, termId, isActive: true },
      select: { id: true },
    })).map(s => s.id);

    if (ssIds.length === 0) return { ok: true as const, message: "No subjects found" };

    // DOS may only approve marks that the class head has already signed off
    const dosApprovable2 = MarkStatus.CLASS_TEACHER_APPROVED;
    const [e, a, u] = await Promise.all([
      db.examMark.updateMany({
        where: { studentSubjectEnrollment: { streamSubjectId: { in: ssIds } }, status: dosApprovable2 },
        data:  { status: MarkStatus.APPROVED, approvedById: approverId, approvedAt: now },
      }),
      db.aOIScore.updateMany({
        where: { studentSubjectEnrollment: { streamSubjectId: { in: ssIds } }, status: dosApprovable2 },
        data:  { status: MarkStatus.APPROVED, approvedById: approverId, approvedAt: now },
      }),
      db.aOIUnit.updateMany({
        where: { studentSubjectEnrollment: { streamSubjectId: { in: ssIds } }, status: dosApprovable2 },
        data:  { status: MarkStatus.APPROVED, approvedById: approverId, approvedAt: now },
      }),
    ]);

    const total = e.count + a.count + u.count;
    revalidatePath(`/school/${data.slug}/academics/approvals`);
    revalidatePath(`/school/${data.slug}/academics/streams`);
    return { ok: true as const, message: `Approved ${total} record(s) across ${ssIds.length} subject(s)` };
  } catch (error: any) {
    console.error("❌ approveStreamMarks:", error);
    return { ok: false as const, message: error?.message ?? "Failed to approve stream marks" };
  }
}

// ════════════════════════════════════════════════════════════════════════════
// APPROVE AOI TOPIC MARKS (per-topic granular approval)
// Approves only AOIScore records for a specific AOI topic within a stream subject
// ════════════════════════════════════════════════════════════════════════════

export async function approveAoiTopicMarks(data: {
  aoiTopicId:      string;
  streamSubjectId: string;
  approverId:      string;
  slug:            string;
}) {
  try {
    const { aoiTopicId, streamSubjectId, approverId } = data;
    const now = new Date();

    const result = await db.aOIScore.updateMany({
      where: {
        aoiTopicId,
        studentSubjectEnrollment: { streamSubjectId },
        status: MarkStatus.CLASS_TEACHER_APPROVED, // class head must approve first
      },
      data: { status: MarkStatus.APPROVED, approvedById: approverId, approvedAt: now },
    });

    revalidatePath(`/school/${data.slug}/academics/approvals`);
    return { ok: true as const, message: `Approved ${result.count} score(s) for this topic` };
  } catch (error: any) {
    console.error("❌ approveAoiTopicMarks:", error);
    return { ok: false as const, message: error?.message ?? "Failed to approve topic marks" };
  }
}

export async function revokeAoiTopicMarks(data: {
  aoiTopicId:      string;
  streamSubjectId: string;
  slug:            string;
}) {
  try {
    const { aoiTopicId, streamSubjectId } = data;

    const result = await db.aOIScore.updateMany({
      where: {
        aoiTopicId,
        studentSubjectEnrollment: { streamSubjectId },
        status: MarkStatus.APPROVED,
      },
      data: { status: MarkStatus.SUBMITTED, approvedById: null, approvedAt: null },
    });

    revalidatePath(`/school/${data.slug}/academics/approvals`);
    return { ok: true as const, message: `Revoked ${result.count} approval(s) for this topic` };
  } catch (error: any) {
    console.error("❌ revokeAoiTopicMarks:", error);
    return { ok: false as const, message: error?.message ?? "Failed to revoke topic approval" };
  }
}

// ════════════════════════════════════════════════════════════════════════════
// APPROVE EXAM TYPE MARKS (per-exam granular approval: BOT / MTE / EOT)
// Approves only ExamMark records for a specific exam type within a stream subject
// ════════════════════════════════════════════════════════════════════════════

export async function approveExamTypeMarks(data: {
  examType:        string;   // "BOT" | "MTE" | "EOT"
  streamSubjectId: string;
  approverId:      string;
  slug:            string;
}) {
  try {
    const { examType, streamSubjectId, approverId } = data;
    const now = new Date();

    const result = await db.examMark.updateMany({
      where: {
        exam:                     { examType: examType as ExamType },
        studentSubjectEnrollment: { streamSubjectId },
        status:                   MarkStatus.CLASS_TEACHER_APPROVED, // class head must approve first
      },
      data: { status: MarkStatus.APPROVED, approvedById: approverId, approvedAt: now },
    });

    revalidatePath(`/school/${data.slug}/academics/approvals`);
    return { ok: true as const, message: `Approved ${result.count} ${examType} mark(s)` };
  } catch (error: any) {
    console.error("❌ approveExamTypeMarks:", error);
    return { ok: false as const, message: error?.message ?? "Failed to approve exam marks" };
  }
}

export async function revokeExamTypeMarks(data: {
  examType:        string;
  streamSubjectId: string;
  slug:            string;
}) {
  try {
    const { examType, streamSubjectId } = data;

    const result = await db.examMark.updateMany({
      where: {
        exam:                     { examType: examType as ExamType },
        studentSubjectEnrollment: { streamSubjectId },
        status:                   MarkStatus.APPROVED,
      },
      data: { status: MarkStatus.SUBMITTED, approvedById: null, approvedAt: null },
    });

    revalidatePath(`/school/${data.slug}/academics/approvals`);
    return { ok: true as const, message: `Revoked ${result.count} ${examType} approval(s)` };
  } catch (error: any) {
    console.error("❌ revokeExamTypeMarks:", error);
    return { ok: false as const, message: error?.message ?? "Failed to revoke exam approval" };
  }
}
