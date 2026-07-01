import { motion } from 'motion/react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Clock, TrendingUp } from 'lucide-react';
import { useStore } from '@/store';

export function Ganhos() {
  const { ganhos } = useStore();
  
  // Calculate real hourly data from store
  const hoursData = Array.from({ length: 24 }).map((_, i) => ({ hour: i, count: 0, total: 0 }));
  
  ganhos.forEach(ganho => {
    hoursData[ganho.hour].count += 1;
    hoursData[ganho.hour].total += ganho.amount;
  });

  const hourlyData = hoursData
    .filter(h => h.count > 0 || [6, 8, 10, 12, 14, 16, 18, 20, 22].includes(h.hour))
    .map(h => ({
      hour: `${h.hour.toString().padStart(2, '0')}h`,
      profit: h.count > 0 ? h.total / h.count : 0,
    }));

  const totalGanhos = ganhos.reduce((acc, curr) => acc + curr.amount, 0);
  const mediaSemana = ganhos.length > 0 ? (totalGanhos / ganhos.length) : 0; // Assuming each ganho represents roughly an hour, or we just show avg per entry for simplicity if data is sparse

  const ganhosComTaxa = ganhos.filter(g => g.grossAmount && g.grossAmount > g.amount);
  const totalGrossComTaxa = ganhosComTaxa.reduce((acc, curr) => acc + (curr.grossAmount || curr.amount), 0);
  const totalNetComTaxa = ganhosComTaxa.reduce((acc, curr) => acc + curr.amount, 0);
  const taxaMedia = totalGrossComTaxa > 0 ? ((totalGrossComTaxa - totalNetComTaxa) / totalGrossComTaxa) * 100 : 0;

  // Platform comparison logic
  const platformStats: Record<string, { count: number, totalAmount: number, totalGross: number, totalKm: number }> = {};
  ganhos.forEach(g => {
    const pf = g.plataforma || 'Uber'; // Fallback for old records
    if (!platformStats[pf]) {
      platformStats[pf] = { count: 0, totalAmount: 0, totalGross: 0, totalKm: 0 };
    }
    platformStats[pf].count += 1;
    platformStats[pf].totalAmount += g.amount;
    platformStats[pf].totalGross += (g.grossAmount || g.amount);
    platformStats[pf].totalKm += (g.kmRodados || 0);
  });

  const platformsArray = Object.entries(platformStats).map(([name, stats]) => {
    return {
      name,
      avgNet: stats.count > 0 ? stats.totalAmount / stats.count : 0,
      fee: stats.totalGross > 0 ? ((stats.totalGross - stats.totalAmount) / stats.totalGross) * 100 : 0,
      valuePerKm: stats.totalKm > 0 ? stats.totalAmount / stats.totalKm : 0,
      count: stats.count,
      totalAmount: stats.totalAmount
    };
  }).sort((a, b) => b.totalAmount - a.totalAmount); // most profitable overall first


  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col gap-6 pb-32 mt-2"
    >
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
        <h2 className="text-2xl font-bold text-slate-900">Análise e Comparação</h2>
        <p className="text-sm text-slate-500 mt-1">Descubra os horários que dão mais dinheiro e qual aplicativo compensa mais.</p>
      </div>

      {taxaMedia > 0 && (
        <div className="bg-indigo-900 text-white p-6 rounded-3xl shadow-md border border-indigo-800">
          <h3 className="text-sm font-bold text-indigo-300 uppercase tracking-widest mb-1">Taxa Média das Plataformas</h3>
          <div className="text-3xl font-bold mb-2">{taxaMedia.toFixed(1).replace('.', ',')}%</div>
          <p className="text-xs text-indigo-200 leading-relaxed font-medium">Você paga em média essa taxa nas corridas (baseado em {ganhosComTaxa.length} registros). Saber que as empresas levam essa porcentagem te ajuda a focar em lucro real, não só faturamento.</p>
        </div>
      )}

      {platformsArray.length > 0 && (
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
          <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4">Comparador de Plataformas</h3>
          <div className="flex flex-col gap-3">
            {platformsArray.map((p) => (
              <div key={p.name} className="flex justify-between items-center bg-slate-50 p-4 rounded-xl border border-slate-100">
                <div className="flex flex-col">
                  <span className="font-bold text-slate-900 text-base">{p.name}</span>
                  <span className="text-xs text-slate-500 font-medium">{p.count} corridas</span>
                </div>
                <div className="flex flex-col items-end gap-1">
                  {p.valuePerKm > 0 && (
                    <span className="text-xs font-bold text-emerald-600 bg-emerald-100 px-2 py-0.5 rounded-lg">R$ {p.valuePerKm.toFixed(2).replace('.', ',')} / KM Liquido</span>
                  )}
                  {p.fee > 0 ? (
                    <span className="text-xs font-medium text-slate-400">Taxa: {p.fee.toFixed(1).replace('.', ',')}%</span>
                  ) : (
                    <span className="text-xs font-medium text-slate-400">Taxa: Não Registrada</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
        <div className="flex flex-col gap-1 mb-6">
          <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Sua Média (Geral)</div>
          <div className="flex items-baseline gap-2">
            <div className="text-4xl font-bold text-slate-900">R$ {mediaSemana.toFixed(2).replace('.', ',')}</div>
            <div className="text-sm text-slate-500 font-medium">/corrida</div>
          </div>
        </div>

        <div className="h-56 w-full mt-2">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={hourlyData} margin={{ top: 0, right: 0, left: -25, bottom: 0 }}>
              <XAxis dataKey="hour" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 11, fontWeight: 500 }} dy={10} />
              <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 11, fontWeight: 600 }} tickFormatter={(val) => `R$${val}`} dx={-5} />
              <Tooltip 
                cursor={{ fill: '#f1f5f9', opacity: 0.6 }}
                contentStyle={{ backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: '12px', color: '#0f172a', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                itemStyle={{ color: '#10b981', fontWeight: 'bold' }}
                formatter={(value: number) => [`R$ ${value.toFixed(2).replace('.', ',')}`, 'Média Horária']}
                labelStyle={{ color: '#64748b', marginBottom: '8px', fontSize: '12px', fontWeight: 'bold' }}
              />
              <Bar dataKey="profit" radius={[4, 4, 0, 0]} maxBarSize={32}>
                {hourlyData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.profit >= mediaSemana && entry.profit > 0 ? '#10b981' : entry.profit === 0 ? '#e2e8f0' : '#3b82f6'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="bg-emerald-50 border border-emerald-100 p-5 rounded-3xl flex flex-col gap-2">
          <TrendingUp className="w-5 h-5 text-emerald-600 mb-1" />
          <div className="text-xs text-emerald-800 font-bold uppercase tracking-wider">Seu Melhor Horário</div>
          <div className="text-sm font-bold text-slate-900">Sexta e Sábado</div>
          <div className="text-xs text-emerald-700 mt-1">Noite / Madrugada</div>
        </div>
        <div className="bg-red-50 border border-red-100 p-5 rounded-3xl flex flex-col gap-2">
          <Clock className="w-5 h-5 text-red-600 mb-1" />
          <div className="text-xs text-red-800 font-bold uppercase tracking-wider">Horários Fracos</div>
          <div className="text-sm font-bold text-slate-900">Meio da Tarde</div>
          <div className="text-xs text-red-700 mt-1">Dá prejuízo rodar</div>
        </div>
      </div>

    </motion.div>
  );
}
