import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { clinicQuery } from "@/lib/clinic";

export const Route = createFileRoute("/_authenticated/admin")({
  head: () => ({ meta: [{ title: "Admin — Sinal" }, { name: "description", content: "Todas as clínicas assinantes do Sinal." }] }),
  component: Admin,
});

function Admin() {
  const { data: ctx } = useSuspenseQuery(clinicQuery);
  const qc = useQueryClient();
  const { data: clinics = [] } = useQuery({
    queryKey: ["admin-clinics"],
    enabled: ctx.isAdmin,
    queryFn: async () => (await supabase.from("clinics").select("*").order("created_at", { ascending: false })).data ?? [],
  });
  if (!ctx.isAdmin) return <p className="text-muted-foreground">Acesso restrito.</p>;

  const setStatus = async (id: string, plan_status: string) => {
    await supabase.from("clinics").update({ plan_status }).eq("id", id);
    qc.invalidateQueries({ queryKey: ["admin-clinics"] });
  };

  return (
    <div>
      <h1 className="font-display text-3xl font-bold">Clínicas assinantes</h1>
      <div className="mt-6 overflow-x-auto rounded-xl border bg-card">
        <table className="w-full text-sm">
          <thead className="bg-muted text-left text-muted-foreground"><tr><th className="p-4">Clínica</th><th className="p-4">Criada em</th><th className="p-4">Fim do teste</th><th className="p-4">Situação</th></tr></thead>
          <tbody>
            {clinics.map((c) => (
              <tr key={c.id} className="border-t">
                <td className="p-4 font-medium">{c.name}</td>
                <td className="p-4">{new Date(c.created_at).toLocaleDateString("pt-BR")}</td>
                <td className="p-4">{new Date(c.trial_ends_at).toLocaleDateString("pt-BR")}</td>
                <td className="p-4">
                  <select className="h-8 rounded-md border bg-background px-2" value={c.plan_status} onChange={(e) => setStatus(c.id, e.target.value)}>
                    <option value="teste">Em teste</option>
                    <option value="ativo">Pagando</option>
                    <option value="suspenso">Suspenso</option>
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
