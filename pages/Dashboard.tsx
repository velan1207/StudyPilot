
import React from 'react';
import { useNavigate } from 'react-router-dom';
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
  Lightbulb
} from 'lucide-react';
import { GradeLevel, TeacherContext } from '../types';
import { UI_STRINGS } from '../translations';

const SummaryCard: React.FC<{ label: string, value: string, subtext: string, icon: any, color: string }> = ({ label, value, subtext, icon: Icon, color }) => (
  <div className={`bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm flex items-start gap-4 flex-1 hover:shadow-xl hover:-translate-y-1 transition-all duration-300`}>
    <div className={`p-4 bg-opacity-10 rounded-2xl ${color.replace('text-', 'bg-')}`}>
      <Icon size={24} className={color} />
    </div>
    <div>
      <p className="text-3xl font-black text-slate-800 tracking-tight">{value}</p>
      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{label}</p>
      <p className="text-[10px] text-[#4FB5C0] font-black mt-1 uppercase">{subtext}</p>
    </div>
  </div>
);

const GradeCard: React.FC<{ grade: string, tags: string[], icon: any, color: string, onClick: () => void }> = ({ grade, tags, icon: Icon, color, onClick }) => (
  <div 
    onClick={onClick}
    className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm hover:shadow-2xl hover:border-[#4FB5C0]/20 transition-all cursor-pointer group flex flex-col gap-6 relative overflow-hidden"
  >
    <div className="absolute top-0 right-0 p-8 opacity-5 -mr-4 -mt-4 transition-transform group-hover:scale-125 duration-500">
      <Icon size={120} />
    </div>
    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-white shadow-xl ${color} group-hover:scale-110 transition-transform duration-500`}>
      <Icon size={28} />
    </div>
    <div className="relative z-10">
      <h4 className="text-xl font-black text-slate-800 mb-2 uppercase tracking-tight">{grade}</h4>
      <div className="flex flex-wrap gap-2">
        {tags.map(tag => (
          <span key={tag} className="px-3 py-1 bg-slate-50 text-slate-400 text-[9px] font-black rounded-lg border border-slate-100 uppercase tracking-widest">
            {tag}
          </span>
        ))}
      </div>
    </div>
  </div>
);

const Dashboard: React.FC<{ context: TeacherContext, setContext: any }> = ({ context, setContext }) => {
  const navigate = useNavigate();
  const t = UI_STRINGS[context.language];

  const handleGradeSelect = (id: string, name: string) => {
    const enumVal = Object.values(GradeLevel).find(g => g === name);
    if (enumVal) {
      setContext((prev: any) => ({ ...prev, grade: enumVal }));
      navigate(`/grade/${id}`);
    }
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
    <div className="max-w-7xl mx-auto space-y-16 animate-in fade-in duration-700">
      <section>
        <div className="mb-12">
          <p className="text-[10px] font-black text-[#4FB5C0] uppercase tracking-[0.3em] mb-3 border-l-4 border-[#4FB5C0] pl-4">Admin Dashboard</p>
          <h2 className="text-5xl font-black text-slate-800 mb-4 tracking-tighter">{t.welcome}, Priya</h2>
          <p className="text-slate-400 font-medium text-lg max-w-2xl leading-relaxed">Unlock the power of AI to transform your classroom. Select a workspace to begin crafting high-quality lessons and assessments.</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          <SummaryCard label="Total Grades" value="12" subtext="Full Coverage" icon={GraduationCap} color="text-emerald-500" />
          <SummaryCard label="Languages" value="8" subtext="Native Support" icon={Globe} color="text-orange-500" />
          <SummaryCard label="Powered Tools" value="AI" subtext="Teacher Core" icon={Zap} color="text-violet-500" />
          <SummaryCard label="Efficiency" value="10x" subtext="Time Saved" icon={InfinityIcon} color="text-[#4FB5C0]" />
        </div>
      </section>

      <section>
        <div className="mb-10 flex items-center justify-between border-b border-slate-100 pb-6">
          <div className="flex items-center gap-3">
             <div className="w-1.5 h-6 bg-[#4FB5C0] rounded-full"></div>
             <h3 className="font-black text-2xl text-slate-800 uppercase tracking-tight">{t.selectGrade}</h3>
          </div>
          <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Select to open workspace</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
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
