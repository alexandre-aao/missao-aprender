/* Banco de atividades do protótipo anterior. Conteúdo autoral preservado. */
(()=>{
'use strict';
const YEARS = [{id:'P',name:'Pré-escola'}, ...Array.from({length:6},(_,i)=>({id:String(i+1),name:`${i+1}º ano`}))];
const UNITS={numeros:{label:'Números',emoji:'🔢'},algebra:{label:'Álgebra e padrões',emoji:'🧩'},geometria:{label:'Geometria',emoji:'📐'},medidas:{label:'Grandezas e medidas',emoji:'⏰'},dados:{label:'Probabilidade e estatística',emoji:'📊'}};
// Tópicos autorais, agrupados pelas unidades temáticas da BNCC.
const SKILLS = [
 ['P','numeros','Contar até 10','Conte objetos divertidos','count',10,''],
 ['P','numeros','Qual é maior?','Compare pequenos números','compare',10,''],
 ['P','numeros','Primeiras somas','Junte coleções de até 5','add',5,''],
 ['P','algebra','Complete o padrão','Descubra o que vem depois','pattern',1,''],
 ['P','geometria','Figuras do dia a dia','Reconheça formas geométricas','shape',1,''],
 ['P','medidas','Mais longo ou curto?','Compare comprimentos','length',1,''],
 ['1','numeros','Contando até 20','Conte objetos e números','count',20,'EF01MA02'],
 ['1','numeros','Antes e depois','Descubra o número seguinte','sequence',30,'EF01MA04'],
 ['1','numeros','Compare os números','Quem é maior ou menor?','compare',20,'EF01MA05'],
 ['1','numeros','Dezenas e unidades','Separe números em partes','place',99,'EF01MA07'],
 ['1','numeros','Somas até 10','Junte e descubra o total','add',10,'EF01MA06'],
 ['1','numeros','Somas até 20','Avance um desafio','add',20,'EF01MA06'],
 ['1','numeros','Subtração até 10','Descubra o que sobrou','sub',10,'EF01MA08'],
 ['1','numeros','Subtração até 20','Retire e conte o restante','sub',20,'EF01MA08'],
 ['1','numeros','Probleminhas do dia a dia','Resolva histórias curtas','story',20,'EF01MA08'],
 ['1','algebra','Sequências divertidas','Complete uma sequência','sequence',100,'EF01MA10'],
 ['1','algebra','Padrões de cores','Perceba o que se repete','pattern',1,'EF01MA09'],
 ['1','geometria','Conhecendo as formas','Círculo, quadrado e mais','shape',1,'EF01MA14'],
 ['1','geometria','Lados das figuras','Observe os lados','sides',1,'EF01MA14'],
 ['1','medidas','Comprimentos','Mais longo ou mais curto?','length',1,'EF01MA15'],
 ['1','medidas','Moedas e compras','Aprenda com reais','money',20,'EF01MA19'],
 ['1','dados','Gráficos com desenhos','Leia quantidades simples','chart',10,'EF01MA21'],
 ['2','numeros','Somas até 100','Adição com números maiores','add',100,'EF02MA05'],
 ['2','numeros','Subtração até 100','Descubra as diferenças','sub',100,'EF02MA05'],
 ['2','numeros','Centenas, dezenas e unidades','Entenda o valor de cada algarismo','place',999,'EF02MA01'],
 ['2','numeros','Tabuadas do 2 e do 5','Primeiras multiplicações','times',5,'EF02MA07'],
 ['2','algebra','Sequência de 2 em 2','Descubra a regra','skip',2,'EF02MA09'],
 ['2','geometria','Lados e formas','Reconheça figuras planas','sides',1,'EF02MA15'],
 ['2','medidas','Horas cheias','Leia horas do relógio','clock',1,'EF02MA19'],
 ['2','dados','Interprete o gráfico','Descubra valores em colunas','chart',15,'EF02MA22'],
 ['3','numeros','Tabuada de multiplicar','Pratique de 2 até 10','times',10,'EF03MA03'],
 ['3','numeros','Divisão exata','Distribua em partes iguais','divide',10,'EF03MA08'],
 ['3','numeros','Frações de grupos','Partes do total','fraction',12,'EF03MA09'],
 ['3','algebra','Encontre o número secreto','Resolva igualdades simples','missing',30,'EF03MA11'],
 ['3','geometria','Perímetro de retângulos','Some os lados','perimeter',15,'EF03MA20'],
 ['3','medidas','Área com quadradinhos','Conte unidades de área','area',15,'EF03MA21'],
 ['3','dados','Leitura de gráficos','Compare dados','chart',20,'EF03MA27'],
 ['4','numeros','Multiplicação maior','Multiplique dezenas e unidades','times',20,'EF04MA06'],
 ['4','numeros','Divisão com resto','O que sobra da divisão?','remainder',15,'EF04MA07'],
 ['4','numeros','Frações equivalentes','Encontre a fração igual','equiv',10,'EF04MA09'],
 ['4','algebra','Número desconhecido','Descubra o valor que falta','missing',100,'EF04MA14'],
 ['4','geometria','Perímetro e área','Meça retângulos','area',25,'EF04MA21'],
 ['4','medidas','Converter medidas','Metros e centímetros','convert',1,'EF04MA20'],
 ['4','dados','Probabilidades simples','Chance de tirar uma cor','chance',1,'EF04MA26'],
 ['5','numeros','Números decimais','Some valores com vírgula','decimal',1,'EF05MA07'],
 ['5','numeros','Frações em adição','Junte partes do mesmo inteiro','fracadd',1,'EF05MA08'],
 ['5','numeros','Porcentagens','Calcule 10%, 25% e 50%','percent',1,'EF05MA06'],
 ['5','algebra','Proporções','Use a regra do dobro','ratio',1,'EF05MA12'],
 ['5','geometria','Volume de caixas','Conte cubinhos','volume',1,'EF05MA21'],
 ['5','medidas','Unidades de medida','Converta comprimentos','convert',1,'EF05MA19'],
 ['5','dados','Média aritmética','Descubra a média','mean',1,'EF05MA24'],
 ['6','numeros','Números inteiros','Somando e subtraindo inteiros','integer',1,''],
 ['6','numeros','Porcentagens','Descontos e proporções','percent',1,''],
 ['6','numeros','Potências','Pratique quadrados e cubos','power',1,''],
 ['6','algebra','Equações iniciais','Encontre a incógnita','missing',100,''],
 ['6','geometria','Áreas de retângulos','Multiplique os lados','area',40,''],
 ['6','medidas','Conversão de medidas','Transforme metros em centímetros','convert',1,''],
 ['6','dados','Média dos valores','Interprete conjuntos de dados','mean',1,'']
].map((s,i)=>({id:`h${String(i+1).padStart(2,'0')}`,grade:s[0],unit:s[1],title:s[2],desc:s[3],kind:s[4],max:s[5],bncc:s[6]}));
// Expansão do 1º ano (v1.1). IDs próprios preservam o progresso das 64 missões anteriores.
const NEW_SKILLS=[
 ['a-m01','1','numeros','Pares e ímpares','Descubra os números que formam duplas','parity',20,''],
 ['a-m02','1','numeros','Ordem dos números','Organize do menor para o maior','order3',30,'EF01MA05'],
 ['a-m03','1','numeros','Complete o dez','Descubra quantos faltam para chegar a dez','make10',10,'EF01MA06'],
 ['a-m04','1','numeros','Quadro de dez','Preencha mentalmente as dez casinhas','tenframe',10,'EF01MA02'],
 ['a-m05','1','algebra','Saltos de dois','Continue o caminho de dois em dois','skip2small',20,'EF01MA10'],
 ['a-m06','1','geometria','Onde está o brinquedo?','Explore esquerda, direita, cima e baixo','positions',1,'EF01MA11'],
 ['a-m07','1','medidas','Dias da semana','Descubra o próximo dia','weekday',1,'EF01MA17'],
 ['a-m08','1','medidas','Moedinhas de reais','Some moedas em brincadeiras de compra','moneycoins',12,'EF01MA19'],
 ['a-m09','1','numeros','Quem veio antes?','Encontre o número anterior','before',30,'EF01MA04'],
 ['a-m10','1','numeros','Divida igualmente','Explore duas partes do mesmo tamanho','halves',12,''],
 ['a-m11','1','dados','Gráfico dos animais','Compare quantidades em um gráfico divertido','animalchart',8,'EF01MA21'],
 ['a-p01','P','numeros','Coloque em ordem','Organize três números pequenos','order3',9,''],
 ['a-p02','P','algebra','Descubra o intruso','Observe qual desenho é diferente','oddone',1,''],
 ['a-p03','P','numeros','Um a mais e um a menos','Descubra vizinhos dos números pequenos','neighbor',7,'']
];
for(const [id,grade,unit,title,desc,kind,max,bncc] of NEW_SKILLS)SKILLS.push({id,grade,unit,title,desc,kind,max,bncc});
const rand=(a,b)=>Math.floor(Math.random()*(b-a+1))+a;
const pick=a=>a[rand(0,a.length-1)];
const clamp=(v,a,b)=>Math.max(a,Math.min(v,b));
const safe=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const num=n=>new Intl.NumberFormat('pt-BR',{maximumFractionDigits:2}).format(n);
const signed=n=>n<0?`−${Math.abs(n)}`:String(n);
const el=id=>document.getElementById(id);
const namedIcons=[['🍓','morangos',false],['⭐','estrelas',true],['🍎','maçãs',true],['🐟','peixes',false],['🍪','biscoitos',false],['🦋','borboletas',true],['🌸','flores',true],['🚗','carrinhos',false]];
const visItems=(n,ico)=>Array.from({length:n},()=>`<span class="vis-item">${ico}</span>`).join('');
function opts(answer,choices){let a=[...new Set(choices.map(String))];if(!a.includes(String(answer)))a.push(String(answer));while(a.length<4)a.push(String(rand(0,50)));return a.sort(()=>Math.random()-.5).slice(0,4).includes(String(answer))?shuffle(a).slice(0,4):shuffle([String(answer),...shuffle(a.filter(x=>x!==String(answer))).slice(0,3)]);}
function shuffle(arr){const a=arr.slice();for(let i=a.length-1;i>0;i--){let j=rand(0,i);[a[i],a[j]]=[a[j],a[i]]}return a}
function numbers(answer,min=0,step=1){let a=new Set([String(answer)]);let tries=0;while(a.size<4&&tries++<45){let offset=pick([-3,-2,-1,1,2,3,4,-4])*step;let n=Math.round((Number(answer)+offset)*100)/100;if(n>=min)a.add(String(n))}return shuffle([...a].slice(0,4))}
const icons=namedIcons.map(([icon])=>icon);
const practiceHints = {
 parity:'Forme pares de dois. Veja se sobra algum item.',
 order3:'Compare os três números. Comece pelo menor.',
 make10:'Conte a partir da quantidade que já tem até chegar a dez.',
 tenframe:'Conte os espaços ocupados, uma fileira de cada vez.',
 skip2small:'Dê um salto de dois a partir do último número.',
 positions:'Comece pelo primeiro item e conte as posições na ordem.',
 weekday:'Pense na ordem dos dias da semana.',
 moneycoins:'Some os valores escritos nas moedas.',
 before:'Volte um passo na sequência de números.',
 halves:'Procure duas partes do mesmo tamanho.',
 animalchart:'Compare o comprimento das barras dos animais.',
 oddone:'Procure a característica que os outros desenhos têm em comum.',
 neighbor:'Use a ordem dos números e dê um passo na direção pedida.',
 count:'Aponte para um desenho de cada vez enquanto conta.',
 compare:'Imagine os dois números na reta. Qual fica mais à direita?',
 sequence:'Compare dois números vizinhos para descobrir o salto.',
 skip:'Descubra quanto foi acrescentado de um número para o seguinte.',
 place:'Observe o algarismo mais à direita.',
 pattern:'Ache o grupo de figuras que se repete e acompanhe a ordem.',
 shape:'Veja se a figura tem lados retos ou uma borda curva.',
 sides:'Percorra a borda e conte cada lado reto uma vez.',
 length:'Compare onde termina cada fita.',
 money:'Junte o dinheiro que você tinha com o que recebeu.',
 clock:'Leia o número antes dos dois pontos.',
 chart:'Compare as barras das frutas. Veja qual vai mais longe.',
 times:'Some a mesma quantidade uma vez para cada grupo.',
 divide:'Distribua o total em grupos iguais e conte quanto fica em cada um.',
 remainder:'Forme grupos completos e conte o que sobrou.',
 fraction:'Conte apenas os pedaços destacados.',
 missing:'Tire a quantidade conhecida do total para achar a parte escondida.',
 perimeter:'Imagine um passeio pela borda. Some o comprimento dos quatro lados.',
 area:'Conte quantos quadradinhos cabem em cada fila e quantas filas há.',
 equiv:'Procure uma fração que multiplique os dois números pelo mesmo fator.',
 convert:'Use 100 centímetros para cada metro.',
 chance:'Conte quantas bolas há de cada cor.',
 decimal:'Alinhe as vírgulas e some as casas correspondentes.',
 fracadd:'Some os números de cima e conserve o número de baixo.',
 percent:'Multiplique o total pela porcentagem e divida por 100.',
 ratio:'Some a mesma quantidade de lápis para cada caixa.',
 volume:'Multiplique comprimento, largura e altura.',
 mean:'Some os números e divida pela quantidade de números.',
 power:'Use a base como fator tantas vezes quanto indica o expoente.'
};

function question(s,level=1){
 const max=s.max, L=clamp(level,1,3), kind=s.kind;
 let a,b,answer,prompt,visual='',explain='',options=[];
 const close=n=>numbers(n,0,1);
 if(kind==='parity'){
   a=rand(2,Math.min(max,20));answer=a%2===0?'par':'ímpar';prompt=`O número ${a} forma duplas completas? Ele é par ou ímpar?`;visual=visItems(a,'🟣');explain=a%2===0?`${a} pode formar ${a/2} duplas sem sobrar nenhum.`:`${a} deixa um desenho sem dupla. Por isso é ímpar.`;options=['par','ímpar','maior que 20','não é número'];
 }else if(kind==='order3'){
   const limit=Math.max(5,Math.min(max,30)),numbers=new Set();while(numbers.size<3)numbers.add(rand(1,limit));const vals=[...numbers];answer=[...vals].sort((x,y)=>x-y).join(' → ');prompt='Qual sequência está organizada do menor para o maior?';visual=shuffle(vals).map(v=>`<span class="num-box">${v}</span>`).join('');let variants=new Set([answer]);for(let i=0;i<30&&variants.size<4;i++)variants.add(shuffle(vals).join(' → '));options=[...variants];explain=`Comece pelo menor: ${answer}.`;
 }else if(kind==='make10'){
   a=rand(1,9);answer=10-a;prompt=`Você tem ${a} estrelas. Quantas faltam para ter 10?`;visual=visItems(a,'⭐')+'<span class="vis-line">Complete um grupo com dez estrelas!</span>';explain=`Conte a partir de ${a} até 10: faltam ${answer}.`;options=close(answer);
 }else if(kind==='tenframe'){
   a=rand(1,9);answer=10-a;prompt='Quantas casas estão vazias no quadro de dez?';visual=`<div role="img" aria-label="Quadro com ${a} casas preenchidas e ${10-a} vazias" style="display:grid;grid-template-columns:repeat(5,44px);gap:5px;max-width:240px">${Array.from({length:10},(_,i)=>`<span style="border:2px solid #9781d1;border-radius:8px;text-align:center;height:44px;line-height:40px;background:${i<a?'#e2def8':'white'}">${i<a?'⭐':'·'}</span>`).join('')}</div>`;explain=`O quadro tem 10 casas: ${a} preenchidas e ${10-a} vazias.`;options=close(answer);
 }else if(kind==='skip2small'){
   a=rand(1,7)*2;answer=a+6;prompt='Descubra o número que vem ao dar saltos de 2!';visual=[a,a+2,a+4,'❔',a+8].map(n=>`<span class="num-box">${n}</span>`).join('');explain=`A sequência pula de 2 em 2. Depois de ${a+4} vem ${answer}.`;options=close(answer);
 }else if(kind==='positions'){
   const dir=pick([['esquerda','🧸','🚗'],['direita','🚗','🧸']]);answer=dir[0];prompt='Onde o ursinho está em relação ao carrinho?';visual=`<span style="font-size:70px" role="img" aria-label="Ursinho e carrinho lado a lado">${dir[1]}　${dir[2]}</span>`;explain=`O ursinho está à ${answer} do carrinho.`;options=['esquerda','direita','em cima','embaixo'];
 }else if(kind==='weekday'){
   const days=['segunda-feira','terça-feira','quarta-feira','quinta-feira','sexta-feira','sábado','domingo'];a=rand(0,5);answer=days[a+1];prompt=`Qual dia vem depois de ${days[a]}?`;visual=`<span class="num-box" style="font-size:22px">📅 ${days[a]}</span> ➡️ ❔`;explain=`Depois de ${days[a]} vem ${answer}.`;options=shuffle([answer,days[(a+2)%7],days[(a+3)%7],days[(a+6)%7]]);
 }else if(kind==='moneycoins'){
   const coins=[1,2,5];a=pick(coins);b=pick(coins);answer=a+b;prompt='Quanto valem estas duas moedas juntas?';visual=`<span class="num-box" aria-label="Moeda de ${a} real">🪙 R$ ${a}</span> + <span class="num-box" aria-label="Moeda de ${b} real">🪙 R$ ${b}</span>`;explain=`R$ ${a} + R$ ${b} = R$ ${answer}. Valores ilustrativos, não representam o desenho real das moedas.`;options=close(answer);
 }else if(kind==='before'){
   a=rand(2,Math.min(max,30));answer=a-1;prompt=`Que número vem imediatamente antes do ${a}?`;visual=`<span class="num-box">❔</span> <span class="num-box">${a}</span> <span class="num-box">${a+1}</span>`;explain=`Antes de ${a} vem ${answer}.`;options=close(answer);
 }else if(kind==='halves'){
   a=rand(1,Math.floor(max/2));answer=a;prompt=`Há ${2*a} biscoitos para dividir igualmente entre duas crianças. Quantos cada uma recebe?`;visual=visItems(2*a,'🍪')+'<span class="vis-line">Divida entre duas crianças, sem deixar sobras.</span>';explain=`Cada criança recebe ${a} biscoitos: ${a} + ${a} = ${2*a}.`;options=close(answer);
 }else if(kind==='animalchart'){
   a=rand(2,max);b=rand(1,max);if(a===b)b=a===max?a-1:a+1;answer=a>b?'Coelhos':'Peixes';prompt='Qual grupo de animais aparece mais no gráfico?';visual=`<div style="width:90%;display:grid;gap:12px;text-align:left"><div>🐇 Coelhos <div style="height:19px;border-radius:9px;background:#a295e0;width:${a/max*100}%"></div></div><div>🐟 Peixes <div style="height:19px;border-radius:9px;background:#70c6d4;width:${b/max*100}%"></div></div></div>`;explain=`Coelhos: ${a}; peixes: ${b}. ${answer} têm a barra maior.`;options=['Coelhos','Peixes','Igual quantidade','Nenhum'];
 }else if(kind==='oddone'){
   const candidates=['🍎','🍌','🍓','🚗'],odd=pick(candidates);answer=odd;prompt='Qual desenho é diferente dos outros três?';visual=shuffle([pick(candidates.filter(v=>v!==odd)),pick(candidates.filter(v=>v!==odd)),pick(candidates.filter(v=>v!==odd)),odd]).join(' '); // substituído abaixo para mostrar três iguais
   const common=pick(candidates.filter(v=>v!==odd));visual=shuffle([common,common,common,odd]).map(v=>`<span class="vis-item">${v}</span>`).join('');explain=`Três figuras são ${common} e apenas uma é ${odd}.`;options=shuffle(candidates);
 }else if(kind==='neighbor'){
   a=rand(2,Math.min(max,7));const isBefore=rand(0,1)===0;answer=isBefore?a-1:a+1;prompt=`Qual número vem ${isBefore?'antes':'depois'} do ${a}?`;visual=`<span class="num-box">${isBefore?'❔':a-1}</span><span class="num-box">${a}</span><span class="num-box">${isBefore?a+1:'❔'}</span>`;explain=`${isBefore?'Antes':'Depois'} de ${a} vem ${answer}.`;options=close(answer);
 }else if(kind==='count'){
   a=rand(1,Math.min(max,L===1?8:L===2?15:max));const [ico,name,feminine]=pick(namedIcons);answer=a;prompt=`Quant${feminine?'as':'os'} ${name} você vê?`;visual=visItems(a,ico);explain=`Conte um a um. São ${a} ao todo.`;options=close(a);
 }else if(kind==='compare'){
   a=rand(1,Math.min(max,L===1?12:max));b=rand(1,Math.min(max,L===1?12:max));if(a===b)b=b===max?b-1:b+1;answer=Math.max(a,b);prompt='Qual número é maior?';visual=`<span class="num-box">${a}</span> <span style="font-size:18px">OU</span> <span class="num-box">${b}</span>`;explain=`${answer} é maior porque representa uma quantidade maior.`;options=shuffle([...new Set([String(a),String(b),String(Math.min(a,b)-1<0?max:Math.min(a,b)-1),String(answer+1)])]);
 }else if(kind==='sequence'||kind==='skip'){
   const step=kind==='skip'?max:(L===1?1:pick([1,2,5,10]));a=rand(1,Math.max(2,Math.floor((kind==='skip'?100:max)/step)-5))*step;answer=a+3*step;prompt='Qual número completa a sequência?';visual=[a,a+step,a+2*step,'❔',a+4*step].map(x=>`<span class="num-box">${x}</span>`).join('');explain=`A regra é somar ${step} a cada número: ${a+2*step} + ${step} = ${answer}.`;options=close(answer);
 }else if(kind==='add'||kind==='sub'||kind==='story'){
   let bound=Math.max(5,Math.min(max,L===1?Math.min(max,10):L===2?Math.min(max,30):max));a=rand(1,bound-1);b=rand(1,bound-1);
   if(kind==='story'){if(a+b>bound)b=Math.max(1,bound-a);answer=a+b;const [one,many,feminine]=pick([['maçã','maçãs',true],['carrinho','carrinhos',false],['urso de pelúcia','ursos de pelúcia',false],['bala','balas',true]]);prompt=`Você tinha ${a} ${a===1?one:many} e ganhou mais ${b}. Quant${feminine?'as':'os'} tem agora?`;visual=`<span class="num-box">${a}</span> + <span class="num-box">${b}</span> = ❔`;explain=`Juntando os dois grupos: ${a} + ${b} = ${answer}.`}
   else if(kind==='add'){if(a+b>bound)b=Math.max(1,bound-a);answer=a+b;prompt=`Quanto é ${a} + ${b}?`;visual=`<span class="num-box">${a}</span> + <span class="num-box">${b}</span> = ❔`;explain=`Comece no ${a} e conte mais ${b} passos. Você chega ao ${answer}.`}
   else{if(b>a)[a,b]=[b,a];answer=a-b;prompt=`Quanto é ${a} − ${b}?`;visual=`<span class="num-box">${a}</span> − <span class="num-box">${b}</span> = ❔`;explain=`Tirando ${b} de ${a}, restam ${answer}.`}
   options=close(answer);
 }else if(kind==='place'){
   const top=L===1?Math.min(max,99):max;a=rand(12,Math.max(20,top));const units=a%10,tens=Math.floor(a/10)%10,hundreds=Math.floor(a/100);answer=String(units);prompt=`No número ${a}, quantas unidades soltas existem?`;visual=`<span class="num-box">${a}</span><span class="vis-line">${hundreds?hundreds+' centena(s), ':''}${tens} dezena(s) e ${units} unidade(s)</span>`;explain=`O último algarismo do número indica as unidades: ${units}.`;options=shuffle(['0','1',String(units),String(tens),String((units+2)%10),String((units+5)%10)].filter((v,i,ar)=>ar.indexOf(v)===i)).slice(0,4);if(!options.includes(answer))options[3]=answer;
 }else if(kind==='pattern'){
   const sets=[['🔴','🔵'],['⭐','🌙'],['🟣','🟢','🟡']];const seq=pick(sets);const len=seq.length===2?5:6;answer=seq[len%seq.length];prompt='Qual figura vem a seguir?';visual=Array.from({length:len},(_,i)=>`<span class="vis-item">${seq[i%seq.length]}</span>`).join('')+' <span class="num-box">❔</span>';explain=`O padrão se repete na mesma ordem. Depois vem ${answer}.`;options=shuffle([...new Set([...seq,...['🔺','🍎','🌻']])]).slice(0,3);if(!options.includes(answer))options=[answer,...options.slice(0,3)];options=shuffle(options);
 }else if(kind==='shape'||kind==='sides'){
   const shapes=[['círculo','🔵',0],['triângulo','🔺',3],['quadrado','🟪',4],['retângulo','▭',4],['pentágono','⬠',5]];const sh=pick(shapes.slice(0,L===1?4:5));answer=kind==='shape'?sh[0]:String(sh[2]);prompt=kind==='shape'?'Qual é o nome desta forma?':'Quantos lados esta figura tem?';visual=`<span style="font-size:83px;line-height:1.25">${sh[1]}</span>`;explain=kind==='shape'?`A forma se chama ${sh[0]}.`:`O ${sh[0]} tem ${sh[2]} lados.`;options=kind==='shape'?shuffle(shapes.map(x=>x[0]).filter(x=>x!==answer)).slice(0,3).concat(answer):shuffle(['0','3','4','5',answer]).filter((x,i,ar)=>ar.indexOf(x)===i).slice(0,4);if(!options.includes(answer))options[3]=answer;options=shuffle(options);
 }else if(kind==='length'){
   a=rand(2,8);b=rand(9,16);if(rand(0,1)) [a,b]=[b,a];answer=a>b?'A':'B';prompt='Qual fita é mais comprida?';visual=`<div style="width:90%;display:grid;gap:15px;font-size:15px"><div>Fita A <div style="height:15px;background:#fd998b;border-radius:15px;width:${a*5}%;margin:6px auto"></div></div><div>Fita B <div style="height:15px;background:#6acdbc;border-radius:15px;width:${b*5}%;margin:6px auto"></div></div></div>`;explain=`A fita ${answer} ocupa mais espaço na horizontal, então é mais comprida.`;options=['A','B','As duas','Nenhuma'];
 }else if(kind==='money'){
   a=rand(2,10);b=rand(1,8);answer=a+b;prompt=`Você tem R$ ${a} e recebe R$ ${b}. Com quanto fica?`;visual=`<span class="num-box">R$ ${a}</span> + <span class="num-box">R$ ${b}</span>`;explain=`${a} + ${b} = ${answer} reais.`;options=close(answer);
 }else if(kind==='clock'){
   a=rand(1,12);answer=`${a}h`;prompt='O relógio digital está marcando que horas?';visual=`<span class="num-box" style="font-size:47px">${String(a).padStart(2,'0')}:00</span>`;explain=`${String(a).padStart(2,'0')}:00 corresponde a ${a} hora${a===1?'':'s'} em ponto.`;options=shuffle([`${a}h`,`${(a%12)+1}h`,`${a===1?12:a-1}h`,`${(a+5)%12+1}h`]);
 }else if(kind==='chart'){
   a=rand(2,max);b=rand(1,max);if(a===b)b=Math.max(1,b-1);answer=a>b?'Maçãs':'Bananas';prompt='Qual fruta aparece mais vezes no gráfico?';visual=`<div style="width:90%;font-size:13px;display:grid;gap:10px;text-align:left"><div>🍎 Maçãs (${a}) <div style="height:16px;width:${a/max*100}%;background:#ff867b;border-radius:10px"></div></div><div>🍌 Bananas (${b}) <div style="height:16px;width:${b/max*100}%;background:#ffc966;border-radius:10px"></div></div></div>`;explain=`Maçãs: ${a}. Bananas: ${b}. ${answer} têm a barra maior.`;options=['Maçãs','Bananas','Empate','Nenhuma'];
 }else if(kind==='times'){
   a=rand(2,max<=5?5:max<=10?10:15);b=rand(2,max<=5?5:L===1?5:10);answer=a*b;prompt=`Quanto é ${a} × ${b}?`;visual=`<span class="num-box">${a}</span> × <span class="num-box">${b}</span> = ❔`;explain=`Multiplicar é somar grupos iguais: ${a} vezes ${b} = ${answer}.`;options=shuffle([...new Set([String(answer),String(a*(b+1)),String(a*(b-1)),String(answer+a+b),String(Math.max(0,answer-a))])]).slice(0,4);if(!options.includes(String(answer)))options[3]=String(answer);
 }else if(kind==='divide'||kind==='remainder'){
   b=rand(2,Math.min(max,10));a=rand(2,12);const rem=kind==='remainder'?rand(1,b-1):0;const dividend=a*b+rem;answer=kind==='divide'?a:rem;prompt=kind==='divide'?`Quanto é ${dividend} ÷ ${b}?`:`Qual é o resto de ${dividend} ÷ ${b}?`;visual=`<span class="num-box">${dividend}</span> ÷ <span class="num-box">${b}</span>`;explain=kind==='divide'?`${b} grupos de ${a} formam ${dividend}. Logo, ${dividend} ÷ ${b} = ${a}.`:`${dividend} = ${b} × ${a} + ${rem}. O resto é ${rem}.`;options=close(answer);
 }else if(kind==='fraction'){
   const den=pick([2,3,4,5]);const n=rand(1,den);answer=n;prompt=`De ${den} pedaços iguais, ${n} estão pintados. Quantos estão pintados?`;visual=Array.from({length:den},(_,i)=>`<span class="num-box" style="background:${i<n?'#c4f5e8':'#fff'}">◼</span>`).join('');explain=`Você vê ${n} partes destacadas de ${den} partes iguais.`;options=close(n);
 }else if(kind==='missing'){
   a=rand(2,Math.min(max,40));b=rand(2,Math.min(max,25));answer=a;prompt=`Qual número está escondido? ❔ + ${b} = ${a+b}`;visual=`<span class="num-box">❔</span> + <span class="num-box">${b}</span> = <span class="num-box">${a+b}</span>`;explain=`Faça a operação inversa: ${a+b} − ${b} = ${a}.`;options=close(a);
 }else if(kind==='perimeter'||kind==='area'){
   a=rand(2,Math.min(max,12));b=rand(2,Math.min(max,9));answer=kind==='perimeter'?2*(a+b):a*b;prompt=kind==='perimeter'?`Qual é o perímetro do retângulo de ${a} cm por ${b} cm?`:`Qual é a área do retângulo de ${a} por ${b} quadradinhos?`;visual=`<div style="width:150px;height:85px;border:4px solid #7c71d9;background:repeating-linear-gradient(0deg,transparent,transparent 15px,#e1dcff 16px),repeating-linear-gradient(90deg,transparent,transparent 15px,#e1dcff 16px);border-radius:5px"></div> <span class="vis-line">Lados: ${a} e ${b}</span>`;explain=kind==='perimeter'?`Some todos os lados: ${a} + ${b} + ${a} + ${b} = ${answer}.`:`Multiplique comprimento por largura: ${a} × ${b} = ${answer}.`;options=close(answer);
 }else if(kind==='equiv'){
   a=rand(1,3);b=rand(a+1,6);answer=`${a*2}/${b*2}`;prompt=`Qual fração equivale a ${a}/${b}?`;visual=`<span class="num-box">${a}/${b}</span> = <span class="num-box">❔</span>`;explain=`Multiplicando numerador e denominador por 2, temos ${a*2}/${b*2}.`;options=shuffle([answer,`${a+1}/${b}`,`${a}/${b+1}`,`${a*2}/${b}`]);
 }else if(kind==='convert'){
   a=rand(1,L===1?5:12);answer=a*100;prompt=`Quantos centímetros existem em ${a} metro${a>1?'s':''}?`;visual=`<span class="num-box">${a} m</span> = ❔ <span style="font-size:19px">cm</span>`;explain=`Cada metro tem 100 centímetros: ${a} × 100 = ${answer}.`;options=shuffle([String(answer),String(a*10),String(a*1000),String(answer+100)]);
 }else if(kind==='chance'){
   a=rand(3,7);b=rand(1,a-1);if(rand(0,1)) [a,b]=[b,a];answer=a>b?'Vermelha':'Azul';prompt='Qual cor é mais provável de sair ao pegar uma bola sem olhar?';visual=visItems(a,'🔴')+visItems(b,'🔵');explain=`Há ${a} bolas vermelhas e ${b} azuis. A cor ${answer.toLowerCase()} aparece mais vezes.`;options=['Vermelha','Azul','Igualmente provável','Impossível'];
 }else if(kind==='decimal'){
   a=rand(1,40)/10;b=rand(1,30)/10;answer=(Math.round((a+b)*10)/10).toFixed(1).replace('.',',');prompt=`Quanto é ${num(a)} + ${num(b)}?`;visual=`<span class="num-box">${num(a)}</span> + <span class="num-box">${num(b)}</span>`;explain=`Somando as décimas, o resultado é ${answer}.`;const x=Number(answer.replace(',','.'));options=shuffle([answer,(x+.1).toFixed(1).replace('.',','),(x+.2).toFixed(1).replace('.',','),Math.max(0,x-.1).toFixed(1).replace('.',',')]);
 }else if(kind==='fracadd'){
   const den=pick([3,4,5,6,8]);a=rand(1,den-2);b=rand(1,den-a);answer=`${a+b}/${den}`;prompt=`Quanto é ${a}/${den} + ${b}/${den}?`;visual=`<span class="num-box">${a}/${den}</span> + <span class="num-box">${b}/${den}</span>`;explain=`Quando os denominadores são iguais, somamos os numeradores: (${a}+${b})/${den} = ${answer}.`;options=shuffle([...new Set([answer,`${a+b}/${den*2}`,`${a*b}/${den}`,`${a+b+1}/${den}`,`${a+b}/${den+1}`])]).slice(0,4);if(!options.includes(answer))options[3]=answer;
 }else if(kind==='percent'){
   b=pick([10,25,50]);a=pick([20,40,60,80,100,120,200]);answer=a*b/100;prompt=`Quanto é ${b}% de ${a}?`;visual=`<span class="num-box">${b}%</span> de <span class="num-box">${a}</span>`;explain=`${b}% significa ${b} partes em cada 100. ${a} × ${b} ÷ 100 = ${answer}.`;options=close(answer);
 }else if(kind==='ratio'){
   a=rand(2,10);b=rand(2,5);answer=a*b;prompt=`Se 1 caixa tem ${a} lápis, quantos lápis há em ${b} caixas iguais?`;visual=visItems(b,'📦');explain=`São ${b} grupos com ${a} lápis: ${b} × ${a} = ${answer}.`;options=close(answer);
 }else if(kind==='volume'){
   a=rand(2,5);b=rand(2,4);const c=rand(2,4);answer=a*b*c;prompt=`Uma caixa mede ${a} × ${b} × ${c} cubinhos. Qual é o volume?`;visual=`<span class="num-box">${a} × ${b} × ${c}</span><span class="vis-line">comprimento × largura × altura</span>`;explain=`Multiplicando as três medidas: ${a} × ${b} × ${c} = ${answer} cubinhos.`;options=close(answer);
 }else if(kind==='mean'){
   a=rand(1,12);b=rand(1,12);const c=rand(1,12);answer=(a+b+c)/3;const values=[a,b,c];if((a+b+c)%3!==0){const fix=3-(a+b+c)%3;values[2]+=fix;}answer=(values[0]+values[1]+values[2])/3;prompt=`Qual é a média dos números ${values.join(', ')}?`;visual=values.map(x=>`<span class="num-box">${x}</span>`).join('');explain=`Some os valores (${values.reduce((x,y)=>x+y,0)}) e divida por 3: ${answer}.`;options=close(answer);
 }else if(kind==='integer'){
   a=rand(-9,9);b=rand(-9,9);answer=a+b;prompt=`Quanto é ${signed(a)} + (${signed(b)})?`;visual=`<span class="num-box">${signed(a)}</span> + <span class="num-box">${signed(b)}</span>`;explain=`Somando os números inteiros, encontramos ${signed(answer)}.`;options=numbers(answer,-20,1).map(x=>signed(Number(x)));
 }else if(kind==='power'){
   a=rand(2,7);b=rand(2,3);answer=a**b;prompt=`Quanto é ${a} elevado a ${b}?`;visual=`<span class="num-box">${a}<sup>${b}</sup></span>`;explain=`Multiplique ${a} por ele mesmo ${b} vezes. O resultado é ${answer}.`;options=close(answer);
 }else{throw Error(`Questão desconhecida: ${kind}`)}
 answer=String(answer);options=[...new Set(options.map(String))];if(!options.includes(answer))options[0]=answer;let tries=0;while(options.length<4&&tries++<50){let candidate=String(Number(answer)+rand(1,10));if(!options.includes(candidate))options.push(candidate)}options=shuffle(options.slice(0,4));
 let practiceHint=practiceHints[kind];
 if(kind==='add'||kind==='story'||kind==='sub'){
  practiceHint=`Comece no ${a} e conte ${b} passos para ${kind==='sub'?'trás':'a frente'}.`;
 }
 if(kind==='integer'){
  practiceHint=b===0?'Somar zero mantém o número no mesmo lugar.':
   `Comece no ${signed(a)} na reta numérica e ande ${Math.abs(b)} ${Math.abs(b)===1?'passo':'passos'} para a ${b<0?'esquerda':'direita'}.`;
 }
 return {prompt,visual,answer,explain,options,practiceHint};
}

window.MissaoAprenderCurriculo={YEARS,UNITS,SKILLS,question};
})();
