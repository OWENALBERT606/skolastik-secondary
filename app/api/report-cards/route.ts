// app/api/report-cards/route.ts
import { db }            from "@/prisma/db";
import { NextRequest, NextResponse } from "next/server";

// Simple average of the raw marks shown in MOT/EOT columns for a paper
function paperSimpleAvg(
  botRaw: string | null, mteRaw: string | null, eotRaw: string | null,
): number | null {
  const parse = (raw: string | null) => {
    if (!raw) return null;
    const [m, o] = raw.split("/").map(Number);
    return o ? (m / o) * 100 : null;
  };
  const motPct = parse(mteRaw) ?? parse(botRaw);
  const eotPct = parse(eotRaw);
  const vals = [motPct, eotPct].filter((v): v is number => v !== null);
  if (vals.length === 0) return null;
  return vals.reduce((a, b) => a + b, 0) / vals.length;
}

function paperGradeFromPct(pct: number | null, isALevelMajor: boolean): string | null {
  if (pct == null) return null;
  if (isALevelMajor) {
    if (pct >= 80) return "D1";
    if (pct >= 75) return "D2";
    if (pct >= 70) return "C3";
    if (pct >= 65) return "C4";
    if (pct >= 60) return "C5";
    if (pct >= 55) return "C6";
    if (pct >= 50) return "P7";
    if (pct >= 40) return "P8";
    return "F9";
  }
  // O-level or subsidiary
  if (pct >= 80) return "D1";
  if (pct >= 75) return "D2";
  if (pct >= 70) return "C3";
  if (pct >= 65) return "C4";
  if (pct >= 60) return "C5";
  if (pct >= 55) return "C6";
  if (pct >= 50) return "P7";
  if (pct >= 40) return "P8";
  return "F9";
}

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
                subject: {
                  select: {
                    name: true, code: true,
                    aLevelCategory: true, subjectLevel: true,
                  },
                },
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
          orderBy: [
            { streamSubject: { subject: { name: "asc" } } },
          ],
        },
      },
      orderBy: [{ student: { lastName: "asc" } }, { student: { firstName: "asc" } }],
    });

    // Fetch assessment config for this class+term to get exam weights
    const classYearId = enrollments[0]?.classYearId ?? null;
    const assessmentConfig = classYearId ? await db.classAssessmentConfig.findUnique({
      where: { classYearId_termId: { classYearId, termId } },
    }) : null;

    const aoiWeight      = (assessmentConfig as any)?.aoiWeight      ?? 20;
    const hasProject     = (assessmentConfig as any)?.hasProject     ?? false;
    const projectWeight  = (assessmentConfig as any)?.projectWeight  ?? 0;
    const projectMaxScore = (assessmentConfig as any)?.projectMaxScore ?? 10;
    const summativeWeight = 100 - aoiWeight - (hasProject ? projectWeight : 0);
    const botContrib = assessmentConfig?.hasBOT ? Math.round((assessmentConfig.botWeight / 100) * summativeWeight) : 0;
    const mteContrib = assessmentConfig?.hasMTE ? Math.round((assessmentConfig.mteWeight / 100) * summativeWeight) : 0;
    const eotContrib = assessmentConfig?.hasEOT ? Math.round((assessmentConfig.eotWeight / 100) * summativeWeight) : 0;

    const streamSize = enrollments.length;

    const cards = enrollments.map(enrollment => {
      const rc = enrollment.reportCard;
      const isALevel = enrollment.classYear.classLevel === "A_LEVEL";

      // subjectMap: keyed by subjectId, accumulates papers
      const subjectMap = new Map<string, any>();

      for (const se of enrollment.subjectEnrollments) {
        const subjectId      = se.streamSubject.subjectId;
        const subject        = se.streamSubject.subject;
        const teacher        = se.streamSubject.teacherAssignments[0]?.teacher;
        const teacherName    = teacher ? `${teacher.firstName} ${teacher.lastName}` : null;
        const sr             = (se as any).subjectResult ?? null;
        const isSubsidiary   = subject.aLevelCategory === "SUBSIDIARY";
        const isALevelMajor  = isALevel && !isSubsidiary;

        const botRaw = sr?.botMarks != null && sr?.botOutOf ? `${sr.botMarks}/${sr.botOutOf}` : null;
        const mteRaw = sr?.mteMarks != null && sr?.mteOutOf ? `${sr.mteMarks}/${sr.mteOutOf}` : null;
        const eotRaw = sr?.eotMarks != null && sr?.eotOutOf ? `${sr.eotMarks}/${sr.eotOutOf}` : null;

        const botPct = botRaw ? Math.round((sr.botMarks / sr.botOutOf) * 100) : null;
        const mtePct = mteRaw ? Math.round((sr.mteMarks / sr.mteOutOf) * 100) : null;
        const eotPct = eotRaw ? Math.round((sr.eotMarks / sr.eotOutOf) * 100) : null;

        const aoiContribution       = sr?.aoiContribution       ?? null;
        const aoiRawAverage         = sr?.aoiRawAverage         ?? null;
        const summativeContribution = sr?.summativeContribution ?? null;
        const projectScore          = sr?.projectScore          ?? null;
        const projectOutOf          = sr?.projectOutOf          ?? (hasProject ? projectMaxScore : null);
        const projectContribution   = sr?.projectContribution   ?? null;

        // Per-paper data for A-level display
        const paperAvgPct  = paperSimpleAvg(botRaw, mteRaw, eotRaw);
        const paperGrade   = paperGradeFromPct(paperAvgPct, isALevelMajor);
        const paperData    = {
          paperNumber:  se.streamSubject.subjectPaper?.paperNumber ?? 1,
          paperName:    se.streamSubject.subjectPaper?.name ?? null,
          botRaw, mteRaw, eotRaw,
          paperAvgPct:  paperAvgPct != null ? Math.round(paperAvgPct * 10) / 10 : null,
          paperGrade,
        };

        if (!subjectMap.has(subjectId)) {
          subjectMap.set(subjectId, {
            subjectName:      subject.name,
            subjectCode:      subject.code,
            aLevelCategory:   subject.aLevelCategory ?? null,
            isSubsidiary,
            totalPercentage:  se.subjectFinalMark?.totalPercentage ?? null,
            finalGrade:       se.subjectFinalMark?.finalGrade      ?? null,
            gradeDescriptor:  se.subjectFinalMark?.gradeDescriptor ?? null,
            gradeLetter:      se.subjectFinalMark?.finalGrade      ?? null,
            pointsAwarded:    (se.subjectFinalMark as any)?.pointsAwarded ?? null,
            teacherName,
            botPct, botRaw, mtePct, mteRaw, eotPct, eotRaw,
            aoiContribution, aoiRawAverage, summativeContribution,
            projectScore, projectOutOf, projectContribution,
            aoiScores: se.aoiScores.slice(0, 3).map(sc => sc.score ?? null),
            topics: se.aoiScores.map(sc => ({
              topicName: sc.aoiTopic.topicName,
              score:     sc.score,
              maxScore:  sc.aoiTopic.maxPoints ?? 3,
            })),
            papers: [paperData],
          });
        } else {
          // Additional paper for same subject
          subjectMap.get(subjectId).papers.push(paperData);
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
        subjects: Array.from(subjectMap.values()).map(s => ({
            ...s,
            papers: s.papers.sort((a: any, b: any) => (a.paperNumber ?? 99) - (b.paperNumber ?? 99)),
          })),
        examWeights: { bot: botContrib, mte: mteContrib, eot: eotContrib, aoi: aoiWeight, summative: summativeWeight, project: hasProject ? projectWeight : 0 },
      };
    });

    return NextResponse.json(cards);
  } catch (error: any) {
    console.error("❌ report-cards API:", error);
    return NextResponse.json({ error: error?.message ?? "Failed to load report cards" }, { status: 500 });
  }
}
