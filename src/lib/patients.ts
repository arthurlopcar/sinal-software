import { parseCsv } from "./reminders";

export const MAX_CSV_BYTES = 1_000_000;
export const MAX_CSV_ROWS = 5000;
export const MAX_NAME = 120;
export const MAX_SERVICE = 80;

export const PROCEDURES = ["Limpeza", "Canal", "Ortodontia", "Outro"] as const;
export const RETURN_OPTIONS = [
  { months: 1, label: "30 dias" },
  { months: 2, label: "60 dias" },
  { months: 3, label: "90 dias" },
  { months: 6, label: "180 dias" },
] as const;

/** Returns digits as "55" + DDD + number, or null when the phone is not a valid Brazilian number. */
export function normalizePhoneBR(input: string): string | null {
  let d = input.replace(/\D/g, "");
  if ((d.length === 12 || d.length === 13) && d.startsWith("55")) d = d.slice(2);
  if (d.length !== 10 && d.length !== 11) return null;
  const ddd = Number(d.slice(0, 2));
  if (ddd < 11 || ddd > 99) return null;
  if (d.length === 11 && d[2] !== "9") return null;
  return `55${d}`;
}

/** Mask while typing: (31) 99690-7206 */
export function maskPhoneBR(input: string): string {
  let d = input.replace(/\D/g, "");
  if (d.startsWith("55") && d.length > 11) d = d.slice(2);
  d = d.slice(0, 11);
  if (d.length <= 2) return d ? `(${d}` : "";
  const split = d.length > 10 ? 7 : 6;
  const head = d.slice(2, split);
  const tail = d.slice(split);
  return `(${d.slice(0, 2)}) ${head}${tail ? `-${tail}` : ""}`;
}

export function samePhone(a: string, b: string): boolean {
  const na = normalizePhoneBR(a) ?? a.replace(/\D/g, "");
  const nb = normalizePhoneBR(b) ?? b.replace(/\D/g, "");
  return na !== "" && na === nb;
}

export function findDuplicate<T extends { id: string; phone: string }>(patients: T[], phone: string, ignoreId?: string): T | undefined {
  return patients.find((p) => p.id !== ignoreId && samePhone(p.phone, phone));
}

export type PatientInput = {
  name: string;
  phone: string;
  service: string;
  interval_months: number;
  last_visit: string;
  consent: boolean;
  avg_value?: number | null;
};

/** Accepts "150", "150,50" or "1.500,00". Empty means no value; invalid returns undefined. */
export function parseMoney(input: string): number | null | undefined {
  const s = input.replace(/[R$\s]/g, "");
  if (!s) return null;
  const n = Number(s.includes(",") ? s.replace(/\./g, "").replace(",", ".") : s);
  if (!Number.isFinite(n) || n < 0 || n > 1_000_000) return undefined;
  return Math.round(n * 100) / 100;
}

const isRealDate = (s: string) => /^\d{4}-\d{2}-\d{2}$/.test(s) && !Number.isNaN(Date.parse(`${s}T00:00:00Z`)) && new Date(`${s}T00:00:00Z`).toISOString().slice(0, 10) === s;

/** Validates and normalizes one patient. Returns the clean row or a message telling the user what to fix. */
export function validatePatient(input: PatientInput): { ok: true; value: PatientInput } | { ok: false; error: string } {
  const name = input.name.trim().replace(/\s+/g, " ");
  if (!name) return { ok: false, error: "Escreva o nome do paciente." };
  if (name.length > MAX_NAME) return { ok: false, error: "Nome muito longo." };
  const phone = normalizePhoneBR(input.phone);
  if (!phone) return { ok: false, error: "WhatsApp inválido. Use DDD + número, ex.: (31) 99999-0000." };
  const service = input.service.trim();
  if (service.length > MAX_SERVICE) return { ok: false, error: "Procedimento muito longo." };
  if (!Number.isInteger(input.interval_months) || input.interval_months < 1 || input.interval_months > 36) {
    return { ok: false, error: "Escolha em quanto tempo o paciente deve voltar." };
  }
  if (!isRealDate(input.last_visit)) return { ok: false, error: "Data da última consulta inválida." };
  if (input.avg_value != null && (!Number.isFinite(input.avg_value) || input.avg_value < 0 || input.avg_value > 1_000_000)) {
    return { ok: false, error: "Valor do procedimento inválido." };
  }
  return { ok: true, value: { ...input, name, phone, service } };
}

export type CsvPreview = {
  valid: PatientInput[];
  errors: { line: number; message: string }[];
  fatal?: string;
};

/** Row-by-row CSV check: one bad row never blocks the others. Line numbers match the spreadsheet (header = 1). */
export function previewCsv(text: string, existing: { phone: string }[] = []): CsvPreview {
  if (new Blob([text]).size > MAX_CSV_BYTES) return { valid: [], errors: [], fatal: "Arquivo muito grande (máximo 1 MB)." };
  const lines = text.split(/\r?\n/);
  const filled = lines.map((l, i) => ({ l, line: i + 1 })).filter((x) => x.l.trim());
  if (filled.length > MAX_CSV_ROWS + 1) return { valid: [], errors: [], fatal: `Planilha com mais de ${MAX_CSV_ROWS} linhas. Divida em partes.` };

  if (filled.length === 0) return { valid: [], errors: [], fatal: "Nenhum paciente encontrado na planilha." };
  const sep = filled[0]!.l.includes(";") ? ";" : ",";
  const hasHeader = /nome/i.test(filled[0]?.l.split(/[;,]/)[0] ?? "");
  const body = hasHeader ? filled.slice(1) : filled;
  if (body.length === 0) return { valid: [], errors: [], fatal: "Nenhum paciente encontrado na planilha." };

  const valid: PatientInput[] = [];
  const errors: CsvPreview["errors"] = [];
  const seen = new Set(existing.map((p) => normalizePhoneBR(p.phone) ?? p.phone.replace(/\D/g, "")));

  for (const { l, line } of body) {
    // The dummy header makes parseCsv treat this line as data, so line numbers stay exact.
    const [row] = parseCsv(`nome${sep}\n${l}`);
    if (!row) { errors.push({ line, message: "Faltam o nome ou o WhatsApp." }); continue; }
    const res = validatePatient(row);
    if (!res.ok) { errors.push({ line, message: res.error }); continue; }
    if (seen.has(res.value.phone)) { errors.push({ line, message: "WhatsApp já cadastrado (ignorado)." }); continue; }
    seen.add(res.value.phone);
    valid.push(res.value);
  }
  return { valid, errors };
}
