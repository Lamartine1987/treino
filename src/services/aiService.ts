import { Anamnesis, WorkoutDivision, WorkoutLog, WorkoutPlan } from '../types';

export const GEMINI_API_KEY = (import.meta.env.VITE_GEMINI_API_KEY || "").trim();

export async function gerarTreinoComIA(
  alunoNome: string,
  alunoId: string,
  anamnese: Anamnesis,
  customPromptExtra?: string
): Promise<WorkoutPlan> {
  // Se houver chave da API do Gemini configurada, chama o modelo Gemini 2.5 / 2.0 Flash
  if (GEMINI_API_KEY && GEMINI_API_KEY !== "SUA_CHAVE_GEMINI_AQUI") {
    try {
      return await chamarGeminiApi(alunoNome, alunoId, anamnese, customPromptExtra);
    } catch (err) {
      console.warn("Falha na chamada da API Gemini, usando motor de regras inteligentes de fallback:", err);
    }
  }

  // Fallback imediato: gerador algorítmico baseado em cinesiologia e fisiologia do exercício
  return gerarTreinoBaseadoEmRegras(alunoNome, alunoId, anamnese, customPromptExtra);
}

async function chamarGeminiApi(
  alunoNome: string,
  alunoId: string,
  anamnese: Anamnesis,
  customPromptExtra?: string
): Promise<WorkoutPlan> {
  const peso = anamnese.pesoKg || 72;
  const alturaM = (anamnese.alturaCm || 172) / 100;
  const imc = (peso / (alturaM * alturaM)).toFixed(1);

  const qtdExerciciosPorSessao =
    anamnese.tempoMinutos <= 30 ? "4 a 5 exercícios" :
    anamnese.tempoMinutos <= 45 ? "5 a 6 exercícios" :
    anamnese.tempoMinutos <= 60 ? "6 a 7 exercícios" : "7 a 8 exercícios";

  const diretrizPorObjetivo: Record<Anamnesis['objetivo'], string> = {
    emagrecimento:
      "FOCO EM EMAGRECIMENTO E DEFINIÇÃO METABÓLICA: Priorize exercícios multiarticulares de alto gasto calórico (Agachamentos, Leg Press, Afundo/Passada, Remadas, Puxadas, Supinos, Prancha/Abdominais). Use faixas de 12 a 15 repetições (ou 15 a 20 em isoladores/core), intervalos de descanso curtos (30s a 50s) para manter a frequência cardíaca elevada e maximizar o efeito EPOC (queima de gordura pós-treino), e cargas moderadas que permitam cadência dinâmica sem perder a técnica. Inclua nas orientações gerais recomendação de cardio/HIIT pós-treino.",
    hipertrofia:
      "FOCO EM GANHO DE MASSA MUSCULAR (HIPERTROFIA): Priorize tensão mecânica e estresse metabólico equilibrados, combinando exercícios básicos multiarticulares e isoladores estratégicos para todas as porções musculares. Use faixas de 8 a 12 repetições, intervalos de descanso de 60s a 90s e cargas moderadas a altas com controle excêntrico.",
    forca:
      "FOCO EM GANHO DE FORÇA PURA E DENSIDADE: Priorize levantamentos básicos compostos pesados no início do treino (Supino com Barra/Halteres, Desenvolvimento, Remada Curvada/Baixa, Agachamento, Leg Press, Stiff). Use faixas de 4 a 6 repetições (ou 6 a 8 nos acessórios), intervalos de descanso mais longos (90s a 120s) para recuperação neural completa de ATP-CP e cargas elevadas.",
    condicionamento:
      "FOCO EM SAÚDE GERAL, RESISTÊNCIA MUSCULAR E CONDICIONAMENTO: Priorize equilíbrio postural, fortalecimento de core/estabilizadores, mobilidade segura e resistência muscular localizada. Use faixas de 12 a 15 repetições, intervalos de 45s a 60s e exercícios fluidos e seguros para as articulações."
  };

  const prompt = `
Você é um treinador de elite de musculação e especialista em fisiologia do exercício e biomecânica.
Elabore um programa de treinamento 100% personalizado em formato JSON estrito, adaptado especificamente às características físicas e de rotina deste aluno:

PERFIL BIOMÉTRICO E ROTINA DO ALUNO:
- Nome: ${alunoNome}
- Idade: ${anamnese.idade ? `${anamnese.idade} anos` : "Não informada"}
- Sexo / Gênero: ${anamnese.genero || "Não informado"}
- Peso Corporal: ${anamnese.pesoKg ? `${anamnese.pesoKg} kg` : "Não informado"}
- Altura: ${anamnese.alturaCm ? `${anamnese.alturaCm} cm` : "Não informada"}
- IMC Calculado: ${imc} kg/m²
- Objetivo Principal: ${anamnese.objetivo.toUpperCase()}
- Metodologia Obrigatória para este Objetivo: ${diretrizPorObjetivo[anamnese.objetivo]}
- Nível de Experiência: ${anamnese.experiencia}
- Frequência Semanal: ${anamnese.diasSemana} dias por semana
- Tempo por Sessão: ${anamnese.tempoMinutos} minutos (prescreva ${qtdExerciciosPorSessao} por divisão para caber exatamente nesse tempo)
- Local / Equipamentos Disponíveis: ${anamnese.tipoAmbiente}
- Dores ou Limitações Articulares: ${anamnese.limitacoes?.length ? anamnese.limitacoes.join(", ") : "Nenhuma dor ou limitação"}
- Observações Adicionais: ${anamnese.observacoes || "Nenhuma"}
${customPromptExtra ? `- Instruções Específicas do Professor: ${customPromptExtra}` : ""}

DIRETRIZES TÉCNICAS OBRIGATÓRIAS:
1. Divisão de Treino: Estruture a divisão ideal para ${anamnese.diasSemana} dias/semana (Ex: 2x = AB Corpo Inteiro; 3x = ABC Push/Pull/Legs ou AB; 4x = AB Upper/Lower ou ABCD; 5x a 6x = ABC Push/Pull/Legs ou ABCDE).
2. Calibragem de Cargas (cargaSugeridaKg): Calcule uma carga inicial realista em kg para cada exercício levando em conta o peso corporal (${peso} kg), gênero (${anamnese.genero || 'masculino'}), idade (${anamnese.idade || 25} anos) e experiência (${anamnese.experiencia}).
3. Proteção Articular: Se houver limitações (${anamnese.limitacoes?.length ? anamnese.limitacoes.join(", ") : "nenhuma"}), exclua exercícios de risco para essas articulações e priorize variações biomecanicamente seguras.
4. Equipamentos: Respeite o ambiente '${anamnese.tipoAmbiente}' (se for 'halteres_apenas', use apenas halteres, barra e peso corporal; se 'academia_completa', combine máquinas, polias e pesos livres).
5. Nomenclatura dos Exercícios: Use nomes clássicos em português (ex: Supino Reto com Halteres, Supino Inclinado, Crucifixo, Desenvolvimento com Halteres, Elevação Lateral, Tríceps Corda na Polia, Tríceps Testa, Puxada Frontal no Pulley, Remada Baixa Sentada, Remada Curvada, Rosca Direta, Rosca Martelo, Agachamento Livre, Leg Press 45°, Cadeira Extensora, Mesa Flexora, Stiff com Halteres, Elevação Pélvica, Panturrilha em Pé, Abdominal Supra).
6. Em 'orientacoesGerais', escreva um parágrafo motivador e técnico explicando ao aluno como este treino foi desenhado especificamente para seus ${peso} kg, ${anamnese.alturaCm} cm (IMC ${imc}), seu objetivo de ${anamnese.objetivo} e suas articulações.

Responda APENAS um objeto JSON válido no seguinte formato:
{
  "titulo": "Título Personalizado do Plano",
  "orientacoesGerais": "Explicação técnica personalizada sobre a divisão, cargas e cuidados para o perfil do aluno.",
  "divisoes": [
    {
      "letra": "A",
      "nome": "Treino A - Grupos Musculares",
      "focoMuscular": ["Peitoral", "Tríceps", "Ombros"],
      "exercicios": [
        {
          "nome": "Supino Reto com Halteres",
          "grupoMuscular": "Peitoral",
          "equipamento": "Halteres e Banco",
          "series": 4,
          "repeticoes": "8-12",
          "descansoSegundos": 75,
          "cargaSugeridaKg": 16,
          "instrucoes": "Dica biomecânica clara de execução e postura.",
          "exercicioSubstituto": "Supino na Máquina Articulada"
        }
      ]
    }
  ]
}
`;

  // Descobre automaticamente os modelos disponíveis na conta caso necessário
  async function getAvailableModels(): Promise<string[]> {
    try {
      const listResp = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models?key=${GEMINI_API_KEY}`
      );
      if (!listResp.ok) return [];
      const listData = await listResp.json();
      const models: any[] = listData.models || [];
      return models
        .filter(
          (m) =>
            Array.isArray(m.supportedGenerationMethods) &&
            m.supportedGenerationMethods.includes("generateContent") &&
            m.name?.includes("gemini")
        )
        .map((m) => m.name as string);
    } catch {
      return [];
    }
  }

  const defaultCandidates = [
    "models/gemini-3.0-flash",
    "models/gemini-3-flash-preview",
    "models/gemini-3.0-pro",
    "models/gemini-2.5-pro",
    "models/gemini-2.5-flash-lite"
  ];

  const discovered = await getAvailableModels();
  // Prioriza modelos flash descobertos na conta + candidatos padrão (sem duplicatas)
  const flashDiscovered = discovered.filter((m) => m.includes("flash") && !m.includes("2.5-flash"));
  const candidateModels = Array.from(
    new Set(["models/gemini-3.0-flash", ...flashDiscovered, ...discovered, ...defaultCandidates])
  );

  let lastError: any = null;
  let data: any = null;

  for (const modelName of candidateModels) {
    const url = `https://generativelanguage.googleapis.com/v1beta/${modelName}:generateContent?key=${GEMINI_API_KEY}`;
    try {
      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ role: "user", parts: [{ text: prompt }] }],
          generationConfig: {
            responseMimeType: "application/json",
            temperature: 0.4
          }
        })
      });

      if (response.ok) {
        data = await response.json();
        console.info(`✅ Treino gerado com sucesso pela IA (${modelName})!`);
        break;
      } else {
        const errText = await response.text();
        lastError = new Error(`Erro Gemini (${modelName}) HTTP ${response.status}: ${errText}`);
      }
    } catch (err) {
      lastError = err;
    }
  }

  if (!data) {
    throw lastError || new Error("Não foi possível obter resposta dos endpoints Gemini.");
  }

  const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!rawText) throw new Error("Resposta vazia da IA");

  // Limpa possíveis blocos markdown ```json ... ``` caso o modelo inclua
  const cleanedJson = rawText.replace(/^```json\s*/i, "").replace(/```\s*$/i, "").trim();
  const parsed = JSON.parse(cleanedJson);

  return {
    id: 'treino_' + Date.now(),
    alunoId,
    titulo: parsed.titulo || `Treino Personalizado - ${anamnese.objetivo}`,
    criadoPor: 'ia',
    dataCriacao: new Date().toISOString(),
    ativo: true,
    fase: 1,
    metaCiclos: 6,
    orientacoesGerais: parsed.orientacoesGerais,
    divisoes: (parsed.divisoes || []).map((div: any, idx: number) => ({
      id: 'div_' + (idx + 1),
      letra: div.letra || String.fromCharCode(65 + idx),
      nome: div.nome || `Treino ${String.fromCharCode(65 + idx)}`,
      focoMuscular: div.focoMuscular || [],
      exercicios: (div.exercicios || []).map((ex: any, eIdx: number) => ({
        id: `ex_${idx + 1}_${eIdx + 1}`,
        nome: ex.nome,
        grupoMuscular: ex.grupoMuscular || 'Geral',
        equipamento: ex.equipamento || 'Livre',
        series: Number(ex.series) || 3,
        repeticoes: String(ex.repeticoes || '10-12'),
        descansoSegundos: Number(ex.descansoSegundos) || 60,
        cargaSugeridaKg: ex.cargaSugeridaKg ? Number(ex.cargaSugeridaKg) : undefined,
        instrucoes: ex.instrucoes || 'Execute o movimento com amplitude segura e cadência controlada.',
        exercicioSubstituto: ex.exercicioSubstituto || 'Variação equivalente na máquina'
      }))
    }))
  };
}

/**
 * Evolui a ficha atual para a próxima Fase do Mesociclo (Fase 2, Fase 3...),
 * trocando exercícios por novos estímulos/angulações e calibrando as cargas com base
 * no histórico real conquistado pelo aluno.
 */
export async function evoluirTreinoComIA(
  alunoNome: string,
  alunoId: string,
  anamnese: Anamnesis,
  planoAtual: WorkoutPlan,
  historicoLogs: WorkoutLog[]
): Promise<WorkoutPlan> {
  const novaFase = (planoAtual.fase || 1) + 1;

  // Resume os exercícios atuais e as cargas que o aluno já alcançou
  const resumoExerciciosAtuais = planoAtual.divisoes
    .map(
      (div) =>
        `${div.nome}: ` +
        div.exercicios
          .map((ex) => `${ex.nome} (${ex.series}x${ex.repeticoes} com ${ex.cargaSugeridaKg || 10}kg)`)
          .join(', ')
    )
    .join(' | ');

  const totalTreinosConcluidos = historicoLogs.length;

  const instrucaoEvolucao = `
EVOLUÇÃO DE PERIODIZAÇÃO - TRANSIÇÃO PARA FASE ${novaFase} (NOVO MESOCICLO):
- O aluno concluiu ${totalTreinosConcluidos} sessões e estava executando a Fase ${planoAtual.fase || 1} com os seguintes exercícios e cargas consolidadas: ${resumoExerciciosAtuais}.
- REGRA OBRIGATÓRIA DE TROCA DE ESTÍMULOS: Substitua pelo menos 70% a 80% dos exercícios anteriores por NOVAS VARIAÇÕES BIOMECÂNICAS, novas angulações ou diferentes equipamentos para os mesmos grupos musculares (exemplo: se fazia Supino Reto com Barra, mude para Supino Reto com Halteres ou Supino Declinado/Máquina; se fazia Desenvolvimento Militar com Barra, mude para Desenvolvimento Arnold ou Desenvolvimento com Halteres; se fazia Puxada Aberta, mude para Puxada Triângulo ou Barra Fixa; se fazia Agachamento Livre, mude para Leg Press 45° ou Agachamento Hack/Búlgaro).
- CALIBRAGEM DE CARGAS EVOLUÍDAS: Utilize as cargas que o aluno já domina na ficha anterior para definir cargas iniciais desafiadoras e proporcionais nos novos exercícios da Fase ${novaFase}.
- No 'titulo', inclua "Fase ${novaFase}". Em 'orientacoesGerais', explique ao aluno quais novos estímulos foram introduzidos nesta Fase ${novaFase} para quebrar o platô e continuar evoluindo.
`.trim();

  if (GEMINI_API_KEY && GEMINI_API_KEY !== "SUA_CHAVE_GEMINI_AQUI") {
    try {
      const novoPlano = await chamarGeminiApi(alunoNome, alunoId, anamnese, instrucaoEvolucao);
      return {
        ...novoPlano,
        fase: novaFase,
        metaCiclos: planoAtual.metaCiclos || 6,
        titulo: novoPlano.titulo.includes(`Fase ${novaFase}`)
          ? novoPlano.titulo
          : `Fase ${novaFase} • ${novoPlano.titulo}`
      };
    } catch (err) {
      console.warn("Falha na evolução via API Gemini, aplicando evolução algorítmica de exercícios:", err);
    }
  }

  // Fallback algorítmico caso offline: troca os exercícios principais pelo seu exercicioSubstituto ou variação equivalente e progride a carga em +5% a +10%
  const divisoesEvoluidas: WorkoutDivision[] = planoAtual.divisoes.map((div) => ({
    ...div,
    exercicios: div.exercicios.map((ex) => {
      const novoNome = ex.exercicioSubstituto && ex.exercicioSubstituto !== 'Variação equivalente na máquina'
        ? ex.exercicioSubstituto
        : `${ex.nome} (Variação Fase ${novaFase})`;
      const cargaAntiga = ex.cargaSugeridaKg || 12;
      const novaCarga = Math.max(2, Math.round(cargaAntiga * 1.08));

      return {
        ...ex,
        nome: novoNome,
        exercicioSubstituto: ex.nome,
        cargaAnteriorKg: cargaAntiga,
        cargaSugeridaKg: novaCarga,
        progressaoAplicada: 'subiu'
      };
    })
  }));

  return {
    ...planoAtual,
    id: 'treino_' + Date.now(),
    dataCriacao: new Date().toISOString(),
    fase: novaFase,
    metaCiclos: planoAtual.metaCiclos || 6,
    titulo: `Fase ${novaFase} • Periodização Evoluída (${anamnese.objetivo.toUpperCase()})`,
    orientacoesGerais: `Bem-vindo à Fase ${novaFase}! Os exercícios e angulações foram renovados para gerar novos estímulos neuromusculares, evitar estagnação e aproveitar a base de força construída na Fase ${novaFase - 1}.`,
    divisoes: divisoesEvoluidas
  };
}

/**
 * Motor de prescrição algorítmica caso o usuário não tenha configurado a API Key de imediato.
 * Baseia-se em divisões consolidadas da musculação (Full Body, AB, ABC, ABCD).
 */
export function gerarTreinoBaseadoEmRegras(
  alunoNome: string,
  alunoId: string,
  anamnese: Anamnesis,
  customPromptExtra?: string
): WorkoutPlan {
  const { diasSemana, experiencia, objetivo, limitacoes = [] } = anamnese;

  const temDorJoelho = limitacoes.includes('joelho');
  const temDorOmbro = limitacoes.includes('ombro');
  const temDorLombar = limitacoes.includes('lombar');

  const divisoes: WorkoutDivision[] = [];

  // Configuração de repetições por objetivo
  const repConfig = {
    hipertrofia: { reps: '8-12', series: experiencia === 'iniciante' ? 3 : 4, descanso: 75 },
    emagrecimento: { reps: '12-15', series: 3, descanso: 45 },
    forca: { reps: '4-6', series: 4, descanso: 120 },
    condicionamento: { reps: '15-20', series: 3, descanso: 45 }
  }[objetivo] || { reps: '10-12', series: 3, descanso: 60 };

  // Estrutura de Divisão:
  // 2 ou 3 dias: Full Body ou ABC
  // 4 dias: AB (Upper / Lower)
  // 5 ou 6 dias: ABC (Push / Pull / Legs)
  if (diasSemana <= 2) {
    // Full Body A e B
    divisoes.push({
      id: 'div_1',
      letra: 'A',
      nome: 'Treino A - Corpo Inteiro (Foco Empurrar)',
      focoMuscular: ['Peito', 'Quadríceps', 'Ombros', 'Tríceps'],
      exercicios: [
        {
          id: 'ex_1_1',
          nome: temDorOmbro ? 'Supino com Halteres Pegada Neutra' : 'Supino Reto com Barra',
          grupoMuscular: 'Peitoral',
          equipamento: 'Banco e Halteres',
          series: repConfig.series,
          repeticoes: repConfig.reps,
          descansoSegundos: repConfig.descanso,
          cargaSugeridaKg: 16,
          instrucoes: 'Mantenha as escápulas aduzidas e os pés firmes no chão.',
          exercicioSubstituto: 'Supino na Máquina Articulada'
        },
        {
          id: 'ex_1_2',
          nome: temDorJoelho ? 'Cadeira Extensora (Amplitude Controlada)' : 'Leg Press 45°',
          grupoMuscular: 'Quadríceps',
          equipamento: 'Máquina',
          series: repConfig.series,
          repeticoes: repConfig.reps,
          descansoSegundos: repConfig.descanso,
          cargaSugeridaKg: 60,
          instrucoes: 'Não hiperestenda os joelhos no topo do movimento.',
          exercicioSubstituto: 'Agachamento Globet com Halter'
        },
        {
          id: 'ex_1_3',
          nome: temDorOmbro ? 'Elevação Lateral com Halteres Leves' : 'Desenvolvimento com Halteres',
          grupoMuscular: 'Ombros',
          equipamento: 'Halteres',
          series: repConfig.series,
          repeticoes: repConfig.reps,
          descansoSegundos: repConfig.descanso,
          cargaSugeridaKg: 8,
          instrucoes: 'Eleve os cotovelos sem encolher o pescoço.',
          exercicioSubstituto: 'Desenvolvimento na Máquina'
        },
        {
          id: 'ex_1_4',
          nome: 'Tríceps Corda na Polia',
          grupoMuscular: 'Tríceps',
          equipamento: 'Polia Alta',
          series: repConfig.series,
          repeticoes: repConfig.reps,
          descansoSegundos: repConfig.descanso,
          cargaSugeridaKg: 20,
          instrucoes: 'Abra a corda no final da descida para contração total.',
          exercicioSubstituto: 'Tríceps Testa com Halteres'
        },
        {
          id: 'ex_1_5',
          nome: 'Abdominal Supra no Solo',
          grupoMuscular: 'Abdômen',
          equipamento: 'Colchonete',
          series: 3,
          repeticoes: '15-20',
          descansoSegundos: 45,
          instrucoes: 'Expire todo o ar no topo da contração.',
          exercicioSubstituto: 'Prancha Isométrica'
        }
      ]
    });

    divisoes.push({
      id: 'div_2',
      letra: 'B',
      nome: 'Treino B - Corpo Inteiro (Foco Puxar & Posterior)',
      focoMuscular: ['Costas', 'Posterior de Coxa', 'Bíceps', 'Panturrilha'],
      exercicios: [
        {
          id: 'ex_2_1',
          nome: 'Puxada Frontal no Pulley',
          grupoMuscular: 'Dorsal',
          equipamento: 'Máquina Polia',
          series: repConfig.series,
          repeticoes: repConfig.reps,
          descansoSegundos: repConfig.descanso,
          cargaSugeridaKg: 35,
          instrucoes: 'Puxe a barra em direção ao peitoral superior sem balançar o tronco.',
          exercicioSubstituto: 'Graviton / Barra Fixa Assistida'
        },
        {
          id: 'ex_2_2',
          nome: temDorLombar ? 'Remada Baixa Sentada no Triângulo' : 'Remada Curvada com Halteres',
          grupoMuscular: 'Costas (Espessura)',
          equipamento: 'Polia Baixa',
          series: repConfig.series,
          repeticoes: repConfig.reps,
          descansoSegundos: repConfig.descanso,
          cargaSugeridaKg: 30,
          instrucoes: 'Mantenha o peito aberto e concentre a força nas costas, não nos braços.',
          exercicioSubstituto: 'Remada Máquina Articulada'
        },
        {
          id: 'ex_2_3',
          nome: 'Mesa Flexora',
          grupoMuscular: 'Posterior de Coxa',
          equipamento: 'Máquina',
          series: repConfig.series,
          repeticoes: repConfig.reps,
          descansoSegundos: repConfig.descanso,
          cargaSugeridaKg: 25,
          instrucoes: 'Mantenha o quadril pressionado contra o banco durante a flexão.',
          exercicioSubstituto: 'Cadeira Flexora'
        },
        {
          id: 'ex_2_4',
          nome: 'Rosca Direta com Barra W',
          grupoMuscular: 'Bíceps',
          equipamento: 'Barra W',
          series: repConfig.series,
          repeticoes: repConfig.reps,
          descansoSegundos: repConfig.descanso,
          cargaSugeridaKg: 10,
          instrucoes: 'Mantenha os cotovelos fixos ao lado do tronco.',
          exercicioSubstituto: 'Rosca com Halteres Alternada'
        },
        {
          id: 'ex_2_5',
          nome: 'Gêmeos em Pé na Máquina',
          grupoMuscular: 'Panturrilha',
          equipamento: 'Máquina',
          series: 4,
          repeticoes: '15-20',
          descansoSegundos: 45,
          cargaSugeridaKg: 40,
          instrucoes: 'Pause 1 segundo no pico de contração em cima.',
          exercicioSubstituto: 'Panturrilha no Degrau com Halteres'
        }
      ]
    });
  } else if (diasSemana <= 4) {
    // Upper / Lower (Treino A: Superior, Treino B: Inferior)
    divisoes.push({
      id: 'div_1',
      letra: 'A',
      nome: 'Treino A - Membros Superiores (Upper)',
      focoMuscular: ['Peito', 'Costas', 'Ombros', 'Braços'],
      exercicios: [
        {
          id: 'ex_1_1',
          nome: temDorOmbro ? 'Supino com Halteres Neutro' : 'Supino Inclinado com Halteres',
          grupoMuscular: 'Peitoral',
          series: repConfig.series,
          repeticoes: repConfig.reps,
          descansoSegundos: repConfig.descanso,
          cargaSugeridaKg: 16,
          instrucoes: 'Incline o banco a cerca de 30° a 45° para foco no peitoral superior.',
          exercicioSubstituto: 'Supino Máquina'
        },
        {
          id: 'ex_1_2',
          nome: 'Puxada Aberta no Pulley',
          grupoMuscular: 'Dorsal',
          series: repConfig.series,
          repeticoes: repConfig.reps,
          descansoSegundos: repConfig.descanso,
          cargaSugeridaKg: 40,
          instrucoes: 'Puxe acionando primeiro as escápulas.',
          exercicioSubstituto: 'Puxador Articulado'
        },
        {
          id: 'ex_1_3',
          nome: temDorLombar ? 'Remada Sentada Apoiada no Peito' : 'Remada Unilateral com Halter (Serrote)',
          grupoMuscular: 'Dorsal',
          series: repConfig.series,
          repeticoes: repConfig.reps,
          descansoSegundos: repConfig.descanso,
          cargaSugeridaKg: 18,
          instrucoes: 'Puxe em direção ao quadril.',
          exercicioSubstituto: 'Remada Baixa Polia'
        },
        {
          id: 'ex_1_4',
          nome: 'Elevação Lateral com Halteres',
          grupoMuscular: 'Deltóide Lateral',
          series: 3,
          repeticoes: '12-15',
          descansoSegundos: 60,
          cargaSugeridaKg: 7,
          instrucoes: 'Não jogue o corpo. Suba até a linha do ombro.',
          exercicioSubstituto: 'Elevação Lateral no Cabo'
        },
        {
          id: 'ex_1_5',
          nome: 'Tríceps Polia Barra Reta',
          grupoMuscular: 'Tríceps',
          series: 3,
          repeticoes: repConfig.reps,
          descansoSegundos: 60,
          cargaSugeridaKg: 25,
          instrucoes: 'Cotovelos estáveis ao longo de toda a descida.',
          exercicioSubstituto: 'Tríceps Francês'
        },
        {
          id: 'ex_1_6',
          nome: 'Rosca Scott ou Apoiada',
          grupoMuscular: 'Bíceps',
          series: 3,
          repeticoes: repConfig.reps,
          descansoSegundos: 60,
          cargaSugeridaKg: 12,
          instrucoes: 'Isole o bíceps sem impulso do tronco.',
          exercicioSubstituto: 'Rosca Martelo com Halteres'
        }
      ]
    });

    divisoes.push({
      id: 'div_2',
      letra: 'B',
      nome: 'Treino B - Membros Inferiores (Lower)',
      focoMuscular: ['Quadríceps', 'Glúteos', 'Posterior', 'Panturrilha'],
      exercicios: [
        {
          id: 'ex_2_1',
          nome: temDorJoelho ? 'Leg Press Horizontal (Pés Médios)' : 'Agachamento no Hack ou Livre',
          grupoMuscular: 'Quadríceps / Glúteos',
          series: repConfig.series,
          repeticoes: repConfig.reps,
          descansoSegundos: repConfig.descanso,
          cargaSugeridaKg: 50,
          instrucoes: 'Mantenha os joelhos alinhados com as pontas dos pés.',
          exercicioSubstituto: 'Leg Press 45°'
        },
        {
          id: 'ex_2_2',
          nome: temDorLombar ? 'Elevação Pélvica na Máquina' : 'Stiff com Halteres',
          grupoMuscular: 'Glúteos / Posterior',
          series: repConfig.series,
          repeticoes: repConfig.reps,
          descansoSegundos: repConfig.descanso,
          cargaSugeridaKg: 30,
          instrucoes: 'Contraia fortemente os glúteos no topo do movimento.',
          exercicioSubstituto: 'Mesa Flexora'
        },
        {
          id: 'ex_2_3',
          nome: 'Cadeira Extensora',
          grupoMuscular: 'Quadríceps',
          series: 3,
          repeticoes: '12-15',
          descansoSegundos: 60,
          cargaSugeridaKg: 35,
          instrucoes: 'Controle a descida em 3 segundos.',
          exercicioSubstituto: 'Afundo com Halteres'
        },
        {
          id: 'ex_2_4',
          nome: 'Cadeira Flexora',
          grupoMuscular: 'Posterior de Coxa',
          series: 3,
          repeticoes: '12-15',
          descansoSegundos: 60,
          cargaSugeridaKg: 30,
          instrucoes: 'Apoio firme das pernas sem descolar a coluna.',
          exercicioSubstituto: 'Mesa Flexora Deitada'
        },
        {
          id: 'ex_2_5',
          nome: 'Panturrilha Sentado (Gêmeos)',
          grupoMuscular: 'Panturrilhas (Sóleo)',
          series: 4,
          repeticoes: '15-20',
          descansoSegundos: 45,
          cargaSugeridaKg: 25,
          instrucoes: 'Alongamento profundo embaixo e contração máxima em cima.',
          exercicioSubstituto: 'Panturrilha no Leg Press'
        }
      ]
    });
  } else {
    // 5 ou 6 dias: Push / Pull / Legs (ABC)
    divisoes.push({
      id: 'div_1',
      letra: 'A',
      nome: 'Treino A - Peito, Tríceps e Ombros (Push)',
      focoMuscular: ['Peitoral', 'Deltóide Anterior/Lateral', 'Tríceps'],
      exercicios: [
        {
          id: 'ex_1_1',
          nome: 'Supino Reto com Halteres',
          grupoMuscular: 'Peitoral',
          series: repConfig.series,
          repeticoes: repConfig.reps,
          descansoSegundos: repConfig.descanso,
          cargaSugeridaKg: 18,
          instrucoes: 'Foco no alongamento peitoral e subida controlada.',
          exercicioSubstituto: 'Supino na Máquina'
        },
        {
          id: 'ex_1_2',
          nome: 'Crucifixo Inclinado com Halteres ou Crossover',
          grupoMuscular: 'Peitoral Superior',
          series: 3,
          repeticoes: '10-12',
          descansoSegundos: 60,
          cargaSugeridaKg: 10,
          instrucoes: 'Mantenha os cotovelos levemente semi-flexionados.',
          exercicioSubstituto: 'Peck Deck (Voador)'
        },
        {
          id: 'ex_1_3',
          nome: temDorOmbro ? 'Elevação Lateral no Cabo' : 'Desenvolvimento com Halteres Sentado',
          grupoMuscular: 'Ombros',
          series: repConfig.series,
          repeticoes: repConfig.reps,
          descansoSegundos: 60,
          cargaSugeridaKg: 12,
          instrucoes: 'Cotovelos a 45 graus em relação ao tronco.',
          exercicioSubstituto: 'Desenvolvimento Máquina'
        },
        {
          id: 'ex_1_4',
          nome: 'Elevação Lateral com Halteres',
          grupoMuscular: 'Deltóide Lateral',
          series: 4,
          repeticoes: '12-15',
          descansoSegundos: 45,
          cargaSugeridaKg: 8,
          instrucoes: 'Controle excêntrico na descida.',
          exercicioSubstituto: 'Elevação Lateral Máquina'
        },
        {
          id: 'ex_1_5',
          nome: 'Tríceps Testa com Barra W ou Halteres',
          grupoMuscular: 'Tríceps',
          series: 3,
          repeticoes: repConfig.reps,
          descansoSegundos: 60,
          cargaSugeridaKg: 12,
          instrucoes: 'Mantenha os braços levemente inclinados para trás para tensão contínua.',
          exercicioSubstituto: 'Tríceps Corda'
        },
        {
          id: 'ex_1_6',
          nome: 'Tríceps Mergulho no Banco ou Paralelas',
          grupoMuscular: 'Tríceps',
          series: 3,
          repeticoes: '10-12',
          descansoSegundos: 60,
          instrucoes: 'Desça até aproximadamente 90° de cotovelo.',
          exercicioSubstituto: 'Tríceps Francês na Polia'
        }
      ]
    });

    divisoes.push({
      id: 'div_2',
      letra: 'B',
      nome: 'Treino B - Costas, Bíceps e Deltóide Posterior (Pull)',
      focoMuscular: ['Dorsal', 'Trapézio', 'Deltóide Posterior', 'Bíceps'],
      exercicios: [
        {
          id: 'ex_2_1',
          nome: 'Puxada Alta com Triângulo ou Pegada Neutra',
          grupoMuscular: 'Dorsal',
          series: repConfig.series,
          repeticoes: repConfig.reps,
          descansoSegundos: repConfig.descanso,
          cargaSugeridaKg: 45,
          instrucoes: 'Alongue as dorsais no topo e esmague embaixo.',
          exercicioSubstituto: 'Puxada Aberta'
        },
        {
          id: 'ex_2_2',
          nome: temDorLombar ? 'Remada Baixa com Apoio de Peito' : 'Remada Curvada Pronada',
          grupoMuscular: 'Costas',
          series: repConfig.series,
          repeticoes: repConfig.reps,
          descansoSegundos: repConfig.descanso,
          cargaSugeridaKg: 35,
          instrucoes: 'Puxe em direção à linha do umbigo.',
          exercicioSubstituto: 'Remada Cavalinho com Apoio'
        },
        {
          id: 'ex_2_3',
          nome: 'Crucifixo Invertido no Peck Deck ou Halteres',
          grupoMuscular: 'Deltóide Posterior',
          series: 3,
          repeticoes: '12-15',
          descansoSegundos: 60,
          cargaSugeridaKg: 20,
          instrucoes: 'Foco na parte de trás dos ombros sem dar tranco.',
          exercicioSubstituto: 'Face Pull na Polia'
        },
        {
          id: 'ex_2_4',
          nome: 'Rosca Direta com Barra Reta ou W',
          grupoMuscular: 'Bíceps',
          series: 3,
          repeticoes: repConfig.reps,
          descansoSegundos: 60,
          cargaSugeridaKg: 14,
          instrucoes: 'Punhos firmes e sem balançar o tronco.',
          exercicioSubstituto: 'Rosca Direta na Polia Baixa'
        },
        {
          id: 'ex_2_5',
          nome: 'Rosca Martelo com Halteres',
          grupoMuscular: 'Braquial / Antebraço',
          series: 3,
          repeticoes: '10-12',
          descansoSegundos: 60,
          cargaSugeridaKg: 12,
          instrucoes: 'Pegada neutra (polegares para cima) para reforço articular.',
          exercicioSubstituto: 'Rosca Martelo com Corda na Polia'
        }
      ]
    });

    divisoes.push({
      id: 'div_3',
      letra: 'C',
      nome: 'Treino C - Pernas Completas e Abdômen (Legs)',
      focoMuscular: ['Quadríceps', 'Posterior', 'Glúteos', 'Panturrilha'],
      exercicios: [
        {
          id: 'ex_3_1',
          nome: temDorJoelho ? 'Leg Press 45° com Pés no Alto' : 'Agachamento Livre com Barra',
          grupoMuscular: 'Quadríceps / Glúteo',
          series: repConfig.series,
          repeticoes: repConfig.reps,
          descansoSegundos: repConfig.descanso,
          cargaSugeridaKg: 40,
          instrucoes: 'Pés na largura dos ombros, descida controlada.',
          exercicioSubstituto: 'Hack Machine'
        },
        {
          id: 'ex_3_2',
          nome: 'Cadeira Extensora',
          grupoMuscular: 'Quadríceps',
          series: 3,
          repeticoes: '12-15',
          descansoSegundos: 60,
          cargaSugeridaKg: 35,
          instrucoes: 'Pause 1 segundo no topo com contração máxima.',
          exercicioSubstituto: 'Passada / Avanço'
        },
        {
          id: 'ex_3_3',
          nome: 'Mesa Flexora Deitada',
          grupoMuscular: 'Posterior de Coxa',
          series: repConfig.series,
          repeticoes: repConfig.reps,
          descansoSegundos: 60,
          cargaSugeridaKg: 25,
          instrucoes: 'Pressione a pelve contra o banco para não sobrecarregar a lombar.',
          exercicioSubstituto: 'Stiff com Halteres'
        },
        {
          id: 'ex_3_4',
          nome: 'Elevação Pélvica',
          grupoMuscular: 'Glúteo',
          series: 3,
          repeticoes: '10-12',
          descansoSegundos: 60,
          cargaSugeridaKg: 30,
          instrucoes: 'Segure 2 segundos no ponto de maior contração em cima.',
          exercicioSubstituto: 'Cadeira Abdutora'
        },
        {
          id: 'ex_3_5',
          nome: 'Gêmeos Sentado ou em Pé',
          grupoMuscular: 'Panturrilha',
          series: 4,
          repeticoes: '15-20',
          descansoSegundos: 45,
          cargaSugeridaKg: 30,
          instrucoes: 'Movimento completo, sentindo esticar na descida.',
          exercicioSubstituto: 'Panturrilha no Leg'
        },
        {
          id: 'ex_3_6',
          nome: 'Abdominal Infra na Paralela ou Solo',
          grupoMuscular: 'Abdômen',
          series: 3,
          repeticoes: '15-20',
          descansoSegundos: 45,
          instrucoes: 'Eleve o quadril enrolando a pelve.',
          exercicioSubstituto: 'Prancha Frontal'
        }
      ]
    });
  }

  // Calibra as cargas sugeridas com base no peso corporal, nível de experiência e gênero do aluno
  const pesoRef = anamnese.pesoKg || 72;
  const fatorPeso = Math.max(0.6, Math.min(1.5, pesoRef / 75));
  const fatorExp = experiencia === 'iniciante' ? 0.75 : experiencia === 'avancado' ? 1.25 : 1.0;
  const fatorGenero = anamnese.genero === 'feminino' ? 0.8 : 1.0;
  const multiplicadorCarga = fatorPeso * fatorExp * fatorGenero;

  divisoes.forEach(div => {
    div.exercicios.forEach(ex => {
      if (ex.cargaSugeridaKg) {
        ex.cargaSugeridaKg = Math.max(2, Math.round(ex.cargaSugeridaKg * multiplicadorCarga));
      }
    });
  });

  const infoBiometria = anamnese.pesoKg && anamnese.alturaCm
    ? ` (Perfil: ${anamnese.pesoKg} kg, ${anamnese.alturaCm} cm${anamnese.idade ? `, ${anamnese.idade} anos` : ''})`
    : '';

  return {
    id: 'treino_' + Date.now(),
    alunoId,
    titulo: `Treino Personalizado: ${objetivo.toUpperCase()} (${diasSemana}x/sem)`,
    criadoPor: 'ia',
    dataCriacao: new Date().toISOString(),
    ativo: true,
    orientacoesGerais: `Treino elaborado para nível ${experiencia}, com foco em ${objetivo}${infoBiometria}. As cargas iniciais foram calibradas para a sua estrutura corporal. Lembre-se de aquecer 5-10 minutos antes da musculação e manter hidratação constante.`,
    divisoes
  };
}
