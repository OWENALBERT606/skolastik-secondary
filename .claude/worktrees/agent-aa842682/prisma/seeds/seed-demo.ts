// prisma/seeds/seed-demo.ts
//
// Full demo seed — runs every step in dependency order:
//
//   1.  Role         — "School Admin" Role record
//   2.  Users        — school admin User accounts (one per school)
//   3.  Schools      — School records linked to their admin users
//   4.  Academic yr  — one active AcademicYear per school
//   5.  Terms        — Term 1, 2, 3 per academic year
//   6.  Class templates — S1–S6 (O-Level + A-Level) per school
//   7.  Class years  — ClassYear instances for active year
//   8.  Streams      — 2 streams per class (North, South)
//   9.  Parents      — 10 parents per school with User accounts
//  10.  Students     — 4 per stream, linked to parents + enrolled
//                      into the active term and auto-enrolled in
//                      all compulsory stream subjects
//
// Safe to call multiple times — uses upsert/findFirst guards.
//
// Usage:
//   npx ts-node prisma/seeds/seed-demo.ts

import { PrismaClient } from "@prisma/client";
import {
  UserType,
  SchoolDivision,
  ClassLevel,
  EnrollmentStatus,
  EnrollmentType,
  SubjectEnrollmentStatus,
} from "@prisma/client";
import bcrypt from "bcryptjs";

const db = new PrismaClient();

// ════════════════════════════════════════════════════════════════════════════
// HELPERS
// ════════════════════════════════════════════════════════════════════════════

function slug(name: string): string {
  return name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
}

function randomFrom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomDate(startYear: number, endYear: number): Date {
  const s = new Date(startYear, 0, 1).getTime();
  const e = new Date(endYear, 11, 31).getTime();
  return new Date(s + Math.random() * (e - s));
}

// Phone guaranteed unique across the run (simple counter approach)
let phoneSeq = 700_000_000;
function nextPhone(): string {
  phoneSeq++;
  return `0${phoneSeq}`;
}

// Admission number: ADM{YEAR}{SEQ:04}
let admSeq = 0;
function nextAdmNo(): string {
  admSeq++;
  return `ADM${new Date().getFullYear()}${String(admSeq).padStart(4, "0")}`;
}

// ════════════════════════════════════════════════════════════════════════════
// STATIC DATA
// ════════════════════════════════════════════════════════════════════════════

const SCHOOL_ADMIN_PERMISSIONS = [
  "dashboard.read", "dashboard.update",
  "users.create",   "users.read",   "users.update",   "users.delete",
  "students.create","students.read","students.update","students.delete",
  "teachers.create","teachers.read","teachers.update","teachers.delete",
  "staff.create",   "staff.read",   "staff.update",   "staff.delete",
  "parents.create", "parents.read", "parents.update", "parents.delete",
  "reports.create", "reports.read", "reports.update", "reports.delete",
  "settings.create","settings.read","settings.update","settings.delete",
  "fees.create",    "fees.read",    "fees.update",    "fees.delete",
  "payroll.create", "payroll.read", "payroll.update", "payroll.delete",
];

// ── Two demo schools ────────────────────────────────────────────────────────
const SCHOOLS = [
  {
    name:     "St. Mary's College Kisubi",
    motto:    "Ora et Labora",
    code:     "SMCK",
    address:  "Kisubi, Wakiso District",
    contact:  "0414-200100",
    email:    "info@smck.ac.ug",
    division: SchoolDivision.BOTH,
    admin: {
      firstName: "Bernard",
      lastName:  "Kiggundu",
      email:     "admin@smck.ac.ug",
    },
  },
  {
    name:     "Gayaza High School",
    motto:    "Light and Truth",
    code:     "GHS",
    address:  "Gayaza, Wakiso District",
    contact:  "0414-273453",
    email:    "info@gayaza.ac.ug",
    division: SchoolDivision.BOTH,
    admin: {
      firstName: "Agnes",
      lastName:  "Namugga",
      email:     "admin@gayaza.ac.ug",
    },
  },
];

// ── Class definitions ───────────────────────────────────────────────────────
// level = ordering integer (used for sorting in UI)
const CLASS_TEMPLATES = [
  { name: "Senior 1", code: "S1", level: 1, classLevel: ClassLevel.O_LEVEL, description: "First year secondary" },
  { name: "Senior 2", code: "S2", level: 2, classLevel: ClassLevel.O_LEVEL, description: "Second year secondary" },
  { name: "Senior 3", code: "S3", level: 3, classLevel: ClassLevel.O_LEVEL, description: "Third year secondary" },
  { name: "Senior 4", code: "S4", level: 4, classLevel: ClassLevel.O_LEVEL, description: "Fourth year — UCE candidates" },
  { name: "Senior 5", code: "S5", level: 5, classLevel: ClassLevel.A_LEVEL, description: "Fifth year — first A-Level" },
  { name: "Senior 6", code: "S6", level: 6, classLevel: ClassLevel.A_LEVEL, description: "Sixth year — UACE candidates" },
];

// Two streams per class
const STREAM_NAMES = ["North", "South"];

// ── Ugandan names ───────────────────────────────────────────────────────────
const MALE_FIRST   = ["Ssekandi","Mugisha","Okello","Tumwesigye","Kizza","Musoke","Waiswa","Ochieng","Tendo","Kato","Waswa","Mulindwa","Ssali","Lubega","Kabugo"];
const FEMALE_FIRST = ["Nakato","Namukasa","Nalwoga","Akello","Auma","Nansubuga","Nabirye","Namusoke","Atuhaire","Nankya","Nassazi","Birungi","Nabbosa","Nabwire","Tumusiime"];
const LAST_NAMES   = ["Ssebulime","Kato","Mugisha","Tumwine","Byarugaba","Okwir","Atim","Wasswa","Nsubuga","Ssekitoleko","Lubega","Tusiime","Namanya","Asiimwe","Ntambi"];
const OCCUPATIONS  = ["Teacher","Farmer","Business Person","Civil Servant","Doctor","Engineer","Nurse","Accountant","Driver","Trader"];
const RELATIONSHIPS = ["Father","Mother","Guardian"];

// ════════════════════════════════════════════════════════════════════════════
// STEP 1 — SCHOOL ADMIN ROLE
// ════════════════════════════════════════════════════════════════════════════

async function seedSchoolAdminRole() {
  console.log("\n📋 Step 1 — School admin role...");

  const existing = await db.role.findFirst({
    where: { roleName: "school_admin" },
  });

  if (existing) {
    console.log("   ↻  Role 'school_admin' already exists — skipped");
    return existing;
  }

  const role = await db.role.create({
    data: {
      displayName: "School Admin",
      roleName:    "school_admin",
      description: "Full access to a single school's dashboard and data",
      permissions: SCHOOL_ADMIN_PERMISSIONS,
    },
  });

  console.log(`   ✓  Role created: ${role.displayName} (${role.id})`);
  return role;
}

// ════════════════════════════════════════════════════════════════════════════
// STEP 2 — ADMIN USERS
// ════════════════════════════════════════════════════════════════════════════

async function seedAdminUsers(
  schoolAdminRole: { id: string },
  hashedPassword: string
) {
  console.log("\n👤 Step 2 — Admin users...");

  const users: Record<string, { id: string; email: string }> = {};

  for (const school of SCHOOLS) {
    const { admin } = school;

    const existing = await db.user.findUnique({
      where: { email: admin.email },
    });

    if (existing) {
      console.log(`   ↻  User ${admin.email} already exists — skipped`);
      users[school.code] = { id: existing.id, email: admin.email };
      continue;
    }

    const phone = nextPhone();
    const user  = await db.user.create({
      data: {
        name:      `${admin.firstName} ${admin.lastName}`,
        firstName: admin.firstName,
        lastName:  admin.lastName,
        phone,
        email:     admin.email,
        password:  hashedPassword,
        userType:  UserType.SCHOOL_ADMIN,
        status:    true,
        isVerfied: true,
        roles:     { connect: { id: schoolAdminRole.id } },
      },
    });

    console.log(`   ✓  ${admin.firstName} ${admin.lastName} — ${admin.email}`);
    users[school.code] = { id: user.id, email: admin.email };
  }

  return users;
}

// ════════════════════════════════════════════════════════════════════════════
// STEP 3 — SCHOOLS
// ════════════════════════════════════════════════════════════════════════════

async function seedSchools(adminUsers: Record<string, { id: string }>) {
  console.log("\n🏫 Step 3 — Schools...");

  const schools: Record<string, { id: string; name: string }> = {};

  for (const def of SCHOOLS) {
    const existing = await db.school.findUnique({
      where: { code: def.code },
    });

    if (existing) {
      console.log(`   ↻  ${def.name} already exists — skipped`);
      schools[def.code] = { id: existing.id, name: existing.name };
      continue;
    }

    const adminUser = adminUsers[def.code];
    const school    = await db.school.create({
      data: {
        name:     def.name,
        motto:    def.motto,
        slug:     slug(def.name),
        code:     def.code,
        address:  def.address,
        contact:  def.contact,
        email:    def.email,
        division: def.division,
        isActive: true,
        adminId:  adminUser.id,
        // Also add the admin user to the school's users relation
        users:    { connect: { id: adminUser.id } },
      },
    });

    // Back-fill schoolId on the admin user (for login routing)
    await db.user.update({
      where: { id: adminUser.id },
      data:  { schoolId: school.id },
    });

    console.log(`   ✓  ${school.name} (${school.code}) — admin: ${def.admin.email}`);
    schools[def.code] = { id: school.id, name: school.name };
  }

  return schools;
}

// ════════════════════════════════════════════════════════════════════════════
// STEP 4 — ACADEMIC YEAR
// ════════════════════════════════════════════════════════════════════════════

async function seedAcademicYears(schools: Record<string, { id: string }>) {
  console.log("\n📅 Step 4 — Academic years...");

  const year    = String(new Date().getFullYear());
  const yearMap: Record<string, { id: string }> = {};

  for (const [code, school] of Object.entries(schools)) {
    const existing = await db.academicYear.findUnique({
      where: { year_schoolId: { year, schoolId: school.id } },
    });

    if (existing) {
      console.log(`   ↻  ${code} ${year} already exists — skipped`);
      yearMap[code] = { id: existing.id };
      continue;
    }

    const academicYear = await db.academicYear.create({
      data: {
        year,
        schoolId:  school.id,
        isActive:  true,
        startDate: new Date(`${year}-02-01`),
        endDate:   new Date(`${year}-12-10`),
      },
    });

    console.log(`   ✓  ${code} — ${year}`);
    yearMap[code] = { id: academicYear.id };
  }

  return yearMap;
}

// ════════════════════════════════════════════════════════════════════════════
// STEP 5 — ACADEMIC TERMS
// ════════════════════════════════════════════════════════════════════════════

const TERM_DEFS = [
  { termNumber: 1, name: "Term 1", startDate: "02-01", endDate: "05-10" },
  { termNumber: 2, name: "Term 2", startDate: "05-27", endDate: "08-15" },
  { termNumber: 3, name: "Term 3", startDate: "09-01", endDate: "12-05" },
];

async function seedAcademicTerms(
  academicYears: Record<string, { id: string }>
) {
  console.log("\n📆 Step 5 — Academic terms...");

  const year = String(new Date().getFullYear());
  const termMap: Record<string, { id: string }[]> = {};

  for (const [code, academicYear] of Object.entries(academicYears)) {
    termMap[code] = [];

    for (const def of TERM_DEFS) {
      const existing = await db.academicTerm.findUnique({
        where: {
          termNumber_academicYearId: {
            termNumber:    def.termNumber,
            academicYearId: academicYear.id,
          },
        },
      });

      if (existing) {
        termMap[code].push({ id: existing.id });
        continue;
      }

      const term = await db.academicTerm.create({
        data: {
          name:          def.name,
          termNumber:    def.termNumber,
          academicYearId: academicYear.id,
          startDate:     new Date(`${year}-${def.startDate}`),
          endDate:       new Date(`${year}-${def.endDate}`),
          // Term 1 is active at seed time
          isActive:      def.termNumber === 1,
        },
      });

      termMap[code].push({ id: term.id });
    }

    console.log(`   ✓  ${code} — 3 terms seeded`);
  }

  return termMap;
}

// ════════════════════════════════════════════════════════════════════════════
// STEP 6 — CLASS TEMPLATES
// ════════════════════════════════════════════════════════════════════════════

async function seedClassTemplates(schools: Record<string, { id: string }>) {
  console.log("\n📚 Step 6 — Class templates...");

  // templateId[schoolCode][classCode] = id
  const templateMap: Record<string, Record<string, string>> = {};

  for (const [code, school] of Object.entries(schools)) {
    templateMap[code] = {};

    for (const def of CLASS_TEMPLATES) {
      const existing = await db.classTemplate.findFirst({
        where: { schoolId: school.id, name: def.name },
        select: { id: true },
      });

      if (existing) {
        templateMap[code][def.code] = existing.id;
        continue;
      }

      const template = await db.classTemplate.create({
        data: {
          name:        def.name,
          code:        def.code,
          description: def.description,
          level:       def.level,
          classLevel:  def.classLevel,
          schoolId:    school.id,
        },
      });

      templateMap[code][def.code] = template.id;
    }

    console.log(`   ✓  ${code} — 6 class templates (S1–S6)`);
  }

  return templateMap;
}

// ════════════════════════════════════════════════════════════════════════════
// STEP 7 — CLASS YEARS
// ════════════════════════════════════════════════════════════════════════════

async function seedClassYears(
  templateMap:  Record<string, Record<string, string>>,
  academicYears: Record<string, { id: string }>
) {
  console.log("\n🎓 Step 7 — Class years...");

  // classYearMap[schoolCode][classCode] = { id, classLevel }
  const classYearMap: Record<string, Record<string, { id: string; classLevel: ClassLevel }>> = {};

  for (const [code, templates] of Object.entries(templateMap)) {
    classYearMap[code] = {};
    const academicYear = academicYears[code];

    for (const def of CLASS_TEMPLATES) {
      const templateId = templates[def.code];

      const existing = await db.classYear.findUnique({
        where: {
          classTemplateId_academicYearId: {
            classTemplateId: templateId,
            academicYearId:  academicYear.id,
          },
        },
        select: { id: true, classLevel: true },
      });

      if (existing) {
        classYearMap[code][def.code] = { id: existing.id, classLevel: existing.classLevel };
        continue;
      }

      const classYear = await db.classYear.create({
        data: {
          classTemplateId: templateId,
          academicYearId:  academicYear.id,
          classLevel:      def.classLevel,
          isActive:        true,
          maxStudents:     80,
        },
      });

      classYearMap[code][def.code] = { id: classYear.id, classLevel: def.classLevel };
    }

    console.log(`   ✓  ${code} — 6 class years`);
  }

  return classYearMap;
}

// ════════════════════════════════════════════════════════════════════════════
// STEP 8 — STREAMS
// ════════════════════════════════════════════════════════════════════════════

async function seedStreams(
  classYearMap: Record<string, Record<string, { id: string; classLevel: ClassLevel }>>,
  schools:      Record<string, { id: string }>
) {
  console.log("\n🔀 Step 8 — Streams...");

  // streamMap[schoolCode][classCode] = [{ id, name }]
  const streamMap: Record<string, Record<string, { id: string; name: string }[]>> = {};

  for (const [code, classYears] of Object.entries(classYearMap)) {
    streamMap[code] = {};
    const school    = schools[code];

    for (const [classCode, classYear] of Object.entries(classYears)) {
      streamMap[code][classCode] = [];

      for (const streamName of STREAM_NAMES) {
        const existing = await db.stream.findUnique({
          where: { classYearId_name: { classYearId: classYear.id, name: streamName } },
          select: { id: true, name: true },
        });

        if (existing) {
          streamMap[code][classCode].push({ id: existing.id, name: existing.name });
          continue;
        }

        const stream = await db.stream.create({
          data: {
            name:       streamName,
            classYearId: classYear.id,
            schoolId:   school.id,
          },
        });

        streamMap[code][classCode].push({ id: stream.id, name: stream.name });
      }
    }

    console.log(`   ✓  ${code} — 2 streams × 6 classes = 12 streams`);
  }

  return streamMap;
}

// ════════════════════════════════════════════════════════════════════════════
// STEP 9 — PARENTS
// ════════════════════════════════════════════════════════════════════════════

async function seedParents(
  schools:        Record<string, { id: string }>,
  hashedPassword: string
) {
  console.log("\n👨‍👩‍👧 Step 9 — Parents...");

  // parentIds[schoolCode] = [parentId, ...]  — 10 per school
  const parentMap: Record<string, string[]> = {};

  for (const [code, school] of Object.entries(schools)) {
    parentMap[code] = [];

    for (let i = 0; i < 10; i++) {
      const gender    = i % 2 === 0 ? "Male" : "Female";
      const firstName = gender === "Male" ? randomFrom(MALE_FIRST) : randomFrom(FEMALE_FIRST);
      const lastName  = randomFrom(LAST_NAMES);
      const fullName  = `${firstName} ${lastName}`;
      const phone     = nextPhone();
      const email     = `parent${code.toLowerCase()}${i + 1}@demo.ug`;

      // Skip if email already used
      const existing = await db.parent.findFirst({
        where: { email },
        select: { id: true },
      });
      if (existing) {
        parentMap[code].push(existing.id);
        continue;
      }

      const user = await db.user.create({
        data: {
          name:      fullName,
          firstName,
          lastName,
          phone,
          email,
          password:  hashedPassword,
          userType:  UserType.PARENT,
          schoolId:  school.id,
          status:    true,
          isVerfied: true,
        },
      });

      const parent = await db.parent.create({
        data: {
          firstName,
          lastName,
          name:         fullName,
          phone,
          email,
          gender,
          relationship: randomFrom(RELATIONSHIPS),
          occupation:   randomFrom(OCCUPATIONS),
          address:      "Kampala, Uganda",
          userId:       user.id,
          schoolId:     school.id,
        },
      });

      parentMap[code].push(parent.id);
    }

    console.log(`   ✓  ${code} — 10 parents`);
  }

  return parentMap;
}

// ════════════════════════════════════════════════════════════════════════════
// STEP 10 — STUDENTS  (4 per stream, enrolled + subject-enrolled)
// ════════════════════════════════════════════════════════════════════════════

async function seedStudents(
  schools:       Record<string, { id: string }>,
  classYearMap:  Record<string, Record<string, { id: string; classLevel: ClassLevel }>>,
  streamMap:     Record<string, Record<string, { id: string; name: string }[]>>,
  academicYears: Record<string, { id: string }>,
  termMap:       Record<string, { id: string }[]>,
  parentMap:     Record<string, string[]>
) {
  console.log("\n🎒 Step 10 — Students...");

  let totalCreated = 0;

  for (const [code, school] of Object.entries(schools)) {
    const academicYear = academicYears[code];
    // Use Term 1 (index 0) as the active enrollment term
    const activeTerm   = termMap[code][0];
    const parents      = parentMap[code];
    let parentIndex    = 0;

    for (const [classCode, classYear] of Object.entries(classYearMap[code])) {
      const streams = streamMap[code][classCode] ?? [];

      for (const stream of streams) {
        // Fetch compulsory StreamSubjects for this stream in term 1
        const streamSubjects = await db.streamSubject.findMany({
          where: {
            streamId:    stream.id,
            termId:      activeTerm.id,
            subjectType: "COMPULSORY",
            isActive:    true,
          },
          select: { id: true },
        });

        for (let s = 0; s < 4; s++) {
          const gender    = s % 2 === 0 ? "Male" : "Female";
          const firstName = gender === "Male" ? randomFrom(MALE_FIRST) : randomFrom(FEMALE_FIRST);
          const lastName  = randomFrom(LAST_NAMES);
          const fullName  = `${firstName} ${lastName}`;
          const admNo     = nextAdmNo();
          const phone     = nextPhone();
          const parentId  = parents[parentIndex % parents.length];
          parentIndex++;

          // Skip if admission number already taken for this school
          const existingStudent = await db.student.findUnique({
            where: { admissionNo_schoolId: { admissionNo: admNo, schoolId: school.id } },
          });
          if (existingStudent) continue;

          // Student User account
          const user = await db.user.create({
            data: {
              name:      fullName,
              firstName,
              lastName,
              phone,
              email:     null,
              password:  await bcrypt.hash(admNo, 10), // default password = admNo
              userType:  UserType.STUDENT,
              loginId:   admNo,
              schoolId:  school.id,
              status:    true,
              isVerfied: false,
            },
          });

          // Student record
          const student = await db.student.create({
            data: {
              admissionNo:  admNo,
              firstName,
              lastName,
              dob:          randomDate(2005, 2013),
              gender,
              nationality:  "Ugandan",
              parentId,
              schoolId:     school.id,
              userId:       user.id,
              admissionDate: new Date(),
              isActive:     true,
            },
          });

          // Enrollment for active term
          const enrollment = await db.enrollment.create({
            data: {
              studentId:      student.id,
              classYearId:    classYear.id,
              streamId:       stream.id,
              academicYearId: academicYear.id,
              termId:         activeTerm.id,
              enrollmentType: EnrollmentType.NEW,
              status:         EnrollmentStatus.ACTIVE,
            },
          });

          // Auto-enroll in all compulsory stream subjects
          if (streamSubjects.length > 0) {
            await db.studentSubjectEnrollment.createMany({
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

          totalCreated++;
        }
      }
    }

    const count = await db.student.count({ where: { schoolId: school.id } });
    console.log(`   ✓  ${code} — ${count} students`);
  }

  console.log(`   Total new students created: ${totalCreated}`);
}

// ════════════════════════════════════════════════════════════════════════════
// MAIN
// ════════════════════════════════════════════════════════════════════════════

async function main() {
  console.log("🚀 Starting full demo seed...");
  console.log("─".repeat(60));

  const hashedPassword = await bcrypt.hash("Password@123", 10);

  // 1. Role
  const schoolAdminRole = await seedSchoolAdminRole();

  // 2. Admin users
  const adminUsers = await seedAdminUsers(schoolAdminRole, hashedPassword);

  // 3. Schools
  const schools = await seedSchools(adminUsers);

  // 4. Academic years
  const academicYears = await seedAcademicYears(schools);

  // 5. Academic terms
  const termMap = await seedAcademicTerms(academicYears);

  // 6. Class templates
  const templateMap = await seedClassTemplates(schools);

  // 7. Class years
  const classYearMap = await seedClassYears(templateMap, academicYears);

  // 8. Streams
  const streamMap = await seedStreams(classYearMap, schools);

  // 9. Parents
  const parentMap = await seedParents(schools, hashedPassword);

  // 10. Students
  await seedStudents(
    schools, classYearMap, streamMap,
    academicYears, termMap, parentMap
  );

  console.log("\n" + "─".repeat(60));
  console.log("✅ Demo seed complete!\n");
  console.log("School admin logins:");

  for (const s of SCHOOLS) {
    console.log(`  ${s.admin.email.padEnd(30)}  Password@123`);
  }

  console.log("\nStudent logins:");
  console.log("  loginId = admissionNo (e.g. ADM20250001)");
  console.log("  password = admissionNo (same value)\n");
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });