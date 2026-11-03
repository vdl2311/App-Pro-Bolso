import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Wrench, AlertTriangle, CheckCircle2, Gauge, ShieldCheck, Plus, Sparkles, Bike, Car, ArrowRight, DollarSign } from 'lucide-react';
import { useStore, ManutencaoItem } from '@/store';
import { cn } from '@/lib/utils';

export function Manutencao() {
  const { 
    tipoVeiculo, 
    setTipoVeiculo, 
    odometroAtual, 
    setOdometroAtual, 
    manutencoes, 
    registrarTrocaManutencao, 
    reservarParaEnvelopeManutencao,
    gastos,
    ganhos,
    envelopes
  } = useStore();

  const [isEditingOdometro, setIsEditingOdometro] = useState(false);
  const [novoOdometro, setNovoOdometro] = useState(odometroAtual.toString());
  const [avisoSucesso, setAvisoSucesso] = useState<string | null>(null);

  // Calcula saldo acumulado no Envelope de Manutenção
  const totalGanhos = ganhos.reduce((acc, curr) => acc + curr.amount, 0);
  const manutencaoEnv = envelopes.find(e => e.name === 'Manutenção')?.percentage || 8;
  const manutencaoAlocado = (totalGanhos * manutencaoEnv) / 100;
  const manutencaoGastos = gastos.filter(g => g.category === 'Manutenção').reduce((acc, g) => acc + g.amount, 0);
  const saldoManutencao = Math.max(0, manutencaoAlocado - manutencaoGastos);

  // Analisa itens que precisam de atenção urgente (< 500 km ou já vencidos)
  const itensComStatus = manutencoes.map(item => {
    const kmRodadoDesdeTroca = Math.max(0, odometroAtual - item.ultimoKmTroca);
    const kmRestante = item.intervaloKm - kmRodadoDesdeTroca;
    const porcentagemGasta = Math.min(100, Math.round((kmRodadoDesdeTroca / item.intervaloKm) * 100));
    
    let urgencia: 'ok' | 'alerta' | 'vencido' = 'ok';
    if (kmRestante <= 0) {
      urgencia = 'vencido';
    } else if (kmRestante <= 500) {
      urgencia = 'alerta';
    }

    return {
      ...item,
      kmRodadoDesdeTroca,
      kmRestante,
      porcentagemGasta,
      urgencia
    };
  });

  // O item mais urgente para o Alerta Preventivo (Troca de Papel)
  const itemMaisUrgente = [...itensComStatus].sort((a, b) => a.kmRestante - b.kmRestante)[0];

  const handleSalvarOdometro = (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseFloat(novoOdometro.replace(',', '.'));
    if (!isNaN(val) && val >= 0) {
      setOdometroAtual(val);
      setIsEditingOdometro(false);
      mostrarFeedback('Odômetro atualizado com sucesso!');
    }
  };

  const handleReservarEnvelope = (item: typeof itemMaisUrgente) => {
    reservarParaEnvelopeManutencao(item.custoEstimado, `Reserva Preventiva: ${item.nome}`);
    mostrarFeedback(`R$ ${item.custoEstimado.toFixed(2).replace('.', ',')} reservados no Envelope de Manutenção!`);
  };

  const handleTrocaRealizada = (item: ManutencaoItem) => {
    registrarTrocaManutencao(item.id, odometroAtual);
    mostrarFeedback(`Troca de "${item.nome}" registrada no KM ${odometroAtual.toLocaleString('pt-BR')}!`);
  };

  const mostrarFeedback = (msg: string) => {
    setAvisoSucesso(msg);
    setTimeout(() => setAvisoSucesso(null), 4000);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-4 pb-4"
    >
      {/* Toast Feedback */}
      <AnimatePresence>
        {avisoSucesso && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-20 left-1/2 -translate-x-1/2 z-50 bg-slate-900 text-white px-5 py-3 rounded-2xl shadow-xl flex items-center gap-2.5 text-xs font-bold border border-slate-700"
          >
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{avisoSucesso}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header Veículo e Odômetro */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm relative overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
                <Wrench className="w-5 h-5" />
              </span>
              <div>
                <h2 className="text-xl font-bold text-slate-900">Previsão do Veículo</h2>
                <p className="text-xs text-slate-500 font-medium">
                  Manutenção preventiva por KM (não espere a moto ou carro quebrar)
                </p>
              </div>
            </div>
          </div>

          {/* Toggle Moto / Carro */}
          <div className="flex items-center bg-slate-100 p-1 rounded-2xl shrink-0 self-start sm:self-auto">
            <button
              onClick={() => setTipoVeiculo('moto')}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition",
                tipoVeiculo === 'moto' ? "bg-white text-indigo-600 shadow-sm" : "text-slate-500 hover:text-slate-700"
              )}
            >
              <Bike className="w-3.5 h-3.5" /> Moto
            </button>
            <button
              onClick={() => setTipoVeiculo('carro')}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition",
                tipoVeiculo === 'carro' ? "bg-white text-indigo-600 shadow-sm" : "text-slate-500 hover:text-slate-700"
              )}
            >
              <Car className="w-3.5 h-3.5" /> Carro
            </button>
          </div>
        </div>

        {/* Odômetro Bar */}
        <div className="mt-5 pt-5 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-slate-100 rounded-xl text-slate-700">
              <Gauge className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                Odômetro Atual
              </span>
              <span className="text-2xl font-black text-slate-900">
                {odometroAtual.toLocaleString('pt-BR')} <span className="text-sm font-semibold text-slate-400">km</span>
              </span>
            </div>
          </div>

          {isEditingOdometro ? (
            <form onSubmit={handleSalvarOdometro} className="flex items-center gap-2">
              <input
                type="number"
                value={novoOdometro}
                onChange={(e) => setNovoOdometro(e.target.value)}
                className="w-28 p-2 text-sm font-bold border border-indigo-300 rounded-xl focus:ring-2 focus:ring-indigo-500 bg-white"
                autoFocus
              />
              <button
                type="submit"
                className="bg-indigo-600 text-white text-xs font-bold px-3 py-2 rounded-xl hover:bg-indigo-700 transition"
              >
                Salvar
              </button>
              <button
                type="button"
                onClick={() => setIsEditingOdometro(false)}
                className="bg-slate-100 text-slate-600 text-xs font-bold px-3 py-2 rounded-xl hover:bg-slate-200 transition"
              >
                Cancelar
              </button>
            </form>
          ) : (
            <button
              onClick={() => { setNovoOdometro(odometroAtual.toString()); setIsEditingOdometro(true); }}
              className="text-xs font-bold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 px-3 py-2 rounded-xl transition"
            >
              Ajustar KM Manual
            </button>
          )}
        </div>
      </div>

      {/* Card Troca de Papel: Alerta Preventivo Ativo */}
      {itemMaisUrgente && (
        <div className={cn(
          "rounded-3xl p-6 border shadow-md relative overflow-hidden transition-all",
          itemMaisUrgente.urgencia === 'vencido' 
            ? "bg-rose-50 border-rose-200 text-rose-950" 
            : itemMaisUrgente.urgencia === 'alerta'
            ? "bg-amber-50 border-amber-200 text-amber-950"
            : "bg-gradient-to-br from-indigo-900 to-slate-900 text-white border-indigo-800"
        )}>
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-2">
              {itemMaisUrgente.urgencia === 'vencido' ? (
                <div className="p-2.5 bg-rose-600 text-white rounded-2xl animate-pulse">
                  <AlertTriangle className="w-5 h-5" />
                </div>
              ) : itemMaisUrgente.urgencia === 'alerta' ? (
                <div className="p-2.5 bg-amber-500 text-white rounded-2xl">
                  <AlertTriangle className="w-5 h-5" />
                </div>
              ) : (
                <div className="p-2.5 bg-indigo-500/30 text-indigo-300 rounded-2xl">
                  <ShieldCheck className="w-5 h-5" />
                </div>
              )}
              <div>
                <span className={cn(
                  "text-[10px] font-extrabold uppercase tracking-wider",
                  itemMaisUrgente.urgencia === 'vencido' ? "text-rose-600" : itemMaisUrgente.urgencia === 'alerta' ? "text-amber-700" : "text-indigo-300"
                )}>
                  Alerta Preventivo do Veículo
                </span>
                <h3 className="text-lg font-bold leading-tight">
                  {itemMaisUrgente.nome}
                </h3>
              </div>
            </div>

            <span className={cn(
              "text-xs font-bold px-3 py-1 rounded-full",
              itemMaisUrgente.urgencia === 'vencido'
                ? "bg-rose-600 text-white"
                : itemMaisUrgente.urgencia === 'alerta'
                ? "bg-amber-200 text-amber-900"
                : "bg-white/10 text-indigo-200"
            )}>
              {itemMaisUrgente.kmRestante <= 0 
                ? `Vencido há ${Math.abs(itemMaisUrgente.kmRestante)} km`
                : `Faltam ${itemMaisUrgente.kmRestante.toLocaleString('pt-BR')} km`}
            </span>
          </div>

          <p className={cn(
            "text-xs mt-3 leading-relaxed font-medium",
            itemMaisUrgente.urgencia === 'ok' ? "text-slate-300" : "text-slate-700"
          )}>
            {itemMaisUrgente.kmRestante <= 0 ? (
              <>Atenção crítica: seu veículo já atingiu o limite de troca. Rodar com esse item vencido pode fundir o motor ou causar acidentes graves.</>
            ) : (
              <>
                Faltam <strong>{itemMaisUrgente.kmRestante} km</strong> para sua próxima troca. Estimativa de custo: <strong>R$ {itemMaisUrgente.custoEstimado.toFixed(2).replace('.', ',')}</strong>. Deseja reservar esse valor do ganho de hoje para não ser pego de surpresa?
              </>
            )}
          </p>

          <div className="flex flex-wrap gap-2.5 mt-4 pt-3 border-t border-slate-200/40">
            <button
              onClick={() => handleReservarEnvelope(itemMaisUrgente)}
              className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold px-4 py-2.5 rounded-xl transition flex items-center gap-1.5 shadow-sm"
            >
              <DollarSign className="w-3.5 h-3.5" />
              Reservar R$ {itemMaisUrgente.custoEstimado.toFixed(2).replace('.', ',')} no Envelope
            </button>
            <button
              onClick={() => handleTrocaRealizada(itemMaisUrgente)}
              className={cn(
                "text-xs font-bold px-4 py-2.5 rounded-xl transition flex items-center gap-1.5",
                itemMaisUrgente.urgencia === 'ok' ? "bg-white/10 hover:bg-white/20 text-white" : "bg-white hover:bg-slate-100 text-slate-800 border border-slate-200"
              )}
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              Registrar Troca Realizada
            </button>
          </div>
        </div>
      )}

      {/* Saldo Disponível no Envelope de Manutenção */}
      <div className="bg-gradient-to-r from-blue-900 to-indigo-900 text-white p-6 rounded-3xl shadow-sm border border-blue-800 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <span className="text-[10px] font-extrabold uppercase tracking-widest text-blue-300">
            Fundo de Socorro Mecânico
          </span>
          <div className="text-3xl font-black mt-0.5">
            R$ {saldoManutencao.toFixed(2).replace('.', ',')}
          </div>
          <p className="text-xs text-blue-200 mt-1">
            Saldo acumulado no seu Envelope de Manutenção ({manutencaoEnv}% das corridas).
          </p>
        </div>
        <div className="bg-white/10 backdrop-blur-md px-4 py-2 rounded-2xl border border-white/10 text-xs font-bold text-blue-100">
          🛡️ Proteção contra prejuízo na oficina
        </div>
      </div>

      {/* Grade de Todos os Componentes do Veículo */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-slate-900 text-base">
            Vida Útil dos Componentes
          </h3>
          <span className="text-xs text-slate-400 font-medium">
            Atualizado a cada corrida com KM
          </span>
        </div>

        <div className="space-y-4">
          {itensComStatus.map(item => (
            <div 
              key={item.id}
              className="p-4 rounded-2xl bg-slate-50 border border-slate-100 hover:border-slate-200 transition"
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="font-bold text-slate-800 text-sm">{item.nome}</h4>
                    <span className="text-[10px] font-bold px-2 py-0.5 bg-slate-200 text-slate-600 rounded-md">
                      {item.categoria}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Troca a cada {item.intervaloKm.toLocaleString('pt-BR')} km • Estimativa: R$ {item.custoEstimado.toFixed(2).replace('.', ',')}
                  </p>
                </div>

                <div className="text-right shrink-0">
                  <span className={cn(
                    "text-xs font-black block",
                    item.kmRestante <= 0 ? "text-rose-600" : item.kmRestante <= 500 ? "text-amber-600" : "text-slate-700"
                  )}>
                    {item.kmRestante <= 0 ? "Vencido!" : `Restam ${item.kmRestante.toLocaleString('pt-BR')} km`}
                  </span>
                  <button
                    onClick={() => handleTrocaRealizada(item)}
                    className="text-[11px] font-bold text-indigo-600 hover:text-indigo-800 mt-1 inline-flex items-center gap-1"
                  >
                    Renovar agora <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
              </div>

              {/* Progress bar */}
              <div className="w-full bg-slate-200 h-2.5 rounded-full overflow-hidden mt-3 relative">
                <div 
                  className={cn(
                    "h-full rounded-full transition-all duration-700",
                    item.porcentagemGasta >= 100 
                      ? "bg-rose-500" 
                      : item.porcentagemGasta >= 80 
                      ? "bg-amber-500" 
                      : "bg-emerald-500"
                  )}
                  style={{ width: `${item.porcentagemGasta}%` }}
                />
              </div>

              <div className="flex justify-between items-center text-[10px] text-slate-400 mt-1.5 font-medium">
                <span>Última troca: KM {item.ultimoKmTroca.toLocaleString('pt-BR')}</span>
                <span>{item.porcentagemGasta}% utilizado</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}
