import * as React from "react";
import { redirect }             from "next/navigation";
import { cookies }              from "next/headers";
import { getAuthenticatedUser } from "@/config/useAuth";
import { buildCapabilities }    from "@/lib/utils/capabilities";
import { db }                   from "@/prisma/db";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import TeacherSidebar from "@/components/teacher/teacher-sidebar";
import TeacherNav     from "@/components/teacher/teacher-nav";
import { getSchoolColorStyle }  from "@/lib/utils/school-colors";

export default async function TeacherLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ slug: string }>;
}) {
  await cookies();
  const { slug } = await params;

  const userData = await getAuthenticatedUser();
  if (!userData?.id) redirect("/login");

  // loginAs is the primary gate — STF logins belong in the DOS/staff portal
  if (userData.loginAs === "staff") redirect(`/school/${slug}/dos/dashboard`);

  // Use capabilities — single DB query covers everything
  const caps = await buildCapabilities(userData.id);

  if (!caps.isTeacher) redirect("/login");
  if (!caps.school || caps.school.slug !== slug) redirect("/login");

  const [unreadCount, colorStyle] = await Promise.all([
    db.systemMessagePost.count({ where: { userId: userData.id, isRead: false } }),
    caps.school ? getSchoolColorStyle(caps.school.id) : null,
  ]);

  const session = {
    id:    userData.id,
    name:  userData.name ?? "",
    email: userData.email ?? "",
    image: userData.image ?? null,
    isDOS: caps.isDOS,
  };

  return (
    <SidebarProvider>
      {colorStyle && <style dangerouslySetInnerHTML={{ __html: colorStyle }} />}
      <TeacherSidebar school={caps.school} session={session} unreadCount={unreadCount} />
      <SidebarInset>
        <TeacherNav session={session} slug={slug} caps={caps} />
        <div className="p-2">{children}</div>
      </SidebarInset>
    </SidebarProvider>
  );
}
