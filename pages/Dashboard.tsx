
import React, { useState, useEffect } from 'react';
/* Fixed: Using namespace import for react-router-dom to avoid missing named export error */
import * as RRD from 'react-router-dom';
import { auth, db } from '../firebase';
import { doc, getDoc, collection, query, orderBy, limit, onSnapshot } from 'firebase/firestore';
import { 
  GraduationCap, 
  Globe, 
  Zap, 
  Infinity as InfinityIcon,
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
  Trash2
} from 'lucide-react';
import { GradeLevel, TeacherContext } from '../types';
import { UI_STRINGS } from '../translations';

const SummaryCard: React.FC<{ label: string, value: string, subtext: string, icon: any, color: string }> = ({ label, value, subtext, icon: Icon, color }) => (
  <div className={`bg-white p-5 md:p-6 rounded-[1.5rem] md:rounded-[2rem] border border-slate-100 shadow-sm flex items-start gap-4 hover:shadow-xl hover:-translate-y-1 transition-all duration-300`}>
    <div className={`p-3 md:p-4 bg-opacity-10 rounded-xl md:rounded-2xl shrink-0 ${color.replace('text-', 'bg-')}`}>
      <Icon size={20} className={color} />
    </div>
    <div className="min-w-0">
      <p className="text-2xl md:text-3xl font-black text-slate-800 tracking-tight leading-none mb-1">{value}</p>
      <p className="text-[9px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest truncate">{label}</p>
      <p className="text-[9px] text-[#4FB5C0] font-black mt-1 uppercase truncate">{subtext}</p>
    </div>
  </div>
);

const GradeCard: React.FC<{ grade: string, tags: string[], icon: any, color: string, onClick: () => void }> = ({ grade, tags, icon: Icon, color, onClick }) => (
  <div 
    onClick={onClick}
    className="bg-white p-6 md:p-8 rounded-[2rem] md:rounded-[2.5rem] border border-slate-100 shadow-sm hover:shadow-2xl hover:border-[#4FB5C0]/20 transition-all cursor-pointer group flex flex-col gap-4 md:gap-6 relative overflow-hidden"
  >
    <div className="absolute top-0 right-0 p-4 md:p-8 opacity-5 -mr-4 -mt-4 transition-transform group-hover:scale-125 duration-500">
      <Icon size={80} className="md:w-[120px] md:h-[120px]" />
    </div>
    <div className={`w-12 h-12 md:w-14 md:h-14 rounded-xl md:rounded-2xl flex items-center justify-center text-white shadow-xl ${color} group-hover:scale-110 transition-transform duration-500`}>
      <Icon size={24} className="md:w-[28px] md:h-[28px]" />
    </div>
    <div className="relative z-10">
      <h4 className="text-lg md:text-xl font-black text-slate-800 mb-2 uppercase tracking-tight">{grade}</h4>
      <div className="flex flex-wrap gap-2">
        {tags.map(tag => (
          <span key={tag} className="px-2 py-1 bg-slate-50 text-slate-400 text-[8px] font-black rounded-lg border border-slate-100 uppercase tracking-widest">
            {tag}
          </span>
        ))}
      </div>
    </div>
  </div>
);

const Dashboard: React.FC<{ context: TeacherContext, setContext: any }> = ({ context, setContext }) => {
  const navigate = RRD.useNavigate();
  const [userName, setUserName] = useState('');
  const [vaultItems, setVaultItems] = useState<any[]>([]);
  const t = UI_STRINGS[context.language];

  useEffect(() => {
    const user = auth.currentUser;
    if (!user) return;

    getDoc(doc(db, "users", user.uid)).then(doc => {
      if (doc.exists()) setUserName(doc.data().name);
    });

    const q = query(collection(db, "users", user.uid, "vault"), orderBy("createdAt", "desc"), limit(5));
    const unsub = onSnapshot(q, (snapshot) => {
      const items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setVaultItems(items);
    });

    return () => unsub();
  }, []);

  const handleGradeSelect = (id: string, name: string) => {
    const enumVal = Object.values(GradeLevel).find(g => g === name);
    if (enumVal) {
      setContext((prev: any) => ({ ...prev, grade: enumVal }));
      navigate(`/grade/${id}`);
    }
  };

  const handleVaultItemClick = (item: any) => {
    // Determine the action type based on saved metadata
    let action = '';
    if (item.type === 'question_paper') action = 'paper';
    else if (item.type === 'syllabus_plan') action = 'plan';
    else if (item.type === 'slide_deck') action = 'explain';

    // Update global context for the grade
    const enumVal = Object.values(GradeLevel).find(g => g === item.grade);
    if (enumVal) {
        setContext((prev: any) => ({ ...prev, grade: enumVal }));
    }

    // Navigate to workspace with the pre-loaded result and action
    navigate(`/grade/${item.grade}`, { 
      state: { 
        loadedResult: item.content, 
        loadedAction: action 
      } 
    });
  };

  const grades = [
    { id: '1', name: 'Grade 1', tags: ['Reading', 'Math'], icon: BookOpen, color: 'bg-rose-500' },
    { id: '2', name: 'Grade 2', tags: ['Language', 'Math'], icon: Globe, color: 'bg-orange-500' },
    { id: '3', name: 'Grade 3', tags: ['English', 'Math'], icon: BookOpen, color: 'bg-amber-500' },
    { id: '4', name: 'Grade 4', tags: ['English', 'Math'], icon: Lightbulb, color: 'bg-emerald-500' },
    { id: '5', name: 'Grade 5', tags: ['English', 'Math'], icon: BookOpen, color: 'bg-blue-500' },
    { id: '6', name: 'Grade 6', tags: ['English', 'Math'], icon: Globe, color: 'bg-sky-500' },
    { id: '7', name: 'Grade 7', tags: ['Math', 'Science'], icon: Beaker, color: 'bg-indigo-500' },
    { id: '8', name: 'Grade 8', tags: ['Algebra', 'Physics'], icon: Calculator, color: 'bg-pink-500' },
    { id: '9', name: 'Grade 9', tags: ['Math', 'Biology'], icon: Atom, color: 'bg-red-500' },
    { id: '10', name: 'Grade 10', tags: ['Math', 'Science'], icon: GraduationCap, color: 'bg-violet-500' },
    { id: '11', name: 'Grade 11', tags: ['Physics', 'Chemistry'], icon: FlaskConical, color: 'bg-red-600' },
    { id: '12', name: 'Grade 12', tags: ['Advanced Math', 'Physics'], icon: GraduationCap, color: 'bg-purple-600' },
  ];

  return (
    <div className="max-w-7xl mx-auto space-y-10 md:space-y-16 animate-in fade-in duration-700">
      <section>
        <div className="mb-8 md:mb-12">
          <p className="text-[9px] md:text-[10px] font-black text-[#4FB5C0] uppercase tracking-[0.3em] mb-3 border-l-4 border-[#4FB5C0] pl-4">Admin Dashboard</p>
          <h2 className="text-3xl md:text-5xl font-black text-slate-800 mb-4 tracking-tighter leading-tight">
            {t.welcome}, {userName || 'Educator'}
          </h2>
          <p className="text-slate-400 font-medium text-base md:text-lg max-w-2xl leading-relaxed">Unlock the power of AI to transform your classroom. Your vault and workspaces are synced to the cloud.</p>
        </div>

        <div className="grid grid-cols-1 xs:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-8">
          <SummaryCard label="Total Grades" value="12" subtext="Full Coverage" icon={GraduationCap} color="text-emerald-500" />
          <SummaryCard label="Vault Items" value={vaultItems.length.toString()} subtext="Saved Content" icon={History} color="text-orange-500" />
          <SummaryCard label="Status" value="Online" subtext="Cloud Sync Active" icon={Zap} color="text-violet-500" />
          <SummaryCard label="Efficiency" value="10x" subtext="Time Saved" icon={InfinityIcon} color="text-[#4FB5C0]" />
        </div>
      </section>

      {vaultItems.length > 0 && (
        <section>
          <div className="mb-6 flex items-center justify-between">
            <h3 className="font-black text-xl text-slate-800 uppercase tracking-tight flex items-center gap-2">
              <History className="text-[#4FB5C0]" size={20} /> Recent in Vault
            </h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {vaultItems.map(item => (
              <div 
                key={item.id} 
                onClick={() => handleVaultItemClick(item)}
                className="bg-white p-5 rounded-2xl border border-slate-100 flex items-center justify-between group hover:border-[#4FB5C0] transition-all cursor-pointer shadow-sm hover:shadow-md"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center text-[#4FB5C0]">
                    {item.type === 'question_paper' ? <FileText size={18} /> : (item.type === 'slide_deck' ? <Monitor size={18} /> : <BookOpen size={18} />)}
                  </div>
                  <div>
                    <p className="text-sm font-black text-slate-800 truncate max-w-[150px] uppercase">{item.title || 'Untitled'}</p>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{item.type.replace('_', ' ')}</p>
                  </div>
                </div>
                <ChevronRight className="text-slate-300 group-hover:text-[#4FB5C0] transition-all" size={16} />
              </div>
            ))}
          </div>
        </section>
      )}

      <section>
        <div className="mb-6 md:mb-10 flex items-center justify-between border-b border-slate-100 pb-6">
          <div className="flex items-center gap-3">
             <div className="w-1.5 h-6 bg-[#4FB5C0] rounded-full"></div>
             <h3 className="font-black text-xl md:text-2xl text-slate-800 uppercase tracking-tight">{t.selectGrade}</h3>
          </div>
          <p className="hidden sm:block text-[10px] font-black text-slate-300 uppercase tracking-widest">Select to open workspace</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-8">
          {grades.map(grade => (
            <GradeCard 
              key={grade.id} 
              grade={grade.name} 
              tags={grade.tags} 
              icon={grade.icon} 
              color={grade.color} 
              onClick={() => handleGradeSelect(grade.id, grade.name)}
            />
          ))}
        </div>
      </section>
    </div>
  );
};

export default Dashboard;
