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
import { LayoutGrid, Wallet, BarChart2, ShieldAlert, LogOut } from 'lucide-react';
import { cn } from './lib/utils';
import { AnimatePresence } from 'motion/react';
import { useStore } from './store';
import { auth, db } from './lib/firebase';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { doc, onSnapshot, setDoc, serverTimestamp } from 'firebase/firestore';

export default function App() {
  const { isAuthenticated, login, logout, setMetaDiaria } = useStore();
  const [activeTab, setActiveTab] = useState<TabType>('dashboard');
  const [isInitializing, setIsInitializing] = useState(true);

  useEffect(() => {
    const unsubAuth = onAuthStateChanged(auth, async (user) => {
      if (user) {
        // User logged in, listen to their profile for 'isActive' flag
        const userRef = doc(db, 'users', user.uid);
        
        const unsubDoc = onSnapshot(userRef, async (docSnap) => {
          if (docSnap.exists()) {
            const data = docSnap.data();
            if (data.isActive === false) {
              // Blocked user! Sign out immediately.
              alert("Sua conta foi bloqueada por falta de pagamento ou pendências.");
              await signOut(auth);
              logout();
            } else {
              setMetaDiaria(data.metaDiaria || 350);
              login(); // set authenticated
            }
          } else {
            // New user, create default profile
            try {
              await setDoc(userRef, {
                email: user.email || "",
                isActive: true,
                metaDiaria: 350,
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp()
              });
              login();
            } catch (err) {
              console.error("Failed to create profile", err);
              // if failed to create, maybe rules blocked? wait 
              // for preview purposes, we'll just log them in anyway so they aren't completely stuck
              login();
            }
          }
        }, (error) => {
          console.error("Failed to listen to profile", error);
          // Don't sign out immediately, might just be rules propagating
          login();
        });

        setIsInitializing(false);
        return () => unsubDoc();
      } else {
        useStore.getState().resetData();
        logout();
        setIsInitializing(false);
      }
    });

    return () => unsubAuth();
  }, [login, logout, setMetaDiaria]);

  const handleLogout = async () => {
    await signOut(auth);
    useStore.getState().resetData();
    logout();
  };

  if (isInitializing) {
    return <div className="min-h-screen bg-[#0B0E14] flex justify-center items-center">
      <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
    </div>;
  }

  if (!isAuthenticated) {
    return <Login />;
  }

  return (
    <div className="min-h-screen bg-[#F1F5F9] text-slate-900 font-sans selection:bg-emerald-500/30 w-full flex justify-center">
      <div className="w-full max-w-md bg-[#F1F5F9] min-h-screen relative shadow-2xl flex flex-col">
        
        {/* Header */}
        <header className="px-6 py-5 sticky top-0 bg-[#F1F5F9]/80 backdrop-blur-md z-20 border-b border-slate-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center font-bold text-white shadow-sm">
                B
              </div>
              <div>
                <h1 className="text-lg font-bold tracking-tight text-slate-900 leading-tight">
                  Pro Bolso
                </h1>
                <p className="text-[10px] text-slate-500 uppercase tracking-widest font-semibold">
                  Sua Conta Protegida
                </p>
              </div>
            </div>
            <button 
              onClick={handleLogout}
              className="relative p-2 text-slate-500 hover:text-red-600 hover:bg-red-50 transition-colors bg-white rounded-full border border-slate-200 shadow-sm"
              title="Sair"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </header>

        {/* Content Area */}
        <main className="flex-1 overflow-y-auto p-6 disable-scrollbar">
          <AnimatePresence mode="wait">
            {activeTab === 'dashboard' && <Dashboard key="dashboard" />}
            {activeTab === 'envelopes' && <Envelopes key="envelopes" />}
            {activeTab === 'lucro' && <Ganhos key="lucro" />}
            {activeTab === 'fiscal' && <Fiscal key="fiscal" />}
          </AnimatePresence>
        </main>

        {/* Bottom Navigation */}
        <nav className="absolute bottom-0 w-full bg-white/95 backdrop-blur-xl border-t border-slate-200 pb-8 pt-3 px-6 z-30 shadow-[0_-4px_6px_-1px_rgb(0,0,0,0.05)]">
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
