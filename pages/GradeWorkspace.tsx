
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
  Plus,
  Trash2,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  Clock,
  Loader2,
  Save,
  MessageSquare,
  Monitor,
  Pencil,
  Archive,
  ImageIcon,
  FileEdit,
  Upload,
  ClipboardList,
  Database,
  FileSearch,
  Layout,
  AlertTriangle,
  CheckCircle2,
  Minus,
  Maximize2,
  Minimize2,
  User,
  History,
  Trash,
  AlertOctagon
} from 'lucide-react';
import { 
  TeacherContext, 
  QuestionSettings, 
  SlideDeck, 
  SectionBlueprint,
  Slide
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
import { doc, onSnapshot, setDoc, arrayUnion, collection, query, serverTimestamp, where, addDoc, orderBy, getDocs, deleteDoc, writeBatch } from 'firebase/firestore';

// --- Helper: Image Compression ---
const compressImage = async (base64: string): Promise<string> => {
  return new Promise((resolve) => {
    const img = new Image();
    img.src = `data:image/jpeg;base64,${base64}`;
    img.onload = () => {
      const canvas = document.createElement('canvas');
      let width = img.width;
      let height = img.height;
      const MAX_SIZE = 1200;

      if (width > height) {
        if (width > MAX_SIZE) {
          height *= MAX_SIZE / width;
          width = MAX_SIZE;
        }
      } else {
        if (height > MAX_SIZE) {
          width *= MAX_SIZE / height;
          height = MAX_SIZE;
        }
      }
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      ctx?.drawImage(img, 0, 0, width, height);
      resolve(canvas.toDataURL('image/jpeg', 0.6).split(',')[1]);
    };
  });
};

// --- Shared Components ---

const StepperInput = ({ value, onChange, label, min = 0, max = 100 }: { value: number, onChange: (v: number) => void, label: string, min?: number, max?: number }) => {
  const [localVal, setLocalVal] = useState(value.toString());
  
  useEffect(() => {
    setLocalVal(value.toString());
  }, [value]);

  const handleManualChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/\D/g, '');
    setLocalVal(val);
    if (val !== '') {
      const num = parseInt(val);
      onChange(Math.min(max, Math.max(min, num)));
    } else {
      onChange(min);
    }
  };

  const handleBlur = () => {
    if (localVal === '') {
      setLocalVal(min.toString());
      onChange(min);
    }
  };

  return (
    <div className="flex flex-col items-center gap-2">
      <label className="text-[8px] font-black text-slate-400 uppercase text-center block w-full">{label}</label>
      <div className="flex items-center bg-white rounded-xl border-2 border-slate-100 overflow-hidden shadow-sm focus-within:border-[#4FB5C0] transition-colors">
        <button onClick={() => onChange(Math.max(min, value - 1))} className="p-2 hover:bg-slate-50 text-slate-400" type="button"><Minus size={14} /></button>
        <input 
          type="text"
          value={localVal}
          onChange={handleManualChange}
          onBlur={handleBlur}
          className="w-12 text-center font-black text-slate-800 outline-none bg-transparent py-2"
          onWheel={(e) => (e.target as HTMLInputElement).blur()} 
        />
        <button onClick={() => onChange(Math.min(max, value + 1))} className="p-2 hover:bg-slate-50 text-slate-400" type="button"><Plus size={14} /></button>
      </div>
    </div>
  );
};

// --- Modals ---

const VaultModal = ({ isOpen, onClose, gradeId, onLoad, language }: { isOpen: boolean, onClose: () => void, gradeId: string, onLoad: (item: any) => void, language: string }) => {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState<'all' | 'question_paper' | 'syllabus_plan' | 'slide_deck' | 'homework'>('all');
  const t = UI_STRINGS[language as any];
  
  // High-impact deletion states
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    const user = auth.currentUser;
    if (!user) return;
    const q = query(collection(db, "users", user.uid, "vault"), where("grade", "==", gradeId));
    const unsub = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      data.sort((a: any, b: any) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
      setItems(data);
      setLoading(false);
    });
    return () => unsub();
  }, [isOpen, gradeId]);

  const executeDelete = async () => {
    if (!confirmDeleteId) return;
    const user = auth.currentUser;
    if (!user) return;
    try {
      await deleteDoc(doc(db, "users", user.uid, "vault", confirmDeleteId));
      setConfirmDeleteId(null);
    } catch (err) {
      console.error(err);
    }
  };

  if (!isOpen) return null;

  const categories = [
    { id: 'all', label: 'All Items', icon: Archive },
    { id: 'slide_deck', label: 'Slides', icon: Monitor },
    { id: 'syllabus_plan', label: 'Lesson Plans', icon: BookOpen },
    { id: 'question_paper', label: 'Exam Papers', icon: FileIcon },
    { id: 'homework', label: 'Assignments', icon: Pencil },
  ];

  const filteredItems = activeCategory === 'all' ? items : items.filter(i => i.type === activeCategory);
  const deletingItem = items.find(i => i.id === confirmDeleteId);

  return (
    <div className="fixed inset-0 z-[200] bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-4 no-print">
      {/* High-Impact 2nd Verification Alert */}
      {confirmDeleteId && deletingItem && (
        <div className="absolute inset-0 z-[210] bg-rose-600/90 backdrop-blur-xl flex items-center justify-center p-6 animate-in fade-in zoom-in duration-300">
           <div className="max-w-md w-full bg-white rounded-[3rem] p-10 shadow-2xl text-center space-y-8 border-4 border-white/20">
              <div className="w-24 h-24 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center mx-auto animate-bounce">
                <AlertOctagon size={48} />
              </div>
              <div>
                <h4 className="text-3xl font-black text-slate-900 uppercase tracking-tighter mb-2">{t.finalWarning}</h4>
                <p className="text-slate-500 font-bold uppercase text-[10px] tracking-widest mb-6">{t.areYouSure}</p>
                <div className="p-6 bg-slate-50 rounded-2xl border-2 border-slate-100 mb-2">
                   <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">Deleting:</p>
                   <p className="text-lg font-black text-slate-800 truncate">{deletingItem.title}</p>
                </div>
                <p className="text-xs font-bold text-rose-500">{t.deleteIrreversible}</p>
              </div>
              <div className="flex flex-col gap-3">
                <button 
                  onClick={executeDelete}
                  className="w-full py-5 bg-rose-600 text-white rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl shadow-rose-900/20 hover:scale-[1.02] transition-transform flex items-center justify-center gap-2"
                >
                  <Trash2 size={18} /> {t.yesDelete}
                </button>
                <button 
                  onClick={() => setConfirmDeleteId(null)}
                  className="w-full py-4 bg-slate-100 text-slate-500 rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-slate-200 transition-colors"
                >
                  {t.cancelKeep}
                </button>
              </div>
           </div>
        </div>
      )}

      <div className="bg-white rounded-[3rem] w-full max-w-5xl overflow-hidden flex flex-col h-[85vh] shadow-2xl animate-in zoom-in-95 duration-300 relative">
        <div className="p-8 md:p-10 border-b bg-slate-50/50 flex items-center justify-between">
          <div>
            <h3 className="text-2xl font-black text-slate-800 uppercase tracking-tight">Grade {gradeId} Vault</h3>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Manage your academic library</p>
          </div>
          <button onClick={onClose} className="p-2 text-slate-300 hover:text-slate-600 transition-colors"><X size={32} /></button>
        </div>
        
        <div className="flex flex-col md:flex-row h-full overflow-hidden">
          <div className="w-full md:w-64 bg-slate-50 p-6 space-y-2 border-r border-slate-100">
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id as any)}
                className={`w-full flex items-center gap-4 px-5 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all ${
                  activeCategory === cat.id 
                  ? 'bg-violet-600 text-white shadow-lg' 
                  : 'text-slate-400 hover:bg-slate-100 hover:text-slate-600'
                }`}
              >
                <cat.icon size={18} />
                {cat.label}
              </button>
            ))}
          </div>

          <div className="flex-1 overflow-y-auto p-10 custom-scrollbar bg-white">
            {loading ? (
              <div className="h-full flex flex-col items-center justify-center gap-4"><Loader2 className="animate-spin text-violet-600" size={32} /></div>
            ) : filteredItems.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center space-y-4 opacity-30">
                <Archive size={64} className="text-slate-400" />
                <p className="text-slate-900 font-black uppercase text-xs tracking-widest">No items found in this category</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {filteredItems.map((item) => (
                  <div key={item.id} onClick={() => onLoad(item)} className="p-6 bg-white border border-slate-100 rounded-[2rem] hover:border-violet-500 hover:shadow-xl transition-all cursor-pointer flex flex-col gap-4 group relative">
                    <div className="w-14 h-14 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-400 group-hover:bg-violet-600 group-hover:text-white transition-all shrink-0">
                      {item.type === 'question_paper' ? <FileIcon size={24} /> : item.type === 'slide_deck' ? <Monitor size={24} /> : item.type === 'homework' ? <Pencil size={24} /> : <BookOpen size={24} />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h5 className="font-black text-slate-800 uppercase text-[11px] truncate pr-8">{item.title}</h5>
                      <p className="text-[8px] font-bold text-slate-300 uppercase tracking-widest mt-1">{item.type.replace('_', ' ')}</p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                       <button 
                        onClick={(e) => { e.stopPropagation(); setConfirmDeleteId(item.id); }}
                        className="p-3 rounded-2xl text-slate-200 hover:text-rose-500 hover:bg-rose-50 transition-all"
                        title="Delete Resource"
                      >
                        <Trash2 size={18} />
                      </button>
                      <ChevronRight size={20} className="text-slate-200 group-hover:text-violet-600 transition-colors" />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const SaveNamingModal = ({ isOpen, onClose, onConfirm, suggestedTitle }: { isOpen: boolean, onClose: () => void, onConfirm: (title: string) => void, suggestedTitle: string }) => {
  const [title, setTitle] = useState(suggestedTitle);
  useEffect(() => { if (isOpen) setTitle(suggestedTitle); }, [isOpen, suggestedTitle]);
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-[200] bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-4 no-print">
      <div className="bg-white rounded-[2.5rem] w-full max-w-md overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300">
        <div className="p-8 border-b bg-slate-50/50 flex items-center justify-between">
          <div><h3 className="text-xl font-black text-slate-800 uppercase tracking-tight">Save to Vault</h3></div>
          <button onClick={onClose} className="p-2 text-slate-300 hover:text-slate-600 transition-colors"><X size={28} /></button>
        </div>
        <div className="p-8 space-y-6">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2">Item Name</label>
          <input autoFocus className="w-full bg-slate-50 border-2 border-transparent rounded-[1.2rem] px-6 py-4 font-bold text-slate-800 outline-none focus:border-[#4FB5C0] focus:bg-white transition-all shadow-inner" value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. Science Quiz" />
        </div>
        <div className="p-6 bg-slate-50 border-t flex gap-4">
          <button onClick={onClose} className="flex-1 py-4 font-black text-slate-400 uppercase text-[10px]">Cancel</button>
          <button disabled={!title.trim()} onClick={() => onConfirm(title)} className="flex-1 py-4 bg-[#4FB5C0] text-white rounded-[1.2rem] font-black uppercase text-[10px]">Save</button>
        </div>
      </div>
    </div>
  );
};

const ExamChoiceModal = ({ isOpen, onClose, onSelect }: any) => {
  const fileInputRefAuto = useRef<HTMLInputElement>(null);
  const fileInputRefBank = useRef<HTMLInputElement>(null);
  if (!isOpen) return null;
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, mode: 'auto' | 'bank') => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = async () => {
        let base64 = (reader.result as string).split(',')[1];
        if (file.type.startsWith('image/')) {
          base64 = await compressImage(base64);
        }
        onSelect(mode, { name: file.name, base64, mimeType: file.type || 'application/pdf' });
      };
      reader.readAsDataURL(file);
    }
  };
  return (
    <div className="fixed inset-0 z-[150] bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-4 no-print">
      <div className="bg-white rounded-[3rem] w-full max-w-4xl overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300">
        <div className="p-10 border-b bg-slate-50/50 flex items-center justify-between">
          <div><h3 className="text-2xl font-black text-slate-800 uppercase tracking-tight">Generate Exam Paper</h3></div>
          <button onClick={onClose}><X /></button>
        </div>
        <div className="p-10 grid grid-cols-1 md:grid-cols-3 gap-6">
          <input type="file" ref={fileInputRefAuto} onChange={(e) => handleFileUpload(e, 'auto')} className="hidden" accept="image/*,application/pdf" />
          <button onClick={() => fileInputRefAuto.current?.click()} className="flex flex-col items-center text-center p-6 bg-white border-2 border-slate-100 rounded-[2.5rem] hover:border-[#4FB5C0] group">
            <div className="w-14 h-14 bg-[#4FB5C0]/10 text-[#4FB5C0] rounded-2xl flex items-center justify-center mb-6"><Upload size={28} /></div>
            <h4 className="text-base font-black text-slate-800 uppercase mb-2">Smart Extraction</h4>
            <p className="text-[10px] font-bold text-slate-400 uppercase">Mirror EXACT layout</p>
          </button>
          <input type="file" ref={fileInputRefBank} onChange={(e) => handleFileUpload(e, 'bank')} className="hidden" accept="image/*,application/pdf" />
          <button onClick={(() => fileInputRefBank.current?.click())} className="flex flex-col items-center text-center p-6 bg-white border-2 border-slate-100 rounded-[2.5rem] hover:border-amber-500 group">
            <div className="w-14 h-14 bg-amber-50 text-amber-500 rounded-2xl flex items-center justify-center mb-6"><Database size={28} /></div>
            <h4 className="text-base font-black text-slate-800 uppercase mb-2">PDF Question Bank</h4>
            <p className="text-[10px] font-bold text-slate-400 uppercase">Source from PDF</p>
          </button>
          <button onClick={(() => onSelect('custom'))} className="flex flex-col items-center text-center p-6 bg-white border-2 border-slate-100 rounded-[2.5rem] hover:border-indigo-500 group">
            <div className="w-14 h-14 bg-indigo-50 text-indigo-500 rounded-2xl flex items-center justify-center mb-6"><ClipboardList size={28} /></div>
            <h4 className="text-base font-black text-slate-800 uppercase mb-2">Manual Blueprint</h4>
            <p className="text-[10px] font-bold text-slate-400 uppercase">Custom structure</p>
          </button>
        </div>
      </div>
    </div>
  );
};

const BlueprintModal = ({ isOpen, onClose, settings, setSettings, onConfirm }: any) => {
  if (!isOpen) return null;

  const currentTotal = settings.sections.reduce((acc: number, s: any) => {
    const qCount = s.type === 'any-x-among-y' ? (s.choiceCount || 0) : s.count;
    return acc + (s.marksPerQuestion * qCount);
  }, 0);

  const isBalanced = currentTotal === settings.totalMarks;

  const updateSection = (id: string, updates: Partial<SectionBlueprint>) => {
    setSettings({
      ...settings,
      sections: settings.sections.map((s: any) => s.id === id ? { ...s, ...updates } : s)
    });
  };

  const addSection = () => setSettings({ ...settings, sections: [...settings.sections, { id: Date.now().toString(), marksPerQuestion: 1, count: 5, type: 'compulsory' }] });
  const removeSection = (id: string) => setSettings({ ...settings, sections: settings.sections.filter((s: any) => s.id !== id) });

  return (
    <div className="fixed inset-0 z-[150] bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-4 no-print">
      <div className="bg-white rounded-[2.5rem] w-full max-w-5xl overflow-hidden flex flex-col shadow-2xl animate-in zoom-in-95 duration-300 max-h-[90vh]">
        <div className="p-8 border-b bg-white flex items-center justify-between">
          <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight">Paper Blueprint</h3>
          <button onClick={onClose}><X /></button>
        </div>
        <div className="p-8 overflow-y-auto space-y-8 custom-scrollbar">
          <div className="grid grid-cols-3 gap-6">
            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-400 uppercase px-2">Total Marks Goal</label>
              <input type="text" value={settings.totalMarks} onChange={e => setSettings({...settings, totalMarks: parseInt(e.target.value.replace(/\D/g, '')) || 0})} className="w-full bg-slate-50 p-4 rounded-2xl font-black outline-none border-2 border-transparent focus:border-[#4FB5C0]" />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-400 uppercase px-2">Time Limit</label>
              <input value={settings.duration} onChange={e => setSettings({...settings, duration: e.target.value})} className="w-full bg-slate-50 p-4 rounded-2xl font-black outline-none border-2 border-transparent focus:border-[#4FB5C0]" />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-400 uppercase px-2">Difficulty</label>
              <select value={settings.difficulty} onChange={e => setSettings({...settings, difficulty: e.target.value as any})} className="w-full bg-slate-50 p-4 rounded-2xl font-black outline-none appearance-none"><option>Easy</option><option>Medium</option><option>Hard</option></select>
            </div>
          </div>

          <div className="space-y-4">
            {settings.sections.map((section: any) => (
              <div key={section.id} className="relative bg-slate-50/50 p-6 rounded-2xl border-2 border-slate-100 flex flex-wrap items-end gap-6 transition-all hover:border-slate-200">
                <StepperInput label="Marks / Q" value={section.marksPerQuestion} onChange={v => updateSection(section.id, { marksPerQuestion: v })} min={1} />
                <StepperInput label="Total Qs (Y)" value={section.count} onChange={v => updateSection(section.id, { count: v })} min={1} />
                <div className="flex-1 min-w-[200px]">
                  <label className="text-[8px] font-black text-slate-400 uppercase mb-2 block">Rule Type</label>
                  <select value={section.type} onChange={e => updateSection(section.id, { type: e.target.value as any, choiceCount: e.target.value === 'any-x-among-y' ? Math.max(1, section.count - 1) : undefined })} className="w-full bg-white p-3 rounded-xl font-black outline-none shadow-sm border-2 border-slate-100">
                    <option value="compulsory">All Compulsory</option>
                    <option value="any-x-among-y">Choice (Answer X of Y)</option>
                    <option value="either-or">Either / Or</option>
                  </select>
                </div>
                {section.type === 'any-x-among-y' && (
                  <StepperInput label="Required (X)" value={section.choiceCount || 1} onChange={v => updateSection(section.id, { choiceCount: v })} min={1} max={section.count} />
                )}
                <button onClick={() => removeSection(section.id)} className="p-3 text-rose-300 hover:text-rose-500 transition-colors" type="button"><Trash2 size={20} /></button>
              </div>
            ))}
            <button onClick={addSection} className="w-full py-4 border-2 border-dashed border-slate-200 rounded-2xl text-[10px] font-black uppercase text-slate-400 hover:bg-slate-50" type="button">Add New Section</button>
          </div>
        </div>
        <div className="p-8 border-t bg-slate-50 flex items-center justify-between">
          <div className="flex flex-col">
            <span className={`text-2xl font-black uppercase tracking-tighter ${isBalanced ? 'text-emerald-500' : 'text-rose-500'}`}>MARKS: {currentTotal} / {settings.totalMarks}</span>
            {!isBalanced && (<span className="text-[10px] font-bold text-rose-400 uppercase tracking-widest mt-1">{currentTotal < settings.totalMarks ? `Short by ${settings.totalMarks - currentTotal}` : `Exceeds by ${currentTotal - settings.totalMarks}`}</span>)}
          </div>
          <button onClick={onConfirm} disabled={!isBalanced} className="px-10 py-4 bg-[#4FB5C0] text-white rounded-2xl font-black uppercase tracking-widest disabled:opacity-50">Generate Draft</button>
        </div>
      </div>
    </div>
  );
};

const MasterPlanModal = ({ isOpen, onClose, onConfirm }: any) => {
  const [duration, setDuration] = useState(4);
  const [unit, setUnit] = useState<'Days' | 'Weeks' | 'Months'>('Weeks');
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-[150] bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-4 no-print">
      <div className="bg-white rounded-[2.5rem] w-full max-w-md overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300">
        <div className="p-8 border-b bg-slate-50 flex items-center justify-between"><h3 className="text-xl font-black text-slate-800 uppercase tracking-tight">Plan Parameters</h3><button onClick={onClose}><X /></button></div>
        <div className="p-8 space-y-8">
          <div className="flex justify-center gap-8 items-end">
            <StepperInput label="Duration" value={duration} onChange={setDuration} min={1} max={31} />
            <div className="flex-1">
              <label className="text-[8px] font-black text-slate-400 uppercase mb-2 block">Unit</label>
              <select value={unit} onChange={e => setUnit(e.target.value as any)} className="w-full bg-slate-50 p-3 rounded-xl font-bold outline-none border-2 border-slate-100 focus:border-indigo-500"><option>Days</option><option>Weeks</option><option>Months</option></select>
            </div>
          </div>
        </div>
        <div className="p-6 bg-slate-50 flex gap-4">
          <button onClick={onClose} className="flex-1 py-3 font-black text-slate-400 uppercase text-[10px]">Cancel</button>
          <button onClick={() => onConfirm(duration, unit)} className="flex-1 py-3 bg-indigo-600 text-white rounded-xl font-black uppercase text-[10px] shadow-xl">Generate</button>
        </div>
      </div>
    </div>
  );
};

const SlideConfigModal = ({ isOpen, onClose, onConfirm }: any) => {
  const [count, setCount] = useState(6);
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-[150] bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-4 no-print">
      <div className="bg-white rounded-[2.5rem] w-full max-w-md overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300">
        <div className="p-8 border-b bg-slate-50 flex items-center justify-between"><h3 className="text-xl font-black text-slate-800 uppercase tracking-tight">Slide Deck Config</h3><button onClick={onClose}><X /></button></div>
        <div className="p-8 flex justify-center">
          <StepperInput label="Total Slides" value={count} onChange={setCount} min={3} max={20} />
        </div>
        <div className="p-6 bg-slate-50 flex gap-4">
          <button onClick={onClose} className="flex-1 py-3 font-black text-slate-400 uppercase text-[10px]">Cancel</button>
          <button onClick={() => onConfirm(count)} className="flex-1 py-3 bg-amber-500 text-white rounded-xl font-black uppercase text-[10px] shadow-xl">Generate</button>
        </div>
      </div>
    </div>
  );
};

// --- Main Views ---

const PlanView = ({ plan, onSessionAction }: any) => {
  return (
    <div id="printable-area" className="bg-white rounded-[2.5rem] shadow-2xl overflow-hidden max-w-5xl mx-auto animate-in fade-in zoom-in-95 duration-500 flex flex-col border border-slate-100">
      <div className="bg-indigo-600 p-12 text-white relative">
        <h3 className="text-4xl font-black tracking-tighter uppercase">{plan?.title || "Academic Roadmap"}</h3>
        <p className="text-indigo-200 font-black uppercase text-[10px] tracking-[0.3em] mt-2">{plan?.timeframe}</p>
        <button onClick={() => window.print()} className="absolute top-8 right-8 p-3 bg-white/10 hover:bg-white/20 rounded-xl no-print flex items-center gap-2"><Printer size={20} /> <span className="text-[10px] font-black uppercase">Print Master</span></button>
      </div>
      <div className="p-10 space-y-12">
        {plan?.sessions?.map((s: any, i: number) => (
          <div key={i} className="flex flex-col md:flex-row gap-8">
            <div className="w-12 h-12 bg-slate-900 text-white rounded-2xl flex items-center justify-center font-black text-xl shrink-0">{i + 1}</div>
            <div className="flex-1 space-y-4">
              <div className="flex justify-between items-start">
                <div>
                  <h4 className="text-2xl font-black text-slate-800 tracking-tight leading-tight">{s.topic}</h4>
                  <p className="text-slate-500 font-medium italic text-sm">{s.objective}</p>
                </div>
                <div className="flex gap-2 no-print">
                  <button onClick={() => onSessionAction('explain', s.topic)} title="Explain" className="p-2 bg-amber-50 text-amber-500 rounded-lg transition-colors hover:bg-amber-100"><Monitor size={16} /></button>
                  <button onClick={() => onSessionAction('homework', s.topic)} title="Assignment" className="p-2 bg-[#E6F4F5] text-[#4FB5C0] rounded-lg transition-colors hover:bg-[#D7F0F2]"><Pencil size={16} /></button>
                  <button onClick={() => onSessionAction('paper', s.topic)} title="Exam" className="p-2 bg-indigo-50 text-indigo-500 rounded-lg transition-colors hover:bg-indigo-100"><QuestionIcon size={16} /></button>
                </div>
              </div>
              <div className="bg-slate-50 p-6 rounded-2xl border text-sm font-medium text-slate-700">{s.activity}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const SlidesView = ({ deck }: any) => {
  const [current, setCurrent] = useState(0);
  if (!deck?.slides || deck.slides.length === 0) return null;
  const currentSlide = deck.slides[current];
  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in zoom-in-95 duration-500">
      <div className="flex justify-between items-center no-print">
        <div className="flex items-center gap-2">
          <div className="px-4 py-1.5 bg-slate-900 text-white rounded-lg font-black text-[10px] uppercase tracking-widest">PPT Mode</div>
          <span className="text-xs font-black text-slate-400 uppercase tracking-widest">{current + 1} / {deck.slides.length}</span>
        </div>
        <button onClick={() => window.print()} className="p-3 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl transition-all flex items-center gap-2"><Printer size={18} /><span className="text-[10px] font-black uppercase">Print Slides</span></button>
      </div>
      <div id="printable-area" className="bg-white rounded-[3rem] shadow-2xl overflow-hidden aspect-video relative flex flex-col md:flex-row border">
        <div className="flex-1 p-16 flex flex-col justify-center bg-white">
          <h3 className="text-4xl font-black text-slate-800 mb-8 leading-tight">{currentSlide?.title}</h3>
          <ul className="space-y-4">{currentSlide?.content?.map((c: any, i: number) => (<li key={i} className="flex gap-4 items-start text-xl font-semibold text-slate-600"><div className="w-2 h-2 rounded-full bg-violet-600 mt-3 shrink-0" />{c}</li>))}</ul>
        </div>
        <div className="w-1/3 bg-slate-50 flex items-center justify-center p-10 border-l relative">
          {currentSlide?.imageUrl ? <img src={currentSlide.imageUrl} className="w-full aspect-square rounded-3xl object-cover shadow-2xl" alt="" /> : <ImageIcon size={64} className="text-slate-200" />}
        </div>
        <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 px-6 flex justify-between pointer-events-none no-print">
          <button disabled={current === 0} onClick={() => setCurrent(p => p - 1)} className="p-4 bg-white/90 rounded-2xl shadow-xl pointer-events-auto disabled:opacity-0 hover:bg-white transition-all"><ChevronLeft size={24} /></button>
          <button disabled={current === deck.slides.length - 1} onClick={() => setCurrent(p => p + 1)} className="p-4 bg-white/90 rounded-2xl shadow-xl pointer-events-auto disabled:opacity-0 hover:bg-white transition-all"><ChevronRight size={24} /></button>
        </div>
      </div>
    </div>
  );
};

const HomeworkView = ({ homework }: any) => {
  return (
    <div id="printable-area" className="bg-white rounded-[2.5rem] shadow-2xl overflow-hidden max-w-4xl mx-auto border border-slate-100 p-16 animate-in fade-in zoom-in-95 duration-500 relative">
      <div className="text-center mb-12">
        <h3 className="text-4xl font-black text-slate-800 uppercase tracking-tighter mb-4">{homework?.title || "Academic Assignment"}</h3>
        <p className="text-slate-500 font-bold italic text-lg leading-relaxed max-w-2xl mx-auto">"{homework?.intro}"</p>
      </div>
      <div className="space-y-12">
        {homework?.tasks?.map((task: any, idx: number) => (
          <div key={idx} className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-slate-900 text-white rounded-xl flex items-center justify-center font-black">{idx + 1}</div>
              <h4 className="text-xl font-black text-slate-800 uppercase">{task.title}</h4>
            </div>
            <p className="text-slate-600 font-medium pl-14">{task.instruction}</p>
            {task.type === 'mcq' && task.options && (
              <div className="pl-14 grid grid-cols-2 gap-4">
                {task.options.map((opt: string, i: number) => <div key={i} className="p-4 border rounded-xl font-bold text-slate-700">{String.fromCharCode(65+i)}. {opt}</div>)}
              </div>
            )}
          </div>
        ))}
      </div>
      <div className="mt-12 pt-12 border-t flex justify-center no-print"><button onClick={() => window.print()} className="px-10 py-5 bg-slate-900 text-white rounded-2xl font-black uppercase text-xs flex items-center gap-3"><Printer size={20} /> Print Assignment</button></div>
    </div>
  );
};

const EditablePaper = ({ paper }: any) => {
  return (
    <div id="printable-area" className="bg-white p-8 md:p-16 border-slate-100 max-w-5xl mx-auto space-y-12 shadow-[0_0_50px_rgba(0,0,0,0.05)] print:shadow-none print:p-0">
      <style>{`
        @media print {
          @page { margin: 2cm; }
          body { font-family: serif !important; color: #000 !important; background: #fff !important; }
          #printable-area { width: 100% !important; margin: 0 !important; border: none !important; }
          .section-header { border-bottom: 2px solid #000 !important; margin-bottom: 1.5rem !important; }
          .question-item { page-break-inside: avoid; margin-bottom: 2rem !important; }
          .marks-label { font-family: sans-serif; font-size: 10pt; font-weight: bold; }
        }
      `}</style>
      <div className="text-center border-b-4 border-slate-900 pb-8 print:border-black">
        <h2 className="text-3xl font-black text-slate-900 uppercase tracking-tight mb-2 print:text-2xl">{paper.title}</h2>
        <div className="flex justify-center gap-8 text-[12px] font-black uppercase tracking-widest text-slate-700 print:text-black">
          <span>Max Marks: {paper.totalMarks}</span>
          <span>Time: {paper.duration}</span>
        </div>
      </div>
      <div className="space-y-12 print:space-y-10">
        {paper.sections.map((section: any, sIdx: number) => (
          <div key={section.id} className="space-y-6 section-container">
            <div className="flex items-center justify-between border-b-2 border-slate-200 pb-2 section-header print:border-black">
              <h4 className="font-black text-lg text-slate-900 uppercase tracking-tighter print:text-base">Part {String.fromCharCode(65 + sIdx)}: {section.title}</h4>
              <span className="text-[10px] font-bold text-slate-400 print:text-black uppercase">({section.totalSectionMarks} Marks)</span>
            </div>
            {section.instructions && <p className="text-sm font-bold italic text-slate-600 mb-4 leading-relaxed print:text-black">{section.instructions}</p>}
            <div className="space-y-8 print:space-y-6">
              {section.questions.map((q: any, qIdx: number) => (
                <div key={q.id} className="question-item space-y-4">
                  <div className="flex items-start gap-4">
                    <span className="font-bold text-slate-900 w-6 shrink-0 print:text-black">{qIdx + 1}.</span>
                    <div className="flex-1 space-y-4">
                      <p className="font-bold text-slate-800 leading-relaxed text-[17px] print:text-base print:font-semibold">{q.text}</p>
                      {q.options && (
                        <div className="grid grid-cols-2 gap-x-12 gap-y-2 ml-4">
                          {q.options.map((opt: string, i: number) => (
                            <div key={i} className="text-[15px] font-medium text-slate-700 print:text-sm print:text-black">({String.fromCharCode(97 + i)}) {opt}</div>
                          ))}
                        </div>
                      )}
                      
                      {q.alternativeText && (
                        <div className="mt-6 border-t border-dashed border-slate-200 pt-6 print:border-black">
                          <p className="text-center text-[10px] font-black uppercase tracking-[0.3em] text-slate-300 mb-4 print:text-black">( OR )</p>
                          <p className="font-bold text-slate-800 leading-relaxed text-[17px] print:text-base print:font-semibold">{q.alternativeText}</p>
                          {q.alternativeOptions && (
                            <div className="grid grid-cols-2 gap-x-12 gap-y-2 ml-4 mt-2">
                              {q.alternativeOptions.map((opt: string, i: number) => (
                                <div key={i} className="text-[15px] font-medium text-slate-700 print:text-sm print:text-black">({String.fromCharCode(97 + i)}) {opt}</div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                    <span className="font-bold text-slate-400 text-sm whitespace-nowrap marks-label print:text-black">[{q.marks}]</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
      <div className="mt-12 pt-12 border-t flex justify-center no-print gap-4">
        <button onClick={() => window.print()} className="px-12 py-5 bg-slate-900 text-white rounded-3xl font-black uppercase text-sm flex items-center gap-4 hover:scale-105 transition-all shadow-2xl"><Printer size={20} /> Print Exam Paper</button>
      </div>
    </div>
  );
};

// --- Grade Workspace Component ---

const GradeWorkspace: React.FC<{ context: TeacherContext, setContext: any }> = ({ context, setContext }) => {
  const { gradeId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const t = UI_STRINGS[context.language];
  
  const [selectedFile, setSelectedFile] = useState<{ name: string, base64: string, mimeType: string } | null>(null);
  const [formatFile, setFormatFile] = useState<{ name: string, base64: string, mimeType: string } | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [lastSavedResult, setLastSavedResult] = useState<any>(null);
  const [activeAction, setActiveAction] = useState<string | null>(null);
  const [showExamChoice, setShowExamChoice] = useState(false);
  const [showExamConfig, setShowExamConfig] = useState(false);
  const [showPlanConfig, setShowPlanConfig] = useState(false);
  const [showSlideConfig, setShowSlideConfig] = useState(false);
  const [showVault, setShowVault] = useState(false);
  const [showNamingModal, setShowNamingModal] = useState(false);
  const [showAlert, setShowAlert] = useState(false);
  const [examSettings, setExamSettings] = useState<QuestionSettings>({ totalMarks: 50, duration: '2 Hours', difficulty: 'Medium', sections: [{ id: '1', marksPerQuestion: 1, count: 10, type: 'compulsory', oneMarkVariety: 'MCQ' }] });
  const [pendingSessionTopic, setPendingSessionTopic] = useState<string | null>(null);
  const [isChatExpanded, setIsChatExpanded] = useState(false);

  useEffect(() => {
    if (location.state?.loadedResult && location.state?.loadedAction) {
      setResult(location.state.loadedResult);
      setActiveAction(location.state.loadedAction);
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = async () => {
        let base64 = (reader.result as string).split(',')[1];
        if (file.type.startsWith('image/')) {
          base64 = await compressImage(base64);
        }
        setSelectedFile({ name: file.name, base64, mimeType: file.type || 'image/jpeg' });
        setShowAlert(false);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAction = async (action: any, extra?: any) => {
    if (!selectedFile) {
      setShowAlert(true);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    setShowExamConfig(false); setShowExamChoice(false); setShowPlanConfig(false); setShowSlideConfig(false);
    setLoading(true); setActiveAction(action); setResult(null); setLastSavedResult(null); 
    try {
      let data;
      const contextTopic = pendingSessionTopic || "Academic Resource";
      const safeExtra = extra || {};
      if (action === 'plan') {
        data = await generateSyllabusPlan(safeExtra.duration ?? 4, safeExtra.unit ?? 'Weeks', context.grade, context.language, selectedFile!);
      } else if (action === 'paper') {
        data = await generateQuestionPaper(safeExtra.mode === 'bank' ? safeExtra.formatFile : selectedFile, safeExtra.formatFile, context.grade, context.language, examSettings, contextTopic, safeExtra.mode === 'auto');
      } else if (action === 'explain') {
        data = await generateSlideDeck(contextTopic, selectedFile || null, context.language, safeExtra.slideCount ?? 6);
      } else if (action === 'homework') {
        data = await generateHomework(contextTopic, context.grade, context.language, selectedFile);
      }
      setResult(data);
    } catch (err: any) { 
      console.error(err);
      alert(`Generation failed: ${err.message}`); 
    } finally { setLoading(false); setPendingSessionTopic(null); }
  };

  const handleSessionAction = (action: string, sessionTopic: string) => {
    setPendingSessionTopic(sessionTopic);
    if (!selectedFile) { setShowAlert(true); window.scrollTo({ top: 0, behavior: 'smooth' }); return; }
    if (action === 'paper') setShowExamChoice(true);
    else if (action === 'explain') setShowSlideConfig(true);
    else if (action === 'homework') handleAction('homework');
  };

  const handleExamChoice = (mode: 'auto' | 'custom' | 'bank', data?: any) => {
    if (mode === 'auto') { setShowExamChoice(false); handleAction('paper', { mode: 'auto', formatFile: data }); } 
    else if (mode === 'bank') { setShowExamChoice(false); setFormatFile(data); setShowExamConfig(true); } 
    else { setShowExamChoice(false); setShowExamConfig(true); }
  };

  const openSaveDialog = () => {
    if (!result) return;
    if (lastSavedResult === result) { alert("⚠️ Already saved to vault."); return; }
    setShowNamingModal(true);
  };

  const saveToVault = async (title: string) => {
    const user = auth.currentUser;
    if (!user || !result || !activeAction) return;
    try {
      const clone = JSON.parse(JSON.stringify(result));
      if (activeAction === 'explain' && clone.slides) {
        clone.slides = clone.slides.map((s: Slide) => ({
          ...s,
          imageUrl: "" 
        }));
      }
      
      const typeMap: Record<string, string> = { 
        'paper': 'question_paper', 
        'plan': 'syllabus_plan', 
        'explain': 'slide_deck', 
        'homework': 'homework' 
      };
      const vaultType = typeMap[activeAction] || 'other';
      
      await addDoc(collection(db, "users", user.uid, "vault"), { 
        title, 
        type: vaultType, 
        content: clone, 
        grade: gradeId, 
        createdAt: serverTimestamp() 
      });
      setLastSavedResult(result); 
      setShowNamingModal(false); 
      alert('✅ Saved successfully to Vault! (Images stripped to save space)');
    } catch (e) { 
      console.error("Save Error:", e); 
      alert('❌ Error saving to Vault. The content might be too large.'); 
    }
  };

  const handleActionWithWarning = (action: string) => {
    if (!selectedFile) { setShowAlert(true); window.scrollTo({ top: 0, behavior: 'smooth' }); return; }
    if (action === 'plan') setShowPlanConfig(true);
    else if (action === 'paper') setShowExamChoice(true);
    else if (action === 'explain') setShowSlideConfig(true);
  };

  return (
    <div className="max-w-7xl mx-auto space-y-12 animate-in fade-in duration-700">
      <SaveNamingModal isOpen={showNamingModal} onClose={() => setShowNamingModal(false)} onConfirm={saveToVault} suggestedTitle={result?.title || `Grade ${gradeId} Document`} />
      <ExamChoiceModal isOpen={showExamChoice} onClose={() => setShowExamChoice(false)} onSelect={handleExamChoice} />
      <BlueprintModal isOpen={showExamConfig} onClose={() => setShowExamConfig(false)} settings={examSettings} setSettings={setExamSettings} onConfirm={() => handleAction('paper', { mode: formatFile ? 'bank' : 'custom', formatFile })} />
      <MasterPlanModal isOpen={showPlanConfig} onClose={() => setShowPlanConfig(false)} onConfirm={(duration: number, unit: any) => handleAction('plan', { duration, unit })} />
      <SlideConfigModal isOpen={showSlideConfig} onClose={() => setShowSlideConfig(false)} onConfirm={(slideCount: number) => handleAction('explain', { slideCount })} />
      <VaultModal isOpen={showVault} onClose={() => setShowVault(false)} gradeId={gradeId!} onLoad={(item) => { setResult(item.content); setActiveAction(item.type === 'question_paper' ? 'paper' : item.type === 'syllabus_plan' ? 'plan' : item.type === 'slide_deck' ? 'explain' : item.type === 'homework' ? 'homework' : 'explain'); setShowVault(false); setLastSavedResult(item.content); }} language={context.language} />

      <div className="flex items-center justify-between no-print">
        <div className="flex items-center gap-6">
          <button onClick={() => result ? setResult(null) : navigate('/')} className="w-14 h-14 flex items-center justify-center bg-white rounded-full shadow-xl hover:bg-slate-50 transition-colors"><ArrowLeft size={24} /></button>
          <div><h2 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tighter uppercase leading-none">Grade {gradeId} <span className="text-violet-600">Workspace</span></h2></div>
        </div>
        <div className="flex items-center gap-4">
          {result && (
            <button onClick={openSaveDialog} className={`flex items-center gap-3 px-8 py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-xl transition-all ${lastSavedResult === result ? 'bg-emerald-100 text-emerald-600' : 'bg-violet-600 text-white'}`}>
              {lastSavedResult === result ? <CheckCircle2 size={16} /> : <Save size={16} />}{lastSavedResult === result ? 'Saved to Vault' : 'Save'}
            </button>
          )}
          <button onClick={() => setShowVault(true)} className="flex items-center gap-3 px-8 py-4 bg-white rounded-2xl font-black uppercase text-[10px] shadow-xl hover:bg-slate-50 transition-all"><Archive size={16} /> {t.myVault}</button>
        </div>
      </div>

      {!result && !loading ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 no-print relative">
          <div className={`${isChatExpanded ? 'hidden' : 'lg:col-span-8'} space-y-8 transition-all duration-500`}>
            {showAlert && (
              <div className="bg-rose-50 border-4 border-rose-500 p-8 rounded-[3rem] flex items-center gap-6 animate-in zoom-in-95 shadow-2xl">
                <div className="w-20 h-20 bg-rose-600 text-white rounded-3xl flex items-center justify-center shrink-0"><AlertTriangle size={40} /></div>
                <div className="flex-1"><h4 className="text-rose-900 font-black uppercase tracking-widest">Attention Required</h4><p className="text-rose-700 text-lg font-bold">Please upload a Syllabus or Textbook file first.</p></div>
                <button onClick={() => setShowAlert(false)} className="p-3 text-rose-300 transition-colors"><X size={32} /></button>
              </div>
            )}
            <div className="bg-white rounded-[4rem] p-12 shadow-2xl border border-slate-100 relative overflow-hidden group">
              <div onClick={() => fileInputRef.current?.click()} className={`w-full aspect-[21/9] border-4 border-dashed rounded-[3rem] p-12 flex flex-col items-center justify-center cursor-pointer transition-all ${selectedFile ? 'border-violet-600 bg-violet-50/50' : 'border-slate-100 hover:border-[#4FB5C0]'}`}>
                <div className={`w-20 h-20 rounded-[1.5rem] flex items-center justify-center mb-6 shadow-2xl ${selectedFile ? 'bg-violet-600 text-white' : 'bg-slate-100 text-slate-300'}`}>{selectedFile ? <FileIcon size={32} /> : <BookOpen size={32} />}</div>
                <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tighter mb-2">{selectedFile ? selectedFile.name : t.uploadPrompt}</h3>
                <input type="file" ref={fileInputRef} onChange={handleFileUpload} className="hidden" />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <ActionButton icon={BookOpen} label={t.masterPlan} onClick={() => handleActionWithWarning('plan')} bg="bg-indigo-100 text-indigo-600" />
              <ActionButton icon={QuestionIcon} label={t.genExam} onClick={() => handleActionWithWarning('paper')} bg="bg-violet-600 text-white" primary />
              <ActionButton icon={Zap} label={t.slides} onClick={() => handleActionWithWarning('explain')} bg="bg-amber-100 text-amber-500" />
            </div>
          </div>
          <div className={`${isChatExpanded ? 'lg:col-span-12' : 'lg:col-span-4'} h-full flex flex-col min-h-[600px] transition-all duration-500`}>
            <ChatSidebar 
              t={t} 
              context={context} 
              selectedFile={selectedFile} 
              isExpanded={isChatExpanded} 
              setIsExpanded={setIsChatExpanded} 
            />
          </div>
        </div>
      ) : loading ? (
        <LoadingState action={activeAction} />
      ) : (
        <div className="space-y-12 pb-20">
          {activeAction === 'paper' && <EditablePaper paper={result} />}
          {activeAction === 'plan' && <PlanView plan={result} onSessionAction={handleSessionAction} />}
          {activeAction === 'explain' && <SlidesView deck={result} />}
          {activeAction === 'homework' && <HomeworkView homework={result} />}
        </div>
      )}
    </div>
  );
};

const ActionButton = ({ icon: Icon, label, onClick, bg, primary }: any) => (
  <button onClick={onClick} className={`flex-1 p-10 rounded-[3rem] transition-all group active:scale-95 flex flex-col items-center justify-center text-center relative overflow-hidden ${primary ? 'bg-slate-900 text-white shadow-2xl' : 'bg-white border border-slate-100 shadow-xl'}`}>
    <div className={`w-16 h-16 ${bg} rounded-[1.5rem] flex items-center justify-center mb-4 group-hover:scale-110 transition-transform relative z-10`}><Icon size={28} className={primary ? 'text-white' : ''} /></div>
    <p className="font-black uppercase text-[10px] tracking-[0.2em] relative z-10">{label}</p>
  </button>
);

const LoadingState = ({ action }: any) => (
  <div className="h-[60vh] flex flex-col items-center justify-center space-y-12 no-print">
    <div className="relative"><div className="w-48 h-48 border-[20px] border-slate-100 border-t-violet-600 rounded-full animate-spin"></div><div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-violet-600 animate-pulse"><Sparkles size={64} /></div></div>
    <div className="text-center space-y-4"><h3 className="text-5xl font-black text-slate-900 uppercase tracking-tighter">AI WORKING</h3><p className="text-slate-400 font-black uppercase text-xs tracking-[0.6em] animate-pulse">Forging educational mastery...</p></div>
  </div>
);

const ChatSidebar = ({ t, context, selectedFile, isExpanded, setIsExpanded }: any) => {
  const [messages, setMessages] = useState<any[]>([]);
  const [activeChat, setActiveChat] = useState<any[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Subscribe to all messages for this grade
  useEffect(() => {
    const user = auth.currentUser;
    if (!user) return;
    
    const q = query(
      collection(db, "users", user.uid, "chats"), 
      where("grade", "==", context.grade)
    );
    
    const unsub = onSnapshot(q, (snapshot) => {
      const msgs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      msgs.sort((a: any, b: any) => {
        const timeA = a.createdAt?.seconds || 0;
        const timeB = b.createdAt?.seconds || 0;
        return timeA - timeB;
      });
      setMessages(msgs);
    });
    return () => unsub();
  }, [context.grade]);

  // Handle scrolling when active chat changes
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [activeChat, loading, showHistory]);

  const handleSend = async () => {
    if (!input.trim() || loading) return;
    const user = auth.currentUser;
    if (!user) return;

    const userMsgText = input.trim();
    const tempUserMsg = { role: 'user', text: userMsgText, createdAt: { seconds: Date.now()/1000 } };
    
    setActiveChat(prev => [...prev, tempUserMsg]);
    setInput('');
    setLoading(true);
    
    try {
      // 1. Persist User Message to Firestore
      await addDoc(collection(db, "users", user.uid, "chats"), {
        role: 'user',
        text: userMsgText,
        grade: context.grade,
        createdAt: serverTimestamp()
      });

      // 2. Query Gemini
      const response = await askChatQuestion(userMsgText, selectedFile, context.language);
      
      const tempAiMsg = { role: 'ai', text: response, createdAt: { seconds: Date.now()/1000 } };
      setActiveChat(prev => [...prev, tempAiMsg]);

      // 3. Persist AI Response to Firestore
      await addDoc(collection(db, "users", user.uid, "chats"), {
        role: 'ai',
        text: response,
        grade: context.grade,
        createdAt: serverTimestamp()
      });
    } catch (e) {
      console.error("Chat error:", e);
    } finally {
      setLoading(false);
    }
  };

  const clearHistory = async () => {
    const user = auth.currentUser;
    if (!user) return;
    if (!confirm("⚠️ This will permanently erase ALL chat records for this grade. Proceed?")) return;
    
    try {
      const q = query(
        collection(db, "users", user.uid, "chats"), 
        where("grade", "==", context.grade)
      );
      const snapshot = await getDocs(q);
      if (snapshot.empty) return;

      const batch = writeBatch(db);
      snapshot.docs.forEach(d => {
        batch.delete(d.ref);
      });
      await batch.commit();
      
      // Clear local UI states
      setActiveChat([]);
      setMessages([]);
    } catch (e) {
      console.error("Wipe all error:", e);
      alert("Failed to clear history.");
    }
  };

  const deleteSingleMessage = async (msgId: string) => {
    const user = auth.currentUser;
    if (!user || !msgId) return;
    try {
      // Check if message is in active chat UI, remove it there too if needed
      setActiveChat(prev => prev.filter(m => m.id !== msgId));
      
      // Delete from Firestore
      await deleteDoc(doc(db, "users", user.uid, "chats", msgId));
    } catch (e) {
      console.error("Error deleting message:", e);
    }
  };

  // Function to load the full conversation timeline into active view
  const loadConversationFromHistory = () => {
    // History contains all messages sorted by time for this grade
    setActiveChat([...messages]);
    setShowHistory(false);
  };

  // Helper to render markdown-like styles cleanly
  const renderCleanText = (text: string) => {
    if (!text) return null;
    return text.split('\n').map((line, idx) => {
      const cleanLine = line.trim();
      if (!cleanLine) return <div key={idx} className="h-2" />;
      
      if (cleanLine.startsWith('###')) {
        return <h4 key={idx} className="text-violet-400 font-black uppercase tracking-widest text-[10px] mt-4 mb-2">{cleanLine.replace(/#/g, '').trim()}</h4>;
      }
      
      if (cleanLine.startsWith('*') || cleanLine.startsWith('-')) {
        return (
          <div key={idx} className="flex gap-2 items-start mt-1">
            <span className="text-violet-500">•</span>
            <span className="text-slate-300">{cleanLine.substring(1).trim()}</span>
          </div>
        );
      }

      // Strong tags
      const parts = cleanLine.split(/(\*\*.*?\*\*)/g);
      return (
        <p key={idx} className="mt-2 text-slate-300">
          {parts.map((part, pIdx) => {
            if (part.startsWith('**') && part.endsWith('**')) {
              return <strong key={pIdx} className="text-white font-bold">{part.slice(2, -2)}</strong>;
            }
            return part;
          })}
        </p>
      );
    });
  };

  return (
    <div className={`h-full bg-slate-900 rounded-[3.5rem] shadow-2xl flex flex-col overflow-hidden border border-white/10 no-print transition-all duration-500`}>
      <div className="p-8 border-b border-white/5 bg-gradient-to-r from-violet-600 to-indigo-600 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <MessageSquare size={18} className="text-white" />
          <span className="font-black text-white uppercase tracking-[0.2em] text-xs">{t.educatorGpt}</span>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={() => setShowHistory(!showHistory)}
            title="Toggle Archive History"
            className={`p-2 rounded-xl transition-colors ${showHistory ? 'bg-white text-violet-600' : 'bg-white/10 hover:bg-white/20 text-white'}`}
          >
            <History size={16} />
          </button>
          <button 
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-2 bg-white/10 hover:bg-white/20 text-white rounded-xl transition-colors"
          >
            {isExpanded ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
          </button>
        </div>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto p-8 space-y-6 custom-scrollbar scroll-smooth">
        {showHistory ? (
          <div className="animate-in fade-in slide-in-from-left-4 duration-300 h-full flex flex-col">
            <div className="flex items-center justify-between mb-6 border-b border-white/10 pb-4">
              <h5 className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{t.conversationArchive}</h5>
              {messages.length > 0 && (
                <div className="flex gap-2">
                   <button 
                    onClick={loadConversationFromHistory}
                    className="text-[10px] font-black text-indigo-400 uppercase flex items-center gap-1.5 hover:underline"
                   >
                     Load Timeline
                   </button>
                   <button onClick={clearHistory} className="text-[10px] font-black text-rose-500 uppercase flex items-center gap-1.5 hover:underline transition-colors hover:text-rose-400">
                    <Trash size={12} /> Wipe All
                  </button>
                </div>
              )}
            </div>
            <div className="space-y-3">
              {messages.length === 0 ? (
                <div className="text-center py-20 opacity-20">
                  <Archive size={48} className="mx-auto text-white mb-4" />
                  <p className="text-[10px] text-white uppercase font-black tracking-widest">{t.archiveEmpty}</p>
                </div>
              ) : messages.map((m: any) => (
                <div 
                  key={m.id} 
                  onClick={() => {
                    // Click individual to see it in full view
                    setActiveChat([m]);
                    setShowHistory(false);
                  }}
                  className="group/item relative p-4 bg-white/5 rounded-2xl flex items-start gap-4 hover:bg-white/10 transition-all cursor-pointer"
                >
                  <div className={`w-2 h-2 rounded-full mt-1 shrink-0 ${m.role === 'user' ? 'bg-indigo-500' : 'bg-violet-400'}`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-[11px] text-slate-300 leading-relaxed line-clamp-3">
                      {m.text}
                    </p>
                    <span className="text-[8px] font-black text-slate-600 uppercase mt-2 block tracking-widest">
                      {m.role === 'user' ? 'User Question' : 'AI Assistant'}
                    </span>
                  </div>
                  <button 
                    onClick={(e) => { e.stopPropagation(); deleteSingleMessage(m.id); }}
                    className="opacity-0 group-hover/item:opacity-100 transition-opacity p-2 text-slate-600 hover:text-rose-500 rounded-lg hover:bg-rose-500/10"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <>
            {activeChat.length === 0 && !loading && (
              <div className="h-full flex flex-col items-center justify-center text-center space-y-4 opacity-30 animate-in fade-in duration-700">
                <Sparkles size={48} className="text-white" />
                <p className="text-white font-black uppercase text-[10px] tracking-widest max-w-[200px]">
                  {t.chatEmpty}
                </p>
              </div>
            )}

            {activeChat.map((msg: any, i: number) => (
              <div key={i} className={`flex items-start gap-4 ${msg.role === 'user' ? 'flex-row-reverse' : ''} animate-in fade-in slide-in-from-bottom-2 duration-400`}>
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 shadow-lg ${
                  msg.role === 'user' ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-violet-400'
                }`}>
                  {msg.role === 'user' ? <User size={14} /> : <Sparkles size={14} />}
                </div>
                <div className={`max-w-[85%] p-5 rounded-2xl text-[11px] font-medium leading-relaxed group relative shadow-xl ${
                  msg.role === 'user' 
                  ? 'bg-indigo-600/20 text-indigo-100 rounded-tr-none border border-indigo-500/20' 
                  : 'bg-white/5 text-slate-300 rounded-tl-none border border-white/5 shadow-inner backdrop-blur-sm'
                }`}>
                  <div className="prose prose-invert prose-xs max-w-none">
                     {renderCleanText(msg.text)}
                  </div>
                  {msg.id && (
                    <button 
                      onClick={() => deleteSingleMessage(msg.id)}
                      className="absolute -bottom-6 opacity-0 group-hover:opacity-100 transition-opacity text-[8px] font-black text-rose-500 uppercase tracking-widest right-0"
                    >
                      Delete
                    </button>
                  )}
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex items-start gap-4 animate-pulse">
                <div className="w-8 h-8 rounded-xl bg-slate-800 flex items-center justify-center">
                  <Loader2 size={14} className="text-violet-400 animate-spin" />
                </div>
                <div className="bg-white/5 border border-white/5 p-5 rounded-2xl rounded-tl-none w-2/3 space-y-2">
                   <div className="h-2 bg-white/10 rounded w-full"></div>
                   <div className="h-2 bg-white/10 rounded w-4/5"></div>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {!showHistory && (
        <div className="p-6 bg-white/5 border-t border-white/5">
          <div className="relative">
            <input 
              placeholder={t.askGpt} 
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSend()}
              className="w-full pl-6 pr-14 py-5 bg-white/10 rounded-2xl text-xs font-bold text-white outline-none border border-white/10 focus:border-violet-500/50 transition-all placeholder:text-slate-500" 
            />
            <button 
              onClick={handleSend}
              disabled={!input.trim() || loading}
              className="absolute right-2 top-2 bottom-2 w-12 bg-white text-slate-900 rounded-xl flex items-center justify-center hover:scale-105 active:scale-95 transition-all shadow-lg disabled:opacity-50"
            >
              <Send size={18} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default GradeWorkspace;
