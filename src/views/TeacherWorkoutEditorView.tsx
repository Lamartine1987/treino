import React, { useState, useEffect } from 'react';
import { UserProfile, WorkoutPlan, WorkoutDivision, Exercise, Anamnesis } from '../types';
import { getActiveWorkoutPlan, saveWorkoutPlan, saveUserProfile } from '../services/storageService';
import { gerarTreinoComIA } from '../services/aiService';
import { EXERCISE_CATEGORIES, EXERCISE_CATALOG, CatalogExercise } from '../data/exerciseCatalog';
import { 
  Sparkles, 
  ArrowLeft, 
  Plus, 
  Trash2, 
  Save, 
  Dumbbell, 
  Loader2, 
  ShieldAlert,
  Send,
  Layers,
  Check
} from 'lucide-react';

interface TeacherWorkoutEditorViewProps {
  student: UserProfile;
  onBack: () => void;
  onSaved: () => void;
}

export const TeacherWorkoutEditorView: React.FC<TeacherWorkoutEditorViewProps> = ({
  student,
  onBack,
  onSaved
}) => {
  const [plan, setPlan] = useState<WorkoutPlan | null>(null);
  const [selectedDivisionIndex, setSelectedDivisionIndex] = useState(0);
  const [aiPrompt, setAiPrompt] = useState('');
  const [loadingAi, setLoadingAi] = useState(false);
  const [saving, setSaving] = useState(false);

  // Estado editável da anamnese do aluno para o professor ajustar Objetivo, Nível e Dias/Semana
  const [studentAnamnese, setStudentAnamnese] = useState<Anamnesis>(
    student.anamnese || {
      objetivo: 'hipertrofia',
      experiencia: 'iniciante',
      diasSemana: 4,
      tempoMinutos: 60,
      limitacoes: [],
      tipoAmbiente: 'academia_completa'
    }
  );
  const [profileSavedToast, setProfileSavedToast] = useState(false);

  const handleUpdateStudentAnamnese = async <K extends keyof Anamnesis>(
    field: K,
    value: Anamnesis[K]
  ) => {
    const updatedAnamnese: Anamnesis = {
      ...studentAnamnese,
      [field]: value
    };
    setStudentAnamnese(updatedAnamnese);
    await saveUserProfile({
      ...student,
      anamnese: updatedAnamnese
    });
    setProfileSavedToast(true);
    setTimeout(() => setProfileSavedToast(false), 1800);
  };

  // Estados do Seletor Rápido por Categoria -> Exercício
  const [showCatalogPicker, setShowCatalogPicker] = useState(false);
  const [selectedPickerCategory, setSelectedPickerCategory] = useState<string>(EXERCISE_CATEGORIES[0]);

  // Normaliza qualquer grupo muscular existente para uma das categorias oficiais do catálogo
  const resolveCategory = (grupo?: string): string => {
    if (!grupo) return EXERCISE_CATEGORIES[0];
    const foundExact = EXERCISE_CATEGORIES.find((c) => c === grupo);
    if (foundExact) return foundExact;
    const g = grupo.toLowerCase();
    if (g.includes('peito') || g.includes('peitoral')) return 'Peitoral';
    if (g.includes('costa') || g.includes('dorsal') || g.includes('trapézio') || g.includes('trapezio')) return 'Costas / Dorsal';
    if (g.includes('ombro') || g.includes('deltóide') || g.includes('deltoide')) return 'Ombros / Deltóides';
    if (g.includes('bíceps') || g.includes('biceps') || g.includes('antebraço') || g.includes('braquial')) return 'Bíceps / Antebraço';
    if (g.includes('tríceps') || g.includes('triceps')) return 'Tríceps';
    if (g.includes('quadríceps') || g.includes('quadriceps') || g.includes('coxa anterior')) return 'Quadríceps';
    if (g.includes('posterior') || g.includes('isquio')) return 'Posterior de Coxa';
    if (g.includes('glúteo') || g.includes('gluteo')) return 'Glúteos';
    if (g.includes('panturrilha') || g.includes('gêmeos') || g.includes('gemeos') || g.includes('sóleo')) return 'Panturrilha';
    if (g.includes('abdômen') || g.includes('abdomen') || g.includes('core') || g.includes('lombar')) return 'Abdômen / Core';
    return EXERCISE_CATEGORIES[0];
  };

  useEffect(() => {
    const loadPlan = async () => {
      const existing = await getActiveWorkoutPlan(student.id);
      if (existing) {
        setPlan(existing);
      } else {
        // Se ainda não tem, inicia um rascunho vazio ou pede para gerar com IA
        const emptyPlan: WorkoutPlan = {
          id: 'treino_' + Date.now(),
          alunoId: student.id,
          titulo: `Treino de ${student.nome}`,
          criadoPor: 'professor',
          dataCriacao: new Date().toISOString(),
          ativo: true,
          divisoes: [
            {
              id: 'div_1',
              letra: 'A',
              nome: 'Treino A - Membros Superiores',
              focoMuscular: ['Peito', 'Tríceps'],
              exercicios: [
                {
                  id: 'ex_1',
                  nome: 'Supino Reto com Halteres',
                  grupoMuscular: 'Peitoral',
                  series: 4,
                  repeticoes: '10-12',
                  descansoSegundos: 60,
                  cargaSugeridaKg: 14,
                  instrucoes: 'Controle a descida e mantenha escápulas travadas.',
                  exercicioSubstituto: 'Supino na Máquina'
                }
              ]
            }
          ]
        };
        setPlan(emptyPlan);
      }
    };

    loadPlan();
  }, [student]);

  const handleGenerateOrRefineWithAi = async (customPrompt?: string) => {
    setLoadingAi(true);
    try {
      const promptToUse = customPrompt || aiPrompt;
      const generated = await gerarTreinoComIA(
        student.nome,
        student.id,
        studentAnamnese,
        promptToUse
      );
      generated.criadoPor = 'professor'; // O professor validou/gerou
      setPlan(generated);
      setAiPrompt('');
      setSelectedDivisionIndex(0);
    } catch (err) {
      console.error(err);
      alert('Erro ao consultar IA. Tente novamente.');
    } finally {
      setLoadingAi(false);
    }
  };

  const handleSavePlan = async () => {
    if (!plan) return;
    setSaving(true);
    await Promise.all([
      saveUserProfile({
        ...student,
        anamnese: studentAnamnese
      }),
      saveWorkoutPlan(plan)
    ]);
    setSaving(false);
    onSaved();
  };

  const handleAddDivision = () => {
    if (!plan) return;
    const nextLetter = String.fromCharCode(65 + plan.divisoes.length);
    const newDivision: WorkoutDivision = {
      id: 'div_' + Date.now(),
      letra: nextLetter,
      nome: `Treino ${nextLetter}`,
      focoMuscular: [],
      exercicios: []
    };
    setPlan({
      ...plan,
      divisoes: [...plan.divisoes, newDivision]
    });
    setSelectedDivisionIndex(plan.divisoes.length);
  };

  const handleAddCatalogExercise = (divIndex: number, catEx: CatalogExercise) => {
    if (!plan) return;
    const newEx: Exercise = {
      id: 'ex_' + Date.now() + '_' + Math.random().toString(36).slice(2, 5),
      nome: catEx.nome,
      grupoMuscular: catEx.categoria,
      equipamento: catEx.equipamento,
      series: catEx.seriesPadrao,
      repeticoes: catEx.repeticoesPadrao,
      descansoSegundos: catEx.descansoPadrao,
      cargaSugeridaKg: catEx.cargaPadraoKg > 0 ? catEx.cargaPadraoKg : undefined,
      instrucoes: catEx.instrucoes,
      exercicioSubstituto: catEx.substituto
    };

    const updatedDivisions = [...plan.divisoes];
    updatedDivisions[divIndex].exercicios.push(newEx);
    setPlan({ ...plan, divisoes: updatedDivisions });
  };

  const handleSelectCatalogForExisting = (divIndex: number, exIndex: number, exerciseName: string, category: string) => {
    if (!plan) return;
    const found = EXERCISE_CATALOG.find((item) => item.nome === exerciseName);
    const updatedDivisions = [...plan.divisoes];

    if (found) {
      updatedDivisions[divIndex].exercicios[exIndex] = {
        ...updatedDivisions[divIndex].exercicios[exIndex],
        nome: found.nome,
        grupoMuscular: found.categoria,
        equipamento: found.equipamento,
        series: found.seriesPadrao,
        repeticoes: found.repeticoesPadrao,
        descansoSegundos: found.descansoPadrao,
        cargaSugeridaKg: found.cargaPadraoKg > 0 ? found.cargaPadraoKg : undefined,
        instrucoes: found.instrucoes,
        exercicioSubstituto: found.substituto
      };
    } else {
      updatedDivisions[divIndex].exercicios[exIndex] = {
        ...updatedDivisions[divIndex].exercicios[exIndex],
        nome: exerciseName,
        grupoMuscular: category
      };
    }

    setPlan({ ...plan, divisoes: updatedDivisions });
  };

  const handleChangeCategoryForExisting = (divIndex: number, exIndex: number, newCategory: string) => {
    if (!plan) return;
    const firstOfCategory = EXERCISE_CATALOG.find((item) => item.categoria === newCategory);
    if (firstOfCategory) {
      handleSelectCatalogForExisting(divIndex, exIndex, firstOfCategory.nome, newCategory);
    } else {
      handleUpdateExercise(divIndex, exIndex, 'grupoMuscular', newCategory);
    }
  };

  const handleRemoveExercise = (divIndex: number, exIndex: number) => {
    if (!plan) return;
    const updatedDivisions = [...plan.divisoes];
    updatedDivisions[divIndex].exercicios.splice(exIndex, 1);
    setPlan({ ...plan, divisoes: updatedDivisions });
  };

  const handleUpdateExercise = (divIndex: number, exIndex: number, field: keyof Exercise, value: any) => {
    if (!plan) return;
    const updatedDivisions = [...plan.divisoes];
    updatedDivisions[divIndex].exercicios[exIndex] = {
      ...updatedDivisions[divIndex].exercicios[exIndex],
      [field]: value
    };
    setPlan({ ...plan, divisoes: updatedDivisions });
  };

  if (!plan) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const currentDiv = plan.divisoes[selectedDivisionIndex] || plan.divisoes[0];

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
      {/* Top Header */}
      <div className="flex items-center justify-between gap-4">
        <button
          onClick={onBack}
          className="p-2 -ml-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-900 transition flex items-center gap-1.5 text-xs font-semibold"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Voltar ao Painel</span>
        </button>

        <button
          onClick={handleSavePlan}
          disabled={saving}
          className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold text-xs flex items-center gap-2 shadow-lg shadow-amber-500/20 transition active:scale-95"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          <span>Publicar Treino no App do Aluno</span>
        </button>
      </div>

      {/* Cartão de Identificação & Parâmetros Editáveis do Aluno */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <span className="text-[11px] font-bold text-amber-400 uppercase tracking-wider block mb-0.5">
              Ficha de Prescrição do Aluno
            </span>
            <h1 className="text-xl font-extrabold text-white">{student.nome}</h1>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {studentAnamnese.pesoKg && studentAnamnese.alturaCm && (
              <span className="px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs font-medium">
                {studentAnamnese.pesoKg} kg • {studentAnamnese.alturaCm} cm
                {studentAnamnese.idade ? ` • ${studentAnamnese.idade} anos` : ''}
              </span>
            )}
            {profileSavedToast && (
              <span className="px-2.5 py-1 rounded-full bg-amber-500/15 text-amber-300 border border-amber-500/30 text-[11px] font-bold flex items-center gap-1">
                <Check className="w-3 h-3" />
                Perfil atualizado!
              </span>
            )}
          </div>
        </div>

        {/* Seletores Diretos para o Professor Editar Objetivo, Dias/Semana, Nível e Tempo */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 pt-1">
          <div>
            <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
              Objetivo do Aluno
            </label>
            <select
              value={studentAnamnese.objetivo}
              onChange={(e) =>
                handleUpdateStudentAnamnese('objetivo', e.target.value as Anamnesis['objetivo'])
              }
              className="w-full bg-slate-950 border border-slate-800 hover:border-amber-500/50 rounded-xl px-3 py-2 text-xs font-bold text-amber-400 focus:outline-none focus:border-amber-500"
            >
              <option value="hipertrofia">Ganho de Massa (Hipertrofia)</option>
              <option value="emagrecimento">Emagrecimento</option>
              <option value="forca">Ganho de Força</option>
              <option value="condicionamento">Condicionamento / Saúde</option>
            </select>
          </div>

          <div>
            <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
              Frequência Semanal
            </label>
            <select
              value={studentAnamnese.diasSemana}
              onChange={(e) =>
                handleUpdateStudentAnamnese('diasSemana', Number(e.target.value))
              }
              className="w-full bg-slate-950 border border-slate-800 hover:border-amber-500/50 rounded-xl px-3 py-2 text-xs font-bold text-white focus:outline-none focus:border-amber-500"
            >
              <option value={2}>2 dias/semana</option>
              <option value={3}>3 dias/semana</option>
              <option value={4}>4 dias/semana</option>
              <option value={5}>5 dias/semana</option>
              <option value={6}>6 dias/semana</option>
            </select>
          </div>

          <div>
            <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
              Nível de Experiência
            </label>
            <select
              value={studentAnamnese.experiencia}
              onChange={(e) =>
                handleUpdateStudentAnamnese('experiencia', e.target.value as Anamnesis['experiencia'])
              }
              className="w-full bg-slate-950 border border-slate-800 hover:border-amber-500/50 rounded-xl px-3 py-2 text-xs font-bold text-white focus:outline-none focus:border-amber-500"
            >
              <option value="iniciante">Iniciante</option>
              <option value="intermediario">Intermediário</option>
              <option value="avancado">Avançado</option>
            </select>
          </div>

          <div>
            <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
              Tempo por Sessão
            </label>
            <select
              value={studentAnamnese.tempoMinutos || 60}
              onChange={(e) =>
                handleUpdateStudentAnamnese('tempoMinutos', Number(e.target.value))
              }
              className="w-full bg-slate-950 border border-slate-800 hover:border-amber-500/50 rounded-xl px-3 py-2 text-xs font-bold text-white focus:outline-none focus:border-amber-500"
            >
              <option value={30}>30 minutos</option>
              <option value={45}>45 minutos</option>
              <option value={60}>60 minutos</option>
              <option value={90}>90 minutos</option>
            </select>
          </div>
        </div>

        {studentAnamnese.limitacoes && studentAnamnese.limitacoes.length > 0 && (
          <div className="flex items-center gap-1.5 text-rose-300 text-xs">
            <ShieldAlert className="w-4 h-4" />
            <span>Limitações físicas registradas: <strong>{studentAnamnese.limitacoes.join(', ')}</strong></span>
          </div>
        )}
      </div>

      {/* Caixa do Copiloto IA para o Professor */}
      <div className="bg-gradient-to-r from-indigo-950/40 to-slate-900 border border-indigo-500/30 rounded-3xl p-5 sm:p-6 shadow-xl">
        <div className="flex items-center gap-2 text-indigo-400 font-bold text-sm mb-2">
          <Sparkles className="w-4 h-4 fill-current" />
          <span>Copiloto de Treino com IA</span>
        </div>
        <p className="text-xs text-slate-400 mb-4">
          Peça para a IA gerar uma proposta completa ou refinar os exercícios conforme suas instruções técnicas.
        </p>

        {/* Sugestões rápidas de prompt */}
        <div className="flex gap-2 flex-wrap mb-3">
          {[
            'Gerar treino completo baseado no perfil',
            'Trocar exercícios livres por máquinas seguras',
            'Aumentar descanso para 90s e focar em força'
          ].map(sug => (
            <button
              key={sug}
              type="button"
              onClick={() => handleGenerateOrRefineWithAi(sug)}
              className="px-2.5 py-1 rounded-lg bg-indigo-950/70 border border-indigo-500/20 text-indigo-300 hover:bg-indigo-900 text-[11px] font-medium transition"
            >
              + {sug}
            </button>
          ))}
        </div>

        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Ex: Troque a remada curvada por uma no cabo por conta da dor na lombar..."
            value={aiPrompt}
            onChange={(e) => setAiPrompt(e.target.value)}
            className="flex-1 bg-slate-950 border border-indigo-500/30 rounded-2xl px-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-400"
          />
          <button
            type="button"
            disabled={loadingAi}
            onClick={() => handleGenerateOrRefineWithAi()}
            className="px-4 py-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center gap-1.5 transition disabled:opacity-50 shrink-0"
          >
            {loadingAi ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            <span>Ajustar com IA</span>
          </button>
        </div>
      </div>

      {/* Editor das Divisões */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-6 space-y-5">
        {/* Abas das divisões */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3 flex-wrap gap-2">
          <div className="flex gap-2 overflow-x-auto">
            {plan.divisoes.map((div, idx) => (
              <button
                key={div.id}
                onClick={() => setSelectedDivisionIndex(idx)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                  selectedDivisionIndex === idx
                    ? 'bg-amber-500 text-slate-950'
                    : 'bg-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                <span>Treino {div.letra}</span>
                <span className="text-[10px] opacity-70">({div.exercicios.length})</span>
              </button>
            ))}
          </div>

          <button
            onClick={handleAddDivision}
            className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold flex items-center gap-1 transition"
          >
            <Plus className="w-3.5 h-3.5" />
            Nova Divisão
          </button>
        </div>

        {/* Nome da Divisão Atual */}
        {currentDiv && (
          <div className="space-y-4">
            <div>
              <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                Nome da Divisão
              </label>
              <input
                type="text"
                value={currentDiv.nome}
                onChange={(e) => {
                  const updated = [...plan.divisoes];
                  updated[selectedDivisionIndex].nome = e.target.value;
                  setPlan({ ...plan, divisoes: updated });
                }}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm font-bold text-white focus:outline-none focus:border-amber-500"
              />
            </div>

            {/* Lista de Exercícios Editáveis */}
            <div className="space-y-3">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <span className="text-xs font-bold text-slate-300">
                  Exercícios Prescritos ({currentDiv.exercicios.length})
                </span>
                <button
                  type="button"
                  onClick={() => setShowCatalogPicker(!showCatalogPicker)}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition ${
                    showCatalogPicker
                      ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                      : 'bg-slate-800 hover:bg-slate-700 text-amber-400 hover:text-amber-300'
                  }`}
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>{showCatalogPicker ? 'Fechar Catálogo de Exercícios' : 'Adicionar Exercício por Categoria'}</span>
                </button>
              </div>

              {/* Painel de Escolha por Categoria -> Lista de Exercícios */}
              {showCatalogPicker && (
                <div className="p-4 rounded-2xl bg-slate-950 border border-amber-500/40 space-y-4 animate-in fade-in duration-200">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-xs font-bold text-amber-400">
                      <Layers className="w-4 h-4" />
                      <span>1. Escolha a Categoria Muscular e depois clique no Exercício para adicionar:</span>
                    </div>
                  </div>

                  {/* Abas de Categorias Musculares */}
                  <div className="flex gap-1.5 flex-wrap">
                    {EXERCISE_CATEGORIES.map((cat) => {
                      const isActive = selectedPickerCategory === cat;
                      const count = EXERCISE_CATALOG.filter((e) => e.categoria === cat).length;
                      return (
                        <button
                          key={cat}
                          type="button"
                          onClick={() => setSelectedPickerCategory(cat)}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                            isActive
                              ? 'bg-amber-500 text-slate-950 shadow-sm'
                              : 'bg-slate-900 border border-slate-800 text-slate-300 hover:border-slate-700 hover:text-white'
                          }`}
                        >
                          <span>{cat}</span>
                          <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${isActive ? 'bg-slate-950/20 text-slate-950' : 'bg-slate-800 text-slate-400'}`}>
                            {count}
                          </span>
                        </button>
                      );
                    })}
                  </div>

                  {/* Lista de Exercícios da Categoria Selecionada */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-64 overflow-y-auto pr-1">
                    {EXERCISE_CATALOG.filter((e) => e.categoria === selectedPickerCategory).map((catEx) => {
                      const alreadyInDivision = currentDiv.exercicios.some((ex) => ex.nome === catEx.nome);
                      return (
                        <button
                          key={catEx.nome}
                          type="button"
                          onClick={() => handleAddCatalogExercise(selectedDivisionIndex, catEx)}
                          className={`p-3 rounded-xl border text-left transition flex items-center justify-between gap-2 ${
                            alreadyInDivision
                              ? 'bg-emerald-500/10 border-emerald-500/40 text-white'
                              : 'bg-slate-900/90 border-slate-800 hover:border-amber-500/50 hover:bg-slate-900 text-slate-200'
                          }`}
                        >
                          <div>
                            <div className="text-xs font-bold text-white flex items-center gap-1.5">
                              <Dumbbell className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                              <span>{catEx.nome}</span>
                            </div>
                            <div className="text-[10px] text-slate-400 mt-0.5">
                              {catEx.equipamento} • {catEx.seriesPadrao}x {catEx.repeticoesPadrao} ({catEx.descansoPadrao}s)
                            </div>
                          </div>

                          <span className={`px-2 py-1 rounded-lg text-[10px] font-bold shrink-0 flex items-center gap-1 ${
                            alreadyInDivision
                              ? 'bg-emerald-500/20 text-emerald-300'
                              : 'bg-amber-500/15 text-amber-300'
                          }`}>
                            {alreadyInDivision ? (
                              <>
                                <Check className="w-3 h-3" />
                                Adicionado
                              </>
                            ) : (
                              <>
                                <Plus className="w-3 h-3" />
                                Incluir
                              </>
                            )}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {currentDiv.exercicios.map((ex, exIndex) => {
                const currentCategory = resolveCategory(ex.grupoMuscular);
                const categoryExercises = EXERCISE_CATALOG.filter((item) => item.categoria === currentCategory);
                const isCatalogMatch = categoryExercises.some((item) => item.nome === ex.nome);

                return (
                  <div
                    key={ex.id}
                    className="p-4 rounded-2xl bg-slate-950 border border-slate-800/80 space-y-3"
                  >
                    {/* Linha 1: Número + Seletor de Categoria + Seletor de Exercício + Botão Excluir */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex items-center gap-2.5 flex-1 flex-wrap sm:flex-nowrap">
                        <span className="w-7 h-7 rounded-lg bg-amber-500/15 border border-amber-500/30 text-amber-400 font-bold text-xs flex items-center justify-center shrink-0">
                          {exIndex + 1}
                        </span>

                        {/* 1º Passo: Escolher a Categoria (Grupo Muscular) */}
                        <div className="w-full sm:w-48 shrink-0">
                          <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                            1. Categoria Muscular
                          </span>
                          <select
                            value={currentCategory}
                            onChange={(e) =>
                              handleChangeCategoryForExisting(selectedDivisionIndex, exIndex, e.target.value)
                            }
                            className="w-full bg-slate-900 border border-slate-700 rounded-xl px-2.5 py-2 text-xs font-bold text-amber-400 focus:outline-none focus:border-amber-500"
                          >
                            {EXERCISE_CATEGORIES.map((cat) => (
                              <option key={cat} value={cat} className="bg-slate-900 text-white">
                                {cat}
                              </option>
                            ))}
                          </select>
                        </div>

                        {/* 2º Passo: Escolher o Exercício dentro da Categoria */}
                        <div className="w-full flex-1">
                          <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                            2. Exercício ({currentCategory})
                          </span>
                          <select
                            value={isCatalogMatch ? ex.nome : '__custom__'}
                            onChange={(e) => {
                              if (e.target.value !== '__custom__') {
                                handleSelectCatalogForExisting(
                                  selectedDivisionIndex,
                                  exIndex,
                                  e.target.value,
                                  currentCategory
                                );
                              }
                            }}
                            className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs font-bold text-white focus:outline-none focus:border-amber-500"
                          >
                            {!isCatalogMatch && (
                              <option value="__custom__" className="bg-slate-900 text-amber-300">
                                {ex.nome} (Personalizado)
                              </option>
                            )}
                            {categoryExercises.map((catEx) => (
                              <option key={catEx.nome} value={catEx.nome} className="bg-slate-900 text-white">
                                {catEx.nome} ({catEx.equipamento})
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleRemoveExercise(selectedDivisionIndex, exIndex)}
                        className="p-2 text-slate-500 hover:text-rose-400 rounded-xl hover:bg-rose-500/10 transition self-end sm:self-center shrink-0"
                        title="Remover exercício"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                  {/* Parâmetros: Séries, Reps, Descanso, Carga */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                    <div>
                      <span className="text-slate-500 block text-[10px] uppercase font-bold mb-1">Séries</span>
                      <input
                        type="number"
                        min="1"
                        max="10"
                        value={ex.series}
                        onChange={(e) => handleUpdateExercise(selectedDivisionIndex, exIndex, 'series', parseInt(e.target.value) || 3)}
                        className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-white font-semibold focus:outline-none focus:border-amber-500"
                      />
                    </div>

                    <div>
                      <span className="text-slate-500 block text-[10px] uppercase font-bold mb-1">Repetições</span>
                      <input
                        type="text"
                        value={ex.repeticoes}
                        onChange={(e) => handleUpdateExercise(selectedDivisionIndex, exIndex, 'repeticoes', e.target.value)}
                        placeholder="Ex: 8-12"
                        className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-white font-semibold focus:outline-none focus:border-amber-500"
                      />
                    </div>

                    <div>
                      <span className="text-slate-500 block text-[10px] uppercase font-bold mb-1">Descanso (s)</span>
                      <input
                        type="number"
                        step="15"
                        value={ex.descansoSegundos}
                        onChange={(e) => handleUpdateExercise(selectedDivisionIndex, exIndex, 'descansoSegundos', parseInt(e.target.value) || 60)}
                        className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-white font-semibold focus:outline-none focus:border-amber-500"
                      />
                    </div>

                    <div>
                      <span className="text-slate-500 block text-[10px] uppercase font-bold mb-1">Carga Sugerida (kg)</span>
                      <input
                        type="number"
                        step="0.5"
                        value={ex.cargaSugeridaKg || ''}
                        onChange={(e) => handleUpdateExercise(selectedDivisionIndex, exIndex, 'cargaSugeridaKg', parseFloat(e.target.value) || undefined)}
                        placeholder="Opcional"
                        className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-white font-semibold focus:outline-none focus:border-amber-500"
                      />
                    </div>
                  </div>

                    {/* Exercício Substituto, Instruções & Link GIF Opcional */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs pt-1">
                      <div>
                        <span className="text-slate-500 block text-[10px] uppercase font-bold mb-1">Substituto (se ocupado)</span>
                        <select
                          value={ex.exercicioSubstituto || ''}
                          onChange={(e) => handleUpdateExercise(selectedDivisionIndex, exIndex, 'exercicioSubstituto', e.target.value)}
                          className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-slate-300 focus:outline-none focus:border-amber-500"
                        >
                          <option value="" className="bg-slate-900 text-slate-400">
                            Selecione um substituto da categoria...
                          </option>
                          {ex.exercicioSubstituto &&
                            !categoryExercises.some((c) => c.nome === ex.exercicioSubstituto) && (
                              <option value={ex.exercicioSubstituto} className="bg-slate-900 text-amber-300">
                                {ex.exercicioSubstituto}
                              </option>
                            )}
                          {categoryExercises
                            .filter((c) => c.nome !== ex.nome)
                            .map((c) => (
                              <option key={c.nome} value={c.nome} className="bg-slate-900 text-white">
                                {c.nome} ({c.equipamento})
                              </option>
                            ))}
                        </select>
                      </div>

                      <div>
                        <span className="text-slate-500 block text-[10px] uppercase font-bold mb-1">Instruções / Dicas</span>
                        <input
                          type="text"
                          value={ex.instrucoes || ''}
                          onChange={(e) => handleUpdateExercise(selectedDivisionIndex, exIndex, 'instrucoes', e.target.value)}
                          placeholder="Ex: Mantenha os cotovelos a 45°"
                          className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-slate-300 focus:outline-none focus:border-amber-500"
                        />
                      </div>

                      <div>
                        <span className="text-slate-500 block text-[10px] uppercase font-bold mb-1">URL de GIF (Opcional)</span>
                        <input
                          type="url"
                          value={ex.gifUrl || ''}
                          onChange={(e) => handleUpdateExercise(selectedDivisionIndex, exIndex, 'gifUrl', e.target.value)}
                          placeholder="Automático se vazio"
                          className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-slate-300 focus:outline-none focus:border-amber-500"
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
