-- Missao Aprender: Central de Administracao Fase 1.
-- Executar em homologacao antes da producao. Nao modifica Neon Auth nem progresso.
CREATE TABLE IF NOT EXISTS missao.controle_acesso_responsaveis (
  auth_user_id text PRIMARY KEY CHECK (length(auth_user_id) BETWEEN 1 AND 200),
  suspenso boolean NOT NULL DEFAULT false,
  motivo text NOT NULL DEFAULT '',
  alterado_por text NOT NULL,
  alterado_em timestamptz NOT NULL DEFAULT clock_timestamp()
);
REVOKE ALL ON missao.controle_acesso_responsaveis FROM PUBLIC, missao_api_user;
ALTER TABLE missao.controle_acesso_responsaveis ENABLE ROW LEVEL SECURITY;
ALTER TABLE missao.controle_acesso_responsaveis FORCE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS missao.auditoria_administrativa (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  administrador_id text NOT NULL CHECK (length(administrador_id) BETWEEN 1 AND 200),
  acao text NOT NULL CHECK (acao IN ('suspender_responsavel','reativar_responsavel','editar_crianca')),
  alvo_id text NOT NULL CHECK (length(alvo_id) BETWEEN 1 AND 200),
  justificativa text NOT NULL CHECK (length(justificativa) BETWEEN 10 AND 200),
  criado_em timestamptz NOT NULL DEFAULT clock_timestamp()
);
CREATE INDEX IF NOT EXISTS idx_auditoria_administrativa_recente
 ON missao.auditoria_administrativa(criado_em DESC, id DESC);
REVOKE ALL ON missao.auditoria_administrativa FROM PUBLIC, missao_api_user;
ALTER TABLE missao.auditoria_administrativa ENABLE ROW LEVEL SECURITY;
ALTER TABLE missao.auditoria_administrativa FORCE ROW LEVEL SECURITY;

-- Checagem chamada por TODAS as APIs familiares, inclusive sincronizacao.
-- O bloqueio aplica-se a APIs privadas do aplicativo; nao interfere no login do Neon.
CREATE OR REPLACE FUNCTION missao_api.acesso_familiar_permitido(p_user_id text)
 RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER
 SET search_path=pg_catalog,missao
 AS $fn$
 SELECT EXISTS (
   SELECT 1 FROM neon_auth."user" u
   WHERE u.id::text=p_user_id AND NOT COALESCE(u.banned,false)
 ) AND NOT EXISTS (
   SELECT 1 FROM missao.controle_acesso_responsaveis c
   WHERE c.auth_user_id=p_user_id AND c.suspenso
 );
$fn$;

-- Inventario do diretorio de contas Neon: inclui adultos sem perfis infantis.
CREATE OR REPLACE FUNCTION missao_api.listar_familias_admin(
 p_admin text,p_busca text DEFAULT '',p_estado text DEFAULT 'todos',
 p_limite integer DEFAULT 20,p_offset integer DEFAULT 0)
 RETURNS TABLE (
  auth_user_id text,nome text,email text,criado_em timestamptz,
  email_confirmado boolean,administrador boolean,situacao text,
  total_criancas bigint,ultima_sincronizacao timestamptz,total_registros bigint
 )
 LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path=pg_catalog,missao
 AS $fn$
BEGIN
 IF NOT EXISTS(SELECT 1 FROM missao.administradores a WHERE a.auth_user_id=p_admin AND a.ativo)
 THEN RAISE EXCEPTION 'acesso negado' USING ERRCODE='42501'; END IF;
 IF p_busca IS NULL OR length(p_busca)>80 OR p_estado NOT IN ('todos','ativo','suspenso','restrito_neon')
  OR p_limite NOT BETWEEN 1 AND 50 OR p_offset NOT BETWEEN 0 AND 50000
 THEN RAISE EXCEPTION 'filtros invalidos' USING ERRCODE='22023'; END IF;
 RETURN QUERY WITH base AS (
  SELECT u.id::text AS uid,u.name::text AS nm,u.email::text AS mail,
   u."createdAt" AS cadastro, u."emailVerified" AS confirmado,
   EXISTS(SELECT 1 FROM missao.administradores a WHERE a.auth_user_id=u.id::text AND a.ativo) AS admin,
   CASE WHEN COALESCE(u.banned,false) THEN 'restrito_neon'::text
        WHEN COALESCE(c.suspenso,false) THEN 'suspenso'::text
        ELSE 'ativo'::text END AS st,
   (SELECT count(*) FROM missao.perfis_infantis k
       JOIN missao.responsaveis r ON r.id=k.responsavel_id
       WHERE r.auth_user_id=u.id::text) AS filhos,
   (SELECT max(s.atualizado_em) FROM missao.estados_aprendizagem s
       JOIN missao.perfis_infantis k ON k.id=s.crianca_id
       JOIN missao.responsaveis r ON r.id=k.responsavel_id
       WHERE r.auth_user_id=u.id::text) AS ultimo_sync
  FROM neon_auth."user" u
  LEFT JOIN missao.controle_acesso_responsaveis c ON c.auth_user_id=u.id::text
 )
 SELECT b.uid,b.nm,b.mail,b.cadastro,b.confirmado,b.admin,b.st,
        b.filhos,b.ultimo_sync,count(*) OVER()::bigint
 FROM base b WHERE
  (p_busca='' OR strpos(lower(b.nm),lower(p_busca))>0 OR strpos(lower(b.mail),lower(p_busca))>0)
  AND (p_estado='todos' OR b.st=p_estado)
 ORDER BY b.cadastro DESC,b.uid
 LIMIT p_limite OFFSET p_offset;
END;
$fn$;

-- A listagem de criancas inclui o vinculo familiar e apenas a data de sincronizacao,
-- sem copiar o conteudo privado do progresso.
CREATE OR REPLACE FUNCTION missao_api.listar_criancas_admin(
 p_admin text,p_busca text DEFAULT '',p_ano smallint DEFAULT -1,
 p_responsavel text DEFAULT '',p_limite integer DEFAULT 20,p_offset integer DEFAULT 0)
 RETURNS TABLE (
   id uuid,apelido text,avatar text,ano_escolar smallint,
   criado_em timestamptz,atualizado_em timestamptz,
   auth_user_id text,responsavel_nome text,responsavel_email text,
   ultima_sincronizacao timestamptz,revisao bigint,total_registros bigint
 )
 LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path=pg_catalog,missao
 AS $fn$
BEGIN
 IF NOT EXISTS(SELECT 1 FROM missao.administradores a WHERE a.auth_user_id=p_admin AND a.ativo)
 THEN RAISE EXCEPTION 'acesso negado' USING ERRCODE='42501'; END IF;
 IF p_busca IS NULL OR length(p_busca)>80 OR p_ano NOT BETWEEN -1 AND 6
  OR p_responsavel IS NULL OR length(p_responsavel)>200
  OR p_limite NOT BETWEEN 1 AND 50 OR p_offset NOT BETWEEN 0 AND 50000
 THEN RAISE EXCEPTION 'filtros invalidos' USING ERRCODE='22023'; END IF;
 RETURN QUERY SELECT
  k.id,k.apelido::text,k.avatar::text,k.ano_escolar,k.criado_em,k.atualizado_em,
  r.auth_user_id,COALESCE(u.name,'Conta nao localizada')::text AS responsavel_nome,
  COALESCE(u.email,'Conta nao localizada')::text AS responsavel_email,
  s.atualizado_em,s.revisao,count(*) OVER()::bigint
 FROM missao.perfis_infantis k
 JOIN missao.responsaveis r ON r.id=k.responsavel_id
 LEFT JOIN neon_auth."user" u ON u.id::text=r.auth_user_id
 LEFT JOIN missao.estados_aprendizagem s ON s.crianca_id=k.id
 WHERE (p_busca='' OR strpos(lower(k.apelido),lower(p_busca))>0
   OR strpos(lower(COALESCE(u.name,'')),lower(p_busca))>0
   OR strpos(lower(COALESCE(u.email,'')),lower(p_busca))>0)
   AND (p_ano=-1 OR k.ano_escolar=p_ano)
   AND (p_responsavel='' OR r.auth_user_id=p_responsavel)
 ORDER BY k.criado_em DESC,k.id
 LIMIT p_limite OFFSET p_offset;
END;
$fn$;

CREATE OR REPLACE FUNCTION missao_api.listar_auditoria_admin(p_admin text,p_limite integer DEFAULT 30)
 RETURNS TABLE(id bigint,administrador_id text,acao text,alvo_id text,justificativa text,criado_em timestamptz)
 LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path=pg_catalog,missao
 AS $fn$
BEGIN
 IF NOT EXISTS(SELECT 1 FROM missao.administradores a WHERE a.auth_user_id=p_admin AND a.ativo)
 THEN RAISE EXCEPTION 'acesso negado' USING ERRCODE='42501'; END IF;
 IF p_limite NOT BETWEEN 1 AND 50 THEN RAISE EXCEPTION 'limite invalido' USING ERRCODE='22023'; END IF;
 RETURN QUERY SELECT x.id,x.administrador_id,x.acao,x.alvo_id,x.justificativa,x.criado_em
 FROM missao.auditoria_administrativa x ORDER BY x.criado_em DESC,x.id DESC LIMIT p_limite;
END;
$fn$;

-- Suspende/reativa exclusivamente APIs privadas do Missao Aprender.
-- Nunca muda diretamente neon_auth.user nem revoga sessoes do provedor.
CREATE OR REPLACE FUNCTION missao_api.alterar_suspensao_admin(
 p_admin text,p_alvo text,p_suspender boolean,p_motivo text)
 RETURNS boolean
 LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,missao
 AS $fn$
DECLARE v_atual boolean;
BEGIN
 IF NOT EXISTS(SELECT 1 FROM missao.administradores a WHERE a.auth_user_id=p_admin AND a.ativo)
 THEN RAISE EXCEPTION 'acesso negado' USING ERRCODE='42501'; END IF;
 IF p_alvo IS NULL OR p_suspender IS NULL OR p_motivo IS NULL
   OR length(btrim(p_motivo)) NOT BETWEEN 10 AND 200
 THEN RAISE EXCEPTION 'dados invalidos' USING ERRCODE='22023'; END IF;
 IF NOT EXISTS(SELECT 1 FROM neon_auth."user" u WHERE u.id::text=p_alvo)
 THEN RAISE EXCEPTION 'responsavel nao localizado' USING ERRCODE='22023'; END IF;
 IF EXISTS(SELECT 1 FROM missao.administradores a WHERE a.auth_user_id=p_alvo AND a.ativo)
 THEN RAISE EXCEPTION 'administrador protegido' USING ERRCODE='23514'; END IF;
 SELECT COALESCE(c.suspenso,false) INTO v_atual
 FROM missao.controle_acesso_responsaveis c WHERE c.auth_user_id=p_alvo FOR UPDATE;
 IF v_atual IS NULL THEN v_atual:=false; END IF;
 IF v_atual=p_suspender THEN
  RAISE EXCEPTION 'situacao nao mudou' USING ERRCODE='23514';
 END IF;
 INSERT INTO missao.controle_acesso_responsaveis AS c
  (auth_user_id,suspenso,motivo,alterado_por,alterado_em)
 VALUES(p_alvo,p_suspender,btrim(p_motivo),p_admin,clock_timestamp())
 ON CONFLICT(auth_user_id) DO UPDATE SET suspenso=EXCLUDED.suspenso,
 motivo=EXCLUDED.motivo,alterado_por=EXCLUDED.alterado_por,alterado_em=EXCLUDED.alterado_em;
 INSERT INTO missao.auditoria_administrativa
  (administrador_id,acao,alvo_id,justificativa)
 VALUES(p_admin,CASE WHEN p_suspender THEN 'suspender_responsavel'
 ELSE 'reativar_responsavel' END,p_alvo,btrim(p_motivo));
 RETURN true;
END;
$fn$;

-- Correcao administrativa de apelido, avatar ou etapa, preservando ID e progresso.
CREATE OR REPLACE FUNCTION missao_api.editar_crianca_admin(
 p_admin text,p_id uuid,p_apelido text,p_avatar text,p_ano smallint,p_motivo text)
 RETURNS boolean
 LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,missao
 AS $fn$
BEGIN
 IF NOT EXISTS(SELECT 1 FROM missao.administradores a WHERE a.auth_user_id=p_admin AND a.ativo)
 THEN RAISE EXCEPTION 'acesso negado' USING ERRCODE='42501'; END IF;
 IF p_apelido IS NULL OR length(btrim(p_apelido)) NOT BETWEEN 2 AND 24
    OR p_avatar NOT IN ('astronauta','robo','estrela','foguete','planeta','dinossauro')
    OR p_ano NOT BETWEEN 0 AND 6 OR p_motivo IS NULL
    OR length(btrim(p_motivo)) NOT BETWEEN 10 AND 200
 THEN RAISE EXCEPTION 'dados invalidos' USING ERRCODE='22023'; END IF;
 UPDATE missao.perfis_infantis k SET apelido=btrim(p_apelido),avatar=p_avatar,
  ano_escolar=p_ano,atualizado_em=clock_timestamp() WHERE k.id=p_id;
 IF NOT FOUND THEN RETURN false; END IF;
 INSERT INTO missao.auditoria_administrativa
   (administrador_id,acao,alvo_id,justificativa)
 VALUES(p_admin,'editar_crianca',p_id::text,btrim(p_motivo));
 RETURN true;
END;
$fn$;

REVOKE ALL ON FUNCTION missao_api.acesso_familiar_permitido(text) FROM PUBLIC;
REVOKE ALL ON FUNCTION missao_api.listar_familias_admin(text,text,text,integer,integer) FROM PUBLIC;
REVOKE ALL ON FUNCTION missao_api.listar_criancas_admin(text,text,smallint,text,integer,integer) FROM PUBLIC;
REVOKE ALL ON FUNCTION missao_api.listar_auditoria_admin(text,integer) FROM PUBLIC;
REVOKE ALL ON FUNCTION missao_api.alterar_suspensao_admin(text,text,boolean,text) FROM PUBLIC;
REVOKE ALL ON FUNCTION missao_api.editar_crianca_admin(text,uuid,text,text,smallint,text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION missao_api.acesso_familiar_permitido(text) TO missao_api_user;
GRANT EXECUTE ON FUNCTION missao_api.listar_familias_admin(text,text,text,integer,integer) TO missao_api_user;
GRANT EXECUTE ON FUNCTION missao_api.listar_criancas_admin(text,text,smallint,text,integer,integer) TO missao_api_user;
GRANT EXECUTE ON FUNCTION missao_api.listar_auditoria_admin(text,integer) TO missao_api_user;
GRANT EXECUTE ON FUNCTION missao_api.alterar_suspensao_admin(text,text,boolean,text) TO missao_api_user;
GRANT EXECUTE ON FUNCTION missao_api.editar_crianca_admin(text,uuid,text,text,smallint,text) TO missao_api_user;
