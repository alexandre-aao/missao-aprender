from playwright.sync_api import sync_playwright
from pathlib import Path
import sys
sys.path.insert(0,str(Path(__file__).resolve().parent.parent))
from test_unificado import document

SC = ['c-plantas','c-flutua','c-ima','c-sombras','c-som','c-agua','c-sol','c-borboleta']
MAT = ['a-m01','a-m02','a-m03','a-m04','a-m05','a-m06','a-m07','a-m08','a-m09','a-m10','a-m11']
REV = ['a-p01','a-p02','a-p03']
with sync_playwright() as p:
    b=p.chromium.launch(headless=True,executable_path='/usr/bin/chromium',args=['--no-sandbox'])
    page=b.new_page(viewport={'width':390,'height':844},is_mobile=True,has_touch=True)
    errors=[]
    page.on('pageerror',lambda e:errors.append(str(e)))
    page.set_content(document())
    state=page.evaluate("""() => {
       let v=window.MissaoAprenderTest;
       return {all:v.MISSIONS.length,math:v.worldMissions('math').length,review:v.worldMissions('review').length,science:v.worldMissions('science').length};
    }""")
    assert state == {'all':86,'math':30,'review':10,'science':10},state
    page.locator('[data-nav="science"]').first.click()
    assert page.locator('.mission-card').count()==10
    for mid in SC:
        page.locator(f'[data-start="{mid}"]').click()
        assert page.locator('[data-science-answer]').count()==0,(mid,'question not locked')
        actions=page.locator('[data-explore]')
        assert actions.count()>=2
        actions.nth(0).click()
        assert page.locator('[data-science-answer]').count()==0,(mid,'unlocked after one action')
        page.locator('[data-explore]').nth(1).click()
        assert page.locator('[data-science-answer]').count()==3,(mid,'not unlocked after two actions')
        answer=page.evaluate('window.MissaoAprenderTest.getCurrentAnswer()')
        assert answer
        opts=page.locator('[data-science-answer]')
        wrong=opts.evaluate_all('(buttons,a)=>buttons.map(b=>b.dataset.scienceAnswer).find(x=>x!==a)',answer)
        page.locator(f'[data-science-answer="{wrong}"]').click()
        assert page.locator('.feedback.try-again').count()==1,mid
        page.locator(f'[data-science-answer="{answer}"]').click()
        assert page.locator('.feedback').count()==1,mid
        page.locator('[data-next]').click()
        assert page.get_by_role('heading',name='Missão concluída!').count()==1,mid
        page.locator('[data-nav="science"]').first.click()
    assert page.evaluate('window.MissaoAprenderTest.getData().missions["c-borboleta"].stars') >= 1
    page.locator('[data-nav="math"]').first.click()
    assert page.locator('.mission-card').count()==30
    for mid in MAT:
        page.locator(f'[data-start="{mid}"]').click()
        assert page.locator('.curriculum-visual').count()==1
        assert page.locator('[data-answer]').count()==4
        answer=page.evaluate('window.MissaoAprenderTest.getCurrentAnswer()')
        assert answer in page.locator('[data-answer]').evaluate_all('(a)=>a.map(b=>b.dataset.answer)')
        page.locator('[data-nav="math"]').first.click()
    page.locator('[data-nav="review"]').first.click()
    for mid in REV:
        page.locator(f'[data-start="{mid}"]').click()
        assert page.locator('.curriculum-visual').count()==1
        page.locator('[data-nav="review"]').first.click()
    assert page.evaluate('window.innerWidth>=document.documentElement.scrollWidth-2')
    assert not errors,errors
    print('OK: 8 experiências científicas, 11 matemáticas, 3 de revisão, progressão e layout mobile.')
    b.close()
