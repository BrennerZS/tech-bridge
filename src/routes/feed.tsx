import { createFileRoute } from "@tanstack/react-router";
import { PageHead, Empty } from "@/components/kit";

export const Route = createFileRoute("/feed")({
  validateSearch: (s: Record<string, unknown>) => ({ tab: typeof s.tab === "string" ? s.tab : undefined }),
  head: () => ({ meta: [{ title: "Feed — Kernel Studio" }, { name: "description", content: "Feed da comunidade Kernel Studio." }, { property: "og:title", content: "Feed — Kernel Studio" }, { property: "og:description", content: "Feed da comunidade." }] }),
  component: () => (
    <div className="mx-auto max-w-7xl px-4 md:px-6">
      <PageHead n="~" title="Feed" />
      <div className="py-10"><Empty title="em construção" hint="Esta área está sendo finalizada na próxima etapa." /></div>
    </div>
  ),
});
