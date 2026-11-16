import {neon} from '@neondatabase/serverless';
import {respostaJson} from './_helpers.js';
import {MAPA_MISSOES_PEDAGOGICAS} from './_catalogo-pedagogico.js';
const database=process.env.DATABASE_URL;
const sql=database?neon(database):null;
export default async function handler(req,res){
 if(req.method!=='GET')return respostaJson(res,405,{erro:'Método não permitido.'});
 if(!sql)return respostaJson(res,503,{erro:'Serviço indisponível.'});
 try{
  const rows=await sql`SELECT id FROM missao_api.missoes_ocultas_publicas()`;
  return respostaJson(res,200,{ocultas:rows.map(x=>x.id).filter(id=>MAPA_MISSOES_PEDAGOGICAS.has(id))});
 }catch(e){
  console.error('visibilidade-catalogo',{code:e?.code||'UNKNOWN'});
  return respostaJson(res,503,{erro:'Não foi possível consultar o catálogo.'});
 }
}
