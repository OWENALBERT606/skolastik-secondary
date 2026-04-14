"use client";

import React, { useState } from "react";
import { signOut } from "next-auth/react";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { ThemeToggle }    from "@/components/theme-toggle";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import {
  ChevronsUpDown, User, KeyRound, LogOut, Wallet,
} from "lucide-react";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import Link from "next/link";

interface Props {
  session: { name: string; email: string; image?: string | null };
  slug:    string;
}

export default function BursarNav({ session, slug }: Props) {
  const [search, setSearch] = useState("");

  const initials = session.name
    .split(" ").map(w => w[0]).slice(0, 2).join("").toUpperCase();

  async function handleLogout() {
    await signOut({ callbackUrl: "/login" });
  }

  return (
    <div className="flex h-14 items-center gap-3 px-4 border-b border-zinc-200 dark:border-slate-700/40 bg-white dark:bg-[#0d1117]">
      <SidebarTrigger className="text-zinc-500 hover:text-zinc-900 dark:text-slate-400 dark:hover:text-white transition-colors" />

      {/* Portal badge */}
      <span className="hidden sm:flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full bg-primary/10 text-primary border border-primary/20">
        <Wallet className="h-3.5 w-3.5" />
        Bursar Portal
      </span>

      {/* Search */}
      <div className="flex-1">
        <Input
          placeholder="Search..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="max-w-sm bg-zinc-50 dark:bg-slate-800/60 border-zinc-200 dark:border-slate-700/60 text-zinc-900 dark:text-white placeholder:text-zinc-400 dark:placeholder:text-slate-500 focus-visible:ring-primary/40 focus-visible:border-primary"
        />
      </div>

      <ThemeToggle />

      {/* User dropdown */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button className="flex items-center gap-2.5 rounded-lg px-2 py-1.5 hover:bg-zinc-100 dark:hover:bg-slate-800/60 transition-colors outline-none">
            <Avatar className="h-8 w-8 rounded-lg shrink-0">
              <AvatarImage src={session.image ?? ""} alt={session.name} />
              <AvatarFallback className="rounded-lg bg-primary text-primary-foreground text-xs font-semibold">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="hidden sm:grid text-left text-sm leading-tight">
              <span className="truncate font-semibold text-zinc-900 dark:text-white max-w-[120px]">{session.name}</span>
              <span className="truncate text-xs text-zinc-500 dark:text-slate-400">Bursar</span>
            </div>
            <ChevronsUpDown className="h-4 w-4 text-zinc-400 dark:text-slate-500 shrink-0" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          className="w-56 rounded-xl bg-white dark:bg-[#111827] border border-zinc-200 dark:border-slate-700/60 shadow-lg"
          side="bottom" align="end" sideOffset={8}
        >
          <DropdownMenuLabel className="p-0 font-normal">
            <div className="flex items-center gap-3 px-3 py-3">
              <Avatar className="h-9 w-9 rounded-lg shrink-0">
                <AvatarImage src={session.image ?? ""} alt={session.name} />
                <AvatarFallback className="rounded-lg bg-primary text-primary-foreground text-xs font-semibold">{initials}</AvatarFallback>
              </Avatar>
              <div className="grid flex-1 text-left text-sm leading-tight min-w-0">
                <span className="truncate font-semibold text-zinc-900 dark:text-white">{session.name}</span>
                <span className="truncate text-xs text-zinc-500 dark:text-slate-400">{session.email}</span>
                <span className="truncate text-xs text-primary font-medium mt-0.5">Bursar</span>
              </div>
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator className="bg-zinc-100 dark:bg-slate-700/40" />
          <DropdownMenuItem asChild className="gap-2 text-zinc-700 dark:text-slate-200 hover:bg-zinc-100 dark:hover:bg-slate-700/60 cursor-pointer rounded-lg mx-1">
            <Link href={`/school/${slug}/bursar/profile`}>
              <User size={14} className="text-zinc-400" /> My Profile
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild className="gap-2 text-zinc-700 dark:text-slate-200 hover:bg-zinc-100 dark:hover:bg-slate-700/60 cursor-pointer rounded-lg mx-1">
            <Link href="/dashboard/change-password">
              <KeyRound size={14} className="text-zinc-400" /> Change Password
            </Link>
          </DropdownMenuItem>
          <DropdownMenuSeparator className="bg-zinc-100 dark:bg-slate-700/40" />
          <DropdownMenuItem onClick={handleLogout}
            className="gap-2 text-red-500 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 focus:text-red-500 cursor-pointer rounded-lg mx-1 mb-1">
            <LogOut size={14} /> Sign out
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
