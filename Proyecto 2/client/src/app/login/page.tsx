"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import AuthLayout from "@/components/templates/AuthLayout";
import LoginCard from "@/components/organisms/LoginCard";
import { useAuth } from "@/lib/hooks/useAuth";

export default function LoginPage() {
  const { status } = useAuth();
  const router = useRouter();

  // Si ya hay sesión, no mostrar el login: ir al panel.
  useEffect(() => {
    if (status === "authed") router.replace("/");
  }, [status, router]);

  return (
    <AuthLayout>
      <LoginCard />
    </AuthLayout>
  );
}
