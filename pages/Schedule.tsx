
import React, { useState, useEffect, useRef } from 'react';
import { 
  ChevronLeft, 
  ChevronRight, 
  Plus, 
  X, 
  Loader2, 
  Trash2,
  Clock,
  Edit3,
  Check,
  CalendarDays,
  Lock,
  Timer,
  AlertTriangle,
  CheckCircle2
} from 'lucide-react';
import { TeacherContext } from '../types';
import { auth, db } from '../firebase';
import { doc, setDoc, onSnapshot } from 'firebase/firestore';
import { UI_STRINGS } from '../translations';

interface ScheduledEvent {
  id: number;
  time: string;
  endTime: string;
  topic: string;
  duration: string;
  status: 'Upcoming' | 'Completed';
}

const AddEventModal = ({ isOpen, onClose, onAdd, existingEvents, t }: any) => {
  const [topic, setTopic] = useState('');
  const [startHour, setStartHour] = useState('09');
  const [startMinute, setStartMinute] = useState('00');
  const [endHour, setEndHour] = useState('09');
  const [endMinute, setEndMinute] = useState('45');
  const [conflictError, setConflictError] = useState<string | null>(null);

  const hours = Array.from({ length: 24 }, (_, i) => i.toString().padStart(2, '0'));
  const minutes = Array.from({ length: 12 }, (_, i) => (i * 5).toString().padStart(2, '0'));

  const presets = [
    { label: '30m', value: 30 },
    { label: '45m', value: 45 },
    { label: '1h', value: 60 },
    { label: '2h', value: 120 },
  ];

  const applyPreset = (mins: number) => {
    const date = new Date();
    date.setHours(parseInt(startHour));
    date.setMinutes(parseInt(startMinute) + mins);
    setEndHour(date.getHours().toString().padStart(2, '0'));
    setEndMinute((Math.round(date.getMinutes() / 5) * 5 % 60).toString().padStart(2, '0'));
  };

  const startTimeStr = `${startHour}:${startMinute}`;
  const endTimeStr = `${endHour}:${endMinute}`;

  useEffect(() => {
    if (!isOpen) return;
    const startTotal = parseInt(startHour) * 60 + parseInt(startMinute);
    const endTotal = parseInt(endHour) * 60 + parseInt(endMinute);

    if (endTotal <= startTotal) {
      setConflictError("End time must be after start time");
      return;
    }

    const overlap = existingEvents.find((event: ScheduledEvent) => {
      const [eH, eM] = event.time.split(':').map(Number);
      const [eeH, eeM] = event.endTime.split(':').map(Number);
      const eStart = eH * 60 + eM;
      const eEnd = eeH * 60 + eeM;
      return startTotal < eEnd && endTotal > eStart;
    });

    if (overlap) {
      setConflictError(`Time overlaps with "${overlap.topic}"`);
    } else {
      setConflictError(null);
    }
  }, [startHour, startMinute, endHour, endMinute, existingEvents, isOpen]);

  if (!isOpen) return null;

  const durationMins = (parseInt(endHour) * 60 + parseInt(endMinute)) - (parseInt(startHour) * 60 + parseInt(startMinute));

  return (
    <div className="fixed inset-0 z-[300] bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-white rounded-[2.5rem] w-full max-w-md overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300 flex flex-col max-h-[95vh]">
        <div className="p-6 border-b bg-slate-50 flex items-center justify-between shrink-0">
          <h3 className="text-lg font-black text-slate-800 uppercase tracking-tight">{t.addActivity}</h3>
          <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full transition-colors"><X size={20} /></button>
        </div>
        
        <div className="p-6 space-y-5 overflow-y-auto custom-scrollbar">
          <div className="space-y-1">
            <label className="text-[10px] font-black uppercase text-slate-400 px-1">{t.activityName}</label>
            <input 
              autoFocus
              value={topic} 
              onChange={e => setTopic(e.target.value)} 
              className="w-full p-4 bg-slate-50 rounded-2xl font-bold outline-none border-2 border-transparent focus:border-violet-500 transition-all text-sm" 
              placeholder="e.g. Mathematics Session" 
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase text-slate-400 px-1">{t.startTime}</label>
              <div className="flex items-center gap-1 bg-slate-50 rounded-2xl p-1 border-2 border-transparent focus-within:border-violet-500 transition-all">
                <select value={startHour} onChange={e => setStartHour(e.target.value)} className="bg-transparent font-black text-center flex-1 py-3 outline-none appearance-none">
                  {hours.map(h => <option key={h} value={h}>{h}</option>)}
                </select>
                <span className="text-slate-300 font-black">:</span>
                <select value={startMinute} onChange={e => setStartMinute(e.target.value)} className="bg-transparent font-black text-center flex-1 py-3 outline-none appearance-none">
                  {minutes.map(m => <option key={m} value={m}>{m}</option>)}
                </select>
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase text-slate-400 px-1">{t.endTime}</label>
              <div className="flex items-center gap-1 bg-slate-50 rounded-2xl p-1 border-2 border-transparent focus-within:border-violet-500 transition-all">
                <select value={endHour} onChange={e => setEndHour(e.target.value)} className="bg-transparent font-black text-center flex-1 py-3 outline-none appearance-none">
                  {hours.map(h => <option key={h} value={h}>{h}</option>)}
                </select>
                <span className="text-slate-300 font-black">:</span>
                <select value={endMinute} onChange={e => setEndMinute(e.target.value)} className="bg-transparent font-black text-center flex-1 py-3 outline-none appearance-none">
                  {minutes.map(m => <option key={m} value={m}>{m}</option>)}
                </select>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase text-slate-400 px-1">{t.quickPresets}</label>
            <div className="flex flex-wrap gap-2">
              {presets.map(p => (
                <button
                  key={p.value}
                  onClick={() => applyPreset(p.value)}
                  className="px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest bg-white border-2 border-slate-100 text-slate-400 hover:border-violet-200 hover:text-violet-600 transition-all"
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          <div className="bg-violet-50 p-4 rounded-2xl flex items-center justify-between">
            <div className="flex items-center gap-2 text-violet-600 font-black text-[10px] uppercase">
              <Timer size={14} /> {t.totalDuration}
            </div>
            <div className="text-lg font-black text-violet-600">
              {durationMins > 0 ? `${durationMins} mins` : '--'}
            </div>
          </div>

          {conflictError && (
            <div className="bg-rose-50 border-2 border-rose-100 p-4 rounded-2xl flex items-start gap-3 animate-in shake duration-300">
              <AlertTriangle className="text-rose-500 shrink-0 mt-0.5" size={16} />
              <p className="text-[11px] font-bold text-rose-600 leading-tight">{conflictError}</p>
            </div>
          )}
        </div>

        <div className="p-6 bg-slate-50 border-t flex gap-4 shrink-0">
          <button onClick={onClose} className="flex-1 py-4 font-black uppercase text-[10px] text-slate-400 tracking-widest">{t.cancel}</button>
          <button 
            disabled={!topic || !!conflictError}
            onClick={() => { 
              onAdd({ 
                topic, 
                time: startTimeStr, 
                endTime: endTimeStr,
                duration: `${durationMins} mins` 
              }); 
              setTopic(''); 
            }} 
            className="flex-1 py-4 bg-violet-600 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-lg shadow-violet-200 disabled:opacity-50 transition-all active:scale-95"
          >
            {t.saveEntry}
          </button>
        </div>
      </div>
    </div>
  );
};

const Schedule: React.FC<{ context: TeacherContext }> = ({ context }) => {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showAddModal, setShowAddModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isEditingTimetable, setIsEditingTimetable] = useState(false);
  
  const [timeSlots, setTimeSlots] = useState(["09:00", "10:00", "11:00", "12:00", "13:00", "14:00", "15:00"]);
  const [activeDays, setActiveDays] = useState(["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"]);
  const [timetableData, setTimetableData] = useState<Record<string, Record<string, string>>>({});
  const [allDateSessions, setAllDateSessions] = useState<Record<string, ScheduledEvent[]>>({});

  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const t = UI_STRINGS[context.language];

  const daysHeader = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

  useEffect(() => {
    const user = auth.currentUser;
    if (!user) return;
    const unsub = onSnapshot(doc(db, "users", user.uid, "planner", "main_data"), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setTimetableData(data.grid || {});
        setAllDateSessions(data.dateSessions || {});
        if (data.timeSlots) setTimeSlots(data.timeSlots);
        if (data.activeDays) setActiveDays(data.activeDays);
      }
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const saveToFirebase = (overrides?: any) => {
    const user = auth.currentUser;
    if (!user) return;
    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    setSaving(true);
    debounceTimerRef.current = setTimeout(async () => {
      try {
        await setDoc(doc(db, "users", user.uid, "planner", "main_data"), {
          grid: overrides?.grid || timetableData,
          dateSessions: overrides?.dateSessions || allDateSessions,
          timeSlots: overrides?.timeSlots || timeSlots,
          activeDays: overrides?.activeDays || activeDays,
          updatedAt: new Date().toISOString()
        }, { merge: true });
      } catch (e) { console.error(e); }
      finally { setSaving(false); }
    }, 1500);
  };

  const updateTimetableCell = (day: string, slot: string, value: string) => {
    const newGrid = {
      ...timetableData,
      [day]: { ...(timetableData[day] || {}), [slot]: value }
    };
    setTimetableData(newGrid);
    saveToFirebase({ grid: newGrid });
  };

  const updateTimeSlot = (index: number, newTime: string) => {
    const oldSlot = timeSlots[index];
    const newSlots = [...timeSlots];
    newSlots[index] = newTime;
    
    const newGrid = { ...timetableData };
    activeDays.forEach(day => {
      if (newGrid[day]?.[oldSlot]) {
        const content = newGrid[day][oldSlot];
        delete newGrid[day][oldSlot];
        newGrid[day][newTime] = content;
      }
    });

    setTimeSlots(newSlots);
    setTimetableData(newGrid);
    saveToFirebase({ timeSlots: newSlots, grid: newGrid });
  };

  const formatDateKey = (date: Date) => {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  };

  const dateKey = formatDateKey(selectedDate);
  const activeSessions = allDateSessions[dateKey] || [];

  const handleAddEvent = (data: any) => {
    const newSession = { ...data, id: Date.now(), status: 'Upcoming' };
    const updated = { ...allDateSessions, [dateKey]: [...activeSessions, newSession] };
    setAllDateSessions(updated);
    saveToFirebase({ dateSessions: updated });
    setShowAddModal(false);
  };

  const handleDeleteEvent = (id: number) => {
    const updatedList = activeSessions.filter(s => s.id !== id);
    const updatedAll = { ...allDateSessions, [dateKey]: updatedList };
    setAllDateSessions(updatedAll);
    saveToFirebase({ dateSessions: updatedAll });
  };

  const toggleEventStatus = (id: number) => {
    const updatedList = activeSessions.map(s => {
      if (s.id === id) {
        return { ...s, status: s.status === 'Completed' ? 'Upcoming' : 'Completed' } as ScheduledEvent;
      }
      return s;
    });
    const updatedAll = { ...allDateSessions, [dateKey]: updatedList };
    setAllDateSessions(updatedAll);
    saveToFirebase({ dateSessions: updatedAll });
  };

  const prevMonth = () => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  const nextMonth = () => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
  const daysInMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0).getDate();
  const firstDay = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1).getDay();

  if (loading) return (
    <div className="h-[60vh] flex flex-col items-center justify-center gap-4">
      <Loader2 className="animate-spin text-[#4FB5C0]" size={32} />
      <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Syncing Schedule</p>
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in duration-700 pb-20">
      <AddEventModal 
        isOpen={showAddModal} 
        onClose={() => setShowAddModal(false)} 
        onAdd={handleAddEvent} 
        existingEvents={activeSessions}
        t={t}
      />
      
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        <div className="lg:col-span-4 bg-slate-900 rounded-[2.5rem] p-8 shadow-2xl text-white border border-white/5 overflow-hidden relative">
          <div className="absolute -top-24 -left-24 w-48 h-48 bg-violet-600/20 blur-[100px] rounded-full" />
          <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-cyan-600/20 blur-[100px] rounded-full" />
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-xl font-black uppercase tracking-tighter">{months[currentMonth.getMonth()]} <span className="text-violet-500">{currentMonth.getFullYear()}</span></h3>
              <div className="flex gap-2">
                <button onClick={prevMonth} className="w-10 h-10 bg-white/5 rounded-xl flex items-center justify-center border border-white/5"><ChevronLeft size={18} /></button>
                <button onClick={nextMonth} className="w-10 h-10 bg-white/5 rounded-xl flex items-center justify-center border border-white/5"><ChevronRight size={18} /></button>
              </div>
            </div>
            <div className="grid grid-cols-7 gap-1 text-center mb-4">
              {daysHeader.map(day => (<span key={day} className="text-[9px] font-black text-slate-500 uppercase tracking-widest py-2">{day}</span>))}
              {Array.from({ length: firstDay }).map((_, i) => <div key={`empty-${i}`} className="aspect-square"></div>)}
              {Array.from({ length: daysInMonth }).map((_, i) => {
                const day = i + 1;
                const cellDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
                const cellKey = formatDateKey(cellDate);
                const selected = dateKey === cellKey;
                const hasEvents = (allDateSessions[cellKey] || []).length > 0;
                return (<button key={day} onClick={() => setSelectedDate(cellDate)} className={`aspect-square flex flex-col items-center justify-center rounded-2xl text-xs font-black transition-all relative border-2 ${selected ? 'bg-violet-600 border-violet-600 text-white scale-110' : 'border-transparent hover:bg-white/5 text-slate-400'}`}>{day}{hasEvents && !selected && <div className="absolute bottom-2 w-1 h-1 bg-cyan-400 rounded-full" />}</button>);
              })}
            </div>
          </div>
        </div>

        <div className="lg:col-span-8 space-y-6">
          <div className="flex items-center justify-between bg-white/80 backdrop-blur-md p-6 rounded-[2.5rem] border border-white/40 shadow-xl">
            <div>
              <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tight flex items-center gap-3"><Clock size={24} className="text-[#4FB5C0]" /> {t.activeAgenda}</h2>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mt-1">{selectedDate.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}</p>
            </div>
            <button onClick={() => setShowAddModal(true)} className="flex items-center gap-2 px-6 py-3 bg-slate-900 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:scale-105 transition-all shadow-xl"><Plus size={18} /> {t.newEntry}</button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {activeSessions.length === 0 ? (
              <div className="col-span-2 text-center py-20 bg-white/50 rounded-[2.5rem] border-4 border-dashed border-slate-200"><p className="text-slate-300 font-black uppercase text-xs tracking-widest">{t.noActivities}</p></div>
            ) : activeSessions.map((session) => (
              <div key={session.id} className={`p-6 rounded-[2.5rem] border transition-all flex items-start gap-5 group shadow-xl ${session.status === 'Completed' ? 'bg-emerald-50 border-emerald-100 opacity-80' : 'bg-white border-slate-100 hover:border-violet-300'}`}>
                <div className={`p-3 rounded-2xl font-black text-[10px] text-center min-w-[70px] shadow-lg transition-colors ${session.status === 'Completed' ? 'bg-emerald-600 text-white' : 'bg-slate-900 text-white'}`}>
                  <div className="opacity-50 text-[8px] mb-1">START</div>
                  {session.time}
                </div>
                <div className="flex-1 min-w-0">
                  <h5 className={`font-black uppercase tracking-tight mb-1 truncate transition-all ${session.status === 'Completed' ? 'text-emerald-700 line-through' : 'text-slate-900'}`}>{session.topic}</h5>
                  <div className="flex items-center gap-2">
                    <p className={`text-[10px] font-bold uppercase tracking-widest ${session.status === 'Completed' ? 'text-emerald-400' : 'text-slate-400'}`}>{session.duration}</p>
                    <span className="text-slate-200">|</span>
                    <p className={`text-[10px] font-bold uppercase tracking-widest ${session.status === 'Completed' ? 'text-emerald-500' : 'text-violet-500'}`}>End: {session.endTime}</p>
                  </div>
                </div>
                <div className="flex flex-col gap-2">
                  <button 
                    onClick={() => toggleEventStatus(session.id)} 
                    title={session.status === 'Completed' ? 'Mark as Pending' : 'Mark as Done'}
                    className={`p-2 rounded-full transition-all ${session.status === 'Completed' ? 'bg-emerald-500 text-white shadow-lg' : 'text-slate-200 hover:text-emerald-500 hover:bg-emerald-50'}`}
                  >
                    <CheckCircle2 size={20} />
                  </button>
                  <button onClick={() => handleDeleteEvent(session.id)} className="p-2 text-slate-200 group-hover:text-rose-500 transition-colors"><Trash2 size={18} /></button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <section className="bg-slate-900 rounded-[3rem] border border-white/5 shadow-2xl p-10 space-y-10 overflow-hidden relative">
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-600/10 blur-[120px] rounded-full pointer-events-none" />
        <div className="relative z-10 flex items-center justify-between">
          <div><h3 className="text-3xl font-black text-white uppercase tracking-tighter leading-none">{t.weeklyLoop.split(' ')[0]} <span className="text-indigo-500">{t.weeklyLoop.split(' ')[1] || 'Loop'}</span></h3><p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-2">{t.weeklyLoopSub}</p></div>
          <button 
            onClick={() => setIsEditingTimetable(!isEditingTimetable)} 
            className={`flex items-center gap-3 px-8 py-3 rounded-2xl font-black uppercase text-[10px] tracking-widest transition-all ${isEditingTimetable ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-600/40' : 'bg-white/5 text-slate-300 hover:bg-white/10 border border-white/5'}`}
          >
            {isEditingTimetable ? <Check size={16} /> : <Edit3 size={16} />}
            {isEditingTimetable ? t.saveLoop : t.adjustLoop}
          </button>
        </div>
        <div className="relative z-10 overflow-x-auto rounded-[2rem] border border-white/5">
          <table className="w-full text-left border-collapse min-w-[1000px]">
            <thead><tr className="bg-white/5"><th className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-white/5 w-40">Block</th>{activeDays.map(day => (<th key={day} className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-white/5">{day}</th>))}</tr></thead>
            <tbody>
              {timeSlots.map((slot, sIdx) => (
                <tr key={sIdx} className="group border-b border-white/5 hover:bg-white/[0.02] transition-all">
                  <td className="p-6 font-black text-xs text-white whitespace-nowrap bg-white/5 border-r border-white/5">
                    {isEditingTimetable ? (
                      <input 
                        type="time" 
                        value={slot} 
                        onChange={(e) => updateTimeSlot(sIdx, e.target.value)}
                        className="bg-slate-800 text-indigo-400 px-2 py-1 rounded border border-indigo-500/30 outline-none"
                      />
                    ) : (
                      <div className="flex items-center gap-3 text-indigo-400"><Clock size={14} />{slot}</div>
                    )}
                  </td>
                  {activeDays.map(day => (
                    <td key={`${day}-${sIdx}`} className="p-2">
                      <div className={`h-20 w-full rounded-2xl border-2 flex items-center px-4 font-black text-[11px] uppercase transition-all shadow-inner ${timetableData[day]?.[slot] ? 'bg-indigo-600/20 border-indigo-500/30 text-indigo-100' : 'border-white/5 bg-white/[0.03] text-slate-600'}`}>
                        {isEditingTimetable ? (
                          <input 
                            type="text" 
                            placeholder="Add Topic" 
                            value={timetableData[day]?.[slot] || ''}
                            onChange={(e) => updateTimetableCell(day, slot, e.target.value)}
                            className="w-full bg-transparent border-none outline-none text-white placeholder:text-slate-700"
                          />
                        ) : (
                          <div className="w-full truncate">{timetableData[day]?.[slot] || '—'}</div>
                        )}
                      </div>
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
