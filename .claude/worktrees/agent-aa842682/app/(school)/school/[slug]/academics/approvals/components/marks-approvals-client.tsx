// app/school/[slug]/academics/approvals/marks-approvals-client.tsx
"use client";

import { useState, useTransition, useCallback } from "react";
import { Button }     from "@/components/ui/button";
import { Badge }      from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea }   from "@/components/ui/textarea";
import { toast }      from "sonner";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  CheckCircle2, Circle, Clock, ChevronDown, ChevronRight,
  BookOpen, Users, ShieldCheck, Layers, AlertTriangle,
  Eye, X, Loader2, XCircle, ThumbsUp, ThumbsDown, RotateCcw, Lock, Unlock,
} from "lucide-react";
import {
  getStreamSubjectMarksDetail,
  approveStreamSubjectMarks,
  unapproveStreamSubjectMarks,
  approveStreamMarks,
  approveAoiTopicMarks,
  revokeAoiTopicMarks,
  approveExamTypeMarks,
  revokeExamTypeMarks,
} from "@/actions/marks-approval";
import {
  computeStreamSubjectResults,
  computeStreamResults,
  generateStreamReportCards,
} from "@/actions/result-computation";

// ── Types ─────────────────────────────────────────────────────────────────────

type SubjectEntry = {
  streamSubjectId: string;
  subjectName:     string;
  subjectCode:     string | null;
  paperName:       string | null;
  paperNumber:     number | null;
  totalStudents:   number;
  examDraft:       number; examSubmitted: number; examApproved: number;
  aoiDraft:        number; aoiSubmitted:  number; aoiApproved:  number;
  hasAnyMarks:     boolean;
  allApproved:     boolean;
};

type StreamEntry = { streamId: string; streamName: string; subjects: SubjectEntry[] };
type ClassEntry  = { classYearId: string; className: string; streams: StreamEntry[] };

type MarksDetailStudent = {
  enrollmentId: string;
  studentId:    string;
  admissionNo:  string;
  name:         string;
  gender:       string;
  examByType:   Record<string, { marksObtained: number; outOf: number; status: string }>;
  aoiByTopic:   Record<string, { score: number; status: string }>;
  unitByNum:    Record<number, { score: number | null; status: string }>;
  hasAny:       boolean;
  allApproved:  boolean;
  hasSubmitted: boolean;
  hasDraft:     boolean;
};

type MarksDetail = {
  streamSubjectId: string;
  subjectName:     string;
  subjectCode:     string | null;
  paperName:       string | null;
  paperNumber:     number | null;
  className:       string;
  streamName:      string;
  termName:        string;
  exams:     Array<{ id: string; name: string; examType: string; maxMarks: number }>;
  aoiTopics: Array<{ id: string; topicNumber: number; topicName: string; maxPoints: number }>;
  maxUnits:  number;
  students:  MarksDetailStudent[];
};

type Props = {
  data: { academicYear: string; termName: string; termId: string; classes: ClassEntry[] };
  approverId: string;
  schoolId:   string;
  slug:       string;
};

// ── Status helpers ────────────────────────────────────────────────────────────

function subjectStatus(s: SubjectEntry) {
  if (!s.hasAnyMarks)                       return "empty";
  if (s.allApproved)                        return "approved";
  if (s.examSubmitted + s.aoiSubmitted > 0) return "pending";
  if (s.examDraft    + s.aoiDraft    > 0)   return "draft";
  return "empty";
}

function streamStatus(stream: StreamEntry) {
  const ss = stream.subjects.map(subjectStatus);
  if (ss.every(s => s === "approved")) return "approved";
  if (ss.every(s => s === "empty"))    return "empty";
  if (ss.some(s  => s === "pending"))  return "pending";
  return "draft";
}

// ── Badge ─────────────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    approved: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 border-green-200 dark:border-green-800",
    pending:  "bg-blue-100  text-blue-800  dark:bg-blue-900  dark:text-blue-200  border-blue-200  dark:border-blue-800",
    draft:    "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 border-slate-200 dark:border-slate-700",
    empty:    "bg-slate-100 text-slate-400 dark:bg-slate-800/50 dark:text-slate-500 border-slate-200 dark:border-slate-700",
  };
  const labels: Record<string, string> = { approved: "Approved", pending: "Submitted", draft: "Draft", empty: "No marks" };
  return (
    <Badge variant="outline" className={`text-xs font-medium ${map[status] ?? map.empty}`}>
      {labels[status] ?? "—"}
    </Badge>
  );
}

// ── Mark cells ────────────────────────────────────────────────────────────────

function MarkCell({ value, outOf, status }: { value: number | null; outOf: number; status: string }) {
  if (value === null) return <span className="text-slate-300 dark:text-slate-600">—</span>;
  const pct   = Math.round((value / outOf) * 100);
  const color = status === "APPROVED"  ? "text-green-700 dark:text-green-400"
              : status === "SUBMITTED" ? "text-blue-700  dark:text-blue-400"
              :                          "text-slate-500 dark:text-slate-400";
  return (
    <span className={`font-mono tabular-nums text-sm font-semibold ${color}`}>
      {value}<span className="text-xs font-normal opacity-60">/{outOf}</span>
      <span className="ml-1 text-xs font-normal opacity-50">({pct}%)</span>
    </span>
  );
}

function AOICell({ value, maxPoints, status }: { value: number | null; maxPoints: number; status: string }) {
  if (value === null) return <span className="text-slate-300 dark:text-slate-600">—</span>;
  const color = status === "APPROVED"  ? "text-green-700 dark:text-green-400"
              : status === "SUBMITTED" ? "text-blue-700  dark:text-blue-400"
              :                          "text-slate-500 dark:text-slate-400";
  return (
    <span className={`font-mono tabular-nums text-sm font-semibold ${color}`}>
      {value.toFixed(2)}<span className="text-xs font-normal opacity-60">/{maxPoints}</span>
    </span>
  );
}

// ── Marks Review Dialog ───────────────────────────────────────────────────────

function MarksReviewDialog({
  open, detail, sub, approverId, schoolId, slug, onClose, onDone,
}: {
  open:       boolean;
  detail:     MarksDetail | null;
  sub:        SubjectEntry | null;
  approverId: string; schoolId: string; slug: string;
  onClose:    () => void;
  onDone:     () => void;
}) {
  const [isPending,    startTransition] = useTransition();
  const [step,         setStep]         = useState<"idle" | "approving" | "revoking" | "rejecting" | "computing">("idle");
  const [rejectReason, setRejectReason] = useState("");
  const [showReject,   setShowReject]   = useState(false);
  const [actionKey,    setActionKey]    = useState<string | null>(null);

  if (!detail || !sub) return null;

  const pendingCount = sub.examSubmitted + sub.aoiSubmitted;
  const hasExams  = detail.exams.length > 0;
  const hasTopics = detail.aoiTopics.length > 0;
  const hasUnits  = detail.maxUnits > 0;

  // Per-topic approval status
  const topicApprovalStatus = (topicId: string): "approved" | "submitted" | "draft" | "empty" => {
    const scores = detail.students.flatMap(s => { const sc = s.aoiByTopic[topicId]; return sc ? [sc.status] : []; });
    if (scores.length === 0) return "empty";
    if (scores.every(s => s === "APPROVED"))  return "approved";
    if (scores.some(s  => s === "SUBMITTED")) return "submitted";
    return "draft";
  };

  // Per-exam-type approval status
  const examApprovalStatus = (examType: string): "approved" | "submitted" | "draft" | "empty" => {
    const marks = detail.students.flatMap(s => { const em = s.examByType[examType]; return em ? [em.status] : []; });
    if (marks.length === 0) return "empty";
    if (marks.every(s => s === "APPROVED"))  return "approved";
    if (marks.some(s  => s === "SUBMITTED")) return "submitted";
    return "draft";
  };

  const handleApprove = () => {
    startTransition(async () => {
      setStep("approving");
      const r1 = await approveStreamSubjectMarks({ streamSubjectId: sub.streamSubjectId, approverId, schoolId, slug });
      if (!r1.ok) { toast.error(r1.message); setStep("idle"); return; }
      toast.success(r1.message);
      setStep("computing");
      const r2 = await computeStreamSubjectResults({ streamSubjectId: sub.streamSubjectId, slug });
      if (r2.ok) toast.success("Results computed");
      else       toast.error(`Approved — compute failed: ${r2.message}`);
      setStep("idle");
      onDone();
    });
  };

  const handleRevoke = () => {
    startTransition(async () => {
      setStep("revoking");
      const r = await unapproveStreamSubjectMarks({ streamSubjectId: sub.streamSubjectId, slug });
      if (!r.ok) { toast.error(r.message); setStep("idle"); return; }
      toast.success(r.message);
      setStep("idle");
      onDone();
    });
  };

  const handleApproveTopic = (topicId: string, label: string) => {
    const key = `topic-${topicId}`;
    setActionKey(key);
    startTransition(async () => {
      const r = await approveAoiTopicMarks({ aoiTopicId: topicId, streamSubjectId: sub.streamSubjectId, approverId, slug });
      if (!r.ok) toast.error(r.message); else toast.success(`${label} — ${r.message}`);
      setActionKey(null); onDone();
    });
  };

  const handleRevokeTopic = (topicId: string, label: string) => {
    const key = `topic-${topicId}`;
    setActionKey(key);
    startTransition(async () => {
      const r = await revokeAoiTopicMarks({ aoiTopicId: topicId, streamSubjectId: sub.streamSubjectId, slug });
      if (!r.ok) toast.error(r.message); else toast.success(`${label} — ${r.message}`);
      setActionKey(null); onDone();
    });
  };

  const handleApproveExam = (examType: string) => {
    const key = `exam-${examType}`;
    setActionKey(key);
    startTransition(async () => {
      const r = await approveExamTypeMarks({ examType, streamSubjectId: sub.streamSubjectId, approverId, slug });
      if (!r.ok) toast.error(r.message); else toast.success(r.message);
      setActionKey(null); onDone();
    });
  };

  const handleRevokeExam = (examType: string) => {
    const key = `exam-${examType}`;
    setActionKey(key);
    startTransition(async () => {
      const r = await revokeExamTypeMarks({ examType, streamSubjectId: sub.streamSubjectId, slug });
      if (!r.ok) toast.error(r.message); else toast.success(r.message);
      setActionKey(null); onDone();
    });
  };

  const handleReject = () => {
    if (!rejectReason.trim()) { toast.error("Please provide a rejection reason"); return; }
    startTransition(async () => {
      setStep("rejecting");
      toast.info("Marks rejected — teacher will be notified to correct and resubmit");
      setShowReject(false);
      setStep("idle");
      onDone();
    });
  };

  return (
    <Dialog open={open} onOpenChange={v => { if (!v) onClose(); }}>
      <DialogContent className="max-w-5xl w-full p-0 gap-0 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Blue header */}
        <div className="bg-blue-600 dark:bg-blue-700 px-6 py-4 shrink-0">
          <div className="flex items-start justify-between">
            <div>
              <DialogTitle className="text-base font-semibold text-white flex items-center gap-2">
                📋 {detail.subjectName}
                {detail.paperName && <span className="font-normal opacity-80">— Paper {detail.paperNumber}</span>}
              </DialogTitle>
              <p className="text-sm text-blue-100 mt-0.5">
                {detail.className} {detail.streamName} · {detail.termName} · {detail.students.length} students
              </p>
            </div>
          </div>
          {/* Stats bar */}
          <div className="flex items-center gap-4 mt-3 pt-3 border-t border-blue-500 flex-wrap">
            <span className="text-xs text-blue-100">
              <span className="font-semibold text-white">{sub.totalStudents}</span> students
            </span>
            {pendingCount > 0 && (
              <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 border-blue-200 dark:border-blue-700 text-xs">
                {pendingCount} submitted, awaiting approval
              </Badge>
            )}
            {sub.examApproved + sub.aoiApproved > 0 && (
              <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 text-xs">
                {sub.examApproved + sub.aoiApproved} already approved
              </Badge>
            )}
            {sub.examDraft + sub.aoiDraft > 0 && (
              <Badge className="bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300 text-xs">
                {sub.examDraft + sub.aoiDraft} draft
              </Badge>
            )}
          </div>
        </div>

        {/* No marks state */}
        {!sub.hasAnyMarks && (
          <div className="flex items-center gap-2 px-6 py-3 bg-slate-50 dark:bg-slate-800/50 border-b text-sm text-slate-500 shrink-0">
            <AlertTriangle className="h-4 w-4 text-amber-500" />
            No marks have been entered for this subject yet.
          </div>
        )}

        {/* Per-topic / per-exam granular approval controls */}
        {(hasTopics || hasExams) && (
          <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 shrink-0 space-y-2">
            {hasExams && (
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide w-20 shrink-0">Exams</span>
                {detail.exams.map(exam => {
                  const status     = examApprovalStatus(exam.examType);
                  const key        = `exam-${exam.examType}`;
                  const loading    = actionKey === key && isPending;
                  const isApproved = status === "approved";
                  const canApprove = status === "submitted";
                  return (
                    <div key={exam.id} className="flex items-center gap-1">
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full border ${
                        isApproved ? "bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800"
                        : canApprove ? "bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800"
                        : "bg-slate-100 text-slate-500 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700"
                      }`}>
                        {isApproved && <Lock className="h-2.5 w-2.5 inline mr-0.5" />}
                        {exam.examType}
                      </span>
                      {isApproved ? (
                        <button onClick={() => handleRevokeExam(exam.examType)} disabled={loading}
                          className="text-xs text-amber-600 hover:text-amber-700 dark:text-amber-400 underline underline-offset-2 disabled:opacity-50">
                          {loading ? <Loader2 className="h-3 w-3 animate-spin inline" /> : "unlock"}
                        </button>
                      ) : canApprove ? (
                        <button onClick={() => handleApproveExam(exam.examType)} disabled={loading}
                          className="text-xs text-blue-600 hover:text-blue-700 dark:text-blue-400 underline underline-offset-2 disabled:opacity-50">
                          {loading ? <Loader2 className="h-3 w-3 animate-spin inline" /> : "approve"}
                        </button>
                      ) : null}
                    </div>
                  );
                })}
              </div>
            )}
            {hasTopics && (
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide w-20 shrink-0">AOI Topics</span>
                {detail.aoiTopics.map(topic => {
                  const status     = topicApprovalStatus(topic.id);
                  const key        = `topic-${topic.id}`;
                  const loading    = actionKey === key && isPending;
                  const isApproved = status === "approved";
                  const canApprove = status === "submitted";
                  return (
                    <div key={topic.id} className="flex items-center gap-1">
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full border ${
                        isApproved ? "bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800"
                        : canApprove ? "bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800"
                        : "bg-slate-100 text-slate-500 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700"
                      }`} title={topic.topicName}>
                        {isApproved && <Lock className="h-2.5 w-2.5 inline mr-0.5" />}
                        AOI {topic.topicNumber}
                      </span>
                      {isApproved ? (
                        <button onClick={() => handleRevokeTopic(topic.id, `AOI ${topic.topicNumber}`)} disabled={loading}
                          className="text-xs text-amber-600 hover:text-amber-700 dark:text-amber-400 underline underline-offset-2 disabled:opacity-50">
                          {loading ? <Loader2 className="h-3 w-3 animate-spin inline" /> : "unlock"}
                        </button>
                      ) : canApprove ? (
                        <button onClick={() => handleApproveTopic(topic.id, `AOI ${topic.topicNumber}`)} disabled={loading}
                          className="text-xs text-blue-600 hover:text-blue-700 dark:text-blue-400 underline underline-offset-2 disabled:opacity-50">
                          {loading ? <Loader2 className="h-3 w-3 animate-spin inline" /> : "approve"}
                        </button>
                      ) : null}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Mark sheet table */}
        <ScrollArea className="flex-1 min-h-0">
          <div className="p-4">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="border-b-2 border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-950/30">
                  <th className="text-left py-2.5 px-3 text-xs font-semibold text-blue-700 dark:text-blue-300 uppercase tracking-wide">#</th>
                  <th className="text-left py-2.5 px-3 text-xs font-semibold text-blue-700 dark:text-blue-300 uppercase tracking-wide whitespace-nowrap">Student</th>
                  <th className="text-left py-2.5 px-3 text-xs font-semibold text-blue-700 dark:text-blue-300 uppercase tracking-wide whitespace-nowrap">Adm No</th>
                  {hasExams && detail.exams.map(exam => (
                    <th key={exam.id} className="text-center py-2.5 px-3 text-xs font-semibold text-blue-700 dark:text-blue-300 uppercase tracking-wide whitespace-nowrap">
                      <span className="flex items-center justify-center gap-1">
                        {examApprovalStatus(exam.examType) === "approved" && <Lock className="h-3 w-3 text-green-500" />}
                        {exam.examType}
                      </span>
                      <span className="block font-normal normal-case opacity-60">/{exam.maxMarks}</span>
                    </th>
                  ))}
                  {hasTopics && detail.aoiTopics.map(topic => (
                    <th key={topic.id} className="text-center py-2.5 px-3 text-xs font-semibold text-blue-700 dark:text-blue-300 uppercase tracking-wide whitespace-nowrap">
                      <span className="flex items-center justify-center gap-1">
                        {topicApprovalStatus(topic.id) === "approved" && <Lock className="h-3 w-3 text-green-500" />}
                        AOI {topic.topicNumber}
                      </span>
                      <span className="block font-normal normal-case opacity-60 max-w-[80px] truncate">{topic.topicName}</span>
                    </th>
                  ))}
                  {hasUnits && Array.from({ length: detail.maxUnits }, (_, i) => i + 1).map(n => (
                    <th key={`u${n}`} className="text-center py-2.5 px-3 text-xs font-semibold text-blue-700 dark:text-blue-300 uppercase tracking-wide">U{n}</th>
                  ))}
                  <th className="text-center py-2.5 px-3 text-xs font-semibold text-blue-700 dark:text-blue-300 uppercase tracking-wide">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {detail.students.map((student, i) => (
                  <tr key={student.enrollmentId} className={`transition-colors ${
                    student.allApproved  ? "bg-green-50/50 dark:bg-green-900/10" :
                    student.hasSubmitted ? "bg-blue-50/40 dark:bg-blue-900/10 hover:bg-blue-50 dark:hover:bg-blue-900/20" :
                                          "hover:bg-slate-50 dark:hover:bg-slate-800/30"
                  }`}>
                    <td className="py-3 px-3 text-slate-400 text-xs tabular-nums">{i + 1}</td>
                    <td className="py-3 px-3 font-medium text-slate-800 dark:text-slate-200 whitespace-nowrap">{student.name}</td>
                    <td className="py-3 px-3 font-mono text-xs text-slate-500 whitespace-nowrap">{student.admissionNo}</td>
                    {hasExams && detail.exams.map(exam => {
                      const em = student.examByType[exam.examType];
                      return (
                        <td key={exam.id} className="py-3 px-3 text-center whitespace-nowrap">
                          {em ? <MarkCell value={em.marksObtained} outOf={em.outOf} status={em.status} />
                              : <span className="text-slate-300 dark:text-slate-600 text-xs">—</span>}
                        </td>
                      );
                    })}
                    {hasTopics && detail.aoiTopics.map(topic => {
                      const sc = student.aoiByTopic[topic.id];
                      return (
                        <td key={topic.id} className="py-3 px-3 text-center whitespace-nowrap">
                          {sc ? <AOICell value={sc.score} maxPoints={topic.maxPoints} status={sc.status} />
                              : <span className="text-slate-300 dark:text-slate-600 text-xs">—</span>}
                        </td>
                      );
                    })}
                    {hasUnits && Array.from({ length: detail.maxUnits }, (_, i) => i + 1).map(n => {
                      const u = student.unitByNum[n];
                      return (
                        <td key={`u${n}`} className="py-3 px-3 text-center whitespace-nowrap">
                          {u?.score != null ? <AOICell value={u.score} maxPoints={3} status={u.status} />
                                            : <span className="text-slate-300 dark:text-slate-600 text-xs">—</span>}
                        </td>
                      );
                    })}
                    <td className="py-3 px-3 text-center whitespace-nowrap">
                      {student.allApproved  ? <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 text-xs border-green-200 dark:border-green-800">✓ Approved</Badge>
                      : student.hasSubmitted ? <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 text-xs border-blue-200 dark:border-blue-800">Submitted</Badge>
                      : student.hasDraft    ? <Badge className="bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400 text-xs">Draft</Badge>
                      :                       <span className="text-slate-300 dark:text-slate-600 text-xs">—</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </ScrollArea>

        {/* Reject reason input */}
        {showReject && (
          <div className="px-6 py-4 border-t border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 shrink-0">
            <p className="text-sm font-semibold text-red-700 dark:text-red-400 mb-2">Rejection Reason</p>
            <Textarea
              value={rejectReason}
              onChange={e => setRejectReason(e.target.value)}
              placeholder="Explain why these marks are being rejected…"
              rows={3}
              className="border-red-300 dark:border-red-700 focus-visible:ring-red-500 text-sm"
            />
            <div className="flex gap-2 mt-3">
              <Button size="sm" onClick={handleReject} disabled={isPending}
                className="bg-red-600 hover:bg-red-700 text-white">
                {isPending && step === "rejecting" ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <XCircle className="h-4 w-4 mr-1" />}
                Confirm Reject
              </Button>
              <Button size="sm" variant="outline" onClick={() => { setShowReject(false); setRejectReason(""); }}>
                Cancel
              </Button>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 shrink-0">
          <div className="text-sm text-slate-500 dark:text-slate-400">
            {sub.allApproved
              ? <span className="flex items-center gap-1.5 text-green-600 dark:text-green-400 font-medium"><CheckCircle2 className="h-4 w-4" /> All marks approved and locked</span>
              : <><strong className="text-slate-700 dark:text-slate-200">{detail.students.length}</strong> students · <strong className="text-blue-600 dark:text-blue-400">{pendingCount}</strong> pending</>
            }
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={onClose} disabled={isPending}>Close</Button>
            {sub.allApproved && (
              <Button size="sm" variant="outline"
                className="border-amber-300 dark:border-amber-700 text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-900/20"
                disabled={isPending} onClick={handleRevoke}>
                {isPending && step === "revoking"
                  ? <Loader2 className="h-4 w-4 animate-spin mr-1.5" />
                  : <RotateCcw className="h-4 w-4 mr-1.5" />}
                Revoke All
              </Button>
            )}
            {!sub.allApproved && pendingCount > 0 && !showReject && (
              <>
                <Button size="sm" variant="outline"
                  className="border-red-300 dark:border-red-700 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
                  disabled={isPending} onClick={() => setShowReject(true)}>
                  <ThumbsDown className="h-4 w-4 mr-1.5" /> Reject
                </Button>
                <Button size="sm" disabled={isPending}
                  className="bg-blue-600 hover:bg-blue-700 text-white min-w-[160px] rounded-lg px-4 py-2"
                  onClick={handleApprove}>
                  {isPending ? (
                    <span className="flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      {step === "computing" ? "Computing…" : "Approving…"}
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      <ThumbsUp className="h-4 w-4" /> Approve All ({pendingCount})
                    </span>
                  )}
                </Button>
              </>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────

export default function MarksApprovalsClient({ data, approverId, schoolId, slug }: Props) {
  const [expandedClasses, setExpandedClasses] = useState<Set<string>>(
    new Set(data.classes.map(c => c.classYearId))
  );
  const [expandedStreams, setExpandedStreams] = useState<Set<string>>(() => {
    const s = new Set<string>();
    data.classes.forEach(c => c.streams.forEach(st => { if (streamStatus(st) === "pending") s.add(st.streamId); }));
    return s;
  });

  const [reviewSubject,  setReviewSubject]  = useState<SubjectEntry | null>(null);
  const [reviewDetail,   setReviewDetail]   = useState<MarksDetail | null>(null);
  const [dialogOpen,     setDialogOpen]     = useState(false);
  const [loadingReview,  setLoadingReview]  = useState<string | null>(null);
  const [isPending,      startTransition]   = useTransition();
  const [loadingKey,     setLoadingKey]     = useState<string | null>(null);

  const toggleClass  = (id: string) => setExpandedClasses(p => { const n = new Set(p); n.has(id) ? n.delete(id) : n.add(id); return n; });
  const toggleStream = (id: string) => setExpandedStreams(p => { const n = new Set(p); n.has(id) ? n.delete(id) : n.add(id); return n; });

  const openReview = async (sub: SubjectEntry) => {
    if (loadingReview) return;
    setLoadingReview(sub.streamSubjectId);
    const result = await getStreamSubjectMarksDetail(sub.streamSubjectId);
    setLoadingReview(null);
    if (!result.ok || !result.data) { toast.error(result.message ?? "Failed to load marks"); return; }
    setReviewSubject(sub);
    setReviewDetail(result.data as MarksDetail);
    setDialogOpen(true);
  };

  const closeReview = () => { setDialogOpen(false); setReviewSubject(null); setReviewDetail(null); };

  const handleApproveStream = (streamId: string, streamName: string) => {
    const key = `stream-${streamId}`;
    setLoadingKey(key);
    startTransition(async () => {
      const r1 = await approveStreamMarks({ streamId, termId: data.termId, approverId, schoolId, slug });
      if (!r1.ok) { toast.error(r1.message); setLoadingKey(null); return; }
      toast.success(`${streamName} — ${r1.message}`);
      const r2 = await computeStreamResults({ streamId, termId: data.termId, slug });
      const r3 = await generateStreamReportCards({ streamId, termId: data.termId, slug });
      if (r2.ok && r3.ok) toast.success("Results computed & report cards generated");
      setLoadingKey(null);
    });
  };

  // Summary
  let total = 0, approved = 0, pending = 0;
  data.classes.forEach(c => c.streams.forEach(s => s.subjects.forEach(sub => {
    total++;
    const st = subjectStatus(sub);
    if (st === "approved") approved++;
    if (st === "pending")  pending++;
  })));

  return (
    <div className="flex flex-col h-full space-y-0">

      {/* ── Header ───────────────────────────────────────────────────────── */}
      <div className="bg-blue-600 dark:bg-blue-700 px-5 py-4 rounded-t-xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-white" />
            <div>
              <h1 className="font-bold text-white">Marks Approvals</h1>
              <p className="text-xs text-blue-100">{data.academicYear} · {data.termName}</p>
            </div>
          </div>
          <div className="flex gap-2">
            <span className="text-xs px-2.5 py-1 bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 rounded-full font-medium">{pending} submitted</span>
            <span className="text-xs px-2.5 py-1 bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 rounded-full font-medium">{approved} approved</span>
          </div>
        </div>
      </div>

      {/* ── Subject list ─────────────────────────────────────────────────── */}
      <div className="bg-white dark:bg-gray-900 rounded-b-xl border border-slate-200 dark:border-slate-700 border-t-0 overflow-hidden">
        <ScrollArea className="h-[calc(100vh-16rem)]">
          {data.classes.length === 0 && (
            <div className="text-center py-16 text-slate-400">
              <Layers className="h-8 w-8 mx-auto mb-2 opacity-40" />
              <p className="text-sm">No subjects for active term</p>
            </div>
          )}

          {data.classes.map((cls) => {
            const clsExpanded = expandedClasses.has(cls.classYearId);
            const clsPending  = cls.streams.flatMap(s => s.subjects).filter(s => subjectStatus(s) === "pending").length;

            return (
              <div key={cls.classYearId} className="border-b border-slate-100 dark:border-slate-800 last:border-0">
                <button
                  onClick={() => toggleClass(cls.classYearId)}
                  className="w-full flex items-center gap-2 px-4 py-3 bg-slate-50 dark:bg-slate-800/60 hover:bg-slate-100 dark:hover:bg-slate-800 text-left transition-colors"
                >
                  {clsExpanded ? <ChevronDown className="h-3.5 w-3.5 text-slate-400" /> : <ChevronRight className="h-3.5 w-3.5 text-slate-400" />}
                  <BookOpen className="h-3.5 w-3.5 text-blue-500" />
                  <span className="font-semibold text-slate-800 dark:text-slate-200 text-sm flex-1">{cls.className}</span>
                  {clsPending > 0 && <span className="text-xs font-medium text-blue-600 dark:text-blue-400">{clsPending} pending</span>}
                </button>

                {clsExpanded && cls.streams.map(stream => {
                  const sStatus   = streamStatus(stream);
                  const sExpanded = expandedStreams.has(stream.streamId);
                  const sPending  = stream.subjects.filter(s => subjectStatus(s) === "pending").length;
                  const sKey      = `stream-${stream.streamId}`;

                  return (
                    <div key={stream.streamId} className="border-b border-slate-50 dark:border-slate-800/50 last:border-0">
                      <div className="flex items-center px-5 py-2.5 bg-white dark:bg-gray-900 gap-2">
                        <button onClick={() => toggleStream(stream.streamId)}
                          className="flex items-center gap-1.5 flex-1 text-left min-w-0">
                          {sExpanded ? <ChevronDown className="h-3 w-3 text-slate-400" /> : <ChevronRight className="h-3 w-3 text-slate-400" />}
                          <Users className="h-3 w-3 text-slate-400 shrink-0" />
                          <span className="text-sm text-slate-700 dark:text-slate-300 truncate font-medium">
                            {cls.className} {stream.streamName}
                          </span>
                          <StatusBadge status={sStatus} />
                        </button>
                        {sPending > 0 && (
                          <Button size="sm" variant="ghost"
                            className="text-xs h-6 px-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-900/20 shrink-0"
                            disabled={isPending && loadingKey === sKey}
                            onClick={() => handleApproveStream(stream.streamId, `${cls.className} ${stream.streamName}`)}>
                            {isPending && loadingKey === sKey
                              ? <Loader2 className="h-3 w-3 animate-spin" />
                              : "Approve all"
                            }
                          </Button>
                        )}
                      </div>

                      {sExpanded && stream.subjects.map(sub => {
                        const st        = subjectStatus(sub);
                        const isLoading = loadingReview === sub.streamSubjectId;
                        const label     = sub.paperName ? `${sub.subjectName} P${sub.paperNumber}` : sub.subjectName;
                        const pend      = sub.examSubmitted + sub.aoiSubmitted;

                        return (
                          <button key={sub.streamSubjectId}
                            onClick={() => openReview(sub)}
                            disabled={isLoading}
                            className="w-full flex items-center gap-2.5 px-8 py-3 text-left transition-colors border-b border-slate-50 dark:border-slate-800/30 last:border-0 bg-white dark:bg-gray-900 hover:bg-slate-50 dark:hover:bg-slate-800/30"
                          >
                            {isLoading
                              ? <Loader2 className="h-3.5 w-3.5 animate-spin text-blue-500 shrink-0" />
                              : st === "approved" ? <CheckCircle2 className="h-3.5 w-3.5 text-green-500 shrink-0" />
                              : st === "pending"  ? <Clock        className="h-3.5 w-3.5 text-blue-500 shrink-0" />
                              : st === "draft"    ? <AlertTriangle className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                              :                     <Circle        className="h-3.5 w-3.5 text-slate-300 dark:text-slate-600 shrink-0" />
                            }
                            <div className="flex-1 min-w-0">
                              <p className="text-sm truncate font-medium text-slate-700 dark:text-slate-300">{label}</p>
                              <p className="text-xs text-slate-400 mt-0.5">
                                {sub.totalStudents} students
                                {pend > 0 && <span className="ml-1.5 text-blue-600 dark:text-blue-400 font-medium">· {pend} submitted</span>}
                                {sub.allApproved && <span className="ml-1.5 text-green-600 dark:text-green-400">· ✓ approved</span>}
                              </p>
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                              <StatusBadge status={st} />
                              <Eye className="h-3.5 w-3.5 text-slate-300 dark:text-slate-600" />
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  );
                })}
              </div>
            );
          })}
        </ScrollArea>

        {/* Legend */}
        <div className="px-4 py-3 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/30 flex flex-wrap gap-x-4 gap-y-1">
          <p className="text-xs text-slate-400 flex items-center gap-1.5"><Clock className="h-3 w-3 text-blue-400" /> Submitted = awaiting review</p>
          <p className="text-xs text-slate-400 flex items-center gap-1.5"><AlertTriangle className="h-3 w-3 text-slate-400" /> Draft = not yet submitted</p>
          <p className="text-xs text-slate-400 flex items-center gap-1.5"><CheckCircle2 className="h-3 w-3 text-green-400" /> Approved = locked</p>
        </div>
      </div>

      {/* ── Review Dialog ─────────────────────────────────────────────────── */}
      <MarksReviewDialog
        open={dialogOpen}
        detail={reviewDetail}
        sub={reviewSubject}
        approverId={approverId}
        schoolId={schoolId}
        slug={slug}
        onClose={closeReview}
        onDone={closeReview}
      />
    </div>
  );
}
