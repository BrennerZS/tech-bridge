import { useEffect, useRef, useState, type ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { Volume2, VolumeX, Flag } from "lucide-react";
import { toast } from "sonner";
import { play, setSound, useSoundEnabled } from "@/lib/sound";
import { useMediaUrl } from "@/lib/media";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { cn } from "@/lib/utils";

export function SoundToggle() {
  const on = useSoundEnabled();
  return (
    <button
      type="button"
      onClick={() => setSound(!on)}
      aria-pressed={on}
      aria-label={on ? "Desativar sons da interface" : "Ativar sons da interface"}
      className="label-mono inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 transition-colors hover:bg-accent"
    >
      {on ? <Volume2 className="size-3.5" /> : <VolumeX className="size-3.5" />}
      {on ? "Sound ON" : "Muted"}
    </button>
  );
}

export function Pills<T extends string>({ value, onChange, options, label }: {
  value: T; onChange: (v: T) => void; options: { value: T; label: string; count?: number }[]; label: string;
}) {
  return (
    <div role="tablist" aria-label={label} className="flex flex-wrap gap-1.5">
      {options.map((o) => {
        const active = o.value === value;
        return (
          <button
            key={o.value}
            role="tab"
            aria-selected={active}
            onClick={() => { if (!active) { play("tab"); onChange(o.value); } }}
            className={cn(
              "label-mono rounded-full border px-3 py-1.5 transition-all active:scale-95",
              active ? "border-foreground bg-foreground text-background" : "hover:border-foreground",
            )}
          >
            {o.label}{o.count !== undefined && <span className="ml-1.5 opacity-60">{o.count}</span>}
          </button>
        );
      })}
    </div>
  );
}

export function Reveal({ children, className, as: Tag = "div" }: { children: ReactNode; className?: string; as?: "div" | "section" }) {
  const ref = useRef<HTMLDivElement>(null);
  const [inView, setIn] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setIn(true); io.disconnect(); } }, { threshold: 0.12 });
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return <Tag ref={ref} className={cn("reveal", inView && "in", className)}>{children}</Tag>;
}

export function Avatar({ path, name, size = 36 }: { path?: string | null; name: string; size?: number }) {
  const url = useMediaUrl(path);
  return (
    <span
      className="inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full border bg-secondary font-mono text-xs uppercase"
      style={{ width: size, height: size }}
      aria-hidden
    >
      {url ? <img src={url} alt="" className="size-full object-cover" loading="lazy" /> : name.slice(0, 2)}
    </span>
  );
}

export function MediaImg({ path, alt, className }: { path: string | null | undefined; alt: string; className?: string }) {
  const url = useMediaUrl(path);
  if (!path) return null;
  return url ? <img src={url} alt={alt} className={className} loading="lazy" /> : <div className={cn("animate-pulse bg-muted", className)} />;
}

export function Loading({ label = "carregando" }: { label?: string }) {
  return (
    <div className="py-12" role="status" aria-live="polite">
      <div className="loader-bar mx-auto max-w-48" />
      <p className="label-mono mt-3 text-center text-muted-foreground">{label}…</p>
    </div>
  );
}

export function Empty({ title, hint, action }: { title: string; hint?: string; action?: ReactNode }) {
  return (
    <div className="rounded-md border border-dashed px-6 py-14 text-center">
      <p className="font-mono text-sm">$ <span className="text-muted-foreground">{title}</span></p>
      {hint && <p className="mt-2 text-sm text-muted-foreground">{hint}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

export function SectionLabel({ n, children }: { n: string; children: ReactNode }) {
  return <p className="label-mono text-muted-foreground"><span className="text-signal">{n}</span> / {children}</p>;
}

export function PageHead({ n, title, sub, children }: { n: string; title: ReactNode; sub?: string; children?: ReactNode }) {
  return (
    <header className="border-b pb-8 pt-12 md:pt-20">
      <SectionLabel n={n}>{typeof title === "string" ? title : ""}</SectionLabel>
      <div className="mt-4 flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="font-display text-5xl leading-[0.95] md:text-7xl">{title}</h1>
          {sub && <p className="mt-4 max-w-xl text-muted-foreground">{sub}</p>}
        </div>
        {children}
      </div>
    </header>
  );
}

export function SignInCta({ what }: { what: string }) {
  return (
    <Empty
      title={`login necessário para ${what}`}
      hint="Crie uma conta gratuita ou entre para participar."
      action={<Link to="/auth" onClick={() => play("enter")} className="label-mono rounded-full bg-foreground px-4 py-2 text-background">Entrar / Criar conta</Link>}
    />
  );
}

export function ReportButton({ type, id }: { type: "post" | "comment" | "message" | "profile" | "project" | "opportunity"; id: string }) {
  const { user } = useAuth();
  if (!user) return null;
  return (
    <button
      type="button"
      aria-label="Denunciar"
      title="Denunciar"
      className="text-muted-foreground hover:text-destructive"
      onClick={async () => {
        const reason = window.prompt("Motivo da denúncia (mín. 3 caracteres):");
        if (!reason || reason.trim().length < 3) return;
        const { error } = await supabase.from("reports").insert({ reporter_id: user.id, target_type: type, target_id: id, reason: reason.trim().slice(0, 1000) });
        if (error) { play("error"); toast.error("Não foi possível enviar"); } else { play("success"); toast.success("Denúncia enviada à moderação"); }
      }}
    >
      <Flag className="size-3.5" />
    </button>
  );
}

export function TagInput({ value, onChange, placeholder }: { value: string[]; onChange: (v: string[]) => void; placeholder: string }) {
  const [draft, setDraft] = useState("");
  const add = () => {
    const t = draft.trim().replace(/,$/, "");
    if (t && !value.includes(t) && value.length < 20) onChange([...value, t.slice(0, 40)]);
    setDraft("");
  };
  return (
    <div className="flex flex-wrap items-center gap-1.5 rounded-md border bg-card p-2">
      {value.map((t) => (
        <button type="button" key={t} onClick={() => onChange(value.filter((x) => x !== t))} className="label-mono rounded-full bg-secondary px-2 py-1 hover:bg-destructive hover:text-destructive-foreground" aria-label={`Remover ${t}`}>
          {t} ×
        </button>
      ))}
      <input
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={(e) => { if (e.key === "Enter" || e.key === ",") { e.preventDefault(); add(); } }}
        onBlur={add}
        placeholder={placeholder}
        className="min-w-32 flex-1 bg-transparent px-1 text-sm outline-none"
      />
    </div>
  );
}

export function timeAgo(iso: string) {
  const s = (Date.now() - new Date(iso).getTime()) / 1000;
  if (s < 60) return "agora";
  if (s < 3600) return `${Math.floor(s / 60)} min`;
  if (s < 86400) return `${Math.floor(s / 3600)} h`;
  return new Date(iso).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" });
}

export const field = "w-full rounded-md border bg-card px-3 py-2 text-sm outline-none transition-colors focus:border-foreground";
export const btn = "label-mono inline-flex items-center justify-center gap-2 rounded-full bg-foreground px-4 py-2.5 text-background transition-transform hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50";
export const btnGhost = "label-mono inline-flex items-center justify-center gap-2 rounded-full border px-4 py-2.5 transition-colors hover:bg-accent disabled:opacity-50";
