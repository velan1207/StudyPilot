
import React, { useState } from 'react';
import { ImageIcon, Search, Loader2, Download, Eraser, Lightbulb, Pencil, Palette, Sun } from 'lucide-react';
import { generateVisualAid } from '../services/geminiService';
import { TeacherContext } from '../types';

const VisualAids: React.FC<{ context: TeacherContext }> = ({ context }) => {
  const [topic, setTopic] = useState('');
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [usageTips, setUsageTips] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [isColor, setIsColor] = useState(false);
  const [generatedInColor, setGeneratedInColor] = useState(false);

  const handleGenerate = async () => {
    if (!topic.trim()) return;
    setLoading(true);
    setImageUrl(null);
    setUsageTips('');
    try {
      const { imageUrl: url, tips } = await generateVisualAid(topic, isColor);
      setImageUrl(url);
      setUsageTips(tips);
      setGeneratedInColor(isColor);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-slate-800 mb-2">Visual Aid Generator</h2>
        <p className="text-slate-600">Create accurate diagrams for your students. Choose between chalk-style line art or colorful illustrations.</p>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 p-6 mb-8 shadow-sm">
        <div className="flex flex-col gap-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                <ImageIcon size={20} />
              </div>
              <input 
                type="text"
                placeholder="Enter topic (e.g., Human Heart, Solar System, Water Cycle)"
                className="w-full pl-12 pr-4 py-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleGenerate()}
              />
            </div>
            <button 
              onClick={handleGenerate}
              disabled={loading || !topic}
              className="bg-blue-600 text-white px-8 py-3 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-blue-700 disabled:opacity-50 transition-all shadow-sm"
            >
              {loading ? <Loader2 className="animate-spin" size={20} /> : <Search size={20} />}
              Generate
            </button>
          </div>

          <div className="flex items-center gap-4">
            <span className="text-sm font-semibold text-slate-600">Visual Style:</span>
            <div className="flex bg-slate-100 p-1 rounded-lg">
              <button 
                onClick={() => setIsColor(false)}
                className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${!isColor ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
              >
                <Eraser size={16} />
                Blackboard Style
              </button>
              <button 
                onClick={() => setIsColor(true)}
                className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${isColor ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
              >
                <Palette size={16} />
                Colorful Illustration
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Output Area */}
        <div className="space-y-6">
          <div className={`rounded-3xl aspect-square relative flex items-center justify-center overflow-hidden border-8 shadow-2xl transition-colors duration-500 ${generatedInColor ? 'bg-white border-slate-100' : 'bg-slate-900 border-slate-800'}`}>
            {/* Blackboard effect (only if not in color) */}
            {!generatedInColor && (
              <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/black-felt.png')] opacity-50"></div>
            )}
            
            {loading ? (
              <div className="z-10 text-center">
                <Loader2 className={`animate-spin mb-4 mx-auto ${generatedInColor ? 'text-blue-500' : 'text-white'}`} size={48} />
                <p className={generatedInColor ? 'text-slate-500' : 'text-slate-300'}>Creating accurate diagram...</p>
              </div>
            ) : imageUrl ? (
              <img 
                src={imageUrl} 
                alt="Educational Aid" 
                className={`max-w-[85%] max-h-[85%] object-contain relative z-10 transition-all duration-700 ${!generatedInColor ? 'filter invert grayscale contrast-200' : 'drop-shadow-xl'}`} 
              />
            ) : (
              <div className="text-center z-10 px-8">
                <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 border ${generatedInColor ? 'bg-slate-50 border-slate-200' : 'bg-slate-800 border-slate-700'}`}>
                  {isColor ? <Sun className="text-slate-300" size={24} /> : <Eraser className="text-slate-500" size={24} />}
                </div>
                <p className="text-slate-500 font-medium">Ready to visualize. Enter a topic and click generate.</p>
              </div>
            )}

            {imageUrl && !loading && (
              <div className="absolute bottom-4 right-4 flex gap-2 z-20">
                <button 
                  onClick={() => {
                    const link = document.createElement('a');
                    link.href = imageUrl;
                    link.download = `${topic.replace(/\s+/g, '_')}_aid.png`;
                    link.click();
                  }} 
                  className={`p-3 rounded-full backdrop-blur-md transition-colors shadow-lg ${generatedInColor ? 'bg-slate-100/80 hover:bg-slate-200 text-slate-700' : 'bg-white/10 hover:bg-white/20 text-white'}`}
                  title="Download Image"
                >
                  <Download size={20} />
                </button>
              </div>
            )}
          </div>

          {/* Dynamic Usage Tips for the generated aid */}
          {usageTips && !loading && (
            <div className="bg-blue-50 rounded-2xl p-6 border border-blue-100 shadow-sm animate-in fade-in slide-in-from-top-2 duration-500">
              <div className="flex items-center gap-2 mb-3 text-blue-700">
                <Lightbulb size={20} />
                <h4 className="font-bold text-sm uppercase tracking-wide">Teaching Tips</h4>
              </div>
              <div className="text-blue-900/90 text-sm leading-relaxed whitespace-pre-wrap font-medium italic">
                {usageTips}
              </div>
            </div>
          )}
        </div>

        {/* Accuracy Guidelines Sidebar */}
        <div className="space-y-6">
          <div className="bg-slate-50 rounded-2xl p-6 border border-slate-200">
            <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
              <Pencil className="text-blue-600" size={20} />
              Educational Accuracy
            </h3>
            <ul className="space-y-4">
              <li className="flex gap-3">
                <div className="bg-white w-6 h-6 rounded flex items-center justify-center shrink-0 shadow-sm text-xs font-bold border">1</div>
                <p className="text-sm text-slate-600">Our AI is instructed to follow standard scientific models (e.g., 8 planets for the solar system).</p>
              </li>
              <li className="flex gap-3">
                <div className="bg-white w-6 h-6 rounded flex items-center justify-center shrink-0 shadow-sm text-xs font-bold border">2</div>
                <p className="text-sm text-slate-600">Use "Colorful Illustration" for complex diagrams like anatomy where color differentiation helps learning.</p>
              </li>
              <li className="flex gap-3">
                <div className="bg-white w-6 h-6 rounded flex items-center justify-center shrink-0 shadow-sm text-xs font-bold border">3</div>
                <p className="text-sm text-slate-600">Use "Blackboard Style" for simple concepts you intend to redraw chalk-on-board.</p>
              </li>
            </ul>
          </div>

          <div className="bg-emerald-50 p-6 rounded-2xl border border-emerald-100">
            <div className="flex items-center gap-2 mb-2 text-emerald-800">
              <Palette size={18} />
              <p className="font-bold text-sm">Pro Tip: Visual Learning</p>
            </div>
            <p className="text-sm text-emerald-800/80 leading-relaxed italic">
              "Visual aids can improve learning retention by up to 400%. For multi-grade classrooms, use colorful versions for younger students to grab attention, and blackboard outlines for older students to copy and label."
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VisualAids;
