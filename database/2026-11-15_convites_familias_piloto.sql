-- Fase 1A: piloto fechado; NAO abrir signups, NAO aplicar diretamente em producao.
CREATE TABLE IF NOT EXISTS missao.convites_responsaveis (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL CHECK (length(email) BETWEEN 6 AND 180 AND email = lower(email)),
  status text NOT NULL DEFAULT 'pendente' CHECK (status IN ('pendente','cancelado')),
  criado_por text NOT NULL CHECK (length(criado_por) BETWEEN 1 AND 200),
  criado_em timestamptz NOT NULL DEFAULT clock_timestamp(),
  expira_em timestamptz NOT NULL DEFAULT (clock_timestamp() + interval '30 days'),
  atualizado_em timestamptz NOT NULL DEFAULT clock_timestamp(),
  CONSTRAINT convite_prazo_valido CHECK (expira_em > criado_em)
);
CREATE UNIQUE INDEX IF NOT EXISTS convites_responsaveis_email_aberto
 ON missao.convites_responsaveis(email) WHERE status='pendente';
REVOKE ALL ON missao.convites_responsaveis FROM PUBLIC, missao_api_user;
ALTER TABLE missao.convites_responsaveis ENABLE ROW LEVEL SECURITY;
ALTER TABLE missao.convites_responsaveis FORCE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION missao_api.listar_convites_responsaveis(p_user_id text)
 RETURNS TABLE(id uuid, email text, estado text, criado_em timestamptz, expira_em timestamptz)
 LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path=pg_catalog,missao
 AS $body$
BEGIN
 IF NOT EXISTS(SELECT 1 FROM missao.administradores a WHERE a.auth_user_id=p_user_id AND a.ativo)
 THEN RAISE EXCEPTION 'acesso negado' USING ERRCODE='42501'; END IF;
 RETURN QUERY
 SELECT c.id,c.email,
   CASE WHEN c.status='cancelado' THEN 'cancelado'::text
        WHEN EXISTS(SELECT 1 FROM neon_auth."user" u WHERE lower(u.email)=c.email) THEN 'conta_criada'::text
        WHEN c.expira_em<=clock_timestamp() THEN 'expirado'::text
        ELSE 'pendente'::text END,
   c.criado_em,c.expira_em
 FROM missao.convites_responsaveis c
 ORDER BY c.criado_em DESC LIMIT 50;
END;
$body$;

CREATE OR REPLACE FUNCTION missao_api.criar_convite_responsavel(p_user_id text,p_email text)
 RETURNS TABLE(id uuid,email text,estado text,criado_em timestamptz,expira_em timestamptz)
 LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,missao
 AS $body$
DECLARE v_email text := lower(btrim(p_email));
BEGIN
 IF NOT EXISTS(SELECT 1 FROM missao.administradores a WHERE a.auth_user_id=p_user_id AND a.ativo)
 THEN RAISE EXCEPTION 'acesso negado' USING ERRCODE='42501'; END IF;
 IF v_email IS NULL OR length(v_email)>180 OR v_email !~ '^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$'
 THEN RAISE EXCEPTION 'email invalido' USING ERRCODE='22023'; END IF;
 IF EXISTS(SELECT 1 FROM neon_auth."user" u WHERE lower(u.email)=v_email)
 THEN RAISE EXCEPTION 'conta ja cadastrada' USING ERRCODE='23514'; END IF;
 IF (SELECT count(*) FROM missao.convites_responsaveis c WHERE c.status='pendente')>=30
 THEN RAISE EXCEPTION 'limite do piloto' USING ERRCODE='23514'; END IF;
 RETURN QUERY
 INSERT INTO missao.convites_responsaveis AS c(email,criado_por)
 VALUES(v_email,p_user_id)
 RETURNING c.id,c.email,'pendente'::text,c.criado_em,c.expira_em;
END;
$body$;

CREATE OR REPLACE FUNCTION missao_api.cancelar_convite_responsavel(p_user_id text,p_id uuid)
 RETURNS boolean
 LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,missao
 AS $body$
DECLARE v_email text;
BEGIN
 IF NOT EXISTS(SELECT 1 FROM missao.administradores a WHERE a.auth_user_id=p_user_id AND a.ativo)
 THEN RAISE EXCEPTION 'acesso negado' USING ERRCODE='42501'; END IF;
 SELECT c.email INTO v_email FROM missao.convites_responsaveis c
  WHERE c.id=p_id AND c.status='pendente' FOR UPDATE;
 IF NOT FOUND THEN RETURN false; END IF;
 IF EXISTS(SELECT 1 FROM neon_auth."user" u WHERE lower(u.email)=v_email)
 THEN RAISE EXCEPTION 'conta existente deve ser gerenciada no Neon Auth' USING ERRCODE='23514'; END IF;
 UPDATE missao.convites_responsaveis c SET status='cancelado', atualizado_em=clock_timestamp()
 WHERE c.id=p_id;
 RETURN true;
END;
$body$;

REVOKE ALL ON FUNCTION missao_api.listar_convites_responsaveis(text) FROM PUBLIC;
REVOKE ALL ON FUNCTION missao_api.criar_convite_responsavel(text,text) FROM PUBLIC;
REVOKE ALL ON FUNCTION missao_api.cancelar_convite_responsavel(text,uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION missao_api.listar_convites_responsaveis(text) TO missao_api_user;
GRANT EXECUTE ON FUNCTION missao_api.criar_convite_responsavel(text,text) TO missao_api_user;
GRANT EXECUTE ON FUNCTION missao_api.cancelar_convite_responsavel(text,uuid) TO missao_api_user;
