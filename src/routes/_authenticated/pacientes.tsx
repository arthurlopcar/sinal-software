import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { clinicQuery, KIND_LABEL, logEvent, patientsQuery } from "@/lib/clinic";
import { fmtDate, monthsLabel, nextDate } from "@/lib/reminders";
import { findDuplicate, maskPhoneBR, parseMoney, PROCEDURES, RETURN_OPTIONS, previewCsv, validatePatient, type CsvPreview } from "@/lib/patients";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { downloadCsv, exportFileName, patientDataToCsv } from "@/lib/export";
import { Plus, Upload, Pencil, Trash2, Download, ShieldOff } from "lucide-react";

export const Route = createFileRoute("/_authenticated/pacientes")({
  head: () => ({ meta: [{ title: "Pacientes — Sinal" }, { name: "description", content: "Cadastro de pacientes e intervalos de retorno." }] }),
  component: Pacientes,
});

type Form = { id?: string; name: string; phone: string; service: string; interval_months: string; last_visit: string; consent: boolean; avg_value: string };
const empty = (): Form => ({ name: "", phone: "", service: "", interval_months: "3", last_visit: new Date().toISOString().slice(0, 10), consent: false, avg_value: "" });
const UNDO_MS = 10_000;

function Pacientes() {
  const { data: ctx } = useSuspenseQuery(clinicQuery);
  const clinic = ctx.clinic!;
  const isOwner = clinic.owner_id === ctx.user!.id;
  const qc = useQueryClient();
  const { data: patients = [] } = useQuery(patientsQuery(clinic.id));
  const [form, setForm] = useState<Form>(empty());
  const [q, setQ] = useState("");
  const [preview, setPreview] = useState<CsvPreview | null>(null);
  const [importing, setImporting] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const refresh = () => qc.invalidateQueries({ queryKey: ["patients", clinic.id] });

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    const money = parseMoney(form.avg_value);
    if (money === undefined) { toast.error("Valor do procedimento inválido. Use só números, ex.: 150 ou 150,50."); return; }
    const checked = validatePatient({ name: form.name, phone: form.phone, service: form.service, interval_months: Number(form.interval_months), last_visit: form.last_visit, consent: form.consent, avg_value: money });
    if (!checked.ok) { toast.error(checked.error); return; }
    const row = checked.value;

    let targetId = form.id;
    const dup = findDuplicate(patients, row.phone, form.id);
    if (dup) {
      if (!confirm(`Já existe um paciente com este WhatsApp: ${dup.name}. Quer atualizar o cadastro dele?`)) return;
      targetId = dup.id;
    }

    if (targetId) {
      const before = patients.find((p) => p.id === targetId);
      const { error } = await supabase.from("patients").update(row).eq("id", targetId).eq("clinic_id", clinic.id);
      if (error) { toast.error("Não foi possível salvar. Tente de novo."); return; }
      toast.success("Paciente atualizado", {
        duration: UNDO_MS,
        action: before && {
          label: "Desfazer",
          onClick: async () => {
            const { name, phone, service, interval_months, last_visit, consent, avg_value } = before;
            await supabase.from("patients").update({ name, phone, service, interval_months, last_visit, consent, avg_value }).eq("id", before.id).eq("clinic_id", clinic.id);
            refresh();
          },
        },
      });
    } else {
      const { data, error } = await supabase.from("patients").insert({ ...row, clinic_id: clinic.id }).select("id").single();
      if (error || !data) { toast.error("Não foi possível salvar. Tente de novo."); return; }
      toast.success("Paciente cadastrado", {
        duration: UNDO_MS,
        action: {
          label: "Desfazer",
          onClick: async () => {
            await supabase.from("patients").delete().eq("id", data.id).eq("clinic_id", clinic.id);
            refresh();
          },
        },
      });
    }
    setForm(empty());
    refresh();
  };

  const remove = async (p: (typeof patients)[number]) => {
    if (!confirm(`Excluir ${p.name}? Isso apaga o cadastro.`)) return;
    const { error } = await supabase.from("patients").delete().eq("id", p.id).eq("clinic_id", clinic.id);
    if (error) { toast.error("Não foi possível excluir. Tente de novo."); return; }
    refresh();
    toast.success(`${p.name} excluído`, {
      duration: UNDO_MS,
      action: {
        label: "Desfazer",
        onClick: async () => {
          await supabase.from("patients").insert({ ...p, clinic_id: clinic.id });
          refresh();
        },
      },
    });
  };

  const exportOne = async (p: (typeof patients)[number]) => {
    const { data, error } = await supabase.from("contact_events").select("created_at, kind").eq("clinic_id", clinic.id).eq("patient_id", p.id).order("created_at");
    if (error) { toast.error("Não foi possível exportar. Tente de novo."); return; }
    const { error: logErr } = await supabase.rpc("log_export", { _clinic: clinic.id, _scope: "patient" });
    if (logErr) { toast.error("Não foi possível registrar a exportação."); return; }
    downloadCsv(exportFileName("paciente"), patientDataToCsv(p, data ?? [], KIND_LABEL));
  };

  const anonymize = async (p: (typeof patients)[number]) => {
    if (!confirm(`Apagar os dados pessoais de ${p.name}? Nome, WhatsApp e conversas serão removidos e isso NÃO pode ser desfeito.`)) return;
    const { error } = await supabase.rpc("anonymize_patient", { _patient: p.id });
    if (error) { toast.error("Não foi possível apagar. Tente de novo."); return; }
    refresh();
    toast.success("Dados pessoais apagados");
  };

  const toggle = async (p: (typeof patients)[number], field: "consent" | "opted_out") => {
    const val = !p[field];
    await supabase.from("patients").update(field === "consent" ? { consent: val } : { opted_out: val }).eq("id", p.id);
    await logEvent(clinic.id, ctx.user!.id, p, field === "consent" ? (val ? "autorizou" : "desautorizou") : val ? "saiu" : "reativado");
    refresh();
    qc.invalidateQueries({ queryKey: ["events", clinic.id] });
  };

  const readCsv = async (file: File) => {
    if (file.size > 1_000_000) { toast.error("Arquivo muito grande (máximo 1 MB)."); return; }
    const result = previewCsv(await file.text(), patients);
    if (result.fatal) { toast.error(result.fatal); return; }
    setPreview(result);
  };

  const confirmImport = async () => {
    if (!preview?.valid.length) return;
    setImporting(true);
    const { error } = await supabase.from("patients").insert(preview.valid.map((r) => ({ ...r, clinic_id: clinic.id })));
    setImporting(false);
    if (error) { toast.error("Não foi possível importar. Tente de novo."); return; }
    toast.success(`${preview.valid.length} pacientes importados`);
    setPreview(null);
    refresh();
  };

  const list = patients.filter((p) => (p.name + p.phone + p.service).toLowerCase().includes(q.toLowerCase()));

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <h1 className="font-display text-3xl font-bold">Pacientes</h1>
        <div className="flex gap-2">
          <input ref={fileRef} type="file" accept=".csv,text/csv" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) readCsv(f); e.target.value = ""; }} />
          <Button variant="outline" onClick={() => fileRef.current?.click()}><Upload /> Importar planilha (CSV)</Button>
        </div>
      </div>
      <p className="mt-2 text-xs text-muted-foreground">
        Planilha: colunas <b>nome; whatsapp; serviço; intervalo em meses; último atendimento (dd/mm/aaaa); autorizou (sim/não)</b>. No Excel, use "Salvar como → CSV".
      </p>

      {preview && (
        <div className="mt-6 rounded-xl border bg-card p-5">
          <p className="font-semibold">Conferir antes de importar</p>
          <p className="mt-1 text-sm text-muted-foreground">
            {preview.valid.length} paciente(s) prontos para importar
            {preview.errors.length > 0 && <> · {preview.errors.length} linha(s) com problema (não serão importadas)</>}.
          </p>
          {preview.valid.length > 0 && (
            <ul className="mt-3 max-h-40 space-y-1 overflow-y-auto text-sm">
              {preview.valid.slice(0, 5).map((p) => <li key={p.phone}>{p.name} · {maskPhoneBR(p.phone)}</li>)}
              {preview.valid.length > 5 && <li className="text-muted-foreground">…e mais {preview.valid.length - 5}</li>}
            </ul>
          )}
          {preview.errors.length > 0 && (
            <ul className="mt-3 max-h-40 space-y-1 overflow-y-auto text-sm text-destructive">
              {preview.errors.map((er) => <li key={er.line}>Linha {er.line}: {er.message}</li>)}
            </ul>
          )}
          <div className="mt-4 flex gap-2">
            <Button onClick={confirmImport} disabled={importing || preview.valid.length === 0}>Importar {preview.valid.length} paciente(s)</Button>
            <Button variant="ghost" onClick={() => setPreview(null)}>Cancelar</Button>
          </div>
        </div>
      )}

      <form onSubmit={save} className="mt-6 grid gap-4 rounded-xl border bg-card p-5 md:grid-cols-2">
        <Input required className="h-11 text-base" placeholder="Nome" autoComplete="off" maxLength={120} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        <Input required className="h-11 text-base" placeholder="WhatsApp: (31) 99999-0000" inputMode="tel" autoComplete="off" value={form.phone} onChange={(e) => setForm({ ...form, phone: maskPhoneBR(e.target.value) })} />
        <div>
          <Input className="h-11 text-base" list="procedimentos" placeholder="Procedimento (ex.: Limpeza)" maxLength={80} value={form.service} onChange={(e) => setForm({ ...form, service: e.target.value })} />
          <datalist id="procedimentos">{PROCEDURES.map((s) => <option key={s} value={s} />)}</datalist>
        </div>
        <label className="flex items-center gap-3 text-sm">
          <span className="shrink-0 text-muted-foreground">Última consulta</span>
          <Input type="date" className="h-11 text-base" value={form.last_visit} onChange={(e) => setForm({ ...form, last_visit: e.target.value })} />
        </label>
        <label className="flex items-center gap-3 text-sm">
          <span className="shrink-0 text-muted-foreground">Valor médio (opcional)</span>
          <Input className="h-11 text-base" inputMode="decimal" placeholder="R$ 150,00" value={form.avg_value} onChange={(e) => setForm({ ...form, avg_value: e.target.value })} />
        </label>
        <fieldset className="md:col-span-2">
          <legend className="mb-2 text-sm text-muted-foreground">Voltar em</legend>
          <div className="flex flex-wrap gap-2">
            {RETURN_OPTIONS.map((o) => (
              <Button key={o.months} type="button" size="lg" variant={form.interval_months === String(o.months) ? "default" : "outline"} onClick={() => setForm({ ...form, interval_months: String(o.months) })}>{o.label}</Button>
            ))}
            {![1, 2, 3, 6].includes(Number(form.interval_months)) && (
              <Button type="button" size="lg" variant="default">{monthsLabel(Number(form.interval_months))}</Button>
            )}
          </div>
        </fieldset>
        <label className="flex items-center gap-3 text-base md:col-span-2">
          <input type="checkbox" className="size-5 accent-primary" checked={form.consent} onChange={(e) => setForm({ ...form, consent: e.target.checked })} />
          Paciente autorizou receber mensagens
        </label>
        <div className="flex gap-2 md:col-span-2">
          <Button type="submit" size="lg">{form.id ? "Salvar" : <><Plus /> Adicionar</>}</Button>
          {form.id && <Button type="button" size="lg" variant="ghost" onClick={() => setForm(empty())}>Cancelar</Button>}
        </div>
      </form>

      <Input className="mt-6 max-w-xs" placeholder="Buscar paciente…" value={q} onChange={(e) => setQ(e.target.value)} />

      <div className="mt-4 overflow-x-auto rounded-xl border bg-card">
        <table className="w-full text-sm">
          <thead className="bg-muted text-left text-muted-foreground">
            <tr><th className="p-4">Paciente</th><th className="p-4">Serviço</th><th className="p-4">Intervalo</th><th className="p-4">Último</th><th className="p-4">Próximo lembrete</th><th className="p-4">Autorizou</th><th className="p-4">Situação</th><th className="p-4"></th></tr>
          </thead>
          <tbody>
            {list.length === 0 && (
              <tr><td colSpan={8} className="p-8 text-center text-muted-foreground">
                {patients.length === 0 ? "Nenhum paciente ainda. Preencha o nome e o WhatsApp acima e clique em Adicionar." : "Ninguém encontrado com essa busca."}
              </td></tr>
            )}
            {list.map((p) => (
              <tr key={p.id} className="border-t">
                <td className="p-4"><p className="font-medium">{p.name}</p><p className="text-muted-foreground">{p.phone}</p></td>
                <td className="p-4">{p.service || "—"}</td>
                <td className="p-4">{monthsLabel(p.interval_months)}</td>
                <td className="p-4">{fmtDate(new Date(p.last_visit + "T00:00:00Z"))}</td>
                <td className="p-4">{fmtDate(nextDate(p))}</td>
                <td className="p-4">
                  <input type="checkbox" className="size-4 accent-primary" checked={p.consent} disabled={p.opted_out} onChange={() => toggle(p, "consent")} aria-label={`${p.name} autorizou lembretes`} />
                </td>
                <td className="p-4">
                  <button onClick={() => toggle(p, "opted_out")} className={`rounded-full px-2.5 py-1 text-xs font-medium ${p.opted_out ? "bg-muted text-muted-foreground" : "bg-success/15 text-success"}`}>
                    {p.opted_out ? "Pediu para sair · reativar" : "Ativo"}
                  </button>
                </td>
                <td className="p-4">
                  <div className="flex gap-1">
                    <Button size="icon" variant="ghost" aria-label="Editar" onClick={() => setForm({ id: p.id, name: p.name, phone: p.phone, service: p.service, interval_months: String(p.interval_months), last_visit: p.last_visit, consent: p.consent, avg_value: p.avg_value == null ? "" : String(p.avg_value).replace(".", ",") })}><Pencil /></Button>
                    <Button size="icon" variant="ghost" aria-label="Excluir" onClick={() => remove(p)}><Trash2 /></Button>
                    {isOwner && <Button size="icon" variant="ghost" aria-label="Exportar dados do paciente" title="Exportar dados do paciente" onClick={() => exportOne(p)}><Download /></Button>}
                    {isOwner && <Button size="icon" variant="ghost" aria-label="Apagar dados pessoais" title="Apagar dados pessoais (LGPD)" onClick={() => anonymize(p)}><ShieldOff /></Button>}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
