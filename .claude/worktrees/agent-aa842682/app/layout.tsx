import type { Metadata } from "next";
import { Rethink_Sans } from "next/font/google";
import "./globals.css";
// import { Toaster } from "react-hot-toast";
import { Providers } from "./providers";
import { Toaster } from "sonner";

// import FooterBanner from "@/components/Footer";
const inter = Rethink_Sans({ subsets: ["latin"], display: "swap" });

export const metadata: Metadata = {
  title: "Skolastik School Solutions",
  description: "Skolastik School Solutions — All-in-one school management platform for African schools",
};
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <Providers>{children}</Providers>
        <Toaster/>
      </body>
    </html>
  );
}
