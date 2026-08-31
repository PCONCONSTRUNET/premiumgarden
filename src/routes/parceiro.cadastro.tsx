import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { supabaseParceiro as supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { VivaverdeLogo } from "@/components/vivaverde-logo";

export const Route = createFileRoute("/parceiro/cadastro")({
  beforeLoad: async () => {
    if (typeof window !== "undefined") {
      await supabase.auth.signOut();
    }
  },
  head: () => ({ meta: [{ title: "Cadastro de Parceiro — VIVAVERDE" }] }),
  component: CadastroParceiro,
});

function CadastroParceiro() {
  const navigate = useNavigate();
  const [nome, setNome] = useState("");
  const [telefone, setTelefone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleCadastro = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      // 1. Cria a conta no Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            nome,
            telefone,
          },
        },
      });

      if (authError) throw authError;

      // 2. Cria o registro na tabela vendedores
      if (authData.user) {
        const { error: dbError } = await supabase.from("vendedores").insert([
          {
            user_id: authData.user.id,
            nome,
            email,
            telefone,
            status: "Aguardando Aprovação", // <--- Bloqueado por padrão
            valor_comissao: 0,
          },
        ]);

        if (dbError) throw dbError;

        // 3. Dispara a notificação para o dono
        await supabase.from("notificacoes").insert([
          {
            tipo: "parceiro",
            titulo: `Nova solicitação de parceria`,
            mensagem: `${nome} (${email}) se cadastrou e está aguardando aprovação.`,
          },
        ]);
      }

      // Sucesso! Aguarda meio segundo para o banco sincronizar e redireciona para o dashboard
      setTimeout(() => {
        navigate({ to: "/parceiro/dashboard" });
      }, 500);
    } catch (err: any) {
      setError(err.message || "Erro ao criar conta. Verifique os dados e tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-[80vh] items-center justify-center py-8">
      <Card className="w-full max-w-sm shadow-xl border-0 ring-1 ring-slate-900/5">
        <div className="pt-8 pb-4 flex justify-center">
          <VivaverdeLogo size="small" />
        </div>
        <CardContent className="p-6">
          <div className="text-center mb-6">
            <h1 className="text-2xl font-bold font-display text-slate-800">Criar Conta</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Seja um vendedor parceiro e fature com a VivaVerde.
            </p>
          </div>

          <form onSubmit={handleCadastro} className="space-y-4">
            <div className="space-y-1">
              <label className="text-sm font-medium">Nome Completo</label>
              <Input
                type="text"
                placeholder="Seu nome"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                required
                className="h-12"
              />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium">Telefone / WhatsApp</label>
              <Input
                type="text"
                placeholder="(00) 00000-0000"
                value={telefone}
                onChange={(e) => setTelefone(e.target.value)}
                required
                className="h-12"
              />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium">E-mail</label>
              <Input
                type="email"
                placeholder="seuemail@exemplo.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="h-12"
              />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium">Senha</label>
              <Input
                type="password"
                placeholder="Mínimo 6 caracteres"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                className="h-12"
              />
            </div>

            {error && (
              <p className="text-sm text-destructive text-center font-medium bg-destructive/10 py-2 rounded-md">
                {error}
              </p>
            )}

            <Button
              type="submit"
              className="w-full h-12 text-base font-bold bg-gradient-brand text-primary-foreground"
              disabled={loading}
            >
              {loading ? "Criando Conta..." : "Cadastrar Agora"}
            </Button>
          </form>

          <div className="mt-6 text-center text-sm">
            Já tem uma conta?{" "}
            <Link to="/parceiro/login" className="font-semibold text-brand hover:underline">
              Fazer Login
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
