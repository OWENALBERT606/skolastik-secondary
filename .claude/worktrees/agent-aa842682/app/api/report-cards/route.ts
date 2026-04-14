// app/api/report-cards/route.ts
import { db }            from "@/prisma/db";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const streamId = searchParams.get("streamId");
  const termId   = searchParams.get("termId");

  if (!streamId || !termId) {
    return NextResponse.json({ error: "streamId and termId required" }, { status: 400 });
  }

  const studentId = searchParams.get("studentId");

  try {
    const enrollments = await db.enrollment.findMany({
      where:   { streamId, termId, status: { in: ["ACTIVE", "COMPLETED"] }, ...(studentId ? { studentId } : {}) },
      include: {
        student:   { select: { firstName: true, lastName: true, admissionNo: true, gender: true, dob: true, imageUrl: true } },
        classYear: { include: { classTemplate: { select: { name: true } } } },
        stream:    { select: { name: true } },
        reportCard: true,
        subjectEnrollments: {
          where:   { status: { in: ["ACTIVE", "COMPLETED"] } },
          include: {
            streamSubject: {
              include: {
                subject:      { select: { name: true, code: true } },
                subjectPaper: { select: { paperNumber: true, name: true } },
                teacherAssignments: {
                  where:   { status: "ACTIVE" },
                  include: { teacher: { select: { firstName: true, lastName: true } } },
                  take:    1,
                },
              },
            },
            subjectFinalMark: true,
            subjectResult:    true,
            aoiScores: {
              include: { aoiTopic: { select: { topicName: true, maxPoints: true } } },
              orderBy: { aoiTopic: { topicNumber: "asc" } },
            },
          },
          orderBy: { streamSubject: { subject: { name: "asc" } } },
        },
      },
      orderBy: [{ student: { lastName: "asc" } }, { student: { firstName: "asc" } }],
    });

    // Fetch assessment config for this class+term to get exam weights
    const classYearId = enrollments[0]?.classYearId ?? null;
    const assessmentConfig = classYearId ? await db.classAssessmentConfig.findUnique({
      where: { classYearId_termId: { classYearId, termId } },
      select: { aoiWeight: true, botWeight: true, mteWeight: true, eotWeight: true, hasBOT: true, hasMTE: true, hasEOT: true },
    }) : null;

    const aoiWeight = assessmentConfig?.aoiWeight ?? 20;
    const summativeWeight = 100 - aoiWeight;
    // Each exam's actual % contribution = (examWeightInPool / 100) * summativeWeight
    const botContrib = assessmentConfig?.hasBOT ? Math.round((assessmentConfig.botWeight / 100) * summativeWeight) : 0;
    const mteContrib = assessmentConfig?.hasMTE ? Math.round((assessmentConfig.mteWeight / 100) * summativeWeight) : 0;
    const eotContrib = assessmentConfig?.hasEOT ? Math.round((assessmentConfig.eotWeight / 100) * summativeWeight) : 0;

    const streamSize = enrollments.length;

    const cards = enrollments.map(enrollment => {
      const rc = enrollment.reportCard;

      const subjectMap = new Map<string, any>();

      for (const se of enrollment.subjectEnrollments) {
        const subjectId   = se.streamSubject.subjectId;
        const existing    = subjectMap.get(subjectId);
        const teacher     = se.streamSubject.teacherAssignments[0]?.teacher;
        const teacherName = teacher ? `${teacher.firstName} ${teacher.lastName}` : null;
        const sr          = (se as any).subjectResult ?? null;

        const botPct = sr?.botMarks != null && sr?.botOutOf ? Math.round((sr.botMarks / sr.botOutOf) * 100) : null;
        const mtePct = sr?.mteMarks != null && sr?.mteOutOf ? Math.round((sr.mteMarks / sr.mteOutOf) * 100) : null;
        const eotPct = sr?.eotMarks != null && sr?.eotOutOf ? Math.round((sr.eotMarks / sr.eotOutOf) * 100) : null;

        const botRaw = sr?.botMarks != null && sr?.botOutOf ? `${sr.botMarks}/${sr.botOutOf}` : null;
        const mteRaw = sr?.mteMarks != null && sr?.mteOutOf ? `${sr.mteMarks}/${sr.mteOutOf}` : null;
        const eotRaw = sr?.eotMarks != null && sr?.eotOutOf ? `${sr.eotMarks}/${sr.eotOutOf}` : null;

        const aoiContribution       = sr?.aoiContribution       ?? null;
        const aoiRawAverage         = sr?.aoiRawAverage         ?? null;
        const summativeContribution = sr?.summativeContribution ?? null;

        if (!existing) {
          subjectMap.set(subjectId, {
            subjectName:      se.streamSubject.subject.name,
            subjectCode:      se.streamSubject.subject.code,
            totalPercentage:  se.subjectFinalMark?.totalPercentage ?? null,
            finalGrade:       se.subjectFinalMark?.finalGrade      ?? null,
            gradeDescriptor:  se.subjectFinalMark?.gradeDescriptor ?? null,
            gradeLetter:      se.subjectFinalMark?.finalGrade      ?? null,
            teacherName,
            botPct, botRaw, mtePct, mteRaw, eotPct, eotRaw,
            aoiContribution, aoiRawAverage, summativeContribution,
            aoiScores: se.aoiScores.slice(0, 3).map(sc => sc.score ?? null),
            topics: se.aoiScores.map(sc => ({
              topicName: sc.aoiTopic.topicName,
              score:     sc.score,
              maxScore:  sc.aoiTopic.maxPoints ?? 3,
            })),
          });
        }
      }

      return {
        enrollmentId:     enrollment.id,
        studentName:      `${enrollment.student.firstName} ${enrollment.student.lastName}`,
        admissionNo:      enrollment.student.admissionNo,
        gender:           enrollment.student.gender,
        dob:              enrollment.student.dob?.toISOString().split("T")[0] ?? "",
        imageUrl:         enrollment.student.imageUrl ?? null,
        className:        enrollment.classYear.classTemplate.name,
        streamName:       enrollment.stream?.name ?? "",
        classLevel:       enrollment.classYear.classLevel,
        averageMark:      rc?.averageMarks      ?? null,
        classPosition:    rc?.classPosition     ?? null,
        streamPosition:   rc?.streamPosition    ?? null,
        outOf:            streamSize,
        aggregatePoints:  rc?.aggregatePoints   ?? null,
        division:         rc?.division          ?? null,
        totalPoints:      rc?.totalPoints       ?? null,
        principalPasses:  rc?.principalPasses   ?? null,
        subsidiaryPasses: rc?.subsidiaryPasses  ?? null,
        classTeacherComment: rc?.classTeacherComment ?? null,
        headTeacherComment:  rc?.headTeacherComment  ?? null,
        isPublished:      rc?.isPublished ?? false,
        subjects:         Array.from(subjectMap.values()),
        // Exam weight contributions (% of final mark)
        examWeights: { bot: botContrib, mte: mteContrib, eot: eotContrib, aoi: aoiWeight, summative: summativeWeight },
      };
    });

    return NextResponse.json(cards);
  } catch (error: any) {
    console.error("❌ report-cards API:", error);
    return NextResponse.json({ error: error?.message ?? "Failed to load report cards" }, { status: 500 });
  }
}
