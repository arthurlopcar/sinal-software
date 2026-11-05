import { describe, it, expect } from "vitest";
import { nextDate, dueStatus, renderMessage, parseCsv, waPhone, OPT_OUT_LINE } from "./reminders";

describe("reminders", () => {
  it("next reminder = last visit + interval months", () => {
    expect(nextDate({ last_visit: "2026-07-20", interval_months: 3 }).toISOString().slice(0, 10)).toBe("2026-10-20");
  });
  it("due today when date passed, this week within 7 days", () => {
    const today = new Date("2026-10-26T00:00:00Z");
    expect(dueStatus({ last_visit: "2026-07-20", interval_months: 3 }, today)).toBe("hoje");
    expect(dueStatus({ last_visit: "2026-10-01", interval_months: 1 }, today)).toBe("semana");
    expect(dueStatus({ last_visit: "2026-10-20", interval_months: 6 }, today)).toBe("agendado");
  });
  it("message always ends with opt-out line", () => {
    const m = renderMessage("Olá, {nome}! {clinica}", { name: "Marta Souza", phone: "", service: "", interval_months: 3, last_visit: "" }, "CardioVida");
    expect(m.startsWith("Olá, Marta! CardioVida")).toBe(true);
    expect(m.endsWith(OPT_OUT_LINE)).toBe(true);
  });
  it("adds Brazil code only when missing", () => {
    expect(waPhone("(31) 99690-7206")).toBe("5531996907206");
    expect(waPhone("5531996907206")).toBe("5531996907206");
  });
  it("parses CSV with BR date and consent", () => {
    const r = parseCsv("nome;whatsapp;servico;intervalo;ultimo;autorizou\nAna;11999990000;Limpeza;6;02/05/2026;sim");
    expect(r[0]).toMatchObject({ name: "Ana", interval_months: 6, last_visit: "2026-05-02", consent: true });
  });
});
