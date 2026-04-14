import type { Metadata } from "next";
import LoginForm from "@/components/Forms/LoginForm";
import { GridBackground } from "@/components/reusable-ui/grid-background";
import { buildMetadata } from "@/lib/seo";

export const metadata: Metadata = buildMetadata({
  title: "Sign In",
  description: "Sign in to your Skolastik school management account.",
  path: "/login",
  noIndex: true,
});

export default async function LoginPage() {
  return (
    <GridBackground imageSrc="/pexels-mickael-ange-konan-2156070331-34526411.jpg">
      <div className="w-full max-w-md px-4">
        <LoginForm />
      </div>
    </GridBackground>
  );
}
