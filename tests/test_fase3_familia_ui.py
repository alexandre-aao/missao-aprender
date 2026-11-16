from playwright.sync_api import sync_playwright
from pathlib import Path
import json,sys
sys.path.insert(0,str(Path(__file__).resolve().parents[1]))
from test_unificado import launch_chromium,document

root=Path(__file__).resolve().parents[1]
html=(root/'conta.html').read_text()
for css in ['style.css','conta.css']:
 html=html.replace('<link rel="stylesheet" href="./'+css+'">','')
html=html.replace('<script type="module" src="./conta.js"></script>','')
html=html.replace('</head>','<style>'+(root/'style.css').read_text()+(root/'conta.css').read_text()+'</style></head>')
code=(root/'conta.js').read_text().replace(
 "import { createAuthClient } from '@neondatabase/auth';",'const createAuthClient = () => window.mockAuth;')
code=code.replace('import.meta.env.VITE_NEON_AUTH_URL','"https://neon.invalid/auth"').replace('import.meta.env.VITE_SIGNUPS_ENABLED','"false"')
mock="""
window.mockAuth={getSession:async()=>({data:{user:{email:'responsavel@exemplo.invalid'}}}),token:async()=>({data:{token:'abc.def.ghi'}}),signOut:async()=>({data:{}})};
window.tickets=[{id:'12345678-1234-4123-8123-123456789123',tipo:'suporte',descricao:'Preciso recuperar uma conquista perdida.',status:'respondida',resposta:'Acesse a página de progresso.'}];
window.fetch=async(path,options={})=>{
 const ok=(obj,status=200)=>({ok:true,status,json:async()=>obj});
 const fail=(status,erro)=>({ok:false,status,json:async()=>({erro})});
 if(path==='/api/admin')return fail(403,'Acesso exclusivo do administrador.');
 if(path==='/api/perfis')return ok({perfis:[]});
 if(path==='/api/solicitacoes'){
  if(options.method==='POST'){
   const data=JSON.parse(options.body);
   window.tickets.unshift({id:'22345678-1234-4123-8123-123456789123',tipo:data.tipo,descricao:data.descricao,status:'aberta',resposta:''});
   return ok({solicitacao:window.tickets[0]},201);
  }
  return ok({solicitacoes:window.tickets});
 }
 return fail(404,'Não encontrado');
};
"""
with sync_playwright() as p:
 b=launch_chromium(p)
 for width,height in [(1280,900),(390,844)]:
  page=b.new_page(viewport={'width':width,'height':height})
  errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
  page.set_content(html);page.evaluate(mock)
  page.add_script_tag(type='module',content=code)
  page.locator('#perfis').wait_for(state='visible')
  page.locator('#lista-solicitacoes-familia').get_by_text('Acesse a página de progresso.',exact=False).wait_for()
  assert page.locator('#painel-admin').is_hidden()
  page.locator('#form-solicitacao-familia [name=tipo]').select_option('exclusao')
  page.locator('#form-solicitacao-familia [name=descricao]').fill('Solicito avaliar a exclusão das informações do meu perfil.')
  page.get_by_role('button',name='Enviar solicitação').click()
  page.get_by_text('Solicitação registrada.',exact=False).wait_for()
  assert page.evaluate('window.tickets.length')==2
  assert not errors,errors
  assert page.evaluate('document.documentElement.scrollWidth<=window.innerWidth+1'),f'overflow conta {width}'
  print('OK fase3 conta família',width,height,'pedido, resposta, isolamento do admin')
  page.close()
 # Jogo consulta modo publicado, mas não perde o estado de missões local.
 mode='window.fetch=async path=>({ok:true,json:async()=>path.includes("configuracao-publica")?{modo:"manutencao",aviso:"Pausa para ajustes educativos."}:{ocultas:[]}});'
 game=document().replace('<script>window.__testStore=','<script>'+mode+'</script><script>window.__testStore=')
 page=b.new_page(viewport={'width':390,'height':844},is_mobile=True,has_touch=True)
 page.set_content(game)
 page.locator('#ma-bloqueio-manutencao').wait_for(state='visible')
 assert page.evaluate('window.MissaoAprenderTest.MISSIONS.length')==140
 assert 'Pausa para ajustes educativos.' in page.locator('#ma-bloqueio-manutencao').inner_text()
 assert page.locator('#ma-bloqueio-manutencao a').get_attribute('href')=='./conta.html'
 print('OK fase3 manutenção: aviso público, bloqueio visual, 140 missões intactas')
 page.close()
 offline=document().replace('<script>window.__testStore=',
 '<script>window.fetch=async()=>{throw Error("offline")};</script><script>window.__testStore=')
 page=b.new_page()
 page.set_content(offline)
 assert page.evaluate('window.MissaoAprenderTest.MISSIONS.length')==140
 assert page.locator('#ma-bloqueio-manutencao').count()==0
 print('OK fase3 offline: jogo local permanece disponível')
 page.close();b.close()
