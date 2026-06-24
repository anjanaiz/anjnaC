import React from 'react';
import { VideoItem, Stall } from '../types';
import { Film, CheckCircle2, Clock, DollarSign, AlertCircle, Percent, Disc, Store } from 'lucide-react';

interface StatsOverviewProps {
  categories: { id: string; name: string; items: VideoItem[] }[];
  stalls: Stall[];
  currentDateStr: string;
}

export const StatsOverview: React.FC<StatsOverviewProps> = ({
  categories,
  stalls,
  currentDateStr,
}) => {
  // Page 01 stats (Content tracking)
  const allContentItems = categories.flatMap((cat) => cat.items);
  const totalContent = allContentItems.length;
  const toShootCount = allContentItems.filter((i) => i.status === 'TO SHOOT').length;
  const editPendingCount = allContentItems.filter((i) => i.status === 'EDIT PENDING').length;
  const doneCount = allContentItems.filter((i) => i.status === 'DONE').length;
  const contentCompletionPercent = totalContent > 0 ? Math.round((doneCount / totalContent) * 100) : 0;

  // Stall stats for dashboard widget
  const totalStalls = stalls.length;
  const assignedStalls = stalls.filter((s) => s.vendorName.trim().length > 0).length;
  const fullyPaidStalls = stalls.filter((s) => s.advancePayment > 0 && s.remainingBalance === 0).length;
  const totalOutstanding = stalls.reduce((sum, s) => sum + s.remainingBalance, 0);
  const totalAdvances = stalls.reduce((sum, s) => sum + s.advancePayment, 0);

  const paymentCompletionPercent = totalStalls > 0
    ? Math.round((fullyPaidStalls / totalStalls) * 100)
    : 0;

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

      {/* Stall Ledger / Payment status */}
      <div id="stat-timeline" className="bg-white/5 border border-white/10 p-4 rounded-2xl backdrop-blur-sm hover:border-white/20 transition-all duration-300">
        <div className="flex justify-between items-start">
          <div>
            <span className="text-[10px] uppercase font-mono text-white/40 block mb-1">Stalls Paid</span>
            <span className="text-2xl font-black font-display text-white">{paymentCompletionPercent}%</span>
          </div>
          <div className="p-2 rounded-xl bg-white/5 border border-white/5 text-white/40">
            <Store size={14} />
          </div>
        </div>
        <div className="mt-2 text-[10px] font-mono text-white/60">
          <span>{fullyPaidStalls} of {totalStalls} fully paid</span>
        </div>
      </div>

      {/* Stall Balance outstanding details */}
      <div id="stat-overdue" className="bg-white/5 border border-white/10 p-4 rounded-2xl backdrop-blur-sm hover:border-white/20 transition-all duration-300 col-span-2 md:col-span-1">
        <div className="flex justify-between items-start">
          <div>
            <span className="text-[10px] uppercase font-mono text-white/40 block mb-1">Pending Balance</span>
            <span className="text-[11px] font-black font-mono text-rose-400">
              Rs. {totalOutstanding.toLocaleString()}
            </span>
          </div>
          <div className="p-2 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400">
            <AlertCircle size={15} />
          </div>
        </div>
        <div className="mt-1 text-[9px] font-mono text-white/40 block">
          Arrears in LKR accounts
        </div>
      </div>
    </div>
  );
};
