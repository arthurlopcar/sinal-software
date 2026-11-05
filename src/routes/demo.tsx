import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { whatsappLink } from "@/lib/contact";
import { Users, Send, CalendarCheck, TrendingUp, Plus, LayoutDashboard, Settings, MessageCircle, ArrowLeft, Check } from "lucide-react";

export const Route = createFileRoute("/demo")({
  head: () => ({
    meta: [
      { title: "Painel de demonstração — Sinal" },
      { name: "description", content: "Veja como a equipe da clínica envia o lembrete de retorno pelo próprio WhatsApp — sem disparo automático." },
      { property: "og:title", content: "Painel de demonstração — Sinal" },
      { property: "og:description", content: "Pacientes, intervalos de retorno, mensagens prontas e envio pela equipe da clínica em um só lugar." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Demo,
});

type Client = { name: string; phone: string; service: string; last: string; months: number; consent: boolean; optedOut: boolean };

const initial: Client[] = [
  { name: "Marta Souza", phone: "(11) 98888-1020", service: "Consulta cardiológica", last: "2026-07-20", months: 3, consent: true, optedOut: false },
  { name: "João Lima", phone: "(11) 97777-3311", service: "Avaliação estética facial", last: "2026-09-28", months: 1, consent: true, optedOut: false },
  { name: "Carla Mendes", phone: "(21) 96666-4400", service: "Limpeza dental", last: "2026-05-02", months: 6, consent: false, optedOut: false },
  { name: "Pedro Alves", phone: "(31) 95555-7788", service: "Retorno — ecocardiograma", last: "2026-04-15", months: 6, consent: true, optedOut: true },
  { name: "Ana Ribeiro", phone: "(11) 94444-2299", service: "Sessão de fisioterapia", last: "2026-10-10", months: 1, consent: true, optedOut: false },
];

const TODAY = new Date("2026-10-26");
const nextDate = (c: Client) => {
  const d = new Date(c.last);
  d.setMonth(d.getMonth() + c.months);
  return d;
};
const fmt = (d: Date) => d.toLocaleDateString("pt-BR", { timeZone: "UTC" });

function status(c: Client) {
  const diff = (nextDate(c).getTime() - TODAY.getTime()) / 86400000;
  if (diff <= 0) return { label: "Enviar hoje", cls: "bg-destructive/10 text-destructive" };
  if (diff <= 7) return { label: "Esta semana", cls: "bg-warning/15 text-foreground" };
  return { label: "Agendado", cls: "bg-success/15 text-success" };
}

const waPhone = (phone: string) => `55${phone.replace(/\D/g, "")}`;
const monthsLabel = (m: number) => (m === 1 ? "1 mês" : `${m} meses`);
const messageFor = (c: Client) =>
  `Olá, ${c.name.split(" ")[0]}! Aqui é da Clínica CardioVida. Já faz ${monthsLabel(c.months)} da sua última consulta (${c.service}). Vamos agendar seu retorno?\n\nSe não quiser mais receber lembretes, é só responder SAIR.`;

function Demo() {
  const [clients, setClients] = useState(initial);
  const [sent, setSent] = useState<string[]>([]);
  const [form, setForm] = useState({ name: "", phone: "", service: "", months: "3", consent: false });
  const sorted = useMemo(() => [...clients].sort((a, b) => +nextDate(a) - +nextDate(b)), [clients]);

  const add = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.phone) return;
    setClients([...clients, { ...form, months: Number(form.months), optedOut: false, last: TODAY.toISOString().slice(0, 10) }]);
    setForm({ name: "", phone: "", service: "", months: "3", consent: false });
  };

  const toggleSent = (phone: string) =>
    setSent((s) => (s.includes(phone) ? s.filter((p) => p !== phone) : [...s, phone]));

  const update = (phone: string, patch: Partial<Client>) =>
    setClients((cs) => cs.map((c) => (c.phone === phone ? { ...c, ...patch } : c)));
  const canSend = (c: Client) => c.consent && !c.optedOut;

  const stats = [
    { icon: Users, label: "Pacientes ativos", value: clients.length },
    { icon: Send, label: "Mensagens prontas", value: clients.filter((c) => canSend(c) && !sent.includes(c.phone)).length },
    { icon: CalendarCheck, label: "Retornos agendados", value: 41 },
    { icon: TrendingUp, label: "Taxa de retorno", value: "32%" },
  ];

  return (
    <div className="flex min-h-screen">
      <aside className="hidden w-60 flex-col bg-sidebar p-5 text-sidebar-foreground md:flex">
        <span className="font-display text-xl font-bold">Sinal.</span>
        <nav className="mt-8 space-y-1 text-sm">
          <p className="flex items-center gap-2 rounded-lg bg-sidebar-accent px-3 py-2 text-sidebar-accent-foreground"><LayoutDashboard className="size-4" /> Painel</p>
          <p className="flex items-center gap-2 px-3 py-2 opacity-70"><Users className="size-4" /> Pacientes</p>
          <p className="flex items-center gap-2 px-3 py-2 opacity-70"><MessageCircle className="size-4" /> Mensagens</p>
          <p className="flex items-center gap-2 px-3 py-2 opacity-70"><Settings className="size-4" /> Configurações</p>
        </nav>
        <Link to="/" className="mt-auto flex items-center gap-2 text-sm opacity-70 hover:opacity-100"><ArrowLeft className="size-4" /> Voltar ao site</Link>
      </aside>

      <main className="flex-1 p-6 md:p-10">
        <div className="mb-2 rounded-lg bg-accent px-4 py-2 text-sm text-accent-foreground">
          Demonstração com dados de exemplo — nada é salvo nem enviado.
        </div>
        <div className="flex flex-wrap items-end justify-between gap-4 py-6">
          <div>
            <p className="text-sm text-muted-foreground">Clínica CardioVida</p>
            <h1 className="font-display text-3xl font-bold">Retornos de pacientes</h1>
          </div>
          <Button asChild variant="outline"><a href={whatsappLink("Olá! Vi a demonstração do Sinal e quero para a minha clínica.")} target="_blank" rel="noreferrer">Quero isso na minha clínica</a></Button>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((s) => (
            <div key={s.label} className="rounded-xl border bg-card p-5">
              <s.icon className="size-5 text-primary" />
              <p className="mt-3 font-display text-2xl font-bold">{s.value}</p>
              <p className="text-sm text-muted-foreground">{s.label}</p>
            </div>
          ))}
        </div>

        <form onSubmit={add} className="mt-8 grid gap-3 rounded-xl border bg-card p-5 md:grid-cols-[1fr_1fr_1fr_140px_auto_auto]">
          <Input placeholder="Nome do paciente" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <Input placeholder="WhatsApp" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
          <Input placeholder="Serviço" value={form.service} onChange={(e) => setForm({ ...form, service: e.target.value })} />
          <select className="h-9 rounded-md border bg-background px-3 text-sm" value={form.months} onChange={(e) => setForm({ ...form, months: e.target.value })}>
            <option value="1">A cada 1 mês</option>
            <option value="3">A cada 3 meses</option>
            <option value="6">A cada 6 meses</option>
            <option value="12">A cada 12 meses</option>
          </select>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" className="size-4 accent-primary" checked={form.consent} onChange={(e) => setForm({ ...form, consent: e.target.checked })} />
            Paciente autorizou lembretes
          </label>
          <Button type="submit"><Plus /> Adicionar</Button>
        </form>

        <div className="mt-6 overflow-x-auto rounded-xl border bg-card">
          <table className="w-full text-sm">
            <thead className="bg-muted text-left text-muted-foreground">
              <tr>
                <th className="p-4">Paciente</th><th className="p-4">Serviço</th><th className="p-4">Intervalo</th>
                <th className="p-4">Próximo lembrete</th><th className="p-4">Autorizou lembretes</th><th className="p-4">Status</th><th className="p-4">Ação</th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((c, i) => {
                const st = status(c);
                const isSent = sent.includes(c.phone);
                return (
                  <tr key={i} className="border-t">
                    <td className="p-4"><p className="font-medium">{c.name}</p><p className="text-muted-foreground">{c.phone}</p></td>
                    <td className="p-4">{c.service || "—"}</td>
                    <td className="p-4">{monthsLabel(c.months)}</td>
                    <td className="p-4">{fmt(nextDate(c))}</td>
                    <td className="p-4">
                      <label className="flex items-center gap-2">
                        <input type="checkbox" className="size-4 accent-primary" checked={c.consent} disabled={c.optedOut} onChange={(e) => update(c.phone, { consent: e.target.checked })} aria-label={`${c.name} autorizou lembretes`} />
                        {c.consent ? "Sim" : "Não"}
                      </label>
                    </td>
                    <td className="p-4">
                      {c.optedOut ? (
                        <span className="rounded-full bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground">Pediu para sair</span>
                      ) : !c.consent ? (
                        <span className="rounded-full bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground">Sem autorização</span>
                      ) : (
                        <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${st.cls}`}>{st.label}</span>
                      )}
                    </td>
                    <td className="p-4">
                      <div className="flex flex-wrap items-center gap-2">
                        {canSend(c) ? (<>
                        <a
                          className="inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1.5 text-xs font-medium hover:bg-accent"
                          href={`https://wa.me/${waPhone(c.phone)}?text=${encodeURIComponent(messageFor(c))}`}
                          target="_blank"
                          rel="noreferrer"
                          title={messageFor(c)}
                        >
                          <MessageCircle className="size-3.5" /> Abrir conversa
                        </a>
                        <Button variant={isSent ? "secondary" : "outline"} size="sm" className="h-8 px-2.5 text-xs" onClick={() => toggleSent(c.phone)}>
                          {isSent ? <><Check /> Enviado</> : "Marcar enviado"}
                        </Button>
                        </>) : (
                          <span className="text-xs text-muted-foreground">Não enviar</span>
                        )}
                        <Button variant="ghost" size="sm" className="h-8 px-2.5 text-xs" onClick={() => update(c.phone, { optedOut: !c.optedOut })}>
                          {c.optedOut ? "Reativar" : "Pediu para sair"}
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
}
