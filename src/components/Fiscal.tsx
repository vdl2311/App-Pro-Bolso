import { motion } from 'motion/react';
import { ShieldCheck, FileText, Camera } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useStore } from '@/store';

export function Fiscal() {
  const { ganhos, gastos, envelopes } = useStore();
  
  const totalGanhos = ganhos.reduce((acc, curr) => acc + curr.amount, 0);
  const irpfPercentage = envelopes.find(e => e.name === 'IRPF')?.percentage || 7;
  const irpfProvision = (totalGanhos * irpfPercentage) / 100;

  // Aggregate gastos by category
  const gastosCombustivel = gastos.filter(g => g.category === 'Combustível / Recarga');
  const gastosLocadora = gastos.filter(g => g.category === 'Locadora / Financiamento');
  const gastosManutencao = gastos.filter(g => g.category === 'Manutenção');

  const totalDeducoes = gastos.reduce((acc, curr) => acc + curr.amount, 0);
  // Arbitrary IR calculation for simulation: Assume 15% flat rate on gains
  const irpfTotalProjected = totalGanhos * 0.15;
  const irpfFinal = Math.max(0, irpfTotalProjected - (totalDeducoes * 0.2)); // Simulate deductions

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col gap-6 pb-32 mt-2"
    >
      <div className="flex justify-between items-center bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Imposto de Renda (IRPF)</h2>
          <p className="text-sm text-slate-500 mt-1">Sem surpresas com o Leão</p>
        </div>
        <button className="flex items-center justify-center p-3.5 bg-blue-600 text-white rounded-2xl font-bold shadow-sm hover:bg-blue-700 transition-colors">
          <Camera className="w-5 h-5" />
        </button>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 relative overflow-hidden shadow-xl">
        <div className="absolute -right-4 -top-4 opacity-10">
          <ShieldCheck className="w-32 h-32 text-blue-400" />
        </div>
        
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-3">
            <h3 className="text-blue-400 text-sm font-bold uppercase tracking-wider">Estimativa de Imposto ({new Date().getFullYear()})</h3>
          </div>
          <div className="flex items-baseline gap-2 mb-1">
            <div className="text-4xl font-bold text-white">R$ {irpfProvision.toFixed(2).replace('.', ',')}</div>
          </div>
          <div className="text-xs font-bold text-slate-400 mt-2">
            Dinheiro que guardamos nos seus envelopes
          </div>

          <div className="mt-8 space-y-4">
            <div className="flex justify-between items-center text-sm">
              <span className="text-slate-400 font-medium">Imposto Bruto Calculado</span>
              <span className="text-white font-bold font-mono">R$ {irpfTotalProjected.toFixed(2).replace('.', ',')}</span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-slate-400 font-medium">Abatimento com Notas (Gastos)</span>
              <span className="text-emerald-400 font-bold font-mono">- R$ {(irpfTotalProjected - irpfFinal).toFixed(2).replace('.', ',')}</span>
            </div>
            <div className="h-px w-full bg-slate-800 my-1" />
            <div className="flex justify-between items-center font-bold">
              <span className="text-slate-300">Valor Real a Pagar (Estimado)</span>
              <span className="text-white font-mono text-base">R$ {irpfFinal.toFixed(2).replace('.', ',')}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
        <h3 className="text-sm font-bold text-slate-900 mb-5 flex items-center justify-between">
          <span className="uppercase tracking-wider">Todas suas Despesas (Notas)</span>
          <span className="text-xs font-semibold text-blue-600 bg-blue-50 px-2 py-1 rounded-md">{gastos.length} lançamentos</span>
        </h3>
        <div className="flex flex-col gap-4">
          <ReceiptCategory 
            name="Combustível / Recarga" 
            count={gastosCombustivel.length} 
            amount={`R$ ${gastosCombustivel.reduce((acc, g) => acc + g.amount, 0).toFixed(2).replace('.', ',')}`} 
            iconBg="bg-orange-100" 
            iconColor="text-orange-600" 
          />
          <ReceiptCategory 
            name="Locadora / Financiamento" 
            count={gastosLocadora.length} 
            amount={`R$ ${gastosLocadora.reduce((acc, g) => acc + g.amount, 0).toFixed(2).replace('.', ',')}`} 
            iconBg="bg-blue-100" 
            iconColor="text-blue-600" 
          />
          <ReceiptCategory 
            name="Manutenção / Peças" 
            count={gastosManutencao.length} 
            amount={`R$ ${gastosManutencao.reduce((acc, g) => acc + g.amount, 0).toFixed(2).replace('.', ',')}`}  
            iconBg="bg-indigo-100" 
            iconColor="text-indigo-600" 
          />
        </div>
      </div>

      <button className="w-full bg-white border border-slate-200 text-slate-900 font-bold py-4 rounded-2xl flex justify-center items-center gap-2 hover:bg-slate-50 transition shadow-sm">
        Enviar Recibos para o Contador <FileText className="w-4 h-4 text-blue-600 ml-1" />
      </button>

    </motion.div>
  );
}

function ReceiptCategory({ name, count, amount, iconBg, iconColor }: any) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className={cn("p-2 rounded-lg", iconBg, iconColor)}>
          <FileText className="w-4 h-4" />
        </div>
        <div>
          <h4 className="text-sm font-bold text-slate-900">{name}</h4>
          <p className="text-xs text-slate-500 mt-0.5 font-medium">{count} compras lançadas</p>
        </div>
      </div>
      <div className="text-sm font-bold text-slate-900 font-mono">{amount}</div>
    </div>
  );
}
