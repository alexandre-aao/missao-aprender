import { neon } from '@neondatabase/serverless';
import { createRemoteJWKSet, jwtVerify } from 'jose';
import { validarPerfil, validarId, autorizadoParaCriar, extrairBearer, respostaJson } from './_helpers.js';

// A DATABASE_URL deve pertencer exclusivamente a missao_api_user na branch de desenvolvimento.
// A role nao tem SELECT direto nas tabelas; apenas EXECUTE nas funcoes com escopo por responsavel.
const url = process.env.DATABASE_URL;
const authBase = process.env.NEON_AUTH_BASE_URL;
const jwksUrl = process.env.NEON_AUTH_JWKS_URL;
const pronto = Boolean(url && authBase?.startsWith('https://') && jwksUrl?.startsWith('https://'));
const sql = pronto ? neon(url) : null;
const jwks = pronto ? createRemoteJWKSet(new URL(jwksUrl)) : null;

async function identidadeAutenticada(req) {
  const bearer = extrairBearer(req.headers.authorization);
  if (!bearer || !pronto) return null;
  try {
    const { payload } = await jwtVerify(bearer, jwks, { issuer: new URL(authBase).origin });
    return typeof payload.sub === 'string' && payload.sub.length > 0 && payload.sub.length <= 200 ? payload.sub : null;
  } catch { return null; }
}

export default async function handler(req, res) {
  if (!['GET', 'POST', 'PATCH', 'DELETE'].includes(req.method)) return respostaJson(res, 405, { erro: 'Metodo nao permitido.' });
  if (!pronto) return respostaJson(res, 503, { erro: 'Servidor nao configurado.' });
  const usuario = await identidadeAutenticada(req);
  if (!usuario) return respostaJson(res, 401, { erro: 'Entre como responsavel.' });

  try {
    if (req.method === 'GET') {
      const rows = await sql`SELECT * FROM missao_api.listar_perfis(${usuario})`;
      return respostaJson(res, 200, { perfis: rows });
    }

    const dados = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    if (!dados || typeof dados !== 'object' || Array.isArray(dados)) return respostaJson(res, 400, { erro: 'Dados invalidos.' });
    if (JSON.stringify(dados).length > 4096) return respostaJson(res, 413, { erro: 'Limite de dados excedido.' });

    if (req.method === 'DELETE') {
      if (dados.confirmar_exclusao !== true || !validarId(dados.id)) return respostaJson(res, 422, { erro: 'ID e confirmacao sao obrigatorios.' });
      const rows = await sql`SELECT * FROM missao_api.excluir_perfil(${usuario}, ${dados.id}::uuid)`;
      return rows.length ? respostaJson(res, 200, { excluido: true }) : respostaJson(res, 404, { erro: 'Perfil nao encontrado.' });
    }

    const perfil = validarPerfil(dados);
    if (perfil.error) return respostaJson(res, 422, { erro: perfil.error });
    if (req.method === 'POST') {
      if (!autorizadoParaCriar(dados)) return respostaJson(res, 422, { erro: 'Consentimento do responsavel obrigatorio.' });
      const rows = await sql`SELECT * FROM missao_api.criar_perfil(${usuario}, ${perfil.apelido}, ${perfil.avatar}, ${perfil.ano_escolar}::smallint, ${true}, ${true})`;
      return respostaJson(res, 201, { perfil: rows[0] });
    }

    if (!validarId(dados.id)) return respostaJson(res, 422, { erro: 'ID invalido.' });
    const rows = await sql`SELECT * FROM missao_api.editar_perfil(${usuario}, ${dados.id}::uuid, ${perfil.apelido}, ${perfil.avatar}, ${perfil.ano_escolar}::smallint)`;
    return rows.length ? respostaJson(res, 200, { perfil: rows[0] }) : respostaJson(res, 404, { erro: 'Perfil nao encontrado.' });
  } catch (err) {
    console.error('Falha no fluxo de perfis', { code: err?.code || 'UNKNOWN' });
    return respostaJson(res, err?.code === '23514' ? 409 : err?.code === '22023' ? 422 : 500, { erro: 'Nao foi possivel concluir a operacao.' });
  }
}
