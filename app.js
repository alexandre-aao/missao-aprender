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
 {id:'m-contar',world:'math',title:'Conte os desenhos',desc:'Toque nos desenhos e descubra quantos existem.',icon:'🍎',type:'count',questions:4},
 {id:'m-somar',world:'math',title:'Vamos somar?',desc:'Junte duas coleções para encontrar o total.',icon:'➕',type:'sum',questions:4},
 {id:'m-comparar',world:'math',title:'Quem tem mais?',desc:'Compare grupos e escolha o que tem mais.',icon:'⚖️',type:'compare',questions:4},
 {id:'p-contar',world:'review',title:'Conte até cinco',desc:'Uma revisão tranquila, com poucos objetos.',icon:'🧸',type:'preschool',questions:4},
 {id:'c-gravidade',world:'science',title:'Por que a bola cai?',desc:'Faça a experiência e descubra a gravidade.',icon:'🏀',type:'gravity',questions:1},
 {id:'c-dia-noite',world:'science',title:'Como nasce a noite?',desc:'Gire a Terra e observe onde está iluminado.',icon:'🌎',type:'daynight',questions:1}
];
// Laboratórios de observação ilustrados, com duas experiências antes da pergunta.
// Guia de investigação das oito missões clássicas: mantém seus IDs e pontuações.
const SCIENCE_CLASSIC_GUIDES={
  "c-plantas": {
    "predictionPrompt": "O que ajuda uma planta a continuar crescendo?",
    "predictions": [
      "Água e luz adequada",
      "Ficar muitos dias sem água"
    ],
    "comparePrompt": "O que muda quando falta água ou luz durante muito tempo?",
    "ask": "O que uma planta geralmente precisa para crescer bem?",
    "choices": [
      [
        "agua",
        "Água, luz adequada e nutrientes"
      ],
      [
        "brinquedos",
        "Apenas água, sempre no escuro"
      ],
      [
        "escuro",
        "Apenas luz, nunca água"
      ]
    ],
    "explain": "Plantas geralmente precisam de água, luz adequada, ar e nutrientes. Os efeitos demoram dias ou semanas. Cada espécie tolera condições diferentes.",
    "actions": [
      [
        "💧",
        "Dar água e luz adequadas",
        "☀️ 💧 🌿",
        "Com água, luz e boas condições, uma planta pode continuar crescendo ao longo dos dias."
      ],
      [
        "🏜️",
        "Passar vários dias sem água",
        "☀️ 🌱 🥀",
        "Sem água por tempo suficiente, muitas plantas murcham."
      ],
      [
        "🌑",
        "Passar muito tempo sem luz",
        "🌑 🪴",
        "Sem luz suficiente durante muito tempo, muitas plantas enfraquecem."
      ]
    ],
    "visuals": [
      [
        "☀️",
        "💧",
        "🌿"
      ],
      [
        "☀️",
        "🚫💧",
        "🥀"
      ],
      [
        "🌑",
        "🪴",
        "🍃"
      ]
    ]
  },
  "c-flutua": {
    "predictionPrompt": "Na água, um bloco comum de madeira e uma pedra vão…",
    "predictions": [
      "Madeira flutua; pedra afunda",
      "Os dois afundam"
    ],
    "comparePrompt": "A água é a mesma: o que ficou na superfície e o que foi para o fundo?",
    "ask": "O que vimos acontecer com o bloco de madeira e a pedra?",
    "choices": [
      [
        "madeira",
        "Madeira flutuou e pedra afundou"
      ],
      [
        "pedra",
        "Pedra flutuou e madeira afundou"
      ],
      [
        "metal",
        "Os dois sempre ficaram na superfície"
      ]
    ],
    "explain": "Muitos blocos de madeira flutuam e pedras comuns afundam. O material, a densidade média e o formato influenciam. Não depende só do peso do objeto.",
    "actions": [
      [
        "🪵",
        "Testar bloco de madeira comum",
        "🪵〰️🌊",
        "Neste modelo, o bloco de madeira fica na superfície."
      ],
      [
        "🪨",
        "Testar pedra comum",
        "🌊⬇️🪨",
        "Neste modelo, a pedra desce para o fundo."
      ],
      [
        "⛵",
        "Ver um barco com ar dentro",
        "⛵🌊",
        "Um barco pode flutuar graças ao formato e à água deslocada, mesmo sendo feito de metal."
      ]
    ],
    "visuals": [
      [
        "🪵",
        "〰️",
        "💧"
      ],
      [
        "💧",
        "⬇️",
        "🪨"
      ],
      [
        "⛵",
        "〰️",
        "🌊"
      ]
    ]
  },
  "c-ima": {
    "predictionPrompt": "Qual objeto vai ser atraído por um ímã escolar?",
    "predictions": [
      "Um clipe de aço com ferro",
      "Uma tampinha de plástico"
    ],
    "comparePrompt": "O ímã atraiu todos os materiais ou apenas alguns?",
    "ask": "Qual objeto costuma ser atraído por um ímã comum?",
    "choices": [
      [
        "clipe",
        "Um clipe de aço contendo ferro"
      ],
      [
        "papel",
        "Uma folha de papel"
      ],
      [
        "plastico",
        "Uma tampinha plástica"
      ]
    ],
    "explain": "Muitos clipes de aço contêm ferro e são atraídos pelo ímã. Papel, plástico e alumínio comum não são fortemente atraídos; nem todo metal é magnético.",
    "actions": [
      [
        "📎",
        "Aproximar o clipe de aço",
        "🧲 ✨ 📎",
        "Um clipe comum de aço com ferro pode ser atraído pelo ímã."
      ],
      [
        "📄",
        "Aproximar uma folha de papel",
        "🧲  📄",
        "O papel não é atraído pelo ímã comum."
      ],
      [
        "🧩",
        "Aproximar plástico",
        "🧲  🧩",
        "O plástico não é atraído pelo ímã comum."
      ],
      [
        "🥫",
        "Aproximar alumínio comum",
        "🧲  🥫",
        "O alumínio não é fortemente atraído por um ímã escolar comum."
      ]
    ],
    "visuals": [
      [
        "🧲",
        "✨",
        "📎"
      ],
      [
        "🧲",
        "↛",
        "📄"
      ],
      [
        "🧲",
        "↛",
        "🧩"
      ],
      [
        "🧲",
        "↛",
        "🥫"
      ]
    ]
  },
  "c-sombras": {
    "predictionPrompt": "Se a luz vier da esquerda, a sombra do brinquedo aparece…",
    "predictions": [
      "À direita",
      "À esquerda"
    ],
    "comparePrompt": "O que mudou de lado quando a lanterna mudou de posição?",
    "ask": "Onde a sombra costuma aparecer em relação à luz?",
    "choices": [
      [
        "oposto",
        "No lado oposto à fonte de luz"
      ],
      [
        "mesmo",
        "Sempre do mesmo lado da luz"
      ],
      [
        "dentro",
        "Sempre embaixo, em qualquer posição"
      ]
    ],
    "explain": "Objetos opacos bloqueiam a passagem da luz e podem formar sombra no lado oposto à fonte. A posição da parede também influencia a sombra projetada.",
    "visuals": [
      [
        "🔦",
        "→",
        "🧸",
        "⬛"
      ],
      [
        "⬛",
        "🧸",
        "←",
        "🔦"
      ]
    ]
  },
  "c-som": {
    "predictionPrompt": "Ao tocar um tambor, o que acontece com a pele dele?",
    "predictions": [
      "Ela vibra",
      "Ela continua totalmente parada"
    ],
    "comparePrompt": "O que mudou entre o tambor tocado e o tambor parado?",
    "ask": "O que produz o som do tambor quando o tocamos?",
    "choices": [
      [
        "vibracao",
        "A vibração da membrana"
      ],
      [
        "cor",
        "A cor pintada no tambor"
      ],
      [
        "silencio",
        "O ar parado sem vibração"
      ]
    ],
    "explain": "Ao tocar, a membrana do tambor vibra e faz o ar vibrar, formando ondas sonoras. Tocar de formas diferentes muda o som. O desenho representa vibrações, mas não reproduz som real.",
    "actions": [
      [
        "🥁",
        "Tocar o tambor",
        "🥁 〰️〰️",
        "A membrana vibra e produz som."
      ],
      [
        "✋",
        "Deixar o tambor parar",
        "🥁 ⏸️",
        "Quando o tambor para de vibrar, ele deixa de produzir esse som."
      ],
      [
        "👆",
        "Tocar bem de leve",
        "👆 🥁 〰️",
        "Um toque leve costuma fazer uma vibração menor e um som mais suave."
      ]
    ],
    "visuals": [
      [
        "🥁",
        "〰️",
        "👂"
      ],
      [
        "✋",
        "🥁",
        "🔇"
      ],
      [
        "👆",
        "🥁",
        "〰️"
      ]
    ]
  },
  "c-agua": {
    "predictionPrompt": "Se um cubo de gelo receber calor suficiente, ele vai…",
    "predictions": [
      "Derreter e virar água líquida",
      "Continuar sólido para sempre"
    ],
    "comparePrompt": "O que mudou quando o gelo recebeu calor ou ficou mais frio?",
    "ask": "O que acontece com o gelo quando recebe calor suficiente?",
    "choices": [
      [
        "derrete",
        "Derrete e vira água líquida"
      ],
      [
        "vira-pedra",
        "Continua congelado mesmo com calor suficiente"
      ],
      [
        "cresce",
        "Forma cada vez mais gelo ao aquecer"
      ]
    ],
    "explain": "Gelo é água sólida. Ao receber energia suficiente, pode derreter e virar água líquida; se resfriar o bastante, a água pode congelar novamente. Experimente apenas no desenho.",
    "actions": [
      [
        "❄️",
        "Manter bem frio no desenho",
        "❄️ 🧊",
        "Em temperatura suficientemente baixa, a água continua sólida."
      ],
      [
        "☀️",
        "Adicionar calor no desenho",
        "🧊 → 💧",
        "Com calor suficiente, o gelo derrete e vira água líquida."
      ],
      [
        "🧊",
        "Resfriar a água no desenho",
        "💧 → 🧊",
        "Se esfriar o bastante, a água pode congelar novamente."
      ]
    ],
    "visuals": [
      [
        "❄️",
        "🧊",
        "❄️"
      ],
      [
        "☀️",
        "🧊",
        "💧"
      ],
      [
        "❄️",
        "💧",
        "🧊"
      ]
    ]
  },
  "c-sol": {
    "predictionPrompt": "Quem emite luz própria: o Sol ou a Terra?",
    "predictions": [
      "O Sol",
      "A Terra"
    ],
    "comparePrompt": "Quem emite luz, e quem recebe e reflete a luz solar?",
    "ask": "Qual objeto apresentado produz sua própria luz?",
    "choices": [
      [
        "estrela",
        "O Sol, que é uma estrela"
      ],
      [
        "planeta",
        "A Terra, porque é planeta"
      ],
      [
        "lua",
        "A Lua, por refletir luz"
      ]
    ],
    "explain": "O Sol é uma estrela que emite luz. A Terra e a Lua recebem luz solar e refletem parte dela. Nunca olhe diretamente para o Sol: use apenas este desenho.",
    "actions": [
      [
        "☀️",
        "Observar o Sol no desenho",
        "☀️ ✨",
        "O Sol é uma estrela que emite sua própria luz."
      ],
      [
        "🌍",
        "Observar a Terra",
        "☀️ → 🌍",
        "A Terra é um planeta, iluminado pelo Sol."
      ],
      [
        "🌙",
        "Observar a Lua",
        "☀️ → 🌙",
        "A Lua reflete parte da luz solar que chega até ela."
      ]
    ],
    "visuals": [
      [
        "☀️",
        "✨",
        "🌌"
      ],
      [
        "☀️",
        "→",
        "🌍"
      ],
      [
        "☀️",
        "→",
        "🌙"
      ]
    ]
  },
  "c-borboleta": {
    "predictionPrompt": "O que sai da crisálida ao final dessa transformação?",
    "predictions": [
      "Uma borboleta adulta",
      "Uma lagarta recém-nascida"
    ],
    "comparePrompt": "Como o corpo do animal mudou da fase de ovo à fase adulta?",
    "ask": "Depois da fase de crisálida, o que costuma aparecer?",
    "choices": [
      [
        "borboleta",
        "Uma borboleta adulta"
      ],
      [
        "peixe",
        "Uma lagarta recém-nascida"
      ],
      [
        "passaro",
        "Um ovo novo sem adulto"
      ]
    ],
    "explain": "Borboletas passam por ovo, lagarta, pupa (crisálida) e adulto. O tempo de transformação depende da espécie e das condições do ambiente.",
    "actions": [
      [
        "🥚",
        "Ver o início: ovo e lagarta",
        "🥚 → 🐛",
        "Do ovo nasce uma lagarta, que se alimenta e cresce."
      ],
      [
        "🟤",
        "Ver a fase de crisálida",
        "🐛 → 🟤",
        "A lagarta se transforma em pupa, protegida por uma crisálida."
      ],
      [
        "🦋",
        "Ver a fase adulta",
        "🟤 → 🦋",
        "Da crisálida emerge a borboleta adulta, com asas."
      ]
    ],
    "visuals": [
      [
        "🥚",
        "→",
        "🐛"
      ],
      [
        "🐛",
        "→",
        "🟤"
      ],
      [
        "🟤",
        "→",
        "🦋"
      ]
    ]
  }
};
const SCIENCE_DISCOVERIES=[
 {id:'c-plantas',title:'O que a plantinha precisa?',desc:'Compare a plantinha com água e sem água.',icon:'🌱',ask:'O que uma planta precisa para crescer saudável?',choices:[['agua','Água, luz e nutrientes'],['brinquedos','Apenas brinquedos'],['escuro','Só escuridão']],right:'agua',explain:'Plantas precisam de água, luz e nutrientes. Os efeitos reais levam tempo; este desenho é ilustrativo.',actions:[['💧','Regar a planta','🌿💧','Com água e boas condições, a planta pode continuar crescendo.'],['🏜️','Deixar sem água','🌱☀️','Sem água por tempo suficiente, muitas plantas murcham.']]},
 {id:'c-flutua',title:'Flutua ou afunda?',desc:'Experimente colocar materiais na água.',icon:'🛶',ask:'Qual desses objetos geralmente flutua na água?',choices:[['madeira','Um bloco de madeira'],['pedra','Uma pedra'],['metal','Uma bola maciça de aço']],right:'madeira',explain:'Um bloco comum de madeira costuma flutuar e uma pedra costuma afundar. A forma e o material fazem diferença.',actions:[['🪵','Colocar madeira','🪵🌊','O bloco de madeira permanece na superfície.'],['🪨','Colocar pedra','🌊🪨','A pedra desce para o fundo.']]},
 {id:'c-ima',title:'Descubra o ímã!',desc:'Teste o que é atraído por um ímã.',icon:'🧲',ask:'Qual objeto costuma ser atraído por um ímã?',choices:[['clipe','Clipe de aço'],['papel','Folha de papel'],['plastico','Tampinha de plástico']],right:'clipe',explain:'O aço de muitos clipes contém ferro e pode ser atraído por ímãs. Nem todo metal é magnético.',actions:[['📎','Testar clipe de aço','🧲✨📎','O clipe de aço é atraído pelo ímã.'],['📄','Testar papel','🧲   📄','O papel não é atraído pelo ímã.'],['🧩','Testar plástico','🧲   🧩','O plástico não é atraído pelo ímã.']]},
 {id:'c-sombras',title:'Brinque de luz e sombra',desc:'Troque o lado da lanterna.',icon:'🔦',ask:'A sombra aparece geralmente em qual lado do objeto?',choices:[['oposto','No lado oposto à fonte de luz'],['mesmo','No mesmo lado da luz'],['dentro','Dentro da lanterna']],right:'oposto',explain:'Objetos opacos bloqueiam a luz, formando uma sombra do lado oposto ao ponto de onde ela vem.',actions:[['⬅️','Luz vindo da esquerda','🔦 → 🧸 ▓▓','A sombra se forma à direita do ursinho.'],['➡️','Luz vindo da direita','▓▓ 🧸 ← 🔦','A sombra se forma à esquerda do ursinho.']]},
 {id:'c-som',title:'Como nasce o som?',desc:'Explore a vibração de um tambor.',icon:'🥁',ask:'O que produz o som do tambor?',choices:[['vibracao','A vibração da superfície'],['cor','A cor do tambor'],['silencio','O silêncio']],right:'vibracao',explain:'Quando o tambor é tocado, sua membrana vibra e produz ondas sonoras.',actions:[['🥁','Bater no tambor','🥁 〰️〰️','A superfície vibra e o som se propaga.'],['✋','Parar de tocar','🥁 ⏸️','Depois que a vibração para, o som produzido também termina.']]},
 {id:'c-agua',title:'Gelo e água',desc:'Veja o que pode acontecer com o gelo.',icon:'🧊',ask:'O que acontece com o gelo quando recebe calor suficiente?',choices:[['derrete','Derrete e vira água líquida'],['vira-pedra','Vira pedra'],['cresce','Cresce para sempre']],right:'derrete',explain:'Gelo é água no estado sólido. Ao receber calor suficiente, derrete e passa ao estado líquido.',actions:[['❄️','Deixar bem frio','🧊🧊','Em temperatura adequada, a água pode permanecer congelada.'],['☀️','Aquecer no desenho','🧊 → 💧','Com calor suficiente, o gelo derrete. Experimente apenas no desenho!']]},
 {id:'c-sol',title:'O que é o Sol?',desc:'Compare o Sol e um planeta.',icon:'☀️',ask:'O Sol é…',choices:[['estrela','Uma estrela'],['planeta','Um planeta'],['lua','Uma lua']],right:'estrela',explain:'O Sol é uma estrela. A Terra é um planeta que orbita o Sol.',actions:[['☀️','Observar o Sol','☀️ ✨','O Sol produz sua própria luz. Nunca olhe diretamente para ele.'],['🌍','Observar a Terra','🌍 🌙','A Terra é um planeta, iluminado pelo Sol.']]},
 {id:'c-borboleta',title:'Vida da borboleta',desc:'Observe fases da metamorfose.',icon:'🦋',ask:'Qual animal aparece ao final dessa transformação?',choices:[['borboleta','Borboleta adulta'],['peixe','Peixe'],['passaro','Passarinho']],right:'borboleta',explain:'No ciclo ilustrado, a borboleta passa por ovo, lagarta, crisálida e borboleta adulta.',actions:[['🥚','Ver começo do ciclo','🥚 → 🐛','De um ovo nasce uma lagarta.'],['🦋','Ver etapa final','🐛 → 🟤 → 🦋','A lagarta forma uma crisálida, da qual emerge a borboleta adulta.']]}
] .map(x=>({...x,...SCIENCE_CLASSIC_GUIDES[x.id],world:'science',type:'investigation',questions:1}));

// Investigações autorais de Ciências — referências e limites em docs/ciencias-referencias.md
const SCIENCE_TOPICS={"corpo":"🫶 Corpo e cuidados","materiais":"🧪 Materiais e descobertas","vida":"🌿 Natureza e seres vivos","terra":"🌞 Terra, luz e tempo"};
const SCIENCE_TOPIC_BY_ID={"c-gravidade":"terra","c-dia-noite":"terra","c-plantas":"vida","c-flutua":"materiais","c-ima":"materiais","c-sombras":"terra","c-som":"materiais","c-agua":"materiais","c-sol":"terra","c-borboleta":"vida"};
const SCIENCE_INVESTIGATIONS=[
  {
    "id": "c-maos",
    "topic": "corpo",
    "title": "O segredo das mãos limpas",
    "desc": "Compare duas formas de lavar as mãos.",
    "icon": "🧼",
    "reference": "EF01CI03",
    "predictionPrompt": "Qual jeito você acha que remove mais sujeira?",
    "predictions": [
      "Água e sabão",
      "Apenas água"
    ],
    "ask": "Por que usamos água e sabão para lavar as mãos?",
    "choices": [
      [
        "limpar",
        "Ajudam a remover sujeira e microrganismos"
      ],
      [
        "colorir",
        "Mudam a cor da pele"
      ],
      [
        "dispensar",
        "Dispensam o enxágue"
      ]
    ],
    "right": "limpar",
    "explain": "Água, sabão e fricção ajudam a remover sujeira e microrganismos. É importante esfregar as mãos e enxaguar bem.",
    "actions": [
      [
        "🚿",
        "Enxaguar só com água",
        "👐💧",
        "A água pode retirar parte da sujeira. Ela costuma remover menos do que água e sabão."
      ],
      [
        "🧼",
        "Esfregar com água e sabão",
        "👐🫧✨",
        "Ao esfregar e enxaguar com sabão, mais sujeira e microrganismos são removidos."
      ]
    ]
  },
  {
    "id": "c-sentidos",
    "topic": "corpo",
    "title": "Detetive dos sentidos",
    "desc": "Descubra como percebemos sons e cheiros.",
    "icon": "👂",
    "reference": "EF01CI02",
    "predictionPrompt": "Para perceber o som de um sino, você usa principalmente…",
    "predictions": [
      "Os ouvidos",
      "Os olhos"
    ],
    "ask": "Qual parte do corpo nos ajuda a perceber o som de um sino?",
    "choices": [
      [
        "ouvidos",
        "Os ouvidos"
      ],
      [
        "nariz",
        "O nariz"
      ],
      [
        "joelhos",
        "Os joelhos"
      ]
    ],
    "right": "ouvidos",
    "explain": "Os ouvidos percebem sons. O nariz ajuda a perceber cheiros, e os olhos ajudam a enxergar.",
    "actions": [
      [
        "🔔",
        "Observar um sino tocando",
        "🔔 〰️ 👂",
        "O sino vibra e produz som. Usamos os ouvidos para percebê-lo."
      ],
      [
        "🍊",
        "Observar uma laranja perfumada",
        "🍊 🌼 👃",
        "Substâncias no ar podem chegar ao nariz e permitir perceber o cheiro da laranja."
      ]
    ]
  },
  {
    "id": "c-luz-materiais",
    "topic": "materiais",
    "title": "Por onde a luz passa?",
    "desc": "Teste vidro transparente e papelão.",
    "icon": "🪟",
    "reference": "EF01CI01",
    "predictionPrompt": "Qual material deixa mais luz atravessar?",
    "predictions": [
      "Vidro transparente",
      "Papelão"
    ],
    "ask": "Por que enxergamos através de um vidro transparente e limpo?",
    "choices": [
      [
        "luz",
        "Porque permite a passagem de muita luz"
      ],
      [
        "brilho",
        "Porque cria luz própria"
      ],
      [
        "solido",
        "Porque é sempre mais quente"
      ]
    ],
    "right": "luz",
    "explain": "Um vidro transparente e limpo deixa muita luz atravessar. O papelão opaco bloqueia a passagem direta da luz.",
    "actions": [
      [
        "🪟",
        "Iluminar o vidro limpo",
        "🔦 → 🪟 → 🌟",
        "A luz atravessa o vidro transparente."
      ],
      [
        "📦",
        "Iluminar o papelão",
        "🔦 → 📦 ▪️",
        "O papelão opaco impede que a luz passe diretamente."
      ]
    ]
  },
  {
    "id": "c-absorver",
    "topic": "materiais",
    "title": "Qual material bebe água?",
    "desc": "Derrame água no desenho de dois materiais.",
    "icon": "🧽",
    "reference": "EF01CI01",
    "predictionPrompt": "Qual deles absorve mais água?",
    "predictions": [
      "Esponja",
      "Plástico liso"
    ],
    "ask": "Qual material costuma absorver água com facilidade?",
    "choices": [
      [
        "esponja",
        "Uma esponja comum"
      ],
      [
        "plastico",
        "Uma tampa de plástico liso"
      ],
      [
        "vidro",
        "Uma placa de vidro"
      ]
    ],
    "right": "esponja",
    "explain": "Uma esponja comum tem espaços que retêm água. Plástico liso e vidro geralmente não absorvem água da mesma forma.",
    "actions": [
      [
        "🧽",
        "Colocar gotas na esponja",
        "💧 → 🧽",
        "A água entra e fica retida em muitos espaços da esponja."
      ],
      [
        "🥣",
        "Colocar gotas no plástico liso",
        "💧 ↗ 🥣",
        "As gotas ficam na superfície ou escorrem. O plástico liso não costuma absorvê-las."
      ]
    ]
  },
  {
    "id": "c-momentos",
    "topic": "terra",
    "title": "O relógio do dia",
    "desc": "Explore manhã, tarde e noite.",
    "icon": "🌅",
    "reference": "EF01CI05",
    "predictionPrompt": "Qual período costuma vir depois da manhã?",
    "predictions": [
      "Tarde",
      "Noite"
    ],
    "ask": "Qual é a sequência de períodos de um dia?",
    "choices": [
      [
        "ordem",
        "Manhã, tarde e noite"
      ],
      [
        "troca",
        "Noite, tarde e manhã"
      ],
      [
        "igual",
        "Manhã, manhã e manhã"
      ]
    ],
    "right": "ordem",
    "explain": "Em um dia comum, distinguimos manhã, tarde e noite. Eles se repetem a cada novo dia.",
    "actions": [
      [
        "🌅",
        "Ver a manhã",
        "🌅 🐦",
        "Pela manhã, muitas pessoas iniciam suas atividades."
      ],
      [
        "☀️",
        "Ver a tarde",
        "🏞️ ☀️",
        "À tarde, ainda há luz do dia."
      ],
      [
        "🌙",
        "Ver a noite",
        "🌃 ⭐",
        "À noite, o Sol está abaixo do horizonte local e o céu geralmente escurece."
      ]
    ]
  },
  {
    "id": "c-animais-horarios",
    "topic": "vida",
    "title": "A vida de dia e de noite",
    "desc": "Observe animais com horários diferentes.",
    "icon": "🦉",
    "reference": "EF01CI06",
    "predictionPrompt": "Qual animal costuma procurar alimento à noite?",
    "predictions": [
      "Coruja",
      "Borboleta diurna"
    ],
    "ask": "Qual destes animais costuma ser mais ativo durante a noite?",
    "choices": [
      [
        "coruja",
        "Muitas espécies de coruja"
      ],
      [
        "borboleta",
        "Muitas borboletas comuns"
      ],
      [
        "abelha",
        "Muitas abelhas"
      ]
    ],
    "right": "coruja",
    "explain": "Muitas corujas são ativas à noite. Muitas borboletas e abelhas comuns são mais ativas durante o dia. Existem exceções.",
    "actions": [
      [
        "🦉",
        "Visitar a coruja à noite",
        "🌙 🦉 🐁",
        "Muitas espécies de coruja caçam quando está escuro."
      ],
      [
        "🦋",
        "Visitar a borboleta de dia",
        "☀️ 🌼 🦋",
        "Muitas borboletas comuns visitam flores durante o dia."
      ]
    ]
  },
  {
    "id": "c-partes-planta",
    "topic": "vida",
    "title": "Raízes e folhas em ação",
    "desc": "Veja o trabalho das partes da planta.",
    "icon": "🌱",
    "reference": "EF02CI06",
    "predictionPrompt": "Que parte da planta costuma absorver água no solo?",
    "predictions": [
      "Raiz",
      "Flor"
    ],
    "ask": "Qual é uma função das raízes de muitas plantas?",
    "choices": [
      [
        "agua",
        "Absorver água e sais minerais do solo"
      ],
      [
        "som",
        "Produzir sons para as folhas"
      ],
      [
        "asas",
        "Fazer a planta voar"
      ]
    ],
    "right": "agua",
    "explain": "As raízes de muitas plantas absorvem água e sais minerais. As folhas fazem fotossíntese com a energia da luz.",
    "actions": [
      [
        "🌱",
        "Observar as raízes",
        "🌱⬇️💧",
        "Muitas raízes retiram água e sais minerais do solo."
      ],
      [
        "🍃",
        "Observar as folhas",
        "☀️ → 🍃",
        "As folhas usam energia da luz na fotossíntese."
      ]
    ]
  },
  {
    "id": "c-sombra-maior",
    "topic": "terra",
    "title": "A sombra muda de tamanho",
    "desc": "Aproxime e afaste a lanterna no desenho.",
    "icon": "🔦",
    "reference": "EF02CI07",
    "predictionPrompt": "Se a lanterna ficar mais perto do objeto, a sombra na parede tende a ficar…",
    "predictions": [
      "Maior",
      "Menor"
    ],
    "ask": "Com a parede e o objeto parados, o que pode ocorrer ao aproximar a lanterna?",
    "choices": [
      [
        "maior",
        "A sombra na parede fica maior"
      ],
      [
        "sumir",
        "Toda sombra desaparece"
      ],
      [
        "luz",
        "O objeto começa a produzir luz"
      ]
    ],
    "right": "maior",
    "explain": "Em uma montagem simples, aproximar a fonte de luz do objeto pode aumentar a sombra na parede. Depende da posição dos elementos.",
    "actions": [
      [
        "🔦",
        "Lanterna perto do brinquedo",
        "🔦 🧸 ➜ ███",
        "A lanterna perto do brinquedo projeta uma sombra maior na parede."
      ],
      [
        "↔️",
        "Lanterna mais distante",
        "🔦 ➜ ➜ 🧸 ▪️",
        "Com a lanterna afastada e o objeto parado, a sombra na mesma parede fica menor."
      ]
    ]
  },
  {
    "id": "c-superficies",
    "topic": "terra",
    "title": "Qual tecido esquenta mais?",
    "desc": "Compare tecidos claros e escuros sob a luz.",
    "icon": "🌞",
    "reference": "EF02CI08",
    "predictionPrompt": "Se o tecido e a luz forem iguais, qual cor costuma esquentar mais?",
    "predictions": [
      "Escura",
      "Clara"
    ],
    "ask": "Em condições iguais, qual tecido geralmente absorve mais luz solar?",
    "choices": [
      [
        "escuro",
        "Tecido escuro"
      ],
      [
        "claro",
        "Tecido claro"
      ],
      [
        "iguais",
        "A cor nunca faz diferença"
      ]
    ],
    "right": "escuro",
    "explain": "Em geral, tecidos escuros absorvem mais luz solar do que tecidos claros do mesmo tipo. O aquecimento real também depende de outros fatores.",
    "actions": [
      [
        "⬛",
        "Observar tecido escuro",
        "☀️ ↓ ⬛",
        "Sob a mesma luz, o tecido escuro costuma absorver mais energia."
      ],
      [
        "⬜",
        "Observar tecido claro",
        "☀️ ↓ ⬜",
        "O tecido claro costuma refletir uma parte maior da luz."
      ]
    ]
  },
  {
    "id": "c-reutilizar",
    "topic": "materiais",
    "title": "A missão do menos lixo",
    "desc": "Compare dois hábitos do dia a dia.",
    "icon": "♻️",
    "reference": "EF01CI01",
    "predictionPrompt": "Qual escolha gera menos copos descartados?",
    "predictions": [
      "Usar uma garrafinha reutilizável",
      "Usar copos descartáveis novos"
    ],
    "ask": "Qual atitude pode reduzir o descarte de embalagens?",
    "choices": [
      [
        "reuso",
        "Usar uma garrafinha própria reutilizável"
      ],
      [
        "descartar",
        "Usar e jogar fora vários copos novos"
      ],
      [
        "trocar",
        "Pegar um copo novo para cada gole"
      ]
    ],
    "right": "reuso",
    "explain": "Usar e lavar adequadamente uma garrafinha própria pode reduzir os copos descartáveis. Separe resíduos conforme as regras locais.",
    "actions": [
      [
        "🥤",
        "Usar vários copos descartáveis",
        "🥤 🥤 🥤 🗑️",
        "Muitos copos usados uma única vez geram mais resíduos."
      ],
      [
        "🚰",
        "Usar garrafinha reutilizável",
        "🫗 💧 ♻️",
        "Uma garrafinha própria pode ser lavada e usada diversas vezes."
      ]
    ]
  }
].map(x=>({...x,world:'science',type:'investigation',questions:1}));
const expansion=window.MissaoMundos;
const interactive=expansion?.activity;
const MISSIONS=[...BASE_MISSIONS,...SKILLS.map(s=>({
 id:s.id,world:s.grade==='P'?'review':'math',grade:s.grade,
 title:s.title,desc:s.desc,icon:unitIcons[s.unit]||'📚',
 type:'curriculum',questions:8,unit:s.unit,skill:s,bncc:s.bncc
})),...SCIENCE_DISCOVERIES,...SCIENCE_INVESTIGATIONS,...(expansion?.missions||[])].map(m=>m.world==='science'?{...m,topic:m.topic||SCIENCE_TOPIC_BY_ID[m.id]||'materiais'}:m);
const WORLDS={
 math:{name:'Matemática',subtitle:'Sua trilha principal do 1º ano',icon:'🔢',css:'math',label:'PRINCIPAL',detail:'Conte, junte e compare. Aprender matemática pode ser uma aventura.'},
 review:{name:'Revisão da pré-escola',subtitle:'Conte, compare e reconheça formas',icon:'🧸',css:'review',label:'AQUECIMENTO',detail:'Revisite os primeiros desafios e fortaleça suas habilidades, sem trocar o ano escolar.'},
 science:{name:'Ciências',subtitle:'Laboratório de descobertas',icon:'🔬',css:'science',label:'EXPLORAR',detail:'Experiências interativas para observar e fazer descobertas.'}
};
for(const [key,world] of Object.entries(expansion?.worlds||{})){
 WORLDS[key]={...world,css:key,detail:world.subtitle};
}
const WORLD_ORDER=['review','math','science',...Object.keys(expansion?.worlds||{})];
const ICONS=[
 ['🍎','maçã','maçãs'],['⭐','estrela','estrelas'],['🐠','peixe','peixes'],
 ['🍓','morango','morangos'],['🍪','biscoito','biscoitos'],['🚗','carrinho','carrinhos'],
 ['🦋','borboleta','borboletas']
];
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
let missoesOcultas=new Set();
let data=load();let storageScope=STORAGE_KEY;let view='home';let session=null;let parentAllowed=false;let gateAnswer=0;let previousView='home';let gravityTimeout=null;
function save(){try{localStorage.setItem(storageScope,JSON.stringify(data));return true}catch(e){return false}}
function getMission(id){return MISSIONS.find(m=>m.id===id&&!missoesOcultas.has(m.id))}
function worldMissions(world){return MISSIONS.filter(m=>!missoesOcultas.has(m.id)&&m.world===world&&(world!=='math'||(m.grade?m.grade===data.grade:data.grade==='1')))}
function currentMissions(){return ['math','review','science',...WORLD_ORDER.slice(3)].flatMap(worldMissions)}
function missionDone(m){return !!data.missions[m.id] || (m.type==='curriculum'&&!!data.skills[m.id]?.mastered)}
function skillInfo(id){return data.skills[id]||{tries:0,correct:0,streak:0,mastered:false}}
function skillLevel(id){const p=skillInfo(id),accuracy=p.tries?p.correct/p.tries:0;return p.correct>=10&&accuracy>=.8?3:p.correct>=4&&accuracy>=.7?2:1}
function generateQuestion(m){return m.type==='curriculum'?CURRICULUM.question(m.skill,skillLevel(m.id)):makeQuestion(m)}
function completed(world){return worldMissions(world).filter(m=>missionDone(m)).length}
function totalStars(){return Object.values(data.missions).reduce((sum,x)=>sum+(Number(x.stars)||0),0)}
function numSolved(){return data.records.length}
function firstTryPercent(){return numSolved()?Math.round(data.records.filter(x=>x.firstTry).length/numSolved()*100):0}
function latestCompletions(){
 const lastRecord=new Map(data.records.map((record,index)=>[record.id,index]));
 return currentMissions().filter(m=>data.missions[m.id]?.completedAt)
  .sort((a,b)=>data.missions[b.id].completedAt.localeCompare(data.missions[a.id].completedAt)
   ||(lastRecord.get(b.id)??-1)-(lastRecord.get(a.id)??-1));
}
function markResume(id,step=0,firstTry=0){
 try{localStorage.setItem(storageScope+'::retomar',JSON.stringify({id,step,firstTry,at:new Date().toISOString()}))}catch{}
}
function lastProgress(){
 const available=currentMissions(), marker=readStored(storageScope+'::retomar');
 const active=available.find(m=>m.id===marker?.id);
 if(active&&!(data.missions[active.id]?.completedAt>=marker.at))return active;
 const latest=latestCompletions()[0];
 return (latest&&worldMissions(latest.world).find(m=>!missionDone(m)))||available.find(m=>!missionDone(m))||available[0];
}

function worldCard(key,featured=false,recommended=null){
 const w=WORLDS[key],done=completed(key),all=worldMissions(key).length;
 return `<button type="button" class="world ${w.css}${featured?' home-review':''}" data-nav="${key}" aria-label="Abrir ${escapeHtml(w.name)}">
 ${featured||!w.label?'':`<span class="tag">${w.label}</span>`}<span class="world-icon" aria-hidden="true">${w.icon}</span>
 <strong>${w.name}</strong><p>${key==='math'?`Descubra os números do ${data.grade}º ano`:recommended?`Sugestão: ${escapeHtml(recommended.title)}`:w.subtitle}</p>
 <span class="world-link">${done} de ${all} missões · ${featured?'Abrir revisão':'Explorar'} <span aria-hidden="true">→</span></span></button>`;
}
function homeView(){
 const next=lastProgress(),all=currentMissions(),done=all.filter(missionDone).length,pct=Math.round(done/Math.max(1,all.length)*100);
 const recent=latestCompletions().slice(0,3);
 const started=done||numSolved()||readStored(storageScope+'::retomar');
 const review=worldMissions('review').find(m=>!missionDone(m));
 return `${worldCard('review',true,review)}
 <section class="hero hero-kids" aria-label="Boas-vindas">
 <div class="hero-content"><span class="eyebrow">OI, EXPLORADOR! ✨</span>
 <h1>Uma aventura<br>espera por você!</h1>
 <p>Pronto para brincar, pensar e descobrir algo novo?</p>
 <button type="button" class="btn btn-light hero-cta" data-start="${next.id}" data-resume="1">🚀 ${missionDone(next)?'Jogar novamente':started?'Continuar aventura':'Começar: '+escapeHtml(next.title)}</button>
 ${started?`<span class="next-hint">Próxima: ${escapeHtml(next.title)}</span>`:''}</div>
 <span class="hero-mascot" aria-hidden="true">🧑‍🚀</span><span class="hero-planet" aria-hidden="true">🪐</span></section>
 <div class="section-heading" id="mundos"><h2>Explore os mundos</h2><button type="button" class="btn btn-ghost" data-nav="adventures">Ver todos</button></div>
 <div class="world-grid home-worlds">${worldCard('math')}${worldCard('science')}${expansion?worldCard('words'):''}${expansion?worldCard('logic'):''}</div>
 <section class="home-progress" aria-label="Seu progresso"><span class="home-progress-icon" aria-hidden="true">🌟</span>
 <div class="home-progress-copy"><strong>Olha só quanto você já explorou!</strong>
 <div class="meter" role="progressbar" aria-valuenow="${done}" aria-valuemin="0" aria-valuemax="${all.length}" aria-label="Missões concluídas"><span style="width:${pct}%"></span></div>
 <small>${done} de ${all.length} missões concluídas · No seu ritmo</small></div></section>
 ${recent.length?`<section class="exp-recent"><h2>Conquistas recentes</h2><ul>${recent.map(m=>`<li><span aria-hidden="true">${m.icon}</span> <strong>${escapeHtml(m.title)}</strong> · ${data.missions[m.id].stars} ${data.missions[m.id].stars===1?'estrela':'estrelas'}</li>`).join('')}</ul><button type="button" class="btn btn-ghost" data-nav="awards">Ver conquistas</button></section>`:''}`;
}
function adventuresView(){
 return `<div class="page-intro"><div><span class="eyebrow">SEU MAPA DE DESCOBERTAS</span>
 <h1>Para onde vamos? 🗺️</h1><p>Escolha um mundo para começar. Todas as aventuras podem ser revisitadas!</p></div>
 <span class="page-art" aria-hidden="true">🌈</span></div>
 <div class="world-grid adventures-grid">${WORLD_ORDER.map(key=>worldCard(key)).join('')}</div>
 <div class="tip-banner"><span class="tip-icon" aria-hidden="true">🚀</span><div><strong>Seu ritmo, sua aventura</strong>
 <p>Escolha uma missão, ou volte àquela que você mais gostou.</p></div></div>`;
}
function missionCard(m){
 const progress=data.missions[m.id],isDone=missionDone(m),p=m.type==='curriculum'?skillInfo(m.id):null;
 return `<button type="button" class="mission-card ${isDone?'mission-done':''}" data-start="${m.id}">
 <div class="mission-top"><span class="mission-icon" aria-hidden="true">${m.icon}</span>
 <span class="tag">${isDone?'FEITA ✓':m.type==='curriculum'?'TREINAR':'DESCOBRIR'}</span></div>
 <h3>${escapeHtml(m.title)}</h3><p>${escapeHtml(m.desc)}</p>
 <div class="mission-bottom"><span>${progress?`⭐ ${progress.stars} ${progress.stars===1?'estrela':'estrelas'}`:p?.tries?'Continue praticando':'Pronto para começar?'}</span>
 <span class="mission-arrow" aria-hidden="true">→</span></div></button>`;
}
function worldView(world){
 const w=WORLDS[world],all=worldMissions(world),done=completed(world);
 const filters=['math','review'].includes(world)?[['all','Todos os assuntos'],...Object.entries(UNITS).map(([k,v])=>[k,`${v.emoji} ${v.label}`])]:[];
 const ms=all.filter(m=>unitFilter==='all'||m.unit===unitFilter);
 const upcoming=all.find(m=>!missionDone(m))||all[0];
 const groups=new Map();
 for(const m of ms){const key=world==='science'?(m.topic||'materiais'):(m.unit&&UNITS[m.unit]?m.unit:'jogos');
 if(!groups.has(key))groups.set(key,{label:world==='science'?(SCIENCE_TOPICS[key]||'🔬 Descobertas'):key==='jogos'?'🎮 Missões especiais':`${UNITS[key].emoji} ${UNITS[key].label}`,items:[]});
 groups.get(key).items.push(m);}
 const ordered=world==='science'?['corpo','materiais','vida','terra'].filter(k=>groups.has(k)).map(k=>groups.get(k)):[...groups.values()];
 const sections=ordered.map((g,i)=>`<details class="mission-section" ${unitFilter!=='all'||i===0?'open':''}>
 <summary><span>${g.label}</span><span class="section-counter">${g.items.length} ${g.items.length===1?'missão':'missões'} <span aria-hidden="true">⌄</span></span></summary>
 <div class="mission-grid">${g.items.map(missionCard).join('')}</div></details>`).join('');
 return `<div class="page-intro"><div><span class="eyebrow">${world==='math'?data.grade+'º ANO':world==='review'?'PRÉ-ESCOLA':world==='science'?'EXPERIÊNCIAS':'MISSÕES'}</span>
 <h1>${w.name}</h1><p>${world==='math'?'Escolha um assunto e descubra o que você já sabe!':w.detail}</p></div>
 <span class="page-art" aria-hidden="true">${w.icon}</span></div>
 <div class="progress-summary"><strong>${done} de ${all.length} missões</strong>
 <div class="meter" role="progressbar" aria-label="Missões concluídas nesta trilha" aria-valuemin="0" aria-valuemax="${all.length}" aria-valuenow="${done}"><span style="width:${done/Math.max(1,all.length)*100}%"></span></div>
 <small>Você consegue! 🌱</small></div>
 ${upcoming?`<div class="featured-mission"><div class="featured-symbol" aria-hidden="true">${upcoming.icon}</div><div class="featured-copy">
 <span class="eyebrow">${missionDone(upcoming)?'SUA MISSÃO FAVORITA':'SUA PRÓXIMA MISSÃO'}</span><strong>${escapeHtml(upcoming.title)}</strong>
 <p>Um novo passo da sua aventura.</p></div><button type="button" class="btn btn-primary" data-start="${upcoming.id}">${missionDone(upcoming)?'Jogar de novo':'Jogar agora'} →</button></div>`:''}
 ${filters.length?`<div class="filter-heading"><h2>Escolha um assunto</h2><p>Toque em um tema ou abra uma trilha abaixo.</p></div>
 <div class="unit-filters" role="group" aria-label="Escolher assunto">${filters.map(([key,name])=>`<button type="button" class="unit-filter ${key===unitFilter?'active':''}" aria-pressed="${key===unitFilter}" data-unit="${key}">${name}</button>`).join('')}</div>`:''}
 <div class="mission-sections">${sections||'<p class="empty">Ainda não há missões neste assunto.</p>'}</div>
 ${world==='science'?'<div class="tip-banner"><span class="tip-icon">🧪</span><div><strong>Olhe, teste e descubra!</strong><p>As experiências são ilustrações para aprender. Converse sobre elas com um adulto.</p></div></div>':''}`;
}
function choices(answer,limit){const s=new Set([Number(answer)]);for(let off of shuffle([-3,-2,-1,1,2,3,4,-4,5])){if(s.size===3)break;let n=Number(answer)+off;if(n>=0&&n<=limit)s.add(n)}for(let i=0;s.size<3&&i<=limit;i++)s.add(i);return shuffle([...s].slice(0,3).map(String))}
function makeQuestion(m){const [icon,singular,plural]=pick(ICONS);const howMany=['peixes','morangos','biscoitos','carrinhos'].includes(plural)?'Quantos':'Quantas';let n=0,a=0,b=0,text='',hint='',answer='',parts=[],answers=[];
 if(m.type==='count'||m.type==='preschool'){
   n=random(1,m.type==='preschool'?5:10);text=`${howMany} ${plural} você vê?`;hint=`Há ${n} ${n===1?singular:plural} ao todo.`;answer=String(n);parts=[{icon,n}];answers=choices(n,m.type==='preschool'?8:13);
 }else if(m.type==='sum'){
   a=random(1,5);b=random(1,10-a);n=a+b;text=`Junte os dois grupos. ${howMany} ${plural} teremos?`;hint=`Primeiro conte ${a}. Depois conte mais ${b}. No total são ${n}.`;answer=String(n);parts=[{icon,n:a},{icon,n:b}];answers=choices(n,13);
 }else if(m.type==='compare'){
   a=random(1,9);b=random(1,9);if(a===b)b=a===9?10:a+1;text=`Qual grupo tem mais ${plural}?`;answer=a>b?'A':'B';hint=`O grupo A tem ${a} e o B tem ${b}. ${a>b?'A tem mais!':'B tem mais!'}`;parts=[{icon,n:a},{icon,n:b}];answers=['A','B'];
 }
 return{text,hint,answer,parts,answers,icon,singular};
}
function objectTokens(group,n){return `<div class="object-list">${Array.from({length:n},(_,i)=>`<button type="button" class="object-token ${session.marked.has(`${group}-${i}`)?'marked':''}" data-object="${group}-${i}" aria-label="Marcar ${session.question.singular} ${i+1}" aria-pressed="${session.marked.has(`${group}-${i}`)}">${session.question.parts[group].icon}</button>`).join('')}</div>`}
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
function scienceScene(m,scene){
 const symbols=m.visuals?.[scene];
 if(!Array.isArray(symbols))return escapeHtml(m.actions[scene][2]);
 return `<div class="classic-scene" aria-hidden="true">${symbols.map((symbol,i)=>`<span class="classic-scene-token ${i%2?'connector':''}">${escapeHtml(symbol)}</span>`).join('')}</div><span class="classic-scene-caption">${escapeHtml(m.actions[scene][2])}</span>`;
}
function investigationBoard(){
 const m=session.mission,actions=m.actions,scene=session.exploredScene,observed=session.explored.size;
 const predicted=session.prediction!==null,finished=predicted&&observed>=2;
 const stepClass=n=>(n===1?predicted:n===2?finished:session.resolved)?'done':'';
 const tests=actions.map((a,i)=>`<button type="button" class="discovery-action ${session.explored.has(i)?'seen':''}" data-explore="${i}" aria-pressed="${scene===i}" ${predicted?'':'disabled'}>${escapeHtml(a[0])} ${escapeHtml(a[1])}${session.explored.has(i)?' ✓':''}</button>`).join('');
 const compare=actions.filter((_,i)=>session.explored.has(i)).map(a=>`<div class="inquiry-evidence"><span aria-hidden="true">${escapeHtml(a[0])}</span><strong>${escapeHtml(a[1])}</strong><small>${escapeHtml(a[3])}</small></div>`).join('');
 return `<div class="question-lead"><span>🔬 INVESTIGAÇÃO CIENTÍFICA</span><button type="button" class="listen" data-speak="1">🔊 Ouvir</button></div>
 <h2>${escapeHtml(m.title)}</h2><p class="question-sub">Faça uma previsão, compare situações e descubra o resultado.</p>
 <div class="inquiry-steps" aria-label="Etapas da investigação"><span class="${stepClass(1)}">1. Imagine</span><span class="${stepClass(2)}">2. Teste</span><span class="${stepClass(3)}">3. Descubra</span></div>
 <section class="inquiry-stage"><h3>💭 O que você acha?</h3><p>${escapeHtml(m.predictionPrompt)}</p>
 <div class="inquiry-predictions" role="group" aria-label="Escolha sua previsão">${m.predictions.map((a,i)=>`<button type="button" class="inquiry-guess ${session.prediction===i?'chosen':''}" data-predict="${i}" aria-pressed="${session.prediction===i}" ${session.explored.size>0||session.resolved?'disabled':''}>${escapeHtml(a)}</button>`).join('')}</div><small>É uma hipótese: não há erro em imaginar!</small></section>
 <section class="inquiry-stage"><h3>🧪 Hora de testar</h3><p>${predicted?'Escolha duas situações diferentes e observe o que muda.':'Escolha uma hipótese acima para começar.'}</p>
 <div class="discovery-actions" role="group" aria-label="Testes da investigação">${tests}</div>
 <div class="discovery-display inquiry-scene" role="group" aria-label="Resultado ilustrado do teste">
 <div class="discovery-picture" aria-live="polite">${scene===null?escapeHtml(m.icon):scienceScene(m,scene)}</div>
 <p class="discovery-observation" role="status">${scene===null?'Faça um teste para ver o que acontece.':escapeHtml(actions[scene][3])}</p></div>
 <p class="inquiry-status">${observed} de 2 situações diferentes observadas${finished?' ✓':''}</p></section>
 ${finished?`<section class="inquiry-stage"><h3>🔎 Compare o que você viu</h3>
 ${m.comparePrompt?`<p class="inquiry-comparison-prompt">💡 ${escapeHtml(m.comparePrompt)}</p>`:""}<div class="inquiry-evidence-grid">${compare}</div>
 <div class="experiment-answer"><h3>${escapeHtml(m.ask)}</h3><div class="choice-grid" role="group" aria-label="Escolha a resposta depois dos testes">${m.choices.map(([id,label])=>`<button type="button" class="choice ${session.resolved&&id===m.right?'correct':''} ${session.wrongOptions.has(id)?'wrong':''}" data-science-answer="${escapeHtml(id)}" ${session.resolved||session.wrongOptions.has(id)?'disabled':''}>${escapeHtml(label)}</button>`).join('')}</div>${feedbackHtml()}</div></section>`:
 `<p class="activity-footnote">✨ ${!predicted?'Primeiro escolha uma previsão.':observed===0?'Agora faça dois testes diferentes.':'Muito bem! Experimente outra situação para comparar.'}</p>`}
 <p class="inquiry-safety">Estas cenas são modelos ilustrados. Algumas mudanças reais demoram ou variam com as condições.</p>`;
}
function discoveryBoard(){
 const m=session.mission,scene=session.exploredScene,actions=m.actions;
 return `<div class="question-lead"><span>🔬 LABORATÓRIO DE DESCOBERTAS</span><button type="button" class="listen" data-speak="1">🔊 Ouvir</button></div>
 <h2>${escapeHtml(m.title)}</h2><p class="question-sub">Teste pelo menos duas situações, compare o que acontece e depois responda.</p>
 <div class="discovery-display" role="group" aria-label="Modelo interativo ilustrativo"><div class="discovery-picture" aria-live="polite">${scene===null?escapeHtml(m.icon):escapeHtml(actions[scene][2])}</div><p class="discovery-observation" role="status">${scene===null?'Escolha uma experiência para começar.':escapeHtml(actions[scene][3])}</p></div>
 <div class="discovery-actions" aria-label="Escolher situação para observar">${actions.map((x,i)=>`<button class="discovery-action ${session.explored.has(i)?'seen':''}" type="button" data-explore="${i}" aria-pressed="${scene===i}">${escapeHtml(x[0])} ${escapeHtml(x[1])}${session.explored.has(i)?' ✓':''}</button>`).join('')}</div>
 ${session.explored.size<2?`<p class="activity-footnote"><strong>Etapa ${session.explored.size+1} de 2:</strong> toque em <strong>${escapeHtml(actions.find((_,i)=>!session.explored.has(i))?.[1]||"outra experiência")}</strong> para liberar a pergunta. Depois de responder, você poderá concluir e seguir para a próxima missão.</p>`:`<div class="experiment-answer"><h3>${escapeHtml(m.ask)}</h3><div class="choice-grid" role="group" aria-label="Escolha sua resposta">${m.choices.map(([id,label])=>`<button type="button" class="choice ${session.resolved&&id===m.right?'correct':''} ${session.wrongOptions.has(id)?'wrong':''}" data-science-answer="${id}" ${session.resolved||session.wrongOptions.has(id)?'disabled':''}>${escapeHtml(label)}</button>`).join('')}</div>${feedbackHtml()}</div>`}`;
}
function activityView(){
 if(!session)return'';
 const m=session.mission,steps=m.questions,progress=100*(session.step/steps);
 return `<div class="activity-shell"><button type="button" class="breadcrumbs" data-nav="${m.world}">← Voltar às aventuras</button>
 <div class="activity-meta"><span>${m.icon} ${escapeHtml(m.title)}</span><small>${m.world==='science'?'Hora de descobrir!':`Passo ${session.step+1} de ${steps}`}</small></div>
 <div class="activity-bar" role="progressbar" aria-label="Progresso da missão" aria-valuemin="0" aria-valuemax="${steps}" aria-valuenow="${session.step}"><span style="width:${progress}%"></span></div>
 <section class="activity-card">${m.type==='interactive'?interactive.render(m.rounds[session.step],session.game,session.resolved):m.world==='science'?(m.type==='gravity'?gravityBoard():m.type==='daynight'?dayNightBoard():m.type==='investigation'?investigationBoard():discoveryBoard()):m.type==='curriculum'?curriculumActivity():mathActivity()}${m.type==='interactive'?feedbackHtml():''}</section>
 <p class="activity-footnote">💜 Você pode tentar de novo. Aprender é uma aventura!</p></div>`;
}
function nextMissionFrom(m){const options=worldMissions(m.world);const index=options.findIndex(item=>item.id===m.id);return index>=0?options[index+1]||null:null}
function resultView(){const m=session.mission,stars=session.stars,upNext=nextMissionFrom(m);return `<div class="activity-shell"><button type="button" class="breadcrumbs" data-nav="${m.world}">← Outras missões</button><section class="result-card"><div class="result-emoji" aria-hidden="true">🧑‍🚀</div><div class="result-confetti" aria-hidden="true">✨ 🌟 ✨</div><h1 tabindex="-1">Missão concluída!</h1><p>Você descobriu algo novo em <strong>${escapeHtml(m.title)}</strong>!</p><div class="result-stars" aria-label="${stars} estrelas conquistadas">${'⭐'.repeat(stars)}</div><p><strong>${session.earnedStars?'+'+session.earnedStars+(session.earnedStars===1?' estrela nova':' estrelas novas'):'Seu recorde de estrelas foi mantido.'}</strong></p><div class="result-buttons">${upNext?`<button type="button" class="btn btn-primary" data-start="${upNext.id}">🚀 Próxima missão: ${escapeHtml(upNext.title)}</button>`:""}<button type="button" class="btn btn-ghost" data-start="${m.id}">🔄 Jogar novamente</button><button type="button" class="btn btn-ghost" data-nav="home">Voltar ao início</button></div></section></div>`;}
function badges(){const done=MISSIONS.filter(m=>missionDone(m)),completions=done.length;return [
 {icon:'🌟',title:'Primeira estrela',desc:'Concluir sua primeira missão',ok:completions>0},
 {icon:'🔢',title:'Amigo dos números',desc:'Concluir uma missão de matemática',ok:MISSIONS.filter(m=>m.world==='math').some(m=>missionDone(m))},
 {icon:'🧸',title:'Revisão poderosa',desc:'Concluir uma missão da pré-escola',ok:completed('review')>0},
 {icon:'🧪',title:'Cientista curioso',desc:'Concluir uma missão de Ciências',ok:completed('science')>0},
 {icon:'🚀',title:'Explorador dedicado',desc:'Concluir dez missões diferentes',ok:completions>=10},
 {icon:'💫',title:'Colecionador',desc:'Conquistar pelo menos 12 estrelas',ok:totalStars()>=12},
 ...WORLD_ORDER.slice(3).map(key=>({icon:WORLDS[key].icon,title:WORLDS[key].medal,desc:'Concluir uma missão em '+WORLDS[key].name,ok:completed(key)>0}))
]}
function awardsView(){
 const items=badges(),count=items.filter(b=>b.ok).length;
 return `<div class="page-intro"><div><span class="eyebrow">MINHAS CONQUISTAS</span>
 <h1>Meu álbum de estrelas 🏆</h1><p>Cada descoberta merece uma comemoração!</p></div>
 <span class="page-art" aria-hidden="true">🏅</span></div>
 <div class="awards-summary"><span aria-hidden="true">🌟</span><div><strong>${count} de ${items.length} medalhas</strong>
 <p>Continue explorando para encontrar novas conquistas.</p></div></div>
 <div class="awards-grid">${items.map(b=>`<div class="award-card ${b.ok?'unlocked':'locked'}">
 <div class="award-emoji" aria-hidden="true">${b.icon}</div><h3>${b.title}</h3><p>${b.desc}</p>
 <span class="tag">${b.ok?'CONQUISTADA ✓':'AINDA NÃO'}</span></div>`).join('')}</div>`;
}
function parentView(){
 const available=currentMissions(),complete=available.filter(m=>missionDone(m));
 const recordsBy=id=>data.records.filter(x=>x.id===id);
 const trouble=available.map(m=>({...m,errors:recordsBy(m.id).reduce((s,r)=>s+(r.errors||0),0)})).filter(m=>m.errors>=2).sort((a,b)=>b.errors-a.errors).slice(0,8);
 const unitReports=Object.entries(UNITS).map(([id,u])=>({label:`${u.emoji} ${u.label}`,entries:data.records.filter(r=>SKILLS.find(s=>s.id===r.id)?.unit===id)}));
 return `<div class="page-intro"><div><div class="eyebrow">ESPAÇO DO RESPONSÁVEL</div><h1>Acompanhamento da família 📊</h1><p>Indicadores de aprendizagem do perfil ativo. Não representam notas ou diagnósticos escolares.</p></div><span class="page-art">👨‍👩‍👧</span></div>
 <div class="stat-row"><div class="stat-box"><span>🏅</span><strong>${complete.length}/${available.length}</strong><small>Missões concluídas nas trilhas visíveis</small></div><div class="stat-box"><span>✏️</span><strong>${numSolved()}</strong><small>Desafios registrados</small></div><div class="stat-box"><span>🎯</span><strong>${numSolved()?firstTryPercent()+'%':'Ainda sem tentativas'}</strong><small>Acertos na primeira tentativa</small></div></div>
 <section class="parent-section"><h3>Progresso por trilha</h3>${Object.keys(WORLDS).map(key=>{const n=completed(key),max=worldMissions(key).length;return `<div class="parent-track"><strong>${WORLDS[key].name}</strong><div class="meter"><span style="width:${Math.round(100*n/Math.max(1,max))}%"></span></div><small>${n} de ${max}</small></div>`}).join('')}</section>
 <section class="parent-section"><h3>Resultados por assunto matemático</h3>${unitReports.map(u=>{const n=u.entries.length,p=n?Math.round(100*u.entries.filter(x=>x.firstTry).length/n):0;return `<div class="parent-track"><strong>${u.label}</strong><div class="meter"><span style="width:${p}%"></span></div><small>${n?n+' respostas · '+p+'% na primeira tentativa':'Ainda sem registros'}</small></div>`}).join('')}</section>
 <section class="parent-section"><h3>Onde praticar novamente?</h3>${trouble.length?`<ul class="error-list">${trouble.map(m=>`<li><strong>${m.icon} ${escapeHtml(m.title)}</strong> · ${m.errors} ${m.errors===1?'tentativa':'tentativas'} com dificuldade. Uma boa opção para revisar juntos.</li>`).join('')}</ul>`:'<p class="empty">Depois de algumas atividades, esta área poderá sugerir novas revisões.</p>'}</section>
 <section class="parent-section"><h3>Conta e segurança</h3><p class="muted">O responsável pode gerenciar apelidos, avatares e perfis infantis em uma área privada.</p><a class="btn btn-outline" href="./conta.html">👪 Gerenciar conta e perfis →</a></section><section class="parent-section"><h3>Configurações e privacidade</h3><p class="muted">O 1º ano é a etapa inicial; os anos seguintes estão disponíveis para uso futuro. Revisões da pré-escola não alteram o ano escolhido. O progresso fica no dispositivo e pode ser sincronizado com segurança quando um responsável ativa um perfil.</p><label class="grade-setting">Ano escolar principal <select id="settings-grade">${YEARS.filter(y=>y.id!=='P').map(y=>`<option value="${y.id}" ${y.id===data.grade?'selected':''}>${escapeHtml(y.name)}</option>`).join('')}</select></label>
 <div class="settings-box"><button type="button" class="btn btn-ghost" data-export="1">⬇ Exportar progresso (.json)</button><button type="button" class="btn btn-outline" data-reset="1">Apagar progresso desta versão</button></div><p class="privacy-note">Os protótipos anteriores não são apagados. Importação automática depende de os arquivos compartilharem o mesmo armazenamento do navegador. Faça cópia do progresso antes de limpar dados.</p></section><button type="button" class="btn btn-outline" data-nav="home">← Voltar ao início</button>`
}
function navTitle(){return WORLDS[view]?.name||({home:'Início',adventures:'Aventuras',math:'Matemática',review:'Revisão da pré-escola',science:'Ciências',awards:'Conquistas',activity:'Hora da missão',result:'Muito bem!',parents:'Para a família'})[view]}
function render(){if(view==='parents'&&!parentAllowed)view='home';const main=$('main');if(!main)return;main.innerHTML=WORLDS[view]?worldView(view):({home:homeView,adventures:adventuresView,math:()=>worldView('math'),review:()=>worldView('review'),science:()=>worldView('science'),awards:awardsView,activity:activityView,result:resultView,parents:parentView})[view]();$('section-name').textContent=navTitle();const gradePill=$('grade-pill');if(gradePill)gradePill.textContent=`🎒 ${data.grade}º ano`;$('star-indicator').textContent=`⭐ ${totalStars()}`;document.querySelectorAll('.side-nav .nav-button').forEach(b=>{const selected=(WORLDS[view]||['activity','result'].includes(view))?'adventures':view;b.classList.toggle('active',b.dataset.nav===selected);if(b.dataset.nav===selected)b.setAttribute('aria-current','page');else b.removeAttribute('aria-current')});}
function navigate(to){clearTimeout(gravityTimeout);session=null;unitFilter='all';view=to;render();window.scrollTo({top:0,behavior:'instant'})}
function start(id,resume=false){
 const m=getMission(id);
 if(!m)return;
 clearTimeout(gravityTimeout);
 view='activity';
 const marker=resume?readStored(storageScope+'::retomar'):null;
 const restored=m.type==='interactive'&&marker?.id===id&&Number.isInteger(marker.step)&&marker.step>=0&&marker.step<m.questions;
 const step=restored?marker.step:0;
 const firstTry=restored&&Number.isInteger(marker.firstTry)?Math.max(0,Math.min(step,marker.firstTry)):0;
 session={mission:m,step,question:null,firstTry,errors:0,wrongCount:0,wrongOptions:new Set(),feedback:null,resolved:false,marked:new Set(),height:2,released:false,dropping:false,drops:0,angle:0,rotated:false,explored:new Set(),exploredScene:null,prediction:null};
 if(m.type==='interactive')session.game=interactive.create(m.rounds[step]);
 else if(m.world!=='science')session.question=generateQuestion(m);
 markResume(id,step,firstTry);
 render();
 window.scrollTo({top:0,behavior:'instant'});
}
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
const SCIENCE_PRACTICE_HINTS={
 'c-gravidade':'Veja onde a bola termina depois que você toca em “Soltar a bola”.',
 'c-dia-noite':'Gire a Terra e veja o que muda quando o pontinho entra na parte iluminada.',
 'c-plantas':'Compare as folhas da planta nos dois testes.',
 'c-flutua':'Veja qual objeto fica perto da superfície da água.',
 'c-ima':'Veja qual objeto se move em direção ao ímã.',
 'c-sombras':'Compare a posição da lanterna com a da sombra.',
 'c-som':'Compare o tambor enquanto você toca e depois que para.',
 'c-agua':'Veja como muda o desenho do gelo quando ele recebe calor.',
 'c-sol':'Veja qual astro produz a luz que ilumina a Terra.',
 'c-borboleta':'Olhe a última figura, depois da crisálida.',
 'c-maos':'Compare as duas mãos. Em qual ficou menos sujeira?',
 'c-sentidos':'Pense em qual parte do corpo você usa para ouvir e qual usa para cheirar.',
 'c-luz-materiais':'Observe quanta luz passa por cada material.',
 'c-absorver':'Veja onde a água fica depois de encostar em cada material.',
 'c-momentos':'Compare a posição do Sol e a claridade nos diferentes momentos.',
 'c-animais-horarios':'Olhe em qual horário o animal aparece mais ativo.',
 'c-partes-planta':'Veja qual parte toca a terra no desenho.',
 'c-sombra-maior':'Compare o tamanho da sombra com a lanterna perto e longe do brinquedo.',
 'c-superficies':'Compare as marcas de temperatura nas duas superfícies.',
 'c-reutilizar':'Pense em um novo uso para o objeto que você já tem.',
};
function practiceHint(m,q){
 if(m.world==='science')return SCIENCE_PRACTICE_HINTS[m.id];
 if(m.type==='curriculum')return q.practiceHint;
 if(m.type==='compare')return 'Toque e conte os desenhos de cada grupo. Compare os dois totais.';
 if(m.type==='sum')return 'Conte um grupo e siga contando os desenhos do outro grupo.';
 return 'Toque em cada desenho uma vez enquanto conta.';
}
function answer(value){if(view!=='activity'||!session||session.resolved||session.mission.type==='interactive')return;const m=session.mission;if((m.type==='discovery'||m.type==='investigation')&&session.explored.size<2)return;if(m.type==='investigation'&&session.prediction===null)return;const right=m.world==='science'?(m.type==='gravity'?'cai':m.type==='daynight'?'dia':m.right):session.question.answer;if(value===right){session.resolved=true;if(session.wrongCount===0)session.firstTry++;session.feedback={kind:'right',text:m.world==='science'?(m.type==='gravity'?'Muito bem! A gravidade da Terra puxa a bola para baixo.':m.type==='daynight'?'O lado da Terra voltado para o Sol recebe luz e tem dia.':m.explain) : m.type==='curriculum'?session.question.explain:session.question.hint};logRecord();}else{if(session.wrongOptions.has(value))return;session.wrongCount++;session.errors++;session.wrongOptions.add(value);session.feedback={kind:'wrong',text:practiceHint(m,session.question)};}render()}
function gameAttempt(outcome,round){
 if(outcome==='success'){
  session.resolved=true;
  if(session.wrongCount===0)session.firstTry++;
  session.feedback={kind:'right',text:round.explain};
  logRecord();
 }else if(outcome==='wrong'){
  session.wrongCount=Math.min(200,session.wrongCount+1);
  session.feedback={kind:'wrong',text:round.hint};
 }
}
async function runProgram(round,current){
 const state=current.game;
 const result=interactive.programSteps(round,state.commands);
 const reduced=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
 const commands=state.commands;
 Object.assign(state,interactive.create(round),{commands,running:true});
 render();
 document.querySelector('.exp-board')?.scrollIntoView({block:'center',behavior:'instant'});
 for(const frame of result.frames){
  if(!reduced)await new Promise(resolve=>setTimeout(resolve,255));
  if(session!==current||view!=='activity')return;
  Object.assign(state,{pos:frame.pos,collected:frame.collected,frame:frame.index});
  if(!reduced)render();
 }
 state.running=false;state.frame=null;
 if(result.success)gameAttempt('success',round);
 else{
  state.message=result.blocked===null?'O caminho parou antes de cumprir a missão.':`Confira o bloco ${result.blocked+1}. O caminho está bloqueado ali.`;
  gameAttempt('wrong',round);
 }
 render();
 document.querySelector(result.success?'[data-next]':'[data-game="run"]')?.focus({preventScroll:true});
}
function playSpeech(text,lang){
 const target=$('exp-message');
 const fallback=()=>{if(target)target.textContent=lang==='en-US'?'Áudio indisponível aqui. Use a palavra escrita em inglês.':'Áudio indisponível aqui. Leia a instrução na tela.'};
 const synth=window.speechSynthesis;
 if(!synth||typeof window.SpeechSynthesisUtterance!=='function'){fallback();return}
 const voice=synth.getVoices().find(item=>item.localService&&item.lang.toLowerCase()===lang.toLowerCase());
 if(lang==='en-US'&&!voice){fallback();return}
 const utterance=new window.SpeechSynthesisUtterance(text);
 utterance.lang=lang;utterance.rate=.83;
 if(voice)utterance.voice=voice;
 utterance.onerror=event=>{if(!['interrupted','canceled'].includes(event.error))fallback()};
 synth.cancel();synth.speak(utterance);
}
function playGame(button){
 if(view!=='activity'||session?.mission.type!=='interactive')return;
 const {game:name,value}=button.dataset;
 const round=session.mission.rounds[session.step];
 if(name==='speak'||name==='english'){
  const text=name==='english'?round.english:[round.passage,round.speech||round.prompt].filter(Boolean).join(' ');
  if(text)playSpeech(text,name==='english'?'en-US':'pt-BR');
  return;
 }
 if(session.resolved||session.game.running)return;
 if(name==='hint'){
  session.game.message=round.hint;
  const status=$('exp-message');
  if(status)status.textContent=round.hint;
  return;
 }
 const outcome=interactive.action(round,session.game,name,value);
 if(outcome==='run'){void runProgram(round,session);return}
 if(outcome)gameAttempt(outcome,round);
 else if(session.feedback?.kind==='wrong')session.feedback=null;
 render();
 const controls=[...document.querySelectorAll('[data-game]')];
 const match=controls.find(control=>control.dataset.game===name&&control.dataset.value===value&&!control.disabled);
 const nextControl=document.querySelector(outcome==='success'?'[data-next]':name==='card'&&session.game.mismatch?'[data-game="hide"]':name==='source'?'[data-game="pair"]:not(:disabled)':'[data-game]:not(:disabled)');
 (outcome==='success'?nextControl:match||nextControl)?.focus({preventScroll:true});
}
function next(){
 if(!session||!session.resolved)return;
 session.step++;
 const m=session.mission;
 if(session.step>=m.questions){
  session.stars=Math.max(m.type==='interactive'?2:1,Math.min(3,Math.ceil(session.firstTry/m.questions*3)));
  const previousStars=data.missions[m.id]?.stars||0;
  session.earnedStars=Math.max(0,session.stars-previousStars);
  data.missions[m.id]={stars:Math.max(previousStars,session.stars),lastStars:session.stars,completedAt:new Date().toISOString()};
  save();window.dispatchEvent(new Event('missao-aprender:mission-complete'));
  view='result';render();document.querySelector('.result-card h1')?.focus({preventScroll:true});
  window.scrollTo({top:0,behavior:'instant'});
 }else{
  if(m.type==='interactive')session.game=interactive.create(m.rounds[session.step]);
  else session.question=generateQuestion(m);
  markResume(m.id,session.step,session.firstTry);
  session.wrongCount=0;session.wrongOptions.clear();session.feedback=null;session.resolved=false;session.marked.clear();render();
  if(m.type==='interactive'){
   document.querySelector('.exp-game h2')?.focus({preventScroll:true});
   window.scrollTo({top:0,behavior:'instant'});
  }
 }
}
function openGate(){previousView=view;gateAnswer=random(5,9)+random(2,5);const a=random(5,9),b=random(2,5);gateAnswer=a+b;$('gate-root').innerHTML=`<div class="gate-backdrop" role="presentation"><form class="gate-modal" id="gate-form" aria-label="Acessar espaço dos responsáveis"><h2>👨‍👩‍👧 Espaço da família</h2><p>Uma continha rápida para evitar que esta área seja aberta sem querer.</p><label for="parent-gate-input"><strong>Quanto é ${a} + ${b}?</strong></label><input type="number" id="parent-gate-input" autocomplete="off" required inputmode="numeric"><div id="gate-error" class="gate-error" role="status"></div><div class="gate-actions"><button type="button" class="btn btn-outline" data-gate-close="1">Cancelar</button><button class="btn btn-primary" type="submit">Entrar</button></div></form></div>`;$('parent-gate-input').focus()}
function closeGate(){$('gate-root').innerHTML=''}
function enterParents(){if(parentAllowed){navigate('parents');return}openGate()}
function speak(){if(!('speechSynthesis'in window)){alert('Seu navegador não oferece leitura em voz alta.');return}const m=session?.mission;let text=m?.world==='science'?(m.type==='gravity'?'O que acontece quando soltamos a bola? Escolha uma altura e solte a bola.':m.type==='daynight'?'Por que temos dia e noite? Gire a Terra e observe o pontinho amarelo.':(m.type==='investigation'&&session?.explored.size<2?m.title+'. '+m.predictionPrompt:m.title+'. '+m.ask)):session?.question?.prompt||session?.question?.text;if(!text)return;if(session.feedback?.kind==='wrong')text+=' Dica: '+session.feedback.text;window.speechSynthesis.cancel();const voice=new SpeechSynthesisUtterance(text);voice.lang='pt-BR';voice.rate=.85;window.speechSynthesis.speak(voice)}
function updateEarth(){if(!session)return;const dot=$('location-dot');if(dot)dot.setAttribute('style',earthDotStyle());const label=$('angle-label');if(label)label.textContent=session.angle+'°';const period=$('earth-period');if(period)period.textContent='NO PONTINHO: '+earthPeriod();}
function dropBall(){if(!session||session.mission.type!=='gravity'||session.dropping)return;session.released=false;session.dropping=true;const ball=document.querySelector('.gravity-ball');if(ball){ball.classList.remove('ground');void ball.offsetWidth;ball.classList.add('ground')}const btn=document.querySelector('[data-drop]');if(btn)btn.disabled=true;gravityTimeout=setTimeout(()=>{if(!session||view!=='activity'||session.mission.type!=='gravity')return;session.released=true;session.dropping=false;session.drops++;render()},800)}
function halfTurn(){if(!session||session.mission.type!=='daynight')return;session.angle=(session.angle+180)%360;session.rotated=true;render()}
function downloadProgress(){const file=new Blob([JSON.stringify({exportedAt:new Date().toISOString(),app:'Missão Aprender unificado',data},null,2)],{type:'application/json'});const url=URL.createObjectURL(file);const anchor=document.createElement('a');anchor.href=url;anchor.download='missao-aprender-progresso.json';document.body.append(anchor);anchor.click();anchor.remove();setTimeout(()=>URL.revokeObjectURL(url),1000)}
document.addEventListener('click',e=>{const btn=e.target.closest('button');if(!btn)return;
 if(btn.id==='parents-top'||btn.id==='parents-sidebar'){enterParents();return}
 if(btn.dataset.gateClose){closeGate();return}
 if(btn.dataset.nav){navigate(btn.dataset.nav);return}
 if(btn.dataset.unit){unitFilter=btn.dataset.unit;render();return}
 if(btn.dataset.start){start(btn.dataset.start,btn.dataset.resume==='1');return}
 if(btn.dataset.game){playGame(btn);return}
 if(btn.dataset.answer!==undefined){answer(btn.dataset.answer);return}
 if(btn.dataset.scienceAnswer!==undefined){answer(btn.dataset.scienceAnswer);return}
 if(btn.dataset.predict!==undefined&&view==='activity'&&session?.mission.type==='investigation'){const index=Number(btn.dataset.predict);if(session.explored.size===0&&Number.isInteger(index)&&index>=0&&index<session.mission.predictions.length){session.prediction=index;render()}return}
 if(btn.dataset.explore!==undefined&&view==='activity'&&['discovery','investigation'].includes(session?.mission.type)){const index=Number(btn.dataset.explore);if(session.mission.type==='investigation'&&session.prediction===null)return;if(Number.isInteger(index)&&index>=0&&index<session.mission.actions.length){session.explored.add(index);session.exploredScene=index;render()}return}
 if(btn.dataset.object!==undefined){let s=btn.dataset.object;session?.marked.has(s)?session.marked.delete(s):session?.marked.add(s);btn.classList.toggle('marked',!!session?.marked.has(s));btn.setAttribute('aria-pressed',session?.marked.has(s)?'true':'false');return}
 if(btn.dataset.next){next();return}
 if(btn.dataset.speak){speak();return}
 if(btn.dataset.drop){dropBall();return}
 if(btn.dataset.halfturn){halfTurn();return}
 if(btn.dataset.export){downloadProgress();return}
 if(btn.dataset.reset){if(storageScope!==STORAGE_KEY){alert('Para proteger resultados sincronizados, o apagamento na nuvem ainda não está disponível. Troque para o modo local.');return}if(confirm('Apagar o progresso local deste navegador?')){data=fresh();try{localStorage.removeItem(storageScope+'::retomar')}catch{}save();render()}return}
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
window.MissaoAprenderSyncBridge={legacyData:()=>load(),getData:()=>data,selectScope:(key,state)=>{storageScope=key||STORAGE_KEY;data=state||load();save();navigate('home')},updateScope:(key,state)=>{
 if(key!==storageScope)return;
 data=state;save();
 if(view==='activity'||view==='result')$('star-indicator').textContent=`⭐ ${totalStars()}`;
 else render();
},getScope:()=>storageScope};
window.dispatchEvent(new Event('missao-aprender:ready'));
window.MissaoAprenderTest={MISSIONS,WORLDS,SKILLS,makeQuestion,fresh,getData:()=>data,getView:()=>view,generateQuestion,worldMissions,getCurrentAnswer:()=>session?.question?.answer||session?.mission?.right||null,getOcultas:()=>[...missoesOcultas]};
render();
// A ocultação e uma preferencia editorial de navegação, NÃO uma barreira de seguranca.
async function atualizarVisibilidade(){
 try{
  const response=await fetch('/api/catalogo-publico',{cache:'no-store'});
  if(!response.ok)return;
  const payload=await response.json();
  if(!Array.isArray(payload?.ocultas))return;
  const ids=new Set(MISSIONS.map(m=>m.id));
  missoesOcultas=new Set(payload.ocultas.filter(id=>typeof id==='string'&&ids.has(id)));
  if(view!=='activity'&&view!=='result')render();
 }catch{ /* Sem conexão, o catálogo local continua jogável. */ }
}
atualizarVisibilidade();
// Modo de manutenção sinalizado pelo servidor. A segurança das APIs é imposta no backend.
// Jogos e progresso já armazenados localmente não podem ser revogados à distância.
async function consultarModoOperacional(){
 try{
  const response=await fetch('/api/configuracao-publica',{cache:'no-store'});
  if(!response.ok)return;
  const status=await response.json();
  if(!['normal','somente_leitura','manutencao'].includes(status?.modo))return;
  let note=document.getElementById('ma-aviso-operacional');
  if(!note){
   note=document.createElement('aside');note.id='ma-aviso-operacional';
   note.setAttribute('role','status');note.className='ma-aviso-operacional';
   document.body.append(note);
  }
  note.replaceChildren();
  if(status.modo==='normal'&&!status.aviso){note.hidden=true;}
  else{
   note.hidden=false;
   const strong=document.createElement('strong');
   strong.textContent=status.modo==='manutencao'?'🛠️ Missão Aprender em manutenção':
    status.modo==='somente_leitura'?'ℹ️ Modo somente leitura':'📢 Aviso';
   const text=document.createElement('p');
   text.textContent=status.aviso||(status.modo==='manutencao'?
    'As áreas privadas estão temporariamente indisponíveis. Volte mais tarde.':
    'Os cadastros e envios à nuvem estão pausados por enquanto.');
   note.append(strong,text);
  }
  let gate=document.getElementById('ma-bloqueio-manutencao');
  if(status.modo==='manutencao'){
   if(!gate){gate=document.createElement('div');gate.id='ma-bloqueio-manutencao';
    gate.className='ma-bloqueio-manutencao';gate.setAttribute('role','alertdialog');
    gate.setAttribute('aria-modal','true');gate.setAttribute('aria-label','Manutenção');
    document.body.append(gate);}
   gate.replaceChildren();
   const title=document.createElement('h2');title.textContent='🛠️ Estamos cuidando da nave!';
   const p=document.createElement('p');p.textContent=status.aviso||'O Missão Aprender está em manutenção. Suas conquistas locais continuam guardadas.';
   const link=document.createElement('a');link.href='./conta.html';link.textContent='Área dos responsáveis';
   gate.append(title,p,link);
  }else if(gate){gate.remove();}
 }catch{/* Offline: preservar o funcionamento local, sem prometer bloqueio remoto. */}
}
consultarModoOperacional();
window.addEventListener?.('focus',consultarModoOperacional);
})();
