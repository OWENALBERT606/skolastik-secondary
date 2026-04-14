// actions/stream-subject-marks.ts
"use server";

import { db } from "@/prisma/db";

// ════════════════════════════════════════════════════════════════════════════
// GET ALL DATA NEEDED BY THE MARKS TAB IN ONE QUERY
//
// Returns for a given streamSubjectId:
//   - enrichedStudentEnrollments: existing enrollments + aoiScores, aoiUnits, examMarks
//   - aoiTopics:          topics scoped to this stream subject's classSubject
//   - aoiGradingScales:   grading scale for AOI (classSubject-scoped)
//   - exams:              BOT/MTE/EOT exams for the class year + term
//   - assessmentConfig:   weight percentages (BOT/MTE/EOT/AOI)
//   - subjectPaper:       the paper this streamSubject row represents (null if no papers)
// ════════════════════════════════════════════════════════════════════════════

export async function getStreamSubjectMarksData(streamSubjectId: string) {
  try {
    if (!streamSubjectId) {
      return { ok: false as const, message: "Stream subject ID is required" };
    }

    // 1. Load the core streamSubject + its classSubjectId + classYearId + termId
    const ss = await db.streamSubject.findUnique({
      where: { id: streamSubjectId },
      select: {
        id:             true,
        classSubjectId: true,
        subjectPaperId: true,
        termId:         true,
        subjectPaper:   { select: { id: true, name: true, paperCode: true, maxMarks: true, weight: true, aoiCount: true } },
        stream: {
          select: {
            id:         true,
            name:       true,
            classYearId: true,
            schoolId:   true,
          },
        },
      },
    });

    if (!ss) return { ok: false as const, message: "Stream subject not found" };

    const { classSubjectId, termId } = ss;
    const { classYearId, schoolId }  = ss.stream;

    // 2. Parallel fetch of all supporting data
    const [
      enrollmentsWithMarks,
      aoiTopics,
      aoiGradingScales,
      exams,
      assessmentConfig,
    ] = await Promise.all([

      // Student enrollments enriched with all mark types
      db.studentSubjectEnrollment.findMany({
        where: { streamSubjectId, status: "ACTIVE" },
        include: {
          enrollment: {
            select: {
              id: true,
              student: {
                select: {
                  id:          true,
                  firstName:   true,
                  lastName:    true,
                  admissionNo: true,
                  gender:      true,
                },
              },
            },
          },
          // AOI scores (per topic)
          aoiScores: {
            include: {
              aoiTopic: { select: { id: true, topicNumber: true, topicName: true } },
            },
          },
          // AOI units (U1–UN)
          aoiUnits: {
            orderBy: { unitNumber: "asc" },
            select:  { id: true, unitNumber: true, score: true, subjectPaperId: true },
          },
          // Exam marks (BOT/MTE/EOT)
          examMarks: {
            include: {
              exam: { select: { id: true, name: true, examType: true, maxMarks: true } },
            },
          },
          // Computed results
          subjectResult:    true,
          subjectFinalMark: true,
          paperResults:     {
            include: {
              subjectPaper: { select: { id: true, paperNumber: true, name: true, paperCode: true } },
            },
          },
        },
        orderBy: { enrollment: { student: { lastName: "asc" } } },
      }),

      // AOI topics for this class subject.
      // Do NOT filter by subjectPaperId — topics are created with only classSubjectId
      // set (subjectPaperId = null). Adding a paper filter would exclude them.
      // The subjectPaperId field on AOITopic is only used when different papers
      // within a subject deliberately have different topic sets (rare).
      db.aOITopic.findMany({
        where: { classSubjectId },
        orderBy: { topicNumber: "asc" },
        select: {
          id:          true,
          topicNumber: true,
          topicName:   true,
          maxPoints:   true,
          subjectPaperId: true,
        },
      }),

      // AOI grading scale — scoped to schoolId (not classSubjectId).
      // Schema: AOIGradingScale has @@unique([schoolId, identifier]) — no classSubjectId field.
      db.aOIGradingScale.findMany({
        where:   { schoolId },
        orderBy: { minScore: "asc" },
        select:  { id: true, identifier: true, minScore: true, maxScore: true, descriptor: true },
      }),

      // Exams for the class year + term (BOT, MTE, EOT)
      db.exam.findMany({
        where:   { classYearId, termId },
        orderBy: { examType: "asc" },
        select:  { id: true, name: true, examType: true, maxMarks: true, date: true },
      }),

      // ClassAssessmentConfig (weight percentages)
      // FIX [1]: @@unique([classYearId, termId]) is a compound key — must use
      // classYearId_termId compound name, not classYearId alone.
      // FIX [2]: practicalWeight does not exist on ClassAssessmentConfig — removed.
      db.classAssessmentConfig.findUnique({
        where:  { classYearId_termId: { classYearId, termId } },
        select: {
          id:          true,
          botWeight:   true,
          mteWeight:   true,
          eotWeight:   true,
          aoiWeight:   true,
          hasBOT:      true,
          hasMTE:      true,
          hasEOT:      true,
          maxAOICount: true,
          aoiMaxPoints: true,
        },
      }),
    ]);

    // 3. Compute per-student summary stats for the marks tab display
    //
    // totalMark is calculated LIVE from draft marks using the assessmentConfig
    // weights — so it shows immediately after entry without needing approval.
    // The approved SubjectResult.totalPercentage is used as the authoritative
    // value once marks are approved (it replaces the live calculation).
    const studentSummaries = enrollmentsWithMarks.map((se) => {
      const aoiTotal = se.aoiScores.reduce((s, sc) => s + sc.score, 0);

      const examMarksByType = se.examMarks.reduce(
        (acc, em) => {
          acc[em.exam.examType] = em.marksObtained;
          return acc;
        },
        {} as Record<string, number>
      );

      const bot = examMarksByType["BOT"] ?? null;
      const mte = examMarksByType["MTE"] ?? null;
      const eot = examMarksByType["EOT"] ?? null;

      // ── Live total calculation from draft marks ──────────────────────────
      // Only run if we have an assessmentConfig with weights defined.
      let liveTotal: number | null = null;

      if (assessmentConfig) {
        const cfg = assessmentConfig;

        // Summative contribution: weighted average of active exams, scaled to
        // (100 − aoiWeight). Active exams are those enabled in config AND
        // for which a mark has actually been entered.
        const activeExams: Array<{ mark: number; weight: number }> = [];
        if (cfg.hasBOT && bot !== null) activeExams.push({ mark: bot, weight: cfg.botWeight });
        if (cfg.hasMTE && mte !== null) activeExams.push({ mark: mte, weight: cfg.mteWeight });
        if (cfg.hasEOT && eot !== null) activeExams.push({ mark: eot, weight: cfg.eotWeight });

        const summativeWeight = 100 - cfg.aoiWeight;

        let summativeContribution = 0;
        if (activeExams.length > 0) {
          // Weight each exam within the summative pool, then scale to summativeWeight
          const totalActiveWeight = activeExams.reduce((s, e) => s + e.weight, 0);
          const weightedAvg = totalActiveWeight > 0
            ? activeExams.reduce((s, e) => s + (e.mark * e.weight), 0) / totalActiveWeight
            : 0;
          summativeContribution = (weightedAvg / 100) * summativeWeight;
        }

        // AOI contribution: average of topic contributions × aoiWeight
        // Divide by ACTUAL topic count (not maxAOICount from config) so students
        // are only judged on topics that have been created and assigned.
        // Formula = avg(score_i / aoiMaxPoints) × aoiWeight
        //         = (aoiTotal / (actualTopicCount × aoiMaxPoints)) × aoiWeight
        const aoiMaxPoints    = cfg.aoiMaxPoints ?? 3;
        const actualTopicCount = aoiTopics.length;
        const maxAOIPossible   = actualTopicCount * aoiMaxPoints;
        const aoiContribution  = maxAOIPossible > 0 && aoiTotal > 0
          ? (aoiTotal / maxAOIPossible) * cfg.aoiWeight
          : 0;

        // Only show a total if at least one component has been entered
        if (activeExams.length > 0 || aoiTotal > 0) {
          liveTotal = Math.min(100, summativeContribution + aoiContribution);
        }
      }

      // Use the approved SubjectResult if available, otherwise show live calc
      const totalMark = se.subjectResult?.totalPercentage ?? liveTotal;

      return {
        enrollmentId:  se.id,
        studentName:   `${se.enrollment.student.firstName} ${se.enrollment.student.lastName}`,
        admissionNo:   se.enrollment.student.admissionNo,
        gender:        se.enrollment.student.gender,
        aoiScoreCount: se.aoiScores.length,
        aoiTotal,
        bot,
        mte,
        eot,
        totalMark,
        hasResult:     !!se.subjectResult,
        isDraft:       !se.subjectResult && totalMark !== null,
      };
    });

    // 4. Overall progress stats
    const totalStudents    = enrollmentsWithMarks.length;
    const withResults      = enrollmentsWithMarks.filter((se) => se.subjectResult).length;
    const withExamMarks    = enrollmentsWithMarks.filter((se) => se.examMarks.length > 0).length;
    const withAOIScores    = enrollmentsWithMarks.filter((se) => se.aoiScores.length > 0).length;
    const withAOIUnits     = enrollmentsWithMarks.filter((se) => se.aoiUnits.length > 0).length;

    // Marks locked per exam type — an exam type is locked when all its marks are APPROVED (none SUBMITTED)
    const examTypes = [...new Set(enrollmentsWithMarks.flatMap(se => se.examMarks.map(m => (m as any).exam?.examType as string)).filter(Boolean))];
    const lockedExamTypes = new Set<string>(
      examTypes.filter(type =>
        enrollmentsWithMarks.some(se => se.examMarks.some(m => (m as any).exam?.examType === type)) &&
        !enrollmentsWithMarks.some(se => se.examMarks.some(m => (m as any).exam?.examType === type && m.status === "SUBMITTED"))
      )
    );

    // AOI locked when all aoi scores are approved (none submitted)
    const hasAnyAOI    = enrollmentsWithMarks.some(se => se.aoiScores.length > 0);
    const aoiSubmitted = enrollmentsWithMarks.some(se => se.aoiScores.some(m => m.status === "SUBMITTED"));
    const aoiLocked    = hasAnyAOI && !aoiSubmitted;

    // Overall marksLocked = all exam types locked AND aoi locked (or no marks at all)
    const hasAnyMarks  = enrollmentsWithMarks.some(
      (se) => se.examMarks.length > 0 || se.aoiScores.length > 0 || se.aoiUnits.length > 0
    );
    const marksLocked  = hasAnyMarks && lockedExamTypes.size === examTypes.length && (hasAnyAOI ? aoiLocked : true);

    return {
      ok:   true as const,
      data: {
        streamSubjectId,
        classSubjectId,
        termId,
        classYearId,
        schoolId,
        subjectPaper:          ss.subjectPaper,
        enrollments:           enrollmentsWithMarks,
        aoiTopics,
        aoiGradingScales,
        exams,
        assessmentConfig,
        studentSummaries,
        marksLocked,
        lockedExamTypes: [...lockedExamTypes],
        aoiLocked,
        stats: {
          totalStudents,
          withResults,
          withExamMarks,
          withAOIScores,
          withAOIUnits,
          completionPercent: totalStudents > 0
            ? Math.round((withResults / totalStudents) * 100)
            : 0,
        },
      },
    };
  } catch (error: any) {
    console.error("❌ getStreamSubjectMarksData:", error);
    return { ok: false as const, message: error?.message ?? "Failed to load marks data" };
  }
}