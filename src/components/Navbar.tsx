import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Anamnesis } from '../types';
import { 
  Dumbbell, 
  User, 
  LogOut, 
  ChevronDown, 
  Edit3, 
  Sparkles, 
  Scale, 
  Ruler, 
  Calendar, 
  X, 
  Check,
  UserCheck
} from 'lucide-react';

interface NavbarProps {
  currentView: string;
  onNavigate: (view: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onNavigate }) => {
  const { user, logout, updateUserProfileInfo } = useAuth();
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);

  // Estados do formulário de edição de perfil
  const [nome, setNome] = useState('');
  const [pesoKg, setPesoKg] = useState<number>(72);
  const [alturaCm, setAlturaCm] = useState<number>(172);
  const [idade, setIdade] = useState<number>(25);
  const [genero, setGenero] = useState<Anamnesis['genero']>('masculino');
  const [codigoProfessor, setCodigoProfessor] = useState('');
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (user && showEditModal) {
      setNome(user.nome || '');
      setPesoKg(user.anamnese?.pesoKg || 72);
      setAlturaCm(user.anamnese?.alturaCm || 172);
      setIdade(user.anamnese?.idade || 25);
      setGenero(user.anamnese?.genero || 'masculino');
      setCodigoProfessor('');
      setSaveSuccess(null);
    }
  }, [user, showEditModal]);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || saving) return;

    setSaving(true);
    setSaveSuccess(null);
    try {
      const res = await updateUserProfileInfo({
        nome: nome.trim() || user.nome,
        pesoKg,
        alturaCm,
        idade,
        genero,
        codigoProfessorVinculo: codigoProfessor.trim() || undefined
      });
      if (res.teacherName) {
        setSaveSuccess(`Perfil atualizado e vinculado ao treinador ${res.teacherName}!`);
      } else {
        setSaveSuccess('Informações do perfil salvas com sucesso!');
      }
      setTimeout(() => {
        setShowEditModal(false);
        setSaveSuccess(null);
      }, 1100);
    } catch (err) {
      console.error('Erro ao salvar perfil:', err);
    } finally {
      setSaving(false);
    }
  };

  const imcCalculado =
    pesoKg > 0 && alturaCm > 0
      ? (pesoKg / Math.pow(alturaCm / 100, 2)).toFixed(1)
      : null;

  return (
    <>
      <header className="sticky top-0 z-40 bg-slate-950/80 backdrop-blur-md border-b border-slate-800">
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
          {/* Logo & Marca */}
          <div 
            onClick={() => onNavigate('dashboard')}
            className="flex items-center gap-2.5 cursor-pointer group"
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-700 flex items-center justify-center text-slate-950 shadow-md shadow-emerald-500/20 group-hover:scale-105 transition">
              <Dumbbell className="w-6 h-6 fill-current" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-base tracking-tight text-white">Treino<span className="text-emerald-400">Pro</span></span>
              </div>
              <p className="text-[10px] text-slate-400 hidden sm:block">Inteligência & Prescrição</p>
            </div>
          </div>

          {/* Menu do Usuário */}
          {user ? (
            <div className="flex items-center gap-2">
              {/* Botão do Perfil do Usuário */}
              <div className="relative">
                <button
                  onClick={() => setShowProfileMenu(!showProfileMenu)}
                  className="flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-200 text-xs font-semibold transition"
                >
                  <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold ${
                    user.role === 'professor' 
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' 
                      : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                  }`}>
                    {user.nome ? user.nome.charAt(0).toUpperCase() : 'A'}
                  </div>
                  <div className="text-left hidden sm:block">
                    <div className="text-xs font-semibold truncate max-w-[130px]">{user.nome}</div>
                    <div className="text-[10px] text-slate-400 capitalize">
                      {user.role === 'professor' ? 'Professor / Personal' : 'Aluno'}
                    </div>
                  </div>
                  <ChevronDown className={`w-3.5 h-3.5 text-slate-400 ml-0.5 transition-transform ${showProfileMenu ? 'rotate-180' : ''}`} />
                </button>

                {/* Dropdown de Opções do Perfil */}
                {showProfileMenu && (
                  <>
                    <div
                      className="fixed inset-0 z-40"
                      onClick={() => setShowProfileMenu(false)}
                    />
                    <div className="absolute right-0 mt-2 w-72 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-3 z-50 text-xs animate-in fade-in zoom-in-95">
                      {/* Cabeçalho com dados do usuário logado */}
                      <div className="p-2.5 rounded-xl bg-slate-950/70 border border-slate-800/80 mb-2">
                        <div className="font-bold text-sm text-white truncate">{user.nome}</div>
                        <div className="text-[11px] text-slate-400 truncate">{user.email}</div>
                        {user.role === 'aluno' && user.anamnese?.pesoKg && user.anamnese?.alturaCm && (
                          <div className="mt-2 pt-2 border-t border-slate-800/80 flex items-center gap-2 text-[11px] text-emerald-400 font-medium">
                            <span>{user.anamnese.pesoKg} kg</span>
                            <span>•</span>
                            <span>{user.anamnese.alturaCm} cm</span>
                            {user.anamnese.idade && (
                              <>
                                <span>•</span>
                                <span>{user.anamnese.idade} anos</span>
                              </>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Ações do Perfil */}
                      <div className="space-y-1">
                        <button
                          onClick={() => {
                            setShowProfileMenu(false);
                            setShowEditModal(true);
                          }}
                          className="w-full text-left p-2.5 rounded-xl flex items-center gap-2.5 hover:bg-slate-800 text-slate-200 transition font-medium"
                        >
                          <Edit3 className="w-4 h-4 text-emerald-400 shrink-0" />
                          <div>
                            <div className="text-white font-semibold">Editar Meu Perfil</div>
                            <div className="text-[10px] text-slate-400">Nome, peso, altura, idade e vínculo</div>
                          </div>
                        </button>

                        {user.role === 'aluno' && !user.professorId && (
                          <button
                            onClick={() => {
                              setShowProfileMenu(false);
                              onNavigate('anamnesis');
                            }}
                            className="w-full text-left p-2.5 rounded-xl flex items-center gap-2.5 hover:bg-slate-800 text-slate-200 transition font-medium"
                          >
                            <Sparkles className="w-4 h-4 text-indigo-400 shrink-0" />
                            <div>
                              <div className="text-white font-semibold">Mudar Objetivo / Anamnese</div>
                              <div className="text-[10px] text-slate-400">Recalcular treino com a IA</div>
                            </div>
                          </button>
                        )}
                      </div>

                      <div className="pt-2 mt-2 border-t border-slate-800">
                        <button
                          onClick={() => {
                            logout();
                            setShowProfileMenu(false);
                          }}
                          className="w-full text-left p-2.5 rounded-xl flex items-center gap-2.5 text-rose-400 hover:bg-rose-500/10 transition font-semibold"
                        >
                          <LogOut className="w-4 h-4" />
                          Sair da Conta
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <button
                onClick={() => onNavigate('login')}
                className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs transition"
              >
                Entrar / Cadastrar
              </button>
            </div>
          )}
        </div>
      </header>

      {/* Modal de Edição de Informações do Perfil */}
      {showEditModal && user && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-md w-full shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 flex items-center justify-center">
                  <User className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-white">Meu Perfil</h3>
                  <p className="text-[11px] text-slate-400">Atualize seus dados pessoais e medidas</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowEditModal(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveProfile} className="mt-4 space-y-4">
              {/* Nome Completo */}
              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">
                  Seu Nome
                </label>
                <input
                  type="text"
                  required
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  placeholder="Como quer ser chamado"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              {/* E-mail (somente leitura) */}
              <div>
                <label className="text-xs font-bold text-slate-400 block mb-1">
                  E-mail da Conta
                </label>
                <input
                  type="email"
                  disabled
                  value={user.email}
                  className="w-full bg-slate-950/50 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-500 cursor-not-allowed"
                />
              </div>

              {user.role === 'aluno' && (
                <>
                  {/* Medidas Corporais: Peso, Altura, Idade */}
                  <div className="grid grid-cols-3 gap-2.5">
                    <div>
                      <label className="text-[11px] font-bold text-slate-300 flex items-center gap-1 mb-1">
                        <Scale className="w-3 h-3 text-emerald-400" />
                        Peso (kg)
                      </label>
                      <input
                        type="number"
                        step="0.5"
                        min="30"
                        max="250"
                        value={pesoKg}
                        onChange={(e) => setPesoKg(parseFloat(e.target.value) || 0)}
                        className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm font-bold text-white text-center focus:outline-none focus:border-emerald-500"
                      />
                    </div>

                    <div>
                      <label className="text-[11px] font-bold text-slate-300 flex items-center gap-1 mb-1">
                        <Ruler className="w-3 h-3 text-emerald-400" />
                        Altura (cm)
                      </label>
                      <input
                        type="number"
                        min="120"
                        max="230"
                        value={alturaCm}
                        onChange={(e) => setAlturaCm(parseInt(e.target.value) || 0)}
                        className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm font-bold text-white text-center focus:outline-none focus:border-emerald-500"
                      />
                    </div>

                    <div>
                      <label className="text-[11px] font-bold text-slate-300 flex items-center gap-1 mb-1">
                        <Calendar className="w-3 h-3 text-emerald-400" />
                        Idade
                      </label>
                      <input
                        type="number"
                        min="12"
                        max="100"
                        value={idade}
                        onChange={(e) => setIdade(parseInt(e.target.value) || 0)}
                        className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm font-bold text-white text-center focus:outline-none focus:border-emerald-500"
                      />
                    </div>
                  </div>

                  {/* IMC Calculado em Tempo Real */}
                  {imcCalculado && (
                    <div className="px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between text-xs">
                      <span className="text-slate-400">IMC Atual Calculado:</span>
                      <span className="font-bold text-emerald-400">{imcCalculado} kg/m²</span>
                    </div>
                  )}

                  {/* Sexo / Gênero */}
                  <div>
                    <label className="text-xs font-bold text-slate-300 block mb-1.5">
                      Sexo Biológico / Gênero
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { id: 'masculino', label: 'Masculino' },
                        { id: 'feminino', label: 'Feminino' },
                        { id: 'outro', label: 'Outro' }
                      ].map((g) => (
                        <button
                          key={g.id}
                          type="button"
                          onClick={() => setGenero(g.id as Anamnesis['genero'])}
                          className={`py-2 rounded-xl border text-xs font-semibold transition ${
                            genero === g.id
                              ? 'bg-emerald-500/15 border-emerald-500 text-emerald-300'
                              : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                          }`}
                        >
                          {g.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Vínculo com Professor (Opcional) */}
                  <div>
                    <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5 mb-1">
                      <UserCheck className="w-3.5 h-3.5 text-indigo-400" />
                      Código do Professor / Personal (Opcional)
                    </label>
                    <input
                      type="text"
                      value={codigoProfessor}
                      onChange={(e) => setCodigoProfessor(e.target.value.toUpperCase())}
                      placeholder="Ex: RODR10 (deixe em branco se treina sozinho)"
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                </>
              )}

              {saveSuccess && (
                <div className="p-3 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-semibold flex items-center gap-2">
                  <Check className="w-4 h-4 shrink-0" />
                  <span>{saveSuccess}</span>
                </div>
              )}

              <div className="pt-2 flex gap-2.5">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs transition shadow-lg shadow-emerald-500/20"
                >
                  {saving ? 'Salvando...' : 'Salvar Alterações'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};
