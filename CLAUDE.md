# CLAUDE.md

Guia para o Claude Code trabalhar neste repositório. Responda e escreva comentários em **português (pt-BR)**, como o restante do código.

## O projeto

**SOS Vale** é um protótipo acadêmico (Projeto Integrador I – Fatec) de plataforma de assistência a vítimas de desastres naturais no **Vale do Paraíba** (foco em Taubaté, Caçapava e Pindamonhangaba). Ele junta informações de abrigos, pessoas acolhidas, regiões de risco, voluntários, pedidos de ajuda e alertas de ocorrências enviados pelos moradores.

Três processos independentes, cada um com seu próprio `package.json` / `node_modules` (a raiz **não** tem `package.json`):

| Pasta | Stack | Papel |
|---|---|---|
| `Backend/` | Node (ESM) + Fastify 5 + Prisma 6 + PostgreSQL (Supabase) + Supabase Storage + `@fastify/jwt` + bcrypt | API REST na porta **3000** |
| `Frontend/` | React 19 + Vite 8 + React Router 7 + Leaflet/React-Leaflet + react-icons | Painel web (admin, voluntário, mapa) na porta 5173 |
| `ChatBot/` | Node (ESM) + whatsapp-web.js | Bot de WhatsApp para a população (fala só com a API, sem acesso direto ao banco) |
| `Documentações/` | docx/pptx/pdf | Visão de projeto, atas de reunião, sprints (não é código) |

`SOS_Vale_Analise_e_Backlog.pdf` (raiz) é uma análise técnica de 10/09/2026 com code review (CR01–CR15), roadmap e backlog (SEC/DAT/API/UI/US…). Use-o como referência de prioridades.

## Comandos

```bash
# Instalar (em cada pasta separadamente)
cd Backend && npm install
cd Frontend && npm install
cd ChatBot && npm install

# Rodar API + Front juntos (de Backend/ OU de Frontend/ — escolha só um)
npm run dev

# Separadamente
cd Backend && npm run back        # node src/server.js  → http://localhost:3000
cd Frontend && npm run front      # vite                → http://localhost:5173
cd ChatBot && node index.js       # pede QR Code no 1º uso; sessão em .wwebjs_auth/

# Frontend
npm run lint | npm run build | npm run preview

# Banco (Backend/)
npx prisma generate
npx prisma migrate dev --name <nome_descritivo>   # cria nova migração
npx prisma migrate deploy                         # aplica migrações pendentes
npm run seed                                      # só cadastra tipos de Deficiência (estados vêm da migração)
```

```bash
# Testes (banco Postgres em memória via PGlite — nunca toca no Supabase)
cd Backend && npm run banco:teste     # terminal 1: banco de teste na porta 5433, com dados de exemplo (admin adm@teste.com/123456)
cd Backend && npm run banco:teste:vazio  # idem, mas vazio — exigido pelo teste:api
cd Backend && npm run back:teste      # terminal 2: API em modo teste (recusa subir se a API normal estiver aberta)
cd Backend && npm run teste:api       # terminal 3: 58 verificações da API (recusa rodar contra a API real)
cd ChatBot && npm run teste:conversa  # simula conversas do WhatsApp (roteiro fixo; rodar depois do teste:api)
cd ChatBot && npm run teste:interativo  # você digita as mensagens (/foto, /numero, /grupo, /fila, /sair)
# Portas ocupadas? BANCO_TESTE_PORTA=5434 e PORT=3100 (no banco:teste/back:teste) + API_URL=http://127.0.0.1:3100 (nos testes)

# Antes de aplicar migrações no Supabase
cd Backend && npm run backup                              # exporta as tabelas para backups/ (gitignored)
cd Backend && npm run ensaiar-migracao -- backups/<pasta> # aplica as pendentes numa cópia com os dados reais
```

- `npm test` do backend não existe; os testes são os scripts acima. Rode `teste:api` sempre com o `banco:teste:vazio` recém-aberto (o teste cria os próprios dados e recusa rodar se o banco já tiver cidades). `Backend/route.http` tem requisições manuais de exemplo (extensão REST Client).
- A `DIRECT_URL` (`db.<projeto>.supabase.co`) só funciona com IPv6. Se `prisma migrate` der P1001, rode com a URL do *session pooler*: `DIRECT_URL="$DATABASE_URL" npx prisma migrate deploy` (Git Bash).
- Não há CI, Docker nem deploy configurados.

## Variáveis de ambiente

Veja `Backend/.env.example` e `ChatBot/.env.example`.
- `Backend/.env`: `DATABASE_URL`, `DIRECT_URL`, `JWT_SECRET`, `SUPABASE_URL`, `SUPABASE_KEY`, `BOT_API_KEY` (+ opcionais `ALERTA_CONFIRMACOES_MINIMAS`=3, `ALERTA_JANELA_HORAS`=6, `PORT`).
- `ChatBot/.env`: `BOT_API_KEY` (mesmo valor do backend), opcional `API_URL`.
- Frontend: páginas antigas têm `http://localhost:3000` fixo; as novas usam `src/services/api.js` (`VITE_API_URL`).

⚠️ `ChatBot/.env` está versionado no git. Nunca exiba, copie ou comite valores de `.env`.

## Arquitetura

### Backend (`Backend/src/`)
- `server.js` registra CORS, JWT e três autenticadores: `app.authenticate` (qualquer token), `app.authenticateAdmin` (token com `tipo: 'admin'`, gerado em `/api/auth/login`) e `app.authenticateBot` (cabeçalho `x-bot-key` igual ao `BOT_API_KEY`).
- Prefixos: `/api/auth` (admin), `/api/abrigos`, `/api/estados`, `/api/cidades`, `/api/bairros`, `/api/vitimas`, `/api/solicitacoes` (solicitação de **abrigo**), `/api/voluntarios`, `/api/solicitacoes-ajuda`, `/api/alertas` (admin), `/api/inscritos` (admin), `/api/bot` (só o ChatBot).
- Cada arquivo em `routes/` é um plugin Fastify que cria o próprio `new PrismaClient()`. Lógica compartilhada fica em `src/lib/`: `localizacao.js` (select/achatamento de cidade-estado-bairro, ViaCEP), `alertas.js` (regras de relato, disparo, cancelamento e textos das mensagens), `inscritos.js`, `armazenamento.js` (upload no Supabase).
- Convenção de endpoints: `POST /cadastrar`, `GET /listar`, `GET /listar/:id`, `PUT /atualizar/:id`, `DELETE /excluir/:id`. Solicitação de abrigo usa `POST /criar` e `PATCH /analisar/:id`. Leituras de regiões são públicas; escrita exige admin.
- Respostas de erro usam `{ mensagem: '...' }`.
- Fotos chegam em **base64** e vão para o Supabase Storage (buckets `fotos-abrigo`, `fotos-vitima`, `fotos-alerta`). Limite de corpo = 1 MiB, exceto `POST /api/bot/alertas/relatar` (15 MiB).
- `routes/doacao.js` é **legado** (não registrado). `middlewares/autenticar.js` não é usado.

### Banco (`Backend/prisma/schema.prisma` — fonte de verdade)
- **Regiões:** `Estado` (27 UFs cadastradas pela migração) → `Cidade` (`grupoWhatsappId` = grupo que recebe os alertas) → `Bairro` (`nivelRisco` enum, população, área). `Abrigo` e `SolicitacaoAbrigo` têm `cidadeId` (obrigatório) e `bairroId` (opcional). A API continua devolvendo `cidade`/`estado`/`bairro` **como texto** para não quebrar as telas — ao incluir um abrigo em outra consulta, use `selectLocalizacao` + `achatarLocalizacao`.
- **Alertas:** `InscritoAlerta` (morador inscrito pelo bot, `whatsappId` único, bairro onde mora) + `InscritoBairro` (bairros acompanhados) → `RelatoAlerta` (um por pessoa por alerta) → `Alerta` (`em_verificacao` → `ativo` → `encerrado`/`cancelado`) → `Notificacao` (fila de saída do WhatsApp).
- Demais models: `Admin`, `Vitima`, `Deficiencia`, `VitimaDeficiencia` (N:N), `Voluntario`, `SolicitacaoAjuda`, `SolicitacaoAjudaInteresse`.
- PKs seguem o padrão `id_<entidade>` — **exceto** `Admin.id` e `SolicitacaoAjudaInteresse.id`.
- `Abrigo.capacidadeOcupada` é um contador mantido manualmente ao vincular/desvincular vítimas.
- O histórico de migrações contém drops/recriações; revise o SQL gerado antes de aplicar em banco com dados.

### Sistema de alertas (fluxo)
1. O morador se inscreve pelo bot (nome, e-mail, bairro). Se o bairro não está na lista, informa o CEP → ViaCEP → bairro e cidade são criados.
2. Relato = perguntas fechadas (local, tipo, gravidade) + foto obrigatória. Não há texto livre.
3. Relatos do mesmo tipo no mesmo bairro entram no mesmo `Alerta` (dentro da janela `ALERTA_JANELA_HORAS`). A trava `pg_advisory_xact_lock(bairro, tipo)` evita alertas ou disparos duplicados.
4. Com `ALERTA_CONFIRMACOES_MINIMAS` pessoas diferentes (ou confirmação do admin) o alerta vira `ativo` e gera `Notificacao` para quem mora ou acompanha o bairro + o grupo da cidade.
5. O bot reserva a fila (`POST /api/bot/notificacoes/reservar`), envia e reporta (`PATCH /api/bot/notificacoes/:id`); falhas são repetidas até 3 vezes. Cancelar um alerta ativo envia uma mensagem de correção a quem recebeu.

### Frontend (`Frontend/src/`)
- Rotas em `App.jsx`; uma pasta por página em `pages/<modulo>/<Pagina>/index.jsx` + CSS ao lado.
- Telas antigas usam `fetch` direto. Telas novas (`alertas/`, `inscritos/`, `regioes/Gerenciar-Regioes`) usam `services/api.js` (`apiAdmin`: envia `token_adm`, lança erro se a resposta não for ok, volta ao login em 401), `components/SidebarAdm.jsx` e `components/SeletorLocalidade.jsx` (Estado → Cidade → Bairro, também usado nos formulários de abrigo). Estilos dos módulos novos: `pages/alertas/alertas.css`.
- Autenticação: tokens em `localStorage` (`token_adm`, `token_voluntario`, `voluntario`). Mapa via Leaflet + geocodificação no navegador com Nominatim.

### ChatBot (`ChatBot/`)
- `index.js` → `controllers/message-controller.js`: ignora status e grupos (em grupos só responde `!alertas ...`, ver `grupo-controller.js`); `oi`/`menu` sempre voltam ao menu; depois despacha para os fluxos conforme `state.step` (`alerta_*`, `help_*`, `psycho_*`, `sol_*`).
- `alerta-flow.js`: inscrição, gerenciar bairros, relato. `services/api.js` (cliente da API com `x-bot-key`), `services/notificacao-service.js` (envia a fila a cada 15s), `services/midia.js` (download de fotos).
- Menu: 1 = alertas do bairro, 5 = relatar ocorrência. Os fluxos de apoio (2) e psicológico (4) ainda salvam só em memória (`registroService.js`).
- Atenção: os pedidos do bot **não** são `SolicitacaoAjuda` — esta é uma necessidade criada pelo admin para um abrigo.

## Problemas conhecidos (do relatório de análise)

Considere-os ao mexer nas áreas afetadas; não "conserte" por conta própria fora do escopo pedido, mas avise se a mudança tocar neles.
- **Segurança (P0):** as rotas antigas (abrigos, vítimas, voluntários, solicitações) continuam sem autenticação; só as novas (alertas, inscritos, escrita de regiões, bot) são protegidas. `/api/auth/cadastrar` aceita `cargo` do cliente.
- **IDs fixos no front:** `VOLUNTARIO_LOGADO_ID = 1`, `criadoPorId: 1`, `adminId: 1`.
- **Transações:** transferência/cadastro/exclusão de vítima alteram `capacidadeOcupada` fora da mesma transação do vínculo; aprovação de solicitação de abrigo cria o abrigo antes de atualizar a solicitação (não idempotente).
- **Navegação:** links para rotas inexistentes (`/login_voluntario`, `/abrigos/:id`, `/voluntario`…); `pages/cadastro` usa ícones sem importar.
- **UI otimista:** várias telas antigas mostram sucesso sem checar `response.ok`. O dashboard (`pg_adm`) ainda tem números fixos (exceto solicitações de abrigo e alertas).
- **Layout:** `.dashboard { width: 100vw }` gera ~8px de rolagem horizontal em páginas longas.
- **Dependências:** `fastify`, `@fastify/jwt`, `@prisma/client` e `dotenv` estão em `devDependencies` do backend.

Ordem de prioridade sugerida pelo relatório: segurança → integridade de dados → contratos/navegação → testes/CI.

## Convenções

- JavaScript ES Modules em tudo (`"type": "module"`); sem TypeScript (exceto `prisma/seed.ts`).
- Nomes de domínio, variáveis, rotas e mensagens em português, sem acento em identificadores (`abrigo`, `vitima`, `capacidadeTotal`, `possuiPets`).
- Comentários explicativos em português são comuns e bem-vindos (projeto acadêmico); mantenha o estilo do arquivo.
- Ao criar rota nova: novo plugin em `Backend/src/routes/`, registrar em `server.js` com prefixo `/api/...`, seguir o padrão de verbos acima e adicionar exemplo em `route.http`. Rotas administrativas novas devem usar `app.authenticateAdmin`.
- Ao alterar o schema: gerar migração com nome descritivo e rodar `npx prisma generate`. O bot não usa Prisma — se ele precisar de dados novos, crie uma rota em `/api/bot`.
- Ao criar página: pasta em `Frontend/src/pages/...`, registrar em `App.jsx` respeitando a caixa exata do caminho.
- Ambiente de desenvolvimento é Windows; os commits são feitos direto na `main` pela equipe.
