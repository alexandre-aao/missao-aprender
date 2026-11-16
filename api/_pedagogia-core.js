import {MISSOES_PEDAGOGICAS,MAPA_MISSOES_PEDAGOGICAS,MUNDOS_PEDAGOGICOS} from './_catalogo-pedagogico.js';

export const ACOES_CATALOGO=new Set(['ocultar','mostrar','sinalizar','resolver']);
export function justificarMudanca(motivo){
 if(typeof motivo!=='string')return null;
 const texto=motivo.trim().replace(/\s+/g,' ');
 return texto.length>=10&&texto.length<=200?texto:null;
}
export function indicadoresPedagogicos(summary,raw=[],overrides=[]){
 const totals=summary&&typeof summary==='object'?summary:{};
 const metrics=new Map(raw.filter(x=>MAPA_MISSOES_PEDAGOGICAS.has(x.id)).map(x=>[x.id,x]));
 const states=new Map(overrides.filter(x=>MAPA_MISSOES_PEDAGOGICAS.has(x.id)).map(x=>[x.id,x]));
 const num=(x)=>{const n=Number(x);return Number.isFinite(n)&&n>=0?n:0;};
 const missions=MISSOES_PEDAGOGICAS.map(m=>{
  const r=metrics.get(m.id)||{},c=states.get(m.id)||{};
  const events=num(r.eventos),first=num(r.primeira_tentativa),errors=num(r.erros),
   skillsTries=num(r.tentativas_habilidade),skillsCorrect=num(r.acertos_habilidade);
  return {...m,concluintes:num(r.concluintes),estrelas:num(r.estrelas),eventos:events,
   primeira_tentativa:first,erros:errors,tentativas_habilidade:skillsTries,acertos_habilidade:skillsCorrect,
   oculto:c.oculto===true,revisao_pendente:c.revisao_pendente===true,motivo:c.motivo||'',
   alterado_em:c.alterado_em||null};
 });
 const worlds=Object.entries(MUNDOS_PEDAGOGICOS).map(([id,nome])=>{
  const group=missions.filter(m=>m.world===id);
  return {id,nome,missoes:group.length,ocultas:group.filter(m=>m.oculto).length,
   concluintes:group.reduce((n,m)=>n+m.concluintes,0),
   praticas:group.reduce((n,m)=>n+m.eventos,0),
   primeira_tentativa:group.reduce((n,m)=>n+m.primeira_tentativa,0),
   erros:group.reduce((n,m)=>n+m.erros,0),
   com_conclusoes:group.filter(m=>m.concluintes>0).length};
 });
 const totalEvents=missions.reduce((n,m)=>n+m.eventos,0), first=missions.reduce((n,m)=>n+m.primeira_tentativa,0);
 // Amostra minima: 5 registros e 3 erros, para não destacar ruído como diagnóstico pedagógico.
 const revisao=missions.filter(m=>m.eventos>=5&&m.erros>=3)
  .sort((a,b)=>(b.erros/Math.max(b.eventos,1))-(a.erros/Math.max(a.eventos,1))||b.eventos-a.eventos)
  .slice(0,8)
  .map(m=>({id:m.id,title:m.title,world:m.world,eventos:m.eventos,erros:m.erros,
   indice_primeira_tentativa:Math.round(m.primeira_tentativa/m.eventos*100)}));
 return {resumo:{
    perfis_total:num(totals.perfis_total),perfis_sincronizados:num(totals.perfis_sincronizados),
    perfis_sem_sincronizacao:num(totals.perfis_sem_sincronizacao),
    sinc_7d:num(totals.sinc_7d),sinc_30d:num(totals.sinc_30d),
    ultima_sincronizacao:totals.ultima_sincronizacao||null,
    conclusoes:missions.reduce((n,m)=>n+m.concluintes,0),
    registros:totalEvents,
    indice_primeira_tentativa:totalEvents?Math.round(first/totalEvents*100):null,
    catalogo_total:missions.length,ocultas:missions.filter(m=>m.oculto).length,
    pendencias:missions.filter(m=>m.revisao_pendente).length
  },mundos:worlds,missoes:missions,revisao};
}
