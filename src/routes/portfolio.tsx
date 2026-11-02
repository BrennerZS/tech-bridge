import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { ArrowUpRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Empty, Loading, MediaImg, PageHead, Pills } from "@/components/kit";
import { PORTFOLIO_CATEGORIES } from "@/lib/content";

export const Route = createFileRoute("/portfolio")({
  head: () => ({
    meta: [
      { title: "Portfólio — Kernel Studio" },
      { name: "description", content: "Projetos entregues pelo estúdio, filtráveis por categoria e tecnologia." },
      { property: "og:title", content: "Portfólio — Kernel Studio" },
      { property: "og:description", content: "Projetos entregues pelo estúdio." },
    ],
  }),
  component: Portfolio,
});

type Cat = (typeof PORTFOLIO_CATEGORIES)[number]["value"];

function Portfolio() {
  const [cat, setCat] = useState<Cat>("all");
  const [tech, setTech] = useState<string | null>(null);
  const { data, isLoading } = useQuery({
    queryKey: ["portfolio"],
    queryFn: async () => {
      const { data, error } = await supabase.from("portfolio_items").select("*").eq("published", true).order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });
  const techs = useMemo(() => [...new Set((data ?? []).flatMap((p) => p.technologies))].sort(), [data]);
  const items = (data ?? []).filter((p) => (cat === "all" || p.category === cat) && (!tech || p.technologies.includes(tech)));

  return (
    <div className="mx-auto max-w-7xl px-4 md:px-6">
      <PageHead n="P" title="Portfólio" sub="Projetos reais, publicados pela equipe no painel administrativo." />
      <div className="sticky top-14 z-10 space-y-3 border-b bg-background/95 py-4 backdrop-blur">
        <Pills label="Categoria" value={cat} onChange={setCat} options={PORTFOLIO_CATEGORIES.map((c) => ({ ...c }))} />
        {techs.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {techs.map((t) => (
              <button key={t} onClick={() => setTech(tech === t ? null : t)} aria-pressed={tech === t}
                className={`font-mono text-xs underline-offset-4 hover:underline ${tech === t ? "text-signal underline" : "text-muted-foreground"}`}>#{t}</button>
            ))}
          </div>
        )}
      </div>
      <div className="py-10">
        {isLoading ? <Loading /> : items.length === 0 ? (
          <Empty title="nenhum projeto publicado ainda" hint="Assim que a equipe cadastrar projetos no painel, eles aparecem aqui." />
        ) : (
          <div className="grid gap-x-8 gap-y-14 md:grid-cols-2">
            {items.map((p, i) => (
              <article key={p.id} className={`group ${i % 3 === 0 ? "md:col-span-2" : ""}`}>
                <div className="overflow-hidden rounded-md border bg-muted">
                  {p.image_url ? <MediaImg path={p.image_url} alt={p.title} className="aspect-[16/9] w-full object-cover transition-transform duration-500 group-hover:scale-[1.02]" />
                    : <div className="grid-paper aspect-[16/9]" />}
                </div>
                <div className="mt-4 flex items-start justify-between gap-4">
                  <div>
                    <p className="label-mono text-muted-foreground">{p.category}{p.responsible ? ` · ${p.responsible}` : ""}</p>
                    <h2 className="mt-1 font-display text-3xl">{p.title}</h2>
                    <p className="mt-2 max-w-xl text-muted-foreground">{p.summary}</p>
                    <p className="mt-3 font-mono text-xs">{p.technologies.map((t) => `#${t}`).join("  ")}</p>
                  </div>
                  {p.demo_url && <a href={p.demo_url} target="_blank" rel="noreferrer" className="rounded-full border p-2 hover:bg-foreground hover:text-background" aria-label={`Abrir demo de ${p.title}`}><ArrowUpRight className="size-4" /></a>}
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
