
import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { 
  ArrowLeft, 
  Sparkles, 
  X, 
  FileText as FileIcon,
  HelpCircle as QuestionIcon,
  Zap,
  BookOpen,
  Printer,
  Send,
  Settings,
  Plus,
  Trash2,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  Clock,
  Calendar,
  Loader2,
  Minus,
  Layout,
  Save,
  MessageSquare,
  PlusCircle,
  CheckCircle2,
  AlertTriangle,
  Monitor,
  Pencil,
  Archive,
  ExternalLink,
  Target,
  Circle,
  Square as SquareIcon
} from 'lucide-react';
import { 
  TeacherContext, 
  QuestionSettings, 
  QuestionPaper,
  Section,
  Question,
  SlideDeck,
  SyllabusPlan,
  SectionBlueprint,
  OneMarkVariety
} from '../types';
import { 
  generateQuestionPaper, 
  generateSlideDeck, 
  askChatQuestion,
  generateSyllabusPlan,
  generateHomework
} from '../services/geminiService';
import { UI_STRINGS } from '../translations';
import { auth, db } from '../firebase';
import { doc, onSnapshot, setDoc, arrayUnion, collection, query, deleteDoc, getDocs, orderBy, serverTimestamp, where } from 'firebase/firestore';

const ConfirmModal = ({ isOpen, onClose, onConfirm, title, message, actionLabel }: any) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-[200] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-[2rem] w-full max-w-sm overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
        <div className="p-8 text-center">
          <div className="w-16 h-16 bg-rose-50 text-rose-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle size={32} />
          </div>
          <h3 className="text-xl font-black text-slate-800 mb-2 uppercase tracking-tight">{title}</h3>
          <p className="text-sm font-medium text-slate-500 leading-relaxed">{message}</p>
        </div>
        <div className="p-6 bg-slate-50 flex gap-3">
          <button onClick={onClose} className="flex-1 py-3 font-black text-slate-400 uppercase text-[10px] tracking-widest">Cancel</button>
          <button onClick={onConfirm} className="flex-1 py-3 bg-rose-500 text-white rounded-xl font-black uppercase text-[10px] tracking-widest shadow-lg shadow-rose-500/20">{actionLabel}</button>
        </div>
      </div>
    </div>
  );
};

const VaultModal = ({ isOpen, onClose, gradeId, onLoad }: { isOpen: boolean, onClose: () => void, gradeId: string, onLoad: (item: any) => void }) => {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isOpen) return;
    const user = auth.currentUser;
    if (!user) return;

    // Simplified query: removed 'orderBy' to avoid requiring a composite index immediately.
    // Firestore provides automatic ordering by ID which is sufficient for basic lists.
    const q = query(
      collection(db, "users", user.uid, "vault"),
      where("grade", "==", gradeId)
    );

    const unsub = onSnapshot(q, (snapshot) => {
      setItems(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setLoading(false);
    }, (error) => {
      console.error("Vault snapshot error:", error);
      setLoading(false);
    });
    return unsub;
  }, [isOpen, gradeId]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[150] bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-[2.5rem] w-full max-w-3xl overflow-hidden flex flex-col shadow-2xl animate-in zoom-in-95 duration-300 max-h-[85vh]">
        <div className="p-8 border-b bg-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-5">
            <div className="w-14 h-14 bg-indigo-50 text-indigo-500 rounded-2xl flex items-center justify-center"><Archive size={28} /></div>
            <div>
              <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight">Grade Vault</h3>
              <p className="text-sm font-bold text-slate-400">Saved content for {gradeId}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-slate-300 hover:text-slate-600 transition-colors"><X size={28} /></button>
        </div>
        <div className="p-8 overflow-y-auto custom-scrollbar flex-1 bg-slate-50/30">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
              <Loader2 className="animate-spin text-indigo-500" size={32} />
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Opening Vault...</p>
            </div>
          ) : items.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 text-center space-y-6">
              <div className="w-24 h-24 bg-slate-100 rounded-full flex items-center justify-center text-slate-300 mx-auto">
                <Archive size={40} />
              </div>
              <div>
                <p className="text-xl font-black text-slate-400 uppercase tracking-tight">Your Vault is Empty</p>
                <p className="text-xs font-bold text-slate-300 uppercase tracking-[0.2em] mt-2 max-w-[280px] mx-auto leading-relaxed">
                  Start generating syllabus plans, question papers, or slides and save them to access them here later.
                </p>
              </div>
              <button onClick={onClose} className="px-8 py-3 bg-white border border-slate-200 text-slate-500 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-50 transition-all">Got it</button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {items.map((item) => (
                <div key={item.id} className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm hover:shadow-xl hover:border-indigo-200 transition-all group">
                  <div className="flex items-start justify-between mb-4">
                    <div className="w-10 h-10 bg-slate-50 text-slate-400 rounded-xl flex items-center justify-center group-hover:bg-indigo-50 group-hover:text-indigo-500 transition-colors">
                      {item.type === 'question_paper' ? <FileIcon size={20} /> : item.type === 'slide_deck' ? <Monitor size={20} /> : <BookOpen size={20} />}
                    </div>
                    <span className="text-[8px] font-black bg-slate-50 text-slate-400 px-2 py-1 rounded-md uppercase tracking-widest">
                      {item.createdAt?.toDate ? item.createdAt.toDate().toLocaleDateString() : 'Recent'}
                    </span>
                  </div>
                  <h4 className="font-black text-slate-800 text-sm mb-1 uppercase tracking-tight line-clamp-1">{item.title}</h4>
                  <p className="text-[9px] font-black text-indigo-500 uppercase tracking-widest mb-6">
                    {item.type.replace('_', ' ')}
                  </p>
                  <button 
                    onClick={() => onLoad(item)}
                    className="w-full py-3 bg-slate-50 hover:bg-indigo-500 hover:text-white text-slate-500 rounded-xl font-black uppercase text-[9px] tracking-[0.2em] transition-all flex items-center justify-center gap-2"
                  >
                    Load Content <ExternalLink size={12} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const SlideConfigModal = ({ isOpen, onClose, onConfirm }: any) => {
  const [count, setCount] = useState(12);
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-[150] bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-white rounded-[2.5rem] w-full max-w-md overflow-hidden flex flex-col shadow-2xl animate-in zoom-in-95 duration-300">
        <div className="p-8 border-b bg-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-5">
            <div className="w-14 h-14 bg-amber-50 text-amber-500 rounded-2xl flex items-center justify-center border border-amber-100 shadow-sm"><Layout size={28} /></div>
            <div>
              <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight">Slide Deck Config</h3>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Specify presentation length</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-slate-300 hover:text-slate-600 transition-colors"><X size={28} /></button>
        </div>
        <div className="p-12 flex flex-col items-center justify-center gap-10">
          <div className="flex items-center gap-10">
            <button onClick={() => setCount(Math.max(1, count - 1))} className="w-14 h-14 bg-slate-50 border border-slate-100 rounded-2xl flex items-center justify-center text-slate-400 hover:bg-white hover:shadow-lg transition-all active:scale-90"><Minus size={24} strokeWidth={3} /></button>
            <div className="text-7xl font-black text-slate-800 tracking-tighter w-24 text-center">{count}</div>
            <button onClick={() => setCount(Math.min(30, count + 1))} className="w-14 h-14 bg-slate-50 border border-slate-100 rounded-2xl flex items-center justify-center text-slate-400 hover:bg-white hover:shadow-lg transition-all active:scale-90"><Plus size={24} strokeWidth={3} /></button>
          </div>
          <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.3em]">Total Slides to Generate</p>
        </div>
        <div className="p-10 border-t bg-slate-50/50 flex items-center justify-between gap-6">
          <button onClick={onClose} className="flex-1 py-5 font-black text-slate-400 uppercase text-[10px] tracking-widest hover:text-slate-600 transition-colors">Cancel</button>
          <button onClick={() => onConfirm(count)} className="flex-1 py-5 bg-[#EBA848] text-white rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-xl shadow-amber-500/20 hover:scale-[1.02] active:scale-95 transition-all">Create Deck</button>
        </div>
      </div>
    </div>
  );
};

const MasterPlanModal = ({ isOpen, onClose, onConfirm }: any) => {
  const [duration, setDuration] = useState(5);
  const [unit, setUnit] = useState<'Days' | 'Weeks' | 'Months'>('Days');
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-[150] bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-[2.5rem] w-full max-w-md overflow-hidden flex flex-col shadow-2xl animate-in zoom-in-95 duration-300">
        <div className="p-8 border-b bg-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-5">
            <div className="w-14 h-14 bg-indigo-50 text-indigo-500 rounded-2xl flex items-center justify-center"><Calendar size={28} /></div>
            <div>
              <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight">Master Plan</h3>
              <p className="text-sm font-bold text-slate-400">Set timeframe</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-slate-300 hover:text-slate-600 transition-colors"><X size={28} /></button>
        </div>
        <div className="p-10 space-y-8">
          <div className="space-y-4">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block ml-1">Plan Duration</label>
            <div className="flex gap-4">
              <input type="number" min="1" value={duration} onChange={e => setDuration(parseInt(e.target.value) || 1)} className="w-24 bg-slate-50 p-5 rounded-2xl text-2xl font-black text-slate-800 border-none outline-none focus:ring-2 ring-indigo-500/20 shadow-inner text-center" />
              <select value={unit} onChange={e => setUnit(e.target.value as any)} className="flex-1 bg-slate-50 p-5 rounded-2xl text-xl font-black text-slate-800 border-none outline-none focus:ring-2 ring-indigo-500/20 shadow-inner appearance-none">
                <option value="Days">Days</option><option value="Weeks">Weeks</option><option value="Months">Months</option>
              </select>
            </div>
          </div>
        </div>
        <div className="p-10 border-t bg-slate-50/50 flex flex-col gap-4">
          <button onClick={() => onConfirm(duration, unit)} className="w-full py-5 bg-indigo-500 text-white rounded-[1.5rem] font-black uppercase text-xs tracking-widest shadow-xl shadow-indigo-500/20 hover:scale-[1.02] active:scale-95 transition-all">Generate Syllabus Plan</button>
        </div>
      </div>
    </div>
  );
};

const BlueprintModal = ({ isOpen, onClose, gradeId, settings, setSettings, onConfirm }: any) => {
  if (!isOpen) return null;
  const calculateCurrentTotal = () => settings.sections.reduce((acc: number, s: any) => {
    const questionsToAnswer = s.type === 'any-x-among-y' ? (s.choiceCount || s.count) : s.count;
    return acc + (s.marksPerQuestion * questionsToAnswer);
  }, 0);
  
  const currentTotal = calculateCurrentTotal();
  const isBalanced = currentTotal === settings.totalMarks;
  const updateSection = (id: string, updates: Partial<SectionBlueprint>) => setSettings({ ...settings, sections: settings.sections.map((s: any) => s.id === id ? { ...s, ...updates } : s) });
  const addSection = () => setSettings({ ...settings, sections: [...settings.sections, { id: Date.now().toString(), marksPerQuestion: 1, count: 5, type: 'compulsory' }] });
  const removeSection = (id: string) => setSettings({ ...settings, sections: settings.sections.filter((s: any) => s.id !== id) });

  return (
    <div className="fixed inset-0 z-[150] bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-[2.5rem] w-full max-w-6xl overflow-hidden flex flex-col shadow-2xl animate-in zoom-in-95 duration-300 max-h-[90vh]">
        <div className="p-8 border-b bg-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-5">
            <div className="w-14 h-14 bg-[#4FB5C0]/10 text-[#4FB5C0] rounded-2xl flex items-center justify-center"><Settings size={28} /></div>
            <div>
              <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight">Question Paper Blueprint</h3>
              <p className="text-sm font-bold text-slate-400">Configure layout for {gradeId}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-slate-300 hover:text-slate-600 transition-colors"><X size={28} /></button>
        </div>
        <div className="p-10 overflow-y-auto space-y-10 custom-scrollbar">
          <div className="grid grid-cols-3 gap-8">
            <div className="space-y-3">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block ml-1">Total Exam Marks</label>
              <input type="number" value={settings.totalMarks} onChange={e => setSettings({...settings, totalMarks: parseInt(e.target.value) || 0})} className="w-full bg-slate-50/50 p-6 rounded-[1.5rem] text-2xl font-black text-slate-800 border-none outline-none focus:ring-2 ring-[#4FB5C0]/20 shadow-inner" />
            </div>
            <div className="space-y-3">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block ml-1">Duration</label>
              <input value={settings.duration} onChange={e => setSettings({...settings, duration: e.target.value})} className="w-full bg-slate-50/50 p-6 rounded-[1.5rem] text-xl font-black text-slate-800 border-none outline-none focus:ring-2 ring-[#4FB5C0]/20 shadow-inner" />
            </div>
            <div className="space-y-3">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block ml-1">Difficulty</label>
              <select value={settings.difficulty} onChange={e => setSettings({...settings, difficulty: e.target.value as any})} className="w-full bg-slate-50/50 p-6 rounded-[1.5rem] text-xl font-black text-slate-800 border-none outline-none focus:ring-2 ring-[#4FB5C0]/20 appearance-none shadow-inner">
                <option>Easy</option><option>Medium</option><option>Hard</option>
              </select>
            </div>
          </div>
          <div className="space-y-6">
            {settings.sections.map((section: any) => (
              <div key={section.id} className="relative group">
                <div className={`bg-slate-50/40 p-8 rounded-[2rem] border border-slate-100 grid grid-cols-12 items-end gap-6`}>
                  <div className="col-span-2 space-y-3">
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Marks Per Q</label>
                    <input type="number" value={section.marksPerQuestion} onChange={e => updateSection(section.id, { marksPerQuestion: parseInt(e.target.value) || 0, oneMarkVariety: parseInt(e.target.value) === 1 ? 'MCQ' : undefined })} className="w-full bg-white p-5 rounded-2xl text-xl font-black text-[#4FB5C0] border-none outline-none shadow-sm text-center" />
                  </div>
                  <div className="col-span-2 space-y-3">
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">
                      {section.type === 'either-or' ? 'Q Pairs' : 'Total Qs'}
                    </label>
                    <input type="number" value={section.count} onChange={e => updateSection(section.id, { count: parseInt(e.target.value) || 0 })} className="w-full bg-white p-5 rounded-2xl text-xl font-black text-slate-800 border-none outline-none shadow-sm text-center" />
                  </div>
                  <div className={`${(section.type === 'any-x-among-y' || section.marksPerQuestion === 1) ? 'col-span-4' : 'col-span-8'} space-y-3`}>
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Section Type</label>
                    <select 
                      value={section.type} 
                      onChange={(e) => updateSection(section.id, { 
                        type: e.target.value as any, 
                        choiceCount: e.target.value === 'any-x-among-y' ? (section.choiceCount || Math.ceil(section.count * 0.7)) : undefined 
                      })} 
                      className="w-full bg-white p-5 rounded-2xl text-sm font-black text-slate-800 border-none outline-none shadow-sm appearance-none"
                    >
                      <option value="compulsory">Compulsory</option>
                      <option value="any-x-among-y">Internal Choice (Any X of Y)</option>
                      <option value="either-or">Either/Or (1A or 1B)</option>
                    </select>
                  </div>
                  {section.marksPerQuestion === 1 && (
                    <div className="col-span-4 space-y-3 animate-in fade-in slide-in-from-top-2 duration-300">
                      <label className="text-[9px] font-black text-amber-500 uppercase tracking-widest ml-1">Question Variety (1 Mark Only)</label>
                      <select 
                        value={section.oneMarkVariety || 'MCQ'} 
                        onChange={e => updateSection(section.id, { oneMarkVariety: e.target.value as OneMarkVariety })} 
                        className="w-full bg-amber-50 p-5 rounded-2xl text-sm font-black text-amber-600 border-none outline-none shadow-sm appearance-none"
                      >
                        <option value="MCQ">Multiple Choice (MCQ)</option>
                        <option value="Fill in the blanks">Fill in the blanks</option>
                        <option value="True or False">True or False</option>
                        <option value="Statement/Reason">Statement & Reason</option>
                        <option value="Default">Short Answer (One Word)</option>
                      </select>
                    </div>
                  )}
                  {section.type === 'any-x-among-y' && (
                    <div className="col-span-4 space-y-3 animate-in fade-in slide-in-from-left-2 duration-300">
                      <label className="text-[9px] font-black text-[#4FB5C0] uppercase tracking-widest ml-1">Choice Limit (X)</label>
                      <input 
                        type="number" 
                        max={section.count}
                        value={section.choiceCount} 
                        onChange={e => updateSection(section.id, { choiceCount: Math.min(section.count, parseInt(e.target.value) || 1) })} 
                        className="w-full bg-[#E6F4F5] p-5 rounded-2xl text-xl font-black text-[#4FB5C0] border-none outline-none shadow-inner text-center" 
                      />
                    </div>
                  )}
                </div>
                <button onClick={() => removeSection(section.id)} className="absolute -right-3 -top-3 w-10 h-10 bg-white shadow-xl rounded-xl flex items-center justify-center text-rose-500 border border-rose-50 hover:bg-rose-50 transition-colors opacity-0 group-hover:opacity-100 z-10"><Trash2 size={18} /></button>
              </div>
            ))}
            <button onClick={addSection} className="w-full py-6 bg-[#E6F4F5] text-[#4FB5C0] rounded-[2rem] border-2 border-dashed border-[#4FB5C0]/30 font-black uppercase text-xs tracking-widest flex items-center justify-center gap-3 hover:bg-[#4FB5C0] hover:text-white transition-all group">
              <div className="w-8 h-8 rounded-lg bg-[#4FB5C0]/20 flex items-center justify-center group-hover:bg-white/20 transition-colors"><Plus size={20} /></div>Add New Section
            </button>
          </div>
        </div>
        <div className="p-10 border-t bg-white flex items-center justify-between shrink-0">
          <div className="flex flex-col">
            <span className={`text-4xl font-black ${isBalanced ? 'text-[#4FB5C0]' : 'text-rose-500'}`}>{currentTotal} / {settings.totalMarks} MARKS</span>
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Expected Score Weight</span>
          </div>
          <div className="flex items-center gap-6">
            <button onClick={onClose} className="px-8 py-5 font-black text-slate-400 uppercase text-xs tracking-widest hover:text-slate-600 transition-colors">Cancel</button>
            <button onClick={onConfirm} disabled={!isBalanced} className={`px-12 py-5 rounded-[1.5rem] font-black uppercase text-xs tracking-widest shadow-2xl transition-all active:scale-95 ${isBalanced ? 'bg-[#4FB5C0] text-white shadow-[#4FB5C0]/20 hover:scale-[1.02]' : 'bg-slate-200 text-slate-400 cursor-not-allowed opacity-50'}`}>Generate Draft</button>
          </div>
        </div>
      </div>
    </div>
  );
};

const AutoResizeTextarea = ({ className, value, onChange, placeholder }: any) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  useEffect(() => { if (textareaRef.current) { textareaRef.current.style.height = 'auto'; textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`; } }, [value]);
  return <textarea ref={textareaRef} className={`${className} resize-none overflow-hidden min-h-[1.5em] focus:outline-none`} value={value} onChange={onChange} placeholder={placeholder} rows={1} />;
};

const GradeWorkspace: React.FC<{ context: TeacherContext, setContext: any }> = ({ context, setContext }) => {
  const { gradeId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const t = UI_STRINGS[context.language];
  
  const [topic, setTopic] = useState('');
  const [selectedFile, setSelectedFile] = useState<{ name: string, base64: string, mimeType: string } | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [activeAction, setActiveAction] = useState<string | null>(null);
  const [showExamConfig, setShowExamConfig] = useState(false);
  const [showPlanConfig, setShowPlanConfig] = useState(false);
  const [showSlideConfig, setShowSlideConfig] = useState(false);
  const [showVault, setShowVault] = useState(false);
  const [showConfirmDelete, setShowConfirmDelete] = useState<{ type: 'single' | 'all', id?: string } | null>(null);
  const [fileError, setFileError] = useState(false);
  const [examSettings, setExamSettings] = useState<QuestionSettings>({ totalMarks: 50, duration: '2 Hours', difficulty: 'Medium', sections: [{ id: '1', marksPerQuestion: 1, count: 10, type: 'compulsory', oneMarkVariety: 'MCQ' }] });
  const [chatInput, setChatInput] = useState('');
  const [currentSessionId, setCurrentSessionId] = useState<string>(Date.now().toString());
  const [sessions, setSessions] = useState<any[]>([]);
  const [chatHistory, setChatHistory] = useState<{ role: 'user' | 'ai', content: string, time: string }[]>([]);
  const [isThinking, setIsThinking] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null);
  
  const [pendingSessionTopic, setPendingSessionTopic] = useState<string | null>(null);

  useEffect(() => {
    if (location.state?.loadedResult && location.state?.loadedAction) {
      setResult(location.state.loadedResult);
      setActiveAction(location.state.loadedAction);
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  useEffect(() => {
    const user = auth.currentUser;
    if (!user || !gradeId) return;
    const q = query(collection(db, "users", user.uid, "chats", gradeId, "sessions"), orderBy("updatedAt", "desc"));
    return onSnapshot(q, (snapshot) => {
      setSessions(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
  }, [gradeId]);

  useEffect(() => {
    const user = auth.currentUser;
    if (!user || !gradeId || !currentSessionId) return;
    return onSnapshot(doc(db, "users", user.uid, "chats", gradeId, "sessions", currentSessionId), (snapshot) => {
      if (snapshot.exists()) setChatHistory(snapshot.data().history || []);
      else setChatHistory([]);
    });
  }, [gradeId, currentSessionId]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFileError(false);
      const reader = new FileReader();
      reader.onloadend = () => setSelectedFile({ name: file.name, base64: (reader.result as string).split(',')[1], mimeType: file.type || 'image/jpeg' });
      reader.readAsDataURL(file);
    }
  };

  const handleAction = async (action: 'plan' | 'paper' | 'explain' | 'homework', extra?: any) => {
    if (!selectedFile && !result) {
        setFileError(true);
        setTimeout(() => setFileError(false), 3000);
        return;
    }

    if (action === 'paper' && !extra) { setShowExamConfig(true); return; }
    if (action === 'plan' && !extra) { setShowPlanConfig(true); return; }
    if (action === 'explain' && !extra) { setShowSlideConfig(true); return; }
    
    setLoading(true); setActiveAction(action); setResult(null); setShowExamConfig(false); setShowPlanConfig(false); setShowSlideConfig(false);
    try {
      let data;
      // CRITICAL: Determine the actual topic to use (session-specific or global)
      const contextTopic = pendingSessionTopic || topic || "General Syllabus";
      
      if (action === 'plan') data = await generateSyllabusPlan(extra.duration, extra.unit, context.grade, context.language, selectedFile!);
      else if (action === 'paper') data = await generateQuestionPaper(selectedFile!, context.grade, context.language, examSettings, contextTopic);
      else if (action === 'explain') data = await generateSlideDeck(contextTopic, selectedFile || null, context.language, extra.slideCount);
      else if (action === 'homework') {
        data = await generateHomework(contextTopic, context.grade, context.language, selectedFile);
      }
      setResult(data);
    } catch (err: any) { console.error(err); alert(`Generation failed: ${err.message}`); }
    finally { 
      setLoading(false); 
      // Reset pending topic after any action completes
      setPendingSessionTopic(null); 
    }
  };

  const handleSessionAction = (action: 'explain' | 'paper' | 'homework', sessionTopic: string) => {
    // Explicitly set the topic before showing config or triggering generation
    setPendingSessionTopic(sessionTopic);
    
    if (action === 'paper') {
      setShowExamConfig(true);
    } else if (action === 'explain') {
      setShowSlideConfig(true);
    } else if (action === 'homework') {
      // Homework has no modal config, trigger directly
      handleAction('homework');
    }
  };

  const handleLoadFromVault = (item: any) => {
    let action = '';
    if (item.type === 'question_paper') action = 'paper';
    else if (item.type === 'syllabus_plan') action = 'plan';
    else if (item.type === 'slide_deck') action = 'explain';
    else if (item.type === 'homework') action = 'homework';

    setResult(item.content);
    setActiveAction(action);
    setShowVault(false);
  };

  const handleChatSend = async () => {
    if (!chatInput.trim() || isThinking) return;
    const user = auth.currentUser;
    if (!user || !gradeId) return;
    const userMessage = chatInput;
    setChatInput('');
    setIsThinking(true);
    try {
      const chatDocRef = doc(db, "users", user.uid, "chats", gradeId, "sessions", currentSessionId);
      const isNew = chatHistory.length === 0;
      await setDoc(chatDocRef, { 
        title: isNew ? userMessage.substring(0, 30) + '...' : sessions.find(s => s.id === currentSessionId)?.title || 'Chat',
        updatedAt: serverTimestamp(),
        history: arrayUnion({ role: 'user', content: userMessage, time: new Date().toLocaleTimeString() }) 
      }, { merge: true });
      const aiResponseText = await askChatQuestion(userMessage, selectedFile || null, context.language);
      await setDoc(chatDocRef, { 
        history: arrayUnion({ role: 'ai', content: aiResponseText, time: new Date().toLocaleTimeString() }) 
      }, { merge: true });
    } catch (e) { console.error(e); }
    finally { setIsThinking(false); }
  };

  const startNewChat = () => {
    setCurrentSessionId(Date.now().toString());
    setChatHistory([]);
  };

  const deleteSession = async (id: string) => {
    const user = auth.currentUser;
    if (!user || !gradeId) return;
    await deleteDoc(doc(db, "users", user.uid, "chats", gradeId, "sessions", id));
    if (currentSessionId === id) startNewChat();
    setShowConfirmDelete(null);
  };

  const deleteAllSessions = async () => {
    const user = auth.currentUser;
    if (!user || !gradeId) return;
    const q = collection(db, "users", user.uid, "chats", gradeId, "sessions");
    const snapshot = await getDocs(q);
    const promises = snapshot.docs.map(d => deleteDoc(d.ref));
    await Promise.all(promises);
    startNewChat();
    setShowConfirmDelete(null);
  };

  const saveToVault = async () => {
    const user = auth.currentUser;
    if (!user || !result) return;
    const vaultRef = doc(collection(db, "users", user.uid, "vault"));
    await setDoc(vaultRef, {
      title: result.title || "Untitled Generated Content",
      type: activeAction === 'paper' ? 'question_paper' : activeAction === 'plan' ? 'syllabus_plan' : activeAction === 'explain' ? 'slide_deck' : 'homework',
      content: result,
      grade: gradeId,
      createdAt: serverTimestamp()
    });
    setSaveSuccess("Saved to Vault!");
    setTimeout(() => setSaveSuccess(null), 3000);
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 md:space-y-8 pb-10 md:pb-20 px-4 md:px-0">
      <ConfirmModal isOpen={!!showConfirmDelete} onClose={() => setShowConfirmDelete(null)} onConfirm={() => showConfirmDelete?.type === 'single' ? deleteSession(showConfirmDelete.id!) : deleteAllSessions()} title={showConfirmDelete?.type === 'all' ? "Clear All History?" : "Delete Chat?"} message="This action is permanent and cannot be undone." actionLabel="Delete" />
      <BlueprintModal isOpen={showExamConfig} onClose={() => { setShowExamConfig(false); setPendingSessionTopic(null); }} gradeId={gradeId} settings={examSettings} setSettings={setExamSettings} onConfirm={() => handleAction('paper', { confirmed: true })} />
      <MasterPlanModal isOpen={showPlanConfig} onClose={() => setShowPlanConfig(false)} onConfirm={(duration: number, unit: any) => handleAction('plan', { duration, unit })} />
      <SlideConfigModal isOpen={showSlideConfig} onClose={() => { setShowSlideConfig(false); setPendingSessionTopic(null); }} onConfirm={(slideCount: number) => handleAction('explain', { slideCount })} />
      <VaultModal isOpen={showVault} onClose={() => setShowVault(false)} gradeId={gradeId!} onLoad={handleLoadFromVault} />
      
      <div className="flex items-center justify-between no-print">
        <div className="flex items-center gap-6">
          <button onClick={() => result ? setResult(null) : navigate('/')} className="w-11 h-11 flex items-center justify-center bg-white border rounded-2xl text-slate-400 hover:text-slate-800 transition-all shadow-sm"><ArrowLeft size={18} /></button>
          <div><h2 className="text-2xl md:text-4xl font-black text-slate-800 tracking-tighter uppercase leading-none">{gradeId} {t.workspace}</h2></div>
        </div>
        <div className="flex items-center gap-4">
          <button onClick={() => setShowVault(true)} className="flex items-center gap-2 px-5 py-3 bg-white border border-slate-100 rounded-xl font-black uppercase text-[10px] tracking-widest shadow-sm hover:bg-slate-50 transition-all text-indigo-500">
            <Archive size={14} /> My Vault
          </button>
          {result && (
            <div className="flex items-center gap-3">
              {saveSuccess && <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest animate-in fade-in">{saveSuccess}</span>}
              <button onClick={saveToVault} className="flex items-center gap-2 px-6 py-3 bg-white border border-slate-100 rounded-xl font-black uppercase text-[10px] tracking-widest shadow-sm hover:bg-slate-50 transition-all">
                <Save size={14} className="text-[#4FB5C0]" /> Save to Vault
              </button>
            </div>
          )}
        </div>
      </div>

      {!result && !loading ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          <div className="lg:col-span-8 space-y-8">
            <div className="bg-white rounded-[2.5rem] border shadow-sm p-10 space-y-10 relative">
              <div 
                onClick={() => fileInputRef.current?.click()} 
                className={`border-4 border-dashed rounded-[2.5rem] p-16 flex flex-col items-center justify-center cursor-pointer transition-all ${
                  selectedFile 
                  ? 'border-[#4FB5C0] bg-[#F0F9FA]' 
                  : fileError 
                    ? 'border-rose-500 bg-rose-50/50 animate-pulse' 
                    : 'border-slate-50 hover:border-[#4FB5C0]/30'
                }`}
              >
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-4 ${
                  selectedFile 
                  ? 'bg-[#4FB5C0] text-white' 
                  : fileError 
                    ? 'bg-rose-500 text-white' 
                    : 'bg-slate-100 text-slate-200'
                }`}>
                  {selectedFile ? <FileIcon size={24} /> : fileError ? <AlertTriangle size={24} /> : <BookOpen size={24} />}
                </div>
                <p className={`text-base font-black text-center tracking-tight ${fileError ? 'text-rose-600' : 'text-slate-800'}`}>
                    {selectedFile ? selectedFile.name : fileError ? "Content Source Required First!" : t.uploadPrompt}
                </p>
                {fileError && <p className="text-[10px] font-black text-rose-400 uppercase tracking-widest mt-2">Please upload syllabus/notes before generating</p>}
                <input type="file" ref={fileInputRef} onChange={handleFileUpload} className="hidden" accept="image/*,application/pdf" />
              </div>
              <input placeholder={t.describePrompt} className="w-full px-6 py-4 bg-slate-50 border-none rounded-xl text-sm font-black outline-none focus:ring-4 ring-[#4FB5C0]/5" value={topic} onChange={(e) => setTopic(e.target.value)} />
            </div>
            <div className="grid grid-cols-3 gap-6">
              <ActionButton icon={BookOpen} label={t.masterPlan} onClick={() => handleAction('plan')} bg="bg-indigo-50" text="text-indigo-500" />
              <ActionButton icon={QuestionIcon} label={t.genExam} onClick={() => handleAction('paper')} bg="bg-[#E6F4F5]" text="text-[#4FB5C0]" primary />
              <ActionButton icon={Zap} label={t.slides} onClick={() => handleAction('explain')} bg="bg-amber-50" text="text-amber-500" />
            </div>
          </div>
          <div className="lg:col-span-4 bg-white rounded-[2rem] border shadow-xl flex flex-col h-[760px] overflow-hidden sticky top-24">
             <ChatSidebar history={chatHistory} isThinking={isThinking} onSend={handleChatSend} input={chatInput} setInput={setChatInput} t={t} sessions={sessions} onSessionSelect={setCurrentSessionId} currentSessionId={currentSessionId} onNewChat={startNewChat} onDeleteSession={(id: string) => setShowConfirmDelete({ type: 'single', id })} onDeleteAll={() => setShowConfirmDelete({ type: 'all' })} />
          </div>
        </div>
      ) : loading ? (
        <LoadingState action={activeAction} />
      ) : (
        <RenderResult result={result} action={activeAction} setContext={setResult} onSessionAction={handleSessionAction} />
      )}
    </div>
  );
};

const ActionButton = ({ icon: Icon, label, onClick, bg, text, primary }: any) => (
  <button onClick={onClick} className={`flex-1 p-8 rounded-[1.5rem] transition-all group active:scale-95 flex flex-col items-center justify-center text-center ${primary ? 'bg-white border-2 border-[#4FB5C0] shadow-xl' : 'bg-white border border-slate-100 hover:shadow-lg'}`}>
    <div className={`w-12 h-12 ${bg} ${text} rounded-xl flex items-center justify-center mb-3`}><Icon size={20} /></div>
    <p className="font-black text-slate-800 uppercase text-[9px] tracking-[0.2em]">{label}</p>
  </button>
);

const LoadingState = ({ action }: any) => (
  <div className="h-[60vh] flex flex-col items-center justify-center space-y-8">
    <div className="relative"><div className="w-24 h-24 border-8 border-[#F0F9FA] border-t-[#4FB5C0] rounded-full animate-spin"></div><Sparkles className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-[#4FB5C0]" size={32} /></div>
    <h3 className="text-2xl font-black text-slate-800 uppercase tracking-tight">Generating {action}...</h3>
  </div>
);

const RenderResult = ({ result, action, setContext, onSessionAction }: any) => {
  if (action === 'paper') return <EditablePaper paper={result} onUpdate={setContext} />;
  if (action === 'plan') return <PlanView plan={result} onSessionAction={onSessionAction} />;
  if (action === 'explain') return <SlidesView deck={result} />;
  if (action === 'homework') return <HomeworkView homework={result} />;
  return null;
};

const HomeworkView = ({ homework }: any) => (
  <div className="bg-white rounded-[2.5rem] shadow-2xl overflow-hidden max-w-4xl mx-auto border border-slate-100 animate-in fade-in zoom-in-95 duration-500">
    <div className="bg-[#E6F4F5] p-12 md:p-16 text-center">
      <div className="inline-flex items-center gap-3 px-6 py-2 bg-white rounded-full text-[#4FB5C0] font-black uppercase text-[10px] tracking-widest shadow-sm mb-6">
        <Sparkles size={14} /> Student Mission
      </div>
      <h3 className="text-4xl md:text-5xl font-black text-slate-800 tracking-tighter uppercase mb-4">{homework.title}</h3>
      <p className="text-slate-500 font-bold italic text-lg leading-relaxed max-w-2xl mx-auto">"{homework.intro}"</p>
    </div>

    <div className="p-10 md:p-16 space-y-16">
      {homework.tasks.map((task: any, idx: number) => (
        <div key={idx} className="space-y-6 animate-in slide-in-from-bottom-4 duration-700" style={{ animationDelay: `${idx * 150}ms` }}>
          <div className="flex items-center gap-6">
            <div className="w-12 h-12 bg-slate-900 text-white rounded-2xl flex items-center justify-center font-black text-xl shadow-lg shrink-0">
              {task.partNumber}
            </div>
            <div>
              <h4 className="text-xl md:text-2xl font-black text-slate-800 uppercase tracking-tight">{task.title}</h4>
              <p className="text-slate-500 font-bold text-sm">{task.instruction}</p>
            </div>
          </div>

          <div className="pl-18">
            {task.type === 'identification' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {task.items?.map((item: string, i: number) => (
                  <div key={i} className="flex items-center gap-4 p-5 bg-slate-50 rounded-2xl border border-slate-100 hover:border-[#4FB5C0] transition-all group">
                    <div className="w-10 h-10 rounded-full border-2 border-slate-200 flex items-center justify-center group-hover:border-[#4FB5C0] transition-colors"><Circle size={16} className="text-transparent" /></div>
                    <span className="font-bold text-slate-700">{item}</span>
                  </div>
                ))}
              </div>
            )}

            {task.type === 'creative' && (
              <div className="space-y-6">
                <div className="w-full aspect-[16/9] border-4 border-dashed border-slate-100 rounded-[2rem] bg-slate-50 flex items-center justify-center text-slate-300">
                  <div className="text-center">
                    <Pencil size={48} className="mx-auto mb-4 opacity-20" />
                    <p className="text-xs font-black uppercase tracking-widest">Draw Box: Area for Creation</p>
                  </div>
                </div>
                <div className="p-6 bg-[#E6F4F5]/50 border-l-4 border-[#4FB5C0] rounded-r-2xl">
                   <p className="text-sm font-bold text-[#4FB5C0]">Teacher Tip: {task.instruction.includes('Shield') ? 'Ask students to use bold colors for their rules!' : 'Help students identify local examples.'}</p>
                </div>
              </div>
            )}

            {task.type === 'mcq' && (
              <div className="space-y-4">
                {task.options?.map((opt: string, i: number) => (
                  <div key={i} className="flex items-center gap-4 p-5 bg-white border border-slate-100 rounded-2xl hover:bg-[#E6F4F5] hover:border-[#4FB5C0] transition-all cursor-pointer shadow-sm group">
                    <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-[10px] font-black text-slate-400 group-hover:bg-[#4FB5C0] group-hover:text-white transition-colors">{String.fromCharCode(65 + i)}</div>
                    <span className="font-bold text-slate-700">{opt}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
    <div className="p-10 border-t bg-slate-50 flex justify-center no-print">
      <button onClick={() => window.print()} className="px-10 py-5 bg-slate-900 text-white rounded-2xl font-black uppercase text-xs tracking-widest flex items-center gap-3 shadow-xl hover:scale-105 active:scale-95 transition-all"><Printer size={20} /> Print Student Handout</button>
    </div>
  </div>
);

const PlanView = ({ plan, onSessionAction }: any) => (
  <div className="bg-white rounded-[2.5rem] shadow-2xl overflow-hidden max-w-5xl mx-auto animate-in fade-in zoom-in-95 duration-500 flex flex-col border border-slate-100">
    <div className="bg-[#4F46E5] p-12 md:p-16 text-white relative overflow-hidden">
      <div className="absolute right-0 top-0 p-8 opacity-10 pointer-events-none">
        <Monitor size={240} className="-mr-12 -mt-12" />
      </div>
      <div className="relative z-10 space-y-6">
        <div className="flex justify-between items-start">
          <div className="space-y-4">
            <h3 className="text-4xl md:text-6xl font-black tracking-tighter leading-tight max-w-2xl uppercase">{plan?.title || "Educational Roadmap"}</h3>
            <p className="text-indigo-200 font-black uppercase text-xs tracking-[0.3em]">{plan?.timeframe || "Plan"}</p>
          </div>
          <button onClick={() => window.print()} className="p-4 bg-white/10 hover:bg-white/20 text-white rounded-2xl no-print transition-all backdrop-blur-md shadow-xl"><Printer size={24} /></button>
        </div>
      </div>
    </div>
    <div className="p-10 md:p-20 bg-white">
      <div className="relative">
        <div className="absolute left-[23px] top-0 bottom-0 w-1 bg-slate-100 hidden md:block"></div>
        <div className="space-y-16">
          {plan?.sessions?.map((s: any, i: number) => (
            <div key={i} className="relative flex flex-col md:flex-row gap-8 group">
              <div className="relative z-10 w-12 h-12 bg-white border-2 border-indigo-100 text-indigo-600 rounded-2xl flex items-center justify-center font-black text-xl shadow-sm group-hover:border-indigo-50 transition-colors shrink-0">{i + 1}</div>
              <div className="flex-1 space-y-4">
                <div className="flex justify-between items-start">
                  <div className="space-y-2">
                    <p className="text-indigo-500 font-black uppercase text-[10px] tracking-[0.2em]">{s.period}</p>
                    <h4 className="text-2xl md:text-3xl font-black text-slate-800 tracking-tight leading-tight">{s.topic}</h4>
                    <p className="text-slate-500 font-medium italic text-sm leading-relaxed">Objective: {s.objective}</p>
                  </div>
                  <div className="flex gap-2 no-print">
                    <button onClick={() => onSessionAction('explain', s.topic)} title="Generate Slide" className="p-3 bg-[#E6F4F5] text-[#4FB5C0] rounded-xl hover:bg-[#4FB5C0] hover:text-white transition-all shadow-sm"><Monitor size={18} /></button>
                    <button onClick={() => onSessionAction('homework', s.topic)} title="Homework Assignment" className="p-3 bg-amber-50 text-amber-500 rounded-xl hover:bg-amber-500 hover:text-white transition-all shadow-sm"><Pencil size={18} /></button>
                    <button onClick={() => onSessionAction('paper', s.topic)} title="Generate Questions" className="p-3 bg-indigo-50 text-indigo-500 rounded-xl hover:bg-indigo-500 hover:text-white transition-all shadow-sm"><QuestionIcon size={18} /></button>
                  </div>
                </div>
                <div className="bg-slate-50/50 rounded-[2rem] p-8 border border-slate-100 group-hover:bg-white group-hover:shadow-xl group-hover:border-indigo-50 transition-all">
                  <p className="text-emerald-500 font-black uppercase text-[9px] tracking-[0.3em] mb-3">Recommended Activity</p>
                  <p className="text-slate-700 font-medium leading-relaxed">{s.activity || "Interactive classroom discussion."}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  </div>
);

const SlidesView = ({ deck }: any) => {
  const [current, setCurrent] = useState(0);
  if (!deck?.slides) return null;
  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in zoom-in-95 duration-500">
      <div className="bg-white rounded-[3rem] shadow-2xl overflow-hidden aspect-video relative flex group border">
        <div className="flex-1 p-16 flex flex-col justify-center">
          <p className="text-[#4FB5C0] font-black uppercase text-[10px] tracking-[0.3em] mb-4">Slide {current + 1} / {deck.slides.length}</p>
          <h3 className="text-4xl md:text-6xl font-black text-slate-800 tracking-tighter mb-8 leading-none">{deck.slides[current]?.title}</h3>
          <ul className="space-y-4">{deck.slides[current]?.content?.map((c: any, i: number) => <li key={i} className="flex gap-4 items-start text-xl font-medium text-slate-600"><div className="w-2 h-2 rounded-full bg-[#4FB5C0] mt-3 shrink-0" />{c}</li>)}</ul>
        </div>
        <div className="absolute inset-x-0 bottom-0 p-8 flex justify-between items-center opacity-0 group-hover:opacity-100 transition-opacity">
           <button disabled={current === 0} onClick={() => setCurrent(p => p - 1)} className="p-4 bg-white/80 rounded-2xl shadow-xl disabled:opacity-20"><ChevronLeft size={24} /></button>
           <button disabled={current === deck.slides.length - 1} onClick={() => setCurrent(p => p + 1)} className="p-4 bg-white/80 rounded-2xl shadow-xl disabled:opacity-20"><ChevronRight size={24} /></button>
        </div>
      </div>
    </div>
  );
};

const ChatSidebar = ({ history, isThinking, onSend, input, setInput, t, sessions, onSessionSelect, currentSessionId, onNewChat, onDeleteSession, onDeleteAll }: any) => {
  const [showHistory, setShowHistory] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
        scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [history, isThinking]);

  const formatText = (text: string) => {
    let formatted = text.replace(/### (.*?)\n/g, '<h4 className="font-black text-sm uppercase mt-4 mb-2 text-slate-800">$1</h4>').replace(/\*\*(.*?)\*\*/g, '<strong className="font-black text-slate-900">$1</strong>').replace(/\* (.*?)\n/g, '<div className="flex gap-2 items-start ml-2 mb-1"><div className="w-1.5 h-1.5 rounded-full bg-[#4FB5C0] mt-1.5 shrink-0"></div><p>$1</p></div>').replace(/\n/g, '<br />');
    formatted = formatted.replace(/\$/g, '');
    return <div dangerouslySetInnerHTML={{ __html: formatted }} className="text-xs font-medium leading-relaxed" />;
  };

  return (
    <>
      <div className="p-6 border-b flex items-center justify-between bg-slate-50/50">
        <div className="flex items-center gap-3">
          <Sparkles size={16} className="text-[#4FB5C0]" />
          <h4 className="font-black text-[9px] uppercase tracking-[0.2em]">{t.educatorGpt}</h4>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setShowHistory(!showHistory)} className="p-2 text-slate-400 hover:text-slate-800 transition-all"><Clock size={16} /></button>
          <button onClick={onNewChat} className="p-2 text-[#4FB5C0] hover:bg-[#E6F4F5] rounded-lg transition-all"><PlusCircle size={16} /></button>
        </div>
      </div>
      
      {showHistory ? (
        <div className="flex-1 overflow-y-auto p-4 space-y-2 bg-slate-50/30 scroll-smooth">
          <div className="flex justify-between items-center px-2 mb-4">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Chat History</span>
            <button onClick={onDeleteAll} className="text-[10px] font-black text-rose-500 uppercase tracking-widest hover:underline">Clear All</button>
          </div>
          {sessions.map((s: any) => (
            <div key={s.id} onClick={() => { onSessionSelect(s.id); setShowHistory(false); }} className={`group p-4 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${s.id === currentSessionId ? 'bg-white border-[#4FB5C0] shadow-sm' : 'bg-transparent border-transparent hover:bg-white hover:border-slate-100'}`}>
              <div className="flex items-center gap-3 overflow-hidden">
                <MessageSquare size={14} className={s.id === currentSessionId ? 'text-[#4FB5C0]' : 'text-slate-300'} />
                <span className={`text-[11px] font-bold truncate ${s.id === currentSessionId ? 'text-slate-800' : 'text-slate-500'}`}>{s.title}</span>
              </div>
              <button onClick={(e) => { e.stopPropagation(); onDeleteSession(s.id); }} className="opacity-0 group-hover:opacity-100 p-1 text-slate-300 hover:text-rose-500 transition-all"><Trash2 size={12} /></button>
            </div>
          ))}
          {sessions.length === 0 && <p className="text-center py-10 text-[10px] font-black text-slate-300 uppercase tracking-widest">No history yet</p>}
        </div>
      ) : (
        <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-4 bg-white scroll-smooth">
          {history?.map((msg: any, i: number) => (
            <div key={i} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
              <div className={`max-w-[90%] p-4 rounded-[1.2rem] shadow-sm border ${msg.role === 'user' ? 'bg-[#4FB5C0] text-white border-[#4FB5C0]' : 'bg-slate-50 text-slate-700'}`}>
                {msg.role === 'user' ? <p className="text-xs font-bold">{msg.content}</p> : formatText(msg.content)}
              </div>
              <span className="text-[8px] font-bold text-slate-300 uppercase mt-1 px-2">{msg.time}</span>
            </div>
          ))}
          {isThinking && (
              <div className="flex items-center gap-2 text-[10px] font-black uppercase text-slate-300 animate-pulse">
                <Loader2 size={12} className="animate-spin" /> Analyzing Syllabus...
              </div>
          )}
        </div>
      )}

      <div className="p-4 bg-white border-t flex gap-2">
         <input placeholder={t.askGpt} className="flex-1 px-5 py-3.5 bg-slate-50 border rounded-xl text-xs font-black outline-none transition-all focus:ring-2 ring-[#4FB5C0]/10" value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && onSend()} />
         <button onClick={onSend} className="w-12 bg-[#4FB5C0] text-white rounded-xl flex items-center justify-center shadow-lg hover:scale-105 active:scale-95 transition-all"><Send size={16} /></button>
      </div>
    </>
  );
};

const EditablePaper = ({ paper, onUpdate }: { paper: QuestionPaper, onUpdate: (p: QuestionPaper) => void }) => {
  const handleUpdateSection = (idx: number, field: keyof Section, value: any) => { const updated = { ...paper }; (updated.sections[idx] as any)[field] = value; onUpdate(updated); };
  const handleUpdateQuestion = (sIdx: number, qIdx: number, field: keyof Question, value: any) => { const updated = { ...paper }; (updated.sections[sIdx].questions[qIdx] as any)[field] = value; onUpdate(updated); };
  return (
    <div className="bg-white min-h-[11in] w-full max-w-4xl mx-auto shadow-2xl p-12 md:p-16 flex flex-col gap-10 print:p-0 print:shadow-none print:w-full font-serif text-slate-900 border border-slate-100 rounded-lg animate-in fade-in duration-700">
      <div className="text-center space-y-4 md:space-y-6">
        <AutoResizeTextarea className="text-3xl md:text-5xl font-black w-full text-center bg-transparent border-none tracking-tighter uppercase leading-none font-serif text-slate-900" value={paper?.title} onChange={(e: any) => onUpdate({ ...paper, title: e.target.value })} />
        <div className="flex justify-between items-center text-[11px] md:text-sm font-black uppercase tracking-[0.2em] pt-4 border-t-2 border-slate-900 text-slate-800">
          <div className="flex items-center gap-3">DURATION: <input className="bg-transparent border-none w-24 p-0 font-black focus:ring-0 uppercase" value={paper?.duration} onChange={e => onUpdate({...paper, duration: e.target.value})} /></div>
          <div className="flex items-center gap-3">TOTAL MARKS: <span className="font-black">{paper?.totalMarks}</span></div>
        </div>
      </div>
      <div className="space-y-20">
        {paper?.sections?.map((section, sIdx) => (
          <div key={section.id} className="space-y-8">
            <div className="flex items-end justify-between border-b-2 pb-3 border-slate-900">
              <div className="flex-1 pr-6">
                <AutoResizeTextarea className="text-xl md:text-2xl font-black bg-transparent w-full uppercase tracking-tight font-serif text-slate-900" value={section.title} onChange={(e:any) => handleUpdateSection(sIdx, 'title', e.target.value)} />
                <AutoResizeTextarea className="text-xs md:text-sm italic font-medium text-slate-500 w-full bg-transparent normal-case font-serif mt-1" value={section.instructions} onChange={(e:any) => handleUpdateSection(sIdx, 'instructions', e.target.value)} />
              </div>
              <div className="text-right font-black text-lg md:text-xl whitespace-nowrap text-slate-900">{section.totalSectionMarks} MARKS</div>
            </div>
            <div className="space-y-12">
              {section.questions?.map((q, qIdx) => {
                const questionNumber = qIdx + 1;
                
                if (section.type === 'either-or') {
                  return (
                    <div key={q.id} className="space-y-6 relative group pl-4">
                      {/* Sub-question A */}
                      <div className="flex items-start gap-4">
                        <div className="font-black text-2xl md:text-3xl text-slate-900 min-w-[3.5rem] pt-1">{questionNumber}.</div>
                        <div className="flex-1">
                          <div className="flex gap-4 items-start">
                            <span className="font-bold text-xl md:text-2xl mt-1 shrink-0">a)</span>
                            <AutoResizeTextarea className="w-full text-lg md:text-xl font-bold bg-transparent leading-relaxed font-serif text-slate-900" value={q.text} onChange={(e:any) => handleUpdateQuestion(sIdx, qIdx, 'text', e.target.value)} />
                          </div>
                        </div>
                        <div className="font-black text-sm md:text-base text-slate-900 pt-2 shrink-0">{section.marksPerQuestion}M</div>
                      </div>
                      
                      {/* "OR" Divider */}
                      <div className="flex items-center justify-center py-4 relative">
                        <div className="w-full border-t border-slate-200 absolute top-1/2 left-0 z-0"></div>
                        <span className="relative z-10 px-10 text-[10px] font-black text-slate-400 bg-white uppercase tracking-[1em] select-none">OR</span>
                      </div>
                      
                      {/* Sub-question B */}
                      <div className="flex items-start gap-4">
                        <div className="min-w-[3.5rem]"></div>
                        <div className="flex-1">
                          <div className="flex gap-4 items-start">
                            <span className="font-bold text-xl md:text-2xl mt-1 shrink-0">b)</span>
                            <AutoResizeTextarea className={`w-full text-lg md:text-xl font-bold bg-transparent leading-relaxed font-serif ${!q.alternativeText ? 'text-rose-400 italic' : 'text-slate-900'}`} placeholder="Enter alternative question..." value={q.alternativeText || ""} onChange={(e:any) => handleUpdateQuestion(sIdx, qIdx, 'alternativeText', e.target.value)} />
                          </div>
                        </div>
                        <div className="font-black text-sm md:text-base text-slate-900 pt-2 shrink-0">{section.marksPerQuestion}M</div>
                      </div>
                    </div>
                  );
                }

                return (
                  <div key={q.id} className="flex gap-8 items-start relative group pl-4">
                    <div className="font-black text-2xl md:text-3xl text-slate-900 min-w-[3.5rem] pt-1">{questionNumber}.</div>
                    <div className="flex-1">
                      <AutoResizeTextarea className="w-full text-lg md:text-xl font-bold bg-transparent leading-relaxed font-serif text-slate-900" value={q.text} onChange={(e:any) => handleUpdateQuestion(sIdx, qIdx, 'text', e.target.value)} />
                      {q.options && q.options.length > 0 && (
                        <div className="grid grid-cols-2 gap-x-12 gap-y-6 mt-8 ml-6">
                          {q.options.map((opt, oIdx) => (
                            <div key={oIdx} className="text-base md:text-lg font-medium text-slate-700 flex items-start gap-4">
                              <span className="font-black text-sm text-slate-400 mt-1">({String.fromCharCode(97 + oIdx)})</span>
                              <span className="leading-relaxed">{opt}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="font-black text-sm md:text-base text-slate-900 pt-2 shrink-0">{section.marksPerQuestion}M</div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
      <div className="mt-20 pt-10 border-t-2 border-slate-100 flex justify-center no-print">
        <button onClick={() => window.print()} className="flex items-center gap-4 px-12 py-6 bg-slate-900 text-white rounded-[2rem] font-black shadow-2xl hover:scale-105 active:scale-95 transition-all uppercase tracking-[0.2em] text-xs"><Printer size={20} /> Print Final Assessment</button>
      </div>
    </div>
  );
};

export default GradeWorkspace;
