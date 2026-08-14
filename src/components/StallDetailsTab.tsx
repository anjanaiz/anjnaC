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
  { id: 'stall_1', name: 'Water Stall', vendorName: '', whatsappNumber: '', totalPrice: 75000, advancePayment: 0, remainingBalance: 75000, items: ['Bottled Water'], notes: '' },
  { id: 'stall_2', name: 'Soft Drinks Stall', vendorName: '', whatsappNumber: '', totalPrice: 75000, advancePayment: 0, remainingBalance: 75000, items: ['Coca-Cola', 'Sprite', 'Fanta'], notes: '' },
  { id: 'stall_3', name: 'Cool Drinks Stall', vendorName: '', whatsappNumber: '', totalPrice: 75000, advancePayment: 0, remainingBalance: 75000, items: ['Bubble Tea', 'Mojito', 'Mango Fresh Juices'], notes: '' },
  { id: 'stall_4', name: 'Hot Drinks Stall', vendorName: '', whatsappNumber: '', totalPrice: 75000, advancePayment: 0, remainingBalance: 75000, items: ['Coffee', 'Ceylon Tea', 'Thai Tea', 'Masala Tea'], notes: '' },
  { id: 'stall_5', name: 'Rice & Kottu Stall', vendorName: '', whatsappNumber: '', totalPrice: 75000, advancePayment: 0, remainingBalance: 75000, items: ['Fried Rice', 'Kottu'], notes: '' },
  { id: 'stall_6', name: 'Fast Food Stall', vendorName: '', whatsappNumber: '', totalPrice: 75000, advancePayment: 0, remainingBalance: 75000, items: ['Hot Dogs', 'Mini Burgers', 'Crispy French Fries'], notes: '' },
  { id: 'stall_7', name: 'Ramen & Pasta Stall', vendorName: '', whatsappNumber: '', totalPrice: 75000, advancePayment: 0, remainingBalance: 75000, items: ['Authentic Ramen', 'Macaroni Variations', 'Instant Noodle Dishes'], notes: '' },
  { id: 'stall_8', name: 'Dessert Stall', vendorName: '', whatsappNumber: '', totalPrice: 75000, advancePayment: 0, remainingBalance: 75000, items: ['Artisan Ice Cream', 'Glazed Donuts', 'Chocolate Dip Items'], notes: '' },
  { id: 'stall_9', name: 'BBQ / Grill Stall', vendorName: '', whatsappNumber: '', totalPrice: 75000, advancePayment: 0, remainingBalance: 75000, items: ['Flame-Grilled Chicken BBQ', 'Skewers', 'Assorted Grilled Items'], notes: '' },
  { id: 'stall_10', name: 'Corn Stall', vendorName: '', whatsappNumber: '', totalPrice: 75000, advancePayment: 0, remainingBalance: 75000, items: ['Steamed Butter Corn', 'Flame Spicy Corn'], notes: '' },
  { id: 'stall_11', name: 'Photo Booth', vendorName: '', whatsappNumber: '', totalPrice: 75000, advancePayment: 0, remainingBalance: 75000, items: [], notes: '' },
  { id: 'stall_12', name: 'Liquor Stall', vendorName: '', whatsappNumber: '', totalPrice: 75000, advancePayment: 0, remainingBalance: 75000, items: [], notes: '' },
  { id: 'stall_13', name: 'Beer Stall', vendorName: '', whatsappNumber: '', totalPrice: 75000, advancePayment: 0, remainingBalance: 75000, items: [], notes: '' },
  { id: 'stall_14', name: 'Balloon.lk Stall', vendorName: '', whatsappNumber: '', totalPrice: 75000, advancePayment: 0, remainingBalance: 75000, items: [], notes: '' },
  { id: 'stall_15', name: 'Sunquick Stall', vendorName: '', whatsappNumber: '', totalPrice: 75000, advancePayment: 0, remainingBalance: 75000, items: [], notes: '' },
];

interface StallDetailsTabProps {
  eventId?: 'chakra360' | 'kathawak';
  initialStalls?: Stall[];
}

export const StallDetailsTab: React.FC<StallDetailsTabProps> = ({
  eventId = 'chakra360',
  initialStalls = []
}) => {
  const storageKey = eventId === 'kathawak' ? 'kathawak_stalls' : 'chakra_stalls';
  const collectionName = eventId === 'kathawak' ? 'stalls_kathawak' : 'stalls';
  const defaultList = eventId === 'kathawak' && initialStalls.length > 0 ? initialStalls : DEFAULT_STALLS;

  const [stalls, setStalls] = useState<Stall[]>(() => {
    const saved = localStorage.getItem(storageKey);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed && parsed.length > 0) return parsed;
      } catch (_) {}
    }
    return defaultList;
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
    totalPrice: eventId === 'chakra360' ? 75000 : 75000,
    advancePayment: 0,
    remainingBalance: eventId === 'chakra360' ? 75000 : 75000,
    itemsText: '',
    notes: ''
  });

  // Fetch from Firestore on mount
  useEffect(() => {
    const stallsRef = collection(db, collectionName);
    const unsubscribe = onSnapshot(stallsRef, (snapshot) => {
      const list: Stall[] = [];
      snapshot.forEach(doc => {
        list.push(doc.data() as Stall);
      });

      // Maintain order or sort alphabetically by name
      list.sort((a, b) => a.name.localeCompare(b.name));

      if (list.length > 0) {
        setStalls(list);
        localStorage.setItem(storageKey, JSON.stringify(list));
      } else {
        seedDefaultStallsIfEmpty();
      }
      setLoading(false);
    }, (err) => {
      handleFirestoreError(err, OperationType.GET, collectionName);
      setLoading(false);
    });

    // Seed database with default stalls if empty
    const seedDefaultStallsIfEmpty = async () => {
      try {
        const snap = await getDocs(stallsRef);
        if (snap.empty) {
          console.log(`Seeding default stalls for ${collectionName}...`);
          for (const s of defaultList) {
            await setDoc(doc(db, collectionName, s.id), s);
          }
        }
      } catch (err) {
        console.error("Failed to seed default stalls in Firestore:", err);
      }
    };

    return () => unsubscribe();
  }, [collectionName, storageKey]);

  const handleResetToDefaultTemplate = async () => {
    if (confirm("Reset stalls to default template with LKR 75,000 total price per stall?")) {
      setStalls(defaultList);
      localStorage.setItem(storageKey, JSON.stringify(defaultList));
      for (const s of defaultList) {
        try {
          await setDoc(doc(db, collectionName, s.id), s);
        } catch (e) {
          console.error("Failed to reset stall in Firestore:", e);
        }
      }
    }
  };

  const handleOpenAddForm = () => {
    setEditingStallId(null);
    setFormData({
      name: '',
      vendorName: '',
      whatsappNumber: '',
      totalPrice: eventId === 'chakra360' ? 75000 : 75000,
      advancePayment: 0,
      remainingBalance: eventId === 'chakra360' ? 75000 : 75000,
      itemsText: '',
      notes: ''
    });
    setIsFormOpen(true);
  };

  const handleOpenEditForm = (stall: Stall) => {
    const stallTotal = stall.totalPrice !== undefined ? stall.totalPrice : 75000;
    setEditingStallId(stall.id);
    setFormData({
      name: stall.name,
      vendorName: stall.vendorName,
      whatsappNumber: stall.whatsappNumber,
      totalPrice: stallTotal,
      advancePayment: stall.advancePayment,
      remainingBalance: stall.remainingBalance !== undefined ? stall.remainingBalance : (stallTotal - stall.advancePayment),
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
    const totalPriceNum = Number(formData.totalPrice) || (eventId === 'chakra360' ? 75000 : 75000);
    const advanceNum = Number(formData.advancePayment) || 0;
    const remainingNum = Math.max(0, totalPriceNum - advanceNum);

    const targetStall: Stall = {
      id: stallId,
      name: formData.name.trim(),
      vendorName: formData.vendorName.trim(),
      whatsappNumber: formData.whatsappNumber.trim(),
      totalPrice: totalPriceNum,
      advancePayment: advanceNum,
      remainingBalance: remainingNum,
      items: itemsArray,
      notes: formData.notes.trim(),
      createdAt: existingStall?.createdAt || Date.now()
    };

    try {
      await setDoc(doc(db, collectionName, stallId), targetStall);
      setIsFormOpen(false);
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `${collectionName}/${stallId}`);
      setIsFormOpen(false);
    }
  };

  const handleDeleteStall = async (id: string, name: string) => {
    if (!confirm(`Are you absolutely sure you want to delete "${name}"? This action cannot be undone.`)) return;

    try {
      await deleteDoc(doc(db, collectionName, id));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `${collectionName}/${id}`);
    }
  };

  // Quick edit status for simple in-row amount update
  const [inlineEditingId, setInlineEditingId] = useState<string | null>(null);
  const [inlineData, setInlineData] = useState({ totalPrice: 75000, advancePayment: 0, remainingBalance: 75000 });

  const handleStartInlineEdit = (stall: Stall) => {
    const totalP = stall.totalPrice !== undefined ? stall.totalPrice : 75000;
    setInlineEditingId(stall.id);
    setInlineData({
      totalPrice: totalP,
      advancePayment: stall.advancePayment,
      remainingBalance: stall.remainingBalance !== undefined ? stall.remainingBalance : (totalP - stall.advancePayment)
    });
  };

  const handleSaveInline = async (stall: Stall) => {
    const totalP = Number(inlineData.totalPrice) || 75000;
    const adv = Number(inlineData.advancePayment) || 0;
    const rem = Math.max(0, totalP - adv);
    const updated = {
      ...stall,
      totalPrice: totalP,
      advancePayment: adv,
      remainingBalance: rem
    };
    try {
      await setDoc(doc(db, collectionName, stall.id), updated);
      setInlineEditingId(null);
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `${collectionName}/${stall.id}`);
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
  const totalStallValue = stalls.reduce((sum, s) => sum + (s.totalPrice !== undefined ? s.totalPrice : 75000), 0);
  const totalAdvancesSum = stalls.reduce((sum, s) => sum + s.advancePayment, 0);
  const totalOutstandingsSum = stalls.reduce((sum, s) => sum + (s.remainingBalance !== undefined ? s.remainingBalance : Math.max(0, (s.totalPrice || 75000) - s.advancePayment)), 0);

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
            Stall Details Management {eventId === 'chakra360' ? '(CHAKRA 360)' : ''}
          </h2>
          <p className="text-xs text-white/40 mt-1 font-mono">
            Commercial vendor ledger. Standard Chakra 360 stall price is locked at <span className="text-[#FF6B00] font-bold">LKR 75,000</span> per stall.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleResetToDefaultTemplate}
            className="flex items-center justify-center gap-2 px-3.5 py-2 bg-white/5 hover:bg-white/10 text-white/70 hover:text-white font-mono text-xs rounded-xl border border-white/10 transition cursor-pointer"
            title="Reset stalls to default template with LKR 75,000 pricing"
          >
            <RefreshCw size={13} />
            <span className="hidden sm:inline">Reset Template (75k)</span>
          </button>

          <button
            onClick={handleOpenAddForm}
            className="flex items-center justify-center gap-2 px-4 py-2 bg-[#FF6B00] hover:bg-[#FF852B] text-zinc-950 font-black font-mono text-xs rounded-xl transition shadow-[0_0_15px_rgba(255,107,0,0.15)] cursor-pointer select-none"
          >
            <Plus size={14} />
            Register Stall
          </button>
        </div>
      </div>

      {/* STATS TILES ROW */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3.5" id="stall-stats-dashboard">
        <div className="bg-white/5 border border-white/10 p-4 rounded-2xl flex items-center justify-between">
          <div>
            <span className="text-[9px] uppercase tracking-wider font-mono text-white/30 block">Total Stalls</span>
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

        <div className="bg-white/5 border border-[#FF6B00]/20 p-4 rounded-2xl flex items-center justify-between">
          <div>
            <span className="text-[9px] uppercase tracking-wider font-mono text-[#FF6B00] block font-bold">Total Stalls Value</span>
            <span className="text-2xl font-black font-display text-white mt-1 block">
              <span className="text-xs font-mono font-medium mr-0.5 text-[#FF6B00]">LKR</span>{totalStallValue.toLocaleString()}
            </span>
          </div>
          <div className="p-2 bg-[#FF6B00]/10 border border-[#FF6B00]/20 rounded-xl text-[#FF6B00] font-mono text-[10px] font-bold">@75K</div>
        </div>

        <div className="bg-white/5 border border-white/10 p-4 rounded-2xl flex items-center justify-between">
          <div>
            <span className="text-[9px] uppercase tracking-wider font-mono text-white/30 block">Advances Received</span>
            <span className="text-2xl font-black font-display text-emerald-400 mt-1 block">
              <span className="text-xs font-mono font-medium mr-0.5">LKR</span>{totalAdvancesSum.toLocaleString()}
            </span>
          </div>
          <div className="p-2 bg-emerald-500/10 border border-emerald-500/10 rounded-xl text-emerald-400 font-mono text-[10px] font-bold">PAID</div>
        </div>

        <div className="bg-white/5 border border-white/10 p-4 rounded-2xl flex items-center justify-between col-span-2 lg:col-span-1">
          <div>
            <span className="text-[9px] uppercase tracking-wider font-mono text-white/30 block">Pending Balance</span>
            <span className="text-2xl font-black font-display text-rose-400 mt-1 block">
              <span className="text-xs font-mono font-medium mr-0.5">LKR</span>{totalOutstandingsSum.toLocaleString()}
            </span>
          </div>
          <div className="p-2 bg-rose-500/10 border border-rose-500/10 rounded-xl text-rose-400 font-mono text-[10px] font-bold">PENDING</div>
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
            <table className="w-full text-left border-collapse min-w-[950px]">
              <thead>
                <tr className="border-b border-white/10 bg-black/40 font-mono text-[9px] uppercase tracking-wider text-white/40">
                  <th className="py-3.5 px-4 font-bold">Stall / Vendor Details</th>
                  <th className="py-3.5 px-4 font-bold">WhatsApp / Reach</th>
                  <th className="py-3.5 px-4 font-bold">Planned Sale Items</th>
                  <th className="py-3.5 px-4 font-bold text-right w-[140px]">Total Price</th>
                  <th className="py-3.5 px-4 font-bold text-right w-[140px]">Advance Paid</th>
                  <th className="py-3.5 px-4 text-right w-[140px] font-bold">Pending Balance</th>
                  <th className="py-3.5 px-4 font-bold text-center w-[120px]">Status</th>
                  <th className="py-3.5 px-4 font-bold text-center w-[140px]">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filteredStalls.map((stall) => {
                  const stallPrice = stall.totalPrice !== undefined ? stall.totalPrice : 75000;
                  const stallBalance = stall.remainingBalance !== undefined ? stall.remainingBalance : Math.max(0, stallPrice - stall.advancePayment);
                  const isOutstanding = stallBalance > 0;
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
                      <td className="py-4 px-4 max-w-[280px]">
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

                      {/* Total Price */}
                      <td className="py-4 px-4 text-right">
                        {isInlineEditing ? (
                          <div className="inline-flex flex-col items-end gap-1">
                            <span className="text-[8px] font-mono text-white/30 uppercase">Total Fee</span>
                            <input
                              type="number"
                              value={inlineData.totalPrice}
                              onChange={(e) => {
                                const newTot = Number(e.target.value) || 0;
                                setInlineData(prev => ({ 
                                  ...prev, 
                                  totalPrice: newTot,
                                  remainingBalance: Math.max(0, newTot - prev.advancePayment)
                                }));
                              }}
                              className="w-24 bg-black/60 border border-[#FF6B00]/40 rounded px-1.5 py-1 text-right text-[11px] font-mono text-white focus:outline-none focus:border-[#FF6B00]"
                            />
                          </div>
                        ) : (
                          <span className="font-mono text-white font-bold text-xs">
                            LKR {stallPrice.toLocaleString()}
                          </span>
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
                              onChange={(e) => {
                                const newAdv = Number(e.target.value) || 0;
                                setInlineData(prev => ({ 
                                  ...prev, 
                                  advancePayment: newAdv,
                                  remainingBalance: Math.max(0, prev.totalPrice - newAdv)
                                }));
                              }}
                              className="w-24 bg-black/60 border border-emerald-500/40 rounded px-1.5 py-1 text-right text-[11px] font-mono text-emerald-400 focus:outline-none focus:border-[#FF6B00]"
                            />
                          </div>
                        ) : (
                          <span className="font-mono text-emerald-400 text-xs">
                            LKR {stall.advancePayment.toLocaleString()}
                          </span>
                        )}
                      </td>

                      {/* Remaining Balance */}
                      <td className="py-4 px-4 text-right">
                        {isInlineEditing ? (
                          <div className="inline-flex flex-col items-end gap-1">
                            <span className="text-[8px] font-mono text-white/30 uppercase">Balance</span>
                            <span className="font-mono text-xs font-bold text-rose-400 py-1">
                              LKR {inlineData.remainingBalance.toLocaleString()}
                            </span>
                          </div>
                        ) : (
                          <span className={`font-mono text-xs font-semibold ${isOutstanding ? 'text-rose-400' : 'text-emerald-400'}`}>
                            LKR {stallBalance.toLocaleString()}
                          </span>
                        )}
                      </td>

                      {/* Status */}
                      <td className="py-4 px-4 text-center">
                        {stallBalance === 0 && stall.advancePayment > 0 ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[8.5px] font-mono font-bold uppercase tracking-wider bg-emerald-500/15 border border-emerald-500/20 text-emerald-400">
                            <CheckCircle2 size={10} /> Fully Paid
                          </span>
                        ) : isOutstanding ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[8.5px] font-mono font-bold uppercase tracking-wider bg-rose-500/15 border border-rose-500/20 text-rose-400">
                            <AlertCircle size={10} /> Pending
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[8.5px] font-mono font-bold uppercase tracking-wider bg-white/5 border border-white/5 text-zinc-400">
                            Unpaid
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

                {/* Payments Grid with Total Price, Advance, and Remaining Balance */}
                <div className="grid grid-cols-3 gap-3 bg-white/[0.02] border border-white/5 p-3 rounded-xl">
                  {/* Total Price */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-mono uppercase text-[#FF6B00] font-bold tracking-wider">Total Price (LKR)</label>
                    <input
                      type="number"
                      placeholder="75000"
                      value={formData.totalPrice || ''}
                      onChange={(e) => {
                        const tot = Number(e.target.value) || 0;
                        setFormData(prev => ({ 
                          ...prev, 
                          totalPrice: tot,
                          remainingBalance: Math.max(0, tot - prev.advancePayment)
                        }));
                      }}
                      className="w-full bg-black/40 border border-[#FF6B00]/40 rounded-xl text-xs text-white px-3 py-2.5 focus:outline-none focus:border-[#FF6B00] font-mono font-bold"
                    />
                  </div>

                  {/* Advance Payment */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-mono uppercase text-emerald-400 font-bold tracking-wider">Paid Advance (LKR)</label>
                    <input
                      type="number"
                      placeholder="0"
                      value={formData.advancePayment || ''}
                      onChange={(e) => {
                        const adv = Number(e.target.value) || 0;
                        setFormData(prev => ({ 
                          ...prev, 
                          advancePayment: adv,
                          remainingBalance: Math.max(0, (prev.totalPrice || 75000) - adv)
                        }));
                      }}
                      className="w-full bg-black/40 border border-emerald-500/40 rounded-xl text-xs text-emerald-400 px-3 py-2.5 focus:outline-none focus:border-[#FF6B00] font-mono"
                    />
                  </div>

                  {/* Remaining Balance */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-mono uppercase text-rose-400 font-bold tracking-wider">Pending (LKR)</label>
                    <input
                      type="number"
                      readOnly
                      value={formData.remainingBalance || 0}
                      className="w-full bg-black/60 border border-rose-500/20 rounded-xl text-xs text-rose-400 px-3 py-2.5 font-mono font-bold cursor-not-allowed"
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
