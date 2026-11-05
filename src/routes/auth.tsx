import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Entrar — Sinal" },
      { name: "description", content: "Acesse o painel de retornos da sua clínica no Sinal." },
      { property: "og:title", content: "Entrar — Sinal" },
      { property: "og:description", content: "Acesse o painel de retornos da sua clínica." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const nav = useNavigate();
  const [mode, setMode] = useState<"entrar" | "criar" | "esqueci">("entrar");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [accepted, setAccepted] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => data.user && nav({ to: "/painel", replace: true }));
  }, [nav]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      if (mode === "entrar") {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        nav({ to: "/painel", replace: true });
      } else if (mode === "criar") {
        const { error } = await supabase.auth.signUp({ email, password, options: { emailRedirectTo: window.location.origin + "/painel", data: { terms_accepted_at: new Date().toISOString() } } });
        if (error) throw error;
        toast.success("Conta criada! Confirme pelo link enviado ao seu e-mail.");
      } else {
        const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: window.location.origin + "/reset-password" });
        if (error) throw error;
        toast.success("Enviamos um link para redefinir sua senha.");
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Algo deu errado");
    } finally {
      setBusy(false);
    }
  };

  const google = async () => {
    const r = await lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.origin + "/auth" });
    if (r.error) toast.error("Não foi possível entrar com Google");
    else if (!r.redirected) nav({ to: "/painel", replace: true });
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/40 px-4">
      <div className="w-full max-w-sm rounded-2xl border bg-card p-8 shadow-sm">
        <Link to="/" className="font-display text-2xl font-bold text-primary">Sinal<span className="text-foreground">.</span></Link>
        <h1 className="mt-6 font-display text-xl font-semibold">
          {mode === "entrar" ? "Entrar no painel" : mode === "criar" ? "Criar conta da clínica" : "Recuperar senha"}
        </h1>
        <form onSubmit={submit} className="mt-6 space-y-3">
          <Input type="email" required placeholder="E-mail" value={email} onChange={(e) => setEmail(e.target.value)} />
          {mode !== "esqueci" && (
            <Input type="password" required minLength={6} placeholder="Senha" value={password} onChange={(e) => setPassword(e.target.value)} />
          )}
          {mode === "criar" && (
            <label className="flex items-start gap-2 text-xs text-muted-foreground">
              <input type="checkbox" required className="mt-0.5" checked={accepted} onChange={(e) => setAccepted(e.target.checked)} />
              <span>Li e aceito os <Link to="/termos" className="underline">Termos de Uso</Link> e a <Link to="/privacidade" className="underline">Política de Privacidade</Link>.</span>
            </label>
          )}
          <Button type="submit" className="w-full" disabled={busy}>
            {mode === "entrar" ? "Entrar" : mode === "criar" ? "Criar conta" : "Enviar link"}
          </Button>
        </form>
        {mode !== "esqueci" && (
          <Button variant="outline" className="mt-3 w-full" onClick={google}>Continuar com Google</Button>
        )}
        <div className="mt-6 space-y-1 text-center text-sm text-muted-foreground">
          {mode === "entrar" ? (
            <>
              <button className="block w-full hover:text-foreground" onClick={() => setMode("criar")}>Não tem conta? Criar conta</button>
              <button className="block w-full hover:text-foreground" onClick={() => setMode("esqueci")}>Esqueci minha senha</button>
            </>
          ) : (
            <button className="hover:text-foreground" onClick={() => setMode("entrar")}>Já tenho conta — entrar</button>
          )}
        </div>
      </div>
    </div>
  );
}
