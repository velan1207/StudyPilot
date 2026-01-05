
import React, { useState, useRef } from 'react';
import { Upload, Loader2, FileText, X, ImageIcon, Printer, Sparkles } from 'lucide-react';
import { analyzeTextbookImage } from '../services/geminiService';
import { TeacherContext } from '../types';

interface StructuredWorksheet {
  title: string;
  instructions: string;
  sections: {
    title: string;
    subInstructions?: string;
    questions: {
      text: string;
      options?: string[];
      type: string;
    }[];
  }[];
}

const WorksheetGen: React.FC<{ context: TeacherContext }> = ({ context }) => {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [worksheet, setWorksheet] = useState<StructuredWorksheet | null>(null);
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setSelectedImage(reader.result as string);
        setWorksheet(null);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleGenerate = async () => {
    if (!selectedImage) return;
    setLoading(true);
    try {
      const base64 = selectedImage.split(',')[1];
      const result = await analyzeTextbookImage(base64, context.grade, context.language);
      setWorksheet(result);
    } catch (err) {
      console.error(err);
      alert('Error analyzing image. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="max-w-6xl mx-auto pb-12">
      <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 mb-2">Smart Worksheet Generator</h2>
          <p className="text-slate-600">Snap a photo of any textbook page to create interactive worksheets instantly.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start mb-8 no-print">
        {/* Upload Section */}
        <div className="space-y-6">
          <div 
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-3xl p-8 flex flex-col items-center justify-center cursor-pointer transition-all h-[300px] ${
              selectedImage ? 'border-blue-400 bg-blue-50' : 'border-slate-300 hover:border-blue-400 hover:bg-slate-50'
            }`}
          >
            {selectedImage ? (
              <div className="relative w-full h-full rounded-2xl overflow-hidden border shadow-lg">
                <img src={selectedImage} alt="Preview" className="w-full h-full object-cover" />
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedImage(null);
                    setWorksheet(null);
                  }}
                  className="absolute top-3 right-3 bg-white/90 backdrop-blur-md text-red-500 p-2 rounded-full hover:bg-red-50 shadow-md transition-colors"
                >
                  <X size={20} />
                </button>
              </div>
            ) : (
              <div className="text-center">
                <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-6 text-slate-400">
                  <Upload size={40} />
                </div>
                <p className="font-bold text-lg text-slate-700">Tap to Upload Image</p>
                <p className="text-slate-500">Snap a clear photo of the textbook page</p>
              </div>
            )}
            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handleImageUpload} 
              className="hidden" 
              accept="image/*" 
            />
          </div>
        </div>

        <div className="flex items-center justify-center h-[300px]">
          <div className="bg-blue-50 p-8 rounded-3xl border border-blue-100 text-center max-w-sm">
             <div className="bg-blue-600 w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-4 text-white">
                <Sparkles size={24} />
             </div>
             <h4 className="font-bold text-blue-900 mb-2">Ready to convert?</h4>
             <p className="text-blue-700/70 text-sm leading-relaxed">AI will identify the core concepts and draft 5 specialized questions for your students.</p>
          </div>
        </div>
      </div>

      <div className="space-y-6">
        <button 
          onClick={handleGenerate}
          disabled={loading || !selectedImage}
          className="w-full bg-blue-600 text-white py-5 rounded-2xl font-bold flex items-center justify-center gap-3 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-xl hover:shadow-2xl hover:-translate-y-1 no-print"
        >
          {loading ? <Loader2 className="animate-spin" size={24} /> : <Sparkles size={24} />}
          Generate Clean Worksheet
        </button>

        {/* Results Section */}
        <div id="printable-worksheet" className="bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden flex flex-col min-h-[600px] print:shadow-none print:border-none print:rounded-none">
          <div className="bg-slate-50 border-b px-6 py-4 flex justify-between items-center no-print">
            <div className="flex items-center gap-2 text-slate-500 font-bold text-xs uppercase tracking-widest">
              <ImageIcon size={16} />
              AI Worksheet Output
            </div>
            {worksheet && (
              <button 
                onClick={handlePrint} 
                className="p-2 text-slate-500 hover:text-blue-600 transition-colors bg-white rounded-lg border border-slate-200 shadow-sm flex items-center gap-2 px-3"
                title="Print Worksheet"
              >
                <Printer size={18} />
                <span className="text-xs font-bold uppercase tracking-wide">Print</span>
              </button>
            )}
          </div>
          
          <div className="p-8 md:p-12 flex-1">
            {loading ? (
              <div className="h-full flex flex-col items-center justify-center space-y-6 py-20">
                <div className="w-20 h-20 border-4 border-blue-100 border-t-blue-600 rounded-full animate-spin"></div>
                <div className="text-center">
                  <p className="text-slate-800 font-bold text-lg">Analyzing Textbook Page</p>
                  <p className="text-slate-500">Identifying concepts and crafting questions...</p>
                </div>
              </div>
            ) : worksheet ? (
              <div className="animate-in fade-in slide-in-from-bottom-4 duration-700 print:animate-none">
                <div className="flex justify-between items-start mb-12 border-b-2 border-slate-100 pb-8">
                  <div className="flex-1 pr-8">
                    <h3 className="text-3xl font-black text-slate-900 mb-2">{worksheet.title}</h3>
                    <p className="text-slate-500 font-medium italic">{worksheet.instructions}</p>
                  </div>
                  <div className="text-right space-y-3 shrink-0">
                    <div className="text-sm font-bold text-slate-400 flex items-center justify-end gap-2">
                      Name: <span className="border-b-2 border-slate-200 w-48 h-5"></span>
                    </div>
                    <div className="text-sm font-bold text-slate-400 flex items-center justify-end gap-2">
                      Date: <span className="border-b-2 border-slate-200 w-48 h-5"></span>
                    </div>
                  </div>
                </div>

                <div className="space-y-12">
                  {worksheet.sections.map((section, sIdx) => (
                    <div key={sIdx} className="space-y-6">
                      <div className="bg-slate-50 -mx-12 px-12 py-3 border-y border-slate-100 mb-4 print:bg-slate-50 print:border-slate-200">
                        <h4 className="font-black text-lg text-slate-800 uppercase tracking-wide">{section.title}</h4>
                        {section.subInstructions && <p className="text-sm text-slate-500 font-medium">{section.subInstructions}</p>}
                      </div>
                      
                      <div className="space-y-10">
                        {section.questions.map((q, qIdx) => (
                          <div key={qIdx} className="space-y-4">
                            <p className="text-lg font-bold text-slate-800 flex gap-3">
                              <span className="text-blue-600">{qIdx + 1}.</span> {q.text}
                            </p>
                            
                            {q.options ? (
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 ml-8">
                                {q.options.map((opt, oIdx) => (
                                  <div key={oIdx} className="flex items-center gap-3 text-slate-600 font-medium">
                                    <div className="w-8 h-8 rounded-full border-2 border-slate-200 flex items-center justify-center text-xs font-bold text-slate-400 uppercase shrink-0">
                                      {String.fromCharCode(65 + oIdx)}
                                    </div>
                                    <span className="text-base">{opt}</span>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <div className="ml-8 space-y-4 pt-2">
                                <div className="border-b-2 border-slate-100 h-8 w-full"></div>
                                <div className="border-b-2 border-slate-100 h-8 w-full"></div>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center px-10 py-20">
                <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center mb-6 text-slate-200">
                  <FileText size={48} />
                </div>
                <h4 className="text-xl font-bold text-slate-800 mb-2">No Content Yet</h4>
                <p className="text-slate-400 leading-relaxed max-w-md">Your professional, clean worksheet will appear here after AI analysis. Ready to print and hand out to students.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default WorksheetGen;