// Validadores puros usados pela API administrativa; todos os filtros tambem sao verificados no SQL.
export function validarBuscaAdmin(value) {
  if (typeof value !== 'string') return null;
  const search=value.trim().replace(/\s+/g,' ');
  return search.length<=80 ? search : null;
}
export function validarPaginacaoAdmin(limit,offset){
  const l=Number(limit),o=Number(offset);
  if(!Number.isInteger(l)||l<1||l>50||!Number.isInteger(o)||o<0||o>50000)return null;
  return {limite:l,offset:o};
}
export function validarJustificativaAdmin(value){
  if(typeof value!=='string')return null;
  const motivo=value.trim().replace(/\s+/g,' ');
  return motivo.length>=10 && motivo.length<=200 ? motivo : null;
}
export function validarStatusAdmin(value){
  return ['todos','ativo','suspenso','restrito_neon'].includes(value)?value:null;
}
export function validarAnoAdmin(value){
  if(typeof value!=='string'||!/^(-1|[0-6])$/.test(value))return null;
  return Number(value);
}
