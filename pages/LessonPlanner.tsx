
import React, { useState } from 'react';
import { Calendar, Plus, X, Loader2, Sparkles, Printer, ArrowRight } from 'lucide-react';
import { generateLessonPlan } from '../services/geminiService';
import { TeacherContext, LessonPlan } from '../types';

const LessonPlanner: React.FC<{ context: TeacherContext }> = ({ context }) => {
  const [topics, setTopics] = useState<string[]>([]);
  const [currentTopic, setCurrentTopic] = useState('');
  const [plan, setPlan] = useState<LessonPlan | null>(null);
  const [loading, setLoading] = useState(false);

  const addTopic = () => {
    if (currentTopic.trim()) {
      setTopics([...topics, currentTopic.trim()]);
      setCurrentTopic('');
    }
  };

  const removeTopic = (index: number) => {
    setTopics(topics.filter((_, i) => i !== index));
  };

  const handleGenerate = async () => {
    if (topics.length === 0) return;
    setLoading(true);
    try {
      const result = await generateLessonPlan(topics, context.grade, context.language);
      setPlan(result);
    } catch (err) {
      console.error(err);
      alert('Error generating lesson plan.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto pb-12">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-slate-800 mb-2">Weekly Lesson Planner</h2>
        <p className="text-slate-600">Plan multi-grade activities effortlessly for the entire week.</p>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 p-8 shadow-sm mb-8">
        <div className="mb-6">
          <label className="block text-sm font-bold text-slate-700 mb-3 uppercase">Weekly Topics to Cover</label>
          <div className="flex gap-2 mb-4">
            <input 
              type="text"
              placeholder="e.g., Simple Addition, Parts of a Tree"
              className="flex-1 px-4 py-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500 outline-none"
              value={currentTopic}
              onChange={(e) => setCurrentTopic(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && addTopic()}
            />
            <button 
              onClick={addTopic}
              className="bg-slate-100 text-slate-700 px-4 rounded-xl font-bold hover:bg-slate-200"
            >
              <Plus size={24} />
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {topics.map((t, i) => (
              <span key={i} className="bg-blue-50 text-blue-700 px-3 py-1.5 rounded-lg text-sm font-semibold flex items-center gap-2 border border-blue-100">
                {t}
                <button onClick={() => removeTopic(i)}><X size={14} /></button>
              </span>
            ))}
            {topics.length === 0 && <p className="text-sm text-slate-400 italic">No topics added yet...</p>}
          </div>
        </div>

        <button 
          onClick={handleGenerate}
          disabled={loading || topics.length === 0}
          className="w-full bg-blue-600 text-white py-4 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-blue-700 disabled:opacity-50 transition-all shadow-md"
        >
          {loading ? <Loader2 className="animate-spin" size={20} /> : <Sparkles size={20} />}
          Generate Weekly Plan
        </button>
      </div>

      {plan && (
        <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-lg animate-in fade-in zoom-in-95 duration-500">
          <div className="bg-blue-600 p-6 flex items-center justify-between">
            <div className="text-white">
              <h3 className="text-2xl font-bold">{plan.title}</h3>
              <p className="opacity-80 text-sm">Created for {context.grade}</p>
            </div>
            <button 
              onClick={() => window.print()} 
              className="bg-white/10 hover:bg-white/20 text-white p-2 rounded-lg backdrop-blur-md"
            >
              <Printer size={20} />
            </button>
          </div>

          <div className="p-8 space-y-10">
            <section>
              <div className="flex items-center gap-2 mb-4 text-blue-600">
                <div className="w-1 h-6 bg-blue-600 rounded-full"></div>
                <h4 className="font-bold text-lg">Learning Objectives</h4>
              </div>
              <ul className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {plan.objectives.map((obj, i) => (
                  <li key={i} className="bg-slate-50 p-3 rounded-xl border border-slate-100 flex items-start gap-3 text-slate-700">
                    <div className="w-1.5 h-1.5 bg-blue-400 rounded-full mt-2 shrink-0"></div>
                    {obj}
                  </li>
                ))}
              </ul>
            </section>

            <section>
              <div className="flex items-center gap-2 mb-4 text-emerald-600">
                <div className="w-1 h-6 bg-emerald-600 rounded-full"></div>
                <h4 className="font-bold text-lg">Multi-Grade Activities</h4>
              </div>
              <div className="space-y-4">
                {plan.activities.map((act, i) => (
                  <div key={i} className="flex flex-col md:flex-row gap-4 border-b border-slate-100 pb-6 last:border-0">
                    <div className="md:w-32">
                      <span className="inline-block px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-xs font-bold uppercase tracking-wider">
                        {act.grade}
                      </span>
                    </div>
                    <div className="flex-1 text-slate-700 leading-relaxed">
                      {act.description}
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <section className="bg-amber-50 rounded-2xl p-6 border border-amber-100">
              <div className="flex items-center gap-2 mb-3 text-amber-700">
                <CheckCircle2 size={20} />
                <h4 className="font-bold">Weekly Assessment Strategy</h4>
              </div>
              <p className="text-amber-900/80 leading-relaxed">
                {plan.assessment}
              </p>
            </section>
          </div>
        </div>
      )}
    </div>
  );
};

const CheckCircle2 = ({ size, className }: { size: number, className?: string }) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className={className}
  >
    <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z"/>
    <path d="m9 12 2 2 4-4"/>
  </svg>
);

export default LessonPlanner;
