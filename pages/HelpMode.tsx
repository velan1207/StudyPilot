
import React, { useState, useRef, useEffect } from 'react';
import { 
  ShieldAlert, 
  MessageSquare, 
  Send, 
  Loader2, 
  VolumeX, 
  UserMinus, 
  Users, 
  RefreshCcw,
  Sparkles,
  Info,
  CheckCircle2,
  Lightbulb,
  Zap,
  Target,
  History as HistoryIcon,
  X,
  Trash2,
  Clock
} from 'lucide-react';
import { TeacherContext } from '../types';
import { getHelpAdvice } from '../services/geminiService';
import { auth, db } from '../firebase';
import { collection, query, orderBy, onSnapshot, addDoc, serverTimestamp, deleteDoc, doc } from 'firebase/firestore';
import { UI_STRINGS } from '../translations';

const QuickIssueButton = ({ icon: Icon, label, onClick }: any) => (
  <button 
    onClick={onClick}
    className="flex flex-col items-center justify-center p-8 bg-white rounded-[2.5rem] shadow-xl hover:shadow-2xl hover:-translate-y-2 transition-all group flex-1 min-w-[140px] border border-slate-100"
  >
    <div className="w-14 h-14 bg-rose-50 text-rose-500 rounded-2xl flex items-center justify-center mb-4 group-hover:bg-rose-500 group-hover:text-white transition-all shadow-inner">
      <Icon size={24} />
    </div>
    <span className="text-[10px] font-black text-slate-800 uppercase tracking-widest text-center">{label}</span>
  </button>
);

const HelpMode: React.FC<{ context: TeacherContext }> = ({ context }) => {
  const [input, setInput] = useState('');
  const [advice, setAdvice] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [history, setHistory] = useState<any[]>([]);
  const t = UI_STRINGS[context.language];

  useEffect(() => {
    const user = auth.currentUser;
    if (!user) return;
    const q = query(collection(db, "users", user.uid, "helpHistory"), orderBy("createdAt", "desc"));
    return onSnapshot(q, (snapshot) => {
      setHistory(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
    });
  }, []);

  const handleHelp = async (customText?: string) => {
    const text = customText || input;
    if (!text.trim()) return;
    setLoading(true); setAdvice(null);
    try {
      const res = await getHelpAdvice(text, context.grade, context.language);
      setAdvice(res);
      const user = auth.currentUser;
      if (user && res) await addDoc(collection(db, "users", user.uid, "helpHistory"), { situation: text, advice: res, createdAt: serverTimestamp() });
    } finally { setLoading(false); }
  };

  return (
    <div className="max-w-7xl mx-auto flex flex-col lg:flex-row gap-12 animate-in fade-in duration-1000">
      <div className={`fixed lg:relative inset-y-0 left-0 w-96 glass-panel z-[110] transition-transform duration-500 lg:transform-none ${showHistory ? 'translate-x-0' : '-translate-x-full lg:hidden'} lg:rounded-[3rem] lg:h-fit lg:p-8`}>
        <div className="p-8 lg:p-0">
          <div className="flex items-center justify-between mb-8">
            <h4 className="text-xl font-black uppercase tracking-tighter text-slate-900">{t.coachingLog}</h4>
            <button onClick={() => setShowHistory(false)} className="lg:hidden p-2"><X /></button>
          </div>
          <div className="space-y-4 max-h-[60vh] overflow-y-auto custom-scrollbar">
            {history.map((item) => (
              <div key={item.id} onClick={() => { setAdvice(item.advice); setShowHistory(false); }} className="bg-white p-5 rounded-[1.5rem] border border-slate-100 hover:border-rose-500 transition-all cursor-pointer shadow-sm">
                <p className="text-xs font-black text-slate-800 line-clamp-2 uppercase mb-2 tracking-tight">{item.situation}</p>
                <div className="flex items-center justify-between">
                  <span className="text-[8px] font-black text-slate-300 uppercase tracking-widest">{new Date(item.createdAt?.seconds * 1000).toLocaleDateString()}</span>
                  <button onClick={(e) => { e.stopPropagation(); deleteDoc(doc(db, "users", auth.currentUser!.uid, "helpHistory", item.id)); }} className="text-slate-200 hover:text-rose-500"><Trash2 size={14} /></button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="flex-1 space-y-12">
        <div className="flex items-center justify-between">
          <div>
            <span className="px-4 py-1 bg-rose-500/10 text-rose-600 rounded-full text-[10px] font-black uppercase tracking-[0.3em] border border-rose-500/20 mb-4 inline-block">{t.supportLab}</span>
            <h2 className="text-5xl md:text-7xl font-black text-slate-900 tracking-tighter leading-none uppercase">{t.emergencyCoach.split(' ')[0]} <span className="text-rose-600">{t.emergencyCoach.split(' ')[1] || 'COACH'}</span></h2>
          </div>
          <button onClick={() => setShowHistory(!showHistory)} className="w-16 h-16 bg-white rounded-full flex items-center justify-center text-slate-400 hover:text-rose-600 shadow-2xl transition-all"><HistoryIcon size={24} /></button>
        </div>

        <div className="bg-white rounded-[4rem] p-12 shadow-2xl border border-slate-100 space-y-10 relative overflow-hidden">
          <div className="space-y-4">
            <textarea 
              placeholder={t.classroomStatusPlaceholder}
              className="w-full h-48 px-10 py-8 bg-slate-50 border-none rounded-[3rem] text-xl font-black text-slate-800 outline-none focus:ring-4 ring-rose-500/10 transition-all resize-none shadow-inner"
              value={input}
              onChange={(e) => setInput(e.target.value)}
            />
            <button 
              onClick={() => handleHelp()}
              disabled={loading || !input.trim()}
              className="w-full py-6 bg-rose-600 text-white rounded-[2rem] font-black shadow-2xl shadow-rose-600/30 hover:scale-[1.02] transition-all uppercase tracking-[0.2em] text-sm flex items-center justify-center gap-3"
            >
              {loading ? <Loader2 className="animate-spin" size={24} /> : <Zap size={24} />}
              {t.generateCoachStrategy}
            </button>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
             <QuickIssueButton icon={VolumeX} label={t.tooNoisy} onClick={() => handleHelp("The classroom is extremely noisy.")} />
             <QuickIssueButton icon={UserMinus} label={t.studentsBored} onClick={() => handleHelp("Students look bored.")} />
             <QuickIssueButton icon={Users} label={t.groupChaos} onClick={() => handleHelp("Group activity is chaos.")} />
             <QuickIssueButton icon={RefreshCcw} label={t.confusion} onClick={() => handleHelp("Students are confused.")} />
          </div>
        </div>

        {advice && (
          <div className="space-y-8 animate-in slide-in-from-bottom-12 duration-700">
             <div className="bg-slate-900 text-white rounded-[3rem] p-10 shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 p-10 opacity-10 pointer-events-none"><Target size={200} /></div>
                <div className="relative z-10">
                   <h4 className="text-rose-500 font-black uppercase text-xs tracking-widest mb-4 flex items-center gap-2"><Target size={18} /> THE ROOT CAUSE</h4>
                   <p className="text-3xl font-bold leading-tight">{advice.summary}</p>
                </div>
             </div>

             <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {advice.sections.map((section: any, idx: number) => (
                  <div key={idx} className="bg-white rounded-[3rem] p-10 border border-slate-100 shadow-xl space-y-6">
                    <div className="w-12 h-12 bg-rose-50 text-rose-600 rounded-2xl flex items-center justify-center font-black text-xl">{idx + 1}</div>
                    <h5 className="text-2xl font-black uppercase tracking-tighter text-slate-900">{section.title}</h5>
                    <p className="text-slate-500 font-medium leading-relaxed">{section.description}</p>
                    <div className="bg-emerald-50 p-6 rounded-2xl border border-emerald-100 flex items-start gap-4">
                       <CheckCircle2 className="text-emerald-600 shrink-0" size={24} />
                       <p className="text-emerald-900 font-black text-sm uppercase">{section.actionStep}</p>
                    </div>
                  </div>
                ))}
             </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default HelpMode;
