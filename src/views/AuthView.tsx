import React, { useState } from 'react';
import { useAuth, translateFirebaseError } from '../context/AuthContext';
import { UserRole } from '../types';
import { 
  Dumbbell, 
  User, 
  ShieldCheck, 
  UserPlus, 
  LogIn, 
  Eye, 
  EyeOff, 
  AlertCircle,
  Loader2
} from 'lucide-react';

interface AuthViewProps {
  onSuccess: () => void;
}

export const AuthView: React.FC<AuthViewProps> = ({ onSuccess }) => {
  const { login, register, loginWithGoogle, switchDemoUser } = useAuth();
  const [isRegister, setIsRegister] = useState(false);
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [role, setRole] = useState<UserRole>('aluno');
  const [codigoProfessor, setCodigoProfessor] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setLoading(true);

    try {
      if (isRegister) {
        if (password.length < 6) {
          setErrorMsg('A senha deve ter pelo menos 6 caracteres.');
          setLoading(false);
          return;
        }
        await register(nome, email, password, role, codigoProfessor);
      } else {
        await login(email, password);
      }
      onSuccess();
    } catch (err: any) {
      console.error(err);
      setErrorMsg(translateFirebaseError(err));
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setErrorMsg('');
    setGoogleLoading(true);
    try {
      await loginWithGoogle(role, codigoProfessor);
      onSuccess();
    } catch (err: any) {
      console.error(err);
      setErrorMsg(translateFirebaseError(err));
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleQuickDemo = async (userId: string) => {
    setErrorMsg('');
    await switchDemoUser(userId);
    onSuccess();
  };

  return (
    <div className="max-w-md w-full mx-auto px-4 py-8">
      {/* Logo Central */}
      <div className="text-center mb-6">
        <div className="w-16 h-16 rounded-3xl bg-gradient-to-br from-emerald-500 to-teal-700 flex items-center justify-center text-slate-950 shadow-xl shadow-emerald-500/20 mx-auto mb-3">
          <Dumbbell className="w-9 h-9 fill-current" />
        </div>
        <h1 className="text-2xl font-extrabold text-white tracking-tight">
          Treino<span className="text-emerald-400">Pro</span>
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Plataforma de treinos personalizados assistidos por IA
        </p>
      </div>

      {/* Card Principal */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl">
        {/* Alternador Abas: Entrar vs Cadastrar */}
        <div className="flex bg-slate-950 rounded-2xl p-1 mb-5">
          <button
            type="button"
            onClick={() => {
              setIsRegister(false);
              setErrorMsg('');
            }}
            className={`flex-1 py-2.5 text-xs font-bold rounded-xl transition ${
              !isRegister ? 'bg-slate-800 text-white shadow' : 'text-slate-400 hover:text-white'
            }`}
          >
            Entrar
          </button>
          <button
            type="button"
            onClick={() => {
              setIsRegister(true);
              setErrorMsg('');
            }}
            className={`flex-1 py-2.5 text-xs font-bold rounded-xl transition ${
              isRegister ? 'bg-slate-800 text-white shadow' : 'text-slate-400 hover:text-white'
            }`}
          >
            Criar Conta
          </button>
        </div>

        {/* Seletor de Perfil (Aluno vs Professor) */}
        <div className="mb-4">
          <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
            Selecione o seu perfil
          </label>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setRole('aluno')}
              className={`p-3 rounded-xl border text-center transition flex items-center justify-center gap-2 ${
                role === 'aluno'
                  ? 'bg-emerald-500/10 border-emerald-500 text-white shadow-sm shadow-emerald-500/10'
                  : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
              }`}
            >
              <User className="w-4 h-4 text-emerald-400" />
              <span className="text-xs font-bold">Sou Aluno</span>
            </button>

            <button
              type="button"
              onClick={() => setRole('professor')}
              className={`p-3 rounded-xl border text-center transition flex items-center justify-center gap-2 ${
                role === 'professor'
                  ? 'bg-amber-500/10 border-amber-500 text-white shadow-sm shadow-amber-500/10'
                  : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
              }`}
            >
              <ShieldCheck className="w-4 h-4 text-amber-400" />
              <span className="text-xs font-bold">Sou Professor</span>
            </button>
          </div>
        </div>

        {/* Mensagem de Erro */}
        {errorMsg && (
          <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-start gap-2 animate-in fade-in duration-200">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Botão Login com Google */}
        <button
          type="button"
          onClick={handleGoogleSignIn}
          disabled={googleLoading || loading}
          className="w-full py-3 px-4 rounded-2xl bg-white hover:bg-slate-100 text-slate-900 font-bold text-xs transition shadow flex items-center justify-center gap-2.5 disabled:opacity-50"
        >
          {googleLoading ? (
            <Loader2 className="w-4 h-4 animate-spin text-slate-700" />
          ) : (
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
          )}
          <span>Continuar com o Google</span>
        </button>

        {/* Divisor */}
        <div className="relative my-5 flex items-center justify-center">
          <div className="border-t border-slate-800 w-full" />
          <span className="bg-slate-900 px-3 text-[10px] uppercase tracking-wider font-semibold text-slate-500">
            ou com e-mail e senha
          </span>
          <div className="border-t border-slate-800 w-full" />
        </div>

        <form onSubmit={handleSubmit} className="space-y-3.5">
          {isRegister && (
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">Seu Nome Completo</label>
              <input
                type="text"
                required
                placeholder="Ex: Carlos Eduardo"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-500"
              />
            </div>
          )}

          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1">E-mail</label>
            <input
              type="email"
              required
              placeholder="seuemail@exemplo.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1">
              Senha {isRegister && <span className="text-slate-500 font-normal">(mín. 6 caracteres)</span>}
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                required
                minLength={6}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-3.5 pr-10 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-500"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-2.5 text-slate-500 hover:text-slate-300"
                tabIndex={-1}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {isRegister && role === 'aluno' && (
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">
                Código do Treinador (Opcional)
              </label>
              <input
                type="text"
                placeholder="Ex: RODRIGO10"
                value={codigoProfessor}
                onChange={(e) => setCodigoProfessor(e.target.value.toUpperCase())}
                className="w-full uppercase tracking-wider bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-500"
              />
            </div>
          )}

          <button
            type="submit"
            disabled={loading || googleLoading}
            className="w-full py-3.5 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-sm transition shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2 mt-4 disabled:opacity-50"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : isRegister ? (
              <UserPlus className="w-4 h-4" />
            ) : (
              <LogIn className="w-4 h-4" />
            )}
            <span>{isRegister ? 'Criar Minha Conta' : 'Entrar na Plataforma'}</span>
          </button>
        </form>
      </div>

      {/* Box de Acesso Rápido Demo */}
      <div className="mt-6 p-4 rounded-2xl bg-slate-900/60 border border-slate-800/80">
        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-2 text-center">
          Ou teste rapidamente com perfis de demonstração
        </span>
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => handleQuickDemo('aluno_lucas')}
            className="p-2 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 text-emerald-300 text-center transition"
          >
            <div className="font-bold text-xs">Demo Aluno</div>
            <div className="text-[10px] text-slate-400">Lucas Santos</div>
          </button>

          <button
            type="button"
            onClick={() => handleQuickDemo('prof_rodrigo')}
            className="p-2 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/20 text-amber-300 text-center transition"
          >
            <div className="font-bold text-xs">Demo Professor</div>
            <div className="text-[10px] text-slate-400">Prof. Rodrigo</div>
          </button>
        </div>
      </div>
    </div>
  );
};
