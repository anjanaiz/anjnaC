import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Plus, Edit2, Trash2, Search, DollarSign, CheckCircle2, 
  AlertCircle, FileText, X, Save, RefreshCw, Smartphone, 
  PlusCircle, MinusCircle, Sparkles, Filter, Check, TrendingUp
} from 'lucide-react';
import { collection, doc, setDoc, deleteDoc, onSnapshot, getDocs } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { Stall } from '../types';

const DEFAULT_STALLS: Stall[] = [
  { id: 'stall_1', name: 'Water Stall', vendorName: '', whatsappNumber: '', advancePayment: 0, remainingBalance: 0, items: ['Bottled Water'], notes: '' },
  { id: 'stall_2', name: 'Soft Drinks Stall', vendorName: '', whatsappNumber: '', advancePayment: 0, remainingBalance: 0, items: ['Coca-Cola', 'Sprite', 'Fanta'], notes: '' },
  { id: 'stall_3', name: 'Cool Drinks Stall', vendorName: '', whatsappNumber: '', advancePayment: 0, remainingBalance: 0, items: ['Bubble Tea', 'Mojito', 'Mango Fresh Juices'], notes: '' },
  { id: 'stall_4', name: 'Hot Drinks Stall', vendorName: '', whatsappNumber: '', advancePayment: 0, remainingBalance: 0, items: ['Coffee', 'Ceylon Tea', 'Thai Tea', 'Masala Tea'], notes: '' },
  { id: 'stall_5', name: 'Rice & Kottu Stall', vendorName: '', whatsappNumber: '', advancePayment: 0, remainingBalance: 0, items: ['Fried Rice', 'Kottu'], notes: '' },
  { id: 'stall_6', name: 'Fast Food Stall', vendorName: '', whatsappNumber: '', advancePayment: 0, remainingBalance: 0, items: ['Hot Dogs', 'Mini Burgers', 'Crispy French Fries'], notes: '' },
  { id: 'stall_7', name: 'Ramen & Pasta Stall', vendorName: '', whatsappNumber: '', advancePayment: 0, remainingBalance: 0, items: ['Authentic Ramen', 'Macaroni Variations', 'Instant Noodle Dishes'], notes: '' },
  { id: 'stall_8', name: 'Dessert Stall', vendorName: '', whatsappNumber: '', advancePayment: 0, remainingBalance: 0, items: ['Artisan Ice Cream', 'Glazed Donuts', 'Chocolate Dip Items'], notes: '' },
  { id: 'stall_9', name: 'BBQ / Grill Stall', vendorName: '', whatsappNumber: '', advancePayment: 0, remainingBalance: 0, items: ['Flame-Grilled Chicken BBQ', 'Skewers', 'Assorted Grilled Items'], notes: '' },
  { id: 'stall_10', name: 'Corn Stall', vendorName: '', whatsappNumber: '', advancePayment: 0, remainingBalance: 0, items: ['Steamed Butter Corn', 'Flame Spicy Corn'], notes: '' },
  { id: 'stall_11', name: 'Photo Booth', vendorName: '', whatsappNumber: '', advancePayment: 0, remainingBalance: 0, items: [], notes: '' },
  { id: 'stall_12', name: 'Liquor Stall', vendorName: '', whatsappNumber: '', advancePayment: 0, remainingBalance: 0, items: [], notes: '' },
  { id: 'stall_13', name: 'Beer Stall', vendorName: '', whatsappNumber: '', advancePayment: 0, remainingBalance: 0, items: [], notes: '' },
  { id: 'stall_14', name: 'Balloon.lk Stall', vendorName: '', whatsappNumber: '', advancePayment: 0, remainingBalance: 0, items: [], notes: '' },
  { id: 'stall_15', name: 'Sunquick Stall', vendorName: '', whatsappNumber: '', advancePayment: 0, remainingBalance: 0, items: [], notes: '' },
];

export const StallDetailsTab: React.FC = () => {
  const [stalls, setStalls] = useState<Stall[]>(() => {
    const saved = localStorage.getItem('chakra_stalls');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed && parsed.length > 0) return parsed;
      } catch (_) {}
    }
    return [];
  });

  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'unassigned' | 'outstanding' | 'fullypaid'>('all');

  // Form State
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingStallId, setEditingStallId] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    name: '',
    vendorName: '',
    whatsappNumber: '',
    advancePayment: 0,
    remainingBalance: 0,
    itemsText: '',
    notes: ''
  });

  // Fetch from Firestore on mount
  useEffect(() => {
    const stallsRef = collection(db, 'stalls');
    const unsubscribe = onSnapshot(stallsRef, (snapshot) => {
      const list: Stall[] = [];
      snapshot.forEach(doc => {
        list.push(doc.data() as Stall);
      });

      // Maintain order or sort alphabetically by name
      list.sort((a, b) => a.name.localeCompare(b.name));

      setStalls(list);
      localStorage.setItem('chakra_stalls', JSON.stringify(list));
      setLoading(false);
    }, (err) => {
      handleFirestoreError(err, OperationType.GET, 'stalls');
      setLoading(false);
    });

    // Seed database with default 15 stalls if empty
    const seedDefaultStallsIfEmpty = async () => {
      try {
        const snap = await getDocs(stallsRef);
        if (snap.empty) {
          console.log("Seeding default 15 stalls...");
          for (const stall of DEFAULT_STALLS) {
            await setDoc(doc(db, 'stalls', stall.id), {
              ...stall,
              createdAt: Date.now()
            });
          }
        }
      } catch (err) {
        handleFirestoreError(err, OperationType.GET, 'stalls');
      }
    };
    seedDefaultStallsIfEmpty();

    return () => unsubscribe();
  }, []);

  const handleOpenAddForm = () => {
    setEditingStallId(null);
    setFormData({
      name: '',
      vendorName: '',
      whatsappNumber: '',
      advancePayment: 0,
      remainingBalance: 0,
      itemsText: '',
      notes: ''
    });
    setIsFormOpen(true);
  };

  const handleOpenEditForm = (stall: Stall) => {
    setEditingStallId(stall.id);
    setFormData({
      name: stall.name,
      vendorName: stall.vendorName,
      whatsappNumber: stall.whatsappNumber,
      advancePayment: stall.advancePayment,
      remainingBalance: stall.remainingBalance,
      itemsText: stall.items.join(', '),
      notes: stall.notes || ''
    });
    setIsFormOpen(true);
  };

  const handleSaveStall = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) return;

    const itemsArray = formData.itemsText
      .split(',')
      .map(i => i.trim())
      .filter(i => i.length > 0);

    const stallId = editingStallId || `stall_${Date.now()}`;
    const existingStall = stalls.find(s => s.id === stallId);
    const targetStall: Stall = {
      id: stallId,
      name: formData.name.trim(),
      vendorName: formData.vendorName.trim(),
      whatsappNumber: formData.whatsappNumber.trim(),
      advancePayment: Number(formData.advancePayment) || 0,
      remainingBalance: Number(formData.remainingBalance) || 0,
      items: itemsArray,
      notes: formData.notes.trim(),
      createdAt: existingStall?.createdAt || Date.now()
    };

    try {
      await setDoc(doc(db, 'stalls', stallId), targetStall);
      setIsFormOpen(false);
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `stalls/${stallId}`);
      setIsFormOpen(false);
    }
  };

  const handleDeleteStall = async (id: string, name: string) => {
    if (!confirm(`Are you absolutely sure you want to delete "${name}"? This action cannot be undone.`)) return;

    try {
      await deleteDoc(doc(db, 'stalls', id));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `stalls/${id}`);
    }
  };

  // Quick edit status for simple in-row amount update
  const [inlineEditingId, setInlineEditingId] = useState<string | null>(null);
  const [inlineData, setInlineData] = useState({ advancePayment: 0, remainingBalance: 0 });

  const handleStartInlineEdit = (stall: Stall) => {
    setInlineEditingId(stall.id);
    setInlineData({
      advancePayment: stall.advancePayment,
      remainingBalance: stall.remainingBalance
    });
  };

  const handleSaveInline = async (stall: Stall) => {
    const updated = {
      ...stall,
      advancePayment: Number(inlineData.advancePayment) || 0,
      remainingBalance: Number(inlineData.remainingBalance) || 0
    };
    try {
      await setDoc(doc(db, 'stalls', stall.id), updated);
      setInlineEditingId(null);
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `stalls/${stall.id}`);
      setInlineEditingId(null);
    }
  };

  // Helper to format whatsapp link
  const getWhatsAppLink = (num: string) => {
    if (!num) return '#';
    const clean = num.replace(/[^0-9]/g, '');
    return `https://wa.me/${clean}`;
  };

  // Computed Stats
  const totalStallsCount = stalls.length;
  const assignedVendorsCount = stalls.filter(s => s.vendorName.trim().length > 0).length;
  const totalAdvancesSum = stalls.reduce((sum, s) => sum + s.advancePayment, 0);
  const totalOutstandingsSum = stalls.reduce((sum, s) => sum + s.remainingBalance, 0);

  // Filter and Search logic
  const filteredStalls = stalls.filter(stall => {
    const matchesSearch = 
      stall.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      stall.vendorName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      stall.items.some(item => item.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (stall.notes && stall.notes.toLowerCase().includes(searchTerm.toLowerCase()));

    if (!matchesSearch) return false;

    if (filterType === 'unassigned') return stall.vendorName.trim() === '';
    if (filterType === 'outstanding') return stall.remainingBalance > 0;
    if (filterType === 'fullypaid') return stall.advancePayment > 0 && stall.remainingBalance === 0;

    return true;
  });

  return (
    <div className="space-y-6">
      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold font-display text-white tracking-wide uppercase flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-[#FF6B00]/10 text-[#FF6B00] border border-[#FF6B00]/20">
              <Sparkles size={16} />
            </span>
            Stall Management Matrix
          </h2>
          <p className="text-xs text-white/40 mt-1 font-mono">
            A real-time administrative ledger tracking vendor placements, payment logs, and sales schedules.
          </p>
        </div>

        <button
          onClick={handleOpenAddForm}
          className="flex items-center justify-center gap-2 px-4 py-2 bg-[#FF6B00] hover:bg-[#FF852B] text-zinc-950 font-black font-mono text-xs rounded-xl transition shadow-[0_0_15px_rgba(255,107,0,0.15)] cursor-pointer select-none"
        >
          <Plus size={14} />
          Register New Stall
        </button>
      </div>

      {/* STATS TILES ROW */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4" id="stall-stats-dashboard">
        <div className="bg-white/5 border border-white/10 p-4 rounded-2xl flex items-center justify-between">
          <div>
            <span className="text-[9px] uppercase tracking-wider font-mono text-white/30 block">Total Registrations</span>
            <span className="text-2xl font-black font-display text-white mt-1 block">{totalStallsCount}</span>
          </div>
          <div className="p-2 bg-white/5 border border-white/5 rounded-xl text-zinc-400 font-mono text-[10px] font-bold">STALLS</div>
        </div>

        <div className="bg-white/5 border border-white/10 p-4 rounded-2xl flex items-center justify-between">
          <div>
            <span className="text-[9px] uppercase tracking-wider font-mono text-white/30 block">Assigned Vendors</span>
            <span className="text-2xl font-black font-display text-blue-400 mt-1 block">
              {assignedVendorsCount} <span className="text-white/20 text-xs font-mono font-normal">/ {totalStallsCount}</span>
            </span>
          </div>
          <div className="p-2 bg-blue-500/10 border border-blue-500/10 rounded-xl text-blue-400 font-mono text-[10px] font-bold">VENDORS</div>
        </div>

        <div className="bg-white/5 border border-white/10 p-4 rounded-2xl flex items-center justify-between">
          <div>
            <span className="text-[9px] uppercase tracking-wider font-mono text-white/30 block">Total Advances Received</span>
            <span className="text-2xl font-black font-display text-emerald-400 mt-1 block">
              <span className="text-xs font-mono font-medium mr-0.5">Rs.</span>{totalAdvancesSum.toLocaleString()}
            </span>
          </div>
          <div className="p-2 bg-emerald-500/10 border border-emerald-500/10 rounded-xl text-emerald-400 font-mono text-[10px] font-bold">RECEIVED</div>
        </div>

        <div className="bg-white/5 border border-white/10 p-4 rounded-2xl flex items-center justify-between">
          <div>
            <span className="text-[9px] uppercase tracking-wider font-mono text-white/30 block">Outstanding Arrears</span>
            <span className="text-2xl font-black font-display text-rose-400 mt-1 block">
              <span className="text-xs font-mono font-medium mr-0.5">Rs.</span>{totalOutstandingsSum.toLocaleString()}
            </span>
          </div>
          <div className="p-2 bg-rose-500/10 border border-rose-500/10 rounded-xl text-rose-400 font-mono text-[10px] font-bold">OUTSTANDING</div>
        </div>
      </div>

      {/* FILTER AND SEARCH CONTROLS */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3 bg-white/5 border border-white/10 p-3 rounded-2xl">
        <div className="relative flex-1">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
          <input
            type="text"
            placeholder="Search stalls by name, vendor, items plan, or notes..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-black/40 border border-white/5 rounded-xl text-xs text-white pl-9 pr-4 py-2.5 focus:outline-none focus:border-[#FF6B00] transition font-mono"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto shrink-0 pb-1 md:pb-0" id="stall-filters">
          <span className="text-[9px] uppercase font-mono tracking-wider text-white/30 px-1 hidden lg:inline">Filters:</span>
          {(['all', 'unassigned', 'outstanding', 'fullypaid'] as const).map(type => (
            <button
              key={type}
              onClick={() => setFilterType(type)}
              className={`px-3 py-1.5 rounded-lg text-[10px] font-mono font-bold tracking-wider uppercase transition cursor-pointer shrink-0 border ${
                filterType === type 
                  ? 'bg-[#FF6B00]/10 border-[#FF6B00]/40 text-[#FF6B00]' 
                  : 'bg-transparent border-white/5 text-white/40 hover:text-white hover:bg-white/5'
              }`}
            >
              {type === 'all' && 'All Stalls'}
              {type === 'unassigned' && 'Unassigned'}
              {type === 'outstanding' && 'Outstanding'}
              {type === 'fullypaid' && 'Fully Paid'}
            </button>
          ))}
        </div>
      </div>

      {/* TABLE VIEW */}
      <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden backdrop-blur-sm">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 text-center space-y-3">
            <RefreshCw size={24} className="animate-spin text-[#FF6B00]" />
            <span className="text-xs font-mono text-white/30">Querying Firestore Database...</span>
          </div>
        ) : filteredStalls.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center space-y-2">
            <div className="p-3 bg-white/5 border border-white/5 rounded-full text-zinc-500">
              <FileText size={20} />
            </div>
            <h4 className="text-sm font-bold text-white tracking-wider uppercase">No matching records found</h4>
            <p className="text-xs text-zinc-400 font-mono max-w-xs leading-relaxed">
              Verify your keywords or check filters. Register a new stall to expand your list.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[900px]">
              <thead>
                <tr className="border-b border-white/10 bg-black/40 font-mono text-[9px] uppercase tracking-wider text-white/40">
                  <th className="py-3.5 px-4 font-bold">Stall / Vendor Details</th>
                  <th className="py-3.5 px-4 font-bold">WhatsApp / Reach</th>
                  <th className="py-3.5 px-4 font-bold">Planned Sale Items</th>
                  <th className="py-3.5 px-4 font-bold text-right w-[150px]">Advance Payment</th>
                  <th className="py-3.5 px-4 text-right w-[150px] font-bold">Remaining Balance</th>
                  <th className="py-3.5 px-4 font-bold text-center w-[120px]">Status</th>
                  <th className="py-3.5 px-4 font-bold text-center w-[140px]">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filteredStalls.map((stall) => {
                  const isOutstanding = stall.remainingBalance > 0;
                  const isUnassigned = !stall.vendorName.trim();
                  const isInlineEditing = inlineEditingId === stall.id;

                  return (
                    <tr 
                      key={stall.id} 
                      className="hover:bg-white/[0.02] transition-colors duration-150 align-top group"
                    >
                      {/* Name & Vendor */}
                      <td className="py-4 px-4 space-y-1 max-w-[240px]">
                        <span className="block font-display font-extrabold text-white text-xs tracking-wide uppercase">
                          {stall.name}
                        </span>
                        {isUnassigned ? (
                          <span className="inline-block text-[9px] font-mono font-semibold text-amber-500/80 bg-amber-500/10 px-1.5 py-0.5 rounded uppercase">
                            Vacancy: No Vendor
                          </span>
                        ) : (
                          <span className="block text-zinc-400 text-[11px] font-mono font-medium">
                            {stall.vendorName}
                          </span>
                        )}
                        {stall.notes && (
                          <p className="text-[10px] text-zinc-500 leading-normal italic font-mono max-w-[220px] line-clamp-2 mt-1">
                            Note: {stall.notes}
                          </p>
                        )}
                      </td>

                      {/* WhatsApp contact */}
                      <td className="py-4 px-4 font-mono text-[11px]">
                        {stall.whatsappNumber ? (
                          <a 
                            href={getWhatsAppLink(stall.whatsappNumber)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 text-zinc-300 hover:text-[#FF6B00] transition group/wa"
                          >
                            <Smartphone size={12} className="text-zinc-500 group-hover/wa:text-[#FF6B00]" />
                            <span>{stall.whatsappNumber}</span>
                          </a>
                        ) : (
                          <span className="text-white/20 italic text-[10px]">None</span>
                        )}
                      </td>

                      {/* Planned Sale Items */}
                      <td className="py-4 px-4 max-w-[320px]">
                        {stall.items && stall.items.length > 0 ? (
                          <div className="flex flex-wrap gap-1">
                            {stall.items.map((item, idx) => (
                              <span 
                                key={idx} 
                                className="inline-block text-[9px] font-mono bg-white/5 border border-white/5 px-2 py-0.5 rounded text-zinc-300 tracking-tight"
                              >
                                {item}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span className="text-[10px] font-mono text-zinc-600 italic">No items listed</span>
                        )}
                      </td>

                      {/* Advance Payment */}
                      <td className="py-4 px-4 text-right">
                        {isInlineEditing ? (
                          <div className="inline-flex flex-col items-end gap-1">
                            <span className="text-[8px] font-mono text-white/30 uppercase">Advance</span>
                            <input
                              type="number"
                              value={inlineData.advancePayment}
                              onChange={(e) => setInlineData(prev => ({ ...prev, advancePayment: Number(e.target.value) || 0 }))}
                              className="w-24 bg-black/60 border border-white/10 rounded px-1.5 py-1 text-right text-[11px] font-mono text-white focus:outline-none focus:border-[#FF6B00]"
                            />
                          </div>
                        ) : (
                          <span className="font-mono text-zinc-300 text-xs">
                            Rs. {stall.advancePayment.toLocaleString()}
                          </span>
                        )}
                      </td>

                      {/* Remaining Balance */}
                      <td className="py-4 px-4 text-right">
                        {isInlineEditing ? (
                          <div className="inline-flex flex-col items-end gap-1">
                            <span className="text-[8px] font-mono text-white/30 uppercase">Balance</span>
                            <input
                              type="number"
                              value={inlineData.remainingBalance}
                              onChange={(e) => setInlineData(prev => ({ ...prev, remainingBalance: Number(e.target.value) || 0 }))}
                              className="w-24 bg-black/60 border border-white/10 rounded px-1.5 py-1 text-right text-[11px] font-mono text-white focus:outline-none focus:border-[#FF6B00]"
                            />
                          </div>
                        ) : (
                          <span className={`font-mono text-xs font-semibold ${isOutstanding ? 'text-rose-400' : 'text-emerald-400'}`}>
                            Rs. {stall.remainingBalance.toLocaleString()}
                          </span>
                        )}
                      </td>

                      {/* Status */}
                      <td className="py-4 px-4 text-center">
                        {stall.remainingBalance === 0 && stall.advancePayment > 0 ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[8.5px] font-mono font-bold uppercase tracking-wider bg-emerald-500/15 border border-emerald-500/20 text-emerald-400">
                            <CheckCircle2 size={10} /> Fully Paid
                          </span>
                        ) : isOutstanding ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[8.5px] font-mono font-bold uppercase tracking-wider bg-rose-500/15 border border-rose-500/20 text-rose-400">
                            <AlertCircle size={10} /> Pending LKR
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[8.5px] font-mono font-bold uppercase tracking-wider bg-white/5 border border-white/5 text-zinc-400">
                            No Ledger
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-4 px-4">
                        <div className="flex items-center justify-center gap-1.5">
                          {isInlineEditing ? (
                            <>
                              <button
                                onClick={() => handleSaveInline(stall)}
                                className="p-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 rounded-lg transition cursor-pointer"
                                title="Save quick edits"
                              >
                                <Save size={12} />
                              </button>
                              <button
                                onClick={() => setInlineEditingId(null)}
                                className="p-1.5 bg-white/5 hover:bg-white/10 border border-white/10 text-white/50 hover:text-white rounded-lg transition cursor-pointer"
                                title="Cancel"
                              >
                                <X size={12} />
                              </button>
                            </>
                          ) : (
                            <>
                              <button
                                onClick={() => handleStartInlineEdit(stall)}
                                className="p-1.5 bg-white/5 hover:bg-white/10 border border-white/5 text-white/40 hover:text-white rounded-lg transition cursor-pointer md:opacity-0 group-hover:opacity-100"
                                title="Quick payment log"
                              >
                                <DollarSign size={12} />
                              </button>
                              <button
                                onClick={() => handleOpenEditForm(stall)}
                                className="p-1.5 bg-white/5 hover:bg-white/10 border border-white/5 text-white/40 hover:text-[#FF6B00] rounded-lg transition cursor-pointer md:opacity-0 group-hover:opacity-100"
                                title="Full Edit Stall"
                              >
                                <Edit2 size={12} />
                              </button>
                              <button
                                onClick={() => handleDeleteStall(stall.id, stall.name)}
                                className="p-1.5 bg-rose-500/5 hover:bg-rose-500/20 border border-rose-500/10 text-rose-400/60 hover:text-rose-400 rounded-lg transition cursor-pointer md:opacity-0 group-hover:opacity-100"
                                title="Delete Registration"
                              >
                                <Trash2 size={12} />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* FORM MODAL PANEL (Slide over or modal drawer) */}
      <AnimatePresence>
        {isFormOpen && (
          <div className="fixed inset-0 z-50 overflow-hidden flex items-center justify-center">
            {/* Backdrop */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsFormOpen(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            />

            {/* Modal Body */}
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="relative bg-zinc-950 border border-white/10 w-full max-w-lg rounded-2xl overflow-hidden shadow-2xl flex flex-col m-4"
            >
              {/* Modal Header */}
              <div className="bg-black/40 border-b border-white/5 px-6 py-4 flex items-center justify-between">
                <h3 className="font-display font-extrabold text-white text-sm uppercase tracking-wide">
                  {editingStallId ? 'Update Stall Registration' : 'Register New Vendor Stall'}
                </h3>
                <button 
                  onClick={() => setIsFormOpen(false)}
                  className="p-1.5 bg-white/5 hover:bg-white/10 rounded-lg text-white/40 hover:text-white transition cursor-pointer"
                >
                  <X size={14} />
                </button>
              </div>

              {/* Form Content */}
              <form onSubmit={handleSaveStall} className="p-6 space-y-4 overflow-y-auto max-h-[80vh]">
                {/* Stall Name */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-mono uppercase text-white/40 tracking-wider">Stall Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Rice & Kottu Stall"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full bg-black/40 border border-white/10 rounded-xl text-xs text-white px-3 py-2.5 focus:outline-none focus:border-[#FF6B00] font-mono"
                  />
                </div>

                {/* Owner / Vendor Name */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-mono uppercase text-white/40 tracking-wider">Owner / Vendor Name</label>
                  <input
                    type="text"
                    placeholder="e.g. Susantha Perera"
                    value={formData.vendorName}
                    onChange={(e) => setFormData(prev => ({ ...prev, vendorName: e.target.value }))}
                    className="w-full bg-black/40 border border-white/10 rounded-xl text-xs text-white px-3 py-2.5 focus:outline-none focus:border-[#FF6B00] font-mono"
                  />
                </div>

                {/* WhatsApp Number */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-mono uppercase text-white/40 tracking-wider">WhatsApp Contact Number</label>
                  <input
                    type="text"
                    placeholder="e.g. 94771234567"
                    value={formData.whatsappNumber}
                    onChange={(e) => setFormData(prev => ({ ...prev, whatsappNumber: e.target.value }))}
                    className="w-full bg-black/40 border border-white/10 rounded-xl text-xs text-white px-3 py-2.5 focus:outline-none focus:border-[#FF6B00] font-mono"
                  />
                  <p className="text-[8.5px] text-white/30 font-mono italic leading-normal">
                    Enter the full country code + local number without spaces (e.g., 94777123456) for click-to-chat.
                  </p>
                </div>

                {/* Payments Grid */}
                <div className="grid grid-cols-2 gap-4">
                  {/* Advance Payment */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-mono uppercase text-white/40 tracking-wider">Advance Received (LKR)</label>
                    <input
                      type="number"
                      placeholder="0"
                      value={formData.advancePayment || ''}
                      onChange={(e) => setFormData(prev => ({ ...prev, advancePayment: Number(e.target.value) || 0 }))}
                      className="w-full bg-black/40 border border-white/10 rounded-xl text-xs text-white px-3 py-2.5 focus:outline-none focus:border-[#FF6B00] font-mono"
                    />
                  </div>

                  {/* Remaining Balance */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-mono uppercase text-white/40 tracking-wider">Remaining Balance (LKR)</label>
                    <input
                      type="number"
                      placeholder="0"
                      value={formData.remainingBalance || ''}
                      onChange={(e) => setFormData(prev => ({ ...prev, remainingBalance: Number(e.target.value) || 0 }))}
                      className="w-full bg-black/40 border border-white/10 rounded-xl text-xs text-white px-3 py-2.5 focus:outline-none focus:border-[#FF6B00] font-mono"
                    />
                  </div>
                </div>

                {/* Items planned for sale */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-mono uppercase text-white/40 tracking-wider">Planned Items for Sale</label>
                  <textarea
                    rows={2}
                    placeholder="e.g. Fried Rice, Egg Kottu, Cheese Kottu"
                    value={formData.itemsText}
                    onChange={(e) => setFormData(prev => ({ ...prev, itemsText: e.target.value }))}
                    className="w-full bg-black/40 border border-white/10 rounded-xl text-xs text-white px-3 py-2.5 focus:outline-none focus:border-[#FF6B00] font-mono resize-none"
                  />
                  <p className="text-[8.5px] text-white/30 font-mono italic leading-normal">
                    Separate items with a comma (e.g. Bubble Tea, Mojito, Fruit Juice).
                  </p>
                </div>

                {/* Notes */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-mono uppercase text-white/40 tracking-wider">Operational Notes (Optional)</label>
                  <textarea
                    rows={2}
                    placeholder="Special requirements, power supply requests, location placement details, etc."
                    value={formData.notes}
                    onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                    className="w-full bg-black/40 border border-white/10 rounded-xl text-xs text-white px-3 py-2.5 focus:outline-none focus:border-[#FF6B00] font-mono resize-none"
                  />
                </div>

                {/* Form Actions */}
                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsFormOpen(false)}
                    className="flex-1 py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-center text-xs font-mono text-white/60 hover:text-white transition cursor-pointer uppercase tracking-wider"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-2.5 bg-[#FF6B00] hover:bg-[#FF852B] text-zinc-950 rounded-xl text-center text-xs font-mono font-black transition cursor-pointer uppercase tracking-wider shadow-[0_0_15px_rgba(255,107,0,0.2)]"
                  >
                    {editingStallId ? 'Update Ledger' : 'Confirm Registration'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
