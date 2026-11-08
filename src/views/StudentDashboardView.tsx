import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { WorkoutPlan, WorkoutDivision, WorkoutLog, UserProfile } from '../types';
import { getActiveWorkoutPlan, getStudentWorkoutLogs, getUserProfile, saveWorkoutPlan } from '../services/storageService';
import { evoluirTreinoComIA } from '../services/aiService';
import { 
  Play, 
  Dumbbell, 
  Calendar, 
  Sparkles, 
  CheckCircle, 
  Clock, 
  TrendingUp, 
  UserCheck, 
  RefreshCw,
  Flame
} from 'lucide-react';

interface StudentDashboardViewProps {
  onStartWorkout: (division: WorkoutDivision, plan: WorkoutPlan) => void;
  onOpenAnamnesis: () => void;
}

export const StudentDashboardView: React.FC<StudentDashboardViewProps> = ({
  onStartWorkout,
  onOpenAnamnesis
}) => {
  const { user } = useAuth();
  const [activePlan, setActivePlan] = useState<WorkoutPlan | null>(null);
  const [history, setHistory] = useState<WorkoutLog[]>([]);
  const [teacher, setTeacher] = useState<UserProfile | null>(null);
  const [selectedDivisionIndex, setSelectedDivisionIndex] = useState(0);
  const [recommendedDivisionIndex, setRecommendedDivisionIndex] = useState(0);
  const [lastCompletedDivisionIndex, setLastCompletedDivisionIndex] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [evolving, setEvolving] = useState(false);

  const handleEvolveWorkout = async () => {
    if (!user || !activePlan || evolving) return;
    setEvolving(true);
    try {
      const anamnesePadrao = user.anamnese || {
        objetivo: 'hipertrofia',
        experiencia: 'intermediario',
        diasSemana: 4,
        tempoMinutos: 60,
        limitacoes: [],
        tipoAmbiente: 'academia_completa'
      };
      const novoPlano = await evoluirTreinoComIA(
        user.nome,
        user.id,
        anamnesePadrao,
        activePlan,
        history
      );
      await saveWorkoutPlan(novoPlano);
      setActivePlan(novoPlano);
      setSelectedDivisionIndex(0);
      setRecommendedDivisionIndex(0);
      setLastCompletedDivisionIndex(null);
    } catch (err) {
      console.error('Erro ao evoluir ficha de treino:', err);
    } finally {
      setEvolving(false);
    }
  };

  useEffect(() => {
    if (!user) return;

    const loadData = async () => {
      setLoading(true);
      const plan = await getActiveWorkoutPlan(user.id);
      const logs = await getStudentWorkoutLogs(user.id);
      setActivePlan(plan);
      setHistory(logs);

      // Rotação automática de treinos (A -> B -> C -> A...) considerando apenas os treinos desta ficha atual
      const logsDoPlanoAtual = plan ? logs.filter((l) => l.treinoId === plan.id) : [];
      if (plan && plan.divisoes.length > 0 && logsDoPlanoAtual.length > 0) {
        const lastLog = logsDoPlanoAtual[0]; // ordenados do mais recente para o mais antigo
        const lastIdx = plan.divisoes.findIndex(
          (div) =>
            div.id === lastLog.divisaoId ||
            div.nome === lastLog.divisaoNome ||
            lastLog.divisaoNome?.startsWith(`Treino ${div.letra}`)
        );

        if (lastIdx !== -1) {
          const nextIdx = (lastIdx + 1) % plan.divisoes.length;
          setLastCompletedDivisionIndex(lastIdx);
          setRecommendedDivisionIndex(nextIdx);
          setSelectedDivisionIndex(nextIdx);
        }
      } else {
        setLastCompletedDivisionIndex(null);
        setRecommendedDivisionIndex(0);
        setSelectedDivisionIndex(0);
      }

      if (user.professorId) {
        const prof = await getUserProfile(user.professorId);
        setTeacher(prof);
      }
      setLoading(false);
    };

    loadData();
  }, [user]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const isManagedByTeacher = Boolean(user?.professorId) || activePlan?.criadoPor === 'professor';

  // Se o aluno ainda não tem ficha de treino gerada
  if (!activePlan || activePlan.divisoes.length === 0) {
    return (
      <div className="max-w-md mx-auto px-4 py-16 text-center">
        <div className="w-16 h-16 rounded-3xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto mb-4">
          {user?.professorId ? <UserCheck className="w-8 h-8 text-indigo-400" /> : <Sparkles className="w-8 h-8" />}
        </div>
        <h2 className="text-xl font-bold text-white mb-2">
          {user?.professorId ? 'Aguardando prescrição do seu Professor' : 'Nenhum treino ativo encontrado'}
        </h2>
        <p className="text-sm text-slate-400 mb-6">
          {user?.professorId
            ? `Você está vinculado ao treinador ${teacher?.nome || ''}. Assim que ele publicar sua ficha de treino, ela aparecerá automaticamente aqui!`
            : 'Preencha sua anamnese rápida para a IA prescrever sua rotina personalizada de exercícios.'}
        </p>
        {!user?.professorId && (
          <button
            onClick={onOpenAnamnesis}
            className="w-full py-3.5 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-sm transition shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2"
          >
            <Sparkles className="w-4 h-4 fill-current" />
            Preencher Anamnese e Gerar Treino
          </button>
        )}
      </div>
    );
  }

  const currentDivision = activePlan.divisoes[selectedDivisionIndex] || activePlan.divisoes[0];
  const faseAtual = activePlan.fase || 1;
  const metaCiclos = activePlan.metaCiclos || 6;
  const numDivisoes = Math.max(1, activePlan.divisoes.length);
  const logsDestaFicha = history.filter((l) => l.treinoId === activePlan.id);
  const totalSessoesFicha = logsDestaFicha.length;
  const ciclosCompletos = Math.floor(totalSessoesFicha / numDivisoes);
  const metaTotalSessoes = metaCiclos * numDivisoes;
  const percentualMesociclo = Math.min(100, Math.round((totalSessoesFicha / metaTotalSessoes) * 100));
  const cicloProntoParaEvoluir = ciclosCompletos >= metaCiclos;
  const objetivoAtual = user?.anamnese?.objetivo || 'hipertrofia';

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
      {/* Banner de Boas-Vindas & Treinador */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-emerald-400 mb-1 flex-wrap">
              <Flame className="w-4 h-4" />
              <span>Foco: {user?.anamnese?.objetivo?.toUpperCase() || 'HIPERTROFIA'}</span>
              <span>•</span>
              <span>{user?.anamnese?.diasSemana || 4}x por semana</span>
              {user?.anamnese?.pesoKg && user?.anamnese?.alturaCm && (
                <>
                  <span>•</span>
                  <span className="text-slate-300">
                    {user.anamnese.pesoKg} kg / {user.anamnese.alturaCm} cm
                  </span>
                </>
              )}
              <span className="px-2 py-0.5 rounded-full bg-indigo-500/15 border border-indigo-500/30 text-[10px] text-indigo-300 font-bold">
                Fase {faseAtual}
              </span>
              <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-[10px] text-emerald-300">
                {activePlan.criadoPor === 'ia' ? '✨ Gerado por IA' : '🏋️ Prescrito pelo Professor'}
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-white">
              Bora treinar, {user?.nome?.split(' ')[0]}?
            </h1>
            <p className="text-xs text-slate-400 mt-0.5 font-medium">
              {activePlan.titulo}
            </p>
            {teacher && (
              <p className="text-xs text-slate-400 mt-1 flex items-center gap-1.5">
                <UserCheck className="w-3.5 h-3.5 text-indigo-400" />
                Prescrito e acompanhado por: <span className="text-slate-300 font-medium">{teacher.nome}</span>
              </p>
            )}
          </div>

          {!isManagedByTeacher && (
            <button
              onClick={onOpenAnamnesis}
              className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-semibold flex items-center gap-1.5 transition self-start sm:self-auto shrink-0"
            >
              <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
              Refazer / Ajustar com IA
            </button>
          )}
        </div>

        {activePlan.orientacoesGerais && (
          <div className="p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800/80 text-xs text-slate-300 leading-relaxed">
            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 block mb-1">
              {isManagedByTeacher ? 'Orientações do seu Professor:' : 'Análise Personalizada da IA para o seu Perfil:'}
            </span>
            {activePlan.orientacoesGerais}
          </div>
        )}

        {/* Barra de Periodização, Sobrecarga Progressiva e Evolução de Exercícios */}
        <div className="p-4 rounded-2xl bg-slate-950/90 border border-slate-800 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-bold text-white flex items-center gap-1.5">
                  <TrendingUp className="w-4 h-4 text-emerald-400" />
                  Periodização da Ficha (Fase {faseAtual})
                </span>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-[10px] font-semibold text-emerald-300">
                  Ciclo {Math.min(metaCiclos, ciclosCompletos + 1)} de {metaCiclos} ({totalSessoesFicha}/{metaTotalSessoes} sessões nesta ficha)
                </span>
              </div>
              <p className="text-[11px] text-slate-400 mt-1">
                {objetivoAtual === 'emagrecimento' ? (
                  <>
                    🔥 <strong className="text-slate-300">Progressão Metabólica & Queima Calórica:</strong> mantenha intervalos curtos (30s-50s) e cadência intensa a cada volta ({activePlan.divisoes.map(d => d.letra).join(' → ')}). Suas cargas ajustam de forma dinâmica!
                  </>
                ) : objetivoAtual === 'condicionamento' ? (
                  <>
                    ❤️ <strong className="text-slate-300">Progressão de Resistência & Saúde:</strong> evolução gradual de resistência muscular, postura e condicionamento a cada volta no ciclo ({activePlan.divisoes.map(d => d.letra).join(' → ')}).
                  </>
                ) : (
                  <>
                    📈 <strong className="text-slate-300">Sobrecarga Progressiva Ativa:</strong> a cada volta no ciclo ({activePlan.divisoes.map(d => d.letra).join(' → ')}), suas cargas sugeridas sobem automaticamente conforme seu desempenho.
                  </>
                )}
              </p>
            </div>

            {!isManagedByTeacher && (
              <button
                type="button"
                disabled={evolving}
                onClick={handleEvolveWorkout}
                className={`px-3.5 py-2.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition shrink-0 ${
                  cicloProntoParaEvoluir
                    ? 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-lg shadow-emerald-500/20'
                    : 'bg-indigo-500/15 hover:bg-indigo-500/25 text-indigo-300 border border-indigo-500/30'
                }`}
                title="Gera a próxima Fase do seu treino com novos exercícios e cargas evoluídas pela IA"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${evolving ? 'animate-spin' : ''}`} />
                <span>
                  {evolving
                    ? 'Evoluindo Ficha com IA...'
                    : `Evoluir para Fase ${faseAtual + 1} (Novos Exercícios)`}
                </span>
              </button>
            )}
          </div>

          <div className="w-full bg-slate-900 h-2 rounded-full overflow-hidden">
            <div
              className="bg-gradient-to-r from-emerald-500 to-indigo-500 h-full transition-all duration-500"
              style={{ width: `${Math.max(5, percentualMesociclo)}%` }}
            />
          </div>
        </div>
      </div>

      {/* Seletor de Divisões (Treino A, B, C...) */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <Dumbbell className="w-4 h-4 text-emerald-400" />
            Suas Divisões de Treino
          </h2>
          <span className="text-xs text-slate-400">
            {activePlan.divisoes.length} divisões configuradas
          </span>
        </div>

        {/* Abas das Divisões */}
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none">
          {activePlan.divisoes.map((div, idx) => {
            const isSelected = selectedDivisionIndex === idx;
            const isRecommended = recommendedDivisionIndex === idx && logsDestaFicha.length > 0;
            const isFirstOfNewPlan = idx === 0 && logsDestaFicha.length === 0;
            const isLastCompleted = lastCompletedDivisionIndex === idx;

            return (
              <button
                key={div.id}
                onClick={() => setSelectedDivisionIndex(idx)}
                className={`px-4 py-3 rounded-2xl border text-left shrink-0 transition flex items-center gap-3 ${
                  isSelected
                    ? 'bg-emerald-500/10 border-emerald-500 text-white shadow-md shadow-emerald-500/10'
                    : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                }`}
              >
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold text-sm ${
                  isSelected
                    ? 'bg-emerald-500 text-slate-950'
                    : isLastCompleted
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                      : 'bg-slate-800 text-slate-300'
                }`}>
                  {div.letra}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-xs sm:text-sm text-white">{div.nome}</span>
                    {(isRecommended || isFirstOfNewPlan) && (
                      <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-[10px] font-bold text-emerald-300">
                        {isFirstOfNewPlan ? '🎯 Início' : '🎯 Próximo'}
                      </span>
                    )}
                    {isLastCompleted && !isRecommended && (
                      <span className="px-2 py-0.5 rounded-full bg-slate-800 border border-slate-700 text-[10px] font-medium text-slate-400 flex items-center gap-1">
                        <CheckCircle className="w-2.5 h-2.5 text-emerald-400" />
                        Concluído por último
                      </span>
                    )}
                  </div>
                  <div className="text-[11px] text-slate-400">
                    {div.exercicios.length} exercícios
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Cartão de Detalhes da Divisão Selecionada */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                {selectedDivisionIndex === recommendedDivisionIndex && logsDestaFicha.length > 0
                  ? '🎯 Treino da Vez (Sequência Automática)'
                  : 'Treino Selecionado'}
              </span>
              {lastCompletedDivisionIndex !== null && activePlan.divisoes[lastCompletedDivisionIndex] && (
                <span className="text-[11px] text-slate-400 flex items-center gap-1">
                  <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
                  Último concluído: Treino {activePlan.divisoes[lastCompletedDivisionIndex].letra}
                </span>
              )}
            </div>
            <h3 className="text-lg sm:text-xl font-bold text-white mt-2">
              {currentDivision.nome}
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Foco muscular: {currentDivision.focoMuscular?.join(', ') || 'Grupos principais'}
            </p>
          </div>

          <button
            onClick={() => onStartWorkout(currentDivision, activePlan)}
            className="w-full sm:w-auto px-6 py-3.5 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-sm shadow-lg shadow-emerald-500/25 flex items-center justify-center gap-2 transition active:scale-95"
          >
            <Play className="w-5 h-5 fill-current" />
            Iniciar Treino {currentDivision.letra} Agora
          </button>
        </div>

        {/* Lista de Exercícios da Divisão */}
        <div className="mt-4 space-y-2">
          {currentDivision.exercicios.map((ex, i) => (
            <div
              key={ex.id}
              className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 flex items-center justify-between"
            >
              <div className="flex items-center gap-3">
                <span className="w-6 h-6 rounded-lg bg-slate-800 text-slate-400 text-xs font-bold flex items-center justify-center">
                  {i + 1}
                </span>
                <div>
                  <h4 className="text-sm font-semibold text-white">{ex.nome}</h4>
                  <div className="text-[11px] text-slate-400 flex items-center gap-2 flex-wrap">
                    <span>
                      {ex.series} séries × {ex.repeticoes} reps
                      {ex.cargaSugeridaKg ? ` • ${ex.cargaSugeridaKg} kg sugeridos` : ''}
                    </span>
                    {ex.progressaoAplicada === 'subiu' && ex.cargaAnteriorKg && ex.cargaSugeridaKg && (
                      <span className="px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 text-[10px] font-bold">
                        📈 +{ex.cargaSugeridaKg - ex.cargaAnteriorKg}kg (era {ex.cargaAnteriorKg}kg)
                      </span>
                    )}
                    {ex.progressaoAplicada === 'reduziu' && ex.cargaAnteriorKg && ex.cargaSugeridaKg && (
                      <span className="px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-400 border border-amber-500/30 text-[10px] font-medium">
                        ⚖️ ajustado (era {ex.cargaAnteriorKg}kg)
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <span className="text-xs font-medium text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                {ex.descansoSegundos}s rest
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Histórico Recente de Treinos */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-6">
        <h3 className="text-base font-bold text-white mb-3 flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-emerald-400" />
          Seu Histórico Recente de Treinos
        </h3>

        {history.length === 0 ? (
          <div className="text-center py-6 text-slate-400 text-xs">
            Você ainda não concluiu nenhum treino. Ao finalizar uma sessão, ela aparecerá aqui!
          </div>
        ) : (
          <div className="space-y-2.5">
            {history.slice(0, 5).map(log => (
              <div
                key={log.id}
                className="p-3.5 rounded-2xl bg-slate-950/50 border border-slate-800 flex items-center justify-between"
              >
                <div>
                  <div className="font-semibold text-sm text-white">{log.divisaoNome}</div>
                  <div className="text-xs text-slate-400 flex items-center gap-2 mt-0.5">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {new Date(log.dataInicio).toLocaleDateString('pt-BR')}
                    </span>
                    {log.duracaoMinutos && (
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {log.duracaoMinutos} min
                      </span>
                    )}
                  </div>
                </div>

                <div className="text-right">
                  <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                    log.feedback === 'ideal' 
                      ? 'bg-emerald-500/10 text-emerald-400' 
                      : log.feedback === 'muito_pesado' 
                        ? 'bg-amber-500/10 text-amber-400' 
                        : 'bg-indigo-500/10 text-indigo-400'
                  }`}>
                    {log.feedback === 'ideal' ? 'Intensidade Ideal' : log.feedback === 'muito_pesado' ? 'Puxado' : 'Leve'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
