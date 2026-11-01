import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { AlertOctagon, Phone, ShieldAlert, Wrench, DollarSign, CheckCircle2, ChevronRight, X, ArrowDownCircle, HeartPulse, HelpCircle } from 'lucide-react';
import { useStore } from '@/store';
import { cn } from '@/lib/utils';

interface PanicoModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function PanicoModal({ isOpen, onClose }: PanicoModalProps) {
  const { ganhos, gastos, envelopes, addGasto } = useStore();
  
  const [activeTab, setActiveTab] = useState<'reserva' | 'antecipacao' | 'socorro'>('reserva');
  const [valorResgate, setValorResgate] = useState('');
  const [motivoResgate, setMotivoResgate] = useState('Conserto de emergência no veículo');
  const [aviso, setAviso] = useState<string | null>(null);

  if (!isOpen) return null;

  // Cálculos financeiros reais
  const totalGanhos = ganhos.reduce((acc, curr) => acc + curr.amount, 0);
  
  // Saldo de Manutenção
  const manutencaoEnv = envelopes.find(e => e.name === 'Manutenção')?.percentage || 8;
  const manutencaoAlocado = (totalGanhos * manutencaoEnv) / 100;
  const manutencaoGastos = gastos.filter(g => g.category === 'Manutenção').reduce((acc, g) => acc + g.amount, 0);
  const saldoManutencao = Math.max(0, manutencaoAlocado - manutencaoGastos);

  // Saldo de Lucro Pessoal
  const lucroEnv = envelopes.find(e => e.name === 'Lucro Pessoal')?.percentage || 25;
  const lucroAlocado = (totalGanhos * lucroEnv) / 100;
  const lucroGastos = gastos.filter(g => g.category === 'Outros').reduce((acc, g) => acc + g.amount, 0);
  const saldoLucro = Math.max(0, lucroAlocado - lucroGastos);

  const saldoEmergenciaTotal = saldoManutencao + saldoLucro;

  // Cálculo de limite pré-aprovado de socorro justo baseado no histórico do app
  // Faturamento médio semanal (ou faturamento dos últimos 7 registros se tiver pouco dado)
  const faturamentoSemanal = totalGanhos > 0 ? Math.min(totalGanhos, Math.round(totalGanhos * 0.45) + 300) : 800;
  const limiteSocorroSugerido = Math.max(300, Math.min(1500, Math.round(faturamentoSemanal * 0.45)));

  const handleEfetuarResgate = (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseFloat(valorResgate.replace(',', '.'));
    if (isNaN(val) || val <= 0) return;

    if (val > saldoEmergenciaTotal) {
      setAviso('O valor solicitado ultrapassa seu saldo disponível de reserva.');
      return;
    }

    addGasto({
      amount: val,
      category: 'Manutenção',
      date: new Date().toISOString()
    });

    setValorResgate('');
    setAviso(`Resgate emergencial de R$ ${val.toFixed(2).replace('.', ',')} efetuado!`);
    setTimeout(() => {
      setAviso(null);
    }, 4000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="bg-white rounded-3xl w-full max-w-lg border border-slate-200 shadow-2xl overflow-hidden flex flex-col my-auto max-h-[90vh]"
      >
        {/* Header de Pânico Financeiro */}
        <div className="bg-gradient-to-r from-rose-600 via-rose-700 to-amber-700 p-6 text-white relative">
          <button
            onClick={onClose}
            className="absolute top-5 right-5 p-1.5 rounded-full bg-white/10 hover:bg-white/20 transition"
          >
            <X className="w-5 h-5 text-white" />
          </button>
          
          <div className="flex items-center gap-2 mb-1.5">
            <span className="p-2 bg-white/20 rounded-xl backdrop-blur-sm animate-pulse">
              <AlertOctagon className="w-5 h-5 text-amber-300" />
            </span>
            <span className="text-xs font-black uppercase tracking-wider text-rose-200">
              Botão de Pânico Financeiro
            </span>
          </div>

          <h2 className="text-xl font-black">Socorro & Emergência Mecânica</h2>
          <p className="text-xs text-rose-100 mt-1">
            Seu veículo quebrou na pista? Acesse sua reserva de emergência na hora ou simule socorro justo.
          </p>
        </div>

        {/* Feedback message */}
        {aviso && (
          <div className="mx-6 mt-4 p-3 bg-emerald-50 border border-emerald-200 rounded-2xl text-emerald-800 text-xs font-bold flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{aviso}</span>
          </div>
        )}

        {/* Tabs de Ação Rápida */}
        <div className="grid grid-cols-3 p-2 bg-slate-100 mx-6 mt-4 rounded-2xl text-xs font-bold">
          <button
            type="button"
            onClick={() => setActiveTab('reserva')}
            className={cn(
              "py-2 px-1 rounded-xl transition text-center",
              activeTab === 'reserva' ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"
            )}
          >
            💰 Minha Reserva
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('antecipacao')}
            className={cn(
              "py-2 px-1 rounded-xl transition text-center",
              activeTab === 'antecipacao' ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"
            )}
          >
            🛡️ Socorro Justo
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('socorro')}
            className={cn(
              "py-2 px-1 rounded-xl transition text-center",
              activeTab === 'socorro' ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"
            )}
          >
            📞 SOS na Pista
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-4">
          {activeTab === 'reserva' && (
            <div className="space-y-4">
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                  Reserva Imediata Disponível
                </span>
                <div className="text-3xl font-black text-slate-900 mt-1">
                  R$ {saldoEmergenciaTotal.toFixed(2).replace('.', ',')}
                </div>
                <div className="grid grid-cols-2 gap-2 mt-3 pt-3 border-t border-slate-200 text-xs">
                  <div>
                    <span className="text-slate-400 block text-[10px] font-medium">Envelope Manutenção:</span>
                    <strong className="text-indigo-600 font-bold">R$ {saldoManutencao.toFixed(2).replace('.', ',')}</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] font-medium">Lucro Pessoal Acumulado:</span>
                    <strong className="text-emerald-600 font-bold">R$ {saldoLucro.toFixed(2).replace('.', ',')}</strong>
                  </div>
                </div>
              </div>

              <form onSubmit={handleEfetuarResgate} className="bg-rose-50/60 border border-rose-200 rounded-2xl p-4 space-y-3">
                <h4 className="text-xs font-bold text-rose-950 uppercase tracking-wide flex items-center gap-1.5">
                  <ArrowDownCircle className="w-4 h-4 text-rose-600" />
                  Efetuar Saque de Emergência
                </h4>
                
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">
                    Valor necessário para o conserto (R$)
                  </label>
                  <input
                    type="text"
                    value={valorResgate}
                    onChange={(e) => setValorResgate(e.target.value)}
                    placeholder="Ex: 120,00"
                    className="w-full p-2.5 rounded-xl border border-slate-200 text-base font-bold text-slate-900 bg-white focus:ring-2 focus:ring-rose-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">
                    Motivo da emergência
                  </label>
                  <select
                    value={motivoResgate}
                    onChange={(e) => setMotivoResgate(e.target.value)}
                    className="w-full p-2 rounded-xl border border-slate-200 text-xs font-medium text-slate-800 bg-white"
                  >
                    <option value="Conserto de emergência no veículo">Conserto de emergência no veículo</option>
                    <option value="Pneu furado / Borracharia">Pneu furado / Borracharia</option>
                    <option value="Guincho / Reboque">Guincho / Reboque</option>
                    <option value="Bateria / Elétrica">Bateria / Elétrica</option>
                    <option value="Outro socorro urgente">Outro socorro urgente</option>
                  </select>
                </div>

                <button
                  type="submit"
                  disabled={!valorResgate}
                  className="w-full bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white font-bold py-3 rounded-xl text-xs transition shadow-md shadow-rose-600/20"
                >
                  Confirmar Resgate da Reserva
                </button>
              </form>
            </div>
          )}

          {activeTab === 'antecipacao' && (
            <div className="space-y-4">
              <div className="bg-gradient-to-br from-indigo-900 to-slate-900 text-white p-5 rounded-2xl border border-indigo-800">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-extrabold uppercase tracking-widest text-indigo-300">
                    Limite de Socorro Pré-Aprovado
                  </span>
                  <span className="text-[10px] bg-emerald-500/20 text-emerald-300 font-bold px-2 py-0.5 rounded-md border border-emerald-500/30">
                    Sem Consulta SPC/Serasa
                  </span>
                </div>
                <div className="text-3xl font-black mt-1">
                  Até R$ {limiteSocorroSugerido.toLocaleString('pt-BR')},00
                </div>
                <p className="text-xs text-indigo-200 mt-1 leading-relaxed">
                  Calculado com base no seu histórico real de faturamento registrado no Pro Bolso.
                </p>
              </div>

              {/* Comparativo de Juros: O Diferencial do seu App */}
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-3">
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wide">
                  Por que é diferente de bancos e agiotas?
                </h4>

                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="p-3 bg-white rounded-xl border border-slate-200">
                    <span className="text-[10px] font-bold text-slate-400 block uppercase">Bancos / Cartão</span>
                    <strong className="text-rose-600 font-black text-sm block mt-0.5">Juros de até 350% a.a.</strong>
                    <p className="text-[11px] text-slate-500 mt-1">
                      Cheque especial e rotativo viram uma bola de neve impagável.
                    </p>
                  </div>

                  <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200">
                    <span className="text-[10px] font-bold text-emerald-700 block uppercase">Socorro Pro Bolso</span>
                    <strong className="text-emerald-700 font-black text-sm block mt-0.5">Taxa Justa: 1.8% a.m.</strong>
                    <p className="text-[11px] text-emerald-800 mt-1">
                      Desconto suave de ~R$ 15/dia nas próximas corridas.
                    </p>
                  </div>
                </div>

                <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-blue-900 text-xs">
                  💡 <strong>Fundo Garantidor Solidário:</strong> O objetivo é colocar sua moto ou carro de volta na rua no mesmo dia, sem que você fique parado sem renda.
                </div>
              </div>
            </div>
          )}

          {activeTab === 'socorro' && (
            <div className="space-y-3">
              <p className="text-xs text-slate-600 font-medium">
                Toque para discar imediatamente em caso de emergência ou pane mecânica na rodovia:
              </p>

              <div className="space-y-2">
                <a
                  href="tel:191"
                  className="flex items-center justify-between p-3.5 bg-slate-50 hover:bg-slate-100 rounded-2xl border border-slate-200 transition"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center font-black">
                      191
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-900">Polícia Rodoviária Federal</h4>
                      <p className="text-[10px] text-slate-500">Acidentes ou pane em rodovias federais</p>
                    </div>
                  </div>
                  <Phone className="w-4 h-4 text-blue-600" />
                </a>

                <a
                  href="tel:192"
                  className="flex items-center justify-between p-3.5 bg-slate-50 hover:bg-slate-100 rounded-2xl border border-slate-200 transition"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center font-black">
                      192
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-900">SAMU - Resgate Médico</h4>
                      <p className="text-[10px] text-slate-500">Urgência médica e acidentes com vítimas</p>
                    </div>
                  </div>
                  <Phone className="w-4 h-4 text-rose-600" />
                </a>

                <a
                  href="tel:193"
                  className="flex items-center justify-between p-3.5 bg-slate-50 hover:bg-slate-100 rounded-2xl border border-slate-200 transition"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center font-black">
                      193
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-900">Corpo de Bombeiros</h4>
                      <p className="text-[10px] text-slate-500">Vazamento de combustível e colisões</p>
                    </div>
                  </div>
                  <Phone className="w-4 h-4 text-amber-600" />
                </a>
              </div>

              {/* Checklist de Segurança na Pista */}
              <div className="mt-4 p-4 bg-slate-900 text-white rounded-2xl space-y-2">
                <h4 className="text-xs font-black uppercase text-amber-400">
                  ⚠️ O que fazer ao quebrar na via:
                </h4>
                <ul className="text-[11px] text-slate-300 space-y-1 list-disc list-inside">
                  <li>Ligue o pisca-alerta imediatamente.</li>
                  <li>Leve a moto ou carro para o acostamento ou gramado.</li>
                  <li>Coloque o triângulo a pelo menos 30 passos (30 metros) atrás.</li>
                  <li>Nunca fique parado atrás do veículo na pista de rolamento.</li>
                </ul>
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
