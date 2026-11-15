# Expansão do Missão Aprender

## Auditoria e implementação

- Base: `cde0870`, aplicativo Vite com HTML/CSS e módulos JavaScript. `app.js` controla navegação, tentativas, estrelas e conclusão. O motor das novas atividades usa os mesmos fluxos de conclusão e registro.
- Os 96 IDs de origem ficam preservados. Os 44 novos IDs entram em `api/catalogo.js`. As novas atividades usam resultados e registros existentes, sem incrementar o conjunto de 72 habilidades curriculares de Matemática.
- O progresso versão 2 mantém as chaves locais, a normalização, a mesclagem de estrelas pelo maior valor, o limite de 3.000 registros e 480 KB, a autenticação e a revisão otimista da API. O Neon já aceita o snapshot JSON existente, sem migração.
- A retomada de uma atividade iniciada usa um marcador local separado por perfil. Se a mesma missão for concluída em outro aparelho depois da marcação, a retomada sugere a missão seguinte. O marcador retoma o último passo alcançado nas 44 novas missões. Atividades anteriores preservam seu fluxo original e reabrem no início da missão.
- A prévia usa as variáveis de ambiente configuradas na Vercel. A suíte de homologação simula autenticação e armazenamento remoto para testar os fluxos com perfis fictícios.

## Referências pedagógicas

- [BNCC homologada do MEC](https://basenacionalcomum.mec.gov.br/images/BNCC_EI_EF_110518_versaofinal_site.pdf): EF01LP04 (letras e outros sinais), EF01LP06 (segmentação oral), EF01LP07/08 (sons e escrita), EF01LP09/13 (comparação de sílabas e sons), EF01LP10 (nomeação de letras), EF01LP12 (espaçamento de palavras), EF01MA19 (moedas e cédulas em situações cotidianas).
- [Computação na Educação Básica, complemento à BNCC](https://basenacionalcomum.mec.gov.br/images/historico/anexo_parecer_cneceb_n_2_2022_bncc_computacao.pdf): EF01CO01 (organizar objetos por características) e EF01CO02/03 (seguir, reorganizar e criar sequências).
- [Nova Escola](https://novaescola.org.br/conteudo/21613/alfabetizacao-estrategias-para-avancar-na-aquisicao-da-escrita) e [Khan Academy Kids](https://khankids.zendesk.com/hc/en-us/articles/360041004572-Printable-activities-for-parents-and-teachers): associar imagem, escrita e oralidade, com atenção às sílabas iniciais e finais.
- [ScratchJr](https://www.scratchjr.org/teach) e [Code.org](https://studio.code.org/courses/coursea-draft/units/1): montar comandos visuais, testar a sequência no tabuleiro e ajustar a solução.
- [British Council LearnEnglish Kids](https://learnenglishkids.britishcouncil.org/grammar-vocabulary/word-games): praticar vocabulário por tema com associação visual e escuta. O aplicativo usa voz local en-US, com a palavra escrita sempre presente.
- [Aprender Valor, Banco Central](https://www.bcb.gov.br/meubc/faqs/s/aprender-valor): planejar o uso de recursos, fazer escolhas e guardar dinheiro para uma meta fictícia.

As relações curriculares são referências de planejamento e não constituem certificação de alinhamento. Inglês é enriquecimento para essa faixa etária, sem atribuição de código de 1º ano. As situações, ilustrações de interface e desafios são autorais.

## As 44 missões

### Mundo das Palavras

| Missão | Objetivo |
| --- | --- |
| Caça às letras | Distinguir letras de números e sinais. |
| A cesta das vogais | Reconhecer vogais entre outras letras. |
| Começa com o mesmo som | Comparar sons no início de palavras. |
| Palavra e figura | Ligar palavras escritas às figuras correspondentes. |
| Junte os sons | Combinar consoante e vogal para formar sílabas. |
| Monte a palavra | Ordenar sílabas para escrever palavras. |
| Rimas no jardim | Comparar os sons finais das palavras. |
| A letra que falta | Relacionar um som à letra que completa a palavra. |
| Palmas para as sílabas | Separar uma palavra em seus pedaços sonoros. |
| Uma frase em ordem | Organizar palavras com espaços para escrever uma frase. |
| Leia e encontre | Ler frases curtas e localizar informação explícita. |
| O passeio de Nina | Acompanhar dois trechos de uma história e entender o que aconteceu. |

### Desafios de Lógica

| Missão | Objetivo |
| --- | --- |
| O fio das figuras | Continuar uma sequência que alterna duas figuras. |
| O espaço vazio | Completar um padrão que agrupa figuras iguais. |
| Um intruso no grupo | Encontrar um elemento por sua diferença observável. |
| O caminho do coelho | Navegar por um labirinto e contornar obstáculos. |
| Pares escondidos | Lembrar onde estão três pares de figuras. |
| Mosaico da casinha | Compor uma figura identificando a posição das formas. |
| Cada figura no seu lugar | Agrupar figuras por categoria. |
| O segredo da caixa | Combinar duas pistas para encontrar a única solução. |

### Pequenos Programadores

| Missão | Objetivo |
| --- | --- |
| O robô segue setas | Criar uma sequência curta de comandos. |
| Rota até a estrela | Planejar uma rota que contorna uma parede. |
| Comandos em ordem | Montar instruções na ordem que o caminho exige. |
| Conserte o comando | Depurar uma sequência com uma seta incorreta. |
| Movimento repetido | Usar um bloco para executar o mesmo passo duas vezes. |
| Poucos blocos, bom caminho | Resolver um labirinto com limite de blocos. |
| Rota do foguete | Programar uma rota para recolher uma estrela e pousar. |
| O grande resgate | Combinar repetição, sequência e correção de programa. |

### Inglês Divertido

| Missão | Objetivo |
| --- | --- |
| Colors | Associar cores às palavras em inglês. |
| Numbers | Praticar os números de one a ten. |
| Animals | Reconhecer nomes de animais em inglês. |
| Fruit | Associar frutas ilustradas às palavras em inglês. |
| At school | Reconhecer nomes de materiais escolares. |
| My body | Associar partes do corpo às palavras em inglês. |
| Hello! | Associar saudações a situações do dia. |
| Listen and find | Revisar vocabulário com palavras faladas e escritas. |

### Pequenos Empreendedores

| Missão | Objetivo |
| --- | --- |
| Moedas brasileiras | Reconhecer valores em centavos e em reais. |
| Notas do Brasil | Distinguir notas brasileiras pelos valores. |
| Juntando valores | Compor um valor com moedas fictícias. |
| Minha primeira compra | Montar uma compra fictícia e acompanhar o total. |
| Devolva o troco | Selecionar a quantia que sobra após uma compra. |
| Dentro do orçamento | Escolher dois produtos sem exceder o dinheiro disponível. |
| Preciso ou quero? | Distinguir necessidade e desejo em um contexto concreto. |
| O cofrinho da meta | Planejar quanto guardar para uma compra futura. |

