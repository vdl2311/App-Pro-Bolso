import React, { useState, useRef } from 'react';
import { motion } from 'motion/react';
import { Camera, Upload, Sparkles, Check, X, AlertCircle, FileText, ArrowRight } from 'lucide-react';
import { useStore, Plataforma } from '@/store';

interface OcrGanhoModalProps {
  isOpen: boolean;
  onClose: () => void;
  onGanhoAdicionado?: () => void;
}

export function OcrGanhoModal({ isOpen, onClose, onGanhoAdicionado }: OcrGanhoModalProps) {
  const { addGanho } = useStore();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [activeTab, setActiveTab] = useState<'print' | 'texto'>('print');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [mimeType, setMimeType] = useState<string>('image/jpeg');
  const [textoNotificacao, setTextoNotificacao] = useState('');
  
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [extractedData, setExtractedData] = useState<{
    plataforma: Plataforma;
    amount: number;
    grossAmount: number;
    kmRodados: number | null;
    corridasCount: number;
    horario: number;
    data: string;
    resumo: string;
  } | null>(null);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setErrorMsg('Por favor, selecione um arquivo de imagem (PNG, JPG, etc).');
      return;
    }

    setMimeType(file.type);
    setErrorMsg(null);

    const reader = new FileReader();
    reader.onload = () => {
      setSelectedImage(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    const items = e.clipboardData?.items;
    if (items) {
      for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf('image') !== -1) {
          const blob = items[i].getAsFile();
          if (blob) {
            setMimeType(blob.type);
            const reader = new FileReader();
            reader.onload = () => setSelectedImage(reader.result as string);
            reader.readAsDataURL(blob);
            return;
          }
        }
      }
    }
  };

  const handleProcessar = async () => {
    if (activeTab === 'print' && !selectedImage) {
      setErrorMsg('Selecione ou cole um print da tela do aplicativo.');
      return;
    }
    if (activeTab === 'texto' && !textoNotificacao.trim()) {
      setErrorMsg('Cole o texto da notificação ou extrato.');
      return;
    }

    setIsLoading(true);
    setErrorMsg(null);

    try {
      const payload: any = {};
      if (activeTab === 'print' && selectedImage) {
        payload.image = selectedImage;
        payload.mimeType = mimeType;
      } else {
        payload.text = textoNotificacao;
      }

      const res = await fetch('/api/ocr-ganhos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Não foi possível ler o print.');
      }

      const d = json.data;
      setExtractedData({
        plataforma: (d.plataforma as Plataforma) || 'Uber',
        amount: Number(d.amount) || 0,
        grossAmount: Number(d.grossAmount) || Number(d.amount) || 0,
        kmRodados: d.kmRodados ? Number(d.kmRodados) : null,
        corridasCount: d.corridasCount ? Number(d.corridasCount) : 1,
        horario: typeof d.horario === 'number' ? d.horario : new Date().getHours(),
        data: d.data || new Date().toISOString().split('T')[0],
        resumo: d.resumo || 'Corrida identificada com sucesso'
      });
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || 'Falha na leitura. Verifique se a imagem está legível.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleConfirmarGanho = () => {
    if (!extractedData) return;

    addGanho({
      amount: extractedData.amount,
      grossAmount: extractedData.grossAmount,
      plataforma: extractedData.plataforma,
      kmRodados: extractedData.kmRodados ?? undefined,
      date: new Date().toISOString(),
      hour: extractedData.horario
    });

    if (onGanhoAdicionado) onGanhoAdicionado();
    handleReset();
    onClose();
  };

  const handleReset = () => {
    setSelectedImage(null);
    setTextoNotificacao('');
    setExtractedData(null);
    setErrorMsg(null);
  };

  return (
    <div 
      onPaste={handlePaste}
      className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto"
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="bg-white rounded-3xl w-full max-w-lg border border-slate-200 shadow-2xl overflow-hidden flex flex-col my-auto max-h-[90vh]"
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-600 to-teal-700 p-6 text-white relative">
          <button
            onClick={() => { handleReset(); onClose(); }}
            className="absolute top-5 right-5 p-1.5 rounded-full bg-white/10 hover:bg-white/20 transition"
          >
            <X className="w-5 h-5 text-white" />
          </button>
          <div className="flex items-center gap-2.5 mb-1.5">
            <div className="p-2 bg-white/20 rounded-xl backdrop-blur-sm">
              <Sparkles className="w-5 h-5 text-amber-300" />
            </div>
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-100">
              Automação Inteligente (OCR)
            </span>
          </div>
          <h2 className="text-xl font-bold">Lançar Ganho via Print do App</h2>
          <p className="text-xs text-emerald-100 mt-1">
            Economize tempo: suba o print do Uber, 99 ou iFood que a IA extrai valor, taxas e KM em segundos!
          </p>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-4">
          {errorMsg && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
              <span>{errorMsg}</span>
            </div>
          )}

          {!extractedData ? (
            <>
              {/* Tabs */}
              <div className="grid grid-cols-2 p-1 bg-slate-100 rounded-2xl text-xs font-bold">
                <button
                  type="button"
                  onClick={() => setActiveTab('print')}
                  className={`py-2 rounded-xl transition ${
                    activeTab === 'print' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  📸 Subir Print / Foto
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('texto')}
                  className={`py-2 rounded-xl transition ${
                    activeTab === 'texto' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  📋 Colar Notificação
                </button>
              </div>

              {activeTab === 'print' ? (
                <div className="space-y-3">
                  <input
                    type="file"
                    ref={fileInputRef}
                    accept="image/*"
                    onChange={handleFileChange}
                    className="hidden"
                  />

                  {selectedImage ? (
                    <div className="relative rounded-2xl border-2 border-emerald-300 bg-slate-50 p-3 flex flex-col items-center">
                      <img
                        src={selectedImage}
                        alt="Print selecionado"
                        className="max-h-56 object-contain rounded-xl shadow-sm"
                      />
                      <button
                        onClick={() => setSelectedImage(null)}
                        className="mt-3 text-xs font-bold text-rose-600 hover:text-rose-700 flex items-center gap-1"
                      >
                        <X className="w-3.5 h-3.5" /> Trocar imagem
                      </button>
                    </div>
                  ) : (
                    <div
                      onClick={() => fileInputRef.current?.click()}
                      className="border-2 border-dashed border-slate-300 hover:border-emerald-500 rounded-2xl p-8 flex flex-col items-center justify-center gap-3 cursor-pointer transition bg-slate-50/50 hover:bg-emerald-50/30 text-center"
                    >
                      <div className="w-14 h-14 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center shadow-inner">
                        <Upload className="w-7 h-7" />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-slate-800">
                          Toque para escolher o print
                        </p>
                        <p className="text-xs text-slate-500 mt-1">
                          Ou cole a imagem diretamente aqui (Ctrl + V)
                        </p>
                      </div>
                      <span className="text-[10px] text-slate-400 bg-white border border-slate-200 px-2.5 py-1 rounded-full font-medium">
                        Suporta prints de Uber, 99, iFood, inDrive e outros
                      </span>
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-700">
                    Cole o texto da notificação ou extrato recebido:
                  </label>
                  <textarea
                    value={textoNotificacao}
                    onChange={(e) => setTextoNotificacao(e.target.value)}
                    placeholder="Exemplo: Uber: Você recebeu R$ 38,50 pela viagem de 12.4 km concluída às 14:30."
                    rows={4}
                    className="w-full p-3.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm resize-none bg-slate-50 font-sans"
                  />
                </div>
              )}

              <button
                type="button"
                onClick={handleProcessar}
                disabled={isLoading || (activeTab === 'print' && !selectedImage) || (activeTab === 'texto' && !textoNotificacao.trim())}
                className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold py-3.5 rounded-2xl text-sm transition shadow-md shadow-emerald-600/20 flex items-center justify-center gap-2 mt-4"
              >
                {isLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Lendo print com Inteligência Artificial...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>Extrair Dados Automaticamente</span>
                  </>
                )}
              </button>
            </>
          ) : (
            /* Resultado da Leitura com opção de ajuste e confirmação */
            <div className="space-y-4">
              <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 flex items-start gap-3">
                <div className="p-2 bg-emerald-600 text-white rounded-xl">
                  <Check className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-emerald-950">
                    Dados Extraídos com Sucesso!
                  </h4>
                  <p className="text-xs text-emerald-800 mt-0.5">
                    {extractedData.resumo}. Você pode ajustar os valores abaixo se desejar:
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-600 block mb-1">
                    Plataforma
                  </label>
                  <select
                    value={extractedData.plataforma}
                    onChange={(e) => setExtractedData({ ...extractedData, plataforma: e.target.value as Plataforma })}
                    className="w-full p-2.5 rounded-xl border border-slate-200 bg-white text-sm font-bold text-slate-800 focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="Uber">Uber</option>
                    <option value="99">99</option>
                    <option value="iFood">iFood</option>
                    <option value="inDrive">inDrive</option>
                    <option value="Lalamove">Lalamove</option>
                    <option value="Particular">Particular</option>
                    <option value="Outro">Outro</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-600 block mb-1">
                    Valor Líquido (R$)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={extractedData.amount}
                    onChange={(e) => setExtractedData({ ...extractedData, amount: parseFloat(e.target.value) || 0 })}
                    className="w-full p-2.5 rounded-xl border border-slate-200 bg-white text-sm font-bold text-emerald-600 focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-600 block mb-1">
                    Valor Bruto / Total (R$)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={extractedData.grossAmount}
                    onChange={(e) => setExtractedData({ ...extractedData, grossAmount: parseFloat(e.target.value) || 0 })}
                    className="w-full p-2.5 rounded-xl border border-slate-200 bg-white text-sm text-slate-700 focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-600 block mb-1">
                    KM Rodados
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={extractedData.kmRodados ?? ''}
                    placeholder="Opcional"
                    onChange={(e) => setExtractedData({ ...extractedData, kmRodados: e.target.value ? parseFloat(e.target.value) : null })}
                    className="w-full p-2.5 rounded-xl border border-slate-200 bg-white text-sm text-slate-700 focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              {extractedData.kmRodados && (
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 text-xs text-blue-800 flex items-center gap-2">
                  <ArrowRight className="w-4 h-4 text-blue-600 shrink-0" />
                  <span>
                    Os <strong>{extractedData.kmRodados} km</strong> serão somados automaticamente ao odômetro para controle da manutenção do veículo!
                  </span>
                </div>
              )}

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={handleReset}
                  className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-3 rounded-xl text-sm transition"
                >
                  Ler Outro Print
                </button>
                <button
                  type="button"
                  onClick={handleConfirmarGanho}
                  className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 rounded-xl text-sm transition shadow-md shadow-emerald-600/20 flex items-center justify-center gap-2"
                >
                  <Check className="w-4 h-4" />
                  Confirmar e Salvar
                </button>
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
