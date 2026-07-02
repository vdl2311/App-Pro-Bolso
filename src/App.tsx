/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { TabType } from './types';
import { Dashboard } from './components/Dashboard';
import { Envelopes } from './components/Envelopes';
import { Ganhos } from './components/Ganhos';
import { Fiscal } from './components/Fiscal';
import { Login } from './components/Login';
import { LayoutGrid, Wallet, BarChart2, ShieldAlert, RotateCcw, LogOut } from 'lucide-react';
import { cn } from './lib/utils';
import { AnimatePresence, motion } from 'motion/react';
import { useStore } from './store';
import { auth, db } from './lib/firebase';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { doc, onSnapshot, setDoc, serverTimestamp } from 'firebase/firestore';

export default function App() {
  const { isAuthenticated, login, logout, setMetaDiaria } = useStore();
  const [activeTab, setActiveTab] = useState<TabType>('dashboard');
  const [isInitializing, setIsInitializing] = useState(true);

  useEffect(() => {
    let unsubDoc: (() => void) | null = null;

    const unsubAuth = onAuthStateChanged(auth, async (user) => {
      if (user) {
        const userRef = doc(db, 'users', user.uid);
        
        if (unsubDoc) {
          unsubDoc();
        }

        unsubDoc = onSnapshot(userRef, async (docSnap) => {
          if (docSnap.exists()) {
            const data = docSnap.data();
            if (data.isActive === false) {
              setDoc(userRef, { isActive: true, updatedAt: serverTimestamp() }, { merge: true }).catch(console.error);
            }
            setMetaDiaria(data.metaDiaria || 350);
            login();
          } else {
            try {
              await setDoc(userRef, {
                email: user.email || "",
                isActive: true,
                metaDiaria: 350,
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp()
              });
            } catch (err) {
              console.error("Failed to create profile", err);
              setMetaDiaria(350);
              login();
            }
          }
        }, (error: any) => {
          console.error("Firestore Profile Error, entering resilient fallback mode:", error);
          setMetaDiaria(350);
          login();
        });

        setIsInitializing(false);
      } else {
        if (unsubDoc) {
          unsubDoc();
          unsubDoc = null;
        }
        // IMPORTANTE: não chamar resetData() aqui. Este branch roda toda vez que o
        // Firebase reporta "sem usuário", inclusive no instante inicial do app antes
        // da sessão persistida ser restaurada. Apagar os dados locais aqui fazia o
        // usuário perder tudo que tinha salvo simplesmente ao reabrir o app.
        // O reset de dados deve ser uma ação explícita do usuário (botão "Sair" ou
        // "Resetar Dados"), nunca um efeito colateral automático da checagem de auth.
        logout();
        setIsInitializing(false);
      }
    });

    return () => {
      if (unsubDoc) unsubDoc();
      unsubAuth();
    };
  }, [login, logout, setMetaDiaria]);

  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  const handleReset = () => {
    useStore.getState().resetData();
    setShowResetConfirm(false);
  };

  const handleLogout = async () => {
    await signOut(auth);
    useStore.getState().resetData();
    logout();
    setShowLogoutConfirm(false);
  };

  if (isInitializing) {
    return (
      <div className="min-h-screen bg-[#E2E8F0] md:bg-slate-100 flex justify-center items-center">
        <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Login />;
  }

  return (
    <div className="min-h-screen bg-[#E2E8F0] md:bg-slate-100 text-slate-900 font-sans selection:bg-emerald-500/30 w-full flex items-center justify-center">
      <div className="w-full max-w-md md:max-w-3xl lg:max-w-5xl xl:max-w-6xl bg-[#F1F5F9] h-screen md:h-[92vh] md:my-8 md:rounded-3xl relative md:shadow-2xl md:border md:border-slate-200/80 flex flex-col overflow-hidden transition-all duration-300">
        
        {/* Header */}
        <header className="px-6 py-5 sticky top-0 bg-[#F1F5F9]/80 backdrop-blur-md z-20 border-b border-slate-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-white rounded-xl overflow-hidden shadow-sm border border-slate-200 p-1 flex items-center justify-center">
                <img src="/probolso.png" alt="Pro Bolso Logo" className="w-full h-full object-contain" />
              </div>
              <div>
                <h1 className="text-lg font-bold tracking-tight text-slate-900 leading-tight">
                  Pro Bolso
                </h1>
                <p className="text-[10px] text-emerald-600 uppercase tracking-wider font-extrabold">
                  Sua Conta Protegida
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button 
                onClick={() => setShowResetConfirm(true)}
                className="relative p-2 text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition-colors bg-white rounded-full border border-slate-200 shadow-sm"
                title="Resetar Dados"
              >
                <RotateCcw className="w-5 h-5" />
              </button>
              <button 
                onClick={() => setShowLogoutConfirm(true)}
                className="relative p-2 text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors bg-white rounded-full border border-slate-200 shadow-sm"
                title="Sair"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          </div>
        </header>

        {/* Modal Confirmar Sair */}
        {showLogoutConfirm && (
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-6">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-3xl p-6 w-full max-w-sm border border-slate-200 shadow-2xl flex flex-col gap-4 text-center"
            >
              <div className="mx-auto w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-600">
                <LogOut className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900">Sair da Conta</h3>
                <p className="text-sm text-slate-500 mt-1">Deseja realmente sair da sua conta?</p>
              </div>
              <div className="grid grid-cols-2 gap-3 mt-2">
                <button 
                  onClick={() => setShowLogoutConfirm(false)}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-3 rounded-xl text-sm transition"
                >
                  Cancelar
                </button>
                <button 
                  onClick={handleLogout}
                  className="bg-slate-900 hover:bg-slate-800 text-white font-bold py-3 rounded-xl text-sm transition"
                >
                  Confirmar Sair
                </button>
              </div>
            </motion.div>
          </div>
        )}

        {/* Modal Confirmar Reset */}
        {showResetConfirm && (
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-6">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-3xl p-6 w-full max-w-sm border border-slate-200 shadow-2xl flex flex-col gap-4 text-center"
            >
              <div className="mx-auto w-12 h-12 rounded-full bg-rose-50 flex items-center justify-center text-rose-600">
                <RotateCcw className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900">Limpar Dados</h3>
                <p className="text-sm text-slate-500 mt-1">Deseja realmente limpar todos os ganhos e gastos registrados de sua máquina?</p>
              </div>
              <div className="grid grid-cols-2 gap-3 mt-2">
                <button 
                  onClick={() => setShowResetConfirm(false)}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-3 rounded-xl text-sm transition"
                >
                  Cancelar
                </button>
                <button 
                  onClick={handleReset}
                  className="bg-rose-600 hover:bg-rose-700 text-white font-bold py-3 rounded-xl text-sm transition"
                >
                  Limpar Tudo
                </button>
              </div>
            </motion.div>
          </div>
        )}

        {/* Content Area */}
        <main className="flex-1 overflow-y-auto p-6 pb-24 disable-scrollbar">
          <AnimatePresence mode="wait">
            {activeTab === 'dashboard' && <Dashboard key="dashboard" />}
            {activeTab === 'envelopes' && <Envelopes key="envelopes" />}
            {activeTab === 'lucro' && <Ganhos key="lucro" />}
            {activeTab === 'fiscal' && <Fiscal key="fiscal" />}
          </AnimatePresence>
        </main>

        {/* Bottom Navigation */}
        <nav className="bg-white/95 backdrop-blur-xl border-t border-slate-200 pb-8 pt-3 px-6 z-30 shadow-[0_-4px_6px_-1px_rgb(0,0,0,0.05)]">
          <div className="flex justify-between items-center max-w-sm mx-auto">
            <NavItem 
              active={activeTab === 'dashboard'} 
              onClick={() => setActiveTab('dashboard')} 
              icon={LayoutGrid} 
              label="Início" 
            />
            <NavItem 
              active={activeTab === 'envelopes'} 
              onClick={() => setActiveTab('envelopes')} 
              icon={Wallet} 
              label="Envelopes" 
            />
            <NavItem 
              active={activeTab === 'lucro'} 
              onClick={() => setActiveTab('lucro')} 
              icon={BarChart2} 
              label="Horários" 
            />
            <NavItem 
              active={activeTab === 'fiscal'} 
              onClick={() => setActiveTab('fiscal')} 
              icon={ShieldAlert} 
              label="Imposto" 
            />
          </div>
        </nav>
      </div>
    </div>
  );
}

function NavItem({ active, onClick, icon: Icon, label }: any) {
  return (
    <button 
      onClick={onClick} 
      className={cn(
        "flex flex-col items-center gap-1.5 min-w-[64px] transition-all",
        active ? "text-blue-600" : "text-slate-400 hover:text-slate-600"
      )}
    >
      <div className={cn(
        "p-1.5 rounded-xl transition-all duration-300",
        active ? "bg-blue-50 text-blue-600" : "bg-transparent text-slate-400"
      )}>
        <Icon className={cn("w-6 h-6", active ? "stroke-[2.5]" : "stroke-2")} />
      </div>
      <span className={cn(
        "text-[10px] transition-all duration-300",
        active ? "font-bold text-blue-600" : "font-medium text-slate-500"
      )}>{label}</span>
    </button>
  );
}
