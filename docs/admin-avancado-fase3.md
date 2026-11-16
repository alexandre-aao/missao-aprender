# Missão Aprender — Fase 3, Administração Avançada

## Componentes

1. **Operação**: Administrador Geral altera `normal`, `somente_leitura` e `manutencao`, além do aviso público. Justificativa entre 10 e 200 caracteres, auditoria e configuração persistente na branch Neon. A função `missao_api.politica_acesso_privado` é chamada pelas APIs `/api/perfis` e `/api/progresso` para impor os controles do servidor. Em somente leitura, GET continua disponível, mas POST/PATCH/DELETE/PUT são rejeitados. Em manutenção, todos os métodos privados são rejeitados para não-admin. O Administrador Geral mantém acesso para gestão e teste.

2. **Suporte e privacidade**: os responsáveis podem registrar solicitações de suporte, correção, exportação e exclusão de dados pela `conta.html`; o responsável acompanha apenas as próprias solicitações. Limites no SQL: três chamados em aberto e uma nova solicitação a cada 30 minutos. O Administrador Geral consulta e responde com registro de auditoria. Nenhuma exclusão é executada automaticamente.

3. **Exportação individual**: na ficha de uma criança, o Administrador Geral pode baixar, com justificativa, JSON do cadastro e do último snapshot **sincronizado**. O evento de exportação é registrado no banco. Não inclui senha, token de sessão ou progresso local não sincronizado. Tratar o arquivo como dado pessoal sensível e compartilhá-lo somente por canal apropriado após verificar o pedido.

4. **Segurança e auditoria**: consulta de saúde da conexão e contagens de perfis e solicitações. Reúne ações administrativas de famílias, catálogo e da Fase 3 em uma linha cronológica. Não é um sistema de log de autenticação ou monitoramento de exceções da Vercel, nem fornece indicadores de disponibilidade histórica.

5. **Aviso no jogo**: interface cliente mostra o aviso público e, no modo manutenção, uma tela de pausa. Isso é um *bloqueio de interface dependente da conectividade*. Cópias offline, missões anteriormente carregadas e autenticação externa do Neon Auth não podem ser revogadas por esse botão. As APIs privadas recusam o acesso independentemente da interface. O progresso local continua salvo.

## Segurança e publicação

- Banco: `database/2026-11-16_admin_fase3.sql`, **primeiro na homologação**, depois produção *antes* do merge do código.
- Tabelas novas `missao.configuracao_operacional`, `missao.auditoria_sistema`, `missao.solicitacoes_responsaveis`: sem acesso direto de `missao_api_user`, RLS e FORCE RLS ativadas, acesso via funções SECURITY DEFINER com autorização.
- JSON da exportação pertence a **uma única criança**, exige papel Administrador Geral e justificativa auditada. Nunca criar exportação em massa nem expor snapshots em endpoints públicos.
- API pública `/api/configuracao-publica` só retorna modo e aviso, nunca dados pessoais.
- O modo padrão da migration é `normal`. A migração não suspende ninguém.
- Em caso de falha de consulta, as operações privadas devolvem erro e não prosseguem. Se o frontend estiver offline, não é possível impedir missões locais.
- Não exclui histórico, dados infantis, missões, cadastros ou tabelas antigas, e não modifica o SGO.
- Prévia em Vercel pode usar URL de API apontando para banco de produção; não ativar manutenção a partir da prévia sem conferir as variáveis de ambiente.

## Testes

Node, Vite build e Playwright desktop/mobile para a Central e o aviso infantil, incluindo admin versus responsável, mensagens, ticket, auditoria e exportação. Validar SQL na branch Neon de homologação, incluindo manutenção/leitura, revogação direta de leitura, abertura/resposta de ticket, acesso negado a usuário comum e auditoria de exportação. O teste real de login/privacidade em preview protegida continua etapa de homologação.

A plataforma não oferece ainda um motor automático de apagamento conforme LGPD; a solicitação entra para tratamento verificado. Erros operacionais do runtime da Vercel não são ingeridos pelo banco.
