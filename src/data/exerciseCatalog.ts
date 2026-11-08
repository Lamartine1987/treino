export interface CatalogExercise {
  nome: string;
  categoria: string;
  equipamento: string;
  substituto: string;
  instrucoes: string;
  seriesPadrao: number;
  repeticoesPadrao: string;
  descansoPadrao: number;
  cargaPadraoKg: number;
}

export const EXERCISE_CATEGORIES = [
  'Peitoral',
  'Costas / Dorsal',
  'Ombros / Deltóides',
  'Bíceps / Antebraço',
  'Tríceps',
  'Quadríceps',
  'Posterior de Coxa',
  'Glúteos',
  'Panturrilha',
  'Abdômen / Core'
] as const;

export type ExerciseCategory = (typeof EXERCISE_CATEGORIES)[number];

export const EXERCISE_CATALOG: CatalogExercise[] = [
  // ================= PEITORAL =================
  {
    nome: 'Supino Reto com Barra',
    categoria: 'Peitoral',
    equipamento: 'Barra Olímpica e Banco Reto',
    substituto: 'Supino Reto com Halteres',
    instrucoes: 'Mantenha as escápulas retraídas no banco, pés firmes no solo e desça a barra de forma controlada até a linha média do peitoral.',
    seriesPadrao: 4,
    repeticoesPadrao: '8-10',
    descansoPadrao: 90,
    cargaPadraoKg: 40
  },
  {
    nome: 'Supino Reto com Halteres',
    categoria: 'Peitoral',
    equipamento: 'Halteres e Banco Reto',
    substituto: 'Supino na Máquina Articulada',
    instrucoes: 'Desça os halteres alongando bem as fibras peitorais com cotovelos levemente angulados (cerca de 75°) para proteger os ombros.',
    seriesPadrao: 4,
    repeticoesPadrao: '8-12',
    descansoPadrao: 75,
    cargaPadraoKg: 18
  },
  {
    nome: 'Supino Inclinado com Halteres',
    categoria: 'Peitoral',
    equipamento: 'Halteres e Banco Inclinado (30°-45°)',
    substituto: 'Supino Inclinado com Barra',
    instrucoes: 'Ajuste o banco entre 30° e 45° para focar na porção clavicular (superior) do peitoral.',
    seriesPadrao: 4,
    repeticoesPadrao: '8-12',
    descansoPadrao: 75,
    cargaPadraoKg: 16
  },
  {
    nome: 'Supino Inclinado com Barra',
    categoria: 'Peitoral',
    equipamento: 'Barra e Banco Inclinado',
    substituto: 'Supino Inclinado na Máquina',
    instrucoes: 'Desça a barra até a parte alta do peito (próximo à clavícula) mantendo o controle excêntrico.',
    seriesPadrao: 4,
    repeticoesPadrao: '8-10',
    descansoPadrao: 90,
    cargaPadraoKg: 35
  },
  {
    nome: 'Supino Declinado com Barra',
    categoria: 'Peitoral',
    equipamento: 'Barra e Banco Declinado',
    substituto: 'Paralelas (Foco Peitoral)',
    instrucoes: 'Foco na porção inferior do peitoral. Controle a descida sem quicar a barra no tórax.',
    seriesPadrao: 3,
    repeticoesPadrao: '8-12',
    descansoPadrao: 75,
    cargaPadraoKg: 35
  },
  {
    nome: 'Supino na Máquina Articulada',
    categoria: 'Peitoral',
    equipamento: 'Máquina Articulada',
    substituto: 'Supino Reto com Halteres',
    instrucoes: 'Ajuste a altura do banco para que a pegada fique na linha média do peito. Estenda sem destravar as escápulas.',
    seriesPadrao: 3,
    repeticoesPadrao: '10-12',
    descansoPadrao: 60,
    cargaPadraoKg: 40
  },
  {
    nome: 'Crucifixo Reto com Halteres',
    categoria: 'Peitoral',
    equipamento: 'Halteres e Banco Reto',
    substituto: 'Peck Deck (Voador)',
    instrucoes: 'Abra os braços com os cotovelos levemente semiflexionados, focando no alongamento do peitoral.',
    seriesPadrao: 3,
    repeticoesPadrao: '10-12',
    descansoPadrao: 60,
    cargaPadraoKg: 12
  },
  {
    nome: 'Crucifixo Inclinado com Halteres',
    categoria: 'Peitoral',
    equipamento: 'Halteres e Banco Inclinado',
    substituto: 'Crucifixo Inclinado na Polia',
    instrucoes: 'Alongue a porção superior do peitoral na descida e una os halteres no topo contraindo o peito.',
    seriesPadrao: 3,
    repeticoesPadrao: '10-12',
    descansoPadrao: 60,
    cargaPadraoKg: 10
  },
  {
    nome: 'Crucifixo Inclinado na Polia',
    categoria: 'Peitoral',
    equipamento: 'Polia Baixa e Banco Inclinado',
    substituto: 'Crucifixo Inclinado com Halteres',
    instrucoes: 'Tensão contínua dos cabos durante todo o arco do movimento. Contraia 1 segundo no topo.',
    seriesPadrao: 3,
    repeticoesPadrao: '10-12',
    descansoPadrao: 60,
    cargaPadraoKg: 15
  },
  {
    nome: 'Crossover na Polia Alta',
    categoria: 'Peitoral',
    equipamento: 'Polia Alta (Cabos)',
    substituto: 'Peck Deck (Voador)',
    instrucoes: 'Incline levemente o tronco à frente e feche as mãos à frente do quadril esmagando o peitoral.',
    seriesPadrao: 3,
    repeticoesPadrao: '12-15',
    descansoPadrao: 60,
    cargaPadraoKg: 20
  },
  {
    nome: 'Peck Deck (Voador)',
    categoria: 'Peitoral',
    equipamento: 'Máquina Peck Deck',
    substituto: 'Crossover na Polia Alta',
    instrucoes: 'Mantenha a coluna apoiada e aproxime os braços contraindo o centro do peitoral por 1 segundo.',
    seriesPadrao: 3,
    repeticoesPadrao: '12-15',
    descansoPadrao: 60,
    cargaPadraoKg: 35
  },
  {
    nome: 'Flexão de Braços no Solo',
    categoria: 'Peitoral',
    equipamento: 'Peso Corporal',
    substituto: 'Supino Máquina',
    instrucoes: 'Mantenha o abdômen contraído e o corpo alinhado em prancha durante toda a descida e subida.',
    seriesPadrao: 3,
    repeticoesPadrao: '12-15',
    descansoPadrao: 60,
    cargaPadraoKg: 0
  },

  // ================= COSTAS / DORSAL =================
  {
    nome: 'Puxada Frontal Aberta no Pulley',
    categoria: 'Costas / Dorsal',
    equipamento: 'Polia Alta (Barra Longa)',
    substituto: 'Barra Fixa ou Graviton',
    instrucoes: 'Deprima as escápulas antes de puxar e traga a barra até a parte superior do peitoral sem jogar o tronco para trás.',
    seriesPadrao: 4,
    repeticoesPadrao: '8-12',
    descansoPadrao: 75,
    cargaPadraoKg: 45
  },
  {
    nome: 'Puxada Alta com Triângulo (Pegada Neutra)',
    categoria: 'Costas / Dorsal',
    equipamento: 'Polia Alta (Triângulo)',
    substituto: 'Puxada Supinada no Pulley',
    instrucoes: 'Alongue bem as dorsais no topo e puxe o triângulo até o esterno mantendo os cotovelos próximos ao corpo.',
    seriesPadrao: 4,
    repeticoesPadrao: '8-12',
    descansoPadrao: 75,
    cargaPadraoKg: 45
  },
  {
    nome: 'Puxada Supinada no Pulley',
    categoria: 'Costas / Dorsal',
    equipamento: 'Polia Alta',
    substituto: 'Puxada com Triângulo',
    instrucoes: 'Pegada com as palmas voltadas para você na largura dos ombros, focando na extensão do ombro e grande dorsal.',
    seriesPadrao: 3,
    repeticoesPadrao: '10-12',
    descansoPadrao: 60,
    cargaPadraoKg: 40
  },
  {
    nome: 'Barra Fixa (ou Graviton)',
    categoria: 'Costas / Dorsal',
    equipamento: 'Barra Fixa / Máquina Graviton',
    substituto: 'Puxada Frontal Aberta no Pulley',
    instrucoes: 'Suba até o queixo ultrapassar a linha da barra e desça controlando toda a fase excêntrica.',
    seriesPadrao: 4,
    repeticoesPadrao: '6-10',
    descansoPadrao: 90,
    cargaPadraoKg: 0
  },
  {
    nome: 'Remada Curvada com Barra',
    categoria: 'Costas / Dorsal',
    equipamento: 'Barra Livre',
    substituto: 'Remada Cavalinho ou Máquina',
    instrucoes: 'Mantenha a coluna neutra inclinada a cerca de 45°, joelhos semiflexionados e puxe a barra em direção ao umbigo.',
    seriesPadrao: 4,
    repeticoesPadrao: '8-10',
    descansoPadrao: 90,
    cargaPadraoKg: 40
  },
  {
    nome: 'Remada Baixa Sentada no Triângulo',
    categoria: 'Costas / Dorsal',
    equipamento: 'Polia Baixa',
    substituto: 'Remada na Máquina Articulada',
    instrucoes: 'Mantenha o tronco firme e ereto; puxe o triângulo até o abdômen esmagando as escápulas no final.',
    seriesPadrao: 4,
    repeticoesPadrao: '10-12',
    descansoPadrao: 75,
    cargaPadraoKg: 45
  },
  {
    nome: 'Remada Unilateral com Halter (Serrote)',
    categoria: 'Costas / Dorsal',
    equipamento: 'Halter e Banco',
    substituto: 'Remada Baixa Unilateral na Polia',
    instrucoes: 'Apoie mão e joelho no banco, mantenha as costas retas e puxe o halter em direção ao quadril.',
    seriesPadrao: 3,
    repeticoesPadrao: '10-12',
    descansoPadrao: 60,
    cargaPadraoKg: 22
  },
  {
    nome: 'Remada Cavalinho (Barra T ou Máquina)',
    categoria: 'Costas / Dorsal',
    equipamento: 'Máquina / Barra T',
    substituto: 'Remada Curvada com Barra',
    instrucoes: 'Excelente para espessura de dorsal e trapézio médio. Contraia fortemente as escápulas no topo.',
    seriesPadrao: 4,
    repeticoesPadrao: '8-12',
    descansoPadrao: 75,
    cargaPadraoKg: 40
  },
  {
    nome: 'Pulldown na Polia com Corda ou Barra',
    categoria: 'Costas / Dorsal',
    equipamento: 'Polia Alta',
    substituto: 'Pullover com Halter',
    instrucoes: 'Mantenha os cotovelos quase estendidos e leve a barra/corda da linha dos olhos até as coxas contraindo a dorsal.',
    seriesPadrao: 3,
    repeticoesPadrao: '12-15',
    descansoPadrao: 60,
    cargaPadraoKg: 25
  },
  {
    nome: 'Encolhimento de Ombros com Halteres',
    categoria: 'Costas / Dorsal',
    equipamento: 'Halteres',
    substituto: 'Encolhimento com Barra',
    instrucoes: 'Eleve os ombros em direção às orelhas contraindo o trapézio superior por 1 segundo no topo.',
    seriesPadrao: 3,
    repeticoesPadrao: '12-15',
    descansoPadrao: 60,
    cargaPadraoKg: 24
  },

  // ================= OMBROS / DELTÓIDES =================
  {
    nome: 'Desenvolvimento com Halteres Sentado',
    categoria: 'Ombros / Deltóides',
    equipamento: 'Halteres e Banco 80°',
    substituto: 'Desenvolvimento na Máquina',
    instrucoes: 'Empurre os halteres acima da cabeça mantendo os cotovelos levemente à frente da linha dos ombros (plano escapular).',
    seriesPadrao: 4,
    repeticoesPadrao: '8-12',
    descansoPadrao: 75,
    cargaPadraoKg: 16
  },
  {
    nome: 'Desenvolvimento Militar com Barra',
    categoria: 'Ombros / Deltóides',
    equipamento: 'Barra Olímpica',
    substituto: 'Desenvolvimento com Halteres',
    instrucoes: 'Mantenha o abdômen e glúteos contraídos para estabilizar a lombar e empurre a barra verticalmente.',
    seriesPadrao: 4,
    repeticoesPadrao: '6-10',
    descansoPadrao: 90,
    cargaPadraoKg: 30
  },
  {
    nome: 'Desenvolvimento Arnold com Halteres',
    categoria: 'Ombros / Deltóides',
    equipamento: 'Halteres',
    substituto: 'Desenvolvimento com Halteres Sentado',
    instrucoes: 'Inicie com as palmas voltadas para você e faça a rotação externa conforme empurra os halteres para cima.',
    seriesPadrao: 3,
    repeticoesPadrao: '10-12',
    descansoPadrao: 75,
    cargaPadraoKg: 14
  },
  {
    nome: 'Elevação Lateral com Halteres',
    categoria: 'Ombros / Deltóides',
    equipamento: 'Halteres',
    substituto: 'Elevação Lateral na Polia Baixa',
    instrucoes: 'Eleve os braços lateralmente até a altura dos ombros guiando o movimento pelos cotovelos, sem dar impulso.',
    seriesPadrao: 4,
    repeticoesPadrao: '12-15',
    descansoPadrao: 60,
    cargaPadraoKg: 10
  },
  {
    nome: 'Elevação Lateral na Polia Baixa',
    categoria: 'Ombros / Deltóides',
    equipamento: 'Polia Baixa (Cabo)',
    substituto: 'Elevação Lateral com Halteres',
    instrucoes: 'Tensão constante no deltóide lateral desde o início da subida. Controle a descida em 2 segundos.',
    seriesPadrao: 3,
    repeticoesPadrao: '12-15',
    descansoPadrao: 60,
    cargaPadraoKg: 8
  },
  {
    nome: 'Elevação Frontal com Halteres ou Corda',
    categoria: 'Ombros / Deltóides',
    equipamento: 'Halteres ou Polia',
    substituto: 'Elevação Frontal com Anilha',
    instrucoes: 'Eleve à frente do corpo até a linha dos olhos sem balançar o tronco.',
    seriesPadrao: 3,
    repeticoesPadrao: '12-15',
    descansoPadrao: 60,
    cargaPadraoKg: 10
  },
  {
    nome: 'Crucifixo Invertido no Peck Deck',
    categoria: 'Ombros / Deltóides',
    equipamento: 'Máquina Peck Deck',
    substituto: 'Crucifixo Invertido com Halteres',
    instrucoes: 'Foco no deltóide posterior. Empurre os braços para trás usando a parte posterior dos ombros sem unir demais as escápulas.',
    seriesPadrao: 3,
    repeticoesPadrao: '12-15',
    descansoPadrao: 60,
    cargaPadraoKg: 25
  },
  {
    nome: 'Face Pull na Polia Alta com Corda',
    categoria: 'Ombros / Deltóides',
    equipamento: 'Polia Alta e Corda',
    substituto: 'Crucifixo Invertido no Peck Deck',
    instrucoes: 'Puxe a corda em direção à testa abrindo os cotovelos e fazendo rotação externa dos ombros.',
    seriesPadrao: 3,
    repeticoesPadrao: '12-15',
    descansoPadrao: 60,
    cargaPadraoKg: 20
  },
  {
    nome: 'Remada Alta na Polia ou Barra',
    categoria: 'Ombros / Deltóides',
    equipamento: 'Barra W ou Polia Baixa',
    substituto: 'Elevação Lateral com Halteres',
    instrucoes: 'Use pegada na largura dos ombros e suba apenas até os cotovelos alinharem com os ombros.',
    seriesPadrao: 3,
    repeticoesPadrao: '10-12',
    descansoPadrao: 60,
    cargaPadraoKg: 25
  },

  // ================= BÍCEPS / ANTEBRAÇO =================
  {
    nome: 'Rosca Direta com Barra W ou Reta',
    categoria: 'Bíceps / Antebraço',
    equipamento: 'Barra W ou Reta',
    substituto: 'Rosca Direta na Polia Baixa',
    instrucoes: 'Mantenha os cotovelos colados ao lado do tronco e contraia o bíceps sem jogar a lombar para trás.',
    seriesPadrao: 3,
    repeticoesPadrao: '8-12',
    descansoPadrao: 60,
    cargaPadraoKg: 20
  },
  {
    nome: 'Rosca Alternada com Halteres',
    categoria: 'Bíceps / Antebraço',
    equipamento: 'Halteres',
    substituto: 'Rosca Direta com Barra W',
    instrucoes: 'Faça a supinação do punho (girando a palma para cima) durante a subida para recrutamento máximo do bíceps.',
    seriesPadrao: 3,
    repeticoesPadrao: '10-12',
    descansoPadrao: 60,
    cargaPadraoKg: 12
  },
  {
    nome: 'Rosca Martelo com Halteres',
    categoria: 'Bíceps / Antebraço',
    equipamento: 'Halteres',
    substituto: 'Rosca Martelo com Corda na Polia',
    instrucoes: 'Mantenha a pegada neutra (polegares apontando para cima) durante todo o movimento para focar em braquial e braquiorradial.',
    seriesPadrao: 3,
    repeticoesPadrao: '10-12',
    descansoPadrao: 60,
    cargaPadraoKg: 12
  },
  {
    nome: 'Rosca Scott com Barra W ou Máquina',
    categoria: 'Bíceps / Antebraço',
    equipamento: 'Banco Scott / Máquina',
    substituto: 'Rosca Concentrada com Halter',
    instrucoes: 'Apoie todo o tríceps na almofada do banco Scott para isolar a cabeça curta do bíceps sem roubo.',
    seriesPadrao: 3,
    repeticoesPadrao: '10-12',
    descansoPadrao: 60,
    cargaPadraoKg: 18
  },
  {
    nome: 'Rosca Inclinada com Halteres (Banco 45°)',
    categoria: 'Bíceps / Antebraço',
    equipamento: 'Halteres e Banco Inclinado',
    substituto: 'Rosca Bayesiana na Polia Baixa',
    instrucoes: 'Deixe os braços alongarem atrás da linha do tronco para enfatizar a cabeça longa do bíceps.',
    seriesPadrao: 3,
    repeticoesPadrao: '10-12',
    descansoPadrao: 60,
    cargaPadraoKg: 10
  },
  {
    nome: 'Rosca Concentrada com Halter',
    categoria: 'Bíceps / Antebraço',
    equipamento: 'Halter',
    substituto: 'Rosca Scott na Máquina',
    instrucoes: 'Apoie o cotovelo na parte interna da coxa e foque no pico de contração do bíceps no topo.',
    seriesPadrao: 3,
    repeticoesPadrao: '10-12',
    descansoPadrao: 60,
    cargaPadraoKg: 10
  },
  {
    nome: 'Rosca Direta na Polia Baixa',
    categoria: 'Bíceps / Antebraço',
    equipamento: 'Polia Baixa (Barra ou Corda)',
    substituto: 'Rosca Direta com Barra W',
    instrucoes: 'Aproveite a tensão constante do cabo tanto na subida quanto na descida controlada.',
    seriesPadrao: 3,
    repeticoesPadrao: '12-15',
    descansoPadrao: 60,
    cargaPadraoKg: 25
  },

  // ================= TRÍCEPS =================
  {
    nome: 'Tríceps Corda na Polia Alta',
    categoria: 'Tríceps',
    equipamento: 'Polia Alta e Corda',
    substituto: 'Tríceps Polia com Barra Reta',
    instrucoes: 'Mantenha os cotovelos fixos ao lado do corpo e afaste as pontas da corda no final da descida.',
    seriesPadrao: 4,
    repeticoesPadrao: '10-12',
    descansoPadrao: 60,
    cargaPadraoKg: 22
  },
  {
    nome: 'Tríceps Polia com Barra Reta ou V',
    categoria: 'Tríceps',
    equipamento: 'Polia Alta e Barra',
    substituto: 'Tríceps Corda na Polia Alta',
    instrucoes: 'Estenda completamente os cotovelos embaixo e controle o retorno até cerca de 90°.',
    seriesPadrao: 3,
    repeticoesPadrao: '10-12',
    descansoPadrao: 60,
    cargaPadraoKg: 25
  },
  {
    nome: 'Tríceps Testa com Barra W',
    categoria: 'Tríceps',
    equipamento: 'Barra W e Banco Reto',
    substituto: 'Tríceps Testa com Halteres',
    instrucoes: 'Incline os braços levemente para trás da linha da cabeça para manter tensão contínua na cabeça longa do tríceps.',
    seriesPadrao: 3,
    repeticoesPadrao: '8-12',
    descansoPadrao: 75,
    cargaPadraoKg: 20
  },
  {
    nome: 'Tríceps Francês Unilateral ou Bilateral',
    categoria: 'Tríceps',
    equipamento: 'Halter ou Polia Baixa',
    substituto: 'Tríceps Testa com Barra W',
    instrucoes: 'Alongue bem o tríceps descendo o peso atrás da cabeça com os cotovelos apontados para cima.',
    seriesPadrao: 3,
    repeticoesPadrao: '10-12',
    descansoPadrao: 60,
    cargaPadraoKg: 16
  },
  {
    nome: 'Supino Fechado com Barra',
    categoria: 'Tríceps',
    equipamento: 'Barra e Banco Reto',
    substituto: 'Mergulho nas Paralelas',
    instrucoes: 'Pegada na largura dos ombros, descendo a barra com os cotovelos rentes ao tronco.',
    seriesPadrao: 3,
    repeticoesPadrao: '8-10',
    descansoPadrao: 75,
    cargaPadraoKg: 35
  },
  {
    nome: 'Tríceps Mergulho no Banco ou Paralelas',
    categoria: 'Tríceps',
    equipamento: 'Paralelas ou Banco',
    substituto: 'Supino Fechado com Barra',
    instrucoes: 'Mantenha o tronco vertical para focar no tríceps e desça até os cotovelos formarem 90°.',
    seriesPadrao: 3,
    repeticoesPadrao: '10-12',
    descansoPadrao: 60,
    cargaPadraoKg: 0
  },
  {
    nome: 'Tríceps Coice com Halter ou na Polia',
    categoria: 'Tríceps',
    equipamento: 'Halter ou Polia',
    substituto: 'Tríceps Corda na Polia Alta',
    instrucoes: 'Mantenha o braço paralelo ao chão e estenda o antebraço contraindo o tríceps no topo.',
    seriesPadrao: 3,
    repeticoesPadrao: '12-15',
    descansoPadrao: 60,
    cargaPadraoKg: 8
  },

  // ================= QUADRÍCEPS =================
  {
    nome: 'Agachamento Livre com Barra',
    categoria: 'Quadríceps',
    equipamento: 'Barra Olímpica e Gaiola',
    substituto: 'Agachamento no Hack Machine',
    instrucoes: 'Inspire travando o abdômen (bracing), mantenha os joelhos na direção da ponta dos pés e desça com coluna neutra.',
    seriesPadrao: 4,
    repeticoesPadrao: '6-10',
    descansoPadrao: 90,
    cargaPadraoKg: 50
  },
  {
    nome: 'Leg Press 45°',
    categoria: 'Quadríceps',
    equipamento: 'Máquina Leg Press 45°',
    substituto: 'Agachamento no Hack Machine',
    instrucoes: 'Mantenha o quadril e a lombar totalmente apoiados no encosto. Não trave os joelhos no final da extensão.',
    seriesPadrao: 4,
    repeticoesPadrao: '8-12',
    descansoPadrao: 90,
    cargaPadraoKg: 120
  },
  {
    nome: 'Agachamento no Hack Machine',
    categoria: 'Quadríceps',
    equipamento: 'Máquina Hack',
    substituto: 'Leg Press 45°',
    instrucoes: 'Coluna totalmente estabilizada no apoio do Hack. Desça de forma controlada até pelo menos 90° de flexão dos joelhos.',
    seriesPadrao: 4,
    repeticoesPadrao: '8-12',
    descansoPadrao: 90,
    cargaPadraoKg: 70
  },
  {
    nome: 'Cadeira Extensora',
    categoria: 'Quadríceps',
    equipamento: 'Máquina Cadeira Extensora',
    substituto: 'Agachamento Goblet com Halter',
    instrucoes: 'Estenda totalmente os joelhos e segure 1 segundo no topo contraindo o quadríceps.',
    seriesPadrao: 4,
    repeticoesPadrao: '12-15',
    descansoPadrao: 60,
    cargaPadraoKg: 45
  },
  {
    nome: 'Afundo / Passada com Halteres',
    categoria: 'Quadríceps',
    equipamento: 'Halteres',
    substituto: 'Agachamento Búlgaro com Halteres',
    instrucoes: 'Dê um passo firme à frente e desça o joelho de trás em direção ao solo mantendo o tronco estável.',
    seriesPadrao: 3,
    repeticoesPadrao: '10-12',
    descansoPadrao: 75,
    cargaPadraoKg: 14
  },
  {
    nome: 'Agachamento Búlgaro com Halteres',
    categoria: 'Quadríceps',
    equipamento: 'Halteres e Banco',
    substituto: 'Afundo / Passada com Halteres',
    instrucoes: 'Apoie o peito do pé de trás no banco e desça concentrando toda a força na perna da frente (quadríceps e glúteo).',
    seriesPadrao: 3,
    repeticoesPadrao: '8-12',
    descansoPadrao: 75,
    cargaPadraoKg: 14
  },
  {
    nome: 'Agachamento no Smith (Barra Guiada)',
    categoria: 'Quadríceps',
    equipamento: 'Máquina Smith',
    substituto: 'Agachamento no Hack Machine',
    instrucoes: 'Posicione os pés levemente à frente da linha da barra e mantenha a coluna alinhada.',
    seriesPadrao: 4,
    repeticoesPadrao: '8-12',
    descansoPadrao: 75,
    cargaPadraoKg: 40
  },

  // ================= POSTERIOR DE COXA =================
  {
    nome: 'Stiff com Barra ou Halteres',
    categoria: 'Posterior de Coxa',
    equipamento: 'Barra ou Halteres',
    substituto: 'Mesa Flexora Deitada',
    instrucoes: 'Projete o quadril para trás mantendo os joelhos levemente semiflexionados e a barra rente às pernas com coluna reta.',
    seriesPadrao: 4,
    repeticoesPadrao: '8-12',
    descansoPadrao: 75,
    cargaPadraoKg: 40
  },
  {
    nome: 'Mesa Flexora Deitada',
    categoria: 'Posterior de Coxa',
    equipamento: 'Máquina Mesa Flexora',
    substituto: 'Cadeira Flexora Sentada',
    instrucoes: 'Mantenha o quadril pressionado contra o banco durante toda a flexão dos joelhos para isolar os isquiotibiais.',
    seriesPadrao: 4,
    repeticoesPadrao: '10-12',
    descansoPadrao: 60,
    cargaPadraoKg: 35
  },
  {
    nome: 'Cadeira Flexora Sentada',
    categoria: 'Posterior de Coxa',
    equipamento: 'Máquina Cadeira Flexora',
    substituto: 'Mesa Flexora Deitada',
    instrucoes: 'Ajuste a trava sobre as coxas, flexione até o final da amplitude e controle o retorno em 2 a 3 segundos.',
    seriesPadrao: 4,
    repeticoesPadrao: '10-15',
    descansoPadrao: 60,
    cargaPadraoKg: 40
  },
  {
    nome: 'Flexora em Pé Unilateral',
    categoria: 'Posterior de Coxa',
    equipamento: 'Máquina ou Polia Baixa',
    substituto: 'Mesa Flexora Deitada',
    instrucoes: 'Foco no trabalho unilateral de posterior de coxa corrigindo assimetrias entre as pernas.',
    seriesPadrao: 3,
    repeticoesPadrao: '12-15',
    descansoPadrao: 60,
    cargaPadraoKg: 20
  },
  {
    nome: 'Levantamento Terra Romeno (RDL)',
    categoria: 'Posterior de Coxa',
    equipamento: 'Barra Olímpica ou Halteres',
    substituto: 'Stiff com Barra ou Halteres',
    instrucoes: 'Foco na dobradiça de quadril (hip hinge), sentindo o alongamento máximo de posteriores e glúteos.',
    seriesPadrao: 4,
    repeticoesPadrao: '8-10',
    descansoPadrao: 90,
    cargaPadraoKg: 50
  },

  // ================= GLÚTEOS =================
  {
    nome: 'Elevação Pélvica com Barra ou Máquina',
    categoria: 'Glúteos',
    equipamento: 'Barra Acolchoada ou Máquina',
    substituto: 'Elevação Pélvica no Smith',
    instrucoes: 'Apoie a linha inferior das escápulas no banco, olhe para frente e contraia fortemente os glúteos por 2 segundos no topo.',
    seriesPadrao: 4,
    repeticoesPadrao: '8-12',
    descansoPadrao: 75,
    cargaPadraoKg: 50
  },
  {
    nome: 'Cadeira Abdutora',
    categoria: 'Glúteos',
    equipamento: 'Máquina Cadeira Abdutora',
    substituto: 'Abdução de Quadril na Polia Baixa',
    instrucoes: 'Afaste as pernas controlando o movimento para trabalhar glúteo médio e mínimo.',
    seriesPadrao: 4,
    repeticoesPadrao: '12-15',
    descansoPadrao: 60,
    cargaPadraoKg: 45
  },
  {
    nome: 'Glúteo Coice na Polia Baixa (Extensão de Quadril)',
    categoria: 'Glúteos',
    equipamento: 'Polia Baixa e Tornozeleira',
    substituto: 'Glúteo na Máquina (4 Apoios)',
    instrucoes: 'Estenda o quadril para trás mantendo o abdômen firme sem arquear a coluna lombar.',
    seriesPadrao: 3,
    repeticoesPadrao: '12-15',
    descansoPadrao: 60,
    cargaPadraoKg: 15
  },
  {
    nome: 'Agachamento Sumô com Halter ou Barra',
    categoria: 'Glúteos',
    equipamento: 'Halter (Kettlebell) ou Barra',
    substituto: 'Leg Press 45° (Pés Altos e Afastados)',
    instrucoes: 'Pés bem afastados com pontas voltadas para fora (45°), descendo com o quadril aberto.',
    seriesPadrao: 4,
    repeticoesPadrao: '10-12',
    descansoPadrao: 75,
    cargaPadraoKg: 26
  },

  // ================= PANTURRILHA =================
  {
    nome: 'Panturrilha em Pé na Máquina (Gêmeos)',
    categoria: 'Panturrilha',
    equipamento: 'Máquina Panturrilha em Pé',
    substituto: 'Panturrilha no Leg Press 45°',
    instrucoes: 'Alongue bem o calcanhar na descida e suba na ponta dos pés pausando 1 segundo no pico de contração.',
    seriesPadrao: 4,
    repeticoesPadrao: '15-20',
    descansoPadrao: 45,
    cargaPadraoKg: 50
  },
  {
    nome: 'Panturrilha Sentado na Máquina (Sóleo)',
    categoria: 'Panturrilha',
    equipamento: 'Máquina Panturrilha Sentado',
    substituto: 'Panturrilha em Pé na Máquina',
    instrucoes: 'Trabalha prioritariamente o músculo sóleo. Faça amplitude total sem quicar o peso.',
    seriesPadrao: 4,
    repeticoesPadrao: '15-20',
    descansoPadrao: 45,
    cargaPadraoKg: 35
  },
  {
    nome: 'Panturrilha no Leg Press 45°',
    categoria: 'Panturrilha',
    equipamento: 'Máquina Leg Press',
    substituto: 'Panturrilha em Pé na Máquina',
    instrucoes: 'Apoie a parte anterior dos pés na base da plataforma e empurre com os tornozelos mantendo joelhos semiflexionados.',
    seriesPadrao: 4,
    repeticoesPadrao: '15-20',
    descansoPadrao: 45,
    cargaPadraoKg: 80
  },

  // ================= ABDÔMEN / CORE =================
  {
    nome: 'Abdominal Supra no Solo ou Máquina',
    categoria: 'Abdômen / Core',
    equipamento: 'Colchonete ou Máquina',
    substituto: 'Abdominal Supra na Polia Alta (Crunch)',
    instrucoes: 'Enrole a coluna torácica aproximando as costelas do quadril e solte todo o ar no topo.',
    seriesPadrao: 3,
    repeticoesPadrao: '15-20',
    descansoPadrao: 45,
    cargaPadraoKg: 0
  },
  {
    nome: 'Abdominal Infra na Paralela ou Solo',
    categoria: 'Abdômen / Core',
    equipamento: 'Paralela Abdominal ou Solo',
    substituto: 'Prancha Isométrica Frontal',
    instrucoes: 'Eleve as pernas enrolando a pelve para cima e controle a descida sem tirar a lombar do apoio.',
    seriesPadrao: 3,
    repeticoesPadrao: '12-15',
    descansoPadrao: 45,
    cargaPadraoKg: 0
  },
  {
    nome: 'Prancha Isométrica Frontal',
    categoria: 'Abdômen / Core',
    equipamento: 'Colchonete',
    substituto: 'Abdominal Supra no Solo',
    instrucoes: 'Mantenha o corpo alinhado sobre os antebraços contraindo fortemente abdômen e glúteos.',
    seriesPadrao: 3,
    repeticoesPadrao: '45-60s',
    descansoPadrao: 45,
    cargaPadraoKg: 0
  },
  {
    nome: 'Abdominal na Polia Alta (Crunch ajoelhado)',
    categoria: 'Abdômen / Core',
    equipamento: 'Polia Alta e Corda',
    substituto: 'Abdominal na Máquina',
    instrucoes: 'Ajoelhado, segure a corda ao lado da cabeça e flexione o tronco contraindo o reto abdominal.',
    seriesPadrao: 3,
    repeticoesPadrao: '12-15',
    descansoPadrao: 45,
    cargaPadraoKg: 25
  }
];
