/* Missão Aprender — serialização e mesclagem puras. Nunca confiar nestes dados para rankings/duelos. */
import { IDS_MISSOES } from './api/catalogo.js';

export const MISSIONS_SET = new Set(IDS_MISSOES);
export const MAX_RECORDS = 3000;
export const MAX_BYTES = 480000;
const plain = x => x !== null && typeof x === 'object' && !Array.isArray(x);
const nint = (x,max=1000000) => Number.isInteger(x) && x >= 0 && x <= max;
const stamp = x => typeof x === 'string' && x.length <= 35 && !Number.isNaN(Date.parse(x));
const assert = (condition,text) => { if (!condition) throw new TypeError(text); };
export function emptyProgress() {
 return {version:2,grade:'1',missions:{},skills:{},records:[],started:new Date().toISOString(),migrated:{}};
}
export function normalizarEstado(input) {
 assert(plain(input) && input.version===2,'Formato de progresso desconhecido.');
 assert(plain(input.missions) && plain(input.skills) && Array.isArray(input.records),'Dados de aprendizagem inválidos.');
 const grade=String(input.grade);
 assert(/^[1-6]$/.test(grade),'Ano escolar inválido.');
 const missions={};
 const missionKeys=Object.keys(input.missions);
 assert(missionKeys.length<=MISSIONS_SET.size,'Número de missões inválido.');
 for(const id of missionKeys){
  assert(MISSIONS_SET.has(id),'Atividade desconhecida.');
  const v=input.missions[id];assert(plain(v),'Resultado de missão inválido.');
  assert(nint(v.stars,3)&&v.stars>=1,'Estrelas inválidas.');
  assert(v.lastStars===undefined||nint(v.lastStars,3),'Estrelas inválidas.');
  assert(v.completedAt==null||stamp(v.completedAt),'Data de conclusão inválida.');
  missions[id]={stars:v.stars,lastStars:v.lastStars??v.stars,completedAt:v.completedAt??null};
 }
 const skills={};
 const skillKeys=Object.keys(input.skills);
 assert(skillKeys.length<=72,'Número de habilidades inválido.');
 for(const id of skillKeys){
  assert(MISSIONS_SET.has(id),'Habilidade desconhecida.');
  const v=input.skills[id];assert(plain(v),'Habilidade inválida.');
  const tries=v.tries,correct=v.correct,streak=v.streak;
  assert(nint(tries)&&nint(correct)&&correct<=tries&&nint(streak)&&streak<=tries,'Contadores inválidos.');
  skills[id]={tries,correct,streak,mastered:v.mastered===true};
 }
 assert(input.records.length<=MAX_RECORDS,'Histórico grande demais.');
 const records=input.records.map(v=>{
  assert(plain(v)&&MISSIONS_SET.has(v.id)&&stamp(v.date),'Registro de progresso inválido.');
  assert(typeof v.firstTry==='boolean'&&nint(v.errors,200),'Resultado inválido.');
  if(v.eventId!==undefined)assert(typeof v.eventId==='string' && /^[a-zA-Z0-9-]{8,65}$/.test(v.eventId),'Identificador inválido.');
  const world=['math','review','science','words','logic','code','english','money'].includes(v.world)?v.world:'math';
  return {id:v.id,world,firstTry:v.firstTry,errors:v.errors,date:v.date,...(v.legacy===true?{legacy:true}:{}),...(v.eventId?{eventId:v.eventId}:{})};
 });
 const migrated={};if(plain(input.migrated))for(const key of ['piloto','matematica'])if(input.migrated[key]===true)migrated[key]=true;
 const started=stamp(input.started)?input.started:new Date().toISOString();
 const result={version:2,grade,missions,skills,records,started,migrated};
 assert(new TextEncoder().encode(JSON.stringify(result)).length<=MAX_BYTES,'O progresso excedeu o limite permitido.');
 return result;
}
export function mesclarProgressos(local,remoto){
 const a=normalizarEstado(local),b=normalizarEstado(remoto);
 const missions={...b.missions};
 for(const [id,item] of Object.entries(a.missions)){
  const other=missions[id];
  if(!other){missions[id]=item;continue}
  missions[id]={stars:Math.max(item.stars,other.stars),lastStars:(item.completedAt||'')>=(other.completedAt||'')?item.lastStars:other.lastStars,completedAt:(item.completedAt||'')>=(other.completedAt||'')?item.completedAt:other.completedAt};
 }
 const skills={...b.skills};
 for(const [id,item] of Object.entries(a.skills)){
  const other=skills[id];
  skills[id]=other?{tries:Math.max(item.tries,other.tries),correct:Math.max(item.correct,other.correct),streak:Math.max(item.streak,other.streak),mastered:item.mastered||other.mastered}:item;
  skills[id].correct=Math.min(skills[id].correct,skills[id].tries);
 }
 const events=new Map();
 for(const v of [...b.records,...a.records]){
  const key=v.eventId||JSON.stringify([v.id,v.world,v.date,v.firstTry,v.errors,v.legacy||false]);
  if(!events.has(key))events.set(key,v);
 }
 const records=[...events.values()].sort((x,y)=>x.date.localeCompare(y.date)).slice(-MAX_RECORDS);
 return normalizarEstado({version:2,grade:a.grade,missions,skills,records,started:a.started<b.started?a.started:b.started,migrated:{piloto:a.migrated.piloto||b.migrated.piloto,matematica:a.migrated.matematica||b.migrated.matematica}});
}
export function hasProgress(data){
 return Boolean(data&&(Object.keys(data.missions||{}).length||Object.keys(data.skills||{}).length||(data.records||[]).length));
}
export function profileStorageKey(userId,profileId){
 assert(/^[a-z0-9-]{16,200}$/i.test(userId),'Usuário inválido.');
 assert(/^[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i.test(profileId),'Perfil inválido.');
 return `missao-aprender-v2:${userId}:${profileId}`;
}
