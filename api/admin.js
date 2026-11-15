import { neon } from '@neondatabase/serverless';
import { createRemoteJWKSet, jwtVerify } from 'jose';

const dbURL=process.env.DATABASE_URL;
const authBase=process.env.NEON_AUTH_BASE_URL;
const jwksURL=process.env.NEON_AUTH_JWKS_URL;
const ready=Boolean(dbURL&&authBase?.startsWith('https://')&&jwksURL?.startsWith('https://'));
const sql=ready?neon(dbURL):null;
const keys=ready?createRemoteJWKSet(new URL(jwksURL)):null;
function send(res,status,body){res.setHeader('Cache-Control','no-store,private');res.setHeader('X-Content-Type-Options','nosniff');res.status(status).json(body);}
export default async function handler(req,res){
 if(req.method!=='GET')return send(res,405,{erro:'Método não permitido.'});
 if(!ready)return send(res,503,{erro:'Serviço indisponível.'});
 const match=/^Bearer ([A-Za-z0-9_.-]+)$/.exec(String(req.headers.authorization||''));
 if(!match)return send(res,401,{erro:'Autenticação necessária.'});
 let subject;
 try{const {payload}=await jwtVerify(match[1],keys,{issuer:new URL(authBase).origin});subject=payload.sub;}catch{return send(res,401,{erro:'Autenticação inválida.'});}
 if(typeof subject!=='string'||subject.length>200)return send(res,401,{erro:'Autenticação inválida.'});
 try{
  const role=await sql`SELECT missao_api.meu_papel(${subject}) AS papel`;
  if(role[0]?.papel!=='administrador')return send(res,403,{erro:'Acesso exclusivo do administrador.'});
  const rows=await sql`SELECT * FROM missao_api.painel_administrador(${subject})`;
  const r=rows[0]||{};
  return send(res,200,{papel:'administrador',estatisticas:{responsaveis:Number(r.total_responsaveis||0),perfis:Number(r.total_perfis||0),atividades:Number(r.total_atividades||0),grupos:Number(r.total_grupos||0),desafios:Number(r.total_desafios||0)}});
 }catch(err){console.error('admin-api',{code:err?.code||'UNKNOWN'});return send(res,500,{erro:'Não foi possível carregar o painel.'});}
}
