import sys
from pathlib import Path
from playwright.sync_api import sync_playwright

sys.path.insert(0,str(Path(__file__).resolve().parents[1]))
from test_unificado import document, go_world, start_mission, launch_chromium, screenshot


def control(page, name, value=''):
    page.locator(f'[data-game="{name}"][data-value="{value}"]').first.click()


def fits(page):
    assert page.evaluate('document.documentElement.scrollWidth <= innerWidth + 1')


with sync_playwright() as playwright:
    browser=launch_chromium(playwright)
    for width,height in [(360,800),(1280,900)]:
        page=browser.new_page(viewport={'width':width,'height':height},is_mobile=width<600,has_touch=width<600)
        errors=[]
        page.on('pageerror',lambda err:errors.append(str(err)))
        page.set_content(document())
        fits(page)
        page.locator('[data-nav="adventures"]').first.click()
        assert page.locator('.adventures-grid .world').count()==8
        fits(page)
        screenshot(page,f'aventuras-{width}.png',full_page=True)
        for world,mission in [('words','pal-imagem'),('logic','log-memoria'),('code','cod-final'),('english','ing-numeros'),('money','fin-orcamento')]:
            go_world(page,world)
            fits(page)
            start_mission(page,mission)
            fits(page)
        control(page,'select','Caderno')
        control(page,'select','Suco')
        page.get_by_text('Acima do orçamento',exact=False).wait_for()
        control(page,'check')
        page.locator('.feedback.try-again').wait_for()
        control(page,'select','Caderno')
        control(page,'select','Maçã')
        screenshot(page,f'lojinha-{width}.png')
        control(page,'check')
        page.locator('[data-next]').click()
        page.get_by_role('heading',name='Missão concluída!').wait_for()
        go_world(page,'code')
        start_mission(page,'cod-final')
        control(page,'run')
        page.get_by_text('O caminho parou antes de cumprir a missão.').wait_for()
        control(page,'remove','1')
        control(page,'repeat')
        control(page,'append','D')
        page.evaluate('window.scrollTo(0,0)')
        screenshot(page,f'programacao-{width}.png',full_page=True)
        control(page,'run')
        page.get_by_text('Foguete: linha 3, coluna 3. Estrela coletada.').wait_for()
        page.locator('[data-next]').click()
        page.get_by_role('heading',name='Missão concluída!').wait_for()
        go_world(page,'english')
        start_mission(page,'ing-cores')
        page.evaluate("Object.defineProperty(window,'speechSynthesis',{value:undefined,configurable:true})")
        control(page,'english')
        page.get_by_text('Áudio indisponível aqui. Use a palavra escrita em inglês.').wait_for()
        assert page.locator('[lang="en-US"]').inner_text()=='red'
        fits(page)
        assert not errors,errors
        print(f'PASSOU {width}×{height}: oito mundos, cinco interfaces, execução visual, lojinha e fallback de áudio')
        page.close()
    browser.close()
