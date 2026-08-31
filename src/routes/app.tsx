import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { AppShell } from "@/components/app-shell";
import { supabase } from "@/lib/supabase";

export const Route = createFileRoute("/app")({
  beforeLoad: async () => {
    if (typeof window === "undefined") return; // Ignora no servidor, checa só no navegador (evita logout no F5)

    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session) {
      throw redirect({
        to: "/",
      });
    }

    // Lista de e-mails permitidos como Administrador (Dono)
    // Se a variável VITE_ADMIN_EMAIL não existir no servidor (ex: Vercel), usa o e-mail padrão do dono.
    const adminEmail = import.meta.env.VITE_ADMIN_EMAIL || "douglasalmeida156@hotmail.com";
    const ADMIN_EMAILS = adminEmail
      .split(",")
      .map((e: string) => e.trim().toLowerCase())
      .filter(Boolean);

    // Se o e-mail do usuário não for o do dono, bloqueia o acesso e joga para a área de parceiros
    if (!session.user.email || !ADMIN_EMAILS.includes(session.user.email.toLowerCase())) {
      throw redirect({
        to: "/parceiro/dashboard",
      });
    }
  },
  component: () => (
    <AppShell>
      <Outlet />
    </AppShell>
  ),
});
