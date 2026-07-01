import React, { useState } from 'react';
import { motion } from 'motion/react';
import { ShieldCheck, Lock, User, ArrowRight } from 'lucide-react';
import { useStore } from '@/store';
import { signInWithEmailAndPassword, sendPasswordResetEmail } from 'firebase/auth';
import { auth } from '@/lib/firebase';

export function Login() {
  const { login } = useStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const [isRegistering, setIsRegistering] = useState(false);

  const handleResetPassword = async () => {
    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      setError('Digite seu e-mail acima para redefinir a senha.');
      return;
    }
    try {
      setIsLoading(true);
      setError('');
      setSuccessMsg('');
      await sendPasswordResetEmail(auth, trimmedEmail);
      setSuccessMsg('E-mail de redefinição enviado! Verifique sua caixa de entrada.');
    } catch (err: any) {
      setError('Erro ao enviar e-mail de redefinição. Verifique o e-mail digitado.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedEmail = email.trim();
    if (!trimmedEmail || !password) {
      setError('Preencha e-mail e senha para acessar.');
      return;
    }

    setIsLoading(true);
    setError('');
    setSuccessMsg('');
    
    try {
      if (isRegistering) {
        await import('firebase/auth').then(({ createUserWithEmailAndPassword }) => 
          createUserWithEmailAndPassword(auth, trimmedEmail, password)
        );
      } else {
        await signInWithEmailAndPassword(auth, trimmedEmail, password);
      }
      // O App.tsx via onAuthStateChanged vai verificar o status no Firestore e chamar login() ou logout()
    } catch (err: any) {
      console.error(err);
      if (err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
        setError(isRegistering ? 'Erro ao criar conta. Verifique seus dados.' : 'Senha incorreta ou conta não existe. Tente "Criar Conta" ou redefinição.');
      } else if (err.code === 'auth/email-already-in-use') {
        setError('Este e-mail já está em uso. Faça login ao invés de criar conta.');
      } else if (err.code === 'auth/weak-password') {
        setError('A senha deve ter pelo menos 6 caracteres.');
      } else if (err.code === 'auth/operation-not-allowed') {
        setError('Operação não permitida no Firebase.');
      } else {
        setError('Credenciais inválidas. Verifique se seu e-mail e senha estão corretos.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[100dvh] flex flex-col justify-center items-center bg-[#0B0E14] px-6 text-white w-full">
      <div className="w-full max-w-sm">
        
        {/* Logo Area */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center justify-center mb-10"
        >
          <div className="w-32 h-32 rounded-3xl flex items-center justify-center mb-6 overflow-hidden border border-slate-700/50 shadow-xl">
            <img src="/probolso.png" alt="Pro Bolso Logo" className="w-full h-full object-cover" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white mb-1">
            Pro Bolso
          </h1>
          <p className="text-sm text-slate-400 font-medium tracking-wide uppercase">
            {isRegistering ? 'Criar Conta' : 'Acesso do Motorista'}
          </p>
        </motion.div>

        {/* Login Form */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-[#1A1F2B] p-8 rounded-3xl border border-slate-800 shadow-2xl relative overflow-hidden"
        >
          {error && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-bold p-3 rounded-xl mb-4 text-center">
              {error}
            </div>
          )}
          {successMsg && (
            <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold p-3 rounded-xl mb-4 text-center">
              {successMsg}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">E-mail</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User className="w-5 h-5 text-slate-500" />
                </div>
                <input 
                  type="email" 
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); setError(''); }}
                  placeholder="seu@email.com"
                  className="w-full bg-[#0B0E14] border border-slate-700/50 rounded-xl py-3.5 pl-10 pr-4 text-white placeholder-slate-600 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">Senha</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="w-5 h-5 text-slate-500" />
                </div>
                <input 
                  type="password" 
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); setError(''); }}
                  placeholder="••••••••"
                  className="w-full bg-[#0B0E14] border border-slate-700/50 rounded-xl py-3.5 pl-10 pr-4 text-white placeholder-slate-600 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
                />
              </div>
            </div>

            <button 
              type="submit" 
              disabled={isLoading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-xl mt-6 flex items-center justify-center gap-2 transition-colors disabled:opacity-70"
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>{isRegistering ? 'Criar Conta' : 'Acessar Conta'} <ArrowRight className="w-4 h-4 ml-1" /></>
              )}
            </button>
          </form>

          <div className="mt-6 text-center flex flex-col gap-3">
            <button 
              onClick={() => { setIsRegistering(!isRegistering); setError(''); setSuccessMsg(''); }} 
              type="button"
              className="text-sm font-medium text-slate-300 hover:text-white transition-colors"
            >
              {isRegistering ? 'Já tem uma conta? Faça login' : 'Não tem conta? Criar Conta'}
            </button>

            {!isRegistering && (
              <>
                <p className="text-xs font-medium text-slate-500 mt-2">
                  Apenas usuários com assinatura ativa têm acesso após criar conta.
                </p>
                <button 
                  onClick={handleResetPassword} 
                  type="button"
                  className="text-sm font-bold text-blue-500 hover:text-blue-400 transition-colors"
                >
                  Esqueceu a senha?
                </button>
              </>
            )}
          </div>
        </motion.div>
        
        <div className="mt-8 text-center px-4">
           <p className="text-xs text-slate-500">
             Protegido por Pro Bolso &copy; {new Date().getFullYear()}
           </p>
        </div>
      </div>
    </div>
  );
}
