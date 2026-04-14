import type { Metadata } from "next";
import WelcomePage from "../../components/somalite/front/landing-page";
import { buildMetadata } from "@/lib/seo";

export const metadata: Metadata = buildMetadata({
  title: "Skolastik School Solutions — #1 Primary & Secondary School Management Platform in Uganda",
  description:
    "Skolastik is Uganda's all-in-one school management platform for both Primary and Secondary schools. Manage academics, fees, report cards, timetables, payroll, PLE mock exams, Continuous Assessment, and parent communication — all in one place.",
  path: "/",
});

export default function Page() {
  return <WelcomePage />;
}
