import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/parceiro/")({
  beforeLoad: () => {
    throw redirect({ to: "/parceiro/dashboard" });
  },
});
