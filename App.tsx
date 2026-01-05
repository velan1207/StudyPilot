
import React, { useState } from 'react';
import { HashRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Calendar,
  ChevronDown,
  GraduationCap,
  Globe
} from 'lucide-react';
import { GradeLevel, Language, TeacherContext } from './types';
import { UI_STRINGS } from './translations';

// Pages
import Dashboard from './pages/Dashboard';
import GradeWorkspace from './pages/GradeWorkspace';

const Header = ({ context, setContext }: { context: TeacherContext, setContext: any }) => {
  const location = useLocation();
  const isDashboard = location.pathname === '/';
  const t = UI_STRINGS[context.language];

  return (
    <header className="bg-white/80 backdrop-blur-md border-b border-slate-100 px-6 h-16 flex items-center justify-between sticky top-0 z-50">
      <div className="flex items-center gap-10">
        <Link to="/" className="flex items-center gap-2">
          <div className="bg-[#4FB5C0] p-1.5 rounded-lg shadow-lg shadow-[#4FB5C0]/20">
            <GraduationCap className="text-white" size={20} />
          </div>
          <span className="text-xl font-black text-[#4FB5C0] tracking-tight">StudyPilot</span>
        </Link>
        
        <nav className="hidden md:flex items-center gap-2">
          <Link 
            to="/" 
            className={`px-4 py-1.5 rounded-full text-xs font-black transition-all flex items-center gap-2 ${isDashboard ? 'bg-[#E6F4F5] text-[#4FB5C0]' : 'text-slate-400 hover:text-slate-800'}`}
          >
            <LayoutDashboard size={14} /> {t.dashboard}
          </Link>
          <Link 
            to="/schedule" 
            className={`px-4 py-1.5 rounded-full text-xs font-black transition-all flex items-center gap-2 ${location.pathname === '/schedule' ? 'bg-[#E6F4F5] text-[#4FB5C0]' : 'text-slate-400 hover:text-slate-800'}`}
          >
            <Calendar size={14} /> {t.schedule}
          </Link>
        </nav>
      </div>

      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 rounded-xl border border-slate-100 group hover:border-[#4FB5C0]/30 transition-all relative">
          <Globe size={14} className="text-slate-400 group-hover:text-[#4FB5C0]" />
          <span className="text-xs font-black text-slate-700">{context.language}</span>
          <select 
            value={context.language}
            onChange={(e) => setContext({ ...context, language: e.target.value as Language })}
            className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
          >
            {Object.values(Language).map(lang => (
              <option key={lang} value={lang}>{lang}</option>
            ))}
          </select>
          <ChevronDown size={14} className="text-slate-400" />
        </div>

        <div className="flex items-center gap-3 pl-4 border-l border-slate-100">
          <div className="w-9 h-9 bg-indigo-500 rounded-xl flex items-center justify-center text-white font-black text-xs shadow-lg shadow-indigo-500/20">
            P
          </div>
          <div className="hidden sm:block">
            <p className="text-xs font-black text-slate-800 leading-none mb-1">Priya</p>
            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest leading-none">PREMIUM</p>
          </div>
          <ChevronDown size={14} className="text-slate-400" />
        </div>
      </div>
    </header>
  );
};

const App: React.FC = () => {
  const [context, setContext] = useState<TeacherContext>({
    grade: GradeLevel.G1,
    language: Language.TAMIL
  });

  return (
    <div className="min-h-screen flex flex-col bg-[#F8FAFB] text-slate-900 font-sans selection:bg-[#4FB5C0]/20 selection:text-[#4FB5C0]">
      <Header context={context} setContext={setContext} />
      <main className="flex-1 p-6 md:p-8 lg:p-12 overflow-y-auto">
        <Routes>
          <Route path="/" element={<Dashboard context={context} setContext={setContext} />} />
          <Route path="/grade/:gradeId" element={<GradeWorkspace context={context} setContext={setContext} />} />
          <Route path="/schedule" element={<div className="text-center py-20 text-slate-400 font-black uppercase tracking-widest text-xs">Schedule feature coming soon...</div>} />
        </Routes>
      </main>
    </div>
  );
};

const AppWrapper = () => (
  <Router>
    <App />
  </Router>
);

export default AppWrapper;
