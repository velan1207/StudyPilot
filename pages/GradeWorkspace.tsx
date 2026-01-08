
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
  AlertTriangle,
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
  Monitor,
  Pencil,
  Archive,
  ExternalLink,
  Circle,
  RefreshCw,
  Layers,
  Search,
  Filter,
  FileCheck,
  ClipboardList,
  Upload,
  Maximize2,
  Minimize2,
  Presentation,
  ImageIcon,
  CheckCircle,
  FileEdit,
  ImageOff
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
import { doc, onSnapshot, setDoc, updateDoc, arrayUnion, collection, query, deleteDoc, getDocs, orderBy, serverTimestamp, where } from 'firebase/firestore';

const ConfirmModal = ({ isOpen, onClose, onConfirm, title, message, actionLabel }: any) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-[200] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-[2rem] w-full max-sm overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
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

const SaveNamingModal = ({ isOpen, onClose, onConfirm, suggestedTitle }: { isOpen: boolean, onClose: () => void, onConfirm: (title: string) => void, suggestedTitle: string }) => {
  const [title, setTitle] = useState(suggestedTitle);

  useEffect(() => {
    if (isOpen) setTitle(suggestedTitle);
  }, [isOpen, suggestedTitle]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[200] bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-white rounded-[2.5rem] w-full max-w-md overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300">
        <div className="p-8 border-b bg-slate-50/50 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-indigo-50 text-indigo-500 rounded-2xl flex items-center justify-center shadow-sm">
              <FileEdit size={24} />
            </div>
            <div>
              <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight">Save to Vault</h3>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Enter a name for this item</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-slate-300 hover:text-slate-600 transition-colors"><X size={28} /></button>
        </div>
        <div className="p-8 space-y-6">
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2">Item Name</label>
            <input 
              autoFocus
              className="w-full bg-slate-50 border-2 border-transparent rounded-[1.2rem] px-6 py-4 font-bold text-slate-800 outline-none focus:border-[#4FB5C0] focus:bg-white transition-all shadow-inner"
              value={title}
              onChange={e => setTitle(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && title.trim() && onConfirm(title)}
              placeholder="e.g. Science Quiz - Week 4"
            />
            <div className="flex items-center gap-1 px-2">
               <Sparkles size={10} className="text-[#4FB5C0]" />
               <p className="text-[9px] font-bold text-[#4FB5C0] uppercase tracking-wider">Suggested: {suggestedTitle}</p>
            </div>
          </div>
        </div>
        <div className="p-6 bg-slate-50 border-t flex gap-4">
          <button onClick={onClose} className="flex-1 py-4 font-black text-slate-400 uppercase text-[10px] tracking-[0.2em]">Cancel</button>
          <button 
            disabled={!title.trim()}
            onClick={() => onConfirm(title)} 
            className="flex-1 py-4 bg-[#4FB5C0] text-white rounded-[1.2rem] font-black shadow-xl shadow-[#4FB5C0]/20 hover:scale-[1.02] active:scale-[0.98] transition-all uppercase text-[10px] tracking-[0.2em] disabled:opacity-50"
          >
            Add to Vault
          </button>
        </div>
      </div>
    </div>
  );
};

const ExamChoiceModal = ({ isOpen, onClose, onSelect }: any) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFormatUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        onSelect('auto', { 
          name: file.name, 
          base64: (reader.result as string).split(',')[1], 
          mimeType: file.type || 'application/pdf' 
        });
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="fixed inset-0 z-[150] bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-white rounded-[3rem] w-full max-w-2xl overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300">
        <div className="p-10 border-b bg-slate-50/50 flex items-center justify-between">
          <div>
            <h3 className="text-2xl font-black text-slate-800 uppercase tracking-tight">Generate Exam Paper</h3>
            <p className="text-sm font-bold text-slate-400">Choose how you want to structure your questions</p>
          </div>
          <button onClick={onClose} className="p-2 text-slate-300 hover:text-slate-600 transition-colors"><X size={28} /></button>
        </div>
        <div className="p-10 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="relative h-full">
            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handleFormatUpload} 
              className="hidden" 
              accept="image/*,application/pdf" 
            />
            <button 
              onClick={() => fileInputRef.current?.click()}
              className="w-full h-full flex flex-col items-center text-center p-8 bg-white border-2 border-slate-100 rounded-[2.5rem] hover:border-[#4FB5C0] hover:bg-[#F0F9FA] transition-all group active:scale-95"
            >
              <div className="w-16 h-16 bg-[#4FB5C0]/10 text-[#4FB5C0] rounded-2xl flex items-center justify-center mb-6 group-hover:bg-[#4FB5C0] group-hover:text-white transition-all">
                <Upload size={32} />
              </div>
              <h4 className="text-lg font-black text-slate-800 uppercase tracking-tight mb-2">Smart Extraction</h4>
              <p className="text-xs font-bold text-slate-400 leading-relaxed uppercase">
                Upload a previous year paper to mirror its structure & layout
              </p>
            </button>
          </div>
          
          <button 
            onClick={() => onSelect('custom')}
            className="flex flex-col items-center text-center p-8 bg-white border-2 border-slate-100 rounded-[2.5rem] hover:border-indigo-500 hover:bg-indigo-50 transition-all group active:scale-95"
          >
            <div className="w-16 h-16 bg-indigo-50 text-indigo-500 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-indigo-500 group-hover:text-white transition-all">
              <ClipboardList size={32} />
            </div>
            <h4 className="text-lg font-black text-slate-800 uppercase tracking-tight mb-2">Custom Blueprint</h4>
            <p className="text-xs font-bold text-slate-400 leading-relaxed uppercase">
              Manually define sections, marks, and question variety
            </p>
          </button>
        </div>
        <div className="p-8 bg-slate-50 border-t flex justify-center">
           <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
             <Sparkles size={12} className="text-[#4FB5C0]" /> AI will handle question content generation in both modes
           </p>
        </div>
      </div>
    </div>
  );
};

const MasterPlanModal = ({ isOpen, onClose, onConfirm }: any) => {
  const [duration, setDuration] = useState(4);
  const [unit, setUnit] = useState('Weeks');
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-[150] bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-[2rem] w-full max-w-md overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
        <div className="p-8 border-b bg-slate-50 flex items-center justify-between">
            <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight">Plan Duration</h3>
            <button onClick={onClose} className="p-2 text-slate-300 hover:text-slate-600 transition-colors"><X size={24} /></button>
        </div>
        <div className="p-8 space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Duration</label>
              <input type="number" value={duration} onChange={e => setDuration(parseInt(e.target.value) || 1)} className="w-full bg-slate-50 p-4 rounded-xl font-black outline-none focus:ring-2 ring-indigo-500/20" />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Unit</label>
              <select value={unit} onChange={e => setUnit(e.target.value)} className="w-full bg-slate-50 p-4 rounded-xl font-black appearance-none outline-none focus:ring-2 ring-indigo-500/20">
                <option>Days</option><option>Weeks</option><option>Months</option>
              </select>
            </div>
          </div>
        </div>
        <div className="p-6 bg-slate-50 flex gap-4">
          <button onClick={onClose} className="flex-1 py-4 font-black text-slate-400 uppercase text-[10px] tracking-widest">Cancel</button>
          <button onClick={() => onConfirm(duration, unit)} className="flex-1 py-4 bg-indigo-500 text-white rounded-xl font-black uppercase text-[10px] tracking-widest shadow-lg shadow-indigo-500/20">Create Roadmap</button>
        </div>
      </div>
    </div>
  );
};

const SlideConfigModal = ({ isOpen, onClose, onConfirm }: any) => {
  const [count, setCount] = useState(6);
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-[150] bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-[2rem] w-full max-w-md overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
        <div className="p-8 border-b bg-slate-50 flex items-center justify-between">
            <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight">Slide Count</h3>
            <button onClick={onClose} className="p-2 text-slate-300 hover:text-slate-600 transition-colors"><X size={24} /></button>
        </div>
        <div className="p-8 space-y-6">
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">How many slides?</label>
            <input type="number" value={count} onChange={e => setCount(parseInt(e.target.value) || 1)} className="w-full bg-slate-50 p-4 rounded-xl font-black outline-none focus:ring-2 ring-amber-500/20" />
          </div>
        </div>
        <div className="p-6 bg-slate-50 flex gap-4">
          <button onClick={onClose} className="flex-1 py-4 font-black text-slate-400 uppercase text-[10px] tracking-widest">Cancel</button>
          <button onClick={() => onConfirm(count)} className="flex-1 py-4 bg-amber-500 text-white rounded-xl font-black uppercase text-[10px] tracking-widest shadow-lg shadow-amber-500/20">Generate Deck</button>
        </div>
      </div>
    </div>
  );
};

const VaultModal = ({ isOpen, onClose, gradeId, onLoad, onDelete }: { isOpen: boolean, onClose: () => void, gradeId: string, onLoad: (item: any) => void, onDelete: (id: string) => void }) => {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState<'all' | 'question_paper' | 'slide_deck' | 'homework' | 'syllabus_plan'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (!isOpen) return;
    const user = auth.currentUser;
    if (!user) return;

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

  const categories = [
    { id: 'all', label: 'All Content', icon: Layers, color: 'text-slate-500', bg: 'bg-slate-50' },
    { id: 'question_paper', label: 'Question Papers', icon: FileIcon, color: 'text-emerald-500', bg: 'bg-emerald-50' },
    { id: 'slide_deck', label: 'Slide Decks', icon: Monitor, color: 'text-amber-500', bg: 'bg-amber-50' },
    { id: 'homework', label: 'Assignments', icon: Pencil, color: 'text-[#4FB5C0]', bg: 'bg-[#F0F9FA]' },
    { id: 'syllabus_plan', label: 'Master Plans', icon: BookOpen, color: 'text-indigo-500', bg: 'bg-indigo-50' }
  ];

  const filteredItems = items
    .filter(item => activeCategory === 'all' || item.type === activeCategory)
    .filter(item => item.title.toLowerCase().includes(searchQuery.toLowerCase()));

  const getItemIcon = (type: string) => {
    const cat = categories.find(c => c.id === type);
    return cat ? <cat.icon size={20} /> : <FileIcon size={20} />;
  };

  const getItemColor = (type: string) => {
    const cat = categories.find(c => c.id === type);
    return cat ? cat.color : 'text-slate-400';
  };

  return (
    <div className="fixed inset-0 z-[150] bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-[#F8FAFB] rounded-[3rem] w-full max-w-6xl overflow-hidden flex flex-col md:flex-row shadow-[0_32px_64px_-12px_rgba(0,0,0,0.2)] animate-in zoom-in-95 duration-300 max-h-[90vh]">
        
        <div className="w-full md:w-72 bg-white border-r border-slate-100 flex flex-col shrink-0">
          <div className="p-8 border-b border-slate-100">
            <div className="flex items-center gap-3 mb-1">
              <Archive size={24} className="text-[#4FB5C0]" />
              <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight">My Vault</h3>
            </div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">{gradeId}</p>
          </div>
          
          <div className="flex-1 p-4 space-y-1.5 overflow-y-auto custom-scrollbar">
            {categories.map((cat) => (
              <button 
                key={cat.id}
                onClick={() => setActiveCategory(cat.id as any)}
                className={`w-full flex items-center gap-4 px-5 py-4 rounded-2xl transition-all group ${
                  activeCategory === cat.id 
                  ? `${cat.bg} ${cat.color} ring-1 ring-${cat.color.split('-')[1]}-200 shadow-sm` 
                  : 'hover:bg-slate-50 text-slate-400 hover:text-slate-600'
                }`}
              >
                <div className={`shrink-0 transition-transform ${activeCategory === cat.id ? 'scale-110' : 'group-hover:scale-110'}`}>
                  <cat.icon size={20} />
                </div>
                <div className="text-left">
                  <p className={`text-xs font-black uppercase tracking-wider ${activeCategory === cat.id ? '' : 'text-slate-500'}`}>{cat.label}</p>
                  <p className="text-[9px] font-bold opacity-60 uppercase">
                    {items.filter(i => cat.id === 'all' || i.type === cat.id).length} Items
                  </p>
                </div>
              </button>
            ))}
          </div>
          
          <div className="p-6 bg-slate-50/50 border-t border-slate-100">
            <div className="bg-indigo-50 rounded-2xl p-4 flex gap-3">
              <Sparkles size={16} className="text-indigo-500 shrink-0" />
              <p className="text-[9px] font-bold text-indigo-700 leading-relaxed uppercase">Vault content is automatically synced across all your devices.</p>
            </div>
          </div>
        </div>

        <div className="flex-1 flex flex-col min-w-0">
          <div className="p-6 md:p-8 bg-white border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shrink-0">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
              <input 
                type="text" 
                placeholder="Search items in vault..." 
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border-none rounded-[1.2rem] text-sm font-bold text-slate-800 outline-none focus:ring-4 ring-indigo-50 transition-all placeholder:text-slate-300"
              />
            </div>
            <button onClick={onClose} className="hidden sm:flex p-3 text-slate-300 hover:text-slate-600 transition-all bg-slate-50 rounded-xl"><X size={24} /></button>
          </div>

          <div className="flex-1 p-6 md:p-10 overflow-y-auto custom-scrollbar">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-20 gap-4">
                <div className="relative">
                  <div className="w-16 h-16 border-4 border-[#4FB5C0]/10 border-t-[#4FB5C0] rounded-full animate-spin"></div>
                  <Archive className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-[#4FB5C0]" size={20} />
                </div>
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Opening Vault...</p>
              </div>
            ) : filteredItems.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-24 text-center space-y-6">
                <div className="w-24 h-24 bg-white border border-slate-100 rounded-full flex items-center justify-center text-slate-200 mx-auto shadow-sm">
                  {searchQuery ? <Search size={40} /> : <Archive size={40} />}
                </div>
                <div>
                  <p className="text-xl font-black text-slate-400 uppercase tracking-tight">
                    {searchQuery ? `No results for "${searchQuery}"` : "This section is empty"}
                  </p>
                  <p className="text-[10px] font-bold text-slate-300 uppercase tracking-[0.2em] mt-2 max-w-[280px] mx-auto leading-relaxed">
                    {searchQuery ? "Try adjusting your search terms or filter." : "Start generating content and save them to access them here later."}
                  </p>
                </div>
                {!searchQuery && (
                  <button onClick={onClose} className="px-8 py-3 bg-white border border-slate-200 text-slate-500 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-50 transition-all">Back to Workspace</button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredItems.map((item) => (
                  <div key={item.id} className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-xl hover:border-indigo-200 transition-all group relative flex flex-col h-full overflow-hidden">
                    <div className={`absolute top-0 right-0 p-8 opacity-[0.03] -mr-4 -mt-4 transition-transform group-hover:scale-125 duration-500 ${getItemColor(item.type)}`}>
                      {getItemIcon(item.type)}
                    </div>
                    
                    <button 
                      onClick={(e) => { e.stopPropagation(); onDelete(item.id); }}
                      className="absolute top-4 right-4 w-9 h-9 bg-rose-50 text-rose-400 hover:bg-rose-500 hover:text-white rounded-xl flex items-center justify-center transition-all opacity-0 group-hover:opacity-100 z-10 shadow-sm"
                      title="Delete from Vault"
                    >
                      <Trash2 size={16} />
                    </button>

                    <div className="flex items-start justify-between mb-5">
                      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-colors shadow-sm ${
                        item.type === 'question_paper' ? 'bg-emerald-50 text-emerald-500' : 
                        item.type === 'slide_deck' ? 'bg-amber-50 text-amber-500' : 
                        item.type === 'homework' ? 'bg-[#F0F9FA] text-[#4FB5C0]' : 'bg-indigo-50 text-indigo-500'
                      }`}>
                        {getItemIcon(item.type)}
                      </div>
                      <span className="text-[8px] font-black bg-slate-50 text-slate-400 px-3 py-1.5 rounded-full uppercase tracking-widest mt-1">
                        {item.createdAt?.toDate ? item.createdAt.toDate().toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : 'Recent'}
                      </span>
                    </div>

                    <div className="flex-1 mb-6">
                      <h4 className="font-black text-slate-800 text-base mb-1.5 uppercase tracking-tight line-clamp-2 pr-4">{item.title}</h4>
                      <div className="flex items-center gap-2">
                         <p className={`text-[9px] font-black uppercase tracking-widest ${getItemColor(item.type)}`}>
                          {item.type.replace('_', ' ')}
                        </p>
                        <div className="w-1 h-1 rounded-full bg-slate-200"></div>
                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{gradeId}</p>
                      </div>
                    </div>

                    <button 
                      onClick={() => onLoad(item)}
                      className="w-full py-4 bg-slate-50 hover:bg-[#4FB5C0] hover:text-white text-slate-500 rounded-2xl font-black uppercase text-[10px] tracking-[0.2em] transition-all flex items-center justify-center gap-3 active:scale-[0.98]"
                    >
                      Open Content <ExternalLink size={14} />
                    </button>
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

const EditableQuestion: React.FC<{ question: Question, index: number, type: string, onUpdate: (q: Question) => void }> = ({ question, index, type, onUpdate }) => {
  const updateQuestion = (updates: Partial<Question>) => onUpdate({ ...question, ...updates });

  return (
    <div className="space-y-4 group">
      <div className="flex gap-4">
        <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-xs font-black text-slate-400 shrink-0 group-hover:bg-[#4FB5C0] group-hover:text-white transition-colors">
          {index + 1}
        </div>
        <div className="flex-1 space-y-4">
          <div className="flex items-start justify-between gap-4">
            <AutoResizeTextarea 
              className="w-full text-lg font-bold text-slate-800 leading-relaxed bg-transparent border-none placeholder:text-slate-200"
              value={question.text}
              onChange={(e: any) => updateQuestion({ text: e.target.value })}
              placeholder="Question text..."
            />
            <span className="text-[10px] font-black text-slate-300 uppercase shrink-0 mt-1">[{question.marks} Marks]</span>
          </div>

          {question.options && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {question.options.map((opt, oIdx) => (
                <div key={oIdx} className="flex items-center gap-3">
                  <div className="w-6 h-6 rounded-full border border-slate-200 flex items-center justify-center text-[8px] font-black text-slate-300 uppercase shrink-0">
                    {String.fromCharCode(65 + oIdx)}
                  </div>
                  <input 
                    className="flex-1 bg-slate-50 px-3 py-2 rounded-lg text-sm font-medium text-slate-600 border-none outline-none focus:ring-1 ring-[#4FB5C0]/20"
                    value={opt}
                    onChange={e => {
                      const newOptions = [...(question.options || [])];
                      newOptions[oIdx] = e.target.value;
                      updateQuestion({ options: newOptions });
                    }}
                  />
                </div>
              ))}
            </div>
          )}

          {type === 'either-or' && (
            <div className="mt-6 space-y-4 pt-6 border-t border-slate-50">
              <div className="flex items-center gap-3 mb-2">
                <div className="h-px flex-1 bg-slate-100"></div>
                <span className="text-[8px] font-black text-slate-300 uppercase tracking-widest">OR</span>
                <div className="h-px flex-1 bg-slate-100"></div>
              </div>
              <AutoResizeTextarea 
                className="w-full text-lg font-bold text-slate-500 leading-relaxed bg-transparent border-none placeholder:text-slate-200"
                value={question.alternativeText || ''}
                onChange={(e: any) => updateQuestion({ alternativeText: e.target.value })}
                placeholder="Alternative choice question..."
              />
              {question.alternativeOptions && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 opacity-70">
                  {question.alternativeOptions.map((opt, oIdx) => (
                    <div key={oIdx} className="flex items-center gap-3">
                      <div className="w-6 h-6 rounded-full border border-slate-200 flex items-center justify-center text-[8px] font-black text-slate-300 uppercase shrink-0">
                        {String.fromCharCode(65 + oIdx)}
                      </div>
                      <input 
                        className="flex-1 bg-slate-50 px-3 py-2 rounded-lg text-sm font-medium text-slate-600 border-none outline-none"
                        value={opt}
                        onChange={e => {
                          const newAltOptions = [...(question.alternativeOptions || [])];
                          newAltOptions[oIdx] = e.target.value;
                          updateQuestion({ alternativeOptions: newAltOptions });
                        }}
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const EditableSection: React.FC<{ section: Section, onUpdate: (s: Section) => void }> = ({ section, onUpdate }) => {
  const updateSection = (updates: Partial<Section>) => onUpdate({ ...section, ...updates });

  return (
    <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-700">
      <div className="border-b-2 border-slate-100 pb-4 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div className="flex-1 space-y-2">
          <AutoResizeTextarea 
            className="w-full text-2xl font-black text-slate-800 uppercase tracking-tight bg-transparent border-none placeholder:text-slate-200"
            value={section.title}
            onChange={(e: any) => updateSection({ title: e.target.value })}
            placeholder="Section Title"
          />
          <AutoResizeTextarea 
            className="w-full text-sm font-bold text-[#4FB5C0] uppercase tracking-widest bg-transparent border-none placeholder:text-slate-200"
            value={section.instructions}
            onChange={(e: any) => updateSection({ instructions: e.target.value })}
            placeholder="Section Instructions..."
          />
        </div>
        <div className="bg-slate-50 px-4 py-2 rounded-xl border border-slate-100 flex items-center gap-3 shrink-0">
          <div className="text-right">
            <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Section Weight</p>
            <p className="text-xs font-black text-slate-800">{section.totalSectionMarks} Marks</p>
          </div>
          <div className="w-px h-6 bg-slate-200"></div>
          <div className="text-right">
            <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Per Question</p>
            <p className="text-xs font-black text-[#4FB5C0]">{section.marksPerQuestion} M</p>
          </div>
        </div>
      </div>

      <div className="space-y-10 pl-4 md:pl-8 border-l-2 border-slate-50">
        {section.questions.map((q, qIdx) => (
          <EditableQuestion 
            key={q.id} 
            question={q} 
            index={qIdx}
            type={section.type}
            onUpdate={(updatedQuestion) => {
              const newQuestions = [...section.questions];
              newQuestions[qIdx] = updatedQuestion;
              updateSection({ questions: newQuestions });
            }} 
          />
        ))}
      </div>
    </div>
  );
};

const EditablePaper: React.FC<{ paper: QuestionPaper, onUpdate: (p: QuestionPaper) => void }> = ({ paper, onUpdate }) => {
  const updatePaper = (updates: Partial<QuestionPaper>) => onUpdate({ ...paper, ...updates });

  return (
    <div className="bg-white rounded-[2.5rem] shadow-2xl overflow-hidden max-w-5xl mx-auto border border-slate-100 animate-in fade-in zoom-in-95 duration-500">
      <div className="bg-slate-50 p-12 md:p-16 border-b border-slate-100">
        <div className="max-w-3xl mx-auto space-y-6">
          <AutoResizeTextarea 
            className="w-full text-4xl md:text-5xl font-black text-slate-800 tracking-tighter uppercase text-center bg-transparent border-none placeholder:text-slate-200"
            value={paper.title}
            onChange={(e: any) => updatePaper({ title: e.target.value })}
            placeholder="Paper Title"
          />
          <div className="flex flex-wrap items-center justify-center gap-6 no-print">
            <div className="flex items-center gap-2 px-4 py-2 bg-white rounded-xl shadow-sm border border-slate-100">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Marks</span>
              <input 
                type="number" 
                className="w-12 font-black text-[#4FB5C0] bg-transparent border-none outline-none text-center" 
                value={paper.totalMarks} 
                onChange={e => updatePaper({ totalMarks: parseInt(e.target.value) || 0 })} 
              />
            </div>
            <div className="flex items-center gap-2 px-4 py-2 bg-white rounded-xl shadow-sm border border-slate-100">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Duration</span>
              <input 
                className="w-24 font-black text-slate-800 bg-transparent border-none outline-none text-center" 
                value={paper.duration} 
                onChange={e => updatePaper({ totalMarks: paper.totalMarks, duration: e.target.value })} 
              />
            </div>
            <button onClick={() => window.print()} className="p-3 bg-slate-900 text-white rounded-xl hover:scale-105 transition-all shadow-lg active:scale-95">
              <Printer size={18} />
            </button>
          </div>
          <AutoResizeTextarea 
            className="w-full text-center text-slate-400 font-bold italic text-sm leading-relaxed bg-transparent border-none placeholder:text-slate-200"
            value={paper.instructions}
            onChange={(e: any) => updatePaper({ instructions: e.target.value })}
            placeholder="General Instructions..."
          />
        </div>
      </div>

      <div className="p-10 md:p-16 space-y-16">
        {paper.sections.map((section, sIdx) => (
          <EditableSection 
            key={section.id} 
            section={section} 
            onUpdate={(updatedSection) => {
              const newSections = [...paper.sections];
              newSections[sIdx] = updatedSection;
              updatePaper({ sections: newSections });
            }} 
          />
        ))}
      </div>
    </div>
  );
};

const GradeWorkspace: React.FC<{ context: TeacherContext, setContext: any }> = ({ context, setContext }) => {
  const { gradeId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const t = UI_STRINGS[context.language];
  
  const [topic, setTopic] = useState('');
  const [selectedFile, setSelectedFile] = useState<{ name: string, base64: string, mimeType: string } | null>(null);
  const [formatFile, setFormatFile] = useState<{ name: string, base64: string, mimeType: string } | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [activeAction, setActiveAction] = useState<string | null>(null);
  const [showExamChoice, setShowExamChoice] = useState(false);
  const [showExamConfig, setShowExamConfig] = useState(false);
  const [showPlanConfig, setShowPlanConfig] = useState(false);
  const [showSlideConfig, setShowSlideConfig] = useState(false);
  const [showVault, setShowVault] = useState(false);
  const [showNamingModal, setShowNamingModal] = useState(false);
  const [showConfirmDelete, setShowConfirmDelete] = useState<{ type: 'single' | 'all' | 'vault_item', id?: string } | null>(null);
  const [fileError, setFileError] = useState(false);
  const [examSettings, setExamSettings] = useState<QuestionSettings>({ totalMarks: 50, duration: '2 Hours', difficulty: 'Medium', sections: [{ id: '1', marksPerQuestion: 1, count: 10, type: 'compulsory', oneMarkVariety: 'MCQ' }] });
  const [chatInput, setChatInput] = useState('');
  const [currentSessionId, setCurrentSessionId] = useState<string>(Date.now().toString());
  const [sessions, setSessions] = useState<any[]>([]);
  const [chatHistory, setChatHistory] = useState<{ role: 'user' | 'ai', content: string, time: string }[]>([]);
  const [isThinking, setIsThinking] = useState(false);
  const [saveStatus, setSaveStatus] = useState<{ message: string, type: 'success' | 'warning' | 'loading' | 'info' } | null>(null);
  const [currentVaultId, setCurrentVaultId] = useState<string | null>(null);
  
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
    if (!selectedFile && !result && !topic) {
        setFileError(true);
        setTimeout(() => setFileError(false), 3000);
        return;
    }

    if (action === 'paper' && !extra) { setShowExamChoice(true); return; }
    if (action === 'plan' && !extra) { setShowPlanConfig(true); return; }
    if (action === 'explain' && !extra) { setShowSlideConfig(true); return; }
    
    setLoading(true); setActiveAction(action); setResult(null); setCurrentVaultId(null); 
    setShowExamChoice(false); setShowExamConfig(false); setShowPlanConfig(false); setShowSlideConfig(false);
    
    try {
      let data;
      const contextTopic = pendingSessionTopic || topic || "General Syllabus";
      const actualFormatFile = extra?.formatFile || formatFile;
      
      if (action === 'plan') data = await generateSyllabusPlan(extra.duration, extra.unit, context.grade, context.language, selectedFile!);
      else if (action === 'paper') data = await generateQuestionPaper(selectedFile, actualFormatFile, context.grade, context.language, examSettings, contextTopic, extra?.mode === 'auto');
      else if (action === 'explain') data = await generateSlideDeck(contextTopic, selectedFile || null, context.language, extra.slideCount);
      else if (action === 'homework') {
        data = await generateHomework(contextTopic, context.grade, context.language, selectedFile);
      }
      setResult(data);
    } catch (err: any) { console.error(err); alert(`Generation failed: ${err.message}`); }
    finally { 
      setLoading(false); 
      setPendingSessionTopic(null); 
      setFormatFile(null);
    }
  };

  const handleSessionAction = (action: 'explain' | 'paper' | 'homework', sessionTopic: string) => {
    setPendingSessionTopic(sessionTopic);
    if (action === 'paper') {
      setShowExamChoice(true);
    } else if (action === 'explain') {
      setShowSlideConfig(true);
    } else if (action === 'homework') {
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
    setCurrentVaultId(item.id);
    setShowVault(false);
  };

  const handleVaultDelete = async (id: string) => {
    const user = auth.currentUser;
    if (!user) return;
    await deleteDoc(doc(db, "users", user.uid, "vault", id));
    if (currentVaultId === id) setCurrentVaultId(null);
    setShowConfirmDelete(null);
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

  /**
   * REFINED ROBUST SAVE MECHANISM
   * Handles Firestore 1MB limits by automatically falling back to optimized text content if images are too large.
   */
  const saveToVault = async (customTitle: string) => {
    const user = auth.currentUser;
    if (!user || !result) return;
    
    setSaveStatus({ message: "Connecting...", type: 'loading' });

    try {
      const vaultCollectionRef = collection(db, "users", user.uid, "vault");
      
      const q = query(
        vaultCollectionRef,
        where("grade", "==", gradeId),
        where("title", "==", customTitle)
      );
      const querySnapshot = await getDocs(q);
      if (!querySnapshot.empty) {
        const duplicate = querySnapshot.docs.find(doc => doc.id !== currentVaultId);
        if (duplicate) {
           setSaveStatus({ message: "Already in Vault", type: 'warning' });
           setShowNamingModal(false);
           setTimeout(() => setSaveStatus(null), 3000);
           return;
        }
      }

      const buildVaultData = (mode: 'full' | 'text-only') => {
        let contentToSave = { ...result };
        if (mode === 'text-only' && activeAction === 'explain') {
           // Firestore: Explicitly use null for stripped fields; undefined causes "invalid data" error.
           contentToSave = {
             ...result,
             slides: result.slides.map((s: any) => ({ ...s, imageUrl: null }))
           };
        }
        return {
          title: customTitle,
          type: activeAction === 'paper' ? 'question_paper' : activeAction === 'plan' ? 'syllabus_plan' : activeAction === 'explain' ? 'slide_deck' : 'homework',
          content: contentToSave,
          grade: gradeId,
          updatedAt: serverTimestamp(),
          isTextOnly: mode === 'text-only'
        };
      };

      let vaultData = buildVaultData('full');
      let payloadSize = JSON.stringify(vaultData).length;

      // Firestore limit is ~1MB. Safety check at 900KB.
      if (payloadSize > 900000) {
        console.warn("Payload large. Falling back to Text-Only Save.");
        vaultData = buildVaultData('text-only');
        setSaveStatus({ message: "Too large: Text only!", type: 'info' });
      }

      if (currentVaultId) {
        await updateDoc(doc(db, "users", user.uid, "vault", currentVaultId), vaultData);
        setSaveStatus({ message: "Vault Updated!", type: 'success' });
      } else {
        const newRef = doc(vaultCollectionRef);
        await setDoc(newRef, { ...vaultData, createdAt: serverTimestamp() });
        setCurrentVaultId(newRef.id);
        setSaveStatus({ message: "Successfully Saved!", type: 'success' });
      }
    } catch (e: any) {
      console.error("Vault error:", e);
      setSaveStatus({ message: "Save Failed", type: 'warning' });
    } finally {
      setShowNamingModal(false);
      setTimeout(() => setSaveStatus(null), 5000);
    }
  };

  const handleExamChoice = (mode: 'auto' | 'custom', data?: any) => {
    setShowExamChoice(false);
    if (mode === 'auto') {
      handleAction('paper', { confirmed: true, mode: 'auto', formatFile: data });
    } else {
      setShowExamConfig(true);
    }
  };

  const getSuggestedTitle = () => {
    if (result?.title) return result.title;
    const topicPart = topic || pendingSessionTopic || "New Lesson";
    const typePart = activeAction === 'paper' ? 'Exam' : activeAction === 'plan' ? 'Plan' : activeAction === 'explain' ? 'Slides' : 'Assignment';
    return `${topicPart} - ${typePart}`;
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 md:space-y-8 pb-10 md:pb-20 px-4 md:px-0">
      <ConfirmModal 
        isOpen={!!showConfirmDelete} 
        onClose={() => setShowConfirmDelete(null)} 
        onConfirm={() => {
          if (showConfirmDelete?.type === 'single') deleteSession(showConfirmDelete.id!);
          else if (showConfirmDelete?.type === 'all') deleteAllSessions();
          else if (showConfirmDelete?.type === 'vault_item') handleVaultDelete(showConfirmDelete.id!);
        }} 
        title={showConfirmDelete?.type === 'all' ? "Clear All History?" : showConfirmDelete?.type === 'vault_item' ? "Delete from Vault?" : "Delete Chat?"} 
        message="This action is permanent and cannot be undone." 
        actionLabel="Delete" 
      />
      <SaveNamingModal 
        isOpen={showNamingModal} 
        onClose={() => setShowNamingModal(false)} 
        onConfirm={saveToVault} 
        suggestedTitle={getSuggestedTitle()} 
      />
      <ExamChoiceModal isOpen={showExamChoice} onClose={() => { setShowExamChoice(false); setPendingSessionTopic(null); }} onSelect={handleExamChoice} />
      <BlueprintModal 
        isOpen={showExamConfig} 
        onClose={() => { setShowExamConfig(false); setPendingSessionTopic(null); }} 
        gradeId={gradeId} 
        settings={examSettings} 
        setSettings={setExamSettings} 
        onConfirm={() => handleAction('paper', { confirmed: true, mode: 'custom' })} 
      />
      <MasterPlanModal isOpen={showPlanConfig} onClose={() => setShowPlanConfig(false)} onConfirm={(duration: number, unit: any) => handleAction('plan', { duration, unit })} />
      <SlideConfigModal isOpen={showSlideConfig} onClose={() => { setShowSlideConfig(false); setPendingSessionTopic(null); }} onConfirm={(slideCount: number) => handleAction('explain', { slideCount })} />
      <VaultModal 
        isOpen={showVault} 
        onClose={() => setShowVault(false)} 
        gradeId={gradeId!} 
        onLoad={handleLoadFromVault} 
        onDelete={(id) => setShowConfirmDelete({ type: 'vault_item', id })} 
      />
      
      <div className="flex items-center justify-between no-print">
        <div className="flex items-center gap-6">
          <button onClick={() => result ? setResult(null) : navigate('/')} className="w-11 h-11 flex items-center justify-center bg-white border rounded-2xl text-slate-400 hover:text-slate-800 transition-all shadow-sm"><ArrowLeft size={18} /></button>
          <div><h2 className="text-2xl md:text-4xl font-black text-slate-800 tracking-tighter uppercase leading-none">{gradeId} {t.workspace}</h2></div>
        </div>
        <div className="flex items-center gap-4">
          <button onClick={() => setShowVault(true)} className="flex items-center gap-2 px-5 py-3 bg-white border border-slate-100 rounded-xl font-black uppercase text-[10px] tracking-widest shadow-sm hover:bg-slate-50 transition-all text-[#4FB5C0]">
            <Archive size={14} /> My Vault
          </button>
          {result && (
            <div className="flex items-center gap-3">
              {saveStatus && (
                <span className={`text-[10px] font-black uppercase tracking-widest animate-in fade-in flex items-center gap-1 ${saveStatus.type === 'success' ? 'text-emerald-500' : saveStatus.type === 'loading' ? 'text-slate-400' : saveStatus.type === 'info' ? 'text-blue-500' : 'text-amber-500'}`}>
                  {saveStatus.type === 'success' ? <CheckCircle size={10} /> : saveStatus.type === 'loading' ? <Loader2 size={10} className="animate-spin" /> : saveStatus.type === 'info' ? <ImageOff size={10} /> : <AlertTriangle size={10} />}
                  {saveStatus.message}
                </span>
              )}
              <button 
                onClick={() => setShowNamingModal(true)} 
                className="flex items-center gap-2 px-6 py-3 bg-white border border-slate-100 rounded-xl font-black uppercase text-[10px] tracking-widest shadow-sm hover:bg-slate-50 transition-all group"
              >
                {currentVaultId ? <RefreshCw size={14} className="text-[#4FB5C0] group-hover:rotate-180 transition-transform duration-500" /> : <Save size={14} className="text-[#4FB5C0]" />}
                {currentVaultId ? "Update Vault" : "Save to Vault"}
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
                    {selectedFile ? selectedFile.name : fileError ? "File Required!" : t.uploadPrompt}
                </p>
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
          <div className="lg:col-span-4 h-[760px] sticky top-24 z-30">
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

const LoadingState = ({ action }: { action: string | null }) => {
  const [msgIdx, setMsgIdx] = useState(0);
  const messages = [
    "Reading your curriculum context...",
    "Brainstorming relevant lesson ideas...",
    "Drafting educational content structure...",
    "Polishing the presentation layout...",
    "Finalizing high-quality visual aids...",
    "Preparing your master tool!"
  ];

  useEffect(() => {
    const timer = setInterval(() => setMsgIdx((p) => (p + 1) % messages.length), 2000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="h-[60vh] flex flex-col items-center justify-center space-y-12 animate-in fade-in duration-500">
      <div className="relative">
        <div className="w-40 h-40 border-[16px] border-[#F0F9FA] border-t-[#4FB5C0] rounded-full animate-spin"></div>
        <Sparkles className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-[#4FB5C0] animate-bounce" size={56} />
      </div>
      <div className="text-center space-y-4">
        <h3 className="text-4xl font-black text-slate-800 uppercase tracking-tighter">Generating {action === 'explain' ? 'PPT Slides' : action?.replace('_', ' ')}</h3>
        <p className="text-slate-400 font-black uppercase text-xs tracking-[0.4em] animate-pulse h-6">{messages[msgIdx]}</p>
      </div>
      <div className="flex gap-3">
        <div className="w-3 h-3 bg-[#4FB5C0] rounded-full animate-bounce [animation-delay:-0.3s]"></div>
        <div className="w-3 h-3 bg-[#4FB5C0] rounded-full animate-bounce [animation-delay:-0.15s]"></div>
        <div className="w-3 h-3 bg-[#4FB5C0] rounded-full animate-bounce"></div>
      </div>
    </div>
  );
};

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
        <Sparkles size={14} /> Homework Assignment
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
                    <p className="text-xs font-black uppercase tracking-widest">Workspace for drawing</p>
                  </div>
                </div>
                <div className="p-6 bg-[#E6F4F5]/50 border-l-4 border-[#4FB5C0] rounded-r-2xl">
                   <p className="text-sm font-bold text-[#4FB5C0]">Tip: {task.instruction}</p>
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
      <button onClick={() => window.print()} className="px-10 py-5 bg-slate-900 text-white rounded-2xl font-black uppercase text-xs tracking-widest flex items-center gap-3 shadow-xl hover:scale-105 active:scale-95 transition-all"><Printer size={20} /> Print Student Copy</button>
    </div>
  </div>
);

const PlanView = ({ plan, onSessionAction }: any) => (
  <div className="bg-white rounded-[2.5rem] shadow-2xl overflow-hidden max-w-5xl mx-auto animate-in fade-in zoom-in-95 duration-500 flex flex-col border border-slate-100">
    <div className="bg-indigo-600 p-12 md:p-16 text-white relative overflow-hidden">
      <div className="absolute right-0 top-0 p-8 opacity-10 pointer-events-none">
        <Monitor size={240} className="-mr-12 -mt-12" />
      </div>
      <div className="relative z-10 space-y-6">
        <div className="flex justify-between items-start">
          <div className="space-y-4">
            <h3 className="text-4xl md:text-6xl font-black tracking-tighter leading-tight max-w-2xl uppercase">{plan?.title || "Academic Roadmap"}</h3>
            <p className="text-indigo-200 font-black uppercase text-xs tracking-[0.3em]">{plan?.timeframe || "Course Plan"}</p>
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
                    <p className="text-slate-500 font-medium italic text-sm leading-relaxed">Goal: {s.objective}</p>
                  </div>
                  <div className="flex gap-2 no-print">
                    <button onClick={() => onSessionAction('explain', s.topic)} title="Gen Slides" className="p-3 bg-[#E6F4F5] text-[#4FB5C0] rounded-xl hover:bg-[#4FB5C0] hover:text-white transition-all shadow-sm"><Monitor size={18} /></button>
                    <button onClick={() => onSessionAction('homework', s.topic)} title="Gen HW" className="p-3 bg-amber-50 text-amber-500 rounded-xl hover:bg-amber-500 hover:text-white transition-all shadow-sm"><Pencil size={18} /></button>
                    <button onClick={() => onSessionAction('paper', s.topic)} title="Gen Test" className="p-3 bg-indigo-50 text-indigo-500 rounded-xl hover:bg-indigo-500 hover:text-white transition-all shadow-sm"><QuestionIcon size={18} /></button>
                  </div>
                </div>
                <div className="bg-slate-50/50 rounded-[2rem] p-8 border border-slate-100 group-hover:bg-white group-hover:shadow-xl group-hover:border-indigo-50 transition-all">
                  <p className="text-emerald-500 font-black uppercase text-[9px] tracking-[0.3em] mb-3">Interactive Activity</p>
                  <p className="text-slate-700 font-medium leading-relaxed">{s.activity}</p>
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
  if (!deck?.slides || deck.slides.length === 0) return (
    <div className="bg-white rounded-3xl p-12 text-center border-2 border-dashed border-slate-200 max-w-2xl mx-auto flex flex-col items-center justify-center min-h-[400px]">
      <Monitor className="mb-4 text-slate-200" size={80} />
      <p className="text-slate-400 font-black uppercase tracking-widest text-xs">Generation in progress...</p>
    </div>
  );
  
  const currentSlide = deck.slides[current];

  return (
    <div className="max-w-6xl mx-auto space-y-12 animate-in fade-in zoom-in-95 duration-500">
      <div className="bg-white rounded-[3rem] shadow-[0_40px_80px_-20px_rgba(0,0,0,0.15)] overflow-hidden aspect-video relative flex flex-col md:flex-row border border-slate-100">
        <div className="flex-1 p-10 md:p-16 flex flex-col justify-center bg-white relative overflow-y-auto">
          <div className="absolute top-8 left-8 opacity-20 no-print">
            <Presentation size={32} className="text-[#4FB5C0]" />
          </div>
          
          <div className="mb-6">
            <span className="px-3 py-1 bg-[#E6F4F5] text-[#4FB5C0] font-black uppercase text-[9px] tracking-[0.2em] rounded-full">
              SLIDE {current + 1} / {deck.slides.length}
            </span>
          </div>

          <h3 className="text-3xl md:text-5xl font-black text-slate-800 tracking-tighter mb-8 leading-tight">
            {currentSlide?.title}
          </h3>
          
          <ul className="space-y-6">
            {currentSlide?.content?.map((c: any, i: number) => (
              <li key={i} className="flex gap-5 items-start text-lg md:text-xl font-semibold text-slate-600 leading-relaxed group/item">
                <div className="w-2 h-2 rounded-full bg-[#4FB5C0] mt-3 shrink-0" />
                <span className="flex-1">{c}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="w-full md:w-1/3 bg-slate-50 border-l border-slate-100 flex flex-col items-center justify-center p-8 md:p-12 relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-br from-[#4FB5C0]/5 to-indigo-500/5 opacity-50" />
          
          {currentSlide?.imageUrl ? (
            <div className="relative z-10 w-full h-full flex flex-col items-center justify-center gap-6">
              <div className="w-full aspect-square rounded-[2rem] overflow-hidden shadow-2xl border-4 border-white ring-1 ring-slate-100">
                <img src={currentSlide.imageUrl} alt={currentSlide.title} className="w-full h-full object-cover transform hover:scale-105 transition-transform duration-700" />
              </div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest bg-white/80 backdrop-blur-sm px-4 py-2 rounded-full">Visual Aid</p>
            </div>
          ) : (
            <div className="relative z-10 text-center space-y-6">
              <div className="w-20 h-20 bg-white rounded-3xl shadow-xl flex items-center justify-center mx-auto text-[#4FB5C0]">
                <ImageIcon size={40} />
              </div>
              <div>
                <p className="text-[10px] font-black text-[#4FB5C0] uppercase tracking-widest mb-3">AI Image Prompt</p>
                <p className="text-sm font-bold text-slate-400 leading-relaxed italic">
                  "{currentSlide?.visualPrompt}"
                </p>
              </div>
            </div>
          )}
        </div>

        <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 px-6 flex justify-between items-center z-10 pointer-events-none no-print">
           <button 
             disabled={current === 0} 
             onClick={() => setCurrent(p => p - 1)} 
             className="p-5 bg-white/90 backdrop-blur-md rounded-2xl shadow-xl disabled:opacity-0 hover:scale-110 active:scale-95 transition-all text-slate-700 hover:text-[#4FB5C0] pointer-events-auto border border-slate-100"
           >
             <ChevronLeft size={32} strokeWidth={3} />
           </button>
           <button 
             disabled={current === deck.slides.length - 1} 
             onClick={() => setCurrent(p => p + 1)} 
             className="p-5 bg-white/90 backdrop-blur-md rounded-2xl shadow-xl disabled:opacity-0 hover:scale-110 active:scale-95 transition-all text-slate-700 hover:text-[#4FB5C0] pointer-events-auto border border-slate-100"
           >
             <ChevronRight size={32} strokeWidth={3} />
           </button>
        </div>

        <div className="absolute inset-x-0 bottom-6 flex justify-center gap-2 no-print">
           {deck.slides.map((_: any, idx: number) => (
             <div 
               key={idx} 
               className={`w-2 h-2 rounded-full transition-all duration-300 ${idx === current ? 'w-8 bg-[#4FB5C0]' : 'bg-slate-200'}`}
             />
           ))}
        </div>
      </div>

      <div className="flex items-center justify-between no-print bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-indigo-50 text-indigo-500 rounded-2xl flex items-center justify-center">
            <Monitor size={24} />
          </div>
          <div>
            <h4 className="font-black text-slate-800 uppercase tracking-tight">{deck.title}</h4>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{deck.template} template active</p>
          </div>
        </div>
        <button 
          onClick={() => window.print()}
          className="flex items-center gap-2 px-8 py-4 bg-slate-900 text-white rounded-xl font-black uppercase text-[10px] tracking-widest shadow-xl hover:scale-105 transition-all"
        >
          <Printer size={16} /> Print Handout
        </button>
      </div>
    </div>
  );
};

const ChatSidebar = ({ history, isThinking, onSend, input, setInput, t, sessions, onSessionSelect, currentSessionId, onNewChat, onDeleteSession, onDeleteAll }: any) => {
  const [showHistory, setShowHistory] = useState(false);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
        scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [history, isThinking]);

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isFullScreen) setIsFullScreen(false);
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [isFullScreen]);

  const formatText = (text: string) => {
    let formatted = text.replace(/### (.*?)\n/g, '<h4 className="font-black text-sm uppercase mt-4 mb-2 text-slate-800">$1</h4>').replace(/\*\*(.*?)\*\*/g, '<strong className="font-black text-slate-900">$1</strong>').replace(/\* (.*?)\n/g, '<div className="flex gap-2 items-start ml-2 mb-1"><div className="w-1.5 h-1.5 rounded-full bg-[#4FB5C0] mt-1.5 shrink-0"></div><p>$1</p></div>').replace(/\n/g, '<br />');
    formatted = formatted.replace(/\$/g, '');
    return <div dangerouslySetInnerHTML={{ __html: formatted }} className="text-xs font-medium leading-relaxed" />;
  };

  const containerClasses = isFullScreen 
    ? "fixed inset-4 md:inset-10 md:max-w-4xl md:mx-auto z-[500] bg-white rounded-[3rem] shadow-[0_0_100px_rgba(0,0,0,0.4)] flex flex-col overflow-hidden animate-in zoom-in-95 duration-300" 
    : "bg-white rounded-[2rem] border shadow-xl flex flex-col h-full overflow-hidden";

  return (
    <>
      {isFullScreen && (
        <div 
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-xl z-[490] animate-in fade-in duration-300" 
          onClick={() => setIsFullScreen(false)} 
        />
      )}
      <div className={containerClasses}>
        <div className="p-6 border-b flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-3">
            <Sparkles size={16} className="text-[#4FB5C0]" />
            <h4 className="font-black text-[9px] uppercase tracking-[0.2em]">{t.educatorGpt}</h4>
          </div>
          <div className="flex gap-2">
            <button 
              onClick={() => setIsFullScreen(!isFullScreen)} 
              className={`p-2 transition-all rounded-lg ${isFullScreen ? 'text-indigo-600 bg-indigo-50' : 'text-slate-400 hover:text-indigo-500 hover:bg-white'}`}
              title={isFullScreen ? "Exit Fullscreen" : "Maximize"}
            >
              {isFullScreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
            </button>
            <button onClick={() => setShowHistory(!showHistory)} className="p-2 text-slate-400 hover:text-slate-800 transition-all" title="Sessions"><Clock size={16} /></button>
            <button onClick={onNewChat} className="p-2 text-[#4FB5C0] hover:bg-[#E6F4F5] rounded-lg transition-all" title="New"><PlusCircle size={16} /></button>
          </div>
        </div>
        
        {showHistory ? (
          <div className="flex-1 overflow-y-auto p-4 space-y-2 bg-slate-50/30 scroll-smooth">
            <div className="flex justify-between items-center px-2 mb-4">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">History</span>
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
            {sessions.length === 0 && <p className="text-center py-10 text-[10px] font-black text-slate-300 uppercase tracking-widest">No history</p>}
          </div>
        ) : (
          <div ref={scrollRef} className={`flex-1 overflow-y-auto p-6 space-y-4 bg-white scroll-smooth ${isFullScreen ? 'md:px-12 py-10' : ''}`}>
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
                  <Loader2 size={12} className="animate-spin" /> Thinking...
                </div>
            )}
          </div>
        )}

        <div className={`p-4 bg-white border-t flex gap-2 ${isFullScreen ? 'md:px-12 py-8' : ''}`}>
           <input placeholder={t.askGpt} className="flex-1 px-5 py-3.5 bg-slate-50 border rounded-xl text-xs font-black outline-none transition-all focus:ring-2 ring-[#4FB5C0]/10" value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && onSend()} />
           <button onClick={onSend} className="w-12 bg-[#4FB5C0] text-white rounded-xl flex items-center justify-center shadow-lg hover:scale-105 active:scale-95 transition-all"><Send size={16} /></button>
        </div>
      </div>
    </>
  );
};

export default GradeWorkspace;
