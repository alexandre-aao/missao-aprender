import {neon} from '@neondatabase/serverless';
import {createRemoteJWKSet,jwtVerify} from 'jose';
import {extrairBearer,respostaJson,validarId} from './_helpers.js';
import {MODOS,STATUS_SOLICITACAO,validarTexto,validarAviso,validarPaginacao} from './_fase3-helpers.js';

const db=process.env.DATABASE_URL,base=process.env.NEON_AUTH_BASE_URL,jwks=process.env.NEON_AUTH_JWKS_URL;
const ready=Boolean(db&&base?.startsWith('https://')&&jwks?.startsWith('https://'));
const sql=ready?neon(db):null,keys=ready?createRemoteJWKSet(new URL(jwks)):null;
export default async function handler(req,res){
 if(!['GET','PATCH','POST'].includes(req.method))return respostaJson(res,405,{erro:'Método não permitido.'});
 if(!ready)return respostaJson(res,503,{erro:'Administração não configurada.'});
 const bearer=extrairBearer(req.headers.authorization);
 if(!bearer)return respostaJson(res,401,{erro:'Entre para continuar.'});
 let user;
 try{const {payload}=await jwtVerify(bearer,keys,{issuer:new URL(base).origin});user=payload.sub;}
 catch{return respostaJson(res,401,{erro:'Sessão inválida.'});}
 if(typeof user!=='string'||user.length<1||user.length>200)return respostaJson(res,401,{erro:'Sessão inválida.'});
 try{
  const roles=await sql`SELECT missao_api.meu_papel(${user}) AS papel`;
  if(roles[0]?.papel!=='administrador')return respostaJson(res,403,{erro:'Acesso exclusivo do Administrador Geral.'});
  if(req.method==='GET'){
   const params=new URL(req.url,'https://internal.invalid').searchParams;
   const tipo=params.get('tipo')||'configuracao';
   if(tipo==='configuracao'){
    const r=await sql`SELECT * FROM missao_api.configuracao_admin(${user})`;
    return respostaJson(res,200,{configuracao:r[0]||null});
   }
   if(tipo==='saude'){
    const start=Date.now();
    const r=await sql`SELECT * FROM missao_api.saude_administrativa(${user})`;
    return respostaJson(res,200,{saude:r[0]||null,consulta_ms:Date.now()-start,observacao:'Conectividade e contagens pontuais; não representam disponibilidade histórica ou monitoramento de erros da Vercel.'});
   }
   if(tipo==='auditoria'){
    const r=await sql`SELECT * FROM missao_api.auditoria_unificada_admin(${user},50::integer)`;
    return respostaJson(res,200,{auditoria:r});
   }
   if(tipo==='solicitacoes'){
    const estado=params.get('estado')||'todos',pagination=validarPaginacao(params.get('limite')||'20',params.get('offset')||'0');
    if(!['todos',...STATUS_SOLICITACAO].includes(estado)||!pagination)return respostaJson(res,422,{erro:'Filtros inválidos.'});
    const r=await sql`SELECT * FROM missao_api.listar_solicitacoes_admin(${user},${estado},${pagination.limite}::integer,${pagination.offset}::integer)`;
    return respostaJson(res,200,{solicitacoes:r,total:Number(r[0]?.total_registros||0)});
   }
   return respostaJson(res,422,{erro:'Consulta desconhecida.'});
  }
  if(Number(req.headers['content-length']||0)>2048)return respostaJson(res,413,{erro:'Requisição grande demais.'});
  let dados;
  try{dados=typeof req.body==='string'?JSON.parse(req.body):req.body;}catch{return respostaJson(res,400,{erro:'JSON inválido.'});}
  if(!dados||typeof dados!=='object'||Array.isArray(dados)||JSON.stringify(dados).length>2048)
   return respostaJson(res,400,{erro:'Dados inválidos.'});
  const motivo=validarTexto(dados.motivo,10,200);
  if(!motivo)return respostaJson(res,422,{erro:'Justificativa entre 10 e 200 caracteres obrigatória.'});
  if(req.method==='PATCH'&&dados.acao==='configuracao'){
   const modo=dados.modo,aviso=validarAviso(dados.aviso_publico);
   if(!MODOS.has(modo)||aviso===null)return respostaJson(res,422,{erro:'Modo ou aviso inválido.'});
   const r=await sql`SELECT missao_api.alterar_configuracao_admin(${user},${modo},${aviso},${motivo}) AS alterado`;
   return respostaJson(res,200,{alterado:r[0]?.alterado===true});
  }
  if(req.method==='PATCH'&&dados.acao==='solicitacao'){
   if(!validarId(dados.id)||!['em_analise','respondida','concluida'].includes(dados.estado))
    return respostaJson(res,422,{erro:'Solicitação ou situação inválida.'});
   const resposta=validarTexto(dados.resposta,10,500);
   if(!resposta)return respostaJson(res,422,{erro:'Informe uma resposta de 10 a 500 caracteres.'});
   const r=await sql`SELECT missao_api.atualizar_solicitacao_admin(${user},${dados.id}::uuid,${dados.estado},${resposta},${motivo}) AS alterado`;
   if(!r[0]?.alterado)return respostaJson(res,404,{erro:'Solicitação não localizada.'});
   return respostaJson(res,200,{alterado:true});
  }
  if(req.method==='POST'&&dados.acao==='exportar_crianca'){
   if(!validarId(dados.id))return respostaJson(res,422,{erro:'Perfil inválido.'});
   const r=await sql`SELECT missao_api.exportar_crianca_admin(${user},${dados.id}::uuid,${motivo}) AS dados`;
   return respostaJson(res,200,{exportacao:r[0]?.dados});
  }
  return respostaJson(res,422,{erro:'Operação desconhecida.'});
 }catch(err){
  const code=err?.code||'UNKNOWN';console.error('fase3-admin',{code});
  if(code==='42501')return respostaJson(res,403,{erro:'Sem autorização.'});
  if(code==='23514')return respostaJson(res,409,{erro:'Estado já atualizado ou limite atingido.'});
  if(code==='22023')return respostaJson(res,422,{erro:'Dados inválidos ou perfil não encontrado.'});
  return respostaJson(res,500,{erro:'Não foi possível executar a operação administrativa.'});
 }
}
