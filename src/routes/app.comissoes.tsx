import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/app-shell";

export const Route = createFileRoute("/app/comissoes")({
  head: () => ({ meta: [{ title: "Comissões — PREMIUM GARDEN" }] }),
  component: Comissoes,
});

function Comissoes() {
  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <PageHeader title="Comissões" />
      <div className="border rounded-md bg-slate-50/50 py-12 flex items-center justify-center">
        <p className="text-sm text-muted-foreground font-medium flex items-center gap-2">
          <span className="text-base">ⓘ</span> Nenhuma informação encontrada.
        </p>
      </div>
    </div>
  );
}
