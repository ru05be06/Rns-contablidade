interface ContractVariablesInput {
  legalName: string;
  cnpj: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  responsibleName: string | null;
  responsibleCpf: string | null;
  monthlyValue: number | null;
  startDate: Date | null;
  dueDay: number | null;
  servicesDescription: string;
}

/** Preenche as variáveis {{...}} de um modelo de contrato — seção 23/24 do escopo. */
export function fillContractTemplate(template: string, data: ContractVariablesInput) {
  const value = data.monthlyValue?.toLocaleString("pt-BR", { minimumFractionDigits: 2 }) ?? "0,00";
  const startDate = data.startDate ? data.startDate.toLocaleDateString("pt-BR") : "-";

  return template
    .replaceAll("{{razao_social}}", data.legalName)
    .replaceAll("{{cnpj}}", data.cnpj ?? "")
    .replaceAll("{{endereco}}", data.address ?? "")
    .replaceAll("{{cidade}}", [data.city, data.state].filter(Boolean).join("/"))
    .replaceAll("{{nome_responsavel}}", data.responsibleName ?? "")
    .replaceAll("{{cpf_responsavel}}", data.responsibleCpf ?? "")
    .replaceAll("{{valor_mensalidade}}", value)
    .replaceAll("{{data_inicio}}", startDate)
    .replaceAll("{{dia_vencimento}}", String(data.dueDay ?? ""))
    .replaceAll("{{servicos_contratados}}", data.servicesDescription);
}

export const CONTRACT_VARIABLES = [
  "{{razao_social}}",
  "{{cnpj}}",
  "{{endereco}}",
  "{{cidade}}",
  "{{nome_responsavel}}",
  "{{cpf_responsavel}}",
  "{{valor_mensalidade}}",
  "{{data_inicio}}",
  "{{dia_vencimento}}",
  "{{servicos_contratados}}",
];
