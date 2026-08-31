import { createFileRoute, useNavigate, redirect } from "@tanstack/react-router";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import logoImg from "@/assets/vivaverde-logo.png";
import { supabase } from "@/lib/supabase";

const authSchema = z.object({
  email: z.string().email({ message: "Insira um e-mail válido." }),
  password: z.string().min(6, { message: "A senha deve ter no mínimo 6 caracteres." }),
});

type AuthFormData = z.infer<typeof authSchema>;

export const Route = createFileRoute("/")({
  beforeLoad: async () => {
    if (typeof window === "undefined") return;

    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (session) {
      throw redirect({
        to: "/app/dashboard",
      });
    }
  },
  head: () => ({ meta: [{ title: "Entrar — VIVAVERDE ERP" }] }),
  component: Login,
});

function Login() {
  const nav = useNavigate();
  const [authError, setAuthError] = useState<string | null>(null);
  const [resetSent, setResetSent] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    getValues,
  } = useForm<AuthFormData>({
    resolver: zodResolver(authSchema),
    defaultValues: { email: "", password: "" },
  });

  const onSubmitLogin = async (data: AuthFormData) => {
    setAuthError(null);
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: data.email,
      password: data.password,
    });

    if (signInError) {
      setAuthError(
        signInError.message === "Invalid login credentials"
          ? "Email ou senha incorretos."
          : signInError.message,
      );
    } else {
      nav({ to: "/app/dashboard" });
    }
  };

  const handleForgotPassword = async () => {
    const email = getValues("email");
    if (!email) {
      setAuthError("Digite seu e-mail acima antes de clicar em Esqueceu.");
      return;
    }
    await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/`,
    });
    setResetSent(true);
    setAuthError(null);
  };
  return (
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden bg-neutral-900">
      {/* Background Image */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: "url('/vasos-foto.jpeg')" }}
      />

      {/* Dark overlay for better contrast */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]" />

      {/* Thin green accent line at top */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-brand shadow-elevated z-20" />

      {/* Login card */}
      <div className="relative z-10 w-full max-w-[420px] px-6">
        {/* Logo centered above card */}
        <div className="flex flex-col items-center mb-8">
          <img src={logoImg} alt="VIVAVERDE" className="h-32 w-auto object-contain" />
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl border border-[#2d5a1e]/10 shadow-[0_8px_40px_-12px_rgba(45,90,30,0.15)] p-8">
          <h2 className="text-center font-display text-lg font-semibold text-[#1a1a1a]">
            Acesso ao sistema
          </h2>
          <p className="text-center text-sm text-[#64748b] mt-1">
            Uso restrito a colaboradores autorizados
          </p>

          <form onSubmit={handleSubmit(onSubmitLogin)} className="mt-6 space-y-4">
            {authError && (
              <div className="bg-red-50 text-red-600 text-sm p-3 rounded-md border border-red-200">
                {authError}
              </div>
            )}
            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-sm font-medium text-[#374151]">
                E-mail
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="usuario@vivaverde.com.br"
                {...register("email")}
                className={`h-11 border-[#e5e7eb] focus:border-[#4a7c2a] focus:ring-[#4a7c2a]/20 ${errors.email ? "border-red-500 focus:border-red-500 focus:ring-red-500/20" : ""}`}
              />
              {errors.email && <p className="text-xs text-red-500">{errors.email.message}</p>}
            </div>
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="password" className="text-sm font-medium text-[#374151]">
                  Senha
                </Label>
                <button
                  type="button"
                  onClick={handleForgotPassword}
                  className="text-xs font-medium text-[#4a7c2a] hover:text-[#2d5a1e] hover:underline transition-colors"
                >
                  {resetSent ? "✅ Link enviado!" : "Esqueceu?"}
                </button>
              </div>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                {...register("password")}
                className={`h-11 border-[#e5e7eb] focus:border-[#4a7c2a] focus:ring-[#4a7c2a]/20 ${errors.password ? "border-red-500 focus:border-red-500 focus:ring-red-500/20" : ""}`}
              />
              {errors.password && <p className="text-xs text-red-500">{errors.password.message}</p>}
            </div>

            <label className="flex items-center gap-2 text-sm text-[#64748b]">
              <Checkbox
                className="border-[#d1d5db] data-[state=checked]:bg-[#4a7c2a] data-[state=checked]:border-[#4a7c2a]"
                defaultChecked
              />
              Lembrar este computador
            </label>

            <div className="flex pt-2">
              <Button
                type="submit"
                size="lg"
                disabled={isSubmitting}
                className="w-full h-11 bg-gradient-brand hover:brightness-110 text-white font-semibold shadow-elevated transition-all"
              >
                {isSubmitting ? "Aguarde..." : "Entrar"}
              </Button>
            </div>
          </form>
        </div>

        {/* Footer */}
        <p className="mt-6 text-center text-[10px] text-[#9ca3af] tracking-wide">
          VIVAVERDE Distribuidora de Vasos e Acessórios Ltda · Sistema Interno
        </p>
      </div>
    </div>
  );
}
