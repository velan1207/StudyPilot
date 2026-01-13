
import React, { useState, useEffect, useRef } from 'react';
import * as RRD from 'react-router-dom';
import { onAuthStateChanged, signOut, User as FirebaseUser } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from './firebase';
import { 
  LayoutDashboard, 
  Calendar,
  Globe,
  LogOut,
  Sparkles,
  User as UserIcon,
  Mail,
  ShieldQuestion,
  HelpCircle,
  PlaneTakeoff
} from 'lucide-react';
import { GradeLevel, Language, TeacherContext } from './types';
import { UI_STRINGS } from './translations';

import Dashboard from './pages/Dashboard';
import GradeWorkspace from './pages/GradeWorkspace';
import HelpMode from './pages/HelpMode';
import Schedule from './pages/Schedule';
import Auth from './pages/Auth';

const FloatingDock = ({ 
  context, 
  setContext, 
  user,
  userName 
}: { 
  context: TeacherContext, 
  setContext: any, 
  user: FirebaseUser | null,
  userName: string 
}) => {
  const location = RRD.useLocation();
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  const isDashboard = location.pathname === '/';
  const isHelp = location.pathname === '/help';
  const isSchedule = location.pathname === '/schedule';
  const t = UI_STRINGS[context.language];

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowProfileDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="fixed top-0 left-0 right-0 z-[100] px-4 md:px-8 py-4 pointer-events-none bg-gradient-to-b from-[#F8FAFC] via-[#F8FAFC]/80 to-transparent">
      <div className="max-w-7xl mx-auto flex items-center justify-between p-2 glass-panel rounded-[2rem] shadow-2xl pointer-events-auto border border-white/40 ring-1 ring-black/5">
        <div className="flex items-center gap-2 md:gap-8 px-4">
          <RRD.Link to="/" className="flex items-center gap-2 group">
            <div className="p-2 bg-violet-600 rounded-2xl group-hover:scale-110 transition-transform overflow-hidden flex items-center justify-center shadow-lg shadow-violet-200">
              <PlaneTakeoff className="text-white" size={24} />
            </div>
            <span className="hidden md:block text-xl font-black bg-gradient-to-r from-slate-900 to-slate-600 bg-clip-text text-transparent tracking-tighter">StudyPilot</span>
          </RRD.Link>
          
          <nav className="flex items-center gap-1">
            <NavItem to="/" active={isDashboard} icon={LayoutDashboard} label={t.dashboard} />
            <NavItem to="/schedule" active={isSchedule} icon={Calendar} label={t.schedule} />
            <NavItem to="/help" active={isHelp} icon={HelpCircle} label="Help Mode" />
          </nav>
        </div>

        <div className="flex items-center gap-2 md:gap-4 pr-2">
          <div className="hidden sm:flex items-center gap-2 px-4 py-2 bg-black/5 rounded-2xl relative group cursor-pointer border border-transparent hover:border-black/10 transition-all">
            <Globe size={14} className="text-slate-500" />
            <span className="text-xs font-black text-slate-700">{context.language}</span>
            <select 
              value={context.language}
              onChange={(e) => setContext({ ...context, language: e.target.value as Language })}
              className="absolute inset-0 opacity-0 cursor-pointer"
            >
              {Object.values(Language).map(lang => (
                <option key={lang} value={lang}>{lang}</option>
              ))}
            </select>
          </div>

          <div className="relative" ref={dropdownRef}>
            <button 
              onClick={() => setShowProfileDropdown(!showProfileDropdown)}
              className="w-10 h-10 bg-slate-900 rounded-full flex items-center justify-center text-white font-black text-sm shadow-xl hover:scale-105 transition-transform border-2 border-white ring-2 ring-slate-100"
            >
              {userName ? userName[0].toUpperCase() : 'U'}
            </button>

            {showProfileDropdown && (
              <div className="absolute right-0 mt-4 w-72 bg-white rounded-[2rem] shadow-2xl border border-slate-100 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                <div className="p-6 bg-slate-50/50 border-b border-slate-100">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-12 h-12 bg-violet-600 rounded-2xl flex items-center justify-center text-white font-black text-lg shadow-lg shadow-violet-200">
                      {userName ? userName[0].toUpperCase() : 'U'}
                    </div>
                    <div className="min-w-0">
                      <p className="font-black text-slate-900 truncate">{userName || 'Educator'}</p>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Teacher Account</p>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-slate-500">
                      <Mail size={14} className="shrink-0" />
                      <span className="text-[11px] font-medium truncate">{user?.email}</span>
                    </div>
                    <div className="flex items-center gap-2 text-slate-500">
                      <ShieldQuestion size={14} className="shrink-0" />
                      <span className="text-[11px] font-medium">Standard License</span>
                    </div>
                  </div>
                </div>
                <div className="p-2">
                  <button 
                    onClick={() => signOut(auth)}
                    className="w-full flex items-center gap-3 p-4 hover:bg-rose-50 text-rose-600 rounded-xl transition-colors font-black uppercase text-[10px] tracking-widest"
                  >
                    <LogOut size={16} />
                    Log Out Session
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const NavItem = ({ to, active, icon: Icon, label }: any) => (
  <RRD.Link 
    to={to} 
    className={`px-4 py-2.5 rounded-2xl text-[10px] md:text-xs font-black transition-all flex items-center gap-2 ${
      active 
      ? `bg-slate-900 text-white shadow-xl` 
      : `text-slate-500 hover:bg-black/5 hover:text-slate-900`
    }`}
  >
    <Icon size={14} />
    <span className="hidden lg:block uppercase tracking-widest">{label}</span>
  </RRD.Link>
);

const App: React.FC = () => {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [userName, setUserName] = useState('');
  const [authLoading, setAuthLoading] = useState(true);
  const [context, setContext] = useState<TeacherContext>({
    grade: GradeLevel.G1,
    language: Language.ENGLISH,
  });

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      if (firebaseUser) {
        const userDoc = await getDoc(doc(db, "users", firebaseUser.uid));
        if (userDoc.exists()) setUserName(userDoc.data().name);
        else setUserName(firebaseUser.displayName || '');
      }
      setAuthLoading(false);
    });
    return () => unsubscribe();
  }, []);

  if (authLoading) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center gap-6">
        <div className="relative">
          <div className="w-24 h-24 border-8 border-white/10 border-t-violet-500 rounded-full animate-spin"></div>
          <Sparkles className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-white" size={32} />
        </div>
        <p className="font-black uppercase text-xs tracking-[0.5em] text-white/40">Awakening StudyPilot</p>
      </div>
    );
  }

  if (!user) return <Auth />;

  return (
    <div className="min-h-screen flex flex-col selection:bg-violet-500/30 selection:text-violet-900">
      <FloatingDock context={context} setContext={setContext} user={user} userName={userName} />
      {/* Increased padding-top to ensure content is visible below the fixed header */}
      <main className="flex-1 pt-32 md:pt-40 p-4 md:p-12 max-w-[1600px] mx-auto w-full">
        <RRD.Routes>
          <RRD.Route path="/" element={<Dashboard context={context} setContext={setContext} />} />
          <RRD.Route path="/grade/:gradeId" element={<GradeWorkspace context={context} setContext={setContext} />} />
          <RRD.Route path="/help" element={<HelpMode context={context} />} />
          <RRD.Route path="/schedule" element={<Schedule context={context} />} />
          <RRD.Route path="*" element={<RRD.Navigate to="/" replace />} />
        </RRD.Routes>
      </main>
    </div>
  );
};

const AppWrapper = () => (
  <RRD.HashRouter>
    <App />
  </RRD.HashRouter>
);

export default AppWrapper;
