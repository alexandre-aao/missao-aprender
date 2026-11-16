import test from 'node:test';
import assert from 'node:assert/strict';
import {MODOS,TIPOS_SOLICITACAO,STATUS_SOLICITACAO,validarTexto,validarAviso,validarPaginacao} from '../api/_fase3-helpers.js';

test('modos operacionais são explícitos e proteção não admite códigos livres',()=>{
 assert.deepEqual([...MODOS].sort(),['normal','somente_leitura','manutencao'].sort());
 assert.equal(MODOS.has('remover_autenticacao'),false);
 assert.equal(MODOS.has(''),false);
});
test('suporte e solicitações pessoais têm tipos e estados limitados',()=>{
 assert.deepEqual([...TIPOS_SOLICITACAO].sort(),['suporte','exportacao','exclusao','correcao'].sort());
 assert.equal(TIPOS_SOLICITACAO.has('apagar_todos'),false);
 assert.ok(STATUS_SOLICITACAO.has('respondida'));
 assert.equal(STATUS_SOLICITACAO.has('bloqueada'),false);
});
test('justificativa e texto são limitados sem apagar espaços dentro',()=>{
 assert.equal(validarTexto('  Solicitação de   teste  ',10,200),'Solicitação de teste');
 for(const v of [null,{},'curto','x'.repeat(201)])assert.equal(validarTexto(v,10,200),null);
 assert.equal(validarTexto('a'.repeat(600),10,600)?.length,600);
 assert.equal(validarTexto('a'.repeat(601),10,600),null);
});
test('aviso público admite vazio, mas recusa parâmetros inválidos e longos',()=>{
 assert.equal(validarAviso(''),'');
 assert.equal(validarAviso('Estamos  em   manutenção'),'Estamos em manutenção');
 assert.equal(validarAviso('x'.repeat(181)),null);
 assert.equal(validarAviso(undefined),null);
});
test('paginação limita exportações de listas no painel',()=>{
 assert.deepEqual(validarPaginacao('20','0'),{limite:20,offset:0});
 assert.deepEqual(validarPaginacao('50','50000'),{limite:50,offset:50000});
 for(const [a,b] of [['100','0'],['-1','0'],['10','-1'],['x','0'],['10','50001']])
  assert.equal(validarPaginacao(a,b),null);
});
