"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  BookOpen, BarChart3, Users, FileText, GraduationCap, TrendingUp,
  Check, CheckCircle2, ChevronLeft, ChevronRight, DollarSign,
  Bell, Shield, ArrowRight, Menu, X, Phone, Mail, MapPin, Star,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge }  from "@/components/ui/badge";

// Skolastik brand: navy #1e3a6e, gold #e8a020

const features = [
  {
    icon: Users, color: "bg-blue-900/10 text-blue-800",
    title: "Student Management",
    desc: "Complete student profiles with enrollment history, academic records, health info, and parent contacts.",
    visual: "bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950/40 dark:to-blue-900/20",
    items: ["Admission & enrollment", "Promotion & transfer", "Parent portal access", "Medical & personal records"],
  },
  {
    icon: BookOpen, color: "bg-amber-500/10 text-amber-600",
    title: "Academic Management",
    desc: "Manage classes, streams, subjects, and timetables. Track marks from BOT to EOT with full approval workflows.",
    visual: "bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-950/40 dark:to-amber-900/20",
    items: ["Classes & streams", "Subject & paper management", "Marks entry & approval", "AOI / continuous assessment"],
  },
  {
    icon: FileText, color: "bg-blue-900/10 text-blue-800",
    title: "Report Cards",
    desc: "Auto-generate O-Level and A-Level report cards with divisions, aggregates, positions, and teacher comments.",
    visual: "bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950/40 dark:to-blue-900/20",
    items: ["O-Level & A-Level formats", "Division & aggregate points", "Class & stream positions", "Bulk PDF generation"],
  },
  {
    icon: DollarSign, color: "bg-amber-500/10 text-amber-600",
    title: "Fee Management",
    desc: "Full fee lifecycle — invoicing, payments, receipts, bursaries, and carry-forward balances across terms.",
    visual: "bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-950/40 dark:to-amber-900/20",
    items: ["Auto & manual invoicing", "Payment receipts", "Bursary allocations", "Term carry-forward"],
  },
  {
    icon: BarChart3, color: "bg-blue-900/10 text-blue-800",
    title: "Analytics & Insights",
    desc: "School-wide dashboards for academic performance, fee collection, teacher workload, and enrollment trends.",
    visual: "bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950/40 dark:to-blue-900/20",
    items: ["Performance dashboards", "Subject pass rates", "Fee collection reports", "Teacher workload view"],
  },
  {
    icon: Users, color: "bg-amber-500/10 text-amber-600",
    title: "Staff & HR",
    desc: "Manage teaching and non-teaching staff, roles, payroll batches, leave, and attendance records.",
    visual: "bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-950/40 dark:to-amber-900/20",
    items: ["Staff profiles & roles", "Payroll management", "Leave & attendance", "DOS & teacher portals"],
  },
  {
    icon: Bell, color: "bg-blue-900/10 text-blue-800",
    title: "Communication",
    desc: "Send SMS, email, and in-app notifications to parents, students, and staff.",
    visual: "bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950/40 dark:to-blue-900/20",
    items: ["SMS & email blasts", "Event management", "Notice board", "Parent notifications"],
  },
  {
    icon: Shield, color: "bg-amber-500/10 text-amber-600",
    title: "Multi-School & Roles",
    desc: "Run multiple schools from one platform with fine-grained role-based access.",
    visual: "bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-950/40 dark:to-amber-900/20",
    items: ["Multi-school support", "Role-based access", "Audit trails", "Secure data isolation"],
  },
];

const stats = [
  { value: "10,000+", label: "Students managed" },
  { value: "50+",     label: "Schools onboarded" },
  { value: "99.9%",   label: "Uptime SLA" },
  { value: "< 2s",    label: "Average page load" },
];

const testimonials = [
  { name: "Sr. Mary Nakato", role: "Headteacher, St. Joseph's Girls",
    quote: "Skolastik cut our report card processing from 3 days to 2 hours. Parents love getting results on time.", stars: 5 },
  { name: "Mr. David Ssemakula", role: "Director of Studies, Kampala High",
    quote: "The marks approval workflow is exactly what we needed. Teachers submit, I review, results are locked — no more errors.", stars: 5 },
  { name: "Mrs. Grace Apio", role: "Bursar, Gulu Secondary",
    quote: "Fee tracking used to be a nightmare. Now I see every student's balance, invoices, and payment history instantly.", stars: 5 },
];

const AUTOPLAY_MS = 5000;

export default function WelcomePage() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [activeFeature, setActiveFeature] = useState(0);
  const [testimonialIdx, setTestimonialIdx] = useState(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    timerRef.current = setTimeout(() => setTestimonialIdx(i => (i + 1) % testimonials.length), AUTOPLAY_MS);
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [testimonialIdx]);

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 overflow-x-hidden">

      {/* NAV */}
      <header className="sticky top-0 z-50 bg-white/90 dark:bg-slate-950/90 backdrop-blur border-b border-slate-200 dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Image src="/logos/Gemini_Generated_Image_3r32d3r32d3r32d3.png" alt="Skolastik" width={38} height={38} className="rounded-lg object-contain" />
            <div className="flex flex-col leading-none">
              <span className="font-extrabold text-base tracking-wide" style={{ color: "#1e3a6e" }}>
                SKOLA<span style={{ color: "#e8a020" }}>STIK</span>
              </span>
              <span className="text-[10px] text-slate-500 dark:text-slate-400 tracking-widest uppercase">School Solutions</span>
            </div>
          </div>

          <nav className="hidden md:flex items-center gap-8 text-sm font-medium">
            {["Features", "How it works", "Testimonials", "Contact"].map(item => (
              <a key={item} href={`#${item.toLowerCase().replace(/ /g, "-")}`}
                className="text-slate-600 dark:text-slate-400 hover:text-[#1e3a6e] dark:hover:text-blue-400 transition-colors">
                {item}
              </a>
            ))}
          </nav>

          <div className="hidden md:flex items-center gap-3">
            <Link href="/login"><Button variant="ghost" size="sm">Sign in</Button></Link>
            <Link href="/login">
              <Button size="sm" style={{ backgroundColor: "#1e3a6e" }} className="hover:opacity-90 text-white">Get started</Button>
            </Link>
          </div>

          <button className="md:hidden p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800" onClick={() => setMobileOpen(v => !v)}>
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>

        {mobileOpen && (
          <div className="md:hidden border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-4 py-4 space-y-3">
            {["Features", "How it works", "Testimonials", "Contact"].map(item => (
              <a key={item} href={`#${item.toLowerCase().replace(/ /g, "-")}`} onClick={() => setMobileOpen(false)}
                className="block text-sm font-medium text-slate-600 dark:text-slate-400 py-1">
                {item}
              </a>
            ))}
            <div className="flex gap-2 pt-2">
              <Link href="/login" className="flex-1"><Button variant="outline" size="sm" className="w-full">Sign in</Button></Link>
              <Link href="/login" className="flex-1">
                <Button size="sm" className="w-full text-white" style={{ backgroundColor: "#1e3a6e" }}>Get started</Button>
              </Link>
            </div>
          </div>
        )}
      </header>

      {/* HERO */}
      <section className="relative overflow-hidden pt-20 pb-24" style={{ background: "linear-gradient(135deg, #f8f6f0 0%, #eef3fb 60%, #fff 100%)" }}>
        <div className="absolute -top-40 -right-40 w-96 h-96 rounded-full blur-3xl pointer-events-none" style={{ background: "rgba(30,58,110,0.07)" }} />
        <div className="absolute -bottom-20 -left-20 w-80 h-80 rounded-full blur-3xl pointer-events-none" style={{ background: "rgba(232,160,32,0.08)" }} />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <Badge className="px-3 py-1 text-sm border" style={{ backgroundColor: "#eef3fb", color: "#1e3a6e", borderColor: "#c5d5ee" }}>
                🎓 Built for African Schools
              </Badge>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold leading-tight tracking-tight">
                Run your school{" "}
                <span style={{ color: "#1e3a6e" }}>smarter,</span>{" "}
                <span style={{ color: "#e8a020" }}>not harder</span>
              </h1>
              <p className="text-lg text-slate-600 dark:text-slate-400 max-w-lg leading-relaxed">
                Skolastik School Solutions is an all-in-one school management platform — academics, fees, staff, report cards, and parent communication in one place.
              </p>
              <div className="flex flex-wrap gap-3">
                <Link href="/login">
                  <Button size="lg" className="text-white px-8 gap-2 hover:opacity-90" style={{ backgroundColor: "#1e3a6e" }}>
                    Get started free <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
                <a href="#features">
                  <Button size="lg" variant="outline" className="px-8" style={{ borderColor: "#1e3a6e", color: "#1e3a6e" }}>
                    See features
                  </Button>
                </a>
              </div>
              <div className="flex flex-wrap gap-4 pt-2">
                {["No setup fee", "Free onboarding", "Cancel anytime"].map(t => (
                  <div key={t} className="flex items-center gap-1.5 text-sm text-slate-600 dark:text-slate-400">
                    <Check className="h-4 w-4" style={{ color: "#e8a020" }} /> {t}
                  </div>
                ))}
              </div>
            </div>

            <div className="relative">
              <div className="rounded-2xl overflow-hidden shadow-2xl border border-slate-200 dark:border-slate-700">
                <Image src="/images/dash.webp" alt="Skolastik dashboard" width={720} height={480} className="w-full object-cover" priority />
              </div>
              <div className="absolute -bottom-4 -left-4 bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700 px-4 py-3 flex items-center gap-3">
                <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ backgroundColor: "#eef3fb" }}>
                  <TrendingUp className="h-4 w-4" style={{ color: "#1e3a6e" }} />
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-900 dark:text-slate-100">Report cards ready</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Generated in seconds</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* STATS BAR */}
      <section className="py-10" style={{ backgroundColor: "#1e3a6e" }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 text-center text-white">
            {stats.map(s => (
              <div key={s.label}>
                <p className="text-3xl font-extrabold" style={{ color: "#e8a020" }}>{s.value}</p>
                <p className="text-sm text-blue-100 mt-1">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FEATURES GRID */}
      <section id="features" className="py-24 bg-white dark:bg-slate-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <Badge className="mb-4 border" style={{ backgroundColor: "#eef3fb", color: "#1e3a6e", borderColor: "#c5d5ee" }}>Everything you need</Badge>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">One platform, every school need</h2>
            <p className="mt-4 text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
              From admissions to graduation — Skolastik covers every workflow your school runs daily.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {features.map((f, i) => (
              <div key={f.title} onClick={() => setActiveFeature(i)}
                className={`rounded-2xl p-5 cursor-pointer border transition-all duration-200 ${f.visual} ${
                  activeFeature === i ? "shadow-md" : "border-slate-200 dark:border-slate-800"
                }`}
                style={activeFeature === i ? { borderColor: "#1e3a6e" } : {}}
              >
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${f.color}`}>
                  <f.icon className="h-5 w-5" />
                </div>
                <h3 className="font-semibold text-slate-900 dark:text-slate-100 mb-1">{f.title}</h3>
                <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">{f.desc}</p>
                <ul className="mt-3 space-y-1">
                  {f.items.map(item => (
                    <li key={item} className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-400">
                      <Check className="h-3 w-3 shrink-0" style={{ color: "#e8a020" }} /> {item}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section id="how-it-works" className="py-24 bg-slate-50 dark:bg-[#0d1117]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-24">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-5">
              <Badge className="border" style={{ backgroundColor: "#eef3fb", color: "#1e3a6e", borderColor: "#c5d5ee" }}>Academic Management</Badge>
              <h2 className="text-3xl font-bold tracking-tight">Marks, results, and report cards — automated</h2>
              <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                Teachers enter marks per exam, the system computes totals, grades, divisions, and positions automatically. Approve results with one click and generate PDF report cards in bulk.
              </p>
              <ul className="space-y-2">
                {["BOT, MTE, EOT exam marks", "AOI / continuous assessment", "O-Level & A-Level report cards", "Bulk PDF generation"].map(item => (
                  <li key={item} className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
                    <CheckCircle2 className="h-4 w-4 shrink-0" style={{ color: "#e8a020" }} /> {item}
                  </li>
                ))}
              </ul>
            </div>
            <div className="rounded-2xl overflow-hidden shadow-xl border border-slate-200 dark:border-slate-700">
              <Image src="/features/modern-dashboard-with-charts-and-reports.png" alt="Academic dashboard" width={640} height={400} className="w-full object-cover" />
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="order-2 lg:order-1 rounded-2xl overflow-hidden shadow-xl border border-slate-200 dark:border-slate-700">
              <Image src="/features/student-analytics-dashboard-with-graphs.png" alt="Analytics" width={640} height={400} className="w-full object-cover" />
            </div>
            <div className="order-1 lg:order-2 space-y-5">
              <Badge className="border" style={{ backgroundColor: "#fff8ec", color: "#b45309", borderColor: "#fcd38a" }}>Analytics</Badge>
              <h2 className="text-3xl font-bold tracking-tight">Data-driven decisions for school leaders</h2>
              <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                Real-time dashboards show performance trends, fee collection rates, subject pass rates, and teacher workload.
              </p>
              <ul className="space-y-2">
                {["Performance trends by class & stream", "Subject pass/fail rates", "Fee collection overview", "Teacher workload reports"].map(item => (
                  <li key={item} className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
                    <CheckCircle2 className="h-4 w-4 shrink-0" style={{ color: "#e8a020" }} /> {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* TESTIMONIALS */}
      <section id="testimonials" className="py-24 bg-white dark:bg-slate-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <Badge className="mb-4 border" style={{ backgroundColor: "#eef3fb", color: "#1e3a6e", borderColor: "#c5d5ee" }}>Testimonials</Badge>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">Trusted by school leaders</h2>
          </div>
          <div className="relative max-w-3xl mx-auto">
            <div className="bg-slate-50 dark:bg-slate-900 rounded-2xl p-8 border border-slate-200 dark:border-slate-800 text-center">
              <div className="flex justify-center gap-1 mb-4">
                {Array.from({ length: testimonials[testimonialIdx].stars }).map((_, i) => (
                  <Star key={i} className="h-5 w-5 fill-amber-400 text-amber-400" />
                ))}
              </div>
              <p className="text-lg text-slate-700 dark:text-slate-300 italic leading-relaxed mb-6">
                "{testimonials[testimonialIdx].quote}"
              </p>
              <p className="font-semibold text-slate-900 dark:text-slate-100">{testimonials[testimonialIdx].name}</p>
              <p className="text-sm text-slate-500 dark:text-slate-400">{testimonials[testimonialIdx].role}</p>
            </div>
            <div className="flex items-center justify-center gap-3 mt-6">
              <button onClick={() => setTestimonialIdx(i => (i - 1 + testimonials.length) % testimonials.length)}
                className="w-8 h-8 rounded-full border border-slate-200 dark:border-slate-700 flex items-center justify-center hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                <ChevronLeft className="h-4 w-4" />
              </button>
              {testimonials.map((_, i) => (
                <button key={i} onClick={() => setTestimonialIdx(i)}
                  className="h-2 rounded-full transition-all"
                  style={{ width: i === testimonialIdx ? "16px" : "8px", backgroundColor: i === testimonialIdx ? "#1e3a6e" : "#cbd5e1" }} />
              ))}
              <button onClick={() => setTestimonialIdx(i => (i + 1) % testimonials.length)}
                className="w-8 h-8 rounded-full border border-slate-200 dark:border-slate-700 flex items-center justify-center hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* PRICING */}
      <section className="py-24 bg-slate-50 dark:bg-[#0d1117]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <Badge className="mb-4 border" style={{ backgroundColor: "#eef3fb", color: "#1e3a6e", borderColor: "#c5d5ee" }}>Pricing</Badge>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">Simple, transparent pricing</h2>
            <p className="mt-4 text-slate-600 dark:text-slate-400">Start free, scale as you grow.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {[
              { name: "Starter", price: "Free", period: "forever", desc: "Perfect for small schools getting started.",
                features: ["Up to 200 students", "Basic academics", "Fee tracking", "Email support"], cta: "Get started", highlight: false },
              { name: "Growth", price: "UGX 150k", period: "/ term", desc: "For growing schools that need more power.",
                features: ["Up to 800 students", "Full academics + report cards", "Fee management", "SMS notifications", "Priority support"], cta: "Start trial", highlight: false },
              { name: "Scale", price: "UGX 300k", period: "/ term", desc: "For large schools with complex needs.",
                features: ["Unlimited students", "Multi-stream support", "Analytics dashboard", "Payroll management", "Dedicated support"], cta: "Start trial", highlight: true },
              { name: "Enterprise", price: "Custom", period: "", desc: "For school networks and multi-campus groups.",
                features: ["Multiple schools", "Custom integrations", "SLA guarantee", "On-site training"], cta: "Contact us", highlight: false },
            ].map(plan => (
              <div key={plan.name} className={`rounded-2xl p-6 border flex flex-col ${
                plan.highlight ? "text-white shadow-xl" : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800"
              }`} style={plan.highlight ? { backgroundColor: "#1e3a6e", borderColor: "#1e3a6e" } : {}}>
                {plan.highlight && (
                  <Badge className="self-start mb-3 text-xs" style={{ backgroundColor: "rgba(255,255,255,0.2)", color: "white", borderColor: "rgba(255,255,255,0.3)" }}>
                    Most popular
                  </Badge>
                )}
                <h3 className={`font-bold text-lg ${plan.highlight ? "text-white" : "text-slate-900 dark:text-slate-100"}`}>{plan.name}</h3>
                <div className="mt-2 mb-1 flex items-end gap-1">
                  <span className={`text-3xl font-extrabold ${plan.highlight ? "text-white" : "text-slate-900 dark:text-slate-100"}`}
                    style={plan.highlight ? { color: "#e8a020" } : {}}>{plan.price}</span>
                  {plan.period && <span className={`text-sm mb-1 ${plan.highlight ? "text-blue-200" : "text-slate-500 dark:text-slate-400"}`}>{plan.period}</span>}
                </div>
                <p className={`text-sm mb-4 ${plan.highlight ? "text-blue-200" : "text-slate-500 dark:text-slate-400"}`}>{plan.desc}</p>
                <ul className="space-y-2 flex-1 mb-6">
                  {plan.features.map(f => (
                    <li key={f} className={`flex items-center gap-2 text-sm ${plan.highlight ? "text-blue-100" : "text-slate-600 dark:text-slate-400"}`}>
                      <Check className="h-4 w-4 shrink-0" style={{ color: plan.highlight ? "#e8a020" : "#e8a020" }} /> {f}
                    </li>
                  ))}
                </ul>
                <Link href="/login">
                  <Button className="w-full hover:opacity-90" size="sm"
                    style={plan.highlight
                      ? { backgroundColor: "#e8a020", color: "#1e3a6e" }
                      : { backgroundColor: "#1e3a6e", color: "white" }}>
                    {plan.cta}
                  </Button>
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CONTACT */}
      <section id="contact" className="py-24 bg-white dark:bg-slate-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <Badge className="mb-4 border" style={{ backgroundColor: "#eef3fb", color: "#1e3a6e", borderColor: "#c5d5ee" }}>Contact</Badge>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">Get in touch</h2>
            <p className="mt-4 text-slate-600 dark:text-slate-400">We'd love to hear from you.</p>
          </div>
          <div className="flex flex-col sm:flex-row justify-center gap-8 text-sm text-slate-600 dark:text-slate-400">
            <div className="flex items-center gap-2"><Phone className="h-4 w-4" style={{ color: "#1e3a6e" }} /> +256 700 000 000</div>
            <div className="flex items-center gap-2"><Mail className="h-4 w-4" style={{ color: "#1e3a6e" }} /> hello@skolastik.com</div>
            <div className="flex items-center gap-2"><MapPin className="h-4 w-4" style={{ color: "#1e3a6e" }} /> Kampala, Uganda</div>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer style={{ backgroundColor: "#1e3a6e" }} className="text-blue-200 py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm">
          <div className="flex items-center gap-3">
            <Image src="/logos/skolastik-logo.jpg" alt="Skolastik" width={28} height={28} className="rounded object-contain" />
            <span className="font-extrabold text-white tracking-wide">
              SKOLA<span style={{ color: "#e8a020" }}>STIK</span>
            </span>
            <span className="text-blue-300 text-xs">School Solutions</span>
          </div>
          <p className="text-blue-300">© {new Date().getFullYear()} Skolastik School Solutions. All rights reserved.</p>
        </div>
      </footer>

    </div>
  );
}
