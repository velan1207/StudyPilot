
import React, { useState, useEffect } from 'react';
import * as RRD from 'react-router-dom';
import { auth, db } from '../firebase';
import { doc, getDoc, collection, query, orderBy, limit, onSnapshot } from 'firebase/firestore';
import { 
  GraduationCap, 
  Zap, 
  BookOpen,
  Calculator,
  FlaskConical,
  Beaker,
  Atom,
  Lightbulb,
  History,
  FileText,
  ChevronRight,
  Monitor,
  Sparkles,
  Dna,
  Globe2,
  Cpu,
  Microscope,
  Compass,
  Telescope,
  X,
  Archive,
  Search,
  Pencil
} from 'lucide-react';
import { GradeLevel, TeacherContext } from '../types';
import { UI_STRINGS } from '../translations';

const MetricTile = ({ label, value, icon: Icon, color }: any) => (
  <div className="glass-panel p-6 rounded-[2.5rem] border-white/50 shadow-xl flex items-center gap-6 group hover:scale-[1.02] transition-all duration-500">
    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-white shadow-lg ${color} group-hover:rotate-6 transition-transform`}>
      <Icon size={24} />
    </div>
    <div>
      <p className="text-3xl font-black text-slate-900 tracking-tighter leading-none mb-1">{value}</p>
      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{label}</p>
    </div>
  </div>
);

const GradeTile = ({ grade, tags, icon: Icon, color, onClick }: any) => (
  <div 
    onClick={onClick}
    className={`group relative h-64 bg-gradient-to-br ${color} rounded-[3rem] p-8 shadow-xl hover:shadow-2xl transition-all cursor-pointer overflow-hidden border border-white/20`}
  >
    <div className="absolute inset-0 bg-white/10 opacity-20 group-hover:opacity-30 transition-opacity" />
    <div className="relative z-10 flex flex-col h-full">
      <div className="w-16 h-16 rounded-[1.5rem] flex items-center justify-center mb-auto shadow-2xl bg-white/20 backdrop-blur-md text-white border border-white/30 group-hover:scale-110 transition-transform">
        <Icon size={32} />
      </div>
      <div>
        <h4 className="text-xl font-black text-white mb-2 uppercase tracking-tight drop-shadow-sm">{grade}</h4>
        <div className="flex flex-wrap gap-2">
          {tags.map((tag: string) => (
            <span key={tag} className="px-3 py-1 bg-white/20 text-white text-[8px] font-black rounded-full uppercase tracking-widest backdrop-blur-sm border border-white/10">
              {tag}
            </span>
          ))}
        </div>
      </div>
    </div>
    <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-all transform translate-x-4 group-hover:translate-x-0">
      <div className="w-10 h-10 bg-white/30 backdrop-blur-md border border-white/40 rounded-full flex items-center justify-center shadow-lg">
        <ChevronRight className="text-white" size={20} />
      </div>
    </div>
  </div>
);

const VaultBrowser = ({ isOpen, onClose, items, navigate, t }: any) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-[200] bg-slate-900/80 backdrop-blur-xl flex items-center justify-center p-4">
      <div className="bg-white rounded-[3rem] w-full max-w-6xl overflow-hidden flex flex-col h-[85vh] shadow-2xl">
        <div className="p-10 border-b flex items-center justify-between bg-slate-50/50">
          <div>
            <h3 className="text-4xl font-black uppercase tracking-tighter">{t.myVault}</h3>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">All generated resources across grades</p>
          </div>
          <button onClick={onClose} className="p-2 text-slate-300 hover:text-slate-900"><X size={32} /></button>
        </div>
        <div className="flex-1 overflow-y-auto p-10 custom-scrollbar grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {items.map((item: any) => (
            <div 
              key={item.id} 
              onClick={() => navigate(`/grade/${item.grade}`, { state: { loadedResult: item.content, loadedAction: item.type === 'question_paper' ? 'paper' : item.type === 'syllabus_plan' ? 'plan' : item.type === 'slide_deck' ? 'explain' : 'homework' } })}
              className="p-6 bg-white border border-slate-100 rounded-[2rem] hover:border-violet-500 hover:shadow-xl transition-all cursor-pointer flex flex-col gap-4"
            >
              <div className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-400">
                {item.type === 'question_paper' ? <FileText size={24} /> : item.type === 'slide_deck' ? <Monitor size={24} /> : <BookOpen size={24} />}
              </div>
              <div>
                <h5 className="font-black text-slate-800 uppercase text-[11px] line-clamp-2">{item.title}</h5>
                <p className="text-[8px] font-bold text-violet-500 uppercase tracking-widest mt-2">{t.grades[item.grade] || item.grade}</p>
                <p className="text-[8px] font-bold text-slate-300 uppercase tracking-widest mt-0.5">{item.type.replace('_', ' ')}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

const Dashboard: React.FC<{ context: TeacherContext, setContext: any }> = ({ context, setContext }) => {
  const navigate = RRD.useNavigate();
  const [userName, setUserName] = useState('');
  const [vaultItems, setVaultItems] = useState<any[]>([]);
  const [allVaultItems, setAllVaultItems] = useState<any[]>([]);
  const [showGlobalVault, setShowGlobalVault] = useState(false);
  const t = UI_STRINGS[context.language];

  useEffect(() => {
    const user = auth.currentUser;
    if (!user) return;
    getDoc(doc(db, "users", user.uid)).then(docSnap => {
      if (docSnap.exists()) setUserName(docSnap.data().name);
    });
    
    const qRecent = query(collection(db, "users", user.uid, "vault"), orderBy("createdAt", "desc"), limit(3));
    const unsubRecent = onSnapshot(qRecent, (snapshot) => {
      setVaultItems(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    const qAll = query(collection(db, "users", user.uid, "vault"), orderBy("createdAt", "desc"));
    const unsubAll = onSnapshot(qAll, (snapshot) => {
      setAllVaultItems(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    return () => { unsubRecent(); unsubAll(); };
  }, []);

  const handleGradeSelect = (id: string, name: string) => {
    const enumVal = Object.values(GradeLevel).find(g => g === name);
    if (enumVal) {
      setContext((prev: any) => ({ ...prev, grade: enumVal }));
      navigate(`/grade/${id}`);
    }
  };

  const grades = [
    { id: '1', name: 'Grade 1', tags: ['Phonics', 'Basic Math'], icon: BookOpen, color: 'from-rose-500 to-pink-500' },
    { id: '2', name: 'Grade 2', tags: ['Reading', 'Subtraction'], icon: Atom, color: 'from-orange-500 to-amber-500' },
    { id: '3', name: 'Grade 3', tags: ['Writing', 'Multiplication'], icon: Calculator, color: 'from-emerald-500 to-teal-500' },
    { id: '4', name: 'Grade 4', tags: ['Grammar', 'Fractions'], icon: Lightbulb, color: 'from-blue-500 to-cyan-500' },
    { id: '5', name: 'Grade 5', tags: ['Geography', 'Decimals'], icon: Beaker, color: 'from-indigo-500 to-violet-500' },
    { id: '6', name: 'Grade 6', tags: ['Science', 'Pre-Algebra'], icon: FlaskConical, color: 'from-purple-500 to-fuchsia-500' },
    { id: '7', name: 'Grade 7', tags: ['Geometry', 'Civics'], icon: Dna, color: 'from-blue-600 to-indigo-600' },
    { id: '8', name: 'Grade 8', tags: ['Physics', 'Algebra'], icon: Globe2, color: 'from-teal-600 to-emerald-600' },
    { id: '9', name: 'Grade 9', tags: ['Biology', 'History'], icon: Cpu, color: 'from-amber-600 to-orange-600' },
    { id: '10', name: 'Grade 10', tags: ['Trigonometry', 'Economics'], icon: Microscope, color: 'from-rose-600 to-pink-600' },
    { id: '11', name: 'Grade 11', tags: ['Calculus', 'Sociology'], icon: Compass, color: 'from-cyan-600 to-blue-600' },
    { id: '12', name: 'Grade 12', tags: ['Advanced Theory', 'Arts'], icon: Telescope, color: 'from-violet-700 to-purple-800' },
  ];

  return (
    <div className="space-y-16 animate-in fade-in duration-1000">
      <VaultBrowser isOpen={showGlobalVault} onClose={() => setShowGlobalVault(false)} items={allVaultItems} navigate={navigate} t={t} />
      
      <section className="relative">
        <div className="max-w-4xl">
          <div className="flex items-center gap-3 mb-8">
            <span className="px-6 py-2 bg-gradient-to-r from-violet-600 to-indigo-600 text-white rounded-full text-[11px] font-black uppercase tracking-[0.25em] border-2 border-violet-400 shadow-xl shadow-violet-200/50 animate-pulse">
              {t.personalizedAiSuite}
            </span>
          </div>
          <h2 className="text-5xl md:text-7xl font-black text-slate-900 mb-6 tracking-tighter leading-[0.9]">{t.welcome}, <span className="bg-gradient-to-r from-violet-600 to-cyan-500 bg-clip-text text-transparent">{userName || 'Educator'}</span></h2>
          <p className="text-xl text-slate-500 font-medium max-w-2xl leading-relaxed">{t.heroSub}</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mt-12">
          <MetricTile label={t.availGrades} value="12" icon={GraduationCap} color="bg-emerald-500" />
          <MetricTile label={t.vaultFiles} value={allVaultItems.length} icon={History} color="bg-orange-500" />
          <MetricTile label={t.cloudEngine} value="Online" icon={Zap} color="bg-violet-600" />
          <MetricTile label={t.aiPotency} value="2.5 Pro" icon={Sparkles} color="bg-cyan-500" />
        </div>
      </section>

      {vaultItems.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tight flex items-center gap-3"><History className="text-violet-600" size={24} />{t.recentVault}</h3>
            <button onClick={() => setShowGlobalVault(true)} className="text-xs font-black text-violet-600 uppercase tracking-widest hover:underline">{t.viewAll}</button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {vaultItems.map(item => (
              <div 
                key={item.id} 
                onClick={() => navigate(`/grade/${item.grade}`, { state: { loadedResult: item.content, loadedAction: item.type === 'question_paper' ? 'paper' : item.type === 'syllabus_plan' ? 'plan' : item.type === 'slide_deck' ? 'explain' : 'homework' } })}
                className="bg-white p-6 rounded-[2.5rem] border border-slate-100 flex items-center justify-between group hover:border-violet-400 transition-all cursor-pointer shadow-xl"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-900 group-hover:bg-violet-600 group-hover:text-white transition-all shadow-inner">
                    {item.type === 'question_paper' ? <FileText size={20} /> : item.type === 'slide_deck' ? <Monitor size={20} /> : <BookOpen size={20} />}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-black text-slate-900 uppercase truncate max-w-[140px]">{item.title || 'Untitled Draft'}</p>
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{item.type.replace('_', ' ')}</p>
                  </div>
                </div>
                <ChevronRight className="text-slate-300 group-hover:text-violet-600" size={18} />
              </div>
            ))}
          </div>
        </section>
      )}

      <section>
        <div className="mb-12"><h3 className="text-4xl font-black text-slate-900 tracking-tighter uppercase mb-2">{t.gradeWorkspaceHeader}</h3><p className="text-slate-400 font-bold uppercase text-[10px] tracking-widest">{t.gradeWorkspaceSub}</p></div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {grades.map(grade => (
            <GradeTile key={grade.id} grade={t.grades[grade.name] || grade.name} tags={grade.tags} icon={grade.icon} color={grade.color} onClick={() => handleGradeSelect(grade.id, grade.name)} />
          ))}
        </div>
      </section>
    </div>
  );
};

export default Dashboard;
