import React, { useState, useEffect } from 'react';
import { WorkoutDivision, WorkoutPlan, CompletedSet, WorkoutLog, ExerciseDifficulty, Exercise } from '../types';
import { useAuth } from '../context/AuthContext';
import { ExerciseCard } from '../components/ExerciseCard';
import { RestTimer } from '../components/RestTimer';
import { saveWorkoutLog, saveWorkoutPlan } from '../services/storageService';
import confetti from 'canvas-confetti';
import { 
  ArrowLeft, 
  Clock, 
  CheckCircle, 
  Trophy, 
  Flame, 
  ThumbsUp, 
  ThumbsDown, 
  Sparkles,
  Timer
} from 'lucide-react';

interface StudentWorkoutViewProps {
  division: WorkoutDivision;
  plan: WorkoutPlan;
  onFinishWorkout: () => void;
  onBack: () => void;
}

export const StudentWorkoutView: React.FC<StudentWorkoutViewProps> = ({
  division,
  plan,
  onFinishWorkout,
  onBack
}) => {
  const { user } = useAuth();
  const [startTime] = useState<Date>(new Date());
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [completedSets, setCompletedSets] = useState<CompletedSet[]>([]);
  
  // Controle do Timer de Descanso
  const [timerOpen, setTimerOpen] = useState(false);
  const [timerSeconds, setTimerSeconds] = useState(60);

  // Modal de Conclusão de Treino e Avaliação por Exercício
  const [showFinishModal, setShowFinishModal] = useState(false);
  const [exerciseFeedbacks, setExerciseFeedbacks] = useState<Record<string, ExerciseDifficulty>>({});
  const [observation, setObservation] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSetExerciseDifficulty = (exerciseId: string, diff: ExerciseDifficulty) => {
    setExerciseFeedbacks(prev => ({
      ...prev,
      [exerciseId]: diff
    }));
  };

  // Calcula a nova carga sugerida para um exercício específico com base na dificuldade que o aluno sentiu nele
  const calcularNovaCargaExercicio = (ex: Exercise, diff: ExerciseDifficulty) => {
    const setsFeitos = completedSets.filter(
      (s) => s.exerciseId === ex.id && s.concluido && s.pesoKg > 0
    );

    const cargaAtual = ex.cargaSugeridaKg || 10;
    const maxPesoLevantado =
      setsFeitos.length > 0
        ? Math.max(...setsFeitos.map((s) => s.pesoKg))
        : cargaAtual;

    const nomeLower = ex.nome.toLowerCase();
    const isMultiarticularPesado =
      nomeLower.includes('agachamento') ||
      nomeLower.includes('leg press') ||
      nomeLower.includes('hack') ||
      nomeLower.includes('stiff') ||
      nomeLower.includes('terra') ||
      nomeLower.includes('elevação pélvica') ||
      nomeLower.includes('supino') ||
      nomeLower.includes('puxada') ||
      nomeLower.includes('remada');

    let novaCarga = maxPesoLevantado;
    let statusProgressao: 'subiu' | 'manteve' | 'reduziu' = 'manteve';

    if (diff === 'muito_facil') {
      const incremento = isMultiarticularPesado
        ? maxPesoLevantado >= 30 ? 4 : 2
        : maxPesoLevantado >= 14 ? 2 : 1;
      novaCarga = maxPesoLevantado + incremento;
      statusProgressao = 'subiu';
    } else if (diff === 'ideal') {
      if (maxPesoLevantado > cargaAtual) {
        novaCarga = maxPesoLevantado;
        statusProgressao = 'subiu';
      } else if (setsFeitos.length >= ex.series) {
        const incremento = isMultiarticularPesado ? 2 : 1;
        novaCarga = maxPesoLevantado + incremento;
        statusProgressao = 'subiu';
      } else {
        novaCarga = maxPesoLevantado;
        statusProgressao = 'manteve';
      }
    } else if (diff === 'muito_pesado') {
      const reducao = isMultiarticularPesado ? 2 : 1;
      novaCarga = Math.max(2, maxPesoLevantado - reducao);
      statusProgressao = novaCarga < cargaAtual ? 'reduziu' : 'manteve';
    }

    return { cargaAtual, novaCarga, statusProgressao };
  };

  // Cronômetro da sessão geral
  useEffect(() => {
    const interval = setInterval(() => {
      setElapsedSeconds(prev => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const totalPossibleSets = division.exercicios.reduce((acc, ex) => acc + ex.series, 0);
  const totalCompletedSets = completedSets.filter(s => s.concluido).length;
  const progressPercent = totalPossibleSets > 0 ? (totalCompletedSets / totalPossibleSets) * 100 : 0;

  const handleToggleSet = (exerciseId: string, setIndex: number, weightKg: number, repsDone: number) => {
    setCompletedSets(prev => {
      const existingIndex = prev.findIndex(s => s.exerciseId === exerciseId && s.setIndex === setIndex);
      if (existingIndex >= 0) {
        // Alterna status ou remove
        const updated = [...prev];
        updated[existingIndex] = {
          ...updated[existingIndex],
          concluido: !updated[existingIndex].concluido,
          pesoKg: weightKg,
          repeticoesFeitas: repsDone
        };
        return updated;
      } else {
        // Adiciona nova série concluída
        return [
          ...prev,
          {
            exerciseId,
            setIndex,
            pesoKg: weightKg,
            repeticoesFeitas: repsDone,
            concluido: true
          }
        ];
      }
    });
  };

  const handleTriggerRest = (seconds: number) => {
    setTimerSeconds(seconds);
    setTimerOpen(true);
  };

  const handleOpenFinish = () => {
    // Preenche com 'ideal' qualquer exercício que o aluno ainda não tenha avaliado individualmente
    setExerciseFeedbacks(prev => {
      const next = { ...prev };
      division.exercicios.forEach(ex => {
        if (!next[ex.id]) {
          next[ex.id] = 'ideal';
        }
      });
      return next;
    });

    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 }
    });
    setShowFinishModal(true);
  };

  const handleConfirmFinish = async () => {
    if (!user) return;
    setSaving(true);

    const feedbackMapaLog: NonNullable<WorkoutLog['feedbackPorExercicio']> = {};

    // Aplica Sobrecarga Progressiva Individual por Exercício para a próxima volta do ciclo
    const updatedDivisoes = plan.divisoes.map((div) => {
      if (div.id !== division.id) return div;

      const updatedExercicios = div.exercicios.map((ex) => {
        const diffEx: ExerciseDifficulty = exerciseFeedbacks[ex.id] || 'ideal';
        const { cargaAtual, novaCarga, statusProgressao } = calcularNovaCargaExercicio(ex, diffEx);

        feedbackMapaLog[ex.id] = {
          nome: ex.nome,
          dificuldade: diffEx,
          cargaAnteriorKg: cargaAtual,
          novaCargaKg: novaCarga
        };

        return {
          ...ex,
          cargaAnteriorKg: cargaAtual,
          cargaSugeridaKg: novaCarga,
          progressaoAplicada: statusProgressao,
          ultimoFeedback: diffEx
        };
      });

      return {
        ...div,
        exercicios: updatedExercicios
      };
    });

    // Calcula um feedback geral resumido apenas para compatibilidade
    const diffsValues = Object.values(feedbackMapaLog).map(v => v.dificuldade);
    const qtdPesado = diffsValues.filter(d => d === 'muito_pesado').length;
    const qtdFacil = diffsValues.filter(d => d === 'muito_facil').length;
    const feedbackGeral: ExerciseDifficulty =
      qtdPesado > diffsValues.length / 2
        ? 'muito_pesado'
        : qtdFacil > diffsValues.length / 2
        ? 'muito_facil'
        : 'ideal';

    const log: WorkoutLog = {
      id: 'log_' + Date.now(),
      alunoId: user.id,
      treinoId: plan.id,
      divisaoId: division.id,
      divisaoNome: division.nome,
      dataInicio: startTime.toISOString(),
      dataFim: new Date().toISOString(),
      duracaoMinutos: Math.max(1, Math.round(elapsedSeconds / 60)),
      feedback: feedbackGeral,
      feedbackPorExercicio: feedbackMapaLog,
      observacaoAluno: observation,
      seriesConcluidas: completedSets
    };

    const updatedPlan: WorkoutPlan = {
      ...plan,
      ultimaProgressaoData: new Date().toISOString(),
      divisoes: updatedDivisoes
    };

    await Promise.all([
      saveWorkoutLog(log),
      saveWorkoutPlan(updatedPlan)
    ]);

    setSaving(false);
    onFinishWorkout();
  };

  const formatElapsedTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-4 pb-28">
      {/* Barra Superior Fixa / Contexto */}
      <div className="sticky top-16 z-30 bg-slate-950/90 backdrop-blur-md -mx-4 px-4 py-3 border-b border-slate-800">
        <div className="flex items-center justify-between gap-2">
          <button
            onClick={onBack}
            className="p-2 -ml-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-900 transition flex items-center gap-1 text-xs"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Voltar</span>
          </button>

          <div className="text-center flex-1">
            <h2 className="text-sm sm:text-base font-bold text-white truncate">
              {division.nome}
            </h2>
            <div className="flex items-center justify-center gap-3 text-xs text-slate-400 mt-0.5">
              <span className="flex items-center gap-1 text-emerald-400 font-mono font-semibold">
                <Clock className="w-3.5 h-3.5" />
                {formatElapsedTime(elapsedSeconds)}
              </span>
              <span>•</span>
              <span>{totalCompletedSets} de {totalPossibleSets} séries ({Math.round(progressPercent)}%)</span>
            </div>
          </div>

          <button
            onClick={() => setTimerOpen(true)}
            className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-emerald-400 hover:border-emerald-500/40 text-xs font-semibold flex items-center gap-1 transition"
            title="Abrir Timer de Descanso"
          >
            <Timer className="w-4 h-4" />
            <span className="hidden sm:inline">{timerSeconds}s</span>
          </button>
        </div>

        {/* Barra de Progresso Geral */}
        <div className="w-full bg-slate-900 h-1.5 rounded-full overflow-hidden mt-3">
          <div
            className="bg-emerald-500 h-full transition-all duration-300"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* Lista de Exercícios */}
      <div className="mt-6 space-y-4">
        {division.exercicios.map((exercise, index) => (
          <ExerciseCard
            key={exercise.id}
            exercise={exercise}
            exerciseIndex={index}
            completedSets={completedSets}
            difficulty={exerciseFeedbacks[exercise.id]}
            onChangeDifficulty={(diff) => handleSetExerciseDifficulty(exercise.id, diff)}
            onToggleSet={(setIndex, weight, reps) => 
              handleToggleSet(exercise.id, setIndex, weight, reps)
            }
            onTriggerRest={handleTriggerRest}
          />
        ))}
      </div>

      {/* Barra Inferior Flutuante com Botão Finalizar */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-slate-950/90 backdrop-blur-md border-t border-slate-800 z-30">
        <div className="max-w-3xl mx-auto flex items-center justify-between gap-4">
          <div className="text-xs text-slate-400">
            <span className="font-bold text-white text-sm">{totalCompletedSets}</span>/{totalPossibleSets} séries feitas
          </div>

          <button
            onClick={handleOpenFinish}
            className="px-6 py-3 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-sm shadow-lg shadow-emerald-500/25 flex items-center gap-2 transition active:scale-95"
          >
            <CheckCircle className="w-5 h-5 fill-current" />
            Finalizar Treino
          </button>
        </div>
      </div>

      {/* Timer Flutuante de Descanso */}
      <RestTimer
        isOpen={timerOpen}
        initialSeconds={timerSeconds}
        onClose={() => setTimerOpen(false)}
      />

      {/* Modal de Conclusão / Feedback Individual por Exercício */}
      {showFinishModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-6 max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-2xl text-center animate-in zoom-in-95 duration-200">
            <div className="w-14 h-14 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto mb-3 border border-emerald-500/30">
              <Trophy className="w-7 h-7 fill-current" />
            </div>

            <h3 className="text-lg sm:text-xl font-extrabold text-white">Treino Finalizado com Sucesso!</h3>
            <p className="text-xs text-slate-400 mt-1">
              Duração de <strong className="text-white">{Math.max(1, Math.round(elapsedSeconds / 60))} min</strong> e <strong className="text-white">{totalCompletedSets} séries</strong> completas.
            </p>

            <div className="mt-5 text-left">
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                  Ajuste de Carga por Exercício (Próximo Treino)
                </label>
                <span className="text-[10px] text-slate-400">Toque para alterar</span>
              </div>

              <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                {division.exercicios.map((ex, idx) => {
                  const diffAtual: ExerciseDifficulty = exerciseFeedbacks[ex.id] || 'ideal';
                  const { cargaAtual, novaCarga } = calcularNovaCargaExercicio(ex, diffAtual);
                  const delta = novaCarga - cargaAtual;

                  return (
                    <div
                      key={ex.id}
                      className="p-2.5 rounded-2xl bg-slate-950/90 border border-slate-800 flex flex-col gap-2"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-bold text-white truncate">
                          {idx + 1}. {ex.nome}
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold shrink-0 ${
                            delta > 0
                              ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                              : delta < 0
                              ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
                              : 'bg-slate-800 text-slate-300'
                          }`}
                        >
                          {cargaAtual}kg → {novaCarga}kg ({delta > 0 ? `+${delta}kg` : delta < 0 ? `${delta}kg` : 'mantém'})
                        </span>
                      </div>

                      <div className="grid grid-cols-3 gap-1.5">
                        {[
                          { id: 'muito_facil' as ExerciseDifficulty, label: 'Leve (+Carga)', icon: ThumbsDown, active: 'bg-sky-500/15 border-sky-500 text-sky-300' },
                          { id: 'ideal' as ExerciseDifficulty, label: 'Na Medida', icon: ThumbsUp, active: 'bg-emerald-500/15 border-emerald-500 text-emerald-300' },
                          { id: 'muito_pesado' as ExerciseDifficulty, label: 'Pesado (-Carga)', icon: Flame, active: 'bg-amber-500/15 border-amber-500 text-amber-300' }
                        ].map((item) => {
                          const Icon = item.icon;
                          const selected = diffAtual === item.id;
                          return (
                            <button
                              key={item.id}
                              type="button"
                              onClick={() => handleSetExerciseDifficulty(ex.id, item.id)}
                              className={`py-1.5 px-2 rounded-xl border text-[10px] font-bold flex items-center justify-center gap-1 transition ${
                                selected
                                  ? item.active
                                  : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                              }`}
                            >
                              <Icon className="w-3 h-3 shrink-0" />
                              <span>{item.label}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="mt-4 text-left">
              <label className="text-xs font-bold text-slate-300 block mb-1.5">
                Sentiu algum desconforto ou quer deixar um recado? (Opcional)
              </label>
              <textarea
                rows={2}
                value={observation}
                onChange={(e) => setObservation(e.target.value)}
                placeholder="Ex: No supino senti leve dor no cotovelo, fiz com menos peso..."
                className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div className="mt-5 flex gap-3">
              <button
                type="button"
                onClick={() => setShowFinishModal(false)}
                className="flex-1 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs transition"
              >
                Voltar ao Treino
              </button>
              <button
                type="button"
                disabled={saving}
                onClick={handleConfirmFinish}
                className="flex-1 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs transition shadow-lg shadow-emerald-500/20"
              >
                {saving ? 'Gravando...' : 'Salvar no Histórico'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
