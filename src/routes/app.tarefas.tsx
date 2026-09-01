import { createFileRoute } from "@tanstack/react-router";
import { ListTodo } from "lucide-react";
import { PageHeader } from "@/components/app-shell";

export const Route = createFileRoute("/app/tarefas")({
  head: () => ({ meta: [{ title: "Tarefas - PREMIUM GARDEN" }] }),
  component: Tarefas,
});

function Tarefas() {
  return (
    <>
      <PageHeader title="Tarefas" />
      <div className="flex min-h-56 flex-col items-center justify-center gap-3 rounded-md border bg-card px-6 text-center">
        <ListTodo className="h-7 w-7 text-muted-foreground" />
        <p className="text-sm font-medium text-muted-foreground">Nenhuma tarefa encontrada.</p>
      </div>
    </>
  );
}
