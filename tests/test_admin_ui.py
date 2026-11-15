from playwright.sync_api import sync_playwright
from pathlib import Path
p=Path(__file__).resolve().parents[1]
h=(p/'conta.html').read_text()
h=h.replace('<link rel="stylesheet" href="./style.css">','').replace('<link rel="stylesheet" href="./conta.css">','').replace('<script type="module" src="./conta.js"></script>','')
h=h.replace('</head>', '<style>'+ (p/'style.css').read_text()+(p/'conta.css').read_text()+'</style></head>')
j=(p/'conta.js').read_text().replace("import { createAuthClient } from '@neondatabase/auth';",'const createAuthClient = () => window.mockAuth;')
j=j.replace('import.meta.env.VITE_NEON_AUTH_URL','"https://neon.invalid/auth"').replace('import.meta.env.VITE_SIGNUPS_ENABLED','"false"')
mock='''window.mockProfiles=[{id:'11111111-1111-4111-8111-111111111111',apelido:'Luis',avatar:'robo',ano_escolar:1}];
window.mockAuth={getSession:async()=>({data:{user:{email:'responsavel@exemplo.invalid'}}}),token:async()=>({data:{token:'aaaa.bbbb.cccc'}}),signIn:{email:async()=>({data:{}})},signOut:async()=>({data:{}}),emailOtp:{}};
window.fetch=async(url,opts={})=>{const body=opts.body?JSON.parse(opts.body):null;
if(url==='/api/admin')return{ok:true,json:async()=>({papel:'administrador',estatisticas:{responsaveis:1,perfis:1,atividades:0,grupos:0,desafios:0}})};
if(opts.method==='POST'){window.mockProfiles.push({id:'22222222-2222-4222-8222-222222222222',...body});return{ok:true,json:async()=>({perfil:body})};}
if(opts.method==='PATCH'){Object.assign(window.mockProfiles.find(x=>x.id===body.id),body);return{ok:true,json:async()=>({})};}
return{ok:true,json:async()=>({perfis:window.mockProfiles})};};'''
with sync_playwright() as pl:
 browser=pl.chromium.launch(headless=True,executable_path='/usr/bin/chromium',args=['--no-sandbox'])
 for sz in [(1280,900),(390,844)]:
  page=browser.new_page(viewport={'width':sz[0],'height':sz[1]})
  errs=[];page.on('pageerror',lambda err:errs.append(str(err)))
  page.set_content(h)
  page.evaluate(mock)
  page.add_script_tag(type='module',content=j)
  page.locator('#perfis').wait_for(state='visible')
  page.locator('#painel-admin').wait_for(state='visible')
  assert page.get_by_text('Luis',exact=True).count()==1
  assert page.locator('#admin-perfis').inner_text()=='1'
  page.locator('[name="apelido"]').fill('Foguetinho')
  page.locator('[name="sou_responsavel"]').check()
  page.locator('[name="aceito_dados"]').check()
  page.locator('#salvar-perfil').click()
  page.get_by_text('Foguetinho',exact=True).wait_for()
  assert not errs,errs
  assert page.evaluate('document.documentElement.scrollWidth<=window.innerWidth+1'),'overflow'
  print('OK UI',sz,'admin role, own profile, create flow, no horizontal overflow')
  page.close()
 browser.close()
