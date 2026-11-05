import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useSuspenseQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { clinicQuery, eventsQuery, patientsQuery } from "@/lib/clinic";
import { buildQueue } from "@/lib/queue";
import { todayUTC } from "@/lib/reminders";
import { brl, computePeriod, weeklyReport } from "@/lib/results";
import { Button } from "@/components/ui/button";
import { Copy, Wallet, CalendarCheck, Send, TrendingUp } from "lucide-react";

export const Route = createFileRoute("/_authenticated/resultados")({
  head: () => ({ meta: [{ title: "Resultados — Sinal" }, { name: "description", content: "Quanto o Sinal já trouxe de volta para a clínica." }] }),
  component: Resultados,
});

function Resultados() {
  const { data: ctx } = useSuspenseQuery(clinicQuery);
  const clinic = ctx.clinic!;
  const { data: patients = [] } = useQuery(patientsQuery(clinic.id));
  const { data: events = [] } = useQuery(eventsQuery(clinic.id));

  const today = todayUTC();
  const tomorrow = new Date(+today + 86400000);
  const monthStart = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), 1));
  const weekStart = new Date(+today - 6 * 86400000);

  const month = computePeriod(events, patients, monthStart, tomorrow);
  const week = computePeriod(events, patients, weekStart, tomorrow);
  const toCall = buildQueue(patients, events, today).filter((i) => !i.sent).length;
  const missingValue = patients.some((p) => p.avg_value == null);

  const copyReport = async () => {
    try {
      await navigator.clipboard.writeText(weeklyReport(clinic.name, week, month, toCall));
      toast.success("Resumo copiado. É só colar no WhatsApp.");
    } catch {
      toast.error("Não foi possível copiar. Selecione o texto e copie manualmente.");
    }
  };

  const cards = [
    { icon: Wallet, label: "Recuperado no mês", value: brl(month.recovered) },
    { icon: CalendarCheck, label: "Pacientes que voltaram no mês", value: month.returned },
    { icon: Send, label: "Lembretes enviados no mês", value: month.sent },
    { icon: TrendingUp, label: "Taxa de retorno", value: month.rate == null ? "—" : `${Math.round(month.rate * 100)}%` },
  ];

  return (
    <div>
      <h1 className="font-display text-3xl font-bold">Resultados</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Conta como recuperado o paciente que voltou em até 30 dias depois de receber um lembrete.
      </p>

      <div className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        {cards.map((c) => (
          <div key={c.label} className="rounded-xl border bg-card p-5">
            <c.icon className="size-5 text-primary" />
            <p className="mt-3 font-display text-2xl font-bold">{c.value}</p>
            <p className="text-sm text-muted-foreground">{c.label}</p>
          </div>
        ))}
      </div>

      {missingValue && (
        <p className="mt-4 rounded-lg bg-accent px-4 py-2 text-sm text-accent-foreground">
          Alguns pacientes estão sem valor médio. Preencha na aba Pacientes para o valor recuperado ficar completo.
        </p>
      )}

      <div className="mt-8 rounded-xl border bg-card p-5">
        <p className="font-semibold">Resumo da semana</p>
        <pre className="mt-3 whitespace-pre-wrap font-sans text-sm text-muted-foreground">{weeklyReport(clinic.name, week, month, toCall)}</pre>
        <Button className="mt-4" size="lg" onClick={copyReport}><Copy /> Copiar resumo</Button>
      </div>
    </div>
  );
}
