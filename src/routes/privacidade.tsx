import { createFileRoute } from "@tanstack/react-router";
import { LegalPage } from "@/components/LegalPage";

export const Route = createFileRoute("/privacidade")({
  head: () => ({
    meta: [
      { title: "Política de Privacidade — Sinal" },
      { name: "description", content: "Como o Sinal trata os dados de clínicas, pacientes e clientes, conforme a LGPD." },
      { property: "og:title", content: "Política de Privacidade — Sinal" },
      { property: "og:description", content: "Como o Sinal trata dados pessoais, conforme a LGPD." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: () => (
    <LegalPage title="Política de Privacidade">
      <h2>Quais dados guardamos</h2>
      <p>Dos usuários das clínicas: e-mail e dados de acesso. Dos pacientes cadastrados pela clínica: nome, WhatsApp, serviço, data do último atendimento, intervalo de retorno, autorização para lembretes e pedidos de saída.</p>
      <h2>Para que usamos</h2>
      <p>Somente para mostrar à clínica quem deve ser lembrado e registrar as ações da equipe. Não vendemos nem compartilhamos dados, e não enviamos mensagens em nome da clínica.</p>
      <h2>Quem acessa</h2>
      <p>Apenas os usuários autorizados de cada clínica veem os pacientes dela.</p>
      <h2>Direitos do titular</h2>
      <p>Pacientes podem pedir à clínica a correção ou exclusão dos seus dados a qualquer momento; a clínica pode excluí-los diretamente no painel.</p>
      <h2>Contato</h2>
      <p>Sinal Sistemas — WhatsApp (31) 99690-7206.</p>
    </LegalPage>
  ),
});
