import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { doc, setDoc, deleteDoc, serverTimestamp, getDocs, collection, writeBatch } from 'firebase/firestore';
import { auth, db } from './lib/firebase';

export type CategoriaGasto = 'Combustível / Recarga' | 'Locadora / Financiamento' | 'Manutenção' | 'Alimentação' | 'Outros';

export type Plataforma = 'Uber' | '99' | 'inDrive' | 'Particular';

export interface Ganho {
  id: string;
  amount: number;
  grossAmount?: number;
  plataforma?: Plataforma;
  kmRodados?: number;
  date: string; // ISO string
  hour: number;
}

export interface Gasto {
  id: string;
  amount: number;
  category: CategoriaGasto;
  date: string;
}

export interface Envelope {
  id: number;
  name: string;
  percentage: number; // 0 to 100
  color: string;
  iconBg: string;
  iconColor: string;
  locked?: boolean;
}

interface AppState {
  ganhos: Ganho[];
  gastos: Gasto[];
  envelopes: Envelope[];
  metaDiaria: number;
  isAuthenticated: boolean;
  authError: string;
  setAuthError: (error: string) => void;
  setGanhos: (ganhos: Ganho[]) => void;
  setGastos: (gastos: Gasto[]) => void;
  setEnvelopes: (envelopes: Envelope[]) => void;
  addGanho: (ganho: Omit<Ganho, 'id'>) => void;
  addGasto: (gasto: Omit<Gasto, 'id'>) => void;
  deleteGanho: (id: string) => void;
  deleteGasto: (id: string) => void;
  updateEnvelopePercentage: (id: number, percentage: number) => void;
  setMetaDiaria: (meta: number) => void;
  login: () => void;
  logout: () => void;
  resetData: () => void;
  clearLocalData: () => void;
}

const defaultEnvelopes: Envelope[] = [
  { id: 1, name: 'Combustível / Recarga', percentage: 25, color: 'bg-orange-500', iconBg: 'bg-orange-100', iconColor: 'text-orange-600' },
  { id: 2, name: 'Locadora / Financiamento', percentage: 30, color: 'bg-blue-500', iconBg: 'bg-blue-100', iconColor: 'text-blue-600' },
  { id: 3, name: 'Lucro Pessoal', percentage: 25, color: 'bg-emerald-500', iconBg: 'bg-emerald-100', iconColor: 'text-emerald-600', locked: true },
  { id: 4, name: 'IRPF', percentage: 7, color: 'bg-amber-500', iconBg: 'bg-amber-100', iconColor: 'text-amber-600' },
  { id: 5, name: 'Manutenção', percentage: 8, color: 'bg-indigo-500', iconBg: 'bg-indigo-100', iconColor: 'text-indigo-600' },
  { id: 6, name: 'Alimentação', percentage: 5, color: 'bg-rose-500', iconBg: 'bg-rose-100', iconColor: 'text-rose-600' },
];

export const useStore = create<AppState>()(
  persist(
    (set, get) => ({
      ganhos: [],
      gastos: [],
      envelopes: defaultEnvelopes,
      metaDiaria: 350,
      isAuthenticated: false,
      authError: '',
      setAuthError: (error) => set({ authError: error }),
      
      setGanhos: (ganhos) => set({ ganhos }),
      setGastos: (gastos) => set({ gastos }),
      setEnvelopes: (envelopes) => set({ envelopes }),
      
      addGanho: (ganho) => {
        const user = auth.currentUser;
        const newId = Math.random().toString(36).substring(7);
        const fullGanho = { ...ganho, id: newId };
        
        set((state) => ({
          ganhos: [fullGanho, ...state.ganhos]
        }));

        if (user) {
          const docRef = doc(db, 'users', user.uid, 'ganhos', newId);
          setDoc(docRef, {
            amount: ganho.amount,
            grossAmount: ganho.grossAmount ?? ganho.amount,
            plataforma: ganho.plataforma || 'Uber',
            kmRodados: ganho.kmRodados ?? null,
            date: ganho.date,
            hour: ganho.hour,
            createdAt: serverTimestamp()
          }).catch(err => console.error("Erro ao salvar ganho no Firestore:", err));
        }
      },

      addGasto: (gasto) => {
        const user = auth.currentUser;
        const newId = Math.random().toString(36).substring(7);
        const fullGasto = { ...gasto, id: newId };

        set((state) => ({
          gastos: [fullGasto, ...state.gastos]
        }));

        if (user) {
          const docRef = doc(db, 'users', user.uid, 'gastos', newId);
          setDoc(docRef, {
            amount: gasto.amount,
            category: gasto.category,
            date: gasto.date,
            createdAt: serverTimestamp()
          }).catch(err => console.error("Erro ao salvar gasto no Firestore:", err));
        }
      },

      updateEnvelopePercentage: (id, percentage) => set((state) => {
        const currentEnvelopes = [...state.envelopes];
        const targetEnvIndex = currentEnvelopes.findIndex(e => e.id === id);
        if (targetEnvIndex === -1) return state;

        const oldPercentage = currentEnvelopes[targetEnvIndex].percentage;

        const adjustableEnvelopes = currentEnvelopes.filter(e => e.id !== id && !e.locked);
        const totalAdjustablePercentage = adjustableEnvelopes.reduce((sum, e) => sum + e.percentage, 0);

        // Limit new percentage to what's available
        const maxPercent = oldPercentage + totalAdjustablePercentage;
        let actualNewPercentage = percentage;
        if (actualNewPercentage > maxPercent) {
          actualNewPercentage = maxPercent;
        }

        const diff = actualNewPercentage - oldPercentage;
        if (diff === 0) return state;

        let remainingDiff = -diff;
        const updatedEnvelopes = currentEnvelopes.map(e => {
          if (e.id === id) return { ...e, percentage: actualNewPercentage };
          return { ...e };
        });

        let diffs = adjustableEnvelopes.map(e => {
          const proportion = totalAdjustablePercentage > 0 ? (e.percentage / totalAdjustablePercentage) : (1 / adjustableEnvelopes.length);
          return { id: e.id, change: remainingDiff * proportion };
        });

        let currentDiffAcc = 0;
        
        for (let d of diffs) {
          const targetEnv = updatedEnvelopes.find(e => e.id === d.id)!;
          const intChange = Math.round(d.change);
          targetEnv.percentage += intChange;
          currentDiffAcc += intChange;
        }

        let err = Math.round(remainingDiff) - currentDiffAcc;
        
        for (let i = 0; err !== 0 && i < diffs.length; i++) {
          const targetEnv = updatedEnvelopes.find(e => e.id === diffs[i].id)!;
          if (err > 0) {
            targetEnv.percentage += 1;
            err -= 1;
          } else if (err < 0) {
            if (targetEnv.percentage > 0) {
              targetEnv.percentage -= 1;
              err += 1;
            }
          }
        }

        let extra = 0;
        updatedEnvelopes.forEach(e => {
          if (e.id !== id && !e.locked && e.percentage < 0) {
            extra += (0 - e.percentage);
            e.percentage = 0;
          }
        });

        if (extra > 0) {
            for (let e of updatedEnvelopes) {
              if (e.id !== id && !e.locked && e.percentage > 0) {
                  const take = Math.min(e.percentage, extra);
                  e.percentage -= take;
                  extra -= take;
                  if (extra === 0) break;
              }
            }
        }

        const user = auth.currentUser;
        if (user) {
          updatedEnvelopes.forEach(env => {
            const docRef = doc(db, 'users', user.uid, 'envelopes', env.id.toString());
            setDoc(docRef, {
              percentage: env.percentage,
              updatedAt: serverTimestamp()
            }, { merge: true }).catch(err => console.error("Erro ao salvar envelope no Firestore:", err));
          });
        }

        return { envelopes: updatedEnvelopes };
      }),

      setMetaDiaria: (meta) => {
        const currentMeta = get().metaDiaria;
        if (meta === currentMeta) return;

        set({ metaDiaria: meta });

        const user = auth.currentUser;
        if (user) {
          const userRef = doc(db, 'users', user.uid);
          setDoc(userRef, {
            metaDiaria: meta,
            updatedAt: serverTimestamp()
          }, { merge: true }).catch(err => {
            console.error("Erro ao salvar meta diária no Firestore:", err);
          });
        }
      },

      deleteGanho: (id) => {
        const user = auth.currentUser;
        set((state) => ({
          ganhos: state.ganhos.filter(g => g.id !== id)
        }));

        if (user) {
          const docRef = doc(db, 'users', user.uid, 'ganhos', id);
          deleteDoc(docRef).catch(err => console.error("Erro ao deletar ganho no Firestore:", err));
        }
      },

      deleteGasto: (id) => {
        const user = auth.currentUser;
        set((state) => ({
          gastos: state.gastos.filter(g => g.id !== id)
        }));

        if (user) {
          const docRef = doc(db, 'users', user.uid, 'gastos', id);
          deleteDoc(docRef).catch(err => console.error("Erro ao deletar gasto no Firestore:", err));
        }
      },

      login: () => set({ isAuthenticated: true }),
      logout: () => set({ isAuthenticated: false }),

      resetData: async () => {
        const user = auth.currentUser;
        set({ ganhos: [], gastos: [], envelopes: defaultEnvelopes, metaDiaria: 350 });
        
        if (user) {
          try {
            const userRef = doc(db, 'users', user.uid);
            await setDoc(userRef, { metaDiaria: 350, updatedAt: serverTimestamp() }, { merge: true });

            for (const env of defaultEnvelopes) {
              const docRef = doc(db, 'users', user.uid, 'envelopes', env.id.toString());
              await setDoc(docRef, {
                name: env.name,
                percentage: env.percentage,
                color: env.color,
                iconBg: env.iconBg,
                iconColor: env.iconColor,
                locked: env.locked || false,
                updatedAt: serverTimestamp()
              });
            }

            const querySnapshotGanhos = await getDocs(collection(db, 'users', user.uid, 'ganhos'));
            if (!querySnapshotGanhos.empty) {
              const batch = writeBatch(db);
              querySnapshotGanhos.forEach((docSnap) => {
                batch.delete(docSnap.ref);
              });
              await batch.commit();
            }

            const querySnapshotGastos = await getDocs(collection(db, 'users', user.uid, 'gastos'));
            if (!querySnapshotGastos.empty) {
              const batch = writeBatch(db);
              querySnapshotGastos.forEach((docSnap) => {
                batch.delete(docSnap.ref);
              });
              await batch.commit();
            }
          } catch (err) {
            console.error("Erro ao limpar dados no Firestore:", err);
          }
        }
      },

      clearLocalData: () => {
        set({ ganhos: [], gastos: [], envelopes: defaultEnvelopes, metaDiaria: 350 });
      }
    }),
    {
      name: 'probolso-storage',
    }
  )
);
