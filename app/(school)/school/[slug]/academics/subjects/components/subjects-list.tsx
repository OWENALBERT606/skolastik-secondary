


// components/dashboard/subjects/subjects-list.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Book,
  BookOpen,
  Calendar,
  ChevronRight,
  ChevronUp,
  ChevronDown,
  Eye,
  FileText,
  Loader2,
  Plus,
  Search,
  Trash2,
  User,
  Users,
} from "lucide-react";
import { deleteSubject } from "@/actions/subjects";
import { toast } from "sonner";
import { SubjectFormModal } from "./subbject-form-model";
import { SubjectDetailModal } from "./subject-detail";

type Teacher = {
  id: string;
  firstName: string;
  lastName: string;
  staffNo: string;
};

type AcademicYear = {
  id: string;
  year: string;
  isActive: boolean;
};

type ClassTemplateInfo = {
  id: string;
  name: string;
  code: string | null;
  level: number | null;
};

type AvailableClassYear = {
  id: string;
  classTemplateId: string;
  academicYearId: string;
  classTemplate: ClassTemplateInfo;
  streams: { id: string }[];
};

type ClassSubject = {
  id: string;
  classYearId: string;
  classYear: {
    id: string;
    classTemplateId: string;
    academicYearId: string;
    classTemplate: ClassTemplateInfo;
    academicYear: {
      id: string;
      year: string;
      isActive: boolean;
    };
  };
};

type SubjectListItem = {
  id: string;
  name: string;
  code: string | null;
  description: string | null;
  category: string | null;
  schoolId: string;
  headTeacherId: string | null;
  subjectLevel: "O_LEVEL" | "A_LEVEL" | "BOTH"; // BOTH kept for legacy data only
  aLevelCategory: "MAJOR" | "SUBSIDIARY" | null;
  headTeacher: Teacher | null;
  classSubjects: ClassSubject[];
  papers?: Array<{
    id: string;
    paperNumber: number;
    name: string;
    description: string | null;
    paperCode: string | null;
    maxMarks: number;
    weight: number;
    isActive: boolean;
    aoiCount?: number;
    _count?: {
      aoiTopics: number;
      aoiUnits: number;
      examMarks: number;
      paperResults: number;
    };
  }>;
  _count: {
    classSubjects: number;
    streamSubjects: number;
    papers: number;
  };
};

interface SubjectsListProps {
  subjects: SubjectListItem[];
  schoolId: string;
  schoolSlug: string;
  teachers: Teacher[];
  activeAcademicYear: AcademicYear;
  academicYears: AcademicYear[];
  availableClassYears: AvailableClassYear[];
}

type SortKey = "name" | "code" | "category" | "papers" | "classes" | "headTeacher";
type SortDir = "asc" | "desc";

// Category color map
const CATEGORY_COLORS: Record<string, { bg: string; text: string }> = {
  Sciences:      { bg: "bg-blue-100 dark:bg-blue-900/30",   text: "text-blue-700 dark:text-blue-300" },
  Languages:     { bg: "bg-violet-100 dark:bg-violet-900/30", text: "text-violet-700 dark:text-violet-300" },
  Humanities:    { bg: "bg-amber-100 dark:bg-amber-900/30",  text: "text-amber-700 dark:text-amber-300" },
  Business:      { bg: "bg-emerald-100 dark:bg-emerald-900/30", text: "text-emerald-700 dark:text-emerald-300" },
  Technical:     { bg: "bg-orange-100 dark:bg-orange-900/30", text: "text-orange-700 dark:text-orange-300" },
  "Social Studies": { bg: "bg-pink-100 dark:bg-pink-900/30", text: "text-pink-700 dark:text-pink-300" },
};

function CategoryBadge({ category }: { category: string | null }) {
  if (!category) return <span className="text-slate-400 dark:text-slate-600 text-xs">—</span>;
  const colors = CATEGORY_COLORS[category] ?? {
    bg: "bg-slate-100 dark:bg-slate-800",
    text: "text-slate-600 dark:text-slate-400",
  };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${colors.bg} ${colors.text}`}>
      {category}
    </span>
  );
}

export function SubjectsList({
  subjects,
  schoolId,
  schoolSlug,
  teachers,
  activeAcademicYear,
  academicYears,
  availableClassYears,
}: SubjectsListProps) {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [levelFilter, setLevelFilter] = useState<"all" | "O_LEVEL" | "A_LEVEL">("all");
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState<SubjectListItem | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedAcademicYearId, setSelectedAcademicYearId] = useState(activeAcademicYear.id);
  const [selectedSubject, setSelectedSubject] = useState<SubjectListItem | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [sortKey, setSortKey] = useState<SortKey>("name");
  const [sortDir, setSortDir] = useState<SortDir>("asc");

  // Unique categories
  const categories = Array.from(
    new Set(subjects.map((s) => s.category).filter(Boolean))
  ) as string[];

  const totalPapers = subjects.reduce((sum, s) => sum + (s.papers?.length || 0), 0);
  const multiPaperSubjects = subjects.filter((s) => (s.papers?.length || 0) > 1).length;

  // Filter
  const filtered = subjects.filter((s) => {
    const matchSearch =
      s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.category?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchCategory = categoryFilter === "all" || s.category === categoryFilter;
    const matchLevel =
      levelFilter === "all" ||
      s.subjectLevel === levelFilter;
    return matchSearch && matchCategory && matchLevel;
  });

  // Sort
  const sorted = [...filtered].sort((a, b) => {
    let av: string | number = "";
    let bv: string | number = "";

    switch (sortKey) {
      case "name":       av = a.name; bv = b.name; break;
      case "code":       av = a.code ?? ""; bv = b.code ?? ""; break;
      case "category":   av = a.category ?? ""; bv = b.category ?? ""; break;
      case "papers":     av = a.papers?.length ?? 0; bv = b.papers?.length ?? 0; break;
      case "classes":
        av = a.classSubjects.filter((cs) => cs.classYear.academicYearId === selectedAcademicYearId).length;
        bv = b.classSubjects.filter((cs) => cs.classYear.academicYearId === selectedAcademicYearId).length;
        break;
      case "headTeacher":
        av = a.headTeacher ? `${a.headTeacher.firstName} ${a.headTeacher.lastName}` : "zzz";
        bv = b.headTeacher ? `${b.headTeacher.firstName} ${b.headTeacher.lastName}` : "zzz";
        break;
    }

    if (typeof av === "number" && typeof bv === "number") {
      return sortDir === "asc" ? av - bv : bv - av;
    }
    return sortDir === "asc"
      ? String(av).localeCompare(String(bv))
      : String(bv).localeCompare(String(av));
  });

  function toggleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  }

  function SortIcon({ col }: { col: SortKey }) {
    if (sortKey !== col)
      return (
        <span className="flex flex-col ml-1 opacity-30">
          <ChevronUp className="w-3 h-3 -mb-1" />
          <ChevronDown className="w-3 h-3" />
        </span>
      );
    return sortDir === "asc" ? (
      <ChevronUp className="w-3.5 h-3.5 ml-1 text-[#5B9BD5]" />
    ) : (
      <ChevronDown className="w-3.5 h-3.5 ml-1 text-[#5B9BD5]" />
    );
  }

  const handleDelete = async (subject: SubjectListItem) => {
    setIsDeleting(subject.id);
    try {
      const result = await deleteSubject(subject.id);
      if (result?.ok) {
        toast.success(result.message);
        setShowDeleteModal(null);
        router.refresh();
      } else {
        toast.error(result?.message || "Failed to delete subject");
      }
    } catch {
      toast.error("An unexpected error occurred");
    } finally {
      setIsDeleting(null);
    }
  };

  const handleAcademicYearChange = (yearId: string) => {
    setSelectedAcademicYearId(yearId);
    router.push(`/school/${schoolSlug}/academics/subjects?yearId=${yearId}`);
  };

  const handleViewDetails = (subject: SubjectListItem) => {
    setSelectedSubject(subject);
    setShowDetailModal(true);
  };

  const handleCloseDetailModal = () => {
    setShowDetailModal(false);
    setSelectedSubject(null);
    router.refresh();
  };

  const thClass =
    "px-4 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider select-none cursor-pointer hover:text-slate-700 dark:hover:text-slate-200 transition-colors";

  return (
    <div className="space-y-5">
      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Subjects</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-0.5 text-sm">
            Manage subjects and assign them to classes for{" "}
            <span className="font-medium text-slate-700 dark:text-slate-300">
              {activeAcademicYear.year}
            </span>
          </p>
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
            {subjects.length} subjects &nbsp;·&nbsp; {totalPapers} papers &nbsp;·&nbsp;{" "}
            {multiPaperSubjects} multi-paper
          </p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#5B9BD5] hover:bg-[#4A8BC2] text-white font-medium rounded-lg transition-colors shadow-sm shrink-0"
        >
          <Plus className="w-4 h-4" />
          Add Subject
        </button>
      </div>

      {/* ── Filters bar ────────────────────────────────────────────────── */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 p-3.5 shadow-sm">
        <div className="flex flex-wrap gap-3 items-center">
          {/* Search */}
          <div className="relative flex-1 min-w-[180px] max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search subjects…"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-slate-200 dark:border-slate-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#5B9BD5]/20 focus:border-[#5B9BD5] bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 transition-colors"
            />
          </div>

          {/* Level filter */}
          <div className="flex items-center gap-1.5">
            {(["all", "O_LEVEL", "A_LEVEL"] as const).map((lv) => (
              <button
                key={lv}
                onClick={() => setLevelFilter(lv)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  levelFilter === lv
                    ? lv === "A_LEVEL"
                      ? "bg-purple-600 text-white"
                      : "bg-[#5B9BD5] text-white"
                    : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700"
                }`}
              >
                {lv === "all" ? "All Levels" : lv === "O_LEVEL" ? "O Level" : "A Level"}
              </button>
            ))}
          </div>

          {/* Category filter */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <button
              onClick={() => setCategoryFilter("all")}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                categoryFilter === "all"
                  ? "bg-[#5B9BD5] text-white"
                  : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700"
              }`}
            >
              All
            </button>
            {categories.map((cat) => {
              const colors = CATEGORY_COLORS[cat];
              return (
                <button
                  key={cat}
                  onClick={() => setCategoryFilter(cat === categoryFilter ? "all" : cat)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                    categoryFilter === cat
                      ? "bg-[#5B9BD5] text-white"
                      : `${colors?.bg ?? "bg-slate-100 dark:bg-slate-800"} ${colors?.text ?? "text-slate-600"} hover:opacity-80`
                  }`}
                >
                  {cat}
                </button>
              );
            })}
          </div>

          {/* Academic year */}
          <div className="relative ml-auto">
            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <select
              value={selectedAcademicYearId}
              onChange={(e) => handleAcademicYearChange(e.target.value)}
              className="pl-9 pr-4 py-2 border border-slate-200 dark:border-slate-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#5B9BD5]/20 focus:border-[#5B9BD5] bg-white dark:bg-slate-800 text-slate-900 dark:text-white appearance-none transition-colors"
            >
              {academicYears.map((y) => (
                <option key={y.id} value={y.id}>
                  {y.year} {y.isActive ? "(Active)" : ""}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* ── Table ──────────────────────────────────────────────────────── */}
      {sorted.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 p-12 text-center shadow-sm">
          {searchTerm || categoryFilter !== "all" ? (
            <>
              <Search className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
              <h3 className="font-semibold text-slate-900 dark:text-white mb-1">No subjects found</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
                Try adjusting your search or filter
              </p>
              <button
                onClick={() => { setSearchTerm(""); setCategoryFilter("all"); }}
                className="text-sm text-[#5B9BD5] hover:text-[#4A8BC2] font-medium"
              >
                Clear filters
              </button>
            </>
          ) : (
            <>
              <Book className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
              <h3 className="font-semibold text-slate-900 dark:text-white mb-1">No subjects yet</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
                Get started by adding your first subject
              </p>
              <button
                onClick={() => setShowAddModal(true)}
                className="inline-flex items-center gap-2 px-4 py-2 bg-[#5B9BD5] hover:bg-[#4A8BC2] text-white text-sm font-medium rounded-lg transition-colors"
              >
                <Plus className="w-4 h-4" /> Add Subject
              </button>
            </>
          )}
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
          {/* result count */}
          <div className="px-4 py-2.5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Showing <span className="font-semibold text-slate-700 dark:text-slate-300">{sorted.length}</span> of{" "}
              <span className="font-semibold text-slate-700 dark:text-slate-300">{subjects.length}</span> subjects
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-700">
                <tr>
                  <th
                    className={thClass}
                    onClick={() => toggleSort("name")}
                  >
                    <span className="flex items-center">Subject <SortIcon col="name" /></span>
                  </th>
                  <th
                    className={thClass}
                    onClick={() => toggleSort("category")}
                  >
                    <span className="flex items-center">Category <SortIcon col="category" /></span>
                  </th>
                  <th
                    className={`${thClass} hidden md:table-cell`}
                    onClick={() => toggleSort("papers")}
                  >
                    <span className="flex items-center">Papers <SortIcon col="papers" /></span>
                  </th>
                  <th
                    className={`${thClass} hidden lg:table-cell`}
                    onClick={() => toggleSort("classes")}
                  >
                    <span className="flex items-center">Classes <SortIcon col="classes" /></span>
                  </th>
                  <th
                    className={`${thClass} hidden lg:table-cell`}
                    onClick={() => toggleSort("headTeacher")}
                  >
                    <span className="flex items-center">Head Teacher <SortIcon col="headTeacher" /></span>
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {sorted.map((subject) => {
                  const currentYearClasses = subject.classSubjects.filter(
                    (cs) => cs.classYear.academicYearId === selectedAcademicYearId
                  ).length;
                  const papers = subject.papers ?? [];
                  const activePapers = papers.filter((p) => p.isActive);
                  const paperCodes = activePapers.map((p) => p.paperCode ?? `P${p.paperNumber}`);

                  return (
                    <tr
                      key={subject.id}
                      className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors group"
                    >
                      {/* Subject name + code */}
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-[#5B9BD5]/10 dark:bg-[#5B9BD5]/20 rounded-lg shrink-0">
                            <BookOpen className="w-4 h-4 text-[#5B9BD5]" />
                          </div>
                          <div>
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <p className="font-medium text-slate-900 dark:text-white group-hover:text-[#5B9BD5] transition-colors leading-tight">
                                {subject.name}
                              </p>
                              {subject.subjectLevel === "A_LEVEL" && (
                                <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300 uppercase tracking-wide">
                                  A Level
                                </span>
                              )}
                              {subject.aLevelCategory === "MAJOR" && (
                                <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300">
                                  Principal
                                </span>
                              )}
                              {subject.aLevelCategory === "SUBSIDIARY" && (
                                <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-teal-100 dark:bg-teal-900/40 text-teal-700 dark:text-teal-300">
                                  Subsidiary
                                </span>
                              )}
                            </div>
                            {subject.code && (
                              <span className="text-xs text-slate-400 dark:text-slate-500 font-mono">
                                {subject.code}
                              </span>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Category */}
                      <td className="px-4 py-3.5">
                        <CategoryBadge category={subject.category ?? null} />
                      </td>

                      {/* Papers */}
                      <td className="px-4 py-3.5 hidden md:table-cell">
                        {papers.length === 0 ? (
                          <span className="text-xs text-slate-400 dark:text-slate-600">—</span>
                        ) : (
                          <div className="flex flex-wrap gap-1">
                            {paperCodes.map((code, i) => (
                              <span
                                key={i}
                                className="inline-flex items-center gap-1 px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded text-xs font-mono"
                              >
                                <FileText className="w-3 h-3" />
                                {code}
                              </span>
                            ))}
                          </div>
                        )}
                      </td>

                      {/* Classes */}
                      <td className="px-4 py-3.5 hidden lg:table-cell">
                        {currentYearClasses === 0 ? (
                          <span className="inline-flex items-center gap-1 text-xs text-amber-600 dark:text-amber-400">
                            <Book className="w-3.5 h-3.5" />
                            Unassigned
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-xs text-slate-600 dark:text-slate-400">
                            <Book className="w-3.5 h-3.5" />
                            {currentYearClasses} class{currentYearClasses !== 1 ? "es" : ""}
                          </span>
                        )}
                      </td>

                      {/* Head Teacher */}
                      <td className="px-4 py-3.5 hidden lg:table-cell">
                        {subject.headTeacher ? (
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-full bg-[#5B9BD5]/10 dark:bg-[#5B9BD5]/20 flex items-center justify-center shrink-0">
                              <User className="w-3.5 h-3.5 text-[#5B9BD5]" />
                            </div>
                            <span className="text-slate-700 dark:text-slate-300 text-xs">
                              {subject.headTeacher.firstName} {subject.headTeacher.lastName}
                            </span>
                          </div>
                        ) : (
                          <span className="text-xs text-slate-400 dark:text-slate-600 italic">
                            Not assigned
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-3.5">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => handleViewDetails(subject)}
                            className="p-1.5 text-slate-400 dark:text-slate-500 hover:text-[#5B9BD5] hover:bg-[#5B9BD5]/10 rounded-lg transition-colors"
                            title="View details"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setShowDeleteModal(subject)}
                            className="p-1.5 text-slate-400 dark:text-slate-500 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleViewDetails(subject)}
                            className="p-1.5 text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                            title="Open"
                          >
                            <ChevronRight className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Table footer */}
          <div className="px-4 py-2.5 border-t border-slate-100 dark:border-slate-800 flex items-center gap-4 text-xs text-slate-400 dark:text-slate-500">
            <span className="flex items-center gap-1.5">
              <BookOpen className="w-3.5 h-3.5" />
              {subjects.length} subjects
            </span>
            <span className="flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5" />
              {totalPapers} papers
            </span>
            <span className="flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5" />
              {subjects.filter((s) => s.headTeacher).length} with head teachers
            </span>
          </div>
        </div>
      )}

      {/* ── Add Subject Modal ───────────────────────────────────────────── */}
      <SubjectFormModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        schoolId={schoolId}
        teachers={teachers}
        mode="create"
      />

      {/* ── Delete Confirmation Modal ───────────────────────────────────── */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/50 dark:bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-900 rounded-xl max-w-md w-full p-6 shadow-xl border border-slate-200 dark:border-slate-700">
            <div className="flex items-center gap-4 mb-4">
              <div className="p-3 bg-red-100 dark:bg-red-900/30 rounded-full">
                <Trash2 className="w-6 h-6 text-red-600 dark:text-red-400" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Delete Subject</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400">This action cannot be undone</p>
              </div>
            </div>
            <p className="text-slate-600 dark:text-slate-400 mb-2">
              Are you sure you want to delete{" "}
              <span className="font-semibold text-slate-900 dark:text-white">
                {showDeleteModal.name}
              </span>
              ?
            </p>
            {showDeleteModal._count.classSubjects > 0 && (
              <div className="mt-3 p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-800">
                <p className="text-sm text-amber-800 dark:text-amber-400">
                  ⚠️ This subject is assigned to {showDeleteModal._count.classSubjects} class(es). All assignments will be removed.
                </p>
              </div>
            )}
            {(showDeleteModal.papers?.length ?? 0) > 0 && (
              <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                <p className="text-sm text-blue-800 dark:text-blue-400">
                  📄 {showDeleteModal.papers!.length} paper(s) will also be deleted.
                </p>
              </div>
            )}
            <div className="flex gap-3 justify-end mt-6">
              <button
                onClick={() => setShowDeleteModal(null)}
                disabled={isDeleting === showDeleteModal.id}
                className="px-4 py-2 border border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-300 font-medium rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(showDeleteModal)}
                disabled={isDeleting === showDeleteModal.id}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                {isDeleting === showDeleteModal.id ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> Deleting...</>
                ) : (
                  <><Trash2 className="w-4 h-4" /> Delete</>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Subject Detail Modal ────────────────────────────────────────── */}
      {showDetailModal && selectedSubject && (
        <SubjectDetailModal
          isOpen={showDetailModal}
          onClose={handleCloseDetailModal}
          subject={selectedSubject}
          availableTeachers={teachers}
          availableClassYears={availableClassYears}
          academicYear={activeAcademicYear}
        />
      )}
    </div>
  );
}