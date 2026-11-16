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
 for(const name of ['familias','criancas','pedagogia','catalogo','auditoria']){
  $('painel-'+name).hidden=aba!==name;
  const b=$('aba-'+name);b.classList.toggle('active',aba===name);b.setAttribute('aria-pressed',String(aba===name));
 }
 informar();
 if(aba==='familias'&&!state.carregadoFamilias)await loadFamilies();
 if(aba==='criancas'&&!state.carregadoCriancas)await loadChildren();
 if(aba==='pedagogia')await carregarPedagogia();
 if(aba==='catalogo'){if(!pedagogiaState.data)await carregarPedagogia();renderCatalogo();}
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
for(const name of ['familias','criancas','pedagogia','catalogo','auditoria'])$('aba-'+name).onclick=()=>switchTab(name);
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

/* Fase 2: administração pedagógica agregada e fluxo editorial do catálogo. */
const pedagogiaState={data:null,filtroOffset:0};
const nfmt=value=>Number(value||0).toLocaleString('pt-BR');
function statPedagogica(label,number){
 const box=document.createElement('div');
 box.append(elem('strong',number),elem('span',label));return box;
}
function montarIndicadoresPedagogicos(data){
 const r=data.resumo||{},root=$('pedagogia-metricas');root.replaceChildren();
 const items=[
  ['Crianças cadastradas',nfmt(r.perfis_total)],
  ['Com progresso sincronizado',nfmt(r.perfis_sincronizados)],
  ['Sem sincronização',nfmt(r.perfis_sem_sincronizacao)],
  ['Sincronizadas em 30 dias',nfmt(r.sinc_30d)],
  ['Missões concluídas (soma)',nfmt(r.conclusoes)],
  ['Registros de atividades',nfmt(r.registros)],
  ['De primeira (registros)',r.indice_primeira_tentativa==null?'Sem amostra':r.indice_primeira_tentativa+'%'],
  ['Missões ocultas',nfmt(r.ocultas)]
 ];
 for(const [label,value] of items)root.append(statPedagogica(label,value));
 $('pedagogia-aviso').textContent=r.perfis_sincronizados===0?
  'Ainda não há progresso sincronizado. Os dados locais e o jogo anônimo não são contados.':
  'Última sincronização: '+dataFormat(r.ultima_sincronizacao)+' · '+nfmt(r.perfis_sincronizados)+' de '+nfmt(r.perfis_total)+
  ' perfis possuem dados em nuvem. Uma sincronização recente NÃO confirma participação diária.';
 const worlds=$('pedagogia-mundos');worlds.replaceChildren();
 for(const w of data.mundos||[]){
  const card=elem('article',undefined,'admin-ped-world');
  card.append(elem('strong',w.nome));
  const percent=w.missoes?Math.round(w.com_conclusoes/w.missoes*100):0;
  card.append(elem('p',nfmt(w.com_conclusoes)+' de '+nfmt(w.missoes)+' missões com ao menos uma conclusão'));
  const meter=elem('div',undefined,'admin-meter');
  const fill=elem('span');fill.style.width=percent+'%';meter.append(fill);card.append(meter);
  card.append(elem('small',nfmt(w.concluintes)+' conclusões entre perfis · '+nfmt(w.praticas)+' registros · '+
   nfmt(w.erros)+' erros registrados'+(w.ocultas?' · '+nfmt(w.ocultas)+' ocultas':'')));
  worlds.append(card);
 }
 const difficult=$('pedagogia-revisao');difficult.replaceChildren();
 if(!data.revisao?.length){
  difficult.append(elem('p','Amostra insuficiente para destacar missões com dificuldades recorrentes.','admin-empty'));
 }else{
  for(const row of data.revisao){
   const item=elem('article',undefined,'admin-ped-report-row');
   item.append(elem('strong',row.title));
   item.append(elem('p',nfmt(row.eventos)+' registros, '+nfmt(row.erros)+' erros e '+row.indice_primeira_tentativa+'% concluídos de primeira.'));
   const btn=button('Ver no catálogo',async()=>{await switchTab('catalogo');$('buscar-catalogo').value=row.id;pedagogiaState.filtroOffset=0;renderCatalogo();});
   item.append(btn);difficult.append(item);
  }
 }
}
async function carregarPedagogia(){
 const btn=$('atualizar-pedagogia');btn.disabled=true;
 try{
  const r=await api('/api/pedagogia?tipo=resumo');
  if(!Array.isArray(r.missoes)||r.missoes.length!==140||!Array.isArray(r.mundos))
   throw Error('Resposta incompleta do catálogo.');
  pedagogiaState.data=r;pedagogiaState.filtroOffset=0;
  montarIndicadoresPedagogicos(r);renderCatalogo();
  informar();
 }catch(e){informar('Gestão pedagógica: '+e.message,true);}
 finally{btn.disabled=false;}
}
function catalogoFiltrado(){
 const all=pedagogiaState.data?.missoes||[];
 const busca=$('buscar-catalogo').value.trim().toLocaleLowerCase('pt-BR'),world=$('mundo-catalogo').value,
 status=$('status-catalogo').value;
 return all.filter(m=>(!busca||[m.id,m.title].some(v=>String(v).toLocaleLowerCase('pt-BR').includes(busca)))&&
 (world==='todos'||m.world===world)&&
 (status==='todas'||status==='ocultas'&&m.oculto||status==='visiveis'&&!m.oculto||status==='revisao'&&m.revisao_pendente));
}
function renderCatalogo(){
 const root=$('catalogo-resultados');root.replaceChildren();
 if(!pedagogiaState.data){root.append(elem('p','Carregando as missões do catálogo…','admin-empty'));return;}
 const filtered=catalogoFiltrado(),total=filtered.length;
 if(pedagogiaState.filtroOffset>=total)pedagogiaState.filtroOffset=Math.max(0,Math.floor((total-1)/20)*20);
 if(!total)root.append(elem('p','Nenhuma missão corresponde aos filtros.','admin-empty'));
 for(const m of filtered.slice(pedagogiaState.filtroOffset,pedagogiaState.filtroOffset+20)){
  const row=elem('article',undefined,'admin-result'),main=elem('div',undefined,'admin-result-main');
  main.append(elem('strong',m.title),elem('small',m.id+' · '+(pedagogiaState.data.mundos.find(w=>w.id===m.world)?.nome||m.world)));
  const statuses=elem('div',undefined,'admin-mission-status');
  statuses.append(metadado(m.oculto?'suspenso':'ativo',m.oculto?'Oculta':'Visível'));
  if(m.revisao_pendente)statuses.append(metadado('restrito_neon','Revisão pendente'));
  statuses.append(metadado('',nfmt(m.concluintes)+' conclusões'));
  main.append(statuses);row.append(main,button('Gerenciar',()=>abrirMissaoPedagogica(m)));root.append(row);
 }
 $('catalogo-anterior').disabled=pedagogiaState.filtroOffset<=0;
 $('catalogo-proxima').disabled=pedagogiaState.filtroOffset+20>=total;
 $('catalogo-pagina').textContent=total?
  'Exibindo '+(pedagogiaState.filtroOffset+1)+'–'+Math.min(pedagogiaState.filtroOffset+20,total)+' de '+total:
  'Nenhuma missão';
}
function abrirMissaoPedagogica(m){
 const root=dialog('Gestão pedagógica da missão');
 const grid=elem('div',undefined,'admin-detail-grid');
 const fields=[
  ['Título',m.title],['Código estável',m.id],['Mundo',pedagogiaState.data.mundos.find(w=>w.id===m.world)?.nome||m.world],
  ['Etapa escolar',m.grade==null?'Variável':grade(m.grade)],['Situação',m.oculto?'Oculta':'Visível'],
  ['Revisão',m.revisao_pendente?'Pendente':'Sem pendências'],
  ['Conclusões sincronizadas',nfmt(m.concluintes)],['Eventos registrados',nfmt(m.eventos)],
  ['Erros informados',nfmt(m.erros)],['Primeira tentativa',m.eventos?Math.round(m.primeira_tentativa/m.eventos*100)+'%':'Sem registros']
 ];
 for(const [key,value] of fields)grid.append(field(key,value));root.append(grid);
 root.append(elem('p','Ocultar preserva o código, as conquistas e o progresso. Para corrigir as perguntas é necessário alterar o código do jogo.','admin-footnote'));
 root.append(elem('h3','Ações editoriais'));
 const actions=elem('div',undefined,'admin-catalog-actions');
 const choices=[
  [m.oculto?'mostrar':'ocultar',m.oculto?'Tornar visível':'Ocultar missão'],
  [m.revisao_pendente?'resolver':'sinalizar',m.revisao_pendente?'Concluir revisão':'Sinalizar para revisão']
 ];
 const form=document.createElement('form');form.className='admin-ped-form';form.hidden=true;
 const title=elem('strong','', 'admin-ped-detail');form.append(title);
 const reason=makeFormField(form,'Justificativa (10 a 200 caracteres)','motivo');reason.minLength=10;reason.maxLength=200;
 const submit=elem('button','Confirmar alteração','admin-primary');submit.type='submit';form.append(submit);
 let acao=null;
 for(const [key,label] of choices){
  actions.append(button(label,()=>{acao=key;title.textContent='Ação: '+label;form.hidden=false;reason.focus();}));
 }
 form.onsubmit=async event=>{
  event.preventDefault();if(!acao)return;
  if(!confirm('Confirmar a alteração editorial da missão '+m.id+'?'))return;
  submit.disabled=true;
  try{
   await api('/api/pedagogia','PATCH',{id:m.id,acao,motivo:reason.value});
   $('ficha-dialog').close();await carregarPedagogia();
   informar('Alteração editorial registrada com sucesso. Progresso e conquistas foram preservados.');
  }catch(e){informar(e.message,true);}
  finally{submit.disabled=false;}
 };
 root.append(actions,form);
}
async function carregarHistoricoCatalogo(){
 const root=$('historico-catalogo');root.replaceChildren();
 try{
  const r=await api('/api/pedagogia?tipo=auditoria');
  if(!r.historico?.length){root.append(elem('p','Ainda não existem alterações editoriais.','admin-empty'));return;}
  for(const h of r.historico){
   const item=elem('article',undefined,'admin-audit-item');
   item.append(elem('strong',h.missao_id+' · '+h.acao),
    elem('small',dataFormat(h.criado_em)),
    elem('span','Justificativa: '+h.justificativa));root.append(item);
  }
 }catch(e){root.append(elem('p','Histórico indisponível: '+e.message,'admin-empty'));}
}
function exportarCSVPedagogico(){
 const data=pedagogiaState.data;
 if(!data){informar('Carregue os indicadores antes de exportar.',true);return;}
 const safe=x=>{
  let v=String(x??'');
  if(/^[=+@-]/.test(v))v="'"+v;
  return '"'+v.replaceAll('"','""')+'"';
 };
 const rows=[['Mundo','Código','Título','Ano','Oculta','Revisão pendente','Conclusões','Registros','Primeira tentativa','Erros']];
 for(const m of data.missoes)
  rows.push([m.world,m.id,m.title,m.grade??'',m.oculto?'Sim':'Não',m.revisao_pendente?'Sim':'Não',
   m.concluintes,m.eventos,m.primeira_tentativa,m.erros]);
 const csv='\ufeff'+rows.map(a=>a.map(safe).join(';')).join('\r\n');
 const file=new Blob([csv],{type:'text/csv;charset=utf-8;'});
 const url=URL.createObjectURL(file),a=document.createElement('a');
 a.href=url;a.download='missao-aprender-relatorio-pedagogico.csv';document.body.append(a);a.click();a.remove();
 URL.revokeObjectURL(url);informar('Relatório agregado preparado para download.');
}
$('atualizar-pedagogia').onclick=carregarPedagogia;
$('exportar-pedagogia').onclick=exportarCSVPedagogico;
$('form-catalogo').onsubmit=event=>{event.preventDefault();pedagogiaState.filtroOffset=0;renderCatalogo();};
$('status-catalogo').onchange=()=>{pedagogiaState.filtroOffset=0;renderCatalogo();};
$('catalogo-anterior').onclick=()=>{pedagogiaState.filtroOffset=Math.max(0,pedagogiaState.filtroOffset-20);renderCatalogo();};
$('catalogo-proxima').onclick=()=>{pedagogiaState.filtroOffset+=20;renderCatalogo();};
$('recarregar-catalogo').onclick=carregarPedagogia;
$('atualizar-historico-catalogo').onclick=carregarHistoricoCatalogo;

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
