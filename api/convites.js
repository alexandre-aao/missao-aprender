import { neon } from '@neondatabase/serverless';
import { createRemoteJWKSet, jwtVerify } from 'jose';
import { extrairBearer, respostaJson, validarEmailConvite, validarId } from './_helpers.js';

const url = process.env.DATABASE_URL;
const authBase = process.env.NEON_AUTH_BASE_URL;
const jwksURL = process.env.NEON_AUTH_JWKS_URL;
const pronto = Boolean(url && authBase?.startsWith('https://') && jwksURL?.startsWith('https://'));
const sql = pronto ? neon(url) : null;
const keys = pronto ? createRemoteJWKSet(new URL(jwksURL)) : null;

export default async function handler(req, res) {
  if (!['GET', 'POST', 'DELETE'].includes(req.method)) return respostaJson(res,405,{erro:'Metodo nao permitido.'});
  if (!pronto) return respostaJson(res,503,{erro:'Servico indisponivel.'});
  const bearer = extrairBearer(req.headers.authorization);
  if (!bearer) return respostaJson(res,401,{erro:'Autenticacao necessaria.'});
  let userId;
  try {
    const {payload} = await jwtVerify(bearer,keys,{issuer:new URL(authBase).origin});
    userId = payload.sub;
  } catch { return respostaJson(res,401,{erro:'Autenticacao invalida.'}); }
  if (typeof userId!=='string' || userId.length===0 || userId.length>200) return respostaJson(res,401,{erro:'Autenticacao invalida.'});
  try {
    const role = await sql`SELECT missao_api.meu_papel(${userId}) AS papel`;
    if (role[0]?.papel!=='administrador') return respostaJson(res,403,{erro:'Acesso exclusivo do administrador.'});
    if (req.method==='GET') {
      const rows = await sql`SELECT * FROM missao_api.listar_convites_responsaveis(${userId})`;
      return respostaJson(res,200,{convites:rows});
    }
    let body;
    try { body = typeof req.body==='string' ? JSON.parse(req.body) : req.body; }
    catch { return respostaJson(res,400,{erro:'Dados invalidos.'}); }
    if (!body || typeof body!=='object' || Array.isArray(body) || JSON.stringify(body).length>1024) return respostaJson(res,400,{erro:'Dados invalidos.'});
    if (req.method==='POST') {
      const email = validarEmailConvite(body.email);
      if (!email) return respostaJson(res,422,{erro:'Informe um e-mail valido do responsavel.'});
      const rows = await sql`SELECT * FROM missao_api.criar_convite_responsavel(${userId},${email})`;
      return respostaJson(res,201,{convite:rows[0]});
    }
    if (!validarId(body.id)) return respostaJson(res,422,{erro:'Convite invalido.'});
    const rows = await sql`SELECT missao_api.cancelar_convite_responsavel(${userId},${body.id}::uuid) AS cancelado`;
    return rows[0]?.cancelado ? respostaJson(res,200,{cancelado:true}) : respostaJson(res,404,{erro:'Convite pendente nao encontrado.'});
  } catch (err) {
    console.error('convites-api',{code:err?.code||'UNKNOWN'});
    if (err?.code==='42501') return respostaJson(res,403,{erro:'Sem permissao.'});
    if (err?.code==='23505') return respostaJson(res,409,{erro:'Ja existe convite pendente para este e-mail.'});
    if (err?.code==='23514') return respostaJson(res,409,{erro:'Verifique o limite do piloto ou a existencia de uma conta.'});
    if (err?.code==='22023') return respostaJson(res,422,{erro:'Dados invalidos.'});
    return respostaJson(res,500,{erro:'Nao foi possivel gerenciar os convites.'});
  }
}
