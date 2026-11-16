from pathlib import Path
from playwright.sync_api import sync_playwright
import sys,json
sys.path.insert(0,str(Path(__file__).resolve().parents[1]))
from test_unificado import document,launch_chromium,go_world

completed={
 'version':2,'grade':'1','missions':{
  'c-gravidade':{'stars':3,'lastStars':3,'completedAt':'2026-11-15T18:00:00.000Z'}},
 'skills':{},'records':[],'started':'2026-11-15T18:00:00.000Z','migrated':{}
}
store={'missao-aprender-unificado-v1':json.dumps(completed)}
body=document(store)
stub='<script>window.fetch=async(path)=>({ok:true,json:async()=>({ocultas:["c-gravidade","h07"]})});</script>'
body=body.replace('<script>window.__testStore=',stub+'<script>window.__testStore=')

with sync_playwright() as p:
 b=launch_chromium(p)
 page=b.new_page(viewport={'width':390,'height':844},is_mobile=True,has_touch=True)
 errors=[]
 page.on('pageerror',lambda e:errors.append(str(e)))
 page.set_content(body)
 page.wait_for_function('window.MissaoAprenderTest.getOcultas().includes("c-gravidade")')
 assert page.evaluate('window.MissaoAprenderTest.MISSIONS.length')==140
 assert page.evaluate('window.MissaoAprenderTest.worldMissions("science").length')==19
 assert page.evaluate('window.MissaoAprenderTest.worldMissions("math").length')==29
 assert page.evaluate('window.MissaoAprenderTest.getData().missions["c-gravidade"].stars')==3
 go_world(page,'science')
 assert page.locator('[data-start="c-gravidade"]').count()==0
 assert page.locator('.mission-card').count()==19
 assert not errors,errors
 print('OK: catálogo oculto na navegação sem eliminar uma conquista anterior')
 page.close()
 offline=b.new_page()
 h=document(store).replace('<script>window.__testStore=', '<script>window.fetch=()=>Promise.reject(Error("offline"));</script><script>window.__testStore=')
 offline.set_content(h)
 assert offline.evaluate('window.MissaoAprenderTest.worldMissions("science").length')==20
 assert offline.evaluate('window.MissaoAprenderTest.MISSIONS.length')==140
 print('OK: sem rede, missões continuam disponíveis localmente')
 offline.close();b.close()
