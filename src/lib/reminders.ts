export type PatientLike = { name: string; phone: string; service: string; interval_months: number; last_visit: string };

export const nextDate = (p: Pick<PatientLike, "last_visit" | "interval_months">) => {
  const d = new Date(p.last_visit + "T00:00:00Z");
  d.setUTCMonth(d.getUTCMonth() + p.interval_months);
  return d;
};

export const todayUTC = () => {
  const n = new Date();
  return new Date(Date.UTC(n.getFullYear(), n.getMonth(), n.getDate()));
};

export type Due = "hoje" | "semana" | "agendado";
export const dueStatus = (p: Pick<PatientLike, "last_visit" | "interval_months">, today = todayUTC()): Due => {
  const diff = (nextDate(p).getTime() - today.getTime()) / 86400000;
  if (diff <= 0) return "hoje";
  if (diff <= 7) return "semana";
  return "agendado";
};

export const fmtDate = (d: Date) => d.toLocaleDateString("pt-BR", { timeZone: "UTC" });
export const monthsLabel = (m: number) => (m === 1 ? "1 mês" : `${m} meses`);
export const OPT_OUT_LINE = "Se não quiser mais receber lembretes, é só responder SAIR.";

export const renderMessage = (template: string, p: PatientLike, clinic: string) =>
  template
    .replaceAll("{nome}", p.name.trim().split(" ")[0] ?? "")
    .replaceAll("{clinica}", clinic)
    .replaceAll("{servico}", p.service || "atendimento")
    .replaceAll("{intervalo}", monthsLabel(p.interval_months)) +
  "\n\n" + OPT_OUT_LINE;

export const waPhone = (phone: string) => {
  const d = phone.replace(/\D/g, "");
  return d.startsWith("55") && d.length >= 12 ? d : `55${d}`;
};

export const waLink = (phone: string, text: string) => `https://wa.me/${waPhone(phone)}?text=${encodeURIComponent(text)}`;

/** Parse CSV: nome;whatsapp;servico;intervalo_meses;ultimo_atendimento(dd/mm/aaaa ou aaaa-mm-dd);autorizou(sim/nao) */
export function parseCsv(text: string) {
  const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  if (!lines.length) return [];
  const sep = lines[0]!.includes(";") ? ";" : ",";
  const rows = lines.map((l) => l.split(sep).map((c) => c.trim().replace(/^"|"$/g, "")));
  if (/nome/i.test(rows[0]?.[0] ?? "")) rows.shift();
  return rows
    .filter((r) => r[0] && r[1])
    .map((r) => {
      let last = r[4] || "";
      const br = last.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
      if (br) last = `${br[3]}-${br[2]}-${br[1]}`;
      if (!/^\d{4}-\d{2}-\d{2}$/.test(last)) last = new Date().toISOString().slice(0, 10);
      const months = parseInt(r[3] || "3", 10);
      return {
        name: r[0] ?? "",
        phone: r[1] ?? "",
        service: r[2] || "",
        interval_months: Number.isFinite(months) && months > 0 ? months : 3,
        last_visit: last,
        consent: /^(s|sim|yes|1|true)$/i.test(r[5] || ""),
      };
    });
}
