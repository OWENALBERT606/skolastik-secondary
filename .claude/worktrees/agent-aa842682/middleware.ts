import { getToken } from "next-auth/jwt";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Only guard school routes
  if (!pathname.startsWith("/school/")) return NextResponse.next();

  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET! });
  if (!token) return NextResponse.next(); // let auth pages handle unauthenticated

  const roles: any[] = (token.roles as any[]) ?? [];
  const roleNames = roles.map((r) => r.roleName?.toLowerCase());

  const isTeacherOnly =
    roles.length > 0 && roleNames.every((r) => r === "teacher");

  const isDOSOnly =
    roles.length > 0 && roleNames.every((r) => r === "dos");

  // Extract slug — pathname is /school/[slug]/...
  const parts = pathname.split("/"); // ["", "school", slug, ...rest]
  const slug  = parts[2];
  const rest  = parts.slice(3).join("/"); // everything after /school/[slug]/

  // Pure teacher: only allowed under /school/[slug]/teacher/...
  if (isTeacherOnly) {
    if (rest.startsWith("teacher/") || rest === "teacher") return NextResponse.next();
    const dashboardUrl = req.nextUrl.clone();
    dashboardUrl.pathname = `/school/${slug}/teacher/dashboard`;
    return NextResponse.redirect(dashboardUrl);
  }

  // Pure DOS: only allowed under /school/[slug]/dos/...
  if (isDOSOnly) {
    if (rest.startsWith("dos/") || rest === "dos") return NextResponse.next();
    const dashboardUrl = req.nextUrl.clone();
    dashboardUrl.pathname = `/school/${slug}/dos/dashboard`;
    return NextResponse.redirect(dashboardUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/school/:slug*"],
};
