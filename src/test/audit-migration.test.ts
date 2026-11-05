import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const sql = readFileSync(resolve(__dirname, "../../drizzle/migrations/0004_audit_log.sql"), "utf8");

// Static guard: breaks the build if someone loosens the audit_log permissions in a future migration edit.
describe("audit_log migration", () => {
  it("lets the browser role only read", () => {
    expect(sql).toMatch(/grant select on public\.audit_log to authenticated;/);
    expect(sql).not.toMatch(/grant[^;]*\b(insert|update|delete|truncate|all)\b[^;]*to[^;]*authenticated/i);
  });
  it("never grants update or delete to anyone", () => {
    const grants = sql.match(/grant [^;]+;/gi) ?? [];
    for (const g of grants) expect(g).not.toMatch(/\b(update|delete|truncate|all)\b/i);
  });
  it("blocks update, delete and truncate with triggers", () => {
    expect(sql).toMatch(/before update or delete on public\.audit_log/);
    expect(sql).toMatch(/before truncate on public\.audit_log/);
  });
  it("keeps RLS on and stores no personal data columns", () => {
    expect(sql).toMatch(/alter table public\.audit_log enable row level security/);
    expect(sql).not.toMatch(/\b(name|phone|email)\b\s+text/);
  });
  it("audits patients, members and clinics", () => {
    for (const t of ["patients", "clinic_members", "clinics"]) expect(sql).toContain(`on public.${t}`);
  });
});
