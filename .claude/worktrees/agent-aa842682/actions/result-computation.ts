// actions/result-computation.ts
"use server";

import { db }            from "@/prisma/db";
import { revalidatePath } from "next/cache";

// ════════════════════════════════════════════════════════════════════════════
// GRADING HELPERS
// O-Level (UCE Lower Secondary):
//   A = D1/D2  (80-100%) — Exceptional
//   B = C3/C4  (70-79%)  — Outstanding
//   C = C5/C6  (60-69%)  — Satisfactory
//   D = P7/P8  (40-59%)  — Basic
//   E = F9     (0-39%)   — Elementary
// A-Level:   A(80-100,6pt) B(70-79,5pt) C(60-69,4pt) D(50-59,3pt)
//            E(45-49,2pt)  O(40-44,1pt) F(<40,0pt)
// ════════════════════════════════════════════════════════════════════════════

type GradeResult = { grade: string; descriptor: string; points: number; letter: string };

function getOLevelGrade(pct: number): GradeResult {
  // UCE Lower Secondary Curriculum grading
  if (pct >= 80) return { grade: "D1", letter: "A", descriptor: "Exceptional",   points: 1 };
  if (pct >= 75) return { grade: "D2", letter: "A", descriptor: "Exceptional",   points: 2 };
  if (pct >= 70) return { grade: "C3", letter: "B", descriptor: "Outstanding",   points: 3 };
  if (pct >= 65) return { grade: "C4", letter: "B", descriptor: "Outstanding",   points: 4 };
  if (pct >= 60) return { grade: "C5", letter: "C", descriptor: "Satisfactory",  points: 5 };
  if (pct >= 55) return { grade: "C6", letter: "C", descriptor: "Satisfactory",  points: 6 };
  if (pct >= 50) return { grade: "P7", letter: "D", descriptor: "Basic",         points: 7 };
  if (pct >= 40) return { grade: "P8", letter: "D", descriptor: "Basic",         points: 8 };
  return               { grade: "F9", letter: "E", descriptor: "Elementary",     points: 9 };
}

function getALevelMajorGrade(pct: number): GradeResult {
  if (pct >= 80) return { grade: "A", letter: "A", descriptor: "Excellent",     points: 6 };
  if (pct >= 70) return { grade: "B", letter: "B", descriptor: "Very Good",     points: 5 };
  if (pct >= 60) return { grade: "C", letter: "C", descriptor: "Good",          points: 4 };
  if (pct >= 50) return { grade: "D", letter: "D", descriptor: "Satisfactory",  points: 3 };
  if (pct >= 45) return { grade: "E", letter: "E", descriptor: "Pass",          points: 2 };
  if (pct >= 40) return { grade: "O", letter: "O", descriptor: "Ordinary",      points: 1 };
  return               { grade: "F", letter: "F", descriptor: "Fail",           points: 0 };
}

function getSubsidiaryGrade(pct: number): GradeResult {
  // Subsidiary uses O-Level scale but points awarded = 1 if not F9, 0 if F9
  const base = getOLevelGrade(pct);
  return { ...base, points: base.grade === "F9" ? 0 : 1 };
}

function getOLevelDivision(aggregatePoints: number, totalSubjects: number): string {
  // Uganda UNEB: best 8 subjects, must pass at least 6
  if (totalSubjects < 6)           return "U"; // ungraded
  if (aggregatePoints <= 6)        return "I";
  if (aggregatePoints <= 14)       return "II";
  if (aggregatePoints <= 20)       return "III";
  if (aggregatePoints <= 25)       return "IV";
  return                                  "U";
}

// ════════════════════════════════════════════════════════════════════════════
// COMPUTE RESULTS FOR ONE STREAM SUBJECT
// Called after marks are approved. Writes SubjectResult for each enrolled
// student based on the assessmentConfig weights.
// ════════════════════════════════════════════════════════════════════════════

export async function computeStreamSubjectResults(data: {
  streamSubjectId: string;
  slug:            string;
}) {
  try {
    const { streamSubjectId } = data;

    // Load stream subject with all needed data
    const ss = await db.streamSubject.findUnique({
      where: { id: streamSubjectId },
      include: {
        stream:      { select: { classYearId: true } },
        classSubject: {
          include: {
            subject: { select: { id: true, subjectLevel: true, aLevelCategory: true } },
          },
        },
        studentEnrollments: {
          where: { status: "ACTIVE" },
          include: {
            examMarks: {
              where:   { status: "APPROVED" },
              include: { exam: { select: { examType: true, maxMarks: true } } },
            },
            aoiScores: {
              where: { status: "APPROVED" },
              include: { aoiTopic: { select: { topicNumber: true, maxPoints: true } } },
            },
            aoiUnits: {
              where:   { status: "APPROVED" },
              orderBy: { unitNumber: "asc" },
            },
          },
        },
      },
    });

    if (!ss) return { ok: false as const, message: "Stream subject not found" };

    const { classYearId } = ss.stream;
    const termId          = ss.termId;

    const cfg = await db.classAssessmentConfig.findUnique({
      where: { classYearId_termId: { classYearId, termId } },
    });
    if (!cfg) return { ok: false as const, message: "Assessment config not found for this class/term" };

    const subject       = ss.classSubject.subject;
    const isALevel      = subject.subjectLevel === "A_LEVEL" || subject.subjectLevel === "BOTH";
    const isSubsidiary  = subject.aLevelCategory === "SUBSIDIARY";
    const isMajor       = subject.aLevelCategory === "MAJOR";

    const getGrade = (pct: number): GradeResult => {
      if (isALevel && isMajor)    return getALevelMajorGrade(pct);
      if (isALevel && isSubsidiary) return getSubsidiaryGrade(pct);
      return getOLevelGrade(pct);
    };

    let computed = 0;

    for (const se of ss.studentEnrollments) {
      // ── AOI contribution ─────────────────────────────────────────────────
      // Each topic score is stored as 0–aoiMaxPoints (converted from raw 0–100).
      // The class always has cfg.maxAOICount topics; missing ones count as 0.
      // Formula: average(points over all configured topics) / aoiMaxPoints × aoiWeight
      // e.g. 6 topics configured, student scores sum = 12 pts
      //      → avg = 12/6 = 2.0 → 2.0/3 × 20 = 13.33
      const aoiTopicScores  = se.aoiScores;
      const aoiTotal        = aoiTopicScores.reduce((s, sc) => s + sc.score, 0);
      const aoiMaxPoints    = cfg.aoiMaxPoints ?? 3;
      const aoiConfigCount  = cfg.maxAOICount;                    // always 6 (or configured value)
      const aoiRawAverage   = aoiConfigCount > 0 ? aoiTotal / aoiConfigCount : 0;  // missing topics = 0
      const aoiContribution = aoiConfigCount > 0 && cfg.hasAOI
        ? (aoiRawAverage / aoiMaxPoints) * cfg.aoiWeight
        : 0;

      // ── AOI unit scores (u1–u6 for reference) ───────────────────────────
      const unitMap: Record<number, number> = {};
      se.aoiUnits.forEach(u => { if (u.score !== null) unitMap[u.unitNumber] = u.score; });

      // ── Summative contribution ───────────────────────────────────────────
      const examMap: Record<string, { marks: number; outOf: number }> = {};
      se.examMarks.forEach(em => {
        examMap[em.exam.examType] = { marks: em.marksObtained, outOf: em.outOf };
      });

      const bot = examMap["BOT"];
      const mte = examMap["MTE"];
      const eot = examMap["EOT"];

      const activeExams: Array<{ pct: number; weight: number }> = [];
      if (cfg.hasBOT && bot) activeExams.push({ pct: (bot.marks / bot.outOf) * 100, weight: cfg.botWeight });
      if (cfg.hasMTE && mte) activeExams.push({ pct: (mte.marks / mte.outOf) * 100, weight: cfg.mteWeight });
      if (cfg.hasEOT && eot) activeExams.push({ pct: (eot.marks / eot.outOf) * 100, weight: cfg.eotWeight });

      const summativeWeight = 100 - cfg.aoiWeight;
      let summativeContribution = 0;

      if (activeExams.length > 0) {
        const totalWeight  = activeExams.reduce((s, e) => s + e.weight, 0);
        const weightedAvg  = totalWeight > 0
          ? activeExams.reduce((s, e) => s + (e.pct * e.weight), 0) / totalWeight
          : 0;
        summativeContribution = (weightedAvg / 100) * summativeWeight;
      }

      const totalPercentage = Math.min(100, aoiContribution + summativeContribution);
      const gradeResult     = getGrade(totalPercentage);

      // ── Upsert SubjectResult ─────────────────────────────────────────────
      await db.subjectResult.upsert({
        where:  { studentSubjectEnrollmentId: se.id },
        update: {
          u1Score: unitMap[1] ?? null,
          u2Score: unitMap[2] ?? null,
          u3Score: unitMap[3] ?? null,
          u4Score: unitMap[4] ?? null,
          u5Score: unitMap[5] ?? null,
          u6Score: unitMap[6] ?? null,
          aoiRawAverage,
          aoiContribution,
          botMarks: bot?.marks ?? null,
          botOutOf: bot?.outOf ?? null,
          mteMarks: mte?.marks ?? null,
          mteOutOf: mte?.outOf ?? null,
          eotMarks: eot?.marks ?? null,
          eotOutOf: eot?.outOf ?? null,
          summativeContribution,
          totalPercentage,
          finalGrade:      gradeResult.grade,
          gradeDescriptor: gradeResult.descriptor,
          computedAt:      new Date(),
        },
        create: {
          studentSubjectEnrollmentId: se.id,
          u1Score: unitMap[1] ?? null,
          u2Score: unitMap[2] ?? null,
          u3Score: unitMap[3] ?? null,
          u4Score: unitMap[4] ?? null,
          u5Score: unitMap[5] ?? null,
          u6Score: unitMap[6] ?? null,
          aoiRawAverage,
          aoiContribution,
          botMarks: bot?.marks ?? null,
          botOutOf: bot?.outOf ?? null,
          mteMarks: mte?.marks ?? null,
          mteOutOf: mte?.outOf ?? null,
          eotMarks: eot?.marks ?? null,
          eotOutOf: eot?.outOf ?? null,
          summativeContribution,
          totalPercentage,
          finalGrade:      gradeResult.grade,
          gradeDescriptor: gradeResult.descriptor,
          computedAt:      new Date(),
        },
      });

      // ── Upsert SubjectFinalMark ──────────────────────────────────────────
      await db.subjectFinalMark.upsert({
        where:  { studentSubjectEnrollmentId: se.id },
        update: {
          totalPercentage,
          finalGrade:      gradeResult.grade,
          gradeDescriptor: gradeResult.descriptor,
          gradePoints:     gradeResult.points,
          pointsAwarded:   gradeResult.points,
          isSubsidiary,
          computedAt:      new Date(),
        },
        create: {
          studentSubjectEnrollmentId: se.id,
          totalPercentage,
          finalGrade:      gradeResult.grade,
          gradeDescriptor: gradeResult.descriptor,
          gradePoints:     gradeResult.points,
          pointsAwarded:   gradeResult.points,
          isSubsidiary,
          computedAt:      new Date(),
        },
      });

      computed++;
    }

    revalidatePath(`/school/${data.slug}/academics`);
    return {
      ok:      true as const,
      message: `Computed results for ${computed} student(s)`,
      count:   computed,
    };
  } catch (error: any) {
    console.error("❌ computeStreamSubjectResults:", error);
    return { ok: false as const, message: error?.message ?? "Failed to compute results" };
  }
}

// ════════════════════════════════════════════════════════════════════════════
// COMPUTE RESULTS FOR AN ENTIRE STREAM (all subjects in a term)
// ════════════════════════════════════════════════════════════════════════════

export async function computeStreamResults(data: {
  streamId: string;
  termId:   string;
  slug:     string;
}) {
  try {
    const streamSubjects = await db.streamSubject.findMany({
      where:  { streamId: data.streamId, termId: data.termId, isActive: true },
      select: { id: true },
    });

    let total = 0;
    for (const ss of streamSubjects) {
      const r = await computeStreamSubjectResults({ streamSubjectId: ss.id, slug: data.slug });
      if (r.ok) total += (r as any).count ?? 0;
    }

    revalidatePath(`/school/${data.slug}/academics`);
    return { ok: true as const, message: `Results computed for ${streamSubjects.length} subject(s), ${total} student record(s)` };
  } catch (error: any) {
    console.error("❌ computeStreamResults:", error);
    return { ok: false as const, message: error?.message ?? "Failed to compute stream results" };
  }
}

// ════════════════════════════════════════════════════════════════════════════
// GENERATE REPORT CARD FOR ONE ENROLLMENT
// Aggregates all SubjectFinalMarks into the ReportCard model.
// ════════════════════════════════════════════════════════════════════════════

export async function generateReportCard(data: {
  enrollmentId: string;
  slug:         string;
}) {
  try {
    const { enrollmentId } = data;

    const enrollment = await db.enrollment.findUnique({
      where:   { id: enrollmentId },
      include: {
        classYear: { select: { classLevel: true } },
        subjectEnrollments: {
          where:   { status: "ACTIVE" },
          include: { subjectFinalMark: true },
        },
      },
    });
    if (!enrollment) return { ok: false as const, message: "Enrollment not found" };

    const classLevel = enrollment.classYear.classLevel; // O_LEVEL | A_LEVEL
    const finalMarks = enrollment.subjectEnrollments
      .map(se => se.subjectFinalMark)
      .filter(Boolean) as NonNullable<typeof enrollment.subjectEnrollments[0]["subjectFinalMark"]>[];

    if (finalMarks.length === 0) {
      return { ok: false as const, message: "No computed results found. Run result computation first." };
    }

    const totalSubjects = finalMarks.length;
    const totalMarks    = finalMarks.reduce((s, m) => s + (m.totalPercentage ?? 0), 0);
    const averageMarks  = totalSubjects > 0 ? totalMarks / totalSubjects : 0;

    // ── O-Level aggregates ────────────────────────────────────────────────
    let aggregatePoints: number | null = null;
    let division: string | null        = null;

    if (classLevel === "O_LEVEL") {
      // Best 8 subjects by grade points (lower = better)
      const sorted = [...finalMarks].sort((a, b) => (a.gradePoints ?? 9) - (b.gradePoints ?? 9));
      const best8  = sorted.slice(0, 8);
      aggregatePoints = best8.reduce((s, m) => s + (m.gradePoints ?? 9), 0);
      division        = getOLevelDivision(aggregatePoints, finalMarks.length);
    }

    // ── A-Level aggregates ────────────────────────────────────────────────
    let totalPoints: number | null      = null;
    let principalPasses: number | null  = null;
    let subsidiaryPasses: number | null = null;

    if (classLevel === "A_LEVEL") {
      totalPoints      = finalMarks.reduce((s, m) => s + (m.pointsAwarded ?? 0), 0);
      principalPasses  = finalMarks.filter(m => !m.isSubsidiary && (m.gradePoints ?? 0) >= 3).length;
      subsidiaryPasses = finalMarks.filter(m =>  m.isSubsidiary && m.finalGrade !== "F9").length;
    }

    await db.reportCard.upsert({
      where:  { enrollmentId },
      update: {
        classLevel,
        totalSubjects,
        totalMarks,
        averageMarks,
        outOf:           100,
        aggregatePoints,
        division,
        totalPoints,
        principalPasses,
        subsidiaryPasses,
        generatedAt: new Date(),
      },
      create: {
        enrollmentId,
        classLevel,
        totalSubjects,
        totalMarks,
        averageMarks,
        outOf:           100,
        aggregatePoints,
        division,
        totalPoints,
        principalPasses,
        subsidiaryPasses,
        generatedAt: new Date(),
      },
    });

    revalidatePath(`/school/${data.slug}/academics`);
    return {
      ok:      true as const,
      message: `Report card generated — ${classLevel === "O_LEVEL" ? `Agg: ${aggregatePoints}, Div ${division}` : `${totalPoints} pts`}`,
    };
  } catch (error: any) {
    console.error("❌ generateReportCard:", error);
    return { ok: false as const, message: error?.message ?? "Failed to generate report card" };
  }
}

// ════════════════════════════════════════════════════════════════════════════
// GENERATE REPORT CARDS FOR AN ENTIRE STREAM
// ════════════════════════════════════════════════════════════════════════════

export async function generateStreamReportCards(data: {
  streamId: string;
  termId:   string;
  slug:     string;
}) {
  try {
    const enrollments = await db.enrollment.findMany({
      where:  { streamId: data.streamId, termId: data.termId, status: "ACTIVE" },
      select: { id: true },
    });

    let success = 0;
    let failed  = 0;
    for (const e of enrollments) {
      const r = await generateReportCard({ enrollmentId: e.id, slug: data.slug });
      if (r.ok) success++;
      else      failed++;
    }

    revalidatePath(`/school/${data.slug}/academics`);
    return {
      ok:      true as const,
      message: `Generated ${success} report card(s)${failed > 0 ? `, ${failed} failed` : ""}`,
    };
  } catch (error: any) {
    console.error("❌ generateStreamReportCards:", error);
    return { ok: false as const, message: error?.message ?? "Failed to generate report cards" };
  }
}