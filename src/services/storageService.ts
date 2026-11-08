import { isFirebaseConfigured, db } from '../lib/firebase';
import { UserProfile, WorkoutPlan, WorkoutLog } from '../types';
import { 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  getDocs, 
  deleteDoc,
  query, 
  where, 
  limit 
} from 'firebase/firestore';

const STORAGE_KEYS = {
  USERS: 'treinopro_users',
  WORKOUTS: 'treinopro_workouts',
  LOGS: 'treinopro_logs',
  SESSION: 'treinopro_session'
};

// Dados de demonstração para testes rápidos
const INITIAL_DEMO_USERS: UserProfile[] = [
  {
    id: 'prof_rodrigo',
    nome: 'Prof. Rodrigo Silva (CREF 012345-G/SP)',
    email: 'professor@treinopro.com',
    role: 'professor',
    codigoProfessor: 'RODRIGO10'
  },
  {
    id: 'aluno_lucas',
    nome: 'Lucas Santos',
    email: 'lucas@gmail.com',
    role: 'aluno',
    professorId: 'prof_rodrigo',
    anamnese: {
      objetivo: 'hipertrofia',
      experiencia: 'intermediario',
      diasSemana: 4,
      tempoMinutos: 60,
      limitacoes: ['joelho'],
      tipoAmbiente: 'academia_completa',
      idade: 26,
      pesoKg: 78,
      alturaCm: 178
    }
  }
];

// Remove chaves com valor `undefined` que causam erro no Firestore setDoc()
function cleanUndefined<T>(obj: T): T {
  return JSON.parse(JSON.stringify(obj));
}

function getLocal<T>(key: string, defaultValue: T): T {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : defaultValue;
  } catch {
    return defaultValue;
  }
}

function setLocal<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (err) {
    console.error('Erro ao salvar no localStorage:', err);
  }
}

export function initializeStorage() {
  const users = getLocal<UserProfile[]>(STORAGE_KEYS.USERS, []);
  if (users.length === 0) {
    setLocal(STORAGE_KEYS.USERS, INITIAL_DEMO_USERS);
  }
}

// ================= PERFIL DE USUÁRIO =================

export async function saveUserProfile(profile: UserProfile): Promise<void> {
  const sanitized = cleanUndefined(profile);

  // Salva no Firestore se configurado
  if (isFirebaseConfigured && db) {
    try {
      await setDoc(doc(db, 'users', sanitized.id), sanitized, { merge: true });
    } catch (e) {
      console.warn('Erro ao salvar no Firestore (verifique as regras de segurança):', e);
    }
  }

  // Mantém sempre atualizado no cache local para PWA offline
  const users = getLocal<UserProfile[]>(STORAGE_KEYS.USERS, INITIAL_DEMO_USERS);
  const index = users.findIndex(u => u.id === sanitized.id);
  if (index >= 0) {
    users[index] = { ...users[index], ...sanitized };
  } else {
    users.push(sanitized);
  }
  setLocal(STORAGE_KEYS.USERS, users);
}

export async function getUserProfile(userId: string): Promise<UserProfile | null> {
  if (isFirebaseConfigured && db) {
    try {
      const snap = await getDoc(doc(db, 'users', userId));
      if (snap.exists()) {
        return snap.data() as UserProfile;
      }
    } catch (e) {
      console.warn('Erro ao buscar do Firestore:', e);
    }
  }

  const users = getLocal<UserProfile[]>(STORAGE_KEYS.USERS, INITIAL_DEMO_USERS);
  return users.find(u => u.id === userId) || null;
}

export async function getUserByEmail(email: string): Promise<UserProfile | null> {
  const cleanEmail = email.toLowerCase().trim();
  if (isFirebaseConfigured && db) {
    try {
      const q = query(collection(db, 'users'), where('email', '==', cleanEmail), limit(1));
      const snap = await getDocs(q);
      if (!snap.empty) {
        return snap.docs[0].data() as UserProfile;
      }
    } catch (e) {
      console.warn('Erro ao buscar usuário por e-mail no Firestore:', e);
    }
  }

  const users = getLocal<UserProfile[]>(STORAGE_KEYS.USERS, INITIAL_DEMO_USERS);
  return users.find(u => u.email.toLowerCase().trim() === cleanEmail) || null;
}

/**
 * Unifica automaticamente um pré-cadastro feito pelo Professor (ex: id 'aluno_179409...')
 * com a conta real autenticada do aluno (Firebase UID) que possui o mesmo e-mail,
 * transferindo a ficha de treino prescrita pelo professor, o vínculo professorId e a anamnese!
 */
export async function reconcilePreRegisteredStudent(
  realUid: string,
  email: string
): Promise<UserProfile | null> {
  const cleanEmail = email.toLowerCase().trim();
  if (!cleanEmail) return null;

  let mergedProfile: UserProfile | null = null;
  const legacyIdsToMigrate: string[] = [];

  if (isFirebaseConfigured && db) {
    try {
      const q = query(collection(db, 'users'), where('email', '==', cleanEmail));
      const snap = await getDocs(q);

      let currentDoc = null as UserProfile | null;
      const legacyDocs: UserProfile[] = [];

      snap.docs.forEach((d) => {
        const data = d.data() as UserProfile;
        if (d.id === realUid || data.id === realUid) {
          currentDoc = { ...data, id: realUid };
        } else {
          legacyDocs.push({ ...data, id: d.id });
        }
      });

      if (legacyDocs.length > 0) {
        const baseLegacy = legacyDocs[0];
        mergedProfile = {
          id: realUid,
          nome: currentDoc?.nome || baseLegacy.nome,
          email: cleanEmail,
          role: currentDoc?.role || baseLegacy.role || 'aluno',
          professorId: currentDoc?.professorId || baseLegacy.professorId,
          anamnese: currentDoc?.anamnese || baseLegacy.anamnese,
          ...(currentDoc?.fotoUrl ? { fotoUrl: currentDoc.fotoUrl } : {})
        };

        await saveUserProfile(mergedProfile);

        for (const leg of legacyDocs) {
          legacyIdsToMigrate.push(leg.id);
          // Migra todos os treinos vinculados ao id provisório ('aluno_...') para o realUid
          const qTreinos = query(collection(db, 'treinos'), where('alunoId', '==', leg.id));
          const snapTreinos = await getDocs(qTreinos);
          for (const tDoc of snapTreinos.docs) {
            await setDoc(doc(db, 'treinos', tDoc.id), { alunoId: realUid }, { merge: true });
          }

          // Migra também histórico caso exista
          const qLogs = query(collection(db, 'historico_treinos'), where('alunoId', '==', leg.id));
          const snapLogs = await getDocs(qLogs);
          for (const lDoc of snapLogs.docs) {
            await setDoc(doc(db, 'historico_treinos', lDoc.id), { alunoId: realUid }, { merge: true });
          }

          // Remove o pré-cadastro duplicado antigo para não duplicar na lista do professor
          try {
            await deleteDoc(doc(db, 'users', leg.id));
          } catch (delErr) {
            console.warn('Aviso ao limpar pré-cadastro antigo:', delErr);
          }
        }
      }
    } catch (e) {
      console.warn('Erro ao reconciliar pré-cadastro no Firestore:', e);
    }
  }

  // Reconcilia também no cache local (localStorage)
  const localUsers = getLocal<UserProfile[]>(STORAGE_KEYS.USERS, INITIAL_DEMO_USERS);
  const localCurrent = localUsers.find((u) => u.id === realUid);
  const localLegacies = localUsers.filter(
    (u) => u.email.toLowerCase().trim() === cleanEmail && u.id !== realUid
  );

  if (localLegacies.length > 0) {
    const baseLeg = localLegacies[0];
    localLegacies.forEach((l) => {
      if (!legacyIdsToMigrate.includes(l.id)) legacyIdsToMigrate.push(l.id);
    });

    if (!mergedProfile) {
      mergedProfile = {
        id: realUid,
        nome: localCurrent?.nome || baseLeg.nome,
        email: cleanEmail,
        role: localCurrent?.role || baseLeg.role || 'aluno',
        professorId: localCurrent?.professorId || baseLeg.professorId,
        anamnese: localCurrent?.anamnese || baseLeg.anamnese
      };
    }

    const cleanedUsers = localUsers.filter(
      (u) => u.id === realUid || u.email.toLowerCase().trim() !== cleanEmail
    );
    const idx = cleanedUsers.findIndex((u) => u.id === realUid);
    if (idx >= 0) {
      cleanedUsers[idx] = mergedProfile;
    } else {
      cleanedUsers.push(mergedProfile);
    }
    setLocal(STORAGE_KEYS.USERS, cleanedUsers);
  }

  if (legacyIdsToMigrate.length > 0) {
    const localWorkouts = getLocal<WorkoutPlan[]>(STORAGE_KEYS.WORKOUTS, []);
    let changed = false;
    localWorkouts.forEach((w) => {
      if (legacyIdsToMigrate.includes(w.alunoId)) {
        w.alunoId = realUid;
        changed = true;
      }
    });
    if (changed) setLocal(STORAGE_KEYS.WORKOUTS, localWorkouts);
  }

  return mergedProfile;
}

export async function getStudentsByTeacher(teacherId: string): Promise<UserProfile[]> {
  if (isFirebaseConfigured && db) {
    try {
      const q = query(
        collection(db, 'users'),
        where('professorId', '==', teacherId),
        where('role', '==', 'aluno')
      );
      const snap = await getDocs(q);
      if (!snap.empty) {
        const list = snap.docs.map(d => d.data() as UserProfile);
        // Evita exibir duplicatas caso exista pré-cadastro e conta ativa com o mesmo e-mail
        const byEmail = new Map<string, UserProfile>();
        list.forEach((s) => {
          const key = s.email.toLowerCase().trim();
          const existing = byEmail.get(key);
          if (!existing || existing.id.startsWith('aluno_')) {
            byEmail.set(key, s);
          }
        });
        return Array.from(byEmail.values());
      }
    } catch (e) {
      console.warn('Erro Firestore getStudentsByTeacher:', e);
    }
  }

  const users = getLocal<UserProfile[]>(STORAGE_KEYS.USERS, INITIAL_DEMO_USERS);
  return users.filter(u => u.professorId === teacherId && u.role === 'aluno');
}

export async function linkStudentToTeacher(
  studentId: string, 
  teacherCode: string
): Promise<{ success: boolean; teacherName?: string; teacherId?: string }> {
  const cleanCode = teacherCode.trim().toUpperCase();

  // 1. Tenta buscar o professor no Firestore
  if (isFirebaseConfigured && db) {
    try {
      const q = query(
        collection(db, 'users'),
        where('role', '==', 'professor'),
        where('codigoProfessor', '==', cleanCode),
        limit(1)
      );
      const snap = await getDocs(q);
      if (!snap.empty) {
        const teacher = snap.docs[0].data() as UserProfile;
        await setDoc(doc(db, 'users', studentId), { professorId: teacher.id }, { merge: true });
        
        // Atualiza também cache local
        const users = getLocal<UserProfile[]>(STORAGE_KEYS.USERS, INITIAL_DEMO_USERS);
        const sIndex = users.findIndex(u => u.id === studentId);
        if (sIndex >= 0) {
          users[sIndex].professorId = teacher.id;
          setLocal(STORAGE_KEYS.USERS, users);
        }

        return { success: true, teacherName: teacher.nome, teacherId: teacher.id };
      }
    } catch (e) {
      console.warn('Erro Firestore linkStudentToTeacher:', e);
    }
  }

  // Fallback Local
  const users = getLocal<UserProfile[]>(STORAGE_KEYS.USERS, INITIAL_DEMO_USERS);
  const teacher = users.find(u => u.role === 'professor' && u.codigoProfessor?.toUpperCase() === cleanCode);
  
  if (!teacher) {
    return { success: false };
  }

  const student = users.find(u => u.id === studentId);
  if (student) {
    student.professorId = teacher.id;
    await saveUserProfile(student);
  }

  return { success: true, teacherName: teacher.nome, teacherId: teacher.id };
}

// ================= PLANOS DE TREINO =================

export async function saveWorkoutPlan(plan: WorkoutPlan): Promise<void> {
  const sanitized = cleanUndefined(plan);

  if (isFirebaseConfigured && db) {
    try {
      // Se for ativo, desativa os outros treinos do aluno no Firestore
      if (sanitized.ativo) {
        const q = query(
          collection(db, 'treinos'),
          where('alunoId', '==', sanitized.alunoId),
          where('ativo', '==', true)
        );
        const snap = await getDocs(q);
        for (const docSnap of snap.docs) {
          if (docSnap.id !== sanitized.id) {
            await setDoc(doc(db, 'treinos', docSnap.id), { ativo: false }, { merge: true });
          }
        }
      }
      await setDoc(doc(db, 'treinos', sanitized.id), sanitized);
    } catch (e) {
      console.warn('Erro ao salvar plano no Firestore:', e);
    }
  }

  // Salva no cache local
  const workouts = getLocal<WorkoutPlan[]>(STORAGE_KEYS.WORKOUTS, []);
  if (sanitized.ativo) {
    workouts.forEach(w => {
      if (w.alunoId === sanitized.alunoId) w.ativo = false;
    });
  }
  const index = workouts.findIndex(w => w.id === sanitized.id);
  if (index >= 0) {
    workouts[index] = sanitized;
  } else {
    workouts.unshift(sanitized);
  }
  setLocal(STORAGE_KEYS.WORKOUTS, workouts);
}

export async function getActiveWorkoutPlan(studentId: string): Promise<WorkoutPlan | null> {
  if (isFirebaseConfigured && db) {
    try {
      const q = query(
        collection(db, 'treinos'),
        where('alunoId', '==', studentId),
        where('ativo', '==', true),
        limit(1)
      );
      const snap = await getDocs(q);
      if (!snap.empty) {
        return snap.docs[0].data() as WorkoutPlan;
      }
    } catch (e) {
      console.warn('Erro Firestore getActiveWorkoutPlan:', e);
    }
  }

  const workouts = getLocal<WorkoutPlan[]>(STORAGE_KEYS.WORKOUTS, []);
  return workouts.find(w => w.alunoId === studentId && w.ativo) || null;
}

// ================= HISTÓRICO E EXECUÇÃO =================

export async function saveWorkoutLog(log: WorkoutLog): Promise<void> {
  const sanitized = cleanUndefined(log);

  if (isFirebaseConfigured && db) {
    try {
      await setDoc(doc(db, 'historico_treinos', sanitized.id), sanitized);
    } catch (e) {
      console.warn('Erro ao salvar log no Firestore:', e);
    }
  }

  const logs = getLocal<WorkoutLog[]>(STORAGE_KEYS.LOGS, []);
  logs.unshift(sanitized);
  setLocal(STORAGE_KEYS.LOGS, logs);
}

export async function getStudentWorkoutLogs(studentId: string): Promise<WorkoutLog[]> {
  if (isFirebaseConfigured && db) {
    try {
      const q = query(
        collection(db, 'historico_treinos'),
        where('alunoId', '==', studentId)
      );
      const snap = await getDocs(q);
      if (!snap.empty) {
        const items = snap.docs.map(d => d.data() as WorkoutLog);
        items.sort((a, b) => new Date(b.dataInicio).getTime() - new Date(a.dataInicio).getTime());
        return items;
      }
    } catch (e) {
      console.warn('Erro Firestore getStudentWorkoutLogs:', e);
    }
  }

  const logs = getLocal<WorkoutLog[]>(STORAGE_KEYS.LOGS, []);
  return logs.filter(l => l.alunoId === studentId);
}
