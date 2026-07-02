import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Wallet, TrendingUp, Car, ShieldAlert, Wrench, Heart, PlusCircle, MinusCircle, X, Target, Bell, Trophy, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useStore } from '@/store';

const iconMap: Record<string, any> = {
  'Combustível / Recarga': Car,
  'Locadora / Financiamento': Wrench,
  'Lucro Pessoal': Wallet,
  'IRPF': ShieldAlert,
  'Manutenção': Wrench,
  'Alimentação': Heart,
  'Outros': Wallet
};

export function Dashboard() {
  const { ganhos, gastos, envelopes, addGanho, addGasto, metaDiaria, setMetaDiaria } = useStore();
  const [isAddingGain, setIsAddingGain] = useState(false);
  const [isAddingExpense, setIsAddingExpense] = useState(false);
  const [isEditingMeta, setIsEditingMeta] = useState(false);
  const [metaInput, setMetaInput] = useState('');
  
  const [amountInput, setAmountInput] = useState('');
  const [grossAmountInput, setGrossAmountInput] = useState('');
  const [kmInput, setKmInput] = useState('');
  const [plataforma, setPlataforma] = useState<string>('Uber');
  const [expenseCategory, setExpenseCategory] = useState<string>('Combustível / Recarga');

  const totalGanhos = ganhos.reduce((acc, curr) => acc + curr.amount, 0);
  const totalGastos = gastos.reduce((acc, curr) => acc + curr.amount, 0);
  
  const lucroPessoalEnv = envelopes.find(e => e.name === 'Lucro Pessoal')?.percentage || 25;
  const lucroAlocado = (totalGanhos * lucroPessoalEnv) / 100;
  const lucroGastos = gastos.filter(g => g.category === 'Outros').reduce((acc, g) => acc + g.amount, 0);
  const lucroReal = lucroAlocado - lucroGastos;
  
  // Calculate specific IRPF provision based on percentage of earnings
  const irpfPercentage = envelopes.find(e => e.name === 'IRPF')?.percentage || 7;
  const irpfProvision = (totalGanhos * irpfPercentage) / 100;

  // New Retention Features calculations
  const faltaMeta = Math.max(0, metaDiaria - lucroAlocado);
  const percentualMeta = Math.min(100, Math.round((parseFloat(Math.max(0, lucroAlocado).toString()) / metaDiaria) * 100)) || 0;
  
  const estimativaMes = lucroAlocado > 0 ? lucroAlocado * 26 : 0; // Ex: assumes similar profit 26 days a month
  const combustivelTotal = gastos.filter(g => g.category === 'Combustível / Recarga').reduce((acc, g) => acc + g.amount, 0);

  const handleSalvarMeta = (e: React.FormEvent) => {
    e.preventDefault();
    if (metaInput) {
      setMetaDiaria(Number(metaInput));
      setIsEditingMeta(false);
      setMetaInput('');
    }
  };

  const handleAddGanho = (e: React.FormEvent) => {
    e.preventDefault();
    if (!amountInput) return;
    
    const amount = parseFloat(amountInput.replace(',', '.'));
    const grossAmount = grossAmountInput ? parseFloat(grossAmountInput.replace(',', '.')) : amount;
    const km = kmInput ? parseFloat(kmInput.replace(',', '.')) : undefined;

    addGanho({
      amount: amount,
      grossAmount: grossAmount,
      plataforma: plataforma as any,
      kmRodados: km,
      date: new Date().toISOString(),
      hour: new Date().getHours()
    });
    setAmountInput('');
    setGrossAmountInput('');
    setKmInput('');
    setIsAddingGain(false);
  };

  const handleAddGasto = (e: React.FormEvent) => {
    e.preventDefault();
    if (!amountInput) return;
    addGasto({
      amount: parseFloat(amountInput.replace(',', '.')),
      category: expenseCategory as any,
      date: new Date().toISOString(),
    });
    setAmountInput('');
    setIsAddingExpense(false);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-32 mt-2"
    >
      {/* Header */}
      <div className="flex items-center justify-between mt-2 md:col-span-2">
        <div>
          <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Lucro Limpo (Pro Bolso)</h2>
          <div className="flex items-baseline gap-3 mt-1">
            <span className="text-4xl font-bold tracking-tight text-slate-900">
              R$ {lucroReal.toFixed(2).replace('.', ',')}
            </span>
            {lucroReal >= 0 ? (
               <span className="flex items-center text-sm font-bold text-emerald-500">
                 <TrendingUp className="w-3.5 h-3.5 mr-1" />
                 Lucro
               </span>
            ) : (
               <span className="flex items-center text-sm font-bold text-red-500">
                 Prejuízo
               </span>
            )}
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="grid grid-cols-2 gap-4 md:col-span-2">
        <button 
          onClick={() => setIsAddingGain(true)}
          className="bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-2xl p-4 flex flex-col items-center justify-center gap-2 hover:bg-emerald-100 transition-colors shadow-sm"
        >
          <PlusCircle className="w-6 h-6 text-emerald-500" />
          <span className="text-sm font-bold">Lançar Ganho</span>
        </button>
        <button 
          onClick={() => setIsAddingExpense(true)}
          className="bg-red-50 text-red-700 border border-red-200 rounded-2xl p-4 flex flex-col items-center justify-center gap-2 hover:bg-red-100 transition-colors shadow-sm"
        >
          <MinusCircle className="w-6 h-6 text-red-500" />
          <span className="text-sm font-bold">Lançar Gasto</span>
        </button>
      </div>

      {/* Meta Diária Card */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm relative overflow-hidden">
        <div className="flex justify-between items-start mb-4">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-blue-50 rounded-xl">
              <Target className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900">Meta Diária</h3>
              <p className="text-xs text-slate-500">R$ {metaDiaria.toFixed(2).replace('.', ',')} / dia</p>
            </div>
          </div>
          <button onClick={() => { setMetaInput(metaDiaria.toString()); setIsEditingMeta(true); }} className="text-xs font-bold text-blue-600 bg-blue-50 px-3 py-1.5 rounded-lg hover:bg-blue-100 transition">
            Editar
          </button>
        </div>
        
        <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden relative mb-3">
          <div className={cn("h-full rounded-full absolute left-0 top-0 transition-all duration-1000", percentualMeta >= 100 ? "bg-emerald-500" : "bg-blue-500")} style={{ width: `${percentualMeta}%` }} />
        </div>
        
        {faltaMeta > 0 ? (
          <p className="text-sm font-medium text-slate-600 mt-2">
            Falta <strong className="text-slate-900">R$ {faltaMeta.toFixed(2).replace('.', ',')}</strong> para sua meta de lucro de hoje.
          </p>
        ) : (
          <motion.div 
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", bounce: 0.5 }}
            className="mt-3 inline-flex items-center gap-2 bg-emerald-50 text-emerald-700 px-4 py-2 rounded-xl shadow-sm border border-emerald-200 w-full"
          >
            <Trophy className="w-5 h-5 text-emerald-500" />
            <span className="text-sm font-bold">Meta atingida! Mandou muito bem! 🚀</span>
          </motion.div>
        )}
      </div>

      {/* Simulator Widget */}
      <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-3xl p-6 text-white shadow-md relative overflow-hidden">
        <div className="absolute right-0 top-0 p-6 opacity-10">
          <Zap className="w-24 h-24" />
        </div>
        <h3 className="text-sm font-bold text-indigo-100 mb-1 flex items-center gap-2 uppercase tracking-wide">
           Simulador do Mês
        </h3>
        <p className="text-sm font-medium text-indigo-50 mt-2 leading-relaxed max-w-[250px]">
          Se você continuar nesse ritmo, terminará o mês com <strong className="text-white text-lg bg-indigo-900/40 px-2 py-0.5 rounded-md">R$ {estimativaMes.toFixed(2).replace('.', ',')}</strong> de lucro limpo.
        </p>
      </div>

      {combustivelTotal > 150 && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex gap-3 items-start shadow-sm md:col-span-2">
          <Bell className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
          <div>
            <h4 className="text-sm font-bold text-amber-900">Alerta de Gasto</h4>
            <p className="text-xs text-amber-800 mt-1 font-medium leading-relaxed">
              Atenção: seus gastos com combustível/recarga (R$ {combustivelTotal.toFixed(2).replace('.', ',')}) estão altos esta semana. Considere reavaliar suas rotas.
            </p>
          </div>
        </div>
      )}

      {/* Faturamento Total and Ranking Card */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm relative overflow-hidden group">
        <div className="absolute -top-4 -right-4 p-4 opacity-[0.03] transition-transform group-hover:scale-110 duration-500">
          <TrendingUp className="w-32 h-32 text-slate-900" />
        </div>
        <div className="relative z-10">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2 mb-2">
            Faturamento Bruto (Total)
          </h3>
          <div className="flex items-baseline gap-2">
            <h2 className="text-3xl font-bold text-slate-900">R$ {totalGanhos.toFixed(2).replace('.', ',')}</h2>
          </div>
          <div className="mt-4 flex gap-4 text-xs font-medium text-slate-600">
             <div className="flex items-center gap-1.5 focus:outline-none">
               <div className="w-2 h-2 rounded-full bg-blue-500" />
                {ganhos.length} lançamentos
             </div>
             <div className="flex items-center gap-1.5 focus:outline-none">
               <div className="w-2 h-2 rounded-full bg-red-500" />
                R$ {totalGastos.toFixed(2).replace('.', ',')} gastos
             </div>
          </div>
        </div>

        <div className="mt-5 pt-5 border-t border-slate-100 flex gap-3 items-start relative z-10">
           <Trophy className="w-5 h-5 text-emerald-500 shrink-0" />
           <div>
              <h4 className="text-sm font-bold text-slate-900">Ranking Pessoal</h4>
              <p className="text-xs text-slate-500 mt-0.5">Seu lucro por hora aumentou <strong className="text-emerald-600">12%</strong> em relação ao mês passado.</p>
           </div>
        </div>
      </div>

      {/* Distribution/Envelopes Quick View */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-bold text-slate-900">
            Meus Envelopes
          </h3>
        </div>
        <div className="flex flex-col gap-4">
          {envelopes.slice(0, 4).map(env => {
            const allocated = (totalGanhos * env.percentage) / 100;
            let spent = 0;
            if (env.name === 'Lucro Pessoal') {
                spent = gastos.filter(g => g.category === 'Outros').reduce((acc, curr) => acc + curr.amount, 0);
            } else {
                spent = gastos.filter(g => g.category === env.name).reduce((acc, curr) => acc + curr.amount, 0);
            }
            const remaining = allocated - spent;
            return (
              <EnvelopeRow 
                key={env.id}
                name={`${env.name} (${env.percentage}%)`} 
                icon={iconMap[env.name] || Wallet} 
                color={env.color} 
                iconBg={env.iconBg} 
                iconColor={env.iconColor} 
                amount={`R$ ${remaining.toFixed(2).replace('.', ',')}`} 
              />
            );
          })}
        </div>
      </div>
      
      {/* Fiscal Quick View */}
      <div className="bg-slate-900 rounded-3xl p-6 text-white shadow-xl md:col-span-2">
        <h3 className="text-sm font-bold text-slate-400 mb-2">CAIXA PARA O IMPOSTO (IRPF)</h3>
        <div className="text-3xl font-bold mb-1">R$ {irpfProvision.toFixed(2).replace('.', ',')}</div>
        <p className="text-xs text-slate-400">Separado automaticamente ({irpfPercentage}% dos ganhos)</p>
      </div>

      {/* Modals */}
      <AnimatePresence>
        {isAddingGain && (
          <Modal title="Novo Ganho / Corrida" onClose={() => setIsAddingGain(false)}>
            <form onSubmit={handleAddGanho} className="flex flex-col gap-4 mt-4">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Valor Cobrado do Passageiro (Bruto)</label>
                <input 
                  type="number" 
                  step="0.01" 
                  value={grossAmountInput} 
                  onChange={(e) => setGrossAmountInput(e.target.value)} 
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-900 font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500 mb-2"
                  placeholder="Ex: 65.00 (Opcional)"
                  autoFocus
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Valor que você Recebeu (Líquido)</label>
                <input 
                  type="number" 
                  step="0.01" 
                  value={amountInput} 
                  onChange={(e) => setAmountInput(e.target.value)} 
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-900 font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  placeholder="Ex: 50.00"
                />
              </div>
              <div className="flex gap-4 mt-2">
                <div className="flex-1">
                  <label className="block text-sm font-bold text-slate-700 mb-1">Plataforma</label>
                  <select 
                    value={plataforma} 
                    onChange={(e) => setPlataforma(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-900 font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="Uber">Uber</option>
                    <option value="99">99</option>
                    <option value="inDrive">inDrive</option>
                    <option value="Particular">Particular</option>
                  </select>
                </div>
                <div className="flex-1">
                  <label className="block text-sm font-bold text-slate-700 mb-1">KM Rodado</label>
                  <input 
                    type="number"
                    step="0.1" 
                    value={kmInput} 
                    onChange={(e) => setKmInput(e.target.value)} 
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-900 font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    placeholder="Ex: 12.5 (Opcional)"
                  />
                </div>
              </div>
              <button disabled={!amountInput} type="submit" className="w-full bg-emerald-500 text-white font-bold py-3 rounded-xl hover:bg-emerald-600 transition-colors disabled:opacity-50 mt-2">
                Salvar Ganho
              </button>
            </form>
          </Modal>
        )}
        {isAddingExpense && (
          <Modal title="Novo Gasto" onClose={() => setIsAddingExpense(false)}>
            <form onSubmit={handleAddGasto} className="flex flex-col gap-4 mt-4">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Valor do Gasto (R$)</label>
                <input 
                  type="number" 
                  step="0.01" 
                  value={amountInput} 
                  onChange={(e) => setAmountInput(e.target.value)} 
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-900 font-bold focus:outline-none focus:ring-2 focus:ring-red-500"
                  placeholder="Ex: 100.00"
                  autoFocus
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Onde você gastou?</label>
                <select 
                  value={expenseCategory} 
                  onChange={(e) => setExpenseCategory(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-900 font-bold focus:outline-none focus:ring-2 focus:ring-red-500"
                >
                  <option value="Combustível / Recarga">Combustível / Recarga</option>
                  <option value="Locadora / Financiamento">Locadora / Financiamento</option>
                  <option value="Manutenção">Manutenção / Peças</option>
                  <option value="Alimentação">Alimentação</option>
                  <option value="Outros">Outras coisas</option>
                </select>
              </div>
              <button disabled={!amountInput} type="submit" className="w-full bg-red-500 text-white font-bold py-3 rounded-xl hover:bg-red-600 transition-colors disabled:opacity-50 mt-2">
                Registrar Gasto
              </button>
            </form>
          </Modal>
        )}
        {isEditingMeta && (
          <Modal title="Editar Meta Diária" onClose={() => setIsEditingMeta(false)}>
            <form onSubmit={handleSalvarMeta} className="flex flex-col gap-4 mt-4">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Meta de Lucro Livre (R$/dia)</label>
                <input 
                  type="number" 
                  step="1" 
                  value={metaInput} 
                  onChange={(e) => setMetaInput(e.target.value)} 
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-900 font-bold focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Ex: 250"
                  autoFocus
                />
              </div>
              <button disabled={!metaInput} type="submit" className="w-full bg-blue-600 text-white font-bold py-3 mt-2 rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-50">
                Salvar Meta
              </button>
            </form>
          </Modal>
        )}
      </AnimatePresence>

      {/* Últimos Lançamentos (Histórico) */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm md:col-span-2">
        <h3 className="font-bold text-slate-900 mb-4 flex items-center justify-between">
          <span>Últimos Lançamentos</span>
          <span className="text-xs text-slate-500 font-medium">Histórico de atividades</span>
        </h3>
        
        {ganhos.length === 0 && gastos.length === 0 ? (
          <div className="text-center py-6 text-slate-400 text-sm font-medium">
            Nenhum lançamento registrado ainda.
          </div>
        ) : (
          <div className="flex flex-col gap-3 max-h-80 overflow-y-auto pr-1">
            {[
              ...ganhos.map(g => ({ ...g, type: 'ganho' as const })),
              ...gastos.map(g => ({ ...g, type: 'gasto' as const }))
            ]
              .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
              .slice(0, 10)
              .map((item) => {
                const isGanho = item.type === 'ganho';
                const dObj = new Date(item.date);
                const formattedDate = isNaN(dObj.getTime())
                  ? ''
                  : `${String(dObj.getDate()).padStart(2, '0')}/${String(dObj.getMonth() + 1).padStart(2, '0')} às ${String(dObj.getHours()).padStart(2, '0')}:${String(dObj.getMinutes()).padStart(2, '0')}`;
                
                return (
                  <div key={item.id} className="flex justify-between items-center bg-slate-50 p-3.5 rounded-xl border border-slate-100 hover:border-slate-200 transition-all">
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        "w-9 h-9 rounded-xl flex items-center justify-center font-bold text-sm",
                        isGanho ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700"
                      )}>
                        {isGanho ? '+' : '-'}
                      </div>
                      <div>
                        <div className="text-sm font-bold text-slate-900">
                          {isGanho ? `Corrida ${item.plataforma || 'Uber'}` : item.category}
                        </div>
                        <div className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">
                          {formattedDate} {isGanho && item.kmRodados ? `• ${item.kmRodados} km` : ''}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className={cn("text-sm font-extrabold font-mono", isGanho ? "text-emerald-600" : "text-rose-600")}>
                        R$ {item.amount.toFixed(2).replace('.', ',')}
                      </div>
                      <button
                        onClick={() => {
                          if (isGanho) {
                            useStore.getState().deleteGanho(item.id);
                          } else {
                            useStore.getState().deleteGasto(item.id);
                          }
                        }}
                        className="text-xs font-bold text-slate-400 hover:text-rose-600 bg-slate-100 hover:bg-rose-50 p-1.5 rounded-lg transition-colors"
                        title="Deletar lançamento"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
          </div>
        )}
      </div>
      
    </motion.div>
  );
}

function EnvelopeRow({ name, icon: Icon, color, iconBg, iconColor, amount }: any) {
  return (
    <div className="flex items-center gap-4">
      <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center shrink-0", iconBg, iconColor)}>
        <Icon className="w-5 h-5" />
      </div>
      <div className="flex-1">
        <div className="flex justify-between mb-1.5">
          <span className="text-sm font-bold text-slate-900">{name}</span>
          <span className="text-sm text-slate-500 font-medium">{amount}</span>
        </div>
        <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden relative">
          <div className={cn("h-full rounded-full absolute left-0 top-0", color)} style={{ width: name.match(/\((\d+)%\)/)?.[1] + '%' }} />
        </div>
      </div>
    </div>
  );
}

function Modal({ title, children, onClose }: { title: string, children: React.ReactNode, onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
      <motion.div 
        initial={{ y: "100%", opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: "100%", opacity: 0 }}
        className="bg-white w-full max-w-sm rounded-[2rem] p-6 shadow-2xl relative"
      >
        <button onClick={onClose} className="absolute right-6 top-6 p-2 text-slate-400 hover:text-slate-600 bg-slate-100 rounded-full transition-colors">
          <X className="w-5 h-5" />
        </button>
        <h3 className="text-2xl font-bold text-slate-900 mb-2">{title}</h3>
        {children}
      </motion.div>
    </div>
  );
}
