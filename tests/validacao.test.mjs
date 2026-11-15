import test from 'node:test';
import assert from 'node:assert/strict';
import { validarPerfil, validarId, autorizadoParaCriar, extrairBearer } from '../api/_helpers.js';

test('perfis válidos são aceitos sem coletar identificação pessoal',()=>{
 const v=validarPerfil({apelido:'  Meu   Robô ',avatar:'robo',ano_escolar:1});
 assert.deepEqual(v,{apelido:'Meu Robô',avatar:'robo',ano_escolar:1});
});
test('não aceita campos ausentes, dados inválidos ou texto HTML',()=>{
 for(const bad of [null,[],{},{apelido:'<script>',avatar:'robo',ano_escolar:1},{apelido:'A',avatar:'robo',ano_escolar:1},{apelido:'Nome',avatar:'hack',ano_escolar:1},{apelido:'Nome',avatar:'robo',ano_escolar:9},{apelido:'Nome',avatar:'robo',ano_escolar:'1'}]) {
   assert.ok(validarPerfil(bad).error);
 }
});
test('só cadastra com autorização explícita do responsável',()=>{
 assert.equal(autorizadoParaCriar({sou_responsavel:true,aceito_dados:true}),true);
 assert.equal(autorizadoParaCriar({sou_responsavel:true,aceito_dados:false}),false);
 assert.equal(autorizadoParaCriar({sou_responsavel:'true',aceito_dados:true}),false);
});
test('valida IDs e cabeçalho Bearer',()=>{
 assert.equal(validarId('54ea235d-28c0-4716-b75e-74b657302994'),true);
 assert.equal(validarId('1 OR 1=1'),false);
 assert.equal(extrairBearer('Bearer a.b_c-D'), 'a.b_c-D');
 assert.equal(extrairBearer('Basic aaa'), null);
 assert.equal(extrairBearer('Bearer '), null);
});
