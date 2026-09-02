# RNS Gestão Contábil

Plataforma de gestão para escritórios de contabilidade brasileiros: clientes,
serviços, obrigações, tarefas, checklists, contratos, mensalidades, contas a
receber, dashboards gerenciais, documentos, equipe e automações — tudo em um
único sistema.

> O nome, logotipo e cores podem ser alterados a qualquer momento em
> **Configurações → Dados do escritório**.

## Stack

- **Next.js 15** (App Router) + **React 19** + **TypeScript** estrito
- **Tailwind CSS** + componentes no estilo shadcn/ui (Radix UI)
- **PostgreSQL** + **Prisma ORM** (schema multiempresa via `organization_id`)
- **NextAuth** (credenciais + JWT) com **RBAC** configurável por perfil
- **Playwright** (Chromium) para geração de PDF de contratos
- **Vitest** para testes das regras de negócio críticas
- Camadas desacopladas para integrações futuras: WhatsApp, e-mail,
  assinatura digital (ZapSign/Clicksign/D4Sign/DocuSign) e IA

## Arquitetura

```
src/
  app/
    (app)/                 Área autenticada (sidebar + header)
      dashboard/            Dashboard principal + indicadores
      operacional/          Central Operacional, Mapa de Atrasos, Carga da
                             Equipe, Linha de Produção
      clientes/             Cadastro, sócios, visão 360°
      servicos/             Catálogo de serviços + biblioteca de checklists
      tarefas/               Tarefas, Kanban, Minhas Tarefas
      calendario/            Calendário de obrigações
      pendencias/            Central de Pendências
      contratos/             Modelos, geração, versionamento, PDF
      financeiro/             Contas a receber, pagamentos, inadimplência
      documentos/             Central de documentos
      relatorios/             Exportação de relatórios (CSV)
      equipe/                 Usuários, departamentos, perfis de acesso
      automacao/              Motor de regras + assistente de IA (preview)
      configuracoes/          Dados do escritório, integrações, auditoria
    api/                    Rotas de API (NextAuth, notificações, busca, export)
  components/
    ui/                     Componentes de base (botão, input, tabela, ...)
    layout/                 Sidebar, header, busca global, notificações
    <módulo>/               Componentes específicos de cada módulo
  lib/
    prisma.ts               Cliente Prisma singleton
    auth.ts / session.ts    NextAuth + helpers de sessão/permissão
    permissions.ts          Catálogo de permissões (RBAC)
    task-generation.ts      Motor de geração de tarefas recorrentes
    task-rules.ts           Regra de conclusão de checklist obrigatório
    receivables.ts          Regras de status de contas a receber
    automation-engine.ts    Motor de regras (prazos, notificações)
    contract-template.ts    Preenchimento de variáveis de contrato
    integrations/           Camadas desacopladas (WhatsApp, e-mail, assinatura)
prisma/
  schema.prisma             Modelo de dados completo
  seed.ts                   Dados de demonstração em pt-BR
```

### Modelo de dados

O `prisma/schema.prisma` cobre todas as entidades do escopo funcional:
organizações (multiempresa), usuários/perfis/permissões, departamentos,
clientes/sócios, catálogo de serviços, templates de checklist, serviços por
cliente, tarefas/subtarefas/checklist/dependências/comentários/anexos,
contratos/versões/aditivos, contas a receber/pagamentos/cobrança,
documentos, notificações, regras de automação e auditoria — todas vinculadas
a `organizationId`, preparando o sistema para operar futuramente como SaaS
multiempresa sem reescrever o modelo de dados.

Entidades sensíveis (clientes, contratos, tarefas, financeiro, documentos)
usam **soft delete** (`deletedAt`) em vez de exclusão definitiva, e
alterações de status relevantes ficam registradas em `audit_logs`.

## Como rodar localmente

### 1. Pré-requisitos

- Node.js 20+
- PostgreSQL 14+ (local ou remoto — Supabase Postgres funciona)

### 2. Instalar dependências

```bash
npm install
```

### 3. Configurar variáveis de ambiente

Copie `.env.example` para `.env` e ajuste:

```bash
cp .env.example .env
```

| Variável | Descrição |
| --- | --- |
| `DATABASE_URL` | String de conexão PostgreSQL |
| `NEXTAUTH_URL` | URL base da aplicação (ex.: `http://localhost:3000`) |
| `NEXTAUTH_SECRET` | Gere com `openssl rand -base64 32` |
| `NEXT_PUBLIC_SUPABASE_URL` / `..._ANON_KEY` / `SUPABASE_SERVICE_ROLE_KEY` | Opcional — armazenamento de documentos em nuvem |
| `WHATSAPP_API_TOKEN` / `WHATSAPP_PHONE_NUMBER_ID` | Opcional — envio de mensagens WhatsApp |
| `EMAIL_SMTP_*` | Opcional — envio de e-mails |
| `SIGNATURE_PROVIDER` / `SIGNATURE_API_KEY` | Opcional — assinatura digital (zapsign/clicksign/d4sign/docusign) |
| `AI_PROVIDER_API_KEY` | Opcional — assistente de IA |

Sem essas variáveis opcionais configuradas, o sistema continua **100%
funcional**: os módulos de WhatsApp/e-mail/assinatura/IA operam em modo
"preparado" (mostram a mensagem que seria enviada e indicam como ativar o
provedor real), conforme as camadas em `src/lib/integrations/`.

### 4. Banco de dados

```bash
npx prisma migrate dev   # cria o banco e aplica as migrations
npm run db:seed          # popula dados de demonstração em pt-BR
```

O seed cria uma organização (`RNS Contabilidade`), 4 perfis de acesso
padrão, 9 departamentos, 9 usuários, ~22 serviços de catálogo com
checklists (PGDAS-D, Admissão, Demissão, Fechamento contábil...), 10
clientes com sócios, dezenas de tarefas em diferentes status/prazos,
cobranças, contratos e um conjunto de regras de automação.

**Login de demonstração:** `admin@rnscontabil.com.br` / `demo1234`
(demais usuários seguem o padrão `nome@rnscontabil.com.br` / `demo1234`).

### 5. Executar em desenvolvimento

```bash
npm run dev
```

Acesse [http://localhost:3000](http://localhost:3000).

### 6. Testes

```bash
npm run test
```

Cobre as regras críticas: cálculo de alertas de prazo, permissões (RBAC),
regra de checklist obrigatório para concluir tarefas, cálculo de status de
contas a receber e geração de competências recorrentes.

### 7. Build de produção

```bash
npm run build
npm start
```

## Scripts disponíveis

| Comando | Descrição |
| --- | --- |
| `npm run dev` | Ambiente de desenvolvimento |
| `npm run build` | Build de produção |
| `npm start` | Inicia o build de produção |
| `npm run lint` | ESLint |
| `npm run test` | Testes (Vitest) |
| `npm run db:migrate` | Aplica migrations em desenvolvimento |
| `npm run db:deploy` | Aplica migrations em produção |
| `npm run db:seed` | Popula dados de demonstração |
| `npm run db:studio` | Abre o Prisma Studio |

## Deploy

O projeto é uma aplicação Next.js padrão e pode ser publicado em qualquer
provedor com suporte a Node.js (Vercel, Railway, Render, um servidor próprio
com PM2, etc.). Pontos de atenção:

- Configure `DATABASE_URL` e `NEXTAUTH_SECRET` no ambiente de produção.
- Rode `npm run db:deploy` no pipeline de deploy para aplicar migrations.
- A geração de PDF de contratos usa o Chromium via `playwright-core`; em
  produção, garanta que o binário do Chromium esteja disponível no
  ambiente de execução (ou configure `PLAYWRIGHT_BROWSERS_PATH`), ou troque
  por um serviço de geração de PDF externo.
- Documentos e anexos são armazenados localmente em `public/uploads/` por
  padrão. Para produção com múltiplas instâncias, configure o Supabase
  Storage (ou S3 equivalente) e adapte `src/app/(app)/documentos/actions.ts`
  e `src/app/(app)/tarefas/actions.ts` (upload de anexos) — a estrutura já
  isola o armazenamento em funções dedicadas para facilitar a troca.

## Segurança e LGPD

- RBAC granular por módulo (ver **Equipe → Perfis de acesso**); o
  administrador pode criar perfis customizados e escolher exatamente quais
  permissões cada um possui.
- Toda ação de servidor (`"use server"`) revalida a sessão e a permissão
  antes de tocar no banco, e todas as consultas/mutations são filtradas por
  `organizationId` — nenhum dado atravessa organizações mesmo que um ID de
  outro registro seja informado.
- Senhas com hash `bcrypt`; sessões JWT assinadas via NextAuth.
- Auditoria (`audit_logs`) registra criação/edição/exclusão/mudança de
  status de entidades sensíveis, com usuário, data/hora e valores
  anterior/novo — consultável em **Configurações → Auditoria** e na aba
  **Histórico** de cada cliente.
- Soft delete em clientes, contratos, tarefas, documentos e financeiro.

## Status de implementação

O fluxo completo descrito no escopo funciona de ponta a ponta com dados
reais persistidos em PostgreSQL (sem mocks): criar usuário → criar
departamento → criar serviço e checklist → cadastrar cliente → vincular
serviço (gera tarefas automaticamente) → executar checklist → concluir
tarefa → gerar cobrança → registrar pagamento → gerar contrato e PDF →
consultar tudo na página do cliente → visualizar nos dashboards.

Áreas entregues como arquitetura pronta para configuração, sem exigir
alteração de código quando o provedor externo estiver disponível:
integração com WhatsApp, e-mail, assinatura digital e assistente de IA
(`src/lib/integrations/`), motor de regras de automação (`automation_rules`
+ `src/lib/automation-engine.ts`), portal do cliente e módulo de chamados
(schema preparado, UI ainda não implementada), importação de clientes via
Excel/CSV (schema e camada de documentos preparados).
