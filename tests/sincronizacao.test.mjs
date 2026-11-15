import test from 'node:test';
import assert from 'node:assert/strict';
import {IDS_MISSOES} from '../api/catalogo.js';
import {emptyProgress,normalizarEstado,mesclarProgressos,profileStorageKey,hasProgress,MAX_BYTES} from '../sync-core.js';

const child='4c86d9ab-a156-42cc-86b1-160b529d6b44',user='416f19ef-9599-4465-b4ce-7345094a307a';
const base=()=>({version:2,grade:'1',missions:{},skills:{},records:[],started:'2026-11-01T12:00:00.000Z',migrated:{}});
test('catálogo mantém as 86 missões originais, sem identificadores repetidos',()=>{
 assert.equal(IDS_MISSOES.length,86);assert.equal(new Set(IDS_MISSOES).size,86);
 for(const id of ['m-contar','c-plantas','h01','a-m11'])assert.ok(IDS_MISSOES.includes(id));
});
test('estado inicial é serializável e não contém dados pessoais',()=>{
 const clean=normalizarEstado(emptyProgress());assert.deepEqual(clean.missions,{});assert.deepEqual(clean.records,[]);
 assert.ok(!JSON.stringify(clean).includes('email'));
});
test('uma conclusão guarda até três estrelas',()=>{
 const e=base();e.missions.h01={stars:3,lastStars:2,completedAt:'2026-11-01T12:30:00.000Z'};
 assert.equal(normalizarEstado(e).missions.h01.stars,3);
 e.missions.h01.stars=4;assert.throws(()=>normalizarEstado(e),/Estrelas/);
});
test('identificadores de atividades não são aceitos por injeção ou inexistentes',()=>{
 for(const id of ['__proto__','inexistente','x OR 1=1','<script>']){
  const e=base();Object.defineProperty(e.missions,id,{value:{stars:3},enumerable:true});
  assert.throws(()=>normalizarEstado(e));
 }
});
test('registros precisam conter métricas e data válidas',()=>{
 const e=base();e.records=[{id:'h01',world:'math',firstTry:true,errors:0,date:'2026-11-01T12:00:00.000Z',eventId:'aaaaaaaa-1111-2222-3333-444444444444'}];
 assert.equal(normalizarEstado(e).records.length,1);
 e.records[0].errors=-1;assert.throws(()=>normalizarEstado(e));
});
test('progressos de aparelhos diferentes são mesclados sem perder conclusões',()=>{
 const a=base(),b=base();a.missions.h01={stars:2,lastStars:2,completedAt:'2026-11-01T12:00:00.000Z'};
 b.missions.h01={stars:3,lastStars:3,completedAt:'2026-11-03T12:00:00.000Z'};
 b.missions['c-plantas']={stars:1,lastStars:1,completedAt:'2026-11-03T12:00:00.000Z'};
 const c=mesclarProgressos(a,b);assert.equal(c.missions.h01.stars,3);assert.equal(c.missions['c-plantas'].stars,1);
});
test('eventos repetidos de sincronização não duplicam o histórico',()=>{
 const a=base(),b=base(),event={id:'h01',world:'math',firstTry:true,errors:0,date:'2026-11-01T12:00:00.000Z',eventId:'aaaaaaaa-1111-2222-3333-444444444444'};
 a.records=[event];b.records=[event];const merged=mesclarProgressos(a,b);
 assert.equal(merged.records.length,1);assert.equal(mesclarProgressos(merged,b).records.length,1);
});
test('contadores de habilidades não se somam artificialmente a cada sincronização',()=>{
 const a=base(),b=base();a.skills.h01={tries:8,correct:5,streak:2,mastered:false};
 b.skills.h01={tries:9,correct:6,streak:3,mastered:true};const m=mesclarProgressos(a,b);
 assert.equal(m.skills.h01.tries,9);assert.equal(m.skills.h01.correct,6);assert.equal(m.skills.h01.mastered,true);
});
test('cache local é separado por conta adulta e perfil infantil',()=>{
 const k=profileStorageKey(user,child);
 assert.notEqual(k,profileStorageKey(user,'b77f641e-6681-4f35-bd1b-7f2a2a25fd34'));
 assert.notEqual(k,profileStorageKey('aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaaaa',child));
 assert.throws(()=>profileStorageKey('malicioso',child));
});
test('dados de origem não são alterados pela mesclagem',()=>{
 const a=base(),b=base();a.missions.h01={stars:2};
 const as=JSON.stringify(a),bs=JSON.stringify(b);mesclarProgressos(a,b);
 assert.equal(JSON.stringify(a),as);assert.equal(JSON.stringify(b),bs);
});
test('progresso não é confundido com visitante sem histórico',()=>{
 assert.equal(hasProgress(base()),false);
 const a=base();a.skills.h01={tries:1,correct:0,streak:0,mastered:false};assert.equal(hasProgress(a),true);
});
test('tamanho de sincronização é limitado',()=>{
 const a=base();a.records=Array.from({length:3001},(_,i)=>({id:'h01',world:'math',firstTry:true,errors:0,date:'2026-11-01T12:00:00.000Z'}));
 assert.throws(()=>normalizarEstado(a),/grande demais/);
 assert.equal(MAX_BYTES,480000);
});
