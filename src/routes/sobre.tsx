import { createFileRoute, Link } from "@tanstack/react-router";
import { PageHead, Reveal, SectionLabel, btn } from "@/components/kit";
import { METHOD } from "@/lib/content";

export const Route = createFileRoute("/sobre")({
  head: () => ({
    meta: [
      { title: "Sobre — Kernel Studio" },
      { name: "description", content: "Propósito, visão, valores e forma de trabalho do estúdio e da comunidade." },
      { property: "og:title", content: "Sobre — Kernel Studio" },
      { property: "og:description", content: "Propósito, visão e valores do estúdio." },
    ],
  }),
  component: Sobre,
});

const VALUES = [
  ["Clareza", "Escopo escrito, preço explicado, progresso visível."],
  ["Ofício", "Código legível, interfaces acessíveis, decisões documentadas."],
  ["Abertura", "Comunidade aberta: quem constrói com a gente também aprende com a gente."],
  ["Honestidade", "Sem números inventados e sem prometer o que não dá para entregar."],
];

function Sobre() {
  return (
    <div className="mx-auto max-w-7xl px-4 md:px-6">
      <PageHead n="A" title="Sobre nós" sub="Um estúdio de tecnologia conectado a uma comunidade de desenvolvedores." />
      <div className="my-6 rounded-md border border-dashed border-signal p-4 font-mono text-xs text-muted-foreground">
        [conteúdo provisório] história, equipe e dados da empresa serão preenchidos pela própria agência.
      </div>
      <Reveal className="grid gap-10 py-14 md:grid-cols-3">
        <div><SectionLabel n="01">propósito</SectionLabel><p className="mt-4 text-xl">Tornar software bem-feito acessível a pessoas e negócios de qualquer tamanho.</p></div>
        <div><SectionLabel n="02">visão</SectionLabel><p className="mt-4 text-xl">Ser o lugar onde clientes encontram um time confiável e devs encontram projetos reais.</p></div>
        <div><SectionLabel n="03">história</SectionLabel><p className="mt-4 text-xl text-muted-foreground">[a preencher pela agência]</p></div>
      </Reveal>
      <Reveal className="border-t py-14">
        <SectionLabel n="04">valores</SectionLabel>
        <dl className="mt-8 grid gap-8 md:grid-cols-2">
          {VALUES.map(([k, v]) => (
            <div key={k} className="border-l-2 border-signal pl-5"><dt className="font-display text-4xl">{k}</dt><dd className="mt-2 text-muted-foreground">{v}</dd></div>
          ))}
        </dl>
      </Reveal>
      <Reveal className="border-t py-14">
        <SectionLabel n="05">forma de trabalho</SectionLabel>
        <ol className="mt-8 space-y-4">
          {METHOD.map((m, i) => (
            <li key={m.step} className="grid gap-2 border-b pb-4 md:grid-cols-[80px_200px_1fr]">
              <span className="label-mono text-signal">0{i + 1}</span><span className="font-display text-2xl">{m.step}</span><span className="text-muted-foreground">{m.text}</span>
            </li>
          ))}
        </ol>
      </Reveal>
      <Reveal className="border-t py-14">
        <SectionLabel n="06">equipe</SectionLabel>
        <p className="mt-4 text-muted-foreground">[a equipe será apresentada aqui — sem perfis fictícios]</p>
        <Link to="/servicos" hash="orcamento" className={`${btn} mt-8`}>Falar com a gente</Link>
      </Reveal>
    </div>
  );
}
