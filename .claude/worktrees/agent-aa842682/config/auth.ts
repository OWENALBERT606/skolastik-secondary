// config/auth.ts

import type { NextAuthOptions } from "next-auth/index";
import { PrismaAdapter }        from "@next-auth/prisma-adapter";
import type { Adapter }         from "next-auth/adapters";
import CredentialsProvider      from "next-auth/providers/credentials";
import { compare }              from "bcryptjs";
import { db }                   from "@/prisma/db";
import { buildCapabilities }    from "@/lib/utils/capabilities";

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(db) as Adapter,
  secret:  process.env.NEXTAUTH_SECRET,
  session: { strategy: "jwt" },
  pages:   { signIn: "/login" },

  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        identifier: { label: "Email or Staff ID", type: "text" },
        password:   { label: "Password",          type: "password" },
      },

      async authorize(credentials) {
        if (!credentials?.identifier || !credentials?.password) return null;

        const id      = credentials.identifier.trim();
        const idUpper = id.toUpperCase();
        let userId: string | null = null;
        let passwordHash: string | null = null;
        let userData: any = null;
        let loginAs: "teacher" | "staff" | "admin" | "student" = "teacher";

        if (id.includes("@")) {
          // ── Email login (admins, school admins) ──────────────────────────
          const user = await db.user.findUnique({
            where:   { email: id },
            include: { roles: true },
          });
          if (!user) return null;
          userId       = user.id;
          passwordHash = user.password;
          userData     = user;
          loginAs      = "admin";

        } else if (idUpper.startsWith("TCH")) {
          // ── Teacher ID login → always teacher portal ──────────────────────
          const teacher = await db.teacher.findFirst({
            where:   { staffNo: id, status: "ACTIVE" },
            include: { user: { include: { roles: true } } },
          });
          if (!teacher?.user) return null;
          userId       = teacher.user.id;
          passwordHash = teacher.user.password;
          userData     = teacher.user;
          loginAs      = "teacher";

        } else if (idUpper.startsWith("STF")) {
          // ── Staff ID login → staff portal (DOS / Head Teacher / etc.) ─────
          const staff = await db.staff.findFirst({
            where:   { staffId: id, status: "ACTIVE" },
            include: { user: { include: { roles: true } } },
          });
          if (!staff?.user) return null;
          userId       = staff.user.id;
          passwordHash = staff.user.password;
          userData     = staff.user;
          loginAs      = "staff";

        } else {
          // ── Fallback: try student (admissionNo / LIN) ─────────────────────
          const studentRows = await db.$queryRaw<{ userId: string }[]>`
            SELECT "userId" FROM "Student"
            WHERE ("admissionNo" = ${id} OR "linNumber" = ${id})
            AND "isActive" = true
            LIMIT 1
          `;
          if (!studentRows.length || !studentRows[0].userId) return null;
          const studentUser = await db.user.findUnique({
            where:   { id: studentRows[0].userId },
            include: { roles: true },
          });
          if (!studentUser) return null;
          userId       = studentUser.id;
          passwordHash = studentUser.password;
          userData     = studentUser;
          loginAs      = "student";
        }

        if (!passwordHash) return null;
        const ok = await compare(credentials.password, passwordHash);
        if (!ok) return null;

        return {
          id:          userId!,
          name:        userData.name,
          email:       userData.email,
          image:       userData.image,
          firstName:   userData.firstName,
          lastName:    userData.lastName,
          phone:       userData.phone,
          roles:       userData.roles,
          permissions: [...new Set(userData.roles.flatMap((r: any) => r.permissions))] as string[],
          loginAs,
        };
      },
    }),
  ],

  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        // First sign-in — build full capability set
        const caps = await buildCapabilities(user.id);
        token.id           = user.id;
        token.firstName    = (user as any).firstName;
        token.lastName     = (user as any).lastName;
        token.phone        = (user as any).phone;
        token.capabilities = caps;
        token.school       = caps.school;
        token.loginAs      = (user as any).loginAs ?? "teacher";
        // Keep legacy roles array for any code still reading it
        token.roles        = (user as any).roles ?? [];
        token.permissions  = (user as any).permissions ?? [];
      } else if (token.id && !token.loginAs) {
        // Stale JWT (created before loginAs was added) — re-derive from DB
        try {
          const userId = token.id as string;
          const dbUser = await db.user.findUnique({
            where:  { id: userId },
            select: { loginId: true },
          });
          const lid = dbUser?.loginId?.toUpperCase() ?? "";
          if (lid.startsWith("STF")) {
            token.loginAs = "staff";
          } else if (lid.startsWith("TCH")) {
            token.loginAs = "teacher";
          } else if (dbUser?.loginId?.includes("@")) {
            token.loginAs = "admin";
          } else {
            token.loginAs = "teacher";
          }
        } catch {
          token.loginAs = "teacher";
        }
      }
      return token;
    },

    async session({ session, token }) {
      if (session.user) {
        const u        = session.user as any;
        u.id           = token.id;
        u.firstName    = token.firstName;
        u.lastName     = token.lastName;
        u.phone        = token.phone;
        u.capabilities = token.capabilities;
        u.school       = token.school;
        u.loginAs      = token.loginAs;
        u.roles        = token.roles;
        u.permissions  = token.permissions;
      }
      return session;
    },
  },
};
