import { neon } from '@neondatabase/serverless';
import { createRemoteJWKSet,jwtVerify } from 'jose';
import { validarId,validarPerfil,extrairBearer,respostaJson } from './_helpers.js';
import { validarBuscaAdmin,validarPaginacaoAdmin,validarJustificativaAdmin,validarStatusAdmin,validarAnoAdmin } from './_admin-helpers.js';

const db=process.env.DATABASE_URL,authBase=process.env.NEON_AUTH_BASE_URL,jwks=process.env.NEON_AUTH_JWKS_URL;
const pronto=Boolean(db&&authBase?.startsWith('https://')&&jwks?.startsWith('https://'));
const sql=pronto?neon(db):null, keys=pronto?createRemoteJWKSet(new URL(jwks)):null;

export default async function handler(req,res){
 if(!['GET','PATCH'].includes(req.method))return respostaJson(res,405,{erro:'Método não permitido.'});
 if(!pronto)return respostaJson(res,503,{erro:'Serviço indisponível.'});
 const bearer=extrairBearer(req.headers.authorization);
 if(!bearer)return respostaJson(res,401,{erro:'Autenticação necessária.'});
 let user;
 try{const {payload}=await jwtVerify(bearer,keys,{issuer:new URL(authBase).origin});user=payload.sub;}
 catch{return respostaJson(res,401,{erro:'Sessão inválida.'});}
 if(typeof user!=='string'||user.length<1||user.length>200)return respostaJson(res,401,{erro:'Sessão inválida.'});
 try{
  const role=await sql`SELECT missao_api.meu_papel(${user}) AS papel`;
  if(role[0]?.papel!=='administrador')return respostaJson(res,403,{erro:'Acesso exclusivo do Administrador Geral.'});
  if(req.method==='GET'){
   const params=new URL(req.url,'https://internal.invalid').searchParams;
   const tipo=params.get('tipo')||'familias';
   const busca=validarBuscaAdmin(params.get('busca')||'');
   const pagination=validarPaginacaoAdmin(params.get('limite')||'20',params.get('offset')||'0');
   if(busca===null||!pagination)return respostaJson(res,422,{erro:'Filtros inválidos.'});
   if(tipo==='familias'){
    const estado=validarStatusAdmin(params.get('estado')||'todos');
    if(!estado)return respostaJson(res,422,{erro:'Filtro de situação inválido.'});
    const rows=await sql`SELECT * FROM missao_api.listar_familias_admin(${user},${busca},${estado},${pagination.limite}::integer,${pagination.offset}::integer)`;
    return respostaJson(res,200,{familias:rows,total:Number(rows[0]?.total_registros||0),offset:pagination.offset,limite:pagination.limite});
   }
   if(tipo==='criancas'){
    const ano=validarAnoAdmin(params.get('ano')||'-1');
    const responsavel=params.get('responsavel')||'';
    if(ano===null||(responsavel!==''&&!validarId(responsavel)))return respostaJson(res,422,{erro:'Filtros inválidos.'});
    const rows=await sql`SELECT * FROM missao_api.listar_criancas_admin(${user},${busca},${ano}::smallint,${responsavel},${pagination.limite}::integer,${pagination.offset}::integer)`;
    return respostaJson(res,200,{criancas:rows,total:Number(rows[0]?.total_registros||0),offset:pagination.offset,limite:pagination.limite});
   }
   if(tipo==='auditoria'){
    const rows=await sql`SELECT * FROM missao_api.listar_auditoria_admin(${user},${pagination.limite}::integer)`;
    return respostaJson(res,200,{auditoria:rows});
   }
   return respostaJson(res,422,{erro:'Consulta desconhecida.'});
  }
  let data;
  try{data=typeof req.body==='string'?JSON.parse(req.body):req.body;}catch{return respostaJson(res,400,{erro:'JSON inválido.'});}
  if(!data||typeof data!=='object'||Array.isArray(data)||JSON.stringify(data).length>4096)return respostaJson(res,400,{erro:'Dados inválidos.'});
  const motivo=validarJustificativaAdmin(data.motivo);
  if(!motivo)return respostaJson(res,422,{erro:'Informe a justificativa administrativa (10 a 200 caracteres).'});
  if(data.acao==='suspensao'){
   if(!validarId(data.id)||typeof data.suspender!=='boolean')return respostaJson(res,422,{erro:'Conta ou operação inválida.'});
   const rows=await sql`SELECT missao_api.alterar_suspensao_admin(${user},${data.id},${data.suspender},${motivo}) AS alterado`;
   return respostaJson(res,200,{alterado:rows[0]?.alterado===true,novo_estado:data.suspender?'suspenso':'ativo'});
  }
  if(data.acao==='editar_crianca'){
   if(!validarId(data.id))return respostaJson(res,422,{erro:'Perfil inválido.'});
   const perfil=validarPerfil(data);
   if(perfil.error)return respostaJson(res,422,{erro:perfil.error});
   const rows=await sql`SELECT missao_api.editar_crianca_admin(${user},${data.id}::uuid,${perfil.apelido},${perfil.avatar},${perfil.ano_escolar}::smallint,${motivo}) AS alterado`;
   if(rows[0]?.alterado!==true)return respostaJson(res,404,{erro:'Perfil infantil não encontrado.'});
   return respostaJson(res,200,{alterado:true});
  }
  return respostaJson(res,422,{erro:'Operação desconhecida.'});
 }catch(err){
  const code=err?.code||'UNKNOWN';
  console.error('admin-gestao-api',{code});
  if(code==='42501')return respostaJson(res,403,{erro:'Sem autorização.'});
  if(code==='22023')return respostaJson(res,422,{erro:'Dados inválidos ou conta não localizada.'});
  if(code==='23514')return respostaJson(res,409,{erro:'Operação bloqueada: conta administradora protegida ou estado já atualizado.'});
  return respostaJson(res,500,{erro:'Falha ao consultar ou atualizar a administração.'});
 }
}
