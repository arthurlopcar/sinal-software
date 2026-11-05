import { describe, it, expect } from "vitest";
import { buildQueue } from "./queue";

const today = new Date("2026-10-26T00:00:00Z");
const p = (id: string, last_visit: string, interval_months: number, extra = {}) => ({
  id, name: id, phone: "31996907206", service: "", last_visit, interval_months, consent: true, opted_out: false, ...extra,
});

describe("buildQueue", () => {
  it("includes only authorized, active patients that are due", () => {
    const q = buildQueue(
      [
        p("atrasado", "2026-07-01", 3),
        p("semana", "2026-10-01", 1),
        p("longe", "2026-10-20", 6),
        p("sem-autorizacao", "2026-07-01", 3, { consent: false }),
        p("saiu", "2026-07-01", 3, { opted_out: true }),
      ],
      [],
      today,
    );
    expect(q.map((i) => i.patient.id)).toEqual(["atrasado", "semana"]);
    expect(q.map((i) => i.due)).toEqual(["hoje", "semana"]);
  });

  it("orders by return date, and sent patients go to the end", () => {
    const q = buildQueue(
      [p("b", "2026-08-01", 3), p("a", "2026-06-01", 3), p("c", "2026-07-01", 3)],
      [{ kind: "enviado", patient_id: "a", created_at: "2026-10-25T10:00:00Z" }],
      today,
    );
    expect(q.map((i) => i.patient.id)).toEqual(["c", "b", "a"]);
    expect(q.find((i) => i.patient.id === "a")?.sent).toBe(true);
  });

  it("ignores events from other kinds", () => {
    const q = buildQueue([p("a", "2026-07-01", 3)], [{ kind: "voltou", patient_id: "a", created_at: "2026-10-25T10:00:00Z" }], today);
    expect(q[0]?.sent).toBe(false);
  });
});
