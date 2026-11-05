import { maskPhoneBR } from "./patients";

type ExportPatient = {
  name: string; phone: string; service: string; interval_months: number; last_visit: string;
  consent: boolean; opted_out: boolean; avg_value?: number | null;
};
type ExportEvent = { created_at: string; kind: string };

/** Spreadsheets run cells that start with = + - @ as formulas. A leading apostrophe makes them plain text. */
export function safeCell(value: string | number | boolean | null | undefined): string {
  let s = value == null ? "" : String(value);
  if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`;
  return /[;"\n\r]/.test(s) ? `"${s.replaceAll('"', '""')}"` : s;
}

const row = (cells: (string | number | boolean | null | undefined)[]) => cells.map(safeCell).join(";");

const HEADER = ["nome", "whatsapp", "procedimento", "intervalo_meses", "ultimo_atendimento", "autorizou", "pediu_para_sair", "valor_medio"];

/** Semicolon-separated with a BOM, so Excel in Portuguese opens accents and columns correctly. */
export function patientsToCsv(patients: ExportPatient[]): string {
  const lines = [row(HEADER), ...patients.map((p) => row([
    p.name, maskPhoneBR(p.phone), p.service, p.interval_months, p.last_visit,
    p.consent ? "sim" : "não", p.opted_out ? "sim" : "não", p.avg_value ?? "",
  ]))];
  return "\uFEFF" + lines.join("\r\n") + "\r\n";
}

/** One patient's data plus their contact history (a data-subject request). */
export function patientDataToCsv(patient: ExportPatient, events: ExportEvent[], labels: Record<string, string>): string {
  const history = [row(["data", "acao"]), ...events.map((e) => row([e.created_at, labels[e.kind] ?? e.kind]))];
  return patientsToCsv([patient]) + "\r\n" + history.join("\r\n") + "\r\n";
}

export function downloadCsv(filename: string, content: string) {
  const url = URL.createObjectURL(new Blob([content], { type: "text/csv;charset=utf-8" }));
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export const exportFileName = (prefix: string, today = new Date()) => `${prefix}-${today.toISOString().slice(0, 10)}.csv`;
