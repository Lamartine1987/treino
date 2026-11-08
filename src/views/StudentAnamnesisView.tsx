import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Anamnesis } from '../types';
import { gerarTreinoComIA } from '../services/aiService';
import { saveWorkoutPlan, linkStudentToTeacher } from '../services/storageService';
import { 
  Sparkles, 
  Target, 
  Flame, 
  ShieldAlert, 
  ShieldCheck,
  Calendar, 
  Clock, 
  Dumbbell,
  Scale,
  Ruler,
  User,
  Loader2, 
  UserCheck,
  ArrowLeft,
  ArrowRight,
  Check
} from 'lucide-react';

interface StudentAnamnesisViewProps {
  onWorkoutGenerated: () => void;
}

const TOTAL_STEPS = 6;

export const StudentAnamnesisView: React.FC<StudentAnamnesisViewProps> = ({ onWorkoutGenerated }) => {
  const { user, updateAnamnese } = useAuth();

  const [step, setStep] = useState(1);
  const [semLimitacoes, setSemLimitacoes] = useState<boolean>(
    user?.anamnese ? (user.anamnese.limitacoes?.length === 0) : false
  );

  const [formData, setFormData] = useState<Anamnesis>({
    genero: user?.anamnese?.genero || 'masculino',
    idade: user?.anamnese?.idade || 25,
    pesoKg: user?.anamnese?.pesoKg || 72,
    alturaCm: user?.anamnese?.alturaCm || 172,
    objetivo: user?.anamnese?.objetivo || 'hipertrofia',
    experiencia: user?.anamnese?.experiencia || 'iniciante',
    diasSemana: user?.anamnese?.diasSemana || 4,
    tempoMinutos: user?.anamnese?.tempoMinutos || 60,
    limitacoes: user?.anamnese?.limitacoes || [],
    tipoAmbiente: user?.anamnese?.tipoAmbiente || 'academia_completa',
    observacoes: user?.anamnese?.observacoes || ''
  });

  const [teacherCode, setTeacherCode] = useState('');
  const [teacherLinkMsg, setTeacherLinkMsg] = useState('');
  const [loading, setLoading] = useState(false);

  // Cálculo automático de IMC para exibir na tela
  const calcularImc = () => {
    const peso = formData.pesoKg || 0;
    const alturaM = (formData.alturaCm || 0) / 100;
    if (peso <= 0 || alturaM <= 0) return null;
    const imc = peso / (alturaM * alturaM);
    let classificacao = 'Peso Adequado';
    let cor = 'text-emerald-400';

    if (imc < 18.5) {
      classificacao = 'Abaixo do peso (Foco em ganho de massa)';
      cor = 'text-sky-400';
    } else if (imc >= 25 && imc < 30) {
      classificacao = 'Sobrepeso';
      cor = 'text-amber-400';
    } else if (imc >= 30) {
      classificacao = 'Acima do peso (Atenção articular)';
      cor = 'text-rose-400';
    }
    return { valor: imc.toFixed(1), classificacao, cor };
  };

  const imcData = calcularImc();

  // Avança suavemente para o próximo passo após uma breve confirmação visual
  const advanceStep = (nextStep: number) => {
    setTimeout(() => {
      setStep(nextStep);
    }, 180);
  };

  const handleSelectObjetivo = (objetivo: Anamnesis['objetivo']) => {
    setFormData(prev => ({ ...prev, objetivo }));
    advanceStep(3);
  };

  const handleSelectExperiencia = (experiencia: Anamnesis['experiencia']) => {
    setFormData(prev => ({ ...prev, experiencia }));
    advanceStep(4);
  };

  const handleSelectNenhumaDor = () => {
    setSemLimitacoes(true);
    setFormData(prev => ({ ...prev, limitacoes: [] }));
    advanceStep(6);
  };

  const toggleLimitacao = (item: string) => {
    setSemLimitacoes(false);
    setFormData(prev => {
      const exists = prev.limitacoes.includes(item);
      const updated = exists
        ? prev.limitacoes.filter(l => l !== item)
        : [...prev.limitacoes, item];
      return { ...prev, limitacoes: updated };
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);
    try {
      // 1. Se informou código de professor, vincula
      if (teacherCode.trim()) {
        const res = await linkStudentToTeacher(user.id, teacherCode.trim());
        if (res.success) {
          setTeacherLinkMsg(`Vinculado ao treinador ${res.teacherName}!`);
        }
      }

      // 2. Aciona a IA para montar e salvar a ficha personalizada ANTES de atualizar o estado global user.anamnese,
      // evitando que o App.tsx desmonte a tela de Anamnese antes do treino estar salvo!
      const workoutPlan = await gerarTreinoComIA(user.nome, user.id, formData);
      await saveWorkoutPlan(workoutPlan);

      // 3. Atualiza anamnese do aluno no Firestore e estado local
      await updateAnamnese(formData);

      onWorkoutGenerated();
    } catch (err) {
      console.error('Erro ao gerar treino:', err);
      alert('Houve um imprevisto ao gerar seu treino. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const progressPercent = (step / TOTAL_STEPS) * 100;

  const objetivoLabels: Record<Anamnesis['objetivo'], string> = {
    hipertrofia: 'Ganho de Massa',
    emagrecimento: 'Emagrecimento',
    forca: 'Ganho de Força',
    condicionamento: 'Saúde Geral'
  };

  const experienciaLabels: Record<Anamnesis['experiencia'], string> = {
    iniciante: 'Iniciante',
    intermediario: 'Intermediário',
    avancado: 'Avançado'
  };

  return (
    <div className="max-w-xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="text-center mb-6">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs font-semibold mb-3">
          <Sparkles className="w-3.5 h-3.5" />
          Avaliação Física & Prescrição com IA
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
          Vamos montar o seu treino ideal
        </h1>
        <p className="text-xs sm:text-sm text-slate-400 mt-1.5">
          Etapa <span className="text-emerald-400 font-bold">{step}</span> de <span className="text-slate-200 font-bold">{TOTAL_STEPS}</span>
        </p>
      </div>

      {/* Barra de Progresso */}
      <div className="mb-6">
        <div className="w-full bg-slate-900 h-2 rounded-full overflow-hidden border border-slate-800">
          <div
            className="bg-gradient-to-r from-emerald-500 to-teal-400 h-full transition-all duration-300 rounded-full"
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        {/* Indicadores de etapas clicáveis */}
        <div className="flex items-center justify-between mt-2.5 px-1">
          {[1, 2, 3, 4, 5, 6].map((num) => (
            <button
              key={num}
              type="button"
              disabled={num > step}
              onClick={() => setStep(num)}
              className={`text-[11px] font-bold flex items-center gap-1 transition ${
                num === step
                  ? 'text-emerald-400'
                  : num < step
                  ? 'text-slate-300 hover:text-white cursor-pointer'
                  : 'text-slate-600 cursor-not-allowed'
              }`}
            >
              <span
                className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${
                  num === step
                    ? 'bg-emerald-500 text-slate-950'
                    : num < step
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                    : 'bg-slate-900 text-slate-600 border border-slate-800'
                }`}
              >
                {num < step ? '✓' : num}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Botão Voltar quando estiver nos passos 2 a 6 */}
      {step > 1 && (
        <button
          type="button"
          onClick={() => setStep(prev => prev - 1)}
          className="mb-4 inline-flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-white transition"
        >
          <ArrowLeft className="w-4 h-4" />
          Voltar para a pergunta anterior
        </button>
      )}

      <form onSubmit={handleSubmit}>
        {/* PASSO 1: MEDIDAS CORPORAIS (PESO, ALTURA, IDADE, SEXO) */}
        {step === 1 && (
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-5 animate-in fade-in slide-in-from-right-4 duration-200">
            <div>
              <label className="text-base sm:text-lg font-bold text-white flex items-center gap-2 mb-1">
                <Scale className="w-5 h-5 text-emerald-400" />
                1. Quais são suas medidas corporais?
              </label>
              <p className="text-xs text-slate-400">
                Seu peso, altura e idade ajudam a IA a calibrar as cargas sugeridas e o volume ideal para sua estrutura física.
              </p>
            </div>

            {/* Sexo / Gênero */}
            <div>
              <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5 mb-2">
                <User className="w-3.5 h-3.5 text-emerald-400" />
                Sexo biológico / Gênero:
              </span>
              <div className="grid grid-cols-3 gap-2.5">
                {[
                  { id: 'masculino', label: 'Masculino' },
                  { id: 'feminino', label: 'Feminino' },
                  { id: 'outro', label: 'Outro' }
                ].map(g => (
                  <button
                    type="button"
                    key={g.id}
                    onClick={() => setFormData({ ...formData, genero: g.id as Anamnesis['genero'] })}
                    className={`py-2.5 rounded-xl text-xs font-bold border transition ${
                      formData.genero === g.id
                        ? 'bg-emerald-500/15 border-emerald-500 text-emerald-300'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    {g.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Peso, Altura e Idade */}
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="text-xs font-semibold text-slate-300 flex items-center gap-1 mb-1.5">
                  <Scale className="w-3.5 h-3.5 text-emerald-400" />
                  Peso (kg)
                </label>
                <input
                  type="number"
                  step="0.5"
                  min="30"
                  max="250"
                  required
                  value={formData.pesoKg || ''}
                  onChange={(e) => setFormData({ ...formData, pesoKg: parseFloat(e.target.value) || 0 })}
                  placeholder="Ex: 75"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-3 text-center text-base font-extrabold text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 flex items-center gap-1 mb-1.5">
                  <Ruler className="w-3.5 h-3.5 text-emerald-400" />
                  Altura (cm)
                </label>
                <input
                  type="number"
                  min="100"
                  max="230"
                  required
                  value={formData.alturaCm || ''}
                  onChange={(e) => setFormData({ ...formData, alturaCm: parseInt(e.target.value) || 0 })}
                  placeholder="Ex: 175"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-3 text-center text-base font-extrabold text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 flex items-center gap-1 mb-1.5">
                  <Calendar className="w-3.5 h-3.5 text-emerald-400" />
                  Idade
                </label>
                <input
                  type="number"
                  min="12"
                  max="100"
                  required
                  value={formData.idade || ''}
                  onChange={(e) => setFormData({ ...formData, idade: parseInt(e.target.value) || 0 })}
                  placeholder="Ex: 25"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-3 text-center text-base font-extrabold text-white focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            {/* Indicador de IMC Calculado */}
            {imcData && (
              <div className="p-3.5 rounded-2xl bg-slate-950/90 border border-slate-800 flex items-center justify-between text-xs">
                <div>
                  <span className="text-slate-400 block text-[11px]">Índice de Massa Corporal (IMC)</span>
                  <span className={`font-bold ${imcData.cor}`}>{imcData.classificacao}</span>
                </div>
                <div className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 font-mono font-extrabold text-sm text-white">
                  {imcData.valor}
                </div>
              </div>
            )}

            <button
              type="button"
              onClick={() => setStep(2)}
              disabled={!formData.pesoKg || !formData.alturaCm || !formData.idade}
              className="w-full py-3.5 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-sm flex items-center justify-center gap-2 transition shadow-lg shadow-emerald-500/20 disabled:opacity-50"
            >
              <span>Continuar</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* PASSO 2: OBJETIVO PRINCIPAL */}
        {step === 2 && (
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl animate-in fade-in slide-in-from-right-4 duration-200">
            <label className="text-base sm:text-lg font-bold text-white flex items-center gap-2 mb-2">
              <Target className="w-5 h-5 text-emerald-400" />
              2. Qual é o seu objetivo principal?
            </label>
            <p className="text-xs text-slate-400 mb-5">
              Escolha uma opção abaixo para avançar automaticamente.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {[
                { id: 'hipertrofia', label: 'Ganho de Massa', desc: 'Hipertrofia muscular e volume' },
                { id: 'emagrecimento', label: 'Emagrecimento', desc: 'Queima de gordura e definição' },
                { id: 'forca', label: 'Ganho de Força', desc: 'Cargas altas e progressão de força' },
                { id: 'condicionamento', label: 'Saúde Geral', desc: 'Condicionamento e resistência' }
              ].map(item => {
                const selected = formData.objetivo === item.id;
                return (
                  <button
                    type="button"
                    key={item.id}
                    onClick={() => handleSelectObjetivo(item.id as Anamnesis['objetivo'])}
                    className={`p-4 rounded-2xl border text-left transition flex items-center justify-between group ${
                      selected
                        ? 'bg-emerald-500/15 border-emerald-500 text-white shadow-md shadow-emerald-500/10'
                        : 'bg-slate-950/60 border-slate-800 text-slate-300 hover:border-emerald-500/50 hover:bg-slate-800/60'
                    }`}
                  >
                    <div>
                      <div className="font-bold text-sm text-white group-hover:text-emerald-300 transition">
                        {item.label}
                      </div>
                      <div className="text-xs text-slate-400 mt-0.5">{item.desc}</div>
                    </div>
                    <ArrowRight className={`w-4 h-4 shrink-0 transition ${
                      selected ? 'text-emerald-400 translate-x-0.5' : 'text-slate-600 group-hover:text-emerald-400'
                    }`} />
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* PASSO 3: NÍVEL DE EXPERIÊNCIA */}
        {step === 3 && (
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl animate-in fade-in slide-in-from-right-4 duration-200">
            <label className="text-base sm:text-lg font-bold text-white flex items-center gap-2 mb-2">
              <Flame className="w-5 h-5 text-amber-400" />
              3. Qual é a sua experiência na musculação?
            </label>
            <p className="text-xs text-slate-400 mb-5">
              Isso define a complexidade dos exercícios e o volume de séries.
            </p>

            <div className="space-y-3">
              {[
                { id: 'iniciante', label: 'Iniciante', sub: 'Menos de 6 meses de treino', desc: 'Foco em adaptação neuromuscular, postura e máquinas guiadas.' },
                { id: 'intermediario', label: 'Intermediário', sub: 'De 6 meses a 2 anos', desc: 'Combinação de pesos livres, cabos e sobrecarga progressiva.' },
                { id: 'avancado', label: 'Avançado', sub: 'Mais de 2 anos consistentes', desc: 'Alto volume, controle de cadência e estímulos intensos.' }
              ].map(lvl => {
                const selected = formData.experiencia === lvl.id;
                return (
                  <button
                    type="button"
                    key={lvl.id}
                    onClick={() => handleSelectExperiencia(lvl.id as Anamnesis['experiencia'])}
                    className={`w-full p-4 rounded-2xl border text-left transition flex items-center justify-between group ${
                      selected
                        ? 'bg-amber-500/15 border-amber-500 text-white shadow-md shadow-amber-500/10'
                        : 'bg-slate-950/60 border-slate-800 text-slate-300 hover:border-amber-500/50 hover:bg-slate-800/60'
                    }`}
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-white">{lvl.label}</span>
                        <span className="text-[11px] px-2 py-0.5 rounded-full bg-slate-800 text-amber-300 font-medium">
                          {lvl.sub}
                        </span>
                      </div>
                      <div className="text-xs text-slate-400 mt-1">{lvl.desc}</div>
                    </div>
                    <ArrowRight className={`w-4 h-4 shrink-0 transition ${
                      selected ? 'text-amber-400 translate-x-0.5' : 'text-slate-600 group-hover:text-amber-400'
                    }`} />
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* PASSO 4: DISPONIBILIDADE SEMANAL, TEMPO E LOCAL */}
        {step === 4 && (
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-6 animate-in fade-in slide-in-from-right-4 duration-200">
            <div>
              <label className="text-base sm:text-lg font-bold text-white flex items-center gap-2 mb-1">
                <Calendar className="w-5 h-5 text-emerald-400" />
                4. Disponibilidade e Estrutura de Treino
              </label>
              <p className="text-xs text-slate-400">
                Selecione os dias na semana, o tempo médio e onde você vai treinar.
              </p>
            </div>

            <div>
              <span className="text-xs font-semibold text-slate-300 block mb-2.5">
                Quantos dias por semana você pode ir à academia?
              </span>
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                {[
                  { d: 2, label: '2x' },
                  { d: 3, label: '3x' },
                  { d: 4, label: '4x' },
                  { d: 5, label: '5x' },
                  { d: 6, label: '6x' },
                  { d: 7, label: '7x (Todos)' }
                ].map(({ d, label }) => (
                  <button
                    type="button"
                    key={d}
                    onClick={() => setFormData({ ...formData, diasSemana: d })}
                    className={`py-3 px-2 rounded-xl text-xs sm:text-sm font-bold border transition ${
                      formData.diasSemana === d
                        ? 'bg-emerald-500 text-slate-950 border-emerald-500 shadow-md shadow-emerald-500/20'
                        : 'bg-slate-950 text-slate-300 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            <div className="pt-2 border-t border-slate-800">
              <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5 mb-2.5">
                <Clock className="w-3.5 h-3.5 text-emerald-400" />
                Tempo médio disponível por treino:
              </span>
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                {[
                  { t: 30, label: '30 min' },
                  { t: 45, label: '45 min' },
                  { t: 60, label: '60 min' },
                  { t: 75, label: '75 min' },
                  { t: 90, label: '90 min' },
                  { t: 120, label: '120 min (2h)' }
                ].map(({ t, label }) => (
                  <button
                    type="button"
                    key={t}
                    onClick={() => setFormData({ ...formData, tempoMinutos: t })}
                    className={`py-3 px-2 rounded-xl text-xs font-bold border transition ${
                      formData.tempoMinutos === t
                        ? 'bg-emerald-500 text-slate-950 border-emerald-500 shadow-md shadow-emerald-500/20'
                        : 'bg-slate-950 text-slate-300 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            <div className="pt-2 border-t border-slate-800">
              <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5 mb-2.5">
                <Dumbbell className="w-3.5 h-3.5 text-emerald-400" />
                Equipamentos disponíveis no seu local de treino:
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                {[
                  { id: 'academia_completa', label: 'Academia Completa', sub: 'Máquinas, polias e pesos' },
                  { id: 'academia_basica', label: 'Academia Básica', sub: 'Condomínio / aparelhos simples' },
                  { id: 'halteres_apenas', label: 'Pesos Livres / Casa', sub: 'Halteres, bancos e barras' }
                ].map(amb => (
                  <button
                    type="button"
                    key={amb.id}
                    onClick={() => setFormData({ ...formData, tipoAmbiente: amb.id as Anamnesis['tipoAmbiente'] })}
                    className={`p-3 rounded-xl border text-left transition ${
                      formData.tipoAmbiente === amb.id
                        ? 'bg-emerald-500/15 border-emerald-500 text-white'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <div className="text-xs font-bold text-white">{amb.label}</div>
                    <div className="text-[10px] text-slate-400 mt-0.5">{amb.sub}</div>
                  </button>
                ))}
              </div>
            </div>

            <button
              type="button"
              onClick={() => setStep(5)}
              className="w-full py-3.5 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-sm flex items-center justify-center gap-2 transition shadow-lg shadow-emerald-500/20"
            >
              <span>Continuar</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* PASSO 5: DORES E LIMITAÇÕES ARTICULARES */}
        {step === 5 && (
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-5 animate-in fade-in slide-in-from-right-4 duration-200">
            <div>
              <label className="text-base sm:text-lg font-bold text-white flex items-center gap-2 mb-1">
                <ShieldAlert className="w-5 h-5 text-rose-400" />
                5. Você sente alguma dor ou tem limitação articular?
              </label>
              <p className="text-xs text-slate-400">
                A IA adaptará o treino para proteger suas articulações.
              </p>
            </div>

            {/* Opção NENHUMA DOR em destaque */}
            <button
              type="button"
              onClick={handleSelectNenhumaDor}
              className={`w-full p-4 rounded-2xl border text-left transition flex items-center justify-between ${
                semLimitacoes && formData.limitacoes.length === 0
                  ? 'bg-emerald-500/15 border-emerald-500 text-white shadow-md shadow-emerald-500/10'
                  : 'bg-slate-950/80 border-slate-800 text-slate-200 hover:border-emerald-500/50'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                  semLimitacoes && formData.limitacoes.length === 0
                    ? 'bg-emerald-500 text-slate-950'
                    : 'bg-emerald-500/10 text-emerald-400'
                }`}>
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <div className="font-bold text-sm text-white">Nenhuma dor / Sem limitações</div>
                  <div className="text-xs text-slate-400">Estou 100% apto para qualquer exercício</div>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-emerald-400 shrink-0" />
            </button>

            <div className="relative flex items-center justify-center">
              <div className="border-t border-slate-800 w-full" />
              <span className="bg-slate-900 px-3 text-[10px] uppercase tracking-wider font-semibold text-slate-500 shrink-0">
                ou selecione se tiver alguma dor
              </span>
              <div className="border-t border-slate-800 w-full" />
            </div>

            {/* Opções de dores específicas (múltipla escolha) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {[
                { id: 'joelho', label: 'Dor no Joelho', desc: 'Evita impacto e flexão excessiva' },
                { id: 'lombar', label: 'Dor na Coluna / Lombar', desc: 'Prioriza exercícios com apoio' },
                { id: 'ombro', label: 'Dor no Ombro', desc: 'Ajusta ângulos de empurrar e puxar' },
                { id: 'punho', label: 'Dor no Punho / Cotovelo', desc: 'Prefere pegadas neutras e halteres' }
              ].map(item => {
                const active = formData.limitacoes.includes(item.id);
                return (
                  <button
                    type="button"
                    key={item.id}
                    onClick={() => toggleLimitacao(item.id)}
                    className={`p-3.5 rounded-2xl border text-left transition flex items-center justify-between ${
                      active
                        ? 'bg-rose-500/15 border-rose-500 text-rose-200 shadow-sm'
                        : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                    }`}
                  >
                    <div>
                      <div className="text-xs font-bold text-white">{item.label}</div>
                      <div className="text-[11px] text-slate-400 mt-0.5">{item.desc}</div>
                    </div>
                    <div className={`w-5 h-5 rounded-lg flex items-center justify-center border ${
                      active ? 'bg-rose-500 border-rose-500 text-white' : 'border-slate-700'
                    }`}>
                      {active && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                    </div>
                  </button>
                );
              })}
            </div>

            {formData.limitacoes.length > 0 && (
              <button
                type="button"
                onClick={() => setStep(6)}
                className="w-full py-3.5 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-sm flex items-center justify-center gap-2 transition shadow-lg shadow-emerald-500/20 animate-in fade-in duration-150"
              >
                <span>Confirmar e Continuar ({formData.limitacoes.length} selecionada{formData.limitacoes.length > 1 ? 's' : ''})</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            )}
          </div>
        )}

        {/* PASSO 6: PROFESSOR (OPCIONAL) & GERAR TREINO */}
        {step === 6 && (
          <div className="space-y-5 animate-in fade-in slide-in-from-right-4 duration-200">
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-5">
              <div>
                <label className="text-base sm:text-lg font-bold text-white flex items-center gap-2 mb-1">
                  <UserCheck className="w-5 h-5 text-indigo-400" />
                  6. Possui um Personal ou Professor na Academia? (Opcional)
                </label>
                <p className="text-xs text-slate-400">
                  Se tiver o código do seu professor (ex: <code className="text-indigo-300">RODRIGO10</code>), informe abaixo. Caso contrário, deixe em branco!
                </p>
              </div>

              <input
                type="text"
                placeholder="Ex: RODRIGO10 (ou deixe em branco)"
                value={teacherCode}
                onChange={(e) => setTeacherCode(e.target.value.toUpperCase())}
                className="w-full uppercase tracking-wider bg-slate-950 border border-slate-700 rounded-2xl px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
              />
              {teacherLinkMsg && (
                <p className="text-xs text-emerald-400 font-medium">{teacherLinkMsg}</p>
              )}

              {/* Resumo das Escolhas do Usuário */}
              <div className="pt-4 border-t border-slate-800">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-2.5">
                  Resumo da sua Avaliação (clique para editar qualquer etapa)
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 hover:border-slate-700 text-left"
                  >
                    <span className="text-[10px] text-slate-500 block">Peso & Altura</span>
                    <span className="font-bold text-white">
                      {formData.pesoKg} kg • {formData.alturaCm} cm
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 hover:border-slate-700 text-left"
                  >
                    <span className="text-[10px] text-slate-500 block">Idade & IMC</span>
                    <span className="font-bold text-emerald-400">
                      {formData.idade} anos {imcData ? `(IMC ${imcData.valor})` : ''}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setStep(2)}
                    className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 hover:border-slate-700 text-left"
                  >
                    <span className="text-[10px] text-slate-500 block">Objetivo</span>
                    <span className="font-bold text-emerald-400">{objetivoLabels[formData.objetivo]}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setStep(3)}
                    className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 hover:border-slate-700 text-left"
                  >
                    <span className="text-[10px] text-slate-500 block">Experiência</span>
                    <span className="font-bold text-amber-400">{experienciaLabels[formData.experiencia]}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setStep(4)}
                    className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 hover:border-slate-700 text-left"
                  >
                    <span className="text-[10px] text-slate-500 block">Frequência</span>
                    <span className="font-bold text-white">{formData.diasSemana}x/sem • {formData.tempoMinutos}m</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setStep(5)}
                    className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 hover:border-slate-700 text-left"
                  >
                    <span className="text-[10px] text-slate-500 block">Limitações</span>
                    <span className={`font-bold ${formData.limitacoes.length > 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
                      {formData.limitacoes.length > 0 ? formData.limitacoes.join(', ') : 'Nenhuma dor'}
                    </span>
                  </button>
                </div>
              </div>
            </div>

            {/* Botão Final: Gerar Meu Treino com IA */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 rounded-2xl bg-gradient-to-r from-emerald-500 via-emerald-400 to-teal-400 hover:opacity-95 text-slate-950 font-extrabold text-base shadow-lg shadow-emerald-500/25 flex items-center justify-center gap-2 transition disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>A IA está montando seu treino e salvando no Firebase...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5 fill-current" />
                  <span>Gerar Meu Treino com IA</span>
                </>
              )}
            </button>
          </div>
        )}
      </form>
    </div>
  );
};
