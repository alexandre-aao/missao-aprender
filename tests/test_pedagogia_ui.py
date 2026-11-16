from playwright.sync_api import sync_playwright
from pathlib import Path
import json
import sys

sys.path.insert(0,str(Path(__file__).resolve().parents[1]))
from test_unificado import launch_chromium
root=Path(__file__).resolve().parents[1]
html=(root/'admin.html').read_text()
for entry in ['./style.css','./conta.css','./admin.css']:
 html=html.replace('<link rel="stylesheet" href="'+entry+'">','')
html=html.replace('<script type="module" src="./admin.js"></script>','')
styles=''.join((root/f).read_text() for f in ['style.css','conta.css','admin.css'])
html=html.replace('</head>','<style>'+styles+'</style></head>')
script=(root/'admin.js').read_text().replace(
 "import { createAuthClient } from '@neondatabase/auth';",
 'const createAuthClient = () => window.mockAuth;')
script=script.replace('import.meta.env.VITE_NEON_AUTH_URL','"https://neon.invalid/auth"')
meta=(root/'api/_catalogo-pedagogico.js').read_text()
metadata=json.loads(meta.split('MISSOES_PEDAGOGICAS = Object.freeze(',1)[1].split('.map(',1)[0])
assert len(metadata)==140

mock=r"""
window.adminAllowed=true;
window.mockAuth={
 getSession:async()=>({data:{user:{email:'admin@exemplo.invalid'}}}),
 token:async()=>({data:{token:'aaa.bbb.ccc'}})
};
window.confirm=()=>true;
const names={review:'Revisão da pré-escola',math:'Matemática',science:'Ciências',words:'Mundo das Palavras',logic:'Desafios de Lógica',code:'Pequenos Programadores',english:'Inglês Divertido',money:'Pequenos Empreendedores'};
window.pedData={
 resumo:{perfis_total:4,perfis_sincronizados:1,perfis_sem_sincronizacao:3,sinc_30d:1,sinc_7d:1,conclusoes:3,registros:7,indice_primeira_tentativa:71,ocultas:0,pendencias:0},
 mundos:Object.entries(names).map(([id,nome])=>({id,nome,missoes:window.metadata.filter(m=>m.world===id).length,com_conclusoes:id==='science'?1:0,concluintes:id==='science'?2:0,praticas:id==='science'?5:0,erros:id==='science'?3:0,ocultas:0})),
 missoes:window.metadata.map(m=>({...m,concluintes:m.id==='c-gravidade'?2:0,estrelas:0,eventos:m.id==='c-gravidade'?5:0,primeira_tentativa:m.id==='c-gravidade'?3:0,erros:m.id==='c-gravidade'?3:0,oculto:false,revisao_pendente:false,motivo:''})),
 revisao:[{id:'c-gravidade',title:'Por que a bola cai?',world:'science',eventos:5,erros:3,indice_primeira_tentativa:60}]
};
window.editorialHistory=[];
window.fetch=async(url,opts={})=>{
 const u=new URL(url,'https://exemplo.invalid'),body=opts.body?JSON.parse(opts.body):{};
 const ok=payload=>({ok:true,status:200,json:async()=>payload});
 const fail=(status,erro)=>({ok:false,status,json:async()=>({erro})});
 if(u.pathname==='/api/admin')return window.adminAllowed?ok({papel:'administrador'}):fail(403,'Sem permissão');
 if(u.pathname==='/api/admin-gestao'){
  if(!window.adminAllowed)return fail(403,'Sem permissão');
  return u.searchParams.get('tipo')==='criancas'?ok({criancas:[],total:0}):ok({familias:[],total:0});
 }
 if(u.pathname==='/api/pedagogia'){
  if(!window.adminAllowed)return fail(403,'Sem permissão');
  if(opts.method==='PATCH'){
   const m=window.pedData.missoes.find(x=>x.id===body.id);
   if(!m||body.motivo.length<10)return fail(422,'Dados inválidos');
   if(body.acao==='ocultar'){m.oculto=true;window.pedData.resumo.ocultas++;}
   if(body.acao==='mostrar'){m.oculto=false;window.pedData.resumo.ocultas--;}
   if(body.acao==='sinalizar'){m.revisao_pendente=true;window.pedData.resumo.pendencias++;}
   if(body.acao==='resolver'){m.revisao_pendente=false;window.pedData.resumo.pendencias--;}
   window.editorialHistory.unshift({id:window.editorialHistory.length+1,missao_id:body.id,acao:body.acao,justificativa:body.motivo,criado_em:'2026-11-16T01:00:00Z'});
   return ok({alterado:true});
  }
  if(u.searchParams.get('tipo')==='auditoria')return ok({historico:window.editorialHistory});
  return ok(window.pedData);
 }
 return fail(404,'Rota indisponível');
};
"""
with sync_playwright() as pw:
 browser=launch_chromium(pw)
 for width,height in [(1280,900),(390,844)]:
  page=browser.new_page(viewport={'width':width,'height':height})
  errors=[]
  page.on('pageerror',lambda e:errors.append(str(e)))
  page.set_content(html)
  page.evaluate('window.metadata='+json.dumps(metadata,ensure_ascii=False))
  page.evaluate(mock)
  page.add_script_tag(type='module',content=script)
  page.locator('#admin-app').wait_for(state='visible')
  page.locator('#aba-pedagogia').click()
  page.locator('#pedagogia-metricas strong').first.wait_for()
  assert '4' in page.locator('#pedagogia-metricas').inner_text()
  assert 'Ciências' in page.locator('#pedagogia-mundos').inner_text()
  assert 'Por que a bola cai?' in page.locator('#pedagogia-revisao').inner_text()
  page.locator('#aba-catalogo').click()
  page.locator('#buscar-catalogo').fill('c-gravidade')
  page.locator('#form-catalogo button[type=submit]').click()
  assert page.locator('#catalogo-resultados article').count()==1
  page.locator('#catalogo-resultados button').click()
  page.locator('#ficha-dialog').wait_for(state='visible')
  page.get_by_role('button',name='Ocultar missão').click()
  page.locator('#ficha-conteudo [name=motivo]').fill('Revisão editorial do laboratório')
  page.get_by_role('button',name='Confirmar alteração').click()
  page.get_by_text('Alteração editorial registrada com sucesso.',exact=False).wait_for()
  assert 'Oculta' in page.locator('#catalogo-resultados').inner_text()
  page.locator('#catalogo-resultados button').click()
  page.get_by_role('button',name='Sinalizar para revisão').click()
  page.locator('#ficha-conteudo [name=motivo]').fill('Revisar explicação do laboratório')
  page.get_by_role('button',name='Confirmar alteração').click()
  page.get_by_text('Revisão pendente',exact=True).first.wait_for()
  page.locator('#atualizar-historico-catalogo').click()
  page.locator('#historico-catalogo').get_by_text('Justificativa:',exact=False).first.wait_for()
  assert not errors,errors
  assert page.evaluate('document.documentElement.scrollWidth <= window.innerWidth + 1'),f'overflow {width}'
  print('OK fase2',width,height,'indicadores, mundos, catálogo, ocultação, sinalização, auditoria e responsividade')
  page.close()
 page=browser.new_page()
 page.set_content(html)
 page.evaluate('window.metadata='+json.dumps(metadata,ensure_ascii=False))
 page.evaluate(mock)
 page.evaluate('window.adminAllowed=false')
 page.add_script_tag(type='module',content=script)
 page.locator('#admin-negado').wait_for(state='visible')
 assert page.locator('#admin-app').is_hidden()
 print('OK fase2 painel negado para responsável comum')
 page.close();browser.close()
