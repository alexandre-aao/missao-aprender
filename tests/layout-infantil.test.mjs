import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const root=new URL('../',import.meta.url);
const read=name=>readFileSync(new URL(name,root),'utf8');
const html=read('index.html'),account=read('conta.html'),app=read('app.js'),css=read('infantil.css');
test('navegação infantil mostra apenas três destinos principais',()=>{
 for(const id of ['home','adventures','awards'])assert.match(html,new RegExp('data-nav="'+id+'"'));
 assert.equal((html.match(/<button type="button" data-nav=/g)||[]).length,3);
 assert.match(app,/function adventuresView\(/);
 assert.match(app,/adventures:adventuresView/);
 assert.match(app,/\.side-nav \.nav-button/);
});
test('agrupamento mantém o catálogo e as interações das missões',()=>{
 assert.match(app,/const groups=new Map\(\)/);
 assert.match(app,/g\.items\.map\(missionCard\)/);
 assert.match(app,/aria-pressed/);
 assert.match(app,/function worldMissions\(/);
 assert.match(app,/function resultView\(/);
 assert.match(app,/data-start=/);
 assert.doesNotThrow(()=>new Function(app));
});
test('CSS tem menu inferior mobile, botões de toque e movimento reduzido',()=>{
 assert.match(css,/position:fixed;left:0;right:0;bottom:0/);
 assert.match(css,/safe-area-inset-bottom/);
 assert.match(css,/prefers-reduced-motion/);
 assert.match(css,/\.choice\{font-size:24px;min-height:78px\}/);
 assert.match(html,/infantil\.css/);
 assert.match(account,/infantil\.css/);
});
test('área dos responsáveis tem contagem e sincronização atuais',()=>{
 assert.match(account,/86 missões disponíveis/);
 assert.doesNotMatch(account,/64 missões disponíveis/);
 assert.match(account,/sincronização do progresso é opcional/);
 assert.match(app,/Gerenciar conta e perfis/);
 assert.match(html,/\.\/conta\.html/);
});
test('identificadores e integração de sincronização permanecem presentes',()=>{
 assert.match(app,/const STORAGE_KEY='missao-aprender-unificado-v1'/);
 assert.match(app,/window\.MissaoAprenderSyncBridge=/);
 assert.match(app,/missao-aprender:mission-complete/);
});
