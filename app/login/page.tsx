import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCurrentStudent } from "@/lib/auth";
import { LoginForm } from "@/components/login-form";
import { PixelShader } from "@/components/pixel-shader";

export const metadata: Metadata = {
  title: "Вход — Деканат",
};


export default async function LoginPage() {
  const student = await getCurrentStudent();
  if (student) redirect("/");

  return (
    <main className="relative flex min-h-dvh flex-col items-center justify-center overflow-hidden px-4">
      <PixelShader className="absolute inset-0 -z-10" />
      <div className="w-full max-w-100">
        <LoginForm />
      </div>
    </main>
  );
}
