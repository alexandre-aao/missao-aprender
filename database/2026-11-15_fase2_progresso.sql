-- Fase 2: estado da aprendizagem por perfil infantil. Executar APENAS na branch Neon de homologação.
-- Snapshot versionado: as tabelas progresso_atividades/tentativas continuam reservadas para eventos validados no servidor.
CREATE TABLE IF NOT EXISTS missao.estados_aprendizagem (
  crianca_id uuid PRIMARY KEY REFERENCES missao.perfis_infantis(id) ON DELETE CASCADE,
  revisao bigint NOT NULL DEFAULT 0 CHECK (revisao >= 0),
  estado jsonb NOT NULL CHECK (jsonb_typeof(estado)='object' AND octet_length(estado::text)<=524288),
  atualizado_em timestamptz NOT NULL DEFAULT now()
);
REVOKE ALL ON missao.estados_aprendizagem FROM PUBLIC, missao_api_user;
ALTER TABLE missao.estados_aprendizagem ENABLE ROW LEVEL SECURITY;
ALTER TABLE missao.estados_aprendizagem FORCE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION missao_api.ler_progresso(p_user_id text,p_crianca_id uuid)
 RETURNS TABLE(revisao bigint,estado jsonb,atualizado_em timestamptz)
 LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path=pg_catalog,missao
 AS $body$
BEGIN
 IF NOT EXISTS(SELECT 1 FROM missao.perfis_infantis p
 JOIN missao.responsaveis r ON r.id=p.responsavel_id
 WHERE p.id=p_crianca_id AND r.auth_user_id=p_user_id)
 THEN RAISE EXCEPTION 'acesso negado' USING ERRCODE='42501'; END IF;
 RETURN QUERY SELECT COALESCE(s.revisao,0::bigint),s.estado,s.atualizado_em
 FROM (SELECT 1) x LEFT JOIN missao.estados_aprendizagem s ON s.crianca_id=p_crianca_id;
END;
$body$;

CREATE OR REPLACE FUNCTION missao_api.salvar_progresso(p_user_id text,p_crianca_id uuid,p_revisao bigint,p_estado jsonb)
 RETURNS TABLE(revisao bigint,atualizado_em timestamptz)
 LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,missao
 AS $body$
BEGIN
 IF NOT EXISTS(SELECT 1 FROM missao.perfis_infantis p
 JOIN missao.responsaveis r ON r.id=p.responsavel_id
 WHERE p.id=p_crianca_id AND r.auth_user_id=p_user_id)
 THEN RAISE EXCEPTION 'acesso negado' USING ERRCODE='42501'; END IF;
 IF p_revisao IS NULL OR p_revisao<0 OR p_estado IS NULL OR jsonb_typeof(p_estado)!='object'
    OR octet_length(p_estado::text)>524288 OR p_estado->>'version'!='2'
 THEN RAISE EXCEPTION 'estado invalido' USING ERRCODE='22023'; END IF;
 IF p_revisao=0 THEN
   RETURN QUERY INSERT INTO missao.estados_aprendizagem AS s(crianca_id,revisao,estado,atualizado_em)
    VALUES(p_crianca_id,1,p_estado,clock_timestamp())
    ON CONFLICT(crianca_id) DO NOTHING RETURNING s.revisao,s.atualizado_em;
 ELSE
   RETURN QUERY UPDATE missao.estados_aprendizagem AS s
    SET revisao=s.revisao+1,estado=p_estado,atualizado_em=clock_timestamp()
    WHERE s.crianca_id=p_crianca_id AND s.revisao=p_revisao
    RETURNING s.revisao,s.atualizado_em;
 END IF;
 IF NOT FOUND THEN RAISE EXCEPTION 'conflito de revisao' USING ERRCODE='40001'; END IF;
END;
$body$;
REVOKE ALL ON FUNCTION missao_api.ler_progresso(text,uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION missao_api.salvar_progresso(text,uuid,bigint,jsonb) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION missao_api.ler_progresso(text,uuid) TO missao_api_user;
GRANT EXECUTE ON FUNCTION missao_api.salvar_progresso(text,uuid,bigint,jsonb) TO missao_api_user;
