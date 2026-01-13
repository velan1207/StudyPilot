
import React, { useState } from 'react';
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signInWithPopup,
  updateProfile
} from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { auth, db, googleProvider } from '../firebase';
import { Mail, Lock, User, ArrowRight, Loader2, AlertTriangle, Eye, EyeOff, Globe, PlaneTakeoff } from 'lucide-react';

const Auth: React.FC = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading || googleLoading) return;
    setLoading(true);
    setError('');

    try {
      if (isLogin) {
        await signInWithEmailAndPassword(auth, formData.email, formData.password);
      } else {
        const userCredential = await createUserWithEmailAndPassword(auth, formData.email, formData.password);
        const user = userCredential.user;
        
        await updateProfile(user, { displayName: formData.name });
        await setDoc(doc(db, "users", user.uid), {
          name: formData.name,
          email: formData.email,
          createdAt: new Date().toISOString()
        });
      }
    } catch (err: any) {
      console.error("Auth Error:", err.code);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    if (loading || googleLoading) return;
    setGoogleLoading(true);
    setError('');
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;
      await setDoc(doc(db, "users", user.uid), {
        name: user.displayName,
        email: user.email,
        lastLogin: new Date().toISOString()
      }, { merge: true });
    } catch (err: any) {
      if (err.code !== 'auth/popup-closed-by-user') {
        setError(err.message);
      }
    } finally {
      setGoogleLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 relative overflow-hidden">
      {/* Background Decorative Elements to match index.html style */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-violet-600/20 blur-[120px] rounded-full animate-pulse" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-cyan-600/20 blur-[120px] rounded-full" />

      <div className="max-w-md w-full glass-panel p-10 md:p-12 rounded-[4rem] shadow-2xl border border-white/40 ring-1 ring-black/5 animate-in fade-in zoom-in-95 duration-700 relative z-10">
        <div className="text-center mb-10">
          <div className="inline-flex p-5 bg-violet-600 rounded-[2rem] shadow-xl mb-6 group hover:rotate-12 transition-transform duration-500 border border-white/10 shadow-violet-200">
            <PlaneTakeoff className="text-white" size={48} />
          </div>
          <h2 className="text-5xl font-black text-slate-900 tracking-tighter uppercase leading-none mb-2">
            Study<span className="text-violet-600">Pilot</span>
          </h2>
          <div className="flex items-center justify-center gap-2">
            <span className="px-3 py-1 bg-violet-500/10 text-violet-600 rounded-full text-[9px] font-black uppercase tracking-[0.2em] border border-violet-500/20">
              {isLogin ? 'Mission Control' : 'Join the Fleet'}
            </span>
          </div>
        </div>

        {error && (
          <div className="mb-8 p-5 bg-rose-50 text-rose-600 rounded-3xl text-[11px] font-bold border border-rose-100 flex items-start gap-3 animate-in shake duration-300">
            <AlertTriangle size={18} className="shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form className="space-y-4" onSubmit={handleSubmit}>
          {!isLogin && (
            <div className="relative group">
              <div className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-violet-600 transition-colors">
                <User size={20} />
              </div>
              <input
                type="text"
                required
                placeholder="Callsign (Full Name)"
                className="w-full pl-14 pr-6 py-5 bg-white/50 border-2 border-transparent rounded-2xl font-black text-slate-800 outline-none focus:border-violet-500 focus:bg-white transition-all shadow-inner placeholder:text-slate-400 text-sm"
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
              />
            </div>
          )}
          
          <div className="relative group">
            <div className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-violet-600 transition-colors">
              <Mail size={20} />
            </div>
            <input
              type="email"
              required
              placeholder="Email Address"
              className="w-full pl-14 pr-6 py-5 bg-white/50 border-2 border-transparent rounded-2xl font-black text-slate-800 outline-none focus:border-violet-500 focus:bg-white transition-all shadow-inner placeholder:text-slate-400 text-sm"
              value={formData.email}
              onChange={(e) => setFormData({...formData, email: e.target.value})}
            />
          </div>
          
          <div className="relative group">
            <div className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-violet-600 transition-colors">
              <Lock size={20} />
            </div>
            <input
              type={showPassword ? "text" : "password"}
              required
              placeholder="Security Key"
              className="w-full pl-14 pr-14 py-5 bg-white/50 border-2 border-transparent rounded-2xl font-black text-slate-800 outline-none focus:border-violet-500 focus:bg-white transition-all shadow-inner placeholder:text-slate-400 text-sm"
              value={formData.password}
              onChange={(e) => setFormData({...formData, password: e.target.value})}
            />
            <button 
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-300 hover:text-violet-600 transition-colors"
            >
              {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          </div>

          <button
            type="submit"
            disabled={loading || googleLoading}
            className="w-full flex items-center justify-center gap-3 py-5 bg-slate-900 text-white rounded-[1.8rem] font-black uppercase text-xs tracking-widest shadow-2xl hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 mt-4 group"
          >
            {loading ? <Loader2 className="animate-spin" size={20} /> : (
              <>
                {isLogin ? 'Engage Session' : 'Initiate Profile'} 
                <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
              </>
            )}
          </button>
        </form>

        <div className="relative py-8">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-slate-200"></div>
          </div>
          <div className="relative flex justify-center text-[10px] font-black uppercase text-slate-400 tracking-[0.3em] bg-[#f8fafc] px-4">
            Encrypted Auth
          </div>
        </div>

        <button
          onClick={handleGoogleSignIn}
          disabled={loading || googleLoading}
          className="w-full flex items-center justify-center gap-4 py-5 bg-white border border-slate-200 rounded-[1.8rem] font-black text-slate-700 uppercase text-[10px] tracking-widest hover:bg-slate-50 transition-all active:scale-[0.98] disabled:opacity-50 shadow-sm"
        >
          {googleLoading ? (
            <Loader2 className="animate-spin text-slate-400" size={18} />
          ) : (
            <>
              <svg width="20" height="20" viewBox="0 0 18 18" className="shrink-0">
                <path d="M17.64 9.20455C17.64 8.56636 17.5827 7.95273 17.4764 7.36364H9V10.845H13.8436C13.635 11.97 13.0009 12.9232 12.0477 13.5614V15.8195H14.9564C16.6582 14.2527 17.64 11.9455 17.64 9.20455Z" fill="#4285F4"/>
                <path d="M9 18C11.43 18 13.4673 17.1941 14.9564 15.8195L12.0477 13.5614C11.2418 14.1014 10.2109 14.4205 9 14.4205C6.65591 14.4205 4.67182 12.8373 3.96409 10.71H0.957275V13.0418C2.43818 15.9832 5.48182 18 9 18Z" fill="#34A853"/>
                <path d="M3.96409 10.71C3.78409 10.17 3.68182 9.59318 3.68182 9C3.68182 8.40682 3.78409 7.83 3.96409 7.29V4.95818H0.957275C0.347727 6.17318 0 7.54773 0 9C0 10.4523 0.347727 11.8268 0.957275 13.0418L3.96409 10.71Z" fill="#FBBC05"/>
                <path d="M9 3.57955C10.3214 3.57955 11.5077 4.03364 12.4405 4.92545L15.0218 2.34409C13.4632 0.891818 11.4259 0 9 0C5.48182 0 2.43818 2.01682 0.957275 4.95818L3.96409 7.29C4.67182 5.16273 6.65591 3.57955 9 3.57955Z" fill="#EA4335"/>
              </svg>
              Google Cloud Sync
            </>
          )}
        </button>

        <p className="text-center text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mt-10 leading-none">
          {isLogin ? "New to the flight deck?" : "Already part of the fleet?"} 
          <button 
            type="button"
            onClick={() => { setError(''); setIsLogin(!isLogin); }} 
            className="ml-2 text-violet-600 hover:text-violet-700 underline transition-colors"
          >
            {isLogin ? 'Request Access' : 'Return to Base'}
          </button>
        </p>
      </div>
    </div>
  );
};

export default Auth;
