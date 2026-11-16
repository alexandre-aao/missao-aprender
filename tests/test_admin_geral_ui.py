from playwright.sync_api import sync_playwright
from pathlib import Path
import sys
sys.path.insert(0,str(Path(__file__).resolve().parents[1]))
from test_unificado import launch_chromium

root=Path(__file__).resolve().parents[1]
html=(root/'admin.html').read_text()
html=html.replace('<link rel="stylesheet" href="./style.css">','')
html=html.replace('<link rel="stylesheet" href="./conta.css">','')
html=html.replace('<link rel="stylesheet" href="./admin.css">','')
html=html.replace('<script type="module" src="./admin.js"></script>','')
styles=(root/'style.css').read_text()+(root/'conta.css').read_text()+(root/'admin.css').read_text()
html=html.replace('</head>','<style>'+styles+'</style></head>')
script=(root/'admin.js').read_text()
script=script.replace("import { createAuthClient } from '@neondatabase/auth';",'const createAuthClient = () => window.mockAuth;')
script=script.replace('import.meta.env.VITE_NEON_AUTH_URL','"https://neon.invalid/auth"')

mock="""
window.adminAllowed=true;
window.families=[
 {auth_user_id:'11111111-1111-4111-8111-111111111111',nome:'Administrador Exemplo',email:'admin@exemplo.invalid',criado_em:'2026-11-10T12:00:00Z',email_confirmado:true,administrador:true,situacao:'ativo',total_criancas:1,ultima_sincronizacao:null},
 {auth_user_id:'22222222-2222-4222-8222-222222222222',nome:'Responsável Teste',email:'responsavel@exemplo.invalid',criado_em:'2026-11-12T12:00:00Z',email_confirmado:true,administrador:false,situacao:'ativo',total_criancas:1,ultima_sincronizacao:null}
];
window.children=[
 {id:'33333333-3333-4333-8333-333333333333',apelido:'Foguetinho',avatar:'robo',ano_escolar:1,criado_em:'2026-11-12T12:00:00Z',atualizado_em:null,auth_user_id:'22222222-2222-4222-8222-222222222222',responsavel_nome:'Responsável Teste',responsavel_email:'responsavel@exemplo.invalid',ultima_sincronizacao:null,revisao:null},
 {id:'44444444-4444-4444-8444-444444444444',apelido:'Estrelinha',avatar:'estrela',ano_escolar:1,criado_em:'2026-11-10T12:00:00Z',atualizado_em:null,auth_user_id:'11111111-1111-4111-8111-111111111111',responsavel_nome:'Administrador Exemplo',responsavel_email:'admin@exemplo.invalid',ultima_sincronizacao:null,revisao:null}
];
window.audit=[];
window.mockAuth={
 getSession:async()=>({data:{user:{email:'admin@exemplo.invalid'}}}),
 token:async()=>({data:{token:'aaa.bbb.ccc'}})
};
window.fetch=async(url,opts={})=>{
 const u=new URL(url,'https://exemplo.invalid'), p=u.searchParams;
 const data=opts.body?JSON.parse(opts.body):{};
 const response=(status,payload)=>({ok:status>=200&&status<300,status,json:async()=>payload});
 if(u.pathname==='/api/admin')return window.adminAllowed?response(200,{papel:'administrador'}):response(403,{erro:'Sem permissão.'});
 if(opts.method==='PATCH'){
  if(!window.adminAllowed)return response(403,{erro:'Sem permissão.'});
  if(data.acao==='suspensao'){
    const f=window.families.find(x=>x.auth_user_id===data.id);
    if(f.administrador)return response(409,{erro:'Administrador protegido.'});
    f.situacao=data.suspender?'suspenso':'ativo';
  }else if(data.acao==='editar_crianca'){
    Object.assign(window.children.find(x=>x.id===data.id),{apelido:data.apelido,avatar:data.avatar,ano_escolar:data.ano_escolar});
  }
  window.audit.unshift({id:1,acao:data.acao==='suspensao'?'suspender_responsavel':'editar_crianca',alvo_id:data.id,justificativa:data.motivo,criado_em:'2026-11-15T22:00:00Z'});
  return response(200,{alterado:true});
 }
 if(u.pathname==='/api/admin-gestao'){
  if(!window.adminAllowed)return response(403,{erro:'Sem permissão.'});
  if(p.get('tipo')==='auditoria')return response(200,{auditoria:window.audit});
  if(p.get('tipo')==='criancas'){
   const t=(p.get('busca')||'').toLowerCase();
   const list=window.children.filter(x=>
    (!p.get('responsavel')||x.auth_user_id===p.get('responsavel')) &&
    (!p.has('ano')||p.get('ano')==='-1'||String(x.ano_escolar)===p.get('ano')) &&
    (!t||[x.apelido,x.responsavel_nome,x.responsavel_email].some(a=>a.toLowerCase().includes(t))));
   return response(200,{criancas:list.slice(Number(p.get('offset')),Number(p.get('offset'))+Number(p.get('limite'))),total:list.length});
  }
  const t=(p.get('busca')||'').toLowerCase();
  const list=window.families.filter(x=>(p.get('estado')==='todos'||x.situacao===p.get('estado'))&&(!t||[x.nome,x.email].some(a=>a.toLowerCase().includes(t))));
  return response(200,{familias:list.slice(Number(p.get('offset')),Number(p.get('offset'))+Number(p.get('limite'))),total:list.length});
 }
 return response(404,{erro:'Não encontrado.'});
};
"""
with sync_playwright() as pw:
 browser=launch_chromium(pw)
 for width,height in [(1280,900),(390,844)]:
  page=browser.new_page(viewport={'width':width,'height':height})
  errors=[]
  page.on('pageerror',lambda error: errors.append(str(error)))
  page.set_content(html)
  page.evaluate(mock)
  page.add_script_tag(type='module',content=script)
  page.locator('#admin-app').wait_for(state='visible')
  assert page.locator('#total-familias').inner_text()=='2'
  assert page.locator('#total-criancas').inner_text()=='2'
  page.locator('#lista-familias article').filter(has_text='Responsável Teste').get_by_role('button',name='Ver ficha').click()
  page.locator('#ficha-dialog').wait_for(state='visible')
  page.locator('#ficha-conteudo').get_by_text('Foguetinho',exact=False).wait_for()
  page.get_by_role('button',name='Suspender acesso familiar').click()
  page.locator('#ficha-conteudo [name=motivo]').fill('Solicitação de bloqueio de teste')
  page.once('dialog',lambda d:d.accept())
  page.get_by_role('button',name='Confirmar suspensão').click()
  page.get_by_text('Acesso familiar suspenso.',exact=True).wait_for()
  page.locator('#aba-criancas').click()
  page.locator('#lista-criancas article').filter(has_text='Foguetinho').get_by_role('button',name='Ver ficha').click()
  page.locator('#ficha-conteudo [name=apelido]').fill('Explorador')
  page.locator('#ficha-conteudo [name=motivo]').fill('Corrigir apelido a pedido do responsável')
  page.get_by_role('button',name='Salvar correção').click()
  page.get_by_text('Explorador',exact=False).first.wait_for()
  page.locator('#aba-auditoria').click()
  assert 'Justificativa:' in page.locator('#lista-auditoria').inner_text()
  assert not errors,errors
  assert page.evaluate('document.documentElement.scrollWidth <= window.innerWidth + 1'),f'Overflow em {width}'
  print('OK admin geral',width,height,'famílias, suspensão, criança, auditoria, sem overflow')
  page.close()
 # Responsável comum não deve abrir painel
 page=browser.new_page()
 page.set_content(html)
 page.evaluate(mock)
 page.evaluate('window.adminAllowed=false')
 page.add_script_tag(type='module',content=script)
 page.locator('#admin-negado').wait_for(state='visible')
 assert page.locator('#admin-app').is_hidden()
 print('OK admin geral acesso negado para responsável comum')
 page.close()
 browser.close()
