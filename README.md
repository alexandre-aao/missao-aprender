# Missão Aprender — v1.1 — expansão curricular

Projeto educacional independente. Contém **86 atividades/missões** (72 atividades matemáticas + 14 missões interativas). Prioriza Matemática 1º ano e revisão da pré-escola, com exploração de Ciências.

Produção: https://missao-aprender.vercel.app
Área dos responsáveis: https://missao-aprender.vercel.app/conta.html

## Arquitetura

- Vercel Vite Multi-Page: `index.html` e `conta.html`, com APIs `/api/perfis` e `/api/admin`.
- Neon PostgreSQL/Managed Better Auth: projeto `winter-dust-21808642`, branch de aplicação `producao-aplicativo` (`br-cool-lab-bfp4m36m`).
- Branch `desenvolvimento-auth` permanece como histórico de testes, não é usada pela produção.
- Conta adulta inicial é administradora na tabela protegida `missao.administradores`; o perfil infantil permanece como aluno.
- Cadastro público desativado no Neon e na UI; outros responsáveis ainda não podem abrir conta.
- Progressão de atividades no `localStorage` por dispositivo; **não** há sincronização com o banco e não há campeonatos online implementados.
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

- `python test_unificado.py`: 86 missões, filtros, matemática, pré-escola, ciências, anos 1–6, exportação e mobile.
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