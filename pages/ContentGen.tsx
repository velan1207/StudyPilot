
import React, { useState } from 'react';
import { Send, Loader2, Copy, Check, Sparkles, Zap, BookOpen, Lightbulb, CheckCircle } from 'lucide-react';
import { generateLocalContent } from '../services/geminiService';
import { TeacherContext } from '../types';

interface StructuredContent {
  title: string;
  intro: string;
  keyIngredients: { term: string, definition: string }[];
  example: {
    scenario: string;
    steps: string[];
    result: string;
  };
  realWorldUsage: string;
  funFact: string;
}

const ContentGen: React.FC<{ context: TeacherContext }> = ({ context }) => {
  const [topic, setTopic] = useState('');
  const [content, setContent] = useState<StructuredContent | null>(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleGenerate = async () => {
    if (!topic) return;
    setLoading(true);
    try {
      const result = await generateLocalContent(topic, context.grade, context.language);
      setContent(result);
    } catch (err) {
      console.error(err);
      alert('Error generating content. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = () => {
    if (!content) return;
    const text = `
${content.title}

${content.intro}

Key Ingredients:
${content.keyIngredients.map(k => `- ${k.term}: ${k.definition}`).join('\n')}

Example Scenario:
${content.example.scenario}

Steps:
${content.example.steps.map((s, i) => `${i+1}. ${s}`).join('\n')}

Result: ${content.example.result}

Usage: ${content.realWorldUsage}
Fun Fact: ${content.funFact}
    `.trim();
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="max-w-5xl mx-auto">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-slate-800 mb-2">Hyper-Local Content Generator</h2>
        <p className="text-slate-600">Turn complex topics into rich, accurate lessons with local references.</p>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden mb-8">
        <div className="p-6">
          <label className="block text-sm font-semibold text-slate-700 mb-2">Lesson Topic</label>
          <div className="flex gap-2">
            <input 
              type="text"
              placeholder="e.g., Photosynthesis, Saving Money, Parts of a Flower"
              className="flex-1 px-4 py-4 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all text-lg"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleGenerate()}
            />
            <button 
              onClick={handleGenerate}
              disabled={loading || !topic}
              className="bg-blue-600 text-white px-8 py-4 rounded-xl font-bold flex items-center gap-2 hover:bg-blue-700 disabled:opacity-50 transition-all shadow-lg shadow-blue-500/20 active:scale-95"
            >
              {loading ? <Loader2 className="animate-spin" size={24} /> : <Sparkles size={24} />}
              Generate Lesson
            </button>
          </div>
        </div>
      </div>

      {content && (
        <div className="bg-white rounded-3xl shadow-xl border border-slate-200 overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-700 mb-12">
          <div className="bg-slate-50 border-b px-8 py-4 flex justify-between items-center">
            <div className="flex items-center gap-2 text-blue-600">
              <Sparkles size={18} />
              <span className="font-bold text-xs uppercase tracking-widest">Master Classroom Guide</span>
            </div>
            <button 
              onClick={copyToClipboard}
              className="flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-blue-600 transition-colors"
            >
              {copied ? <Check size={18} className="text-green-500" /> : <Copy size={18} />}
              {copied ? 'Copied' : 'Copy Lesson'}
            </button>
          </div>
          
          <div className="p-8 md:p-12 space-y-12">
            <div className="text-center max-w-2xl mx-auto">
              <h3 className="text-4xl font-black text-slate-900 mb-6 leading-tight">{content.title}</h3>
              <p className="text-xl text-slate-600 leading-relaxed font-medium italic">"{content.intro}"</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 space-y-8">
                {/* Ingredients Section */}
                <div className="space-y-4">
                  <h4 className="flex items-center gap-2 text-lg font-bold text-blue-700 uppercase tracking-wide">
                    <Zap size={20} className="text-amber-500" /> The Ingredients
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {content.keyIngredients.map((item, idx) => (
                      <div key={idx} className="bg-slate-50 p-5 rounded-2xl border border-slate-100 hover:bg-white hover:shadow-md transition-all">
                        <span className="block font-black text-slate-800 mb-1">{item.term}</span>
                        <p className="text-slate-600 text-sm leading-relaxed">{item.definition}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Example Section */}
                <div className="bg-indigo-600 rounded-3xl p-8 text-white relative shadow-xl">
                   <div className="absolute top-0 right-0 p-4 opacity-10"><BookOpen size={120} /></div>
                   <div className="relative z-10">
                      <h4 className="text-2xl font-bold mb-4 flex items-center gap-3">
                         <Sparkles size={24} /> Step-by-Step Learning
                      </h4>
                      <p className="text-indigo-100 text-lg mb-6 italic leading-relaxed">"{content.example.scenario}"</p>
                      <div className="space-y-4">
                        {content.example.steps.map((step, idx) => (
                          <div key={idx} className="flex items-start gap-4 bg-white/10 p-4 rounded-xl border border-white/10">
                            <span className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-sm font-bold shrink-0">{idx + 1}</span>
                            <p className="text-base font-medium leading-relaxed">{step}</p>
                          </div>
                        ))}
                      </div>
                      <div className="mt-8 pt-6 border-t border-white/20 flex items-center gap-3">
                        <CheckCircle size={24} className="text-emerald-400" />
                        <div>
                          <p className="text-xs uppercase font-black text-indigo-200 tracking-widest">The Result</p>
                          <p className="font-bold text-2xl">{content.example.result}</p>
                        </div>
                      </div>
                   </div>
                </div>
              </div>

              {/* Sidebar Info */}
              <div className="space-y-6">
                 <div className="bg-emerald-50 rounded-3xl p-6 border border-emerald-100 h-fit">
                    <h5 className="flex items-center gap-2 text-emerald-800 font-bold mb-4 uppercase text-xs tracking-widest">
                       <Lightbulb size={16} /> Why it matters
                    </h5>
                    <p className="text-emerald-900/80 leading-relaxed text-sm font-medium">{content.realWorldUsage}</p>
                 </div>

                 <div className="bg-amber-50 rounded-3xl p-6 border border-amber-100 h-fit">
                    <h5 className="flex items-center gap-2 text-amber-800 font-bold mb-4 uppercase text-xs tracking-widest">
                       <Zap size={16} /> Fun Fact!
                    </h5>
                    <p className="text-amber-900/80 leading-relaxed text-sm italic font-bold">"{content.funFact}"</p>
                 </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ContentGen;
