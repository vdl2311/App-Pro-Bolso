import { create } from 'zustand';

export type CategoriaGasto = 'Combustível' | 'Locadora' | 'Manutenção' | 'Alimentação' | 'Outros';

export interface Ganho {
  id: string;
  amount: number;
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
  addGanho: (ganho: Omit<Ganho, 'id'>) => void;
  addGasto: (gasto: Omit<Gasto, 'id'>) => void;
  updateEnvelopePercentage: (id: number, percentage: number) => void;
  setMetaDiaria: (meta: number) => void;
  login: () => void;
  logout: () => void;
  resetData: () => void;
}

const defaultEnvelopes: Envelope[] = [
  { id: 1, name: 'Combustível', percentage: 25, color: 'bg-orange-500', iconBg: 'bg-orange-100', iconColor: 'text-orange-600' },
  { id: 2, name: 'Locadora', percentage: 30, color: 'bg-blue-500', iconBg: 'bg-blue-100', iconColor: 'text-blue-600' },
  { id: 3, name: 'Lucro Pessoal', percentage: 25, color: 'bg-emerald-500', iconBg: 'bg-emerald-100', iconColor: 'text-emerald-600', locked: true },
  { id: 4, name: 'IRPF', percentage: 7, color: 'bg-amber-500', iconBg: 'bg-amber-100', iconColor: 'text-amber-600' },
  { id: 5, name: 'Manutenção', percentage: 8, color: 'bg-indigo-500', iconBg: 'bg-indigo-100', iconColor: 'text-indigo-600' },
  { id: 6, name: 'Alimentação', percentage: 5, color: 'bg-rose-500', iconBg: 'bg-rose-100', iconColor: 'text-rose-600' },
];

export const useStore = create<AppState>((set) => ({
  ganhos: [],
  gastos: [],
  envelopes: defaultEnvelopes,
  metaDiaria: 350,
  isAuthenticated: false,
  
  addGanho: (ganho) => set((state) => ({
    ganhos: [{ ...ganho, id: Math.random().toString(36).substring(7) }, ...state.ganhos]
  })),

  addGasto: (gasto) => set((state) => ({
    gastos: [{ ...gasto, id: Math.random().toString(36).substring(7) }, ...state.gastos]
  })),

  updateEnvelopePercentage: (id, percentage) => set((state) => ({
    envelopes: state.envelopes.map((env) => env.id === id ? { ...env, percentage } : env)
  })),

  setMetaDiaria: (meta) => set({ metaDiaria: meta }),

  login: () => set({ isAuthenticated: true }),
  logout: () => set({ isAuthenticated: false }),

  resetData: () => set({ ganhos: [], gastos: [], envelopes: defaultEnvelopes, metaDiaria: 350 })
}));
