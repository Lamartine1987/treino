import React, { useState } from 'react';
import { Exercise, CompletedSet } from '../types';
import { ExerciseDemo } from './ExerciseDemo';
import { Check, Info, Shuffle, Dumbbell, PlayCircle, EyeOff } from 'lucide-react';

interface ExerciseCardProps {
  exercise: Exercise;
  exerciseIndex: number;
  completedSets: CompletedSet[];
  onToggleSet: (setIndex: number, weightKg: number, repsDone: number) => void;
  onTriggerRest: (seconds: number) => void;
}

export const ExerciseCard: React.FC<ExerciseCardProps> = ({
  exercise,
  exerciseIndex,
  completedSets,
  onToggleSet,
  onTriggerRest
}) => {
  const [showDemo, setShowDemo] = useState(true);
  const [showInstructions, setShowInstructions] = useState(false);
  const [showAlternative, setShowAlternative] = useState(false);
  
  // Guardamos as cargas e repetições editadas pelo aluno para cada série
  const [inputs, setInputs] = useState<{ [setIndex: number]: { weight: number; reps: number } }>(() => {
    const initial: { [setIndex: number]: { weight: number; reps: number } } = {};
    const defaultReps = parseInt(exercise.repeticoes.split('-')[0]) || 10;
    const defaultWeight = exercise.cargaSugeridaKg || 10;

    for (let i = 1; i <= exercise.series; i++) {
      const existing = completedSets.find(s => s.exerciseId === exercise.id && s.setIndex === i);
      initial[i] = {
        weight: existing ? existing.pesoKg : defaultWeight,
        reps: existing ? existing.repeticoesFeitas : defaultReps
      };
    }
    return initial;
  });

  const handleWeightChange = (setIndex: number, weight: number) => {
    setInputs(prev => ({
      ...prev,
      [setIndex]: { ...prev[setIndex], weight }
    }));
  };

  const handleRepsChange = (setIndex: number, reps: number) => {
    setInputs(prev => ({
      ...prev,
      [setIndex]: { ...prev[setIndex], reps }
    }));
  };

  const handleCheck = (setIndex: number) => {
    const setInfo = inputs[setIndex] || { weight: exercise.cargaSugeridaKg || 10, reps: 10 };
    const isAlreadyDone = completedSets.some(s => s.exerciseId === exercise.id && s.setIndex === setIndex && s.concluido);

    onToggleSet(setIndex, setInfo.weight, setInfo.reps);

    // Se estiver marcando como concluída agora, aciona o timer de descanso!
    if (!isAlreadyDone) {
      onTriggerRest(exercise.descansoSegundos || 60);
    }
  };

  const totalCompleted = completedSets.filter(s => s.exerciseId === exercise.id && s.concluido).length;
  const isAllDone = totalCompleted === exercise.series;

  return (
    <div className={`rounded-2xl border transition-all duration-200 overflow-hidden ${
      isAllDone 
        ? 'bg-slate-900/60 border-emerald-500/50 shadow-sm shadow-emerald-500/10' 
        : 'bg-slate-900 border-slate-800 hover:border-slate-700'
    }`}>
      {/* Cabeçalho do Exercício */}
      <div className="p-4 sm:p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1.5 flex-wrap">
              <span className="w-6 h-6 rounded-full bg-slate-800 text-slate-300 font-mono text-xs flex items-center justify-center font-bold">
                {exerciseIndex + 1}
              </span>
              <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                {exercise.grupoMuscular}
              </span>
              {exercise.equipamento && (
                <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-slate-800 text-slate-400 flex items-center gap-1">
                  <Dumbbell className="w-3 h-3" />
                  {exercise.equipamento}
                </span>
              )}
              {exercise.progressaoAplicada === 'subiu' && exercise.cargaAnteriorKg && exercise.cargaSugeridaKg && (
                <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                  📈 +{exercise.cargaSugeridaKg - exercise.cargaAnteriorKg} kg vs último ciclo ({exercise.cargaAnteriorKg} → {exercise.cargaSugeridaKg} kg)
                </span>
              )}
              {exercise.progressaoAplicada === 'reduziu' && exercise.cargaAnteriorKg && exercise.cargaSugeridaKg && (
                <span className="px-2 py-0.5 rounded-full text-[11px] font-medium bg-amber-500/20 text-amber-300 border border-amber-500/40">
                  ⚖️ Carga ajustada ({exercise.cargaAnteriorKg} → {exercise.cargaSugeridaKg} kg)
                </span>
              )}
            </div>

            <h3 className="text-base sm:text-lg font-bold text-white tracking-tight">
              {exercise.nome}
            </h3>

            <p className="text-xs text-slate-400 mt-1">
              Alvo: <span className="text-slate-300 font-medium">{exercise.series} séries</span> × <span className="text-slate-300 font-medium">{exercise.repeticoes} reps</span> • Descanso: <span className="text-emerald-400 font-medium">{exercise.descansoSegundos}s</span>
            </p>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            {/* Botão Mostrar / Ocultar GIF */}
            <button
              type="button"
              onClick={() => setShowDemo(!showDemo)}
              title={showDemo ? 'Ocultar demonstração animada' : 'Ver GIF de execução'}
              className={`px-2.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition ${
                showDemo
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                  : 'bg-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              {showDemo ? <EyeOff className="w-4 h-4" /> : <PlayCircle className="w-4 h-4" />}
              <span>{showDemo ? 'Ocultar GIF' : 'Ver GIF'}</span>
            </button>

            {exercise.exercicioSubstituto && (
              <button
                type="button"
                onClick={() => setShowAlternative(!showAlternative)}
                title="Aparelho Ocupado? Ver substituto"
                className={`p-2 rounded-xl text-xs font-medium flex items-center gap-1 transition ${
                  showAlternative ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' : 'bg-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                <Shuffle className="w-4 h-4" />
                <span className="hidden sm:inline">Substituto</span>
              </button>
            )}

            {exercise.instrucoes && (
              <button
                type="button"
                onClick={() => setShowInstructions(!showInstructions)}
                title="Dicas de execução"
                className={`p-2 rounded-xl text-xs font-medium transition ${
                  showInstructions ? 'bg-indigo-500/20 text-indigo-300' : 'bg-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                <Info className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Banner de Exercício Substituto (Aparelho ocupado) */}
        {showAlternative && exercise.exercicioSubstituto && (
          <div className="mt-3 p-3 rounded-xl bg-amber-950/40 border border-amber-500/40 text-amber-200 text-xs flex items-center justify-between">
            <div>
              <span className="font-semibold block text-amber-300">Aparelho Ocupado? Faça este:</span>
              <span className="text-white text-sm font-medium">{exercise.exercicioSubstituto}</span>
            </div>
            <button 
              type="button"
              onClick={() => setShowAlternative(false)}
              className="text-xs text-amber-400 underline hover:text-amber-300 ml-2"
            >
              Fechar
            </button>
          </div>
        )}

        {/* Instruções Extras */}
        {showInstructions && exercise.instrucoes && (
          <div className="mt-3 p-3 rounded-xl bg-slate-800/80 border border-slate-700 text-slate-300 text-xs leading-relaxed animate-in fade-in duration-200">
            <span className="font-semibold text-slate-200 block mb-1">Dica do Treinador:</span>
            {exercise.instrucoes}
          </div>
        )}

        {/* Demonstração Visual Animada (GIF / Fotos em Loop + Guia Biomecânico) */}
        {showDemo && !isAllDone && (
          <ExerciseDemo exercise={exercise} />
        )}
        {showDemo && isAllDone && (
          <ExerciseDemo exercise={exercise} />
        )}

        {/* Tabela de Séries */}
        <div className="mt-4 pt-3 border-t border-slate-800/80">
          <div className="grid grid-cols-12 gap-2 text-[11px] font-semibold uppercase tracking-wider text-slate-400 px-2 pb-2">
            <span className="col-span-2 text-center">Série</span>
            <span className="col-span-4 text-center">Carga (kg)</span>
            <span className="col-span-3 text-center">Reps</span>
            <span className="col-span-3 text-center">Feito</span>
          </div>

          <div className="space-y-2">
            {Array.from({ length: exercise.series }, (_, i) => i + 1).map((setNumber) => {
              const isDone = completedSets.some(
                s => s.exerciseId === exercise.id && s.setIndex === setNumber && s.concluido
              );
              const currentWeight = inputs[setNumber]?.weight ?? (exercise.cargaSugeridaKg || 10);
              const currentReps = inputs[setNumber]?.reps ?? (parseInt(exercise.repeticoes) || 10);

              return (
                <div
                  key={setNumber}
                  className={`grid grid-cols-12 gap-2 items-center p-2 rounded-xl transition ${
                    isDone 
                      ? 'bg-emerald-950/20 border border-emerald-500/30' 
                      : 'bg-slate-800/50 border border-transparent'
                  }`}
                >
                  {/* Número da Série */}
                  <div className="col-span-2 text-center font-bold text-sm text-slate-300">
                    #{setNumber}
                  </div>

                  {/* Input Carga */}
                  <div className="col-span-4 flex items-center justify-center">
                    <input
                      type="number"
                      step="0.5"
                      min="0"
                      disabled={isDone}
                      value={currentWeight}
                      onChange={(e) => handleWeightChange(setNumber, parseFloat(e.target.value) || 0)}
                      className="w-full text-center bg-slate-900 border border-slate-700 rounded-lg py-1.5 text-sm font-semibold text-white focus:outline-none focus:border-emerald-500 disabled:opacity-70 disabled:bg-slate-950"
                    />
                  </div>

                  {/* Input Repetições */}
                  <div className="col-span-3 flex items-center justify-center">
                    <input
                      type="number"
                      min="1"
                      disabled={isDone}
                      value={currentReps}
                      onChange={(e) => handleRepsChange(setNumber, parseInt(e.target.value) || 0)}
                      className="w-full text-center bg-slate-900 border border-slate-700 rounded-lg py-1.5 text-sm font-semibold text-white focus:outline-none focus:border-emerald-500 disabled:opacity-70 disabled:bg-slate-950"
                    />
                  </div>

                  {/* Botão de Conclusão */}
                  <div className="col-span-3 flex items-center justify-center">
                    <button
                      type="button"
                      onClick={() => handleCheck(setNumber)}
                      className={`w-9 h-9 rounded-xl flex items-center justify-center transition shadow-sm active:scale-95 ${
                        isDone 
                          ? 'bg-emerald-500 text-slate-950 hover:bg-emerald-400 font-bold' 
                          : 'bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white border border-slate-700'
                      }`}
                      aria-label={`Marcar série ${setNumber} como concluída`}
                    >
                      <Check className={`w-5 h-5 ${isDone ? 'stroke-[3]' : 'opacity-40'}`} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
