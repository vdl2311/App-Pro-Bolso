import { motion, AnimatePresence } from 'motion/react';
import { Wallet, Car, Wrench, ShieldAlert, Heart, Lock, Plus, Edit2, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useStore } from '@/store';
import React, { useState } from 'react';

const iconMap: Record<string, any> = {
  'Combustível / Recarga': Car,
  'Locadora / Financiamento': Wrench,
  'Lucro Pessoal': Wallet,
  'IRPF': ShieldAlert,
  'Manutenção': Wrench,
  'Alimentação': Heart,
  'Outros': Wallet
};

export function Envelopes() {
  const { envelopes, ganhos, updateEnvelopePercentage } = useStore();
  const totalGanhos = ganhos.reduce((acc, curr) => acc + curr.amount, 0);

  const [editingEnv, setEditingEnv] = useState<number | null>(null);
  const [editPercentage, setEditPercentage] = useState<string>('');

  const handleEdit = (id: number, currentPercentage: number) => {
    setEditingEnv(id);
    setEditPercentage(currentPercentage.toString());
  };

  const saveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingEnv && editPercentage) {
      updateEnvelopePercentage(editingEnv, parseInt(editPercentage, 10));
    }
    setEditingEnv(null);
  }

  // Calculate sum of percentages
  const sumPercentages = envelopes.reduce((acc, env) => acc + env.percentage, 0);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-32 mt-2"
    >
      <div className="flex justify-between items-center bg-white p-6 rounded-3xl border border-slate-200 shadow-sm md:col-span-2">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Meus Envelopes</h2>
          <p className="text-sm text-slate-500 mt-1">Sua divisão baseada em R$ {totalGanhos.toFixed(2).replace('.', ',')} ganhos</p>
        </div>
        <div className="text-right">
           <div className={cn("text-xs font-bold px-2 py-1 rounded-md", sumPercentages === 100 ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700")}>
             {sumPercentages}% Total
           </div>
        </div>
      </div>

      <div className="bg-emerald-50 border border-emerald-100 p-5 rounded-3xl flex items-start gap-4 shadow-sm md:col-span-2">
        <div className="p-2 bg-emerald-100 rounded-xl mt-0.5 shrink-0 text-emerald-600">
          <ShieldAlert className="w-6 h-6" />
        </div>
        <div>
          <h4 className="text-sm font-bold text-emerald-800">Lucro Pessoal Blindado</h4>
          <p className="text-xs text-emerald-700 mt-1.5 leading-relaxed font-medium">
            O dinheiro do seu lucro "Lucro Pessoal" está protegido. Ele nunca deve se misturar com os gastos de carro, combustível/recarga ou aluguel.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:col-span-2">
        {envelopes.map((env) => {
          const amount = (totalGanhos * env.percentage) / 100;
          const Icon = iconMap[env.name] || Wallet;
          return (
            <div key={env.id} className="bg-white border border-slate-200 rounded-2xl p-5 flex items-center justify-between shadow-sm hover:border-slate-300 transition-colors relative overflow-hidden">
              <div className={cn("absolute left-0 top-0 bottom-0 w-1", env.color)} />
              <div className="flex items-center gap-4 pl-2">
                <div className={cn("p-3 rounded-xl", env.iconBg, env.iconColor)}>
                  <Icon className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    {env.name}
                    {env.locked && <Lock className="w-3 h-3 text-emerald-500" />}
                  </h4>
                  <div className="text-xs text-slate-500 mt-1 font-medium">{env.percentage}% do faturamento bruto</div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm font-bold text-slate-900">R$ {amount.toFixed(2).replace('.', ',')}</div>
                <button 
                  onClick={() => handleEdit(env.id, env.percentage)}
                  className="text-xs text-blue-600 font-bold mt-1.5 hover:text-blue-800 underline underline-offset-2 flex items-center justify-end gap-1 w-full"
                >
                  <Edit2 className="w-3 h-3" /> Ajustar %
                </button>
              </div>
            </div>
          );
        })}
      </div>

      <AnimatePresence>
        {editingEnv !== null && (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
            <motion.div 
              initial={{ y: "100%", opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: "100%", opacity: 0 }}
              className="bg-white w-full max-w-sm rounded-[2rem] p-6 shadow-2xl relative"
            >
              <button onClick={() => setEditingEnv(null)} className="absolute right-6 top-6 p-2 text-slate-400 hover:text-slate-600 bg-slate-100 rounded-full transition-colors">
                <X className="w-5 h-5" />
              </button>
              <h3 className="text-xl font-bold text-slate-900 mb-2">Ajustar Porcentagem (%)</h3>
              <p className="text-sm text-slate-500 mb-4">Escolha o quanto do faturamento vai para este envelope.</p>
              <form onSubmit={saveEdit} className="flex flex-col gap-4 mt-4">
                <div>
                  <input 
                    type="number" 
                    min="0"
                    max="100"
                    value={editPercentage} 
                    onChange={(e) => setEditPercentage(e.target.value)} 
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-900 font-bold focus:outline-none focus:ring-2 focus:ring-blue-500 text-lg"
                    autoFocus
                  />
                </div>
                <button type="submit" className="w-full bg-blue-600 text-white font-bold py-3 mt-2 rounded-xl hover:bg-blue-700 transition-colors">
                  Salvar Porcentagem
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </motion.div>
  );
}
