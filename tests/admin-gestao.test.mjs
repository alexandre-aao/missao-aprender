import test from 'node:test';
import assert from 'node:assert/strict';
import {validarBuscaAdmin,validarPaginacaoAdmin,validarJustificativaAdmin,validarStatusAdmin,validarAnoAdmin} from '../api/_admin-helpers.js';

test('pesquisa administrativa preserva string curta e recusa excessos',()=>{
 assert.equal(validarBuscaAdmin('  João    Silva  '),'João Silva');
 assert.equal(validarBuscaAdmin(''), '');
 assert.equal(validarBuscaAdmin('a'.repeat(81)),null);
 assert.equal(validarBuscaAdmin({}),null);
});
test('paginação é limitada e inteira',()=>{
 assert.deepEqual(validarPaginacaoAdmin('20','0'),{limite:20,offset:0});
 assert.deepEqual(validarPaginacaoAdmin('50','50000'),{limite:50,offset:50000});
 for(const a of [['0','0'],['51','0'],['10','-1'],['2.5','0'],['20','50001'],['x','2']])
  assert.equal(validarPaginacaoAdmin(...a),null);
});
test('suspensão exige motivo e filtros válidos',()=>{
 assert.equal(validarJustificativaAdmin('  Correção  solicitada   pelo responsável  '),'Correção solicitada pelo responsável');
 for(const bad of ['',null,'curto','a'.repeat(201)])assert.equal(validarJustificativaAdmin(bad),null);
 assert.equal(validarStatusAdmin('suspenso'),'suspenso');
 assert.equal(validarStatusAdmin('administrador'),null);
 assert.equal(validarAnoAdmin('-1'),-1);
 assert.equal(validarAnoAdmin('6'),6);
 assert.equal(validarAnoAdmin('1 OR 1=1'),null);
 assert.equal(validarAnoAdmin('7'),null);
});
