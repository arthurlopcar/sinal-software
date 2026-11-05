import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useSuspenseQuery } from "@tanstack/react-query";
import { clinicQuery, eventsQuery, KIND_LABEL } from "@/lib/clinic";

export const Route = createFileRoute("/_authenticated/historico")({
  head: () => ({ meta: [{ title: "Histórico — Sinal" }, { name: "description", content: "Registro de envios, retornos, autorizações e pedidos de saída." }] }),
  component: Historico,
});

function Historico() {
  const { data: ctx } = useSuspenseQuery(clinicQuery);
  const { data: events = [] } = useQuery(eventsQuery(ctx.clinic!.id));
  return (
    <div>
      <h1 className="font-display text-3xl font-bold">Histórico</h1>
      <p className="mt-1 text-sm text-muted-foreground">Registro de tudo que a equipe fez — útil para comprovar autorização e pedidos de saída (LGPD).</p>
      <div className="mt-6 overflow-x-auto rounded-xl border bg-card">
        <table className="w-full text-sm">
          <thead className="bg-muted text-left text-muted-foreground"><tr><th className="p-4">Data</th><th className="p-4">Paciente</th><th className="p-4">Ação</th></tr></thead>
          <tbody>
            {events.length === 0 && <tr><td colSpan={3} className="p-8 text-center text-muted-foreground">Nada registrado ainda.</td></tr>}
            {events.map((e) => (
              <tr key={e.id} className="border-t">
                <td className="p-4">{new Date(e.created_at).toLocaleString("pt-BR")}</td>
                <td className="p-4">{e.patient_name}</td>
                <td className="p-4">{KIND_LABEL[e.kind] ?? e.kind}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
