// app/school/[slug]/academics/streams/[streamId]/subjects/[subjectId]/components/subject-students-tab.tsx
"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Search,
  MoreVertical,
  TrendingUp,
  Minus,
  TrendingDown,
  Award,
  UserX,
  UserCheck,
  ExternalLink,
  Download,
} from "lucide-react";
import Link from "next/link";
import EnrollStudentsDialog from "./enroll-students-dialog";
import {
  unenrollStudentsFromSubject,
  updateSubjectEnrollmentStatus,
} from "@/actions/subject-management";
import { toast } from "sonner";
import * as XLSX from "xlsx";

// ── Helpers ────────────────────────────────────────────────────────────────

function computeContributions(summary: any, cfg: any, actualTopicCount: number) {
  if (!cfg || !summary) return { aoiContrib: null, summativeContrib: null };

  const aoiMaxPoints   = cfg.aoiMaxPoints ?? 3;
  // Use actual topic count, not cfg.maxAOICount — students should not be
  // penalised for topics that haven't been created yet.
  const maxAOIPossible = actualTopicCount * aoiMaxPoints;
  const aoiContrib: number | null =
    maxAOIPossible > 0 && summary.aoiTotal > 0
      ? (summary.aoiTotal / maxAOIPossible) * (cfg.aoiWeight ?? 20)
      : null;

  const summativeWeight = 100 - (cfg.aoiWeight ?? 20);
  const activeExams: Array<{ mark: number; weight: number }> = [];
  if (cfg.hasBOT && summary.bot !== null && summary.bot !== undefined)
    activeExams.push({ mark: summary.bot, weight: cfg.botWeight ?? 0 });
  if (cfg.hasMTE && summary.mte !== null && summary.mte !== undefined)
    activeExams.push({ mark: summary.mte, weight: cfg.mteWeight ?? 0 });
  if (cfg.hasEOT && summary.eot !== null && summary.eot !== undefined)
    activeExams.push({ mark: summary.eot, weight: cfg.eotWeight ?? 0 });

  let summativeContrib: number | null = null;
  if (activeExams.length > 0) {
    const totalW = activeExams.reduce((s, e) => s + e.weight, 0);
    const weightedAvg = totalW > 0
      ? activeExams.reduce((s, e) => s + e.mark * e.weight, 0) / totalW
      : 0;
    summativeContrib = (weightedAvg / 100) * summativeWeight;
  }

  return { aoiContrib, summativeContrib };
}

function getUCEGrade(mark: number) {
  if (mark >= 80) return { grade: "D1", color: "text-emerald-600" };
  if (mark >= 70) return { grade: "D2", color: "text-green-600" };
  if (mark >= 65) return { grade: "C3", color: "text-teal-600" };
  if (mark >= 60) return { grade: "C4", color: "text-blue-600" };
  if (mark >= 55) return { grade: "C5", color: "text-blue-600" };
  if (mark >= 50) return { grade: "C6", color: "text-blue-600" };
  if (mark >= 45) return { grade: "P7", color: "text-yellow-600" };
  if (mark >= 40) return { grade: "P8", color: "text-orange-600" };
  return { grade: "F9", color: "text-red-600" };
}

function getPerformanceIcon(mark: number) {
  if (mark >= 70) return <TrendingUp className="h-4 w-4 text-green-600" />;
  if (mark >= 50) return <Minus className="h-4 w-4 text-yellow-600" />;
  return <TrendingDown className="h-4 w-4 text-red-600" />;
}

// ────────────────────────────────────────────────────────────────────────────

interface SubjectStudentsTabProps {
  streamSubject: any;
  schoolSlug:    string;
  schoolId:      string;
  marksData:     any | null;
  onRefresh:     () => void;
  isTeacher:     boolean;
}

export default function SubjectStudentsTab({
  streamSubject,
  schoolSlug,
  schoolId,
  marksData,
  onRefresh,
  isTeacher,
}: SubjectStudentsTabProps) {
  const [searchTerm,     setSearchTerm]     = useState("");
  const [statusFilter,   setStatusFilter]   = useState<string>("all");
  const [updatingStatus, setUpdatingStatus] = useState<string | null>(null);

  // Build a fast lookup: enrollmentId → studentSummary (live computed values)
  const summaryMap = new Map<string, any>();
  if (marksData?.studentSummaries) {
    for (const s of marksData.studentSummaries) {
      summaryMap.set(s.enrollmentId, s);
    }
  }
  const cfg              = marksData?.assessmentConfig ?? null;
  const aoiTopicCount    = (marksData?.aoiTopics?.length ?? 0) as number;
  const aoiWeight        = cfg?.aoiWeight ?? 20;
  const summativeWeight  = 100 - aoiWeight;

  // Sort students by live totalMark (descending)
  const sortedStudents = [...streamSubject.studentEnrollments].sort((a, b) => {
    const markA = summaryMap.get(a.id)?.totalMark ?? a.subjectResult?.totalMark ?? 0;
    const markB = summaryMap.get(b.id)?.totalMark ?? b.subjectResult?.totalMark ?? 0;
    return markB - markA;
  });

  const filteredStudents = sortedStudents.filter((enrollment) => {
    const student = enrollment.enrollment.student;
    const searchLower = searchTerm.toLowerCase();
    const matchesSearch =
      student.firstName.toLowerCase().includes(searchLower) ||
      student.lastName.toLowerCase().includes(searchLower) ||
      student.admissionNo.toLowerCase().includes(searchLower);
    const matchesStatus =
      statusFilter === "all" || enrollment.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleUnenroll = async (enrollmentId: string, studentName: string) => {
    if (!confirm(`Are you sure you want to unenroll ${studentName} from this subject?`)) return;
    try {
      const result = await unenrollStudentsFromSubject({
        studentSubjectEnrollmentIds: [enrollmentId],
        schoolId,
      });
      if (result.ok) { toast.success(result.message); onRefresh(); }
      else toast.error(result.message);
    } catch {
      toast.error("Failed to unenroll student");
    }
  };

  const handleStatusChange = async (
    enrollmentId: string,
    status: "ACTIVE" | "DROPPED" | "COMPLETED"
  ) => {
    setUpdatingStatus(enrollmentId);
    try {
      const result = await updateSubjectEnrollmentStatus({
        studentSubjectEnrollmentId: enrollmentId,
        status,
        schoolId,
      });
      if (result.ok) { toast.success(result.message); onRefresh(); }
      else toast.error(result.message);
    } catch {
      toast.error("Failed to update status");
    } finally {
      setUpdatingStatus(null);
    }
  };

  // Stats
  const totalStudents     = streamSubject.studentEnrollments.length;
  const activeStudents    = streamSubject.studentEnrollments.filter((e: any) => e.status === "ACTIVE").length;
  const droppedStudents   = streamSubject.studentEnrollments.filter((e: any) => e.status === "DROPPED").length;
  const completedStudents = streamSubject.studentEnrollments.filter((e: any) => e.status === "COMPLETED").length;

  const subjectLabel = streamSubject.subject?.name +
    (streamSubject.subjectPaper ? ` - ${streamSubject.subjectPaper.name}` : "");

  const exportEnrolledStudents = () => {
    const rows = sortedStudents.map((enrollment, index) => {
      const student = enrollment.enrollment.student;
      return {
        Rank: index + 1,
        "Admission No": student.admissionNo,
        "First Name": student.firstName,
        "Last Name": student.lastName,
        Type: enrollment.isCompulsory ? "Compulsory" : "Optional",
        Status: enrollment.status,
      };
    });
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Enrolled Students");
    XLSX.writeFile(wb, `${subjectLabel} - Enrolled Students.xlsx`);
  };

  const exportMarksSummary = () => {
    const rows = sortedStudents.map((enrollment, index) => {
      const student = enrollment.enrollment.student;
      const summary = summaryMap.get(enrollment.id);
      const { aoiContrib, summativeContrib } = computeContributions(summary, cfg, aoiTopicCount);
      const totalMark = summary?.totalMark ?? null;
      const grade = totalMark !== null ? getUCEGrade(totalMark).grade : "—";
      return {
        Rank: index + 1,
        "Admission No": student.admissionNo,
        "First Name": student.firstName,
        "Last Name": student.lastName,
        [`AOI (/${aoiWeight})`]: aoiContrib !== null ? parseFloat(aoiContrib.toFixed(1)) : "",
        [`Exam (/${summativeWeight})`]: summativeContrib !== null ? parseFloat(summativeContrib.toFixed(1)) : "",
        "Total (%)": totalMark !== null ? parseFloat(totalMark.toFixed(1)) : "",
        Grade: grade,
        "Draft?": summary?.isDraft ? "Yes" : "No",
      };
    });
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Marks Summary");
    XLSX.writeFile(wb, `${subjectLabel} - Marks Summary.xlsx`);
  };

  return (
    <div className="space-y-6">
      {/* Header with Actions */}
      <div className="flex items-center justify-between">
        <div className="grid gap-3 grid-cols-4">
          <Card className="border-slate-200 dark:border-slate-700">
            <CardContent className="pt-4">
              <p className="text-sm text-slate-600 dark:text-slate-400">Total</p>
              <p className="text-2xl font-bold text-slate-900 dark:text-white">{totalStudents}</p>
            </CardContent>
          </Card>
          <Card className="border-slate-200 dark:border-slate-700">
            <CardContent className="pt-4">
              <p className="text-sm text-green-600 dark:text-green-400">Active</p>
              <p className="text-2xl font-bold text-green-700 dark:text-green-400">{activeStudents}</p>
            </CardContent>
          </Card>
          <Card className="border-slate-200 dark:border-slate-700">
            <CardContent className="pt-4">
              <p className="text-sm text-red-600 dark:text-red-400">Dropped</p>
              <p className="text-2xl font-bold text-red-700 dark:text-red-400">{droppedStudents}</p>
            </CardContent>
          </Card>
          <Card className="border-slate-200 dark:border-slate-700">
            <CardContent className="pt-4">
              <p className="text-sm text-blue-600 dark:text-blue-400">Completed</p>
              <p className="text-2xl font-bold text-blue-700 dark:text-blue-400">{completedStudents}</p>
            </CardContent>
          </Card>
        </div>

        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={exportEnrolledStudents}>
                <Download className="h-4 w-4 mr-2" />
                Enrolled Students List
              </DropdownMenuItem>
              <DropdownMenuItem onClick={exportMarksSummary}>
                <Download className="h-4 w-4 mr-2" />
                Marks Summary
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <EnrollStudentsDialog
            streamSubjectId={streamSubject.id}
            schoolId={schoolId}
            subjectName={streamSubject.subject.name}
            onSuccess={onRefresh}
          />
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by name or admission number..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-4 py-2 border rounded-md bg-white dark:bg-slate-800"
        >
          <option value="all">All Status</option>
          <option value="ACTIVE">Active</option>
          <option value="DROPPED">Dropped</option>
          <option value="COMPLETED">Completed</option>
        </select>
      </div>

      {/* Students Table */}
      <Card>
        <CardHeader>
          <CardTitle>Enrolled Students ({filteredStudents.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {filteredStudents.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              {searchTerm || statusFilter !== "all"
                ? "No students found matching your filters"
                : "No students enrolled yet"}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-3 text-sm font-medium text-slate-600 dark:text-slate-400">Rank</th>
                    <th className="text-left p-3 text-sm font-medium text-slate-600 dark:text-slate-400">Adm No</th>
                    <th className="text-left p-3 text-sm font-medium text-slate-600 dark:text-slate-400">Student</th>
                    <th className="text-left p-3 text-sm font-medium text-slate-600 dark:text-slate-400">Type</th>
                    <th className="text-left p-3 text-sm font-medium text-slate-600 dark:text-slate-400">Status</th>
                    <th className="text-right p-3 text-sm font-medium text-slate-600 dark:text-slate-400">
                      AOI ({aoiWeight})
                    </th>
                    <th className="text-right p-3 text-sm font-medium text-slate-600 dark:text-slate-400">
                      Exam ({summativeWeight})
                    </th>
                    <th className="text-right p-3 text-sm font-medium text-slate-600 dark:text-slate-400">Total</th>
                    <th className="text-center p-3 text-sm font-medium text-slate-600 dark:text-slate-400">Grade</th>
                    <th className="text-center p-3 text-sm font-medium text-slate-600 dark:text-slate-400">Trend</th>
                    <th className="text-center p-3 text-sm font-medium text-slate-600 dark:text-slate-400">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredStudents.map((enrollment, index) => {
                    const student = enrollment.enrollment.student;
                    const summary = summaryMap.get(enrollment.id);
                    const { aoiContrib, summativeContrib } = computeContributions(summary, cfg, aoiTopicCount);
                    const totalMark = summary?.totalMark ?? null;
                    const { grade, color } = totalMark !== null ? getUCEGrade(totalMark) : { grade: "—", color: "text-slate-400" };

                    return (
                      <tr
                        key={enrollment.id}
                        className="border-b hover:bg-slate-50 dark:hover:bg-slate-800/50"
                      >
                        <td className="p-3">
                          <div className="flex items-center gap-2">
                            {index < 3 && totalMark !== null && (
                              <Award
                                className={`h-4 w-4 ${
                                  index === 0
                                    ? "text-yellow-500"
                                    : index === 1
                                    ? "text-slate-400"
                                    : "text-orange-600"
                                }`}
                              />
                            )}
                            <span className="font-medium">{index + 1}</span>
                          </div>
                        </td>
                        <td className="p-3">
                          <span className="text-sm font-mono">{student.admissionNo}</span>
                        </td>
                        <td className="p-3">
                          <p className="font-medium text-slate-900 dark:text-white">
                            {student.firstName} {student.lastName}
                          </p>
                        </td>
                        <td className="p-3">
                          <Badge
                            variant="outline"
                            className={
                              enrollment.isCompulsory
                                ? "border-green-200 bg-green-50 text-green-700"
                                : "border-blue-200 bg-blue-50 text-blue-700"
                            }
                          >
                            {enrollment.isCompulsory ? "Compulsory" : "Optional"}
                          </Badge>
                        </td>
                        <td className="p-3">
                          <Badge
                            className={
                              enrollment.status === "ACTIVE"
                                ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                                : enrollment.status === "DROPPED"
                                ? "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400"
                                : "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400"
                            }
                          >
                            {enrollment.status}
                          </Badge>
                        </td>

                        {/* AOI contribution */}
                        <td className="p-3 text-right">
                          {aoiContrib !== null ? (
                            <span className="font-medium text-blue-700 dark:text-blue-400 tabular-nums">
                              {aoiContrib.toFixed(1)}
                              <span className="text-xs text-slate-400">/{aoiWeight}</span>
                              {summary?.isDraft && (
                                <span className="ml-1 text-xs text-amber-500 font-normal">(d)</span>
                              )}
                            </span>
                          ) : (
                            <span className="text-slate-400">-</span>
                          )}
                        </td>

                        {/* Exam (summative) contribution */}
                        <td className="p-3 text-right">
                          {summativeContrib !== null ? (
                            <span className="font-medium text-blue-700 dark:text-blue-400 tabular-nums">
                              {summativeContrib.toFixed(1)}
                              <span className="text-xs text-slate-400">/{summativeWeight}</span>
                              {summary?.isDraft && (
                                <span className="ml-1 text-xs text-amber-500 font-normal">(d)</span>
                              )}
                            </span>
                          ) : (
                            <span className="text-slate-400">-</span>
                          )}
                        </td>

                        {/* Total */}
                        <td className="p-3 text-right">
                          {totalMark !== null ? (
                            <span className={`font-bold tabular-nums ${summary?.isDraft ? "text-amber-600 dark:text-amber-400" : "text-slate-900 dark:text-white"}`}>
                              {totalMark.toFixed(1)}%
                            </span>
                          ) : (
                            <span className="text-slate-400">-</span>
                          )}
                        </td>

                        {/* Grade */}
                        <td className="p-3 text-center">
                          {totalMark !== null ? (
                            <Badge className={`${color} bg-transparent border text-xs font-semibold`}>
                              {grade}
                            </Badge>
                          ) : (
                            <span className="text-slate-400 text-xs">—</span>
                          )}
                        </td>

                        {/* Performance trend */}
                        <td className="p-3 text-center">
                          {totalMark !== null ? getPerformanceIcon(totalMark) : <Minus className="h-4 w-4 text-slate-300 mx-auto" />}
                        </td>

                        {/* Actions */}
                        <td className="p-3 text-center">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                disabled={updatingStatus === enrollment.id}
                              >
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem asChild>
                                <Link
                                  href={`/school/${schoolSlug}/users/students/${student.id}`}
                                  className="flex items-center gap-2"
                                >
                                  <ExternalLink className="h-4 w-4" />
                                  View Student
                                </Link>
                              </DropdownMenuItem>

                              {enrollment.status !== "ACTIVE" && (
                                <DropdownMenuItem onClick={() => handleStatusChange(enrollment.id, "ACTIVE")}>
                                  <UserCheck className="h-4 w-4 mr-2" />
                                  Mark as Active
                                </DropdownMenuItem>
                              )}
                              {enrollment.status !== "DROPPED" && (
                                <DropdownMenuItem onClick={() => handleStatusChange(enrollment.id, "DROPPED")}>
                                  <UserX className="h-4 w-4 mr-2" />
                                  Mark as Dropped
                                </DropdownMenuItem>
                              )}
                              {enrollment.status !== "COMPLETED" && (
                                <DropdownMenuItem onClick={() => handleStatusChange(enrollment.id, "COMPLETED")}>
                                  <UserCheck className="h-4 w-4 mr-2" />
                                  Mark as Completed
                                </DropdownMenuItem>
                              )}

                              <DropdownMenuItem
                                onClick={() => handleUnenroll(enrollment.id, `${student.firstName} ${student.lastName}`)}
                                className="text-red-600"
                              >
                                <UserX className="h-4 w-4 mr-2" />
                                Unenroll from Subject
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
