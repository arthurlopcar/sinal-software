import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const sql = readFileSync(resolve(__dirname, "../../drizzle/migrations/0006_lgpd_tools.sql"), "utf8");

// Static guard so the owner-only rule cannot be dropped from these functions by accident.
describe("LGPD migration", () => {
  const fns = ["anonymize_patient", "purge_old_records", "log_export"];
  for (const fn of fns) {
    it(`${fn} is security definer, owner-only and closed to anon`, () => {
      const body = sql.split(new RegExp(`create or replace function public\\.${fn}`))[1]!.split(/\$\$;/)[0]!;
      expect(body).toMatch(/security definer set search_path = public/);
      expect(body).toMatch(/is_owner\(/);
      expect(sql).toMatch(new RegExp(`revoke execute on function[^;]*${fn}[^;]*from public, anon`));
      expect(sql).toMatch(new RegExp(`grant execute on function[^;]*${fn}[^;]*to authenticated`));
    });
  }
  it("limits the retention window", () => {
    expect(sql).toMatch(/_months < 6 or _months > 60/);
  });
  it("anonymizes without leaving name or phone", () => {
    expect(sql).toMatch(/name = 'Paciente removido', phone = '00000000'/);
    expect(sql).toMatch(/delete from public\.clinic_conversations/);
  });
});
