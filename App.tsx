
import React, { useState, useEffect } from 'react';
/* Fixed: Using default import for react-router-dom to resolve missing named exports error in the current environment */
import * as RRD from 'react-router-dom';

import { onAuthStateChanged, signOut, User as FirebaseUser } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from './firebase';
import { 
  LayoutDashboard, 
  Calendar,
  ChevronDown,
  GraduationCap,
  Globe,
  LifeBuoy,
  LogOut,
  Loader2,
  Menu,
  X
} from 'lucide-react';
import { GradeLevel, Language, TeacherContext } from './types';
import { UI_STRINGS } from './translations';

// Pages
import Dashboard from './pages/Dashboard';
import GradeWorkspace from './pages/GradeWorkspace';
import HelpMode from './pages/HelpMode';
import Schedule from './pages/Schedule';
import Auth from './pages/Auth';

const Header = ({ 
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
  const isDashboard = location.pathname === '/';
  const isHelp = location.pathname === '/help';
  const isSchedule = location.pathname === '/schedule';
  const t = UI_STRINGS[context.language];

  return (
    <>
      {/* Top Header - Global visibility */}
      <header className="bg-white/80 backdrop-blur-md border-b border-slate-100 px-4 md:px-6 h-16 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center gap-4 md:gap-10">
          <RRD.Link to="/" className="flex items-center gap-2">
            <div className="bg-[#4FB5C0] p-1.5 rounded-lg shadow-lg shadow-[#4FB5C0]/20">
              <GraduationCap className="text-white" size={20} />
            </div>
            <span className="text-lg md:text-xl font-black text-[#4FB5C0] tracking-tight">StudyPilot</span>
          </RRD.Link>
          
          {/* Desktop Nav - Hidden on Mobile */}
          <nav className="hidden md:flex items-center gap-2">
            <RRD.Link 
              to="/" 
              className={`px-4 py-1.5 rounded-full text-xs font-black transition-all flex items-center gap-2 ${isDashboard ? 'bg-[#E6F4F5] text-[#4FB5C0]' : 'text-slate-400 hover:text-slate-800'}`}
            >
              <LayoutDashboard size={14} /> {t.dashboard}
            </RRD.Link>
            <RRD.Link 
              to="/schedule" 
              className={`px-4 py-1.5 rounded-full text-xs font-black transition-all flex items-center gap-2 ${isSchedule ? 'bg-[#E6F4F5] text-[#4FB5C0]' : 'text-slate-400 hover:text-slate-800'}`}
            >
              <Calendar size={14} /> {t.schedule}
            </RRD.Link>
            <RRD.Link 
              to="/help" 
              className={`px-4 py-1.5 rounded-full text-xs font-black transition-all flex items-center gap-2 ${isHelp ? 'bg-rose-100 text-rose-600' : 'text-rose-400 hover:text-rose-600 border border-transparent hover:border-rose-100'}`}
            >
              <LifeBuoy size={14} /> {t.helpMode || "HELP MODE"}
            </RRD.Link>
          </nav>
        </div>

        <div className="flex items-center gap-2 md:gap-4">
          {/* Language Selector - Visible on Mobile and Desktop */}
          <div className="flex items-center gap-1 md:gap-2 px-2 md:px-3 py-1.5 bg-slate-50 rounded-xl border border-slate-100 group hover:border-[#4FB5C0]/30 transition-all relative">
            <Globe size={14} className="text-slate-400 group-hover:text-[#4FB5C0]" />
            <span className="text-[10px] md:text-xs font-black text-slate-700">{context.language}</span>
            <select 
              value={context.language}
              onChange={(e) => setContext({ ...context, language: e.target.value as Language })}
              className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
            >
              {Object.values(Language).map(lang => (
                <option key={lang} value={lang}>{lang}</option>
              ))}
            </select>
            <ChevronDown size={12} className="text-slate-400" />
          </div>

          <div className="flex items-center gap-2 md:gap-3 pl-2 md:pl-4 border-l border-slate-100 group relative">
            <div className="w-8 h-8 md:w-9 md:h-9 bg-indigo-500 rounded-xl flex items-center justify-center text-white font-black text-[10px] md:text-xs shadow-lg shadow-indigo-500/20">
              {userName ? userName[0].toUpperCase() : 'U'}
            </div>
            <div className="hidden lg:block text-left">
              <p className="text-xs font-black text-slate-800 leading-none mb-1 truncate max-w-[80px]">{userName || 'User'}</p>
              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest leading-none">PREMIUM</p>
            </div>
            <button 
              onClick={() => signOut(auth)}
              className="p-1.5 md:p-2 hover:bg-rose-50 text-slate-400 hover:text-rose-500 rounded-xl transition-all"
              title="Sign Out"
            >
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </header>

      {/* Bottom Navigation for Mobile */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-100 flex items-center justify-around h-16 z-50 px-2 no-print">
        <RRD.Link 
          to="/" 
          className={`flex flex-col items-center justify-center gap-1 w-full h-full transition-all ${isDashboard ? 'text-[#4FB5C0]' : 'text-slate-400'}`}
        >
          <LayoutDashboard size={20} />
          <span className="text-[9px] font-black uppercase tracking-tight">{t.dashboard}</span>
        </RRD.Link>
        <RRD.Link 
          to="/schedule" 
          className={`flex flex-col items-center justify-center gap-1 w-full h-full transition-all ${isSchedule ? 'text-[#4FB5C0]' : 'text-slate-400'}`}
        >
          <Calendar size={20} />
          <span className="text-[9px] font-black uppercase tracking-tight">{t.schedule}</span>
        </RRD.Link>
        <RRD.Link 
          to="/help" 
          className={`flex flex-col items-center justify-center gap-1 w-full h-full transition-all ${isHelp ? 'text-rose-500' : 'text-slate-400'}`}
        >
          <LifeBuoy size={20} />
          <span className="text-[9px] font-black uppercase tracking-tight">{t.helpMode || "HELP"}</span>
        </RRD.Link>
      </nav>
    </>
  );
};

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
        // Fetch custom name from firestore
        const userDoc = await getDoc(doc(db, "users", firebaseUser.uid));
        if (userDoc.exists()) {
          setUserName(userDoc.data().name);
        } else {
          setUserName(firebaseUser.displayName || '');
        }
      }
      setAuthLoading(false);
    });
    return () => unsubscribe();
  }, []);

  if (authLoading) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center gap-4">
        <Loader2 className="animate-spin text-[#4FB5C0]" size={40} />
        <p className="font-black uppercase text-[10px] tracking-widest text-slate-400">Authenticating</p>
      </div>
    );
  }

  if (!user) {
    return <Auth />;
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#F8FAFB] text-slate-900 font-sans selection:bg-[#4FB5C0]/20 selection:text-[#4FB5C0] pb-16 md:pb-0">
      <Header context={context} setContext={setContext} user={user} userName={userName} />
      <main className="flex-1 p-4 sm:p-6 md:p-8 lg:p-12 overflow-y-auto">
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
