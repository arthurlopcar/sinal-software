export type ResultEvent = { kind: string; patient_id: string | null; created_at: string };
export type ResultPatient = { id: string; avg_value: number | null };

export type Period = { sent: number; returned: number; recovered: number; rate: number | null };

/** A return only counts as recovered if the patient was contacted within the previous 30 days. */
export const ATTRIBUTION_DAYS = 30;
const DAY = 86400000;

export function computePeriod(events: ResultEvent[], patients: ResultPatient[], from: Date, to: Date): Period {
  const value = new Map(patients.map((p) => [p.id, p.avg_value ?? 0]));
  const sentTimes = new Map<string, number[]>();
  for (const e of events) {
    if (e.kind !== "enviado" || !e.patient_id) continue;
    const list = sentTimes.get(e.patient_id) ?? [];
    list.push(+new Date(e.created_at));
    sentTimes.set(e.patient_id, list);
  }

  let sent = 0;
  let returned = 0;
  let recovered = 0;
  const counted = new Set<string>();
  for (const e of events) {
    const t = +new Date(e.created_at);
    if (t < +from || t >= +to) continue;
    if (e.kind === "enviado") sent++;
    if (e.kind !== "voltou" || !e.patient_id || counted.has(e.patient_id)) continue;
    const contacted = (sentTimes.get(e.patient_id) ?? []).some((s) => s <= t && t - s <= ATTRIBUTION_DAYS * DAY);
    if (!contacted) continue;
    counted.add(e.patient_id);
    returned++;
    recovered += value.get(e.patient_id) ?? 0;
  }
  return { sent, returned, recovered, rate: sent > 0 ? Math.min(1, returned / sent) : null };
}

export const brl = (n: number) => n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

export function weeklyReport(clinic: string, week: Period, month: Period, toCall: number): string {
  return [
    `Resumo da semana — ${clinic}`,
    `• Lembretes enviados: ${week.sent}`,
    `• Pacientes que voltaram: ${week.returned}`,
    `• Valor recuperado: ${brl(week.recovered)}`,
    `• Ainda para chamar: ${toCall}`,
    `No mês: ${month.returned} retornos, ${brl(month.recovered)} recuperados.`,
  ].join("\n");
}
