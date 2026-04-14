

// // app/school/[slug]/academics/streams/[id]/page.tsx
// import { Suspense } from "react";
// import { notFound } from "next/navigation";
// import { getStreamById } from "@/actions/streams";
// import { Button } from "@/components/ui/button";
// import { ArrowLeft, Users, BookOpen, GraduationCap, UserCheck } from "lucide-react";
// import Link from "next/link";
// import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
// import { Skeleton } from "@/components/ui/skeleton";
// import StreamAnalyticsModal from "../components/stream-analytics-model";
// import StreamOverviewTab from "../components/stream-overview-tab";
// import StreamStudentsTab from "../components/stream-students-tab";
// import StreamSubjectsTab from "../components/stream-subjects-tab";
// import StreamEnrollmentTab from "../components/stream-enrollment-tab";

// async function StreamDetailContent({
//   id,
//   slug,
// }: {
//   id: string;
//   slug: string;
// }) {
//   const stream = await getStreamById(id);

//   if (!stream) {
//     notFound();
//   }

//   console.log("streamData", stream);

//   // Get unique teachers count
//   const uniqueTeachers = new Set(
//     stream.streamSubjects?.flatMap((ss) =>
//       ss.teacherAssignments.map((ta) => ta.teacher.id)
//     )
//   ).size;

//   // Get unique subjects count
//   const uniqueSubjects = new Set(
//     stream.streamSubjects?.map((ss) => ss.subjectId)
//   ).size;

//   // Get active term
//   const activeTerm = stream.classYear.academicYear.terms.find((t) => t.isActive);

//   return (
//     <>
//       {/* Header */}
//       <div className="flex items-center justify-between mb-6">
//         <div className="flex items-center gap-4">
//           <Button variant="ghost" size="icon" asChild>
//             <Link href={`/school/${slug}/academics/classes`}>
//               <ArrowLeft className="h-5 w-5" />
//             </Link>
//           </Button>
//           <div>
//             <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
//               {stream.name}
//             </h1>
//             <p className="text-slate-600 dark:text-slate-400 mt-1">
//               {stream.classYear.classTemplate.name} -{" "}
//               {stream.classYear.academicYear.year}
//             </p>
//           </div>
//         </div>
//         <div className="flex gap-2">
//           <StreamAnalyticsModal stream={stream} />
//         </div>
//       </div>

//       {/* Enhanced Stats Cards */}
//       <div className="grid gap-4 md:grid-cols-4 mb-6">
//         {/* Total Students Card */}
//         <div className="relative overflow-hidden rounded-xl border border-slate-200 dark:border-slate-700 bg-gradient-to-br from-blue-50 to-white dark:from-blue-950/20 dark:to-slate-900 p-6 shadow-sm hover:shadow-md transition-all">
//           <div className="flex items-start justify-between">
//             <div>
//               <div className="flex items-center gap-2 text-sm font-medium text-slate-600 dark:text-slate-400 mb-2">
//                 <Users className="h-4 w-4" />
//                 <span>Total Students</span>
//               </div>
//               <div className="text-3xl font-bold text-slate-900 dark:text-white">
//                 {stream._count.enrollments}
//               </div>
//               <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
//                 Active enrollments
//               </p>
//             </div>
//             <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-full">
//               <Users className="h-6 w-6 text-blue-600 dark:text-blue-400" />
//             </div>
//           </div>
//         </div>

//         {/* Subjects Card */}
//         <div className="relative overflow-hidden rounded-xl border border-slate-200 dark:border-slate-700 bg-gradient-to-br from-blue-50 to-white dark:from-blue-950/20 dark:to-slate-900 p-6 shadow-sm hover:shadow-md transition-all">
//           <div className="flex items-start justify-between">
//             <div>
//               <div className="flex items-center gap-2 text-sm font-medium text-slate-600 dark:text-slate-400 mb-2">
//                 <BookOpen className="h-4 w-4" />
//                 <span>Subjects</span>
//               </div>
//               <div className="text-3xl font-bold text-slate-900 dark:text-white">
//                 {uniqueSubjects}
//               </div>
//               <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
//                 Across all terms
//               </p>
//             </div>
//             <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-full">
//               <BookOpen className="h-6 w-6 text-blue-600 dark:text-blue-400" />
//             </div>
//           </div>
//         </div>

//         {/* Assigned Teachers Card */}
//         <div className="relative overflow-hidden rounded-xl border border-slate-200 dark:border-slate-700 bg-gradient-to-br from-orange-50 to-white dark:from-orange-950/20 dark:to-slate-900 p-6 shadow-sm hover:shadow-md transition-all">
//           <div className="flex items-start justify-between">
//             <div>
//               <div className="flex items-center gap-2 text-sm font-medium text-slate-600 dark:text-slate-400 mb-2">
//                 <GraduationCap className="h-4 w-4" />
//                 <span>Assigned Teachers</span>
//               </div>
//               <div className="text-3xl font-bold text-slate-900 dark:text-white">
//                 {uniqueTeachers}
//               </div>
//               <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
//                 Unique teachers
//               </p>
//             </div>
//             <div className="p-3 bg-orange-100 dark:bg-orange-900/30 rounded-full">
//               <GraduationCap className="h-6 w-6 text-orange-600 dark:text-orange-400" />
//             </div>
//           </div>
//         </div>

//         {/* Class Head Card */}
//         <div className="relative overflow-hidden rounded-xl border border-slate-200 dark:border-slate-700 bg-gradient-to-br from-green-50 to-white dark:from-green-950/20 dark:to-slate-900 p-6 shadow-sm hover:shadow-md transition-all">
//           <div className="flex items-start justify-between">
//             <div className="flex-1 min-w-0">
//               <div className="flex items-center gap-2 text-sm font-medium text-slate-600 dark:text-slate-400 mb-2">
//                 <UserCheck className="h-4 w-4" />
//                 <span>Class Head</span>
//               </div>
//               <div className="text-lg font-semibold text-slate-900 dark:text-white truncate">
//                 {stream.classHead
//                   ? `${stream.classHead.firstName} ${stream.classHead.lastName}`
//                   : "Not assigned"}
//               </div>
//               {stream.classHead && (
//                 <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
//                   {stream.classHead.staffNo}
//                 </p>
//               )}
//             </div>
//             <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-full">
//               <UserCheck className="h-6 w-6 text-green-600 dark:text-green-400" />
//             </div>
//           </div>
//         </div>
//       </div>

//       {/* Main Tabs */}
//       <Tabs defaultValue="subjects" className="space-y-4">
//         <TabsList className="grid w-full grid-cols-4 bg-slate-100 dark:bg-slate-800 p-1 rounded-lg">
//           <TabsTrigger
//             value="overview"
//             className="data-[state=active]:bg-white dark:data-[state=active]:bg-slate-900"
//           >
//             Overview
//           </TabsTrigger>
//           <TabsTrigger
//             value="students"
//             className="data-[state=active]:bg-white dark:data-[state=active]:bg-slate-900"
//           >
//             Students ({stream._count.enrollments})
//           </TabsTrigger>
//           <TabsTrigger
//             value="subjects"
//             className="data-[state=active]:bg-white dark:data-[state=active]:bg-slate-900"
//           >
//             Subjects ({uniqueSubjects})
//           </TabsTrigger>
//           <TabsTrigger
//             value="enrollment"
//             className="data-[state=active]:bg-white dark:data-[state=active]:bg-slate-900"
//           >
//             Manage Enrollment
//           </TabsTrigger>
//         </TabsList>

//         <TabsContent value="overview" className="space-y-4">
//           <StreamOverviewTab stream={stream} schoolSlug={slug} />
//         </TabsContent>

//         <TabsContent value="students" className="space-y-4">
//           <StreamStudentsTab
//             streamId={id}
//             enrollments={stream.enrollments || []}
//             schoolId={stream.schoolId}
//             schoolSlug={slug}
//             classYearId={stream.classYearId}
//           />
//         </TabsContent>

//         <TabsContent value="subjects" className="space-y-4">
//           <StreamSubjectsTab
//             streamId={id}
//             streamSubjects={stream.streamSubjects}
//             schoolId={stream.schoolId}
//             schoolSlug={slug}
//             activeTerm={activeTerm}
//           />
//         </TabsContent>

//         <TabsContent value="enrollment" className="space-y-4">
//           <StreamEnrollmentTab
//             streamId={id}
//             classYearId={stream.classYearId}
//             academicYearId={stream.classYear.academicYearId}
//             schoolId={stream.schoolId}
//             activeTerm={activeTerm}
//           />
//         </TabsContent>
//       </Tabs>
//     </>
//   );
// }

// export default async function StreamDetailPage({
//   params,
// }: {
//   params: Promise<{ id: string; slug: string }>;
// }) {
//   const resolvedParams = await params;
//   return (
//     <div className="space-y-6 p-6 bg-slate-50 dark:bg-slate-950 min-h-screen">
//       <Suspense fallback={<DetailLoadingSkeleton />}>
//         <StreamDetailContent id={resolvedParams.id} slug={resolvedParams.slug} />
//       </Suspense>
//     </div>
//   );
// }

// function DetailLoadingSkeleton() {
//   return (
//     <div className="space-y-6">
//       <div className="flex items-center justify-between">
//         <div className="flex items-center gap-4">
//           <Skeleton className="h-10 w-10 rounded-lg" />
//           <div>
//             <Skeleton className="h-8 w-48 mb-2" />
//             <Skeleton className="h-4 w-64" />
//           </div>
//         </div>
//         <Skeleton className="h-10 w-32" />
//       </div>
//       <div className="grid gap-4 md:grid-cols-4">
//         {[...Array(4)].map((_, i) => (
//           <Skeleton key={i} className="h-32 rounded-xl" />
//         ))}
//       </div>
//     </div>
//   );
// }



// app/school/[slug]/academics/streams/[id]/page.tsx
import { Suspense } from "react";
import { notFound } from "next/navigation";
import { getStreamById } from "@/actions/streams";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  ArrowLeft, 
  Users, 
  BookOpen, 
  GraduationCap, 
  UserCheck,
  FileText,
  Layers
} from "lucide-react";
import Link from "next/link";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import StreamOverviewTab from "../components/stream-overview-tab";
import StreamStudentsTab from "../components/stream-students-tab";
import StreamSubjectsTab from "../components/stream-subjects-tab";
import StreamEnrollmentTab from "../components/stream-enrollment-tab";

async function StreamDetailContent({
  id,
  slug,
}: {
  id: string;
  slug: string;
}) {
  const stream = await getStreamById(id);

  if (!stream) {
    notFound();
  }

  console.log("streamData", stream);

  // ✅ Get unique teachers count
  const uniqueTeachers = new Set(
    stream.streamSubjects?.flatMap((ss) =>
      ss.teacherAssignments.map((ta) => ta.teacher.id)
    )
  ).size;

  // ✅ Calculate multi-paper statistics
  const uniqueSubjects = new Set(
    stream.streamSubjects?.map((ss) => ss.subjectId)
  ).size;
  
  const totalPapers = stream.streamSubjects?.length || 0;
  const multiPaperCount = totalPapers - uniqueSubjects;
  const hasMultiplePapers = multiPaperCount > 0;

  // ✅ Get active term
  const activeTerm = stream.classYear.academicYear.terms.find((t) => t.isActive);

  // ✅ Count papers with paper codes
  const papersWithCodes = stream.streamSubjects?.filter(
    (ss) => ss.subjectPaper?.paperCode
  ).length || 0;

  return (
    <>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href={`/school/${slug}/academics/classes`}>
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <div>
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
                {stream.name}
              </h1>
              {/* ✅ Multi-paper indicator badge */}
              {hasMultiplePapers && (
                <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400">
                  {totalPapers} Papers
                </Badge>
              )}
            </div>
            <p className="text-slate-600 dark:text-slate-400 mt-1">
              {stream.classYear.classTemplate.name} -{" "}
              {stream.classYear.academicYear.year}
            </p>
          </div>
        </div>
        {/* <div className="flex gap-2">
          <StreamAnalyticsModal stream={stream} />
        </div> */}
      </div>

      {/* ✅ ENHANCED: Stats Cards with Multi-Paper Support */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5 mb-6">
        {/* Total Students Card */}
        <div className="relative overflow-hidden rounded-xl border border-slate-200 dark:border-slate-700 bg-gradient-to-br from-blue-50 to-white dark:from-blue-950/20 dark:to-slate-900 p-6 shadow-sm hover:shadow-md transition-all">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2 text-sm font-medium text-slate-600 dark:text-slate-400 mb-2">
                <Users className="h-4 w-4" />
                <span>Students</span>
              </div>
              <div className="text-3xl font-bold text-slate-900 dark:text-white">
                {stream._count.enrollments}
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Active enrollments
              </p>
            </div>
            <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-full">
              <Users className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
        </div>

        {/* ✅ ENHANCED: Unique Subjects Card */}
        <div className="relative overflow-hidden rounded-xl border border-slate-200 dark:border-slate-700 bg-gradient-to-br from-blue-50 to-white dark:from-blue-950/20 dark:to-slate-900 p-6 shadow-sm hover:shadow-md transition-all">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2 text-sm font-medium text-slate-600 dark:text-slate-400 mb-2">
                <BookOpen className="h-4 w-4" />
                <span>Subjects</span>
              </div>
              <div className="text-3xl font-bold text-slate-900 dark:text-white">
                {uniqueSubjects}
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Unique subjects
              </p>
            </div>
            <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-full">
              <BookOpen className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
        </div>

        {/* ✅ NEW: Total Papers Card */}
        <div className="relative overflow-hidden rounded-xl border border-slate-200 dark:border-slate-700 bg-gradient-to-br from-cyan-50 to-white dark:from-cyan-950/20 dark:to-slate-900 p-6 shadow-sm hover:shadow-md transition-all">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2 text-sm font-medium text-slate-600 dark:text-slate-400 mb-2">
                <FileText className="h-4 w-4" />
                <span>Total Papers</span>
              </div>
              <div className="text-3xl font-bold text-slate-900 dark:text-white">
                {totalPapers}
              </div>
              {hasMultiplePapers ? (
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  {multiPaperCount} multi-paper
                </p>
              ) : (
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  All single paper
                </p>
              )}
            </div>
            <div className="p-3 bg-cyan-100 dark:bg-cyan-900/30 rounded-full">
              <FileText className="h-6 w-6 text-cyan-600 dark:text-cyan-400" />
            </div>
          </div>
        </div>

        {/* ✅ ENHANCED: Teachers Card */}
        <div className="relative overflow-hidden rounded-xl border border-slate-200 dark:border-slate-700 bg-gradient-to-br from-orange-50 to-white dark:from-orange-950/20 dark:to-slate-900 p-6 shadow-sm hover:shadow-md transition-all">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2 text-sm font-medium text-slate-600 dark:text-slate-400 mb-2">
                <GraduationCap className="h-4 w-4" />
                <span>Teachers</span>
              </div>
              <div className="text-3xl font-bold text-slate-900 dark:text-white">
                {uniqueTeachers}
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                {totalPapers} assignments
              </p>
            </div>
            <div className="p-3 bg-orange-100 dark:bg-orange-900/30 rounded-full">
              <GraduationCap className="h-6 w-6 text-orange-600 dark:text-orange-400" />
            </div>
          </div>
        </div>

        {/* Class Head Card */}
        <div className="relative overflow-hidden rounded-xl border border-slate-200 dark:border-slate-700 bg-gradient-to-br from-green-50 to-white dark:from-green-950/20 dark:to-slate-900 p-6 shadow-sm hover:shadow-md transition-all">
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 text-sm font-medium text-slate-600 dark:text-slate-400 mb-2">
                <UserCheck className="h-4 w-4" />
                <span>Class Head</span>
              </div>
              <div className="text-base font-semibold text-slate-900 dark:text-white truncate">
                {stream.classHead
                  ? `${stream.classHead.firstName} ${stream.classHead.lastName}`
                  : "Not assigned"}
              </div>
              {stream.classHead && (
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  {stream.classHead.staffNo}
                </p>
              )}
            </div>
            <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-full">
              <UserCheck className="h-6 w-6 text-green-600 dark:text-green-400" />
            </div>
          </div>
        </div>
      </div>

      {/* ✅ NEW: Multi-Paper Info Banner (Only show if has multi-paper subjects) */}
      {hasMultiplePapers && (
        <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-200 dark:border-blue-800">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
              <Layers className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="flex-1">
              <p className="font-medium text-blue-900 dark:text-blue-300 mb-1">
                Multi-Paper Stream
              </p>
              <p className="text-sm text-blue-700 dark:text-blue-400">
                This stream has <strong>{multiPaperCount}</strong> multi-paper subject(s), 
                resulting in <strong>{totalPapers}</strong> total paper assignments across{" "}
                <strong>{uniqueSubjects}</strong> unique subjects.
                {papersWithCodes > 0 && (
                  <> {papersWithCodes} paper(s) have UNEB codes assigned.</>
                )}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400">
                {uniqueSubjects} Subjects
              </Badge>
              <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400">
                {totalPapers} Papers
              </Badge>
            </div>
          </div>
        </div>
      )}

      {/* ✅ ENHANCED: Main Tabs with Paper Counts */}
      <Tabs defaultValue="subjects" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4 bg-slate-100 dark:bg-slate-800 p-1 rounded-lg">
          <TabsTrigger
            value="overview"
            className="data-[state=active]:bg-white dark:data-[state=active]:bg-slate-900"
          >
            Overview
          </TabsTrigger>
          <TabsTrigger
            value="students"
            className="data-[state=active]:bg-white dark:data-[state=active]:bg-slate-900"
          >
            <span className="flex items-center gap-2">
              Students
              <Badge variant="secondary" className="ml-1">
                {stream._count.enrollments}
              </Badge>
            </span>
          </TabsTrigger>
          <TabsTrigger
            value="subjects"
            className="data-[state=active]:bg-white dark:data-[state=active]:bg-slate-900"
          >
            <span className="flex items-center gap-2">
              Subjects
              <Badge variant="secondary" className="ml-1">
                {uniqueSubjects}
              </Badge>
              {hasMultiplePapers && (
                <Badge variant="outline" className="ml-1 text-xs">
                  {totalPapers}P
                </Badge>
              )}
            </span>
          </TabsTrigger>
          <TabsTrigger
            value="enrollment"
            className="data-[state=active]:bg-white dark:data-[state=active]:bg-slate-900"
          >
            Manage Enrollment
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <StreamOverviewTab stream={stream} schoolSlug={slug} />
        </TabsContent>

        <TabsContent value="students" className="space-y-4">
          <StreamStudentsTab
            streamId={id}
            enrollments={stream.enrollments || []}
            schoolId={stream.schoolId}
            schoolSlug={slug}
            classYearId={stream.classYearId}
          />
        </TabsContent>

        <TabsContent value="subjects" className="space-y-4">
          <StreamSubjectsTab
            streamId={id}
            streamSubjects={stream.streamSubjects}
            schoolId={stream.schoolId}
            schoolSlug={slug}
            activeTerm={activeTerm}
          />
        </TabsContent>

        <TabsContent value="enrollment" className="space-y-4">
          <StreamEnrollmentTab
            streamId={id}
            classYearId={stream.classYearId}
            academicYearId={stream.classYear.academicYearId}
            schoolId={stream.schoolId}
            activeTerm={activeTerm}
          />
        </TabsContent>
      </Tabs>
    </>
  );
}

export default async function StreamDetailPage({
  params,
}: {
  params: Promise<{ id: string; slug: string }>;
}) {
  const resolvedParams = await params;
  return (
    <div className="space-y-6 p-6 bg-slate-50 dark:bg-slate-950 min-h-screen">
      <Suspense fallback={<DetailLoadingSkeleton />}>
        <StreamDetailContent id={resolvedParams.id} slug={resolvedParams.slug} />
      </Suspense>
    </div>
  );
}

function DetailLoadingSkeleton() {
  return (
    <div className="space-y-6">
      {/* Header Skeleton */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-10 rounded-lg" />
          <div>
            <Skeleton className="h-8 w-48 mb-2" />
            <Skeleton className="h-4 w-64" />
          </div>
        </div>
        <Skeleton className="h-10 w-32" />
      </div>

      {/* Stats Cards Skeleton */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        {[...Array(5)].map((_, i) => (
          <Skeleton key={i} className="h-32 rounded-xl" />
        ))}
      </div>

      {/* Tabs Skeleton */}
      <div className="space-y-4">
        <Skeleton className="h-12 w-full rounded-lg" />
        <Skeleton className="h-64 w-full rounded-lg" />
      </div>
    </div>
  );
}