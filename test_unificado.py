import re,json
from pathlib import Path
from playwright.sync_api import sync_playwright
P=Path(__file__).resolve().parent
HTML=(P/'index.html').read_text(); CSS=(P/'style.css').read_text()+'\n'+(P/'infantil.css').read_text(); CUR=(P/'curriculo.js').read_text(); APP=(P/'app.js').read_text()

def document(store=None):
    payload=json.dumps(store or {})
    stub='<script>window.__testStore='+payload+';Object.defineProperty(window,"localStorage",{configurable:true,value:{getItem:k=>Object.prototype.hasOwnProperty.call(window.__testStore,k)?window.__testStore[k]:null,setItem:(k,v)=>{window.__testStore[k]=String(v)},removeItem:k=>{delete window.__testStore[k]}}});</script>'
    s=HTML.replace('<link rel="stylesheet" href="./style.css">','<style>'+CSS+'</style>')
    s=s.replace('<link rel="stylesheet" href="./infantil.css">','')
    for module in ('curriculo.js','app.js','sync-ui.js'):
        s=s.replace(f'<script type="module" src="./{module}"></script>','')
    s=s.replace('</body>',stub+'<script>'+CUR+'</script><script>'+APP+'</script></body>')
    return s

def unlock(page):
    page.locator('#parents-top').click()
    x=page.locator('.gate-modal strong').inner_text()
    a,b=map(int,re.findall(r'\d+',x))
    page.locator('#parent-gate-input').fill(str(a+b))
    page.locator('#gate-form button[type=submit]').click()

def go_world(page,world):
    page.locator('[data-nav="adventures"]').first.click()
    page.locator(f'[data-nav="{world}"]').first.click()
    page.locator('.mission-section').evaluate_all('(s)=>s.forEach(e=>e.open=true)')

def start_mission(page,mission_id):
    button=page.locator(f'[data-start="{mission_id}"]').first
    button.evaluate("(el)=>{const d=el.closest('details');if(d)d.open=true}")
    button.click()

def solve_skill(page,skill_id):
    start_mission(page,skill_id)
    assert page.locator('.curriculum-visual').count()==1
    for i in range(8):
        # find generator's correct answer from rendered question (for QA only, via instrumentation in app)
        answer=page.evaluate('window.MissaoAprenderTest.getCurrentAnswer?.()')
        if answer is None:
            raise AssertionError('test hook missing')
        if i==0:
            wrong=page.locator('[data-answer]').evaluate_all('(a,k)=>a.map(x=>x.dataset.answer).filter(v=>v!==k)[0]',answer)
            page.locator('[data-answer]').filter(has_text=re.compile('^'+re.escape(wrong)+'$')).click()
            assert page.locator('.feedback.try-again').count()==1
        page.locator('[data-answer]').evaluate_all('(a,k)=>{let b=a.find(x=>x.dataset.answer===k);if(!b)throw Error("answer missing "+k);b.click()}',answer)
        assert page.locator('.feedback').count()==1
        page.locator('[data-next]').click()
    assert page.get_by_role('heading',name='Missão concluída!').count()==1

def main():
  with sync_playwright() as p:
    browser=p.chromium.launch(headless=True,executable_path='/usr/bin/chromium',args=['--no-sandbox'])
    desktop=browser.new_page(viewport={'width':1310,'height':900},accept_downloads=True)
    errors=[];desktop.on('pageerror',lambda e:errors.append(str(e)))
    desktop.set_content(document())
    assert desktop.get_by_role('heading',name=re.compile('Uma aventura')).count()==1
    assert desktop.evaluate('window.MissaoAprenderTest.MISSIONS.length')==96
    desktop.locator('[data-nav="math"]').first.click()
    assert desktop.locator('.mission-card').count()==30
    assert desktop.get_by_text('Contando até 20').count()==1
    desktop.locator('[data-unit="geometria"]').click()
    assert desktop.locator('.mission-card').count()==3
    desktop.locator('[data-unit="all"]').click()
    assert desktop.locator('.mission-card').count()==30
    desktop.screenshot(path=str(P/'desktop_unificado.png'),full_page=True)
    solve_skill(desktop,'h07')
    # Returns to math and changes to review
    go_world(desktop,'review')
    assert desktop.locator('.mission-card').count()==10
    assert desktop.get_by_text('Contar até 10').count()==1
    # Original pilot math still works
    go_world(desktop,'math')
    start_mission(desktop,'m-somar')
    assert desktop.locator('.object-token').count()>1
    go_world(desktop,'science')
    start_mission(desktop,'c-dia-noite')
    desktop.locator('[data-halfturn]').click()
    assert desktop.get_by_text('NO PONTINHO: NOITE',exact=False).count()==1
    go_world(desktop,'science')
    unlock(desktop)
    assert desktop.get_by_text('Acompanhamento da família').count()==1
    assert desktop.locator('#settings-grade').input_value()=='1'
    desktop.locator('#settings-grade').select_option('3')
    assert desktop.locator('#grade-pill').inner_text()=='🎒 3º ano'
    go_world(desktop,'math')
    assert desktop.locator('.mission-card').count()==7
    go_world(desktop,'review')
    assert desktop.locator('.mission-card').count()==10
    # verify persisted state via new page and keep grade.
    store=desktop.evaluate('window.__testStore')
    rerun=browser.new_page(viewport={'width':1120,'height':850})
    rerun.set_content(document(store))
    assert rerun.evaluate('window.MissaoAprenderTest.getData().grade')=='3'
    assert rerun.evaluate('window.MissaoAprenderTest.getData().missions.h07.stars')>=1
    unlock(rerun)
    with rerun.expect_download() as dl:
      rerun.locator('[data-export]').click()
    assert dl.value.suggested_filename.endswith('.json')
    assert not errors,errors
    # import both previous keys, without modifying their values
    legacy={'grade':'1','skills':{'h07':{'tries':15,'correct':12,'streak':4,'mastered':True}},'history':[{'id':'h07','ok':True,'date':'2026-11-13T13:00:00.000Z'}]}
    pilot={'version':1,'grade':'1','missions':{'c-gravidade':{'stars':3}},'records':[{'id':'c-gravidade','world':'science','firstTry':True,'errors':0,'date':'2026-11-13T12:00:00.000Z'}]}
    old={'missao-matematica-v1':json.dumps(legacy),'missao-aprender-piloto-v1':json.dumps(pilot)}
    migrated=browser.new_page()
    migrated.set_content(document(old))
    d=migrated.evaluate('window.MissaoAprenderTest.getData()')
    assert d['skills']['h07']['mastered']
    assert d['missions']['c-gravidade']['stars']==3
    assert len(d['records'])==2
    assert migrated.evaluate('window.__testStore["missao-matematica-v1"]')==json.dumps(legacy)
    assert migrated.evaluate('window.__testStore["missao-aprender-piloto-v1"]')==json.dumps(pilot)
    # mobile with touch and no horizontal overflow
    mobile=browser.new_page(viewport={'width':390,'height':844},device_scale_factor=2,is_mobile=True,has_touch=True)
    errors_mobile=[];mobile.on('pageerror',lambda e:errors_mobile.append(str(e)))
    mobile.set_content(document())
    assert mobile.evaluate('window.innerWidth>=document.documentElement.scrollWidth-2')
    mobile.locator('[data-nav="math"]').first.click()
    assert mobile.evaluate('window.innerWidth>=document.documentElement.scrollWidth-2')
    mobile.screenshot(path=str(P/'mobile_unificado.png'),full_page=True)
    start_mission(mobile,'h07')
    assert mobile.evaluate('window.innerWidth>=document.documentElement.scrollWidth-2')
    mobile.screenshot(path=str(P/'mobile_exercicio.png'),full_page=True)
    assert not errors_mobile,errors_mobile
    print('PASSOU: 96 missões/atividades, filtro, matemática, pré-escola, ciências, anos 1–6, migração, exportação e mobile')
    browser.close()

if __name__=='__main__':main()
