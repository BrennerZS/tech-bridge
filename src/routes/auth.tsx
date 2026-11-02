import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { PageHead, Pills, btn, btnGhost, field } from "@/components/kit";
import { play } from "@/lib/sound";

export const Route = createFileRoute("/auth")({
  head: () => ({ meta: [{ title: "Entrar — Kernel Studio" }, { name: "description", content: "Entre ou crie sua conta na comunidade." }, { property: "og:title", content: "Entrar — Kernel Studio" }, { property: "og:description", content: "Entre ou crie sua conta." }] }),
  component: Auth,
});

function Auth() {
  const [mode, setMode] = useState<"in" | "up">("in");
  const [busy, setBusy] = useState(false);
  const navigate = useNavigate();
  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = Object.fromEntries(new FormData(e.currentTarget)) as Record<string, string>;
    setBusy(true);
    if (mode === "in") {
      const { error } = await supabase.auth.signInWithPassword({ email: String(f["email"]), password: String(f["password"]) });
      setBusy(false);
      if (error) { play("error"); toast.error("E-mail ou senha incorretos"); return; }
      play("success"); void navigate({ to: "/" });
    } else {
      const { error } = await supabase.auth.signUp({ email: String(f["email"]), password: String(f["password"]), options: { emailRedirectTo: window.location.origin, data: { username: String(f["username"]), display_name: String(f["username"]) } } });
      setBusy(false);
      if (error) { play("error"); toast.error(error.message); return; }
      play("success"); toast.success("Confira seu e-mail para confirmar a conta.");
    }
  }
  return (
    <div className="mx-auto max-w-md px-4">
      <PageHead n="→" title={mode === "in" ? "Entrar" : "Criar conta"} />
      <div className="py-6"><Pills label="Modo" value={mode} onChange={setMode} options={[{ value: "in", label: "Entrar" }, { value: "up", label: "Criar conta" }]} /></div>
      <form onSubmit={submit} className="grid gap-3">
        {mode === "up" && <input name="username" required pattern="[a-z0-9_]{3,24}" placeholder="nome_de_usuario" className={field} />}
        <input name="email" type="email" required placeholder="e-mail" className={field} autoComplete="email" />
        <input name="password" type="password" required minLength={8} placeholder="senha (mín. 8)" className={field} />
        <button disabled={busy} className={btn}>{busy ? "…" : mode === "in" ? "Entrar" : "Criar conta"}</button>
        <button type="button" className={btnGhost} onClick={async () => { const r = await lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.origin }); if (r.error) toast.error("Falha no login com Google"); }}>Continuar com Google</button>
      </form>
    </div>
  );
}
