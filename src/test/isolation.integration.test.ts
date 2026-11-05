import { describe, it, expect, beforeAll } from "vitest";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

// Clinic A x B isolation. Needs a real Supabase project with all migrations applied and two accounts,
// each already owning its own clinic. Skipped when the variables are missing.
// PowerShell: $env:TEST_SUPABASE_URL="..."; $env:TEST_SUPABASE_KEY="<publishable key>"; $env:TEST_USER_A_EMAIL="..."; ...
const e = (k: string) => process.env[k];
const ready = ["TEST_SUPABASE_URL", "TEST_SUPABASE_KEY", "TEST_USER_A_EMAIL", "TEST_USER_A_PASSWORD", "TEST_USER_B_EMAIL", "TEST_USER_B_PASSWORD"].every(e);

async function login(email: string, password: string) {
  const c = createClient(e("TEST_SUPABASE_URL")!, e("TEST_SUPABASE_KEY")!, { auth: { persistSession: false } });
  const { data, error } = await c.auth.signInWithPassword({ email, password });
  if (error || !data.user) throw new Error(`login failed for ${email}`);
  const { data: m } = await c.from("clinic_members").select("clinic_id").eq("user_id", data.user.id).limit(1).single();
  return { c, clinicId: m!.clinic_id as string };
}

describe.skipIf(!ready)("tenant isolation (A x B)", () => {
  let a: { c: SupabaseClient; clinicId: string };
  let b: { c: SupabaseClient; clinicId: string };
  let patientId: string;

  beforeAll(async () => {
    a = await login(e("TEST_USER_A_EMAIL")!, e("TEST_USER_A_PASSWORD")!);
    b = await login(e("TEST_USER_B_EMAIL")!, e("TEST_USER_B_PASSWORD")!);
    expect(a.clinicId).not.toBe(b.clinicId);
    const { data, error } = await a.c.from("patients").insert({ clinic_id: a.clinicId, name: "Teste Isolamento", phone: "31999990000" }).select("id").single();
    expect(error).toBeNull();
    patientId = data!.id;
  });

  it("B cannot read A's patient", async () => {
    const { data } = await b.c.from("patients").select("id").eq("id", patientId);
    expect(data).toEqual([]);
  });

  it("B cannot update A's patient", async () => {
    await b.c.from("patients").update({ name: "Invadido" }).eq("id", patientId);
    const { data } = await a.c.from("patients").select("name").eq("id", patientId).single();
    expect(data?.name).toBe("Teste Isolamento");
  });

  it("B cannot delete A's patient", async () => {
    await b.c.from("patients").delete().eq("id", patientId);
    const { data } = await a.c.from("patients").select("id").eq("id", patientId);
    expect(data).toHaveLength(1);
  });

  it("B cannot insert into A's clinic", async () => {
    const { error } = await b.c.from("patients").insert({ clinic_id: a.clinicId, name: "Intruso", phone: "31999990001" });
    expect(error).not.toBeNull();
  });

  it("B cannot read A's audit log, and A cannot change it", async () => {
    const { data: asB } = await b.c.from("audit_log").select("id").eq("clinic_id", a.clinicId);
    expect(asB).toEqual([]);
    const { data: asA } = await a.c.from("audit_log").select("id").eq("clinic_id", a.clinicId).limit(1);
    expect(asA?.length).toBeGreaterThan(0);
    const upd = await a.c.from("audit_log").update({ action: "x" }).eq("id", asA![0]!.id);
    const del = await a.c.from("audit_log").delete().eq("id", asA![0]!.id);
    expect(upd.error ?? del.error).not.toBeNull();
  });

  it("cleanup", async () => {
    await a.c.from("patients").delete().eq("id", patientId);
  });
});
