-- Fase 2: relatórios agregados e gestão editorial das 140 missões.
-- Executar PRIMEIRO em branch Neon de homologação; não altera dados de progresso.
CREATE TABLE IF NOT EXISTS missao.controles_catalogo (
 id text PRIMARY KEY CHECK (length(id) BETWEEN 2 AND 60 AND id ~ '^[a-z0-9-]+$'),
 oculto boolean NOT NULL DEFAULT false,
 revisao_pendente boolean NOT NULL DEFAULT false,
 motivo text NOT NULL DEFAULT '',
 alterado_por text NOT NULL,
 alterado_em timestamptz NOT NULL DEFAULT clock_timestamp()
);
REVOKE ALL ON missao.controles_catalogo FROM PUBLIC,missao_api_user;
ALTER TABLE missao.controles_catalogo ENABLE ROW LEVEL SECURITY;
ALTER TABLE missao.controles_catalogo FORCE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS missao.auditoria_catalogo (
 id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
 administrador_id text NOT NULL,
 missao_id text NOT NULL,
 acao text NOT NULL CHECK (acao IN ('ocultar','mostrar','sinalizar','resolver')),
 justificativa text NOT NULL CHECK (length(justificativa) BETWEEN 10 AND 200),
 criado_em timestamptz NOT NULL DEFAULT clock_timestamp()
);
CREATE INDEX IF NOT EXISTS idx_auditoria_catalogo_recente ON missao.auditoria_catalogo(criado_em DESC,id DESC);
REVOKE ALL ON missao.auditoria_catalogo FROM PUBLIC,missao_api_user;
ALTER TABLE missao.auditoria_catalogo ENABLE ROW LEVEL SECURITY;
ALTER TABLE missao.auditoria_catalogo FORCE ROW LEVEL SECURITY;

-- Medidas de sincronizacao, nao de uso anonimo nem de logins.
CREATE OR REPLACE FUNCTION missao_api.resumo_pedagogico_admin(p_admin text)
 RETURNS TABLE(perfis_total bigint,perfis_sincronizados bigint,perfis_sem_sincronizacao bigint,
 sinc_7d bigint,sinc_30d bigint,ultima_sincronizacao timestamptz)
 LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path=pg_catalog,missao
 AS $fn$
BEGIN
 IF NOT EXISTS(SELECT 1 FROM missao.administradores WHERE auth_user_id=p_admin AND ativo)
 THEN RAISE EXCEPTION 'acesso negado' USING ERRCODE='42501'; END IF;
 RETURN QUERY SELECT
 (SELECT count(*) FROM missao.perfis_infantis),
 (SELECT count(*) FROM missao.estados_aprendizagem),
 (SELECT count(*) FROM missao.perfis_infantis)-(SELECT count(*) FROM missao.estados_aprendizagem),
 (SELECT count(*) FROM missao.estados_aprendizagem WHERE atualizado_em>=now()-interval '7 days'),
 (SELECT count(*) FROM missao.estados_aprendizagem WHERE atualizado_em>=now()-interval '30 days'),
 (SELECT max(atualizado_em) FROM missao.estados_aprendizagem);
END;
$fn$;

-- Agregacoes por missao; NUNCA devolve snapshot ou identificador da crianca.
-- Concluida: registrado em missions OU skill mastered, por perfil unico.
-- Registros: eventos do snapshot versionado, e nao tentativas autenticadas em servidor.
CREATE OR REPLACE FUNCTION missao_api.indicadores_missoes_admin(p_admin text)
 RETURNS TABLE(
 id text,concluintes bigint,estrelas bigint,eventos bigint,primeira_tentativa bigint,
 erros bigint,tentativas_habilidade bigint,acertos_habilidade bigint
 )
 LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path=pg_catalog,missao
 AS $fn$
BEGIN
 IF NOT EXISTS(SELECT 1 FROM missao.administradores WHERE auth_user_id=p_admin AND ativo)
 THEN RAISE EXCEPTION 'acesso negado' USING ERRCODE='42501'; END IF;
 RETURN QUERY
 WITH concluido AS (
  SELECT e.crianca_id,m.key AS mid FROM missao.estados_aprendizagem e
    CROSS JOIN LATERAL jsonb_each(COALESCE(e.estado->'missions','{}'::jsonb)) m
  UNION
  SELECT e.crianca_id,s.key FROM missao.estados_aprendizagem e
    CROSS JOIN LATERAL jsonb_each(COALESCE(e.estado->'skills','{}'::jsonb)) s
    WHERE s.value->>'mastered'='true'
 ), c AS (
  SELECT mid,count(*)::bigint n FROM concluido GROUP BY mid
 ), stars AS (
  SELECT m.key AS mid,sum(COALESCE((m.value->>'stars')::integer,0))::bigint n
  FROM missao.estados_aprendizagem e
  CROSS JOIN LATERAL jsonb_each(COALESCE(e.estado->'missions','{}'::jsonb)) m GROUP BY m.key
 ), events AS (
  SELECT x.rec->>'id' AS mid,count(*)::bigint n,
    count(*) FILTER(WHERE x.rec->>'firstTry'='true')::bigint primeira,
    sum(COALESCE((x.rec->>'errors')::integer,0))::bigint total_erros
  FROM missao.estados_aprendizagem e
  CROSS JOIN LATERAL jsonb_array_elements(COALESCE(e.estado->'records','[]'::jsonb)) x(rec)
  GROUP BY x.rec->>'id'
 ), skills AS (
  SELECT s.key AS mid,
    sum(COALESCE((s.value->>'tries')::integer,0))::bigint tries,
    sum(COALESCE((s.value->>'correct')::integer,0))::bigint correct
  FROM missao.estados_aprendizagem e
  CROSS JOIN LATERAL jsonb_each(COALESCE(e.estado->'skills','{}'::jsonb)) s
  GROUP BY s.key
 ), todos AS (
  SELECT c.mid FROM c UNION SELECT stars.mid FROM stars UNION SELECT events.mid FROM events UNION SELECT skills.mid FROM skills
 )
 SELECT t.mid,COALESCE(c.n,0),COALESCE(stars.n,0),COALESCE(events.n,0),
 COALESCE(events.primeira,0),COALESCE(events.total_erros,0),COALESCE(skills.tries,0),
 COALESCE(skills.correct,0)
 FROM todos t LEFT JOIN c ON c.mid=t.mid LEFT JOIN stars ON stars.mid=t.mid
 LEFT JOIN events ON events.mid=t.mid LEFT JOIN skills ON skills.mid=t.mid;
END;
$fn$;

CREATE OR REPLACE FUNCTION missao_api.controles_catalogo_admin(p_admin text)
 RETURNS TABLE(id text,oculto boolean,revisao_pendente boolean,motivo text,alterado_em timestamptz)
 LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path=pg_catalog,missao
 AS $fn$
BEGIN
 IF NOT EXISTS(SELECT 1 FROM missao.administradores WHERE auth_user_id=p_admin AND ativo)
 THEN RAISE EXCEPTION 'acesso negado' USING ERRCODE='42501'; END IF;
 RETURN QUERY SELECT c.id,c.oculto,c.revisao_pendente,c.motivo,c.alterado_em
 FROM missao.controles_catalogo c;
END;
$fn$;

CREATE OR REPLACE FUNCTION missao_api.historico_catalogo_admin(p_admin text,p_limite integer DEFAULT 20)
 RETURNS TABLE(id bigint,missao_id text,acao text,justificativa text,criado_em timestamptz)
 LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path=pg_catalog,missao
 AS $fn$
BEGIN
 IF NOT EXISTS(SELECT 1 FROM missao.administradores WHERE auth_user_id=p_admin AND ativo)
 THEN RAISE EXCEPTION 'acesso negado' USING ERRCODE='42501'; END IF;
 IF p_limite NOT BETWEEN 1 AND 50 THEN RAISE EXCEPTION 'limite invalido' USING ERRCODE='22023'; END IF;
 RETURN QUERY SELECT h.id,h.missao_id,h.acao,h.justificativa,h.criado_em
 FROM missao.auditoria_catalogo h ORDER BY h.criado_em DESC,h.id DESC LIMIT p_limite;
END;
$fn$;

CREATE OR REPLACE FUNCTION missao_api.alterar_catalogo_admin(
 p_admin text,p_id text,p_acao text,p_motivo text)
 RETURNS boolean
 LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,missao
 AS $fn$
DECLARE v_oculto boolean;v_revisao boolean;
BEGIN
 IF NOT EXISTS(SELECT 1 FROM missao.administradores WHERE auth_user_id=p_admin AND ativo)
 THEN RAISE EXCEPTION 'acesso negado' USING ERRCODE='42501'; END IF;
 IF p_id IS NULL OR length(p_id) NOT BETWEEN 2 AND 60 OR p_id !~ '^[a-z0-9-]+$'
 OR p_acao NOT IN ('ocultar','mostrar','sinalizar','resolver')
 OR p_motivo IS NULL OR length(btrim(p_motivo)) NOT BETWEEN 10 AND 200
 THEN RAISE EXCEPTION 'dados invalidos' USING ERRCODE='22023'; END IF;
 SELECT c.oculto,c.revisao_pendente INTO v_oculto,v_revisao
 FROM missao.controles_catalogo c WHERE c.id=p_id FOR UPDATE;
 IF v_oculto IS NULL THEN v_oculto:=false; END IF;
 IF v_revisao IS NULL THEN v_revisao:=false; END IF;
 IF (p_acao='ocultar' AND v_oculto) OR (p_acao='mostrar' AND NOT v_oculto)
 OR (p_acao='sinalizar' AND v_revisao) OR (p_acao='resolver' AND NOT v_revisao)
 THEN RAISE EXCEPTION 'situacao nao mudou' USING ERRCODE='23514'; END IF;
 INSERT INTO missao.controles_catalogo AS c(id,oculto,revisao_pendente,motivo,alterado_por,alterado_em)
 VALUES(p_id,CASE WHEN p_acao='ocultar' THEN true WHEN p_acao='mostrar' THEN false ELSE v_oculto END,
 CASE WHEN p_acao='sinalizar' THEN true WHEN p_acao='resolver' THEN false ELSE v_revisao END,
 btrim(p_motivo),p_admin,clock_timestamp())
 ON CONFLICT(id) DO UPDATE SET
 oculto=EXCLUDED.oculto,revisao_pendente=EXCLUDED.revisao_pendente,motivo=EXCLUDED.motivo,
 alterado_por=EXCLUDED.alterado_por,alterado_em=EXCLUDED.alterado_em;
 INSERT INTO missao.auditoria_catalogo(administrador_id,missao_id,acao,justificativa)
 VALUES(p_admin,p_id,p_acao,btrim(p_motivo));
 RETURN true;
END;
$fn$;

-- Funcao publica APENAS com IDs ocultos. Nenhum dado infantil.
CREATE OR REPLACE FUNCTION missao_api.missoes_ocultas_publicas()
 RETURNS TABLE(id text)
 LANGUAGE sql STABLE SECURITY DEFINER SET search_path=pg_catalog,missao
 AS $fn$
 SELECT c.id FROM missao.controles_catalogo c WHERE c.oculto ORDER BY c.id;
$fn$;

REVOKE ALL ON FUNCTION missao_api.resumo_pedagogico_admin(text) FROM PUBLIC;
REVOKE ALL ON FUNCTION missao_api.indicadores_missoes_admin(text) FROM PUBLIC;
REVOKE ALL ON FUNCTION missao_api.controles_catalogo_admin(text) FROM PUBLIC;
REVOKE ALL ON FUNCTION missao_api.historico_catalogo_admin(text,integer) FROM PUBLIC;
REVOKE ALL ON FUNCTION missao_api.alterar_catalogo_admin(text,text,text,text) FROM PUBLIC;
REVOKE ALL ON FUNCTION missao_api.missoes_ocultas_publicas() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION missao_api.resumo_pedagogico_admin(text) TO missao_api_user;
GRANT EXECUTE ON FUNCTION missao_api.indicadores_missoes_admin(text) TO missao_api_user;
GRANT EXECUTE ON FUNCTION missao_api.controles_catalogo_admin(text) TO missao_api_user;
GRANT EXECUTE ON FUNCTION missao_api.historico_catalogo_admin(text,integer) TO missao_api_user;
GRANT EXECUTE ON FUNCTION missao_api.alterar_catalogo_admin(text,text,text,text) TO missao_api_user;
GRANT EXECUTE ON FUNCTION missao_api.missoes_ocultas_publicas() TO missao_api_user;
