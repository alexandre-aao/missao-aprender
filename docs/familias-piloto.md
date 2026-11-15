# Famílias — piloto fechado

## Decisões
- Iniciar com 10–20 famílias; apenas responsáveis adultos com conta. Crianças usam perfis sem login próprio.
- Administrador Geral acompanha apenas e-mails autorizados e estatísticas agregadas. Pais só administram seus próprios filhos.
- Não alterar as 140 missões, IDs das atividades, progresso local ou código do SGO.
- Cadastros públicos, grupos, rankings infantis e chat continuam desativados.

## Fase 1A — registro de convites (esta branch)
- O painel administrativo registra os e-mails dos responsáveis e mostra estados: pendente, expirado, conta criada e cancelado.
- A API autentica JWT, confere o papel no banco e acessa a tabela somente por funções SECURITY DEFINER.
- Tabela privada, RLS/FORCE RLS e proibição de acesso direto à role de API; limite inicial de 30 convites pendentes e expiração em 30 dias.
- **Registrar convite NÃO cria conta e NÃO envia e-mail.** Não divulgar link até a conta estar pronta.

### Procedimento manual de ingresso (piloto)
1. Administrador registra o e-mail informado pelo responsável.
2. Administrador cria exclusivamente esse usuário no Neon Auth da branch aplicativa, em painel administrativo Neon ou operação equivalente; nunca ativa signup público.
3. Painel mostra 'Conta criada' quando detecta esse e-mail no Neon Auth.
4. Administrador usa 'Copiar instruções' e as envia ao colega. O responsável abre conta.html e usa recuperação/primeiro acesso por e-mail para criar a própria senha.
5. O responsável cadastra os perfis dos filhos com consentimento específico. Não reutilizar conta de outra família.

**Importante:** cancelar o registro de um convite não suspende uma conta já criada. A suspensão/exclusão efetiva da conta exige uma operação no provedor e revisão das dependências de dados.

## Fase 1B — convites automáticos, depois de validar o piloto
- Projetar provisionamento seguro no backend, usando credencial de escopo mínimo, nunca no navegador.
- Exigir convites de uso único, e-mail validado, prazos, limitação de tentativas, auditoria e tratamento de duplicidades.
- Não habilitar inscrição irrestrita no Managed Neon Auth para simular convite: a proteção precisa existir no próprio servidor de identidade.

## Fase 2 — famílias
- Relatórios por filho e visibilidade estritamente por responsável.
- Testar importação voluntária do progresso local e sincronização entre dispositivos.
- Implementar exportação e exclusão completa dos dados vinculados.

## Fase 3 — comunidade
- Grupos privados por convite, aprovação dos responsáveis, sem chat livre.
- Desafios e rankings com apelidos e sem dados identificáveis; resultados competitivos validados no servidor.

## Critérios mínimos para homologação
- Executar a migration primeiramente em um banco/branch isolado.
- Verificar admin válido, responsável comum, anônimo, JWT inválido, e acesso SQL direto da role da API.
- Testar e-mails inválidos, repetidos, conta já existente, expiração, cancelamento e o teto do piloto.
- Confirmar login, senha de primeiro acesso, logout, recuperação, perfis e preservação do progresso em dois navegadores.
- Rodar testes Node/Python, build e UI mobile; revisar privacidade e direitos das crianças antes de receber famílias reais.
- **Nenhuma migração, mudança de Neon Auth ou publicação em produção deve ser presumida por este PR.**
