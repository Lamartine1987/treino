import React, { useState, useEffect, useRef } from 'react';
import { UserRole } from '../types';
import {
  Dumbbell,
  Sparkles,
  TrendingUp,
  ShieldCheck,
  Users,
  Play,
  CheckCircle2,
  ArrowRight,
  Flame,
  Shuffle,
  Activity,
  Clock,
  Layers,
  Award,
  ThumbsUp,
  ThumbsDown,
  ChevronRight,
  UserCheck,
  Zap
} from 'lucide-react';

interface LandingViewProps {
  onEnterAuth: (options?: { register?: boolean; role?: UserRole }) => void;
}

export const LandingView: React.FC<LandingViewProps> = ({ onEnterAuth }) => {
  const [activeTab, setActiveTab] = useState<'aluno' | 'professor'>('aluno');
  const [previewDifficulty, setPreviewDifficulty] = useState<'muito_facil' | 'ideal' | 'muito_pesado'>('ideal');
  const [bgFrame, setBgFrame] = useState(0);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  // Cenas de musculação em alta definição que alternam em movimento contínuo (efeito vídeo/GIF dinâmico)
  const gymMotionFrames = [
    'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&w=1920&q=85',
    'https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?auto=format&fit=crop&w=1920&q=85',
    'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?auto=format&fit=crop&w=1920&q=85',
    'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?auto=format&fit=crop&w=1920&q=85'
  ];

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.play().catch(() => {
        // Caso o navegador restrinja autoplay de MP4 externo, o loop de cenas animadas já está ativo
      });
    }
    const timer = setInterval(() => {
      setBgFrame((prev) => (prev + 1) % gymMotionFrames.length);
    }, 4500);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 overflow-x-hidden selection:bg-emerald-500 selection:text-slate-950 relative">
      {/* PLANO DE FUNDO GIGANTE ANIMADO EM MÚLTIPLAS CAMADAS (ALTA VISIBILIDADE) */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        {/* Camada 1: Sequência Cinematográfica de Academia em Movimento Contínuo + Vídeo MP4 */}
        <div className="absolute inset-0">
          {gymMotionFrames.map((src, index) => (
            <img
              key={src}
              src={src}
              alt=""
              className={`absolute inset-0 w-full h-full object-cover animate-ken-burns transition-opacity duration-1000 filter contrast-125 brightness-90 ${
                bgFrame === index ? 'opacity-45' : 'opacity-0'
              }`}
            />
          ))}

          <video
            ref={videoRef}
            autoPlay
            loop
            muted
            playsInline
            crossOrigin="anonymous"
            className="absolute inset-0 w-full h-full object-cover opacity-45 animate-ken-burns mix-blend-lighten"
          >
            <source
              src="https://cdn.pixabay.com/video/2022/10/16/135161-761273563_large.mp4"
              type="video/mp4"
            />
            <source
              src="https://cdn.pixabay.com/video/2020/05/25/40149-424930038_large.mp4"
              type="video/mp4"
            />
          </video>

          {/* Vinheta calibrada: mantém o vídeo/cenas bem visíveis no fundo sem prejudicar a leitura */}
          <div className="absolute inset-0 bg-gradient-to-r from-slate-950/85 via-slate-950/55 to-slate-950/75" />
          <div className="absolute inset-0 bg-gradient-to-b from-slate-950/40 via-transparent to-slate-950/90" />
        </div>

        {/* Camada 2: Malha Cibernética 3D em Movimento Contínuo */}
        <div className="absolute inset-0 animate-grid-flow opacity-90" />

        {/* Camada 3: Holograma Gigante Animado de Barra Olímpica & Anéis de Força no Centro/Fundo */}
        <div className="absolute inset-0 flex items-center justify-center">
          {/* Anel de Radar Biomecânico Girando */}
          <svg
            className="w-[680px] h-[680px] sm:w-[880px] sm:h-[880px] opacity-25 animate-radar-spin"
            viewBox="0 0 400 400"
            fill="none"
          >
            <circle
              cx="200"
              cy="200"
              r="180"
              stroke="#10b981"
              strokeWidth="1.5"
              strokeDasharray="12 18"
            />
            <circle
              cx="200"
              cy="200"
              r="140"
              stroke="#6366f1"
              strokeWidth="1.5"
              strokeDasharray="24 12"
            />
            <circle cx="200" cy="20" r="5" fill="#10b981" />
            <circle cx="200" cy="380" r="5" fill="#6366f1" />
          </svg>

          {/* Barra Olímpica Gigante Fazendo Movimento de Repetição (Subindo e Descendo) */}
          <svg
            className="absolute w-[520px] sm:w-[760px] h-64 opacity-25 animate-barbell-lift"
            viewBox="0 0 600 200"
            fill="none"
          >
            {/* Eixo da Barra */}
            <line x1="60" y1="100" x2="540" y2="100" stroke="#10b981" strokeWidth="8" strokeLinecap="round" />
            {/* Anilhas Esquerda */}
            <rect x="75" y="35" width="22" height="130" rx="6" fill="#10b981" fillOpacity="0.45" stroke="#10b981" strokeWidth="3" />
            <rect x="48" y="50" width="18" height="100" rx="5" fill="#059669" fillOpacity="0.45" stroke="#10b981" strokeWidth="2.5" />
            <rect x="25" y="68" width="15" height="64" rx="4" fill="#34d399" fillOpacity="0.45" stroke="#10b981" strokeWidth="2" />
            {/* Anilhas Direita */}
            <rect x="503" y="35" width="22" height="130" rx="6" fill="#10b981" fillOpacity="0.45" stroke="#10b981" strokeWidth="3" />
            <rect x="534" y="50" width="18" height="100" rx="5" fill="#059669" fillOpacity="0.45" stroke="#10b981" strokeWidth="2.5" />
            <rect x="560" y="68" width="15" height="64" rx="4" fill="#34d399" fillOpacity="0.45" stroke="#10b981" strokeWidth="2" />
          </svg>
        </div>

        {/* Camada 4: Orbes Gigantes de Energia Dinâmica */}
        <div className="absolute -top-24 -left-24 w-[520px] h-[520px] bg-emerald-500/25 rounded-full blur-[130px] animate-orb-drift" />
        <div className="absolute top-1/4 -right-32 w-[500px] h-[500px] bg-indigo-500/20 rounded-full blur-[140px] animate-float-slow" />
        <div className="absolute -bottom-32 left-1/4 w-[480px] h-[480px] bg-amber-500/15 rounded-full blur-[130px] animate-float-reverse" />

        {/* Camada 5: Onda Gigante de Pulso Biomecânico / ECG atravessando a tela */}
        <svg
          className="absolute top-[32%] left-0 w-full h-64 opacity-50"
          viewBox="0 0 1440 200"
          fill="none"
          preserveAspectRatio="none"
        >
          <path
            d="M0 100 L320 100 L360 40 L400 165 L445 15 L490 175 L530 70 L565 100 L940 100 L980 50 L1020 155 L1065 25 L1110 170 L1150 80 L1185 100 L1440 100"
            stroke="url(#pulseGrad)"
            strokeWidth="4"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="animate-pulse-ecg"
          />
          <defs>
            <linearGradient id="pulseGrad" x1="0" y1="0" x2="1440" y2="0" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#10b981" stopOpacity="0" />
              <stop offset="50%" stopColor="#10b981" stopOpacity="1" />
              <stop offset="85%" stopColor="#6366f1" stopOpacity="0.95" />
              <stop offset="100%" stopColor="#6366f1" stopOpacity="0" />
            </linearGradient>
          </defs>
        </svg>

        {/* Camada 6: Silhuetas Gigantes de Halteres Flutuando nas Laterais */}
        <div className="hidden lg:flex absolute top-24 left-[5%] text-emerald-400/15 animate-float-slow">
          <Dumbbell className="w-64 h-64 -rotate-12" />
        </div>
        <div className="hidden lg:flex absolute bottom-20 right-[4%] text-indigo-400/15 animate-float-reverse">
          <Dumbbell className="w-72 h-72 rotate-12" />
        </div>
      </div>

      {/* Navbar Fixa com Glassmorphism */}
      <header className="sticky top-0 z-40 bg-slate-950/80 backdrop-blur-xl border-b border-slate-800/80">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-emerald-400 to-teal-600 flex items-center justify-center text-slate-950 shadow-lg shadow-emerald-500/25">
              <Dumbbell className="w-5 h-5 fill-current" />
            </div>
            <div>
              <span className="font-extrabold text-lg tracking-tight text-white">
                Treino<span className="text-emerald-400">Pro</span>
              </span>
              <span className="hidden sm:block text-[10px] text-slate-400 -mt-1 font-medium">
                Inteligência Biomecânica & Prescrição
              </span>
            </div>
          </div>

          <nav className="hidden md:flex items-center gap-6 text-xs font-semibold text-slate-300">
            <a href="#recursos" className="hover:text-emerald-400 transition">
              Recursos
            </a>
            <a href="#publico" className="hover:text-emerald-400 transition">
              Alunos & Personais
            </a>
            <a href="#como-funciona" className="hover:text-emerald-400 transition">
              Como Funciona
            </a>
          </nav>

          <div className="flex items-center gap-2.5">
            <button
              onClick={() => onEnterAuth({ register: false })}
              className="px-4 py-2 rounded-xl text-xs font-bold text-slate-200 hover:text-white hover:bg-slate-900 border border-slate-800 transition"
            >
              Entrar
            </button>
            <button
              onClick={() => onEnterAuth({ register: true, role: 'aluno' })}
              className="px-4 py-2 rounded-xl text-xs font-extrabold bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-lg shadow-emerald-500/20 transition flex items-center gap-1.5"
            >
              <span>Começar Agora</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </header>

      {/* HERO SECTION */}
      <section className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 pt-10 pb-16 lg:pt-16 lg:pb-24">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-8 items-center">
          {/* Coluna Esquerda: Copy Principal */}
          <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/25 text-emerald-300 text-xs font-bold">
              <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
              <span>Plataforma Inteligente para Alunos e Personal Trainers</span>
            </div>

            <h1 className="text-3xl sm:text-5xl lg:text-[52px] font-black tracking-tight text-white leading-[1.12]">
              Seu treino evolui a cada sessão.{' '}
              <span className="bg-gradient-to-r from-emerald-400 via-teal-300 to-indigo-400 bg-clip-text text-transparent">
                Suas cargas e resultados também.
              </span>
            </h1>

            <p className="text-sm sm:text-base text-slate-300 max-w-2xl mx-auto lg:mx-0 leading-relaxed">
              O <strong className="text-white">TreinoPro</strong> une prescrição profissional de musculação, catálogo biomecânico com demonstrações animadas e inteligência artificial que ajusta o peso de <strong className="text-emerald-400">cada exercício individualmente</strong> conforme o seu desempenho real.
            </p>

            {/* Botões de Ação Principais */}
            <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-3 pt-2">
              <button
                onClick={() => onEnterAuth({ register: true, role: 'aluno' })}
                className="w-full sm:w-auto px-7 py-4 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-sm shadow-xl shadow-emerald-500/25 flex items-center justify-center gap-2 transition active:scale-95"
              >
                <Zap className="w-4 h-4 fill-current" />
                <span>Quero Evoluir Meus Treinos</span>
              </button>

              <button
                onClick={() => onEnterAuth({ register: true, role: 'professor' })}
                className="w-full sm:w-auto px-6 py-4 rounded-2xl bg-slate-900 hover:bg-slate-800 text-amber-400 border border-amber-500/30 font-bold text-sm flex items-center justify-center gap-2 transition"
              >
                <ShieldCheck className="w-4 h-4" />
                <span>Sou Personal / Professor</span>
              </button>
            </div>

            {/* Indicadores Rápidos */}
            <div className="grid grid-cols-3 gap-4 pt-6 border-t border-slate-800/80 max-w-lg mx-auto lg:mx-0">
              <div>
                <div className="text-xl sm:text-2xl font-black text-white">+65</div>
                <div className="text-[11px] text-slate-400">Exercícios com Guia & GIF</div>
              </div>
              <div>
                <div className="text-xl sm:text-2xl font-black text-emerald-400">100%</div>
                <div className="text-[11px] text-slate-400">Ajuste de Carga por Exercício</div>
              </div>
              <div>
                <div className="text-xl sm:text-2xl font-black text-amber-400">Tempo Real</div>
                <div className="text-[11px] text-slate-400">Vínculo Aluno & Personal</div>
              </div>
            </div>
          </div>

          {/* Coluna Direita: Mockup Interativo ao Vivo */}
          <div className="lg:col-span-5">
            <div className="relative rounded-3xl bg-gradient-to-b from-slate-900 to-slate-950 border border-slate-800 p-5 shadow-2xl shadow-emerald-950/40">
              {/* Topo do Card Demonstrativo */}
              <div className="flex items-center justify-between pb-4 border-b border-slate-800">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-[10px] font-bold text-emerald-300">
                      🎯 Treino da Vez (A → B → C)
                    </span>
                    <span className="px-2 py-0.5 rounded-full bg-indigo-500/15 border border-indigo-500/30 text-[10px] font-bold text-indigo-300">
                      Fase 1 • Ciclo 3 de 6
                    </span>
                  </div>
                  <h3 className="text-base font-extrabold text-white mt-1.5">
                    Treino A — Peitoral, Ombros e Tríceps
                  </h3>
                </div>
                <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                  <Activity className="w-5 h-5" />
                </div>
              </div>

              {/* Simulação Interativa de um Exercício */}
              <div className="mt-4 p-4 rounded-2xl bg-slate-950/90 border border-slate-800/90 space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                        Peitoral
                      </span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                        📈 {previewDifficulty === 'muito_facil' ? '+2 kg no próx. (18 → 20 kg)' : previewDifficulty === 'muito_pesado' ? 'Ajuste seguro (18 → 16 kg)' : '+2 kg vs último ciclo (16 → 18 kg)'}
                      </span>
                    </div>
                    <h4 className="text-sm font-bold text-white mt-1.5">
                      1. Supino Inclinado com Halteres
                    </h4>
                    <p className="text-[11px] text-slate-400">
                      4 séries × 8-12 reps • Descanso: <span className="text-emerald-400 font-semibold">60s</span>
                    </p>
                  </div>
                  <span className="px-2 py-1 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-300 text-[10px] font-semibold flex items-center gap-1 shrink-0">
                    <Shuffle className="w-3 h-3" />
                    Substituto
                  </span>
                </div>

                {/* Séries demonstrativas */}
                <div className="space-y-1.5 pt-1">
                  {[
                    { s: 1, kg: 18, reps: 12, done: true },
                    { s: 2, kg: 18, reps: 10, done: true },
                    { s: 3, kg: 18, reps: 10, done: true }
                  ].map((row) => (
                    <div
                      key={row.s}
                      className="grid grid-cols-12 items-center bg-emerald-950/20 border border-emerald-500/30 rounded-xl px-3 py-1.5 text-xs"
                    >
                      <span className="col-span-3 font-bold text-slate-300">Série #{row.s}</span>
                      <span className="col-span-4 text-center font-bold text-white">{row.kg} kg</span>
                      <span className="col-span-3 text-center text-slate-300">{row.reps} reps</span>
                      <span className="col-span-2 flex justify-end">
                        <span className="w-6 h-6 rounded-lg bg-emerald-500 text-slate-950 flex items-center justify-center font-bold">
                          ✓
                        </span>
                      </span>
                    </div>
                  ))}
                </div>

                {/* Seletor Interativo de Dificuldade por Exercício no Mockup */}
                <div className="pt-2 border-t border-slate-800/80">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[11px] font-semibold text-slate-300">
                      Teste agora: Como sentiu este exercício?
                    </span>
                    <span className="text-[10px] text-emerald-400 font-semibold">Interativo</span>
                  </div>
                  <div className="grid grid-cols-3 gap-1.5">
                    {[
                      { id: 'muito_facil' as const, label: 'Leve', sub: '+2kg próx.', icon: ThumbsDown, color: 'bg-sky-500/20 border-sky-500 text-sky-300' },
                      { id: 'ideal' as const, label: 'Na Medida', sub: 'Ideal', icon: ThumbsUp, color: 'bg-emerald-500/20 border-emerald-500 text-emerald-300' },
                      { id: 'muito_pesado' as const, label: 'Pesado', sub: '-2kg próx.', icon: Flame, color: 'bg-amber-500/20 border-amber-500 text-amber-300' }
                    ].map((btn) => {
                      const Icon = btn.icon;
                      const active = previewDifficulty === btn.id;
                      return (
                        <button
                          key={btn.id}
                          type="button"
                          onClick={() => setPreviewDifficulty(btn.id)}
                          className={`p-2 rounded-xl border text-[11px] font-bold flex items-center justify-center gap-1.5 transition ${
                            active
                              ? btn.color
                              : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                          }`}
                        >
                          <Icon className="w-3.5 h-3.5 shrink-0" />
                          <div className="text-left leading-tight">
                            <span className="block">{btn.label}</span>
                            <span className="block text-[9px] opacity-75">{btn.sub}</span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Rodapé do Mockup */}
              <div className="mt-3 flex items-center justify-between text-[11px] text-slate-400 px-1">
                <span className="flex items-center gap-1 text-emerald-400 font-semibold">
                  <Clock className="w-3.5 h-3.5" />
                  Timer de descanso automático
                </span>
                <span>Animações de execução inclusas</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SEÇÃO DE RECURSOS INTELIGENTES */}
      <section id="recursos" className="relative z-10 py-16 bg-slate-900/40 border-y border-slate-800/80">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <span className="text-xs font-bold uppercase tracking-widest text-emerald-400">
              Por que o TreinoPro é diferente?
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white mt-2">
              Chega de fichas estáticas em papel ou PDFs esquecidos no WhatsApp
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 mt-2">
              Cada detalhe foi pensado para eliminar dúvidas na academia e garantir que você nunca estagne nos resultados.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {[
              {
                icon: TrendingUp,
                color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
                title: 'Sobrecarga Progressiva por Exercício',
                desc: 'Achou o Supino pesado e o Tríceps leve? Avalie a dificuldade de cada exercício separadamente e o sistema recalcula as cargas do próximo treino.'
              },
              {
                icon: Layers,
                color: 'text-indigo-400 bg-indigo-500/10 border-indigo-500/20',
                title: 'Rotação Automática (A → B → C)',
                desc: 'Você nunca fica perdido sem saber qual treino fazer hoje. O app identifica sua última sessão e já seleciona o próximo treino da fila automaticamente.'
              },
              {
                icon: Play,
                color: 'text-sky-400 bg-sky-500/10 border-sky-500/20',
                title: 'Demonstração Animada + Biomecânica',
                desc: 'Mais de 65 exercícios clássicos com demonstração visual em movimento, músculos-alvo destacados e dicas técnicas de postura.'
              },
              {
                icon: Shuffle,
                color: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
                title: 'Aparelho Ocupado? Substituto na Hora',
                desc: 'Academia lotada no horário de pico? Com 1 toque você vê o exercício substituto equivalente para não perder ritmo nem esperar fila.'
              },
              {
                icon: Award,
                color: 'text-purple-400 bg-purple-500/10 border-purple-500/20',
                title: 'Periodização Dinâmica por Ciclos',
                desc: 'A duração da sua ficha (4 a 10 ciclos) adapta-se ao seu nível (Iniciante, Intermediário ou Avançado) e evolui para novas Fases sem estagnação.'
              },
              {
                icon: UserCheck,
                color: 'text-rose-400 bg-rose-500/10 border-rose-500/20',
                title: 'Respeito Total às suas Articulações',
                desc: 'Possui desconforto no joelho, ombro ou lombar? A prescrição filtra movimentos lesivos e prioriza variações biomecanicamente seguras.'
              }
            ].map((feat, idx) => {
              const Icon = feat.icon;
              return (
                <div
                  key={idx}
                  className="p-6 rounded-3xl bg-slate-900/90 border border-slate-800 hover:border-slate-700 transition group"
                >
                  <div className={`w-11 h-11 rounded-2xl border flex items-center justify-center mb-4 ${feat.color}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <h3 className="text-base font-bold text-white group-hover:text-emerald-400 transition">
                    {feat.title}
                  </h3>
                  <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                    {feat.desc}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* SEÇÃO DUPLA: PARA ALUNOS vs PARA PERSONAL TRAINERS */}
      <section id="publico" className="relative z-10 py-16 max-w-6xl mx-auto px-4 sm:px-6">
        <div className="text-center max-w-2xl mx-auto mb-8">
          <span className="text-xs font-bold uppercase tracking-widest text-amber-400">
            Dois Modos Integrados
          </span>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white mt-2">
            Perfeito para quem treina. Completo para quem prescreve.
          </h2>
        </div>

        {/* Seletor de Abas */}
        <div className="flex justify-center mb-10">
          <div className="inline-flex p-1.5 rounded-2xl bg-slate-900 border border-slate-800">
            <button
              type="button"
              onClick={() => setActiveTab('aluno')}
              className={`px-5 py-2.5 rounded-xl text-xs font-extrabold flex items-center gap-2 transition ${
                activeTab === 'aluno'
                  ? 'bg-emerald-500 text-slate-950 shadow-lg shadow-emerald-500/20'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Dumbbell className="w-4 h-4" />
              <span>Para Alunos & Praticantes</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('professor')}
              className={`px-5 py-2.5 rounded-xl text-xs font-extrabold flex items-center gap-2 transition ${
                activeTab === 'professor'
                  ? 'bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/20'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Users className="w-4 h-4" />
              <span>Para Personal Trainers & Professores</span>
            </button>
          </div>
        </div>

        {activeTab === 'aluno' ? (
          <div className="bg-gradient-to-br from-slate-900 via-slate-900 to-emerald-950/30 border border-emerald-500/25 rounded-3xl p-6 sm:p-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            <div className="lg:col-span-7 space-y-5">
              <span className="px-3 py-1 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 text-xs font-bold">
                Experiência do Aluno
              </span>
              <h3 className="text-2xl sm:text-3xl font-black text-white">
                Treine com seu Personal ou gere sua periodização inteligente com IA
              </h3>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                Seja você acompanhado por um treinador na plataforma ou alguém que treina por conta própria, o TreinoPro guia cada série, descanso e progressão de peso.
              </p>

              <ul className="space-y-3 text-xs sm:text-sm text-slate-200">
                {[
                  'Anamnese completa considerando peso, altura, idade, objetivo e tempo disponível.',
                  'Vínculo automático com seu Personal Trainer através do Código do Professor ou do seu e-mail.',
                  'Cronômetro de descanso inteligente que dispara assim que você conclui a série.',
                  'Classificação individual por exercício (Leve, Na Medida ou Pesado) com ajuste automático de carga.'
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>

              <div className="pt-2">
                <button
                  onClick={() => onEnterAuth({ register: true, role: 'aluno' })}
                  className="px-6 py-3.5 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-xs sm:text-sm flex items-center gap-2 shadow-lg shadow-emerald-500/20 transition"
                >
                  <span>Criar Conta de Aluno</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="lg:col-span-5 bg-slate-950/80 border border-slate-800 rounded-2xl p-5 space-y-3">
              <div className="text-xs font-bold text-emerald-400 uppercase tracking-wider">
                Exemplo de Evolução Automática do Aluno
              </div>
              <div className="space-y-2.5">
                <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between">
                  <div>
                    <div className="text-xs font-bold text-white">Leg Press 45°</div>
                    <div className="text-[11px] text-slate-400">Avaliado como: <span className="text-sky-300 font-semibold">Leve</span></div>
                  </div>
                  <span className="px-2.5 py-1 rounded-lg bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 text-xs font-bold">
                    80kg → 84kg (+4kg)
                  </span>
                </div>

                <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between">
                  <div>
                    <div className="text-xs font-bold text-white">Cadeira Extensora</div>
                    <div className="text-[11px] text-slate-400">Avaliado como: <span className="text-emerald-300 font-semibold">Na Medida</span></div>
                  </div>
                  <span className="px-2.5 py-1 rounded-lg bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 text-xs font-bold">
                    45kg → 46kg (+1kg)
                  </span>
                </div>

                <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between">
                  <div>
                    <div className="text-xs font-bold text-white">Stiff com Barra</div>
                    <div className="text-[11px] text-slate-400">Avaliado como: <span className="text-amber-300 font-semibold">Pesado</span></div>
                  </div>
                  <span className="px-2.5 py-1 rounded-lg bg-amber-500/15 text-amber-300 border border-amber-500/30 text-xs font-bold">
                    40kg → 38kg (-2kg)
                  </span>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-gradient-to-br from-slate-900 via-slate-900 to-amber-950/30 border border-amber-500/25 rounded-3xl p-6 sm:p-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            <div className="lg:col-span-7 space-y-5">
              <span className="px-3 py-1 rounded-full bg-amber-500/15 text-amber-300 border border-amber-500/30 text-xs font-bold">
                Painel do Treinador / Personal
              </span>
              <h3 className="text-2xl sm:text-3xl font-black text-white">
                Prescreva em segundos, escale sua consultoria e fidelize seus alunos
              </h3>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                Tenha controle total sobre a prescrição dos seus alunos com um editor rápido por categoria muscular e um Copiloto de IA que monta o rascunho técnico sob seu comando.
              </p>

              <ul className="space-y-3 text-xs sm:text-sm text-slate-200">
                {[
                  'Catálogo estruturado por Grupo Muscular (Peitoral, Dorsal, Quadríceps, Glúteos...) com auto-preenchimento.',
                  'Pré-cadastro inteligente: crie o treino com o e-mail do aluno antes mesmo dele criar a conta!',
                  'Edite objetivo, frequência semanal, nível, tempo de sessão e quantidade de ciclos direto no painel.',
                  'Histórico completo de cada aluno mostrando duração, séries feitas e a percepção de peso de cada exercício.'
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>

              <div className="pt-2">
                <button
                  onClick={() => onEnterAuth({ register: true, role: 'professor' })}
                  className="px-6 py-3.5 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold text-xs sm:text-sm flex items-center gap-2 shadow-lg shadow-amber-500/20 transition"
                >
                  <span>Criar Conta de Professor / Personal</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="lg:col-span-5 bg-slate-950/80 border border-slate-800 rounded-2xl p-5 space-y-3">
              <div className="text-xs font-bold text-amber-400 uppercase tracking-wider">
                Ferramentas Exclusivas do Professor
              </div>
              <div className="space-y-2.5 text-xs">
                <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800">
                  <div className="font-bold text-white mb-0.5">1. Seleção Rápida por Categoria</div>
                  <p className="text-slate-400 text-[11px]">
                    Escolha o grupo muscular e selecione entre dezenas de exercícios já calibrados com séries, descanso e vídeo.
                  </p>
                </div>
                <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800">
                  <div className="font-bold text-white mb-0.5">2. Copiloto IA sob Comando</div>
                  <p className="text-slate-400 text-[11px]">
                    Peça ajustes como: "Troque exercícios livres por máquinas para proteger a lombar" e revise antes de publicar.
                  </p>
                </div>
                <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800">
                  <div className="font-bold text-white mb-0.5">3. Código Único de Treinador</div>
                  <p className="text-slate-400 text-[11px]">
                    Compartilhe seu código exclusivo ou cadastre o e-mail do aluno para sincronizar a ficha instantaneamente.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </section>

      {/* COMO FUNCIONA EM 3 PASSOS */}
      <section id="como-funciona" className="relative z-10 py-14 border-t border-slate-800/80">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center max-w-xl mx-auto mb-10">
            <span className="text-xs font-bold uppercase tracking-widest text-emerald-400">
              Simples e Direto
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white mt-1">
              Comece em menos de 1 minuto
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                step: '01',
                title: 'Crie sua conta gratuita',
                desc: 'Entre com sua conta Google ou e-mail escolhendo seu perfil de Aluno ou de Professor/Personal.'
              },
              {
                step: '02',
                title: 'Configure seu Perfil ou Vincule-se',
                desc: 'Informe seu objetivo, dias da semana e biometria — ou conecte-se direto ao código do seu Personal Trainer.'
              },
              {
                step: '03',
                title: 'Treine e Evolua a Cada Ciclo',
                desc: 'Marque suas séries, avalie o peso de cada exercício e deixe o sistema guiar sua sobrecarga progressiva.'
              }
            ].map((item, i) => (
              <div
                key={i}
                className="p-6 rounded-3xl bg-slate-900/60 border border-slate-800 relative overflow-hidden"
              >
                <span className="text-4xl font-black text-emerald-500/15 absolute top-4 right-5 select-none">
                  {item.step}
                </span>
                <div className="w-8 h-8 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 font-extrabold text-xs flex items-center justify-center mb-4">
                  {item.step}
                </div>
                <h3 className="text-base font-bold text-white">{item.title}</h3>
                <p className="text-xs text-slate-400 mt-2 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>

          {/* CTA Final */}
          <div className="mt-14 p-8 sm:p-10 rounded-3xl bg-gradient-to-r from-emerald-950/60 via-slate-900 to-indigo-950/60 border border-emerald-500/30 text-center space-y-5">
            <h3 className="text-2xl sm:text-3xl font-black text-white">
              Pronto para transformar seus treinos com inteligência?
            </h3>
            <p className="text-xs sm:text-sm text-slate-300 max-w-xl mx-auto">
              Acesse agora no celular ou computador, sem precisar baixar nada nas lojas de aplicativos.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-1">
              <button
                onClick={() => onEnterAuth({ register: true, role: 'aluno' })}
                className="w-full sm:w-auto px-7 py-3.5 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-sm shadow-lg shadow-emerald-500/25 transition"
              >
                Criar Conta de Aluno
              </button>
              <button
                onClick={() => onEnterAuth({ register: false })}
                className="w-full sm:w-auto px-7 py-3.5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-sm transition"
              >
                Já tenho conta • Entrar
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Rodapé */}
      <footer className="relative z-10 border-t border-slate-900 py-8 text-center text-xs text-slate-500">
        <div className="max-w-6xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Dumbbell className="w-4 h-4 text-emerald-400" />
            <span className="font-bold text-slate-300">TreinoPro</span>
            <span>— Inteligência Biomecânica & Prescrição</span>
          </div>
          <div>© {new Date().getFullYear()} TreinoPro. Todos os direitos reservados.</div>
        </div>
      </footer>
    </div>
  );
};
