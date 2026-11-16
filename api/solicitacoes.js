import {neon} from '@neondatabase/serverless';
import {createRemoteJWKSet,jwtVerify} from 'jose';
import {extrairBearer,respostaJson} from './_helpers.js';
import {TIPOS_SOLICITACAO,validarTexto} from './_fase3-helpers.js';
const db=process.env.DATABASE_URL,base=process.env.NEON_AUTH_BASE_URL,jwks=process.env.NEON_AUTH_JWKS_URL;
const ready=Boolean(db&&base?.startsWith('https://')&&jwks?.startsWith('https://'));
const sql=ready?neon(db):null,keys=ready?createRemoteJWKSet(new URL(jwks)):null;
export default async function handler(req,res){
 if(!['GET','POST'].includes(req.method))return respostaJson(res,405,{erro:'Método não permitido.'});
 if(!ready)return respostaJson(res,503,{erro:'Serviço de solicitações indisponível.'});
 const t=extrairBearer(req.headers.authorization);
 if(!t)return respostaJson(res,401,{erro:'Entre como responsável.'});
 let id;
 try{const {payload}=await jwtVerify(t,keys,{issuer:new URL(base).origin});id=payload.sub;}
 catch{return respostaJson(res,401,{erro:'Sessão inválida.'});}
 if(typeof id!=='string'||id.length<1||id.length>200)return respostaJson(res,401,{erro:'Sessão inválida.'});
 try{
  if(req.method==='GET'){
   const r=await sql`SELECT * FROM missao_api.minhas_solicitacoes(${id})`;
   return respostaJson(res,200,{solicitacoes:r});
  }
  if(Number(req.headers['content-length']||0)>1100)return respostaJson(res,413,{erro:'Solicitação grande demais.'});
  let data;
  try{data=typeof req.body==='string'?JSON.parse(req.body):req.body;}catch{return respostaJson(res,400,{erro:'JSON inválido.'});}
  if(!data||typeof data!=='object'||Array.isArray(data)||JSON.stringify(data).length>1100)
   return respostaJson(res,400,{erro:'Dados inválidos.'});
  if(!TIPOS_SOLICITACAO.has(data.tipo))return respostaJson(res,422,{erro:'Escolha o assunto da solicitação.'});
  const descricao=validarTexto(data.descricao,10,600);
  if(!descricao)return respostaJson(res,422,{erro:'Informe uma descrição de 10 a 600 caracteres.'});
  const r=await sql`SELECT * FROM missao_api.criar_solicitacao(${id},${data.tipo},${descricao})`;
  return respostaJson(res,201,{solicitacao:r[0]});
 }catch(err){
  console.error('solicitacoes-api',{code:err?.code||'UNKNOWN'});
  if(err?.code==='42501')return respostaJson(res,403,{erro:'Conta não autorizada.'});
  if(err?.code==='23514')return respostaJson(res,429,{erro:'Limite temporário de solicitações atingido. Consulte seu histórico.'});
  if(err?.code==='22023')return respostaJson(res,422,{erro:'Solicitação inválida.'});
  return respostaJson(res,500,{erro:'Não foi possível registrar sua solicitação.'});
 }
}
