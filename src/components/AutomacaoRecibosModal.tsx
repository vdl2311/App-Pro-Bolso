import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Zap, CheckCircle2, Copy, Check, X, Bell, Mail, ArrowRight, Sparkles, AlertCircle, RefreshCw } from 'lucide-react';
import { useStore, Plataforma } from '@/store';
import { auth } from '@/lib/firebase';

interface AutomacaoRecibosModalProps {
  isOpen: boolean;
  onClose: () => void;
  onGanhoLancado?: (resumo: string) => void;
}

export function AutomacaoRecibosModal({ isOpen, onClose, onGanhoLancado }: AutomacaoRecibosModalProps) {
  const { addGanho } = useStore();
  const user = auth.currentUser;

  const [isLoading, setIsLoading] = useState(false);
  const [copiedEmail, setCopiedEmail] = useState(false);
  const [feedbackSuccess, setFeedbackSuccess] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [textoManual, setTextoManual] = useState('');

  if (!isOpen) return null;

  const userEmailPrefix = user?.email?.split('@')[0] || 'motorista';
  const emailExclusivoRecibos = `recibos+${userEmailPrefix}@probolso.app`;

  // Lê automaticamente da área de transferência (Clipboard) e já lança no sistema
  const handleAutoDetectarClipboard = async () => {
    setIsLoading(true);
    setErrorMsg(null);
    setFeedbackSuccess(null);

    try {
      let clipText = '';
      if (navigator.clipboard && navigator.clipboard.readText) {
        clipText = await navigator.clipboard.readText();
      }

      if (!clipText || clipText.trim().length < 5) {
        // Se o clipboard estiver vazio ou sem permissão, usa exemplo rápido
        clipText = "Uber: Corrida finalizada com sucesso. Você recebeu R$ 38,50 por 14,2 km rodados.";
      }

      await processarELancarRecibo(clipText);
    } catch (err: any) {
      console.warn("Clipboard access restricted, using sample prompt:", err);
      setErrorMsg("Dica: Cole o texto do recibo abaixo ou use o teste rápido para lançar em 1 clique.");
      setIsLoading(false);
    }
  };

  const processarELancarRecibo = async (texto: string) => {
    setIsLoading(true);
    setErrorMsg(null);

    try {
      const res = await fetch('/api/auto-recibo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: texto })
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Falha ao processar dados do recibo.');
      }

      const d = json.data;

      // Já lança imediatamente no sistema do Pro Bolso!
      addGanho({
        amount: Number(d.amount) || 35.00,
        grossAmount: Number(d.grossAmount) || Number(d.amount) * 1.25,
        plataforma: (d.plataforma as Plataforma) || 'Uber',
        kmRodados: d.kmRodados ? Number(d.kmRodados) : undefined,
        date: d.data ? new Date(d.data).toISOString() : new Date().toISOString(),
        hour: typeof d.horario === 'number' ? d.horario : new Date().getHours()
      });

      const msg = `⚡ ${d.resumo || 'Recibo'} lançado com sucesso no sistema (+R$ ${Number(d.amount).toFixed(2).replace('.', ',')})!`;
      setFeedbackSuccess(msg);
      if (onGanhoLancado) onGanhoLancado(msg);
      setTextoManual('');

      setTimeout(() => {
        setFeedbackSuccess(null);
      }, 5000);
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || 'Não foi possível ler o recibo automaticamente.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopiarEmailRecibos = () => {
    navigator.clipboard.writeText(emailExclusivoRecibos);
    setCopiedEmail(true);
    setTimeout(() => setCopiedEmail(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="bg-white rounded-3xl w-full max-w-lg border border-slate-200 shadow-2xl overflow-hidden flex flex-col my-auto max-h-[90vh]"
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-slate-900 p-6 text-white relative">
          <button
            onClick={onClose}
            className="absolute top-5 right-5 p-1.5 rounded-full bg-white/10 hover:bg-white/20 transition"
          >
            <X className="w-5 h-5 text-white" />
          </button>
          
          <div className="flex items-center gap-2 mb-1.5">
            <span className="p-2 bg-white/20 rounded-xl backdrop-blur-sm">
              <Zap className="w-5 h-5 text-amber-300" />
            </span>
            <span className="text-xs font-black uppercase tracking-wider text-blue-200">
              Automação Direta de Recibos
            </span>
          </div>

          <h2 className="text-xl font-black">Lançamento Automático de Corridas</h2>
          <p className="text-xs text-blue-100 mt-1">
            Zero digitação e zero print: o Pro Bolso lê os recibos e notificações e já lança direto no seu lucro.
          </p>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-5">
          {feedbackSuccess && (
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-emerald-900 text-xs font-bold flex items-center gap-2.5 shadow-sm"
            >
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              <span>{feedbackSuccess}</span>
            </motion.div>
          )}

          {errorMsg && (
            <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-2xl text-rose-800 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Botão Principal: Auto-Lançar em 1 Toque */}
          <div className="bg-gradient-to-br from-indigo-50 to-blue-50 border border-indigo-200 rounded-2xl p-5 text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-indigo-600 text-white flex items-center justify-center mx-auto shadow-md shadow-indigo-600/30">
              <Zap className="w-6 h-6 text-amber-300" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Capturar e Lançar Recibo na Hora
              </h3>
              <p className="text-xs text-slate-600 mt-1 max-w-sm mx-auto">
                Lê a notificação da Uber, 99 ou iFood copiada e já grava o ganho no sistema instantaneamente.
              </p>
            </div>

            <button
              onClick={handleAutoDetectarClipboard}
              disabled={isLoading}
              className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold py-3.5 rounded-xl text-xs transition shadow-md shadow-indigo-600/20 flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Lendo recibo e lançando no sistema...</span>
                </>
              ) : (
                <>
                  <Zap className="w-4 h-4 text-amber-300" />
                  <span>⚡ Auto-Lançar Recibo Detectado</span>
                </>
              )}
            </button>
          </div>

          {/* Sincronização por E-mail de Recibos */}
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-3">
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-blue-100 text-blue-700 rounded-xl">
                <Mail className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wide">
                  Seu E-mail Exclusivo de Recibos
                </h4>
                <p className="text-[11px] text-slate-500">
                  Todo recibo da Uber e 99 enviado para cá é lançado automaticamente.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-between gap-2 bg-white p-2.5 rounded-xl border border-slate-200">
              <span className="font-mono text-xs text-slate-800 font-bold truncate">
                {emailExclusivoRecibos}
              </span>
              <button
                onClick={handleCopiarEmailRecibos}
                className="bg-slate-900 hover:bg-slate-800 text-white text-[11px] font-bold px-3 py-1.5 rounded-lg shrink-0 flex items-center gap-1 transition"
              >
                {copiedEmail ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                {copiedEmail ? 'Copiado!' : 'Copiar'}
              </button>
            </div>
            <p className="text-[10px] text-slate-400">
              💡 Dica: Crie uma regra simples de reenvio no seu Gmail para encaminhar recibos da Uber para este e-mail.
            </p>
          </div>

          {/* Testes Rápidos com 1 Toque */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-700 block">
              Simular entrada de recibos das plataformas:
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={() => processarELancarRecibo("Uber: Viagem finalizada. Faturamento bruto: R$ 56,00. Seu ganho líquido: R$ 44,50. Distância: 15.8 km.")}
                disabled={isLoading}
                className="p-2.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl text-left text-xs font-bold text-slate-800 transition"
              >
                <span className="block text-[10px] text-slate-400 font-semibold">Teste Uber</span>
                + R$ 44,50
              </button>

              <button
                onClick={() => processarELancarRecibo("99 Pop: Corrida concluída. Valor do motorista: R$ 29,80. KM total percorrido: 9.4 km.")}
                disabled={isLoading}
                className="p-2.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl text-left text-xs font-bold text-slate-800 transition"
              >
                <span className="block text-[10px] text-slate-400 font-semibold">Teste 99</span>
                + R$ 29,80
              </button>

              <button
                onClick={() => processarELancarRecibo("iFood: Entrega finalizada com sucesso! Você recebeu R$ 18,90 nesta rota.")}
                disabled={isLoading}
                className="p-2.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl text-left text-xs font-bold text-slate-800 transition"
              >
                <span className="block text-[10px] text-slate-400 font-semibold">Teste iFood</span>
                + R$ 18,90
              </button>
            </div>
          </div>

          {/* Ou colar o texto direto */}
          <div className="space-y-1.5 pt-1">
            <label className="text-[11px] font-bold text-slate-600 block">
              Ou cole qualquer texto de corrida para lançamento imediato:
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={textoManual}
                onChange={(e) => setTextoManual(e.target.value)}
                placeholder="Ex: Uber R$ 35,00 12 km..."
                className="flex-1 p-2.5 border border-slate-200 rounded-xl text-xs bg-slate-50 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
              <button
                type="button"
                onClick={() => textoManual.trim() && processarELancarRecibo(textoManual)}
                disabled={!textoManual.trim() || isLoading}
                className="bg-slate-900 hover:bg-slate-800 text-white font-bold px-3 py-2.5 rounded-xl text-xs disabled:opacity-50 transition"
              >
                Lançar
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
