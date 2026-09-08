/**
 * Camada de integração desacoplada para assinatura digital de contratos.
 * Seção 25 do escopo: preparar estrutura para ZapSign, Clicksign, D4Sign e DocuSign
 * sem acoplar o restante do sistema a um provedor específico.
 *
 * Para ativar um provedor real, defina SIGNATURE_PROVIDER e SIGNATURE_API_KEY no
 * .env e implemente a interface abaixo (ex.: `ZapSignProvider`), registrando-a em
 * `getSignatureProvider()`.
 */

export interface SignatureRequest {
  contractId: string;
  documentContent: string;
  signerName: string;
  signerEmail: string | null;
}

export interface SignatureResult {
  externalId: string | null;
  status: "ENVIADO" | "ERRO";
  message: string;
}

export interface SignatureProvider {
  readonly name: string;
  sendForSignature(request: SignatureRequest): Promise<SignatureResult>;
}

/**
 * Implementação padrão quando nenhum provedor está configurado — não faz chamadas
 * externas, apenas registra a intenção. Mantém o fluxo do sistema funcional mesmo
 * sem credenciais de um provedor pago configuradas.
 */
class NullSignatureProvider implements SignatureProvider {
  readonly name = "manual";

  async sendForSignature(request: SignatureRequest): Promise<SignatureResult> {
    console.info(
      `[signature] Nenhum provedor configurado. Contrato ${request.contractId} marcado como enviado manualmente.`
    );
    return {
      externalId: null,
      status: "ENVIADO",
      message:
        "Nenhum provedor de assinatura digital configurado (SIGNATURE_PROVIDER). O contrato foi marcado como enviado manualmente.",
    };
  }
}

export function getSignatureProvider(): SignatureProvider {
  const provider = process.env.SIGNATURE_PROVIDER;
  // Quando SIGNATURE_PROVIDER e SIGNATURE_API_KEY estiverem configurados, adicione
  // aqui a implementação real (ZapSignProvider, ClicksignProvider, D4SignProvider...).
  switch (provider) {
    default:
      return new NullSignatureProvider();
  }
}
