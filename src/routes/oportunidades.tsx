import { createFileRoute } from "@tanstack/react-router";
import { PageHead, Empty } from "@/components/kit";

export const Route = createFileRoute("/oportunidades")({
  validateSearch: (s: Record<string, unknown>) => ({ tab: typeof s.tab === "string" ? s.tab : undefined }),
  head: () => ({ meta: [{ title: "Oportunidades — Kernel Studio" }, { name: "description", content: "Oportunidades da comunidade Kernel Studio." }, { property: "og:title", content: "Oportunidades — Kernel Studio" }, { property: "og:description", content: "Oportunidades da comunidade." }] }),
  component: () => (
    <div className="mx-auto max-w-7xl px-4 md:px-6">
      <PageHead n="~" title="Oportunidades" />
      <div className="py-10"><Empty title="em construção" hint="Esta área está sendo finalizada na próxima etapa." /></div>
    </div>
  ),
});
