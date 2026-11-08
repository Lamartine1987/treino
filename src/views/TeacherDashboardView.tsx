import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { UserProfile, WorkoutPlan, WorkoutLog } from '../types';
import { 
  getStudentsByTeacher, 
  getActiveWorkoutPlan, 
  getStudentWorkoutLogs, 
  saveUserProfile,
  getUserByEmail
} from '../services/storageService';
import { 
  Users, 
  Share2, 
  Copy, 
  Check, 
  Plus, 
  Dumbbell, 
  Calendar, 
  Clock, 
  Sparkles, 
  ChevronRight, 
  ShieldAlert, 
  Flame, 
  Search,
  Activity,
  UserPlus
} from 'lucide-react';

interface TeacherDashboardViewProps {
  onEditStudentWorkout: (student: UserProfile) => void;
}

export const TeacherDashboardView: React.FC<TeacherDashboardViewProps> = ({
  onEditStudentWorkout
}) => {
  const { user } = useAuth();
  const [students, setStudents] = useState<UserProfile[]>([]);
  const [selectedStudentLogs, setSelectedStudentLogs] = useState<{ student: UserProfile; logs: WorkoutLog[] } | null>(null);
  const [copiedCode, setCopiedCode] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

  // Modal para cadastrar aluno diretamente pelo professor
  const [showAddModal, setShowAddModal] = useState(false);
  const [newStudentName, setNewStudentName] = useState('');
  const [newStudentEmail, setNewStudentEmail] = useState('');
  const [newStudentGoal, setNewStudentGoal] = useState<'hipertrofia' | 'emagrecimento' | 'forca' | 'condicionamento'>('hipertrofia');
  const [newStudentDays, setNewStudentDays] = useState(4);

  const teacherCode = user?.codigoProfessor || 'PROFTREINO';

  const loadStudents = async () => {
    if (!user) return;
    setLoading(true);
    const list = await getStudentsByTeacher(user.id);
    setStudents(list);
    setLoading(false);
  };

  useEffect(() => {
    loadStudents();
  }, [user]);

  const handleCopyCode = () => {
    navigator.clipboard.writeText(teacherCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleOpenStudentHistory = async (student: UserProfile) => {
    const logs = await getStudentWorkoutLogs(student.id);
    setSelectedStudentLogs({ student, logs });
  };

  const handleCreateStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !newStudentName.trim()) return;

    const cleanEmail = (
      newStudentEmail.trim() || `${newStudentName.toLowerCase().replace(/\s+/g, '')}@aluno.com`
    ).toLowerCase();

    // Verifica se o aluno já possui conta com este e-mail para vincular diretamente sem criar duplicata
    const existingStudent = await getUserByEmail(cleanEmail);

    const targetStudent: UserProfile = existingStudent
      ? {
          ...existingStudent,
          nome: existingStudent.nome || newStudentName.trim(),
          professorId: user.id,
          anamnese: existingStudent.anamnese || {
            objetivo: newStudentGoal,
            experiencia: 'iniciante',
            diasSemana: newStudentDays,
            tempoMinutos: 60,
            limitacoes: [],
            tipoAmbiente: 'academia_completa'
          }
        }
      : {
          id: 'aluno_' + Date.now(),
          nome: newStudentName.trim(),
          email: cleanEmail,
          role: 'aluno',
          professorId: user.id,
          anamnese: {
            objetivo: newStudentGoal,
            experiencia: 'iniciante',
            diasSemana: newStudentDays,
            tempoMinutos: 60,
            limitacoes: [],
            tipoAmbiente: 'academia_completa'
          }
        };

    await saveUserProfile(targetStudent);
    setShowAddModal(false);
    setNewStudentName('');
    setNewStudentEmail('');
    await loadStudents();
    onEditStudentWorkout(targetStudent);
  };

  const filteredStudents = students.filter(s =>
    s.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 space-y-6">
      {/* Header do Professor */}
      <div className="bg-gradient-to-br from-slate-900 to-slate-900/90 border border-slate-800 rounded-3xl p-6 relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-amber-400 mb-1">
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
              Painel do Treinador / Personal
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              {user?.nome}
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              Prescreva treinos assistidos por IA, ajuste séries e acompanhe a evolução dos seus alunos em tempo real.
            </p>
          </div>

          {/* Cartão de Código de Convite */}
          <div className="bg-slate-950/80 border border-amber-500/30 rounded-2xl p-4 flex items-center gap-4 shrink-0">
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                Seu Código de Aluno
              </span>
              <span className="text-lg font-mono font-extrabold text-amber-400 tracking-wider">
                {teacherCode}
              </span>
            </div>
            <button
              onClick={handleCopyCode}
              className="p-2.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/20 transition flex items-center gap-1.5 text-xs font-semibold"
              title="Copiar código para passar aos alunos"
            >
              {copiedCode ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              <span>{copiedCode ? 'Copiado!' : 'Copiar'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Barra de Ações & Busca */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-500" />
          <input
            type="text"
            placeholder="Buscar aluno por nome..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-900 border border-slate-800 rounded-2xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
          />
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="w-full sm:w-auto px-5 py-2.5 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-2 transition shadow-lg shadow-amber-500/10"
        >
          <UserPlus className="w-4 h-4" />
          Cadastrar Novo Aluno
        </button>
      </div>

      {/* Lista de Alunos */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <Users className="w-4 h-4 text-amber-400" />
            Seus Alunos Vinculados ({filteredStudents.length})
          </h2>
        </div>

        {loading ? (
          <div className="py-12 text-center text-slate-500 text-xs">Carregando alunos...</div>
        ) : filteredStudents.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-12 h-12 rounded-2xl bg-slate-800 text-slate-500 flex items-center justify-center mx-auto mb-3">
              <Users className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-semibold text-white">Nenhum aluno encontrado</h3>
            <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
              Compartilhe o código <strong className="text-amber-400">{teacherCode}</strong> com seus alunos ou clique no botão acima para cadastrar um aluno agora mesmo.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredStudents.map(student => (
              <div
                key={student.id}
                className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 hover:border-slate-700 transition flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <h3 className="font-bold text-sm text-white">{student.nome}</h3>
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 uppercase">
                      {student.anamnese?.objetivo || 'Hipertrofia'}
                    </span>
                    <span className="text-[10px] text-slate-400 bg-slate-800 px-2 py-0.5 rounded-full">
                      {student.anamnese?.diasSemana || 4}x/sem
                    </span>
                    {student.anamnese?.pesoKg && student.anamnese?.alturaCm && (
                      <span className="text-[10px] text-slate-300 bg-slate-800 px-2 py-0.5 rounded-full">
                        {student.anamnese.pesoKg} kg • {student.anamnese.alturaCm} cm
                        {student.anamnese.idade ? ` • ${student.anamnese.idade} anos` : ''}
                      </span>
                    )}
                  </div>

                  <p className="text-xs text-slate-400">{student.email}</p>

                  {student.anamnese?.limitacoes && student.anamnese.limitacoes.length > 0 && (
                    <div className="flex items-center gap-1.5 mt-2 text-rose-300 text-xs">
                      <ShieldAlert className="w-3.5 h-3.5" />
                      <span>Limitações: {student.anamnese.limitacoes.join(', ')}</span>
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2 self-end md:self-auto">
                  <button
                    onClick={() => handleOpenStudentHistory(student)}
                    className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-semibold flex items-center gap-1.5 transition"
                  >
                    <Activity className="w-3.5 h-3.5 text-emerald-400" />
                    Histórico
                  </button>

                  <button
                    onClick={() => onEditStudentWorkout(student)}
                    className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold flex items-center gap-1.5 transition shadow-sm"
                  >
                    <Sparkles className="w-3.5 h-3.5 fill-current" />
                    Prescrever / Editar Treino
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal Histórico do Aluno */}
      {selectedStudentLogs && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-xl w-full max-h-[85vh] overflow-y-auto shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
              <div>
                <h3 className="font-bold text-base text-white">
                  Histórico de {selectedStudentLogs.student.nome}
                </h3>
                <span className="text-xs text-slate-400">
                  {selectedStudentLogs.logs.length} treinos executados
                </span>
              </div>
              <button
                onClick={() => setSelectedStudentLogs(null)}
                className="text-slate-400 hover:text-white text-xs font-bold px-3 py-1.5 bg-slate-800 rounded-xl"
              >
                Fechar
              </button>
            </div>

            {selectedStudentLogs.logs.length === 0 ? (
              <div className="text-center py-8 text-xs text-slate-400">
                Este aluno ainda não registrou sessões de treino.
              </div>
            ) : (
              <div className="space-y-3">
                {selectedStudentLogs.logs.map(log => (
                  <div key={log.id} className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800">
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="font-bold text-white text-sm">{log.divisaoNome}</span>
                      <span className="text-slate-400">{new Date(log.dataInicio).toLocaleDateString('pt-BR')}</span>
                    </div>
                    <div className="text-xs text-slate-400 flex items-center gap-3">
                      <span>Duração: {log.duracaoMinutos} min</span>
                      <span>•</span>
                      <span className="text-emerald-400 font-medium">
                        {log.seriesConcluidas.filter(s => s.concluido).length} séries concluídas
                      </span>
                    </div>
                    {log.observacaoAluno && (
                      <div className="mt-2 p-2 rounded-lg bg-slate-900 text-xs text-amber-200 border border-amber-500/20">
                        "{log.observacaoAluno}"
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modal Cadastro Rápido de Aluno */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-md w-full shadow-2xl">
            <h3 className="font-bold text-base text-white mb-1">Cadastrar Aluno</h3>
            <p className="text-xs text-slate-400 mb-4">
              O aluno será imediatamente vinculado ao seu perfil de treinador.
            </p>

            <form onSubmit={handleCreateStudent} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">Nome Completo</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Mariana Costa"
                  value={newStudentName}
                  onChange={(e) => setNewStudentName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">E-mail do Aluno</label>
                <input
                  type="email"
                  required
                  placeholder="cezar@email.com"
                  value={newStudentEmail}
                  onChange={(e) => setNewStudentEmail(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                />
                <p className="text-[10px] text-slate-400 mt-1">
                  Assim que o aluno criar a conta (ou entrar) com este e-mail, o treino prescrito por você já aparecerá pronto na tela dele!
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">Objetivo</label>
                  <select
                    value={newStudentGoal}
                    onChange={(e) => setNewStudentGoal(e.target.value as any)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                  >
                    <option value="hipertrofia">Hipertrofia</option>
                    <option value="emagrecimento">Emagrecimento</option>
                    <option value="forca">Ganho de Força</option>
                    <option value="condicionamento">Condicionamento</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">Dias/Semana</label>
                  <select
                    value={newStudentDays}
                    onChange={(e) => setNewStudentDays(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                  >
                    <option value={2}>2 dias</option>
                    <option value={3}>3 dias</option>
                    <option value={4}>4 dias</option>
                    <option value={5}>5 dias</option>
                    <option value={6}>6 dias</option>
                  </select>
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 py-2.5 rounded-xl bg-slate-800 text-slate-300 font-semibold text-xs"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs"
                >
                  Cadastrar & Elaborar Treino
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
