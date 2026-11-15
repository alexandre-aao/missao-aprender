import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import {IDS_MISSOES} from '../api/catalogo.js';
import {emptyProgress,normalizarEstado,mesclarProgressos} from '../sync-core.js';

const read=path=>readFileSync(new URL(path,import.meta.url),'utf8');
const source=read('../app.js');
const curriculum=read('../curriculo.js');
const NEW_IDS=['c-maos','c-sentidos','c-luz-materiais','c-absorver','c-momentos','c-animais-horarios','c-partes-planta','c-sombra-maior','c-superficies','c-reutilizar'];

function launch(){
 const store=new Map(),elements=new Map(),events={};
 const element=id=>{
   if(!elements.has(id))elements.set(id,{id,innerHTML:'',textContent:'',classList:{toggle(){}},setAttribute(){},removeAttribute(){}});
   return elements.get(id);
 };
 const document={getElementById:element,querySelectorAll:()=>[],querySelector:()=>null,addEventListener:(name,handler)=>{events[name]=handler}};
 const context={document,localStorage:{getItem:key=>store.get(key)||null,setItem:(key,val)=>store.set(key,String(val)),removeItem:key=>store.delete(key)},
    Math,Date,Intl,console,setTimeout,clearTimeout,Event:class Event{constructor(type){this.type=type}},
    crypto:{randomUUID:()=>'77777777-7777-4777-8777-'+String(store.size).padStart(12,'0')},
    scrollTo(){},dispatchEvent(){},addEventListener(){},confirm(){return false},alert(){}};
 context.window=context;
 vm.createContext(context);
 vm.runInContext(curriculum,context,{filename:'curriculo.js'});
 vm.runInContext(source,context,{filename:'app.js'});
 const click=dataset=>{
   const button={dataset,id:'',classList:{toggle(){}},setAttribute(){}};
   events.click({target:{closest:()=>button}});
 };
 const html=()=>element('main').innerHTML;
 return {context,click,html,store};
}

test('catálogo cresce de 86 para 96 preservando identificadores anteriores',()=>{
 assert.equal(IDS_MISSOES.length,96);
 assert.equal(new Set(IDS_MISSOES).size,96);
 for(const id of NEW_IDS)assert.ok(IDS_MISSOES.includes(id),id);
 for(const id of ['c-gravidade','c-dia-noite','c-plantas','c-borboleta','h01','a-m11'])assert.ok(IDS_MISSOES.includes(id),id);
 const {context}=launch();
 assert.equal(context.MissaoAprenderTest.MISSIONS.length,96);
 assert.equal(context.MissaoAprenderTest.worldMissions('science').length,20);
 assert.equal(context.MissaoAprenderTest.worldMissions('math').length,30);
 assert.equal(context.MissaoAprenderTest.worldMissions('review').length,10);
});

test('cada investigação tem hipótese, duas observações e pergunta cientificamente explícita',()=>{
 const {context}=launch();
 for(const id of NEW_IDS){
   const m=context.MissaoAprenderTest.MISSIONS.find(item=>item.id===id);
   assert.equal(m.type,'investigation',id);
   assert.ok(m.reference.startsWith('EF0'),id);
   assert.ok(m.predictions.length===2,id);
   assert.ok(m.actions.length>=2,id);
   assert.equal(m.choices.length,3,id);
   assert.equal(new Set(m.choices.map(x=>x[0])).size,3,id);
   assert.ok(m.choices.some(x=>x[0]===m.right),id);
   assert.ok(m.explain.length>35,id);
 }
});

test('investigações exigem previsão e dois testes antes da pergunta e persistem a conclusão',()=>{
 const {context,click,html,store}=launch();
 click({nav:'science'});
 assert.equal((html().match(/class="mission-section"/g)||[]).length,4);
 for(const id of NEW_IDS){
   click({start:id});
   const m=context.MissaoAprenderTest.MISSIONS.find(x=>x.id===id);
   assert.match(html(),/data-predict="0"/,id);
   assert.doesNotMatch(html(),/data-science-answer=/,id);
   click({scienceAnswer:m.right});
   assert.doesNotMatch(html(),/feedback/,id);
   click({explore:'0'});
   assert.doesNotMatch(html(),/data-science-answer=/,id);
   click({predict:'0'});
   click({explore:'0'});
   assert.doesNotMatch(html(),/data-science-answer=/,id);
   click({explore:'1'});
   assert.equal((html().match(/data-science-answer=/g)||[]).length,3,id);
   assert.match(html(),/Compare o que você viu/,id);
   const wrong=m.choices.find(x=>x[0]!==m.right)[0];
   click({scienceAnswer:wrong});
   assert.match(html(),/feedback try-again/,id);
   click({scienceAnswer:m.right});
   assert.match(html(),/data-next="1"/,id);
   click({next:'1'});
   assert.equal(context.MissaoAprenderTest.getView(),'result',id);
   assert.ok(context.MissaoAprenderTest.getData().missions[id]?.stars>=1,id);
   click({nav:'science'});
 }
 assert.ok(store.has('missao-aprender-unificado-v1'));
 assert.equal(Object.keys(context.MissaoAprenderTest.getData().missions).length,10);
});

test('missões antigas continuam sem exigir hipótese adicional',()=>{
 const {context,click,html}=launch();
 click({nav:'science'});click({start:'c-plantas'});
 assert.doesNotMatch(html(),/data-predict=/);
 click({explore:'0'});click({explore:'1'});
 assert.equal((html().match(/data-science-answer=/g)||[]).length,3);
 click({scienceAnswer:'agua'});click({next:'1'});
 assert.equal(context.MissaoAprenderTest.getView(),'result');
});

test('sincronização aceita o conjunto ampliado e a mesclagem conserva missões antigas',()=>{
 const base=emptyProgress(),before=emptyProgress();
 before.missions['c-gravidade']={stars:3};
 base.missions['c-maos']={stars:2};
 base.records.push({id:'c-maos',world:'science',firstTry:true,errors:0,date:'2026-11-15T18:00:00.000Z'});
 const merged=mesclarProgressos(base,before);
 assert.equal(merged.missions['c-gravidade'].stars,3);
 assert.equal(merged.missions['c-maos'].stars,2);
 const all=emptyProgress();
 for(const id of IDS_MISSOES)all.missions[id]={stars:1};
 assert.equal(Object.keys(normalizarEstado(all).missions).length,96);
});
