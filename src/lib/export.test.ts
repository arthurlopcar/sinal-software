import { describe, it, expect } from "vitest";
import { exportFileName, patientDataToCsv, patientsToCsv, safeCell } from "./export";

const base = { name: "Ana", phone: "5531996907206", service: "Limpeza", interval_months: 6, last_visit: "2026-05-02", consent: true, opted_out: false, avg_value: 150 };

describe("safeCell", () => {
  it("neutralizes spreadsheet formulas", () => {
    for (const v of ["=SOMA(A1)", "+55", "-1+1", "@cmd", "\tx"]) expect(safeCell(v).replace(/^"/, "")).toMatch(/^'/);
  });
  it("quotes separators, quotes and line breaks", () => {
    expect(safeCell('a;b')).toBe('"a;b"');
    expect(safeCell('diz "oi"')).toBe('"diz ""oi"""');
    expect(safeCell("a\nb")).toBe('"a\nb"');
  });
  it("leaves normal text and numbers alone", () => {
    expect(safeCell("Ana")).toBe("Ana");
    expect(safeCell(150)).toBe("150");
    expect(safeCell(null)).toBe("");
  });
});

describe("patientsToCsv", () => {
  it("starts with a BOM and a header, one row per patient", () => {
    const csv = patientsToCsv([base, { ...base, name: "=HYPERLINK(1)", consent: false }]);
    const lines = csv.replace("\uFEFF", "").trim().split("\r\n");
    expect(csv.startsWith("\uFEFF")).toBe(true);
    expect(lines[0]).toBe("nome;whatsapp;procedimento;intervalo_meses;ultimo_atendimento;autorizou;pediu_para_sair;valor_medio");
    expect(lines[1]).toBe("Ana;(31) 99690-7206;Limpeza;6;2026-05-02;sim;não;150");
    expect(lines[2]!.startsWith("'=HYPERLINK(1);")).toBe(true);
  });
});

describe("patientDataToCsv", () => {
  it("adds the history after the patient row", () => {
    const csv = patientDataToCsv(base, [{ created_at: "2026-10-01T10:00:00Z", kind: "enviado" }], { enviado: "Lembrete enviado" });
    expect(csv).toContain("data;acao");
    expect(csv).toContain("2026-10-01T10:00:00Z;Lembrete enviado");
  });
});

describe("exportFileName", () => {
  it("uses the date", () => {
    expect(exportFileName("pacientes", new Date("2026-11-04T12:00:00Z"))).toBe("pacientes-2026-11-04.csv");
  });
});
