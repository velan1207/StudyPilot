
import React, { useState, useEffect } from 'react';
import { 
  Target, 
  Settings, 
  BarChart3, 
  Plus, 
  Trash2, 
  Save, 
  AlertCircle,
  TrendingUp,
  CheckCircle2,
  ChevronDown,
  Info
} from 'lucide-react';
import { auth, db } from '../firebase';
import { doc, getDoc, setDoc, onSnapshot } from 'firebase/firestore';
import { CourseOutcome, ProgramOutcome, CO_PO_Mapping, TeacherContext } from '../types';

const OBEManager: React.FC<{ context: TeacherContext }> = ({ context }) => {
  const [cos, setCos] = useState<CourseOutcome[]>([]);
  const [pos, setPos] = useState<ProgramOutcome[]>([
    { id: 'po1', code: 'PO1', description: 'Subject knowledge and foundational expertise.' },
    { id: 'po2', code: 'PO2', description: 'Critical thinking and problem solving.' },
    { id: 'po3', code: 'PO3', description: 'Ethics and professional behavior.' }
  ]);
  const [mappings, setMappings] = useState<CO_PO_Mapping[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<'cos' | 'matrix' | 'dashboard'>('cos');

  useEffect(() => {
    const user = auth.currentUser;
    if (!user) return;

    const unsub = onSnapshot(doc(db, "users", user.uid, "obe", context.grade), (doc) => {
      if (doc.exists()) {
        const data = doc.data();
        setCos(data.cos || []);
        setMappings(data.mappings || []);
      }
      setLoading(false);
    });
    return unsub;
  }, [context.grade]);

  const saveToFirebase = async () => {
    const user = auth.currentUser;
    if (!user) return;
    setSaving(true);
    try {
      await setDoc(doc(db, "users", user.uid, "obe", context.grade), {
        cos,
        mappings,
        updatedAt: new Date().toISOString()
      }, { merge: true });
    } finally {
      setSaving(false);
    }
  };

  const addCO = () => {
    const nextNum = cos.length + 1;
    setCos([...cos, { id: Date.now().toString(), code: `CO${nextNum}`, description: '', targetWeightage: 0 }]);
  };

  const removeCO = (id: string) => {
    setCos(cos.filter(c => c.id !== id));
    setMappings(mappings.filter(m => m.coId !== id));
  };

  const updateCO = (id: string, updates: Partial<CourseOutcome>) => {
    setCos(cos.map(c => c.id === id ? { ...c, ...updates } : c));
  };

  const cycleMapping = (coId: string, poId: string) => {
    const existing = mappings.find(m => m.coId === coId && m.poId === poId);
    let nextStrength: 0 | 1 | 2 | 3 = 1;
    if (existing) {
      nextStrength = ((existing.strength + 1) % 4) as 0 | 1 | 2 | 3;
    }
    
    const others = mappings.filter(m => !(m.coId === coId && m.poId === poId));
    setMappings([...others, { coId, poId, strength: nextStrength }]);
  };

  const getStrength = (coId: string, poId: string) => {
    return mappings.find(m => m.coId === coId && m.poId === poId)?.strength || 0;
  };

  if (loading) return (
    <div className="h-[60vh] flex flex-col items-center justify-center gap-4">
      <div className="w-16 h-16 border-4 border-indigo-100 border-t-indigo-500 rounded-full animate-spin"></div>
      <p className="font-black text-slate-400 uppercase text-xs tracking-widest">Loading Outcome Framework</p>
    </div>
  );

  return (
    <div className="max-w-6xl mx-auto space-y-10 pb-20 animate-in fade-in duration-700">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <p className="text-[10px] font-black text-[#4FB5C0] uppercase tracking-[0.3em] mb-3 border-l-4 border-[#4FB5C0] pl-4">Outcome Based Education</p>
          <h2 className="text-4xl font-black text-slate-800 tracking-tighter uppercase leading-none">{context.grade} OBE Framework</h2>
        </div>
        <div className="flex gap-4">
          <button onClick={saveToFirebase} className="flex items-center gap-3 px-6 py-3 bg-white border border-slate-100 rounded-xl font-black uppercase text-[10px] tracking-widest shadow-sm hover:bg-slate-50 transition-all text-indigo-600">
            {saving ? <div className="w-4 h-4 border-2 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin"></div> : <Save size={16} />} Save Framework
          </button>
        </div>
      </div>

      <div className="flex bg-white p-1.5 rounded-2xl border border-slate-100 shadow-sm w-fit">
        <TabButton active={activeTab === 'cos'} onClick={() => setActiveTab('cos')} icon={Target} label="Define COs" />
        <TabButton active={activeTab === 'matrix'} onClick={() => setActiveTab('matrix')} icon={Settings} label="CO-PO Matrix" />
        <TabButton active={activeTab === 'dashboard'} onClick={() => setActiveTab('dashboard')} icon={BarChart3} label="Attainment Dashboard" />
      </div>

      {activeTab === 'cos' && (
        <div className="space-y-6">
          <div className="bg-indigo-50/50 p-6 rounded-[2rem] border border-indigo-100 flex items-start gap-4">
            <Info className="text-indigo-500 shrink-0 mt-1" size={20} />
            <div>
              <h4 className="font-black text-slate-800 text-sm uppercase">What are Course Outcomes?</h4>
              <p className="text-slate-500 text-sm font-medium">Define clear goals for what students should be able to do by the end of this {context.grade} syllabus. Our AI uses these to categorize questions.</p>
            </div>
          </div>
          
          <div className="grid grid-cols-1 gap-4">
            {cos.map((co) => (
              <div key={co.id} className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-md transition-all flex gap-6 items-start group">
                <div className="w-14 h-14 bg-slate-50 rounded-2xl flex items-center justify-center font-black text-indigo-500 text-lg shrink-0 group-hover:bg-indigo-50 transition-colors">
                  {co.code}
                </div>
                <div className="flex-1 space-y-4">
                  <input 
                    value={co.description} 
                    onChange={e => updateCO(co.id, { description: e.target.value })}
                    placeholder="Enter outcome description (e.g., Analyze the basic functions of biological systems...)"
                    className="w-full text-lg font-bold text-slate-800 bg-transparent border-none outline-none focus:ring-0 placeholder:text-slate-300"
                  />
                  <div className="flex items-center gap-6">
                     <div className="flex items-center gap-3 bg-slate-50 px-4 py-2 rounded-xl">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Weightage</span>
                        <input 
                          type="number" 
                          value={co.targetWeightage} 
                          onChange={e => updateCO(co.id, { targetWeightage: parseInt(e.target.value) || 0 })}
                          className="w-12 bg-white border border-slate-200 rounded-lg px-2 py-1 text-xs font-black text-indigo-500 outline-none"
                        />
                        <span className="text-[10px] font-black text-slate-400">%</span>
                     </div>
                  </div>
                </div>
                <button onClick={() => removeCO(co.id)} className="p-3 text-slate-200 hover:text-rose-500 transition-colors">
                  <Trash2 size={20} />
                </button>
              </div>
            ))}
            <button onClick={addCO} className="w-full py-8 border-2 border-dashed border-slate-200 rounded-[2.5rem] flex flex-col items-center justify-center gap-2 hover:border-indigo-200 hover:bg-indigo-50/20 transition-all text-slate-400 group">
              <Plus className="group-hover:scale-110 transition-transform" />
              <span className="text-[10px] font-black uppercase tracking-[0.2em]">Add Course Outcome</span>
            </button>
          </div>
        </div>
      )}

      {activeTab === 'matrix' && (
        <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden">
          <div className="p-8 border-b bg-slate-50/50">
            <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight">Correlation Matrix</h3>
            <p className="text-xs font-bold text-slate-400 mt-1 uppercase tracking-widest">Map COs to POs (0: None, 1: Low, 2: Medium, 3: High)</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr>
                  <th className="p-6 text-left bg-slate-50/30 border-b border-r border-slate-100 min-w-[200px]">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Outcomes</span>
                  </th>
                  {pos.map(po => (
                    <th key={po.id} className="p-6 text-center bg-slate-50/30 border-b border-slate-100 min-w-[150px]">
                      <div className="space-y-1">
                        <span className="text-sm font-black text-slate-800">{po.code}</span>
                        <p className="text-[8px] font-bold text-slate-400 uppercase leading-tight max-w-[120px] mx-auto">{po.description}</p>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {cos.length === 0 ? (
                  <tr>
                    <td colSpan={pos.length + 1} className="p-20 text-center text-slate-300 font-black uppercase text-xs tracking-widest">
                      Define Course Outcomes first to enable mapping
                    </td>
                  </tr>
                ) : cos.map(co => (
                  <tr key={co.id} className="group hover:bg-slate-50/30 transition-colors">
                    <td className="p-6 border-b border-r border-slate-100">
                      <div className="flex items-center gap-4">
                        <span className="w-10 h-10 bg-indigo-50 text-indigo-500 rounded-xl flex items-center justify-center font-black text-xs">{co.code}</span>
                        <span className="text-xs font-bold text-slate-600 line-clamp-1">{co.description || 'No description'}</span>
                      </div>
                    </td>
                    {pos.map(po => {
                      const strength = getStrength(co.id, po.id);
                      return (
                        <td key={po.id} className="p-6 border-b border-slate-100 text-center">
                          <button 
                            onClick={() => cycleMapping(co.id, po.id)}
                            className={`w-12 h-12 rounded-2xl font-black text-lg transition-all ${
                              strength === 3 ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/20 scale-110' :
                              strength === 2 ? 'bg-indigo-100 text-indigo-600' :
                              strength === 1 ? 'bg-slate-100 text-slate-400' :
                              'bg-slate-50/50 text-slate-200 hover:bg-slate-100'
                            }`}
                          >
                            {strength || '-'}
                          </button>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'dashboard' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
           <div className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-sm space-y-10">
              <div className="flex items-center justify-between">
                <h3 className="text-2xl font-black text-slate-800 uppercase tracking-tight">CO Attainment</h3>
                <TrendingUp className="text-[#4FB5C0]" />
              </div>
              <div className="space-y-8">
                {cos.length === 0 ? (
                  <p className="text-center py-20 text-slate-300 uppercase font-black text-xs">No Data Available</p>
                ) : cos.map(co => (
                  <div key={co.id} className="space-y-3">
                    <div className="flex justify-between items-end">
                      <div>
                        <span className="text-[10px] font-black text-[#4FB5C0] uppercase tracking-widest">{co.code}</span>
                        <p className="text-sm font-bold text-slate-700">{co.description || 'General Outcome'}</p>
                      </div>
                      <span className="font-black text-indigo-500">78%</span>
                    </div>
                    <div className="w-full h-4 bg-slate-100 rounded-full overflow-hidden">
                      <div className="h-full bg-indigo-500 rounded-full" style={{ width: '78%' }}></div>
                    </div>
                  </div>
                ))}
              </div>
           </div>

           <div className="bg-indigo-600 p-10 rounded-[3rem] text-white shadow-xl space-y-10 relative overflow-hidden">
              <div className="absolute -right-20 -top-20 opacity-10 pointer-events-none">
                <BarChart3 size={300} />
              </div>
              <div className="relative z-10">
                <h3 className="text-2xl font-black uppercase tracking-tight mb-10">PO Achievement</h3>
                <div className="grid grid-cols-1 gap-8">
                  {pos.map(po => (
                    <div key={po.id} className="space-y-3">
                       <div className="flex justify-between items-end">
                          <span className="font-black text-sm">{po.code}</span>
                          <span className="font-black">62%</span>
                       </div>
                       <div className="w-full h-3 bg-white/10 rounded-full overflow-hidden border border-white/5">
                          <div className="h-full bg-white rounded-full" style={{ width: '62%' }}></div>
                       </div>
                       <p className="text-[10px] font-medium text-indigo-200 leading-tight">{po.description}</p>
                    </div>
                  ))}
                </div>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

const TabButton = ({ active, onClick, icon: Icon, label }: any) => (
  <button 
    onClick={onClick}
    className={`px-8 py-3 rounded-xl font-black uppercase text-[10px] tracking-widest transition-all flex items-center gap-3 ${
      active ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/20' : 'text-slate-400 hover:text-slate-800'
    }`}
  >
    <Icon size={14} /> {label}
  </button>
);

export default OBEManager;
