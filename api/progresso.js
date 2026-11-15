import { neon } from '@neondatabase/serverless';
import { createRemoteJWKSet, jwtVerify } from 'jose';
import { validarId, extrairBearer, respostaJson } from './_helpers.js';
import { normalizarEstado, MAX_BYTES } from '../sync-core.js';

const dbURL=process.env.DATABASE_URL,authURL=process.env.NEON_AUTH_BASE_URL,jwksURL=process.env.NEON_AUTH_JWKS_URL;
const ready=Boolean(dbURL&&authURL?.startsWith('https://')&&jwksURL?.startsWith('https://'));
const sql=ready?neon(dbURL):null;
const keys=ready?createRemoteJWKSet(new URL(jwksURL)):null;
async function subject(req){
 const token=extrairBearer(req.headers.authorization);
 if(!token)return null;
 try{
  const {payload}=await jwtVerify(token,keys,{issuer:new URL(authURL).origin});
  return typeof payload.sub==='string'&&payload.sub.length>0&&payload.sub.length<=200?payload.sub:null;
 }catch{return null}
}
export default async function handler(req,res){
 if(!['GET','PUT'].includes(req.method))return respostaJson(res,405,{erro:'Método não permitido.'});
 if(!ready)return respostaJson(res,503,{erro:'Serviço indisponível.'});
 const user=await subject(req);
 if(!user)return respostaJson(res,401,{erro:'Entre como responsável para sincronizar.'});
 try{
  if(req.method==='GET'){
   const id=new URL(req.url,'https://internal.invalid').searchParams.get('perfil_id');
   if(!validarId(id))return respostaJson(res,422,{erro:'Perfil inválido.'});
   const rows=await sql`SELECT * FROM missao_api.ler_progresso(${user},${id}::uuid)`;
   const item=rows[0]||{};
   return respostaJson(res,200,{perfil_id:id,revisao:Number(item.revisao||0),estado:item.estado||null,atualizado_em:item.atualizado_em||null});
  }
  // O limite protege o banco e a função serverless contra histórico arbitrário.
  const size=Number(req.headers['content-length']||0);
  if(size>MAX_BYTES+5000)return respostaJson(res,413,{erro:'Histórico grande demais.'});
  const payload=typeof req.body==='string'?JSON.parse(req.body):req.body;
  if(!payload||!validarId(payload.perfil_id)||!Number.isSafeInteger(payload.revisao_esperada)||payload.revisao_esperada<0)
   return respostaJson(res,422,{erro:'Identificação ou revisão inválida.'});
  const state=normalizarEstado(payload.estado);
  const rows=await sql`SELECT * FROM missao_api.salvar_progresso(${user},${payload.perfil_id}::uuid,${payload.revisao_esperada}::bigint,${JSON.stringify(state)}::jsonb)`;
  return respostaJson(res,200,{perfil_id:payload.perfil_id,revisao:Number(rows[0]?.revisao),atualizado_em:rows[0]?.atualizado_em});
 }catch(err){
  const code=err?.code||'';
  if(code==='42501')return respostaJson(res,403,{erro:'Perfil não autorizado.'});
  if(code==='40001')return respostaJson(res,409,{erro:'O progresso mudou em outro aparelho. Atualize e mescle antes de salvar.'});
  if(code==='22023'||err instanceof TypeError||err instanceof SyntaxError)return respostaJson(res,422,{erro:'Dados de aprendizagem inválidos.'});
  console.error('progress-api-error',{code:code||'UNEXPECTED'});
  return respostaJson(res,500,{erro:'Falha ao sincronizar. Os dados locais permanecem salvos.'});
 }
}
