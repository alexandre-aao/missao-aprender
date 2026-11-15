import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import test from 'node:test';
import vm from 'node:vm';
import {IDS_MISSOES} from '../api/catalogo.js';
import {emptyProgress,mesclarProgressos,normalizarEstado,profileStorageKey} from '../sync-core.js';

const read = name => readFileSync(new URL('../'+name,import.meta.url),'utf8');
const core = ['curriculo.js','novos-mundos.js','novas-atividades.js','app.js'];
const boot = (storage=new Map(),motion=true) => {
 const events=new Map(),elements=new Map(),windowEvents=[];
 const getElementById=id=>{
  if(!elements.has(id))elements.set(id,{innerHTML:'',textContent:'',setAttribute(){}});
  return elements.get(id);
 };
 const document={getElementById,querySelector:()=>null,querySelectorAll:()=>[],addEventListener:(name,fn)=>events.set(name,fn)};
 const context=vm.createContext({
  document,Date,Math,Intl,console,scrollTo(){},matchMedia:()=>({matches:motion}),setTimeout,clearTimeout,
  Event:class{constructor(type){this.type=type}},
  dispatchEvent:event=>windowEvents.push(event.type),
  localStorage:{getItem:key=>storage.get(key)||null,setItem:(key,value)=>storage.set(key,value),removeItem:key=>storage.delete(key)}
 });
 context.window=context;
 for(const path of core)vm.runInContext(read(path),context,{filename:path});
 const click=dataset=>events.get('click')({target:{closest:()=>({id:'',dataset})}});
 return {context,click,storage,html:()=>getElementById('main').innerHTML,element:getElementById,windowEvents};
};
const game=(app,name,value='')=>app.click({game:name,value:String(value)});
const paths={
 'log-labirinto':['D','D','R','R','R'],
 'cod-setas':['R','R'],
 'cod-caminho':['D','R','R','U'],
 'cod-ordem':['R','R','D','D'],
 'cod-corrigir':['R','R','D'],
 'cod-repetir':['R2'],
 'cod-limite':['R2','D2'],
 'cod-foguete':['R','R','L','L','D','D','R','R'],
 'cod-final':['R2','D2']
};
const purchases={
 'fin-moedas':[['50 centavos'],['1 real']],
 'fin-notas':[['Nota de 5 reais']],
 'fin-soma':[['a','b']],
 'fin-loja':[['Lápis','Caderno']],
 'fin-troco':[['a','b']],
 'fin-orcamento':[['Maçã','Suco']],
 'fin-poupar':[['Nota de 2 reais']]
};

test('140 IDs únicos coincidem com o catálogo do aplicativo e há oito cartões em Aventuras',()=>{
 const app=boot();
 const {MISSIONS, WORLDS}=app.context.MissaoAprenderTest;
 assert.equal(Object.keys(WORLDS).length,8);
 assert.equal(MISSIONS.length,140);
 assert.deepEqual([...MISSIONS.map(m=>m.id)].sort(),[...IDS_MISSOES].sort());
 assert.equal(new Set(IDS_MISSOES).size,140);
 const counts=Object.fromEntries(Object.keys(WORLDS).map(key=>[key,MISSIONS.filter(m=>m.world===key).length]));
 assert.deepEqual(counts,{math:66,review:10,science:20,words:12,logic:8,code:8,english:8,money:8});
 app.click({nav:'adventures'});
 assert.equal((app.html().match(/class="world /g)||[]).length,8);
});

test('44 missões podem ser concluídas pelos controles e integrar o progresso sem perder estrelas antigas',()=>{
 const app=boot(),old=emptyProgress();
 old.missions['m-contar']={stars:3,lastStars:3,completedAt:'2026-11-15T12:00:00.000Z'};
 const key=profileStorageKey('416f19ef-9599-4465-b4ce-7345094a307a','11111111-1111-4111-8111-111111111111');
 app.context.MissaoAprenderSyncBridge.selectScope(key,old);
 const {missions,activity}=app.context.MissaoMundos;
 for(const m of missions){
  app.click({start:m.id});
  m.rounds.forEach((round,index)=>{
   assert.match(app.html(),/Ouvir instrução/,m.id);
   game(app,'hint');
   assert.equal(app.element('exp-message').textContent,round.hint,m.id);
   switch(round.kind){
   case 'choose': game(app,'choose',round.goal);break;
   case 'collect':
   case 'order': round.goal.forEach(id=>game(app,'select',id));game(app,'check');break;
   case 'shop': purchases[m.id][index].forEach(id=>game(app,'select',id));game(app,'check');break;
   case 'match': round.goal.forEach(id=>{game(app,'source',id);game(app,'pair',id)});break;
   case 'mosaic': round.goal.forEach((id,index)=>{game(app,'source',id);game(app,'pair',index)});break;
   case 'route': paths[m.id].forEach(dir=>game(app,'move',dir));break;
   case 'program':
    if(round.seed){
     assert.equal(activity.programSteps(round,round.seed).success,false,m.id);
     game(app,'run');
     assert.match(app.html(),/Confira o bloco|O caminho parou/,m.id);
     round.seed.forEach(()=>game(app,'remove',0));
    }
    paths[m.id].forEach(token=>{
     if(token[1])game(app,'repeat');
     game(app,'append',token[0]);
    });
    game(app,'run');break;
   case 'memory':{
    // Read the shuffled positions through public card interactions.
    const positions=new Map();
    for(let i=0;i<6;i++){
     game(app,'card',i);
     const name=app.html().match(new RegExp(`Carta ${i+1}(?:, par encontrado)?\\. </span><span class="exp-icon"[^>]*>[^<]+</span><span>([^<]+)</span>`))?.[1];
     assert.ok(name,m.id);
     positions.set(name,[...(positions.get(name)||[]),i]);
     if(i%2===1&&app.html().includes('Virar as cartas de volta'))game(app,'hide');
    }
    for(const [a,b] of positions.values()){game(app,'card',a);game(app,'card',b)}
    break;
   }
   }
   assert.match(app.html(),/data-next="1"/,m.id+' passo '+index);
   app.click({next:'1'});
  });
  assert.match(app.html(),/Missão concluída!/,m.id);
 }
 assert.equal(app.windowEvents.filter(e=>e==='missao-aprender:mission-complete').length,44);
 const state=normalizarEstado(JSON.parse(app.storage.get(key)));
 assert.equal(Object.keys(state.missions).length,45);
 assert.equal(state.missions['m-contar'].stars,3);
 for(const m of missions)assert.equal(state.records.find(r=>r.id===m.id)?.world,m.world);
 const merged=mesclarProgressos(state,old);
 assert.equal(Object.keys(merged.missions).length,45);
 const restored=boot(app.storage);
 restored.context.MissaoAprenderSyncBridge.selectScope(key,merged);
 assert.match(restored.html(),/Conquistas recentes/);
 assert.match(restored.html(),/O cofrinho da meta/);
});

test('retoma o passo de alfabetização no perfil correto',()=>{
 const app=boot();
 app.click({start:'pal-letras'});
 game(app,'choose','M');
 app.click({next:'1'});
 const reopened=boot(app.storage);
 assert.match(reopened.html(),/Próxima: Caça às letras/);
 reopened.click({start:'pal-letras',resume:'1'});
 assert.match(reopened.html(),/Passo 2 de 2/);
 game(reopened,'select','B');
 game(reopened,'select','A');
 game(reopened,'check');
 reopened.click({next:'1'});
 assert.match(reopened.html(),/\+3 estrelas novas/);
});

test('robô percorre casas reais e detecta colisões, repetição e objetivo sem coleta',()=>{
 const {missions,activity}=boot().context.MissaoMundos;
 const final=missions.find(m=>m.id==='cod-final').rounds[0];
 const run=activity.programSteps(final,paths['cod-final']);
 assert.equal(run.success,true);
 assert.deepEqual(JSON.parse(JSON.stringify(run.frames.map(f=>f.pos))),[[0,1],[0,2],[1,2],[2,2]]);
 assert.equal(run.frames[1].collected,true);
 assert.equal(activity.programSteps(final,['D']).blocked,0);
 const rocket=missions.find(m=>m.id==='cod-foguete').rounds[0];
 assert.equal(activity.programSteps(rocket,['D','D','R','R']).success,false);
});

test('Inglês solicita voz local en-US e mantém a alternativa escrita',()=>{
 const app=boot();
 app.click({start:'ing-cores'});
 assert.match(app.html(),/lang="en-US">red/);
 game(app,'english');
 assert.match(app.element('exp-message').textContent,/palavra escrita em inglês/);
 let spoken;
 app.context.SpeechSynthesisUtterance=class{constructor(text){this.text=text}};
 app.context.speechSynthesis={getVoices:()=>[{lang:'en-US',localService:true}],cancel(){},speak:utterance=>{spoken=utterance}};
 game(app,'english');
 assert.equal(spoken.lang,'en-US');
 assert.equal(spoken.text,'red');
});

test('a loja rejeita compras acima do orçamento e permite retirar produtos',()=>{
 const app=boot();
 app.click({start:'fin-orcamento'});
 assert.match(app.html(),/Dinheiro fictício/);
 game(app,'select','Caderno');
 game(app,'select','Suco');
 assert.match(app.html(),/Acima do orçamento/);
 game(app,'check');
 assert.match(app.html(),/feedback try-again/);
 game(app,'select','Caderno');
 game(app,'select','Maçã');
 game(app,'check');
 assert.match(app.html(),/data-next="1"/);
});
