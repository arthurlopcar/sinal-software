import { describe, it, expect } from "vitest";
import { computePeriod, weeklyReport } from "./results";

const patients = [{ id: "a", avg_value: 200 }, { id: "b", avg_value: null }, { id: "c", avg_value: 100 }];
const from = new Date("2026-10-01T00:00:00Z");
const to = new Date("2026-11-01T00:00:00Z");
const ev = (kind: string, patient_id: string, created_at: string) => ({ kind, patient_id, created_at });

describe("computePeriod", () => {
  it("counts a return only after a recent contact and sums its value", () => {
    const r = computePeriod(
      [
        ev("enviado", "a", "2026-10-05T10:00:00Z"),
        ev("voltou", "a", "2026-10-10T10:00:00Z"),
        ev("enviado", "b", "2026-10-06T10:00:00Z"),
        ev("voltou", "b", "2026-10-07T10:00:00Z"),
        ev("voltou", "c", "2026-10-08T10:00:00Z"),
      ],
      patients, from, to,
    );
    expect(r).toEqual({ sent: 2, returned: 2, recovered: 200, rate: 1 });
  });

  it("ignores contacts older than 30 days and counts each patient once", () => {
    const r = computePeriod(
      [
        ev("enviado", "a", "2026-08-01T10:00:00Z"),
        ev("voltou", "a", "2026-10-10T10:00:00Z"),
        ev("enviado", "c", "2026-10-02T10:00:00Z"),
        ev("voltou", "c", "2026-10-03T10:00:00Z"),
        ev("voltou", "c", "2026-10-04T10:00:00Z"),
      ],
      patients, from, to,
    );
    expect(r.returned).toBe(1);
    expect(r.recovered).toBe(100);
  });

  it("has no rate when nothing was sent", () => {
    expect(computePeriod([], patients, from, to).rate).toBeNull();
  });
});

describe("weeklyReport", () => {
  it("formats a ready-to-send summary", () => {
    const p = { sent: 4, returned: 1, recovered: 200, rate: 0.25 };
    const text = weeklyReport("CardioVida", p, p, 3);
    expect(text).toContain("Lembretes enviados: 4");
    expect(text).toContain("Ainda para chamar: 3");
  });
});
