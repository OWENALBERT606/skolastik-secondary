// lib/seo.ts — Shared SEO helpers

import type { Metadata } from "next";

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL ?? "https://skolastik.com";
const SITE_NAME = "Skolastik School Solutions";
const DEFAULT_DESCRIPTION =
  "Skolastik is Uganda's all-in-one school management platform for both Primary and Secondary schools — academics, fees, report cards, timetables, payroll, PLE mock exams, and parent communication in one place.";
const DEFAULT_IMAGE = `${BASE_URL}/og-image.png`;
const DEFAULT_KEYWORDS = [
  "school management system Uganda",
  "primary school management software Uganda",
  "secondary school management software Uganda",
  "school management platform Africa",
  "PLE mock exams Uganda",
  "report card generator Uganda",
  "school fees management Uganda",
  "teacher attendance Uganda",
  "student attendance Uganda",
  "school payroll Uganda",
  "timetable generator Uganda",
  "O-Level report cards Uganda",
  "A-Level report cards Uganda",
  "continuous assessment Uganda",
  "education management system",
  "school administration software",
];

export function buildMetadata({
  title,
  description = DEFAULT_DESCRIPTION,
  path = "",
  image = DEFAULT_IMAGE,
  noIndex = false,
  keywords,
}: {
  title: string;
  description?: string;
  path?: string;
  image?: string;
  noIndex?: boolean;
  keywords?: string[];
}): Metadata {
  const fullTitle = title === SITE_NAME ? title : `${title} | ${SITE_NAME}`;
  const url = `${BASE_URL}${path}`;
  const allKeywords = keywords ? [...keywords, ...DEFAULT_KEYWORDS] : DEFAULT_KEYWORDS;

  return {
    title: fullTitle,
    description,
    keywords: allKeywords,
    metadataBase: new URL(BASE_URL),
    alternates: { canonical: url },
    openGraph: {
      title: fullTitle,
      description,
      url,
      siteName: SITE_NAME,
      images: [{ url: image, width: 1200, height: 630, alt: fullTitle }],
      type: "website",
      locale: "en_UG",
    },
    twitter: {
      card: "summary_large_image",
      title: fullTitle,
      description,
      images: [image],
    },
    robots: noIndex
      ? { index: false, follow: false }
      : { index: true, follow: true, googleBot: { index: true, follow: true } },
  };
}

export { BASE_URL, SITE_NAME, DEFAULT_DESCRIPTION, DEFAULT_KEYWORDS };
