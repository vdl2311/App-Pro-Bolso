import { create } from 'zustand';
import { persist } from 'zustand/middleware';

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
  addGanho: (ganho: Omit<Ganho, 'id'>) => void;
  addGasto: (gasto: Omit<Gasto, 'id'>) => void;
  updateEnvelopePercentage: (id: number, percentage: number) => void;
  setMetaDiaria: (meta: number) => void;
  login: () => void;
  logout: () => void;
  resetData: () => void;
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
    (set) => ({
      ganhos: [],
      gastos: [],
      envelopes: defaultEnvelopes,
      metaDiaria: 350,
      isAuthenticated: false,
      authError: '',
      setAuthError: (error) => set({ authError: error }),
      
      addGanho: (ganho) => set((state) => ({
        ganhos: [{ ...ganho, id: Math.random().toString(36).substring(7) }, ...state.ganhos]
      })),

      addGasto: (gasto) => set((state) => ({
        gastos: [{ ...gasto, id: Math.random().toString(36).substring(7) }, ...state.gastos]
      })),

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

        return { envelopes: updatedEnvelopes };
      }),

      setMetaDiaria: (meta) => set({ metaDiaria: meta }),

      login: () => set({ isAuthenticated: true }),
      logout: () => set({ isAuthenticated: false }),

      resetData: () => set({ ganhos: [], gastos: [], envelopes: defaultEnvelopes, metaDiaria: 350 })
    }),
    {
      name: 'probolso-storage',
    }
  )
);
