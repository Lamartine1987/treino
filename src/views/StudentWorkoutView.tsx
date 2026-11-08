import React, { useState, useEffect } from 'react';
import { WorkoutDivision, WorkoutPlan, CompletedSet, WorkoutLog } from '../types';
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
  Smile, 
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

  // Modal de Conclusão de Treino
  const [showFinishModal, setShowFinishModal] = useState(false);
  const [feedback, setFeedback] = useState<'muito_facil' | 'ideal' | 'muito_pesado'>('ideal');
  const [observation, setObservation] = useState('');
  const [saving, setSaving] = useState(false);

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

    const log: WorkoutLog = {
      id: 'log_' + Date.now(),
      alunoId: user.id,
      treinoId: plan.id,
      divisaoId: division.id,
      divisaoNome: division.nome,
      dataInicio: startTime.toISOString(),
      dataFim: new Date().toISOString(),
      duracaoMinutos: Math.max(1, Math.round(elapsedSeconds / 60)),
      feedback,
      observacaoAluno: observation,
      seriesConcluidas: completedSets
    };

    // Aplica Sobrecarga Progressiva Automática nas cargas da divisão concluída para a próxima volta do ciclo
    const updatedDivisoes = plan.divisoes.map((div) => {
      if (div.id !== division.id) return div;

      const updatedExercicios = div.exercicios.map((ex) => {
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

        if (feedback === 'muito_facil') {
          // Treino foi sentido como leve -> sobe carga de forma expressiva para o próximo ciclo
          const incremento = isMultiarticularPesado
            ? maxPesoLevantado >= 30 ? 4 : 2
            : maxPesoLevantado >= 14 ? 2 : 1;
          novaCarga = maxPesoLevantado + incremento;
          statusProgressao = 'subiu';
        } else if (feedback === 'ideal') {
          // Treino na medida -> se completou todas as séries previstas ou já subiu peso manualmente, aplica micro-progressão
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
        } else if (feedback === 'muito_pesado') {
          // Treino muito pesado -> reduz levemente para consolidar a execução com segurança no próximo ciclo
          const reducao = isMultiarticularPesado ? 2 : 1;
          novaCarga = Math.max(2, maxPesoLevantado - reducao);
          statusProgressao = novaCarga < cargaAtual ? 'reduziu' : 'manteve';
        }

        return {
          ...ex,
          cargaAnteriorKg: cargaAtual,
          cargaSugeridaKg: novaCarga,
          progressaoAplicada: statusProgressao
        };
      });

      return {
        ...div,
        exercicios: updatedExercicios
      };
    });

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

      {/* Modal de Conclusão / Feedback Pós-Treino */}
      {showFinishModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-md w-full shadow-2xl text-center animate-in zoom-in-95 duration-200">
            <div className="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto mb-4 border border-emerald-500/30">
              <Trophy className="w-8 h-8 fill-current" />
            </div>

            <h3 className="text-xl font-extrabold text-white">Treino Finalizado com Sucesso!</h3>
            <p className="text-xs text-slate-400 mt-1">
              Duração total de <strong className="text-white">{Math.round(elapsedSeconds / 60)} minutos</strong> e <strong className="text-white">{totalCompletedSets} séries</strong> completas.
            </p>

            <div className="mt-6 text-left">
              <label className="text-xs font-bold text-slate-300 block mb-2">
                Como você sentiu a intensidade do treino de hoje?
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'muito_facil', label: 'Leve', icon: ThumbsDown },
                  { id: 'ideal', label: 'Na Medida', icon: ThumbsUp },
                  { id: 'muito_pesado', label: 'Muito Pesado', icon: Flame }
                ].map(item => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setFeedback(item.id as any)}
                    className={`p-3 rounded-xl border text-xs font-semibold flex flex-col items-center gap-1.5 transition ${
                      feedback === item.id
                        ? 'bg-emerald-500/10 border-emerald-500 text-emerald-400'
                        : 'bg-slate-800/50 border-slate-700 text-slate-400 hover:text-white'
                    }`}
                  >
                    <item.icon className="w-4 h-4" />
                    <span>{item.label}</span>
                  </button>
                ))}
              </div>

              <div className="mt-2.5 p-2.5 rounded-xl bg-emerald-500/5 border border-emerald-500/20 text-[11px] text-slate-300 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>
                  {feedback === 'muito_facil' &&
                    'Sobrecarga Progressiva: o sistema aumentará automaticamente suas cargas (+2kg a +4kg) para o próximo ciclo deste treino!'}
                  {feedback === 'ideal' &&
                    'Sobrecarga Progressiva: suas cargas máximas atingidas hoje serão salvas com micro-progressão (+1kg a +2kg) no próximo ciclo!'}
                  {feedback === 'muito_pesado' &&
                    'Ajuste de Recuperação: o sistema ajustará levemente a carga (-1kg a -2kg) para você consolidar a execução com segurança.'}
                </span>
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

            <div className="mt-6 flex gap-3">
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
