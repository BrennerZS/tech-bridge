import { useEffect, useState } from "react";
import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { Bell, Menu, X } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { play } from "@/lib/sound";
import { Avatar, SoundToggle } from "./kit";
import { cn } from "@/lib/utils";

const NAV = [
  { to: "/servicos", label: "Serviços" },
  { to: "/portfolio", label: "Portfólio" },
  { to: "/sobre", label: "Sobre" },
  { to: "/comunidade", label: "Comunidade" },
  { to: "/feed", label: "Feed" },
  { to: "/chat/geral", label: "Conversas" },
  { to: "/projetos", label: "Projetos" },
  { to: "/oportunidades", label: "Vagas" },
] as const;

function useUnread() {
  const { user } = useAuth();
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (!user) { setCount(0); return; }
    const refresh = () => supabase.from("notifications").select("id", { count: "exact", head: true }).eq("user_id", user.id).eq("read", false)
      .then(({ count: c }) => setCount(c ?? 0));
    void refresh();
    const ch = supabase.channel(`notif-${user.id}-${Math.random().toString(36).slice(2)}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "notifications", filter: `user_id=eq.${user.id}` }, (p) => {
        if (p.eventType === "INSERT") { play("notify"); toast((p.new as { message: string }).message); }
        void refresh();
      }).subscribe();
    return () => { void supabase.removeChannel(ch); };
  }, [user]);
  return count;
}

export function SiteHeader() {
  const { user, profile, isStaff } = useAuth();
  const [open, setOpen] = useState(false);
  const path = useRouterState({ select: (s) => s.location.pathname });
  const unread = useUnread();
  const navigate = useNavigate();
  useEffect(() => setOpen(false), [path]);

  return (
    <header className="sticky top-0 z-40 border-b bg-background/90 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-7xl items-center gap-4 px-4 md:px-6">
        <Link to="/" className="flex items-center gap-2 font-mono text-sm font-semibold" onClick={() => play("tick")}>
          <span className="inline-block size-3 bg-signal" aria-hidden /> kernel<span className="text-muted-foreground">/studio</span>
        </Link>
        <nav className="ml-4 hidden items-center gap-1 lg:flex" aria-label="Principal">
          {NAV.map((n) => {
            const active = path.startsWith(n.to.replace("/geral", ""));
            return (
              <Link key={n.to} to={n.to} onClick={() => play("tick")}
                className={cn("rounded-full px-3 py-1.5 text-sm transition-colors hover:bg-accent", active && "bg-foreground text-background hover:bg-foreground")}>
                {n.label}
              </Link>
            );
          })}
        </nav>
        <div className="ml-auto flex items-center gap-2">
          <div className="hidden sm:block"><SoundToggle /></div>
          {user ? (
            <>
              <Link to="/dashboard" search={{ tab: "notificacoes" }} className="relative rounded-full p-2 hover:bg-accent" aria-label={`Notificações (${unread} não lidas)`}>
                <Bell className="size-4" />
                {unread > 0 && <span className="absolute -right-0.5 -top-0.5 min-w-4 rounded-full bg-signal px-1 text-center font-mono text-[10px] text-signal-foreground">{unread > 9 ? "9+" : unread}</span>}
              </Link>
              {isStaff && <Link to="/admin" className="label-mono hidden rounded-full border px-3 py-1.5 hover:bg-accent md:inline-flex">Admin</Link>}
              <Link to="/dashboard" aria-label="Meu painel" onClick={() => play("tick")}>
                <Avatar path={profile?.avatar_url} name={profile?.username ?? "?"} size={32} />
              </Link>
            </>
          ) : (
            <button onClick={() => { play("enter"); void navigate({ to: "/auth" }); }} className="label-mono rounded-full bg-foreground px-4 py-2 text-background">Entrar</button>
          )}
          <button className="rounded-full p-2 hover:bg-accent lg:hidden" onClick={() => { play(open ? "back" : "tick"); setOpen(!open); }} aria-expanded={open} aria-label="Menu">
            {open ? <X className="size-5" /> : <Menu className="size-5" />}
          </button>
        </div>
      </div>
      {open && (
        <div className="page-enter border-t bg-background lg:hidden">
          <nav className="mx-auto grid max-w-7xl gap-px px-4 py-4" aria-label="Menu móvel">
            {NAV.map((n, i) => (
              <Link key={n.to} to={n.to} className="flex items-baseline justify-between border-b py-3 font-display text-3xl">
                {n.label}<span className="label-mono text-muted-foreground">0{i + 1}</span>
              </Link>
            ))}
            {isStaff && <Link to="/admin" className="py-3 font-display text-3xl">Admin</Link>}
            <div className="pt-4"><SoundToggle /></div>
          </nav>
        </div>
      )}
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="mt-24 border-t">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-14 md:grid-cols-4 md:px-6">
        <div className="md:col-span-2">
          <p className="font-display text-4xl leading-none">Software feito por gente,<br />para gente.</p>
          <p className="label-mono mt-6 text-muted-foreground">kernel/studio — nome provisório</p>
        </div>
        <div className="grid gap-2 text-sm">
          <p className="label-mono text-muted-foreground">Agência</p>
          <Link to="/servicos" className="hover:text-signal">Serviços</Link>
          <Link to="/portfolio" className="hover:text-signal">Portfólio</Link>
          <Link to="/sobre" className="hover:text-signal">Sobre</Link>
          <Link to="/servicos" hash="orcamento" className="hover:text-signal">Pedir orçamento</Link>
        </div>
        <div className="grid gap-2 text-sm">
          <p className="label-mono text-muted-foreground">Comunidade</p>
          <Link to="/comunidade" className="hover:text-signal">Desenvolvedores</Link>
          <Link to="/feed" className="hover:text-signal">Feed</Link>
          <Link to="/chat/$room" params={{ room: "geral" }} className="hover:text-signal">Conversas</Link>
          <Link to="/projetos" className="hover:text-signal">Projetos</Link>
          <Link to="/oportunidades" className="hover:text-signal">Oportunidades</Link>
        </div>
      </div>
    </footer>
  );
}
