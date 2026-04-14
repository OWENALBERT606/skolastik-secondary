"use client";

import Link from "next/link";
import {
  Wallet, Users, FileText, AlertCircle, TrendingUp,
  Receipt, ArrowRight, CreditCard, ShoppingCart, Package,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

type Payment = {
  id:          string;
  amount:      number;
  paymentDate: string;
  method:      string;
  studentName: string;
  admissionNo: string;
};

type Stats = {
  totalStudents:    number;
  totalInvoices:    number;
  totalPaid:        number;
  totalOutstanding: number;
  overdueInvoices:  number;
};

type Props = {
  slug:           string;
  staffName:      string;
  stats:          Stats;
  recentPayments: Payment[];
};

function fmt(n: number) {
  return n.toLocaleString("en-UG", { minimumFractionDigits: 0, maximumFractionDigits: 0 });
}

export default function BursarDashboardClient({ slug, staffName, stats, recentPayments }: Props) {
  const fin = `/school/${slug}/finance`;
  const sch = `/school/${slug}`;

  const statCards = [
    {
      label: "Total Collected",
      value: `UGX ${fmt(stats.totalPaid)}`,
      icon:  TrendingUp,
      color: "text-green-600 dark:text-green-400",
      bg:    "bg-green-50 dark:bg-green-900/20",
      href:  `${fin}/fees/payments`,
    },
    {
      label: "Outstanding Balance",
      value: `UGX ${fmt(stats.totalOutstanding)}`,
      icon:  Wallet,
      color: "text-primary",
      bg:    "bg-primary/10",
      href:  `${fin}/fees/accounts`,
    },
    {
      label: "Total Invoices",
      value: stats.totalInvoices.toString(),
      icon:  FileText,
      color: "text-primary",
      bg:    "bg-primary/10",
      href:  `${fin}/fees/invoices`,
    },
    {
      label: "Overdue Invoices",
      value: stats.overdueInvoices.toString(),
      icon:  AlertCircle,
      color: stats.overdueInvoices > 0 ? "text-red-600 dark:text-red-400" : "text-slate-400",
      bg:    stats.overdueInvoices > 0 ? "bg-red-50 dark:bg-red-900/20" : "bg-slate-100 dark:bg-slate-800",
      href:  `${fin}/fees/invoices`,
    },
    {
      label: "Total Students",
      value: stats.totalStudents.toString(),
      icon:  Users,
      color: "text-primary",
      bg:    "bg-primary/10",
      href:  `${sch}/users/students`,
    },
  ];

  const quickLinks = [
    { label: "Fee Categories",    href: `${fin}/fees/categories`,    icon: CreditCard  },
    { label: "Fee Structures",    href: `${fin}/fees/structures`,    icon: FileText    },
    { label: "Student Accounts",  href: `${fin}/fees/accounts`,      icon: Users       },
    { label: "Invoices",          href: `${fin}/fees/invoices`,      icon: Receipt     },
    { label: "Payments",          href: `${fin}/fees/payments`,      icon: Wallet      },
    { label: "Bursaries",         href: `${fin}/fees/bursaries`,     icon: TrendingUp  },
    { label: "Installment Plans", href: `${fin}/fees/installments`,  icon: CreditCard  },
    { label: "Penalty Rules",     href: `${fin}/fees/penalties`,     icon: AlertCircle },
    { label: "Expense Records",   href: `${fin}/expense`,            icon: Receipt     },
    { label: "Vendors",           href: `${fin}/expense/vendors`,    icon: Package     },
    { label: "Inventory",         href: `${fin}/inventory`,          icon: ShoppingCart },
    { label: "Fee Reports",       href: `${fin}/fees/reports`,       icon: TrendingUp  },
  ];

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
            Welcome, {staffName.split(" ")[0]}
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Bursar Portal — Finance & Inventory Overview
          </p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button asChild size="sm" variant="outline">
            <Link href={`${fin}/fees/invoices`}><FileText className="h-4 w-4 mr-1.5" />Invoices</Link>
          </Button>
          <Button asChild size="sm">
            <Link href={`${fin}/fees/payments`}><Receipt className="h-4 w-4 mr-1.5" />Payments</Link>
          </Button>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-4">
        {statCards.map(s => (
          <Link key={s.label} href={s.href}>
            <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
              <CardContent className="p-4 flex flex-col gap-3">
                <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${s.bg}`}>
                  <s.icon className={`h-5 w-5 ${s.color}`} />
                </div>
                <div>
                  <p className="text-xs text-slate-500 dark:text-slate-400">{s.label}</p>
                  <p className={`text-lg font-bold mt-0.5 ${s.color}`}>{s.value}</p>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Quick links */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold text-slate-700 dark:text-slate-300">Quick Access</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {quickLinks.map(q => (
                <Link
                  key={q.label}
                  href={q.href}
                  className="flex items-center gap-2.5 p-3 rounded-lg border border-slate-200 dark:border-slate-700 hover:border-primary hover:bg-primary/5 transition-all group"
                >
                  <q.icon className="h-4 w-4 text-slate-400 group-hover:text-primary shrink-0 transition-colors" />
                  <span className="text-xs font-medium text-slate-600 dark:text-slate-400 group-hover:text-primary transition-colors">{q.label}</span>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Recent payments */}
        <Card>
          <CardHeader className="pb-3 flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-semibold text-slate-700 dark:text-slate-300">Recent Payments</CardTitle>
            <Link href={`${fin}/fees/payments`} className="text-xs text-primary hover:underline flex items-center gap-1">
              View all <ArrowRight className="h-3 w-3" />
            </Link>
          </CardHeader>
          <CardContent className="space-y-2">
            {recentPayments.length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-4">No payments yet</p>
            ) : (
              recentPayments.map(p => (
                <div key={p.id} className="flex items-center justify-between py-2 border-b border-slate-100 dark:border-slate-800 last:border-0">
                  <div className="min-w-0">
                    <p className="text-xs font-medium text-slate-800 dark:text-slate-200 truncate">{p.studentName}</p>
                    <p className="text-[10px] text-slate-400">{p.admissionNo} · {p.method}</p>
                  </div>
                  <div className="text-right shrink-0 ml-2">
                    <p className="text-xs font-bold text-green-600 dark:text-green-400">UGX {fmt(p.amount)}</p>
                    <p className="text-[10px] text-slate-400">{new Date(p.paymentDate).toLocaleDateString("en-GB", { day: "2-digit", month: "short" })}</p>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      {/* People section */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Link href={`${sch}/users/students`}>
          <Card className="hover:shadow-md transition-shadow cursor-pointer">
            <CardContent className="p-5 flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <Users className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="font-semibold text-slate-800 dark:text-slate-100">Students</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">{stats.totalStudents} enrolled · view fee accounts</p>
              </div>
              <ArrowRight className="h-4 w-4 text-slate-300 ml-auto" />
            </CardContent>
          </Card>
        </Link>
        <Link href={`${sch}/users/parents`}>
          <Card className="hover:shadow-md transition-shadow cursor-pointer">
            <CardContent className="p-5 flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <Users className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="font-semibold text-slate-800 dark:text-slate-100">Parents / Guardians</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">Contact parents about fee balances</p>
              </div>
              <ArrowRight className="h-4 w-4 text-slate-300 ml-auto" />
            </CardContent>
          </Card>
        </Link>
      </div>
    </div>
  );
}
