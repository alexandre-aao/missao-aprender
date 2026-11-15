/* Fase 2 — seleção explícita do perfil, sincronização sem conflito e progresso local preservado. */
import { createAuthClient } from '@neondatabase/auth';
import { emptyProgress,normalizarEstado,mesclarProgressos,hasProgress,profileStorageKey } from './sync-core.js';

const mount=document.getElementById('sync-banner');
let bridge=null;
const base=import.meta.env.VITE_NEON_AUTH_URL;
const auth=base?createAuthClient(base):null;
let user=null,profiles=[],active=null,revision=0,busy=false,pending=false,queued=false;
const el=(tag,cls,text)=>{const e=document.createElement(tag);if(cls)e.className=cls;if(text!==undefined)e.textContent=text;return e};
const read=key=>{try{return JSON.parse(localStorage.getItem(key)||'null')}catch{return null}};
const asJWT=t=>typeof t==='string'&&/^[\w-]+\.[\w-]+\.[\w-]+$/.test(t);
function header(text){mount.replaceChildren(el('strong','sync-heading','☁️ '+text))}
function note(text){const n=el('span','sync-note',text);mount.append(n);return n}
function button(text,fn,cls='sync-button'){const b=el('button',cls,text);b.type='button';b.addEventListener('click',fn);mount.append(b);return b}
function anchor(text,url){const a=el('a','sync-link',text);a.href=url;mount.append(a);return a}
function rememberedKey(){return 'missao-aprender:last-profile:'+user.id}
function remember(profileId){
 try{localStorage.setItem(rememberedKey(),JSON.stringify(profileId))}catch{/* A seleção atual continua disponível. */}
}
function say(text){const status=document.getElementById('sync-status');if(status)status.textContent=text;}
function statusLabel(){let status=document.getElementById('sync-status');if(!status){status=el('span','sync-status');status.id='sync-status';status.setAttribute('role','status');mount.append(status)}return status}
async function bearer(){
 if(!auth)throw Error('Autenticação indisponível.');
 const s=await auth.getSession();
 if(!s?.data?.user||s.data.user.id!==user?.id){disconnect();throw Error('Sessão terminada. Entre novamente na conta.');}
 const r=await auth.token();
 if(asJWT(r?.data?.token))return r.data.token;
 const session=s.data.session||{};
 for(const t of [session.jwt,session.access_token,session.token])if(asJWT(t))return t;
 throw Error('Não foi possível emitir a autorização de acesso.');
}
async function api(path,method='GET',payload){
 const token=await bearer();
 const response=await fetch(path,{method,cache:'no-store',headers:{Authorization:'Bearer '+token,...(payload?{'Content-Type':'application/json'}:{})},body:payload?JSON.stringify(payload):undefined});
 const data=await response.json().catch(()=>({}));
 if(!response.ok){const err=new Error(data.erro||'Serviço de progresso indisponível.');err.status=response.status;throw err}
 return data;
}
function resetToVisitor(){active=null;revision=0;pending=false;queued=false;bridge.selectScope(null,bridge.legacyData());}
function disconnect(){user=null;profiles=[];resetToVisitor();visitorUI()}
function visitorUI(){header('Progresso salvo neste aparelho');note('Para continuar em outro dispositivo, entre como responsável e escolha o perfil infantil.');anchor('Conta e perfis','./conta.html')}
function renderResume(profile){
 header('Seu perfil de aprendizagem');
 button('Continuar como '+profile.apelido,()=>activate(profile.id));
 button('Trocar perfil',renderChooser,'sync-button secondary');
 statusLabel();
}
function renderChooser(){
 header('Escolha quem vai jogar');
 const choices=el('select','sync-select');choices.id='sync-profile';choices.setAttribute('aria-label','Selecionar perfil infantil');
 for(const p of profiles){const opt=document.createElement('option');opt.value=p.id;opt.textContent=`${p.apelido} · ${p.ano_escolar===0?'pré-escola':p.ano_escolar+'º ano'}`;choices.append(opt)}
 mount.append(choices);
 button('Usar perfil',()=>activate(choices.value));
 anchor('Gerenciar perfis','./conta.html');
 statusLabel();say('Selecione o perfil antes de jogar; nada será importado automaticamente.');
}
function selectedUI(){
 const p=profiles.find(p=>p.id===active?.profileId);
 header(`Progresso de ${p?.apelido||'perfil infantil'}`);
 note('Apenas o responsável autenticado pode sincronizar este perfil.');
 button('Sincronizar agora',()=>upload());
 button('Trocar perfil',()=>{if(!busy){resetToVisitor();renderChooser();}},'sync-button secondary');
 statusLabel();say(pending?'Há mudanças locais para enviar.':'Progresso carregado.');
 const legacy=bridge.legacyData();
 if(hasProgress(legacy)&&!read(active.key+'::legacy-imported')){
  button('Importar progresso antigo deste aparelho',()=>importLegacy(),'sync-button secondary');
  note('Só importe se este progresso pertence à criança selecionada.');
 }
}
async function activate(profileId){
 if(busy)return;const profile=profiles.find(p=>p.id===profileId);if(!profile)return;
 busy=true;
 const controls=[...mount.querySelectorAll('button,select')];
 controls.forEach(control=>control.disabled=true);
 statusLabel();say('Buscando seu perfil e seu progresso…');
 try{
  const key=profileStorageKey(user.id,profile.id);
  const result=await api('/api/progresso?perfil_id='+encodeURIComponent(profileId));
  const local=read(key),remote=result.estado;
  let merged;
  if(local&&remote)merged=mesclarProgressos(local,remote);
  else if(local)merged=normalizarEstado(local);
  else if(remote)merged=normalizarEstado(remote);
  else {merged=emptyProgress();merged.grade=String(Math.max(1,profile.ano_escolar))}
  revision=result.revisao;
  active={key,profileId};
  bridge.selectScope(key,merged);
  remember(profileId);
  pending=Boolean(local&&(!remote||JSON.stringify(merged)!==JSON.stringify(remote)));
  selectedUI();
  // A mesclagem só será enviada depois que o estado de ativação for liberado.
 }catch(e){say(e.message||'Não foi possível selecionar o perfil. Nenhum progresso foi substituído.');}
 finally{busy=false;controls.forEach(control=>control.disabled=false)}
 if(active&&pending)await upload();
}
async function upload(){
 if(!active||busy)return;
 busy=true;queued=false;say('Sincronizando com segurança...');
 const controls=[...mount.querySelectorAll('button')];
 controls.forEach(control=>control.disabled=true);
 try{
  let local=normalizarEstado(bridge.getData());
  const {profileId:id,key}=active;
  for(let attempt=0;attempt<3;attempt++){
   // Sempre conferir o servidor antes de enviar para evitar sobrescrever o outro aparelho.
   const remote=await api('/api/progresso?perfil_id='+encodeURIComponent(id));
   revision=remote.revisao;
   const state=remote.estado?mesclarProgressos(local,remote.estado):local;
   if(active?.key!==key)return;
   if(remote.estado&&JSON.stringify(state)===JSON.stringify(remote.estado)){
    reconcile(state,key,'Tudo sincronizado.');return;
   }
   try{
    const result=await api('/api/progresso','PUT',{perfil_id:id,revisao_esperada:revision,estado:state});
    if(!active||active.profileId!==id)throw Error('Perfil foi alterado durante a sincronização.');
    revision=result.revisao;
    reconcile(state,key,'Sincronizado com segurança.');
    return;
   }catch(err){if(err.status===409&&attempt<2){local=normalizarEstado(bridge.getData());continue}throw err}
  }
 }catch(e){pending=true;say((e.message||'Falha de conexão.')+' Seu progresso permanece salvo neste aparelho.');}
 finally{
  busy=false;
  controls.forEach(control=>control.disabled=false);
  if(active&&queued)void upload();
 }
}
function reconcile(state,key,message){
 const latest=normalizarEstado(bridge.getData());
 const saved=mesclarProgressos(latest,state);
 bridge.updateScope(key,saved);
 pending=JSON.stringify(saved)!==JSON.stringify(state);
 say(pending?'Progresso salvo; há novas mudanças para enviar.':message);
}
function importLegacy(){
 if(!active||busy)return;
 if(!confirm('Confirma que o progresso antigo deste aparelho pertence a esta criança? Não importe dados de outro irmão.'))return;
 try{
  const imported=normalizarEstado(bridge.legacyData());
  const merged=mesclarProgressos(imported,bridge.getData());
  bridge.selectScope(active.key,merged);
  localStorage.setItem(active.key+'::legacy-imported','true');
  pending=true;selectedUI();upload();
 }catch(e){say(e.message||'Não foi possível importar. Os dados originais foram mantidos.');}
}
async function init(){
 bridge=window.MissaoAprenderSyncBridge;
 if(!mount||!bridge)return;
 if(!auth){visitorUI();return}
 header('Buscando seu perfil…');
 statusLabel();
 try{
  const s=await auth.getSession();if(!s?.data?.user){visitorUI();return}
  user={id:s.data.user.id};
  const data=await api('/api/perfis');profiles=data.perfis||[];
  if(!profiles.length){header('Nenhum perfil infantil cadastrado');anchor('Criar perfil com o responsável','./conta.html');return}
  const remembered=profiles.find(profile=>profile.id===read(rememberedKey()));
  if(remembered)renderResume(remembered);
  else renderChooser();
 }catch{
  if(!user){visitorUI();return}
  header('Não foi possível carregar os perfis');
  note('Você ainda pode jogar neste aparelho.');
  button('Tentar novamente',init);
 }
}
window.addEventListener('missao-aprender:mission-complete',()=>{if(active){pending=true;if(busy)queued=true;else void upload()}});
window.addEventListener('online',()=>{if(active&&pending)upload()});
document.addEventListener('visibilitychange',async()=>{if(!document.hidden&&active){try{await bearer()}catch{disconnect()}}});
if(window.MissaoAprenderSyncBridge)init();
else window.addEventListener('missao-aprender:ready',init,{once:true});
