import { useState, useEffect } from 'react';
import { 
  Check, 
  Plus, 
  Trash2, 
  Edit3, 
  AlertTriangle, 
  Calendar, 
  ChevronRight, 
  ChevronLeft, 
  Bell, 
  Clock, 
  ListTodo, 
  CheckSquare, 
  Square, 
  Save, 
  X,
  Sparkles,
  CalendarDays
} from 'lucide-react';
import { collection, doc, setDoc, deleteDoc, onSnapshot, getDocs } from 'firebase/firestore';
import { db, auth, handleFirestoreError, OperationType } from '../firebase';

export interface GeneralTask {
  id: string;
  text: string;
  completed: boolean;
  date: string; // "YYYY-MM-DD" e.g., "2026-06-16"
  createdAt?: number;
}

const DEFAULT_TASKS: GeneralTask[] = [
  { id: 'gt_1', text: 'Create the Google Form for helper registration', completed: false, date: '2026-06-16', createdAt: 1781596800000 },
  { id: 'gt_2', text: 'Find a video editor for daily backstage update reels', completed: false, date: '2026-06-16', createdAt: 1781596810000 },
  { id: 'gt_3', text: 'Run power failure checks for sound stall generators', completed: false, date: '2026-06-17', createdAt: 1781683200000 },
  { id: 'gt_4', text: 'Review VIP safety velvet roping and barricade positions', completed: true, date: '2026-06-15', createdAt: 1781510400000 },
  { id: 'gt_5', text: 'Sync final performance schedules with Kasun Kalhara', completed: false, date: '2026-06-15', createdAt: 1781510410000 },
  { id: 'gt_6', text: 'Distribute security badges to critical stage crews', completed: false, date: '2026-06-18', createdAt: 1781769600000 }
];

// Human-readable date converter
export function formatToHumanDate(dateStr: string): string {
  try {
    const months = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      const day = parseInt(parts[2], 10);
      const monthIdx = parseInt(parts[1], 10) - 1;
      if (monthIdx >= 0 && monthIdx < 12) {
        // Return e.g. "16 June" as desired by the user
        const monthName = months[monthIdx];
        return `${day} ${monthName}`;
      }
    }
  } catch (e) {
    // fallback
  }
  return dateStr;
}

export function TaskPlannerTab() {
  const [tasks, setTasks] = useState<GeneralTask[]>(() => {
    const saved = localStorage.getItem('chakra_general_tasks');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (_) {
        // fallback
      }
    }
    return [];
  });

  useEffect(() => {
    localStorage.setItem('chakra_general_tasks', JSON.stringify(tasks));
  }, [tasks]);

  const [selectedDate, setSelectedDate] = useState<string>('2026-06-16'); // default to 16 June 2026
  const [newTaskText, setNewTaskText] = useState<string>('');
  
  // Custom date addition
  const [customDateInput, setCustomDateInput] = useState<string>('2026-06-19');
  const [showAddDateModal, setShowAddDateModal] = useState<boolean>(false);

  // Editing state
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [editingTaskText, setEditingTaskText] = useState<string>('');

  // User and Auth listener
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const unsubscribeAuth = auth.onAuthStateChanged((currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribeAuth();
  }, []);

  // Sync with Firestore in real-time unconditionally (both for guest and logged-in users)
  useEffect(() => {
    const path = 'general_tasks';
    const unsubscribeSnapshot = onSnapshot(collection(db, path), (snapshot) => {
      const list: GeneralTask[] = [];
      snapshot.forEach((doc) => {
        list.push(doc.data() as GeneralTask);
      });
      list.sort((a, b) => (a.createdAt || 0) - (b.createdAt || 0));
      setTasks(list);
      localStorage.setItem('chakra_general_tasks', JSON.stringify(list));
    }, (error) => {
      console.error("Firestore general_tasks snapshot error:", error);
    });

    return () => unsubscribeSnapshot();
  }, []);

  // Operations wrapped with Firestore writes unconditionally
  const handleAddTask = async (text: string, date: string) => {
    if (!text.trim()) return;

    const newTask: GeneralTask = {
      id: 'gt_' + Date.now() + Math.random().toString(36).substr(2, 4),
      text: text.trim(),
      completed: false,
      date: date,
      createdAt: Date.now()
    };

    const updatedTasks = [...tasks, newTask];
    setTasks(updatedTasks);
    setNewTaskText('');

    try {
      const path = 'general_tasks';
      await setDoc(doc(db, path, newTask.id), newTask);
    } catch (error) {
      console.error("Failed to add task to Firestore:", error);
    }
  };

  const handleToggleTask = async (taskId: string) => {
    const updated = tasks.map(t => t.id === taskId ? { ...t, completed: !t.completed } : t);
    setTasks(updated);

    try {
      const target = updated.find(t => t.id === taskId);
      if (target) {
        const path = 'general_tasks';
        await setDoc(doc(db, path, taskId), target);
      }
    } catch (error) {
      console.error("Failed to toggle task in Firestore:", error);
    }
  };

  const handleStartEdit = (task: GeneralTask) => {
    setEditingTaskId(task.id);
    setEditingTaskText(task.text);
  };

  const handleSaveEdit = async (taskId: string) => {
    if (!editingTaskText.trim()) return;
    const updated = tasks.map(t => t.id === taskId ? { ...t, text: editingTaskText.trim() } : t);
    setTasks(updated);
    setEditingTaskId(null);

    try {
      const target = updated.find(t => t.id === taskId);
      if (target) {
        const path = 'general_tasks';
        await setDoc(doc(db, path, taskId), target);
      }
    } catch (error) {
      console.error("Failed to edit task in Firestore:", error);
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    const updated = tasks.filter(t => t.id !== taskId);
    setTasks(updated);

    try {
      const path = 'general_tasks';
      await deleteDoc(doc(db, path, taskId));
    } catch (error) {
      console.error("Failed to delete task from Firestore:", error);
    }
  };

  // Extract all dates we currently have tasks planned for + current/past default ones
  const plannedDates = Array.from(new Set([
    '2026-06-15',
    '2026-06-16',
    '2026-06-17',
    '2026-06-18',
    ...tasks.map(t => t.date)
  ])).sort();

  const activeDayTasks = tasks.filter(t => t.date === selectedDate);
  const pendingTasks = activeDayTasks.filter(t => !t.completed);
  const completedTasks = activeDayTasks.filter(t => t.completed);

  // Get total pending tasks for smart upcoming reminders
  const allPendingTasks = tasks.filter(t => !t.completed);

  // Custom Quick Date Adder
  const handleAddNewDate = () => {
    if (!customDateInput) return;
    setSelectedDate(customDateInput);
    setShowAddDateModal(false);
  };

  return (
    <div className="space-y-6" id="task-planner-tab">
      
      {/* 1. UPCOMING REMINDERS/ALERTS BOARD */}
      <div className="bg-zinc-900/70 border border-[#FF6B00]/20 rounded-2xl p-6 relative overflow-hidden backdrop-blur-md">
        <div className="absolute top-0 right-0 w-[300px] h-[300px] bg-[#FF6B00]/[0.025] rounded-full blur-[80px] pointer-events-none" />
        
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/5 pb-4 mb-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-[#FF6B00]/10 text-[#FF6B00] shrink-0 border border-[#FF6B00]/20">
              <Bell className="animate-pulse" size={16} />
            </div>
            <div>
              <h4 className="text-white font-display font-bold text-xs uppercase tracking-wider">
                Production Reminder Center
              </h4>
              <p className="text-[10px] text-zinc-500 font-mono mt-0.5">
                Critical event tasks requiring attention based on planned timelines
              </p>
            </div>
          </div>
          
          <span className="text-[10px] font-mono bg-[#FF6B00]/10 text-[#FF6B00] border border-[#FF6B00]/20 px-3 py-1 rounded-full font-bold self-start sm:self-center">
            {allPendingTasks.length} Pending Actions
          </span>
        </div>

        {allPendingTasks.length === 0 ? (
          <div className="py-6 px-4 bg-zinc-950/20 border border-dashed border-white/5 rounded-xl text-center">
            <p className="text-zinc-500 font-mono text-[11px] leading-relaxed">
              🌿 Perfect operational status. All tasks scheduled across all daily event timelines are 100% complete.
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-3 max-h-[350px] overflow-y-auto pr-1">
            {allPendingTasks.slice(0, 8).map((task) => (
              <div 
                key={task.id} 
                onClick={() => setSelectedDate(task.date)}
                className="p-4 bg-zinc-950/70 hover:bg-zinc-950 border border-white/5 hover:border-[#FF6B00]/30 rounded-xl cursor-pointer transition-all duration-300 flex flex-col sm:flex-row sm:items-center justify-between gap-4 group shadow-sm"
              >
                <div className="flex items-start gap-3.5 min-w-0 flex-1">
                  <div className="mt-0.5 p-2 rounded-lg bg-amber-500/10 text-amber-500 shrink-0 group-hover:bg-[#FF6B00]/20 group-hover:text-[#FF6B00] transition-colors">
                    <Clock size={14} className="group-hover:rotate-12 transition-transform" />
                  </div>
                  <div className="min-w-0 flex-1 space-y-1.5">
                    <div className="text-zinc-200 font-sans text-xs md:text-[13px] font-semibold leading-relaxed break-words whitespace-normal group-hover:text-white transition">
                      {task.text}
                    </div>
                    <div className="text-[10px] font-mono text-zinc-500 flex flex-wrap items-center gap-2">
                      <div className="flex items-center gap-1">
                        <Calendar size={11} className="text-[#FF6B00]/70" />
                        <span>Due Date: <strong className="text-zinc-300 font-semibold">{formatToHumanDate(task.date)}</strong></span>
                      </div>
                      
                      {task.date === '2026-06-15' && (
                        <span className="text-[9px] font-mono px-2 py-0.5 bg-red-500/10 text-red-400 rounded-md border border-red-500/20 font-bold">
                          Today
                        </span>
                      )}
                      {task.date === '2026-06-16' && (
                        <span className="text-[9px] font-mono px-2 py-0.5 bg-amber-500/10 text-amber-400 rounded-md border border-amber-500/20 font-bold">
                          Tomorrow
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                
                <div className="shrink-0 flex items-center self-end sm:self-center">
                  <span className="px-3 py-1.5 rounded-lg border border-white/5 bg-white/5 text-[10px] font-mono uppercase tracking-wider font-bold text-zinc-400 group-hover:text-[#FF6B00] group-hover:border-[#FF6B00]/25 group-hover:bg-[#FF6B00]/10 flex items-center gap-1.5 transition duration-300">
                    <span>Manage task</span>
                    <ChevronRight size={11} className="group-hover:translate-x-1 transition-transform" />
                  </span>
                </div>
              </div>
            ))}
            
            {allPendingTasks.length > 8 && (
              <div className="p-3 bg-zinc-950/20 border border-dashed border-white/5 rounded-xl flex items-center justify-center text-[10px] text-zinc-500 font-mono">
                + {allPendingTasks.length - 8} more pending items planned in the database
              </div>
            )}
          </div>
        )}
      </div>

      {/* 2. MAIN TASK WORKSPACE SPLIT CARD */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* LEFT COLUMN: DATE NAVIGATOR & DATE PLANNER LIST */}
        <div className="lg:col-span-4 bg-zinc-900/40 border border-white/5 rounded-2xl p-4 space-y-4">
          <div className="flex items-center justify-between border-b border-white/5 pb-2.5">
            <h4 className="text-white font-display font-semibold text-xs uppercase tracking-wider flex items-center gap-2">
              <CalendarDays size={14} className="text-[#FF6B00]" />
              Dates Outlook
            </h4>
            
            {/* Quick date picker */}
            <button
              onClick={() => setShowAddDateModal(true)}
              className="text-[9px] font-mono font-bold uppercase py-1 px-2 border border-[#FF6B00]/30 hover:border-[#FF6B00] bg-[#FF6B00]/5 text-[#FF6B00] hover:text-[#FF8533] rounded-lg transition flex items-center gap-1 cursor-pointer select-none"
            >
              <Plus size={10} /> Plan Date
            </button>
          </div>

          {/* Quick Add Custom Date inline picker */}
          {showAddDateModal && (
            <div className="bg-zinc-950 p-3 rounded-xl border border-white/10 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono font-bold text-zinc-400">Select Date to Plan</span>
                <button onClick={() => setShowAddDateModal(false)} className="text-zinc-500 hover:text-white">
                  <X size={12} />
                </button>
              </div>
              <div className="flex items-center gap-1.5">
                <input 
                  type="date" 
                  value={customDateInput}
                  onChange={(e) => setCustomDateInput(e.target.value)}
                  className="flex-1 bg-zinc-900 border border-white/10 rounded-lg px-2 py-1 text-white text-[10px] font-mono focus:outline-none focus:border-[#FF6B00]/40"
                />
                <button
                  onClick={handleAddNewDate}
                  className="px-2 py-1 bg-[#FF6B00] hover:bg-orange-600 text-black rounded-lg font-mono font-bold text-[10px] uppercase cursor-pointer"
                >
                  Confirm
                </button>
              </div>
            </div>
          )}

          {/* CHRONOLOGICAL DATE CARDS LIST */}
          <div className="space-y-1.5 max-h-[380px] overflow-y-auto pr-1">
            {plannedDates.map((dStr) => {
              const dateTasks = tasks.filter(t => t.date === dStr);
              const isSelected = selectedDate === dStr;
              const completedCount = dateTasks.filter(t => t.completed).length;
              const pendingCount = dateTasks.filter(t => !t.completed).length;

              return (
                <button
                  key={dStr}
                  onClick={() => setSelectedDate(dStr)}
                  className={`w-full text-left p-3 rounded-xl border transition-all text-xs flex items-center justify-between group cursor-pointer ${
                    isSelected 
                      ? 'border-[#FF6B00]/40 bg-[#FF6B00]/10 text-white' 
                      : 'border-white/5 bg-zinc-950/20 hover:bg-zinc-950/60 text-zinc-400 hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <div className={`p-1.5 rounded-lg transition-colors ${
                      isSelected ? 'bg-[#FF6B00]/15 text-[#FF6B00]' : 'bg-white/5 text-zinc-500 group-hover:text-zinc-300'
                    }`}>
                      <Calendar size={13} />
                    </div>
                    <div>
                      <div className="font-semibold">{formatToHumanDate(dStr)}</div>
                      <div className="text-[9px] font-mono text-zinc-500 mt-0.5">
                        {dStr === '2026-06-15' ? ' (Today)' : ''}
                        {dStr === '2026-06-16' ? ' (Tomorrow)' : ''}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 font-mono text-[9px] font-bold">
                    {pendingCount > 0 && (
                      <span className="text-amber-500 bg-amber-500/10 px-1.5 py-0.5 rounded-full">
                        {pendingCount} Left
                      </span>
                    )}
                    {completedCount > 0 && pendingCount === 0 && (
                      <span className="text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded-full">
                        ✔ Safe
                      </span>
                    )}
                    {pendingCount === 0 && completedCount === 0 && (
                      <span className="text-zinc-600 bg-zinc-900 border border-white/5 px-1.5 py-0.5 rounded-full">
                        Empty
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* RIGHT COLUMN: ACTIVE DATE'S TASK MANAGER */}
        <div className="lg:col-span-8 space-y-4">
          
          {/* Header of Active Date */}
          <div className="bg-zinc-900/40 border border-white/5 rounded-2xl p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
            <div>
              <span className="text-[9px] uppercase font-mono text-[#FF6B00] font-bold tracking-widest block">
                Events Planning Dashboard
              </span>
              <h3 className="text-white font-display font-extrabold text-base tracking-tight mt-0.5 flex items-center gap-2">
                {formatToHumanDate(selectedDate)}
                <span className="text-xs font-mono font-medium text-zinc-500">({selectedDate})</span>
              </h3>
            </div>

            {/* Overall Task Count progress bar inside current list */}
            <div className="flex items-center gap-2 w-full md:w-auto shrink-0 bg-zinc-950/60 p-2 border border-white/5 rounded-xl text-[10px] font-mono">
              <span className="text-zinc-500">Day progress:</span>
              <span className="text-emerald-400 font-bold">{completedTasks.length}</span>
              <span className="text-zinc-600">/</span>
              <span className="text-zinc-400">{activeDayTasks.length}</span>
              <span className="text-zinc-500">completed</span>
              <div className="h-1.5 w-16 bg-white/10 rounded-full overflow-hidden ml-1.5">
                <div 
                  className="bg-emerald-400 h-full rounded-full" 
                  style={{ width: `${activeDayTasks.length > 0 ? (completedTasks.length / activeDayTasks.length) * 100 : 0}%` }}
                />
              </div>
            </div>
          </div>

          {/* QUICK TASK ADDER BAR */}
          <div className="bg-zinc-900/20 border border-white/5 rounded-2xl p-4">
            <div className="flex gap-2">
              <input 
                type="text"
                placeholder={`Task description for ${formatToHumanDate(selectedDate)}... (e.g. Write registration forms)`}
                value={newTaskText}
                onChange={(e) => setNewTaskText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleAddTask(newTaskText, selectedDate);
                  }
                }}
                className="flex-1 bg-zinc-950 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-[#FF6B00]/40 transition"
              />
              <button
                onClick={() => handleAddTask(newTaskText, selectedDate)}
                className="px-5 py-2.5 bg-[#FF6B00]/10 hover:bg-[#FF6B00]/20 border border-[#FF6B00]/30 rounded-xl text-xs font-mono font-bold text-[#FF6B00] hover:text-[#FF8533] uppercase tracking-wider transition shrink-0 flex items-center gap-2 cursor-pointer select-none"
              >
                <Plus size={14} /> Add Task
              </button>
            </div>
            <p className="text-[9px] text-zinc-500 font-mono mt-1 px-1">
              Press <kbd className="bg-zinc-900 px-1 border border-white/5 rounded">Enter</kbd> or click Add Task to record onto this day.
            </p>
          </div>

          {/* ACTIVE TASKS CONTAINER */}
          {activeDayTasks.length === 0 ? (
            <div className="bg-zinc-900/10 border border-dashed border-white/5 rounded-3xl p-10 text-center space-y-2">
              <div className="mx-auto w-10 h-10 rounded-xl bg-zinc-900 flex items-center justify-center text-zinc-600">
                <ListTodo size={18} />
              </div>
              <p className="text-zinc-400 text-xs font-sans font-medium">
                No tasks planned for {formatToHumanDate(selectedDate)}
              </p>
              <p className="text-zinc-600 text-[10px] font-mono leading-relaxed max-w-sm mx-auto">
                Keep the coordination sequence safe by registering canopies, backup connections, or Google Forms in advance.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              
              {/* SECTION 1: PENDING TASKS (Fully displayed, never scrollable) */}
              <div className="space-y-2">
                <div className="text-[10px] uppercase font-mono tracking-wider font-semibold text-amber-500/80 px-1 flex items-center gap-1.5">
                  <Clock size={11} />
                  Pending Tasks ({pendingTasks.length})
                </div>

                {pendingTasks.length === 0 ? (
                  <div className="bg-emerald-950/10 border border-emerald-500/10 p-4 rounded-2xl flex items-center justify-center text-[10px] text-emerald-400/80 font-mono italic">
                    ✧ Zero pending items. All scheduled items for today have been verified.
                  </div>
                ) : (
                  <div className="space-y-1.5">
                    {pendingTasks.map((task) => (
                      <div 
                        key={task.id}
                        className="p-3 bg-zinc-950/60 border border-white/5 hover:border-white/10 rounded-xl flex items-center justify-between gap-3 group transition"
                      >
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          {/* Checkbox */}
                          <button
                            onClick={() => handleToggleTask(task.id)}
                            className="text-zinc-600 hover:text-[#FF6B00] transition cursor-pointer shrink-0"
                          >
                            <Square size={16} />
                          </button>

                          {/* Editable task title input */}
                          {editingTaskId === task.id ? (
                            <div className="flex-1 flex gap-1.5">
                              <input 
                                type="text"
                                value={editingTaskText}
                                onChange={(e) => setEditingTaskText(e.target.value)}
                                className="flex-1 bg-zinc-900 border border-white/15 rounded px-2 py-1 text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-[#FF6B00]/40 font-sans"
                                autoFocus
                              />
                              <button 
                                onClick={() => handleSaveEdit(task.id)}
                                className="p-1 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded hover:bg-emerald-500/20"
                              >
                                <Check size={14} />
                              </button>
                              <button 
                                onClick={() => setEditingTaskId(null)}
                                className="p-1 bg-red-500/10 border border-red-500/20 text-red-100 rounded hover:bg-red-500/20"
                              >
                                <X size={14} />
                              </button>
                            </div>
                          ) : (
                            <span className="text-zinc-200 text-xs font-sans line-clamp-2 leading-relaxed">
                              {task.text}
                            </span>
                          )}
                        </div>

                        {/* Action buttons (Only shows if not editing) */}
                        {editingTaskId !== task.id && (
                          <div className="flex items-center gap-1.5 shrink-0 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity">
                            <button
                              onClick={() => handleStartEdit(task)}
                              className="p-1.5 bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white rounded-lg transition border border-white/5"
                              title="Edit item name"
                            >
                              <Edit3 size={11} />
                            </button>
                            <button
                              onClick={() => handleDeleteTask(task.id)}
                              className="p-1.5 bg-red-950/20 hover:bg-red-900/40 text-red-400 hover:text-red-300 rounded-lg transition border border-red-500/10"
                              title="Delete task"
                            >
                              <Trash2 size={11} />
                            </button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* SECTION 2: COMPLETED TASKS (Fully displayed, never scrollable) */}
              <div className="space-y-2 pt-2">
                <div className="text-[10px] uppercase font-mono tracking-wider font-semibold text-emerald-400/80 px-1 flex items-center gap-1.5">
                  <CheckSquare size={11} />
                  Completed Tasks ({completedTasks.length})
                </div>

                {completedTasks.length === 0 ? (
                  <div className="bg-zinc-950/20 border border-white/5 p-4 rounded-2xl flex items-center justify-center text-[10px] text-zinc-600 font-mono italic">
                    No completed tasks listed in this daily ledger yet.
                  </div>
                ) : (
                  <div className="space-y-1.5">
                    {completedTasks.map((task) => (
                      <div 
                        key={task.id}
                        className="p-3 bg-zinc-950/20 border border-white/5/50 rounded-xl flex items-center justify-between gap-3 group transition"
                      >
                        <div className="flex items-center gap-3 flex-1 min-w-0 opacity-60">
                          {/* Checkbox with complete status */}
                          <button
                            onClick={() => handleToggleTask(task.id)}
                            className="text-emerald-400 hover:text-zinc-500 transition cursor-pointer shrink-0 animate-pulse"
                          >
                            <CheckSquare size={16} />
                          </button>

                          {/* Editable task title input */}
                          {editingTaskId === task.id ? (
                            <div className="flex-1 flex gap-1.5">
                              <input 
                                type="text"
                                value={editingTaskText}
                                onChange={(e) => setEditingTaskText(e.target.value)}
                                className="flex-1 bg-zinc-900 border border-white/15 rounded px-2 py-1 text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-[#FF6B00]/40 font-sans"
                                autoFocus
                              />
                              <button 
                                onClick={() => handleSaveEdit(task.id)}
                                className="p-1 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded hover:bg-emerald-500/20"
                              >
                                <Check size={14} />
                              </button>
                              <button 
                                onClick={() => setEditingTaskId(null)}
                                className="p-1 bg-red-500/10 border border-red-500/20 text-red-100 rounded hover:bg-red-500/20"
                              >
                                <X size={14} />
                              </button>
                            </div>
                          ) : (
                            <span className="text-zinc-400 text-xs font-sans line-through truncate">
                              {task.text}
                            </span>
                          )}
                        </div>

                        {/* Action buttons (Only shows if not editing) */}
                        {editingTaskId !== task.id && (
                          <div className="flex items-center gap-1.5 shrink-0 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity">
                            <button
                              onClick={() => handleStartEdit(task)}
                              className="p-1.5 bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white rounded-lg transition border border-white/5"
                              title="Edit item name"
                            >
                              <Edit3 size={11} />
                            </button>
                            <button
                              onClick={() => handleDeleteTask(task.id)}
                              className="p-1.5 bg-red-950/20 hover:bg-red-900/40 text-red-400 hover:text-red-300 rounded-lg transition border border-red-500/10"
                              title="Delete task"
                            >
                              <Trash2 size={11} />
                            </button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

            </div>
          )}

        </div>
      </div>

    </div>
  );
}
