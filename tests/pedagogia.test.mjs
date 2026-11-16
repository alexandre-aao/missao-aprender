import test from 'node:test';
import assert from 'node:assert/strict';
import {IDS_MISSOES} from '../api/catalogo.js';
import {MISSOES_PEDAGOGICAS,MAPA_MISSOES_PEDAGOGICAS,MUNDOS_PEDAGOGICOS} from '../api/_catalogo-pedagogico.js';
import {ACOES_CATALOGO,justificarMudanca,indicadoresPedagogicos} from '../api/_pedagogia-core.js';

test('metadados editoriais correspondem EXATAMENTE aos 140 IDs do jogo',()=>{
 assert.equal(MISSOES_PEDAGOGICAS.length,140);
 assert.deepEqual(MISSOES_PEDAGOGICAS.map(m=>m.id),IDS_MISSOES);
 assert.equal(MAPA_MISSOES_PEDAGOGICAS.size,140);
 for(const m of MISSOES_PEDAGOGICAS){
  assert.ok(MUNDOS_PEDAGOGICOS[m.world],m.id);
  assert.ok(m.title.length>=3,m.id);
 }
});
test('resumo diferencia progresso não sincronizado, eventos, domínio e primeira tentativa',()=>{
 const fake=[
  {id:'h01',concluintes:'2',estrelas:'3',eventos:'5',primeira_tentativa:'3',erros:'4',tentativas_habilidade:'0',acertos_habilidade:'0'},
  {id:'c-gravidade',concluintes:'1',estrelas:'3',eventos:'2',primeira_tentativa:'2',erros:'0',tentativas_habilidade:'0',acertos_habilidade:'0'},
  {id:'id-inexistente',concluintes:'9999',eventos:'100',erros:'99'}
 ];
 const control=[{id:'h01',oculto:true,revisao_pendente:true,motivo:'Precisa revisão'}];
 const r=indicadoresPedagogicos({perfis_total:'4',perfis_sincronizados:'1',perfis_sem_sincronizacao:'3',sinc_30d:'1'},fake,control);
 assert.equal(r.resumo.perfis_total,4);
 assert.equal(r.resumo.perfis_sincronizados,1);
 assert.equal(r.resumo.perfis_sem_sincronizacao,3);
 assert.equal(r.resumo.conclusoes,3);
 assert.equal(r.resumo.registros,7);
 assert.equal(r.resumo.indice_primeira_tentativa,71);
 assert.equal(r.resumo.ocultas,1);
 assert.equal(r.resumo.pendencias,1);
 assert.equal(r.revisao.length,1);
 assert.equal(r.revisao[0].id,'h01');
 assert.equal(r.missoes.length,140);
 assert.equal(r.missoes.find(m=>m.id==='h01').oculto,true);
 assert.equal(r.missoes.find(m=>m.id==='h02').oculto,false);
});
test('não rotula amostras pequenas como dificuldade',()=>{
 const r=indicadoresPedagogicos({},[{id:'h01',eventos:2,erros:2}]);
 assert.deepEqual(r.revisao,[]);
 assert.equal(r.resumo.indice_primeira_tentativa,0);
 const empty=indicadoresPedagogicos({});
 assert.equal(empty.resumo.indice_primeira_tentativa,null);
 assert.equal(empty.resumo.registros,0);
});
test('operações de catálogo exigem justificativa e nomes explícitos',()=>{
 assert.deepEqual([...ACOES_CATALOGO].sort(),['mostrar','ocultar','resolver','sinalizar'].sort());
 assert.equal(justificarMudanca(' Revisão  pedagógica  solicitada '),'Revisão pedagógica solicitada');
 for(const x of ['','curto',null,'a'.repeat(201),{}])assert.equal(justificarMudanca(x),null);
});
