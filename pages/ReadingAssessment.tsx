
import React, { useState, useRef, useEffect } from 'react';
import { 
  Mic, 
  Square, 
  Loader2, 
  Play, 
  CheckCircle2, 
  Volume2, 
  RotateCcw, 
  Trophy, 
  Target, 
  MessageSquare,
  BookOpen,
  ArrowRight
} from 'lucide-react';
import { 
  assessReading, 
  getDemonstrationAudio, 
  decodeBase64, 
  decodePCMToAudioBuffer 
} from '../services/geminiService';
import { TeacherContext, ReadingAssessmentResult, GRADE_TEXTS } from '../types';

const ScoreCard = ({ label, score, icon: Icon, color }: { label: string, score: number, icon: any, color: string }) => (
  <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
    <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-white ${color}`}>
      <Icon size={24} />
    </div>
    <div className="flex-1">
      <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">{label}</p>
      <div className="flex items-end gap-2">
        <span className="text-2xl font-bold text-slate-800">{score}</span>
        <span className="text-slate-400 text-sm mb-1">/ 100</span>
      </div>
      <div className="w-full h-1.5 bg-slate-100 rounded-full mt-2 overflow-hidden">
        <div 
          className={`h-full transition-all duration-1000 ${color}`} 
          style={{ width: `${score}%` }}
        />
      </div>
    </div>
  </div>
);

const ReadingAssessment: React.FC<{ context: TeacherContext }> = ({ context }) => {
  const [expectedText, setExpectedText] = useState(GRADE_TEXTS[context.grade][context.language] || '');
  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [assessment, setAssessment] = useState<ReadingAssessmentResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [demoLoading, setDemoLoading] = useState(false);
  const [playbackUrl, setPlaybackUrl] = useState<string | null>(null);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const audioContextRef = useRef<AudioContext | null>(null);
  const visualizerCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const playbackAudioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    setExpectedText(GRADE_TEXTS[context.grade][context.language] || '');
    setAssessment(null);
    setAudioBlob(null);
    if (playbackUrl) {
      URL.revokeObjectURL(playbackUrl);
      setPlaybackUrl(null);
    }
  }, [context.grade, context.language]);

  const startVisualizer = (stream: MediaStream) => {
    if (!visualizerCanvasRef.current) return;
    
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const source = audioContext.createMediaStreamSource(stream);
    const analyser = audioContext.createAnalyser();
    analyser.fftSize = 256;
    source.connect(analyser);
    
    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    const canvas = visualizerCanvasRef.current;
    const ctx = canvas.getContext('2d')!;
    
    const draw = () => {
      animationFrameRef.current = requestAnimationFrame(draw);
      analyser.getByteFrequencyData(dataArray);
      
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const barWidth = (canvas.width / bufferLength) * 2.5;
      let x = 0;
      
      for (let i = 0; i < bufferLength; i++) {
        const barHeight = (dataArray[i] / 255) * canvas.height;
        ctx.fillStyle = `rgb(59, 130, 246)`;
        ctx.fillRect(x, canvas.height - barHeight, barWidth, barHeight);
        x += barWidth + 1;
      }
    };
    
    draw();
    audioContextRef.current = audioContext;
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mimeType = MediaRecorder.isTypeSupported('audio/webm') 
        ? 'audio/webm' 
        : MediaRecorder.isTypeSupported('audio/mp4') 
          ? 'audio/mp4' 
          : 'audio/wav';

      const mediaRecorder = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: mimeType });
        const url = URL.createObjectURL(blob);
        setAudioBlob(blob);
        setPlaybackUrl(url);
      };

      mediaRecorder.start();
      startVisualizer(stream);
      setIsRecording(true);
      setAssessment(null);
      if (playbackUrl) URL.revokeObjectURL(playbackUrl);
      setPlaybackUrl(null);
    } catch (err) {
      console.error("Error accessing microphone:", err);
      alert("Microphone access is required for this feature.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
      if (audioContextRef.current) audioContextRef.current.close();
    }
  };

  const playRecordedAudio = async () => {
    if (playbackUrl && playbackAudioRef.current) {
      try {
        playbackAudioRef.current.src = playbackUrl;
        playbackAudioRef.current.load(); // Explicitly load for better browser compatibility
        await playbackAudioRef.current.play();
      } catch (e) {
        console.error("Playback error:", e);
        // Fallback: try new Audio() directly
        const tempAudio = new Audio(playbackUrl);
        tempAudio.play().catch(err => console.error("Final playback fallback failed:", err));
      }
    }
  };

  const playDemo = async () => {
    if (!expectedText) return;
    setDemoLoading(true);
    try {
      const pcmBase64 = await getDemonstrationAudio(expectedText, context.language);
      if (pcmBase64) {
        const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
        
        // Critical for browsers that require a user-gesture to start audio context
        if (audioCtx.state === 'suspended') {
          await audioCtx.resume();
        }

        const pcmData = decodeBase64(pcmBase64);
        const buffer = await decodePCMToAudioBuffer(pcmData, audioCtx, 24000, 1);
        const source = audioCtx.createBufferSource();
        source.buffer = buffer;
        source.connect(audioCtx.destination);
        
        source.onended = () => {
          audioCtx.close();
        };

        source.start(0);
      }
    } catch (err) {
      console.error("TTS Playback Error:", err);
      alert("Teacher demonstration failed. Please try again.");
    } finally {
      setDemoLoading(false);
    }
  };

  const handleAssessment = async () => {
    if (!audioBlob || !expectedText) return;
    setLoading(true);
    try {
      const reader = new FileReader();
      reader.readAsDataURL(audioBlob);
      reader.onloadend = async () => {
        const base64 = (reader.result as string).split(',')[1];
        const result = await assessReading(base64, expectedText);
        setAssessment(result);
        setLoading(false);
      };
    } catch (err) {
      console.error(err);
      setLoading(false);
      alert('Analysis failed. Please try recording again.');
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Ref-linked hidden audio element for recorded playback */}
      <audio ref={playbackAudioRef} className="hidden" />

      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-slate-800 mb-2">Reading Lab</h2>
          <p className="text-slate-600">Practice reading with AI-powered feedback and demonstrations.</p>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={() => { setAssessment(null); setAudioBlob(null); setPlaybackUrl(null); }}
            className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <RotateCcw size={16} /> Reset
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="bg-slate-50 px-6 py-4 border-b flex items-center justify-between">
              <div className="flex items-center gap-2 text-slate-700 font-bold">
                <BookOpen size={20} className="text-blue-500" />
                Reading Passage
              </div>
              <button 
                onClick={playDemo}
                disabled={demoLoading || !expectedText}
                className="flex items-center gap-2 text-sm font-bold text-blue-600 hover:bg-blue-50 px-3 py-1.5 rounded-lg transition-all"
              >
                {demoLoading ? <Loader2 className="animate-spin" size={16} /> : <Volume2 size={16} />}
                Listen to Teacher
              </button>
            </div>
            <div className="p-8">
              <textarea 
                className="w-full text-2xl font-medium text-slate-700 bg-transparent border-none focus:ring-0 resize-none min-h-[150px] leading-relaxed"
                value={expectedText}
                onChange={(e) => setExpectedText(e.target.value)}
                placeholder="Type the reading passage here..."
              />
            </div>
          </div>

          <div className="bg-blue-600 rounded-3xl p-8 text-white relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl pointer-events-none"></div>
            <div className="relative z-10 flex flex-col md:flex-row items-center gap-8">
              <div className="flex-shrink-0">
                {!isRecording ? (
                  <button onClick={startRecording} className="w-24 h-24 bg-white text-blue-600 rounded-full flex items-center justify-center shadow-xl hover:scale-110 transition-transform group">
                    <Mic size={40} className="group-active:scale-90 transition-transform" />
                  </button>
                ) : (
                  <button onClick={stopRecording} className="w-24 h-24 bg-red-500 text-white rounded-full flex items-center justify-center shadow-xl animate-pulse">
                    <Square size={32} fill="white" />
                  </button>
                )}
              </div>
              <div className="flex-1 text-center md:text-left space-y-2">
                <h3 className="text-2xl font-bold">{isRecording ? 'Listening...' : playbackUrl ? 'Reading Captured!' : 'Ready to start?'}</h3>
                <p className="text-blue-100">{isRecording ? 'Read clearly and take your time.' : playbackUrl ? 'Click "Analyze" to get feedback.' : 'Ask the student to click the microphone and read.'}</p>
                {isRecording && <canvas ref={visualizerCanvasRef} width={300} height={40} className="w-full h-10 mt-4 rounded-lg opacity-80" />}
                {playbackUrl && !isRecording && (
                  <div className="pt-4 flex flex-wrap gap-3">
                    <button 
                      onClick={playRecordedAudio} 
                      className="bg-white/20 hover:bg-white/30 text-white px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 shadow-sm transition-colors active:scale-95"
                    >
                      <Play size={16} /> Play My Reading
                    </button>
                    <button 
                      onClick={handleAssessment} 
                      disabled={loading} 
                      className="bg-emerald-500 hover:bg-emerald-600 text-white px-6 py-2 rounded-xl font-bold flex items-center gap-2 shadow-lg transition-transform active:scale-95"
                    >
                      {loading ? <Loader2 className="animate-spin" size={18} /> : <ArrowRight size={18} />} Analyze Now
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white rounded-3xl border border-slate-200 p-8 shadow-sm h-full flex flex-col min-h-[400px]">
            <h3 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2"><Trophy className="text-amber-500" size={24} /> Assessment Report</h3>
            {loading ? (
              <div className="flex-1 flex flex-col items-center justify-center space-y-6">
                <div className="relative">
                  <div className="w-20 h-20 border-4 border-blue-100 border-t-blue-600 rounded-full animate-spin"></div>
                  <Sparkles className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-blue-600" size={32} />
                </div>
                <div className="text-center">
                  <p className="font-bold text-slate-700">Analyzing Fluency</p>
                  <p className="text-sm text-slate-400">Evaluating pronunciation and speed...</p>
                </div>
              </div>
            ) : assessment ? (
              <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
                <div className="grid grid-cols-1 gap-4">
                  <ScoreCard label="Accuracy" score={assessment.accuracyScore} icon={Target} color="bg-emerald-500" />
                  <ScoreCard label="Fluency" score={assessment.fluencyScore} icon={Play} color="bg-blue-500" />
                </div>
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-slate-700 font-bold text-sm"><MessageSquare size={16} className="text-blue-500" /> Teacher's Feedback</div>
                  <p className="text-sm text-slate-600 leading-relaxed bg-blue-50 p-4 rounded-2xl border border-blue-100 italic">"{assessment.positiveFeedback}"</p>
                </div>
                {assessment.mispronouncedWords.length > 0 && (
                  <div className="space-y-2">
                    <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Practice these words:</div>
                    <div className="flex flex-wrap gap-2">
                      {assessment.mispronouncedWords.map((word, i) => (
                        <span key={i} className="px-3 py-1 bg-red-50 text-red-600 border border-red-100 rounded-full text-sm font-semibold">{word}</span>
                      ))}
                    </div>
                  </div>
                )}
                <div className="bg-amber-50 p-4 rounded-2xl border border-amber-100">
                  <div className="text-xs font-bold text-amber-700 uppercase tracking-wider mb-1">Improvement Tip</div>
                  <p className="text-sm text-amber-900/80">{assessment.improvementTips}</p>
                </div>
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-center px-4">
                <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-6"><Mic className="text-slate-200" size={40} /></div>
                <h4 className="font-bold text-slate-800 mb-2">No Record Yet</h4>
                <p className="text-sm text-slate-400">Record a student's reading to generate a detailed fluency report here.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const Sparkles = ({ className, size }: { className?: string, size?: number }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size || 24} height={size || 24} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/>
    <path d="M5 3v4"/><path d="M3 5h4"/><path d="M21 17v4"/><path d="M19 19h4"/>
  </svg>
);

export default ReadingAssessment;
