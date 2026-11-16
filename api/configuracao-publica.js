import {neon} from '@neondatabase/serverless';
import {respostaJson} from './_helpers.js';
const sql=process.env.DATABASE_URL?neon(process.env.DATABASE_URL):null;
export default async function handler(req,res){
 if(req.method!=='GET')return respostaJson(res,405,{erro:'Método não permitido.'});
 if(!sql)return respostaJson(res,503,{erro:'Serviço temporariamente indisponível.'});
 try{
  const r=await sql`SELECT * FROM missao_api.configuracao_publica()`;
  if(!r[0])return respostaJson(res,503,{erro:'Configuração ausente.'});
  return respostaJson(res,200,{modo:r[0].modo,aviso:r[0].aviso_publico,atualizado_em:r[0].atualizado_em});
 }catch(e){
  console.error('configuracao-publica',{code:e?.code||'UNKNOWN'});
  return respostaJson(res,503,{erro:'Não foi possível consultar a configuração.'});
 }
}
