import { createAuthClient } from '@neondatabase/auth';

const $ = id => document.getElementById(id);
const base = import.meta.env.VITE_NEON_AUTH_URL;
const auth = base ? createAuthClient(base) : null;
const allowSignup = import.meta.env.VITE_SIGNUPS_ENABLED === 'true';
const avatarIcons = {astronauta:'🚀',robo:'🤖',estrela:'🌟',foguete:'🛸',planeta:'🪐',dinossauro:'🦕'};
const panels = ['carregando','entrar','cadastrar','perfis','recuperar','nova-senha','verificar'];
let profiles=[], verificationEmail='', resetEmail='', resetToken=new URLSearchParams(location.search).get('token');
const resetError = new URLSearchParams(location.search).get('error');
if(resetToken || resetError) history.replaceState(null,'',location.pathname+location.hash);

function screen(id){for(const name of panels) $(name).hidden=name!==id;}
function inform(message='',ok=false){const el=$('alerta');el.textContent=message;el.hidden=!message;el.classList.toggle('success',ok);}
function busy(form,yes){const b=form.querySelector('[type=submit]');if(b)b.disabled=yes;}
function ensureEmail(form){const f=form.elements.email;if(!f?.value || !f.checkValidity())throw Error('Digite um e-mail válido.');return f.value.trim().toLowerCase();}
function failed(r,message){if(r?.error)throw Error(r.error.message||message);}
const isJWT = value => typeof value==='string' && /^[\w-]+\.[\w-]+\.[\w-]+$/.test(value);
async function token(){
  if(!auth)throw Error('Autenticação não configurada.');
  // A versão privada comprovou que auth.token() emite o JWT necessário para a API.
  // Não enviar o token opaco da sessão Better Auth como Bearer.
  try {const result=await auth.token();if(isJWT(result?.data?.token))return result.data.token;}catch{}
  const session=await auth.getSession();
  if(!session?.data?.user)throw Error('Sua sessão terminou. Entre novamente.');
  const value=session.data.session||{};
  for(const key of ['jwt','access_token','token'])if(isJWT(value[key]))return value[key];
  throw Error('Conta autenticada, mas a autorização do servidor não foi emitida. Atualize esta página.');
}
async function api(path,method='GET',body){
  const authorization=await token();
  const response=await fetch(path,{method,cache:'no-store',headers:{Authorization:`Bearer ${authorization}`,...(body?{'Content-Type':'application/json'}:{})},body:body?JSON.stringify(body):undefined});
  const data=await response.json().catch(()=>({}));
  if(!response.ok)throw Error(data.erro||'Não foi possível concluir a operação.');
  return data;
}
function resetForm(){const f=$('form-perfil');f.reset();f.elements.id.value='';$('titulo-form').textContent='Criar perfil infantil';$('salvar-perfil').textContent='Salvar perfil';$('cancelar-edicao').hidden=true;$('consentimento').hidden=false;for(const e of $('consentimento').querySelectorAll('input'))e.required=true;}
function renderProfiles(){
  const root=$('lista-perfis');root.replaceChildren();
  if(profiles.length===0){const p=document.createElement('p');p.className='profile-empty';p.textContent='Nenhum perfil cadastrado. Crie um perfil abaixo.';root.append(p);return;}
  for(const profile of profiles){
    const card=document.createElement('article');card.className='profile-card';
    const avatar=document.createElement('span');avatar.className='avatar';avatar.setAttribute('aria-hidden','true');avatar.textContent=avatarIcons[profile.avatar]||'🚀';
    const name=document.createElement('strong');name.textContent=profile.apelido;
    const grade=document.createElement('small');grade.textContent=profile.ano_escolar===0?'Pré-escola':`${profile.ano_escolar}º ano`;
    const actions=document.createElement('div');actions.className='account-actions';
    const edit=document.createElement('button');edit.type='button';edit.textContent='Editar perfil';
    edit.onclick=()=>{const f=$('form-perfil');for(const key of ['id','apelido','avatar','ano_escolar'])f.elements[key].value=profile[key];$('titulo-form').textContent='Editar perfil';$('salvar-perfil').textContent='Salvar alterações';$('cancelar-edicao').hidden=false;$('consentimento').hidden=true;for(const el of $('consentimento').querySelectorAll('input'))el.required=false;f.scrollIntoView({behavior:'smooth',block:'center'});};
    const remove=document.createElement('button');remove.type='button';remove.className='account-outline';remove.textContent='Excluir perfil';
    remove.onclick=async()=>{if(!confirm('Excluir este perfil e todos os dados vinculados? Essa ação não pode ser desfeita.'))return;try{await api('/api/perfis','DELETE',{id:profile.id,confirmar_exclusao:true});resetForm();await loadProfiles();inform('Perfil excluído.',true);}catch(e){inform(e.message);}};
    actions.append(edit,remove);card.append(avatar,name,grade,actions);root.append(card);
  }
}
async function loadProfiles(){const result=await api('/api/perfis');profiles=result.perfis||[];renderProfiles();}
async function loadAdmin(){
  const admin=$('painel-admin');admin.hidden=true;
  try{
    const result=await api('/api/admin');
    if(result.papel!=='administrador')return;
    admin.hidden=false;
    $('role-info').textContent='Administrador do sistema';
    for(const id of ['responsaveis','perfis','atividades','grupos','desafios']){
      const element=$('admin-'+id);if(element)element.textContent=Number(result.estatisticas?.[id]||0).toLocaleString('pt-BR');
    }
  }catch{ /* Quem não possui permissão nunca recebe dados administrativos. */ }
}
async function restore(fromLogin=false){
  if(!auth){screen('entrar');inform('Serviço de autenticação indisponível.');return;}
  let result;try{result=await auth.getSession();}catch{screen('entrar');if(fromLogin)inform('Não foi possível consultar a sessão.');return;}
  if(!result?.data?.user){screen('entrar');if(fromLogin)inform('Entre novamente.');return;}
  $('usuario-logado').textContent=result.data.user.email||'Conta autenticada';
  screen('perfis');
  try{await loadProfiles();inform('');}catch(e){profiles=[];renderProfiles();inform(e.message);}
  await loadAdmin();
}
function showVerification(email){verificationEmail=email;$('verificar-email').textContent=email;$('form-verificar').reset();screen('verificar');}
async function sendVerification(email){if(!auth?.emailOtp?.sendVerificationOtp)throw Error('Envio do código indisponível.');failed(await auth.emailOtp.sendVerificationOtp({email,type:'email-verification'}),'Não foi possível enviar o código.');}
async function sendReset(email){if(!auth?.emailOtp?.requestPasswordReset)throw Error('Redefinição de senha indisponível.');failed(await auth.emailOtp.requestPasswordReset({email}),'Falha ao enviar código.');}

$('form-entrar').onsubmit=async event=>{
  event.preventDefault();const form=event.currentTarget;busy(form,true);inform('');
  try{const email=ensureEmail(form),password=String(new FormData(form).get('senha')||'');const r=await auth.signIn.email({email,password});if(r?.error){const error=String(r.error.code||'')+' '+String(r.error.message||'');if(/email.*verif|verif.*email/i.test(error)){showVerification(email);inform('Confirme seu e-mail pelo código recebido.');return;}throw Error(r.error.message||'Falha no login.');}form.reset();await restore(true);}catch(err){inform(err.message||'Não foi possível entrar.');}finally{busy(form,false);}
};
$('reenviar-verificacao').onclick=async()=>{try{const email=ensureEmail($('form-entrar'));await sendVerification(email);showVerification(email);inform('Código enviado. Confira seu e-mail.',true);}catch(e){inform(e.message);}};
$('form-verificar').onsubmit=async event=>{event.preventDefault();const form=event.currentTarget;busy(form,true);inform('');try{const code=String(new FormData(form).get('otp')||'').trim();if(!/^[0-9]{4,10}$/.test(code))throw Error('Informe o código numérico recebido.');failed(await auth.emailOtp.verifyEmail({email:verificationEmail,otp:code}),'Código inválido.');screen('entrar');$('form-entrar').elements.email.value=verificationEmail;inform('E-mail confirmado. Agora entre com sua senha.',true);}catch(e){inform(e.message);}finally{busy(form,false);}};
$('reenviar-codigo').onclick=async()=>{try{await sendVerification(verificationEmail);inform('Novo código solicitado.',true);}catch(e){inform(e.message);}};
$('voltar-verificacao').onclick=()=>{screen('entrar');inform('');};
$('abrir-recuperacao').onclick=()=>{$('form-recuperar').elements.email.value=$('form-entrar').elements.email.value;screen('recuperar');inform('');};
$('voltar-recuperacao').onclick=()=>{screen('entrar');inform('');};
$('voltar-nova-senha').onclick=()=>{resetToken=null;screen('entrar');inform('');};
$('form-recuperar').onsubmit=async event=>{event.preventDefault();const form=event.currentTarget;busy(form,true);inform('');try{resetEmail=ensureEmail(form);await sendReset(resetEmail);$('form-recuperar').hidden=true;$('form-recuperacao-codigo').hidden=false;inform('Código de recuperação solicitado. Digite o código recebido e sua nova senha.',true);}catch(e){inform(e.message);}finally{busy(form,false);}};
$('form-recuperacao-codigo').onsubmit=async event=>{event.preventDefault();const form=event.currentTarget;busy(form,true);inform('');try{const d=new FormData(form),otp=String(d.get('codigo')||'').trim(),password=String(d.get('senha')||'');if(!/^[0-9]{4,10}$/.test(otp))throw Error('Código inválido.');if(password!==String(d.get('confirmacao')||''))throw Error('As senhas não coincidem.');failed(await auth.emailOtp.resetPassword({email:resetEmail,otp,password}),'Falha ao redefinir senha.');form.reset();$('form-recuperar').hidden=false;form.hidden=true;screen('entrar');$('form-entrar').elements.email.value=resetEmail;inform('Senha alterada. Entre na sua conta.',true);}catch(e){inform(e.message);}finally{busy(form,false);}};
$('reenviar-recuperacao').onclick=async()=>{try{await sendReset(resetEmail);inform('Um novo código foi solicitado.',true);}catch(e){inform(e.message);}};
$('abrir-cadastro').onclick=()=>{screen('cadastrar');inform('');};
$('voltar-entrar').onclick=()=>{screen('entrar');inform('');};
$('form-cadastrar').onsubmit=async event=>{event.preventDefault();if(!allowSignup){inform('Os cadastros ainda estão fechados.');return;}const f=event.currentTarget;busy(f,true);try{const d=new FormData(f);failed(await auth.signUp.email({name:String(d.get('nome')).trim(),email:String(d.get('email')).trim(),password:String(d.get('senha'))}),'Falha no cadastro.');screen('entrar');inform('Confirme seu e-mail antes de entrar.',true);}catch(e){inform(e.message);}finally{busy(f,false);}};
$('form-perfil').onsubmit=async event=>{event.preventDefault();const form=event.currentTarget;busy(form,true);inform('');try{const d=new FormData(form),id=String(d.get('id')||'');const body={apelido:String(d.get('apelido')||'').trim(),avatar:String(d.get('avatar')||''),ano_escolar:Number(d.get('ano_escolar'))};if(id)body.id=id;else{body.sou_responsavel=d.get('sou_responsavel')==='on';body.aceito_dados=d.get('aceito_dados')==='on';}await api('/api/perfis',id?'PATCH':'POST',body);resetForm();await loadProfiles();inform('Perfil salvo com sucesso!',true);}catch(e){inform(e.message||'Não foi possível salvar o perfil.');}finally{busy(form,false);}};
$('cancelar-edicao').onclick=resetForm;
$('sair').onclick=async()=>{try{await auth.signOut();profiles=[];resetForm();renderProfiles();$('painel-admin').hidden=true;screen('entrar');inform('Você saiu da conta.',true);}catch{inform('Não foi possível sair.');}};
$('abrir-cadastro').hidden=!allowSignup;
if(!allowSignup)$('aviso-cadastro').textContent='Novos cadastros serão liberados após as verificações de segurança.';
if(resetToken){screen('nova-senha');$('form-nova-senha').onsubmit=async e=>{e.preventDefault();const form=e.currentTarget;busy(form,true);inform('');try{const d=new FormData(form),pw=String(d.get('senha')||'');if(pw!==String(d.get('confirmacao')||''))throw Error('As senhas não coincidem.');failed(await auth.resetPassword({newPassword:pw,token:resetToken}),'Link inválido.');resetToken=null;screen('entrar');inform('Senha atualizada.',true);}catch(err){inform(err.message);}finally{busy(form,false);}};}else{restore(false);if(resetError)inform('Link expirado. Use a recuperação por código.');}
