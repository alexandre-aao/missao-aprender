import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const context={Math,Intl,Date,console};context.window=context;
vm.createContext(context);
vm.runInContext(readFileSync(new URL('../curriculo.js',import.meta.url),'utf8'),context);
const curriculum=context.MissaoAprenderCurriculo;
const old=curriculum.SKILLS.filter(s=>/^h\d+$/.test(s.id));
const news=curriculum.SKILLS.filter(s=>s.id.startsWith('a-'));

test('58 habilidades antigas preservadas e 14 novas com IDs não conflitantes',()=>{
 assert.equal(old.length,58);
 assert.equal(news.length,14);
 assert.equal(news.filter(s=>s.grade==='1').length,11);
 assert.equal(news.filter(s=>s.grade==='P').length,3);
 assert.equal(new Set(curriculum.SKILLS.map(s=>s.id)).size,curriculum.SKILLS.length);
});
test('Gerador cria questões completas, com resposta presente e alternativas sem repetições',()=>{
 for(const s of news){
  for(let i=0;i<150;i++){
   const q=curriculum.question(s,(i%3)+1);
   assert.ok(q.prompt && q.visual && q.explain,`${s.id} não gerou enunciado`);
   assert.equal(q.options.length,4,`${s.id} não tem 4 alternativas: ${JSON.stringify(q)}`);
   assert.equal(new Set(q.options).size,4,`${s.id} alternativas repetidas`);
   assert.ok(q.options.includes(q.answer),`${s.id} sem resposta correta`);
   if(s.kind==='order3'){
    const nums=q.answer.split(' → ').map(Number);
    assert.equal(nums.length,3);
    assert.ok(nums[0]<nums[1]&&nums[1]<nums[2]);
   }
   if(s.kind==='make10'||s.kind==='tenframe')assert.ok(Number(q.answer)>=1&&Number(q.answer)<=9);
  }
 }
});
