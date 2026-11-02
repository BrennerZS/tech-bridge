import { createFileRoute } from "@tanstack/react-router";
import { PageHead, Empty } from "@/components/kit";

export const Route = createFileRoute("/projetos")({
  head: () => ({ meta: [{ title: "Projetos — Kernel Studio" }, { name: "description", content: "Projetos da comunidade Kernel Studio." }, { property: "og:title", content: "Projetos — Kernel Studio" }, { property: "og:description", content: "Projetos da comunidade." }] }),
  component: () => (
    <div className="mx-auto max-w-7xl px-4 md:px-6">
      <PageHead n="~" title="Projetos" />
      <div className="py-10"><Empty title="em construção" hint="Esta área está sendo finalizada na próxima etapa." /></div>
    </div>
  ),
});
