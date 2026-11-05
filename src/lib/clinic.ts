import { queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type Clinic = {
  id: string; name: string; owner_id: string; message_template: string; plan_status: string; trial_ends_at: string;
};

export const clinicQuery = queryOptions({
  queryKey: ["clinic"],
  queryFn: async () => {
    const { data: u } = await supabase.auth.getUser();
    if (!u.user) return { user: null, clinic: null as Clinic | null, isAdmin: false };
    await supabase.rpc("accept_invites");
    const { data: m } = await supabase.from("clinic_members").select("clinic_id, clinics(*)").eq("user_id", u.user.id).limit(1).maybeSingle();
    const { data: roles } = await supabase.from("user_roles").select("role").eq("user_id", u.user.id);
    return {
      user: { id: u.user.id, email: u.user.email ?? "" },
      clinic: ((m as unknown as { clinics: Clinic } | null)?.clinics ?? null) as Clinic | null,
      isAdmin: !!roles?.some((r) => r.role === "admin"),
    };
  },
});

export const patientsQuery = (clinicId: string) =>
  queryOptions({
    queryKey: ["patients", clinicId],
    queryFn: async () => {
      const { data, error } = await supabase.from("patients").select("*").eq("clinic_id", clinicId).order("name");
      if (error) throw error;
      return data;
    },
  });

export const eventsQuery = (clinicId: string) =>
  queryOptions({
    queryKey: ["events", clinicId],
    queryFn: async () => {
      const { data, error } = await supabase.from("contact_events").select("*").eq("clinic_id", clinicId).order("created_at", { ascending: false }).limit(500);
      if (error) throw error;
      return data;
    },
  });

export async function logEvent(clinicId: string, userId: string, patient: { id: string; name: string }, kind: string) {
  const { data } = await supabase
    .from("contact_events")
    .insert({ clinic_id: clinicId, patient_id: patient.id, patient_name: patient.name, kind, created_by: userId })
    .select("id")
    .single();
  return data?.id as string | undefined;
}

export const KIND_LABEL: Record<string, string> = {
  enviado: "Lembrete enviado",
  voltou: "Voltou / agendou",
  saiu: "Pediu para sair",
  reativado: "Reativado",
  autorizou: "Autorizou lembretes",
  desautorizou: "Retirou autorização",
};
