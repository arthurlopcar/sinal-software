import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { clinicQuery } from "@/lib/clinic";
import { renderMessage } from "@/lib/reminders";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Trash2 } from "lucide-react";
import { downloadCsv, exportFileName, patientsToCsv } from "@/lib/export";

export const Route = createFileRoute("/_authenticated/configuracoes")({
  head: () => ({ meta: [{ title: "Configurações — Sinal" }, { name: "description", content: "Mensagem padrão e equipe da clínica." }] }),
  component: Config,
});

function Config() {
  const { data: ctx } = useSuspenseQuery(clinicQuery);
  const clinic = ctx.clinic!;
  const isOwner = clinic.owner_id === ctx.user!.id;
  const qc = useQueryClient();
  const [name, setName] = useState(clinic.name);
  const [tpl, setTpl] = useState(clinic.message_template);
  const [invite, setInvite] = useState("");
  const [retention, setRetention] = useState("24");

  const { data: members = [] } = useQuery({
    queryKey: ["members", clinic.id],
    queryFn: async () => (await supabase.from("clinic_members").select("*").eq("clinic_id", clinic.id)).data ?? [],
  });
  const { data: invites = [] } = useQuery({
    queryKey: ["invites", clinic.id],
    enabled: isOwner,
    queryFn: async () => (await supabase.from("clinic_invites").select("*").eq("clinic_id", clinic.id)).data ?? [],
  });

  const save = async () => {
    const { error } = await supabase.from("clinics").update({ name, message_template: tpl }).eq("id", clinic.id);
    if (error) { toast.error(error.message); return; }
    toast.success("Salvo");
    qc.invalidateQueries({ queryKey: ["clinic"] });
  };
  const addInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    const { error } = await supabase.from("clinic_invites").insert({ clinic_id: clinic.id, email: invite.trim().toLowerCase() });
    if (error) { toast.error(error.message); return; }
    toast.success("Convite registrado. Peça para a pessoa criar a conta no Sinal com esse e-mail.");
    setInvite("");
    qc.invalidateQueries({ queryKey: ["invites", clinic.id] });
  };

  const sample = { name: "Marta Souza", phone: "", service: "Consulta cardiológica", interval_months: 3, last_visit: "" };

  const exportAll = async () => {
    const { data, error } = await supabase.from("patients").select("*").eq("clinic_id", clinic.id).order("name");
    if (error) { toast.error("Não foi possível exportar. Tente de novo."); return; }
    const { error: logErr } = await supabase.rpc("log_export", { _clinic: clinic.id, _scope: "all" });
    if (logErr) { toast.error("Não foi possível registrar a exportação."); return; }
    downloadCsv(exportFileName("pacientes"), patientsToCsv(data ?? []));
  };
  const purge = async () => {
    const months = Number(retention);
    if (!confirm(`Apagar para sempre o histórico e as conversas com mais de ${months} meses? Isso não pode ser desfeito.`)) return;
    const { data, error } = await supabase.rpc("purge_old_records", { _clinic: clinic.id, _months: months });
    if (error) { toast.error("Não foi possível limpar. Tente de novo."); return; }
    const r = data as { events: number; messages: number };
    toast.success(`Removidos: ${r.events} registros de contato e ${r.messages} mensagens`);
  };

  return (
    <div className="max-w-3xl space-y-8">
      <h1 className="font-display text-3xl font-bold">Configurações</h1>

      <section className="space-y-3 rounded-xl border bg-card p-6">
        <h2 className="font-display text-lg font-semibold">Clínica e mensagem padrão</h2>
        <Input value={name} onChange={(e) => setName(e.target.value)} disabled={!isOwner} />
        <Textarea rows={4} value={tpl} onChange={(e) => setTpl(e.target.value)} disabled={!isOwner} />
        <p className="text-xs text-muted-foreground">Use: {"{nome}"}, {"{clinica}"}, {"{servico}"}, {"{intervalo}"}. A frase de saída é adicionada automaticamente no final.</p>
        <div className="whitespace-pre-line rounded-lg bg-muted p-4 text-sm"><b>Exemplo:</b>{"\n"}{renderMessage(tpl, sample, name)}</div>
        {isOwner && <Button onClick={save}>Salvar</Button>}
      </section>

      <section className="space-y-3 rounded-xl border bg-card p-6">
        <h2 className="font-display text-lg font-semibold">Equipe</h2>
        <ul className="divide-y text-sm">
          {members.map((m) => (
            <li key={m.user_id} className="flex items-center justify-between py-2">
              <span>{m.email} <span className="text-muted-foreground">· {m.role}</span></span>
              {isOwner && m.user_id !== ctx.user!.id && (
                <Button size="icon" variant="ghost" aria-label="Remover" onClick={async () => { await supabase.from("clinic_members").delete().eq("clinic_id", clinic.id).eq("user_id", m.user_id); qc.invalidateQueries({ queryKey: ["members", clinic.id] }); }}><Trash2 /></Button>
              )}
            </li>
          ))}
          {invites.map((i) => (
            <li key={i.id} className="flex items-center justify-between py-2 text-muted-foreground">
              <span>{i.email} · convite pendente</span>
              <Button size="icon" variant="ghost" aria-label="Cancelar convite" onClick={async () => { await supabase.from("clinic_invites").delete().eq("id", i.id); qc.invalidateQueries({ queryKey: ["invites", clinic.id] }); }}><Trash2 /></Button>
            </li>
          ))}
        </ul>
        {isOwner && (
          <form onSubmit={addInvite} className="flex gap-2">
            <Input type="email" required placeholder="E-mail da recepcionista" value={invite} onChange={(e) => setInvite(e.target.value)} />
            <Button type="submit">Convidar</Button>
          </form>
        )}
      </section>

      {isOwner && (
        <section className="space-y-4 rounded-xl border bg-card p-6">
          <h2 className="font-display text-lg font-semibold">Dados e privacidade</h2>
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">Baixe todos os pacientes em planilha (a exportação fica registrada).</p>
            <Button variant="outline" onClick={exportAll}>Exportar pacientes (CSV)</Button>
          </div>
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">Apagar histórico de contatos e conversas mais antigos que:</p>
            <div className="flex gap-2">
              <select className="h-10 rounded-md border bg-background px-3 text-sm" value={retention} onChange={(e) => setRetention(e.target.value)} aria-label="Prazo de retenção">
                {[6, 12, 24, 36, 60].map((m) => <option key={m} value={m}>{m} meses</option>)}
              </select>
              <Button variant="destructive" onClick={purge}>Apagar histórico antigo</Button>
            </div>
          </div>
          <p className="text-xs text-muted-foreground">Para apagar os dados de um paciente específico, use o botão de escudo na lista de Pacientes.</p>
        </section>
      )}
    </div>
  );
}
