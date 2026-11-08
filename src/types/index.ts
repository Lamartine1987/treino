export type UserRole = 'aluno' | 'professor';

export type ExerciseDifficulty = 'muito_facil' | 'ideal' | 'muito_pesado';

export interface Anamnesis {
  objetivo: 'hipertrofia' | 'emagrecimento' | 'forca' | 'condicionamento';
  experiencia: 'iniciante' | 'intermediario' | 'avancado';
  diasSemana: number; // 2 a 6
  tempoMinutos: number; // 30, 45, 60, 90
  limitacoes: string[]; // ex: ['joelho', 'lombar', 'ombro']
  tipoAmbiente: 'academia_completa' | 'academia_basica' | 'halteres_apenas';
  observacoes?: string;
  genero?: 'masculino' | 'feminino' | 'outro';
  idade?: number;
  pesoKg?: number;
  alturaCm?: number;
}

export interface Exercise {
  id: string;
  nome: string;
  grupoMuscular: string; // 'Peitoral', 'Dorsal', 'Quadríceps', etc.
  equipamento?: string; // 'Barra', 'Halteres', 'Máquina', 'Cabo'
  series: number;
  repeticoes: string; // '8-12', '12-15', 'Até a falha'
  descansoSegundos: number; // 60, 90, 120
  cargaSugeridaKg?: number;
  cargaAnteriorKg?: number; // Para exibir a evolução automática de carga entre ciclos
  progressaoAplicada?: 'subiu' | 'manteve' | 'reduziu';
  ultimoFeedback?: ExerciseDifficulty;
  instrucoes?: string;
  exercicioSubstituto?: string; // Alternativa caso aparelho esteja ocupado
  gifUrl?: string; // URL opcional para GIF ou animação do exercício
}

export interface WorkoutDivision {
  id: string;
  letra: string; // 'A', 'B', 'C', 'D'
  nome: string; // 'Treino A - Peito, Tríceps e Ombro'
  focoMuscular: string[];
  exercicios: Exercise[];
}

export interface WorkoutPlan {
  id: string;
  alunoId: string;
  professorId?: string;
  titulo: string;
  criadoPor: 'ia' | 'professor';
  dataCriacao: string;
  ativo: boolean;
  fase?: number; // Fase da periodização (Fase 1, Fase 2, Fase 3...)
  metaCiclos?: number; // Quantidade sugerida de voltas completas (ex: 6 ciclos A-B-C) antes de trocar os exercícios
  ultimaProgressaoData?: string;
  divisoes: WorkoutDivision[];
  orientacoesGerais?: string;
}

export interface CompletedSet {
  exerciseId: string;
  setIndex: number; // 1, 2, 3...
  pesoKg: number;
  repeticoesFeitas: number;
  concluido: boolean;
}

export interface WorkoutLog {
  id: string;
  alunoId: string;
  treinoId: string;
  divisaoId: string;
  divisaoNome: string;
  dataInicio: string;
  dataFim?: string;
  duracaoMinutos?: number;
  feedback?: ExerciseDifficulty;
  feedbackPorExercicio?: Record<
    string,
    {
      nome: string;
      dificuldade: ExerciseDifficulty;
      cargaAnteriorKg: number;
      novaCargaKg: number;
    }
  >;
  observacaoAluno?: string;
  seriesConcluidas: CompletedSet[];
}

export interface UserProfile {
  id: string;
  nome: string;
  email: string;
  role: UserRole;
  professorId?: string; // se for aluno de um professor
  codigoProfessor?: string; // código único para o professor passar aos alunos
  anamnese?: Anamnesis;
  fotoUrl?: string;
}
