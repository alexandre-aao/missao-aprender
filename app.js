/* Missão Aprender — piloto independente, sem dependências nem coleta de dados. */
(()=>{
'use strict';
const STORAGE_KEY='missao-aprender-unificado-v1';
const OLD_PILOT_KEY='missao-aprender-piloto-v1';
const OLD_MATH_KEY='missao-matematica-v1';
const CURRICULUM=window.MissaoAprenderCurriculo;
const {SKILLS,UNITS,YEARS}=CURRICULUM;
const unitIcons=Object.fromEntries(Object.entries(UNITS).map(([k,v])=>[k,v.emoji]));
let unitFilter='all';
const BASE_MISSIONS=[
 {id:'m-contar',world:'math',title:'Conte os tesouros',desc:'Toque nos desenhos e descubra quantos existem.',icon:'🍎',type:'count',questions:4},
 {id:'m-somar',world:'math',title:'Vamos somar?',desc:'Junte duas coleções para encontrar o total.',icon:'➕',type:'sum',questions:4},
 {id:'m-comparar',world:'math',title:'Quem tem mais?',desc:'Compare grupos e escolha o que tem mais.',icon:'⚖️',type:'compare',questions:4},
 {id:'p-contar',world:'review',title:'Conte até cinco',desc:'Uma revisão tranquila, com poucos objetos.',icon:'🧸',type:'preschool',questions:4},
 {id:'c-gravidade',world:'science',title:'Por que a bola cai?',desc:'Faça a experiência e descubra a gravidade.',icon:'🏀',type:'gravity',questions:1},
 {id:'c-dia-noite',world:'science',title:'Como nasce a noite?',desc:'Gire a Terra e observe onde está iluminado.',icon:'🌎',type:'daynight',questions:1}
];
// Laboratórios de observação ilustrados, com duas experiências antes da pergunta.
const SCIENCE_DISCOVERIES=[
 {id:'c-plantas',title:'O que a plantinha precisa?',desc:'Compare a plantinha com água e sem água.',icon:'🌱',ask:'O que uma planta precisa para crescer saudável?',choices:[['agua','Água, luz e nutrientes'],['brinquedos','Apenas brinquedos'],['escuro','Só escuridão']],right:'agua',explain:'Plantas precisam de água, luz e nutrientes. Os efeitos reais levam tempo; este desenho é ilustrativo.',actions:[['💧','Regar a planta','🌿💧','Com água e boas condições, a planta pode continuar crescendo.'],['🏜️','Deixar sem água','🌱☀️','Sem água por tempo suficiente, muitas plantas murcham.']]},
 {id:'c-flutua',title:'Flutua ou afunda?',desc:'Experimente colocar materiais na água.',icon:'🛶',ask:'Qual desses objetos geralmente flutua na água?',choices:[['madeira','Um bloco de madeira'],['pedra','Uma pedra'],['metal','Uma bola maciça de aço']],right:'madeira',explain:'Um bloco comum de madeira costuma flutuar e uma pedra costuma afundar. A forma e o material fazem diferença.',actions:[['🪵','Colocar madeira','🪵🌊','O bloco de madeira permanece na superfície.'],['🪨','Colocar pedra','🌊🪨','A pedra desce para o fundo.']]},
 {id:'c-ima',title:'Descubra o ímã!',desc:'Teste o que é atraído por um ímã.',icon:'🧲',ask:'Qual objeto costuma ser atraído por um ímã?',choices:[['clipe','Clipe de aço'],['papel','Folha de papel'],['plastico','Tampinha de plástico']],right:'clipe',explain:'O aço de muitos clipes contém ferro e pode ser atraído por ímãs. Nem todo metal é magnético.',actions:[['📎','Testar clipe de aço','🧲✨📎','O clipe de aço é atraído pelo ímã.'],['📄','Testar papel','🧲   📄','O papel não é atraído pelo ímã.'],['🧩','Testar plástico','🧲   🧩','O plástico não é atraído pelo ímã.']]},
 {id:'c-sombras',title:'Brinque de luz e sombra',desc:'Troque o lado da lanterna.',icon:'🔦',ask:'A sombra aparece geralmente em qual lado do objeto?',choices:[['oposto','No lado oposto à fonte de luz'],['mesmo','No mesmo lado da luz'],['dentro','Dentro da lanterna']],right:'oposto',explain:'Objetos opacos bloqueiam a luz, formando uma sombra do lado oposto ao ponto de onde ela vem.',actions:[['⬅️','Luz vindo da esquerda','🔦 → 🧸 ▓▓','A sombra se forma à direita do ursinho.'],['➡️','Luz vindo da direita','▓▓ 🧸 ← 🔦','A sombra se forma à esquerda do ursinho.']]},
 {id:'c-som',title:'Como nasce o som?',desc:'Explore a vibração de um tambor.',icon:'🥁',ask:'O que produz o som do tambor?',choices:[['vibracao','A vibração da superfície'],['cor','A cor do tambor'],['silencio','O silêncio']],right:'vibracao',explain:'Quando o tambor é tocado, sua membrana vibra e produz ondas sonoras.',actions:[['🥁','Bater no tambor','🥁 〰️〰️','A superfície vibra e o som se propaga.'],['✋','Parar de tocar','🥁 ⏸️','Depois que a vibração para, o som produzido também termina.']]},
 {id:'c-agua',title:'Gelo e água',desc:'Veja o que pode acontecer com o gelo.',icon:'🧊',ask:'O que acontece com o gelo quando recebe calor suficiente?',choices:[['derrete','Derrete e vira água líquida'],['vira-pedra','Vira pedra'],['cresce','Cresce para sempre']],right:'derrete',explain:'Gelo é água no estado sólido. Ao receber calor suficiente, derrete e passa ao estado líquido.',actions:[['❄️','Deixar bem frio','🧊🧊','Em temperatura adequada, a água pode permanecer congelada.'],['☀️','Aquecer no desenho','🧊 → 💧','Com calor suficiente, o gelo derrete. Experimente apenas no desenho!']]},
 {id:'c-sol',title:'O que é o Sol?',desc:'Compare o Sol e um planeta.',icon:'☀️',ask:'O Sol é…',choices:[['estrela','Uma estrela'],['planeta','Um planeta'],['lua','Uma lua']],right:'estrela',explain:'O Sol é uma estrela. A Terra é um planeta que orbita o Sol.',actions:[['☀️','Observar o Sol','☀️ ✨','O Sol produz sua própria luz. Nunca olhe diretamente para ele.'],['🌍','Observar a Terra','🌍 🌙','A Terra é um planeta, iluminado pelo Sol.']]},
 {id:'c-borboleta',title:'Vida da borboleta',desc:'Observe fases da metamorfose.',icon:'🦋',ask:'Qual animal aparece ao final dessa transformação?',choices:[['borboleta','Borboleta adulta'],['peixe','Peixe'],['passaro','Passarinho']],right:'borboleta',explain:'No ciclo ilustrado, a borboleta passa por ovo, lagarta, crisálida e borboleta adulta.',actions:[['🥚','Ver começo do ciclo','🥚 → 🐛','De um ovo nasce uma lagarta.'],['🦋','Ver etapa final','🐛 → 🟤 → 🦋','A lagarta forma uma crisálida, da qual emerge a borboleta adulta.']]}
].map(x=>({...x,world:'science',type:'discovery',questions:1}));
const MISSIONS=[...BASE_MISSIONS,...SKILLS.map(s=>({
 id:s.id,world:s.grade==='P'?'review':'math',grade:s.grade,
 title:s.title,desc:s.desc,icon:unitIcons[s.unit]||'📚',
 type:'curriculum',questions:8,unit:s.unit,skill:s,bncc:s.bncc
})),...SCIENCE_DISCOVERIES];
const WORLDS={
 math:{name:'Matemática',subtitle:'Sua trilha principal do 1º ano',icon:'🔢',css:'math',label:'PRINCIPAL',detail:'Conte, junte e compare. Aprender matemática pode ser uma aventura.'},
 review:{name:'Revisão pré-escola',subtitle:'Revisar também é aprender',icon:'🧸',css:'review',label:'REVISÃO',detail:'Atividades simples para reforçar a base, sem trocar o ano escolar.'},
 science:{name:'Ciências',subtitle:'Laboratório de descobertas',icon:'🔬',css:'science',label:'EXPLORAR',detail:'Experiências interativas para observar e fazer descobertas.'}
};
const ICONS=['🍎','⭐','🐠','🍓','🍪','🚗','🦋'];
const $=id=>document.getElementById(id);
const random=(lo,hi)=>Math.floor(Math.random()*(hi-lo+1))+lo;
const pick=a=>a[random(0,a.length-1)];
const shuffle=arr=>{let a=[...arr];for(let i=a.length-1;i>0;i--){let j=random(0,i);[a[i],a[j]]=[a[j],a[i]]}return a};
const escapeHtml=str=>String(str).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function fresh(){return{version:2,grade:'1',missions:{},skills:{},records:[],started:new Date().toISOString(),migrated:{}}}
function readStored(key){try{const raw=localStorage.getItem(key);return raw?JSON.parse(raw):null}catch(e){return null}}
function load(){
 const existing=readStored(STORAGE_KEY);
 if(existing&&existing.version===2&&existing.missions&&existing.skills&&Array.isArray(existing.records)){
   existing.grade=YEARS.some(y=>y.id===existing.grade&&y.id!=='P')?existing.grade:'1';
   return existing;
 }
 const merged=fresh();
 const pilot=readStored(OLD_PILOT_KEY);
 if(pilot&&pilot.version===1&&pilot.missions&&Array.isArray(pilot.records)){
   merged.missions={...pilot.missions};merged.records=[...pilot.records];merged.migrated.piloto=true;
 }
 const previous=readStored(OLD_MATH_KEY);
 if(previous&&previous.skills&&Array.isArray(previous.history)){
   merged.skills={...previous.skills};
   const oldRecords=previous.history.map(h=>({id:h.id,world:SKILLS.find(s=>s.id===h.id)?.grade==='P'?'review':'math',firstTry:!!h.ok,errors:h.ok?0:1,date:h.date,legacy:true}));
   merged.records=[...merged.records,...oldRecords].slice(-3000);
   merged.migrated.matematica=true;
 }
 try{localStorage.setItem(STORAGE_KEY,JSON.stringify(merged))}catch(e){}
 return merged;
}
let data=load();let storageScope=STORAGE_KEY;let view='home';let session=null;let parentAllowed=false;let gateAnswer=0;let previousView='home';let gravityTimeout=null;
function save(){try{localStorage.setItem(storageScope,JSON.stringify(data));return true}catch(e){return false}}
function getMission(id){return MISSIONS.find(m=>m.id===id)}
function worldMissions(world){return MISSIONS.filter(m=>m.world===world&&(world!=='math'||(m.grade?m.grade===data.grade:data.grade==='1')))}
function currentMissions(){return [...worldMissions('math'),...worldMissions('review'),...worldMissions('science')]}
function missionDone(m){return !!data.missions[m.id] || (m.type==='curriculum'&&!!data.skills[m.id]?.mastered)}
function skillInfo(id){return data.skills[id]||{tries:0,correct:0,streak:0,mastered:false}}
function skillLevel(id){const p=skillInfo(id),accuracy=p.tries?p.correct/p.tries:0;return p.correct>=10&&accuracy>=.8?3:p.correct>=4&&accuracy>=.7?2:1}
function generateQuestion(m){return m.type==='curriculum'?CURRICULUM.question(m.skill,skillLevel(m.id)):makeQuestion(m)}
function completed(world){return worldMissions(world).filter(m=>missionDone(m)).length}
function totalStars(){return Object.values(data.missions).reduce((sum,x)=>sum+(Number(x.stars)||0),0)}
function numSolved(){return data.records.length}
function firstTryPercent(){return numSolved()?Math.round(data.records.filter(x=>x.firstTry).length/numSolved()*100):0}
function lastProgress(){return currentMissions().find(m=>!missionDone(m))||worldMissions('math')[0]||MISSIONS[0]}
function worldCard(key){const w=WORLDS[key],done=completed(key),all=worldMissions(key).length;return `<button class="world ${w.css}" data-nav="${key}" aria-label="Abrir ${escapeHtml(w.name)}"><span class="tag">${w.label}</span><span class="world-icon">${w.icon}</span><strong>${w.name}</strong><p>${key==='math'?`Conteúdos do ${data.grade}º ano`:w.subtitle}</p><span class="world-link">${done} de ${all} missões · Explorar →</span></button>`}
function homeView(){return `<section class="hero"><div class="hero-content"><span class="eyebrow">OLÁ, PEQUENO EXPLORADOR! ✨</span><h1>Todo dia é dia<br>de descobrir algo!</h1><p>Vamos contar, brincar e investigar como o mundo funciona? Você escolhe a aventura.</p><button class="btn btn-light" data-start="${lastProgress().id}">🚀 Começar uma missão</button></div><span class="hero-art" aria-hidden="true">🪐</span></section><div class="section-heading"><div><h2>Escolha sua aventura</h2><p>O 1º ano é o principal. A revisão e as ciências ficam sempre disponíveis.</p></div></div><div class="world-grid">${worldCard('math')}${worldCard('review')}${worldCard('science')}</div><div class="tip-banner"><span class="tip-icon">💡</span><div><strong>Uma descoberta de cada vez</strong><p>Dez minutinhos de curiosidade já fazem diferença. Experimente junto, sem pressa e sem cobrança por notas.</p></div></div>`}
function missionCard(m){const progress=data.missions[m.id],isDone=missionDone(m),p=m.type==='curriculum'?skillInfo(m.id):null;return `<button type="button" class="mission-card" data-start="${m.id}"><div class="mission-top"><span class="mission-icon">${m.icon}</span><span class="tag">${isDone?'CONCLUÍDA ✓':m.type==='curriculum'?'PRATICAR':'JOGAR'}</span></div><h3>${escapeHtml(m.title)}</h3><p>${escapeHtml(m.desc)}</p><div class="mission-bottom"><span>${progress?`⭐ ${progress.stars} ${progress.stars===1?'estrela':'estrelas'}`:p?.tries?`${p.correct}/${p.tries} acertos iniciais`:m.bncc?`📘 ${escapeHtml(m.bncc)}`:'Começar agora'}</span><span aria-hidden="true">→</span></div></button>`}
function worldView(world){
 const w=WORLDS[world],all=worldMissions(world),done=completed(world);
 const filters=world==='science'?[]:[['all','Todas'],...Object.entries(UNITS).map(([k,v])=>[k,`${v.emoji} ${v.label}`])];
 const ms=all.filter(m=>unitFilter==='all'||m.unit===unitFilter||m.type!=='curriculum'&&unitFilter==='all');
 const gradeLabel=world==='math'?`${data.grade}º ANO DO ENSINO FUNDAMENTAL`:world==='review'?'REVISAR AS BASES':'EXPERIMENTAR';
 return `<div class="page-intro"><div><div class="eyebrow">${w.label} · ${gradeLabel}</div><h1>${w.name}</h1><p>${world==='math'?`Exercícios e desafios organizados para o ${data.grade}º ano. A pré-escola continua disponível para revisão.`:w.detail}</p></div><span class="page-art" aria-hidden="true">${w.icon}</span></div>
 <div class="progress-summary"><strong>${done} de ${all.length} missões</strong><div class="meter" aria-label="${Math.round(done/Math.max(1,all.length)*100)}% concluído"><span style="width:${done/Math.max(1,all.length)*100}%"></span></div><small>Avance no seu ritmo 🌱</small></div>
 ${filters.length?`<div class="unit-filters" aria-label="Filtrar assuntos">${filters.map(([key,name])=>`<button type="button" class="unit-filter ${key===unitFilter?'active':''}" data-unit="${key}">${name}</button>`).join('')}</div>`:''}
 <div class="mission-grid">${ms.map(missionCard).join('')}</div>
 ${world==='science'?'<div class="tip-banner"><span class="tip-icon">🧪</span><div><strong>Hora de observar</strong><p>São modelos ilustrativos e não experimentos em escala real. Convide um adulto para conversar sobre as descobertas.</p></div></div>':`<p class="curriculum-note">📘 Atividades de matemática agrupadas por assuntos curriculares. A revisão não altera o ano principal, e os registros ficam neste dispositivo.</p>`}`
}
function choices(answer,limit){const s=new Set([Number(answer)]);for(let off of shuffle([-3,-2,-1,1,2,3,4,-4,5])){if(s.size===3)break;let n=Number(answer)+off;if(n>=0&&n<=limit)s.add(n)}for(let i=0;s.size<3&&i<=limit;i++)s.add(i);return shuffle([...s].slice(0,3).map(String))}
function makeQuestion(m){const icon=pick(ICONS);let n=0,a=0,b=0,text='',hint='',answer='',parts=[],answers=[];
 if(m.type==='count'||m.type==='preschool'){
   n=random(1,m.type==='preschool'?5:10);text=m.type==='preschool'?'Vamos contar! Quantos desenhos você vê?':'Quantos tesouros você consegue contar?';hint=`Conte com calma: há ${n} ${n===1?'desenho':'desenhos'} ao todo.`;answer=String(n);parts=[{icon,n}];answers=choices(n,m.type==='preschool'?8:13);
 }else if(m.type==='sum'){
   a=random(1,5);b=random(1,10-a);n=a+b;text='Se juntarmos os dois grupos, quantos desenhos teremos?';hint=`Primeiro conte ${a}. Depois conte mais ${b}. No total são ${n}.`;answer=String(n);parts=[{icon,n:a},{icon,n:b}];answers=choices(n,13);
 }else if(m.type==='compare'){
   a=random(1,9);b=random(1,9);if(a===b)b=a===9?10:a+1;text='Qual grupo tem mais desenhos?';answer=a>b?'A':'B';hint=`O grupo A tem ${a} e o B tem ${b}. ${a>b?'A tem mais!':'B tem mais!'}`;parts=[{icon,n:a},{icon,n:b}];answers=['A','B'];
 }
 return{text,hint,answer,parts,answers,icon};
}
function objectTokens(group,n){return `<div class="object-list">${Array.from({length:n},(_,i)=>`<button type="button" class="object-token ${session.marked.has(`${group}-${i}`)?'marked':''}" data-object="${group}-${i}" aria-label="Marcar desenho ${i+1}" aria-pressed="${session.marked.has(`${group}-${i}`)}">${session.question.parts[group].icon}</button>`).join('')}</div>`}
function questionBoard(m,q){if(m.type==='compare')return `<div class="object-board compare-board"><div class="compare-box"><strong>GRUPO A</strong>${objectTokens(0,q.parts[0].n)}</div><div class="compare-box"><strong>GRUPO B</strong>${objectTokens(1,q.parts[1].n)}</div></div>`;
 if(m.type==='sum')return `<div class="object-board math-display">${objectTokens(0,q.parts[0].n)}<span class="math-sign">+</span>${objectTokens(1,q.parts[1].n)}<span class="math-sign">= ?</span></div>`;
 return `<div class="object-board">${objectTokens(0,q.parts[0].n)}</div>`;
}
function choiceButtons(q){return `<div class="choice-grid ${q.answers.length===2?'two':''}" role="group" aria-label="Escolha sua resposta">${q.answers.map(a=>`<button type="button" data-answer="${escapeHtml(a)}" class="choice ${session.resolved&&a===q.answer?'correct':''} ${session.wrongOptions.has(a)?'wrong':''}" ${session.resolved||session.wrongOptions.has(a)?'disabled':''}>${a==='A'?'Grupo A':a==='B'?'Grupo B':escapeHtml(a)}</button>`).join('')}</div>`}
function feedbackHtml(){if(!session.feedback)return '';let correct=session.feedback.kind==='right';let last=session.step+1>=session.mission.questions;return `<div class="feedback ${correct?'':'try-again'}" role="status"><div><strong>${correct?'🎉 Você descobriu! Muito bem!':'💛 Boa tentativa. Vamos pensar juntos!'}</strong><p>${escapeHtml(session.feedback.text)}</p></div>${correct?`<button type="button" class="btn btn-primary" data-next="1">${last?'Concluir missão →':'Próximo desafio →'}</button>`:''}</div>`}
function mathActivity(){let m=session.mission,q=session.question;return `<div class="question-lead"><span>🧠 VAMOS PENSAR</span><button type="button" data-speak="1" class="listen">🔊 Ouvir pergunta</button></div><h2>${escapeHtml(q.text)}</h2><p class="question-sub">Dica: toque nos desenhos para marcar enquanto conta.</p>${questionBoard(m,q)}${choiceButtons(q)}${feedbackHtml()}`}
function curriculumActivity(){
 const q=session.question,m=session.mission;
 return `<div class="question-lead"><span>🧠 ${escapeHtml(UNITS[m.unit]?.label||'DESAFIO')}</span><button type="button" data-speak="1" class="listen">🔊 Ouvir pergunta</button></div><h2>${escapeHtml(q.prompt)}</h2><p class="question-sub">Observe os desenhos e escolha a alternativa. Você pode tentar novamente.</p><div class="curriculum-visual">${q.visual}</div><div class="choice-grid" role="group" aria-label="Escolha sua resposta">${q.options.map(a=>`<button type="button" data-answer="${escapeHtml(a)}" class="choice ${session.resolved&&a===q.answer?'correct':''} ${session.wrongOptions.has(a)?'wrong':''}" ${session.resolved||session.wrongOptions.has(a)?'disabled':''}>${escapeHtml(a)}</button>`).join('')}</div>${feedbackHtml()}`;
}
function gravityBoard(){const bottom={1:77,2:126,3:168}[session.height]||126;return `<div class="question-lead"><span>🔬 LABORATÓRIO DE FÍSICA</span><button type="button" class="listen" data-speak="1">🔊 Ouvir</button></div><h2>O que acontece quando soltamos a bola?</h2><p class="question-sub">Escolha uma altura e toque em “Soltar a bola”. Observe!</p><div class="experiment-board" aria-label="Área da experiência de gravidade"><div class="gravity-ground"></div><span class="gravity-arrows" aria-hidden="true">⬇ ⬇ ⬇</span><div class="gravity-ball ${session.released?'ground':''}" style="--ball-bottom:${bottom}px" role="img" aria-label="Bola laranja"></div></div><div class="experiment-control"><label for="height">Altura de onde soltar: <strong id="height-label">${['','Baixa','Média','Alta'][session.height]}</strong></label><input id="height" type="range" min="1" max="3" step="1" value="${session.height}"><div class="experiment-actions"><button type="button" class="btn btn-primary" data-drop="1" ${session.dropping?'disabled':''}>🏀 Soltar a bola</button><small>${session.drops?'Experiência realizada '+session.drops+' '+(session.drops===1?'vez':'vezes'):'Você pode experimentar mais de uma vez.'}</small></div></div>${session.drops?'<div class="tip-banner" style="margin:0"><span class="tip-icon">👀</span><div><strong>Você viu? A bola foi para o chão!</strong><p>Ela cai porque a gravidade da Terra a puxa para baixo.</p></div></div>':''}${scienceAnswerArea('Quando soltamos uma bola, ela…',[['cai','Cai em direção ao chão'],['sobe','Sobe sozinha'],['para','Fica parada no ar']],'cai','A gravidade da Terra puxa a bola para baixo.')}`}
function earthDotStyle(){const deg=session.angle*Math.PI/180;return `--dot-x:${50-41*Math.cos(deg)}%;--dot-y:${50+41*Math.sin(deg)}%`}
function earthPeriod(){return Math.cos(session.angle*Math.PI/180)>=0?'DIA ☀️':'NOITE 🌙'}
function dayNightBoard(){return `<div class="question-lead"><span>🌎 LABORATÓRIO ESPACIAL</span><button type="button" class="listen" data-speak="1">🔊 Ouvir</button></div><h2>Por que temos dia e noite?</h2><p class="question-sub">Gire a Terra e acompanhe o pontinho amarelo. Ele está do lado claro ou escuro?</p><div class="experiment-board earth-board"><div class="sun" aria-hidden="true">☀️</div><div class="space-rays"></div><div class="earth-disc" role="img" aria-label="Modelo simplificado da Terra, com metade iluminada pelo Sol"><div class="day-mask"></div><div id="location-dot" class="location-dot" style="${earthDotStyle()}"></div></div><span class="sun-label">SOL</span><span class="earth-labels" id="earth-period">NO PONTINHO: ${earthPeriod()}</span></div><p class="disclaimer">Modelo ilustrativo visto de cima, fora de escala. O Sol permanece à esquerda; a Terra gira.</p><div class="experiment-control"><label for="angle">Gire a Terra: <strong id="angle-label">${session.angle}°</strong></label><input id="angle" type="range" min="0" max="360" step="10" value="${session.angle}"><div class="experiment-actions"><button type="button" class="btn btn-ghost" data-halfturn="1">↻ Girar meia volta</button><small>O pontinho representa um lugar na Terra.</small></div></div>${session.rotated?'<div class="tip-banner" style="margin:0"><span class="tip-icon">💡</span><div><strong>A Terra gira!</strong><p>Quando um lugar está voltado para o Sol é dia. Do outro lado é noite.</p></div></div>':''}${scienceAnswerArea('Quando um lugar da Terra está voltado para o Sol, é…',[['dia','Dia'],['noite','Noite'],['chuva','Sempre chuva']],'dia','O Sol ilumina o lado da Terra voltado para ele. No lado oposto é noite.')}`}
function scienceAnswerArea(prompt,opts,answer,hint){if(!(session.mission.type==='gravity'?session.drops>0:session.rotated))return `<p class="activity-footnote">Primeiro faça a experiência para liberar o desafio! ✨</p>`;return `<div class="experiment-answer"><h3>${prompt}</h3><div class="choice-grid" role="group" aria-label="Escolha sua resposta">${opts.map(([id,label])=>`<button type="button" class="choice ${session.resolved&&id===answer?'correct':''} ${session.wrongOptions.has(id)?'wrong':''}" style="font-size:15px" data-science-answer="${id}" ${session.resolved||session.wrongOptions.has(id)?'disabled':''}>${label}</button>`).join('')}</div>${feedbackHtml()}</div>`}
function discoveryBoard(){
 const m=session.mission,scene=session.exploredScene,actions=m.actions;
 return `<div class="question-lead"><span>🔬 LABORATÓRIO DE DESCOBERTAS</span><button type="button" class="listen" data-speak="1">🔊 Ouvir</button></div>
 <h2>${escapeHtml(m.title)}</h2><p class="question-sub">Teste pelo menos duas situações, compare o que acontece e depois responda.</p>
 <div class="discovery-display" role="group" aria-label="Modelo interativo ilustrativo"><div class="discovery-picture" aria-live="polite">${scene===null?escapeHtml(m.icon):escapeHtml(actions[scene][2])}</div><p class="discovery-observation" role="status">${scene===null?'Escolha uma experiência para começar.':escapeHtml(actions[scene][3])}</p></div>
 <div class="discovery-actions" aria-label="Escolher situação para observar">${actions.map((x,i)=>`<button class="discovery-action ${session.explored.has(i)?'seen':''}" type="button" data-explore="${i}" aria-pressed="${scene===i}">${escapeHtml(x[0])} ${escapeHtml(x[1])}${session.explored.has(i)?' ✓':''}</button>`).join('')}</div>
 ${session.explored.size<2?`<p class="activity-footnote">Observe outra situação para liberar a pergunta. ${session.explored.size} de 2 experiências diferentes.</p>`:`<div class="experiment-answer"><h3>${escapeHtml(m.ask)}</h3><div class="choice-grid" role="group" aria-label="Escolha sua resposta">${m.choices.map(([id,label])=>`<button type="button" class="choice ${session.resolved&&id===m.right?'correct':''} ${session.wrongOptions.has(id)?'wrong':''}" data-science-answer="${id}" ${session.resolved||session.wrongOptions.has(id)?'disabled':''}>${escapeHtml(label)}</button>`).join('')}</div>${feedbackHtml()}</div>`}`;
}
function activityView(){if(!session)return'';const m=session.mission;const steps=m.questions;const progress=100*(session.step/steps);return `<div class="activity-shell"><button type="button" class="breadcrumbs" data-nav="${m.world}">← Voltar às missões</button><div class="activity-meta"><span>${m.icon} ${escapeHtml(m.title)}</span><small>${m.world==='science'?'Descoberta científica':`Desafio ${session.step+1} de ${steps}`}</small></div><div class="activity-bar"><span style="width:${progress}%"></span></div><section class="activity-card">${m.world==='science'?(m.type==='gravity'?gravityBoard():m.type==='daynight'?dayNightBoard():discoveryBoard()):m.type==='curriculum'?curriculumActivity():mathActivity()}</section><p class="activity-footnote">Errar faz parte da descoberta. Tente de novo com calma! 💜</p></div>`}
function resultView(){const m=session.mission,stars=session.stars;return `<div class="activity-shell"><button type="button" class="breadcrumbs" data-nav="${m.world}">← Ver outras missões</button><section class="result-card"><div class="result-emoji">🏆</div><h1>Missão concluída!</h1><p>Você explorou <strong>${escapeHtml(m.title)}</strong> e ganhou ${stars} ${stars===1?'estrela':'estrelas'}.</p><div class="result-stars" aria-label="${stars} estrelas conquistadas">${'⭐'.repeat(stars)}</div><div class="result-buttons"><button type="button" class="btn btn-primary" data-start="${m.id}">🔄 Jogar novamente</button><button type="button" class="btn btn-ghost" data-nav="${m.world}">Outras missões →</button></div></section></div>`}
function badges(){const done=MISSIONS.filter(m=>missionDone(m)),completions=done.length;return [
 {icon:'🌟',title:'Primeira estrela',desc:'Concluir sua primeira missão',ok:completions>0},
 {icon:'🔢',title:'Amigo dos números',desc:'Concluir uma missão de matemática',ok:MISSIONS.filter(m=>m.world==='math').some(m=>missionDone(m))},
 {icon:'🧸',title:'Revisão poderosa',desc:'Concluir uma missão da pré-escola',ok:completed('review')>0},
 {icon:'🧪',title:'Cientista curioso',desc:'Concluir uma missão de Ciências',ok:completed('science')>0},
 {icon:'🚀',title:'Explorador dedicado',desc:'Concluir dez missões diferentes',ok:completions>=10},
 {icon:'💫',title:'Colecionador',desc:'Conquistar pelo menos 12 estrelas',ok:totalStars()>=12}
]}
function awardsView(){return `<div class="page-intro"><div><div class="eyebrow">MINHAS CONQUISTAS</div><h1>Seu álbum de descobertas 🏆</h1><p>Cada conquista mostra uma aventura que você já experimentou.</p></div><span class="page-art">🏅</span></div><div class="awards-grid">${badges().map(b=>`<div class="award-card ${b.ok?'':'locked'}"><div class="award-emoji">${b.icon}</div><h3>${b.title}</h3><p>${b.desc}</p><span class="tag">${b.ok?'CONQUISTADA ✓':'AINDA NÃO'}</span></div>`).join('')}</div>`}
function parentView(){
 const available=currentMissions(),complete=available.filter(m=>missionDone(m));
 const recordsBy=id=>data.records.filter(x=>x.id===id);
 const trouble=available.map(m=>({...m,errors:recordsBy(m.id).reduce((s,r)=>s+(r.errors||0),0)})).filter(m=>m.errors>=2).sort((a,b)=>b.errors-a.errors).slice(0,8);
 const unitReports=Object.entries(UNITS).map(([id,u])=>({label:`${u.emoji} ${u.label}`,entries:data.records.filter(r=>SKILLS.find(s=>s.id===r.id)?.unit===id)}));
 return `<div class="page-intro"><div><div class="eyebrow">ESPAÇO DO RESPONSÁVEL</div><h1>Acompanhamento da família 📊</h1><p>Indicadores de atividades feitas neste navegador, não equivalem a notas ou diagnósticos escolares.</p></div><span class="page-art">👨‍👩‍👧</span></div>
 <div class="stat-row"><div class="stat-box"><span>🏅</span><strong>${complete.length}/${available.length}</strong><small>Missões concluídas nas trilhas visíveis</small></div><div class="stat-box"><span>✏️</span><strong>${numSolved()}</strong><small>Desafios registrados</small></div><div class="stat-box"><span>🎯</span><strong>${firstTryPercent()}%</strong><small>Acertos na primeira tentativa</small></div></div>
 <section class="parent-section"><h3>Progresso por trilha</h3>${Object.keys(WORLDS).map(key=>{const n=completed(key),max=worldMissions(key).length;return `<div class="parent-track"><strong>${WORLDS[key].name}</strong><div class="meter"><span style="width:${Math.round(100*n/Math.max(1,max))}%"></span></div><small>${n} de ${max}</small></div>`}).join('')}</section>
 <section class="parent-section"><h3>Resultados por assunto matemático</h3>${unitReports.map(u=>{const n=u.entries.length,p=n?Math.round(100*u.entries.filter(x=>x.firstTry).length/n):0;return `<div class="parent-track"><strong>${u.label}</strong><div class="meter"><span style="width:${p}%"></span></div><small>${n?n+' respostas · '+p+'% na primeira tentativa':'Ainda sem registros'}</small></div>`}).join('')}</section>
 <section class="parent-section"><h3>Onde praticar novamente?</h3>${trouble.length?`<ul class="error-list">${trouble.map(m=>`<li><strong>${m.icon} ${escapeHtml(m.title)}</strong> · ${m.errors} ${m.errors===1?'tentativa':'tentativas'} com dificuldade. Uma boa opção para revisar juntos.</li>`).join('')}</ul>`:'<p class="empty">Depois de algumas atividades, esta área poderá sugerir novas revisões.</p>'}</section>
 <section class="parent-section"><h3>Configurações e privacidade</h3><p class="muted">O 1º ano é a etapa inicial; os anos seguintes estão disponíveis para uso futuro. Revisões da pré-escola não alteram o ano escolhido. Seus dados não são enviados a servidores.</p><label class="grade-setting">Ano escolar principal <select id="settings-grade">${YEARS.filter(y=>y.id!=='P').map(y=>`<option value="${y.id}" ${y.id===data.grade?'selected':''}>${escapeHtml(y.name)}</option>`).join('')}</select></label>
 <div class="settings-box"><button type="button" class="btn btn-ghost" data-export="1">⬇ Exportar progresso (.json)</button><button type="button" class="btn btn-outline" data-reset="1">Apagar progresso desta versão</button></div><p class="privacy-note">Os protótipos anteriores não são apagados. Importação automática depende de os arquivos compartilharem o mesmo armazenamento do navegador. Faça cópia do progresso antes de limpar dados.</p></section><button type="button" class="btn btn-outline" data-nav="home">← Voltar ao início</button>`
}
function navTitle(){return({home:'Início',math:'Matemática',review:'Revisão da pré-escola',science:'Ciências',awards:'Conquistas',activity:'Hora da missão',result:'Muito bem!',parents:'Para a família'})[view]}
function render(){if(view==='parents'&&!parentAllowed)view='home';const main=$('main');if(!main)return;main.innerHTML=({home:homeView,math:()=>worldView('math'),review:()=>worldView('review'),science:()=>worldView('science'),awards:awardsView,activity:activityView,result:resultView,parents:parentView})[view]();$('section-name').textContent=navTitle();const gradePill=$('grade-pill');if(gradePill)gradePill.textContent=`🎒 ${data.grade}º ano`;$('star-indicator').textContent=`⭐ ${totalStars()}`;document.querySelectorAll('.nav-button').forEach(b=>b.classList.toggle('active',b.dataset.nav===view||(view==='activity'&&session&&session.mission.world===b.dataset.nav)));}
function navigate(to){clearTimeout(gravityTimeout);session=null;unitFilter='all';view=to;render();window.scrollTo({top:0,behavior:'instant'})}
function start(id){const m=getMission(id);if(!m)return;clearTimeout(gravityTimeout);view='activity';session={mission:m,step:0,question:null,firstTry:0,errors:0,wrongCount:0,wrongOptions:new Set(),feedback:null,resolved:false,marked:new Set(),height:2,released:false,dropping:false,drops:0,angle:0,rotated:false,explored:new Set(),exploredScene:null};if(m.world!=='science')session.question=generateQuestion(m);render();window.scrollTo({top:0,behavior:'instant'});}
function logRecord(){
 const m=session.mission,firstTry=session.wrongCount===0;
 data.records.push({id:m.id,world:m.world,firstTry,errors:session.wrongCount,date:new Date().toISOString(),eventId:typeof crypto!=='undefined'&&crypto.randomUUID?crypto.randomUUID():'ev-'+Date.now().toString(36)+Math.random().toString(36).slice(2)});
 if(m.type==='curriculum'){
   const p=skillInfo(m.id);p.tries++;p.correct+=firstTry?1:0;
   p.streak=firstTry?p.streak+1:0;p.mastered=p.correct>=10&&p.correct/p.tries>=.75;
   data.skills[m.id]=p;
 }
 if(data.records.length>3000)data.records=data.records.slice(-3000);
 save();
}
function answer(value){if(view!=='activity'||!session||session.resolved)return;const m=session.mission;if(m.type==='discovery'&&session.explored.size<2)return;const right=m.world==='science'?(m.type==='gravity'?'cai':m.type==='daynight'?'dia':m.right):session.question.answer;if(value===right){session.resolved=true;if(session.wrongCount===0)session.firstTry++;session.feedback={kind:'right',text:m.world==='science'?(m.type==='gravity'?'Muito bem! A gravidade da Terra puxa a bola para baixo.':m.type==='daynight'?'O lado da Terra voltado para o Sol recebe luz e tem dia.':m.explain) : m.type==='curriculum'?session.question.explain:session.question.hint};logRecord();}else{if(session.wrongOptions.has(value))return;session.wrongCount++;session.errors++;session.wrongOptions.add(value);session.feedback={kind:'wrong',text:m.world==='science'?'Olhe de novo para o que aconteceu na experiência. Você consegue!':m.type==='curriculum'?'Observe bem o problema e tente outra alternativa. A explicação aparecerá quando acertar.':'Toque nos desenhos para marcar e conte um a um. Depois escolha outra resposta.'};}render()}
function next(){if(!session||!session.resolved)return;session.step++;if(session.step>=session.mission.questions){const m=session.mission;session.stars=Math.max(1,Math.min(3,Math.ceil(session.firstTry/m.questions*3)));const prev=data.missions[m.id];data.missions[m.id]={stars:Math.max(prev?.stars||0,session.stars),lastStars:session.stars,completedAt:new Date().toISOString()};save();window.dispatchEvent(new Event('missao-aprender:mission-complete'));view='result';render();window.scrollTo({top:0,behavior:'instant'});}else{session.question=generateQuestion(session.mission);session.wrongCount=0;session.wrongOptions.clear();session.feedback=null;session.resolved=false;session.marked.clear();render();}}
function openGate(){previousView=view;gateAnswer=random(5,9)+random(2,5);const a=random(5,9),b=random(2,5);gateAnswer=a+b;$('gate-root').innerHTML=`<div class="gate-backdrop" role="presentation"><form class="gate-modal" id="gate-form" aria-label="Acessar espaço dos responsáveis"><h2>👨‍👩‍👧 Espaço da família</h2><p>Uma continha rápida para evitar que esta área seja aberta sem querer.</p><label for="parent-gate-input"><strong>Quanto é ${a} + ${b}?</strong></label><input type="number" id="parent-gate-input" autocomplete="off" required inputmode="numeric"><div id="gate-error" class="gate-error" role="status"></div><div class="gate-actions"><button type="button" class="btn btn-outline" data-gate-close="1">Cancelar</button><button class="btn btn-primary" type="submit">Entrar</button></div></form></div>`;$('parent-gate-input').focus()}
function closeGate(){$('gate-root').innerHTML=''}
function enterParents(){if(parentAllowed){navigate('parents');return}openGate()}
function speak(){if(!('speechSynthesis'in window)){alert('Seu navegador não oferece leitura em voz alta.');return}const m=session?.mission;let text=m?.world==='science'?(m.type==='gravity'?'O que acontece quando soltamos a bola? Escolha uma altura e solte a bola.':m.type==='daynight'?'Por que temos dia e noite? Gire a Terra e observe o pontinho amarelo.':m.title+'. '+m.desc+'. '+m.ask):session?.question?.prompt||session?.question?.text;if(!text)return;window.speechSynthesis.cancel();const voice=new SpeechSynthesisUtterance(text);voice.lang='pt-BR';voice.rate=.85;window.speechSynthesis.speak(voice)}
function updateEarth(){if(!session)return;const dot=$('location-dot');if(dot)dot.setAttribute('style',earthDotStyle());const label=$('angle-label');if(label)label.textContent=session.angle+'°';const period=$('earth-period');if(period)period.textContent='NO PONTINHO: '+earthPeriod();}
function dropBall(){if(!session||session.mission.type!=='gravity'||session.dropping)return;session.released=false;session.dropping=true;const ball=document.querySelector('.gravity-ball');if(ball){ball.classList.remove('ground');void ball.offsetWidth;ball.classList.add('ground')}const btn=document.querySelector('[data-drop]');if(btn)btn.disabled=true;gravityTimeout=setTimeout(()=>{if(!session||view!=='activity'||session.mission.type!=='gravity')return;session.released=true;session.dropping=false;session.drops++;render()},800)}
function halfTurn(){if(!session||session.mission.type!=='daynight')return;session.angle=(session.angle+180)%360;session.rotated=true;render()}
function downloadProgress(){const file=new Blob([JSON.stringify({exportedAt:new Date().toISOString(),app:'Missão Aprender unificado',data},null,2)],{type:'application/json'});const url=URL.createObjectURL(file);const anchor=document.createElement('a');anchor.href=url;anchor.download='missao-aprender-progresso.json';document.body.append(anchor);anchor.click();anchor.remove();setTimeout(()=>URL.revokeObjectURL(url),1000)}
document.addEventListener('click',e=>{const btn=e.target.closest('button');if(!btn)return;
 if(btn.id==='parents-top'||btn.id==='parents-sidebar'){enterParents();return}
 if(btn.dataset.gateClose){closeGate();return}
 if(btn.dataset.nav){navigate(btn.dataset.nav);return}
 if(btn.dataset.unit){unitFilter=btn.dataset.unit;render();return}
 if(btn.dataset.start){start(btn.dataset.start);return}
 if(btn.dataset.answer!==undefined){answer(btn.dataset.answer);return}
 if(btn.dataset.scienceAnswer!==undefined){answer(btn.dataset.scienceAnswer);return}
 if(btn.dataset.explore!==undefined&&view==='activity'&&session?.mission.type==='discovery'){const index=Number(btn.dataset.explore);if(Number.isInteger(index)&&index>=0&&index<session.mission.actions.length){session.explored.add(index);session.exploredScene=index;render()}return}
 if(btn.dataset.object!==undefined){let s=btn.dataset.object;session?.marked.has(s)?session.marked.delete(s):session?.marked.add(s);btn.classList.toggle('marked',!!session?.marked.has(s));btn.setAttribute('aria-pressed',session?.marked.has(s)?'true':'false');return}
 if(btn.dataset.next){next();return}
 if(btn.dataset.speak){speak();return}
 if(btn.dataset.drop){dropBall();return}
 if(btn.dataset.halfturn){halfTurn();return}
 if(btn.dataset.export){downloadProgress();return}
 if(btn.dataset.reset){if(storageScope!==STORAGE_KEY){alert('Para proteger resultados sincronizados, o apagamento na nuvem ainda não está disponível. Troque para o modo local.');return}if(confirm('Apagar o progresso local deste navegador?')){data=fresh();save();render()}return}
});
document.addEventListener('input',e=>{if(!session)return;if(e.target.id==='height'&&session.mission.type==='gravity'){
  session.height=Number(e.target.value);session.released=false;const b=document.querySelector('.gravity-ball');if(b){b.classList.remove('ground');b.style.setProperty('--ball-bottom',({1:77,2:126,3:168})[session.height]+'px')}const label=$('height-label');if(label)label.textContent=['','Baixa','Média','Alta'][session.height];
 }else if(e.target.id==='angle'&&session.mission.type==='daynight'){
  session.angle=Number(e.target.value);session.rotated=true;updateEarth();
 }});
document.addEventListener('change',e=>{if(e.target.id==='height'&&view==='activity'){render()}else if(e.target.id==='angle'&&view==='activity'&&session?.mission.type==='daynight'){render()}});
document.addEventListener('change',e=>{if(e.target.id==='settings-grade'){
 const value=e.target.value;
 if(!YEARS.some(y=>y.id===value&&y.id!=='P'))return;
 data.grade=value;save();unitFilter='all';render();
 const pill=document.getElementById('grade-pill');if(pill)pill.textContent=`🎒 ${value}º ano`;
}});
document.addEventListener('submit',e=>{if(e.target.id!=='gate-form')return;e.preventDefault();if(Number($('parent-gate-input')?.value)===gateAnswer){parentAllowed=true;closeGate();navigate('parents')}else{$('gate-error').textContent='Confira a continha e tente novamente.';$('parent-gate-input').select()}});
window.MissaoAprenderSyncBridge={legacyData:()=>load(),getData:()=>data,selectScope:(key,state)=>{storageScope=key||STORAGE_KEY;data=state||load();save();navigate('home')},getScope:()=>storageScope};
window.dispatchEvent(new Event('missao-aprender:ready'));
window.MissaoAprenderTest={MISSIONS,WORLDS,SKILLS,makeQuestion,fresh,getData:()=>data,getView:()=>view,generateQuestion,worldMissions,getCurrentAnswer:()=>session?.question?.answer||session?.mission?.right||null};
render();
})();
