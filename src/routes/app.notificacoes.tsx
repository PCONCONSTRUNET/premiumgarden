import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/app-shell";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCheck, Trash2, BellOff, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/app/notificacoes")({
  component: NotificacoesPage,
});

function NotificacoesPage() {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const { data } = await supabase
        .from("notificacoes")
        .select("*")
        .order("created_at", { ascending: false });
      if (data) setNotifications(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const markAllAsRead = async () => {
    await supabase.from("notificacoes").update({ lida: true }).eq("lida", false);
    fetchNotifications();
  };

  const markAsRead = async (id: string) => {
    await supabase.from("notificacoes").update({ lida: true }).eq("id", id);
    fetchNotifications();
  };

  const deleteNotification = async (id: string) => {
    await supabase.from("notificacoes").delete().eq("id", id);
    fetchNotifications();
  };

  const clearAll = async () => {
    if (confirm("Tem certeza que deseja excluir TODAS as notificações?")) {
      await supabase
        .from("notificacoes")
        .delete()
        .neq("id", "00000000-0000-0000-0000-000000000000"); // Delete all
      fetchNotifications();
    }
  };

  const filtered = notifications.filter(
    (n) =>
      n.titulo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      n.mensagem.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  return (
    <>
      <PageHeader
        title="Central de Notificações"
        subtitle="Gerencie todos os avisos e alertas do sistema."
        actions={
          <div className="flex gap-2">
            <Button variant="outline" onClick={markAllAsRead}>
              <CheckCheck className="mr-2 h-4 w-4" /> Marcar todas como lidas
            </Button>
            <Button variant="destructive" onClick={clearAll}>
              <Trash2 className="mr-2 h-4 w-4" /> Limpar tudo
            </Button>
          </div>
        }
      />

      <Card className="shadow-card mb-6">
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Buscar notificações..."
              className="pl-9"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      <div className="space-y-3">
        {loading ? (
          <div className="text-center p-8 text-muted-foreground">Carregando notificações...</div>
        ) : filtered.length === 0 ? (
          <Card className="border-dashed bg-transparent shadow-none">
            <CardContent className="flex flex-col items-center justify-center p-12 text-center">
              <div className="p-4 rounded-full bg-muted/50 mb-4 text-muted-foreground">
                <BellOff className="h-8 w-8" />
              </div>
              <h3 className="text-lg font-bold">Nenhuma notificação encontrada</h3>
              <p className="text-muted-foreground">Você não possui novos avisos ou alertas.</p>
            </CardContent>
          </Card>
        ) : (
          filtered.map((n) => (
            <Card
              key={n.id}
              className={cn(
                "transition-colors overflow-hidden",
                n.lida
                  ? "opacity-75 bg-muted/20"
                  : "border-brand/30 shadow-md ring-1 ring-brand/10",
              )}
            >
              <CardContent className="p-4 sm:p-6 flex flex-col sm:flex-row gap-4 items-start sm:items-center">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    {!n.lida && (
                      <Badge className="bg-brand text-primary-foreground border-0 text-[10px] px-1.5 py-0">
                        NOVA
                      </Badge>
                    )}
                    <h4
                      className={cn(
                        "font-bold",
                        !n.lida ? "text-foreground" : "text-muted-foreground",
                      )}
                    >
                      {n.titulo}
                    </h4>
                    <span className="text-xs text-muted-foreground ml-auto sm:ml-2">
                      {new Date(n.created_at).toLocaleString()}
                    </span>
                  </div>
                  <p className="text-sm text-slate-600">{n.mensagem}</p>
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto justify-end mt-2 sm:mt-0">
                  {!n.lida && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => markAsRead(n.id)}
                      className="text-brand hover:text-brand hover:bg-brand/10"
                    >
                      <CheckCheck className="h-4 w-4 mr-1.5" /> Lida
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => deleteNotification(n.id)}
                    className="text-destructive hover:bg-destructive/10"
                  >
                    <Trash2 className="h-4 w-4 mr-1.5" /> Excluir
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </>
  );
}
