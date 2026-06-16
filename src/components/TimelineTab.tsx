import React, { useState } from 'react';
import { TimelineDay, TimelineTask, DayStatus } from '../types';
import { 
  Calendar, 
  Clock, 
  CheckSquare, 
  Trash2, 
  Edit3, 
  Plus, 
  ArrowRightLeft, 
  Check, 
  X, 
  Copy, 
  AlertCircle, 
  Sparkles,
  ArrowRight,
  Disc
} from 'lucide-react';

interface TimelineTabProps {
  timeline: TimelineDay[];
  setTimeline: React.Dispatch<React.SetStateAction<TimelineDay[]>>;
  currentDateStr: string;
}

export const TimelineTab: React.FC<TimelineTabProps> = ({
  timeline,
  setTimeline,
  currentDateStr,
}) => {
  const [activeDayFilter, setActiveDayFilter] = useState<string>('ALL'); // 'ALL' or specific day
  
  // Adding state
  const [addingTaskDay, setAddingTaskDay] = useState<string | null>(null);
  const [newText, setNewText] = useState('');
  const [newSection, setNewSection] = useState<'Shoot' | 'Edit' | 'Post' | 'Coordination'>('Shoot');

  // Editing state
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [editText, setEditText] = useState('');
  const [editSection, setEditSection] = useState<'Shoot' | 'Edit' | 'Post' | 'Coordination'>('Shoot');

  // Rescheduling (Move Task) state
  const [movingTaskId, setMovingTaskId] = useState<string | null>(null);
  const [rescheduleDestDay, setRescheduleDestDay] = useState<string>('');

  // Duplication state
  const [duplicatingTaskId, setDuplicatingTaskId] = useState<string | null>(null);
  const [duplicateDestDay, setDuplicateDestDay] = useState<string>('');

  // 1. ADD NEW TASK
  const handleAddTask = (dayDate: string) => {
    if (!newText.trim()) return;

    const newTask: TimelineTask = {
      id: `t_${dayDate.toLowerCase().replace(/\s/g, '')}_${Date.now()}`,
      section: newSection,
      text: newText.trim(),
      status: 'Pending',
    };

    setTimeline(prev => 
      prev.map(day => {
        if (day.date === dayDate) {
          const updatedTasks = [...day.tasks, newTask];
          return { ...day, tasks: updatedTasks, status: evaluateDayStatus(updatedTasks, day.isEventDay) };
        }
        return day;
      })
    );

    setNewText('');
    setAddingTaskDay(null);
  };

  // Helper to re-evaluate day status based on its tasks' status
  const evaluateDayStatus = (tasks: TimelineTask[], isEventDay?: boolean): DayStatus => {
    if (isEventDay) return 'LIVE EVENT';
    if (tasks.length === 0) return 'Pending';
    
    const allCompleted = tasks.every(t => t.status === 'Completed');
    if (allCompleted) return 'Completed';

    const hasCompleted = tasks.some(t => t.status === 'Completed');
    const hasDelayed = tasks.some(t => t.status === 'Delayed');
    
    if (hasDelayed) return 'Delayed';
    return 'Pending';
  };

  // 2. MARK TASK COMPLETE / DELAYED
  const handleToggleTaskStatus = (dayDate: string, taskId: string, actionStatus: 'Pending' | 'Completed' | 'Delayed') => {
    setTimeline(prev =>
      prev.map(day => {
        if (day.date === dayDate) {
          const updatedTasks = day.tasks.map(t => {
            if (t.id === taskId) {
              return { ...t, status: actionStatus };
            }
            return t;
          });
          return {
            ...day,
            tasks: updatedTasks,
            status: evaluateDayStatus(updatedTasks, day.isEventDay)
          };
        }
        return day;
      })
    );
  };

  // 3. EDIT TASK
  const handleStartEdit = (task: TimelineTask) => {
    setEditingTaskId(task.id);
    setEditText(task.text);
    setEditSection(task.section);
  };

  const handleSaveEdit = (dayDate: string, taskId: string) => {
    if (!editText.trim()) return;

    setTimeline(prev =>
      prev.map(day => {
        if (day.date === dayDate) {
          return {
            ...day,
            tasks: day.tasks.map(t => 
              t.id === taskId ? { ...t, text: editText.trim(), section: editSection } : t
            )
          };
        }
        return day;
      })
    );

    setEditingTaskId(null);
  };

  // 4. DELETE TASK
  const handleDeleteTask = (dayDate: string, taskId: string) => {
    setTimeline(prev =>
      prev.map(day => {
        if (day.date === dayDate) {
          const updatedTasks = day.tasks.filter(t => t.id !== taskId);
          return {
            ...day,
            tasks: updatedTasks,
            status: evaluateDayStatus(updatedTasks, day.isEventDay)
          };
        }
        return day;
      })
    );
  };

  // 5. RESCHEDULE (MOVE) TASK
  const handleRescheduleTask = (sourceDayDate: string, taskId: string) => {
    if (!rescheduleDestDay) return;

    // Find the task inside source day
    let taskToMove: TimelineTask | undefined;
    timeline.forEach(day => {
      if (day.date === sourceDayDate) {
        taskToMove = day.tasks.find(t => t.id === taskId);
      }
    });

    if (!taskToMove) return;

    const updatedTask: TimelineTask = {
      ...taskToMove,
      status: 'Rescheduled', // Mark as Rescheduled
      originalDate: sourceDayDate // Track origins
    };

    setTimeline(prev => 
      prev.map(day => {
        if (day.date === sourceDayDate) {
          // Remove from previous date
          const updatedTasks = day.tasks.filter(t => t.id !== taskId);
          return { ...day, tasks: updatedTasks, status: evaluateDayStatus(updatedTasks, day.isEventDay) };
        }
        if (day.date === rescheduleDestDay) {
          // Add to new date
          const updatedTasks = [...day.tasks, updatedTask];
          return { ...day, tasks: updatedTasks, status: evaluateDayStatus(updatedTasks, day.isEventDay) };
        }
        return day;
      })
    );

    setMovingTaskId(null);
    setRescheduleDestDay('');
  };

  // 6. DUPLICATE TASK
  const handleDuplicateTask = (sourceDayDate: string, taskId: string) => {
    if (!duplicateDestDay) return;

    // Find the task
    let taskToDup: TimelineTask | undefined;
    timeline.forEach(day => {
      if (day.date === sourceDayDate) {
        taskToDup = day.tasks.find(t => t.id === taskId);
      }
    });

    if (!taskToDup) return;

    const duplicatedTask: TimelineTask = {
      id: `t_dup_${Date.now()}`,
      section: taskToDup.section,
      text: `${taskToDup.text} (Copy)`,
      status: 'Pending',
    };

    setTimeline(prev =>
      prev.map(day => {
        if (day.date === duplicateDestDay) {
          const updatedTasks = [...day.tasks, duplicatedTask];
          return { ...day, tasks: updatedTasks, status: evaluateDayStatus(updatedTasks, day.isEventDay) };
        }
        return day;
      })
    );

    setDuplicatingTaskId(null);
    setDuplicateDestDay('');
  };

  // Status system counts
  const allTasks = timeline.flatMap(d => d.tasks);
  const totalCount = allTasks.length;
  const completedCount = allTasks.filter(t => t.status === 'Completed').length;
  
  // Highlight stats today
  const todayDay = timeline.find((d) => d.date === currentDateStr);
  const overdueCount = allTasks.filter((t) => {
    if (t.status === 'Pending') {
      const parentDay = timeline.find((d) => d.tasks.some((task) => task.id === t.id));
      if (parentDay) {
        const dayInt = parseInt(parentDay.date.replace(/[^0-9]/g, ''));
        return dayInt < 13; // Before June 13
      }
    }
    return t.status === 'Delayed';
  }).length;

  const upcomingCount = allTasks.filter((t) => {
    const parentDay = timeline.find((d) => d.tasks.some((task) => task.id === t.id));
    if (parentDay) {
      const dayInt = parseInt(parentDay.date.replace(/[^0-9]/g, ''));
      return dayInt > 13 && t.status === 'Pending';
    }
    return false;
  }).length;

  return (
    <div className="space-y-6" id="timeline-page">
      {/* Timeline Header Summary Widget */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 bg-white/5 p-5 border border-white/10 rounded-2xl backdrop-blur-sm" id="timeline-top-metrics">
        <div className="flex flex-col">
          <span className="text-[10px] font-mono text-white/40 uppercase">Today's Date</span>
          <span className="text-lg font-black font-display text-white mt-1 flex items-center gap-2">
            <Calendar size={15} className="text-[#FF6B00]" />
            {currentDateStr}, 2026
            <span className="text-[8px] bg-[#FF6B00]/10 border border-[#FF6B00]/40 text-[#FF6B00] px-1.5 py-0.5 rounded font-mono font-black uppercase tracking-wider animate-pulse">
              TODAY
            </span>
          </span>
        </div>

        <div className="flex flex-col border-t sm:border-t-0 sm:border-l border-white/5 pt-3 sm:pt-0 sm:pl-4">
          <span className="text-[10px] font-mono text-white/40 uppercase">Today's Content Tasks</span>
          <span className="text-base font-black font-mono text-white mt-1">
            {todayDay ? todayDay.tasks.length : 0} Staged
          </span>
        </div>

        <div className="flex flex-col border-t sm:border-t-0 sm:border-l border-white/5 pt-3 sm:pt-0 sm:pl-4">
          <span className="text-[10px] font-mono text-white/40 uppercase">Overdue Tasks</span>
          <span className={`text-base font-black font-mono mt-1 ${overdueCount > 0 ? 'text-red-400' : 'text-white/40'}`}>
            {overdueCount} Delayed
          </span>
        </div>

        <div className="flex flex-col border-t sm:border-t-0 sm:border-l border-white/5 pt-3 sm:pt-0 sm:pl-4">
          <span className="text-[10px] font-mono text-white/40 uppercase">Upcoming Tasks</span>
          <span className="text-base font-black font-mono text-blue-400 mt-1">
            {upcomingCount} Scheduled
          </span>
        </div>
      </div>

      {/* Filter timeline selector */}
      <div className="flex flex-wrap gap-2 py-1 items-center justify-between border-b border-zinc-900" id="timeline-filters">
        <div className="flex flex-wrap gap-1">
          <button
            onClick={() => setActiveDayFilter('ALL')}
            className={`px-3 py-1 text-xs font-mono rounded-lg border transition ${
              activeDayFilter === 'ALL'
                ? 'bg-[#FF6B00]/10 border-[#FF6B00]/60 text-[#FF6B00]'
                : 'bg-zinc-950 border-zinc-900 text-zinc-400 hover:text-white'
            }`}
          >
            ALL TIMELINE
          </button>
          
          <button
            onClick={() => setActiveDayFilter('TODAY')}
            className={`px-3 py-1 text-xs font-mono rounded-lg border transition ${
              activeDayFilter === 'TODAY'
                ? 'bg-amber-500/10 border-amber-500/50 text-amber-400'
                : 'bg-zinc-950 border-zinc-900 text-zinc-400 hover:text-white'
            }`}
          >
            TODAY ONLY ({currentDateStr})
          </button>

          <button
            onClick={() => setActiveDayFilter('EVENT')}
            className={`px-3 py-1 text-xs font-mono rounded-lg border transition ${
              activeDayFilter === 'EVENT'
                ? 'bg-[#FF6B00] border-orange-500 text-black font-bold glow-orange'
                : 'bg-zinc-950 border-zinc-900 text-zinc-400 hover:text-white'
            }`}
          >
            EVENT DAY
          </button>
        </div>

        <span className="text-[10px] font-mono text-zinc-600 block">
          Interactive Event Sequence Map (June 12 - June 28)
        </span>
      </div>

      {/* Timeline Stream */}
      <div className="space-y-6 relative pl-6 before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-[2px] before:bg-gradient-to-b before:from-[#FF6B00] before:via-zinc-800 before:to-[#FF6B00]/30" id="timeline-view">
        {timeline
          .filter(day => {
            if (activeDayFilter === 'TODAY') return day.date === currentDateStr;
            if (activeDayFilter === 'EVENT') return day.isEventDay;
            return true;
          })
          .map((day) => {
            const isToday = day.date === currentDateStr;
            const isEvent = day.isEventDay;

            return (
              <div 
                key={day.date} 
                className={`relative group ${isToday ? 'scale-[1.01]' : ''}`} 
                id={`day-block-${day.date.replace(' ', '')}`}
              >
                {/* Visual Timeline Marker Node */}
                <div 
                  className={`absolute -left-[30px] top-[4px] h-[10px] w-[10px] rounded-full border-2 transition-all duration-300 ${
                    isToday 
                      ? 'bg-[#FF6B00] border-[#FFFAFA] h-[14px] w-[14px] -left-[32px] ring-4 ring-[#FF6B00]/25' 
                      : isEvent
                      ? 'bg-amber-400 border-[#FF6B00] h-[12px] w-[12px] -left-[31px]'
                      : day.status === 'Completed'
                      ? 'bg-emerald-400 border-zinc-950'
                      : day.status === 'Delayed'
                      ? 'bg-red-400 border-zinc-950'
                      : 'bg-zinc-800 border-zinc-950'
                  }`} 
                />

                {/* Day Card */}
                <div 
                  className={`border p-5 rounded-3xl relative transition duration-300 backdrop-blur-md ${
                    isToday 
                      ? 'border-[#FF6B00]/65 bg-[#FF6B00]/10 shadow-[0_0_25px_rgba(255,107,0,0.1)]' 
                      : isEvent
                      ? 'border-[#FF6B00] bg-[#FF6B00]/10 shadow-[0_0_25px_rgba(255,107,0,0.15)]'
                      : 'border-white/10 bg-[#0C0C0C]/80 hover:border-white/25'
                  }`}
                >
                  {/* Top Day Banner */}
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 mb-4 border-b border-white/5 pb-3">
                    <div className="flex items-center gap-3">
                      <div>
                        <h4 className="font-display font-bold text-lg text-white flex items-center gap-2 tracking-wide">
                          {day.date}
                          {isToday && (
                            <span className="text-[9px] bg-[#FF6B00] text-black px-1.5 py-0.5 rounded font-mono font-black">
                              LIVE TARGET DATE
                            </span>
                          )}
                          {isEvent && (
                            <span className="text-[9px] bg-black text-[#FF6B00] border border-[#FF6B00] px-1.5 py-0.5 rounded font-mono font-black animate-pulse">
                              LIVE CONCERT EVENT
                            </span>
                          )}
                        </h4>
                        <span className="text-xs text-zinc-500 font-mono italic">
                          {day.description || 'Production Sequence Stage'}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-lg border ${
                        day.status === 'LIVE EVENT' 
                          ? 'bg-red-950/40 border-[#FF6B00] text-[#FF6B00]' 
                          : day.status === 'Completed'
                          ? 'bg-emerald-950/20 border-emerald-500/20 text-emerald-450'
                          : day.status === 'Delayed'
                          ? 'bg-red-950/20 border-red-500/20 text-red-400'
                          : 'bg-zinc-900 border-zinc-800 text-zinc-400'
                      }`}>
                        {day.status}
                      </span>
                    </div>
                  </div>

                  {/* Tasks List */}
                  {day.tasks.length === 0 ? (
                    <div className="py-4 text-center">
                      <span className="text-xs font-mono text-zinc-650 text-zinc-600 block">No Tasks Scheduled</span>
                    </div>
                  ) : (
                    <div className="space-y-3.5" id={`tasks-list-${day.date.replace(' ', '')}`}>
                      {/* Group tasks by category segment: Shoot, Edit, Post, Coordination */}
                      {(['Shoot', 'Edit', 'Post', 'Coordination'] as const).map((sec) => {
                        const secTasks = day.tasks.filter(t => t.section === sec);
                        if (secTasks.length === 0) return null;

                        return (
                          <div key={sec} className="grid grid-cols-1 md:grid-cols-4 gap-2 items-start" id={`section-block-${sec}`}>
                            {/* Segment header */}
                            <div className="md:col-span-1 pt-1">
                              <span className={`text-[11px] font-mono font-bold tracking-wider px-2 py-1 rounded inline-block ${
                                sec === 'Shoot' 
                                  ? 'bg-[#FF6B00]/10 text-[#FF6B00] border border-[#FF6B00]/20'
                                  : sec === 'Edit'
                                  ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                                  : sec === 'Post'
                                  ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20'
                                  : 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                              }`}>
                                {sec.toUpperCase()}:
                              </span>
                            </div>

                            {/* Segment items list */}
                            <div className="md:col-span-3 space-y-2">
                              {secTasks.map((task) => {
                                const isEditing = editingTaskId === task.id;
                                const isMoving = movingTaskId === task.id;
                                const isDuplicating = duplicatingTaskId === task.id;

                                return (
                                  <div 
                                    key={task.id} 
                                    className={`p-3 rounded-xl border transition flex flex-col md:flex-row justify-between gap-3 ${
                                      task.status === 'Completed'
                                        ? 'bg-zinc-950/30 border-zinc-900 text-zinc-500 line-through'
                                        : task.status === 'Delayed'
                                        ? 'bg-red-950/5 border-red-500/20 text-zinc-200'
                                        : task.status === 'Rescheduled'
                                        ? 'bg-zinc-950/60 border-amber-500/25 text-amber-300'
                                        : 'bg-zinc-950/80 border-zinc-850 text-zinc-200'
                                    }`}
                                    id={`task-${task.id}`}
                                  >
                                    <div className="flex-1 min-w-0">
                                      {isEditing ? (
                                        <div className="flex gap-2">
                                          <input
                                            type="text"
                                            value={editText}
                                            onChange={(e) => setEditText(e.target.value)}
                                            className="bg-zinc-900 border border-zinc-800 text-xs text-white rounded px-2.5 py-1 outline-none focus:border-[#FF6B00] flex-1"
                                          />
                                          <select
                                            value={editSection}
                                            onChange={(e) => setEditSection(e.target.value as any)}
                                            className="bg-zinc-900 border border-zinc-850 text-xs text-zinc-300 rounded px-2.5 py-1"
                                          >
                                            <option value="Shoot">Shoot</option>
                                            <option value="Edit">Edit</option>
                                            <option value="Post">Post</option>
                                            <option value="Coordination">Coordination</option>
                                          </select>
                                          <button
                                            onClick={() => handleSaveEdit(day.date, task.id)}
                                            className="bg-[#FF6B00] hover:bg-orange-600 text-black rounded p-1 px-2.5 text-xs font-semibold"
                                          >
                                            Save
                                          </button>
                                          <button
                                            onClick={() => setEditingTaskId(null)}
                                            className="bg-zinc-800 text-zinc-400 rounded p-1 px-2 text-xs"
                                          >
                                            <X size={12} />
                                          </button>
                                        </div>
                                      ) : (
                                        <div>
                                          <div className="flex flex-wrap items-center gap-1.5">
                                            <span className="text-xs md:text-sm font-medium tracking-wide">
                                              {task.text}
                                            </span>
                                            
                                            {/* History Pill Badges */}
                                            {task.status === 'Rescheduled' && task.originalDate && (
                                              <span className="text-[9px] bg-amber-500/10 border border-amber-500/30 text-amber-300 px-1.5 py-0.5 rounded font-mono">
                                                Rescheduled from {task.originalDate}
                                              </span>
                                            )}
                                            {task.status === 'Delayed' && (
                                              <span className="text-[9px] bg-red-500/15 border border-red-500/30 text-red-400 px-1.5 py-0.5 rounded font-mono">
                                                DELAYED
                                              </span>
                                            )}
                                          </div>
                                        </div>
                                      )}
                                    </div>

                                    {/* Action Operators per Task */}
                                    {!isEditing && !isMoving && !isDuplicating && (
                                      <div className="flex items-center gap-2 justify-end opacity-80 sm:opacity-0 group-hover:opacity-100 transition-opacity">
                                        {/* Completed toggle */}
                                        <button
                                          onClick={() => handleToggleTaskStatus(day.date, task.id, task.status === 'Completed' ? 'Pending' : 'Completed')}
                                          className={`p-1 rounded text-xs transition ${
                                            task.status === 'Completed'
                                              ? 'bg-emerald-950/30 border border-emerald-500/30 text-emerald-400 hover:bg-zinc-900'
                                              : 'bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-400 hover:text-emerald-400'
                                          }`}
                                          title="Mark Completed"
                                        >
                                          <Check size={12} />
                                        </button>

                                        {/* Delayed toggle */}
                                        <button
                                          onClick={() => handleToggleTaskStatus(day.date, task.id, task.status === 'Delayed' ? 'Pending' : 'Delayed')}
                                          className={`p-1 rounded text-xs transition ${
                                            task.status === 'Delayed'
                                              ? 'bg-red-950/30 border border-red-500/30 text-red-400'
                                              : 'bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-400 hover:text-red-400'
                                          }`}
                                          title="Mark Delayed / Delayed"
                                        >
                                          <Clock size={12} />
                                        </button>

                                        {/* Reschedule Button */}
                                        <button
                                          onClick={() => {
                                            setMovingTaskId(task.id);
                                            setRescheduleDestDay(day.date);
                                          }}
                                          className="p-1 rounded bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-400 hover:text-amber-400"
                                          title="Reschedule / Move to another day"
                                        >
                                          <ArrowRightLeft size={11} />
                                        </button>

                                        {/* Duplicate Task Button */}
                                        <button
                                          onClick={() => {
                                            setDuplicatingTaskId(task.id);
                                            setDuplicateDestDay(day.date);
                                          }}
                                          className="p-1 rounded bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-400 hover:text-purple-400"
                                          title="Duplicate task"
                                        >
                                          <Copy size={11} />
                                        </button>

                                        {/* Edit Details */}
                                        <button
                                          onClick={() => handleStartEdit(task)}
                                          className="p-1 rounded bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-400 hover:text-white"
                                          title="Edit Task"
                                        >
                                          <Edit3 size={11} />
                                        </button>

                                        {/* Delete */}
                                        <button
                                          onClick={() => handleDeleteTask(day.date, task.id)}
                                          className="p-1 rounded bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-400 hover:text-red-400"
                                          title="Delete Task"
                                        >
                                          <Trash2 size={11} />
                                        </button>
                                      </div>
                                    )}

                                    {/* Inline Move Selector */}
                                    {isMoving && (
                                      <div className="flex flex-col gap-2 p-1.5 bg-zinc-900 rounded border border-amber-500/40 w-full max-w-sm">
                                        <span className="text-[10px] font-mono text-amber-400">SELECT TARGET RESCHEDULE DATE:</span>
                                        <div className="flex gap-1.5">
                                          <select
                                            value={rescheduleDestDay}
                                            onChange={(e) => setRescheduleDestDay(e.target.value)}
                                            className="bg-black border border-zinc-800 text-xs text-white rounded p-1 flex-1 outline-none"
                                          >
                                            {timeline.map(d => (
                                              <option key={d.date} value={d.date}>{d.date} ({d.isEventDay ? 'LIVE EVENT' : d.status})</option>
                                            ))}
                                          </select>
                                          <button
                                            onClick={() => handleRescheduleTask(day.date, task.id)}
                                            className="bg-amber-500 hover:bg-amber-600 text-black px-2.5 py-1 text-xs font-bold rounded flex items-center gap-1 cursor-pointer"
                                          >
                                            Move <ArrowRight size={11} />
                                          </button>
                                          <button
                                            onClick={() => setMovingTaskId(null)}
                                            className="bg-zinc-800 text-zinc-400 px-2 py-1 text-xs rounded"
                                          >
                                            Cancel
                                          </button>
                                        </div>
                                      </div>
                                    )}

                                    {/* Inline Duplicate Selector */}
                                    {isDuplicating && (
                                      <div className="flex flex-col gap-2 p-1.5 bg-zinc-900 rounded border border-purple-500/40 w-full max-w-sm">
                                        <span className="text-[10px] font-mono text-purple-400">SELECT DAY TO DUPLICATE INTO:</span>
                                        <div className="flex gap-1.5">
                                          <select
                                            value={duplicateDestDay}
                                            onChange={(e) => setDuplicateDestDay(e.target.value)}
                                            className="bg-black border border-zinc-800 text-xs text-white rounded p-1 flex-1 outline-none"
                                          >
                                            {timeline.map(d => (
                                              <option key={d.date} value={d.date}>{d.date}</option>
                                            ))}
                                          </select>
                                          <button
                                            onClick={() => handleDuplicateTask(day.date, task.id)}
                                            className="bg-purple-500 hover:bg-purple-650 text-white px-2.5 py-1 text-xs font-bold rounded flex items-center gap-1 cursor-pointer"
                                          >
                                            Copy <Copy size={11} />
                                          </button>
                                          <button
                                            onClick={() => setDuplicatingTaskId(null)}
                                            className="bg-zinc-800 text-zinc-400 px-2 py-1 text-xs rounded"
                                          >
                                            Cancel
                                          </button>
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Add Task control at bottom of Day Card */}
                  <div className="mt-4 pt-3 border-t border-zinc-900">
                    {addingTaskDay === day.date ? (
                      <div className="bg-[#0e0e0e]/50 border border-zinc-850 p-4 rounded-xl space-y-3 max-w-xl" id={`add-task-panel-${day.date.replace(' ', '')}`}>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <div>
                            <label className="text-[10px] uppercase font-mono text-zinc-500 block mb-1">Task Category / section</label>
                            <div className="flex gap-1.5">
                              {(['Shoot', 'Edit', 'Post', 'Coordination'] as const).map(sec => (
                                <button
                                  key={sec}
                                  type="button"
                                  onClick={() => setNewSection(sec)}
                                  className={`px-2 py-1.5 rounded text-[10px] uppercase font-mono font-bold border transition ${
                                    newSection === sec
                                      ? 'bg-zinc-100 text-black border-white'
                                      : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:text-white'
                                  }`}
                                >
                                  {sec}
                                </button>
                              ))}
                            </div>
                          </div>
                          <div>
                            <label className="text-[10px] uppercase font-mono text-zinc-500 block mb-1">Task description</label>
                            <input
                              type="text"
                              value={newText}
                              onChange={(e) => setNewText(e.target.value)}
                              placeholder="e.g. Artist Rehearsal Footage"
                              className="w-full bg-zinc-950 border border-zinc-800 focus:border-[#FF6B00] rounded px-2.5 py-1.5 text-xs text-white outline-none"
                            />
                          </div>
                        </div>

                        <div className="flex gap-2 justify-end pt-2">
                          <button
                            type="button"
                            onClick={() => setAddingTaskDay(null)}
                            className="bg-zinc-900 border border-zinc-800 hover:bg-zinc-850 text-zinc-400 rounded-lg px-3 py-1.5 text-xs font-semibold"
                          >
                            Cancel
                          </button>
                          <button
                            type="button"
                            onClick={() => handleAddTask(day.date)}
                            className="bg-[#FF6B00] hover:bg-orange-600 text-black rounded-lg px-4 py-1.5 text-xs font-bold flex items-center gap-1 cursor-pointer"
                          >
                            <Plus size={13} /> Add Task
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button
                        onClick={() => {
                          setAddingTaskDay(day.date);
                          setNewText('');
                          setNewSection('Shoot');
                        }}
                        className="text-zinc-500 hover:text-white text-xs font-mono py-1 px-3 rounded hover:bg-zinc-900 border border-dashed border-zinc-900 hover:border-zinc-850 transition flex items-center gap-1 bg-zinc-950/50 cursor-pointer"
                        id={`btn-open-addtask-${day.date.replace(' ', '')}`}
                      >
                        <Plus size={12} /> Add Day Action Item
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
      </div>
    </div>
  );
};
