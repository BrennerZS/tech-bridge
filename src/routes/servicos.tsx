import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { z } from "zod";
import { toast } from "sonner";
import { Check } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { PageHead, Reveal, SectionLabel, btn, field } from "@/components/kit";
import { SERVICES } from "@/lib/content";
import { play } from "@/lib/sound";

export const Route = createFileRoute("/servicos")({
  head: () => ({
    meta: [
      { title: "Serviços e orçamento — Kernel Studio" },
      { name: "description", content: "Sites, aplicativos, sistemas, plataformas, automação com IA e consultoria. Peça um orçamento." },
      { property: "og:title", content: "Serviços e orçamento — Kernel Studio" },
      { property: "og:description", content: "Conheça os serviços e peça um orçamento." },
    ],
  }),
  component: Servicos,
});

const schema = z.object({
  name: z.string().trim().min(2, "Informe seu nome").max(120),
  email: z.string().trim().email("E-mail inválido").max(255),
  company: z.string().trim().max(160).optional(),
  service: z.string().min(1),
  budget: z.string().optional(),
  message: z.string().trim().min(10, "Descreva com pelo menos 10 caracteres").max(4000),
});

function Servicos() {
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const data = Object.fromEntries(new FormData(e.currentTarget)) as Record<string, string>;
    const parsed = schema.safeParse(data);
    if (!parsed.success) {
      setErrors(Object.fromEntries(parsed.error.issues.map((i) => [i.path[0], i.message])));
      play("error");
      return;
    }
    setErrors({});
    setBusy(true);
    const { error } = await supabase.from("quote_requests").insert({ ...parsed.data, company: parsed.data.company || null, budget: parsed.data.budget || null });
    setBusy(false);
    if (error) { play("error"); toast.error("Não foi possível enviar. Tente novamente."); return; }
    play("success");
    setSent(true);
  }

  return (
    <div className="mx-auto max-w-7xl px-4 md:px-6">
      <PageHead n="S" title="Serviços" sub="Seis frentes de trabalho, um processo só: descobrir, desenhar, construir, lançar e evoluir." />
      <div className="divide-y">
        {SERVICES.map((s) => (
          <Reveal key={s.slug} className="grid gap-6 py-10 md:grid-cols-12">
            <p className="label-mono text-signal md:col-span-1">{s.code}</p>
            <h2 className="font-display text-4xl md:col-span-4 md:text-5xl">{s.title}</h2>
            <p className="text-lg md:col-span-4">{s.line}</p>
            <ul className="space-y-2 md:col-span-3">
              {s.benefits.map((b) => <li key={b} className="flex gap-2 text-sm text-muted-foreground"><Check className="mt-0.5 size-4 text-signal" />{b}</li>)}
            </ul>
          </Reveal>
        ))}
      </div>

      <section id="orcamento" className="scroll-mt-20 border-t py-16">
        <div className="grid gap-10 md:grid-cols-12">
          <div className="md:col-span-4">
            <SectionLabel n="→">orçamento</SectionLabel>
            <h2 className="mt-4 font-display text-5xl leading-none">Conte o que você precisa.</h2>
            <ol className="mt-6 space-y-2 font-mono text-sm text-muted-foreground">
              <li>1. você envia o formulário</li>
              <li>2. respondemos por e-mail para uma conversa</li>
              <li>3. enviamos escopo e proposta por escrito</li>
            </ol>
          </div>
          <div className="md:col-span-7 md:col-start-6">
            {sent ? (
              <div className="page-enter rounded-md border-2 border-foreground p-8" role="status">
                <p className="label-mono text-ok">✓ enviado</p>
                <p className="mt-3 font-display text-4xl">Recebemos seu pedido.</p>
                <p className="mt-2 text-muted-foreground">Vamos responder no e-mail informado.</p>
                <button className={`${btn} mt-6`} onClick={() => setSent(false)}>Enviar outro</button>
              </div>
            ) : (
              <form onSubmit={submit} className="grid gap-4" noValidate>
                <div className="grid gap-4 md:grid-cols-2">
                  <F label="Nome" err={errors.name}><input name="name" className={field} autoComplete="name" /></F>
                  <F label="E-mail" err={errors.email}><input name="email" type="email" className={field} autoComplete="email" /></F>
                </div>
                <div className="grid gap-4 md:grid-cols-3">
                  <F label="Empresa (opcional)"><input name="company" className={field} /></F>
                  <F label="Serviço">
                    <select name="service" className={field} defaultValue="sites">
                      {SERVICES.map((s) => <option key={s.slug} value={s.slug}>{s.title}</option>)}
                    </select>
                  </F>
                  <F label="Faixa de investimento">
                    <select name="budget" className={field} defaultValue="">
                      <option value="">Prefiro conversar</option>
                      <option>até R$ 5 mil</option><option>R$ 5–20 mil</option><option>R$ 20–60 mil</option><option>acima de R$ 60 mil</option>
                    </select>
                  </F>
                </div>
                <F label="Sobre o projeto" err={errors.message}><textarea name="message" rows={6} className={field} /></F>
                <button disabled={busy} className={`${btn} justify-self-start`}>{busy ? "Enviando…" : "Enviar pedido"}</button>
              </form>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}

function F({ label, err, children }: { label: string; err?: string; children: React.ReactNode }) {
  return (
    <label className="grid gap-1.5">
      <span className="label-mono text-muted-foreground">{label}</span>
      {children}
      {err && <span className="text-xs text-destructive">{err}</span>}
    </label>
  );
}
