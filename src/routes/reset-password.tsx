import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export const Route = createFileRoute("/reset-password")({
  head: () => ({
    meta: [
      { title: "Nova senha — Sinal" },
      { name: "description", content: "Defina uma nova senha para acessar o Sinal." },
      { property: "og:title", content: "Nova senha — Sinal" },
      { property: "og:description", content: "Defina uma nova senha para acessar o Sinal." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Reset,
});

function Reset() {
  const [pw, setPw] = useState("");
  const nav = useNavigate();
  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    const { error } = await supabase.auth.updateUser({ password: pw });
    if (error) { toast.error(error.message); return; }
    toast.success("Senha atualizada");
    nav({ to: "/painel" });
  };
  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <form onSubmit={save} className="w-full max-w-sm space-y-3 rounded-2xl border bg-card p-8">
        <h1 className="font-display text-xl font-semibold">Definir nova senha</h1>
        <Input type="password" minLength={6} required placeholder="Nova senha" value={pw} onChange={(e) => setPw(e.target.value)} />
        <Button className="w-full" type="submit">Salvar</Button>
      </form>
    </div>
  );
}
