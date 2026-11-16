# Fase 2 — Gestão Pedagógica (Missão Aprender)

## Escopo

A Central de Administração recebe as abas **Pedagogia** e **Catálogo**:

- Indicadores de perfis com progresso **sincronizado** e data de última sincronização; sem alegação de acesso/uso diário quando há apenas atualização do snapshot.
- Contagem por mundo das missões com ao menos uma conclusão entre perfis, soma de conclusões, registros e erros informados.
- Índice de respostas corretas na **primeira tentativa**, calculado exclusivamente sobre os eventos `records` do snapshot sincronizado.
- Destaques de missões para revisão somente se houver **5 ou mais registros e 3 ou mais erros**, sem classificar nenhuma criança como fraca.
- Exportação CSV **agregada**, sem nomes ou e-mails infantis.
- Catálogo das 140 atividades com títulos/IDs obtidos do código atual e opções `ocultar`/`mostrar` e `sinalizar`/`resolver` pendência de revisão. Justificativa obrigatória, auditoria separada e histórico mantido.

## Onde estão os dados

As tabelas `missao.progresso_atividades`, `missao.tentativas` e `missao.atividades` existem, mas não são preenchidas pelo mecanismo atual. O relatório usa APENAS `missao.estados_aprendizagem.estado`, que contém a versão 2 dos snapshots `missions`, `skills` e `records`. A agregação acontece **dentro do Neon**, por funções SECURITY DEFINER autorizadas apenas ao Administrador Geral. O JSON por criança não sai pelo endpoint administrativo.

As métricas são autorreferidas pelo cliente e não verificadas em servidor. **Não usar para ranking, avaliações formais ou comparação competitiva entre crianças.** Crianças que jogam anonimamente ou ainda não sincronizaram não entram na estatística. `sinc_7d`/`sinc_30d` significam atualização da nuvem no período, não sessões de jogo distintas.

## Publicação e preservação

Os IDs das 140 missões são preservados. O painel de publicação NÃO altera questões, conteúdo em JavaScript, progressos ou conquistas. O catálogo editorial em `missao.controles_catalogo` apenas fornece os IDs ocultos para `/api/catalogo-publico`. A tela infantil carrega esses IDs e os retira da navegação, mas o jogo continua a conter o código das missões. Se não houver rede ou se a API de catálogo falhar, o aplicativo local exibe o catálogo completo; o filtro **não é um mecanismo de segurança nem de remoção de conteúdo distribuído**. Publicação de correções de perguntas requer alteração do código, revisão e deploy.

Antes de integrar a PR, aplicar `database/2026-11-16_admin_fase2.sql` na branch Neon utilizada pela produção e verificar que as funções e concessões existem. A tabela de auditoria existente da Fase 1 não é alterada; há tabela específica `missao.auditoria_catalogo`. Manter o cadastro público fechado.

## Testes

- `npm test` — catálogo de IDs, agregação e validação.
- `python tests/test_pedagogia_ui.py` — resumo, catálogo, sinalização, ocultação e responsividade com mocks, sem tocar no banco.
- Consultas SQL contra branch Neon de homologação, inclusive negativa para não administrador e leitura direta impedida para `missao_api_user`.
- GitHub Actions PR CI antes de qualquer merge; alterações no banco de produção somente na publicação autorizada.

**Missão Aprender é independente do SGO.**
