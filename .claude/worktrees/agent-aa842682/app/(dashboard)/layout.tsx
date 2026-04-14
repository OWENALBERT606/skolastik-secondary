

import Navbar from "@/components/dashboard/Navbar";
import Sidebar from "@/components/dashboard/Sidebar";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { getAuthenticatedUser } from "@/config/useAuth";
import { redirect } from "next/navigation";
import type { ReactNode } from "react";

export default async function DashboardLayout({
  children,
}: {
  children: ReactNode;
}) {
  // ✅ Uses getToken() internally — fully Next.js 15 async compatible
  // No getServerSession() here — that's what was triggering the sync cookies error
  const user = await getAuthenticatedUser();

  // getAuthenticatedUser() already redirects to /login if no token,
  // but we add a type-safe guard just in case
  if (!user) redirect("/login");

  return (
    <SidebarProvider>
      <div className="min-h-screen w-full">
        <Sidebar user={user} />
        <div className="md:ml-[220px] lg:ml-[280px]">
          <SidebarInset>
            <Navbar user={user} />
            <div className="p-8">{children}</div>
          </SidebarInset>
        </div>
      </div>
    </SidebarProvider>
  );
}