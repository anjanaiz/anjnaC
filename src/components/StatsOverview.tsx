import React from 'react';
import { VideoItem, TimelineDay } from '../types';
import { Film, CheckCircle2, Clock, Calendar, AlertCircle, Percent, Disc } from 'lucide-react';

interface StatsOverviewProps {
  categories: { id: string; name: string; items: VideoItem[] }[];
  timeline: TimelineDay[];
  currentDateStr: string;
}

export const StatsOverview: React.FC<StatsOverviewProps> = ({
  categories,
  timeline,
  currentDateStr,
}) => {
  // Page 01 stats (Content tracking)
  const allContentItems = categories.flatMap((cat) => cat.items);
  const totalContent = allContentItems.length;
  const toShootCount = allContentItems.filter((i) => i.status === 'TO SHOOT').length;
  const editPendingCount = allContentItems.filter((i) => i.status === 'EDIT PENDING').length;
  const doneCount = allContentItems.filter((i) => i.status === 'DONE').length;
  const contentCompletionPercent = totalContent > 0 ? Math.round((doneCount / totalContent) * 100) : 0;

  // Page 02 stats (Timeline)
  const allTimelineTasks = timeline.flatMap((d) => d.tasks);
  const totalTimelineTasksCount = allTimelineTasks.length;
  const completedTimelineTasksCount = allTimelineTasks.filter((t) => t.status === 'Completed').length;
  const overdueTimelineTasksCount = allTimelineTasks.filter((t) => {
    // If date is before June 13, and task status is not completed, it is overdue
    // Our fake year is 2026. Dates are formatted as "JUNE 12", "JUNE 13", etc.
    const dayNum = parseInt(t.id.split('_')[1]?.replace(/[^0-9]/g, '') || '0') || parseInt(t.id.match(/\d+/)?.[0] || '0');
    // Simple mock overdue check: June 13 is current day. Dates < 13 with status != Completed or Delayed are overdue.
    // Let's check status directly. If day is less than 13 and status is Pending, it is overdue!
    if (t.status === 'Pending') {
      // Find what day this task belongs to
      const parentDay = timeline.find((d) => d.tasks.some((task) => task.id === t.id));
      if (parentDay) {
        const dayInt = parseInt(parentDay.date.replace(/[^0-9]/g, ''));
        return dayInt < 13;
      }
    }
    return t.status === 'Delayed';
  }).length;

  const timelineCompletionPercent = totalTimelineTasksCount > 0
    ? Math.round((completedTimelineTasksCount / totalTimelineTasksCount) * 100)
    : 0;

  // Active today's day & tasks
  const todayDay = timeline.find((d) => d.date === currentDateStr);
  const todayTasksCount = todayDay ? todayDay.tasks.length : 0;
  const upcomingTasksCount = allTimelineTasks.filter((t) => {
    const parentDay = timeline.find((d) => d.tasks.some((task) => task.id === t.id));
    if (parentDay) {
      const dayInt = parseInt(parentDay.date.replace(/[^0-9]/g, ''));
      return dayInt > 13 && t.status === 'Pending';
    }
    return false;
  }).length;

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4" id="stats-container">
      {/* Total content count card */}
      <div id="stat-total-content" className="bg-white/5 border border-white/10 p-4 rounded-2xl backdrop-blur-sm hover:border-white/20 transition-all duration-300">
        <div className="flex justify-between items-start">
          <div>
            <span className="text-[10px] uppercase font-mono text-white/40 block mb-1">Total Videos</span>
            <span className="text-3xl font-black font-display text-white">{totalContent}</span>
          </div>
          <div className="p-2 rounded-xl bg-white/5 border border-white/5 text-white/60">
            <Film size={16} />
          </div>
        </div>
      </div>

      {/* Done Count */}
      <div id="stat-done" className="bg-white/5 border border-white/10 p-4 rounded-2xl backdrop-blur-sm hover:border-white/20 transition-all duration-300">
        <div className="flex justify-between items-start">
          <div>
            <span className="text-[10px] uppercase font-mono text-white/40 block mb-1">Videos Done</span>
            <span className="text-3xl font-black font-display text-emerald-400">{doneCount}</span>
          </div>
          <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
            <CheckCircle2 size={16} />
          </div>
        </div>
      </div>

      {/* Pending Shoots */}
      <div id="stat-to-shoot" className="bg-white/5 border border-white/10 p-4 rounded-2xl backdrop-blur-sm hover:border-white/20 transition-all duration-300">
        <div className="flex justify-between items-start">
          <div>
            <span className="text-[10px] uppercase font-mono text-white/40 block mb-1">To Shoot</span>
            <span className="text-3xl font-black font-display text-[#FF6B00]">{toShootCount}</span>
          </div>
          <div className="p-2 rounded-xl bg-[#FF6B00]/10 border border-[#FF6B00]/20 text-[#FF6B00]">
            <Disc className="animate-pulse" size={16} />
          </div>
        </div>
      </div>

      {/* Pending Edits */}
      <div id="stat-pending-edits" className="bg-white/5 border border-white/10 p-4 rounded-2xl backdrop-blur-sm hover:border-white/20 transition-all duration-300">
        <div className="flex justify-between items-start">
          <div>
            <span className="text-[10px] uppercase font-mono text-white/40 block mb-1">Pending Edits</span>
            <span className="text-3xl font-black font-display text-amber-400">{editPendingCount}</span>
          </div>
          <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400">
            <Clock size={16} />
          </div>
        </div>
      </div>

      {/* Completion Percentage */}
      <div id="stat-completion-pct" className="bg-white/5 border border-white/10 p-4 rounded-2xl backdrop-blur-sm hover:border-white/20 transition-all duration-300">
        <div className="flex justify-between items-start mb-2">
          <div>
            <span className="text-[10px] uppercase font-mono text-white/40 block mb-1">Shoot Progress</span>
            <span className="text-2xl font-black font-display text-white">{contentCompletionPercent}%</span>
          </div>
          <div className="p-2 rounded-xl bg-white/5 border border-white/5 text-white/40">
            <Percent size={14} />
          </div>
        </div>
        <div className="bg-white/10 rounded-full h-1 overflow-hidden">
          <div 
            className="bg-[#FF6B00] h-full rounded-full transition-all duration-500 shadow-[0_0_8px_#FF6B00]"
            style={{ width: `${contentCompletionPercent}%` }}
          />
        </div>
      </div>

      {/* Timeline Status */}
      <div id="stat-timeline" className="bg-white/5 border border-white/10 p-4 rounded-2xl backdrop-blur-sm hover:border-white/20 transition-all duration-300">
        <div className="flex justify-between items-start">
          <div>
            <span className="text-[10px] uppercase font-mono text-white/40 block mb-1">Time Progress</span>
            <span className="text-2xl font-black font-display text-white">{timelineCompletionPercent}%</span>
          </div>
          <div className="p-2 rounded-xl bg-white/5 border border-white/5 text-white/40">
            <Calendar size={14} />
          </div>
        </div>
        <div className="mt-2 text-[10px] font-mono text-white/60">
          <span>{dueDateStatusLabel(overdueTimelineTasksCount)}</span>
        </div>
      </div>

      {/* Tasks Overview Widget */}
      <div id="stat-overdue" className="bg-white/5 border border-white/10 p-4 rounded-2xl backdrop-blur-sm hover:border-white/20 transition-all duration-300 col-span-2 md:col-span-1">
        <div className="flex justify-between items-start">
          <div>
            <span className="text-[10px] uppercase font-mono text-white/40 block mb-1">Delay / Scheduled</span>
            <span className="text-base font-black font-mono text-red-400">
              {overdueTimelineTasksCount} <span className="text-white/20 text-xs">/</span> <span className="text-blue-400">{upcomingTasksCount}</span>
            </span>
          </div>
          <div className="p-2 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400">
            <AlertCircle size={15} />
          </div>
        </div>
        <div className="mt-1 text-[9px] font-mono text-white/40 block">
          Today: {todayTasksCount} assigned
        </div>
      </div>
    </div>
  );
};

function dueDateStatusLabel(overdueCount: number): string {
  if (overdueCount === 0) return "Schedules on Track";
  if (overdueCount === 1) return "1 Rescheduled Task";
  return `${overdueCount} Delayed Tasks`;
}
