import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { clinicQuery, eventsQuery, logEvent, patientsQuery } from "@/lib/clinic";
import { fmtDate, renderMessage, waLink, todayUTC } from "@/lib/reminders";
import { buildQueue } from "@/lib/queue";
import { maskPhoneBR } from "@/lib/patients";
import { Button } from "@/components/ui/button";
import { Users, Send, CalendarCheck, TrendingUp, MessageCircle } from "lucide-react";

export const Route = createFileRoute("/_authenticated/painel")({
  head: () => ({ meta: [{ title: "Hoje — Sinal" }, { name: "description", content: "Pacientes que precisam de lembrete de retorno hoje." }] }),
  component: Painel,
});

const UNDO_MS = 10_000;

function Painel() {
  const { data: ctx } = useSuspenseQuery(clinicQuery);
  const clinic = ctx.clinic!;
  const qc = useQueryClient();
  const { data: patients = [] } = useQuery(patientsQuery(clinic.id));
  const { data: events = [] } = useQuery(eventsQuery(clinic.id));

  const today = todayUTC();
  const queue = buildQueue(patients, events, today);
  const toSend = queue.filter((i) => !i.sent).length;

  const monthStart = new Date(today.getUTCFullYear(), today.getUTCMonth(), 1).getTime();
  const sentMonth = events.filter((e) => e.kind === "enviado" && +new Date(e.created_at) >= monthStart).length;
  const backMonth = events.filter((e) => e.kind === "voltou" && +new Date(e.created_at) >= monthStart).length;

  const refresh = () => {
    qc.invalidateQueries({ queryKey: ["patients", clinic.id] });
    qc.invalidateQueries({ queryKey: ["events", clinic.id] });
  };

  type P = (typeof patients)[number];

  // The window opens first, in the click itself, so the browser does not block it as a popup.
  const send = async (p: P) => {
    window.open(waLink(p.phone, renderMessage(clinic.message_template, p, clinic.name)), "_blank", "noopener,noreferrer");
    await logEvent(clinic.id, ctx.user!.id, p, "enviado");
    toast.success(`Conversa aberta com ${p.name.split(" ")[0]}. Envie a mensagem no WhatsApp.`);
    refresh();
  };

  const scheduled = async (p: P) => {
    const { error } = await supabase.from("patients").update({ last_visit: new Date().toISOString().slice(0, 10) }).eq("id", p.id).eq("clinic_id", clinic.id);
    if (error) { toast.error("Não foi possível salvar. Tente de novo."); return; }
    await logEvent(clinic.id, ctx.user!.id, p, "voltou");
    toast.success("Registrado. O próximo lembrete foi recalculado.");
    refresh();
  };

  const declined = async (p: P) => {
    if (!confirm(`${p.name} não quer mais receber lembretes? Ele sairá da lista.`)) return;
    const { error } = await supabase.from("patients").update({ opted_out: true }).eq("id", p.id).eq("clinic_id", clinic.id);
    if (error) { toast.error("Não foi possível salvar. Tente de novo."); return; }
    await logEvent(clinic.id, ctx.user!.id, p, "saiu");
    refresh();
    toast.success(`${p.name} não receberá mais lembretes`, {
      duration: UNDO_MS,
      action: {
        label: "Desfazer",
        onClick: async () => {
          await supabase.from("patients").update({ opted_out: false }).eq("id", p.id).eq("clinic_id", clinic.id);
          await logEvent(clinic.id, ctx.user!.id, p, "reativado");
          refresh();
        },
      },
    });
  };

  const stats = [
    { icon: Users, label: "Pacientes cadastrados", value: patients.length },
    { icon: Send, label: "Para chamar agora", value: toSend },
    { icon: CalendarCheck, label: "Retornos este mês", value: backMonth },
    { icon: TrendingUp, label: "Taxa de retorno do mês", value: sentMonth ? `${Math.round((backMonth / sentMonth) * 100)}%` : "—" },
  ];

  return (
    <div>
      <p className="text-sm text-muted-foreground">{clinic.name}</p>
      <h1 className="font-display text-3xl font-bold">Quem chamar hoje</h1>

      <div className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        {stats.map((s) => (
          <div key={s.label} className="rounded-xl border bg-card p-5">
            <s.icon className="size-5 text-primary" />
            <p className="mt-3 font-display text-2xl font-bold">{s.value}</p>
            <p className="text-sm text-muted-foreground">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="mt-8 space-y-3">
        {queue.length === 0 && (
          <div className="rounded-xl border bg-card p-8 text-center text-muted-foreground">
            {patients.length === 0
              ? "Você ainda não tem pacientes. Cadastre o primeiro na aba Pacientes — leva menos de 15 segundos."
              : "Ninguém para chamar hoje nem nesta semana. 🎉 Só aparecem aqui pacientes que autorizaram receber mensagens."}
          </div>
        )}
        {queue.map(({ patient: p, due, dueDate, sent }) => (
          <div key={p.id} className="flex flex-col gap-4 rounded-xl border bg-card p-5 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-lg font-semibold">{p.name}</p>
              <p className="text-sm text-muted-foreground">
                {maskPhoneBR(p.phone)}{p.service ? ` · ${p.service}` : ""} · retorno em {fmtDate(dueDate)}
              </p>
              <p className="mt-2">
                {sent ? <span className="rounded-full bg-success/15 px-2.5 py-1 text-xs font-medium text-success">Conversa aberta</span>
                  : due === "hoje" ? <span className="rounded-full bg-destructive/10 px-2.5 py-1 text-xs font-medium text-destructive">Chamar hoje</span>
                  : <span className="rounded-full bg-warning/15 px-2.5 py-1 text-xs font-medium">Esta semana</span>}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Button size="lg" variant={sent ? "outline" : "default"} onClick={() => send(p)}>
                <MessageCircle /> {sent ? "Enviar de novo" : "Enviar mensagem"}
              </Button>
              <Button size="lg" variant="secondary" onClick={() => scheduled(p)}>Já agendou</Button>
              <Button size="lg" variant="ghost" onClick={() => declined(p)}>Não quer</Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
