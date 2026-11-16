-- Fase 3 — Administração Avançada. Somente homologação antes de merge/deploy.
-- Não altera tabela de autenticação, nem exclui perfis, conquistas ou progresso.
CREATE TABLE IF NOT EXISTS missao.configuracao_operacional (
 chave boolean PRIMARY KEY DEFAULT true CHECK (chave),
 modo text NOT NULL DEFAULT 'normal' CHECK (modo IN ('normal','somente_leitura','manutencao')),
 aviso_publico text NOT NULL DEFAULT '' CHECK (length(aviso_publico)<=180),
 alterado_por text NOT NULL DEFAULT 'sistema',
 atualizado_em timestamptz NOT NULL DEFAULT clock_timestamp()
);
INSERT INTO missao.configuracao_operacional(chave,modo,aviso_publico,alterado_por)
VALUES(true,'normal','','sistema') ON CONFLICT(chave) DO NOTHING;
REVOKE ALL ON missao.configuracao_operacional FROM PUBLIC,missao_api_user;
ALTER TABLE missao.configuracao_operacional ENABLE ROW LEVEL SECURITY;
ALTER TABLE missao.configuracao_operacional FORCE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS missao.auditoria_sistema (
 id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
 administrador_id text NOT NULL CHECK(length(administrador_id) BETWEEN 1 AND 200),
 acao text NOT NULL CHECK(acao IN ('configuracao','exportacao_crianca','atualizar_solicitacao')),
 alvo_id text NOT NULL CHECK(length(alvo_id) BETWEEN 1 AND 200),
 justificativa text NOT NULL CHECK(length(justificativa) BETWEEN 10 AND 200),
 criado_em timestamptz NOT NULL DEFAULT clock_timestamp()
);
CREATE INDEX IF NOT EXISTS idx_auditoria_sistema_recente ON missao.auditoria_sistema(criado_em DESC,id DESC);
REVOKE ALL ON missao.auditoria_sistema FROM PUBLIC,missao_api_user;
ALTER TABLE missao.auditoria_sistema ENABLE ROW LEVEL SECURITY;
ALTER TABLE missao.auditoria_sistema FORCE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS missao.solicitacoes_responsaveis (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 auth_user_id text NOT NULL CHECK(length(auth_user_id) BETWEEN 1 AND 200),
 tipo text NOT NULL CHECK(tipo IN ('suporte','exportacao','exclusao','correcao')),
 descricao text NOT NULL CHECK(length(descricao) BETWEEN 10 AND 600),
 status text NOT NULL DEFAULT 'aberta' CHECK(status IN ('aberta','em_analise','respondida','concluida')),
 resposta text NOT NULL DEFAULT '' CHECK(length(resposta)<=500),
 criado_em timestamptz NOT NULL DEFAULT clock_timestamp(),
 atualizado_em timestamptz NOT NULL DEFAULT clock_timestamp()
);
CREATE INDEX IF NOT EXISTS idx_solicitacoes_pessoa ON missao.solicitacoes_responsaveis(auth_user_id,criado_em DESC);
CREATE INDEX IF NOT EXISTS idx_solicitacoes_status ON missao.solicitacoes_responsaveis(status,criado_em DESC);
REVOKE ALL ON missao.solicitacoes_responsaveis FROM PUBLIC,missao_api_user;
ALTER TABLE missao.solicitacoes_responsaveis ENABLE ROW LEVEL SECURITY;
ALTER TABLE missao.solicitacoes_responsaveis FORCE ROW LEVEL SECURITY;

-- API privada: manutenção não impede o login no Neon Auth nem exclui progresso local.
CREATE OR REPLACE FUNCTION missao_api.politica_acesso_privado(p_user text,p_escrita boolean)
 RETURNS TABLE(permitido boolean,motivo text,modo text)
 LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path=pg_catalog,missao
 AS $fn$
DECLARE v_mode text;v_admin boolean;
BEGIN
 IF p_user IS NULL OR length(p_user) NOT BETWEEN 1 AND 200 OR p_escrita IS NULL
 THEN RETURN QUERY SELECT false,'Sessão inválida.'::text,'normal'::text; RETURN; END IF;
 SELECT c.modo INTO v_mode FROM missao.configuracao_operacional c WHERE c.chave;
 IF v_mode IS NULL THEN RAISE EXCEPTION 'configuracao ausente' USING ERRCODE='55000'; END IF;
 IF NOT missao_api.acesso_familiar_permitido(p_user)
 THEN RETURN QUERY SELECT false,'Acesso familiar suspenso ou indisponível.'::text,v_mode; RETURN; END IF;
 SELECT EXISTS(SELECT 1 FROM missao.administradores a WHERE a.auth_user_id=p_user AND a.ativo) INTO v_admin;
 IF v_admin OR v_mode='normal'
 THEN RETURN QUERY SELECT true,''::text,v_mode; RETURN; END IF;
 IF v_mode='manutencao'
 THEN RETURN QUERY SELECT false,'Sistema em manutenção. Seus dados locais estão preservados.'::text,v_mode; RETURN; END IF;
 IF v_mode='somente_leitura' AND p_escrita
 THEN RETURN QUERY SELECT false,'Modo de somente leitura: alterações e sincronização estão pausadas.'::text,v_mode; RETURN; END IF;
 RETURN QUERY SELECT true,''::text,v_mode;
END;
$fn$;

-- Consulta pública retorna somente configuração e aviso; nenhuma identidade.
CREATE OR REPLACE FUNCTION missao_api.configuracao_publica()
 RETURNS TABLE(modo text,aviso_publico text,atualizado_em timestamptz)
 LANGUAGE sql STABLE SECURITY DEFINER SET search_path=pg_catalog,missao
 AS $fn$ SELECT c.modo,c.aviso_publico,c.atualizado_em FROM missao.configuracao_operacional c WHERE c.chave; $fn$;

CREATE OR REPLACE FUNCTION missao_api.configuracao_admin(p_admin text)
 RETURNS TABLE(modo text,aviso_publico text,alterado_por text,atualizado_em timestamptz)
 LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path=pg_catalog,missao
 AS $fn$
BEGIN
 IF NOT EXISTS(SELECT 1 FROM missao.administradores a WHERE a.auth_user_id=p_admin AND a.ativo)
 THEN RAISE EXCEPTION 'acesso negado' USING ERRCODE='42501'; END IF;
 RETURN QUERY SELECT c.modo,c.aviso_publico,c.alterado_por,c.atualizado_em
 FROM missao.configuracao_operacional c WHERE c.chave;
END;
$fn$;

CREATE OR REPLACE FUNCTION missao_api.alterar_configuracao_admin(
 p_admin text,p_modo text,p_aviso text,p_justificativa text)
 RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,missao
 AS $fn$
DECLARE v_modo text; v_aviso text;
BEGIN
 IF NOT EXISTS(SELECT 1 FROM missao.administradores a WHERE a.auth_user_id=p_admin AND a.ativo)
 THEN RAISE EXCEPTION 'acesso negado' USING ERRCODE='42501'; END IF;
 IF p_modo IS NULL OR p_modo NOT IN ('normal','somente_leitura','manutencao')
 OR p_aviso IS NULL OR length(btrim(p_aviso))>180
 OR p_justificativa IS NULL OR length(btrim(p_justificativa)) NOT BETWEEN 10 AND 200
 THEN RAISE EXCEPTION 'dados invalidos' USING ERRCODE='22023'; END IF;
 SELECT c.modo,c.aviso_publico INTO v_modo,v_aviso
 FROM missao.configuracao_operacional c WHERE c.chave FOR UPDATE;
 IF NOT FOUND THEN RAISE EXCEPTION 'configuracao ausente' USING ERRCODE='55000'; END IF;
 IF v_modo=p_modo AND v_aviso=btrim(p_aviso)
 THEN RAISE EXCEPTION 'situacao nao mudou' USING ERRCODE='23514'; END IF;
 UPDATE missao.configuracao_operacional c
 SET modo=p_modo,aviso_publico=btrim(p_aviso),alterado_por=p_admin,atualizado_em=clock_timestamp()
 WHERE c.chave;
 INSERT INTO missao.auditoria_sistema(administrador_id,acao,alvo_id,justificativa)
 VALUES(p_admin,'configuracao','global',btrim(p_justificativa));
 RETURN true;
END;
$fn$;

-- Solicitações não dependem do modo de manutenção, garantindo acesso a direitos e suporte.
CREATE OR REPLACE FUNCTION missao_api.criar_solicitacao(
 p_user text,p_tipo text,p_descricao text)
 RETURNS TABLE(id uuid,status text,criado_em timestamptz)
 LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,missao
 AS $fn$
BEGIN
 IF NOT EXISTS(SELECT 1 FROM neon_auth."user" u WHERE u.id::text=p_user)
 THEN RAISE EXCEPTION 'acesso negado' USING ERRCODE='42501'; END IF;
 IF p_tipo IS NULL OR p_tipo NOT IN ('suporte','exportacao','exclusao','correcao')
 OR p_descricao IS NULL OR length(btrim(p_descricao)) NOT BETWEEN 10 AND 600
 THEN RAISE EXCEPTION 'dados invalidos' USING ERRCODE='22023'; END IF;
 -- Serializa solicitações simultâneas para limitar spam.
 PERFORM pg_advisory_xact_lock(hashtextextended(p_user,908100));
 IF (SELECT count(*) FROM missao.solicitacoes_responsaveis s WHERE s.auth_user_id=p_user AND s.status IN ('aberta','em_analise'))>=3
 OR EXISTS(SELECT 1 FROM missao.solicitacoes_responsaveis s
 WHERE s.auth_user_id=p_user AND s.criado_em>now()-interval '30 minutes')
 THEN RAISE EXCEPTION 'limite de solicitacoes' USING ERRCODE='23514'; END IF;
 RETURN QUERY INSERT INTO missao.solicitacoes_responsaveis(auth_user_id,tipo,descricao)
 VALUES(p_user,p_tipo,btrim(p_descricao)) RETURNING
 missao.solicitacoes_responsaveis.id,missao.solicitacoes_responsaveis.status,
 missao.solicitacoes_responsaveis.criado_em;
END;
$fn$;

CREATE OR REPLACE FUNCTION missao_api.minhas_solicitacoes(p_user text)
 RETURNS TABLE(id uuid,tipo text,descricao text,status text,resposta text,criado_em timestamptz,atualizado_em timestamptz)
 LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path=pg_catalog,missao
 AS $fn$
BEGIN
 IF NOT EXISTS(SELECT 1 FROM neon_auth."user" u WHERE u.id::text=p_user)
 THEN RAISE EXCEPTION 'acesso negado' USING ERRCODE='42501'; END IF;
 RETURN QUERY SELECT s.id,s.tipo,s.descricao,s.status,s.resposta,s.criado_em,s.atualizado_em
 FROM missao.solicitacoes_responsaveis s WHERE s.auth_user_id=p_user
 ORDER BY s.criado_em DESC,s.id DESC LIMIT 30;
END;
$fn$;

CREATE OR REPLACE FUNCTION missao_api.listar_solicitacoes_admin(
 p_admin text,p_status text DEFAULT 'todos',p_limite integer DEFAULT 20,p_offset integer DEFAULT 0)
 RETURNS TABLE(id uuid,auth_user_id text,email text,tipo text,descricao text,status text,resposta text,criado_em timestamptz,atualizado_em timestamptz,total_registros bigint)
 LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path=pg_catalog,missao
 AS $fn$
BEGIN
 IF NOT EXISTS(SELECT 1 FROM missao.administradores a WHERE a.auth_user_id=p_admin AND a.ativo)
 THEN RAISE EXCEPTION 'acesso negado' USING ERRCODE='42501'; END IF;
 IF p_status IS NULL OR p_status NOT IN ('todos','aberta','em_analise','respondida','concluida')
 OR p_limite NOT BETWEEN 1 AND 50 OR p_offset NOT BETWEEN 0 AND 50000
 THEN RAISE EXCEPTION 'filtros invalidos' USING ERRCODE='22023'; END IF;
 RETURN QUERY SELECT s.id,s.auth_user_id,COALESCE(u.email,'Conta indisponível')::text,
 s.tipo,s.descricao,s.status,s.resposta,s.criado_em,s.atualizado_em,count(*) OVER()::bigint
 FROM missao.solicitacoes_responsaveis s
 LEFT JOIN neon_auth."user" u ON u.id::text=s.auth_user_id
 WHERE p_status='todos' OR s.status=p_status
 ORDER BY s.criado_em DESC,s.id DESC LIMIT p_limite OFFSET p_offset;
END;
$fn$;

CREATE OR REPLACE FUNCTION missao_api.atualizar_solicitacao_admin(
 p_admin text,p_id uuid,p_status text,p_resposta text,p_justificativa text)
 RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,missao
 AS $fn$
DECLARE v_old text;
BEGIN
 IF NOT EXISTS(SELECT 1 FROM missao.administradores a WHERE a.auth_user_id=p_admin AND a.ativo)
 THEN RAISE EXCEPTION 'acesso negado' USING ERRCODE='42501'; END IF;
 IF p_id IS NULL OR p_status IS NULL OR p_status NOT IN ('em_analise','respondida','concluida')
 OR p_resposta IS NULL OR length(btrim(p_resposta)) NOT BETWEEN 10 AND 500
 OR p_justificativa IS NULL OR length(btrim(p_justificativa)) NOT BETWEEN 10 AND 200
 THEN RAISE EXCEPTION 'dados invalidos' USING ERRCODE='22023'; END IF;
 SELECT s.status INTO v_old FROM missao.solicitacoes_responsaveis s WHERE s.id=p_id FOR UPDATE;
 IF NOT FOUND THEN RETURN false; END IF;
 IF v_old='concluida' THEN RAISE EXCEPTION 'solicitacao concluida' USING ERRCODE='23514'; END IF;
 UPDATE missao.solicitacoes_responsaveis s SET status=p_status,resposta=btrim(p_resposta),
 atualizado_em=clock_timestamp() WHERE s.id=p_id;
 INSERT INTO missao.auditoria_sistema(administrador_id,acao,alvo_id,justificativa)
 VALUES(p_admin,'atualizar_solicitacao',p_id::text,btrim(p_justificativa));
 RETURN true;
END;
$fn$;

-- Exportação INDIVIDUAL, auditada, dos dados de uma criança sincronizados em nuvem.
-- O ID é selecionado pelo admin; não permite exportação em massa nem inclui senhas.
CREATE OR REPLACE FUNCTION missao_api.exportar_crianca_admin(
 p_admin text,p_crianca uuid,p_justificativa text)
 RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,missao
 AS $fn$
DECLARE v_data jsonb;
BEGIN
 IF NOT EXISTS(SELECT 1 FROM missao.administradores a WHERE a.auth_user_id=p_admin AND a.ativo)
 THEN RAISE EXCEPTION 'acesso negado' USING ERRCODE='42501'; END IF;
 IF p_crianca IS NULL OR p_justificativa IS NULL OR length(btrim(p_justificativa)) NOT BETWEEN 10 AND 200
 THEN RAISE EXCEPTION 'dados invalidos' USING ERRCODE='22023'; END IF;
 SELECT jsonb_build_object(
 'exportado_em',clock_timestamp(),'perfil',jsonb_build_object(
 'id',p.id,'apelido',p.apelido,'avatar',p.avatar,'ano_escolar',p.ano_escolar,
 'criado_em',p.criado_em,'responsavel_email',u.email),
 'progresso_sincronizado',COALESCE(e.estado,'null'::jsonb),
 'revisao',e.revisao,'atualizado_em',e.atualizado_em
 ) INTO v_data
 FROM missao.perfis_infantis p JOIN missao.responsaveis r ON r.id=p.responsavel_id
 JOIN neon_auth."user" u ON u.id::text=r.auth_user_id
 LEFT JOIN missao.estados_aprendizagem e ON e.crianca_id=p.id
 WHERE p.id=p_crianca;
 IF v_data IS NULL THEN RAISE EXCEPTION 'perfil nao localizado' USING ERRCODE='22023'; END IF;
 INSERT INTO missao.auditoria_sistema(administrador_id,acao,alvo_id,justificativa)
 VALUES(p_admin,'exportacao_crianca',p_crianca::text,btrim(p_justificativa));
 RETURN v_data;
END;
$fn$;

CREATE OR REPLACE FUNCTION missao_api.auditoria_unificada_admin(p_admin text,p_limite integer DEFAULT 50)
 RETURNS TABLE(origem text,acao text,alvo_id text,justificativa text,criado_em timestamptz)
 LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path=pg_catalog,missao
 AS $fn$
BEGIN
 IF NOT EXISTS(SELECT 1 FROM missao.administradores a WHERE a.auth_user_id=p_admin AND a.ativo)
 THEN RAISE EXCEPTION 'acesso negado' USING ERRCODE='42501'; END IF;
 IF p_limite NOT BETWEEN 1 AND 100 THEN RAISE EXCEPTION 'limite invalido' USING ERRCODE='22023'; END IF;
 RETURN QUERY SELECT t.origem,t.acao,t.alvo_id,t.justificativa,t.criado_em
 FROM (
 SELECT 'familias'::text origem,a.acao,a.alvo_id,a.justificativa,a.criado_em FROM missao.auditoria_administrativa a
 UNION ALL
 SELECT 'catalogo'::text,c.acao,c.missao_id,c.justificativa,c.criado_em FROM missao.auditoria_catalogo c
 UNION ALL
 SELECT 'sistema'::text,s.acao,s.alvo_id,s.justificativa,s.criado_em FROM missao.auditoria_sistema s
 ) t ORDER BY t.criado_em DESC LIMIT p_limite;
END;
$fn$;

CREATE OR REPLACE FUNCTION missao_api.saude_administrativa(p_admin text)
 RETURNS TABLE(servidor_em timestamptz,perfis bigint,sincronizados bigint,
 solicitacoes_abertas bigint,configuracao_valida boolean)
 LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path=pg_catalog,missao
 AS $fn$
BEGIN
 IF NOT EXISTS(SELECT 1 FROM missao.administradores a WHERE a.auth_user_id=p_admin AND a.ativo)
 THEN RAISE EXCEPTION 'acesso negado' USING ERRCODE='42501'; END IF;
 RETURN QUERY SELECT clock_timestamp(),
 (SELECT count(*) FROM missao.perfis_infantis),
 (SELECT count(*) FROM missao.estados_aprendizagem),
 (SELECT count(*) FROM missao.solicitacoes_responsaveis s WHERE s.status IN ('aberta','em_analise')),
 EXISTS(SELECT 1 FROM missao.configuracao_operacional WHERE chave);
END;
$fn$;

REVOKE ALL ON FUNCTION missao_api.politica_acesso_privado(text,boolean) FROM PUBLIC;
REVOKE ALL ON FUNCTION missao_api.configuracao_publica() FROM PUBLIC;
REVOKE ALL ON FUNCTION missao_api.configuracao_admin(text) FROM PUBLIC;
REVOKE ALL ON FUNCTION missao_api.alterar_configuracao_admin(text,text,text,text) FROM PUBLIC;
REVOKE ALL ON FUNCTION missao_api.criar_solicitacao(text,text,text) FROM PUBLIC;
REVOKE ALL ON FUNCTION missao_api.minhas_solicitacoes(text) FROM PUBLIC;
REVOKE ALL ON FUNCTION missao_api.listar_solicitacoes_admin(text,text,integer,integer) FROM PUBLIC;
REVOKE ALL ON FUNCTION missao_api.atualizar_solicitacao_admin(text,uuid,text,text,text) FROM PUBLIC;
REVOKE ALL ON FUNCTION missao_api.exportar_crianca_admin(text,uuid,text) FROM PUBLIC;
REVOKE ALL ON FUNCTION missao_api.auditoria_unificada_admin(text,integer) FROM PUBLIC;
REVOKE ALL ON FUNCTION missao_api.saude_administrativa(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION missao_api.politica_acesso_privado(text,boolean) TO missao_api_user;
GRANT EXECUTE ON FUNCTION missao_api.configuracao_publica() TO missao_api_user;
GRANT EXECUTE ON FUNCTION missao_api.configuracao_admin(text) TO missao_api_user;
GRANT EXECUTE ON FUNCTION missao_api.alterar_configuracao_admin(text,text,text,text) TO missao_api_user;
GRANT EXECUTE ON FUNCTION missao_api.criar_solicitacao(text,text,text) TO missao_api_user;
GRANT EXECUTE ON FUNCTION missao_api.minhas_solicitacoes(text) TO missao_api_user;
GRANT EXECUTE ON FUNCTION missao_api.listar_solicitacoes_admin(text,text,integer,integer) TO missao_api_user;
GRANT EXECUTE ON FUNCTION missao_api.atualizar_solicitacao_admin(text,uuid,text,text,text) TO missao_api_user;
GRANT EXECUTE ON FUNCTION missao_api.exportar_crianca_admin(text,uuid,text) TO missao_api_user;
GRANT EXECUTE ON FUNCTION missao_api.auditoria_unificada_admin(text,integer) TO missao_api_user;
GRANT EXECUTE ON FUNCTION missao_api.saude_administrativa(text) TO missao_api_user;
