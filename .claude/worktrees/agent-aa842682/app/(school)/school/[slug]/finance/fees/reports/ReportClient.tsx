// app/school/[slug]/finance/fees/reports/FeesReportsClient.tsx
"use client";

import { useState } from "react";
import { Badge }   from "@/components/ui/badge";
import { Button }  from "@/components/ui/button";
import {
  Select, SelectContent, SelectItem,
  SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  AlertCircle, BadgeDollarSign, Download,
  FileText, Receipt, TrendingUp, Users,
  Wallet, Banknote, Building2, Smartphone,
  CreditCard, ArrowUpRight,
} from "lucide-react";

// ─── Types ─────────────────────────────────────────────────────────────────────

type Summary = {
  totalInvoiced:  number;
  totalCollected: number;
  outstanding:    number;
  totalBursaries: number;
  totalPenalties: number;
  collectionRate: number;
  arrearsCount:   number;
};
type ClassBar      = { class: string; invoiced: number; collected: number; rate: number };
type MethodRow     = { method: string; amount: number; count: number; pct: number };
type MonthlyPoint  = { month: string; amount: number };
type ArrearsRow    = { studentName: string; admissionNo: string; class: string; balance: number };
type Term          = { id: string; label: string };

// ─── Helpers ───────────────────────────────────────────────────────────────────

const fmtM   = (n: number) => n >= 1_000_000 ? `UGX ${(n / 1_000_000).toFixed(2)}M` : `UGX ${n.toLocaleString()}`;
const fmtUGX = (n: number) => `UGX ${n.toLocaleString()}`;

const METHOD_ICONS: Record<string, React.ElementType> = {
  CASH: Banknote, BANK_TRANSFER: Building2, MOBILE_MONEY: Smartphone,
  CHEQUE: FileText, ONLINE: CreditCard, POS: CreditCard,
};
const METHOD_COLORS: Record<string, string> = {
  CASH: "bg-emerald-400", BANK_TRANSFER: "bg-blue-400",
  MOBILE_MONEY: "bg-amber-400", CHEQUE: "bg-slate-400",
  ONLINE: "bg-blue-400", POS: "bg-violet-400",
};
const METHOD_LABEL: Record<string, string> = {
  CASH: "Cash", BANK_TRANSFER: "Bank Transfer", MOBILE_MONEY: "Mobile Money",
  CHEQUE: "Cheque", ONLINE: "Online", POS: "POS",
};

// ─── Stat Card ─────────────────────────────────────────────────────────────────

function StatCard({ label, value, sub, icon: Icon, accent }: {
  label: string; value: string; sub: string;
  icon: React.ElementType; accent: string;
}) {
  return (
    <div className={`bg-white border rounded-2xl p-5 shadow-sm ${accent.split(" ")[1] ?? "border-slate-200"}`}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-widest text-slate-400">{label}</p>
          <p className="text-2xl font-black text-slate-900 mt-1 leading-none">{value}</p>
          <p className="text-xs text-slate-500 mt-1">{sub}</p>
        </div>
        <div className={`p-3 rounded-xl ${accent}`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
    </div>
  );
}

// ─── Main ──────────────────────────────────────────────────────────────────────

export default function FeesReportsClient({
  slug, activeTermId, activeTermLabel, terms,
  summary, classBars, methodBreakdown, monthlyTrend, topArrears,
}: {
  slug:             string;
  activeTermId:     string | null;
  activeTermLabel:  string;
  terms:            Term[];
  summary:          Summary;
  classBars:        ClassBar[];
  methodBreakdown:  MethodRow[];
  monthlyTrend:     MonthlyPoint[];
  topArrears:       ArrearsRow[];
}) {
  const [selectedTerm, setSelectedTerm] = useState(activeTermId ?? "all");

  const maxMonthly = Math.max(...monthlyTrend.map((m) => m.amount), 1);

  return (
    <div className="min-h-screen bg-slate-50/60 p-6 space-y-6">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Fee Reports</h1>
          <p className="text-sm text-slate-500 mt-0.5">{activeTermLabel} · Financial analytics</p>
        </div>
        <div className="flex gap-3">
          <Select value={selectedTerm} onValueChange={setSelectedTerm}>
            <SelectTrigger className="w-48 bg-white border-slate-200 text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={activeTermId ?? "all"}>Current Term</SelectItem>
              {terms.map((t) => (
                <SelectItem key={t.id} value={t.id}>{t.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button variant="outline" className="gap-2 bg-white border-slate-200">
            <Download className="w-4 h-4" /> Export PDF
          </Button>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard label="Total Invoiced"  value={fmtM(summary.totalInvoiced)}  sub={`${summary.collectionRate.toFixed(1)}% collection rate`} icon={FileText}       accent="bg-blue-50 text-blue-600 border-blue-100" />
        <StatCard label="Total Collected" value={fmtM(summary.totalCollected)} sub="Payments received"             icon={Receipt}       accent="bg-blue-50 text-blue-600 border-blue-100" />
        <StatCard label="Outstanding"     value={fmtM(summary.outstanding)}    sub={`${summary.arrearsCount} students in arrears`}       icon={AlertCircle}   accent="bg-amber-50 text-amber-600 border-amber-100" />
        <StatCard label="Bursaries"       value={fmtM(summary.totalBursaries)} sub="Discounts & waivers applied"  icon={BadgeDollarSign} accent="bg-emerald-50 text-emerald-600 border-emerald-100" />
      </div>

      {/* Row 1: class bars + method breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

        {/* Collection by class */}
        <div className="lg:col-span-2 bg-white border border-slate-200 rounded-2xl shadow-sm p-5">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-sm font-bold text-slate-800">Collection by Class</h2>
            <Badge variant="outline" className="text-xs border-slate-200 text-slate-500">
              {activeTermLabel}
            </Badge>
          </div>
          {classBars.length === 0 ? (
            <div className="py-10 text-center text-xs text-slate-400">No class data available.</div>
          ) : (
            <div className="space-y-4">
              {classBars.map((row) => (
                <div key={row.class}>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs font-bold text-slate-700 w-12">{row.class}</span>
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-slate-400">
                        {fmtM(row.collected)} / {fmtM(row.invoiced)}
                      </span>
                      <span className={`text-xs font-black w-10 text-right ${
                        row.rate >= 80 ? "text-emerald-600" :
                        row.rate >= 70 ? "text-amber-600"   : "text-red-600"
                      }`}>
                        {row.rate}%
                      </span>
                    </div>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden">
                    <div
                      className={`h-3 rounded-full transition-all duration-700 ${
                        row.rate >= 80 ? "bg-gradient-to-r from-emerald-400 to-emerald-600" :
                        row.rate >= 70 ? "bg-gradient-to-r from-amber-400 to-amber-500" :
                                         "bg-gradient-to-r from-red-400 to-red-500"
                      }`}
                      style={{ width: `${row.rate}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Payment method breakdown */}
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-5">
          <h2 className="text-sm font-bold text-slate-800 mb-5">Payment Methods</h2>
          {methodBreakdown.length === 0 ? (
            <div className="py-10 text-center text-xs text-slate-400">No payment data.</div>
          ) : (
            <div className="space-y-4">
              {methodBreakdown.map((m) => {
                const Icon = METHOD_ICONS[m.method] ?? CreditCard;
                return (
                  <div key={m.method}>
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-2">
                        <Icon className="w-3.5 h-3.5 text-slate-400" />
                        <span className="text-xs font-semibold text-slate-600">
                          {METHOD_LABEL[m.method] ?? m.method}
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="text-xs font-bold text-slate-800">{fmtM(m.amount)}</span>
                        <span className="text-[10px] text-slate-400 ml-1">({m.pct}%)</span>
                      </div>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                      <div
                        className={`h-2 rounded-full transition-all duration-700 ${METHOD_COLORS[m.method] ?? "bg-slate-400"}`}
                        style={{ width: `${m.pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Row 2: monthly trend + top arrears */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

        {/* Monthly trend bar chart */}
        <div className="lg:col-span-2 bg-white border border-slate-200 rounded-2xl shadow-sm p-5">
          <h2 className="text-sm font-bold text-slate-800 mb-5">Monthly Collection Trend</h2>
          {monthlyTrend.length === 0 ? (
            <div className="py-10 text-center text-xs text-slate-400">No trend data available.</div>
          ) : (
            <div className="flex items-end gap-3 h-40">
              {monthlyTrend.map((m) => {
                const pct = Math.round((m.amount / maxMonthly) * 100);
                return (
                  <div key={m.month} className="flex-1 flex flex-col items-center gap-1.5 group">
                    <span className="text-[9px] text-slate-400 font-semibold opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                      {fmtM(m.amount)}
                    </span>
                    <div className="w-full flex items-end" style={{ height: "120px" }}>
                      <div
                        className="w-full rounded-t-lg bg-gradient-to-t from-blue-500 to-blue-400 transition-all duration-700 hover:from-blue-600 hover:to-blue-500"
                        style={{ height: `${Math.max(pct, 4)}%` }}
                      />
                    </div>
                    <span className="text-[10px] font-semibold text-slate-500">{m.month}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Top arrears */}
        <div className="bg-white border border-amber-100 rounded-2xl shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3.5 border-b border-amber-50 bg-amber-50/50">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-amber-500" />
              <h2 className="text-sm font-bold text-amber-800">Top Arrears</h2>
            </div>
            <Badge variant="outline" className="text-amber-600 border-amber-200 bg-white text-[10px]">
              {topArrears.length} students
            </Badge>
          </div>
          {topArrears.length === 0 ? (
            <div className="py-10 text-center text-xs text-slate-400">No outstanding balances.</div>
          ) : (
            <div className="divide-y divide-slate-50 max-h-64 overflow-y-auto">
              {topArrears.map((s, i) => (
                <div key={s.admissionNo} className="flex items-center justify-between px-4 py-2.5 hover:bg-slate-50/50">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="text-[10px] font-black text-slate-300 w-5 shrink-0">#{i + 1}</span>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-slate-800 truncate">{s.studentName}</p>
                      <p className="text-[10px] text-slate-400">{s.class || s.admissionNo}</p>
                    </div>
                  </div>
                  <span className="text-xs font-black text-amber-600 shrink-0 ml-2">
                    {fmtM(s.balance)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Footer note */}
      {summary.totalPenalties > 0 && (
        <div className="flex items-center gap-2 text-xs text-slate-400 bg-white border border-slate-200 rounded-xl px-4 py-2.5">
          <AlertCircle className="w-3.5 h-3.5 text-red-400 shrink-0" />
          Late payment penalties of <strong className="text-red-500">{fmtM(summary.totalPenalties)}</strong> have been applied this term.
        </div>
      )}
    </div>
  );
}