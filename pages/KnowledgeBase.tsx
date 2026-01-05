
import React, { useState } from 'react';
import { MessageSquare, Send, Loader2, Sparkles, UserCircle, Zap, BookOpen, Lightbulb, CheckCircle } from 'lucide-react';
import { askQuestion } from '../services/geminiService';
import { TeacherContext } from '../types';

interface StructuredAIResponse {
  intro: string;
  ingredients: { name: string, desc: string }[];
  example: {
    title: string;
    scenario: string;
    logic: string[];
    summary: string;
  };
  usage: string;
  funFact: string;
}

interface Message {
  role: 'user' | 'ai';
  text: string | StructuredAIResponse;
}

const KnowledgeBase: React.FC<{ context: TeacherContext }> = ({ context }) => {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    const userMsg = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setLoading(true);

    try {
      const response = await askQuestion(userMsg, context.language);
      setMessages(prev => [...prev, { role: 'ai', text: response }]);
    } catch (err) {
      console.error(err);
      setMessages(prev => [...prev, { role: 'ai', text: "I'm sorry, I couldn't process that question right now." }]);
    } finally {
      setLoading(false);
    }
  };

  const renderMessageContent = (msg: Message) => {
    if (typeof msg.text === 'string') {
      return <p className="text-slate-700 leading-relaxed whitespace-pre-wrap">{msg.text}</p>;
    }

    const aiRes = msg.text as StructuredAIResponse;
    return (
      <div className="space-y-6">
        <p className="text-lg text-slate-800 leading-relaxed font-medium">{aiRes.intro}</p>
        
        {/* Ingredients Section */}
        <div className="space-y-3">
          <h5 className="flex items-center gap-2 text-sm font-bold text-slate-400 uppercase tracking-widest">
            <Zap size={14} className="text-amber-500" /> The Ingredients
          </h5>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {aiRes.ingredients.map((item, idx) => (
              <div key={idx} className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm hover:border-blue-200 transition-colors">
                <span className="block font-bold text-blue-700 mb-1">{item.name}</span>
                <p className="text-slate-600 text-sm leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Example Section */}
        <div className="bg-blue-600 rounded-2xl p-6 text-white shadow-lg overflow-hidden relative">
          <div className="absolute top-0 right-0 p-4 opacity-10"><BookOpen size={100} /></div>
          <div className="relative z-10">
            <h5 className="text-xl font-bold mb-3 flex items-center gap-2">
              <Sparkles size={20} /> {aiRes.example.title}
            </h5>
            <p className="text-blue-50 mb-4 italic">"{aiRes.example.scenario}"</p>
            <div className="space-y-3">
              {aiRes.example.logic.map((step, idx) => (
                <div key={idx} className="flex items-start gap-3 bg-white/10 p-3 rounded-lg border border-white/10">
                  <span className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center text-xs font-bold shrink-0">{idx + 1}</span>
                  <p className="text-sm font-medium">{step}</p>
                </div>
              ))}
            </div>
            <div className="mt-4 pt-4 border-t border-white/20 flex items-center gap-2">
              <CheckCircle size={18} className="text-emerald-400" />
              <p className="font-bold text-lg">{aiRes.example.summary}</p>
            </div>
          </div>
        </div>

        {/* Usage & Fun Fact */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100">
             <h6 className="text-xs font-bold text-slate-400 uppercase mb-2 flex items-center gap-2"><Lightbulb size={14} /> Why do we use it?</h6>
             <p className="text-slate-700 text-sm leading-relaxed">{aiRes.usage}</p>
          </div>
          <div className="bg-emerald-50 p-5 rounded-2xl border border-emerald-100">
             <h6 className="text-xs font-bold text-emerald-700 uppercase mb-2 flex items-center gap-2"><Zap size={14} /> Fun Fact</h6>
             <p className="text-emerald-900/80 text-sm italic font-medium">"{aiRes.funFact}"</p>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="max-w-4xl mx-auto h-full flex flex-col">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-slate-800 mb-2">Instant Student Q&A</h2>
        <p className="text-slate-600">Complex topics explained with simple analogies and the power of AI.</p>
      </div>

      <div className="flex-1 bg-white rounded-2xl border border-slate-200 overflow-hidden flex flex-col shadow-sm min-h-0">
        <div className="flex-1 overflow-y-auto p-6 space-y-8 bg-slate-50/20">
          {messages.length === 0 && (
            <div className="h-full flex flex-col items-center justify-center text-center px-10">
              <div className="w-24 h-24 bg-blue-50 rounded-full flex items-center justify-center mb-6">
                <Sparkles className="text-blue-500" size={48} />
              </div>
              <h3 className="text-2xl font-bold text-slate-800 mb-2">What shall we learn today?</h3>
              <p className="text-slate-500 max-w-sm">Ask anything from algebra to anatomy and get a rich, structured explanation for your students.</p>
            </div>
          )}

          {messages.map((msg, i) => (
            <div key={i} className={`flex gap-4 ${msg.role === 'ai' ? 'animate-in fade-in slide-in-from-bottom-2 duration-500' : ''}`}>
              <div className="flex-shrink-0">
                {msg.role === 'user' ? (
                  <div className="w-10 h-10 bg-slate-200 rounded-full flex items-center justify-center shadow-sm">
                    <UserCircle className="text-slate-500" size={24} />
                  </div>
                ) : (
                  <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white shadow-md">
                    <Sparkles size={20} />
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className={`p-6 rounded-2xl ${msg.role === 'user' ? 'bg-white border border-slate-200 text-slate-800' : 'bg-white border border-blue-100 shadow-sm'}`}>
                  {renderMessageContent(msg)}
                </div>
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex gap-4 animate-pulse">
              <div className="w-10 h-10 bg-blue-400 rounded-full flex items-center justify-center text-white">
                <Loader2 className="animate-spin" size={20} />
              </div>
              <div className="flex-1 space-y-3 bg-white p-6 rounded-2xl border border-slate-100">
                <div className="h-4 bg-slate-200 rounded w-1/4"></div>
                <div className="h-4 bg-slate-200 rounded w-full"></div>
                <div className="h-4 bg-slate-200 rounded w-5/6"></div>
              </div>
            </div>
          )}
        </div>

        <div className="p-4 border-t bg-white">
          <div className="relative max-w-3xl mx-auto">
            <input 
              type="text"
              placeholder="Ask a student's question (e.g., What is algebra?)"
              className="w-full pl-6 pr-14 py-5 rounded-2xl border border-slate-300 focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all shadow-sm text-lg"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            />
            <button 
              onClick={handleSend}
              disabled={loading || !input.trim()}
              className="absolute right-2 top-2 bottom-2 w-14 bg-blue-600 text-white rounded-xl flex items-center justify-center hover:bg-blue-700 disabled:opacity-50 transition-all shadow-md active:scale-95"
            >
              <Send size={24} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default KnowledgeBase;
