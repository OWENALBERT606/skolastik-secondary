import * as React from "react";
import { redirect }             from "next/navigation";
import { cookies }              from "next/headers";
import { getAuthenticatedUser } from "@/config/useAuth";
import { buildCapabilities }    from "@/lib/utils/capabilities";
import { db }                   from "@/prisma/db";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import BursarSidebar from "@/components/bursar/bursar-sidebar";
import BursarNav     from "@/components/bursar/bursar-nav";
import { getSchoolColorStyle }  from "@/lib/utils/school-colors";

export default async function BursarLayout({
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

  const caps = await buildCapabilities(userData.id);

  if (!caps.isBursar && caps.primaryRole !== "schooladmin" && caps.primaryRole !== "admin") {
    redirect("/login");
  }
  if (!caps.school || caps.school.slug !== slug) redirect("/login");

  const [unreadCount, colorStyle] = await Promise.all([
    db.systemMessagePost.count({ where: { userId: userData.id, isRead: false } }),
    caps.school ? getSchoolColorStyle(caps.school.id) : null,
  ]);

  const session = {
    id:    userData.id,
    name:  userData.name  ?? "",
    email: userData.email ?? "",
    image: userData.image ?? null,
  };

  return (
    <SidebarProvider>
      {colorStyle && <style dangerouslySetInnerHTML={{ __html: colorStyle }} />}
      <BursarSidebar school={caps.school} session={session} unreadCount={unreadCount} />
      <SidebarInset>
        <BursarNav session={session} slug={slug} />
        <div className="p-2">{children}</div>
      </SidebarInset>
    </SidebarProvider>
  );
}
