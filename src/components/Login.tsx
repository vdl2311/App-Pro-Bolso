import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Mail, Lock, Eye, EyeOff, ArrowRight, Wallet, ShieldAlert, Key } from 'lucide-react';
import { auth, db } from '../lib/firebase';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithPopup
} from 'firebase/auth';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { useStore } from '../store';

export function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const setAuthError = useStore((state) => state.setAuthError);

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    setErrorMsg('');
    setAuthError('');

    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      // Cria/atualiza o perfil do usuário no Firestore
      const userRef = doc(db, 'users', user.uid);
      await setDoc(userRef, {
        email: user.email || '',
        displayName: user.displayName || '',
        photoURL: user.photoURL || '',
        isActive: true,
        metaDiaria: 350,
        updatedAt: serverTimestamp()
      }, { merge: true });
    } catch (err: any) {
      console.error('Google Sign-In Error:', err);
      if (err.code !== 'auth/popup-closed-by-user') {
        setErrorMsg('Falha ao autenticar com o Google. Verifique sua conexão e tente novamente.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg('');
    setAuthError('');

    const trimmedEmail = email.trim();

    try {
      if (isRegistering) {
        try {
          const userCredential = await createUserWithEmailAndPassword(auth, trimmedEmail, password);
          const user = userCredential.user;
          // Create default profile in Firestore
          const userRef = doc(db, 'users', user.uid);
          await setDoc(userRef, {
            email: user.email || "",
            isActive: true,
            metaDiaria: 350,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
          });
        } catch (regErr: any) {
          if (regErr.code === 'auth/email-already-in-use') {
            // If email is already in use, attempt to sign in automatically
            await signInWithEmailAndPassword(auth, trimmedEmail, password);
          } else {
            throw regErr;
          }
        }
      } else {
        await signInWithEmailAndPassword(auth, trimmedEmail, password);
      }
    } catch (err: any) {
      console.error("Auth Error:", err);
      let message = 'Ocorreu um erro ao fazer login. Tente novamente.';
      
      switch (err.code) {
        case 'auth/email-already-in-use':
          message = 'Este e-mail já está sendo utilizado.';
          break;
        case 'auth/operation-not-allowed':
          message = 'O provedor de login com e-mail e senha não está ativo no Firebase Console. Ative-o em Authentication -> Sign-in method.';
          break;
        case 'auth/invalid-credential':
        case 'auth/wrong-password':
          message = 'E-mail ou senha inválidos. Verifique as credenciais ou cadastre-se se for um novo usuário.';
          break;
        case 'auth/user-not-found':
          message = 'Usuário não encontrado. Crie uma conta clicando em Cadastre-se gratuitamente abaixo.';
          break;
        case 'auth/invalid-email':
          message = 'Formato de e-mail inválido.';
          break;
        case 'auth/weak-password':
          message = 'A senha deve conter pelo menos 6 caracteres.';
          break;
        case 'auth/network-request-failed':
          message = 'Sem conexão de rede. Verifique sua internet.';
          break;
        default:
          if (err.message) {
            message = `${message} (${err.code || err.message})`;
          }
      }
      setErrorMsg(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#E2E8F0] md:bg-slate-100 text-slate-900 font-sans selection:bg-emerald-500/30 w-full flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
        className="w-full max-w-md bg-[#F1F5F9] rounded-3xl shadow-2xl border border-slate-200/80 overflow-hidden flex flex-col p-8 relative"
      >
        {/* Brand Header */}
        <div className="flex flex-col items-center text-center mt-4 mb-8">
          <div className="w-20 h-20 bg-white rounded-2xl flex items-center justify-center border border-slate-200 shadow-md p-1 mb-4">
            <img src="/probolso.png" alt="Pro Bolso Logo" className="w-full h-full object-contain rounded-xl" />
          </div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Pro Bolso</h1>
          <p className="text-sm text-slate-500 mt-2 max-w-xs">
            Seu gerenciador financeiro inteligente de motorista de aplicativo.
          </p>
        </div>

        {/* Error Alert */}
        {errorMsg && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mb-6 p-4 bg-rose-50 border border-rose-100 rounded-2xl flex gap-3 items-start text-rose-800 text-xs leading-relaxed font-medium"
          >
            <ShieldAlert className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold">Atenção:</span> {errorMsg}
            </div>
          </motion.div>
        )}

        {/* Google Sign-In Button */}
        <button 
          type="button"
          onClick={handleGoogleSignIn}
          disabled={isLoading}
          className="w-full bg-white hover:bg-slate-50 text-slate-800 font-bold py-3.5 px-4 rounded-2xl flex items-center justify-center gap-3 border border-slate-300 shadow-sm transition-all hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-70 text-sm mb-3"
        >
          <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
            />
          </svg>
          <span>Entrar com o Google</span>
        </button>

        <div className="flex items-center gap-3 my-2 mb-4">
          <div className="flex-1 h-[1px] bg-slate-200" />
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">ou com e-mail</span>
          <div className="flex-1 h-[1px] bg-slate-200" />
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider px-1">E-mail</label>
            <div className="relative flex items-center">
              <Mail className="absolute left-4 w-5 h-5 text-slate-400" />
              <input 
                type="email"
                required
                placeholder="seu.email@exemplo.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-2xl py-3.5 pl-12 pr-4 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-emerald-500 transition-colors shadow-sm"
              />
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <div className="flex justify-between items-center px-1">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Senha</label>
            </div>
            <div className="relative flex items-center">
              <Lock className="absolute left-4 w-5 h-5 text-slate-400" />
              <input 
                type={showPassword ? 'text' : 'password'}
                required
                placeholder="Sua senha secreta"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-2xl py-3.5 pl-12 pr-12 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-emerald-500 transition-colors shadow-sm"
              />
              <button 
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 text-slate-400 hover:text-slate-600 transition-colors p-1"
                tabIndex={-1}
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          <button 
            type="submit"
            disabled={isLoading}
            className="w-full bg-slate-950 hover:bg-slate-900 text-white font-bold py-4 rounded-2xl flex justify-center items-center gap-2 mt-4 shadow-lg transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-70 disabled:hover:translate-y-0"
          >
            {isLoading ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                {isRegistering ? 'Criar Minha Conta' : 'Acessar Painel'}
                <ArrowRight className="w-5 h-5" />
              </>
            )}
          </button>
        </form>

        {/* Toggle Mode Footer */}
        <div className="mt-8 text-center border-t border-slate-200/80 pt-6">
          <p className="text-sm text-slate-500">
            {isRegistering ? 'Já possui uma conta?' : 'Novo por aqui?'}
            <button 
              type="button"
              onClick={() => {
                setIsRegistering(!isRegistering);
                setErrorMsg('');
              }}
              className="text-emerald-600 font-bold ml-1.5 hover:underline focus:outline-none"
            >
              {isRegistering ? 'Fazer login' : 'Cadastre-se gratuitamente'}
            </button>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
