
import React, { useState } from 'react';
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signInWithPopup,
  updateProfile
} from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { auth, db, googleProvider } from '../firebase';
import { GraduationCap, Mail, Lock, User, ArrowRight, Loader2, AlertTriangle, Eye, EyeOff } from 'lucide-react';

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
      if (err.code === 'auth/unauthorized-domain') {
        setError(`Unauthorized Domain: Please add "${window.location.hostname}" to your Authorized Domains in Firebase Console > Auth > Settings.`);
      } else {
        setError(err.message);
      }
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
      console.error("Google Auth Error:", err.code);
      if (err.code === 'auth/unauthorized-domain') {
        setError(`Unauthorized Domain: Please add "${window.location.hostname}" to your Firebase Console (Authentication > Settings > Authorized Domains).`);
      } else if (err.code !== 'auth/popup-closed-by-user') {
        setError(err.message);
      }
    } finally {
      setGoogleLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFB] flex items-center justify-center p-6 text-slate-900 font-sans">
      <div className="max-w-md w-full space-y-8 bg-white p-10 rounded-[3rem] shadow-xl border border-slate-100 animate-in fade-in zoom-in-95 duration-500">
        <div className="text-center">
          <div className="bg-[#4FB5C0] w-16 h-16 rounded-[1.5rem] flex items-center justify-center mx-auto mb-6 shadow-lg shadow-[#4FB5C0]/20">
            <GraduationCap className="text-white" size={32} />
          </div>
          <h2 className="text-4xl font-black text-slate-800 tracking-tighter uppercase leading-none">StudyPilot</h2>
          <p className="text-slate-400 font-bold uppercase text-[10px] tracking-widest mt-3">
            {isLogin ? 'Welcome Back, Educator' : 'Join our Global Classroom'}
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {error && (
            <div className="p-4 bg-rose-50 text-rose-600 rounded-2xl text-[11px] font-bold border border-rose-100 leading-relaxed flex items-start gap-3">
              <AlertTriangle size={16} className="shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}
          
          <div className="space-y-4">
            {!isLogin && (
              <div className="relative">
                <User className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300" size={20} />
                <input
                  type="text"
                  required
                  placeholder="Your Full Name"
                  className="w-full pl-14 pr-6 py-4 bg-slate-50 border-none rounded-2xl font-bold text-slate-800 outline-none focus:ring-4 ring-[#4FB5C0]/10 transition-all placeholder:text-slate-300"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                />
              </div>
            )}
            
            <div className="relative">
              <Mail className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300" size={20} />
              <input
                type="email"
                required
                placeholder="Email Address"
                className="w-full pl-14 pr-6 py-4 bg-slate-50 border-none rounded-2xl font-bold text-slate-800 outline-none focus:ring-4 ring-[#4FB5C0]/10 transition-all placeholder:text-slate-300"
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
              />
            </div>
            
            <div className="relative group">
              <Lock className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300" size={20} />
              <input
                type={showPassword ? "text" : "password"}
                required
                placeholder="Password"
                className="w-full pl-14 pr-14 py-4 bg-slate-50 border-none rounded-2xl font-bold text-slate-800 outline-none focus:ring-4 ring-[#4FB5C0]/10 transition-all placeholder:text-slate-300"
                value={formData.password}
                onChange={(e) => setFormData({...formData, password: e.target.value})}
              />
              <button 
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-300 hover:text-[#4FB5C0] transition-colors"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading || googleLoading}
            className="w-full flex items-center justify-center gap-3 py-4 bg-[#4FB5C0] text-white rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl shadow-[#4FB5C0]/20 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50"
          >
            {loading ? <Loader2 className="animate-spin" size={20} /> : (
              <>
                {isLogin ? 'Sign In' : 'Create Account'} <ArrowRight size={18} />
              </>
            )}
          </button>
        </form>

        <div className="relative py-4">
          <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-100"></div></div>
          <div className="relative flex justify-center text-[10px] font-black uppercase text-slate-300 tracking-widest bg-white px-4">Or continue with</div>
        </div>

        <button
          onClick={handleGoogleSignIn}
          disabled={loading || googleLoading}
          className="w-full flex items-center justify-center gap-4 py-4 border-2 border-slate-100 rounded-2xl font-black text-slate-700 uppercase text-[10px] tracking-widest hover:bg-slate-50 transition-all active:scale-[0.98] disabled:opacity-50"
        >
          {googleLoading ? (
            <Loader2 className="animate-spin text-slate-400" size={18} />
          ) : (
            <>
              <svg width="18" height="18" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
                <path d="M17.64 9.20455C17.64 8.56636 17.5827 7.95273 17.4764 7.36364H9V10.845H13.8436C13.635 11.97 13.0009 12.9232 12.0477 13.5614V15.8195H14.9564C16.6582 14.2527 17.64 11.9455 17.64 9.20455Z" fill="#4285F4"/>
                <path d="M9 18C11.43 18 13.4673 17.1941 14.9564 15.8195L12.0477 13.5614C11.2418 14.1014 10.2109 14.4205 9 14.4205C6.65591 14.4205 4.67182 12.8373 3.96409 10.71H0.957275V13.0418C2.43818 15.9832 5.48182 18 9 18Z" fill="#34A853"/>
                <path d="M3.96409 10.71C3.78409 10.17 3.68182 9.59318 3.68182 9C3.68182 8.40682 3.78409 7.83 3.96409 7.29V4.95818H0.957275C0.347727 6.17318 0 7.54773 0 9C0 10.4523 0.347727 11.8268 0.957275 13.0418L3.96409 10.71Z" fill="#FBBC05"/>
                <path d="M9 3.57955C10.3214 3.57955 11.5077 4.03364 12.4405 4.92545L15.0218 2.34409C13.4632 0.891818 11.4259 0 9 0C5.48182 0 2.43818 2.01682 0.957275 4.95818L3.96409 7.29C4.67182 5.16273 6.65591 3.57955 9 3.57955Z" fill="#EA4335"/>
              </svg>
              Sign In With Google
            </>
          )}
        </button>

        <p className="text-center text-[10px] font-black uppercase tracking-widest text-slate-400 mt-8 leading-none">
          {isLogin ? "Don't have an account?" : "Already have an account?"} 
          <button 
            type="button"
            onClick={() => { setError(''); setIsLogin(!isLogin); }} 
            className="ml-2 text-[#4FB5C0] hover:underline"
          >
            {isLogin ? 'Create one now' : 'Login here'}
          </button>
        </p>
      </div>
    </div>
  );
};

export default Auth;
