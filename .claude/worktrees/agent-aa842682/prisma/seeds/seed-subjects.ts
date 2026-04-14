// prisma/seeds/seed-subjects.ts
//
// Seeds Uganda-curriculum subjects for a given school.
// Covers both O-Level (S1–S4) and A-Level (S5–S6) subjects
// with their papers where applicable.
//
// Safe to run when subjects already exist — uses upsert logic.
//
// Usage:
//   npx ts-node prisma/seeds/seed-subjects.ts <schoolId>
//
// Options:
//   npx ts-node prisma/seeds/seed-subjects.ts <schoolId> --olevel   ← O-Level only
//   npx ts-node prisma/seeds/seed-subjects.ts <schoolId> --alevel   ← A-Level only
//   npx ts-node prisma/seeds/seed-subjects.ts <schoolId>            ← Both (default)

// FIX [1-3]: Import SubjectLevel and ALevelCategory enums so the correct
// values are stored. Without this every subject — including A-Level ones —
// would default to SubjectLevel.O_LEVEL (the Prisma schema default).
import { PrismaClient, SubjectLevel, ALevelCategory } from "@prisma/client";

const db = new PrismaClient();

// ════════════════════════════════════════════════════════════════════════════
// SUBJECT CATALOGUE
// ════════════════════════════════════════════════════════════════════════════

type PaperDef = {
  paperNumber: number;
  name:        string;
  paperCode?:  string;
  maxMarks:    number;
  weight:      number;
  aoiCount:    number;
};

type SubjectDef = {
  name:           string;
  code:           string;
  category:       string;
  // FIX [1]: subjectLevel maps to the SubjectLevel enum on the Subject model.
  // O_LEVEL  → taught only in O-Level classes
  // A_LEVEL  → taught only in A-Level classes
  // BOTH     → taught in both (e.g. Physics, Mathematics)
  subjectLevel:   SubjectLevel;
  // FIX [2]: aLevelCategory populates Subject.aLevelCategory.
  // null for pure O-Level subjects.
  // MAJOR      → principal A-Level subject (A–F grading, up to 6 pts)
  // SUBSIDIARY → compulsory support subject (D1–F9, flat 1pt if passed)
  aLevelCategory: ALevelCategory | null;
  description:    string;
  papers:         PaperDef[];
};

// ── O-LEVEL SUBJECTS (S1–S4) ─────────────────────────────────────────────

const O_LEVEL_SUBJECTS: SubjectDef[] = [
  // ── Languages ────────────────────────────────────────────────────────────
  {
    name:           "English Language",
    code:           "ENG",
    category:       "Languages",
    subjectLevel:   SubjectLevel.O_LEVEL,
    aLevelCategory: null,
    description:    "Develops communication skills in reading, writing, listening and speaking.",
    papers: [
      { paperNumber: 1, name: "Paper 1 – Comprehension & Summary", paperCode: "ENG/1", maxMarks: 100, weight: 1.0, aoiCount: 6 },
      { paperNumber: 2, name: "Paper 2 – Composition & Grammar",   paperCode: "ENG/2", maxMarks: 100, weight: 1.0, aoiCount: 6 },
    ],
  },
  {
    name:           "Literature in English",
    code:           "LIT",
    category:       "Languages",
    subjectLevel:   SubjectLevel.O_LEVEL,
    aLevelCategory: null,
    description:    "Study of prose, poetry and drama from African and world literature.",
    papers: [
      { paperNumber: 1, name: "Paper 1 – Prose & Poetry", paperCode: "LIT/1", maxMarks: 100, weight: 1.0, aoiCount: 6 },
      { paperNumber: 2, name: "Paper 2 – Drama & Orals",  paperCode: "LIT/2", maxMarks: 100, weight: 1.0, aoiCount: 6 },
    ],
  },

  // ── Sciences (BOTH — also taught at A-Level as MAJOR principal subjects) ─
  {
    name:           "Mathematics",
    code:           "MTH",
    category:       "Sciences",
    subjectLevel:   SubjectLevel.BOTH,
    aLevelCategory: ALevelCategory.MAJOR,
    description:    "Covers arithmetic, algebra, geometry, trigonometry and statistics.",
    papers: [
      { paperNumber: 1, name: "Paper 1 – Pure Mathematics",    paperCode: "MTH/1", maxMarks: 100, weight: 1.0, aoiCount: 6 },
      { paperNumber: 2, name: "Paper 2 – Applied Mathematics", paperCode: "MTH/2", maxMarks: 100, weight: 1.0, aoiCount: 6 },
    ],
  },
  {
    name:           "Physics",
    code:           "PHY",
    category:       "Sciences",
    subjectLevel:   SubjectLevel.BOTH,
    aLevelCategory: ALevelCategory.MAJOR,
    description:    "Study of matter, energy, motion, waves, electricity and modern physics.",
    papers: [
      { paperNumber: 1, name: "Paper 1 – Theory",    paperCode: "PHY/1", maxMarks: 100, weight: 1.0, aoiCount: 6 },
      { paperNumber: 2, name: "Paper 2 – Practical", paperCode: "PHY/2", maxMarks:  50, weight: 0.5, aoiCount: 3 },
    ],
  },
  {
    name:           "Chemistry",
    code:           "CHE",
    category:       "Sciences",
    subjectLevel:   SubjectLevel.BOTH,
    aLevelCategory: ALevelCategory.MAJOR,
    description:    "Study of matter, chemical reactions, organic and inorganic chemistry.",
    papers: [
      { paperNumber: 1, name: "Paper 1 – Theory",    paperCode: "CHE/1", maxMarks: 100, weight: 1.0, aoiCount: 6 },
      { paperNumber: 2, name: "Paper 2 – Practical", paperCode: "CHE/2", maxMarks:  50, weight: 0.5, aoiCount: 3 },
    ],
  },
  {
    name:           "Biology",
    code:           "BIO",
    category:       "Sciences",
    subjectLevel:   SubjectLevel.BOTH,
    aLevelCategory: ALevelCategory.MAJOR,
    description:    "Study of living organisms, ecology, genetics, and human biology.",
    papers: [
      { paperNumber: 1, name: "Paper 1 – Theory",    paperCode: "BIO/1", maxMarks: 100, weight: 1.0, aoiCount: 6 },
      { paperNumber: 2, name: "Paper 2 – Practical", paperCode: "BIO/2", maxMarks:  50, weight: 0.5, aoiCount: 3 },
    ],
  },

  // ── Humanities (BOTH — also available at A-Level as MAJOR) ───────────────
  {
    name:           "History",
    code:           "HIS",
    category:       "Humanities",
    subjectLevel:   SubjectLevel.BOTH,
    aLevelCategory: ALevelCategory.MAJOR,
    description:    "African and world history from pre-colonial times to the modern era.",
    papers: [
      { paperNumber: 1, name: "Paper 1 – African History", paperCode: "HIS/1", maxMarks: 100, weight: 1.0, aoiCount: 6 },
      { paperNumber: 2, name: "Paper 2 – World History",   paperCode: "HIS/2", maxMarks: 100, weight: 1.0, aoiCount: 6 },
    ],
  },
  {
    name:           "Geography",
    code:           "GEO",
    category:       "Humanities",
    subjectLevel:   SubjectLevel.BOTH,
    aLevelCategory: ALevelCategory.MAJOR,
    description:    "Physical and human geography with focus on East Africa and the world.",
    papers: [
      { paperNumber: 1, name: "Paper 1 – Physical Geography", paperCode: "GEO/1", maxMarks: 100, weight: 1.0, aoiCount: 6 },
      { paperNumber: 2, name: "Paper 2 – Human Geography",    paperCode: "GEO/2", maxMarks: 100, weight: 1.0, aoiCount: 6 },
    ],
  },
  {
    name:           "Christian Religious Education",
    code:           "CRE",
    category:       "Humanities",
    subjectLevel:   SubjectLevel.O_LEVEL,
    aLevelCategory: null,
    description:    "Biblical teachings, Christian ethics and the history of Christianity.",
    papers: [
      { paperNumber: 1, name: "Paper 1 – Old & New Testament", paperCode: "CRE/1", maxMarks: 100, weight: 1.0, aoiCount: 6 },
      { paperNumber: 2, name: "Paper 2 – Christian Living",    paperCode: "CRE/2", maxMarks: 100, weight: 1.0, aoiCount: 6 },
    ],
  },
  {
    name:           "Islamic Religious Education",
    code:           "IRE",
    category:       "Humanities",
    subjectLevel:   SubjectLevel.O_LEVEL,
    aLevelCategory: null,
    description:    "Islamic teachings, the Quran, Hadith and Islamic history.",
    papers: [
      { paperNumber: 1, name: "Paper 1 – Quran & Hadith",  paperCode: "IRE/1", maxMarks: 100, weight: 1.0, aoiCount: 6 },
      { paperNumber: 2, name: "Paper 2 – Islamic Studies", paperCode: "IRE/2", maxMarks: 100, weight: 1.0, aoiCount: 6 },
    ],
  },

  // ── Commerce & Business ──────────────────────────────────────────────────
  {
    name:           "Commerce",
    code:           "COM",
    category:       "Business",
    subjectLevel:   SubjectLevel.O_LEVEL,
    aLevelCategory: null,
    description:    "Trade, business documents, banking, insurance and transport.",
    papers: [
      { paperNumber: 1, name: "Paper 1 – Theory of Commerce", paperCode: "COM/1", maxMarks: 100, weight: 1.0, aoiCount: 6 },
    ],
  },
  {
    name:           "Entrepreneurship",
    code:           "ENT",
    category:       "Business",
    subjectLevel:   SubjectLevel.O_LEVEL,
    aLevelCategory: null,
    description:    "Business creation, management and entrepreneurial skills.",
    papers: [
      { paperNumber: 1, name: "Paper 1 – Entrepreneurship Theory", paperCode: "ENT/1", maxMarks: 100, weight: 1.0, aoiCount: 6 },
    ],
  },
  {
    name:           "Accounting",
    code:           "ACC",
    category:       "Business",
    subjectLevel:   SubjectLevel.BOTH,
    aLevelCategory: ALevelCategory.MAJOR,
    description:    "Bookkeeping, financial statements, and accounting principles.",
    papers: [
      { paperNumber: 1, name: "Paper 1 – Financial Accounting", paperCode: "ACC/1", maxMarks: 100, weight: 1.0, aoiCount: 6 },
      { paperNumber: 2, name: "Paper 2 – Cost Accounting",      paperCode: "ACC/2", maxMarks: 100, weight: 1.0, aoiCount: 6 },
    ],
  },

  // ── Technical & Vocational ───────────────────────────────────────────────
  {
    name:           "Agriculture",
    code:           "AGR",
    category:       "Technical",
    subjectLevel:   SubjectLevel.BOTH,
    aLevelCategory: ALevelCategory.MAJOR,
    description:    "Crop science, animal husbandry, soil science and farm management.",
    papers: [
      { paperNumber: 1, name: "Paper 1 – Theory",    paperCode: "AGR/1", maxMarks: 100, weight: 1.0, aoiCount: 6 },
      { paperNumber: 2, name: "Paper 2 – Practical", paperCode: "AGR/2", maxMarks:  50, weight: 0.5, aoiCount: 3 },
    ],
  },
  {
    name:           "Computer Studies",
    code:           "CST",
    category:       "Technical",
    subjectLevel:   SubjectLevel.O_LEVEL,
    aLevelCategory: null,
    description:    "ICT skills, computer applications and programming fundamentals.",
    papers: [
      { paperNumber: 1, name: "Paper 1 – Theory",    paperCode: "CST/1", maxMarks: 100, weight: 1.0, aoiCount: 6 },
      { paperNumber: 2, name: "Paper 2 – Practical", paperCode: "CST/2", maxMarks:  50, weight: 0.5, aoiCount: 3 },
    ],
  },
  {
    name:           "Fine Art",
    code:           "ART",
    category:       "Technical",
    subjectLevel:   SubjectLevel.O_LEVEL,
    aLevelCategory: null,
    description:    "Drawing, painting, design and art appreciation.",
    papers: [
      { paperNumber: 1, name: "Paper 1 – Theory & History of Art", paperCode: "ART/1", maxMarks: 100, weight: 1.0, aoiCount: 6 },
      { paperNumber: 2, name: "Paper 2 – Studio Practice",         paperCode: "ART/2", maxMarks: 100, weight: 1.0, aoiCount: 6 },
    ],
  },
  {
    name:           "Physical Education",
    code:           "PE",
    category:       "Technical",
    subjectLevel:   SubjectLevel.O_LEVEL,
    aLevelCategory: null,
    description:    "Sports, fitness, health education and physical activities.",
    papers: [
      { paperNumber: 1, name: "Paper 1 – Theory",    paperCode: "PE/1", maxMarks: 100, weight: 1.0, aoiCount: 6 },
      { paperNumber: 2, name: "Paper 2 – Practical", paperCode: "PE/2", maxMarks:  50, weight: 0.5, aoiCount: 3 },
    ],
  },

  // ── Social Studies ───────────────────────────────────────────────────────
  {
    name:           "Political Education",
    code:           "POL",
    category:       "Social Studies",
    subjectLevel:   SubjectLevel.O_LEVEL,
    aLevelCategory: null,
    description:    "Civics, governance, democracy and Uganda's political system.",
    papers: [
      { paperNumber: 1, name: "Paper 1 – Civics & Governance", paperCode: "POL/1", maxMarks: 100, weight: 1.0, aoiCount: 6 },
    ],
  },
];

// ── A-LEVEL SUBJECTS (S5–S6) ─────────────────────────────────────────────

const A_LEVEL_SUBJECTS: SubjectDef[] = [
  // ── Sciences ─────────────────────────────────────────────────────────────
  {
    name:           "Further Mathematics",
    code:           "FMT",
    category:       "Sciences",
    subjectLevel:   SubjectLevel.A_LEVEL,
    aLevelCategory: ALevelCategory.MAJOR,
    description:    "Advanced pure and applied mathematics for science students.",
    papers: [
      { paperNumber: 1, name: "Paper 1 – Pure Mathematics",    paperCode: "FMT/1", maxMarks: 100, weight: 1.0, aoiCount: 6 },
      { paperNumber: 2, name: "Paper 2 – Applied Mathematics", paperCode: "FMT/2", maxMarks: 100, weight: 1.0, aoiCount: 6 },
    ],
  },

  // ── Humanities ───────────────────────────────────────────────────────────
  {
    name:           "Economics",
    code:           "ECO",
    category:       "Humanities",
    subjectLevel:   SubjectLevel.A_LEVEL,
    aLevelCategory: ALevelCategory.MAJOR,
    description:    "Micro and macroeconomics with applications to Uganda and East Africa.",
    papers: [
      { paperNumber: 1, name: "Paper 1 – Microeconomics", paperCode: "ECO/1", maxMarks: 100, weight: 1.0, aoiCount: 6 },
      { paperNumber: 2, name: "Paper 2 – Macroeconomics", paperCode: "ECO/2", maxMarks: 100, weight: 1.0, aoiCount: 6 },
    ],
  },
  {
    name:           "General Paper",
    code:           "GP",
    category:       "Languages",
    subjectLevel:   SubjectLevel.A_LEVEL,
    // Subsidiary: compulsory for all A-Level students, graded D1-F9,
    // awards flat 1pt if passed (not F9), 0pts if F9
    aLevelCategory: ALevelCategory.SUBSIDIARY,
    description:    "Critical thinking, essay writing and current affairs.",
    papers: [
      { paperNumber: 1, name: "Paper 1 – General Paper", paperCode: "GP/1", maxMarks: 100, weight: 1.0, aoiCount: 6 },
    ],
  },
  {
    name:           "Divinity",
    code:           "DIV",
    category:       "Humanities",
    subjectLevel:   SubjectLevel.A_LEVEL,
    aLevelCategory: ALevelCategory.MAJOR,
    description:    "Advanced study of Christian theology and religious ethics.",
    papers: [
      { paperNumber: 1, name: "Paper 1 – Old Testament",    paperCode: "DIV/1", maxMarks: 100, weight: 1.0, aoiCount: 6 },
      { paperNumber: 2, name: "Paper 2 – New Testament",    paperCode: "DIV/2", maxMarks: 100, weight: 1.0, aoiCount: 6 },
      { paperNumber: 3, name: "Paper 3 – Christian Ethics", paperCode: "DIV/3", maxMarks: 100, weight: 1.0, aoiCount: 6 },
    ],
  },

  // ── Business ─────────────────────────────────────────────────────────────
  {
    name:           "Entrepreneurship & Business Skills",
    code:           "EBS",
    category:       "Business",
    subjectLevel:   SubjectLevel.A_LEVEL,
    aLevelCategory: ALevelCategory.MAJOR,
    description:    "Advanced business creation, management and entrepreneurial skills.",
    papers: [
      { paperNumber: 1, name: "Paper 1 – Theory",        paperCode: "EBS/1", maxMarks: 100, weight: 1.0, aoiCount: 6 },
      { paperNumber: 2, name: "Paper 2 – Business Plan", paperCode: "EBS/2", maxMarks: 100, weight: 1.0, aoiCount: 6 },
    ],
  },

  // ── Technical ────────────────────────────────────────────────────────────
  {
    name:           "ICT",
    code:           "ICT",
    category:       "Technical",
    subjectLevel:   SubjectLevel.A_LEVEL,
    aLevelCategory: ALevelCategory.MAJOR,
    description:    "Advanced information and communications technology.",
    papers: [
      { paperNumber: 1, name: "Paper 1 – Theory",    paperCode: "ICT/1", maxMarks: 100, weight: 1.0, aoiCount: 6 },
      { paperNumber: 2, name: "Paper 2 – Practical", paperCode: "ICT/2", maxMarks:  50, weight: 0.5, aoiCount: 3 },
    ],
  },
];

const ALL_SUBJECTS = [...O_LEVEL_SUBJECTS, ...A_LEVEL_SUBJECTS];

// ════════════════════════════════════════════════════════════════════════════
// MAIN SEED FUNCTION
// ════════════════════════════════════════════════════════════════════════════

export async function seedSubjects(
  schoolId: string,
  filter?: "O_LEVEL" | "A_LEVEL"
) {
  console.log(`\n🌱 Seeding subjects for school: ${schoolId}`);
  if (filter) console.log(`   Filter: ${filter} only`);

  const school = await db.school.findUnique({
    where:  { id: schoolId },
    select: { id: true, name: true },
  });
  if (!school) throw new Error(`School not found: ${schoolId}`);

  console.log(`🏫 School: ${school.name}`);

  const existingCount = await db.subject.count({ where: { schoolId } });
  console.log(`📚 Existing subjects: ${existingCount}\n`);

  const subjectsToSeed = ALL_SUBJECTS.filter((s) => {
    if (!filter) return true;
    return s.subjectLevel === filter || s.subjectLevel === SubjectLevel.BOTH;
  });

  let subjectsCreated = 0;
  let subjectsUpdated = 0;
  let papersCreated   = 0;
  let papersSkipped   = 0;

  for (const def of subjectsToSeed) {
    try {
      const existing = await db.subject.findUnique({
        where:  { schoolId_code: { schoolId, code: def.code } },
        select: { id: true, name: true },
      });

      let subjectId: string;

      if (existing) {
        await db.subject.update({
          where: { id: existing.id },
          data: {
            name:        def.name,
            description: def.description,
            category:    def.category,
            // FIX [3]: Also update subjectLevel and aLevelCategory on re-runs
            subjectLevel:   def.subjectLevel,
            aLevelCategory: def.aLevelCategory,
            isActive: true,
          },
        });
        subjectId = existing.id;
        subjectsUpdated++;
        process.stdout.write(`  ↻ Updated : ${def.name} (${def.code}) [${def.subjectLevel}]\n`);
      } else {
        const created = await db.subject.create({
          data: {
            name:        def.name,
            code:        def.code,
            description: def.description,
            category:    def.category,
            schoolId,
            // FIX [1,2]: Set subjectLevel and aLevelCategory on create
            subjectLevel:   def.subjectLevel,
            aLevelCategory: def.aLevelCategory,
            isActive: true,
          },
        });
        subjectId = created.id;
        subjectsCreated++;
        process.stdout.write(`  ✓ Created : ${def.name} (${def.code}) [${def.subjectLevel}]\n`);
      }

      for (const paper of def.papers) {
        const existingPaper = await db.subjectPaper.findUnique({
          where: { subjectId_paperNumber: { subjectId, paperNumber: paper.paperNumber } },
        });

        if (existingPaper) {
          papersSkipped++;
          continue;
        }

        await db.subjectPaper.create({
          data: {
            subjectId,
            paperNumber: paper.paperNumber,
            name:        paper.name,
            paperCode:   paper.paperCode ?? null,
            maxMarks:    paper.maxMarks,
            weight:      paper.weight,
            aoiCount:    paper.aoiCount,
            isActive:    true,
          },
        });
        papersCreated++;
        process.stdout.write(
          `      ✓ Paper ${paper.paperNumber}: ${paper.name}` +
          (paper.paperCode ? ` [${paper.paperCode}]` : "") +
          `\n`
        );
      }
    } catch (error: any) {
      console.error(`  ✗ Failed  : ${def.name} — ${error.message}`);
    }
  }

  const finalCount = await db.subject.count({ where: { schoolId } });

  console.log(`
✅ Done
   Subjects : ${subjectsCreated} created, ${subjectsUpdated} updated
   Papers   : ${papersCreated} created, ${papersSkipped} already existed
   Total subjects now: ${finalCount}
`);

  return { subjectsCreated, subjectsUpdated, papersCreated, papersSkipped };
}

// ════════════════════════════════════════════════════════════════════════════
// CLI RUNNER
// ════════════════════════════════════════════════════════════════════════════

async function main() {
  const args     = process.argv.slice(2);
  const schoolId = args.find((a) => !a.startsWith("--"));
  const oLevel   = args.includes("--olevel");
  const aLevel   = args.includes("--alevel");

  if (!schoolId) {
    console.error(`
❌ Usage:
   npx ts-node prisma/seeds/seed-subjects.ts <schoolId>            ← all subjects
   npx ts-node prisma/seeds/seed-subjects.ts <schoolId> --olevel   ← O-Level only
   npx ts-node prisma/seeds/seed-subjects.ts <schoolId> --alevel   ← A-Level only
`);
    process.exit(1);
  }

  const filter = oLevel ? "O_LEVEL" : aLevel ? "A_LEVEL" : undefined;

  try {
    await seedSubjects(schoolId, filter);
  } catch (error: any) {
    console.error("❌ Seed failed:", error.message);
    process.exit(1);
  } finally {
    await db.$disconnect();
  }
}

main();