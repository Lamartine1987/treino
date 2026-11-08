import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { UserProfile, UserRole, Anamnesis } from '../types';
import { 
  initializeStorage, 
  getUserProfile, 
  getUserByEmail,
  saveUserProfile, 
  linkStudentToTeacher,
  reconcilePreRegisteredStudent
} from '../services/storageService';
import { isFirebaseConfigured, auth } from '../lib/firebase';
import { 
  onAuthStateChanged, 
  signOut, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  updateProfile,
  GoogleAuthProvider,
  signInWithPopup
} from 'firebase/auth';

interface ProfileUpdates {
  nome?: string;
  pesoKg?: number;
  alturaCm?: number;
  idade?: number;
  genero?: Anamnesis['genero'];
  codigoProfessorVinculo?: string;
}

interface AuthContextType {
  user: UserProfile | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (nome: string, email: string, password: string, role: UserRole, codigoProfessor?: string) => Promise<void>;
  loginWithGoogle: (role: UserRole, codigoProfessor?: string) => Promise<void>;
  updateAnamnese: (anamnese: Anamnesis) => Promise<void>;
  updateUserProfileInfo: (updates: ProfileUpdates) => Promise<{ teacherName?: string }>;
  logout: () => Promise<void>;
  switchDemoUser: (userId: string) => Promise<void>;
  isFirebaseActive: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function translateFirebaseError(err: any): string {
  const code = err?.code || '';
  switch (code) {
    case 'auth/invalid-credential':
    case 'auth/user-not-found':
    case 'auth/wrong-password':
      return 'E-mail ou senha incorretos. Verifique seus dados ou cadastre uma nova conta.';
    case 'auth/email-already-in-use':
      return 'Este e-mail já está cadastrado. Tente entrar na aba "Entrar".';
    case 'auth/weak-password':
      return 'A senha deve ter pelo menos 6 caracteres.';
    case 'auth/invalid-email':
      return 'O formato do e-mail informado é inválido.';
    case 'auth/popup-closed-by-user':
      return 'A janela de login com o Google foi fechada antes de concluir.';
    case 'auth/operation-not-allowed':
      return 'Este método de login ainda não está habilitado no Firebase Authentication.';
    default:
      return err?.message || 'Erro ao autenticar. Tente novamente.';
  }
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  // Evita que o listener onAuthStateChanged sobrescreva os dados enquanto o cadastro ou Google login salva o perfil
  const isRegisteringRef = useRef(false);

  useEffect(() => {
    initializeStorage();

    if (isFirebaseConfigured && auth) {
      const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
        if (isRegisteringRef.current) {
          return;
        }

        if (firebaseUser) {
          let profile = await getUserProfile(firebaseUser.uid);

          // Se houver um pré-cadastro feito pelo professor com o mesmo e-mail, unifica e transfere os treinos!
          if (firebaseUser.email) {
            const reconciled = await reconcilePreRegisteredStudent(firebaseUser.uid, firebaseUser.email);
            if (reconciled) {
              profile = reconciled;
            }
          }

          if (!profile && firebaseUser.email) {
            profile = await getUserByEmail(firebaseUser.email);
          }

          if (profile) {
            setUser(profile);
          } else {
            const newProfile: UserProfile = {
              id: firebaseUser.uid,
              nome: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'Aluno',
              email: firebaseUser.email || '',
              role: 'aluno',
              fotoUrl: firebaseUser.photoURL || undefined
            };
            await saveUserProfile(newProfile);
            setUser(newProfile);
          }
        } else {
          // Verifica se o usuário selecionou um perfil de demonstração rápida
          const demoId = localStorage.getItem('treinopro_demo_user');
          if (demoId) {
            const demoProfile = await getUserProfile(demoId);
            setUser(demoProfile);
          } else {
            setUser(null);
          }
        }
        setLoading(false);
      });
      return () => unsubscribe();
    } else {
      const savedSessionUserId = localStorage.getItem('treinopro_active_user');
      if (savedSessionUserId) {
        getUserProfile(savedSessionUserId).then(profile => {
          setUser(profile);
          setLoading(false);
        });
      } else {
        setLoading(false);
      }
    }
  }, []);

  const login = async (email: string, password: string): Promise<void> => {
    const cleanEmail = email.toLowerCase().trim();
    localStorage.removeItem('treinopro_demo_user');

    if (isFirebaseConfigured && auth) {
      const cred = await signInWithEmailAndPassword(auth, cleanEmail, password);
      let profile = await getUserProfile(cred.user.uid);
      const reconciled = await reconcilePreRegisteredStudent(cred.user.uid, cleanEmail);
      if (reconciled) {
        profile = reconciled;
      }
      if (!profile) {
        profile = await getUserByEmail(cleanEmail);
      }
      if (!profile) {
        profile = {
          id: cred.user.uid,
          nome: cred.user.displayName || cleanEmail.split('@')[0],
          email: cleanEmail,
          role: 'aluno'
        };
        await saveUserProfile(profile);
      }
      localStorage.setItem('treinopro_active_user', profile.id);
      setUser(profile);
      return;
    }

    // Fallback Modo Local
    let found = await getUserByEmail(cleanEmail);
    if (!found) {
      throw new Error('Usuário não encontrado. Cadastre sua conta primeiro.');
    }
    localStorage.setItem('treinopro_active_user', found.id);
    setUser(found);
  };

  const register = async (
    nome: string, 
    email: string, 
    password: string, 
    role: UserRole, 
    codigoProfessor?: string
  ): Promise<void> => {
    const cleanEmail = email.toLowerCase().trim();
    const cleanNome = nome.trim();
    localStorage.removeItem('treinopro_demo_user');

    let uid = 'user_' + Date.now();

    if (isFirebaseConfigured && auth) {
      isRegisteringRef.current = true;
      try {
        const cred = await createUserWithEmailAndPassword(auth, cleanEmail, password);
        uid = cred.user.uid;
        await updateProfile(cred.user, { displayName: cleanNome });
      } finally {
        // Mantemos true até salvar no Firestore logo abaixo
      }
    }

    try {
      const generatedCode = role === 'professor'
        ? (cleanNome.replace(/[^a-zA-Z]/g, '').slice(0, 4).toUpperCase() || 'PROF') + '10'
        : undefined;

      const newUser: UserProfile = {
        id: uid,
        nome: cleanNome,
        email: cleanEmail,
        role,
        ...(generatedCode ? { codigoProfessor: generatedCode } : {})
      };

      await saveUserProfile(newUser);

      // Se o professor já havia pré-cadastrado este e-mail e criado um treino, unifica tudo automaticamente!
      if (role === 'aluno') {
        const reconciled = await reconcilePreRegisteredStudent(newUser.id, cleanEmail);
        if (reconciled) {
          Object.assign(newUser, reconciled);
        }
      }

      if (role === 'aluno' && codigoProfessor?.trim()) {
        const linkResult = await linkStudentToTeacher(newUser.id, codigoProfessor.trim());
        if (linkResult.success && linkResult.teacherId) {
          newUser.professorId = linkResult.teacherId;
          await saveUserProfile(newUser);
        }
      }

      localStorage.setItem('treinopro_active_user', newUser.id);
      setUser(newUser);
    } finally {
      isRegisteringRef.current = false;
    }
  };

  const loginWithGoogle = async (role: UserRole, codigoProfessor?: string): Promise<void> => {
    localStorage.removeItem('treinopro_demo_user');

    if (!isFirebaseConfigured || !auth) {
      throw new Error('O Firebase não está configurado para login com Google.');
    }

    isRegisteringRef.current = true;
    try {
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: 'select_account' });
      const cred = await signInWithPopup(auth, provider);
      const fbUser = cred.user;

      let profile = await getUserProfile(fbUser.uid);

      if (!profile) {
        const cleanNome = fbUser.displayName || fbUser.email?.split('@')[0] || 'Usuário';
        const generatedCode = role === 'professor'
          ? (cleanNome.replace(/[^a-zA-Z]/g, '').slice(0, 4).toUpperCase() || 'PROF') + '10'
          : undefined;

        profile = {
          id: fbUser.uid,
          nome: cleanNome,
          email: fbUser.email || '',
          role,
          ...(fbUser.photoURL ? { fotoUrl: fbUser.photoURL } : {}),
          ...(generatedCode ? { codigoProfessor: generatedCode } : {})
        };

        await saveUserProfile(profile);

        if (role === 'aluno' && codigoProfessor?.trim()) {
          const linkResult = await linkStudentToTeacher(profile.id, codigoProfessor.trim());
          if (linkResult.success && linkResult.teacherId) {
            profile.professorId = linkResult.teacherId;
            await saveUserProfile(profile);
          }
        }
      }

      if (fbUser.email) {
        const reconciled = await reconcilePreRegisteredStudent(fbUser.uid, fbUser.email);
        if (reconciled) {
          profile = reconciled;
        }
      }

      localStorage.setItem('treinopro_active_user', profile.id);
      setUser(profile);
    } finally {
      isRegisteringRef.current = false;
    }
  };

  const updateAnamnese = async (anamnese: Anamnesis): Promise<void> => {
    if (!user) return;
    const updated: UserProfile = { ...user, anamnese };
    await saveUserProfile(updated);
    setUser(updated);
  };

  const updateUserProfileInfo = async (updates: ProfileUpdates): Promise<{ teacherName?: string }> => {
    if (!user) return {};

    const cleanNome = updates.nome?.trim() || user.nome;

    if (isFirebaseConfigured && auth?.currentUser && cleanNome !== user.nome) {
      try {
        await updateProfile(auth.currentUser, { displayName: cleanNome });
      } catch (e) {
        console.warn('Erro ao atualizar displayName no Firebase Auth:', e);
      }
    }

    const baseAnamnese: Anamnesis = user.anamnese || {
      objetivo: 'hipertrofia',
      experiencia: 'intermediario',
      diasSemana: 4,
      tempoMinutos: 60,
      limitacoes: [],
      tipoAmbiente: 'academia_completa'
    };

    const updatedAnamnese: Anamnesis = {
      ...baseAnamnese,
      ...(updates.pesoKg !== undefined ? { pesoKg: updates.pesoKg } : {}),
      ...(updates.alturaCm !== undefined ? { alturaCm: updates.alturaCm } : {}),
      ...(updates.idade !== undefined ? { idade: updates.idade } : {}),
      ...(updates.genero !== undefined ? { genero: updates.genero } : {})
    };

    const updatedUser: UserProfile = {
      ...user,
      nome: cleanNome,
      anamnese: updatedAnamnese
    };

    let teacherName: string | undefined;
    if (user.role === 'aluno' && updates.codigoProfessorVinculo?.trim()) {
      const linkRes = await linkStudentToTeacher(user.id, updates.codigoProfessorVinculo.trim());
      if (linkRes.success && linkRes.teacherId) {
        updatedUser.professorId = linkRes.teacherId;
        teacherName = linkRes.teacherName;
      }
    }

    await saveUserProfile(updatedUser);
    setUser(updatedUser);
    return { teacherName };
  };

  const logout = async () => {
    localStorage.removeItem('treinopro_active_user');
    localStorage.removeItem('treinopro_demo_user');
    if (isFirebaseConfigured && auth) {
      await signOut(auth);
    }
    setUser(null);
  };

  const switchDemoUser = async (userId: string) => {
    const profile = await getUserProfile(userId);
    if (profile) {
      await saveUserProfile(profile); // Garante que o usuário demo também exista no Firestore
      localStorage.setItem('treinopro_demo_user', profile.id);
      localStorage.setItem('treinopro_active_user', profile.id);
      setUser(profile);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        register,
        loginWithGoogle,
        updateAnamnese,
        updateUserProfileInfo,
        logout,
        switchDemoUser,
        isFirebaseActive: isFirebaseConfigured
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth deve ser usado dentro de um AuthProvider');
  return context;
};
