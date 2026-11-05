import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { whatsappLink } from "@/lib/contact";
import {
  CalendarClock, BellRing, Send, BarChart3, Stethoscope, Sparkles, Eye, Baby,
  HeartPulse, Activity, CheckCheck, ArrowRight, ShieldCheck, MessageCircle,
} from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Sinal — Retornos de pacientes, com sua equipe no controle" },
      { name: "description", content: "O Sinal avisa quem precisa voltar e deixa a mensagem pronta. Sua equipe envia pelo WhatsApp da clínica — sem disparo automático, sem cadastro na Meta." },
      { property: "og:title", content: "Sinal — Retornos de pacientes, com sua equipe no controle" },
      { property: "og:description", content: "Reengajamento de pacientes com a equipe no controle: o painel avisa, a mensagem fica pronta e o envio é feito pelo WhatsApp da clínica." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Index,
});

const segments = [
  { icon: HeartPulse, name: "Cardiologia", every: "a cada 3 meses" },
  { icon: Stethoscope, name: "Odontologia", every: "a cada 6 meses" },
  { icon: Activity, name: "Fisioterapia", every: "a cada 15 dias" },
  { icon: Sparkles, name: "Estética", every: "a cada 30 dias" },
  { icon: Eye, name: "Oftalmologia", every: "a cada 12 meses" },
  { icon: Baby, name: "Pediatria e ginecologia", every: "a cada 6 ou 12 meses" },
];

const steps = [
  { icon: CalendarClock, title: "Cadastre o paciente e o intervalo", text: "Nome, WhatsApp, último atendimento e de quanto em quanto tempo ele deve voltar." },
  { icon: BellRing, title: "O painel avisa quem está na hora", text: "Todo dia, a lista de quem deve voltar hoje, nesta semana e nos próximos dias." },
  { icon: Send, title: "Sua equipe envia a mensagem pronta", text: "Um clique abre o WhatsApp da clínica com o texto já escrito e o número do paciente." },
  { icon: BarChart3, title: "Marque quem voltou", text: "Cada envio e cada retorno ficam registrados — e você vê o resultado do mês." },
];

const guarantees = [
  { icon: ShieldCheck, title: "Dados sob o controle da clínica", text: "Você cadastra e acompanha. Os dados dos pacientes ficam com você, em conformidade com a LGPD." },
  { icon: Send, title: "Zero disparo automático", text: "Nenhuma mensagem sai sem uma pessoa da sua equipe revisar e enviar pelo WhatsApp oficial da clínica." },
  { icon: CheckCheck, title: "Zero burocracia", text: "Sem API, sem cadastro na Meta, sem instalar nada no WhatsApp da clínica. O painel abre no navegador." },
];

function CTA({ size = "lg" }: { size?: "lg" | "default" }) {
  return (
    <Button asChild size={size}>
      <a href={whatsappLink()} target="_blank" rel="noreferrer">
        <MessageCircle /> Quero preencher minhas cadeiras vazias
      </a>
    </Button>
  );
}

function Index() {
  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-20 border-b bg-background/85 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
          <span className="font-display text-xl font-bold text-primary">Sinal<span className="text-foreground">.</span></span>
          <nav className="flex items-center gap-2">
            <Button asChild variant="ghost"><Link to="/demo">Ver demonstração</Link></Button>
            <Button asChild variant="outline"><Link to="/auth">Entrar</Link></Button>
            <Button asChild variant="default" size="sm" className="hidden sm:inline-flex">
              <a href={whatsappLink()} target="_blank" rel="noreferrer">Falar no WhatsApp</a>
            </Button>
          </nav>
        </div>
      </header>

      <section className="bg-hero">
        <div className="mx-auto grid max-w-6xl items-center gap-12 px-6 py-20 md:grid-cols-2 md:py-28">
          <div>
            <p className="mb-4 inline-block rounded-full bg-accent px-3 py-1 text-sm font-medium text-accent-foreground">
              Retorno de pacientes — com a sua equipe no controle
            </p>
            <h1 className="font-display text-4xl font-bold leading-tight md:text-6xl">
              Seu paciente esquece de voltar. <span className="text-primary">O Sinal avisa.</span>
            </h1>
            <p className="mt-6 max-w-lg text-lg text-muted-foreground">
              O painel mostra quem está na hora do retorno — do check-up de 3 meses à limpeza semestral —
              e deixa a mensagem pronta. Sua equipe envia pelo WhatsApp da clínica, com um clique.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <CTA />
              <Button asChild size="lg" variant="outline">
                <Link to="/demo">Ver o painel <ArrowRight /></Link>
              </Button>
            </div>
          </div>
          <PhoneMock />
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-20">
        <h2 className="font-display text-3xl font-bold md:text-4xl">Um intervalo para cada especialidade</h2>
        <p className="mt-3 max-w-2xl text-muted-foreground">Você define o tempo de retorno. O Sinal lembra a equipe na hora certa.</p>
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {segments.map((s) => (
            <div key={s.name} className="flex items-center gap-4 rounded-xl border bg-card p-5">
              <div className="grid h-12 w-12 place-items-center rounded-lg bg-secondary text-primary"><s.icon /></div>
              <div>
                <p className="font-semibold">{s.name}</p>
                <p className="text-sm text-muted-foreground">{s.every}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-navy text-navy-foreground">
        <div className="mx-auto max-w-6xl px-6 py-20">
          <h2 className="font-display text-3xl font-bold md:text-4xl">Como funciona</h2>
          <div className="mt-10 grid gap-8 md:grid-cols-4">
            {steps.map((s, i) => (
              <div key={s.title}>
                <div className="mb-4 flex items-center gap-3">
                  <span className="font-display text-sm text-navy-foreground/60">0{i + 1}</span>
                  <s.icon className="text-sidebar-primary" />
                </div>
                <p className="font-semibold">{s.title}</p>
                <p className="mt-2 text-sm text-navy-foreground/70">{s.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-20">
        <h2 className="font-display text-3xl font-bold md:text-4xl">Sem risco, sem complicação</h2>
        <p className="mt-3 max-w-2xl text-muted-foreground">Nenhuma mensagem sai sem a sua equipe. Nenhum dado sai do seu controle.</p>
        <div className="mt-10 grid gap-6 md:grid-cols-3">
          {guarantees.map((g) => (
            <div key={g.title} className="rounded-xl border bg-card p-8">
              <g.icon className="size-6 text-primary" />
              <p className="mt-4 font-semibold">{g.title}</p>
              <p className="mt-2 text-sm text-muted-foreground">{g.text}</p>
            </div>
          ))}
        </div>
        <div className="mt-6 grid gap-6 md:grid-cols-3">
          {[
            ["Até 30%", "dos pacientes inativos voltam com um lembrete pessoal"],
            ["0 mensagens no escuro", "cada envio é feito por alguém da equipe, pelo WhatsApp oficial da clínica"],
            ["0 cadastro na Meta", "nada para autorizar ou instalar — o painel roda no navegador"],
          ].map(([n, t]) => (
            <div key={n} className="rounded-xl border bg-card p-8">
              <p className="font-display text-4xl font-bold text-primary">{n}</p>
              <p className="mt-2 text-muted-foreground">{t}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 pb-24">
        <div className="rounded-2xl bg-primary px-8 py-14 text-center text-primary-foreground shadow-elegant">
          <h2 className="font-display text-3xl font-bold md:text-4xl">Agenda com horário vago é dinheiro parado.</h2>
          <p className="mx-auto mt-3 max-w-xl text-primary-foreground/80">Converse com a gente e veja o Sinal funcionando na sua clínica.</p>
          <div className="mt-8">
            <Button asChild size="lg" variant="secondary">
              <a href={whatsappLink()} target="_blank" rel="noreferrer"><MessageCircle /> Quero preencher minhas cadeiras vazias</a>
            </Button>
          </div>
        </div>
      </section>

      <footer className="border-t">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-2 px-6 py-8 text-sm text-muted-foreground">
          <span>Sinal é um produto <a className="font-medium text-foreground hover:text-primary" href="https://sinalsistemas.com.br" target="_blank" rel="noreferrer">Sinal Sistemas</a></span>
          <span className="flex gap-4"><Link to="/termos" className="hover:text-foreground">Termos</Link><Link to="/privacidade" className="hover:text-foreground">Privacidade</Link><span>© {new Date().getFullYear()}</span></span>
        </div>
      </footer>
    </div>
  );
}

function PhoneMock() {
  return (
    <div className="mx-auto w-full max-w-sm rounded-[2.5rem] border-8 border-navy bg-card shadow-elegant">
      <div className="flex items-center gap-3 rounded-t-[1.8rem] bg-navy px-5 py-4 text-navy-foreground">
        <div className="grid h-9 w-9 place-items-center rounded-full bg-primary font-bold text-primary-foreground">C</div>
        <div>
          <p className="text-sm font-semibold">Clínica CardioVida</p>
          <p className="text-xs text-navy-foreground/60">online</p>
        </div>
      </div>
      <div className="space-y-3 bg-muted p-4 text-sm">
        <div className="max-w-[85%] rounded-xl rounded-tl-none bg-card p-3">
          Olá, Marta! 💙 Já faz 3 meses da sua última consulta com o Dr. Paulo. Vamos agendar seu retorno?
          <p className="mt-1 text-right text-[10px] text-muted-foreground">09:00</p>
        </div>
        <div className="ml-auto max-w-[80%] rounded-xl rounded-tr-none bg-bubble p-3">
          Oi! Verdade, tinha esquecido. Tem quinta à tarde?
          <p className="mt-1 text-right text-[10px] text-muted-foreground">09:12 ✓✓</p>
        </div>
        <div className="max-w-[85%] rounded-xl rounded-tl-none bg-card p-3">
          Temos às 15h ou 16h30. Qual prefere?
          <p className="mt-1 text-right text-[10px] text-muted-foreground">09:13</p>
        </div>
        <div className="ml-auto max-w-[60%] rounded-xl rounded-tr-none bg-bubble p-3">
          15h, por favor 🙏
          <p className="mt-1 text-right text-[10px] text-muted-foreground">09:14 ✓✓</p>
        </div>
      </div>
    </div>
  );
}
