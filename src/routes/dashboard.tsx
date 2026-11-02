import { createFileRoute } from "@tanstack/react-router";
import { PageHead, Empty } from "@/components/kit";

export const Route = createFileRoute("/dashboard")({
  head: () => ({ meta: [{ title: "Painel — Kernel Studio" }, { name: "description", content: "Painel da comunidade Kernel Studio." }, { property: "og:title", content: "Painel — Kernel Studio" }, { property: "og:description", content: "Painel da comunidade." }] }),
  component: () => (
    <div className="mx-auto max-w-7xl px-4 md:px-6">
      <PageHead n="~" title="Painel" />
      <div className="py-10"><Empty title="em construção" hint="Esta área está sendo finalizada na próxima etapa." /></div>
    </div>
  ),
});
