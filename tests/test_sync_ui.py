from pathlib import Path
from playwright.sync_api import sync_playwright
import json

root=Path(__file__).resolve().parents[1]
html=(root/'index.html').read_text()
for entry in ('curriculo.js','app.js','sync-ui.js'):
    html=html.replace(f'<script type="module" src="./{entry}"></script>','')
html=html.replace('<link rel="stylesheet" href="./style.css">','<style>'+(root/'style.css').read_text()+'</style>')
curriculum=(root/'curriculo.js').read_text()
app=(root/'app.js').read_text()
ids=json.loads((root/'api/catalogo.js').read_text().split('Object.freeze(')[1].split(');')[0])
core=(root/'sync-core.js').read_text().replace("import { IDS_MISSOES } from './api/catalogo.js';",f"const IDS_MISSOES={json.dumps(ids)};")
core=core.replace('export const ','const ').replace('export function ','function ')
ui=(root/'sync-ui.js').read_text().replace("import { createAuthClient } from '@neondatabase/auth';",'const createAuthClient = () => window.mockAuth;')
ui=ui.replace("import { emptyProgress,normalizarEstado,mesclarProgressos,hasProgress,profileStorageKey } from './sync-core.js';",'')
ui=ui.replace('import.meta.env.VITE_NEON_AUTH_URL','"https://neon.test/auth"')
profiles=[{'id':'11111111-1111-4111-8111-111111111111','apelido':'Foguete','avatar':'robo','ano_escolar':1},
          {'id':'22222222-2222-4222-8222-222222222222','apelido':'Estrela','avatar':'robo','ano_escolar':1}]

def page_for(browser,cloud,viewport):
    page=browser.new_page(viewport=viewport)
    page.set_content(html)
    page.evaluate("""({cloud,profiles})=>{
      const store=new Map();
      Object.defineProperty(window,'localStorage',{configurable:true,value:{getItem:k=>store.has(k)?store.get(k):null,setItem:(k,v)=>store.set(k,String(v)),removeItem:k=>store.delete(k)}});
      window.mockCloud=cloud;window.mockProfiles=profiles;
      window.mockAuth={getSession:async()=>({data:{user:{id:'416f19ef-9599-4465-b4ce-7345094a307a'}}}),token:async()=>({data:{token:'aaaa.bbbb.cccc'}})};
      window.fetch=async(path,opts={})=>{
        if(opts.headers?.Authorization!=='Bearer aaaa.bbbb.cccc')return{ok:false,status:401,json:async()=>({erro:'Sem JWT'})};
        if(path.includes('/api/perfis'))return{ok:true,status:200,json:async()=>({perfis:window.mockProfiles})};
        let profile;
        if(opts.method==='PUT'){
          const d=JSON.parse(opts.body);profile=d.perfil_id;
          const previous=window.mockCloud[profile];const revision=previous?.revisao||0;
          if(revision!==d.revisao_esperada)return{ok:false,status:409,json:async()=>({erro:'Revisão antiga'})};
          window.mockCloud[profile]={revisao:revision+1,estado:d.estado};
          return{ok:true,status:200,json:async()=>({revisao:revision+1,perfil_id:profile})};
        }
        profile=new URL(path,'https://example.invalid').searchParams.get('perfil_id');
        const data=window.mockCloud[profile]||{estado:null,revisao:0};
        return{ok:true,status:200,json:async()=>({...data,perfil_id:profile})};
      }
    }""", {'cloud':cloud,'profiles':profiles})
    errors=[];page.on('pageerror',lambda err:errors.append(str(err)))
    page.add_script_tag(content=curriculum)
    page.add_script_tag(content=app)
    page.add_script_tag(content=core+'\n'+ui)
    page.locator('#sync-profile').wait_for(timeout=8000)
    assert not errors,errors
    return page,errors

with sync_playwright() as pl:
    browser=pl.chromium.launch(headless=True,executable_path='/usr/bin/chromium',args=['--no-sandbox'])
    page,errors=page_for(browser,{}, {'width':390,'height':844})
    page.locator('#sync-profile').select_option(profiles[0]['id'])
    page.get_by_role('button',name='Usar perfil').click()
    page.get_by_text('Progresso de Foguete').wait_for()
    page.locator('[data-start="m-contar"]').first.click()
    for step in range(4):
        answer=page.evaluate('window.MissaoAprenderTest.getCurrentAnswer()')
        page.locator('[data-answer="%s"]'%answer).first.click()
        page.locator('[data-next]').first.click()
    page.get_by_text('Sincronizado com segurança.').wait_for(timeout=8000)
    cloud=page.evaluate('window.mockCloud')
    assert cloud[profiles[0]['id']]['estado']['missions']['m-contar']['stars']>=1
    assert page.evaluate('document.documentElement.scrollWidth<=window.innerWidth+2')
    assert not errors,errors
    print('PASS A: conclusão, sincronização e layout mobile')

    second,errors2=page_for(browser,cloud,{'width':1280,'height':900})
    second.locator('#sync-profile').select_option(profiles[0]['id'])
    second.get_by_role('button',name='Usar perfil').click()
    second.get_by_text('Progresso de Foguete').wait_for()
    assert second.evaluate("window.MissaoAprenderTest.getData().missions['m-contar'].stars")>=1
    print('PASS B: novo navegador recuperou progresso do mesmo perfil')
    second.get_by_role('button',name='Trocar perfil').click()
    second.locator('#sync-profile').select_option(profiles[1]['id'])
    second.get_by_role('button',name='Usar perfil').click()
    second.get_by_text('Progresso de Estrela').wait_for()
    assert not second.evaluate('Object.keys(window.MissaoAprenderTest.getData().missions).length')
    assert not errors2,errors2
    print('PASS C: alternância de irmãos sem misturar resultados')
    browser.close()
