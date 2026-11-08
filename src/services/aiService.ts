import { Anamnesis, WorkoutDivision, WorkoutLog, WorkoutPlan } from '../types';
import { EXERCISE_CATALOG } from '../data/exerciseCatalog';

export const GEMINI_API_KEY = (import.meta.env.VITE_GEMINI_API_KEY || "").trim();

const AI_CACHE_STORAGE_KEY = 'treinopro_ai_plan_cache_v1';
const AI_WORKING_MODEL_KEY = 'treinopro_working_flash_model';
const AI_COOLDOWN_MS = 3 * 60 * 1000; // 3 minutos de proteção anti-spam por usuário

/**
 * Gera uma assinatura única do perfil de treino (ignorando nome/id e ajustando peso posteriormente)
 * para reaproveitar prescrições idênticas a custo R$ 0,00 de API.
 */
function buildProfileCacheSignature(anamnese: Anamnesis, customPromptExtra?: string): string {
  const lims = [...(anamnese.limitacoes || [])].sort().join(',');
  const extra = (customPromptExtra || '').trim().toLowerCase();
  return [
    anamnese.objetivo,
    anamnese.experiencia,
    anamnese.diasSemana,
    anamnese.tempoMinutos,
    anamnese.tipoAmbiente,
    lims || 'sem_dor',
    extra || 'padrao'
  ].join('|');
}

function getCachedPlanBySignature(
  signature: string,
  alunoNome: string,
  alunoId: string,
  anamnese: Anamnesis
): WorkoutPlan | null {
  try {
    const raw = localStorage.getItem(AI_CACHE_STORAGE_KEY);
    if (!raw) return null;
    const cacheMap: Record<string, { plan: WorkoutPlan; basePesoKg: number }> = JSON.parse(raw);
    const entry = cacheMap[signature];
    if (!entry || !entry.plan) return null;

    const pesoAluno = anamnese.pesoKg || 72;
    const alturaCm = anamnese.alturaCm || 172;
    const imc = (pesoAluno / Math.pow(alturaCm / 100, 2)).toFixed(1);
    const fatorAjustePeso = Math.max(0.7, Math.min(1.4, pesoAluno / (entry.basePesoKg || 72)));

    const clonedDivisoes: WorkoutDivision[] = entry.plan.divisoes.map((div, dIdx) => ({
      ...div,
      id: `div_${dIdx + 1}`,
      exercicios: div.exercicios.map((ex, eIdx) => ({
        ...ex,
        id: `ex_${dIdx + 1}_${eIdx + 1}`,
        cargaSugeridaKg: ex.cargaSugeridaKg
          ? Math.max(2, Math.round(ex.cargaSugeridaKg * fatorAjustePeso))
          : undefined
      }))
    }));

    return {
      ...entry.plan,
      id: 'treino_' + Date.now(),
      alunoId,
      dataCriacao: new Date().toISOString(),
      ativo: true,
      fase: 1,
      metaCiclos: 6,
      orientacoesGerais: `Olá, ${alunoNome.split(' ')[0]}! Plano otimizado para ${anamnese.objetivo.toUpperCase()} (${anamnese.diasSemana}x/semana), calibrado para sua estrutura de ${pesoAluno} kg e ${alturaCm} cm (IMC ${imc}). ${entry.plan.orientacoesGerais || ''}`,
      divisoes: clonedDivisoes
    };
  } catch {
    return null;
  }
}

function savePlanToSignatureCache(signature: string, plan: WorkoutPlan, basePesoKg: number): void {
  try {
    const raw = localStorage.getItem(AI_CACHE_STORAGE_KEY);
    const cacheMap: Record<string, { plan: WorkoutPlan; basePesoKg: number }> = raw ? JSON.parse(raw) : {};
    cacheMap[signature] = { plan, basePesoKg };
    localStorage.setItem(AI_CACHE_STORAGE_KEY, JSON.stringify(cacheMap));
  } catch {
    // Ignora caso localStorage esteja cheio
  }
}

export async function gerarTreinoComIA(
  alunoNome: string,
  alunoId: string,
  anamnese: Anamnesis,
  customPromptExtra?: string
): Promise<WorkoutPlan> {
  const signature = buildProfileCacheSignature(anamnese, customPromptExtra);

  // 1. Economia Máxima: Verifica se já existe um treino gerado pela IA no Cache para este exato perfil
  const cachedPlan = getCachedPlanBySignature(signature, alunoNome, alunoId, anamnese);
  if (cachedPlan) {
    console.info("⚡ Economia de API: Treino recuperado do Cache Inteligente (0 tokens gastos)!");
    return cachedPlan;
  }

  // 2. Proteção Anti-Spam (Cooldown): evita gastos repetidos em cliques seguidos no mesmo minuto
  const lastCallKey = `treinopro_last_ai_${alunoId}`;
  const lastCallTs = Number(localStorage.getItem(lastCallKey) || 0);
  const withinCooldown = !customPromptExtra && Date.now() - lastCallTs < AI_COOLDOWN_MS;

  if (GEMINI_API_KEY && GEMINI_API_KEY !== "SUA_CHAVE_GEMINI_AQUI" && !withinCooldown) {
    try {
      const plan = await chamarGeminiApi(alunoNome, alunoId, anamnese, customPromptExtra);
      localStorage.setItem(lastCallKey, String(Date.now()));
      savePlanToSignatureCache(signature, plan, anamnese.pesoKg || 72);
      return plan;
    } catch (err) {
      console.warn("Falha na chamada da API Gemini, usando motor de regras inteligentes de fallback:", err);
    }
  }

  // Fallback imediato (ou em cooldown): gerador algorítmico baseado em cinesiologia (Custo R$ 0,00)
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

  const qtdEx =
    anamnese.tempoMinutos <= 30 ? "4-5" :
    anamnese.tempoMinutos <= 45 ? "5-6" :
    anamnese.tempoMinutos <= 60 ? "6" : "7";

  const regraObj: Record<Anamnesis['objetivo'], string> = {
    emagrecimento: "12-15 reps, descanso 30-45s (alto EPOC/gasto calórico), multiarticulares + dica cardio pós-treino.",
    hipertrofia: "8-12 reps, descanso 60-75s, foco volume muscular.",
    forca: "4-6 reps, descanso 90-120s, foco compostos pesados.",
    condicionamento: "12-15 reps, descanso 45-60s, foco resistência e postura."
  };

  // Prompt enxuto e direto para economizar mais de 55% de tokens de entrada e saída
  const prompt = `Treinador de musculação: gere JSON de treino personalizado.
Aluno: ${alunoNome}, ${anamnese.idade || 25}a, ${anamnese.genero || 'masculino'}, ${peso}kg, ${anamnese.alturaCm || 172}cm (IMC ${imc}).
Objetivo: ${anamnese.objetivo} (${regraObj[anamnese.objetivo]}).
Nível: ${anamnese.experiencia} | ${anamnese.diasSemana}x/sem | ${anamnese.tempoMinutos}min (${qtdEx} exerc/divisão) | Local: ${anamnese.tipoAmbiente}.
Limitações: ${anamnese.limitacoes?.length ? anamnese.limitacoes.join(",") : "nenhuma"}.
${customPromptExtra ? `Instrução extra: ${customPromptExtra}` : ""}
Regras:
1. Divisão ideal p/ ${anamnese.diasSemana}x/sem (AB, ABC ou ABCD).
2. Calibre cargaSugeridaKg p/ ${peso}kg e nível ${anamnese.experiencia}. Proteja articulações com limitação.
3. Nomes clássicos em PT-BR. Instruções curtas (máx 80 caracteres).
Formato JSON único:
{"titulo":"...","orientacoesGerais":"Resumo curto (máx 220 caracteres)","divisoes":[{"letra":"A","nome":"Treino A - ...","focoMuscular":["..."],"exercicios":[{"nome":"...","grupoMuscular":"...","equipamento":"...","series":4,"repeticoes":"8-12","descansoSegundos":60,"cargaSugeridaKg":16,"instrucoes":"...","exercicioSubstituto":"..."}]}]}`;

  // Usa APENAS modelos da família Flash / Flash-Lite (até 15x mais econômicos que modelos Pro)
  const economicalDefaults = [
    "models/gemini-2.5-flash-lite",
    "models/gemini-3.0-flash",
    "models/gemini-3-flash-preview"
  ];

  const cachedModel = localStorage.getItem(AI_WORKING_MODEL_KEY);
  let candidateModels = cachedModel
    ? Array.from(new Set([cachedModel, ...economicalDefaults]))
    : [...economicalDefaults];

  let lastError: any = null;
  let data: any = null;

  for (const modelName of candidateModels) {
    // Segurança extra: nunca chama modelo 'pro' para proteger o saldo da API
    if (modelName.includes("-pro")) continue;

    const url = `https://generativelanguage.googleapis.com/v1beta/${modelName}:generateContent?key=${GEMINI_API_KEY}`;
    try {
      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ role: "user", parts: [{ text: prompt }] }],
          generationConfig: {
            responseMimeType: "application/json",
            temperature: 0.3,
            maxOutputTokens: 1600
          }
        })
      });

      if (response.ok) {
        data = await response.json();
        localStorage.setItem(AI_WORKING_MODEL_KEY, modelName);
        console.info(`✅ Treino gerado com modo econômico (${modelName})!`);
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
    throw lastError || new Error("Não foi possível obter resposta dos endpoints econômicos Gemini.");
  }

  const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!rawText) throw new Error("Resposta vazia da IA");

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
 * Evolui a ficha atual para a próxima Fase do Mesociclo (Fase 2, Fase 3...)
 * com CUSTO ZERO DE API (R$ 0,00), utilizando o Catálogo Biomecânico Oficial (EXERCISE_CATALOG)
 * para rotacionar exercícios da mesma categoria muscular e progredir as cargas conquistadas!
 */
export async function evoluirTreinoComIA(
  _alunoNome: string,
  _alunoId: string,
  anamnese: Anamnesis,
  planoAtual: WorkoutPlan,
  _historicoLogs: WorkoutLog[]
): Promise<WorkoutPlan> {
  const novaFase = (planoAtual.fase || 1) + 1;

  const divisoesEvoluidas: WorkoutDivision[] = planoAtual.divisoes.map((div) => {
    const nomesJaUsadosNaDivisao = new Set<string>(div.exercicios.map((e) => e.nome));

    return {
      ...div,
      exercicios: div.exercicios.map((ex) => {
        const g = (ex.grupoMuscular || '').toLowerCase();
        // Busca exercícios equivalentes da mesma categoria no catálogo oficial que ainda não estavam na divisão
        const candidatosCatalogo = EXERCISE_CATALOG.filter((catItem) => {
          const catLower = catItem.categoria.toLowerCase();
          return (
            catLower.includes(g) ||
            g.includes(catLower.split('/')[0].trim()) ||
            catItem.nome === ex.exercicioSubstituto
          );
        });

        const substitutoDoCatalogo =
          candidatosCatalogo.find((c) => c.nome === ex.exercicioSubstituto && !nomesJaUsadosNaDivisao.has(c.nome)) ||
          candidatosCatalogo.find((c) => !nomesJaUsadosNaDivisao.has(c.nome));

        const cargaAntiga = ex.cargaSugeridaKg || 12;
        const novaCarga = Math.max(2, Math.round(cargaAntiga * 1.08));

        if (substitutoDoCatalogo) {
          nomesJaUsadosNaDivisao.add(substitutoDoCatalogo.nome);
          return {
            ...ex,
            nome: substitutoDoCatalogo.nome,
            equipamento: substitutoDoCatalogo.equipamento,
            instrucoes: substitutoDoCatalogo.instrucoes,
            exercicioSubstituto: ex.nome,
            cargaAnteriorKg: cargaAntiga,
            cargaSugeridaKg: novaCarga,
            progressaoAplicada: 'subiu'
          };
        }

        const novoNome =
          ex.exercicioSubstituto && ex.exercicioSubstituto !== 'Variação equivalente na máquina'
            ? ex.exercicioSubstituto
            : ex.nome;

        return {
          ...ex,
          nome: novoNome,
          exercicioSubstituto: ex.nome,
          cargaAnteriorKg: cargaAntiga,
          cargaSugeridaKg: novaCarga,
          progressaoAplicada: 'subiu'
        };
      })
    };
  });

  return {
    ...planoAtual,
    id: 'treino_' + Date.now(),
    dataCriacao: new Date().toISOString(),
    fase: novaFase,
    metaCiclos: planoAtual.metaCiclos || 6,
    titulo: `Fase ${novaFase} • Periodização Evoluída (${anamnese.objetivo.toUpperCase()})`,
    orientacoesGerais: `Bem-vindo à Fase ${novaFase}! Os exercícios e angulações foram renovados pelo motor biomecânico para gerar novos estímulos neuromusculares, evitar platô e aproveitar a força construída na Fase ${novaFase - 1}.`,
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
