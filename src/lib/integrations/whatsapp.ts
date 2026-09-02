/**
 * Camada de integração desacoplada para envio de mensagens via WhatsApp.
 * Seção 37 do escopo: preparar arquitetura para lembretes, guias, solicitação de
 * documentos e cobranças — sem depender de uma API paga configurada.
 */

export interface WhatsAppMessage {
  toPhone: string;
  template: string;
  variables: Record<string, string>;
}

export interface WhatsAppSendResult {
  sent: boolean;
  message: string;
}

export interface WhatsAppProvider {
  send(message: WhatsAppMessage): Promise<WhatsAppSendResult>;
}

function renderTemplate(template: string, variables: Record<string, string>) {
  return Object.entries(variables).reduce(
    (text, [key, value]) => text.replaceAll(`{{${key}}}`, value),
    template
  );
}

class NullWhatsAppProvider implements WhatsAppProvider {
  async send(message: WhatsAppMessage): Promise<WhatsAppSendResult> {
    const rendered = renderTemplate(message.template, message.variables);
    console.info(`[whatsapp] Envio simulado para ${message.toPhone}:\n${rendered}`);
    return {
      sent: false,
      message:
        "Integração com WhatsApp (WHATSAPP_API_TOKEN) não configurada. Copie a mensagem abaixo e envie manualmente.",
    };
  }
}

export function getWhatsAppProvider(): WhatsAppProvider {
  // Quando WHATSAPP_API_TOKEN e WHATSAPP_PHONE_NUMBER_ID estiverem configurados,
  // substitua por uma implementação real da API oficial do WhatsApp Business.
  return new NullWhatsAppProvider();
}

export const WHATSAPP_TEMPLATES = {
  documentRequest:
    "Olá, {{nome_cliente}}. Os documentos referentes à competência {{competencia}} ainda estão pendentes. Solicitamos o envio para concluirmos {{servico}} dentro do prazo.",
  collection:
    "Olá, {{nome_cliente}}. Identificamos um débito em aberto no valor de {{valor}} com vencimento em {{vencimento}}. Podemos ajudar com a regularização?",
  contractSent: "Olá, {{nome_cliente}}. Seu contrato de prestação de serviços está disponível para assinatura.",
};
