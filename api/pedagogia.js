import {neon} from '@neondatabase/serverless';
import {createRemoteJWKSet,jwtVerify} from 'jose';
import {extrairBearer,respostaJson} from './_helpers.js';
import {MAPA_MISSOES_PEDAGOGICAS} from './_catalogo-pedagogico.js';
import {ACOES_CATALOGO,justificarMudanca,indicadoresPedagogicos} from './_pedagogia-core.js';

const db=process.env.DATABASE_URL,auth=process.env.NEON_AUTH_BASE_URL,jwks=process.env.NEON_AUTH_JWKS_URL;
const ready=Boolean(db&&auth?.startsWith('https://')&&jwks?.startsWith('https://'));
const sql=ready?neon(db):null,keys=ready?createRemoteJWKSet(new URL(jwks)):null;

export default async function handler(req,res){
 if(!['GET','PATCH'].includes(req.method))return respostaJson(res,405,{erro:'Método não permitido.'});
 if(!ready)return respostaJson(res,503,{erro:'Serviço de gestão indisponível.'});
 const token=extrairBearer(req.headers.authorization);
 if(!token)return respostaJson(res,401,{erro:'Autenticação necessária.'});
 let admin;
 try{const {payload}=await jwtVerify(token,keys,{issuer:new URL(auth).origin});admin=payload.sub;}
 catch{return respostaJson(res,401,{erro:'Sessão inválida.'});}
 if(typeof admin!=='string'||admin.length<1||admin.length>200)return respostaJson(res,401,{erro:'Sessão inválida.'});
 try{
  const role=await sql`SELECT missao_api.meu_papel(${admin}) AS papel`;
  if(role[0]?.papel!=='administrador')return respostaJson(res,403,{erro:'Acesso exclusivo do Administrador Geral.'});
  if(req.method==='GET'){
   const tipo=new URL(req.url,'https://internal.invalid').searchParams.get('tipo')||'resumo';
   if(tipo==='auditoria'){
    const rows=await sql`SELECT * FROM missao_api.historico_catalogo_admin(${admin},20::integer)`;
    return respostaJson(res,200,{historico:rows});
   }
   if(tipo!=='resumo')return respostaJson(res,422,{erro:'Consulta desconhecida.'});
   const [sum,per,controls]=await Promise.all([
    sql`SELECT * FROM missao_api.resumo_pedagogico_admin(${admin})`,
    sql`SELECT * FROM missao_api.indicadores_missoes_admin(${admin})`,
    sql`SELECT * FROM missao_api.controles_catalogo_admin(${admin})`
   ]);
   return respostaJson(res,200,{...indicadoresPedagogicos(sum[0],per,controls),
    observacao:'Métricas dos perfis que sincronizaram; não incluem uso anônimo nem representam avaliação escolar.'});
  }
  const rawSize=Number(req.headers['content-length']||0);
  if(rawSize>1400)return respostaJson(res,413,{erro:'Requisição grande demais.'});
  let body;
  try{body=typeof req.body==='string'?JSON.parse(req.body):req.body;}catch{return respostaJson(res,400,{erro:'JSON inválido.'});}
  if(!body||typeof body!=='object'||Array.isArray(body)||JSON.stringify(body).length>1400)
   return respostaJson(res,400,{erro:'Dados inválidos.'});
  const {id,acao}=body,motivo=justificarMudanca(body.motivo);
  if(typeof id!=='string'||!MAPA_MISSOES_PEDAGOGICAS.has(id)||!ACOES_CATALOGO.has(acao)||!motivo)
   return respostaJson(res,422,{erro:'Missão, operação ou justificativa inválida.'});
  if(acao==='ocultar'){
   const active=await sql`SELECT * FROM missao_api.controles_catalogo_admin(${admin})`;
   if(active.filter(x=>x.oculto===true).length>=139)return respostaJson(res,409,{erro:'Mantenha pelo menos uma missão disponível.'});
  }
  const r=await sql`SELECT missao_api.alterar_catalogo_admin(${admin},${id},${acao},${motivo}) AS alterado`;
  return respostaJson(res,200,{alterado:r[0]?.alterado===true,id,acao});
 }catch(e){
  const code=e?.code||'UNKNOWN';console.error('pedagogia-api',{code});
  if(code==='42501')return respostaJson(res,403,{erro:'Sem autorização.'});
  if(code==='22023')return respostaJson(res,422,{erro:'Dados inválidos.'});
  if(code==='23514')return respostaJson(res,409,{erro:'O estado desta missão já está atualizado.'});
  return respostaJson(res,500,{erro:'Falha na gestão pedagógica.'});
 }
}
