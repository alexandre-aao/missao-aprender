from pathlib import Path
from playwright.sync_api import sync_playwright
import json
import re
import sys
sys.path.insert(0,str(Path(__file__).resolve().parents[1]))
from test_unificado import SCRIPTS, launch_chromium, go_world, start_mission

root=Path(__file__).resolve().parents[1]
html=(root/'index.html').read_text()
for entry in (*SCRIPTS,'sync-ui.js'):
    html=html.replace(f'<script type="module" src="./{entry}"></script>','')
html=html.replace('<link rel="stylesheet" href="./style.css">','<style>'+(root/'style.css').read_text()+(root/'infantil.css').read_text()+'</style>')
html=html.replace('<link rel="stylesheet" href="./infantil.css">','')
ids=json.loads((root/'api/catalogo.js').read_text().split('Object.freeze(')[1].split(');')[0])
core=(root/'sync-core.js').read_text().replace("import { IDS_MISSOES } from './api/catalogo.js';",f"const IDS_MISSOES={json.dumps(ids)};")
core=core.replace('export const ','const ').replace('export function ','function ')
ui=(root/'sync-ui.js').read_text().replace("import { createAuthClient } from '@neondatabase/auth';",'const createAuthClient = () => window.mockAuth;')
ui=ui.replace("import { emptyProgress,normalizarEstado,mesclarProgressos,hasProgress,profileStorageKey } from './sync-core.js';",'')
ui=ui.replace('import.meta.env.VITE_NEON_AUTH_URL','"https://neon.test/auth"')
profiles=[{'id':'11111111-1111-4111-8111-111111111111','apelido':'Foguete','avatar':'robo','ano_escolar':1},
          {'id':'22222222-2222-4222-8222-222222222222','apelido':'Estrela','avatar':'robo','ano_escolar':1}]

def page_for(browser,cloud,viewport,remembered=None):
    page=browser.new_page(viewport=viewport)
    page.set_content(html)
    page.evaluate("""({cloud,profiles,remembered})=>{
      const store=new Map();
      if(remembered)store.set('missao-aprender:last-profile:416f19ef-9599-4465-b4ce-7345094a307a',JSON.stringify(remembered));
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
    }""", {'cloud':cloud,'profiles':profiles,'remembered':remembered})
    errors=[];page.on('pageerror',lambda err:errors.append(str(err)))
    for path in SCRIPTS:
        page.add_script_tag(content=(root/path).read_text())
    page.add_script_tag(content=core+'\n'+ui)
    selector=page.get_by_role('button',name='Continuar como Foguete') if remembered else page.locator('#sync-profile')
    selector.wait_for(timeout=8000)
    assert not errors,errors
    return page,errors

with sync_playwright() as pl:
    browser=launch_chromium(pl)
    page,errors=page_for(browser,{}, {'width':390,'height':844})
    page.locator('#sync-profile').select_option(profiles[0]['id'])
    page.get_by_role('button',name='Usar perfil').click()
    page.get_by_text('Progresso de Foguete').wait_for()
    page.locator('[data-start="m-contar"]').first.click()
    answer=page.evaluate('window.MissaoAprenderTest.getCurrentAnswer()')
    page.locator('[data-answer]').filter(has_not_text=re.compile('^'+answer+'$')).first.click()
    page.get_by_text('Toque em cada desenho uma vez enquanto conta.').wait_for()
    for step in range(4):
        answer=page.evaluate('window.MissaoAprenderTest.getCurrentAnswer()')
        page.locator('[data-answer="%s"]'%answer).first.click()
        page.locator('[data-next]').first.click()
    page.get_by_text('Sincronizado com segurança.').wait_for(timeout=8000)
    page.get_by_role('heading',name='Missão concluída!').wait_for()
    page.get_by_text('+3 estrelas novas',exact=True).wait_for()
    page.get_by_role('button',name='Voltar ao início',exact=True).wait_for()
    go_world(page,'words')
    start_mission(page,'pal-frase')
    for word in ('O','sapo','pula.'):
        page.locator('[data-game="select"][data-value="%s"]'%word).first.click()
    page.locator('[data-game="check"]').click()
    page.locator('[data-next]').click()
    page.get_by_text('Sincronizado com segurança.').wait_for()
    page.get_by_role('heading',name='Missão concluída!').wait_for()
    cloud=page.evaluate('window.mockCloud')
    assert cloud[profiles[0]['id']]['estado']['missions']['pal-frase']['stars']==3
    assert any(record['world']=='words' for record in cloud[profiles[0]['id']]['estado']['records'])
    assert cloud[profiles[0]['id']]['estado']['missions']['m-contar']['stars']>=1
    assert page.evaluate('document.documentElement.scrollWidth<=window.innerWidth+2')
    assert not errors,errors
    print('PASS A: conclusão, sincronização e layout mobile')

    second,errors2=page_for(browser,cloud,{'width':1280,'height':900},remembered=profiles[0]['id'])
    second.get_by_role('button',name='Continuar como Foguete').click()
    second.get_by_text('Progresso de Foguete').wait_for()
    assert second.evaluate("window.MissaoAprenderTest.getData().missions['m-contar'].stars")>=1
    assert second.evaluate("window.MissaoAprenderTest.getData().missions['pal-frase'].stars")==3
    print('PASS B: novo navegador recuperou progresso do mesmo perfil')
    second.get_by_role('button',name='Trocar perfil').click()
    second.locator('#sync-profile').select_option(profiles[1]['id'])
    second.get_by_role('button',name='Usar perfil').click()
    second.get_by_text('Progresso de Estrela').wait_for()
    assert not second.evaluate('Object.keys(window.MissaoAprenderTest.getData().missions).length')
    assert not errors2,errors2
    print('PASS C: alternância de irmãos sem misturar resultados')
    browser.close()
