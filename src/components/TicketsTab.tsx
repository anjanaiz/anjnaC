import React, { useState, useEffect } from 'react';
import { TicketPhase, TicketCategoryItem, TicketPhaseId, TicketPhaseStatus } from '../types';
import { 
  Ticket, 
  Check, 
  X, 
  Edit3, 
  ShieldCheck, 
  DollarSign, 
  Users, 
  Sparkles, 
  Clock, 
  AlertCircle, 
  CheckCircle2, 
  Plus, 
  Trash2, 
  RefreshCw,
  Tag,
  Lock,
  Eye,
  EyeOff,
  ShoppingBag,
  TrendingUp,
  ArrowRight
} from 'lucide-react';
import { doc, setDoc, onSnapshot } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';

const cleanUndefined = (obj: any): any => {
  if (obj === null || obj === undefined) return null;
  if (Array.isArray(obj)) {
    return obj.map(cleanUndefined);
  }
  if (typeof obj === 'object') {
    const cleaned: Record<string, any> = {};
    for (const key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        const val = obj[key];
        if (val !== undefined) {
          cleaned[key] = cleanUndefined(val);
        }
      }
    }
    return cleaned;
  }
  return obj;
};

export const INITIAL_TICKET_CATEGORIES_EARLY_BIRD: TicketCategoryItem[] = [
  { id: 'standing', name: 'Standing', pax: '1 Pax', price: 3000, isEnabled: true, isSoldOut: false },
  { id: 'seating', name: 'Seating', pax: '1 Pax', price: 5000, isEnabled: true, isSoldOut: false },
  { id: 'vip', name: 'VIP', pax: '1 Pax', price: 6500, isEnabled: true, isSoldOut: false },
  { id: 'premium', name: 'Premium', pax: '1 Pax', price: 15000, isEnabled: true, isSoldOut: false },
  { id: 'table', name: 'Table', pax: '6 Pax', price: 45000, isEnabled: true, isSoldOut: false },
  { id: 'standing_group', name: 'Standing Group', pax: '10 Pax', price: 25000, isEnabled: true, isSoldOut: false },
  { id: 'seating_group', name: 'Seating Group', pax: '4 Pax', price: 18000, isEnabled: true, isSoldOut: false },
  { id: 'vip_couple', name: 'VIP Couple', pax: '2 Pax', price: 12000, isEnabled: true, isSoldOut: false },
];

export const INITIAL_TICKET_CATEGORIES_TBA: TicketCategoryItem[] = [
  { id: 'standing', name: 'Standing', pax: '1 Pax', price: null, isEnabled: true, isSoldOut: false },
  { id: 'seating', name: 'Seating', pax: '1 Pax', price: null, isEnabled: true, isSoldOut: false },
  { id: 'vip', name: 'VIP', pax: '1 Pax', price: null, isEnabled: true, isSoldOut: false },
  { id: 'premium', name: 'Premium', pax: '1 Pax', price: null, isEnabled: true, isSoldOut: false },
  { id: 'table', name: 'Table', pax: '6 Pax', price: null, isEnabled: true, isSoldOut: false },
  { id: 'standing_group', name: 'Standing Group', pax: '10 Pax', price: null, isEnabled: true, isSoldOut: false },
  { id: 'seating_group', name: 'Seating Group', pax: '4 Pax', price: null, isEnabled: true, isSoldOut: false },
  { id: 'vip_couple', name: 'VIP Couple', pax: '2 Pax', price: null, isEnabled: true, isSoldOut: false },
];

export const INITIAL_TICKET_PHASES: TicketPhase[] = [
  {
    id: 'early_bird',
    name: 'Early Bird',
    status: 'Active',
    categories: INITIAL_TICKET_CATEGORIES_EARLY_BIRD,
    ticketsSold: 0,
    revenue: 0,
    remainingTickets: null
  },
  {
    id: 'presale_1',
    name: 'Pre-Sale 1',
    status: 'Upcoming',
    categories: INITIAL_TICKET_CATEGORIES_TBA,
    ticketsSold: 0,
    revenue: 0,
    remainingTickets: null
  },
  {
    id: 'presale_2',
    name: 'Pre-Sale 2',
    status: 'Upcoming',
    categories: INITIAL_TICKET_CATEGORIES_TBA,
    ticketsSold: 0,
    revenue: 0,
    remainingTickets: null
  }
];

interface TicketsTabProps {
  eventId?: 'chakra360' | 'kathawak';
}

export const TicketsTab: React.FC<TicketsTabProps> = ({ eventId = 'chakra360' }) => {
  const storageKey = `tickets_${eventId}`;
  const docRefPath = `tickets_${eventId}`;

  const [phases, setPhases] = useState<TicketPhase[]>(() => {
    const saved = localStorage.getItem(storageKey);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch (e) {
        console.error("Failed to parse cached tickets data:", e);
      }
    }
    return INITIAL_TICKET_PHASES;
  });

  const [selectedPhaseId, setSelectedPhaseId] = useState<TicketPhaseId>('early_bird');
  const [isAdminMode, setIsAdminMode] = useState<boolean>(false);
  const [editingCategory, setEditingCategory] = useState<{
    phaseId: TicketPhaseId;
    categoryId: string;
    name: string;
    pax: string;
    price: string; // 'TBA' or numeric string
    isEnabled: boolean;
    isSoldOut: boolean;
  } | null>(null);

  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null);

  // Sync real-time with Firestore doc: settings / tickets_{eventId}
  useEffect(() => {
    const unsub = onSnapshot(doc(db, 'settings', docRefPath), (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data();
        if (data && Array.isArray(data.phases)) {
          setPhases(data.phases);
          localStorage.setItem(storageKey, JSON.stringify(data.phases));
        }
      }
    }, (err) => {
      console.warn("Realtime tickets sync warning:", err);
    });

    return () => unsub();
  }, [eventId, storageKey, docRefPath]);

  // Save changes helper
  const updatePhasesAndSync = async (newPhases: TicketPhase[]) => {
    setPhases(newPhases);
    localStorage.setItem(storageKey, JSON.stringify(newPhases));
    setIsSaving(true);

    try {
      await setDoc(doc(db, 'settings', docRefPath), cleanUndefined({
        phases: newPhases,
        updatedAt: Date.now()
      }));
      setSaveSuccessMsg("Ticket configurations updated and saved to Cloud Database!");
      setTimeout(() => setSaveSuccessMsg(null), 3000);
    } catch (err) {
      console.error("Firestore setDoc failed:", err);
      handleFirestoreError(err, OperationType.WRITE, `settings/${docRefPath}`);
    } finally {
      setIsSaving(false);
    }
  };

  // Phase Status change handler
  const handleUpdatePhaseStatus = async (phaseId: TicketPhaseId, status: TicketPhaseStatus) => {
    const updated = phases.map(p => {
      if (p.id === phaseId) {
        return { ...p, status };
      }
      return p;
    });
    await updatePhasesAndSync(updated);
  };

  // Admin edit category
  const handleStartEditCategory = (phaseId: TicketPhaseId, cat: TicketCategoryItem) => {
    setEditingCategory({
      phaseId,
      categoryId: cat.id,
      name: cat.name,
      pax: cat.pax,
      price: cat.price === null ? 'TBA' : cat.price.toString(),
      isEnabled: cat.isEnabled !== false,
      isSoldOut: !!cat.isSoldOut
    });
  };

  const handleSaveCategoryEdit = async () => {
    if (!editingCategory) return;
    const { phaseId, categoryId, name, pax, price, isEnabled, isSoldOut } = editingCategory;

    let numericPrice: number | null = null;
    if (price.trim().toUpperCase() !== 'TBA' && price.trim() !== '') {
      const parsed = parseFloat(price.replace(/[^0-9.]/g, ''));
      if (!isNaN(parsed)) {
        numericPrice = parsed;
      }
    }

    const updated = phases.map(phase => {
      if (phase.id === phaseId) {
        const updatedCats = phase.categories.map(c => {
          if (c.id === categoryId) {
            return {
              ...c,
              name,
              pax,
              price: numericPrice,
              isEnabled,
              isSoldOut
            };
          }
          return c;
        });
        return { ...phase, categories: updatedCats };
      }
      return phase;
    });

    await updatePhasesAndSync(updated);
    setEditingCategory(null);
  };

  // Quick toggle Sold Out
  const handleToggleSoldOut = async (phaseId: TicketPhaseId, categoryId: string) => {
    const updated = phases.map(phase => {
      if (phase.id === phaseId) {
        const updatedCats = phase.categories.map(c => {
          if (c.id === categoryId) {
            return { ...c, isSoldOut: !c.isSoldOut };
          }
          return c;
        });
        return { ...phase, categories: updatedCats };
      }
      return phase;
    });
    await updatePhasesAndSync(updated);
  };

  // Quick toggle Enable/Disable
  const handleToggleEnable = async (phaseId: TicketPhaseId, categoryId: string) => {
    const updated = phases.map(phase => {
      if (phase.id === phaseId) {
        const updatedCats = phase.categories.map(c => {
          if (c.id === categoryId) {
            return { ...c, isEnabled: !c.isEnabled };
          }
          return c;
        });
        return { ...phase, categories: updatedCats };
      }
      return phase;
    });
    await updatePhasesAndSync(updated);
  };

  const currentPhase = phases.find(p => p.status === 'Active') || phases[0];
  const activeSelectedPhase = phases.find(p => p.id === selectedPhaseId) || phases[0];
  const nextPhase = phases.find(p => p.status === 'Upcoming') || null;

  const totalCategoriesCount = activeSelectedPhase.categories.filter(c => c.isEnabled !== false).length;

  return (
    <div className="space-y-8 animate-fadeIn text-white">
      
      {/* SUCCESS ALERTS */}
      {saveSuccessMsg && (
        <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 p-3.5 rounded-xl flex items-center justify-between text-xs font-mono animate-slideDown">
          <div className="flex items-center gap-2">
            <CheckCircle2 size={16} />
            <span>{saveSuccessMsg}</span>
          </div>
          <button onClick={() => setSaveSuccessMsg(null)} className="hover:text-white">
            <X size={14} />
          </button>
        </div>
      )}

      {/* HEADER & ADMIN TOGGLE */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-[#121212] border border-white/10 p-5 rounded-2xl">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#FF6B00]/10 border border-[#FF6B00]/20 flex items-center justify-center text-[#FF6B00]">
            <Ticket size={22} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold font-display tracking-tight text-white">
                Event Ticket Sales & Pricing Hub
              </h2>
              <span className="text-[10px] font-mono font-bold bg-white/5 border border-white/10 px-2 py-0.5 rounded text-zinc-400">
                OFFICIAL
              </span>
            </div>
            <p className="text-xs text-zinc-400 font-mono mt-0.5">
              Manage phase transitions, pricing structures, and sales availability in real-time.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 self-end sm:self-center">
          <button
            onClick={() => setIsAdminMode(!isAdminMode)}
            className={`px-3.5 py-2 rounded-xl text-xs font-mono font-bold flex items-center gap-2 transition cursor-pointer ${
              isAdminMode 
                ? 'bg-[#FF6B00] text-black shadow-[0_0_15px_rgba(255,107,0,0.3)]' 
                : 'bg-white/5 hover:bg-white/10 text-zinc-300 border border-white/10'
            }`}
          >
            <ShieldCheck size={14} />
            <span>{isAdminMode ? 'Admin Mode: Active' : 'Enable Admin Price Editor'}</span>
          </button>
        </div>
      </div>

      {/* TOP DASHBOARD SUMMARY CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-3.5">
        
        {/* CURRENT PHASE */}
        <div className="bg-[#111111] border border-white/5 p-4 rounded-2xl relative overflow-hidden flex flex-col justify-between">
          <div className="text-[10px] uppercase font-mono tracking-wider text-zinc-400 font-semibold mb-2">
            Current Active Phase
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-xl font-extrabold font-display text-white">
              {currentPhase.name}
            </span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              ACTIVE
            </span>
          </div>
          <div className="text-[10px] text-zinc-500 font-mono mt-2 flex items-center gap-1">
            <Clock size={11} className="text-[#FF6B00]" />
            <span>Live Sales Open</span>
          </div>
        </div>

        {/* TOTAL TICKET CATEGORIES */}
        <div className="bg-[#111111] border border-white/5 p-4 rounded-2xl flex flex-col justify-between">
          <div className="text-[10px] uppercase font-mono tracking-wider text-zinc-400 font-semibold mb-2">
            Total Categories
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-extrabold font-display text-[#FF6B00]">
              {totalCategoriesCount}
            </span>
            <span className="text-xs font-mono text-zinc-400">Tiers</span>
          </div>
          <div className="text-[10px] text-zinc-500 font-mono mt-2">
            In {activeSelectedPhase.name}
          </div>
        </div>

        {/* NEXT PHASE */}
        <div className="bg-[#111111] border border-white/5 p-4 rounded-2xl flex flex-col justify-between">
          <div className="text-[10px] uppercase font-mono tracking-wider text-zinc-400 font-semibold mb-2">
            Next Sales Phase
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-xl font-extrabold font-display text-zinc-200">
              {nextPhase ? nextPhase.name : 'Final Phase'}
            </span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full font-bold bg-blue-500/20 text-blue-400 border border-blue-500/30">
              UPCOMING
            </span>
          </div>
          <div className="text-[10px] text-zinc-500 font-mono mt-2 flex items-center gap-1">
            <ArrowRight size={11} className="text-zinc-400" />
            <span>Prices TBA / Ready</span>
          </div>
        </div>

        {/* TICKETS SOLD */}
        <div className="bg-[#111111] border border-white/5 p-4 rounded-2xl flex flex-col justify-between">
          <div className="text-[10px] uppercase font-mono tracking-wider text-zinc-400 font-semibold mb-2 flex items-center gap-1">
            <ShoppingBag size={11} /> Tickets Sold
          </div>
          <div className="text-lg font-bold font-mono text-zinc-300">
            {currentPhase.ticketsSold && currentPhase.ticketsSold > 0 ? currentPhase.ticketsSold : 'No Data Yet'}
          </div>
          <div className="text-[10px] text-zinc-500 font-mono mt-2">
            Real-time counter
          </div>
        </div>

        {/* REVENUE */}
        <div className="bg-[#111111] border border-white/5 p-4 rounded-2xl flex flex-col justify-between">
          <div className="text-[10px] uppercase font-mono tracking-wider text-zinc-400 font-semibold mb-2 flex items-center gap-1">
            <TrendingUp size={11} /> Est. Revenue
          </div>
          <div className="text-lg font-bold font-mono text-zinc-300">
            {currentPhase.revenue && currentPhase.revenue > 0 ? `LKR ${currentPhase.revenue.toLocaleString()}` : 'No Data Yet'}
          </div>
          <div className="text-[10px] text-zinc-500 font-mono mt-2">
            Gross sales summary
          </div>
        </div>

        {/* REMAINING TICKETS */}
        <div className="bg-[#111111] border border-white/5 p-4 rounded-2xl flex flex-col justify-between">
          <div className="text-[10px] uppercase font-mono tracking-wider text-zinc-400 font-semibold mb-2">
            Remaining Stock
          </div>
          <div className="text-lg font-bold font-mono text-zinc-300">
            {currentPhase.remainingTickets ? currentPhase.remainingTickets : 'No Data Yet'}
          </div>
          <div className="text-[10px] text-zinc-500 font-mono mt-2">
            Capacity management
          </div>
        </div>

      </div>

      {/* PHASE SELECTION TABS */}
      <div className="space-y-4">
        <div className="flex items-center justify-between border-b border-white/10 pb-3">
          <div className="flex items-center gap-2">
            <Sparkles size={16} className="text-[#FF6B00]" />
            <h3 className="text-sm font-bold font-mono uppercase tracking-wider text-zinc-300">
              Select Ticket Phase View
            </h3>
          </div>
          <span className="text-xs text-zinc-500 font-mono hidden sm:inline">
            Click on a phase tab to inspect or configure categories
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {phases.map((phase) => {
            const isSelected = selectedPhaseId === phase.id;
            
            return (
              <div
                key={phase.id}
                onClick={() => setSelectedPhaseId(phase.id)}
                className={`p-5 rounded-2xl border transition-all duration-200 cursor-pointer relative overflow-hidden ${
                  isSelected
                    ? 'bg-[#181818] border-[#FF6B00] shadow-[0_0_20px_rgba(255,107,0,0.15)]'
                    : 'bg-[#111111] hover:bg-[#151515] border-white/5 hover:border-white/20'
                }`}
              >
                {/* Visual Glow Indicator */}
                {isSelected && (
                  <div className="absolute top-0 left-0 right-0 h-1 bg-[#FF6B00]" />
                )}

                <div className="flex items-center justify-between mb-3">
                  <span className="font-display font-extrabold text-lg text-white">
                    {phase.name}
                  </span>

                  <span className={`text-[10px] font-mono font-bold px-2.5 py-1 rounded-full uppercase tracking-wider ${
                    phase.status === 'Active' 
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 animate-pulse'
                      : phase.status === 'Upcoming'
                      ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                      : 'bg-zinc-800 text-zinc-400 border border-white/10'
                  }`}>
                    {phase.status}
                  </span>
                </div>

                <div className="text-xs text-zinc-400 font-mono flex items-center justify-between">
                  <span>{phase.categories.filter(c => c.isEnabled !== false).length} Categories Available</span>
                  {isSelected && <span className="text-[#FF6B00] font-bold">Selected →</span>}
                </div>

                {/* Admin Quick Status Switcher */}
                {isAdminMode && (
                  <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between" onClick={e => e.stopPropagation()}>
                    <span className="text-[10px] font-mono text-zinc-400">Phase Status:</span>
                    <select
                      value={phase.status}
                      onChange={(e) => handleUpdatePhaseStatus(phase.id, e.target.value as TicketPhaseStatus)}
                      className="bg-black text-white border border-white/20 rounded px-2 py-1 text-[11px] font-mono focus:border-[#FF6B00] outline-none"
                    >
                      <option value="Active">Active</option>
                      <option value="Upcoming">Upcoming</option>
                      <option value="Closed">Closed</option>
                    </select>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* SELECTED PHASE TICKET CATEGORIES DISPLAY */}
      <div className="space-y-4 bg-[#111111] border border-white/10 p-6 rounded-2xl">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-white/10 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-bold font-display text-white">
                {activeSelectedPhase.name} Ticket Categories & Pricing
              </h3>
              <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded ${
                activeSelectedPhase.status === 'Active' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-blue-500/20 text-blue-400'
              }`}>
                {activeSelectedPhase.status} Phase
              </span>
            </div>
            <p className="text-xs text-zinc-400 font-mono mt-1">
              List of official passes and packages available for {activeSelectedPhase.name}.
            </p>
          </div>

          {isAdminMode && (
            <div className="text-xs font-mono text-[#FF6B00] bg-[#FF6B00]/10 border border-[#FF6B00]/20 px-3 py-1.5 rounded-lg flex items-center gap-1.5">
              <Edit3 size={13} />
              <span>Admin Mode: Click "Edit Price" on any category card below</span>
            </div>
          )}
        </div>

        {/* TICKET CARDS GRID */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-2">
          {activeSelectedPhase.categories.map((category) => {
            const isDisabled = category.isEnabled === false;
            const isSoldOut = !!category.isSoldOut;

            return (
              <div
                key={category.id}
                className={`p-5 rounded-2xl border transition-all duration-200 relative flex flex-col justify-between ${
                  isDisabled
                    ? 'bg-zinc-900/40 border-white/5 opacity-50'
                    : isSoldOut
                    ? 'bg-red-950/10 border-red-500/30'
                    : 'bg-[#161616] border-white/10 hover:border-[#FF6B00]/50 hover:bg-[#1a1a1a]'
                }`}
              >
                {/* BADGES */}
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[10px] font-mono font-bold bg-white/5 border border-white/10 px-2.5 py-1 rounded-lg text-zinc-300 flex items-center gap-1">
                    <Users size={12} className="text-[#FF6B00]" />
                    {category.pax}
                  </span>

                  {isSoldOut ? (
                    <span className="text-[10px] font-mono font-bold bg-red-500/20 border border-red-500/30 text-red-400 px-2 py-0.5 rounded uppercase tracking-wider">
                      SOLD OUT
                    </span>
                  ) : isDisabled ? (
                    <span className="text-[10px] font-mono font-bold bg-zinc-800 text-zinc-500 px-2 py-0.5 rounded uppercase">
                      Disabled
                    </span>
                  ) : (
                    <span className="text-[10px] font-mono font-bold bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded uppercase">
                      Available
                    </span>
                  )}
                </div>

                {/* TITLE */}
                <div className="my-2">
                  <h4 className="font-display font-extrabold text-base text-white">
                    {category.name}
                  </h4>
                  <span className="text-[11px] text-zinc-400 font-mono block mt-0.5">
                    {category.pax} Entry Pass
                  </span>
                </div>

                {/* PRICE DISPLAY */}
                <div className="my-4 pt-3 border-t border-white/5">
                  <div className="text-[10px] uppercase font-mono text-zinc-500 mb-0.5">
                    Price
                  </div>
                  {category.price !== null ? (
                    <div className="flex items-baseline gap-1.5">
                      <span className="text-xl font-extrabold font-mono text-[#FF6B00]">
                        LKR {category.price.toLocaleString()}
                      </span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <span className="text-base font-bold font-mono text-zinc-400 bg-white/5 px-2.5 py-1 rounded border border-white/10">
                        Price Not Set / TBA
                      </span>
                    </div>
                  )}
                </div>

                {/* ADMIN ACTION CONTROLS */}
                {isAdminMode && (
                  <div className="pt-3 border-t border-white/10 mt-2 space-y-2">
                    <button
                      onClick={() => handleStartEditCategory(activeSelectedPhase.id, category)}
                      className="w-full py-1.5 bg-[#FF6B00]/20 hover:bg-[#FF6B00] text-[#FF6B00] hover:text-black border border-[#FF6B00]/30 font-mono font-bold text-xs rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <Edit3 size={12} />
                      <span>Edit Category / Price</span>
                    </button>

                    <div className="grid grid-cols-2 gap-1.5">
                      <button
                        onClick={() => handleToggleSoldOut(activeSelectedPhase.id, category.id)}
                        className={`py-1 px-2 rounded-lg text-[10px] font-mono font-bold border transition cursor-pointer text-center ${
                          isSoldOut 
                            ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30 hover:bg-emerald-500/30' 
                            : 'bg-red-500/10 text-red-400 border-red-500/20 hover:bg-red-500/20'
                        }`}
                      >
                        {isSoldOut ? 'Mark In Stock' : 'Mark Sold Out'}
                      </button>

                      <button
                        onClick={() => handleToggleEnable(activeSelectedPhase.id, category.id)}
                        className={`py-1 px-2 rounded-lg text-[10px] font-mono font-bold border transition cursor-pointer text-center ${
                          isDisabled 
                            ? 'bg-blue-500/20 text-blue-300 border-blue-500/30' 
                            : 'bg-zinc-800 text-zinc-400 border-white/10 hover:bg-zinc-700'
                        }`}
                      >
                        {isDisabled ? 'Enable' : 'Disable'}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* EDIT MODAL FOR ADMIN */}
      {editingCategory && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#121212] border border-white/20 p-6 rounded-2xl max-w-md w-full space-y-5 animate-scaleUp">
            
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2 text-[#FF6B00]">
                <Edit3 size={18} />
                <h3 className="font-display font-bold text-lg text-white">
                  Edit Ticket Price & Details
                </h3>
              </div>
              <button 
                onClick={() => setEditingCategory(null)}
                className="text-zinc-400 hover:text-white p-1"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-4 text-xs font-mono">
              <div>
                <label className="block text-zinc-400 mb-1">Ticket Category Name</label>
                <input
                  type="text"
                  value={editingCategory.name}
                  onChange={(e) => setEditingCategory({ ...editingCategory, name: e.target.value })}
                  className="w-full bg-black border border-white/10 rounded-xl p-2.5 text-white focus:border-[#FF6B00] outline-none"
                />
              </div>

              <div>
                <label className="block text-zinc-400 mb-1">Package Capacity (e.g., 1 Pax, 6 Pax)</label>
                <input
                  type="text"
                  value={editingCategory.pax}
                  onChange={(e) => setEditingCategory({ ...editingCategory, pax: e.target.value })}
                  className="w-full bg-black border border-white/10 rounded-xl p-2.5 text-white focus:border-[#FF6B00] outline-none"
                />
              </div>

              <div>
                <label className="block text-zinc-400 mb-1">
                  Ticket Price (LKR) — Type "TBA" or enter amount
                </label>
                <input
                  type="text"
                  value={editingCategory.price}
                  onChange={(e) => setEditingCategory({ ...editingCategory, price: e.target.value })}
                  placeholder="e.g. 5000 or TBA"
                  className="w-full bg-black border border-white/10 rounded-xl p-2.5 text-white font-bold text-sm focus:border-[#FF6B00] outline-none"
                />
                <span className="text-[10px] text-zinc-500 mt-1 block">
                  To mark as Price Not Set / TBA, leave empty or type "TBA".
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2">
                <label className="flex items-center gap-2 p-3 bg-black border border-white/10 rounded-xl cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editingCategory.isSoldOut}
                    onChange={(e) => setEditingCategory({ ...editingCategory, isSoldOut: e.target.checked })}
                    className="accent-[#FF6B00]"
                  />
                  <span className="text-zinc-300">Mark Sold Out</span>
                </label>

                <label className="flex items-center gap-2 p-3 bg-black border border-white/10 rounded-xl cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editingCategory.isEnabled}
                    onChange={(e) => setEditingCategory({ ...editingCategory, isEnabled: e.target.checked })}
                    className="accent-[#FF6B00]"
                  />
                  <span className="text-zinc-300">Active / Enabled</span>
                </label>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/10">
              <button
                onClick={() => setEditingCategory(null)}
                className="px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 text-zinc-300 font-mono text-xs rounded-xl"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveCategoryEdit}
                disabled={isSaving}
                className="px-5 py-2 bg-[#FF6B00] hover:bg-[#FF852B] text-black font-mono font-bold text-xs rounded-xl flex items-center gap-1.5 transition cursor-pointer"
              >
                {isSaving ? <RefreshCw size={14} className="animate-spin" /> : <Check size={14} />}
                <span>Save Price Changes</span>
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
