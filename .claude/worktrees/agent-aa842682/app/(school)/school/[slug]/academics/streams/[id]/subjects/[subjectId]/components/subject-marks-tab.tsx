// app/school/[slug]/academics/streams/[streamId]/subjects/[subjectId]/components/subject-marks-tab.tsx
"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Award,
  BookOpen,
  ChevronDown,
  ChevronRight,
  Download,
  FileEdit,
  FileText,
  Hash,
  Loader2,
  RefreshCw,
  TrendingDown,
  TrendingUp,
  Minus,
  Upload,
} from "lucide-react";
import EnterExamMarksDialog from "./enter-exam-marks-dialog";
import EnterAOIScoresDialog from "./enter-aoi-scores-dialog";
import EnterAOIUnitsDialog  from "./enter-aoi-units-dialog";

// ════════════════════════════════════════════════════════════════════════════
// HELPERS
// ════════════════════════════════════════════════════════════════════════════

const EXAM_ORDER = ["BOT", "MTE", "EOT", "MOCK", "OTHER"] as const;

function examLabel(type: string) {
  const map: Record<string, string> = {
    BOT: "Beginning of Term",
    MTE: "Mid-Term",
    EOT: "End of Term",
    MOCK: "Mock",
    OTHER: "Other",
  };
  return map[type] ?? type;
}

function PerformanceIcon({ mark }: { mark: number | null }) {
  if (mark === null) return <Minus className="h-4 w-4 text-slate-400" />;
  if (mark >= 70)    return <TrendingUp className="h-4 w-4 text-green-600" />;
  if (mark >= 50)    return <Minus className="h-4 w-4 text-amber-500" />;
  return <TrendingDown className="h-4 w-4 text-blue-500" />;
}

function GradeBadge({ mark }: { mark: number | null }) {
  if (mark === null) return <span className="text-slate-400 text-xs">—</span>;
  let grade = "F9", color = "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400";
  if (mark >= 80) { grade = "D1"; color = "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"; }
  else if (mark >= 70) { grade = "D2"; color = "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"; }
  else if (mark >= 65) { grade = "C3"; color = "bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400"; }
  else if (mark >= 60) { grade = "C4"; color = "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"; }
  else if (mark >= 55) { grade = "C5"; color = "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400"; }
  else if (mark >= 50) { grade = "C6"; color = "bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400"; }
  else if (mark >= 45) { grade = "P7"; color = "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"; }
  else if (mark >= 40) { grade = "P8"; color = "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400"; }
  return <Badge className={`${color} border-0 text-xs font-semibold`}>{grade}</Badge>;
}

// ════════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ════════════════════════════════════════════════════════════════════════════

interface SubjectMarksTabProps {
  streamSubject: any;
  schoolId:      string;
  userId:        string;
  marksData:     any | null;  // lifted from parent — shared with all tabs
  isRefreshing:  boolean;
  onRefresh:     () => void;
}

export default function SubjectMarksTab({
  streamSubject,
  schoolId,
  userId,
  marksData,
  isRefreshing,
  onRefresh,
}: SubjectMarksTabProps) {
  // Dialog state only — data is managed by parent
  const [activeExam,       setActiveExam]       = useState<any | null>(null);
  const [showAOIScores,    setShowAOIScores]    = useState(false);
  const [showAOIUnits,     setShowAOIUnits]     = useState(false);
  const [showStudentTable, setShowStudentTable] = useState(true);

  // ── Loading / error states ─────────────────────────────────────────────

  if (!marksData) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="w-8 h-8 animate-spin text-[#5B9BD5]" />
      </div>
    );
  }

  const {
    enrollments, aoiTopics, aoiGradingScales,
    exams, assessmentConfig, studentSummaries, stats, subjectPaper, marksLocked,
    lockedExamTypes, aoiLocked,
  } = marksData;

  const hasPaper     = !!subjectPaper;
  const hasAOITopics = aoiTopics.length > 0;
  const maxAOIUnits  = streamSubject.classSubject?.aoiCount ?? 0;
  const hasAOIUnits  = maxAOIUnits > 0;
  const sortedExams  = [...exams].sort(
    (a: any, b: any) => EXAM_ORDER.indexOf(a.examType as any) - EXAM_ORDER.indexOf(b.examType as any)
  );

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-5">

      {/* ── Header row ───────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
            Marks Entry
            {hasPaper && (
              <span className="ml-2 text-sm font-normal text-slate-500 dark:text-slate-400">
                — {subjectPaper.name}
                {subjectPaper.paperCode && (
                  <span className="font-mono ml-1 text-[#5B9BD5]">({subjectPaper.paperCode})</span>
                )}
              </span>
            )}
          </h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            {streamSubject.term?.name} · {stats.totalStudents} students enrolled
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={onRefresh}
            disabled={isRefreshing}
            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? "animate-spin" : ""}`} />
          </button>
          <Button variant="outline" size="sm" disabled>
            <Upload className="h-4 w-4 mr-2" /> Import
          </Button>
          <Button variant="outline" size="sm" disabled>
            <Download className="h-4 w-4 mr-2" /> Export
          </Button>
        </div>
      </div>

      {/* ── Progress stats ───────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Total Students",  value: stats.totalStudents,   color: "text-slate-900 dark:text-white" },
          { label: "With Results",    value: stats.withResults,     color: "text-green-600 dark:text-green-400" },
          { label: "Exam Marks",      value: stats.withExamMarks,   color: "text-blue-600 dark:text-blue-400" },
          { label: "AOI Scores",      value: stats.withAOIScores,   color: "text-blue-600 dark:text-blue-400" },
        ].map(({ label, value, color }) => (
          <div key={label} className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 p-4">
            <p className="text-xs text-slate-500 dark:text-slate-400">{label}</p>
            <p className={`text-2xl font-bold mt-0.5 ${color}`}>{value}</p>
            {label === "With Results" && stats.totalStudents > 0 && (
              <p className="text-xs text-slate-400 mt-0.5">{stats.completionPercent}% complete</p>
            )}
          </div>
        ))}
      </div>

      {/* ── Assessment config banner ─────────────────────────────────────── */}
      {assessmentConfig && (
        <div className="bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4">
          <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-3">
            Assessment Weights
          </p>
          <div className="flex flex-wrap gap-3">
            {[
              { label: "BOT",  value: assessmentConfig.hasBOT ? assessmentConfig.botWeight : 0 },
              { label: "MTE",  value: assessmentConfig.hasMTE ? assessmentConfig.mteWeight : 0 },
              { label: "EOT",  value: assessmentConfig.hasEOT ? assessmentConfig.eotWeight : 0 },
              { label: "AOI",  value: assessmentConfig.aoiWeight },
            ]
              .filter((w) => w.value > 0)
              .map(({ label, value }) => (
                <div key={label} className="flex items-center gap-1.5 px-3 py-1.5 bg-white dark:bg-slate-700 rounded-lg border border-slate-200 dark:border-slate-600 text-sm">
                  <span className="font-medium text-slate-900 dark:text-white">{label}</span>
                  <span className="text-slate-400">·</span>
                  <span className="text-[#5B9BD5] font-semibold">{value}%</span>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* ── Action cards (one per entry type) ───────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">

        {/* Exam marks cards — one per exam */}
        {sortedExams.length > 0 ? (
          sortedExams.map((exam: any) => {
            const entered = studentSummaries.filter(
              (s: any) => s[exam.examType.toLowerCase() as "bot" | "mte" | "eot"] !== null
            ).length;
            return (
              <ExamCard
                key={exam.id}
                exam={exam}
                entered={entered}
                total={stats.totalStudents}
                disabled={lockedExamTypes?.includes(exam.examType) ?? marksLocked}
                onClick={() => !(lockedExamTypes?.includes(exam.examType) ?? marksLocked) && setActiveExam(exam)}
              />
            );
          })
        ) : (
          <div className="md:col-span-2 xl:col-span-3 bg-amber-50 dark:bg-amber-900/20 rounded-xl border border-amber-200 dark:border-amber-800 p-4 text-sm text-amber-700 dark:text-amber-400">
            No exams configured for this term. Create exams in the class settings first.
          </div>
        )}

        {/* AOI Topic Scores card */}
        {hasAOITopics && (
          <ActionCard
            icon={<Award className="w-5 h-5 text-blue-600 dark:text-blue-400" />}
            iconBg="bg-blue-100 dark:bg-blue-900/30"
            title="AOI Topic Scores"
            subtitle={`${aoiTopics.length} topics · ${stats.withAOIScores}/${stats.totalStudents} entered`}
            progress={stats.totalStudents > 0 ? (stats.withAOIScores / stats.totalStudents) * 100 : 0}
            progressColor="bg-blue-500"
            onClick={() => !(aoiLocked ?? marksLocked) && setShowAOIScores(true)}
            disabled={aoiLocked ?? marksLocked}
            buttonLabel="Enter AOI Scores"
          />
        )}

        {/* AOI Units card */}
        {hasAOIUnits && (
          <ActionCard
            icon={<Hash className="w-5 h-5 text-teal-600 dark:text-teal-400" />}
            iconBg="bg-teal-100 dark:bg-teal-900/30"
            title={`AOI Units (U1–U${maxAOIUnits})`}
            subtitle={`${stats.withAOIUnits}/${stats.totalStudents} students have unit scores`}
            progress={stats.totalStudents > 0 ? (stats.withAOIUnits / stats.totalStudents) * 100 : 0}
            progressColor="bg-teal-500"
            onClick={() => !(aoiLocked ?? marksLocked) && setShowAOIUnits(true)}
            disabled={aoiLocked ?? marksLocked}
            buttonLabel="Enter AOI Units"
          />
        )}

        {/* No marks entry possible */}
        {sortedExams.length === 0 && !hasAOITopics && !hasAOIUnits && (
          <div className="md:col-span-2 xl:col-span-3 text-center py-12 text-slate-500 dark:text-slate-400">
            <FileEdit className="w-12 h-12 mx-auto mb-3 text-slate-300 dark:text-slate-600" />
            <p className="font-medium">No mark entry configured yet</p>
            <p className="text-sm mt-1">
              Create exams for this term and add AOI topics to begin entering marks.
            </p>
          </div>
        )}
      </div>

      {/* ── Student marks table ──────────────────────────────────────────── */}
      {studentSummaries.length > 0 && (
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
          <button
            onClick={() => setShowStudentTable((v) => !v)}
            className="w-full flex items-center justify-between px-5 py-3.5 border-b border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
          >
            <div className="flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-[#5B9BD5]" />
              <span className="font-semibold text-slate-900 dark:text-white text-sm">
                Student Marks Summary ({stats.totalStudents})
              </span>
            </div>
            {showStudentTable
              ? <ChevronDown className="w-4 h-4 text-slate-400" />
              : <ChevronRight className="w-4 h-4 text-slate-400" />}
          </button>

          {showStudentTable && (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
                  <tr>
                    <th className="text-left px-4 py-3 font-medium text-slate-500 dark:text-slate-400 text-xs uppercase tracking-wide">#</th>
                    <th className="text-left px-4 py-3 font-medium text-slate-500 dark:text-slate-400 text-xs uppercase tracking-wide">Student</th>
                    <th className="text-left px-4 py-3 font-medium text-slate-500 dark:text-slate-400 text-xs uppercase tracking-wide">Adm No</th>
                    {sortedExams.map((e: any) => (
                      <th key={e.id} className="text-right px-4 py-3 font-medium text-slate-500 dark:text-slate-400 text-xs uppercase tracking-wide">
                        {e.examType}
                      </th>
                    ))}
                    {hasAOITopics && (
                      <th className="text-right px-4 py-3 font-medium text-slate-500 dark:text-slate-400 text-xs uppercase tracking-wide">AOI</th>
                    )}
                    <th className="text-right px-4 py-3 font-medium text-slate-500 dark:text-slate-400 text-xs uppercase tracking-wide">Total</th>
                    <th className="text-center px-4 py-3 font-medium text-slate-500 dark:text-slate-400 text-xs uppercase tracking-wide">Grade</th>
                    <th className="text-center px-4 py-3 font-medium text-slate-500 dark:text-slate-400 text-xs uppercase tracking-wide">Trend</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {studentSummaries.map((s: any, i: number) => (
                    <tr key={s.enrollmentId} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                      <td className="px-4 py-3 text-slate-400 text-xs">{i + 1}</td>
                      <td className="px-4 py-3 font-medium text-slate-900 dark:text-white">{s.studentName}</td>
                      <td className="px-4 py-3 font-mono text-xs text-slate-500 dark:text-slate-400">{s.admissionNo}</td>
                      {sortedExams.map((e: any) => {
                        const val = s[e.examType.toLowerCase() as "bot" | "mte" | "eot"];
                        return (
                          <td key={e.id} className="px-4 py-3 text-right">
                            {val !== null && val !== undefined
                              ? <span className="font-medium text-slate-900 dark:text-white">{val.toFixed(1)}</span>
                              : <span className="text-slate-300 dark:text-slate-600 text-xs">—</span>}
                          </td>
                        );
                      })}
                      {hasAOITopics && (
                        <td className="px-4 py-3 text-right">
                          {s.aoiTotal > 0
                            ? <span className="font-medium text-slate-900 dark:text-white">{s.aoiTotal.toFixed(1)}</span>
                            : <span className="text-slate-300 dark:text-slate-600 text-xs">—</span>}
                        </td>
                      )}
                      <td className="px-4 py-3 text-right font-bold">
                        {s.totalMark !== null ? (
                          <span className={s.isDraft
                            ? "text-amber-600 dark:text-amber-400 font-medium"
                            : "text-slate-900 dark:text-white font-medium"
                          }>
                            {s.totalMark.toFixed(1)}%
                            {s.isDraft && <span className="ml-1 text-xs font-normal opacity-60">(draft)</span>}
                          </span>
                        ) : (
                          <span className="text-slate-300 dark:text-slate-600 text-xs">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-center"><GradeBadge mark={s.totalMark} /></td>
                      <td className="px-4 py-3 text-center"><PerformanceIcon mark={s.totalMark} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Locked banner */}
      {marksLocked && (
        <div className="flex items-center gap-3 px-4 py-3 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-lg text-sm text-emerald-700 dark:text-emerald-300">
          <svg className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
          <span>
            <strong>Marks are approved and locked.</strong> All entries have been approved — editing is disabled. Contact the administrator to unlock if changes are needed.
          </span>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          DIALOGS
          ══════════════════════════════════════════════════════════════════════ */}

      {/* Enter Exam Marks */}
      {activeExam && (
        <EnterExamMarksDialog
          open={!!activeExam}
          onOpenChange={(open) => {
            if (!open) { setActiveExam(null); onRefresh(); }
          }}
          paperStreamSubject={{
            id:                 streamSubject.id,
            studentEnrollments: enrollments,
            subjectPaper:       subjectPaper ?? null,
          }}
          exam={activeExam}
          schoolId={schoolId}
          userId={userId}
        />
      )}

      {/* Enter AOI Topic Scores */}
      {showAOIScores && (
        <EnterAOIScoresDialog
          open={showAOIScores}
          onOpenChange={(open) => {
            setShowAOIScores(open);
            if (!open) onRefresh();
          }}
          paperStreamSubject={{
            id:                 streamSubject.id,
            studentEnrollments: enrollments,
            subjectPaper:       subjectPaper ?? null,
          }}
          aoiTopics={aoiTopics}
          schoolId={schoolId}
          userId={userId}
          aoiMaxPoints={assessmentConfig?.aoiMaxPoints ?? 3}
          aoiWeight={assessmentConfig?.aoiWeight ?? 20}
          isLocked={marksLocked ?? false}
        />
      )}

      {/* Enter AOI Units */}
      {showAOIUnits && (
        <EnterAOIUnitsDialog
          open={showAOIUnits}
          onOpenChange={(open) => {
            setShowAOIUnits(open);
            if (!open) onRefresh();
          }}
          paperStreamSubject={{
            id:                 streamSubject.id,
            studentEnrollments: enrollments,
            subjectPaper:       subjectPaper ?? null,
          }}
          maxUnits={maxAOIUnits}
          schoolId={schoolId}
          userId={userId}
        />
      )}
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// EXAM CARD
// ════════════════════════════════════════════════════════════════════════════

function ExamCard({
  exam,
  entered,
  total,
  onClick,
  disabled,
}: {
  exam:     { id: string; name: string; examType: string; maxMarks: number; date?: Date | null };
  entered:  number;
  total:    number;
  onClick:  () => void;
  disabled: boolean;
}) {
  const pct = total > 0 ? Math.round((entered / total) * 100) : 0;

  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 p-5 flex flex-col gap-4">
      <div className="flex items-start gap-3">
        <div className="p-2.5 bg-blue-100 dark:bg-blue-900/30 rounded-lg shrink-0">
          <FileText className="w-5 h-5 text-blue-600 dark:text-blue-400" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-slate-900 dark:text-white leading-tight">{exam.name}</p>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            {examLabel(exam.examType)} · Max: {exam.maxMarks} marks
          </p>
          {exam.date && (
            <p className="text-xs text-slate-400 mt-0.5">
              {new Date(exam.date).toLocaleDateString()}
            </p>
          )}
        </div>
      </div>

      {/* Progress bar */}
      <div>
        <div className="flex justify-between text-xs text-slate-500 dark:text-slate-400 mb-1.5">
          <span>{entered} of {total} entered</span>
          <span>{pct}%</span>
        </div>
        <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
          <div
            className="h-full bg-blue-500 rounded-full transition-all"
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>

      <Button
        size="sm"
        className="w-full bg-[#5B9BD5] hover:bg-[#4A8BC2] text-white"
        onClick={onClick}
        disabled={disabled}
      >
        <FileEdit className="h-4 w-4 mr-2" />
        {entered > 0 ? "Update Marks" : "Enter Marks"}
      </Button>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// GENERIC ACTION CARD (AOI scores / units)
// ════════════════════════════════════════════════════════════════════════════

function ActionCard({
  icon, iconBg, title, subtitle, progress, progressColor, onClick, buttonLabel, disabled,
}: {
  icon:          React.ReactNode;
  iconBg:        string;
  title:         string;
  subtitle:      string;
  progress:      number;
  progressColor: string;
  onClick:       () => void;
  buttonLabel:   string;
  disabled:      boolean;
}) {
  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 p-5 flex flex-col gap-4">
      <div className="flex items-start gap-3">
        <div className={`p-2.5 ${iconBg} rounded-lg shrink-0`}>{icon}</div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-slate-900 dark:text-white leading-tight">{title}</p>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{subtitle}</p>
        </div>
      </div>

      <div>
        <div className="flex justify-between text-xs text-slate-500 dark:text-slate-400 mb-1.5">
          <span>Progress</span>
          <span>{Math.round(progress)}%</span>
        </div>
        <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
          <div
            className={`h-full ${progressColor} rounded-full transition-all`}
            style={{ width: `${Math.min(progress, 100)}%` }}
          />
        </div>
      </div>

      <Button size="sm" variant="outline" className="w-full" onClick={onClick} disabled={disabled}>
        <FileEdit className="h-4 w-4 mr-2" />
        {buttonLabel}
      </Button>
    </div>
  );
}
