import { cn } from "@/lib/utils";
import { BookA, CircleDollarSign, Code, Code2, GraduationCap, User } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import React from "react";

export default function Logo({
  variant = "light",
  size = "md",
  full = true,
  href = "/",
}: {
  variant?: "dark" | "light";
  size?: "sm" | "md" | "lg";
  full?: boolean;
  href?: string;
}) {
  if (variant === "light") {
    return (
      <Link href={href} className="flex items-center space-x-2">
        <div className="p-1">
          <span className="font-bold text-xl text-white">
            <Image src="/logos/ChatGPT Image Aug 26, 2025, 04_24_48 PM.png" width={50} height={50} alt="logo"/>
          </span>
        </div>
        <span className={cn(" font-bold text-xl", size === "lg" && "text-4xl")}>
          SOMA{full && <span className="text-blue-500">LITE</span>}
        </span>
      </Link>
    );
  } else {
    return (
      <Link href={"/"} className="flex items-center space-x-2">
        <div className="bg-white rounded-full p-1">
          <span className="text-blue-800 font-bold text-xl">
            <GraduationCap />
          </span>
        </div>
        <span className="font-bold text-xl">
          K <span className="text-blue-100">B</span>
        </span>
      </Link>
    );
  }
}
