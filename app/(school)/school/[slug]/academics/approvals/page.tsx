// app/school/[slug]/academics/approvals/page.tsx
import { getAuthenticatedUser }  from "@/config/useAuth";
import { notFound }              from "next/navigation";
import MarksApprovalsClient from "./components/marks-approvals-client";
import { getMarksApprovalsData } from "@/actions/marks-approval";
import { db }                    from "@/prisma/db";

export default async function MarksApprovalsPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const authUser = await getAuthenticatedUser();

  // Resolve schoolId — admins have it in JWT, DOS/teachers must look it up
  let schoolId = authUser.school?.id ?? "";
  if (!schoolId) {
    const teacher = await db.teacher.findUnique({
      where:  { userId: authUser.id },
      select: { schoolId: true },
    });
    if (!teacher?.schoolId) notFound();
    schoolId = teacher.schoolId;
  }

  const result = await getMarksApprovalsData(schoolId);
  if (!result.ok || !result.data) notFound();

  return (
    <div className="p-6">
      <MarksApprovalsClient
        data={result.data}
        approverId={authUser.id}
        schoolId={schoolId}
        slug={slug}
      />
    </div>
  );
}