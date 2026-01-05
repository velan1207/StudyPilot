
import React, { useState, useRef, useEffect, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { 
  ArrowLeft, 
  Sparkles, 
  Upload, 
  X, 
  FileText as FileIcon,
  HelpCircle as QuestionIcon,
  Zap,
  BookOpen,
  Printer,
  Send,
  Camera,
  ChevronRight,
  Monitor,
  Calendar,
  Layers,
  CheckCircle2,
  Settings,
  Plus,
  Info,
  Save,
  Trash2,
  AlertCircle,
  Layout
} from 'lucide-react';
import { 
  TeacherContext, 
  QuestionSettings, 
  SyllabusPlan,
  Language,
  QuestionPaper,
  Section,
  Question,
  SectionBlueprint,
  QuestionType,
  SlideDeck
} from '../types';
import { 
  generateQuestionPaper, 
  generateSlideDeck, 
  askChatQuestion,
  generateSyllabusPlan
} from '../services/geminiService';
import { UI_STRINGS } from '../translations';

const AutoResizeTextarea = ({ className, value, onChange, placeholder, rows = 1 }: { 
  className?: string, 
  value: string, 
  onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void, 
  placeholder?: string,
  rows?: number
}) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.max(textareaRef.current.scrollHeight, 24)}px`;
    }
  }, [value]);
  return (
    <textarea
      ref={textareaRef}
      className={`${className} resize-none overflow-hidden min-h-[1.5em]`}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      rows={rows}
    />
  );
};

const SlideConfigModal = ({ isOpen, onClose, onGenerate }: { isOpen: boolean, onClose: () => void, onGenerate: (count: number) => void }) => {
  const [count, setCount] = useState(5);
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-[150] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-6">
      <div className="bg-white rounded-[2.5rem] w-full max-w-md overflow-hidden flex flex-col shadow-2xl animate-in zoom-in-95 duration-300">
        <div className="p-8 border-b bg-slate-50 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-amber-100 text-amber-500 rounded-2xl flex items-center justify-center shadow-sm">
              <Layout size={24} />
            </div>
            <div>
              <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight">Slide Deck Config</h3>
              <p className="text-xs font-bold text-slate-400">Specify presentation length</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 transition-colors"><X size={24} /></button>
        </div>
        <div className="p-10 space-y-8 text-center">
          <div className="flex items-center justify-center gap-8">
            <button onClick={() => setCount(p => Math.max(3, p - 1))} className="w-14 h-14 rounded-2xl bg-slate-50 flex items-center justify-center font-black hover:bg-slate-100 transition-colors">-</button>
            <span className="text-6xl font-black text-slate-900 tabular-nums">{count}</span>
            <button onClick={() => setCount(p => Math.min(12, p + 1))} className="w-14 h-14 rounded-2xl bg-slate-50 flex items-center justify-center font-black hover:bg-slate-100 transition-colors">+</button>
          </div>
          <p className="text-xs font-black text-slate-400 uppercase tracking-[0.2em]">Total Slides to Generate</p>
        </div>
        <div className="p-8 border-t bg-slate-50 flex gap-4">
          <button onClick={onClose} className="flex-1 py-4 font-black text-slate-400 uppercase text-[10px] tracking-[0.2em]">Cancel</button>
          <button onClick={() => onGenerate(count)} className="flex-1 py-4 bg-amber-500 text-white rounded-2xl font-black shadow-xl shadow-amber-500/20 hover:scale-105 transition-all active:scale-95 uppercase text-[10px] tracking-[0.2em]">Create Deck</button>
        </div>
      </div>
    </div>
  );
};

const SlideDeckViewer = ({ deck }: { deck: SlideDeck }) => {
  return (
    <div className="max-w-5xl mx-auto space-y-12 pb-20 animate-in fade-in slide-in-from-bottom-8 duration-700">
      <div className="text-center space-y-4">
        <h2 className="text-5xl font-black text-slate-800 tracking-tighter uppercase">{deck.title}</h2>
        <p className="text-amber-500 font-black uppercase text-xs tracking-[0.3em]">AI Generated Presentation • {deck.slides.length} Slides</p>
      </div>
      
      <div className="grid grid-cols-1 gap-16">
        {deck.slides.map((slide, idx) => (
          <div key={idx} className="bg-white rounded-[3rem] border border-slate-100 shadow-2xl overflow-hidden flex flex-col md:flex-row min-h-[500px] group hover:scale-[1.01] transition-transform duration-500">
            <div className="md:w-1/2 bg-slate-50 flex items-center justify-center p-8 relative overflow-hidden">
               {slide.imageUrl ? (
                 <img src={slide.imageUrl} alt={slide.title} className="w-full h-full object-cover rounded-[2rem] shadow-2xl relative z-10" />
               ) : (
                 <div className="w-full h-full bg-slate-200 rounded-[2rem] animate-pulse flex items-center justify-center text-slate-400"><Monitor size={48} /></div>
               )}
               <div className="absolute top-6 left-6 w-12 h-12 bg-white rounded-2xl flex items-center justify-center font-black text-slate-300 z-20 shadow-sm">{idx + 1}</div>
            </div>
            <div className="md:w-1/2 p-12 md:p-16 flex flex-col justify-center space-y-8 bg-white">
              <h3 className="text-3xl font-black text-slate-800 tracking-tight leading-none">{slide.title}</h3>
              <div className="space-y-4">
                {slide.content.map((point, pIdx) => (
                  <div key={pIdx} className="flex gap-4 items-start">
                    <div className="w-2 h-2 rounded-full bg-amber-400 mt-2.5 shrink-0 shadow-[0_0_10px_rgba(251,191,36,0.4)]" />
                    <p className="text-lg font-medium text-slate-600 leading-relaxed">{point}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
      
      <div className="flex justify-center no-print">
        <button onClick={() => window.print()} className="px-12 py-5 bg-slate-900 text-white rounded-[2rem] font-black uppercase tracking-[0.2em] shadow-2xl hover:bg-slate-800 transition-all flex items-center gap-4">
          <Printer size={20} /> Print Handouts
        </button>
      </div>
    </div>
  );
};

const BlueprintModal = ({ isOpen, onClose, onGenerate, currentSettings, grade }: { 
  isOpen: boolean, 
  onClose: () => void, 
  onGenerate: (s: QuestionSettings) => void,
  currentSettings: QuestionSettings,
  grade: string
}) => {
  const [settings, setSettings] = useState<QuestionSettings>(currentSettings);

  const calculateTotal = useMemo(() => {
    let total = 0;
    settings.sections.forEach(section => {
      const marks = section.marksPerQuestion;
      if (section.type === 'either-or') {
        // In Either/Or, count/2 pairs are formed. Each pair is worth 1 question mark.
        total += (section.count / 2) * marks;
      } else if (section.type === 'choice' && section.choiceCount) {
        total += section.choiceCount * marks;
      } else {
        total += section.count * marks;
      }
    });
    return total;
  }, [settings]);

  const isValid = calculateTotal === settings.totalMarks;

  if (!isOpen) return null;

  const addSection = () => {
    const newSection: SectionBlueprint = {
      id: `section_${Date.now()}`,
      marksPerQuestion: 5,
      count: 2,
      type: 'either-or'
    };
    setSettings({ ...settings, sections: [...settings.sections, newSection] });
  };

  const removeSection = (id: string) => {
    setSettings({ ...settings, sections: settings.sections.filter(s => s.id !== id) });
  };

  const updateSection = (id: string, field: keyof SectionBlueprint, value: any) => {
    setSettings({
      ...settings,
      sections: settings.sections.map(s => s.id === id ? { ...s, [field]: value } : s)
    });
  };

  return (
    <div className="fixed inset-0 z-[150] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-6">
      <div className="bg-white rounded-[2.5rem] w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl animate-in zoom-in-95 duration-300">
        <div className="p-8 border-b bg-slate-50 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-[#4FB5C0] text-white rounded-2xl flex items-center justify-center shadow-lg"><Settings size={24} /></div>
            <div>
              <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight">Question Paper Blueprint</h3>
              <p className="text-xs font-bold text-slate-400">Configure layout for {grade}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 transition-colors"><X size={24} /></button>
        </div>

        <div className="flex-1 overflow-y-auto p-10 space-y-10">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2">Total Exam Marks</label>
              <input 
                type="number" 
                className="w-full bg-slate-50 border-none rounded-2xl px-6 py-4 font-black text-2xl text-slate-800 outline-none"
                value={settings.totalMarks}
                onChange={(e) => setSettings({...settings, totalMarks: parseInt(e.target.value) || 0})}
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2">Duration</label>
              <input 
                className="w-full bg-slate-50 border-none rounded-2xl px-6 py-4 font-black text-slate-800 outline-none"
                value={settings.duration}
                onChange={(e) => setSettings({...settings, duration: e.target.value})}
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2">Difficulty</label>
              <select 
                className="w-full bg-slate-50 border-none rounded-2xl px-6 py-4 font-black text-slate-800 outline-none appearance-none"
                value={settings.difficulty}
                onChange={(e) => setSettings({...settings, difficulty: e.target.value as any})}
              >
                <option>Easy</option><option>Medium</option><option>Hard</option>
              </select>
            </div>
          </div>

          <div className="space-y-6">
            <div className="flex items-center justify-between border-l-4 border-[#4FB5C0] pl-4">
              <h4 className="text-sm font-black text-slate-800 uppercase tracking-widest">Sectional Structure</h4>
              {!isValid && (
                <div className="flex items-center gap-2 text-rose-500 text-[10px] font-black animate-pulse">
                  <AlertCircle size={14} /> SUM MUST EQUAL {settings.totalMarks} (CURRENT: {calculateTotal})
                </div>
              )}
            </div>
            
            <div className="space-y-4">
              {settings.sections.map((section) => (
                <div key={section.id} className="bg-slate-50 rounded-[2rem] p-8 flex flex-col md:flex-row items-center gap-8 relative group border border-transparent hover:border-slate-200 transition-all">
                  <div className="md:w-32 shrink-0">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">Marks Per Q</label>
                    <input 
                      type="number"
                      className="w-full bg-white rounded-xl px-4 py-3 font-black text-xl outline-none shadow-sm text-[#4FB5C0]" 
                      value={section.marksPerQuestion} 
                      onChange={(e) => updateSection(section.id, 'marksPerQuestion', parseInt(e.target.value) || 0)}
                    />
                  </div>
                  <div className="flex-1 grid grid-cols-1 sm:grid-cols-3 gap-6">
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">
                        {section.type === 'either-or' ? 'Q Pairs (x2 questions)' : 'Total Q Count'}
                      </label>
                      <input 
                        type="number" 
                        className="w-full bg-white rounded-xl px-4 py-3 font-bold" 
                        value={section.type === 'either-or' ? section.count / 2 : section.count} 
                        onChange={(e) => {
                          const val = parseInt(e.target.value) || 0;
                          updateSection(section.id, 'count', section.type === 'either-or' ? val * 2 : val);
                        }} 
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">Section Type</label>
                      <select className="w-full bg-white rounded-xl px-4 py-3 font-bold appearance-none" value={section.type} onChange={(e) => updateSection(section.id, 'type', e.target.value as QuestionType)}>
                        <option value="compulsory">Compulsory</option>
                        <option value="choice">Internal Choice (Any X of Y)</option>
                        <option value="either-or">Either/Or (1A or 1B)</option>
                      </select>
                    </div>
                    {section.type === 'choice' && (
                      <div className="space-y-1">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">Choice Limit (X)</label>
                        <input type="number" className="w-full bg-[#E6F4F5] rounded-xl px-4 py-3 font-bold" value={section.choiceCount || 0} onChange={(e) => updateSection(section.id, 'choiceCount', parseInt(e.target.value) || 0)} />
                      </div>
                    )}
                  </div>
                  <button onClick={() => removeSection(section.id)} className="absolute -top-3 -right-3 w-10 h-10 bg-white text-red-500 rounded-full flex items-center justify-center shadow-lg hover:scale-110 transition-transform"><Trash2 size={18} /></button>
                </div>
              ))}
            </div>
            
            <button onClick={addSection} className="flex items-center gap-3 px-8 py-4 bg-[#E6F4F5] text-[#4FB5C0] rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-[#4FB5C0] hover:text-white transition-all shadow-sm active:scale-95"><Plus size={20} /> Add New Section</button>
          </div>
        </div>

        <div className="p-8 border-t bg-slate-50 flex items-center justify-between">
          <div className="flex flex-col">
            <div className={`text-2xl font-black ${isValid ? 'text-[#4FB5C0]' : 'text-rose-500'}`}>
              {calculateTotal} / {settings.totalMarks} MARKS
            </div>
            <p className="text-[10px] font-black text-slate-400 uppercase">Expected Score Weight</p>
          </div>
          <div className="flex gap-4">
             <button onClick={onClose} className="px-8 py-4 font-bold text-slate-500 uppercase text-xs tracking-widest">Cancel</button>
             <button 
              disabled={!isValid}
              onClick={() => onGenerate(settings)} 
              className={`px-12 py-4 rounded-2xl font-black shadow-xl transition-all uppercase text-xs tracking-widest ${isValid ? 'bg-[#4FB5C0] text-white hover:scale-105 active:scale-95' : 'bg-slate-200 text-slate-400 cursor-not-allowed'}`}
             >
              Generate Draft
             </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const EditablePaper = ({ paper, onUpdate }: { paper: QuestionPaper, onUpdate: (p: QuestionPaper) => void }) => {
  const handleUpdateSection = (idx: number, field: keyof Section, value: any) => {
    const updated = { ...paper };
    (updated.sections[idx] as any)[field] = value;
    onUpdate(updated);
  };

  const handleUpdateQuestion = (sIdx: number, qIdx: number, field: keyof Question, value: any) => {
    const updated = { ...paper };
    (updated.sections[sIdx].questions[qIdx] as any)[field] = value;
    onUpdate(updated);
  };

  return (
    <div className="bg-white min-h-[11in] w-full max-w-5xl mx-auto shadow-2xl p-16 flex flex-col gap-10 print:p-0 print:shadow-none overflow-visible">
      <div className="border-b-4 border-slate-900 pb-8 text-center space-y-4">
        <AutoResizeTextarea 
          className="text-4xl font-black w-full text-center bg-transparent border-none outline-none uppercase tracking-tight break-words p-0 leading-tight"
          value={paper.title}
          onChange={(e) => onUpdate({ ...paper, title: e.target.value })}
        />
        <div className="flex justify-between items-center px-4 text-sm font-bold text-slate-600 uppercase tracking-widest">
           <div>DURATION: {paper.duration}</div>
           <div>TOTAL MARKS: {paper.totalMarks}</div>
        </div>
      </div>

      <div className="space-y-12">
        {paper.sections.map((section, sIdx) => (
          <div key={section.id} className="space-y-8">
            <div className="flex items-start justify-between border-b-2 border-slate-200 pb-3">
              <div className="flex-1 pr-10">
                <AutoResizeTextarea 
                  className="text-xl font-black text-slate-800 uppercase tracking-wide bg-transparent outline-none w-full"
                  value={section.title}
                  onChange={(e) => handleUpdateSection(sIdx, 'title', e.target.value)}
                />
                <AutoResizeTextarea 
                  className="block text-xs font-bold text-slate-400 italic bg-transparent outline-none w-full"
                  value={section.instructions}
                  onChange={(e) => handleUpdateSection(sIdx, 'instructions', e.target.value)}
                />
              </div>
              <div className="text-right shrink-0">
                <p className="text-xl font-black text-slate-900">{section.totalSectionMarks} MARKS</p>
              </div>
            </div>

            <div className="space-y-6">
              {section.questions.map((q, qIdx) => {
                const isEitherOr = section.type === 'either-or';
                const pairIndex = Math.floor(qIdx / 2) + 1;
                const pairLetter = qIdx % 2 === 0 ? 'A' : 'B';
                const showDivider = isEitherOr && qIdx % 2 === 1;
                const showOrText = isEitherOr && qIdx % 2 === 0 && qIdx < section.questions.length - 1;

                return (
                  <React.Fragment key={q.id}>
                    <div className={`relative pl-12 group ${isEitherOr && qIdx % 2 === 1 ? 'mt-2' : 'mt-6'}`}>
                      <div className="absolute left-0 top-1 text-slate-200 font-black text-2xl italic leading-none">
                        {isEitherOr ? `${pairIndex}${pairLetter}` : qIdx + 1}
                      </div>
                      <div className="flex gap-6 items-start">
                        <div className="flex-1 space-y-4">
                          <AutoResizeTextarea 
                            className="w-full text-lg font-bold text-slate-800 leading-snug bg-transparent border-none focus:ring-0 outline-none p-0"
                            value={q.text}
                            onChange={(e) => handleUpdateQuestion(sIdx, qIdx, 'text', e.target.value)}
                          />
                          {q.options && q.options.length > 0 && (
                            <div className="grid grid-cols-2 gap-4 pt-2">
                              {q.options.map((opt, oIdx) => (
                                <div key={oIdx} className="flex items-center gap-3 p-3 bg-slate-50 border border-slate-100 rounded-xl">
                                  <span className="text-xs font-black text-slate-300">{String.fromCharCode(65 + oIdx)}</span>
                                  <input className="flex-1 bg-transparent border-none outline-none text-sm font-bold text-slate-600" value={opt} />
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                        {(!isEitherOr || qIdx % 2 === 0) && (
                           <div className="text-[10px] font-black uppercase text-slate-400 mt-2 shrink-0">{q.marks}M</div>
                        )}
                      </div>
                    </div>
                    {showOrText && (
                      <div className="flex items-center gap-4 ml-12 my-2">
                        <div className="h-px bg-slate-100 flex-1"></div>
                        <span className="text-[10px] font-black text-slate-300 uppercase tracking-[0.4em]">OR</span>
                        <div className="h-px bg-slate-100 flex-1"></div>
                      </div>
                    )}
                    {showDivider && qIdx < section.questions.length - 1 && (
                      <div className="h-4"></div>
                    )}
                  </React.Fragment>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-12 pt-8 border-t-2 border-slate-100 flex justify-between items-center no-print">
        <button onClick={() => window.print()} className="px-10 py-3 bg-[#4FB5C0] text-white rounded-2xl font-bold shadow-xl shadow-[#4FB5C0]/20 hover:scale-105 active:scale-95 transition-all">
          <Printer size={18} className="inline mr-2" /> Print Final Paper
        </button>
      </div>
    </div>
  );
};

const CameraOverlay = ({ onCapture, onClose }: { onCapture: (base64: string) => void, onClose: () => void }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);

  useEffect(() => {
    async function startCamera() {
      try {
        const s = await navigator.mediaDevices.getUserMedia({ 
          video: { facingMode: 'environment', width: { ideal: 1920 }, height: { ideal: 1080 } } 
        });
        setStream(s);
        if (videoRef.current) videoRef.current.srcObject = s;
      } catch (err) {
        alert("Could not access camera.");
        onClose();
      }
    }
    startCamera();
    return () => stream?.getTracks().forEach(t => t.stop());
  }, []);

  const capture = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      ctx?.drawImage(video, 0, 0);
      const data = canvas.toDataURL('image/jpeg', 0.8).split(',')[1];
      onCapture(data);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-[100] bg-black flex flex-col items-center justify-center">
      <video ref={videoRef} autoPlay playsInline className="w-full h-full object-contain" />
      <canvas ref={canvasRef} className="hidden" />
      <div className="absolute bottom-10 flex items-center gap-8">
        <button onClick={onClose} className="p-4 bg-white/20 text-white rounded-full hover:bg-white/30 transition-colors">
          <X size={24} />
        </button>
        <button onClick={capture} className="w-20 h-20 bg-white border-8 border-white/30 rounded-full hover:scale-105 active:scale-95 transition-all" />
      </div>
    </div>
  );
};

const SyllabusModal = ({ isOpen, onClose, onGenerate, language }: { isOpen: boolean, onClose: () => void, onGenerate: (amount: number, type: 'Days' | 'Weeks' | 'Months') => void, language: Language }) => {
  const [amount, setAmount] = useState(4);
  const [type, setType] = useState<'Days' | 'Weeks' | 'Months'>('Weeks');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[150] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-6">
      <div className="bg-white rounded-[2.5rem] w-full max-w-md overflow-hidden flex flex-col shadow-2xl animate-in zoom-in-95 duration-300">
        <div className="p-8 border-b bg-slate-50 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-indigo-100 text-indigo-500 rounded-2xl flex items-center justify-center shadow-sm">
              <Calendar size={24} />
            </div>
            <div>
              <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight">Timeline Config</h3>
              <p className="text-xs font-bold text-slate-400">Duration for Syllabus Coverage</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 transition-colors"><X size={24} /></button>
        </div>

        <div className="p-10 space-y-8">
          <div className="flex flex-col gap-4">
            <div className="grid grid-cols-3 gap-2 p-1.5 bg-slate-100 rounded-2xl">
              {(['Days', 'Weeks', 'Months'] as const).map(t => (
                <button 
                  key={t}
                  onClick={() => setType(t)}
                  className={`py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${type === t ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-center gap-8">
              <button onClick={() => setAmount(p => Math.max(1, p - 1))} className="w-14 h-14 rounded-2xl bg-slate-50 flex items-center justify-center font-black hover:bg-slate-100 transition-colors">-</button>
              <span className="text-6xl font-black text-slate-900 tabular-nums">{amount}</span>
              <button onClick={() => setAmount(p => Math.min(30, p + 1))} className="w-14 h-14 rounded-2xl bg-slate-50 flex items-center justify-center font-black hover:bg-slate-100 transition-colors">+</button>
            </div>
          </div>
        </div>

        <div className="p-8 border-t bg-slate-50 flex gap-4">
          <button onClick={onClose} className="flex-1 py-4 font-black text-slate-400 uppercase text-[10px] tracking-[0.2em]">Cancel</button>
          <button 
            onClick={() => onGenerate(amount, type)}
            className="flex-1 py-4 bg-indigo-500 text-white rounded-2xl font-black shadow-xl shadow-indigo-500/20 hover:scale-105 transition-all active:scale-95 uppercase text-[10px] tracking-[0.2em]"
          >
            Create Plan
          </button>
        </div>
      </div>
    </div>
  );
};

const SyllabusViewer = ({ plan, grade }: { plan: SyllabusPlan, grade: string }) => {
  return (
    <div className="max-w-4xl mx-auto space-y-12 animate-in fade-in duration-700">
      <div className="bg-white rounded-[3rem] border border-slate-200 shadow-2xl overflow-hidden">
        <div className="bg-gradient-to-br from-indigo-500 to-indigo-700 p-16 text-white relative">
          <div className="absolute top-0 right-0 p-16 opacity-10 pointer-events-none"><Monitor size={200} /></div>
          <div className="flex justify-between items-start relative z-10">
            <div className="space-y-4">
              <span className="px-5 py-2 bg-white/10 backdrop-blur-md rounded-full text-[10px] font-black uppercase tracking-[0.3em]">Master Coverage Timeline</span>
              <h2 className="text-5xl font-black tracking-tighter leading-none">{plan.title}</h2>
              <p className="text-indigo-100 font-bold uppercase text-xs tracking-widest">{grade} • {plan.timeframe}</p>
            </div>
            <button onClick={() => window.print()} className="p-5 bg-white/10 hover:bg-white/20 rounded-2xl transition-all no-print shadow-xl"><Printer size={28} /></button>
          </div>
        </div>

        <div className="p-16 space-y-16 bg-slate-50/40">
          <div className="space-y-12">
            {plan.sessions.map((session, i) => (
              <div key={i} className="flex gap-10 group">
                <div className="flex flex-col items-center">
                  <div className="w-16 h-16 bg-white border-2 border-indigo-100 rounded-2xl flex items-center justify-center font-black text-2xl text-indigo-500 shadow-sm group-hover:scale-110 group-hover:bg-indigo-500 group-hover:text-white transition-all duration-500">
                    {i + 1}
                  </div>
                  {i < plan.sessions.length - 1 && <div className="w-1 flex-1 bg-gradient-to-b from-indigo-100 to-transparent my-4 rounded-full" />}
                </div>
                <div className="flex-1 pb-16 border-b border-slate-100 last:border-0 last:pb-0">
                  <div className="flex items-center gap-4 mb-4">
                    <span className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.3em]">{session.period}</span>
                    <div className="h-px bg-indigo-50 flex-1" />
                  </div>
                  <h4 className="text-2xl font-black text-slate-800 mb-3 tracking-tight">{session.topic}</h4>
                  <p className="text-slate-500 font-medium mb-8 italic text-lg leading-relaxed">Objective: {session.objective}</p>
                  <div className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm group-hover:shadow-xl transition-all duration-500">
                    <p className="text-[10px] font-black text-emerald-500 uppercase tracking-widest mb-3">Recommended Activity</p>
                    <p className="text-slate-700 font-medium text-lg leading-relaxed">{session.activity}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="p-12 bg-emerald-50 rounded-[3rem] border border-emerald-100 relative overflow-hidden group">
             <div className="absolute -right-10 -bottom-10 opacity-5 pointer-events-none group-hover:scale-125 transition-transform duration-1000"><Layers size={240} /></div>
             <div className="relative z-10 space-y-6">
               <div className="flex items-center gap-4 text-emerald-600">
                  <div className="p-3 bg-white rounded-2xl shadow-sm"><CheckCircle2 size={32} /></div>
                  <h4 className="font-black text-2xl uppercase tracking-tighter">Evaluation Strategy</h4>
               </div>
               <p className="text-emerald-900/70 font-medium text-xl italic leading-relaxed">{plan.finalAssessment}</p>
             </div>
          </div>
        </div>
      </div>
      <div className="text-center no-print pb-12">
        <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.5em]">StudyPilot Professional Suite •course Navigator</p>
      </div>
    </div>
  );
};

const FormattedChatMessage = ({ text }: { text: string }) => {
  const lines = text.split('\n');
  return (
    <div className="space-y-3">
      {lines.map((line, i) => {
        let formatted = line.replace(/\*\*(.*?)\*\*/g, '<strong class="font-black">$1</strong>').replace(/\*(.*?)\*/g, '<em class="italic text-[#4FB5C0]">$1</em>');
        if (line.trim().startsWith('* ')) {
          return (
            <div key={i} className="flex gap-3 items-start ml-2 bg-slate-50 p-3 rounded-2xl border border-slate-100">
              <div className="w-2 h-2 rounded-full bg-[#4FB5C0] mt-2 shrink-0 shadow-[0_0_10px_rgba(79,181,192,0.5)]" />
              <span className="text-sm font-medium" dangerouslySetInnerHTML={{ __html: formatted.replace('* ', '') }} />
            </div>
          );
        }
        return <p key={i} className="leading-relaxed text-sm font-medium text-slate-700" dangerouslySetInnerHTML={{ __html: formatted }} />;
      })}
    </div>
  );
};

const GradeWorkspace: React.FC<{ context: TeacherContext, setContext: any }> = ({ context, setContext }) => {
  const { gradeId } = useParams();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const t = UI_STRINGS[context.language];
  
  const [topic, setTopic] = useState('');
  const [selectedFile, setSelectedFile] = useState<{ name: string, base64: string, mimeType: string } | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [activeAction, setActiveAction] = useState<string | null>(null);
  const [showCamera, setShowCamera] = useState(false);
  const [showSyllabusModal, setShowSyllabusModal] = useState(false);
  const [showBlueprint, setShowBlueprint] = useState(false);
  const [showSlideConfig, setShowSlideConfig] = useState(false);
  const [chatInput, setChatInput] = useState('');
  const [chatHistory, setChatHistory] = useState<{ role: 'user' | 'ai', content: string, time: string }[]>([]);

  const [examConfig, setExamConfig] = useState<QuestionSettings>({
    totalMarks: 50,
    duration: '2 Hours',
    difficulty: 'Medium',
    sections: [{ id: '1', marksPerQuestion: 1, count: 10, type: 'compulsory' }]
  });

  const scrollToBottom = () => chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  useEffect(() => { scrollToBottom(); }, [chatHistory]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setSelectedFile({ name: file.name, base64: (reader.result as string).split(',')[1], mimeType: file.type || 'image/jpeg' });
      reader.readAsDataURL(file);
    }
  };

  const handleAction = async (action: 'plan' | 'paper' | 'explain', extra?: any) => {
    if (!topic && !selectedFile) { alert("Source content required."); return; }
    
    if (action === 'plan' && !showSyllabusModal && !extra) {
      if (!selectedFile) { alert("Upload document first."); return; }
      setShowSyllabusModal(true); return;
    }

    if (action === 'paper' && !showBlueprint && !extra) {
      setShowBlueprint(true); return;
    }

    if (action === 'explain' && !showSlideConfig && !extra) {
      setShowSlideConfig(true); return;
    }

    setLoading(true);
    setActiveAction(action);
    setShowSyllabusModal(false);
    setShowBlueprint(false);
    setShowSlideConfig(false);
    
    try {
      let data;
      if (action === 'plan') {
        data = await generateSyllabusPlan(extra.amount, extra.type, context.grade, context.language, selectedFile!);
      } else if (action === 'paper') {
        data = await generateQuestionPaper(selectedFile!, context.grade, context.language, extra || examConfig);
      } else if (action === 'explain') {
        data = await generateSlideDeck(topic || "Summary", selectedFile || null, context.language, extra || 5);
      }
      setResult(data);
    } catch (err: any) {
      alert(`AI error: ${err.message}`);
    } finally { setLoading(false); }
  };

  const handleChatSend = async (customInput?: string) => {
    const finalInput = customInput || chatInput;
    if (!finalInput.trim() || loading) return;
    setChatInput('');
    const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    setChatHistory(prev => [...prev, { role: 'user', content: finalInput, time }, { role: 'ai', content: '...', time }]);
    try {
      const ans = await askChatQuestion(finalInput, selectedFile || null, context.language);
      setChatHistory(prev => {
        const updated = [...prev];
        updated[updated.length - 1].content = ans;
        return updated;
      });
    } catch (e) {
      setChatHistory(prev => {
        const updated = [...prev];
        updated[updated.length - 1].content = "Connection error.";
        return updated;
      });
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-20 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {showCamera && <CameraOverlay onCapture={(base64) => setSelectedFile({ name: `Capture_${Date.now()}.jpg`, base64, mimeType: 'image/jpeg' })} onClose={() => setShowCamera(false)} />}
      <SyllabusModal isOpen={showSyllabusModal} onClose={() => setShowSyllabusModal(false)} onGenerate={(amount, type) => handleAction('plan', { amount, type })} language={context.language} />
      <BlueprintModal isOpen={showBlueprint} onClose={() => setShowBlueprint(false)} onGenerate={(s) => handleAction('paper', s)} currentSettings={examConfig} grade={gradeId || ''} />
      <SlideConfigModal isOpen={showSlideConfig} onClose={() => setShowSlideConfig(false)} onGenerate={(count) => handleAction('explain', count)} />

      <div className="flex items-center gap-6 no-print">
        <button onClick={() => result ? setResult(null) : navigate('/')} className="w-11 h-11 flex items-center justify-center bg-white border border-slate-100 rounded-2xl text-slate-400 hover:text-slate-800 hover:shadow-xl transition-all active:scale-95 shadow-sm">
          <ArrowLeft size={20} />
        </button>
        <div>
          <h2 className="text-4xl font-black text-slate-800 tracking-tighter uppercase leading-none">{gradeId} {t.workspace}</h2>
          <p className="text-[#4FB5C0] font-black uppercase text-[10px] tracking-[0.2em] mt-1">{context.language} {t.mode}</p>
        </div>
      </div>

      {!result ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          <div className="lg:col-span-8 space-y-8">
            <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm p-10 space-y-10 relative overflow-hidden">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-slate-400 font-black text-[10px] uppercase tracking-[0.2em]">
                  <Upload size={16} className="text-[#4FB5C0]" /> {t.contentSource}
                </div>
                <button onClick={() => setShowCamera(true)} className="flex items-center gap-2 px-4 py-2 bg-[#E6F4F5] text-[#4FB5C0] rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-[#4FB5C0] hover:text-white transition-all shadow-sm active:scale-95">
                  <Camera size={16} /> {t.snapPhoto}
                </button>
              </div>

              <div 
                onClick={() => fileInputRef.current?.click()} 
                className={`border-4 border-dashed rounded-[2.5rem] p-16 flex flex-col items-center justify-center cursor-pointer transition-all duration-500 ${selectedFile ? 'border-[#4FB5C0] bg-[#F0F9FA] scale-[1.01]' : 'border-slate-50 hover:border-[#4FB5C0]/30 hover:bg-slate-50/50'}`}
              >
                <div className={`w-20 h-20 rounded-[2rem] flex items-center justify-center mb-6 shadow-2xl transition-all duration-500 ${selectedFile ? 'bg-[#4FB5C0] text-white rotate-2' : 'bg-slate-100 text-slate-200'}`}>
                   {selectedFile ? <FileIcon size={40} /> : <BookOpen size={40} />}
                </div>
                <p className="text-xl font-black text-slate-800 text-center tracking-tight">{selectedFile ? selectedFile.name : t.uploadPrompt}</p>
                <input type="file" ref={fileInputRef} onChange={handleFileUpload} className="hidden" accept="image/*,application/pdf" />
              </div>

              <div className="relative flex items-center justify-center">
                <div className="absolute inset-x-0 h-px bg-slate-50"></div>
                <span className="relative bg-white px-6 text-[10px] font-black text-slate-200 uppercase tracking-[0.5em]">Or Sync Context</span>
              </div>

              <input placeholder={t.describePrompt} className="w-full px-8 py-6 bg-slate-50 border-none rounded-[1.5rem] text-lg font-black text-slate-800 outline-none focus:ring-4 ring-[#4FB5C0]/5 transition-all" value={topic} onChange={(e) => setTopic(e.target.value)} />
            </div>

            <div className="grid grid-cols-3 gap-6">
              {[
                {id:'plan', icon:Calendar, label:t.masterPlan, bg:'bg-indigo-50', text:'text-indigo-500'},
                {id:'paper', icon:QuestionIcon, label:t.genExam, bg:'bg-[#E6F4F5]', text:'text-[#4FB5C0]', primary: true},
                {id:'explain', icon:Zap, label:t.slides, bg:'bg-amber-50', text:'text-amber-500'}
              ].map(btn => (
                <button 
                  key={btn.id}
                  onClick={() => handleAction(btn.id as any)} 
                  disabled={loading} 
                  className={`flex-1 p-8 rounded-[2rem] transition-all group active:scale-95 flex flex-col items-center justify-center text-center ${btn.primary ? 'bg-white border-2 border-[#4FB5C0] shadow-xl shadow-[#4FB5C0]/10' : 'bg-white border border-slate-100 hover:shadow-lg'}`}
                >
                  <div className={`w-14 h-14 ${btn.bg} ${btn.text} rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 group-hover:rotate-3 transition-all shadow-inner`}>
                    <btn.icon size={24} />
                  </div>
                  <p className="font-black text-slate-800 uppercase text-[10px] tracking-[0.2em]">{btn.label}</p>
                </button>
              ))}
            </div>
            
            {loading && (
              <div className="p-20 text-center space-y-8 bg-white rounded-[3rem] border border-slate-100 shadow-2xl animate-in zoom-in-95 duration-500">
                <div className="relative w-24 h-24 mx-auto">
                   <div className="absolute inset-0 border-[6px] border-slate-50 rounded-full" />
                   <div className="absolute inset-0 border-[6px] border-t-[#4FB5C0] rounded-full animate-spin shadow-inner shadow-[#4FB5C0]/5" />
                   <Sparkles className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-[#4FB5C0]" size={32} />
                </div>
                <div className="space-y-3">
                  <p className="text-2xl font-black text-slate-900 tracking-tighter uppercase">AI Master Drafting...</p>
                  <p className="text-slate-400 font-black uppercase text-[10px] tracking-[0.3em] animate-pulse">Computing pedagogical logic in {context.language}</p>
                </div>
              </div>
            )}
          </div>
          
          <div className="lg:col-span-4 bg-white/70 backdrop-blur-xl rounded-[2.5rem] border border-white shadow-xl flex flex-col h-[760px] overflow-hidden sticky top-24">
             <div className="p-8 border-b border-slate-50 flex items-center justify-between bg-white/50">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-lg border border-slate-50 text-[#4FB5C0]"><Sparkles size={24} /></div>
                  <div>
                    <h4 className="font-black text-[11px] uppercase tracking-[0.2em] text-slate-800 leading-none mb-1">{t.educatorGpt}</h4>
                    <div className="flex items-center gap-1.5">
                      <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                      <p className="text-[9px] text-slate-400 font-black tracking-widest uppercase">{t.contextAware}</p>
                    </div>
                  </div>
                </div>
             </div>
             <div className="flex-1 overflow-y-auto p-8 space-y-6 bg-slate-50/10 scrollbar-hide">
                {chatHistory.length === 0 && (
                  <div className="h-full flex flex-col items-center justify-center text-center opacity-30 py-20 space-y-4">
                    <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center"><Send size={32} className="text-slate-300 -rotate-12" /></div>
                    <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500">{t.askGpt}</p>
                  </div>
                )}
                {chatHistory.map((msg, i) => (
                  <div key={i} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'} animate-in fade-in slide-in-from-bottom-2 duration-300`}>
                    <div className={`max-w-[90%] p-5 rounded-[1.8rem] shadow-sm border ${msg.role === 'user' ? 'bg-[#4FB5C0] text-white rounded-tr-none border-[#4FB5C0]' : 'bg-white text-slate-700 rounded-tl-none border-slate-50'}`}>
                      {msg.content === '...' ? <div className="flex gap-2 py-2 px-1"><div className="w-1.5 h-1.5 bg-slate-300 rounded-full animate-bounce" /><div className="w-1.5 h-1.5 bg-slate-300 rounded-full animate-bounce delay-100" /><div className="w-1.5 h-1.5 bg-slate-300 rounded-full animate-bounce delay-200" /></div> : <FormattedChatMessage text={msg.content} />}
                    </div>
                    <span className="mt-1.5 text-[8px] font-black text-slate-300 uppercase tracking-widest px-3">{msg.time}</span>
                  </div>
                ))}
                <div ref={chatEndRef} />
             </div>
             <div className="p-6 bg-white border-t border-slate-100">
                <div className="relative">
                  <input placeholder={t.askGpt} className="w-full pl-6 pr-14 py-4.5 bg-slate-50 border border-slate-100 rounded-[1.5rem] text-sm font-black outline-none focus:ring-4 ring-[#4FB5C0]/5 transition-all" value={chatInput} onChange={(e) => setChatInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleChatSend()} />
                  <button onClick={() => handleChatSend()} className="absolute right-2 top-2 bottom-2 w-11 bg-[#4FB5C0] text-white rounded-2xl flex items-center justify-center shadow-lg shadow-[#4FB5C0]/10 hover:scale-105 transition-all"><Send size={18} /></button>
                </div>
             </div>
          </div>
        </div>
      ) : (
        <div className="space-y-12 animate-in fade-in zoom-in-95 duration-700">
           {activeAction === 'plan' ? (
             <SyllabusViewer plan={result} grade={gradeId || 'N/A'} />
           ) : activeAction === 'paper' ? (
             <EditablePaper paper={result} onUpdate={setResult} />
           ) : activeAction === 'explain' ? (
             <SlideDeckViewer deck={result} />
           ) : (
             <div className="bg-white p-20 rounded-[3.5rem] border border-slate-100 shadow-2xl text-center space-y-8">
               <div className="w-20 h-20 bg-emerald-50 text-emerald-600 rounded-[1.8rem] flex items-center justify-center mx-auto shadow-inner"><Sparkles size={40} /></div>
               <h3 className="text-4xl font-black text-slate-900 tracking-tighter uppercase">{result.title || "Ready"}</h3>
               <button onClick={() => window.print()} className="px-10 py-4.5 bg-[#4FB5C0] text-white rounded-[1.8rem] font-black uppercase tracking-[0.15em] shadow-xl shadow-[#4FB5C0]/20 hover:scale-105 transition-all active:scale-95"><Printer className="inline-block mr-2" size={20} /> Print Documentation</button>
             </div>
           )}
        </div>
      )}
    </div>
  );
};

export default GradeWorkspace;
