import { describe, it, expect } from "vitest";
import { findDuplicate, maskPhoneBR, normalizePhoneBR, parseMoney, previewCsv, validatePatient } from "./patients";

describe("normalizePhoneBR", () => {
  it("accepts mobile and landline, with or without 55", () => {
    expect(normalizePhoneBR("(31) 99690-7206")).toBe("5531996907206");
    expect(normalizePhoneBR("5531996907206")).toBe("5531996907206");
    expect(normalizePhoneBR("3133334444")).toBe("553133334444");
  });
  it("rejects invalid numbers", () => {
    expect(normalizePhoneBR("99690-7206")).toBeNull();
    expect(normalizePhoneBR("(10) 99999-0000")).toBeNull();
    expect(normalizePhoneBR("(31) 89999-0000")).toBeNull();
    expect(normalizePhoneBR("")).toBeNull();
  });
});

describe("maskPhoneBR", () => {
  it("masks while typing", () => {
    expect(maskPhoneBR("3")).toBe("(3");
    expect(maskPhoneBR("31996907206")).toBe("(31) 99690-7206");
    expect(maskPhoneBR("3133334444")).toBe("(31) 3333-4444");
    expect(maskPhoneBR("5531996907206")).toBe("(31) 99690-7206");
  });
});

describe("findDuplicate", () => {
  const list = [{ id: "1", phone: "(31) 99690-7206" }, { id: "2", phone: "11 98888-0000" }];
  it("matches regardless of formatting", () => {
    expect(findDuplicate(list, "5531996907206")?.id).toBe("1");
    expect(findDuplicate(list, "(21) 97777-0000")).toBeUndefined();
  });
  it("ignores the patient being edited", () => {
    expect(findDuplicate(list, "31996907206", "1")).toBeUndefined();
  });
});

describe("validatePatient", () => {
  const base = { name: " Ana  Souza ", phone: "31996907206", service: "Limpeza", interval_months: 6, last_visit: "2026-05-02", consent: true };
  it("cleans the input", () => {
    const r = validatePatient(base);
    expect(r.ok && r.value).toMatchObject({ name: "Ana Souza", phone: "5531996907206" });
  });
  it("explains what to fix", () => {
    expect(validatePatient({ ...base, name: " " })).toEqual({ ok: false, error: "Escreva o nome do paciente." });
    expect(validatePatient({ ...base, phone: "123" }).ok).toBe(false);
    expect(validatePatient({ ...base, last_visit: "2026-02-31" }).ok).toBe(false);
    expect(validatePatient({ ...base, interval_months: 0 }).ok).toBe(false);
  });
});

describe("parseMoney", () => {
  it("reads Brazilian and plain formats", () => {
    expect(parseMoney("")).toBeNull();
    expect(parseMoney("150")).toBe(150);
    expect(parseMoney("R$ 1.500,50")).toBe(1500.5);
    expect(parseMoney("abc")).toBeUndefined();
    expect(parseMoney("-5")).toBeUndefined();
  });
});

describe("previewCsv", () => {
  const csv = [
    "nome;whatsapp;servico;intervalo;ultimo;autorizou",
    "Ana;31996907206;Limpeza;6;02/05/2026;sim",
    "",
    ";31996907200;Canal;3;;nao",
    "Bruno;123;Canal;3;;nao",
    "Ana Repetida;(31) 99690-7206;Limpeza;6;;sim",
    "Carla;11988880000;Outro;3;2026-04-01;nao",
  ].join("\n");

  it("keeps good rows and reports bad ones with spreadsheet line numbers", () => {
    const r = previewCsv(csv);
    expect(r.valid.map((p) => p.name)).toEqual(["Ana", "Carla"]);
    expect(r.errors.map((e) => e.line)).toEqual([4, 5, 6]);
  });
  it("skips phones already registered", () => {
    const r = previewCsv(csv, [{ phone: "11 98888-0000" }]);
    expect(r.valid.map((p) => p.name)).toEqual(["Ana"]);
  });
  it("blocks files over the row limit", () => {
    const big = "nome;whatsapp\n" + Array.from({ length: 5001 }, (_, i) => `P${i};31996907206`).join("\n");
    expect(previewCsv(big).fatal).toMatch(/mais de 5000/);
  });
  it("handles an empty sheet", () => {
    expect(previewCsv("nome;whatsapp").fatal).toBeDefined();
  });
});
