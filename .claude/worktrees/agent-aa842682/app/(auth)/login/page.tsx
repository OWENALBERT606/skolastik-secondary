import LoginForm from "@/components/Forms/LoginForm";
import { GridBackground } from "@/components/reusable-ui/grid-background";

export default async function LoginPage() {
  return (
    <GridBackground imageSrc="/pexels-mickael-ange-konan-2156070331-34526411.jpg">
      <div className="w-full max-w-md px-4">
        <LoginForm />
      </div>
    </GridBackground>
  );
}
