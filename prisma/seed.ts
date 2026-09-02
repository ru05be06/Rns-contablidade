import { PrismaClient, Periodicity, TaskStatus, TaskPriority, ClientStatus, TaxRegime, ContractStatus, ReceivableStatus } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

function randomItem<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}
function randomInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}
function addDays(date: Date, days: number) {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}
function pad(n: number) {
  return String(n).padStart(4, "0");
}

async function main() {
  console.log("Seed: iniciando...");

  const passwordHash = await bcrypt.hash("demo1234", 10);

  // ---------------------------------------------------------------------
  // Organização
  // ---------------------------------------------------------------------
  const org = await prisma.organization.upsert({
    where: { slug: "rns-contabilidade" },
    update: {},
    create: {
      name: "RNS Contabilidade",
      slug: "rns-contabilidade",
      primaryColor: "#0f172a",
      timezone: "America/Sao_Paulo",
      locale: "pt-BR",
      currency: "BRL",
    },
  });

  // ---------------------------------------------------------------------
  // Perfis (RBAC)
  // ---------------------------------------------------------------------
  const ALL_PERMISSIONS = [
    "dashboard.view",
    "clients.view", "clients.manage", "clients.delete",
    "services.view", "services.manage",
    "tasks.view", "tasks.manage", "tasks.execute",
    "contracts.view", "contracts.manage",
    "financeiro.view", "financeiro.manage",
    "documents.view", "documents.manage",
    "team.view", "team.manage",
    "reports.view",
    "settings.manage",
  ];

  const rolesData = [
    { key: "ADMIN", name: "Administrador", permissions: ALL_PERMISSIONS, isSystem: true },
    {
      key: "GESTOR", name: "Gestor", isSystem: true, permissions: [
        "dashboard.view", "clients.view", "clients.manage", "services.view",
        "tasks.view", "tasks.manage", "tasks.execute", "contracts.view",
        "financeiro.view", "documents.view", "team.view", "reports.view",
      ],
    },
    {
      key: "COLABORADOR", name: "Colaborador", isSystem: true, permissions: [
        "dashboard.view", "clients.view", "services.view", "tasks.view",
        "tasks.execute", "documents.view", "documents.manage",
      ],
    },
    {
      key: "FINANCEIRO", name: "Financeiro", isSystem: true, permissions: [
        "dashboard.view", "clients.view", "contracts.view", "financeiro.view",
        "financeiro.manage", "reports.view",
      ],
    },
  ];

  const roles: Record<string, { id: string }> = {};
  for (const r of rolesData) {
    roles[r.key] = await prisma.role.upsert({
      where: { organizationId_key: { organizationId: org.id, key: r.key } },
      update: { permissions: r.permissions },
      create: {
        organizationId: org.id,
        key: r.key,
        name: r.name,
        permissions: r.permissions,
        isSystem: r.isSystem,
      },
    });
  }

  // ---------------------------------------------------------------------
  // Departamentos
  // ---------------------------------------------------------------------
  const departmentNames = [
    { name: "Fiscal", color: "#2563eb" },
    { name: "Contábil", color: "#7c3aed" },
    { name: "Departamento Pessoal", color: "#059669" },
    { name: "Legalização", color: "#d97706" },
    { name: "Financeiro", color: "#dc2626" },
    { name: "Administrativo", color: "#0891b2" },
    { name: "Consultoria", color: "#4338ca" },
    { name: "Imposto de Renda", color: "#be185d" },
    { name: "BPO Financeiro", color: "#65a30d" },
  ];

  const departments: Record<string, { id: string }> = {};
  for (const d of departmentNames) {
    departments[d.name] = await prisma.department.upsert({
      where: { organizationId_name: { organizationId: org.id, name: d.name } },
      update: {},
      create: { organizationId: org.id, name: d.name, color: d.color },
    });
  }

  // ---------------------------------------------------------------------
  // Usuários
  // ---------------------------------------------------------------------
  const admin = await prisma.user.upsert({
    where: { organizationId_email: { organizationId: org.id, email: "admin@rnscontabil.com.br" } },
    update: {},
    create: {
      organizationId: org.id,
      name: "Administrador RNS",
      email: "admin@rnscontabil.com.br",
      passwordHash,
      roleId: roles.ADMIN.id,
    },
  });

  const employeesData = [
    { name: "João Pereira", email: "joao@rnscontabil.com.br", role: "COLABORADOR", dept: "Fiscal" },
    { name: "Maria Souza", email: "maria@rnscontabil.com.br", role: "COLABORADOR", dept: "Contábil" },
    { name: "Carlos Lima", email: "carlos@rnscontabil.com.br", role: "COLABORADOR", dept: "Departamento Pessoal" },
    { name: "Ana Ferreira", email: "ana@rnscontabil.com.br", role: "GESTOR", dept: "Fiscal" },
    { name: "Paulo Rocha", email: "paulo@rnscontabil.com.br", role: "COLABORADOR", dept: "Legalização" },
    { name: "Beatriz Alves", email: "beatriz@rnscontabil.com.br", role: "FINANCEIRO", dept: "Financeiro" },
    { name: "Rafael Costa", email: "rafael@rnscontabil.com.br", role: "COLABORADOR", dept: "Contábil" },
    { name: "Fernanda Dias", email: "fernanda@rnscontabil.com.br", role: "GESTOR", dept: "Departamento Pessoal" },
  ];

  const users: { id: string; name: string }[] = [{ id: admin.id, name: admin.name }];
  for (const e of employeesData) {
    const user = await prisma.user.upsert({
      where: { organizationId_email: { organizationId: org.id, email: e.email } },
      update: {},
      create: {
        organizationId: org.id,
        name: e.name,
        email: e.email,
        passwordHash,
        roleId: roles[e.role].id,
      },
    });
    await prisma.userDepartment.upsert({
      where: { userId_departmentId: { userId: user.id, departmentId: departments[e.dept].id } },
      update: {},
      create: { userId: user.id, departmentId: departments[e.dept].id },
    });
    users.push({ id: user.id, name: user.name });
  }

  // ---------------------------------------------------------------------
  // Modelos de checklist
  // ---------------------------------------------------------------------
  const pgdasChecklist = await prisma.checklistTemplate.create({
    data: {
      organizationId: org.id,
      name: "PGDAS-D",
      description: "Checklist padrão de apuração do Simples Nacional",
      items: {
        create: [
          "Receber documentos do cliente",
          "Conferir notas fiscais emitidas",
          "Conferir notas fiscais recebidas",
          "Conferir cancelamentos",
          "Conferir devoluções",
          "Conferir receitas",
          "Segregar receitas corretamente",
          "Apurar PGDAS-D",
          "Conferir cálculo",
          "Transmitir declaração",
          "Salvar recibo",
          "Salvar DAS",
          "Enviar DAS ao cliente",
        ].map((description, i) => ({ order: i + 1, description, required: true })),
      },
    },
  });

  const admissaoChecklist = await prisma.checklistTemplate.create({
    data: {
      organizationId: org.id,
      name: "Admissão",
      description: "Checklist padrão de admissão de funcionário",
      items: {
        create: [
          "Receber documentos",
          "Conferir documentos",
          "Cadastrar funcionário",
          "Cadastrar no eSocial",
          "Gerar contrato",
          "Gerar ficha",
          "Arquivar documentação",
        ].map((description, i) => ({ order: i + 1, description, required: true })),
      },
    },
  });

  const demissaoChecklist = await prisma.checklistTemplate.create({
    data: {
      organizationId: org.id,
      name: "Demissão",
      description: "Checklist padrão de demissão de funcionário",
      items: {
        create: [
          "Solicitação recebida",
          "Cálculo",
          "Aviso prévio",
          "Evento eSocial",
          "Rescisão",
          "FGTS",
          "Documentos",
          "Envio ao cliente",
        ].map((description, i) => ({ order: i + 1, description, required: true })),
      },
    },
  });

  const fechamentoChecklist = await prisma.checklistTemplate.create({
    data: {
      organizationId: org.id,
      name: "Fechamento contábil",
      description: "Checklist padrão de fechamento contábil mensal",
      items: {
        create: [
          "Importar extratos",
          "Conciliação bancária",
          "Conferência de clientes",
          "Conferência de fornecedores",
          "Conferência de tributos",
          "Conferência de folha",
          "Depreciação",
          "Balancete",
          "DRE",
          "Encerramento",
        ].map((description, i) => ({ order: i + 1, description, required: true })),
      },
    },
  });

  const checklistPadrao = await prisma.checklistTemplate.create({
    data: {
      organizationId: org.id,
      name: "Checklist Padrão de Serviço",
      description: "Modelo genérico utilizado por serviços sem checklist específico",
      items: {
        create: [
          "Receber documentos do cliente",
          "Analisar solicitação",
          "Executar serviço",
          "Revisar entrega",
          "Enviar retorno ao cliente",
        ].map((description, i) => ({ order: i + 1, description, required: true })),
      },
    },
  });

  // ---------------------------------------------------------------------
  // Catálogo de serviços
  // ---------------------------------------------------------------------
  const serviceDefs: {
    name: string; category: string; dept: string; periodicity: Periodicity;
    checklist?: { id: string }; value: number; slaDays?: number;
  }[] = [
    { name: "Contabilidade Mensal", category: "Contábil", dept: "Contábil", periodicity: Periodicity.MENSAL, checklist: fechamentoChecklist, value: 450, slaDays: 10 },
    { name: "PGDAS-D", category: "Fiscal", dept: "Fiscal", periodicity: Periodicity.MENSAL, checklist: pgdasChecklist, value: 150, slaDays: 5 },
    { name: "DEFIS", category: "Fiscal", dept: "Fiscal", periodicity: Periodicity.ANUAL, checklist: checklistPadrao, value: 300, slaDays: 15 },
    { name: "DCTFWeb", category: "Fiscal", dept: "Fiscal", periodicity: Periodicity.MENSAL, checklist: checklistPadrao, value: 120, slaDays: 5 },
    { name: "MIT", category: "Fiscal", dept: "Fiscal", periodicity: Periodicity.MENSAL, checklist: checklistPadrao, value: 120, slaDays: 5 },
    { name: "EFD-Reinf", category: "Fiscal", dept: "Fiscal", periodicity: Periodicity.MENSAL, checklist: checklistPadrao, value: 130, slaDays: 5 },
    { name: "EFD Contribuições", category: "Fiscal", dept: "Fiscal", periodicity: Periodicity.MENSAL, checklist: checklistPadrao, value: 180, slaDays: 5 },
    { name: "EFD ICMS/IPI", category: "Fiscal", dept: "Fiscal", periodicity: Periodicity.MENSAL, checklist: checklistPadrao, value: 200, slaDays: 5 },
    { name: "ECD", category: "Contábil", dept: "Contábil", periodicity: Periodicity.ANUAL, checklist: checklistPadrao, value: 600, slaDays: 20 },
    { name: "ECF", category: "Contábil", dept: "Contábil", periodicity: Periodicity.ANUAL, checklist: checklistPadrao, value: 600, slaDays: 20 },
    { name: "Folha de Pagamento", category: "Departamento Pessoal", dept: "Departamento Pessoal", periodicity: Periodicity.MENSAL, checklist: checklistPadrao, value: 350, slaDays: 5 },
    { name: "Admissão", category: "Departamento Pessoal", dept: "Departamento Pessoal", periodicity: Periodicity.UNICA, checklist: admissaoChecklist, value: 180, slaDays: 2 },
    { name: "Demissão", category: "Departamento Pessoal", dept: "Departamento Pessoal", periodicity: Periodicity.UNICA, checklist: demissaoChecklist, value: 220, slaDays: 3 },
    { name: "Férias", category: "Departamento Pessoal", dept: "Departamento Pessoal", periodicity: Periodicity.UNICA, checklist: checklistPadrao, value: 100, slaDays: 3 },
    { name: "Alteração Contratual", category: "Legalização", dept: "Legalização", periodicity: Periodicity.UNICA, checklist: checklistPadrao, value: 500, slaDays: 10 },
    { name: "Abertura de Empresa", category: "Legalização", dept: "Legalização", periodicity: Periodicity.UNICA, checklist: checklistPadrao, value: 800, slaDays: 15 },
    { name: "Baixa de Empresa", category: "Legalização", dept: "Legalização", periodicity: Periodicity.UNICA, checklist: checklistPadrao, value: 700, slaDays: 20 },
    { name: "Parcelamento", category: "Fiscal", dept: "Fiscal", periodicity: Periodicity.UNICA, checklist: checklistPadrao, value: 350, slaDays: 7 },
    { name: "Certidão Negativa", category: "Legalização", dept: "Legalização", periodicity: Periodicity.UNICA, checklist: checklistPadrao, value: 80, slaDays: 1 },
    { name: "Imposto de Renda Pessoa Física", category: "Imposto de Renda", dept: "Imposto de Renda", periodicity: Periodicity.ANUAL, checklist: checklistPadrao, value: 250, slaDays: 10 },
    { name: "Consultoria", category: "Consultoria", dept: "Consultoria", periodicity: Periodicity.UNICA, checklist: checklistPadrao, value: 500, slaDays: 5 },
    { name: "BPO Financeiro", category: "BPO Financeiro", dept: "BPO Financeiro", periodicity: Periodicity.MENSAL, checklist: checklistPadrao, value: 900, slaDays: 5 },
  ];

  const services: Record<string, { id: string; periodicity: Periodicity; value: number; checklistTemplateId: string | null; dept: string }> = {};
  let serviceSeq = 1;
  for (const s of serviceDefs) {
    const created = await prisma.serviceCatalogItem.upsert({
      where: { organizationId_code: { organizationId: org.id, code: `SRV${pad(serviceSeq)}` } },
      update: {},
      create: {
        organizationId: org.id,
        code: `SRV${pad(serviceSeq)}`,
        name: s.name,
        category: s.category,
        departmentId: departments[s.dept].id,
        periodicity: s.periodicity,
        defaultValue: s.value,
        slaDays: s.slaDays,
        internalDeadlineDay: 15,
        defaultDeadlineDay: 20,
        checklistTemplateId: s.checklist?.id,
        requiredDocuments: ["Notas fiscais", "Extratos bancários"],
      },
    });
    services[s.name] = {
      id: created.id,
      periodicity: created.periodicity,
      value: s.value,
      checklistTemplateId: created.checklistTemplateId,
      dept: s.dept,
    };
    serviceSeq++;
  }

  // ---------------------------------------------------------------------
  // Clientes
  // ---------------------------------------------------------------------
  const clientDefs = [
    { legalName: "ABC Comércio de Alimentos Ltda", trade: "ABC Alimentos", regime: TaxRegime.SIMPLES_NACIONAL, status: ClientStatus.ATIVO, city: "São Paulo", state: "SP" },
    { legalName: "Bella Moda Confecções Ltda", trade: "Bella Moda", regime: TaxRegime.SIMPLES_NACIONAL, status: ClientStatus.ATIVO, city: "Guarulhos", state: "SP" },
    { legalName: "Construtora Horizonte Ltda", trade: "Horizonte Engenharia", regime: TaxRegime.LUCRO_PRESUMIDO, status: ClientStatus.ATIVO, city: "Campinas", state: "SP" },
    { legalName: "Doce Sabor Confeitaria Eireli", trade: "Doce Sabor", regime: TaxRegime.MEI, status: ClientStatus.IMPLANTACAO, city: "São Paulo", state: "SP" },
    { legalName: "Eletro Total Comércio de Eletrônicos Ltda", trade: "Eletro Total", regime: TaxRegime.SIMPLES_NACIONAL, status: ClientStatus.ATIVO, city: "Osasco", state: "SP" },
    { legalName: "Farma Vida Distribuidora Ltda", trade: "Farma Vida", regime: TaxRegime.LUCRO_REAL, status: ClientStatus.ATIVO, city: "São Paulo", state: "SP" },
    { legalName: "Grupo Nova Era Transportes Ltda", trade: "Nova Era Transportes", regime: TaxRegime.LUCRO_PRESUMIDO, status: ClientStatus.SUSPENSO, city: "Santo André", state: "SP" },
    { legalName: "Horizonte Consultoria Empresarial Ltda", trade: "Horizonte Consultoria", regime: TaxRegime.SIMPLES_NACIONAL, status: ClientStatus.ATIVO, city: "São Paulo", state: "SP" },
    { legalName: "Ideal Papelaria e Escritório Ltda", trade: "Ideal Papelaria", regime: TaxRegime.SIMPLES_NACIONAL, status: ClientStatus.LEAD, city: "Barueri", state: "SP" },
    { legalName: "JR Tecnologia da Informação Ltda", trade: "JR Tech", regime: TaxRegime.LUCRO_PRESUMIDO, status: ClientStatus.ATIVO, city: "São Paulo", state: "SP" },
  ];

  const clients: { id: string; legalName: string; status: ClientStatus }[] = [];
  let clientSeq = 1;
  for (const c of clientDefs) {
    const responsible = randomItem(users);
    const client = await prisma.client.upsert({
      where: { organizationId_code: { organizationId: org.id, code: `CLI${pad(clientSeq)}` } },
      update: {},
      create: {
        organizationId: org.id,
        code: `CLI${pad(clientSeq)}`,
        legalName: c.legalName,
        tradeName: c.trade,
        cnpj: `${randomInt(10, 99)}.${randomInt(100, 999)}.${randomInt(100, 999)}/0001-${randomInt(10, 99)}`,
        stateRegistration: String(randomInt(100000000, 999999999)),
        mainCnae: "4711-3/02",
        taxRegime: c.regime,
        foundationDate: new Date(randomInt(2005, 2022), randomInt(0, 11), randomInt(1, 28)),
        onboardingDate: new Date(randomInt(2020, 2025), randomInt(0, 11), randomInt(1, 28)),
        responsibleUserId: responsible.id,
        phone: `(11) 3${randomInt(100, 999)}-${randomInt(1000, 9999)}`,
        whatsapp: `(11) 9${randomInt(1000, 9999)}-${randomInt(1000, 9999)}`,
        email: `contato@${c.trade.toLowerCase().replace(/\s+/g, "")}.com.br`,
        zipCode: "01000-000",
        address: "Rua das Indústrias",
        addressNumber: String(randomInt(100, 999)),
        neighborhood: "Centro",
        city: c.city,
        state: c.state,
        status: c.status,
        monthlyFee: randomInt(600, 2500),
        feeDueDay: randomInt(5, 20),
        partners: {
          create: [
            {
              name: randomItem(["Roberto Nunes", "Sandra Martins", "Eduardo Vieira", "Camila Ribeiro", "Marcos Teixeira"]),
              cpf: `${randomInt(100, 999)}.${randomInt(100, 999)}.${randomInt(100, 999)}-${randomInt(10, 99)}`,
              equityShare: 100,
              role: "Sócio administrador",
              entryDate: new Date(randomInt(2005, 2022), 0, 1),
            },
          ],
        },
      },
    });
    clients.push({ id: client.id, legalName: client.legalName, status: client.status });
    clientSeq++;
  }

  // ---------------------------------------------------------------------
  // Serviços por cliente + tarefas
  // ---------------------------------------------------------------------
  const serviceNames = Object.keys(services);
  const now = new Date();
  const competenceLabel = (d: Date) => `${String(d.getMonth() + 1).padStart(2, "0")}/${d.getFullYear()}`;

  let taskSeq = 1;
  let receivableCount = 0;
  const receivablesToCreate: { clientId: string; description: string; competence: string; dueDate: Date; amount: number; status: ReceivableStatus; recurring: boolean }[] = [];

  for (const client of clients) {
    if (client.status === ClientStatus.LEAD) continue; // lead ainda não possui serviços contratados

    const chosenServices = new Set<string>();
    const serviceCount = randomInt(2, 4);
    while (chosenServices.size < serviceCount) {
      chosenServices.add(randomItem(serviceNames));
    }

    for (const serviceName of chosenServices) {
      const svc = services[serviceName];
      const clientService = await prisma.clientService.create({
        data: {
          organizationId: org.id,
          clientId: client.id,
          serviceCatalogItemId: svc.id,
          departmentId: departments[svc.dept].id,
          responsibleId: randomItem(users).id,
          periodicity: svc.periodicity,
          value: svc.value,
          dueDay: randomInt(15, 25),
          internalDeadlineDay: randomInt(5, 14),
          billingType: "Mensalidade",
        },
      });

      // Gera tarefas para os últimos 2 meses e os próximos 2 meses (recorrência simplificada)
      const monthsOffsets = svc.periodicity === Periodicity.MENSAL ? [-2, -1, 0, 1] : [0];

      for (const offset of monthsOffsets) {
        const competenceDate = new Date(now.getFullYear(), now.getMonth() + offset, 1);
        const internalDue = new Date(competenceDate.getFullYear(), competenceDate.getMonth(), randomInt(10, 18));
        const officialDue = addDays(internalDue, randomInt(3, 7));

        let status: TaskStatus;
        if (offset < 0) {
          status = randomItem([TaskStatus.CONCLUIDA, TaskStatus.CONCLUIDA, TaskStatus.CONCLUIDA, TaskStatus.ATRASADA]);
        } else if (offset === 0) {
          status = randomItem([
            TaskStatus.EM_ANDAMENTO,
            TaskStatus.AGUARDANDO_DOCUMENTOS,
            TaskStatus.EM_REVISAO,
            TaskStatus.AGUARDANDO_CLIENTE,
            TaskStatus.NAO_INICIADA,
            officialDue < now ? TaskStatus.ATRASADA : TaskStatus.EM_ANDAMENTO,
          ]);
        } else {
          status = TaskStatus.NAO_INICIADA;
        }

        const assignee = randomItem(users);
        const task = await prisma.task.create({
          data: {
            organizationId: org.id,
            code: `TAR${pad(taskSeq)}`,
            title: `${serviceName} — ${client.legalName}`,
            clientId: client.id,
            clientServiceId: clientService.id,
            departmentId: departments[svc.dept].id,
            assigneeId: assignee.id,
            creatorId: admin.id,
            priority: randomItem([TaskPriority.NORMAL, TaskPriority.NORMAL, TaskPriority.ALTA, TaskPriority.BAIXA, TaskPriority.URGENTE]),
            status,
            competence: competenceLabel(competenceDate),
            internalDueDate: internalDue,
            officialDueDate: officialDue,
            completedAt: status === TaskStatus.CONCLUIDA ? addDays(officialDue, -randomInt(0, 3)) : null,
            productionStage: status === TaskStatus.CONCLUIDA ? "Concluído" : randomItem(["Documentos recebidos", "Escrituração", "Conferência", "Apuração", "Revisão"]),
          },
        });
        taskSeq++;

        if (svc.checklistTemplateId) {
          const templateItems = await prisma.checklistTemplateItem.findMany({
            where: { checklistTemplateId: svc.checklistTemplateId },
            orderBy: { order: "asc" },
          });
          const doneRatio = status === TaskStatus.CONCLUIDA ? 1 : status === TaskStatus.NAO_INICIADA ? 0 : Math.random();
          await prisma.taskChecklistItem.createMany({
            data: templateItems.map((item, idx) => ({
              taskId: task.id,
              order: item.order,
              description: item.description,
              required: item.required,
              completed: idx / templateItems.length < doneRatio,
              completedAt: idx / templateItems.length < doneRatio ? new Date() : null,
            })),
          });
        }

        if (status === TaskStatus.ATRASADA) {
          await prisma.taskDelayLog.create({
            data: {
              taskId: task.id,
              reason: randomItem([
                "CLIENTE_NAO_ENVIOU_DOCUMENTOS",
                "EQUIPE_INTERNA",
                "PENDENCIA_GOVERNAMENTAL",
                "AGUARDANDO_APROVACAO",
              ]) as never,
              daysLate: randomInt(1, 10),
              reportedById: assignee.id,
            },
          });
        }
      }

      // Cobrança mensal do serviço (contas a receber)
      if (receivableCount < 20) {
        const dueDate = addDays(now, randomInt(-20, 25));
        const status =
          dueDate < now
            ? randomItem([ReceivableStatus.PAGO, ReceivableStatus.PAGO, ReceivableStatus.VENCIDO])
            : randomItem([ReceivableStatus.A_VENCER, ReceivableStatus.A_VENCER, ReceivableStatus.VENCENDO_HOJE]);
        receivablesToCreate.push({
          clientId: client.id,
          description: `Mensalidade — ${serviceName}`,
          competence: competenceLabel(now),
          dueDate,
          amount: svc.value,
          status,
          recurring: svc.periodicity === Periodicity.MENSAL,
        });
        receivableCount++;
      }
    }
  }

  for (const r of receivablesToCreate) {
    const receivable = await prisma.receivable.create({
      data: {
        organizationId: org.id,
        clientId: r.clientId,
        description: r.description,
        competence: r.competence,
        dueDate: r.dueDate,
        amount: r.amount,
        status: r.status,
        recurring: r.recurring,
      },
    });
    if (r.status === ReceivableStatus.PAGO) {
      await prisma.payment.create({
        data: {
          receivableId: receivable.id,
          amount: r.amount,
          paidAt: addDays(r.dueDate, -randomInt(0, 3)),
          method: randomItem(["pix", "boleto", "transferencia"]),
        },
      });
    }
    if (r.status === ReceivableStatus.VENCIDO) {
      await prisma.collectionLog.create({
        data: {
          receivableId: receivable.id,
          note: "Cobrança enviada via WhatsApp solicitando regularização.",
          channel: "whatsapp",
        },
      });
    }
  }

  // ---------------------------------------------------------------------
  // Contratos
  // ---------------------------------------------------------------------
  const contractTemplate = await prisma.contractTemplate.create({
    data: {
      organizationId: org.id,
      name: "Contrato de Prestação de Serviços Contábeis",
      content: `CONTRATO DE PRESTAÇÃO DE SERVIÇOS CONTÁBEIS

CONTRATANTE: {{razao_social}}, inscrita no CNPJ sob o nº {{cnpj}}, com sede em {{endereco}}, {{cidade}}, neste ato representada por {{nome_responsavel}}, portador do CPF {{cpf_responsavel}}.

CONTRATADA: RNS Contabilidade.

Cláusula 1ª — Objeto: prestação dos seguintes serviços contábeis: {{servicos_contratados}}.

Cláusula 2ª — Valor: a CONTRATANTE pagará à CONTRATADA o valor mensal de R$ {{valor_mensalidade}}, com vencimento todo dia {{dia_vencimento}}.

Cláusula 3ª — Vigência: o presente contrato tem início em {{data_inicio}} e vigência por prazo indeterminado.

E por estarem justas e contratadas, as partes firmam o presente instrumento.`,
    },
  });

  let contractCount = 0;
  for (const client of clients) {
    if (client.status === ClientStatus.LEAD || contractCount >= 10) continue;
    const fullClient = await prisma.client.findUnique({ where: { id: client.id }, include: { partners: true } });
    if (!fullClient) continue;

    const clientServicesList = await prisma.clientService.findMany({
      where: { clientId: client.id },
      include: { serviceCatalogItem: true },
    });

    const content = contractTemplate.content
      .replace("{{razao_social}}", fullClient.legalName)
      .replace("{{cnpj}}", fullClient.cnpj ?? "")
      .replace("{{endereco}}", `${fullClient.address}, ${fullClient.addressNumber}`)
      .replace("{{cidade}}", `${fullClient.city}/${fullClient.state}`)
      .replace("{{nome_responsavel}}", fullClient.partners[0]?.name ?? "")
      .replace("{{cpf_responsavel}}", fullClient.partners[0]?.cpf ?? "")
      .replace("{{servicos_contratados}}", clientServicesList.map((cs) => cs.serviceCatalogItem.name).join(", "))
      .replace("{{valor_mensalidade}}", String(fullClient.monthlyFee ?? 0))
      .replace("{{dia_vencimento}}", String(fullClient.feeDueDay ?? 10))
      .replace("{{data_inicio}}", (fullClient.onboardingDate ?? new Date()).toLocaleDateString("pt-BR"));

    const status = randomItem([
      ContractStatus.ASSINADO,
      ContractStatus.ASSINADO,
      ContractStatus.ENVIADO,
      ContractStatus.GERADO,
      ContractStatus.RASCUNHO,
    ]);

    await prisma.contract.create({
      data: {
        organizationId: org.id,
        clientId: client.id,
        templateId: contractTemplate.id,
        content,
        status,
        monthlyValue: fullClient.monthlyFee,
        startDate: fullClient.onboardingDate,
        dueDay: fullClient.feeDueDay,
        generatedAt: new Date(),
        sentAt: status !== ContractStatus.RASCUNHO && status !== ContractStatus.GERADO ? new Date() : null,
        signedAt: status === ContractStatus.ASSINADO ? new Date() : null,
        createdBy: admin.id,
        services: {
          create: clientServicesList.map((cs) => ({
            description: cs.serviceCatalogItem.name,
            value: cs.value,
          })),
        },
      },
    });
    contractCount++;
  }

  // ---------------------------------------------------------------------
  // Notificações de exemplo para o admin
  // ---------------------------------------------------------------------
  await prisma.notification.createMany({
    data: [
      {
        organizationId: org.id,
        userId: admin.id,
        title: "Bem-vindo ao RNS Gestão Contábil",
        body: "Seus dados de demonstração foram carregados com sucesso.",
      },
      {
        organizationId: org.id,
        userId: admin.id,
        title: "Existem tarefas atrasadas",
        body: "Verifique a Central Operacional para revisar pendências do escritório.",
        link: "/operacional",
      },
    ],
  });

  console.log("Seed concluído.");
  console.log("Login de demonstração: admin@rnscontabil.com.br / demo1234");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
