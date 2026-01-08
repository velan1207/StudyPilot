
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
  Target
} from 'lucide-react';
import { TeacherContext } from '../types';
import { getHelpAdvice } from '../services/geminiService';

interface StructuredAdvice {
  summary: string;
  sections: {
    title: string;
    description: string;
    actionStep: string;
  }[];
  teacherTip: string;
}

const QuickIssueButton = ({ icon: Icon, label, onClick }: { icon: any, label: string, onClick: () => void }) => (
  <button 
    onClick={onClick}
    className="flex flex-col items-center justify-center p-5 md:p-6 bg-white border border-slate-100 rounded-[1.5rem] md:rounded-[2rem] shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all group flex-1 min-w-[120px]"
  >
    <div className="w-10 h-10 md:w-12 md:h-12 bg-rose-50 text-rose-500 rounded-xl md:rounded-2xl flex items-center justify-center mb-2 md:mb-3 group-hover:scale-110 transition-transform">
      <Icon size={20} className="md:w-[24px] md:h-[24px]" />
    </div>
    <span className="text-[9px] md:text-[10px] font-black text-slate-600 uppercase tracking-widest text-center leading-tight">{label}</span>
  </button>
);

const HelpMode: React.FC<{ context: TeacherContext }> = ({ context }) => {
  const [input, setInput] = useState('');
  const [advice, setAdvice] = useState<StructuredAdvice | null>(null);
  const [loading, setLoading] = useState(false);
  const adviceEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (advice) {
      adviceEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [advice]);

  const handleHelp = async (customText?: string) => {
    const text = customText || input;
    if (!text.trim()) return;

    setLoading(true);
    setAdvice(null);
    try {
      const res = await getHelpAdvice(text, context.grade, context.language);
      setAdvice(res);
    } catch (err) {
      console.error(err);
      alert("Something went wrong. Please check your connection and try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 md:space-y-12 animate-in fade-in duration-700 px-4">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-rose-500 font-black text-[9px] md:text-[10px] uppercase tracking-[0.3em] border-l-4 border-rose-500 pl-4 leading-none">
             Help Mode Active
          </div>
          <h2 className="text-3xl md:text-5xl font-black text-slate-800 tracking-tighter leading-tight uppercase">Instant Support</h2>
          <p className="text-slate-400 font-medium text-base md:text-lg">AI coaching for {context.grade}.</p>
        </div>
        <div className="w-14 h-14 md:w-20 md:h-20 bg-rose-500 rounded-2xl md:rounded-[2rem] flex items-center justify-center text-white shadow-2xl shadow-rose-500/20 animate-pulse shrink-0 self-start sm:self-center">
           <ShieldAlert size={28} className="md:w-[40px] md:h-[40px]" />
        </div>
      </div>

      <div className="bg-white rounded-[2rem] md:rounded-[3rem] border border-slate-100 shadow-sm p-6 md:p-10 space-y-8 md:space-y-10 relative overflow-hidden">
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-slate-400 font-black text-[9px] md:text-[10px] uppercase tracking-[0.2em]">
            <MessageSquare size={14} className="text-rose-500" /> Describe the situation
          </div>
          <div className="relative">
            <textarea 
              placeholder="e.g., The class is too noisy..."
              className="w-full h-40 md:h-48 px-6 py-5 md:px-8 md:py-6 bg-slate-50 border-none rounded-2xl md:rounded-[2rem] text-base md:text-lg font-black text-slate-800 outline-none focus:ring-4 ring-rose-500/5 transition-all resize-none"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleHelp();
                }
              }}
            />
            <button 
              onClick={() => handleHelp()}
              disabled={loading || !input.trim()}
              className="absolute bottom-4 right-4 md:bottom-6 md:right-6 px-6 py-3 md:px-10 md:py-4 bg-rose-500 text-white rounded-xl md:rounded-2xl font-black shadow-xl hover:scale-105 transition-all active:scale-95 disabled:opacity-50 text-xs md:text-sm uppercase tracking-widest"
            >
              {loading ? <Loader2 className="animate-spin" size={18} /> : <Sparkles size={18} className="inline mr-2" />}
              {loading ? "Analyzing..." : "Get Help"}
            </button>
          </div>
        </div>

        <div className="flex flex-col gap-4">
          <p className="text-[9px] md:text-[10px] font-black text-slate-300 uppercase tracking-widest text-center">Quick Emergency Issues</p>
          <div className="grid grid-cols-2 md:flex md:flex-wrap gap-3 md:gap-4">
             <QuickIssueButton icon={VolumeX} label="Too noisy" onClick={() => { handleHelp("The classroom is extremely noisy and I can't start the lesson."); }} />
             <QuickIssueButton icon={UserMinus} label="Disengaged" onClick={() => { handleHelp("Students look bored and are not paying attention."); }} />
             <QuickIssueButton icon={Users} label="Group chaos" onClick={() => { handleHelp("The group activity has turned into chaos."); }} />
             <QuickIssueButton icon={RefreshCcw} label="Confusion" onClick={() => { handleHelp("Students are confused about the task."); }} />
          </div>
        </div>
      </div>

      {advice && (
        <div className="space-y-8 pb-20 animate-in fade-in duration-500">
           {/* Summary Section */}
           <div className="bg-white border-l-8 border-rose-500 rounded-3xl p-8 shadow-sm">
             <div className="flex items-center gap-3 mb-3 text-rose-500 font-black uppercase text-xs tracking-widest">
                <Target size={18} /> The Root Cause
             </div>
             <p className="text-xl md:text-2xl font-bold text-slate-800 leading-tight">
               {advice.summary}
             </p>
           </div>

           {/* Advice Cards */}
           <div className="grid grid-cols-1 gap-6">
              {advice.sections.map((section, idx) => (
                <div key={idx} className="bg-white rounded-[2.5rem] border border-slate-100 p-8 md:p-10 shadow-sm space-y-6 animate-in slide-in-from-bottom-4 duration-500" style={{ animationDelay: `${idx * 150}ms` }}>
                  <div className="flex items-center justify-between gap-4">
                     <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center font-black text-lg">
                          {idx + 1}
                        </div>
                        <h4 className="font-black text-lg md:text-xl uppercase tracking-tight text-slate-800">{section.title}</h4>
                     </div>
                     <Zap size={24} className="text-amber-400 opacity-20 hidden sm:block" />
                  </div>
                  
                  <p className="text-slate-600 font-medium leading-relaxed text-base md:text-lg">
                    {section.description}
                  </p>

                  <div className="bg-[#F0F9FA] border border-[#4FB5C0]/20 rounded-2xl p-6 flex items-start gap-4">
                     <CheckCircle2 className="text-[#4FB5C0] shrink-0 mt-1" size={20} />
                     <div>
                        <p className="text-[10px] font-black text-[#4FB5C0] uppercase tracking-widest mb-1">Action Step</p>
                        <p className="text-slate-800 font-black text-sm md:text-base leading-snug">
                          {section.actionStep}
                        </p>
                     </div>
                  </div>
                </div>
              ))}
           </div>
           
           {/* Teacher Tip Footer */}
           <div className="bg-indigo-600 border border-indigo-700 rounded-[2.5rem] p-8 md:p-12 flex flex-col md:flex-row items-center gap-8 text-white relative overflow-hidden shadow-2xl">
              <div className="absolute -right-10 -bottom-10 opacity-10 pointer-events-none">
                 <Lightbulb size={240} />
              </div>
              <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center shrink-0">
                 <Info size={32} />
              </div>
              <div className="space-y-2 relative z-10 text-center md:text-left">
                <h5 className="font-black text-xs md:text-sm uppercase tracking-[0.3em] text-indigo-200">Coach's Professional Tip</h5>
                <p className="text-indigo-50 font-bold italic leading-relaxed text-lg md:text-xl">
                  "{advice.teacherTip}"
                </p>
              </div>
           </div>

           <div ref={adviceEndRef} />
        </div>
      )}

      {loading && (
        <div className="flex flex-col items-center justify-center py-12 md:py-20 space-y-4 md:space-y-6 animate-pulse">
           <div className="w-16 h-16 md:w-20 md:h-20 bg-rose-50 rounded-[2rem] flex items-center justify-center text-rose-500 shadow-inner">
              <Loader2 className="animate-spin md:w-[32px] md:h-[32px]" size={24} />
           </div>
           <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.5em]">Consulting Educational Coach...</p>
        </div>
      )}
    </div>
  );
};

export default HelpMode;
