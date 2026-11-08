import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Navbar } from './components/Navbar';
import { AuthView } from './views/AuthView';
import { StudentDashboardView } from './views/StudentDashboardView';
import { StudentAnamnesisView } from './views/StudentAnamnesisView';
import { StudentWorkoutView } from './views/StudentWorkoutView';
import { TeacherDashboardView } from './views/TeacherDashboardView';
import { TeacherWorkoutEditorView } from './views/TeacherWorkoutEditorView';
import { WorkoutDivision, WorkoutPlan, UserProfile } from './types';

function MainApp() {
  const { user, loading } = useAuth();
  const [currentView, setCurrentView] = useState<'dashboard' | 'anamnesis' | 'active_workout' | 'teacher_editor' | 'login'>('dashboard');

  // Estados transitórios para fluxos ativos
  const [activeWorkoutData, setActiveWorkoutData] = useState<{ division: WorkoutDivision; plan: WorkoutPlan } | null>(null);
  const [editingStudent, setEditingStudent] = useState<UserProfile | null>(null);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // Se não estiver logado, exibe tela de login / cadastro / demo
  if (!user || currentView === 'login') {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-center">
        <AuthView onSuccess={() => setCurrentView('dashboard')} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-emerald-500 selection:text-white">
      <Navbar
        currentView={currentView}
        onNavigate={(view) => setCurrentView(view as any)}
      />

      <main className="flex-1">
        {/* FLUXO DO PROFESSOR */}
        {user.role === 'professor' ? (
          currentView === 'teacher_editor' && editingStudent ? (
            <TeacherWorkoutEditorView
              student={editingStudent}
              onBack={() => {
                setEditingStudent(null);
                setCurrentView('dashboard');
              }}
              onSaved={() => {
                setEditingStudent(null);
                setCurrentView('dashboard');
              }}
            />
          ) : (
            <TeacherDashboardView
              onEditStudentWorkout={(student) => {
                setEditingStudent(student);
                setCurrentView('teacher_editor');
              }}
            />
          )
        ) : (
          /* FLUXO DO ALUNO */
          currentView === 'active_workout' && activeWorkoutData ? (
            <StudentWorkoutView
              division={activeWorkoutData.division}
              plan={activeWorkoutData.plan}
              onBack={() => {
                setActiveWorkoutData(null);
                setCurrentView('dashboard');
              }}
              onFinishWorkout={() => {
                setActiveWorkoutData(null);
                setCurrentView('dashboard');
              }}
            />
          ) : currentView === 'anamnesis' ? (
            <StudentAnamnesisView
              onWorkoutGenerated={() => {
                setCurrentView('dashboard');
              }}
            />
          ) : (
            <StudentDashboardView
              onStartWorkout={(division, plan) => {
                setActiveWorkoutData({ division, plan });
                setCurrentView('active_workout');
              }}
              onOpenAnamnesis={() => setCurrentView('anamnesis')}
            />
          )
        )}
      </main>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
}
