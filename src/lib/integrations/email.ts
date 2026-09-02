/**
 * Camada de integração desacoplada para envio de e-mails (guias, documentos,
 * cobranças, contratos, avisos) — seção 38 do escopo. Sem SMTP configurado,
 * apenas registra a intenção de envio.
 */

export interface EmailMessage {
  to: string;
  subject: string;
  html: string;
}

export interface EmailSendResult {
  sent: boolean;
  message: string;
}

export interface EmailProvider {
  send(message: EmailMessage): Promise<EmailSendResult>;
}

class NullEmailProvider implements EmailProvider {
  async send(message: EmailMessage): Promise<EmailSendResult> {
    console.info(`[email] Envio simulado para ${message.to}: ${message.subject}`);
    return {
      sent: false,
      message: "Integração de e-mail (EMAIL_SMTP_HOST) não configurada nesta instalação.",
    };
  }
}

export function getEmailProvider(): EmailProvider {
  // Quando EMAIL_SMTP_HOST/PORT/USER/PASSWORD estiverem configurados, substitua
  // por uma implementação real (ex.: nodemailer com o transporte SMTP informado).
  return new NullEmailProvider();
}
