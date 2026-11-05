import { createFileRoute, Link, Outlet, redirect, useNavigate, useRouter } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { clinicQuery } from "@/lib/clinic";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { LayoutDashboard, Users, Settings, ShieldCheck, LogOut, History, BarChart3 } from "lucide-react";

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  beforeLoad: async () => {
    const { data } = await supabase.auth.getUser();
    if (!data.user) throw redirect({ to: "/auth" });
  },
  component: Shell,
});

function Shell() {
  const { data, isLoading, refetch } = useQuery(clinicQuery);
  const qc = useQueryClient();
  const nav = useNavigate();
  const router = useRouter();

  const signOut = async () => {
    await qc.cancelQueries();
    qc.clear();
    await supabase.auth.signOut();
    nav({ to: "/auth", replace: true });
  };

  if (isLoading || !data) return <div className="p-10 text-muted-foreground">Carregando…</div>;
  if (!data.clinic) return <Onboarding userId={data.user!.id} onDone={() => { refetch(); router.invalidate(); }} onSignOut={signOut} />;

  const daysLeft = Math.ceil((new Date(data.clinic.trial_ends_at).getTime() - Date.now()) / 86400000);
  const links = [
    { to: "/painel", label: "Hoje", icon: LayoutDashboard },
    { to: "/pacientes", label: "Pacientes", icon: Users },
    { to: "/resultados", label: "Resultados", icon: BarChart3 },
    { to: "/historico", label: "Histórico", icon: History },
    { to: "/configuracoes", label: "Configurações", icon: Settings },
  ] as const;

  return (
    <div className="flex min-h-screen">
      <aside className="hidden w-60 flex-col bg-sidebar p-5 text-sidebar-foreground md:flex">
        <Link to="/" className="font-display text-xl font-bold">Sinal.</Link>
        <p className="mt-1 truncate text-xs opacity-70">{data.clinic.name}</p>
        <nav className="mt-8 space-y-1 text-sm">
          {links.map((l) => (
            <Link key={l.to} to={l.to} className="flex items-center gap-2 rounded-lg px-3 py-2 opacity-80 hover:opacity-100" activeProps={{ className: "bg-sidebar-accent text-sidebar-accent-foreground opacity-100" }}>
              <l.icon className="size-4" /> {l.label}
            </Link>
          ))}
          {data.isAdmin && (
            <Link to="/admin" className="flex items-center gap-2 rounded-lg px-3 py-2 opacity-80 hover:opacity-100" activeProps={{ className: "bg-sidebar-accent text-sidebar-accent-foreground opacity-100" }}>
              <ShieldCheck className="size-4" /> Admin Sinal
            </Link>
          )}
        </nav>
        <div className="mt-auto space-y-2 text-xs">
          <p className="truncate opacity-70">{data.user!.email}</p>
          <button onClick={signOut} className="flex items-center gap-2 opacity-70 hover:opacity-100"><LogOut className="size-4" /> Sair</button>
        </div>
      </aside>
      <main className="flex-1 p-6 md:p-10">
        <nav className="mb-4 flex flex-wrap gap-2 md:hidden">
          {links.map((l) => <Link key={l.to} to={l.to} className="rounded-md border px-3 py-1.5 text-sm">{l.label}</Link>)}
          <button onClick={signOut} className="rounded-md border px-3 py-1.5 text-sm">Sair</button>
        </nav>
        {data.clinic.plan_status === "suspenso" ? <p className="rounded-xl border bg-card p-8">Acesso suspenso. Fale com a Sinal pelo WhatsApp (31) 99690-7206 para reativar.</p> : <>
        {data.clinic.plan_status === "teste" && (
          <div className="mb-6 rounded-lg bg-accent px-4 py-2 text-sm text-accent-foreground">
            {daysLeft > 0 ? `Período de teste: faltam ${daysLeft} dias.` : "Seu período de teste terminou — fale com a Sinal para continuar."}
          </div>
        )}
        <Outlet /></>}
      </main>
    </div>
  );
}

function Onboarding({ userId, onDone, onSignOut }: { userId: string; onDone: () => void; onSignOut: () => void }) {
  const [name, setName] = useState("");
  const create = async (e: React.FormEvent) => {
    e.preventDefault();
    const { error } = await supabase.from("clinics").insert({ name, owner_id: userId });
    if (error) { toast.error(error.message); return; }
    toast.success("Clínica criada!");
    onDone();
  };
  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <form onSubmit={create} className="w-full max-w-md space-y-4 rounded-2xl border bg-card p-8">
        <h1 className="font-display text-2xl font-bold">Bem-vindo ao Sinal</h1>
        <p className="text-sm text-muted-foreground">Qual o nome do seu negócio? Se você foi convidado por uma clínica, peça ao dono para te convidar com este mesmo e-mail.</p>
        <Input required placeholder="Ex.: Clínica CardioVida" value={name} onChange={(e) => setName(e.target.value)} />
        <Button type="submit" className="w-full">Criar minha clínica</Button>
        <button type="button" onClick={onSignOut} className="w-full text-sm text-muted-foreground hover:text-foreground">Sair</button>
      </form>
    </div>
  );
}
