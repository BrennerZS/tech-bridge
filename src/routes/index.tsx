import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowUpRight, Copy } from "lucide-react";
import { toast } from "sonner";
import { Reveal, SectionLabel, btn, btnGhost } from "@/components/kit";
import { SERVICES, METHOD } from "@/lib/content";
import { play } from "@/lib/sound";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Kernel Studio — sites, apps e sistemas sob medida" },
      { name: "description", content: "Desenvolvemos sites, aplicativos, sistemas e automações para pessoas e empresas — e mantemos uma comunidade aberta de desenvolvedores." },
      { property: "og:title", content: "Kernel Studio — sites, apps e sistemas sob medida" },
      { property: "og:description", content: "Agência de tecnologia + comunidade de desenvolvedores." },
    ],
  }),
  component: Home,
});

const TERMINAL = [
  "$ kernel new --cliente=voce",
  "› escopo .......... definido",
  "› protótipo ....... aprovado",
  "› deploy .......... no ar",
];

function Home() {
  const [svc, setSvc] = useState(0);
  const s = SERVICES[svc]!;
  return (
    <div>
      <section className="grid-paper border-b">
        <div className="mx-auto grid max-w-7xl gap-10 px-4 pb-16 pt-14 md:grid-cols-12 md:px-6 md:pb-24 md:pt-24">
          <div className="md:col-span-8">
            <SectionLabel n="00">agência + comunidade</SectionLabel>
            <h1 className="mt-6 font-display text-6xl leading-[0.9] md:text-[7.5rem]">
              A gente constrói o<br />software que o seu<br />negócio <em className="text-signal">precisa</em>.
            </h1>
            <p className="mt-8 max-w-xl text-lg text-muted-foreground">
              Sites, aplicativos, sistemas e automações para pessoas, empresas e empreendedores — feitos por um estúdio
              ligado a uma comunidade aberta de desenvolvedores.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link to="/servicos" hash="orcamento" onClick={() => play("enter")} className={btn}>Pedir orçamento <ArrowUpRight className="size-4" /></Link>
              <Link to="/auth" onClick={() => play("enter")} className={btnGhost}>Entrar na comunidade</Link>
            </div>
          </div>
          <div className="md:col-span-4 md:self-end">
            <div className="rounded-md border bg-foreground p-4 font-mono text-sm text-background shadow-[6px_6px_0_var(--signal)]">
              <div className="mb-3 flex items-center justify-between">
                <span className="opacity-60">~/projeto</span>
                <button
                  className="opacity-60 hover:opacity-100"
                  aria-label="Copiar comando"
                  onClick={() => { void navigator.clipboard.writeText(TERMINAL[0]!.slice(2)); play("copy"); toast.success("Comando copiado"); }}
                ><Copy className="size-3.5" /></button>
              </div>
              {TERMINAL.map((l, i) => <p key={l} className={i === TERMINAL.length - 1 ? "caret" : "opacity-90"}>{l}</p>)}
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-20 md:px-6">
        <Reveal>
          <SectionLabel n="01">o que fazemos</SectionLabel>
          <div className="mt-8 grid gap-10 md:grid-cols-12">
            <ol className="md:col-span-5" role="tablist" aria-label="Serviços">
              {SERVICES.map((x, i) => (
                <li key={x.slug}>
                  <button
                    role="tab"
                    aria-selected={i === svc}
                    onClick={() => { if (i !== svc) { play("tab"); setSvc(i); } }}
                    onMouseEnter={() => { if (i !== svc) { play("tick"); setSvc(i); } }}
                    className={`flex w-full items-baseline gap-4 border-b py-4 text-left transition-colors ${i === svc ? "text-foreground" : "text-muted-foreground hover:text-foreground"}`}
                  >
                    <span className="label-mono">{x.code}</span>
                    <span className="font-display text-3xl md:text-4xl">{x.title}</span>
                    {i === svc && <ArrowUpRight className="ml-auto size-5 text-signal" />}
                  </button>
                </li>
              ))}
            </ol>
            <div key={s.slug} className="page-enter md:col-span-6 md:col-start-7" role="tabpanel">
              <p className="text-2xl leading-snug">{s.line}</p>
              <ul className="mt-8 space-y-3">
                {s.benefits.map((b) => <li key={b} className="flex gap-3 font-mono text-sm"><span className="text-signal">+</span>{b}</li>)}
              </ul>
              <Link to="/servicos" className={`${btnGhost} mt-10`}>Ver detalhes</Link>
            </div>
          </div>
        </Reveal>
      </section>

      <section className="border-y bg-foreground text-background">
        <div className="mx-auto max-w-7xl px-4 py-20 md:px-6">
          <Reveal>
            <p className="label-mono opacity-60"><span className="text-signal">02</span> / como trabalhamos</p>
            <div className="mt-10 grid gap-px md:grid-cols-5">
              {METHOD.map((m, i) => (
                <div key={m.step} className="border-t border-background/20 pt-5 md:pr-6">
                  <p className="label-mono opacity-60">fase {i + 1}</p>
                  <p className="mt-2 font-display text-3xl">{m.step}</p>
                  <p className="mt-3 text-sm opacity-75">{m.text}</p>
                </div>
              ))}
            </div>
          </Reveal>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-20 md:px-6">
        <Reveal className="grid gap-10 md:grid-cols-2">
          <div>
            <SectionLabel n="03">projetos</SectionLabel>
            <h2 className="mt-4 font-display text-5xl leading-none">O portfólio é publicado conforme os projetos são entregues.</h2>
            <Link to="/portfolio" className={`${btnGhost} mt-8`}>Abrir portfólio</Link>
          </div>
          <div>
            <SectionLabel n="04">comunidade</SectionLabel>
            <h2 className="mt-4 font-display text-5xl leading-none">Um lugar para devs se conhecerem e construírem juntos.</h2>
            <ul className="mt-6 space-y-2 font-mono text-sm text-muted-foreground">
              <li>→ perfil público com skills, links e disponibilidade</li>
              <li>→ feed para mostrar trabalho e processo</li>
              <li>→ 3 salas de conversa em tempo real</li>
              <li>→ projetos colaborativos e mural de vagas</li>
            </ul>
            <div className="mt-8 flex gap-3">
              <Link to="/comunidade" className={btn}>Conhecer membros</Link>
              <Link to="/feed" className={btnGhost}>Ver feed</Link>
            </div>
          </div>
        </Reveal>
      </section>

      <section className="mx-auto max-w-7xl px-4 md:px-6">
        <Reveal className="flex flex-col items-start justify-between gap-6 rounded-md border-2 border-foreground p-8 md:flex-row md:items-center md:p-12">
          <p className="font-display text-4xl leading-none md:text-6xl">Tem uma ideia? <span className="text-signal">Vamos tirar do papel.</span></p>
          <Link to="/servicos" hash="orcamento" onClick={() => play("enter")} className={btn}>Começar orçamento</Link>
        </Reveal>
      </section>
    </div>
  );
}
