export const CLIENT_STATUS_LABELS: Record<string, string> = {
  LEAD: "Lead",
  IMPLANTACAO: "Implantação",
  ATIVO: "Ativo",
  SUSPENSO: "Suspenso",
  INATIVO: "Inativo",
  ENCERRADO: "Encerrado",
};

export const CLIENT_STATUS_COLORS: Record<string, string> = {
  LEAD: "bg-slate-100 text-slate-700 border-slate-200",
  IMPLANTACAO: "bg-blue-50 text-blue-700 border-blue-200",
  ATIVO: "bg-success/15 text-success border-success/20",
  SUSPENSO: "bg-warning/15 text-warning border-warning/20",
  INATIVO: "bg-muted text-muted-foreground border-border",
  ENCERRADO: "bg-destructive/10 text-destructive border-destructive/20",
};

export const TAX_REGIME_LABELS: Record<string, string> = {
  MEI: "MEI",
  SIMPLES_NACIONAL: "Simples Nacional",
  LUCRO_PRESUMIDO: "Lucro Presumido",
  LUCRO_REAL: "Lucro Real",
  IMUNE: "Imune",
  ISENTO: "Isento",
  OUTROS: "Outros",
};

export const TASK_STATUS_LABELS: Record<string, string> = {
  NAO_INICIADA: "Não iniciada",
  AGUARDANDO_DOCUMENTOS: "Aguardando documentos",
  EM_ANDAMENTO: "Em andamento",
  EM_REVISAO: "Em revisão",
  AGUARDANDO_CLIENTE: "Aguardando cliente",
  CONCLUIDA: "Concluída",
  CANCELADA: "Cancelada",
  ATRASADA: "Atrasada",
};

export const TASK_STATUS_COLORS: Record<string, string> = {
  NAO_INICIADA: "bg-slate-100 text-slate-700 border-slate-200",
  AGUARDANDO_DOCUMENTOS: "bg-amber-50 text-amber-700 border-amber-200",
  EM_ANDAMENTO: "bg-blue-50 text-blue-700 border-blue-200",
  EM_REVISAO: "bg-purple-50 text-purple-700 border-purple-200",
  AGUARDANDO_CLIENTE: "bg-orange-50 text-orange-700 border-orange-200",
  CONCLUIDA: "bg-success/15 text-success border-success/20",
  CANCELADA: "bg-muted text-muted-foreground border-border",
  ATRASADA: "bg-destructive/15 text-destructive border-destructive/20",
};

export const KANBAN_STATUSES = [
  "NAO_INICIADA",
  "AGUARDANDO_DOCUMENTOS",
  "EM_ANDAMENTO",
  "EM_REVISAO",
  "AGUARDANDO_CLIENTE",
  "CONCLUIDA",
] as const;

export const TASK_PRIORITY_LABELS: Record<string, string> = {
  BAIXA: "Baixa",
  NORMAL: "Normal",
  ALTA: "Alta",
  URGENTE: "Urgente",
};

export const TASK_PRIORITY_COLORS: Record<string, string> = {
  BAIXA: "bg-slate-100 text-slate-700 border-slate-200",
  NORMAL: "bg-blue-50 text-blue-700 border-blue-200",
  ALTA: "bg-warning/15 text-warning border-warning/20",
  URGENTE: "bg-destructive/15 text-destructive border-destructive/20",
};

export const PERIODICITY_LABELS: Record<string, string> = {
  UNICA: "Única",
  DIARIA: "Diária",
  SEMANAL: "Semanal",
  QUINZENAL: "Quinzenal",
  MENSAL: "Mensal",
  BIMESTRAL: "Bimestral",
  TRIMESTRAL: "Trimestral",
  SEMESTRAL: "Semestral",
  ANUAL: "Anual",
  PERSONALIZADA: "Personalizada",
};

export const CONTRACT_STATUS_LABELS: Record<string, string> = {
  RASCUNHO: "Rascunho",
  GERADO: "Gerado",
  ENVIADO: "Enviado",
  VISUALIZADO: "Visualizado",
  ASSINADO: "Assinado",
  RECUSADO: "Recusado",
  CANCELADO: "Cancelado",
};

export const CONTRACT_STATUS_COLORS: Record<string, string> = {
  RASCUNHO: "bg-slate-100 text-slate-700 border-slate-200",
  GERADO: "bg-blue-50 text-blue-700 border-blue-200",
  ENVIADO: "bg-purple-50 text-purple-700 border-purple-200",
  VISUALIZADO: "bg-amber-50 text-amber-700 border-amber-200",
  ASSINADO: "bg-success/15 text-success border-success/20",
  RECUSADO: "bg-destructive/15 text-destructive border-destructive/20",
  CANCELADO: "bg-muted text-muted-foreground border-border",
};

export const RECEIVABLE_STATUS_LABELS: Record<string, string> = {
  A_VENCER: "A vencer",
  VENCENDO_HOJE: "Vencendo hoje",
  PAGO: "Pago",
  PARCIALMENTE_PAGO: "Parcialmente pago",
  VENCIDO: "Vencido",
  CANCELADO: "Cancelado",
};

export const RECEIVABLE_STATUS_COLORS: Record<string, string> = {
  A_VENCER: "bg-blue-50 text-blue-700 border-blue-200",
  VENCENDO_HOJE: "bg-amber-50 text-amber-700 border-amber-200",
  PAGO: "bg-success/15 text-success border-success/20",
  PARCIALMENTE_PAGO: "bg-orange-50 text-orange-700 border-orange-200",
  VENCIDO: "bg-destructive/15 text-destructive border-destructive/20",
  CANCELADO: "bg-muted text-muted-foreground border-border",
};

export const DELAY_REASON_LABELS: Record<string, string> = {
  CLIENTE_NAO_ENVIOU_DOCUMENTOS: "Cliente não enviou documentos",
  EQUIPE_INTERNA: "Equipe interna",
  SISTEMA_EXTERNO: "Sistema externo",
  PENDENCIA_GOVERNAMENTAL: "Pendência governamental",
  AGUARDANDO_APROVACAO: "Aguardando aprovação",
  OUTRO: "Outro",
};
