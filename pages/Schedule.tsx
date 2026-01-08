
import React, { useState, useEffect } from 'react';
import { 
  Calendar as CalendarIcon, 
  ChevronLeft, 
  ChevronRight, 
  CheckCircle2, 
  BookOpen, 
  MoreVertical,
  Plus,
  Target,
  AlertCircle,
  X,
  Edit3,
  Loader2,
  Save
} from 'lucide-react';
import { TeacherContext } from '../types';
import { auth, db } from '../firebase';
import { doc, getDoc, setDoc, onSnapshot } from 'firebase/firestore';

interface ScheduledEvent {
  id: number;
  time: string;
  topic: string;
  duration: string;
  type: string;
  status: string;
  grade: string;
}

const AddEventModal = ({ isOpen, onClose, onAdd }: { isOpen: boolean, onClose: () => void, onAdd: (e: Omit<ScheduledEvent, 'id' | 'status'>) => void }) => {
  const [formData, setFormData] = useState({
    time: '09:00',
    topic: '',
    duration: '45 mins',
    type: 'Main Lesson',
    grade: 'Grade 5'
  });

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[150] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-[2rem] md:rounded-[2.5rem] w-full max-w-lg overflow-hidden flex flex-col shadow-2xl animate-in zoom-in-95 duration-300">
        <div className="p-6 md:p-8 border-b bg-slate-50 flex items-center justify-between">
          <div className="flex items-center gap-3 md:gap-4">
            <div className="w-10 h-10 md:w-12 md:h-12 bg-[#4FB5C0] text-white rounded-xl md:rounded-2xl flex items-center justify-center shadow-lg"><Plus size={20} /></div>
            <div>
              <h3 className="text-lg md:text-xl font-black text-slate-800 uppercase tracking-tight">Add Event</h3>
              <p className="text-[10px] font-bold text-slate-400">Plan your agenda</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 transition-colors"><X size={24} /></button>
        </div>
        <div className="p-6 md:p-10 space-y-5 md:space-y-6">
          <div className="space-y-1">
            <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest px-2">Topic / Activity Name</label>
            <input 
              className="w-full bg-slate-50 border-none rounded-xl md:rounded-2xl px-5 md:px-6 py-3 md:py-4 font-bold text-slate-800 outline-none focus:ring-2 ring-[#4FB5C0]"
              value={formData.topic}
              onChange={e => setFormData({...formData, topic: e.target.value})}
              placeholder="e.g. Intro to Algebra"
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest px-2">Start Time</label>
              <input className="w-full bg-slate-50 border-none rounded-xl md:rounded-2xl px-5 py-3 md:py-4 font-bold outline-none" type="time" value={formData.time} onChange={e => setFormData({...formData, time: e.target.value})} />
            </div>
            <div className="space-y-1">
              <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest px-2">Duration</label>
              <select className="w-full bg-slate-50 border-none rounded-xl md:rounded-2xl px-5 py-3 md:py-4 font-bold outline-none" value={formData.duration} onChange={e => setFormData({...formData, duration: e.target.value})}>
                <option>30 mins</option>
                <option>45 mins</option>
                <option>60 mins</option>
                <option>90 mins</option>
              </select>
            </div>
          </div>
        </div>
        <div className="p-6 md:p-8 border-t bg-slate-50 flex gap-4">
          <button onClick={onClose} className="flex-1 py-3 md:py-4 font-black text-slate-400 uppercase text-[9px] md:text-[10px] tracking-[0.2em]">Cancel</button>
          <button 
            disabled={!formData.topic}
            onClick={() => onAdd(formData)} 
            className="flex-1 py-3 md:py-4 bg-[#4FB5C0] text-white rounded-xl md:rounded-2xl font-black shadow-xl hover:scale-105 transition-all active:scale-95 uppercase text-[9px] md:text-[10px] tracking-[0.2em] disabled:opacity-50"
          >
            Add to Agenda
          </button>
        </div>
      </div>
    </div>
  );
};

const Schedule: React.FC<{ context: TeacherContext }> = ({ context }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [completedSessions, setCompletedSessions] = useState<Set<number>>(new Set());
  const [showAddModal, setShowAddModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  
  const [sessions, setSessions] = useState<ScheduledEvent[]>([]);
  const [timetableData, setTimetableData] = useState<Record<string, Record<string, string>>>({});

  const timeSlots = ["09:00", "10:00", "11:00", "12:00", "13:00", "14:00", "15:00"];
  const weekDays = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
  const daysHeader = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

  useEffect(() => {
    const user = auth.currentUser;
    if (!user) return;

    const unsub = onSnapshot(doc(db, "users", user.uid, "planner", "timetable"), (doc) => {
      if (doc.exists()) {
        const data = doc.data();
        setTimetableData(data.grid || {});
        setSessions(data.sessions || []);
      }
      setLoading(false);
    });

    return () => unsub();
  }, []);

  const saveToFirebase = async (newGrid?: any, newSessions?: any) => {
    const user = auth.currentUser;
    if (!user) return;
    setSaving(true);
    try {
      await setDoc(doc(db, "users", user.uid, "planner", "timetable"), {
        grid: newGrid || timetableData,
        sessions: newSessions || sessions,
        updatedAt: new Date().toISOString()
      }, { merge: true });
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  const toggleComplete = (id: number) => {
    const newSet = new Set(completedSessions);
    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);
    setCompletedSessions(newSet);
  };

  const handleAddEvent = (event: Omit<ScheduledEvent, 'id' | 'status'>) => {
    const newSessions = [...sessions, { ...event, id: Date.now(), status: 'Upcoming' }];
    setSessions(newSessions);
    saveToFirebase(timetableData, newSessions);
    setShowAddModal(false);
  };

  const updateTimetable = (day: string, slot: string, value: string) => {
    const newGrid = {
      ...timetableData,
      [day]: { ...(timetableData[day] || {}), [slot]: value }
    };
    setTimetableData(newGrid);
    saveToFirebase(newGrid, sessions);
  };

  // Calendar Logic
  const getDaysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
  const getFirstDayOfMonth = (year: number, month: number) => new Date(year, month, 1).getDay();

  const daysInMonth = getDaysInMonth(currentDate.getFullYear(), currentDate.getMonth());
  const firstDay = getFirstDayOfMonth(currentDate.getFullYear(), currentDate.getMonth());
  const today = new Date();
  const isToday = (day: number) => 
    day === today.getDate() && 
    currentDate.getMonth() === today.getMonth() && 
    currentDate.getFullYear() === today.getFullYear();

  const prevMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));

  if (loading) return (
    <div className="h-[60vh] flex flex-col items-center justify-center gap-4">
      <Loader2 className="animate-spin text-[#4FB5C0]" size={32} />
      <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Syncing Schedule</p>
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto space-y-8 md:space-y-12 animate-in fade-in duration-700 pb-10 md:pb-20 px-4 md:px-0">
      <AddEventModal isOpen={showAddModal} onClose={() => setShowAddModal(false)} onAdd={handleAddEvent} />
      
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 md:gap-10">
        <div className="lg:col-span-4 space-y-6 md:space-y-8">
          <div className="bg-white rounded-[1.5rem] md:rounded-[2.5rem] border border-slate-100 shadow-sm p-6 md:p-8 space-y-6 md:space-y-8">
            <div className="flex items-center justify-between">
              <h3 className="text-lg md:text-xl font-black text-slate-800 tracking-tight uppercase">
                {months[currentDate.getMonth()]} {currentDate.getFullYear()}
              </h3>
              <div className="flex gap-2">
                <button onClick={prevMonth} className="p-2 hover:bg-slate-50 rounded-lg text-slate-400 transition-colors"><ChevronLeft size={18} /></button>
                <button onClick={nextMonth} className="p-2 hover:bg-slate-50 rounded-lg text-slate-400 transition-colors"><ChevronRight size={18} /></button>
              </div>
            </div>

            <div className="grid grid-cols-7 gap-1 md:gap-2 text-center">
              {daysHeader.map(day => (
                <span key={day} className="text-[8px] md:text-[10px] font-black text-slate-300 uppercase tracking-widest">{day}</span>
              ))}
              {/* Empty cells for previous month */}
              {Array.from({ length: firstDay }).map((_, i) => (
                <div key={`empty-${i}`} className="aspect-square"></div>
              ))}
              {/* Actual days */}
              {Array.from({ length: daysInMonth }).map((_, i) => {
                const day = i + 1;
                return (
                  <button 
                    key={day} 
                    className={`aspect-square flex items-center justify-center rounded-xl md:rounded-2xl text-[10px] md:text-xs font-black transition-all ${
                      isToday(day)
                      ? 'bg-[#4FB5C0] text-white shadow-lg shadow-[#4FB5C0]/30' 
                      : 'text-slate-500 hover:bg-slate-50'
                    }`}
                  >
                    {day}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <div className="lg:col-span-8 space-y-6 md:space-y-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-3xl md:text-4xl font-black text-slate-800 tracking-tighter uppercase leading-none">Agenda</h2>
              <div className="flex items-center gap-2 mt-1">
                <p className="text-[#4FB5C0] font-black uppercase text-[9px] tracking-[0.2em]">
                  {today.toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' })}
                </p>
                {saving && <Loader2 size={10} className="animate-spin text-slate-300" />}
              </div>
            </div>
            <button 
              onClick={() => setShowAddModal(true)}
              className="w-full sm:w-auto flex items-center justify-center gap-3 px-6 py-3 bg-[#E6F4F5] text-[#4FB5C0] rounded-xl font-black text-xs uppercase tracking-widest hover:bg-[#4FB5C0] hover:text-white transition-all shadow-sm active:scale-95"
            >
              <Plus size={18} /> Add Event
            </button>
          </div>

          <div className="space-y-4 max-h-[500px] overflow-y-auto pr-1 md:pr-2 scrollbar-hide">
            {sessions.length === 0 ? (
              <div className="text-center py-20 bg-slate-50 rounded-[1.5rem] border-2 border-dashed border-slate-200">
                <p className="text-slate-400 font-black uppercase text-[10px] tracking-widest">No events scheduled</p>
              </div>
            ) : sessions.map((session) => (
              <div 
                key={session.id} 
                className={`bg-white rounded-[1.5rem] md:rounded-[2rem] p-5 md:p-6 border transition-all flex flex-col xs:flex-row items-start xs:items-center gap-4 md:gap-6 group ${
                  completedSessions.has(session.id) ? 'border-emerald-100 opacity-60' : 'border-slate-100 hover:border-[#4FB5C0]/30 hover:shadow-lg'
                }`}
              >
                <div className="w-full xs:w-20 shrink-0 text-left xs:text-center border-b xs:border-b-0 xs:border-r border-slate-50 pb-2 xs:pb-0">
                  <p className="text-sm font-black text-slate-800 leading-none">{session.time}</p>
                  <p className="text-[9px] font-bold text-slate-400 uppercase mt-1">{session.duration}</p>
                </div>
                <div className="flex-1 min-w-0">
                  <h5 className={`text-base md:text-lg font-black tracking-tight truncate ${completedSessions.has(session.id) ? 'line-through text-slate-400' : 'text-slate-800'}`}>
                    {session.topic}
                  </h5>
                </div>
                <div className="flex items-center gap-2 self-end xs:self-center">
                  <button onClick={() => toggleComplete(session.id)} className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all ${completedSessions.has(session.id) ? 'bg-emerald-500 text-white' : 'bg-slate-50 text-slate-300 hover:text-emerald-500'}`}>
                    <CheckCircle2 size={18} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <section className="bg-white rounded-[1.5rem] md:rounded-[3rem] border border-slate-100 shadow-sm p-6 md:p-10 space-y-6 md:space-y-8 overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <h3 className="text-2xl md:text-3xl font-black text-slate-800 tracking-tighter uppercase leading-none">Weekly Timetable</h3>
            <p className="text-[9px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest">Saved to Cloud</p>
          </div>
          <div className="flex items-center gap-2 text-emerald-500 font-black text-[9px] uppercase tracking-widest bg-emerald-50 px-4 py-2 rounded-xl border border-emerald-100 self-start sm:self-center">
            {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />} {saving ? 'Saving...' : 'Synced'}
          </div>
        </div>

        <div className="overflow-x-auto rounded-2xl md:rounded-3xl border border-slate-50 scrollbar-hide">
          <table className="w-full text-left border-collapse min-w-[800px]">
            <thead>
              <tr className="bg-slate-50">
                <th className="p-4 md:p-6 text-[9px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">Time</th>
                {weekDays.map(day => (
                  <th key={day} className="p-4 md:p-6 text-[9px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">{day}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {timeSlots.map(slot => (
                <tr key={slot} className="hover:bg-slate-50 transition-colors">
                  <td className="p-4 md:p-6 font-black text-slate-800 text-xs md:text-sm border-b border-slate-50">{slot}</td>
                  {weekDays.map(day => (
                    <td key={`${day}-${slot}`} className="p-1.5 md:p-2 border-b border-slate-50">
                      <input 
                        type="text"
                        value={timetableData[day]?.[slot] || ''}
                        placeholder="—"
                        onChange={(e) => updateTimetable(day, slot, e.target.value)}
                        className={`w-full p-3 md:p-4 rounded-xl md:rounded-2xl text-[11px] md:text-xs font-black transition-all outline-none border-2 border-transparent focus:border-[#4FB5C0] focus:bg-white ${
                          timetableData[day]?.[slot] 
                          ? 'bg-indigo-50/50 text-indigo-600' 
                          : 'bg-transparent text-slate-300'
                        }`}
                      />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
};

export default Schedule;
