import { Anamnesis, WorkoutDivision, WorkoutLog, WorkoutPlan } from '../types';
import { EXERCISE_CATALOG } from '../data/exerciseCatalog';
import { getSharedAiPlanFromCloud, saveSharedAiPlanToCloud } from './storageService';

export const GEMINI_API_KEY = (import.meta.env.VITE_GEMINI_API_KEY || "").trim();

const AI_CACHE_STORAGE_KEY = 'treinopro_ai_plan_cache_v3';
const AI_WORKING_MODEL_KEY = 'treinopro_working_flash_model_v3';
const AI_COOLDOWN_MS = 15 * 1000; // 15s apenas contra duplo-clique acidental no mesmo perfil

/**
 * Classifica a faixa etária do aluno para calibrar seleção biomecânica,
 * volume, proteção epifisária (adolescentes) ou articular (master/idosos) e assinatura de cache.
 */
function getAgeBracket(idade?: number): 'adolescente_jovem' | 'juvenil' | 'adulto' | 'master' | 'senior' {
  const age = idade || 25;
  if (age <= 15) return 'adolescente_jovem'; // 12-15 anos: fase de estirão puberal / placas epifisárias abertas
  if (age <= 18) return 'juvenil';           // 16-18 anos: transição juvenil
  if (age >= 60) return 'senior';            // 60+ anos: foco em longevidade, estabilidade e proteção articular
  if (age >= 48) return 'master';            // 48-59 anos: recuperação articular controlada
  return 'adulto';                           // 19-47 anos: plenitude maturacional
}

/**
 * Calcula dinamicamente a quantidade ideal de voltas/ciclos do mesociclo
 * de acordo com o nível de experiência, objetivo, frequência semanal e quantidade de divisões.
 */
export function calcularMetaCiclosIdeal(anamnese?: Anamnesis, numDivisoes = 3): number {
  if (!anamnese) return 6;

  const { experiencia, objetivo, diasSemana } = anamnese;
  const divs = Math.max(1, numDivisoes);

  // Semanas ideais de adaptação neuromuscular antes de variar estímulos/exercícios:
  // Iniciante: ~4 semanas | Intermediário: ~6 semanas | Avançado: ~8 semanas
  let semanasAlvo = experiencia === 'iniciante' ? 4 : experiencia === 'avancado' ? 8 : 6;

  if (objetivo === 'forca') {
    semanasAlvo += 1; // Força pura exige progressão mais longa nos mesmos básicos
  } else if (objetivo === 'emagrecimento' && experiencia === 'iniciante') {
    semanasAlvo = 4; // Dinamismo metabólico p/ manter alta aderência
  }

  const sessoesTotaisIdeais = semanasAlvo * (diasSemana || 3);
  const ciclosCalculados = Math.round(sessoesTotaisIdeais / divs);

  // Limita entre 4 e 10 ciclos completos para manter coerência fisiológica
  return Math.max(4, Math.min(10, ciclosCalculados));
}

/**
 * Gera uma assinatura única do perfil de treino (incluindo faixa etária e gênero, e ajustando peso posteriormente)
 * para reaproveitar prescrições idênticas a custo R$ 0,00 de API sem misturar idades ou perfis distintos.
 */
function buildProfileCacheSignature(anamnese: Anamnesis, customPromptExtra?: string): string {
  const lims = [...(anamnese.limitacoes || [])].sort().join(',');
  const extra = (customPromptExtra || '').trim().toLowerCase();
  const obs = (anamnese.observacoes || '').trim().toLowerCase();
  const faixaEtaria = getAgeBracket(anamnese.idade);
  return [
    'v3',
    anamnese.objetivo,
    anamnese.experiencia,
    anamnese.genero || 'masculino',
    faixaEtaria,
    anamnese.diasSemana,
    anamnese.tempoMinutos,
    anamnese.tipoAmbiente,
    lims || 'sem_dor',
    obs || 'sem_obs',
    extra || 'padrao'
  ].join('|');
}

function adaptCachedEntryToStudent(
  entry: { plan: WorkoutPlan; basePesoKg: number },
  alunoNome: string,
  alunoId: string,
  anamnese: Anamnesis
): WorkoutPlan {
  const pesoAluno = anamnese.pesoKg || 72;
  const alturaCm = anamnese.alturaCm || 172;
  const imc = (pesoAluno / Math.pow(alturaCm / 100, 2)).toFixed(1);
  const fatorAjustePeso = Math.max(0.45, Math.min(1.5, pesoAluno / (entry.basePesoKg || 72)));

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
    metaCiclos: calcularMetaCiclosIdeal(anamnese, clonedDivisoes.length),
    orientacoesGerais: `Olá, ${alunoNome.split(' ')[0]}! Plano otimizado para ${anamnese.objetivo.toUpperCase()} (${anamnese.diasSemana}x/semana), calibrado para sua estrutura de ${pesoAluno} kg e ${alturaCm} cm (IMC ${imc}). ${entry.plan.orientacoesGerais || ''}`,
    divisoes: clonedDivisoes
  };
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
    return adaptCachedEntryToStudent(entry, alunoNome, alunoId, anamnese);
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

  // 1. Verifica Cache Local (0 tokens - retorno imediato)
  const cachedLocal = getCachedPlanBySignature(signature, alunoNome, alunoId, anamnese);
  if (cachedLocal) {
    return cachedLocal;
  }

  // 2. Verifica Cache Global Compartilhado no Firebase Firestore (0 tokens para todos os 500+ alunos)
  // Se outro aluno já gerou um treino com IA para essa exata combinação de Objetivo + Nível + Sexo + Dias + Tempo + Ambiente + Dores,
  // reaproveita a prescrição da IA e recalibra todas as cargas (kg) proporcionalmente ao peso corporal deste aluno!
  const cachedCloud = await getSharedAiPlanFromCloud(signature);
  if (cachedCloud) {
    savePlanToSignatureCache(signature, cachedCloud.plan, cachedCloud.basePesoKg);
    return adaptCachedEntryToStudent(cachedCloud, alunoNome, alunoId, anamnese);
  }

  // 3. Proteção contra duplo-clique acidental (15s)
  const lastCallKey = `treinopro_last_ai_${alunoId}_${signature}`;
  const lastCallTs = Number(localStorage.getItem(lastCallKey) || 0);
  const withinCooldown = Date.now() - lastCallTs < AI_COOLDOWN_MS;

  // 4. Chama a IA Real do Google Gemini (Flash-Lite / Flash com thinkingBudget: 0 -> ~R$ 0,002 por ficha inédita)
  // e salva o resultado no Cache Global na Nuvem para que os próximos alunos com o mesmo perfil tenham custo R$ 0,00!
  if (GEMINI_API_KEY && GEMINI_API_KEY !== "SUA_CHAVE_GEMINI_AQUI" && !withinCooldown) {
    try {
      const plan = await chamarGeminiApi(alunoNome, alunoId, anamnese, customPromptExtra);
      const basePeso = anamnese.pesoKg || 72;
      localStorage.setItem(lastCallKey, String(Date.now()));
      savePlanToSignatureCache(signature, plan, basePeso);
      await saveSharedAiPlanToCloud(signature, plan, basePeso);
      return plan;
    } catch (err) {
      console.warn("Falha na chamada da API Gemini, usando motor biomecânico de catálogo:", err);
    }
  }

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
  const idade = anamnese.idade || 25;
  const faixaEtaria = getAgeBracket(idade);

  // Proteção fisiológica de volume por sessão (iniciantes e adolescentes de 12-15 anos não devem fazer 8 exercícios pesados seguidos)
  const qtdEx =
    faixaEtaria === 'adolescente_jovem' || faixaEtaria === 'senior'
      ? (anamnese.tempoMinutos <= 45 ? "5" : "6")
      : anamnese.experiencia === 'iniciante'
      ? (anamnese.tempoMinutos <= 30 ? "4 a 5" : anamnese.tempoMinutos <= 45 ? "5 a 6" : anamnese.tempoMinutos <= 60 ? "6" : "6 a 7")
      : (anamnese.tempoMinutos <= 30 ? "4 a 5" : anamnese.tempoMinutos <= 45 ? "5 a 6" : anamnese.tempoMinutos <= 60 ? "6" : anamnese.tempoMinutos <= 75 ? "6 a 7" : anamnese.tempoMinutos <= 90 ? "7" : "8");

  const diretrizPorFaixaEtaria: Record<ReturnType<typeof getAgeBracket>, string> = {
    adolescente_jovem:
      `ADOLESCENTE JOVEM (${idade} anos, ${peso} kg - Fase de Crescimento / Placas Epifisárias Abertas): PROIBIDO prescrever sobrecarga axial severa na coluna (NÃO use Levantamento Terra Pesado, Stiff com Barra Pesada ou Agachamento Livre pesado nas costas). Priorize máquinas guiadas, halteres leves/moderados, cabos e calistenia educativa. Cargas sugeridas DEVEM ser leves e seguras para uma estrutura de ${peso} kg (ex: halteres de 3kg a 6kg, Leg Press 30kg, Puxada 15kg).`,
    juvenil:
      `JOVEM / ADOLESCENTE (${idade} anos, ${peso} kg): Foco em construção de base motora sólida, postura escapular/core e progressão gradual sem ego-lifting.`,
    adulto:
      `ADULTO (${idade} anos, ${peso} kg): Capacidade plena de sobrecarga mecânica e metabólica conforme o nível de experiência (${anamnese.experiencia}).`,
    master:
      `ADULTO MASTER (${idade} anos, ${peso} kg): Priorize excelente aquecimento articular, máquinas biomecânicas convergentes, cabos e halteres com controle excêntrico rigoroso, evitando estresse articular desnecessário em tendões.`,
    senior:
      `IDOSO / SÊNIOR (${idade} anos, ${peso} kg): Foco absoluto em longevidade, autonomia funcional, preservação de massa magra/óssea, máquinas guiadas seguras, equilíbrio de core e zero impacto/compressão axial.`
  };

  const diretrizPorGenero =
    anamnese.genero === 'feminino'
      ? "PERFIL FEMININO: Priorize maior volume e variedade de estímulos para Membros Inferiores (Glúteos em múltiplos vetores: Elevação Pélvica, Abdutora, Coice/Polia, Agachamento/Leg Press/Afundo e Posterior de Coxa), além de Membros Superiores elegantes com foco em postura escapular, deltóides definidos e core firme (evite excesso de exercícios redundantes de peitoral/tríceps como 4 exercícios de peito no mesmo dia)."
      : "PERFIL MASCULINO: Distribuição equilibrada entre Torso (Peitoral, Dorsal larga em V, Deltóides 3D, Bíceps e Tríceps) e Membros Inferiores completos (Quadríceps, Posterior e Panturrilhas).";

  const diretrizPorObjetivo: Record<Anamnesis['objetivo'], string> = {
    emagrecimento:
      "FOCO EMAGRECIMENTO & METABÓLICO: Priorize exercícios multiarticulares e dinâmicos de alto gasto calórico (ex: Agachamento Goblet/Livre, Passada/Afundo,Kettlebell/Halteres, Remadas, Puxadas, Supinos, Prancha/Abdominal Bicicleta), 3 a 4 séries de 12-15 repetições, intervalos curtos (30s a 45s) para manter frequência cardíaca alta.",
    hipertrofia:
      "FOCO HIPERTROFIA MUSCULAR: Comece SEMPRE cada divisão pelos exercícios multiarticulares compostos principais (ex: Supino Reto/Inclinado, Puxada/Remada, Agachamento/Leg Press/Elevação Pélvica) e finalize com os isoladores (ex: Crucifixo, Extensora, Flexora, Rosca, Tríceps, Elevação Lateral). 3 a 4 séries de 8-12 repetições, descanso 60s a 75s.",
    forca:
      "FOCO GANHO DE FORÇA PURA: Priorize grandes levantamentos compostos pesados (Agachamento Livre/Hack, Supino Reto Barra/Halteres, Levantamento Terra/Stiff, Desenvolvimento Militar, Remada Curvada/Cavalinho, Barra Fixa/Puxada Pesada), 4 a 5 séries de 4-6 repetições nos básicos e 6-8 nos auxiliares, descanso longo (90s a 120s).",
    condicionamento:
      "FOCO CONDICIONAMENTO FÍSICO, SAÚDE & POSTURA: Priorize máquinas guiadas, cabos, estabilidade de core, reforço de manguito/escápulas e resistência muscular (12-15 repetições, descanso 45s a 60s), evitando sobrecarga axial excessiva na coluna."
  };

  const diretrizPorNivel: Record<Anamnesis['experiencia'], string> = {
    iniciante:
      "NÍVEL INICIANTE: Priorize máquinas articuladas, polias e halteres de fácil controle motor. NUNCA coloque 2 ou 3 variações quase iguais de isoladores seguidas. Comece sempre pelo multiarticular básico guiado.",
    intermediario:
      "NÍVEL INTERMEDIÁRIO: Combine pesos livres (barras e halteres) com máquinas e polias para ótimo estímulo hipertrófico e metabólico.",
    avancado:
      "NÍVEL AVANÇADO: Seleção técnica avançada com exercícios livres de alta demanda neural + isoladores de pico de contração e maior volume."
  };

  // Regra de ouro da periodização: Iniciantes/Adolescentes que treinam 5x a 7x/semana fazem ABC 2x (3 divisões repetidas na semana) e NÃO ABCDE!
  const diretrizDivisao =
    anamnese.diasSemana <= 2
      ? "2 divisões (A e B - Full Body distintos ou Upper/Lower)"
      : anamnese.diasSemana === 3
      ? (anamnese.genero === 'feminino'
          ? "3 divisões (A: Quadríceps, Glúteos e Panturrilha | B: Superiores Completos, Postura e Core | C: Posterior de Coxa, Glúteos Foco e Abdômen)"
          : "3 divisões (A: Peito, Ombros e Tríceps | B: Costas, Trapézio e Bíceps | C: Pernas Completas e Abdômen)")
      : anamnese.diasSemana === 4
      ? (anamnese.genero === 'feminino'
          ? "4 divisões (A: Quadríceps e Glúteos | B: Costas, Ombros e Braços | C: Glúteos Foco e Posterior de Coxa | D: Deltoides, Superiores Leve e Abdômen/Core)"
          : "4 divisões (A: Peito e Tríceps | B: Costas e Bíceps | C: Pernas Completas | D: Ombros, Trapézio e Abdômen/Braços)")
      : (anamnese.experiencia === 'iniciante' || faixaEtaria === 'adolescente_jovem')
      ? (anamnese.genero === 'feminino'
          ? `3 divisões no formato ABC 2x para ${anamnese.diasSemana} dias/semana (A: Quadríceps, Glúteos e Panturrilha | B: Superiores Completos, Ombros e Core | C: Glúteos em Foco e Posterior de Coxa) — ideal para iniciante gerar alta frequência de aprendizado motor sem overtraining`
          : `3 divisões no formato ABC 2x para ${anamnese.diasSemana} dias/semana (A: Peitoral, Ombros e Tríceps | B: Costas, Trapézio e Bíceps | C: Pernas Completas e Core) — ideal para iniciante/jovem repetir o ciclo 2x na semana`)
      : (anamnese.genero === 'feminino'
          ? "5 divisões especializadas Femininas (A: Quadríceps e Panturrilha | B: Costas, Ombros e Postura | C: Glúteos em Foco e Abdutora | D: Peitoral Leve, Braços Definidos e Abdômen | E: Posterior de Coxa e Glúteos)"
          : "5 divisões avançadas (A: Peitoral e Tríceps | B: Costas e Bíceps | C: Quadríceps e Panturrilhas | D: Ombros Completos, Trapézio e Core | E: Posterior de Coxa, Glúteos e Lombar)");

  const nomesCatalogoPorCategoria = Array.from(
    EXERCISE_CATALOG.reduce((acc, item) => {
      const list = acc.get(item.categoria) || [];
      list.push(item.nome);
      acc.set(item.categoria, list);
      return acc;
    }, new Map<string, string[]>()).entries()
  )
    .map(([cat, nomes]) => `${cat}: ${nomes.join(', ')}`)
    .join('\n');

  const prompt = `Você é um Treinador de Elite especialista em Fisiologia do Exercício, Biomecânica e Periodização Científica.
Monte uma prescrição de treino 100% personalizada e EXCLUSIVA para este perfil (NÃO use fichas genéricas; diferencie rigorosamente pela idade de ${idade} anos, peso de ${peso} kg, sexo ${anamnese.genero || 'masculino'}, objetivo e nível):

PERFIL DO ALUNO:
- Nome: ${alunoNome} | Idade: ${idade} anos | Sexo: ${anamnese.genero || 'masculino'}
- Biometria: ${peso} kg, ${anamnese.alturaCm || 172} cm (IMC ${imc})
- Diretriz Etária & Maturacional: ${diretrizPorFaixaEtaria[faixaEtaria]}
- Diretriz de Gênero: ${diretrizPorGenero}
- Objetivo Principal: ${anamnese.objetivo.toUpperCase()} -> ${diretrizPorObjetivo[anamnese.objetivo]}
- Experiência: ${anamnese.experiencia.toUpperCase()} -> ${diretrizPorNivel[anamnese.experiencia]}
- Frequência: ${anamnese.diasSemana}x por semana -> Monte EXATAMENTE: ${diretrizDivisao}
- Tempo por sessão: ${anamnese.tempoMinutos} minutos -> Inclua ${qtdEx} exercícios por divisão
- Ambiente disponível: ${anamnese.tipoAmbiente}
- Limitações/Dores: ${anamnese.limitacoes?.length ? anamnese.limitacoes.join(", ") : "Nenhuma limitação articular"}
${anamnese.observacoes ? `- Observações do aluno: ${anamnese.observacoes}` : ""}
${customPromptExtra ? `- INSTRUÇÃO ESPECÍFICA DO TREINADOR: ${customPromptExtra}` : ""}

CATÁLOGO OFICIAL DE EXERCÍCIOS COM VÍDEO/GIF (use preferencialmente estes nomes exatos para "nome" e "exercicioSubstituto"):
${nomesCatalogoPorCategoria}

REGRAS BIOMECÂNICAS OBRIGATÓRIAS:
1. ORDEM DOS EXERCÍCIOS: Em toda divisão, coloque SEMPRE os exercícios multiarticulares compostos primeiro (ex: Supino Reto/Inclinado, Puxada/Remada, Leg Press/Agachamento/Elevação Pélvica) e deixe os isoladores (Crucifixo, Extensora, Rosca, Tríceps, Elevação Lateral) para a segunda metade do treino. NUNCA comece um treino de Peito com Crucifixo ou um treino de Ombro com Elevação Frontal sem um Desenvolvimento antes!
2. ADEQUAÇÃO DE IDADE E PESO (${idade} anos, ${peso} kg): Calibre "cargaSugeridaKg" de forma 100% fiel à idade de ${idade} anos, peso de ${peso}kg, sexo ${anamnese.genero || 'masculino'} e nível ${anamnese.experiencia}.
3. Em "exercicioSubstituto", informe o nome exato de outro exercício equivalente do catálogo acima da mesma categoria muscular.
4. Retorne APENAS um JSON válido com esta estrutura exata:
{"titulo":"Título específico do plano","orientacoesGerais":"Explicação fisiológica personalizada para ${alunoNome} (${idade} anos, ${peso}kg) (máx 260 caracteres)","divisoes":[{"letra":"A","nome":"Treino A - ...","focoMuscular":["..."],"exercicios":[{"nome":"...","grupoMuscular":"...","equipamento":"...","series":3,"repeticoes":"10-12","descansoSegundos":60,"cargaSugeridaKg":10,"instrucoes":"Dica biomecânica curta","exercicioSubstituto":"..."}]}]}`;

  const defaultModels = [
    "models/gemini-2.5-flash-lite",
    "models/gemini-2.5-flash",
    "models/gemini-flash-lite-latest",
    "models/gemini-flash-latest",
    "models/gemini-2.0-flash-lite",
    "models/gemini-2.0-flash"
  ];

  const cachedModel = localStorage.getItem(AI_WORKING_MODEL_KEY);
  let candidateModels = cachedModel
    ? Array.from(new Set([cachedModel, ...defaultModels]))
    : [...defaultModels];

  let lastError: any = null;
  let parsed: any = null;

  for (const modelName of candidateModels) {
    // Bloqueio estrito de modelos '-pro' para blindar o faturamento
    if (modelName.includes("-pro")) continue;

    const url = `https://generativelanguage.googleapis.com/v1beta/${modelName}:generateContent?key=${GEMINI_API_KEY}`;
    try {
      const genConfig: Record<string, any> = {
        responseMimeType: "application/json",
        temperature: 0.45,
        maxOutputTokens: 8192
      };

      // Desliga os Thinking Tokens ocultos nos modelos Gemini 2.5 / latest (reduz o custo em até 85% e evita cortar o JSON)
      if (modelName.includes("2.5") || modelName.includes("latest")) {
        genConfig.thinkingConfig = { thinkingBudget: 0 };
      }

      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ role: "user", parts: [{ text: prompt }] }],
          generationConfig: genConfig
        })
      });

      if (response.ok) {
        const data = await response.json();
        const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (!rawText) {
          lastError = new Error(`Resposta vazia da IA (${modelName})`);
          continue;
        }

        const cleanedJson = rawText.replace(/^```json\s*/i, "").replace(/```\s*$/i, "").trim();
        parsed = JSON.parse(cleanedJson);
        localStorage.setItem(AI_WORKING_MODEL_KEY, modelName);
        console.info(`✅ Treino personalizado gerado pela IA (${modelName})!`);
        break;
      } else {
        const errText = await response.text();
        lastError = new Error(`Erro Gemini (${modelName}) HTTP ${response.status}: ${errText}`);
      }
    } catch (err) {
      lastError = err;
    }
  }

  if (!parsed) {
    throw lastError || new Error("Não foi possível obter JSON válido dos endpoints econômicos Gemini.");
  }

  const divisoesFormatadas = (parsed.divisoes || []).map((div: any, idx: number) => ({
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
  }));

  return {
    id: 'treino_' + Date.now(),
    alunoId,
    titulo: parsed.titulo || `Treino Personalizado - ${anamnese.objetivo}`,
    criadoPor: 'ia',
    dataCriacao: new Date().toISOString(),
    ativo: true,
    fase: 1,
    metaCiclos: calcularMetaCiclosIdeal(anamnese, divisoesFormatadas.length),
    orientacoesGerais: parsed.orientacoesGerais,
    divisoes: divisoesFormatadas
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
    metaCiclos: planoAtual.metaCiclos || calcularMetaCiclosIdeal(anamnese, divisoesEvoluidas.length),
    titulo: `Fase ${novaFase} • Periodização Evoluída (${anamnese.objetivo.toUpperCase()})`,
    orientacoesGerais: `Bem-vindo à Fase ${novaFase}! Os exercícios e angulações foram renovados pelo motor biomecânico para gerar novos estímulos neuromusculares, evitar platô e aproveitar a força construída na Fase ${novaFase - 1}.`,
    divisoes: divisoesEvoluidas
  };
}

/**
 * Motor de prescrição biomecânica dinâmico baseado no Catálogo Oficial (EXERCISE_CATALOG).
 * Seleciona exercícios, divisões, métodos e volumes distintos para cada combinação de:
 * Objetivo (Hipertrofia, Emagrecimento, Força, Condicionamento) + Experiência + Gênero + Dias + Tempo + Limitações.
 */
export function gerarTreinoBaseadoEmRegras(
  alunoNome: string,
  alunoId: string,
  anamnese: Anamnesis,
  customPromptExtra?: string
): WorkoutPlan {
  const {
    diasSemana = 4,
    experiencia = 'iniciante',
    objetivo = 'hipertrofia',
    tempoMinutos = 60,
    genero = 'masculino',
    tipoAmbiente = 'academia_completa',
    limitacoes = [],
    idade = 25
  } = anamnese;

  const faixaEtaria = getAgeBracket(idade);
  const temDorJoelho = limitacoes.includes('joelho');
  const temDorOmbro = limitacoes.includes('ombro');
  const temDorLombar = limitacoes.includes('lombar');
  const temDorPunho = limitacoes.includes('punho');

  // Quantidade alvo de exercícios por divisão de acordo com o tempo disponível, idade e experiência
  const qtdExPorDivisao =
    faixaEtaria === 'adolescente_jovem' || faixaEtaria === 'senior'
      ? (tempoMinutos <= 45 ? 5 : 6)
      : experiencia === 'iniciante'
      ? (tempoMinutos <= 30 ? 4 : tempoMinutos <= 45 ? 5 : tempoMinutos <= 60 ? 6 : 7)
      : (tempoMinutos <= 30 ? 4 : tempoMinutos <= 45 ? 5 : tempoMinutos <= 60 ? 6 : tempoMinutos <= 90 ? 7 : 8);

  // Configuração fisiológica por objetivo + experiência + faixa etária
  const repConfig = {
    hipertrofia: {
      repsComposto: faixaEtaria === 'adolescente_jovem' ? '10-12' : experiencia === 'avancado' ? '6-10' : '8-12',
      repsIsolado: '10-15',
      seriesComposto: experiencia === 'iniciante' || faixaEtaria === 'adolescente_jovem' ? 3 : 4,
      seriesIsolado: 3,
      descansoComposto: faixaEtaria === 'adolescente_jovem' ? 60 : 75,
      descansoIsolado: 60
    },
    emagrecimento: {
      repsComposto: '12-15',
      repsIsolado: '15-20',
      seriesComposto: 3,
      seriesIsolado: 3,
      descansoComposto: 45,
      descansoIsolado: 35
    },
    forca: {
      repsComposto: faixaEtaria === 'adolescente_jovem' ? '8-10' : '4-6',
      repsIsolado: faixaEtaria === 'adolescente_jovem' ? '10-12' : '6-8',
      seriesComposto: experiencia === 'iniciante' || faixaEtaria === 'adolescente_jovem' ? 3 : 5,
      seriesIsolado: 3,
      descansoComposto: 110,
      descansoIsolado: 90
    },
    condicionamento: {
      repsComposto: '12-15',
      repsIsolado: '15-18',
      seriesComposto: 3,
      seriesIsolado: 3,
      descansoComposto: 50,
      descansoIsolado: 45
    }
  }[objetivo];

  // Identifica se um exercício é Multiarticular Composto Principal (deve vir sempre no início do treino!)
  const isCompoundExercise = (nome: string): boolean => {
    const nm = nome.toLowerCase();
    return (
      nm.includes('supino') ||
      nm.includes('flexão de braços') ||
      nm.includes('paralelas') ||
      nm.includes('puxada') ||
      nm.includes('remada') ||
      nm.includes('barra fixa') ||
      nm.includes('agachamento') ||
      nm.includes('leg press') ||
      nm.includes('afundo') ||
      nm.includes('búlgaro') ||
      nm.includes('levantamento terra') ||
      nm.includes('stiff') ||
      nm.includes('elevação pélvica') ||
      nm.includes('desenvolvimento')
    );
  };

  // Filtra e pontua exercícios do catálogo de acordo com o perfil do aluno
  const escolherExerciciosDaCategoria = (categoria: string, quantidade: number, offsetSeed = 0) => {
    let candidatos = EXERCISE_CATALOG.filter((item) => item.categoria === categoria);

    // Filtro de proteção maturarional (adolescentes de 12-15 anos e idosos 60+ sem sobrecarga axial pesada)
    if (faixaEtaria === 'adolescente_jovem' || faixaEtaria === 'senior') {
      const seguros = candidatos.filter(
        (c) =>
          !c.nome.toLowerCase().includes('levantamento terra') &&
          !c.nome.toLowerCase().includes('stiff com barra') &&
          !c.nome.toLowerCase().includes('agachamento livre com barra') &&
          !c.nome.toLowerCase().includes('remada curvada com barra') &&
          !c.nome.toLowerCase().includes('desenvolvimento militar com barra')
      );
      if (seguros.length >= quantidade) candidatos = seguros;
    }

    // Filtro de proteção articular
    if (temDorJoelho && categoria === 'Quadríceps') {
      candidatos = candidatos.filter(
        (c) => !c.nome.toLowerCase().includes('livre') && !c.nome.toLowerCase().includes('afundo')
      );
    }
    if (temDorLombar) {
      candidatos = candidatos.filter(
        (c) =>
          !c.nome.toLowerCase().includes('terra') &&
          !c.nome.toLowerCase().includes('curvada com barra') &&
          !c.nome.toLowerCase().includes('agachamento livre')
      );
    }
    if (temDorOmbro && (categoria === 'Peitoral' || categoria === 'Ombros / Deltóides')) {
      candidatos = candidatos.filter(
        (c) => !c.nome.toLowerCase().includes('barra') && !c.nome.toLowerCase().includes('paralelas')
      );
    }
    if (temDorPunho) {
      candidatos = candidatos.filter((c) => !c.nome.toLowerCase().includes('barra reta'));
    }
    if (tipoAmbiente === 'halteres_apenas') {
      const livres = candidatos.filter(
        (c) =>
          c.equipamento.toLowerCase().includes('halter') ||
          c.equipamento.toLowerCase().includes('peso') ||
          c.equipamento.toLowerCase().includes('solo') ||
          c.equipamento.toLowerCase().includes('barra')
      );
      if (livres.length >= quantidade) candidatos = livres;
    }

    if (candidatos.length === 0) {
      candidatos = EXERCISE_CATALOG.filter((item) => item.categoria === categoria);
    }

    // Separa Compostos (básicos) e Isoladores para garantir que NUNCA faltem compostos e que venham primeiro!
    const pontuar = (ex: (typeof candidatos)[0]) => {
      const eq = ex.equipamento.toLowerCase();
      const nm = ex.nome.toLowerCase();
      let pts = isCompoundExercise(ex.nome) ? 10 : 0;

      if (experiencia === 'iniciante' || faixaEtaria === 'adolescente_jovem') {
        if (eq.includes('máquina') || eq.includes('articula') || eq.includes('guiada')) pts += 6;
        if (eq.includes('halter') || eq.includes('polia')) pts += 4;
      } else if (experiencia === 'avancado') {
        if (eq.includes('barra') || eq.includes('livre') || eq.includes('halter')) pts += 5;
      } else {
        if (eq.includes('halter') || eq.includes('máquina') || eq.includes('polia')) pts += 4;
      }

      if (objetivo === 'forca') {
        if (isCompoundExercise(ex.nome)) pts += 8;
      } else if (objetivo === 'emagrecimento') {
        if (nm.includes('goblet') || nm.includes('afundo') || nm.includes('remada') || nm.includes('flexão') || nm.includes('prancha') || nm.includes('bicicleta')) pts += 6;
      } else if (objetivo === 'condicionamento') {
        if (eq.includes('máquina') || eq.includes('polia') || eq.includes('solo')) pts += 5;
      }

      return pts;
    };

    const compostos = candidatos.filter((c) => isCompoundExercise(c.nome)).sort((a, b) => pontuar(b) - pontuar(a));
    const isoladores = candidatos.filter((c) => !isCompoundExercise(c.nome)).sort((a, b) => pontuar(b) - pontuar(a));

    const seedPerf =
      (objetivo === 'hipertrofia' ? 0 : objetivo === 'emagrecimento' ? 1 : objetivo === 'forca' ? 2 : 3) +
      (experiencia === 'iniciante' ? 0 : experiencia === 'intermediario' ? 1 : 2) +
      (genero === 'feminino' ? 1 : 0) +
      offsetSeed;

    const selecionados: typeof candidatos = [];

    // Se a categoria possui compostos (Peito, Costas, Quadríceps, Posterior, Glúteos, Ombros), garante Compostos primeiro!
    const metaCompostos = compostos.length > 0 ? Math.min(compostos.length, Math.max(1, Math.ceil(quantidade * 0.6))) : 0;
    for (let i = 0; i < metaCompostos; i++) {
      const item = compostos[(i + seedPerf) % compostos.length];
      if (item && !selecionados.some((s) => s.nome === item.nome)) {
        selecionados.push(item);
      }
    }

    // Completa o restante da categoria com Isoladores (ou demais compostos disponíveis)
    const poolRestante = [...isoladores, ...compostos];
    for (let i = 0; selecionados.length < quantidade && i < poolRestante.length * 2; i++) {
      const item = poolRestante[(i + seedPerf) % poolRestante.length];
      if (item && !selecionados.some((s) => s.nome === item.nome)) {
        selecionados.push(item);
      }
    }

    return selecionados;
  };

  // Define os blocos de divisões de acordo com diasSemana, objetivo, experiência, idade e gênero
  type BlocoDivisao = {
    letra: string;
    nome: string;
    focoMuscular: string[];
    receitaCategorias: { cat: string; qtd: number; seed?: number }[];
  };

  const blocos: BlocoDivisao[] = [];

  // Regra fisiológica: Iniciantes ou Adolescentes (<=15 anos) que treinam 5x, 6x ou 7x/semana
  // fazem periodização ABC (3 divisões repetidas 2x na semana = ABC 2x), e NÃO ABCDE!
  const usarABC2xParaAltaFrequencia =
    diasSemana >= 5 && (experiencia === 'iniciante' || faixaEtaria === 'adolescente_jovem');

  if (diasSemana <= 2) {
    blocos.push(
      {
        letra: 'A',
        nome: `Treino A - Corpo Inteiro (${genero === 'feminino' ? 'Foco Quadríceps, Glúteos & Superiores' : 'Foco Empurrar, Quadríceps & Core'})`,
        focoMuscular: genero === 'feminino' ? ['Quadríceps', 'Glúteos', 'Costas', 'Ombros', 'Abdômen'] : ['Peitoral', 'Quadríceps', 'Ombros', 'Tríceps', 'Abdômen'],
        receitaCategorias: genero === 'feminino'
          ? [
              { cat: 'Quadríceps', qtd: 2, seed: 0 },
              { cat: 'Glúteos', qtd: 2, seed: 0 },
              { cat: 'Costas / Dorsal', qtd: 1, seed: 0 },
              { cat: 'Ombros / Deltóides', qtd: 1, seed: 0 },
              { cat: 'Abdômen / Core', qtd: 1, seed: 0 }
            ]
          : [
              { cat: 'Peitoral', qtd: 2, seed: 0 },
              { cat: 'Quadríceps', qtd: 2, seed: 0 },
              { cat: 'Ombros / Deltóides', qtd: 1, seed: 0 },
              { cat: 'Tríceps', qtd: 1, seed: 0 },
              { cat: 'Abdômen / Core', qtd: 1, seed: 0 }
            ]
      },
      {
        letra: 'B',
        nome: `Treino B - Corpo Inteiro (${genero === 'feminino' ? 'Foco Posterior, Glúteos & Linha de Cintura' : 'Foco Puxar, Posterior & Bíceps'})`,
        focoMuscular: genero === 'feminino' ? ['Posterior de Coxa', 'Glúteos', 'Peitoral', 'Braços', 'Panturrilha'] : ['Costas', 'Posterior de Coxa', 'Glúteos', 'Bíceps', 'Panturrilha'],
        receitaCategorias: genero === 'feminino'
          ? [
              { cat: 'Posterior de Coxa', qtd: 2, seed: 0 },
              { cat: 'Glúteos', qtd: 2, seed: 1 },
              { cat: 'Peitoral', qtd: 1, seed: 0 },
              { cat: 'Tríceps', qtd: 1, seed: 0 },
              { cat: 'Panturrilha', qtd: 1, seed: 0 },
              { cat: 'Abdômen / Core', qtd: 1, seed: 1 }
            ]
          : [
              { cat: 'Costas / Dorsal', qtd: 2, seed: 0 },
              { cat: 'Posterior de Coxa', qtd: 2, seed: 0 },
              { cat: 'Glúteos', qtd: 1, seed: 0 },
              { cat: 'Bíceps / Antebraço', qtd: 1, seed: 0 },
              { cat: 'Panturrilha', qtd: 1, seed: 0 },
              { cat: 'Abdômen / Core', qtd: 1, seed: 1 }
            ]
      }
    );
  } else if (diasSemana === 3 || usarABC2xParaAltaFrequencia) {
    // 3x/semana OU Iniciante/Jovem em 5x-7x/semana (ABC 2x) -> Diferenciação total entre Feminino e Masculino!
    const sufixoFreq = usarABC2xParaAltaFrequencia ? ' (Rotação ABC 2x)' : '';
    if (genero === 'feminino') {
      blocos.push(
        {
          letra: 'A',
          nome: `Treino A - Quadríceps, Glúteos e Panturrilha${sufixoFreq}`,
          focoMuscular: ['Quadríceps', 'Glúteos', 'Panturrilha'],
          receitaCategorias: [
            { cat: 'Quadríceps', qtd: 3, seed: 0 },
            { cat: 'Glúteos', qtd: 2, seed: 0 },
            { cat: 'Panturrilha', qtd: 1, seed: 0 },
            { cat: 'Abdômen / Core', qtd: 1, seed: 0 }
          ]
        },
        {
          letra: 'B',
          nome: `Treino B - Superiores Elegantes, Postura e Core${sufixoFreq}`,
          focoMuscular: ['Costas / Dorsal', 'Ombros / Deltóides', 'Peitoral', 'Braços', 'Abdômen'],
          receitaCategorias: [
            { cat: 'Costas / Dorsal', qtd: 2, seed: 0 },
            { cat: 'Ombros / Deltóides', qtd: 2, seed: 0 },
            { cat: 'Peitoral', qtd: 1, seed: 0 },
            { cat: 'Tríceps', qtd: 1, seed: 0 },
            { cat: 'Bíceps / Antebraço', qtd: 1, seed: 0 },
            { cat: 'Abdômen / Core', qtd: 1, seed: 1 }
          ]
        },
        {
          letra: 'C',
          nome: `Treino C - Glúteos em Foco, Posterior de Coxa e Core${sufixoFreq}`,
          focoMuscular: ['Glúteos', 'Posterior de Coxa', 'Abdômen'],
          receitaCategorias: [
            { cat: 'Glúteos', qtd: 3, seed: 1 },
            { cat: 'Posterior de Coxa', qtd: 3, seed: 0 },
            { cat: 'Panturrilha', qtd: 1, seed: 1 },
            { cat: 'Abdômen / Core', qtd: 1, seed: 2 }
          ]
        }
      );
    } else {
      blocos.push(
        {
          letra: 'A',
          nome: `Treino A - Peitoral, Ombros e Tríceps (Empurrar)${sufixoFreq}`,
          focoMuscular: ['Peitoral', 'Ombros / Deltóides', 'Tríceps'],
          receitaCategorias: [
            { cat: 'Peitoral', qtd: 2, seed: 0 },
            { cat: 'Ombros / Deltóides', qtd: 2, seed: 0 },
            { cat: 'Tríceps', qtd: 2, seed: 0 },
            { cat: 'Abdômen / Core', qtd: 1, seed: 0 }
          ]
        },
        {
          letra: 'B',
          nome: `Treino B - Costas, Trapézio e Bíceps (Puxar)${sufixoFreq}`,
          focoMuscular: ['Costas / Dorsal', 'Bíceps / Antebraço', 'Abdômen'],
          receitaCategorias: [
            { cat: 'Costas / Dorsal', qtd: 3, seed: 0 },
            { cat: 'Bíceps / Antebraço', qtd: 2, seed: 0 },
            { cat: 'Ombros / Deltóides', qtd: 1, seed: 2 },
            { cat: 'Abdômen / Core', qtd: 1, seed: 1 }
          ]
        },
        {
          letra: 'C',
          nome: `Treino C - Pernas Completas (Quadríceps, Posterior e Panturrilha)${sufixoFreq}`,
          focoMuscular: ['Quadríceps', 'Posterior de Coxa', 'Glúteos', 'Panturrilha'],
          receitaCategorias: [
            { cat: 'Quadríceps', qtd: 3, seed: 0 },
            { cat: 'Posterior de Coxa', qtd: 2, seed: 0 },
            { cat: 'Glúteos', qtd: 1, seed: 0 },
            { cat: 'Panturrilha', qtd: 1, seed: 0 }
          ]
        }
      );
    }
  } else if (diasSemana === 4) {
    // 4x/semana -> ABCD diferenciado por sexo e objetivo
    if (genero === 'feminino') {
      blocos.push(
        {
          letra: 'A',
          nome: 'Treino A - Quadríceps, Glúteos Base e Panturrilha',
          focoMuscular: ['Quadríceps', 'Glúteos', 'Panturrilha'],
          receitaCategorias: [
            { cat: 'Quadríceps', qtd: 4, seed: 0 },
            { cat: 'Glúteos', qtd: 2, seed: 0 },
            { cat: 'Panturrilha', qtd: 1, seed: 0 }
          ]
        },
        {
          letra: 'B',
          nome: 'Treino B - Costas, Linha de Ombros e Postura',
          focoMuscular: ['Costas / Dorsal', 'Ombros / Deltóides', 'Abdômen'],
          receitaCategorias: [
            { cat: 'Costas / Dorsal', qtd: 3, seed: 0 },
            { cat: 'Ombros / Deltóides', qtd: 2, seed: 0 },
            { cat: 'Abdômen / Core', qtd: 2, seed: 0 }
          ]
        },
        {
          letra: 'C',
          nome: 'Treino C - Glúteos em Foco e Posterior de Coxa',
          focoMuscular: ['Glúteos', 'Posterior de Coxa', 'Panturrilha'],
          receitaCategorias: [
            { cat: 'Glúteos', qtd: 3, seed: 1 },
            { cat: 'Posterior de Coxa', qtd: 3, seed: 0 },
            { cat: 'Panturrilha', qtd: 1, seed: 1 }
          ]
        },
        {
          letra: 'D',
          nome: 'Treino D - Superiores Tonificados (Peito, Bíceps, Tríceps e Core)',
          focoMuscular: ['Peitoral', 'Tríceps', 'Bíceps / Antebraço', 'Abdômen'],
          receitaCategorias: [
            { cat: 'Peitoral', qtd: 2, seed: 0 },
            { cat: 'Tríceps', qtd: 2, seed: 0 },
            { cat: 'Bíceps / Antebraço', qtd: 2, seed: 0 },
            { cat: 'Abdômen / Core', qtd: 1, seed: 1 }
          ]
        }
      );
    } else {
      blocos.push(
        {
          letra: 'A',
          nome: 'Treino A - Peitoral, Ombros Anterior/Lateral e Abdômen',
          focoMuscular: ['Peitoral', 'Ombros / Deltóides', 'Abdômen'],
          receitaCategorias: [
            { cat: 'Peitoral', qtd: 3, seed: 0 },
            { cat: 'Ombros / Deltóides', qtd: 2, seed: 0 },
            { cat: 'Abdômen / Core', qtd: 2, seed: 0 }
          ]
        },
        {
          letra: 'B',
          nome: 'Treino B - Costas Completas e Deltóide Posterior',
          focoMuscular: ['Costas / Dorsal', 'Ombros / Deltóides'],
          receitaCategorias: [
            { cat: 'Costas / Dorsal', qtd: 4, seed: 0 },
            { cat: 'Ombros / Deltóides', qtd: 2, seed: 2 },
            { cat: 'Abdômen / Core', qtd: 1, seed: 1 }
          ]
        },
        {
          letra: 'C',
          nome: 'Treino C - Pernas Completas (Quadríceps, Posterior e Glúteos)',
          focoMuscular: ['Quadríceps', 'Posterior de Coxa', 'Glúteos', 'Panturrilha'],
          receitaCategorias: [
            { cat: 'Quadríceps', qtd: 3, seed: 0 },
            { cat: 'Posterior de Coxa', qtd: 2, seed: 0 },
            { cat: 'Glúteos', qtd: 1, seed: 0 },
            { cat: 'Panturrilha', qtd: 2, seed: 0 }
          ]
        },
        {
          letra: 'D',
          nome: 'Treino D - Bíceps, Tríceps, Antebraço e Core',
          focoMuscular: ['Bíceps / Antebraço', 'Tríceps', 'Abdômen'],
          receitaCategorias: [
            { cat: 'Bíceps / Antebraço', qtd: 3, seed: 0 },
            { cat: 'Tríceps', qtd: 3, seed: 0 },
            { cat: 'Panturrilha', qtd: 1, seed: 1 },
            { cat: 'Abdômen / Core', qtd: 1, seed: 2 }
          ]
        }
      );
    }
  } else {
    // 5x, 6x ou 7x/semana para Intermediários e Avançados -> ABCDE diferenciado por Sexo!
    if (genero === 'feminino') {
      blocos.push(
        {
          letra: 'A',
          nome: 'Treino A - Quadríceps em Foco e Panturrilhas',
          focoMuscular: ['Quadríceps', 'Panturrilha'],
          receitaCategorias: [
            { cat: 'Quadríceps', qtd: 4, seed: 0 },
            { cat: 'Glúteos', qtd: 1, seed: 0 },
            { cat: 'Panturrilha', qtd: 2, seed: 0 }
          ]
        },
        {
          letra: 'B',
          nome: 'Treino B - Costas, Escápulas e Linha de Ombros',
          focoMuscular: ['Costas / Dorsal', 'Ombros / Deltóides', 'Abdômen'],
          receitaCategorias: [
            { cat: 'Costas / Dorsal', qtd: 3, seed: 0 },
            { cat: 'Ombros / Deltóides', qtd: 3, seed: 0 },
            { cat: 'Abdômen / Core', qtd: 1, seed: 0 }
          ]
        },
        {
          letra: 'C',
          nome: 'Treino C - Glúteos em Máxima Contração e Core',
          focoMuscular: ['Glúteos', 'Abdômen / Core'],
          receitaCategorias: [
            { cat: 'Glúteos', qtd: 4, seed: 0 },
            { cat: 'Quadríceps', qtd: 1, seed: 2 },
            { cat: 'Abdômen / Core', qtd: 2, seed: 1 }
          ]
        },
        {
          letra: 'D',
          nome: 'Treino D - Superiores Definidos (Peitoral, Tríceps e Bíceps)',
          focoMuscular: ['Peitoral', 'Tríceps', 'Bíceps / Antebraço'],
          receitaCategorias: [
            { cat: 'Peitoral', qtd: 2, seed: 0 },
            { cat: 'Tríceps', qtd: 2, seed: 0 },
            { cat: 'Bíceps / Antebraço', qtd: 2, seed: 0 },
            { cat: 'Abdômen / Core', qtd: 1, seed: 2 }
          ]
        },
        {
          letra: 'E',
          nome: 'Treino E - Posterior de Coxa, Glúteos e Panturrilha',
          focoMuscular: ['Posterior de Coxa', 'Glúteos', 'Panturrilha'],
          receitaCategorias: [
            { cat: 'Posterior de Coxa', qtd: 4, seed: 0 },
            { cat: 'Glúteos', qtd: 2, seed: 2 },
            { cat: 'Panturrilha', qtd: 1, seed: 1 }
          ]
        }
      );
    } else {
      blocos.push(
        {
          letra: 'A',
          nome: 'Treino A - Peitoral e Tríceps (Empurrar)',
          focoMuscular: ['Peitoral', 'Tríceps'],
          receitaCategorias: [
            { cat: 'Peitoral', qtd: 4, seed: 0 },
            { cat: 'Tríceps', qtd: 3, seed: 0 },
            { cat: 'Abdômen / Core', qtd: 1, seed: 0 }
          ]
        },
        {
          letra: 'B',
          nome: 'Treino B - Costas e Bíceps (Puxar)',
          focoMuscular: ['Costas / Dorsal', 'Bíceps / Antebraço'],
          receitaCategorias: [
            { cat: 'Costas / Dorsal', qtd: 4, seed: 0 },
            { cat: 'Bíceps / Antebraço', qtd: 3, seed: 0 },
            { cat: 'Abdômen / Core', qtd: 1, seed: 1 }
          ]
        },
        {
          letra: 'C',
          nome: 'Treino C - Quadríceps e Panturrilhas (Inferior Anterior)',
          focoMuscular: ['Quadríceps', 'Glúteos', 'Panturrilha'],
          receitaCategorias: [
            { cat: 'Quadríceps', qtd: 4, seed: 0 },
            { cat: 'Glúteos', qtd: 2, seed: 0 },
            { cat: 'Panturrilha', qtd: 2, seed: 0 }
          ]
        },
        {
          letra: 'D',
          nome: 'Treino D - Ombros Completos, Trapézio e Core',
          focoMuscular: ['Ombros / Deltóides', 'Tríceps', 'Abdômen'],
          receitaCategorias: [
            { cat: 'Ombros / Deltóides', qtd: 4, seed: 0 },
            { cat: 'Peitoral', qtd: 1, seed: 3 },
            { cat: 'Bíceps / Antebraço', qtd: 1, seed: 2 },
            { cat: 'Abdômen / Core', qtd: 2, seed: 0 }
          ]
        },
        {
          letra: 'E',
          nome: 'Treino E - Posterior de Coxa, Glúteos e Panturrilha',
          focoMuscular: ['Posterior de Coxa', 'Glúteos', 'Panturrilha'],
          receitaCategorias: [
            { cat: 'Posterior de Coxa', qtd: 4, seed: 0 },
            { cat: 'Glúteos', qtd: 3, seed: 0 },
            { cat: 'Panturrilha', qtd: 1, seed: 1 }
          ]
        }
      );
    }
  }

  // Calibra as cargas sugeridas com base no peso corporal real, idade, nível de experiência e gênero do aluno
  const pesoRef = anamnese.pesoKg || 72;
  const fatorPeso = Math.max(0.35, Math.min(1.5, pesoRef / 75));
  const fatorIdade =
    faixaEtaria === 'adolescente_jovem' ? 0.65 :
    faixaEtaria === 'juvenil' ? 0.85 :
    faixaEtaria === 'senior' ? 0.65 :
    faixaEtaria === 'master' ? 0.85 : 1.0;
  const fatorExp = experiencia === 'iniciante' ? 0.72 : experiencia === 'avancado' ? 1.25 : 1.0;
  const fatorGenero = genero === 'feminino' ? 0.82 : 1.0;
  const fatorObj = objetivo === 'forca' ? 1.15 : objetivo === 'emagrecimento' ? 0.85 : 1.0;
  const multiplicadorCarga = fatorPeso * fatorIdade * fatorExp * fatorGenero * fatorObj;

  const divisoes: WorkoutDivision[] = blocos.map((bloco, dIdx) => {
    const listaBruta = bloco.receitaCategorias.flatMap((r) =>
      escolherExerciciosDaCategoria(r.cat, r.qtd, r.seed || 0)
    );
    const recortada = listaBruta.slice(0, qtdExPorDivisao);

    return {
      id: `div_${dIdx + 1}`,
      letra: bloco.letra,
      nome: bloco.nome,
      focoMuscular: bloco.focoMuscular,
      exercicios: recortada.map((catEx, eIdx) => {
        const isComposto = eIdx < 2;
        const cargaCalculada =
          catEx.cargaPadraoKg > 0
            ? Math.max(2, Math.round(catEx.cargaPadraoKg * multiplicadorCarga))
            : undefined;

        return {
          id: `ex_${dIdx + 1}_${eIdx + 1}`,
          nome: catEx.nome,
          grupoMuscular: catEx.categoria,
          equipamento: catEx.equipamento,
          series: isComposto ? repConfig.seriesComposto : repConfig.seriesIsolado,
          repeticoes: isComposto ? repConfig.repsComposto : repConfig.repsIsolado,
          descansoSegundos: isComposto ? repConfig.descansoComposto : repConfig.descansoIsolado,
          cargaSugeridaKg: cargaCalculada,
          instrucoes: catEx.instrucoes,
          exercicioSubstituto: catEx.substituto
        };
      })
    };
  });

  const infoBiometria =
    anamnese.pesoKg && anamnese.alturaCm
      ? ` (${anamnese.pesoKg} kg, ${anamnese.alturaCm} cm${anamnese.idade ? `, ${anamnese.idade} anos` : ''})`
      : '';

  return {
    id: 'treino_' + Date.now(),
    alunoId,
    titulo: `Periodização ${objetivo.toUpperCase()} • Nível ${experiencia.toUpperCase()} (${diasSemana}x/sem)`,
    criadoPor: 'ia',
    dataCriacao: new Date().toISOString(),
    ativo: true,
    fase: 1,
    metaCiclos: calcularMetaCiclosIdeal(anamnese, divisoes.length),
    orientacoesGerais: `Prescrição personalizada para ${alunoNome.split(' ')[0]}${infoBiometria}, estruturada especificamente para ${objetivo.toUpperCase()} no nível ${experiencia} (${tempoMinutos} min por sessão)${customPromptExtra ? ` • Ajuste: ${customPromptExtra}` : ''}.`,
    divisoes
  };
}
