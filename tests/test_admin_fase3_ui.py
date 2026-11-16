from playwright.sync_api import sync_playwright
from pathlib import Path
import sys
sys.path.insert(0,str(Path(__file__).resolve().parents[1]))
from test_unificado import launch_chromium

root=Path(__file__).resolve().parents[1]
html=(root/'admin.html').read_text()
for css in ['style.css','conta.css','admin.css']:
 html=html.replace('<link rel="stylesheet" href="./'+css+'">','')
html=html.replace('<script type="module" src="./admin.js"></script>','')
styles=''.join((root/f).read_text() for f in ['style.css','conta.css','admin.css'])
html=html.replace('</head>','<style>'+styles+'</style></head>')
js=(root/'admin.js').read_text().replace("import { createAuthClient } from '@neondatabase/auth';",'const createAuthClient = () => window.mockAuth;')
js=js.replace('import.meta.env.VITE_NEON_AUTH_URL','"https://neon.invalid/auth"')
mock=r"""
window.adminAllowed=true;
window.confirm=()=>true;
window.mockAuth={getSession:async()=>({data:{user:{email:'admin@exemplo.invalid'}}}),token:async()=>({data:{token:'a.b.c'}})};
window.globalConfig={modo:'normal',aviso_publico:'',atualizado_em:'2026-11-16T00:00:00Z'};
window.tickets=[{id:'12345678-1234-4123-8123-123456789123',tipo:'suporte',descricao:'Precisamos recuperar uma conquista.',status:'aberta',email:'responsavel@exemplo.invalid',resposta:'',criado_em:'2026-11-16T01:00:00Z'}];
window.audit=[];
window.child={id:'33333333-3333-4333-8333-333333333333',apelido:'Foguetinho',avatar:'robo',ano_escolar:1,criado_em:'2026-11-15T01:00:00Z',auth_user_id:'22222222-2222-4222-8222-222222222222',responsavel_nome:'Responsável Teste',responsavel_email:'responsavel@exemplo.invalid',revisao:1};
window.fetch=async(url,opts={})=>{
 const u=new URL(url,'https://exemplo.invalid'),p=u.searchParams,b=opts.body?JSON.parse(opts.body):{};
 const ok=data=>({ok:true,status:200,json:async()=>data});
 const fail=(status,erro)=>({ok:false,status,json:async()=>({erro})});
 if(u.pathname==='/api/admin')return window.adminAllowed?ok({papel:'administrador'}):fail(403,'Sem permissão');
 if(u.pathname==='/api/admin-gestao'){
  if(!window.adminAllowed)return fail(403,'Sem permissão');
  return p.get('tipo')==='criancas'?ok({criancas:[window.child],total:1}):ok({familias:[],total:0});
 }
 if(u.pathname==='/api/administracao-avancada'){
  if(!window.adminAllowed)return fail(403,'Sem permissão');
  if(opts.method==='PATCH'){
   if(b.acao==='configuracao'){
    window.globalConfig={...window.globalConfig,modo:b.modo,aviso_publico:b.aviso_publico};
   }else if(b.acao==='solicitacao'){
    const t=window.tickets.find(x=>x.id===b.id);
    t.status=b.estado;t.resposta=b.resposta;
   }
   window.audit.unshift({origem:'sistema',acao:b.acao,alvo_id:b.id||'global',justificativa:b.motivo,criado_em:'2026-11-16T02:00:00Z'});
   return ok({alterado:true});
  }
  if(opts.method==='POST'){
   window.audit.unshift({origem:'sistema',acao:'exportacao_crianca',alvo_id:b.id,justificativa:b.motivo,criado_em:'2026-11-16T02:00:00Z'});
   return ok({exportacao:{perfil:window.child,progresso_sincronizado:{version:2,missions:{h01:{stars:3}}}}});
  }
  if(p.get('tipo')==='configuracao')return ok({configuracao:window.globalConfig});
  if(p.get('tipo')==='saude')return ok({saude:{perfis:1,sincronizados:1,solicitacoes_abertas:1,configuracao_valida:true},consulta_ms:4});
  if(p.get('tipo')==='auditoria')return ok({auditoria:window.audit});
  if(p.get('tipo')==='solicitacoes'){
   const list=window.tickets.filter(x=>p.get('estado')==='todos'||x.status===p.get('estado'));
   return ok({solicitacoes:list,total:list.length});
  }
 }
 return fail(404,'Serviço de teste desconhecido');
};
"""
with sync_playwright() as pw:
 browser=launch_chromium(pw)
 for width,height in [(1280,900),(390,844)]:
  page=browser.new_page(viewport={'width':width,'height':height},accept_downloads=True)
  errors=[]
  page.on('pageerror',lambda e:errors.append(str(e)))
  page.set_content(html)
  page.evaluate(mock)
  page.add_script_tag(type='module',content=js)
  page.locator('#admin-app').wait_for(state='visible')
  page.locator('#aba-operacao').click()
  page.locator('#operacao-atual').get_by_text('Modo atual: Normal',exact=False).wait_for()
  page.locator('#operacao-modo').select_option('manutencao')
  page.locator('#operacao-aviso').fill('Estamos ajustando a nossa nave.')
  page.locator('#operacao-motivo').fill('Manutenção de homologação solicitada')
  page.get_by_role('button',name='Salvar configuração global').click()
  page.locator('#operacao-atual').get_by_text('Manutenção',exact=False).wait_for()
  assert page.evaluate('window.globalConfig.modo')=='manutencao'
  page.locator('#aba-solicitacoes').click()
  page.locator('#lista-solicitacoes article').first.wait_for()
  page.get_by_role('button',name='Ver solicitação').click()
  page.locator('#ficha-dialog').wait_for(state='visible')
  page.locator('#ficha-conteudo select').select_option('respondida')
  page.locator('#ficha-conteudo textarea').nth(0).fill('Estamos verificando a conquista informada.')
  page.locator('#ficha-conteudo textarea').nth(1).fill('Atendimento de teste do chamado')
  page.get_by_role('button',name='Registrar atendimento').click()
  page.get_by_text('Resposta registrada na auditoria.',exact=True).wait_for()
  page.locator('#aba-seguranca').click()
  page.locator('#resumo-saude').get_by_text('Conectado').wait_for()
  page.locator('#lista-auditoria-unificada').get_by_text('Justificativa:',exact=False).first.wait_for()
  page.locator('#aba-criancas').click()
  page.locator('#lista-criancas article').first.wait_for()
  page.get_by_role('button',name='Ver ficha').click()
  page.get_by_role('button',name='Exportar dados deste perfil').click()
  page.locator('#export-form textarea').fill('Solicitação de cópia autorizada em homologação')
  with page.expect_download() as download:
   page.get_by_role('button',name='Confirmar exportação individual').click()
  assert download.value.suggested_filename.startswith('missao-aprender-perfil-')
  assert page.evaluate('window.audit.some(x=>x.acao==="exportacao_crianca")')
  assert not errors,errors
  assert page.evaluate('document.documentElement.scrollWidth<=window.innerWidth+1'),f'overflow {width}'
  print('OK fase3 UI',width,height,'modos, suporte, auditoria, exportação e mobile')
  page.close()
 page=browser.new_page()
 page.set_content(html)
 page.evaluate(mock)
 page.evaluate('window.adminAllowed=false')
 page.add_script_tag(type='module',content=js)
 page.locator('#admin-negado').wait_for(state='visible')
 assert page.locator('#admin-app').is_hidden()
 print('OK fase3 responsável comum bloqueado na Central de Administração')
 page.close();browser.close()
