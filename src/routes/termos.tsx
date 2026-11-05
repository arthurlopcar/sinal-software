import { createFileRoute } from "@tanstack/react-router";
import { LegalPage } from "@/components/LegalPage";

export const Route = createFileRoute("/termos")({
  head: () => ({
    meta: [
      { title: "Termos de Uso — Sinal" },
      { name: "description", content: "Termos de uso do Sinal, sistema de lembretes de retorno de pacientes e clientes." },
      { property: "og:title", content: "Termos de Uso — Sinal" },
      { property: "og:description", content: "Termos de uso do Sinal." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: () => (
    <LegalPage title="Termos de Uso">
      <h2>1. O serviço</h2>
      <p>O Sinal é um painel que organiza quando cada paciente ou cliente deve retornar e prepara uma mensagem de lembrete. O Sinal não envia mensagens automaticamente: o envio é feito por uma pessoa da equipe do contratante, pelo WhatsApp do próprio contratante.</p>
      <h2>2. Responsabilidades do contratante</h2>
      <p>O contratante só deve cadastrar pessoas que já são seus pacientes ou clientes e que autorizaram receber lembretes, e deve respeitar imediatamente quem pedir para sair. O uso do WhatsApp segue os termos do próprio WhatsApp.</p>
      <h2>3. Dados</h2>
      <p>O contratante é o controlador dos dados cadastrados; a Sinal Sistemas atua como operadora, tratando os dados apenas para prestar o serviço, conforme a LGPD.</p>
      <h2>4. Assinatura</h2>
      <p>O serviço é oferecido por assinatura mensal, com período de teste. O acesso pode ser suspenso em caso de falta de pagamento.</p>
      <h2>5. Contato</h2>
      <p>Sinal Sistemas — sinalsistemas.com.br — WhatsApp (31) 99690-7206.</p>
    </LegalPage>
  ),
});
