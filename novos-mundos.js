(() => {
const worlds = {
 words: {name:'Mundo das Palavras', icon:'📚', subtitle:'Brinque com letras e histórias', medal:'Descobridor de palavras'},
 logic: {name:'Desafios de Lógica', icon:'🧩', subtitle:'Investigue padrões, pistas e formas', medal:'Detetive de pistas'},
 code: {name:'Pequenos Programadores', icon:'🤖', subtitle:'Monte comandos e veja o que acontece', medal:'Piloto de robôs'},
 english: {name:'Inglês Divertido', icon:'🎧', subtitle:'Escute e associe palavras a figuras', medal:'Explorador do inglês'},
 money: {name:'Pequenos Empreendedores', icon:'🛒', subtitle:'Faça escolhas em uma loja fictícia', medal:'Planejador de compras'}
};
const tile = (label, icon='', id=label) => ({id,label,icon});
const options = (labels) => labels.map(label=>tile(label));
const task = (kind,prompt,tiles,goal,hint,explain,extra={}) => ({kind,prompt,tiles,goal,hint,explain,...extra});
const choose = (prompt,tiles,goal,hint,explain,extra) => task('choose',prompt,tiles,goal,hint,explain,extra);
const order = (prompt,labels,goal,hint,explain,extra) => task('order',prompt,options(labels),goal,hint,explain,extra);
const collect = (prompt,tiles,goal,hint,explain) => task('collect',prompt,tiles,goal,hint,explain);
const mission = (world,id,title,desc,icon,...rounds) => ({id,world,title,desc,icon,rounds,questions:rounds.length,type:'interactive'});
const words = [
 mission('words','pal-letras','Caça às letras','Distinguir letras de números e sinais.','🔤',
  choose('Toque na letra M.',options(['8','M','✚']),'M','Procure a letra com duas pontas no meio.','M é a letra inicial de mala.'),
  collect('Separe as letras.',options(['B','3','A','?']),['B','A'],'Números e sinais ficam de fora.','A e B são letras.')),
 mission('words','pal-vogais','A cesta das vogais','Reconhecer vogais entre outras letras.','🧺',
  collect('Coloque as vogais na cesta.',options(['P','A','E','T','I']),['A','E','I'],'Diga devagar: A, E, I, O, U.','A, E e I são vogais. P e T são consoantes.')),
 mission('words','pal-sons','Começa com o mesmo som','Comparar sons no início de palavras.','👂',
  choose('Qual começa com MA, como mala?',[tile('Bola','⚽'),tile('Macaco','🐒'),tile('Pato','🦆')],'Macaco','Diga MA-la e escute o início de cada palavra.','Mala e macaco começam com MA.',{speech:'Qual começa com má, como mala? Bola, macaco ou pato?'}),
  choose('Qual começa como bola?',[tile('Boca','👄'),tile('Mala','🧳'),tile('Rato','🐭')],'Boca','Compare o primeiro pedaço de bola e boca.','Boca e bola começam com BO.')),
 mission('words','pal-imagem','Palavra e figura','Ligar palavras escritas às figuras correspondentes.','🖼️',
  task('match','Toque em uma palavra e na figura que combina.',[tile('Pato'),tile('Gato'),tile('Lua')],['Pato','Gato','Lua'],'Leia uma palavra por vez e procure a figura.','Cada palavra dá nome a uma figura.',{pairs:[tile('Lua','🌙'),tile('Pato','🦆'),tile('Gato','🐱')]})),
 mission('words','pal-silabas','Junte os sons','Combinar consoante e vogal para formar sílabas.','🔡',
  order('Monte a sílaba PA.',['A','P','M'],['P','A'],'A letra P vem antes do A.','P com A forma PA.',{speech:'Monte a sílaba pá.'}),
  order('Monte a sílaba TO.',['O','T','A'],['T','O'],'O primeiro som é o de T.','T com O forma TO.',{speech:'Monte a sílaba tô.'})),
 mission('words','pal-montar','Monte a palavra','Ordenar sílabas para escrever palavras.','🧱',
  order('Monte a palavra do desenho.',['TO','GA','PA'],['GA','TO'],'Diga ga-to e siga a ordem dos sons.','GA e TO formam GATO.',{picture:tile('Gato','🐱'),speech:'Monte a palavra gato.'}),
  order('Monte a palavra do desenho.',['LA','BO','MA'],['BO','LA'],'Diga bo-la em duas partes.','BO e LA formam BOLA.',{picture:tile('Bola','⚽'),speech:'Monte a palavra bola.'})),
 mission('words','pal-rimas','Rimas no jardim','Comparar os sons finais das palavras.','🎵',
  choose('Qual palavra rima com GATO?',[tile('Pato','🦆'),tile('Bola','⚽'),tile('Lua','🌙')],'Pato','Escute o final de ga-to e pa-to.','Gato rima com pato.',{speech:'Qual palavra rima com gato? Pato, bola ou lua?'}),
  choose('Qual palavra rima com MÃO?',[tile('Pé','🦶'),tile('Pão','🍞'),tile('Flor','🌷')],'Pão','Escute o som final de mão.','Mão e pão rimam no som ÃO.',{speech:'Qual palavra rima com mão? Pé, pão ou flor?'})),
 mission('words','pal-completar','A letra que falta','Relacionar um som à letra que completa a palavra.','✏️',
  order('Complete: _ATO',['G','M','L'],['G'],'Diga gato e escute o primeiro som.','G completa GATO.',{picture:tile('Gato','🐱'),speech:'Qual letra falta no começo de gato?'}),
  order('Complete: B_LA',['I','E','O'],['O'],'Diga BO-LA em voz alta.','O completa BOLA.',{picture:tile('Bola','⚽'),speech:'Qual vogal falta em bola, depois de bê?'})),
 mission('words','pal-separar','Palmas para as sílabas','Separar uma palavra em seus pedaços sonoros.','👏',
  order('Separe JANELA em três pedaços.',['LA','JA','NE','NA'],['JA','NE','LA'],'Bata uma palma para cada pedaço que fala.','Janela se divide em JA, NE e LA.',{speech:'Diga janela e bata uma palma para cada sílaba.'}),
  order('Separe SAPATO em três pedaços.',['TO','SA','PA','TA'],['SA','PA','TO'],'Diga devagar: sa, pa, to.','Sapato se divide em SA, PA e TO.')),
 mission('words','pal-frase','Uma frase em ordem','Organizar palavras com espaços para escrever uma frase.','📝',
  order('Forme a frase que combina com a figura.',['pula.','O','sapo'],['O','sapo','pula.'],'O ponto indica a última palavra.','O sapo pula.',{picture:tile('Um sapo pula','🐸'),speech:'Organize as palavras: pula, o, sapo.'})),
 mission('words','pal-leitura','Leia e encontre','Ler frases curtas e localizar informação explícita.','📖',
  choose('O que Bia pegou?',[tile('Bola','⚽'),tile('Maçã','🍎'),tile('Pipa','🪁')],'Bola','Volte ao texto e procure a palavra depois de pegou.','O texto diz que Bia pegou a bola.',{passage:'Bia pegou a bola.'}),
  choose('Qual animal Lina viu?',[tile('Gato','🐱'),tile('Pato','🦆'),tile('Sapo','🐸')],'Pato','Leia de novo e procure o nome do animal.','Lina viu um pato.',{passage:'Lina viu um pato.'})),
 mission('words','pal-historia','O passeio de Nina','Acompanhar dois trechos de uma história e entender o que aconteceu.','📗',
  choose('Por que Nina parou?',[tile('Para devolver a pipa','🪁'),tile('Para comer','🍎'),tile('Para descansar','🛏️')],'Para devolver a pipa','A pipa de Caio caiu perto de Nina. O que ela fez?','Nina parou para ajudar Caio.',{passage:'Nina viu a pipa de Caio cair na grama. Ela parou, pegou a pipa e devolveu a Caio.'}),
  order('O que aconteceu primeiro e o que veio depois?',['A pipa subiu','O vento voltou'],['O vento voltou','A pipa subiu'],'Leia a segunda parte desde o começo.','O vento voltou antes de a pipa subir.',{passage:'Caio segurou a linha. O vento voltou e a pipa subiu. Os dois sorriram.'}))
];
const route = (prompt,map,hint,explain,extra={}) => task('route',prompt,[],null,hint,explain,{map,...extra});
const logic = [
 mission('logic','log-sequencia','O fio das figuras','Continuar uma sequência que alterna duas figuras.','🔷',
  order('Continue o fio com duas peças.',['Triângulo','Círculo','Quadrado'],['Círculo','Triângulo'],'Veja as duas primeiras peças e repita a ordem.','O fio alterna círculo e triângulo.',{passage:'Círculo · Triângulo · Círculo · Triângulo · ? · ?'})),
 mission('logic','log-padroes','O espaço vazio','Completar um padrão que agrupa figuras iguais.','🧵',
  choose('O que entra no espaço vazio?',[tile('Estrela','⭐'),tile('Lua','🌙'),tile('Sol','☀️')],'Estrela','O grupo tem duas estrelas e uma lua.','A estrela completa a dupla.',{passage:'⭐ ⭐ 🌙  ·  ⭐ ? 🌙',speech:'Estrela, estrela, lua. Estrela, espaço vazio, lua. O que falta?'})),
 mission('logic','log-diferente','Um intruso no grupo','Encontrar um elemento por sua diferença observável.','🔎',
  choose('Qual dessas figuras é diferente?',[tile('Sapato','👟'),tile('Maçã','🍎'),tile('Uva','🍇'),tile('Pera','🍐')],'Sapato','Pense em quais figuras são frutas.','O sapato é o único que não é fruta.')),
 mission('logic','log-labirinto','O caminho do coelho','Navegar por um labirinto e contornar obstáculos.','🐇',
  route('Leve o coelho até a cenoura.',['S#..','.#.#','...G'],'Desça antes de tentar passar pela parede.','Você encontrou um caminho sem atravessar paredes.',{actor:'🐇',target:'🥕'})),
 mission('logic','log-memoria','Pares escondidos','Lembrar onde estão três pares de figuras.','🃏',
  task('memory','Vire duas cartas por vez. Encontre três pares.',[tile('Maçã','🍎'),tile('Lua','🌙'),tile('Carro','🚗')],null,'Lembre o lugar das figuras que já viu.','Você encontrou todos os pares.')),
 mission('logic','log-puzzle','Mosaico da casinha','Compor uma figura identificando a posição das formas.','🏠',
  task('mosaic','Monte a casa. Escolha uma peça e toque no lugar dela.',[tile('Quadrado','■'),tile('Triângulo','▲'),tile('Retângulo','▮')],['Triângulo','Quadrado','Retângulo'],'O telhado fica em cima. A porta fica na parede.','O triângulo é o telhado, o quadrado é a parede e o retângulo é a porta.',{pairs:[tile('Telhado'),tile('Parede'),tile('Porta')]})),
 mission('logic','log-classificar','Cada figura no seu lugar','Agrupar figuras por categoria.','🧺',
  collect('Separe somente os animais.',[tile('Borboleta','🦋'),tile('Maçã','🍎'),tile('Gato','🐱'),tile('Carrinho','🚗')],['Borboleta','Gato'],'Observe quais figuras representam seres vivos que são animais.','A borboleta e o gato são animais.')),
 mission('logic','log-pistas','O segredo da caixa','Combinar duas pistas para encontrar a única solução.','🔍',
  choose('Que figura está na caixa?',[{...tile('Triângulo azul','▲'),tone:'blue'},tile('Quadrado azul','🟦'),tile('Círculo azul','🔵'),{...tile('Triângulo vermelho','▲'),tone:'red'}],'Triângulo azul','Use as duas pistas: cor e lados.','O triângulo azul tem três lados e é azul.',{passage:'A figura é azul. Ela tem três lados.'}))
];
const program = (prompt,map,max,hint,explain,extra={}) => task('program',prompt,[],null,hint,explain,{map,max,...extra});
const code = [
 mission('code','cod-setas','O robô segue setas','Criar uma sequência curta de comandos.','🤖',
  program('Use duas setas para chegar à estrela.',['S.G'],2,'A estrela fica duas casas à direita.','Cada seta move o robô uma casa.')),
 mission('code','cod-caminho','Rota até a estrela','Planejar uma rota que contorna uma parede.','⭐',
  program('Planeje o caminho que contorna a parede.',['S#G','...'],5,'Desça antes de seguir para a direita.','O robô passou por baixo da parede.')),
 mission('code','cod-ordem','Comandos em ordem','Montar instruções na ordem que o caminho exige.','↕️',
  program('A ordem das setas muda o caminho.',['S..','##.','..G'],4,'Vá primeiro até o fim da fileira de cima.','Seguir antes de descer evita a parede.')),
 mission('code','cod-corrigir','Conserte o comando','Depurar uma sequência com uma seta incorreta.','🔧',
  program('Execute o programa e troque a seta que bloqueia o caminho.',['S..','##G'],3,'Um comando aponta para cima quando o robô precisa descer.','Trocar a seta resolveu o problema.',{seed:['R','R','U']})),
 mission('code','cod-repetir','Movimento repetido','Usar um bloco para executar o mesmo passo duas vezes.','🔁',
  program('Use Repetir 2 vezes para andar duas casas com um bloco.',['S.G'],1,'Ative Repetir 2 vezes e escolha a seta para a direita.','O bloco repetiu o mesmo movimento duas vezes.',{repeat:true})),
 mission('code','cod-limite','Poucos blocos, bom caminho','Resolver um labirinto com limite de blocos.','🧱',
  program('Chegue à estrela usando até dois blocos.',['S..','##.','##G'],2,'Repita a seta para a direita e depois repita a seta para baixo.','Dois blocos executaram quatro movimentos.',{repeat:true})),
 mission('code','cod-foguete','Rota do foguete','Programar uma rota para recolher uma estrela e pousar.','🚀',
  program('Pegue a estrela e leve o foguete à Lua.',['S.C','.##','..G'],8,'Volte pela fileira de cima depois de pegar a estrela.','A rota incluiu a estrela antes do pouso.',{actor:'🚀',target:'🌙'})),
 mission('code','cod-final','O grande resgate','Combinar repetição, sequência e correção de programa.','🛰️',
  program('Conserte o programa para pegar a estrela e chegar à Lua.',['S.C','##.','..G'],2,'O segundo bloco precisa descer duas casas.','Os dois blocos repetidos passaram pela estrela e chegaram à Lua.',{repeat:true,seed:['R2','L2'],actor:'🚀',target:'🌙'}))
];
const vocab = (entries, indices) => indices.map(i=>{
 const [term,pt,icon]=entries[i];
 const tiles=[i,(i+1)%entries.length,(i+2)%entries.length].sort((a,b)=>a-b).map(j=>tile(entries[j][1],entries[j][2],entries[j][0]));
 return choose('Ouça ou leia a palavra em inglês. Escolha a figura.',tiles,term,'Ouça de novo ou leia as letras. Compare com as figuras.',term+' significa '+pt.toLocaleLowerCase('pt-BR')+'.',{english:term});
});
const colors=[['red','Vermelho','🟥'],['blue','Azul','🟦'],['yellow','Amarelo','🟨'],['green','Verde','🟩']];
const numbers=['one','two','three','four','five','six','seven','eight','nine','ten'].map((word,i)=>[word,String(i+1),String(i+1)]);
const animals=[['dog','Cachorro','🐶'],['cat','Gato','🐱'],['bird','Pássaro','🐦'],['fish','Peixe','🐟']];
const fruit=[['apple','Maçã','🍎'],['banana','Banana','🍌'],['orange','Laranja','🍊'],['grapes','Uvas','🍇']];
const school=[['pencil','Lápis','✏️'],['book','Livro','📕'],['backpack','Mochila','🎒'],['scissors','Tesoura','✂️']];
const body=[['hand','Mão','✋'],['foot','Pé','🦶'],['eye','Olho','👁️'],['ear','Orelha','👂']];
const hello=[['hello','Olá','👋'],['good morning','Bom dia','🌅'],['good night','Boa noite','🌙'],['goodbye','Até logo','🙋']];
const english = [
 mission('english','ing-cores','Colors','Associar cores às palavras em inglês.','🎨',...vocab(colors,[0,1,2,3])),
 mission('english','ing-numeros','Numbers','Praticar os números de one a ten.','🔢',...vocab(numbers.slice(0,5),[0,1,2,3,4]),...vocab(numbers.slice(5),[0,1,2,3,4])),
 mission('english','ing-animais','Animals','Reconhecer nomes de animais em inglês.','🐾',...vocab(animals,[0,1,2,3])),
 mission('english','ing-frutas','Fruit','Associar frutas ilustradas às palavras em inglês.','🍎',...vocab(fruit,[0,1,2,3])),
 mission('english','ing-escola','At school','Reconhecer nomes de materiais escolares.','🎒',...vocab(school,[0,1,2,3])),
 mission('english','ing-corpo','My body','Associar partes do corpo às palavras em inglês.','✋',...vocab(body,[0,1,2,3])),
 mission('english','ing-saudacoes','Hello!','Associar saudações a situações do dia.','👋',...vocab(hello,[0,1,2,3])),
 mission('english','ing-revisao','Listen and find','Revisar vocabulário com palavras faladas e escritas.','🎧',...vocab(colors,[3]),...vocab(animals,[2]),...vocab(school,[1]),...vocab(hello,[3]))
];
const item = (label,icon,cents,id=label) => ({...tile(label,icon,id),cents});
const shop = (prompt,tiles,hint,explain,rules) => task('shop',prompt,tiles,null,hint,explain,rules);
const money = [
 mission('money','fin-moedas','Moedas brasileiras','Reconhecer valores em centavos e em reais.','🪙',
  shop('Coloque uma moeda de 50 centavos na bandeja.',[item('25 centavos','🪙',25),item('50 centavos','🪙',50),item('1 real','🪙',100)],'Procure o número 50.','50 centavos são meio real.',{total:50,limit:1,tray:'Bandeja de moedas'}),
  shop('Agora encontre uma moeda de 1 real.',[item('10 centavos','🪙',10),item('1 real','🪙',100),item('25 centavos','🪙',25)],'Um real equivale a 100 centavos.','A moeda de 1 real vale 100 centavos.',{total:100,limit:1,tray:'Bandeja de moedas'})),
 mission('money','fin-notas','Notas do Brasil','Distinguir notas brasileiras pelos valores.','💵',
  shop('Escolha uma nota de 5 reais.',[item('Nota de 2 reais','💵',200),item('Nota de 5 reais','💵',500),item('Nota de 10 reais','💵',1000)],'Leia os números nas notas.','A nota de 5 reais tem valor de R$ 5,00.',{total:500,limit:1,tray:'Carteira fictícia'})),
 mission('money','fin-soma','Juntando valores','Compor um valor com moedas fictícias.','🧮',
  shop('Faça 1 real com duas moedas.',[item('50 centavos','🪙',50,'a'),item('25 centavos','🪙',25),item('50 centavos','🪙',50,'b')],'Tente juntar duas moedas de mesmo valor.','50 centavos mais 50 centavos dão 1 real.',{total:100,limit:2,tray:'Bandeja de moedas'})),
 mission('money','fin-loja','Minha primeira compra','Montar uma compra fictícia e acompanhar o total.','🛍️',
  shop('Coloque o lápis e o caderno no carrinho.',[item('Lápis','✏️',200),item('Caderno','📓',400),item('Borracha','⬜',100)],'Confira se o carrinho tem os dois produtos pedidos.','O lápis e o caderno custam juntos R$ 6,00.',{required:['Lápis','Caderno'],limit:2,budget:700,checkout:true})),
 mission('money','fin-troco','Devolva o troco','Selecionar a quantia que sobra após uma compra.','🧾',
  shop('Uma maçã custa R$ 3,00. Você pagou R$ 5,00. Separe o troco.',[item('Moeda de 1 real','🪙',100,'a'),item('Outra moeda de 1 real','🪙',100,'b'),item('Nota de 5 reais','💵',500)],'Conte de três até cinco. Quanto faltou?','O troco é R$ 2,00.',{total:200,limit:2,tray:'Troco fictício'})),
 mission('money','fin-orcamento','Dentro do orçamento','Escolher dois produtos sem exceder o dinheiro disponível.','🧺',
  shop('Escolha dois produtos por até R$ 6,00.',[item('Maçã','🍎',200),item('Suco','🧃',400),item('Caderno','📓',500)],'Some os preços e confira se o total cabe no orçamento.','Você encontrou dois produtos que cabem no orçamento.',{count:2,limit:2,budget:600,checkout:true})),
 mission('money','fin-prioridades','Preciso ou quero?','Distinguir necessidade e desejo em um contexto concreto.','💧',
  task('match','Ligue cada escolha ao que ela representa no passeio.',[tile('Água quando estou com sede','💧','necessidade'),tile('Carrinho extra para brincar','🚗','desejo')],['necessidade','desejo'],'Pense no que ajuda o corpo agora e no que pode esperar.','Com sede, você precisa de água. O carrinho extra pode esperar.',{pairs:[tile('Posso esperar','⏳','desejo'),tile('Preciso agora','💧','necessidade')]})),
 mission('money','fin-poupar','O cofrinho da meta','Planejar quanto guardar para uma compra futura.','🐷',
  shop('Seu livro custa R$ 6,00. Já guardou R$ 4,00. Quanto falta guardar?', [item('Moeda de 1 real','🪙',100),item('Nota de 2 reais','💵',200),item('Nota de 5 reais','💵',500)],'Conte de quatro até seis.','Guardando mais R$ 2,00, você chega à meta de R$ 6,00.',{total:200,limit:1,tray:'Cofrinho fictício'}))
];
window.MissaoMundos = {worlds,missions:[...words,...logic,...code,...english,...money]};
})();
