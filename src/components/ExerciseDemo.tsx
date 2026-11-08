import React, { useState, useEffect } from 'react';
import { Exercise } from '../types';
import { Play, Pause, ExternalLink, Activity } from 'lucide-react';

interface ExerciseDemoProps {
  exercise: Exercise;
  compact?: boolean;
}

type MovementType =
  | 'bench_press'
  | 'shoulder_press'
  | 'lateral_raise'
  | 'tricep_pushdown'
  | 'bicep_curl'
  | 'lat_pulldown'
  | 'row'
  | 'squat'
  | 'leg_press'
  | 'leg_extension'
  | 'leg_curl'
  | 'hip_thrust'
  | 'stiff'
  | 'calf_raise'
  | 'crunch';

interface ExerciseVisualMeta {
  type: MovementType;
  folder: string;
  fallbackFolder: string;
  faseConcentrica: string;
  faseExcentrica: string;
  dicaRespiracao: string;
}

const GITHUB_EXERCISE_BASE = 'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises';

function getExerciseVisualMeta(nome: string, grupo: string, equipamento?: string): ExerciseVisualMeta {
  const n = nome.toLowerCase();
  const g = grupo.toLowerCase();
  const eq = (equipamento || '').toLowerCase();
  const full = `${n} ${eq}`;

  const usaBarra = full.includes('barra') || full.includes('olímpica') || full.includes('olimpica') || full.includes('smith');
  const usaPolia = full.includes('polia') || full.includes('cabo') || full.includes('crossover') || full.includes('pulley') || full.includes('corda');
  const usaMaquina = full.includes('máquina') || full.includes('maquina') || full.includes('articulad') || full.includes('peck') || full.includes('voador');

  // =========================================================================
  // 1. SUPINO FECHADO (Tríceps / Peitoral com Barra) — Deve vir antes de Supino geral
  // =========================================================================
  if (n.includes('supino fechado') || (n.includes('supino') && n.includes('fechad'))) {
    return {
      type: 'bench_press',
      folder: 'Close-Grip_Barbell_Bench_Press',
      fallbackFolder: 'Barbell_Bench_Press_-_Medium_Grip',
      faseConcentrica: 'Empurre a barra para cima mantendo os cotovelos próximos ao tronco, focando na extensão do tríceps.',
      faseExcentrica: 'Desça a barra com pegada na largura dos ombros mantendo os cotovelos fechados.',
      dicaRespiracao: 'Expire ao empurrar a barra; inspire ao descer.'
    };
  }

  // =========================================================================
  // 2. CRUCIFIXO / CROSSOVER / VOADOR / PECK DECK (Peitoral e Posterior de Ombro)
  // =========================================================================
  if (n.includes('crucifixo invertido') || n.includes('voador invertido') || n.includes('peck deck invertido') || n.includes('posterior de ombro')) {
    if (usaMaquina || n.includes('peck') || n.includes('voador')) {
      return {
        type: 'lateral_raise',
        folder: 'Reverse_Machine_Flyes',
        fallbackFolder: 'Seated_Bent-Over_Rear_Delt_Raise',
        faseConcentrica: 'Abra os braços para trás contraindo a parte posterior dos ombros sem encolher o trapézio.',
        faseExcentrica: 'Retorne à frente de forma controlada mantendo a postura ereta.',
        dicaRespiracao: 'Solte o ar ao abrir os braços; inspire ao retornar.'
      };
    }
    if (usaPolia) {
      return {
        type: 'lateral_raise',
        folder: 'Cable_Rear_Delt_Fly',
        fallbackFolder: 'Seated_Bent-Over_Rear_Delt_Raise',
        faseConcentrica: 'Puxe os cabos abrindo os braços lateralmente para trás na linha dos ombros.',
        faseExcentrica: 'Retorne devagar controlando a tensão dos cabos.',
        dicaRespiracao: 'Expire ao abrir; inspire ao retornar.'
      };
    }
    return {
      type: 'lateral_raise',
      folder: 'Seated_Bent-Over_Rear_Delt_Raise',
      fallbackFolder: 'Side_Lateral_Raise',
      faseConcentrica: 'Com o tronco inclinado, eleve os halteres lateralmente focando no deltóide posterior.',
      faseExcentrica: 'Desça os halteres de forma controlada sem balançar o tronco.',
      dicaRespiracao: 'Solte o ar ao subir; inspire na descida.'
    };
  }

  if (n.includes('crucifixo') || n.includes('crossover') || n.includes('peck deck') || n.includes('voador')) {
    if (usaPolia) {
      const isInclinado = n.includes('inclinado') || n.includes('baixo');
      return {
        type: 'bench_press',
        folder: isInclinado ? 'Low_Cable_Crossover' : 'Cable_Crossover',
        fallbackFolder: 'Cable_Crossover',
        faseConcentrica: 'Puxe os cabos em arco até as mãos se aproximarem na frente do peitoral.',
        faseExcentrica: 'Retorne os braços controlando a tensão da polia com cotovelos levemente flexionados.',
        dicaRespiracao: 'Expire ao fechar os braços; inspire ao abrir.'
      };
    }
    if (usaMaquina || n.includes('peck') || n.includes('voador')) {
      return {
        type: 'bench_press',
        folder: 'Butterfly',
        fallbackFolder: 'Dumbbell_Flyes',
        faseConcentrica: 'Una os apoios à frente contraindo fortemente o peitoral por 1 segundo.',
        faseExcentrica: 'Abra os braços até a linha do tronco mantendo as escápulas apoiadas no encosto.',
        dicaRespiracao: 'Expire ao fechar; inspire ao abrir.'
      };
    }
    if (n.includes('inclinado')) {
      return {
        type: 'bench_press',
        folder: 'Incline_Dumbbell_Flyes',
        fallbackFolder: 'Dumbbell_Flyes',
        faseConcentrica: 'Suba os halteres em movimento de arco contraindo a porção superior do peitoral.',
        faseExcentrica: 'Abra os braços com os cotovelos semi-flexionados alongando o peitoral.',
        dicaRespiracao: 'Expire na subida; inspire ao abrir os braços.'
      };
    }
    return {
      type: 'bench_press',
      folder: 'Dumbbell_Flyes',
      fallbackFolder: 'Dumbbell_Bench_Press',
      faseConcentrica: 'Feche os braços em arco no topo contraindo o peitoral.',
      faseExcentrica: 'Abra os braços lateralmente de forma controlada alongando as fibras do peito.',
      dicaRespiracao: 'Expire ao fechar; inspire ao descer.'
    };
  }

  // =========================================================================
  // 3. SUPINOS (Inclinado, Declinado, Reto — Barra vs Halteres vs Máquina)
  // =========================================================================
  if (n.includes('supino inclinado')) {
    if (usaBarra) {
      return {
        type: 'bench_press',
        folder: 'Barbell_Incline_Bench_Press_-_Medium-Grip',
        fallbackFolder: 'Incline_Dumbbell_Press',
        faseConcentrica: 'Empurre a barra para cima até estender os braços focando no peitoral superior.',
        faseExcentrica: 'Desça a barra controladamente até a parte superior do peitoral.',
        dicaRespiracao: 'Solte o ar ao empurrar a barra; inspire na descida.'
      };
    }
    if (usaMaquina) {
      return {
        type: 'bench_press',
        folder: 'Leverage_Incline_Chest_Press',
        fallbackFolder: 'Incline_Dumbbell_Press',
        faseConcentrica: 'Empurre as manoplas da máquina à frente e para cima contraindo o peitoral.',
        faseExcentrica: 'Retorne o peso devagar sem deixar as placas baterem.',
        dicaRespiracao: 'Expire ao empurrar; inspire ao voltar.'
      };
    }
    return {
      type: 'bench_press',
      folder: 'Incline_Dumbbell_Press',
      fallbackFolder: 'Dumbbell_Bench_Press',
      faseConcentrica: 'Empurre os halteres para cima mantendo o controle e estabilidade dos ombros.',
      faseExcentrica: 'Desça os halteres em 2 segundos até a linha superior do peitoral.',
      dicaRespiracao: 'Solte o ar ao empurrar; inspire ao descer.'
    };
  }

  if (n.includes('supino declinado')) {
    return {
      type: 'bench_press',
      folder: usaBarra ? 'Decline_Barbell_Bench_Press' : 'Decline_Dumbbell_Bench_Press',
      fallbackFolder: 'Barbell_Bench_Press_-_Medium_Grip',
      faseConcentrica: 'Empurre o peso verticalmente contraindo a porção inferior do peitoral.',
      faseExcentrica: 'Desça de forma controlada até a parte inferior do esterno.',
      dicaRespiracao: 'Expire na subida; inspire na descida.'
    };
  }

  if (n.includes('supino')) {
    if (usaMaquina) {
      return {
        type: 'bench_press',
        folder: 'Leverage_Chest_Press',
        fallbackFolder: 'Barbell_Bench_Press_-_Medium_Grip',
        faseConcentrica: 'Empurre as alavancas da máquina à frente mantendo as escápulas firmes no banco.',
        faseExcentrica: 'Retorne controladamente alongando o peitoral.',
        dicaRespiracao: 'Expire ao empurrar; inspire na volta.'
      };
    }
    if (usaBarra) {
      return {
        type: 'bench_press',
        folder: 'Barbell_Bench_Press_-_Medium_Grip',
        fallbackFolder: 'Dumbbell_Bench_Press',
        faseConcentrica: 'Empurre a barra verticalmente para cima contraindo o peitoral até estender os braços.',
        faseExcentrica: 'Desça a barra de forma controlada até tocar levemente a linha média do peitoral.',
        dicaRespiracao: 'Inspire na descida e expire com firmeza ao empurrar a barra.'
      };
    }
    return {
      type: 'bench_press',
      folder: 'Dumbbell_Bench_Press',
      fallbackFolder: 'Barbell_Bench_Press_-_Medium_Grip',
      faseConcentrica: 'Empurre os halteres para cima aproximando-os levemente no topo sem bater um no outro.',
      faseExcentrica: 'Desça os halteres até a linha do peitoral mantendo os cotovelos a cerca de 45°.',
      dicaRespiracao: 'Expire na subida; inspire ao descer.'
    };
  }

  if (n.includes('flexão') || n.includes('flexao') || n.includes('push-up')) {
    return {
      type: 'bench_press',
      folder: 'Pushups',
      fallbackFolder: 'Dumbbell_Bench_Press',
      faseConcentrica: 'Empurre o solo até estender os braços mantendo o tronco e abdômen alinhados.',
      faseExcentrica: 'Desça o corpo em bloco até o peitoral chegar próximo ao chão.',
      dicaRespiracao: 'Inspire ao descer; solte o ar ao empurrar.'
    };
  }

  // =========================================================================
  // 4. OMBROS (Desenvolvimento Militar/Barra, Halteres, Arnold, Elevações, Face Pull, Encolhimento)
  // =========================================================================
  if (n.includes('face pull')) {
    return {
      type: 'row',
      folder: 'Face_Pull',
      fallbackFolder: 'Seated_Cable_Rows',
      faseConcentrica: 'Puxe a corda em direção à testa abrindo os cotovelos e girando os ombros externamente.',
      faseExcentrica: 'Retorne a corda de forma controlada mantendo a postura firme.',
      dicaRespiracao: 'Expire ao puxar a corda; inspire ao retornar.'
    };
  }

  if (n.includes('elevação lateral') || n.includes('elevacao lateral')) {
    return {
      type: 'lateral_raise',
      folder: usaPolia ? 'Cable_Seated_Lateral_Raise' : 'Side_Lateral_Raise',
      fallbackFolder: 'Side_Lateral_Raise',
      faseConcentrica: 'Eleve os braços lateralmente até a linha dos ombros liderando o movimento com os cotovelos.',
      faseExcentrica: 'Desça controlando o peso sem deixá-lo despencar.',
      dicaRespiracao: 'Solte o ar ao subir os braços; inspire ao descer.'
    };
  }

  if (n.includes('elevação frontal') || n.includes('elevacao frontal')) {
    return {
      type: 'lateral_raise',
      folder: usaBarra ? 'Barbell_Front_Raise' : usaPolia ? 'Front_Cable_Raise' : 'Front_Dumbbell_Raise',
      fallbackFolder: 'Front_Dumbbell_Raise',
      faseConcentrica: 'Eleve o peso à frente do corpo até a altura dos ombros sem balançar o tronco.',
      faseExcentrica: 'Desça de forma controlada resistindo à gravidade.',
      dicaRespiracao: 'Expire na subida; inspire na descida.'
    };
  }

  if (n.includes('remada alta')) {
    return {
      type: 'lateral_raise',
      folder: usaPolia ? 'Upright_Cable_Row' : 'Upright_Barbell_Row',
      fallbackFolder: 'Upright_Barbell_Row',
      faseConcentrica: 'Suba a barra próxima ao corpo elevando os cotovelos até a linha dos ombros.',
      faseExcentrica: 'Desça a barra devagar até estender os braços.',
      dicaRespiracao: 'Expire ao puxar para cima; inspire ao descer.'
    };
  }

  if (n.includes('encolhimento')) {
    return {
      type: 'lateral_raise',
      folder: usaBarra ? 'Barbell_Shrug' : 'Dumbbell_Shrug',
      fallbackFolder: 'Dumbbell_Shrug',
      faseConcentrica: 'Eleve os ombros verticalmente em direção às orelhas contraindo o trapézio por 1 segundo.',
      faseExcentrica: 'Desça os ombros alongando o trapézio mantendo os braços estendidos.',
      dicaRespiracao: 'Expire ao subir os ombros; inspire ao descer.'
    };
  }

  if (n.includes('desenvolvimento')) {
    if (n.includes('militar') || usaBarra) {
      const isSentado = n.includes('sentado');
      return {
        type: 'shoulder_press',
        folder: isSentado ? 'Barbell_Shoulder_Press' : 'Standing_Military_Press',
        fallbackFolder: 'Standing_Military_Press',
        faseConcentrica: 'Empurre a barra verticalmente acima da cabeça até estender os braços, mantendo o abdômen contraído.',
        faseExcentrica: 'Desça a barra controladamente até a altura da parte superior do peitoral/queixo.',
        dicaRespiracao: 'Expire ao empurrar a barra para cima; inspire ao descer.'
      };
    }
    if (n.includes('arnold')) {
      return {
        type: 'shoulder_press',
        folder: 'Arnold_Dumbbell_Press',
        fallbackFolder: 'Dumbbell_Shoulder_Press',
        faseConcentrica: 'Empurre os halteres para cima girando os punhos para frente durante a subida.',
        faseExcentrica: 'Desça girando as palmas das mãos de volta na direção do rosto.',
        dicaRespiracao: 'Expire ao subir; inspire ao descer.'
      };
    }
    if (usaMaquina) {
      return {
        type: 'shoulder_press',
        folder: 'Leverage_Shoulder_Press',
        fallbackFolder: 'Dumbbell_Shoulder_Press',
        faseConcentrica: 'Empurre as manoplas da máquina verticalmente acima da cabeça.',
        faseExcentrica: 'Desça até os cotovelos formarem cerca de 90 graus.',
        dicaRespiracao: 'Expire na subida; inspire na descida.'
      };
    }
    return {
      type: 'shoulder_press',
      folder: 'Dumbbell_Shoulder_Press',
      fallbackFolder: 'Standing_Military_Press',
      faseConcentrica: 'Empurre os halteres verticalmente acima da cabeça sem bater um no outro.',
      faseExcentrica: 'Desça os halteres até a linha das orelhas (cotovelos a 90°).',
      dicaRespiracao: 'Expire ao empurrar para cima; inspire ao descer.'
    };
  }

  // =========================================================================
  // 5. TRÍCEPS (Testa, Francês, Corda, Polia Barra, Coice, Mergulho/Paralelas)
  // =========================================================================
  if (n.includes('tríceps') || n.includes('triceps') || n.includes('mergulho') || n.includes('paralelas')) {
    if (n.includes('testa')) {
      return {
        type: 'tricep_pushdown',
        folder: usaBarra ? 'Lying_Triceps_Press' : 'Decline_EZ_Bar_Triceps_Extension',
        fallbackFolder: 'Lying_Triceps_Press',
        faseConcentrica: 'Estenda os cotovelos elevando o peso até alinhar os braços, mantendo os cotovelos fechados.',
        faseExcentrica: 'Flexione os cotovelos descendo o peso de forma controlada em direção à testa.',
        dicaRespiracao: 'Expire ao estender os braços; inspire ao descer.'
      };
    }
    if (n.includes('francês') || n.includes('frances')) {
      return {
        type: 'tricep_pushdown',
        folder: usaPolia ? 'Cable_Rope_Overhead_Triceps_Extension' : 'Standing_Dumbbell_Triceps_Extension',
        fallbackFolder: 'Standing_Dumbbell_Triceps_Extension',
        faseConcentrica: 'Estenda os cotovelos acima da cabeça contraindo o tríceps ao máximo.',
        faseExcentrica: 'Desça o peso atrás da cabeça mantendo os cotovelos apontados para frente.',
        dicaRespiracao: 'Expire ao estender; inspire ao flexionar.'
      };
    }
    if (n.includes('coice')) {
      return {
        type: 'tricep_pushdown',
        folder: 'Tricep_Dumbbell_Kickback',
        fallbackFolder: 'Triceps_Pushdown',
        faseConcentrica: 'Estenda o antebraço para trás até alinhar com o tronco, contraindo o tríceps.',
        faseExcentrica: 'Flexione o cotovelo de forma controlada mantendo o braço colado ao tronco.',
        dicaRespiracao: 'Expire ao estender; inspire ao voltar.'
      };
    }
    if (n.includes('mergulho') || n.includes('paralelas')) {
      const isBanco = n.includes('banco');
      return {
        type: 'tricep_pushdown',
        folder: isBanco ? 'Bench_Dips' : 'Dips_-_Triceps_Version',
        fallbackFolder: 'Bench_Dips',
        faseConcentrica: 'Empurre o corpo para cima estendendo os cotovelos com o tronco vertical.',
        faseExcentrica: 'Desça flexionando os cotovelos até formarem 90 graus.',
        dicaRespiracao: 'Inspire na descida; expire ao subir.'
      };
    }
    if (n.includes('corda')) {
      return {
        type: 'tricep_pushdown',
        folder: 'Triceps_Pushdown_-_Rope_Attachment',
        fallbackFolder: 'Triceps_Pushdown',
        faseConcentrica: 'Estenda os cotovelos abrindo as pontas da corda no final para contração máxima.',
        faseExcentrica: 'Retorne devagar até o antebraço passar levemente de 90° mantendo os cotovelos fixos.',
        dicaRespiracao: 'Expire ao empurrar a corda; inspire na subida.'
      };
    }
    return {
      type: 'tricep_pushdown',
      folder: 'Triceps_Pushdown',
      fallbackFolder: 'Triceps_Pushdown_-_Rope_Attachment',
      faseConcentrica: 'Empurre a barra para baixo até estender totalmente os cotovelos.',
      faseExcentrica: 'Suba a barra de forma controlada mantendo os cotovelos travados ao lado do tronco.',
      dicaRespiracao: 'Expire ao descer a barra; inspire ao subir.'
    };
  }

  // =========================================================================
  // 6. BÍCEPS E ANTEBRAÇO (Rosca Direta Barra/Halter/Polia, Martelo, Scott, Inclinada, Concentrada)
  // =========================================================================
  if (n.includes('rosca')) {
    if (n.includes('scott')) {
      return {
        type: 'bicep_curl',
        folder: 'Preacher_Curl',
        fallbackFolder: 'EZ-Bar_Curl',
        faseConcentrica: 'Flexione os cotovelos subindo o peso com os braços totalmente apoiados no banco Scott.',
        faseExcentrica: 'Desça devagar controlando o alongamento do bíceps sem dar tranco no final.',
        dicaRespiracao: 'Expire ao subir; inspire ao descer.'
      };
    }
    if (n.includes('martelo')) {
      return {
        type: 'bicep_curl',
        folder: usaPolia ? 'Cable_Hammer_Curls_-_Rope_Attachment' : 'Hammer_Curls',
        fallbackFolder: 'Hammer_Curls',
        faseConcentrica: 'Suba o peso mantendo a pegada neutra (palmas voltadas uma para a outra).',
        faseExcentrica: 'Desça de forma controlada mantendo os cotovelos fixos ao lado do corpo.',
        dicaRespiracao: 'Solte o ar ao subir; inspire na descida.'
      };
    }
    if (n.includes('inclinad')) {
      return {
        type: 'bicep_curl',
        folder: 'Incline_Dumbbell_Curl',
        fallbackFolder: 'Dumbbell_Bicep_Curl',
        faseConcentrica: 'Flexione os cotovelos mantendo os braços posicionados atrás da linha do tronco.',
        faseExcentrica: 'Desça alongando completamente o bíceps no banco inclinado.',
        dicaRespiracao: 'Expire na subida; inspire ao alongar.'
      };
    }
    if (n.includes('concentrada')) {
      return {
        type: 'bicep_curl',
        folder: 'Concentration_Curls',
        fallbackFolder: 'Dumbbell_Bicep_Curl',
        faseConcentrica: 'Com o cotovelo apoiado na parte interna da coxa, suba o halter contraindo o bíceps.',
        faseExcentrica: 'Desça lentamente até estender quase todo o braço.',
        dicaRespiracao: 'Expire ao subir; inspire ao descer.'
      };
    }
    if (n.includes('inversa')) {
      return {
        type: 'bicep_curl',
        folder: 'Reverse_Barbell_Curl',
        fallbackFolder: 'Barbell_Curl',
        faseConcentrica: 'Suba a barra com pegada pronada (palmas para baixo) focando nos extensores do antebraço e braquial.',
        faseExcentrica: 'Desça de forma controlada mantendo os punhos firmes.',
        dicaRespiracao: 'Expire na subida; inspire na descida.'
      };
    }
    if (usaPolia) {
      return {
        type: 'bicep_curl',
        folder: 'Standing_Biceps_Cable_Curl',
        fallbackFolder: 'EZ-Bar_Curl',
        faseConcentrica: 'Puxe a barra da polia baixa em direção aos ombros mantendo os cotovelos fixos.',
        faseExcentrica: 'Retorne devagar mantendo tensão contínua do cabo.',
        dicaRespiracao: 'Expire ao puxar; inspire ao descer.'
      };
    }
    if (full.includes('halter') || n.includes('alternada')) {
      return {
        type: 'bicep_curl',
        folder: n.includes('alternada') ? 'Dumbbell_Alternate_Bicep_Curl' : 'Dumbbell_Bicep_Curl',
        fallbackFolder: 'Dumbbell_Bicep_Curl',
        faseConcentrica: 'Flexione os cotovelos girando as palmas para cima (supinação) durante a subida.',
        faseExcentrica: 'Desça os halteres controladamente sem balançar o tronco.',
        dicaRespiracao: 'Expire ao subir; inspire ao descer.'
      };
    }
    return {
      type: 'bicep_curl',
      folder: n.includes('barra w') ? 'EZ-Bar_Curl' : 'Barbell_Curl',
      fallbackFolder: 'EZ-Bar_Curl',
      faseConcentrica: 'Flexione os cotovelos levando a barra até a altura dos ombros sem jogar a coluna para trás.',
      faseExcentrica: 'Desça a barra em 2 a 3 segundos controlando a fase negativa.',
      dicaRespiracao: 'Solte o ar ao subir a barra; inspire ao descer.'
    };
  }

  // =========================================================================
  // 7. COSTAS / DORSAIS (Barra Fixa, Puxadas, Pulldown, Remadas)
  // =========================================================================
  if (n.includes('barra fixa') || n.includes('pull-up') || n.includes('chin-up') || n.includes('graviton')) {
    const isSupinada = n.includes('supinada') || n.includes('chin');
    return {
      type: 'lat_pulldown',
      folder: isSupinada ? 'Chin-Up' : 'Pullups',
      fallbackFolder: 'Wide-Grip_Lat_Pulldown',
      faseConcentrica: 'Puxe o corpo para cima até o queixo ultrapassar a linha da barra, fechando as escápulas.',
      faseExcentrica: 'Desça de forma controlada alongando as dorsais completamente.',
      dicaRespiracao: 'Expire ao subir; inspire ao descer.'
    };
  }

  if (n.includes('pulldown') || (n.includes('puxada') && n.includes('braços estendidos'))) {
    return {
      type: 'lat_pulldown',
      folder: 'Straight-Arm_Pulldown',
      fallbackFolder: 'Wide-Grip_Lat_Pulldown',
      faseConcentrica: 'Com os braços semi-estendidos, desça a barra/corda em arco até a linha do quadril.',
      faseExcentrica: 'Suba os braços controladamente sentindo alongar a grande dorsal.',
      dicaRespiracao: 'Expire ao abaixar os braços; inspire ao subir.'
    };
  }

  if (n.includes('pullover')) {
    return {
      type: 'lat_pulldown',
      folder: 'Bent-Arm_Dumbbell_Pullover',
      fallbackFolder: 'Straight-Arm_Pulldown',
      faseConcentrica: 'Traga o halter de trás da cabeça até acima do peitoral contraindo dorsal e peitoral.',
      faseExcentrica: 'Desça o halter atrás da cabeça alongando a caixa torácica e dorsais.',
      dicaRespiracao: 'Inspire ao alongar atrás; expire ao trazer para cima.'
    };
  }

  if (n.includes('puxada') || n.includes('pulley')) {
    if (n.includes('triângulo') || n.includes('triangulo') || n.includes('fechada') || n.includes('neutra')) {
      return {
        type: 'lat_pulldown',
        folder: 'Close-Grip_Front_Lat_Pulldown',
        fallbackFolder: 'Wide-Grip_Lat_Pulldown',
        faseConcentrica: 'Puxe o triângulo até a parte superior do peitoral mantendo os cotovelos próximos ao corpo.',
        faseExcentrica: 'Retorne o peso devagar deixando as escápulas alongarem no topo.',
        dicaRespiracao: 'Expire ao puxar; inspire ao retornar.'
      };
    }
    if (n.includes('supinada')) {
      return {
        type: 'lat_pulldown',
        folder: 'Underhand_Cable_Pulldowns',
        fallbackFolder: 'Wide-Grip_Lat_Pulldown',
        faseConcentrica: 'Com as palmas voltadas para você, puxe a barra até a linha superior do peitoral.',
        faseExcentrica: 'Suba a barra de forma controlada alongando as dorsais.',
        dicaRespiracao: 'Expire na descida; inspire na subida.'
      };
    }
    return {
      type: 'lat_pulldown',
      folder: 'Wide-Grip_Lat_Pulldown',
      fallbackFolder: 'Close-Grip_Front_Lat_Pulldown',
      faseConcentrica: 'Puxe a barra aberta em direção ao peitoral superior deprimindo as escápulas.',
      faseExcentrica: 'Retorne a barra controladamente alongando as dorsais no topo.',
      dicaRespiracao: 'Expire ao puxar a barra para baixo; inspire na subida.'
    };
  }

  if (n.includes('remada')) {
    if (n.includes('unilateral') || n.includes('serrote')) {
      return {
        type: 'row',
        folder: 'One-Arm_Dumbbell_Row',
        fallbackFolder: 'Bent_Over_Barbell_Row',
        faseConcentrica: 'Puxe o halter em direção ao quadril mantendo o cotovelo próximo ao tronco.',
        faseExcentrica: 'Desça o halter alongando a dorsal mantendo a coluna paralela ao banco.',
        dicaRespiracao: 'Expire ao puxar o halter; inspire ao descer.'
      };
    }
    if (n.includes('cavalinho') || n.includes('t-bar')) {
      return {
        type: 'row',
        folder: 'Lying_T-Bar_Row',
        fallbackFolder: 'Bent_Over_Barbell_Row',
        faseConcentrica: 'Puxe a carga em direção ao abdômen esmagando as escápulas no topo.',
        faseExcentrica: 'Desça de forma controlada mantendo a coluna neutra.',
        dicaRespiracao: 'Expire ao puxar; inspire ao descer.'
      };
    }
    if (n.includes('curvada')) {
      return {
        type: 'row',
        folder: usaBarra || !full.includes('halter') ? 'Bent_Over_Barbell_Row' : 'Bent_Over_Two-Dumbbell_Row',
        fallbackFolder: 'Bent_Over_Barbell_Row',
        faseConcentrica: 'Com o tronco inclinado e coluna reta, puxe a barra em direção à linha do umbigo.',
        faseExcentrica: 'Estenda os braços controladamente mantendo a lombar estabilizada.',
        dicaRespiracao: 'Expire ao puxar a barra; inspire ao descer.'
      };
    }
    if (usaMaquina) {
      return {
        type: 'row',
        folder: 'Leverage_Iso_Row',
        fallbackFolder: 'Seated_Cable_Rows',
        faseConcentrica: 'Com o peito apoiado no banco, puxe as alavancas para trás contraindo o meio das costas.',
        faseExcentrica: 'Retorne o peso devagar alongando as escápulas.',
        dicaRespiracao: 'Expire ao puxar; inspire na volta.'
      };
    }
    return {
      type: 'row',
      folder: 'Seated_Cable_Rows',
      fallbackFolder: 'Bent_Over_Barbell_Row',
      faseConcentrica: 'Puxe o puxador em direção ao abdômen mantendo o peito aberto e escápulas retraídas.',
      faseExcentrica: 'Retorne estendendo os braços sem curvar excessivamente a lombar.',
      dicaRespiracao: 'Expire ao puxar em direção ao corpo; inspire ao alongar.'
    };
  }

  // =========================================================================
  // 8. PERNAS, GLÚTEOS E PANTURRILHA
  // =========================================================================
  if (n.includes('leg press')) {
    return {
      type: 'leg_press',
      folder: 'Leg_Press',
      fallbackFolder: 'Barbell_Squat',
      faseConcentrica: 'Empurre a plataforma com a planta inteira dos pés sem travar os joelhos no final.',
      faseExcentrica: 'Flexione os joelhos controladamente mantendo o quadril e a lombar firmes no encosto.',
      dicaRespiracao: 'Inspire ao descer a plataforma e solte o ar ao empurrar.'
    };
  }

  if (n.includes('extensora')) {
    return {
      type: 'leg_extension',
      folder: 'Leg_Extensions',
      fallbackFolder: 'Leg_Press',
      faseConcentrica: 'Estenda os joelhos até o topo e segure 1 segundo contraindo o quadríceps.',
      faseExcentrica: 'Desça em 2 a 3 segundos controlando o retorno do rolo.',
      dicaRespiracao: 'Expire ao estender as pernas; inspire ao descer.'
    };
  }

  if (n.includes('flexora')) {
    const isSentada = n.includes('cadeira') || n.includes('sentad');
    const isEmPe = n.includes('em pé') || n.includes('em pe') || n.includes('unilateral');
    return {
      type: 'leg_curl',
      folder: isSentada ? 'Seated_Leg_Curl' : isEmPe ? 'Standing_Leg_Curl' : 'Lying_Leg_Curls',
      fallbackFolder: 'Lying_Leg_Curls',
      faseConcentrica: 'Flexione os joelhos contraindo fortemente os posteriores de coxa.',
      faseExcentrica: 'Retorne devagar mantendo a pelve estabilizada no banco.',
      dicaRespiracao: 'Expire ao flexionar as pernas; inspire na volta.'
    };
  }

  if (n.includes('stiff') || n.includes('romeno') || n.includes('levantamento terra')) {
    if (n.includes('sumô') || n.includes('sumo')) {
      return {
        type: 'stiff',
        folder: 'Sumo_Deadlift',
        fallbackFolder: 'Barbell_Deadlift',
        faseConcentrica: 'Com base afastada, empurre o chão estendendo quadril e joelhos até ficar em pé.',
        faseExcentrica: 'Desça a barra próxima às tíbias mantendo a coluna neutra.',
        dicaRespiracao: 'Inspire antes de puxar; expire no topo.'
      };
    }
    if (n.includes('levantamento terra') && !n.includes('romeno')) {
      return {
        type: 'stiff',
        folder: 'Barbell_Deadlift',
        fallbackFolder: 'Romanian_Deadlift',
        faseConcentrica: 'Levante a barra estendendo joelhos e quadril simultaneamente com a coluna firme.',
        faseExcentrica: 'Retorne a barra ao solo projetando o quadril para trás.',
        dicaRespiracao: 'Inspire travando o abdômen; expire ao concluir a subida.'
      };
    }
    return {
      type: 'stiff',
      folder: usaBarra ? 'Romanian_Deadlift' : 'Romanian_Deadlift_With_Dumbbells',
      fallbackFolder: 'Romanian_Deadlift_With_Dumbbells',
      faseConcentrica: 'Suba o tronco estendendo o quadril e contraindo glúteos e posterior de coxa.',
      faseExcentrica: 'Projete o quadril para trás mantendo a coluna reta e joelhos levemente semiflexionados.',
      dicaRespiracao: 'Inspire na descida alongando o posterior; solte o ar ao subir.'
    };
  }

  if (n.includes('abdutora')) {
    return {
      type: 'hip_thrust',
      folder: 'Thigh_Abductor',
      fallbackFolder: 'Barbell_Hip_Thrust',
      faseConcentrica: 'Afaste as pernas lateralmente contra o apoio contraindo o glúteo médio.',
      faseExcentrica: 'Retorne de forma controlada sem deixar os pesos baterem.',
      dicaRespiracao: 'Expire ao abrir; inspire ao retornar.'
    };
  }

  if (n.includes('adutora')) {
    return {
      type: 'hip_thrust',
      folder: 'Thigh_Adductor',
      fallbackFolder: 'Leg_Press',
      faseConcentrica: 'Feche as pernas contraindo a musculatura interna das coxas (adutores).',
      faseExcentrica: 'Abra as pernas controladamente até um alongamento confortável.',
      dicaRespiracao: 'Expire ao fechar; inspire ao abrir.'
    };
  }

  if (n.includes('pélvica') || n.includes('pelvica') || n.includes('hip thrust') || n.includes('glúteo') || n.includes('gluteo')) {
    const isPolia = usaPolia || n.includes('coice');
    return {
      type: 'hip_thrust',
      folder: isPolia ? 'Glute_Kickback' : 'Barbell_Hip_Thrust',
      fallbackFolder: 'Barbell_Hip_Thrust',
      faseConcentrica: 'Eleve o quadril (ou estenda o quadril para trás) contraindo fortemente os glúteos no topo.',
      faseExcentrica: 'Retorne controladamente mantendo o abdômen firme sem hiperestender a lombar.',
      dicaRespiracao: 'Solte o ar na contração máxima; inspire ao descer.'
    };
  }

  if (n.includes('afundo') || n.includes('avanço') || n.includes('avanco') || n.includes('passada') || n.includes('búlgaro') || n.includes('bulgaro')) {
    return {
      type: 'squat',
      folder: usaBarra ? 'Barbell_Lunge' : 'Dumbbell_Lunges',
      fallbackFolder: 'Dumbbell_Lunges',
      faseConcentrica: 'Empurre o chão com o calcanhar da perna da frente para retornar à posição inicial.',
      faseExcentrica: 'Desça flexionando ambos os joelhos até formarem cerca de 90 graus.',
      dicaRespiracao: 'Inspire ao descer; expire ao subir.'
    };
  }

  if (n.includes('panturrilha') || n.includes('gêmeos') || n.includes('gemeos')) {
    const isSentado = n.includes('sentad');
    const isLeg = n.includes('leg');
    return {
      type: 'calf_raise',
      folder: isSentado ? 'Seated_Calf_Raise' : isLeg ? 'Calf_Press_On_The_Leg_Press_Machine' : 'Standing_Calf_Raises',
      fallbackFolder: 'Standing_Calf_Raises',
      faseConcentrica: 'Suba na ponta dos pés até a contração máxima da panturrilha e segure 1 segundo.',
      faseExcentrica: 'Desça os calcanhares alongando profundamente a panturrilha.',
      dicaRespiracao: 'Expire ao subir; inspire ao alongar embaixo.'
    };
  }

  if (n.includes('agachamento') || n.includes('hack')) {
    if (n.includes('hack')) {
      return {
        type: 'squat',
        folder: 'Hack_Squat',
        fallbackFolder: 'Barbell_Squat',
        faseConcentrica: 'Empurre a plataforma estendendo os joelhos com a coluna apoiada no encosto.',
        faseExcentrica: 'Desça controladamente até as coxas ficarem paralelas à plataforma.',
        dicaRespiracao: 'Inspire na descida; expire na subida.'
      };
    }
    if (n.includes('frontal')) {
      return {
        type: 'squat',
        folder: 'Front_Barbell_Squat',
        fallbackFolder: 'Barbell_Squat',
        faseConcentrica: 'Suba mantendo os cotovelos altos e o tronco vertical.',
        faseExcentrica: 'Agache controladamente mantendo os joelhos alinhados com a ponta dos pés.',
        dicaRespiracao: 'Inspire antes de descer; expire na subida.'
      };
    }
    if (n.includes('goblet') || full.includes('halter')) {
      return {
        type: 'squat',
        folder: 'Goblet_Squat',
        fallbackFolder: 'Barbell_Squat',
        faseConcentrica: 'Segurando o halter próximo ao peito, empurre o chão até ficar em pé.',
        faseExcentrica: 'Desça o quadril mantendo o peito aberto e os joelhos alinhados.',
        dicaRespiracao: 'Inspire ao descer; expire ao subir.'
      };
    }
    if (n.includes('smith')) {
      return {
        type: 'squat',
        folder: 'Smith_Machine_Squat',
        fallbackFolder: 'Barbell_Squat',
        faseConcentrica: 'Empurre a barra guiada para cima mantendo o abdômen estabilizado.',
        faseExcentrica: 'Desça controladamente até cerca de 90 graus nos joelhos.',
        dicaRespiracao: 'Inspire ao descer; expire ao subir.'
      };
    }
    return {
      type: 'squat',
      folder: 'Barbell_Squat',
      fallbackFolder: 'Leg_Press',
      faseConcentrica: 'Empurre o chão com a planta inteira dos pés retornando à posição em pé.',
      faseExcentrica: 'Agache levando o quadril para trás e mantendo os joelhos alinhados com os pés.',
      dicaRespiracao: 'Inspire antes de descer e solte o ar na metade final da subida.'
    };
  }

  // =========================================================================
  // 9. ABDÔMEN E CORE (Prancha, Infra, Polia, Bicicleta, Supra)
  // =========================================================================
  if (n.includes('prancha')) {
    return {
      type: 'crunch',
      folder: 'Plank',
      fallbackFolder: 'Crunches',
      faseConcentrica: 'Mantenha o abdômen e glúteos fortemente contraídos sustentando o corpo alinhado.',
      faseExcentrica: 'Evite deixar o quadril cair ou subir; mantenha a coluna neutra.',
      dicaRespiracao: 'Respire de forma contínua e controlada sem prender o ar.'
    };
  }

  if (n.includes('abdominal') || g.includes('abdômen') || g.includes('abdomen') || g.includes('core')) {
    if (n.includes('infra') || n.includes('pernas')) {
      return {
        type: 'crunch',
        folder: 'Flat_Bench_Lying_Leg_Raise',
        fallbackFolder: 'Crunches',
        faseConcentrica: 'Eleve as pernas enrolando a pelve e contraindo a parte inferior do abdômen.',
        faseExcentrica: 'Desça as pernas devagar sem tirar a lombar do apoio.',
        dicaRespiracao: 'Expire ao elevar as pernas; inspire ao descer.'
      };
    }
    if (usaPolia) {
      return {
        type: 'crunch',
        folder: 'Cable_Crunch',
        fallbackFolder: 'Crunches',
        faseConcentrica: 'Ajoelhado, flexione a coluna aproximando as costelas do quadril contra a resistência do cabo.',
        faseExcentrica: 'Retorne alongando o abdômen sem movimentar o quadril.',
        dicaRespiracao: 'Expire soltando todo o ar ao descer; inspire ao subir.'
      };
    }
    return {
      type: 'crunch',
      folder: 'Crunches',
      fallbackFolder: 'Plank',
      faseConcentrica: 'Enrole o tronco aproximando as costelas do quadril e soltando todo o ar.',
      faseExcentrica: 'Desça vértebra por vértebra mantendo o abdômen sob tensão.',
      dicaRespiracao: 'Expire profundamente ao subir; inspire ao descer.'
    };
  }

  // Fallback por Grupo Muscular caso seja um exercício com nome incomum
  if (g.includes('peito')) {
    return {
      type: 'bench_press',
      folder: usaBarra ? 'Barbell_Bench_Press_-_Medium_Grip' : 'Dumbbell_Bench_Press',
      fallbackFolder: 'Dumbbell_Bench_Press',
      faseConcentrica: 'Empurre a carga contraindo o peitoral até estender os braços.',
      faseExcentrica: 'Retorne de forma controlada alongando a musculatura peitoral.',
      dicaRespiracao: 'Expire na fase de força; inspire no retorno.'
    };
  }

  if (g.includes('costas') || g.includes('dorsal')) {
    return {
      type: 'row',
      folder: 'Seated_Cable_Rows',
      fallbackFolder: 'Wide-Grip_Lat_Pulldown',
      faseConcentrica: 'Puxe a carga retraindo as escápulas e contraindo as dorsais.',
      faseExcentrica: 'Alongue os braços de forma controlada mantendo a coluna firme.',
      dicaRespiracao: 'Expire ao puxar; inspire ao alongar.'
    };
  }

  return {
    type: 'squat',
    folder: 'Barbell_Squat',
    fallbackFolder: 'Leg_Press',
    faseConcentrica: 'Execute a fase de força com estabilidade articular e controle.',
    faseExcentrica: 'Retorne à posição inicial em 2 segundos controlando o movimento.',
    dicaRespiracao: 'Expire ao fazer força; inspire ao retornar.'
  };
}

export const ExerciseDemo: React.FC<ExerciseDemoProps> = ({ exercise }) => {
  const meta = getExerciseVisualMeta(exercise.nome, exercise.grupoMuscular, exercise.equipamento);
  const [frameIndex, setFrameIndex] = useState<0 | 1>(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [useFallbackFolder, setUseFallbackFolder] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [viewMode, setViewMode] = useState<'gif' | 'biomecanica'>('gif');

  // Reseta estado de fallback se o exercício mudar
  useEffect(() => {
    setUseFallbackFolder(false);
    setImageError(false);
  }, [exercise.nome, exercise.equipamento]);

  // Alterna continuamente entre o frame inicial (0) e final (1) para criar o efeito GIF
  useEffect(() => {
    if (!isPlaying) return;
    const timer = setInterval(() => {
      setFrameIndex(prev => (prev === 0 ? 1 : 0));
    }, 900);
    return () => clearInterval(timer);
  }, [isPlaying]);

  const activeFolder = useFallbackFolder ? meta.fallbackFolder : meta.folder;
  const frame0Url = `${GITHUB_EXERCISE_BASE}/${activeFolder}/0.jpg`;
  const frame1Url = `${GITHUB_EXERCISE_BASE}/${activeFolder}/1.jpg`;

  const handleImgError = () => {
    if (!useFallbackFolder && meta.fallbackFolder !== meta.folder) {
      setUseFallbackFolder(true);
    } else {
      setImageError(true);
    }
  };

  const activeMode = imageError ? 'biomecanica' : viewMode;
  const isConcentric = frameIndex === 1;

  const youtubeQuery = encodeURIComponent(`como executar ${exercise.nome} ${exercise.equipamento || ''} musculação`);

  return (
    <div className="mt-3 rounded-2xl bg-slate-950/90 border border-slate-800 overflow-hidden animate-in fade-in duration-200">
      {/* Barra de Topo do Player de Demonstração */}
      <div className="px-3.5 py-2 bg-slate-900/90 border-b border-slate-800 flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-500/15 text-emerald-400 text-[10px] font-bold uppercase tracking-wider border border-emerald-500/20">
            <Activity className="w-3 h-3" />
            GIF de Execução
          </span>
          <span className="text-[11px] font-medium text-slate-400">
            Demonstração do movimento
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          {!imageError && !exercise.gifUrl && (
            <button
              type="button"
              onClick={() => setViewMode(prev => (prev === 'gif' ? 'biomecanica' : 'gif'))}
              className="px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-[10px] font-semibold text-slate-300 transition"
            >
              {activeMode === 'gif' ? 'Ver Vetor 2D' : 'Ver Fotos Reais'}
            </button>
          )}
          <button
            type="button"
            onClick={() => setIsPlaying(!isPlaying)}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
            title={isPlaying ? 'Pausar animação' : 'Reproduzir animação'}
          >
            {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 fill-current" />}
          </button>
        </div>
      </div>

      {/* Área Visual + Instruções Lado a Lado */}
      <div className="p-3.5 grid grid-cols-1 sm:grid-cols-12 gap-4 items-center">
        {/* Visor da Animação (GIF Customizado, Fotos em Loop ou Vetor Biomecânico) */}
        <div className="sm:col-span-5 relative aspect-[4/3] rounded-xl bg-slate-900 border border-slate-800 overflow-hidden flex items-center justify-center">
          {exercise.gifUrl ? (
            <img
              src={exercise.gifUrl}
              alt={exercise.nome}
              className="w-full h-full object-cover"
              onError={() => setImageError(true)}
            />
          ) : activeMode === 'gif' ? (
            <div className="relative w-full h-full">
              <img
                src={frame0Url}
                alt={`${exercise.nome} - Início`}
                onError={handleImgError}
                className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-300 ${
                  frameIndex === 0 ? 'opacity-100' : 'opacity-0'
                }`}
              />
              <img
                src={frame1Url}
                alt={`${exercise.nome} - Contração`}
                onError={handleImgError}
                className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-300 ${
                  frameIndex === 1 ? 'opacity-100' : 'opacity-0'
                }`}
              />
            </div>
          ) : (
            <BiomechanicalSvg type={meta.type} isConcentric={isConcentric} />
          )}
        </div>

        {/* Guia Biomecânico Passo a Passo (Estático, sem piscar) */}
        <div className="sm:col-span-7 space-y-2.5 text-xs">
          <div className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-800 text-slate-300">
            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 block">
              Fase Concêntrica (Força)
            </span>
            <p className="mt-0.5 leading-relaxed">{meta.faseConcentrica}</p>
          </div>

          <div className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-800 text-slate-300">
            <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400 block">
              Fase Excêntrica (Controle)
            </span>
            <p className="mt-0.5 leading-relaxed">{meta.faseExcentrica}</p>
          </div>

          <div className="flex items-center justify-between pt-1 text-[11px] text-slate-400">
            <span>💨 <strong>Respiração:</strong> {meta.dicaRespiracao}</span>
            <a
              href={`https://www.youtube.com/results?search_query=${youtubeQuery}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-emerald-400 hover:text-emerald-300 font-semibold shrink-0 ml-2"
            >
              <span>Vídeo</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

/**
 * Ilustração Vetorial Animada 100% Offline (Funciona mesmo sem internet na academia)
 */
const BiomechanicalSvg: React.FC<{ type: MovementType; isConcentric: boolean }> = ({ type, isConcentric }) => {
  return (
    <svg viewBox="0 0 200 150" className="w-full h-full p-2 select-none">
      <defs>
        <radialGradient id="muscleGlow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#10b981" stopOpacity="0.6" />
          <stop offset="100%" stopColor="#10b981" stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* Grid de fundo técnico */}
      <line x1="20" y1="130" x2="180" y2="130" stroke="#334155" strokeWidth="2" strokeLinecap="round" />
      <line x1="100" y1="15" x2="100" y2="130" stroke="#1e293b" strokeWidth="1" strokeDasharray="3 3" />

      {/* SUPINO / PEITO */}
      {type === 'bench_press' && (
        <g>
          <rect x="45" y="95" width="90" height="8" rx="4" fill="#475569" />
          <line x1="60" y1="103" x2="60" y2="130" stroke="#475569" strokeWidth="4" />
          <line x1="120" y1="103" x2="120" y2="130" stroke="#475569" strokeWidth="4" />
          <circle cx="55" cy="85" r="8" fill="#94a3b8" />
          <line x1="65" y1="90" x2="125" y2="90" stroke="#cbd5e1" strokeWidth="8" strokeLinecap="round" />
          <circle cx="80" cy="85" r={isConcentric ? 18 : 12} fill="url(#muscleGlow)" />
          <line
            x1="80"
            y1="88"
            x2="80"
            y2={isConcentric ? 45 : 72}
            stroke="#10b981"
            strokeWidth="5"
            strokeLinecap="round"
            className="transition-all duration-700"
          />
          <line
            x1="62"
            y1={isConcentric ? 45 : 72}
            x2="98"
            y2={isConcentric ? 45 : 72}
            stroke="#38bdf8"
            strokeWidth="4"
            strokeLinecap="round"
            className="transition-all duration-700"
          />
          <circle cx="62" cy={isConcentric ? 45 : 72} r="6" fill="#0284c7" className="transition-all duration-700" />
          <circle cx="98" cy={isConcentric ? 45 : 72} r="6" fill="#0284c7" className="transition-all duration-700" />
        </g>
      )}

      {/* AGACHAMENTO / LEG PRESS / STIFF */}
      {(type === 'squat' || type === 'leg_press' || type === 'stiff' || type === 'calf_raise') && (
        <g>
          <circle cx="100" cy={isConcentric ? 32 : 58} r="9" fill="#94a3b8" className="transition-all duration-700" />
          <line
            x1="100"
            y1={isConcentric ? 42 : 68}
            x2={isConcentric ? 100 : 88}
            y2={isConcentric ? 82 : 98}
            stroke="#cbd5e1"
            strokeWidth="7"
            strokeLinecap="round"
            className="transition-all duration-700"
          />
          <circle cx="96" cy={isConcentric ? 90 : 102} r="20" fill="url(#muscleGlow)" />
          <line
            x1={isConcentric ? 100 : 88}
            y1={isConcentric ? 82 : 98}
            x2={isConcentric ? 102 : 115}
            y2={isConcentric ? 106 : 102}
            stroke="#10b981"
            strokeWidth="7"
            strokeLinecap="round"
            className="transition-all duration-700"
          />
          <line
            x1={isConcentric ? 102 : 115}
            y1={isConcentric ? 106 : 102}
            x2="102"
            y2="128"
            stroke="#94a3b8"
            strokeWidth="6"
            strokeLinecap="round"
            className="transition-all duration-700"
          />
          <line
            x1="75"
            y1={isConcentric ? 44 : 70}
            x2="125"
            y2={isConcentric ? 44 : 70}
            stroke="#38bdf8"
            strokeWidth="4"
            className="transition-all duration-700"
          />
        </g>
      )}

      {/* ROSCA BÍCEPS / TRÍCEPS / ELEVAÇÃO LATERAL / DESENVOLVIMENTO */}
      {(type === 'bicep_curl' || type === 'tricep_pushdown' || type === 'lateral_raise' || type === 'shoulder_press') && (
        <g>
          <circle cx="100" cy="36" r="9" fill="#94a3b8" />
          <line x1="100" y1="46" x2="100" y2="92" stroke="#cbd5e1" strokeWidth="8" strokeLinecap="round" />
          <line x1="100" y1="92" x2="94" y2="128" stroke="#64748b" strokeWidth="6" strokeLinecap="round" />
          <line x1="100" y1="92" x2="106" y2="128" stroke="#64748b" strokeWidth="6" strokeLinecap="round" />
          <circle cx="112" cy="58" r="18" fill="url(#muscleGlow)" />
          <line x1="104" y1="52" x2="112" y2="74" stroke="#94a3b8" strokeWidth="5" strokeLinecap="round" />
          <line
            x1="112"
            y1="74"
            x2={isConcentric ? 118 : 122}
            y2={
              type === 'tricep_pushdown'
                ? isConcentric ? 98 : 62
                : isConcentric ? 48 : 96
            }
            stroke="#10b981"
            strokeWidth="5"
            strokeLinecap="round"
            className="transition-all duration-700"
          />
          <circle
            cx={isConcentric ? 118 : 122}
            cy={
              type === 'tricep_pushdown'
                ? isConcentric ? 98 : 62
                : isConcentric ? 48 : 96
            }
            r="6"
            fill="#38bdf8"
            className="transition-all duration-700"
          />
        </g>
      )}

      {/* PUXADA / REMADA / EXTENSORA / FLEXORA / HIP THRUST / CRUNCH */}
      {(type === 'lat_pulldown' || type === 'row' || type === 'leg_extension' || type === 'leg_curl' || type === 'hip_thrust' || type === 'crunch') && (
        <g>
          <line x1="145" y1="20" x2="145" y2="130" stroke="#475569" strokeWidth="4" />
          <circle cx="95" cy="48" r="9" fill="#94a3b8" />
          <line x1="95" y1="58" x2="95" y2="98" stroke="#cbd5e1" strokeWidth="8" strokeLinecap="round" />
          <circle cx="95" cy="72" r="20" fill="url(#muscleGlow)" />
          <line
            x1="95"
            y1="66"
            x2={isConcentric ? 105 : 138}
            y2={type === 'lat_pulldown' ? (isConcentric ? 62 : 28) : 66}
            stroke="#10b981"
            strokeWidth="6"
            strokeLinecap="round"
            className="transition-all duration-700"
          />
          <line
            x1="145"
            y1={type === 'lat_pulldown' ? 20 : 66}
            x2={isConcentric ? 105 : 138}
            y2={type === 'lat_pulldown' ? (isConcentric ? 62 : 28) : 66}
            stroke="#38bdf8"
            strokeWidth="2"
            strokeDasharray="2 2"
            className="transition-all duration-700"
          />
        </g>
      )}
    </svg>
  );
};
