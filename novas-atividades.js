(() => {
const directions = {U:[-1,0,'↑','Cima'],R:[0,1,'→','Direita'],D:[1,0,'↓','Baixo'],L:[0,-1,'←','Esquerda']};
const cell = (map,symbol) => {
 const y=map.findIndex(row=>row.includes(symbol));
 return y<0?null:[y,map[y].indexOf(symbol)];
};
const at = (map,pos) => map[pos[0]]?.[pos[1]];
const same = (a,b) => a.length===b.length&&a.every((value,i)=>value===b[i]);
const sameSet = (a,b) => a.length===b.length&&b.every(value=>a.includes(value));
const shuffled = items => {
 const result=[...items];
 for(let i=result.length-1;i>0;i--){
  const j=Math.floor(Math.random()*(i+1));
  [result[i],result[j]]=[result[j],result[i]];
 }
 return result;
};
const money = new Intl.NumberFormat('pt-BR',{style:'currency',currency:'BRL'});
const price = cents => money.format(cents/100);
const total = (round,state) => round.tiles.reduce((sum,tile)=>sum+(state.selected.includes(tile.id)?tile.cents:0),0);
const escape = v => String(v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const progress = (round,state) => at(round.map,state.pos)==='G'&&(!cell(round.map,'C')||state.collected);
function move(round,state,direction){
 const delta=directions[direction];
 if(!delta)return false;
 const pos=state.pos.map((value,i)=>value+delta[i]);
 const target=at(round.map,pos);
 if(!target||target==='#')return false;
 state.pos=pos;
 if(target==='C')state.collected=true;
 return true;
}
function programSteps(round,commands){
 const state={pos:cell(round.map,'S'),collected:false};
 const frames=[];
 for(const [index,command] of commands.entries()){
  const [direction,repeat]=command;
  for(let n=0;n<(repeat==='2'?2:1);n++){
   if(!move(round,state,direction))return {frames,success:false,blocked:index};
   frames.push({pos:state.pos,collected:state.collected,index});
  }
 }
 return {frames,success:progress(round,state),blocked:null};
}
function create(round){
 return {
  selected:[],pairs:[],source:null,open:[],found:[],mismatch:false,
  deck:round.kind==='memory'?shuffled([...round.tiles,...round.tiles]):[],
  pos:round.map?cell(round.map,'S'):null,collected:false,
  commands:[...(round.seed||[])],repeat:false,running:false,frame:null,message:''
 };
}
function action(round,state,name,value){
 state.message='';
 const {kind,tiles,goal}=round;
 if(name==='choose'&&kind==='choose'&&tiles.some(t=>t.id===value))return value===goal?'success':'wrong';
 if(name==='select'&&['collect','shop','order'].includes(kind)&&tiles.some(t=>t.id===value)){
  if(state.selected.includes(value))state.selected=state.selected.filter(id=>id!==value);
  else if(state.selected.length<(round.limit??(kind==='order'?goal.length:tiles.length)))state.selected.push(value);
  else state.message='Retire uma peça para abrir espaço.';
 }
 if(name==='reset'&&!state.running)Object.assign(state,create(round));
 if(name==='check'&&state.selected.length){
  if(kind==='order')return same(state.selected,goal)?'success':'wrong';
  if(kind==='collect')return sameSet(state.selected,goal)?'success':'wrong';
  if(kind==='shop'){
   const cents=total(round,state);
   const fits=(round.budget===undefined||cents<=round.budget)&&(round.total===undefined||cents===round.total);
   const valid=(round.count===undefined||state.selected.length===round.count)&&(!round.required||sameSet(state.selected,round.required));
   return fits&&valid?'success':'wrong';
  }
 }
 if(name==='source'&&['match','mosaic'].includes(kind)&&tiles.some(t=>t.id===value)&&!state.pairs.includes(value))state.source=value;
 if(name==='pair'&&state.source!==null){
  const desired=kind==='mosaic'?goal[Number(value)]:value;
  if(!goal.includes(desired)||state.pairs.includes(desired))return '';
  if(desired!==state.source)return 'wrong';
  state.pairs.push(desired);state.source=null;
  return state.pairs.length===goal.length?'success':'';
 }
 if(name==='card'&&kind==='memory'&&!state.mismatch){
  const i=Number(value);
  if(!Number.isInteger(i)||!state.deck[i]||state.open.includes(i)||state.found.includes(i))return '';
  state.open.push(i);
  if(state.open.length===2){
   const [a,b]=state.open;
   if(state.deck[a].id!==state.deck[b].id){state.mismatch=true;return 'wrong'}
   state.found.push(...state.open);state.open=[];
   return state.found.length===state.deck.length?'success':'';
  }
 }
 if(name==='hide'&&kind==='memory'){state.open=[];state.mismatch=false}
 if(name==='move'&&kind==='route'){
  if(!move(round,state,value))return 'wrong';
  if(progress(round,state))return 'success';
 }
 if(kind==='program'&&!state.running){
  if(name==='repeat'&&round.repeat)state.repeat=!state.repeat;
  if(name==='append'&&directions[value]){
   if(state.commands.length<round.max){
    state.commands.push(value+(state.repeat?'2':''));
    state.repeat=false;
   }else state.message='Você usou todos os blocos. Retire um bloco para continuar.';
  }
  if(name==='remove'&&/^\d+$/.test(value))state.commands.splice(Number(value),1);
  if(name==='run'&&state.commands.length)return 'run';
 }
 return '';
}
function button(name,value,text,options={}){
 const {disabled=false,pressed,css='exp-tile',lang}=options;
 return `<button type="button" class="${css}" data-game="${name}" data-value="${escape(value)}"${disabled?' disabled':''}${pressed===undefined?'':` aria-pressed="${pressed}"`}${lang?` lang="${lang}"`:''}>${text}</button>`;
}
const picture = tile => tile.icon?`<span class="exp-icon${tile.tone?' tone-'+escape(tile.tone):''}" aria-hidden="true">${escape(tile.icon)}</span>`:'';
const label = tile => `${picture(tile)}<span>${escape(tile.label)}</span>`;
const control = (name,value,text,disabled=false) => button(name,value,text,{disabled,css:'btn btn-ghost'});
function board(round,state){
 const pos=state.pos;
 const actor=round.actor||'🤖',target=round.target||'⭐';
 const actorName=actor==='🚀'?'Foguete':actor==='🐇'?'Coelho':'Robô';
 const cells=round.map.flatMap((row,y)=>Array.from(row,(symbol,x)=>{
  const occupied=pos[0]===y&&pos[1]===x;
  const content=occupied?actor:symbol==='#'?'🧱':symbol==='G'?target:symbol==='C'&&!state.collected?'⭐':'';
  return `<span class="exp-cell ${symbol==='#'?'wall':''} ${occupied?'current':''} ${symbol==='G'?'goal':''}">${content}</span>`;
 })).join('');
 return `<div class="exp-board" aria-hidden="true" style="--cols:${round.map[0].length}">${cells}</div>
 <p class="exp-position" role="status">${actorName}: linha ${pos[0]+1}, coluna ${pos[1]+1}.${state.collected?' Estrela coletada.':''}</p>
 <details><summary>Ler o mapa</summary><ul>${round.map.map((row,y)=>`<li>Linha ${y+1}: ${Array.from(row,s=>({S:'início',G:'chegada','#':'parede',C:'estrela','.':'livre'}[s])).join(', ')}.</li>`).join('')}</ul></details>`;
}
function programBoard(round,state,disabled){
 const arrows=Object.entries(directions).map(([id,d])=>button(round.kind==='route'?'move':'append',id,`<strong aria-hidden="true">${d[2]}</strong><span>${d[3]}</span>`,{disabled})).join('');
 if(round.kind==='route')return `${board(round,state)}<div class="exp-directions">${arrows}</div>${control('reset','','Voltar ao início do labirinto',disabled)}`;
 const commands=state.commands.map((command,i)=>{
  const name=directions[command[0]][3]+(command[1]?' duas vezes':'');
  return button('remove',i,`<span aria-hidden="true">${directions[command[0]][2]}${command[1]?' ×2':''}</span><span class="sr-only">Retirar ${i+1}: ${name}</span>`,{disabled,css:`exp-block${state.frame===i?' current':''}`});
 }).join('');
 return `${board(round,state)}<p><strong>Seus blocos</strong> · ${state.commands.length} de ${round.max}</p>
 <div class="exp-queue" aria-label="Sequência de comandos">${commands||'<span>Toque nas setas para montar o caminho.</span>'}</div>
 ${round.repeat?button('repeat','','🔁 Repetir 2 vezes',{disabled,pressed:state.repeat,css:'btn btn-ghost'}):''}
 <div class="exp-directions">${arrows}</div>
 <div class="exp-tools">${button('run','',state.running?'Executando…':'▶ Executar',{disabled:disabled||!state.commands.length,css:'btn btn-primary'})}
 ${control('reset','','Recomeçar programa',disabled)}</div>`;
}
function memoryBoard(state,disabled){
 return `<div class="exp-options exp-memory">${state.deck.map((tile,i)=>{
  const found=state.found.includes(i), open=found||state.open.includes(i);
  return button('card',i,`<span class="sr-only">Carta ${i+1}${found?', par encontrado':''}. </span>${open?label(tile):'<span aria-hidden="true">❔</span><span class="sr-only">Virada para baixo</span>'}`,{disabled:disabled||found||open||state.mismatch});
 }).join('')}</div>${state.mismatch?control('hide','','Virar as cartas de volta',disabled):''}
 <p role="status">Pares encontrados: ${state.found.length/2} de ${state.deck.length/2}.</p>`;
}
function pairBoard(round,state,disabled){
 const sources=round.tiles.map(tile=>button('source',tile.id,label(tile),{disabled:disabled||state.pairs.includes(tile.id),pressed:state.source===tile.id})).join('');
 const targets=round.pairs.map((tile,i)=>{
  const id=round.kind==='mosaic'?round.goal[i]:tile.id;
  const found=state.pairs.includes(id);
  const piece=round.tiles.find(t=>t.id===id);
  const text=found?`<span class="sr-only">${escape(tile.label)}: </span>${label(piece)}`:round.kind==='match'&&round.tiles.some(t=>t.id===t.label)&&tile.icon?`${picture(tile)}<span class="sr-only">${escape(tile.label)}</span>`:label(tile);
  return button('pair',round.kind==='mosaic'?i:id,text,{disabled:disabled||found||state.source===null,css:round.kind==='mosaic'?`exp-tile exp-slot exp-slot-${i}`:'exp-tile'});
 }).join('');
 return `<div class="exp-options" aria-label="Peças para combinar">${sources}</div>
 <div class="${round.kind==='mosaic'?'exp-mosaic':'exp-options'}" aria-label="Destinos das peças">${targets}</div>`;
}
function selectionBoard(round,state,disabled){
 const {kind,tiles}=round;
 const items=tiles.map(tile=>button(kind==='choose'?'choose':'select',tile.id,`${label(tile)}${kind==='shop'?`<small>${price(tile.cents)}</small>`:''}`,{
  disabled,pressed:kind==='choose'?undefined:state.selected.includes(tile.id)
 })).join('');
 if(kind==='choose')return `<div class="exp-options">${items}</div>`;
 const isShop=kind==='shop';
 const chosen=state.selected.map(id=>{
  const tile=tiles.find(t=>t.id===id);
  return button('select',id,`<span class="sr-only">Retirar </span>${escape(tile.label)} <span aria-hidden="true">×</span>`,{disabled,css:'exp-block'});
 }).join('');
 const heading=isShop?(round.tray||'Seu carrinho'):kind==='order'?'Sua sequência':'Sua seleção';
 const cents=isShop?total(round,state):0;
 return `${isShop?`<p class="exp-fictitious">Dinheiro fictício${round.budget===undefined?'':' · Disponível: '+price(round.budget)}</p>`:''}
 <div class="exp-options">${items}</div>
 <p><strong>${heading}</strong></p><div class="exp-queue">${chosen||'<span>Toque para adicionar.</span>'}</div>
 ${isShop?`<p role="status"><strong>Total: ${price(cents)}</strong>${round.budget===undefined?'':cents<=round.budget?' · Sobra: '+price(round.budget-cents):' · Acima do orçamento'}</p>`:''}
 <div class="exp-tools">${button('check','',round.checkout?'Conferir compra fictícia':'Conferir',{disabled:disabled||!state.selected.length,css:'btn btn-primary'})}
 ${control('reset','','Limpar seleção',disabled||!state.selected.length)}</div>`;
}
function render(round,state,resolved){
 const disabled=resolved||state.running;
 let panel;
 if(round.map)panel=programBoard(round,state,disabled);
 else if(round.kind==='memory')panel=memoryBoard(state,disabled);
 else if(['match','mosaic'].includes(round.kind))panel=pairBoard(round,state,disabled);
 else panel=selectionBoard(round,state,disabled);
 return `<div class="exp-game"><div class="question-lead">
 ${control('speak','','🔊 Ouvir instrução',state.running)}
 ${round.english?button('english','','🔊 Ouvir em inglês',{css:'btn btn-ghost',lang:'pt-BR'}):''}</div>
 <h2 tabindex="-1">${escape(round.prompt)}</h2>
 ${round.passage?`<p class="exp-passage">${escape(round.passage)}</p>`:''}
 ${round.picture?`<div class="exp-picture">${picture(round.picture)}<span class="sr-only">${escape(round.picture.label)}</span></div>`:''}
 ${round.english?`<p class="exp-passage exp-word" lang="en-US">${escape(round.english)}</p>`:''}
 ${panel}
 <p class="exp-message" role="status" id="exp-message">${escape(state.message)}</p>
 ${resolved?'':control('hint','','💡 Quero uma dica',state.running)}
 </div>`;
}
window.MissaoMundos.activity = {create,action,render,programSteps};
})();
