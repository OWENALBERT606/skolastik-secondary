import { redirect }             from "next/navigation";
import { getAuthenticatedUser } from "@/config/useAuth";
import { buildCapabilities }    from "@/lib/utils/capabilities";
import { db }                   from "@/prisma/db";
import BursarDashboardClient    from "./components/bursar-dashboard-client";

export default async function BursarDashboardPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const userData = await getAuthenticatedUser();
  if (!userData?.id) redirect("/login");

  const caps = await buildCapabilities(userData.id);
  if (!caps.isBursar && caps.primaryRole !== "schooladmin" && caps.primaryRole !== "admin") redirect("/login");
  if (!caps.school || caps.school.slug !== slug) redirect("/login");

  const schoolId = caps.school.id;

  // Fetch summary stats in parallel
  const [
    totalStudents,
    totalInvoices,
    totalCollected,
    totalOutstanding,
    recentReceipts,
    overdueInvoices,
  ] = await Promise.all([
    db.student.count({ where: { schoolId } }),
    db.invoice.count({
      where: { studentFeeAccount: { schoolId } },
    }),
    db.feeReceipt.aggregate({
      where:  { schoolId, voidedAt: null },
      _sum:   { amountPaid: true },
    }),
    db.studentFeeAccount.aggregate({
      where:  { schoolId, balance: { gt: 0 } },
      _sum:   { balance: true },
    }),
    db.feeReceipt.findMany({
      where:   { schoolId, voidedAt: null },
      orderBy: { issuedAt: "desc" },
      take:    8,
      include: {
        transaction: {
          include: {
            studentFeeAccount: {
              include: { student: { select: { firstName: true, lastName: true, admissionNo: true } } },
            },
          },
        },
      },
    }),
    db.invoice.count({
      where: { studentFeeAccount: { schoolId }, status: "OVERDUE" },
    }),
  ]);

  const stats = {
    totalStudents,
    totalInvoices,
    totalPaid:        Number(totalCollected._sum.amountPaid ?? 0),
    totalOutstanding: Number(totalOutstanding._sum.balance  ?? 0),
    overdueInvoices,
  };

  const payments = recentReceipts.map(r => ({
    id:          r.id,
    amount:      Number(r.amountPaid),
    paymentDate: r.issuedAt.toISOString(),
    method:      r.paymentMethod ?? "—",
    studentName: r.transaction.studentFeeAccount?.student
      ? `${r.transaction.studentFeeAccount.student.firstName} ${r.transaction.studentFeeAccount.student.lastName}`
      : "—",
    admissionNo: r.transaction.studentFeeAccount?.student?.admissionNo ?? "—",
  }));

  return (
    <BursarDashboardClient
      slug={slug}
      staffName={userData.name ?? "Bursar"}
      stats={stats}
      recentPayments={payments}
    />
  );
}
