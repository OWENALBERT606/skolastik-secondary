"use client";

import { Loader2, Lock, User2 } from "lucide-react";
import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { LoginProps } from "@/types/types";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import TextInput from "../FormInputs/TextInput";
import PasswordInput from "../FormInputs/PasswordInput";
import Image from "next/image";

export default function LoginForm() {
  const [loading, setLoading] = useState(false);
  const [authErr, setAuthErr] = useState("");

  const {
    handleSubmit,
    register,
    formState: { errors },
    watch,
    reset,
  } = useForm<LoginProps>();

  const router = useRouter();

  // Detect login type from identifier prefix
  const identifier = watch("identifier", "");
  const idUpper    = identifier.toUpperCase();
  const isTeacherId = idUpper.startsWith("TCH");
  const isStaffId   = idUpper.startsWith("STF");
  const isEmail     = identifier.includes("@");
  const fieldLabel  = isEmail ? "Email Address" : isTeacherId ? "Teacher ID" : isStaffId ? "Staff ID" : "ID / Email";

  async function onSubmit(data: LoginProps) {
    try {
      setLoading(true);
      setAuthErr("");

      const loginData = await signIn("credentials", {
        identifier: data.identifier.trim(),
        password:   data.password,
        redirect:   false,
      });

      if (loginData?.error) {
        setLoading(false);
        toast.error("Invalid credentials — check your Staff ID / email and password");
        setAuthErr("Wrong credentials. Please try again.");
        return;
      }

      reset();
      toast.success("Login successful");

      // Fetch role-based redirect URL
      const response = await fetch("/api/auth/redirect");
      const { redirectUrl } = await response.json();

      router.push(redirectUrl);
      router.refresh();
    } catch (error) {
      setLoading(false);
      console.error("Login error:", error);
      toast.error("Network error — please try again");
    }
  }

  return (
    <div className="w-full">
      <div className="rounded-2xl p-8 shadow-2xl border"
        style={{ backgroundColor: "rgba(255,255,255,0.75)", borderColor: "rgba(30,58,110,0.15)" }}>

          {/* Logo + heading */}
          <div className="flex flex-col items-center gap-3 mb-6">
            <Image
              src="/sckola.png"
              width={90}
              height={90}
              alt="Skolastik School Solutions"
              className="object-contain rounded-xl"
            />
            <div className="text-center mt-1">
              <p className="text-base font-semibold text-slate-700">Welcome back</p>
              <p className="text-sm text-slate-500">Sign in to your account</p>
            </div>
          </div>


          <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
            <TextInput
              register={register}
              errors={errors}
              label={fieldLabel}
              name="identifier"
              icon={User2}
              placeholder="Email or Staff ID"
            />

            <PasswordInput
              register={register}
              errors={errors}
              label="Password"
              name="password"
              icon={Lock}
              placeholder="Password"
              forgotPasswordLink="/forgot-password"
            />

            {authErr && (
              <p className="text-red-500 text-xs">{authErr}</p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 rounded-lg font-semibold text-white text-sm transition-opacity hover:opacity-90 disabled:opacity-60 flex items-center justify-center gap-2"
              style={{ backgroundColor: "#1e3a6e" }}
            >
              {loading ? <><Loader2 className="h-4 w-4 animate-spin" /> Signing in…</> : "Sign In"}
            </button>
          </form>

          <p className="text-center text-xs text-slate-400 mt-5">
            Admins use <strong>email</strong> · Teachers use <strong>TCH…</strong> · Staff use <strong>STF…</strong>
          </p>

          {/* Bottom accent bar */}
          <div className="mt-6 h-1 rounded-full" style={{ background: "linear-gradient(90deg, #1e3a6e, #e8a020, #1e3a6e)" }} />
        </div>
      </div>
  );
}
