export const MODOS=new Set(['normal','somente_leitura','manutencao']);
export const TIPOS_SOLICITACAO=new Set(['suporte','exportacao','exclusao','correcao']);
export const STATUS_SOLICITACAO=new Set(['aberta','em_analise','respondida','concluida']);
export function validarTexto(valor,min,max){
 if(typeof valor!=='string')return null;
 const v=valor.trim().replace(/\s+/g,' ');
 return v.length>=min&&v.length<=max?v:null;
}
export function validarAviso(valor){
 if(typeof valor!=='string')return null;
 const v=valor.trim().replace(/\s+/g,' ');
 return v.length<=180?v:null;
}
export function validarPaginacao(limite,offset){
 const l=Number(limite),o=Number(offset);
 return Number.isInteger(l)&&l>=1&&l<=50&&Number.isInteger(o)&&o>=0&&o<=50000?{limite:l,offset:o}:null;
}
