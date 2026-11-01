import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Tag, Fuel, Wrench, Coffee, ShieldCheck, Copy, Check, DollarSign, Sparkles, ExternalLink, PlusCircle } from 'lucide-react';
import { useStore } from '@/store';
import { cn } from '@/lib/utils';

interface ParceriaItem {
  id: string;
  nome: string;
  categoria: 'Combustível' | 'Oficinas & Peças' | 'Alimentação' | 'Seguros';
  beneficio: string;
  descricao: string;
  cupom: string;
  icone: any;
  corBadge: string;
  economiaEstimada: string;
}

const listaParcerias: ParceriaItem[] = [
  {
    id: 'shell',
    nome: 'Shell Box',
    categoria: 'Combustível',
    beneficio: 'R$ 0,20 de desconto por litro',
    descricao: 'Válido em todos os postos Shell credenciados para gasolina, etanol e aditivada.',
    cupom: 'PROBOLSO20',
    icone: Fuel,
    corBadge: 'bg-amber-100 text-amber-800 border-amber-200',
    economiaEstimada: '~R$ 50 a R$ 80/mês'
  },
  {
    id: 'ipiranga',
    nome: 'Ipiranga / Abastece Aí & GNV',
    categoria: 'Combustível',
    beneficio: '5% de cashback + R$ 0,15/L',
    descricao: 'Economia direta no abastecimento de carros e motos ou conversão GNV.',
    cupom: 'IPIRANGA-PRO',
    icone: Fuel,
    corBadge: 'bg-blue-100 text-blue-800 border-blue-200',
    economiaEstimada: '~R$ 45 a R$ 75/mês'
  },
  {
    id: 'autopecas',
    nome: 'Rede Nacional de Auto e Motopeças',
    categoria: 'Oficinas & Peças',
    beneficio: '18% OFF em pastilhas, óleo e pneus',
    descricao: 'Peças de alta durabilidade com desconto especial para motoristas do Pro Bolso.',
    cupom: 'PECAS18PRO',
    icone: Wrench,
    corBadge: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    economiaEstimada: '~R$ 60 por troca'
  },
  {
    id: 'trocarapida',
    nome: 'Centro Automotivo & Troca Rápida de Óleo',
    categoria: 'Oficinas & Peças',
    beneficio: 'Mão de obra grátis + 20% no filtro',
    descricao: 'Troque o óleo do motor sem pagar pelo serviço de oficina. Rápido e sem fila.',
    cupom: 'MAODEOBRAPRO',
    icone: Wrench,
    corBadge: 'bg-indigo-100 text-indigo-800 border-indigo-200',
    economiaEstimada: 'R$ 35 de economia imediata'
  },
  {
    id: 'lanches',
    nome: 'Conveniências & Lanches de Rota',
    categoria: 'Alimentação',
    beneficio: '25% OFF em combos de café e almoço',
    descricao: 'Alimente-se bem sem gastar todo o lucro do dia na rua.',
    cupom: 'ROTA25LANCHE',
    icone: Coffee,
    corBadge: 'bg-rose-100 text-rose-800 border-rose-200',
    economiaEstimada: '~R$ 40/semana'
  },
  {
    id: 'guincho',
    nome: 'Assistência 24h & Guincho Parceiro',
    categoria: 'Seguros',
    beneficio: '1º Guincho com 50% de desconto',
    descricao: 'Socorro rápido com guincho plataforma e reboque de moto em até 35 minutos.',
    cupom: 'SOSGUINCHO50',
    icone: ShieldCheck,
    corBadge: 'bg-purple-100 text-purple-800 border-purple-200',
    economiaEstimada: 'R$ 90 de economia'
  }
];

export function Parcerias() {
  const { economias, registrarEconomia } = useStore();
  const [categoriaAtiva, setCategoriaAtiva] = useState<string>('Todos');
  const [cupomCopiado, setCupomCopiado] = useState<string | null>(null);
  const [modalEconomia, setModalEconomia] = useState<{ isOpen: boolean; parceiro: string; categoria: string }>({
    isOpen: false,
    parceiro: '',
    categoria: ''
  });
  const [valorEconomizadoInput, setValorEconomizadoInput] = useState('');

  const totalEconomizado = economias.reduce((acc, curr) => acc + curr.valorEconomizado, 0);

  const categorias = ['Todos', 'Combustível', 'Oficinas & Peças', 'Alimentação', 'Seguros'];

  const parceriasFiltradas = categoriaAtiva === 'Todos'
    ? listaParcerias
    : listaParcerias.filter(p => p.categoria === categoriaAtiva);

  const handleCopiarCupom = (cupom: string) => {
    navigator.clipboard.writeText(cupom);
    setCupomCopiado(cupom);
    setTimeout(() => setCupomCopiado(null), 2500);
  };

  const handleSalvarEconomia = (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseFloat(valorEconomizadoInput.replace(',', '.'));
    if (!isNaN(val) && val > 0) {
      registrarEconomia(modalEconomia.parceiro, modalEconomia.categoria, val);
      setValorEconomizadoInput('');
      setModalEconomia({ isOpen: false, parceiro: '', categoria: '' });
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6 pb-32 mt-2"
    >
      {/* Placar de Economia Real */}
      <div className="bg-gradient-to-br from-emerald-600 via-teal-700 to-slate-900 rounded-3xl p-6 text-white shadow-lg relative overflow-hidden">
        <div className="absolute right-0 top-0 p-6 opacity-10">
          <Tag className="w-32 h-32" />
        </div>
        
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-1">
            <span className="p-1.5 bg-white/20 rounded-lg backdrop-blur-sm">
              <Sparkles className="w-4 h-4 text-amber-300" />
            </span>
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-emerald-200">
              Seu App Gera Economia Real
            </span>
          </div>

          <h2 className="text-3xl font-black tracking-tight mt-1">
            R$ {totalEconomizado.toFixed(2).replace('.', ',')}
          </h2>
          <p className="text-xs text-emerald-100 mt-1 max-w-sm font-medium">
            Economia total acumulada usando nossos cupons de combustível, autopeças e oficinas.
          </p>

          <div className="mt-4 pt-3 border-t border-white/10 flex flex-wrap items-center justify-between gap-2">
            <span className="text-[11px] font-bold text-emerald-200 flex items-center gap-1.5">
              <Check className="w-3.5 h-3.5 text-amber-300" />
              O Pro Bolso se paga no 1º abastecimento do mês!
            </span>
            <button
              onClick={() => setModalEconomia({ isOpen: true, parceiro: 'Shell Box', categoria: 'Combustível' })}
              className="bg-white hover:bg-emerald-50 text-slate-900 text-xs font-bold px-3 py-1.5 rounded-xl transition flex items-center gap-1 shadow-sm"
            >
              <PlusCircle className="w-3.5 h-3.5 text-emerald-600" />
              Registrar Economia
            </button>
          </div>
        </div>
      </div>

      {/* Filtros de Categorias */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 disable-scrollbar">
        {categorias.map(cat => (
          <button
            key={cat}
            onClick={() => setCategoriaAtiva(cat)}
            className={cn(
              "px-3.5 py-2 rounded-2xl text-xs font-bold whitespace-nowrap transition",
              categoriaAtiva === cat
                ? "bg-slate-900 text-white shadow-sm"
                : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
            )}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Lista de Parceiros e Cupons */}
      <div className="space-y-4">
        {parceriasFiltradas.map(p => {
          const Icon = p.icone;
          const isCopied = cupomCopiado === p.cupom;

          return (
            <div
              key={p.id}
              className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm hover:shadow-md transition flex flex-col justify-between gap-4"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <div className="p-3 bg-slate-100 rounded-2xl text-slate-800 shrink-0">
                    <Icon className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-slate-900 text-base">{p.nome}</h3>
                      <span className={cn("text-[10px] font-extrabold px-2 py-0.5 rounded-full border", p.corBadge)}>
                        {p.categoria}
                      </span>
                    </div>
                    <p className="text-sm font-bold text-emerald-600 mt-0.5">
                      {p.beneficio}
                    </p>
                    <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                      {p.descricao}
                    </p>
                  </div>
                </div>

                <div className="hidden sm:block text-right shrink-0">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">
                    Economia média
                  </span>
                  <span className="text-xs font-black text-slate-700">
                    {p.economiaEstimada}
                  </span>
                </div>
              </div>

              {/* Barra do Cupom */}
              <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-3 flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-400 uppercase">Cupom:</span>
                  <span className="font-mono text-sm font-black text-slate-900 tracking-wider bg-white px-2.5 py-1 rounded-lg border border-slate-200">
                    {p.cupom}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleCopiarCupom(p.cupom)}
                    className={cn(
                      "text-xs font-bold px-3 py-1.5 rounded-xl transition flex items-center gap-1.5 shadow-sm",
                      isCopied ? "bg-emerald-600 text-white" : "bg-slate-900 hover:bg-slate-800 text-white"
                    )}
                  >
                    {isCopied ? (
                      <>
                        <Check className="w-3.5 h-3.5" />
                        Copiado!
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        Copiar Cupom
                      </>
                    )}
                  </button>

                  <button
                    onClick={() => setModalEconomia({ isOpen: true, parceiro: p.nome, categoria: p.categoria })}
                    className="text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 px-3 py-1.5 rounded-xl transition flex items-center gap-1"
                    title="Anotar economia gerada por este cupom"
                  >
                    <DollarSign className="w-3.5 h-3.5" />
                    Registrar Uso
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal Registrar Economia */}
      <AnimatePresence>
        {modalEconomia.isOpen && (
          <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-3xl p-6 w-full max-w-sm border border-slate-200 shadow-2xl"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-emerald-100 text-emerald-700 rounded-xl">
                    <DollarSign className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 text-base">Registrar Economia</h3>
                    <p className="text-xs text-slate-500">{modalEconomia.parceiro}</p>
                  </div>
                </div>
              </div>

              <form onSubmit={handleSalvarEconomia} className="space-y-4">
                <div>
                  <label className="text-xs font-bold text-slate-600 block mb-1">
                    Quanto você economizou nessa compra/abastecimento? (R$)
                  </label>
                  <input
                    type="text"
                    value={valorEconomizadoInput}
                    onChange={(e) => setValorEconomizadoInput(e.target.value)}
                    placeholder="Ex: 15,50"
                    className="w-full p-3 rounded-xl border border-slate-200 text-lg font-bold text-emerald-600 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    autoFocus
                  />
                  <span className="text-[10px] text-slate-400 mt-1 block">
                    Esse valor será somado ao placar de lucro e economia do seu mês!
                  </span>
                </div>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setModalEconomia({ isOpen: false, parceiro: '', categoria: '' })}
                    className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold py-3 rounded-xl transition"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold py-3 rounded-xl transition shadow-md shadow-emerald-600/20"
                  >
                    Salvar Economia
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
