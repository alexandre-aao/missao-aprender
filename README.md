# Missão Aprender — oito mundos, 140 missões

Projeto educacional independente, com foco no 1º ano e revisão da pré-escola. O catálogo reúne 96 missões anteriores e 44 de alfabetização, lógica, programação, inglês e educação financeira. Veja as [44 missões e referências pedagógicas](docs/expansao-cinco-mundos.md).

Produção: https://missao-aprender.vercel.app
Área dos responsáveis: https://missao-aprender.vercel.app/conta.html

## Arquitetura

- Vercel Vite Multi-Page: `index.html` e `conta.html`, com APIs `/api/perfis` e `/api/admin`.
- Neon PostgreSQL/Managed Better Auth: projeto `winter-dust-21808642`, branch de aplicação `producao-aplicativo` (`br-cool-lab-bfp4m36m`).
- Branch `desenvolvimento-auth` permanece como histórico de testes, não é usada pela produção.
- Conta adulta inicial é administradora na tabela protegida `missao.administradores`; o perfil infantil permanece como aluno.
- Cadastro público desativado no Neon e na UI; outros responsáveis ainda não podem abrir conta.
- Progresso local preservado no `localStorage`, com sincronização opcional entre dispositivos por perfil infantil autenticado; não há campeonatos online implementados.
- O painel administrativo mostra indicadores gerais e verifica a permissão no servidor. Não dá acesso à informação privada de outras famílias.

## Instalação

```sh
npm install
npm run build
```

Use Node 22+ e configure as variáveis descritas em `.env.example` diretamente na Vercel ou em `.env.local` (não versionado). **Não colocar `DATABASE_URL` no cliente.** O banco usa a role `missao_api_user`, não a conta dona do banco.

## Segurança

- As rotas de perfis e administração verificam assinatura de JWT pelo JWKS da mesma branch Neon.
- Admin é conferido no banco pelo identificador de usuário autenticado, nunca por e-mail ou parâmetro passado pelo cliente.
- Perfil infantil não recebe conta de login, nem privilégios de administrador.
- O aplicativo não coleta foto, telefone ou data de nascimento da criança.
- RLS ativa nas tabelas sensíveis e role de API com funções SQL explicitamente restritas.
- Prévias protegidas por Vercel Authentication. O site educacional em produção está público, mas APIs protegidas exigem login.

## Verificações

- `python test_unificado.py`: catálogo de missões, filtros, matemática, pré-escola, ciências, anos 1–6, exportação e mobile.
- `node --test tests/*.test.mjs`: validações de perfis e cabeçalhos.
- `python tests/test_admin_ui.py`: renderização em desktop e mobile, conta, painel admin e cadastro em simulação.
- Testes de banco: administrador inicial permitido; outro usuário bloqueado; role da API sem acesso direto à tabela administrativa.
- Build da Vercel: 270 módulos, `dist/index.html` e `dist/conta.html`, deployment READY.

## Pendente antes de abrir cadastros a colegas

Homologar login, consulta, exclusão de conta completa e acessibilidade em produção; revisar dependências e obrigações de privacidade para contas infantis. Depois, implementar convites privados, campeonatos e sincronização mediante consentimento.

**Atenção:** A publicação via Vercel API incluiu a aplicação empacotada para o build da plataforma; este ZIP contém o código-fonte descompactado e pronto para versionar em um repositório próprio. Não enviar arquivos `.env` preenchidos ou senhas ao GitHub.

## Expansão v1.1

Foram acrescentadas **22 missões inéditas**, preservando todos os IDs, pontuações e dados das 64 atividades anteriores. A trilha de 1º ano agora tem 30 atividades matemáticas, a pré-escola 10 revisões e Ciências 10 experiências, totalizando **50 missões disponíveis para o 1º ano**. Em todo o aplicativo: **86** (72 atividades curriculares e 14 minijogos/missões).

Os oito novos laboratórios de Ciências exigem explorar pelo menos duas situações antes de responder. Os experimentos são representações didáticas, não substituem orientação do responsável nem representam fenômenos em escala real. Habilidades BNCC indicadas no catálogo são referências preliminares; exigem conferência pedagógica antes de declaração de alinhamento formal.

Testes: `node --test tests/*.test.mjs`, `python test_unificado.py`, `python tests/test_novas_missoes.py`. Preservamos a chave do localStorage e as APIs, o login e a administração da v1.0; **a ampliação não ativa contas públicas nem competição online**.

## Repositório GitHub

Este pacote exclui arquivos temporários, capturas de tela de teste e bytecode Python. O site em produção permanece na Vercel e **a publicação atual pela API não estabelece integração automática com o GitHub**. Depois de criar o repositório, vincule-o explicitamente ao projeto Vercel existente, quando estiver pronto para automatizar deploys. Não crie um segundo projeto Vercel desnecessariamente.

Este código foi preparado para um repositório privado inicialmente. Nenhuma licença de código aberto foi escolhida automaticamente.

## Fase 2 — sincronização por perfil infantil (branch de homologação)

**Não publicada em produção.** Ative a branch de teste `feat/fase2-progresso-sincronizado` e a branch Neon `fase2-progresso-homologacao`. A migration de referência é `database/2026-11-15_fase2_progresso.sql`; não executá-la na branch Neon de produção sem homologação.

- Responsável precisa entrar em `/conta.html` antes de selecionar a criança na página principal.
- Cada perfil tem um armazenamento local próprio, identificado por conta autenticada e UUID do perfil. O antigo progresso anônimo é preservado em `missao-aprender-unificado-v1` e só pode ser importado com confirmação explícita.
- A API `GET /api/progresso?perfil_id=<uuid>` e `PUT /api/progresso` exige JWT válido e só utiliza o identificador do usuário obtido pela verificação de assinatura.
- No Neon, `missao.estados_aprendizagem` contém um snapshot de aprendizagem por perfil, com `revisao` para escrita otimista (conflito 409); `missao_api.ler_progresso` e `missao_api.salvar_progresso` conferem propriedade do perfil no banco. Sem acesso direto da role de API à tabela; RLS/FORCE RLS ativas.
- O cliente tenta mesclar progresso entre aparelhos e retém a cópia local quando a rede falha; eventos com `eventId` não se duplicam. O app sincroniza ao concluir missão e permite sincronização manual.
- Dados de conclusão e estrelas são autorreportados pelo cliente e **não podem ser usados para placares competitivos, recompensas externas ou avaliações confiáveis** sem validação no servidor. A futura Arena exigirá um fluxo próprio de tentativas validadas.
- `progresso_atividades` e `tentativas` existentes continuam disponíveis para a futura normalização de eventos. A Fase 2 usa snapshot JSONB para preservar o histórico e os campos completos do app.
- Não desabilita login, RLS ou proteção das prévias, não altera o app SGO.

### Testes antes de homologação

1. `npm test` e `python test_unificado.py` / `python tests/test_novas_missoes.py`
2. Banco de homologação: leitor isolado, gravação revisionada, conflito de revisão, tentativa de acesso a filho alheio, sem SELECT direto.
3. Homologação **real** em dois navegadores: entrar como responsável, selecionar o mesmo filho, concluir uma missão, sincronizar, atualizar o outro aparelho, importar legado com autorização e simular falha de rede.
4. Verificar login e funcionamento da prévia com Neon Auth da branch de homologação, confirmar que a branch de produção e o `main` permanecem inalterados.

> Atenção: não ativar cadastros externos, torneios ou importação automática de progresso compartilhado.

## Ciências: 10 novas investigações (novembro de 2026)

A versão atual possui **20 missões de Ciências** e **96 missões ao todo**; quando o ano principal é o 1º ano, há 30 de matemática, 10 de revisão e 20 de Ciências (60 opções).

As 10 investigações adicionam a sequência de exploração: **prever sem pontuação → observar ao menos duas situações distintas → comparar → responder → receber explicação**. A hipótese não é julgada como erro/acerto. São **modelos ilustrativos**, não simulações físicas quantitativas, e não pedem que a criança manipule objetos, produtos de limpeza, água quente ou eletricidade na vida real.

Temas: lavar as mãos, sentidos, materiais e luz, absorção de água, manhã/tarde/noite, hábitos dos animais, partes da planta, tamanhos de sombra, aquecimento de tecidos e reutilização de objetos. As 10 missões anteriores permanecem acessíveis e com seus IDs intactos.

O catálogo em `api/catalogo.js` e o limite de validação em `sync-core.js` foram expandidos sem mudar o formato do progresso. A sincronização entre dispositivos continua restrita a perfis do responsável autenticado; dados de partidas não são verificados para uso em rankings.

Referências e ressalvas: `docs/ciencias-referencias.md`. Teste automatizado: `node --test tests/ciencias-investigacoes.test.mjs`.


## Ciências — modernização das 8 experiências clássicas

As oito missões científicas clássicas (plantas, flutuação, ímãs, sombras, som, gelo, Sol e metamorfose) agora seguem o mesmo percurso investigativo das dez novas: **formular uma hipótese sem pontuação, observar pelo menos duas condições distintas, comparar, responder e receber explicação**.

Elas ganharam cenas ilustradas próprias e perguntas de comparação. Algumas oferecem mais situações para explorar, como a Lua refletindo luz, o gelo voltando a congelar, a atração por ímãs e a crisálida da borboleta. As explicações foram ajustadas para evitar generalizações científicas incorretas.

Continuam sendo **96 missões, 20 de Ciências**: 18 investigações guiadas e 2 simulações com controles (gravidade e dia/noite). Os oito IDs, o progresso já salvo, as estrelas e a sincronização por perfil não foram alterados. Não houve migração no Neon nem inclusão de dependências.

## Gestão do Administrador Geral — Fase 1 (branch de homologação)

A página `admin.html` reúne contas adultas, crianças vinculadas, filtros, fichas, suspensão/reativação de acesso privado e correção auditada de apelido/avatar/ano escolar. A API administrativa é `api/admin-gestao.js`; a migração está em `database/2026-11-15_admin_fase1.sql`. Esta implementação permanece fora da produção até homologação. **A migration deve ser aplicada antes de publicar o código**, pois a API de perfis e a sincronização passam a usar `missao_api.acesso_familiar_permitido`.

Suspender um responsável bloqueia as APIs familiares do Missão Aprender, mas não exclui dados, não encerra sessões do Neon Auth e não bloqueia o acesso anônimo às missões públicas. Contas de administradores não podem ser suspensas por esta interface. O conteúdo das respostas da criança não é exibido; apenas o vínculo e a data da última sincronização. Nenhum código do SGO é alterado.

## Fase 2 — Gestão Pedagógica (homologação)

Abas Pedagogia/Catálogo na Central de Administração. Métricas agregadas dos perfis sincronizados, por mundo e missão, exportação CSV, ocultação editorial (sem remoção de conteúdo) e sinalização de revisão com auditoria. **Não usar os registros dos dispositivos como notas ou rankings verificados**. Ver [documentação](docs/admin-pedagogia-fase2.md). Migration antes de deploy: `database/2026-11-16_admin_fase2.sql`.
