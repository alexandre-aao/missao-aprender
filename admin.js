import { createAuthClient } from '@neondatabase/auth';

const $=id=>document.getElementById(id);
const authURL=import.meta.env.VITE_NEON_AUTH_URL;
const auth=authURL?createAuthClient(authURL):null;
const avatars={astronauta:'🚀',robo:'🤖',estrela:'🌟',foguete:'🛸',planeta:'🪐',dinossauro:'🦕'};
const labels={ativo:'Ativa',suspenso:'Suspensa no aplicativo',restrito_neon:'Restrita no Neon Auth'};
const pageSize=20;
const state={aba:'familias',familias:[],criancas:[],totalFamilias:0,totalCriancas:0,
 offsetFamilias:0,offsetCriancas:0,filtroFamilia:'',carregadoFamilias:false,carregadoCriancas:false};
const elem=(tag,content,cls)=>{
 const el=document.createElement(tag);
 if(content!==undefined&&content!==null)el.textContent=String(content);
 if(cls)el.className=cls;
 return el;
};
const dataFormat=value=>value?new Date(value).toLocaleString('pt-BR',{day:'2-digit',month:'2-digit',year:'numeric',hour:'2-digit',minute:'2-digit'}):'Não disponível';
const grade=ano=>Number(ano)===0?'Pré-escola':Number(ano)+'º ano';
function informar(msg='',erro=false){
 const e=$('admin-feedback');e.textContent=msg;e.hidden=!msg;
 e.style.background=erro?'#fff0ed':'#f1ecfe';
 e.style.color=erro?'#85382c':'#4e398b';
}
function jwt(value){return typeof value==='string'&&/^[\w-]+\.[\w-]+\.[\w-]+$/.test(value);}
async function bearer(){
 if(!auth)throw Error('Autenticação indisponível.');
 const s=await auth.getSession();
 if(!s?.data?.user)throw Error('Entre como administrador na área da família.');
 try{const r=await auth.token();if(jwt(r?.data?.token))return r.data.token;}catch{}
 const session=s.data.session||{};
 for(const v of [session.jwt,session.access_token,session.token])if(jwt(v))return v;
 throw Error('Sua sessão não possui autorização. Entre novamente.');
}
async function api(path,method='GET',body){
 const token=await bearer();
 const response=await fetch(path,{method,cache:'no-store',
  headers:{Authorization:'Bearer '+token,...(body?{'Content-Type':'application/json'}:{})},
  body:body?JSON.stringify(body):undefined});
 const data=await response.json().catch(()=>({}));
 if(!response.ok)throw Error(data.erro||'Operação indisponível.');
 return data;
}
const query=(tipo,args={})=>{
 const p=new URLSearchParams({tipo,limite:String(pageSize),offset:'0',...args});
 return '/api/admin-gestao?'+p.toString();
};
function metadado(tag,value){
 const e=elem('span',value,'admin-tag '+(tag||''));return e;
}
function field(label,value){
 const f=elem('div',undefined,'admin-detail-field');
 f.append(elem('small',label),elem('strong',value??'Não informado'));return f;
}
function button(label,fn,cls='admin-outline'){
 const b=elem('button',label,cls);b.type='button';b.onclick=fn;return b;
}
function pageControls(kind,total,offset){
 const prefix=kind==='familias'?'familias':'criancas';
 $(prefix+'-anterior').disabled=offset<=0;
 $(prefix+'-proxima').disabled=offset+pageSize>=total;
 $(prefix+'-pagina').textContent=total>0?
  'Exibindo '+(offset+1)+'–'+Math.min(offset+pageSize,total)+' de '+total:
  'Nenhum resultado';
}
function renderFamily(){
 const root=$('lista-familias');root.replaceChildren();
 if(!state.familias.length){root.append(elem('p','Nenhuma conta encontrada para os filtros selecionados.','admin-empty'));return;}
 for(const f of state.familias){
  const card=elem('article',undefined,'admin-result');
  const main=elem('div',undefined,'admin-result-main');
  main.append(elem('strong',f.nome||'Responsável sem nome'),elem('small',f.email||'E-mail indisponível'));
  const m=elem('div',undefined,'admin-result-meta');
  m.append(metadado(f.situacao,labels[f.situacao]||'Situação desconhecida'),
   metadado('',Number(f.total_criancas||0)+' perfil(is) infantil(is)'));
  if(f.administrador)m.append(metadado('','Administrador Geral'));
  main.append(m);
  card.append(main,button('Ver ficha',()=>openFamily(f)));
  root.append(card);
 }
}
function renderChildren(){
 const root=$('lista-criancas');root.replaceChildren();
 if(!state.criancas.length){root.append(elem('p','Nenhum perfil infantil encontrado.','admin-empty'));return;}
 for(const k of state.criancas){
  const card=elem('article',undefined,'admin-result');
  const main=elem('div',undefined,'admin-result-main');
  main.append(elem('strong',(avatars[k.avatar]||'🚀')+' '+k.apelido),
   elem('small','Responsável: '+(k.responsavel_nome||'Não localizado')+' · '+(k.responsavel_email||'')));
  const m=elem('div',undefined,'admin-result-meta');
  m.append(metadado('',grade(k.ano_escolar)),metadado('',k.ultima_sincronizacao?'Sincronizado':'Sem sincronização'));
  main.append(m);card.append(main,button('Ver ficha',()=>openChild(k)));root.append(card);
 }
}
async function loadFamilies(){
 const busca=$('busca-familias').value.trim(),estado=$('estado-familias').value;
 try{
  const r=await api(query('familias',{busca,estado,offset:String(state.offsetFamilias)}));
  state.familias=r.familias||[];state.totalFamilias=Number(r.total||0);
  state.carregadoFamilias=true;
  $('total-familias').textContent=state.totalFamilias.toLocaleString('pt-BR');
  pageControls('familias',state.totalFamilias,state.offsetFamilias);renderFamily();
 }catch(e){informar('Famílias: '+e.message,true);}
}
async function loadChildren(){
 const busca=$('busca-criancas').value.trim(),ano=$('ano-criancas').value;
 try{
  const r=await api(query('criancas',{busca,ano,responsavel:state.filtroFamilia,offset:String(state.offsetCriancas)}));
  state.criancas=r.criancas||[];state.totalCriancas=Number(r.total||0);
  state.carregadoCriancas=true;
  if(!state.filtroFamilia)$('total-criancas').textContent=state.totalCriancas.toLocaleString('pt-BR');
  pageControls('criancas',state.totalCriancas,state.offsetCriancas);renderChildren();
 }catch(e){informar('Crianças: '+e.message,true);}
}
async function loadAudit(){
 const root=$('lista-auditoria');root.replaceChildren();
 try{
  const r=await api(query('auditoria',{limite:'30'}));
  if(!r.auditoria?.length){root.append(elem('p','Não existem alterações administrativas registradas.','admin-empty'));return;}
  for(const a of r.auditoria){
   const card=elem('article',undefined,'admin-audit-item');
   const nomes={suspender_responsavel:'Suspensão de acesso',reativar_responsavel:'Reativação de acesso',editar_crianca:'Correção de perfil infantil'};
   card.append(elem('strong',nomes[a.acao]||a.acao),
     elem('small',dataFormat(a.criado_em)+' · Alvo: '+a.alvo_id),
     elem('span','Justificativa: '+a.justificativa));
   root.append(card);
  }
 }catch(e){informar('Histórico: '+e.message,true);}
}
async function switchTab(aba){
 state.aba=aba;
 for(const name of ['familias','criancas','auditoria']){
  $('painel-'+name).hidden=aba!==name;
  const b=$('aba-'+name);b.classList.toggle('active',aba===name);b.setAttribute('aria-pressed',String(aba===name));
 }
 informar();
 if(aba==='familias'&&!state.carregadoFamilias)await loadFamilies();
 if(aba==='criancas'&&!state.carregadoCriancas)await loadChildren();
 if(aba==='auditoria')await loadAudit();
}
function dialog(title){
 $('ficha-titulo').textContent=title;
 const root=$('ficha-conteudo');root.replaceChildren();
 $('ficha-dialog').showModal();return root;
}
function makeFormField(form,labelText,name,value='',opts){
 const lab=elem('label',labelText);
 let input;
 if(opts){
  input=document.createElement('select');
  for(const [key,title] of opts){const option=document.createElement('option');option.value=String(key);option.textContent=title;input.append(option);}
  input.value=String(value);
 }else{
  input=document.createElement('input');input.type='text';input.value=value||'';
  input.maxLength=name==='motivo'?200:24;
 }
 input.name=name;input.required=true;lab.append(input);form.append(lab);return input;
}
async function openFamily(f){
 const root=dialog('Ficha do responsável');
 const grid=elem('div',undefined,'admin-detail-grid');
 for(const [k,v] of [['Nome',f.nome],['E-mail',f.email],['Cadastro',dataFormat(f.criado_em)],
   ['E-mail confirmado',f.email_confirmado?'Sim':'Não'],['Situação',labels[f.situacao]||f.situacao],
   ['Perfis infantis',f.total_criancas],['Última sincronização',dataFormat(f.ultima_sincronizacao)],
   ['Papel',f.administrador?'Administrador Geral':'Responsável']])grid.append(field(k,v));
 root.append(grid);
 root.append(elem('h3','Crianças vinculadas'));
 const children=elem('div','Consultando perfis vinculados…','admin-mini-list');root.append(children);
 try{
  const r=await api(query('criancas',{responsavel:f.auth_user_id,limite:'50'}));children.replaceChildren();
  if(!r.criancas?.length)children.append(elem('p','Nenhum perfil infantil vinculado.','admin-empty'));
  else for(const k of r.criancas)children.append(elem('div',(avatars[k.avatar]||'🚀')+' '+k.apelido+' · '+grade(k.ano_escolar),'admin-mini-item'));
 }catch(e){children.textContent='Não foi possível consultar os perfis: '+e.message;}
 root.append(button('Ver perfis desta família',async()=>{
  state.filtroFamilia=f.auth_user_id;state.offsetCriancas=0;state.carregadoCriancas=false;
  $('filtro-familia-ativo').hidden=false;$('filtro-familia-label').textContent='Família: '+(f.nome||f.email);
  $('ficha-dialog').close();await switchTab('criancas');await loadChildren();
 }));
 if(f.administrador){
  root.append(elem('p','Contas de administradores não podem ser suspensas nesta tela.','admin-empty'));return;
 }
 if(f.situacao==='restrito_neon'){
  root.append(elem('p','Esta conta está restrita no provedor Neon Auth. A reativação exige administração do próprio provedor.','admin-alert'));return;
 }
 const suspender=f.situacao!=='suspenso';
 const action=button(suspender?'Suspender acesso familiar':'Reativar acesso familiar',()=>{
  form.hidden=false;action.hidden=true;form.querySelector('[name="motivo"]').focus();
 });
 root.append(action);
 const form=document.createElement('form');form.hidden=true;
 const motivo=makeFormField(form,'Justificativa (10–200 caracteres)','motivo');
 motivo.minLength=10;motivo.maxLength=200;
 const submit=document.createElement('button');submit.className='admin-primary';
 submit.type='submit';submit.textContent=suspender?'Confirmar suspensão':'Confirmar reativação';form.append(submit);
 form.onsubmit=async ev=>{
  ev.preventDefault();
  if(!confirm('Confirmar esta alteração de acesso?'))return;
  submit.disabled=true;
  try{
   await api('/api/admin-gestao','PATCH',{acao:'suspensao',id:f.auth_user_id,suspender,motivo:motivo.value});
   $('ficha-dialog').close();
   await loadFamilies();informar(suspender?'Acesso familiar suspenso.':'Acesso familiar reativado.');
  }catch(e){informar(e.message,true);}
  finally{submit.disabled=false;}
 };
 root.append(form);
}
function openChild(k){
 const root=dialog('Ficha do perfil infantil');
 const grid=elem('div',undefined,'admin-detail-grid');
 for(const [caption,v] of [['Apelido',k.apelido],['Avatar',avatars[k.avatar]||k.avatar],
   ['Etapa escolar',grade(k.ano_escolar)],['Responsável',k.responsavel_nome],
   ['E-mail do responsável',k.responsavel_email],['Criado em',dataFormat(k.criado_em)],
   ['Última sincronização',dataFormat(k.ultima_sincronizacao)],
   ['Revisão sincronizada',k.revisao??'Ainda não sincronizado']])grid.append(field(caption,v));
 root.append(grid,elem('p','O conteúdo privado das respostas e atividades não é exibido nesta ficha.','admin-footnote'));
 root.append(elem('h3','Corrigir cadastro infantil'));
 const form=document.createElement('form');
 const nick=makeFormField(form,'Apelido','apelido',k.apelido);nick.minLength=2;nick.maxLength=24;
 const avatar=makeFormField(form,'Avatar','avatar',k.avatar,Object.keys(avatars).map(id=>[id,avatars[id]+' '+id]));
 const ano=makeFormField(form,'Ano escolar','ano_escolar',k.ano_escolar,[['0','Pré-escola'],...Array.from({length:6},(_,i)=>[String(i+1),(i+1)+'º ano'])]);
 const motivo=makeFormField(form,'Justificativa da correção','motivo');motivo.minLength=10;motivo.maxLength=200;
 const submit=document.createElement('button');submit.className='admin-primary';submit.type='submit';submit.textContent='Salvar correção';form.append(submit);
 form.onsubmit=async ev=>{
  ev.preventDefault();submit.disabled=true;
  try{
   await api('/api/admin-gestao','PATCH',{acao:'editar_crianca',id:k.id,apelido:nick.value,avatar:avatar.value,ano_escolar:Number(ano.value),motivo:motivo.value});
   $('ficha-dialog').close();await loadChildren();informar('Cadastro corrigido e alteração auditada. O histórico de progresso foi preservado.');
  }catch(e){informar(e.message,true);}finally{submit.disabled=false;}
 };
 root.append(form);
}
$('fechar-ficha').onclick=()=>$('ficha-dialog').close();
$('form-buscar-familias').onsubmit=async ev=>{ev.preventDefault();state.offsetFamilias=0;await loadFamilies();};
$('form-buscar-criancas').onsubmit=async ev=>{ev.preventDefault();state.offsetCriancas=0;await loadChildren();};
for(const name of ['familias','criancas','auditoria'])$('aba-'+name).onclick=()=>switchTab(name);
for(const kind of ['familias','criancas']){
 const prop=kind==='familias'?'offsetFamilias':'offsetCriancas';
 const load=kind==='familias'?loadFamilies:loadChildren;
 $(kind+'-anterior').onclick=async()=>{state[prop]=Math.max(0,state[prop]-pageSize);await load();};
 $(kind+'-proxima').onclick=async()=>{state[prop]+=pageSize;await load();};
}
$('limpar-filtro-familia').onclick=async()=>{
 state.filtroFamilia='';state.offsetCriancas=0;
 $('filtro-familia-ativo').hidden=true;await loadChildren();
};
$('atualizar-auditoria').onclick=loadAudit;
async function start(){
 try{
  if(!auth)throw Error('Autenticação não configurada.');
  const session=await auth.getSession();
  if(!session?.data?.user)throw Error('Entre como administrador em Conta e perfis.');
  const permission=await api('/api/admin');
  if(permission.papel!=='administrador')throw Error('Acesso exclusivo do Administrador Geral.');
  $('admin-carregando').hidden=true;$('admin-app').hidden=false;
  await Promise.all([loadFamilies(),loadChildren()]);
 }catch(e){
  $('admin-carregando').hidden=true;$('admin-negado').hidden=false;
  $('admin-negado').firstChild.textContent=e.message+' ';
 }
}
start();
