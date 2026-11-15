import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const source=readFileSync(new URL('../app.js',import.meta.url),'utf8');
function functionSource(name){
 const line=source.split('\n').find(s=>s.startsWith('function '+name+'('));
 assert.ok(line,'Função '+name+' disponível');
 return line;
}
const groups={
 math:[{id:'m1',world:'math',title:'Primeira'},{id:'m2',world:'math',title:'Segunda'}],
 science:[{id:'c-flutua',world:'science',title:'Flutua ou afunda?'},{id:'c-imanes',world:'science',title:'Ímãs'}]
};
const next=new Function('worldMissions',functionSource('nextMissionFrom')+';return nextMissionFrom;')(world=>groups[world]||[]);
const result=new Function('session','nextMissionFrom','escapeHtml',functionSource('resultView')+';return resultView();');

test('laboratório exige duas experiências antes da resposta',()=>{
 assert.match(source,/session\.explored\.size<2/);
 assert.match(source,/function scienceScene\\(/);
 assert.match(source,/inquiry-comparison-prompt/);
 assert.match(source,/data-predict/);
});
test('próxima missão permanece na mesma trilha',()=>{
 assert.equal(next(groups.science[0]).id,'c-imanes');
 assert.equal(next(groups.math[0]).id,'m2');
 assert.equal(next(groups.science[1]),null);
 assert.equal(next({id:'fora',world:'math'}),null);
});
test('resultado oferece próxima missão apenas se houver uma sequência',()=>{
 const first=result({mission:groups.science[0],stars:3},next,s=>s);
 assert.match(first,/Próxima missão/);
 assert.match(first,/data-start="c-imanes"/);
 const last=result({mission:groups.science[1],stars:3},next,s=>s);
 assert.doesNotMatch(last,/Próxima missão/);
 assert.match(last,/Outras missões/);
});
