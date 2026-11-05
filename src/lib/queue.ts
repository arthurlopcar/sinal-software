import { dueStatus, nextDate, type Due, type PatientLike } from "./reminders";

export type QueuePatient = PatientLike & { id: string; consent: boolean; opted_out: boolean };
export type QueueEvent = { kind: string; patient_id: string | null; created_at: string };
export type QueueItem<P extends QueuePatient> = { patient: P; due: Exclude<Due, "agendado">; dueDate: Date; sent: boolean };

const DAY = 86400000;

/** Patients due today or within 7 days, authorized and not opted out, oldest return date first. */
export function buildQueue<P extends QueuePatient>(patients: P[], events: QueueEvent[], today: Date): QueueItem<P>[] {
  const lastSent = new Map<string, number>();
  for (const e of events) {
    if (e.kind !== "enviado" || !e.patient_id) continue;
    const t = +new Date(e.created_at);
    if (t > (lastSent.get(e.patient_id) ?? 0)) lastSent.set(e.patient_id, t);
  }
  return patients
    .filter((p) => p.consent && !p.opted_out)
    .flatMap((p) => {
      const due = dueStatus(p, today);
      if (due === "agendado") return [];
      const dueDate = nextDate(p);
      const sent = (lastSent.get(p.id) ?? 0) >= +dueDate - 7 * DAY;
      return [{ patient: p, due, dueDate, sent }];
    })
    .sort((a, b) => Number(a.sent) - Number(b.sent) || +a.dueDate - +b.dueDate);
}
