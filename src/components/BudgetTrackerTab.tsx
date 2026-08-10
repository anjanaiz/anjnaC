import React, { useState, useEffect } from 'react';
import { BudgetItem } from '../types';
import { 
  DollarSign, 
  Plus, 
  Trash2, 
  Edit2, 
  Search, 
  Filter, 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle, 
  CheckCircle2, 
  PieChart, 
  FileSpreadsheet,
  X,
  CreditCard,
  Building,
  Calendar,
  Layers
} from 'lucide-react';
import { collection, doc, setDoc, deleteDoc, onSnapshot } from 'firebase/firestore';
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

interface BudgetTrackerTabProps {
  eventId?: 'chakra360' | 'kathawak';
  initialItems?: BudgetItem[];
}

export const BudgetTrackerTab: React.FC<BudgetTrackerTabProps> = ({ 
  eventId = 'chakra360',
  initialItems = []
}) => {
  const storageKey = `budget_items_${eventId}`;
  const collectionName = `budget_${eventId}`;

  const [items, setItems] = useState<BudgetItem[]>(() => {
    const saved = localStorage.getItem(storageKey);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.length > 0) return parsed;
      } catch (e) {
        console.error("Failed to parse local budget items", e);
      }
    }
    return initialItems;
  });

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [selectedType, setSelectedType] = useState<'ALL' | 'Expense' | 'Income'>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<BudgetItem | null>(null);

  // Form State
  const [formData, setFormData] = useState<Partial<BudgetItem>>({
    category: 'Venue & Security',
    title: '',
    type: 'Expense',
    estimatedAmount: 0,
    actualAmount: 0,
    paidAmount: 0,
    paymentStatus: 'Unpaid',
    vendorOrSource: '',
    dueDate: '',
    notes: ''
  });

  // Sync state to local storage
  useEffect(() => {
    localStorage.setItem(storageKey, JSON.stringify(items));
  }, [items, storageKey]);

  // Firestore real-time listener
  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, collectionName), (snapshot) => {
      const list: BudgetItem[] = [];
      snapshot.forEach(docSnap => {
        list.push(docSnap.data() as BudgetItem);
      });
      if (list.length > 0) {
        setItems(list);
      } else if (initialItems.length > 0) {
        // Seed initial items if collection is empty
        initialItems.forEach(item => {
          setDoc(doc(db, collectionName, item.id), cleanUndefined(item)).catch(console.error);
        });
      }
    }, (err) => {
      handleFirestoreError(err, OperationType.GET, collectionName);
    });

    return () => unsubscribe();
  }, [collectionName, initialItems]);

  const handleSaveItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.vendorOrSource) {
      alert("Please fill in the Item Title and Vendor / Source name.");
      return;
    }

    const itemToSave: BudgetItem = {
      id: editingItem ? editingItem.id : `bg_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      category: formData.category || 'Miscellaneous',
      title: formData.title,
      type: formData.type || 'Expense',
      estimatedAmount: Number(formData.estimatedAmount) || 0,
      actualAmount: Number(formData.actualAmount) || 0,
      paidAmount: Number(formData.paidAmount) || 0,
      paymentStatus: formData.paymentStatus || 'Unpaid',
      vendorOrSource: formData.vendorOrSource,
      dueDate: formData.dueDate || '',
      notes: formData.notes || ''
    };

    // Update local state
    setItems(prev => {
      const exists = prev.some(i => i.id === itemToSave.id);
      if (exists) {
        return prev.map(i => i.id === itemToSave.id ? itemToSave : i);
      }
      return [...prev, itemToSave];
    });

    // Firestore sync
    try {
      await setDoc(doc(db, collectionName, itemToSave.id), cleanUndefined(itemToSave));
    } catch (err) {
      console.error("Firestore budget save error:", err);
    }

    setModalOpen(false);
    setEditingItem(null);
    resetForm();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this budget item?")) return;
    setItems(prev => prev.filter(i => i.id !== id));
    try {
      await deleteDoc(doc(db, collectionName, id));
    } catch (err) {
      console.error("Firestore budget delete error:", err);
    }
  };

  const handleEdit = (item: BudgetItem) => {
    setEditingItem(item);
    setFormData(item);
    setModalOpen(true);
  };

  const resetForm = () => {
    setFormData({
      category: eventId === 'chakra360' ? 'Artist Lineup' : 'Venue & Security',
      title: '',
      type: 'Expense',
      estimatedAmount: 0,
      actualAmount: 0,
      paidAmount: 0,
      paymentStatus: 'Unpaid',
      vendorOrSource: '',
      dueDate: '',
      notes: ''
    });
  };

  const handleResetToDefaults = async () => {
    if (confirm("Reset budget items to default event budget template?")) {
      setItems(initialItems);
      localStorage.setItem(storageKey, JSON.stringify(initialItems));
      for (const item of initialItems) {
        try {
          await setDoc(doc(db, collectionName, item.id), cleanUndefined(item));
        } catch (e) {
          console.error("Firestore reseed error:", e);
        }
      }
    }
  };

  // Metric calculations
  const totalExpensesEstimated = items.filter(i => i.type === 'Expense').reduce((sum, i) => sum + i.estimatedAmount, 0);
  const totalExpensesActual = items.filter(i => i.type === 'Expense').reduce((sum, i) => sum + i.actualAmount, 0);
  const totalExpensesPaid = items.filter(i => i.type === 'Expense').reduce((sum, i) => sum + i.paidAmount, 0);
  
  const totalIncomeEstimated = items.filter(i => i.type === 'Income').reduce((sum, i) => sum + i.estimatedAmount, 0);
  const totalIncomeActual = items.filter(i => i.type === 'Income').reduce((sum, i) => sum + i.actualAmount, 0);
  const totalIncomePaid = items.filter(i => i.type === 'Income').reduce((sum, i) => sum + i.paidAmount, 0);

  const netBalance = totalIncomePaid - totalExpensesPaid;
  const pendingExpenseBalance = totalExpensesActual - totalExpensesPaid;

  // Filter items
  const filteredItems = items.filter(item => {
    const matchesSearch = item.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          item.vendorOrSource.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'ALL' || item.category === selectedCategory;
    const matchesType = selectedType === 'ALL' || item.type === selectedType;
    const matchesStatus = selectedStatus === 'ALL' || item.paymentStatus === selectedStatus;

    return matchesSearch && matchesCategory && matchesType && matchesStatus;
  });

  const categoriesList = eventId === 'chakra360' ? [
    'Artist Lineup',
    'Band',
    'Stage, LED Wall, Fire & Lighting',
    'Location',
    'Audience Table Seating & Barricade Gates',
    'Bouncers',
    'Marketing',
    'Estimated Government Tax',
    'Venue & Security', 
    'Sound & Stage', 
    'Artist & Performance', 
    'Media & Marketing', 
    'Miscellaneous'
  ] : [
    'Venue & Security', 
    'Sound & Stage', 
    'Artist & Performance', 
    'Media & Marketing', 
    'Logistics & Hospitality', 
    'Sponsorship & Revenue', 
    'Miscellaneous'
  ];

  return (
    <div className="space-y-6">
      
      {/* SUMMARY STATS HEADER */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* TOTAL INCOME CARD */}
        <div className="bg-[#0D0D0D] border border-emerald-500/20 p-5 rounded-2xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-full blur-xl pointer-events-none" />
          <div className="flex items-center justify-between mb-3">
            <span className="text-[10px] uppercase font-mono tracking-wider text-emerald-400 font-bold">Total Revenue / Income</span>
            <div className="p-2 bg-emerald-500/10 rounded-xl text-emerald-400">
              <TrendingUp size={16} />
            </div>
          </div>
          <div className="text-2xl font-black font-display text-white tracking-tight">
            LKR {totalIncomePaid.toLocaleString()}
          </div>
          <div className="flex items-center justify-between mt-2 text-[10px] font-mono text-zinc-400">
            <span>Received: LKR {totalIncomePaid.toLocaleString()}</span>
            <span className="text-emerald-400 font-bold">Est: LKR {totalIncomeEstimated.toLocaleString()}</span>
          </div>
        </div>

        {/* TOTAL EXPENSE CARD */}
        <div className="bg-[#0D0D0D] border border-red-500/20 p-5 rounded-2xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-red-500/5 rounded-full blur-xl pointer-events-none" />
          <div className="flex items-center justify-between mb-3">
            <span className="text-[10px] uppercase font-mono tracking-wider text-red-400 font-bold">Total Expenses Committed</span>
            <div className="p-2 bg-red-500/10 rounded-xl text-red-400">
              <TrendingDown size={16} />
            </div>
          </div>
          <div className="text-2xl font-black font-display text-white tracking-tight">
            LKR {totalExpensesActual.toLocaleString()}
          </div>
          <div className="flex items-center justify-between mt-2 text-[10px] font-mono text-zinc-400">
            <span>Paid: LKR {totalExpensesPaid.toLocaleString()}</span>
            <span className="text-red-400 font-bold">Pending: LKR {pendingExpenseBalance.toLocaleString()}</span>
          </div>
        </div>

        {/* NET CASH BALANCE CARD */}
        <div className="bg-[#0D0D0D] border border-[#FF6B00]/30 p-5 rounded-2xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-[#FF6B00]/5 rounded-full blur-xl pointer-events-none" />
          <div className="flex items-center justify-between mb-3">
            <span className="text-[10px] uppercase font-mono tracking-wider text-[#FF6B00] font-bold">Net Cash Flow</span>
            <div className="p-2 bg-[#FF6B00]/10 rounded-xl text-[#FF6B00]">
              <DollarSign size={16} />
            </div>
          </div>
          <div className={`text-2xl font-black font-display tracking-tight ${netBalance >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
            LKR {netBalance.toLocaleString()}
          </div>
          <div className="mt-2 text-[10px] font-mono text-zinc-400">
            {netBalance >= 0 ? 'Positive Operating Reserves' : 'Negative Cashflow Deficit'}
          </div>
        </div>

        {/* PAYOUT STATUS CARD */}
        <div className="bg-[#0D0D0D] border border-blue-500/20 p-5 rounded-2xl relative overflow-hidden group">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[10px] uppercase font-mono tracking-wider text-blue-400 font-bold">Payout Fulfillment</span>
            <div className="p-2 bg-blue-500/10 rounded-xl text-blue-400">
              <CreditCard size={16} />
            </div>
          </div>
          <div className="text-2xl font-black font-display text-white tracking-tight">
            {totalExpensesActual > 0 ? Math.round((totalExpensesPaid / totalExpensesActual) * 100) : 0}%
          </div>
          <div className="w-full h-1.5 bg-white/10 rounded-full mt-3 overflow-hidden">
            <div 
              className="bg-blue-500 h-full rounded-full transition-all duration-500"
              style={{ width: `${totalExpensesActual > 0 ? Math.min(100, (totalExpensesPaid / totalExpensesActual) * 100) : 0}%` }}
            />
          </div>
        </div>

      </div>

      {/* FILTER & CONTROLS TOOLBAR */}
      <div className="bg-[#0D0D0D] border border-white/10 p-4 rounded-2xl flex flex-col lg:flex-row items-center justify-between gap-4">
        
        {/* SEARCH BAR */}
        <div className="relative w-full lg:w-72">
          <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/40" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search vendor or line item..."
            className="w-full pl-9 pr-4 py-2 bg-white/5 border border-white/10 rounded-xl text-xs text-white placeholder-white/30 focus:outline-none focus:border-[#FF6B00] font-mono"
          />
        </div>

        {/* SELECT FILTERS */}
        <div className="flex flex-wrap items-center gap-2.5 w-full lg:w-auto">
          
          {/* TYPE FILTER */}
          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value as any)}
            className="bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-zinc-300 font-mono focus:outline-none focus:border-[#FF6B00] cursor-pointer"
          >
            <option value="ALL" className="bg-zinc-900">All Flow Types</option>
            <option value="Expense" className="bg-zinc-900">Expenses Only</option>
            <option value="Income" className="bg-zinc-900">Income / Revenue</option>
          </select>

          {/* CATEGORY FILTER */}
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-zinc-300 font-mono focus:outline-none focus:border-[#FF6B00] cursor-pointer"
          >
            <option value="ALL" className="bg-zinc-900">All Categories</option>
            {categoriesList.map(cat => (
              <option key={cat} value={cat} className="bg-zinc-900">{cat}</option>
            ))}
          </select>

          {/* STATUS FILTER */}
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-zinc-300 font-mono focus:outline-none focus:border-[#FF6B00] cursor-pointer"
          >
            <option value="ALL" className="bg-zinc-900">All Statuses</option>
            <option value="Paid" className="bg-zinc-900">Paid / Received</option>
            <option value="Partial" className="bg-zinc-900">Partial Settlement</option>
            <option value="Unpaid" className="bg-zinc-900">Unpaid Pending</option>
            <option value="Overdue" className="bg-zinc-900">Overdue</option>
          </select>

          {/* RESET TO DEFAULTS BUTTON */}
          <button
            onClick={handleResetToDefaults}
            title="Reset to official event budget template"
            className="flex items-center gap-1.5 px-3 py-2 bg-zinc-900 border border-zinc-700 hover:border-[#FF6B00] text-zinc-300 hover:text-white font-mono text-xs rounded-xl transition cursor-pointer"
          >
            <Layers size={13} className="text-[#FF6B00]" />
            <span>Load Event Template</span>
          </button>

          {/* ADD BUTTON */}
          <button
            onClick={() => {
              resetForm();
              setEditingItem(null);
              setModalOpen(true);
            }}
            className="flex items-center gap-2 px-4 py-2 bg-[#FF6B00] hover:bg-[#FF852B] text-black font-bold font-mono text-xs uppercase rounded-xl transition cursor-pointer shadow-[0_0_15px_rgba(255,107,0,0.3)]"
          >
            <Plus size={14} />
            <span>Add Budget Entry</span>
          </button>
        </div>

      </div>

      {/* BUDGET ITEMS TABLE */}
      <div className="bg-[#0D0D0D] border border-white/10 rounded-2xl overflow-hidden shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-zinc-300 font-mono">
            <thead className="bg-white/5 text-[10px] uppercase text-zinc-400 font-bold border-b border-white/10">
              <tr>
                <th className="p-4">Item & Vendor</th>
                <th className="p-4">Category</th>
                <th className="p-4">Type</th>
                <th className="p-4 text-right">Estimated (LKR)</th>
                <th className="p-4 text-right">Actual (LKR)</th>
                <th className="p-4 text-right">Paid (LKR)</th>
                <th className="p-4 text-center">Status</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filteredItems.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-12 text-center text-zinc-500">
                    <FileSpreadsheet size={32} className="mx-auto mb-2 opacity-30" />
                    <p className="text-xs">No budget items found matching your filters.</p>
                  </td>
                </tr>
              ) : (
                filteredItems.map(item => {
                  const pending = item.actualAmount - item.paidAmount;
                  return (
                    <tr key={item.id} className="hover:bg-white/[0.02] transition group">
                      <td className="p-4">
                        <div className="font-bold text-white text-sm">{item.title}</div>
                        <div className="text-[11px] text-zinc-400 flex items-center gap-1 mt-0.5">
                          <Building size={11} className="text-[#FF6B00]" />
                          <span>{item.vendorOrSource}</span>
                          {item.dueDate && (
                            <span className="ml-2 text-zinc-500 text-[10px] flex items-center gap-1">
                              <Calendar size={10} /> Due: {item.dueDate}
                            </span>
                          )}
                        </div>
                        {item.notes && <p className="text-[10px] text-zinc-500 mt-1 italic">{item.notes}</p>}
                      </td>

                      <td className="p-4 text-[11px]">
                        <span className="px-2.5 py-1 bg-white/5 border border-white/10 rounded-lg text-zinc-300">
                          {item.category}
                        </span>
                      </td>

                      <td className="p-4">
                        <span className={`px-2.5 py-1 rounded-lg font-bold text-[10px] uppercase ${
                          item.type === 'Income' 
                            ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400'
                            : 'bg-red-500/10 border border-red-500/20 text-red-400'
                        }`}>
                          {item.type}
                        </span>
                      </td>

                      <td className="p-4 text-right text-zinc-400 font-medium">
                        {item.estimatedAmount.toLocaleString()}
                      </td>

                      <td className="p-4 text-right font-bold text-white">
                        {item.actualAmount.toLocaleString()}
                      </td>

                      <td className="p-4 text-right font-bold text-emerald-400">
                        {item.paidAmount.toLocaleString()}
                        {pending > 0 && (
                          <span className="block text-[9px] text-red-400 font-normal">
                            Rem: {pending.toLocaleString()}
                          </span>
                        )}
                      </td>

                      <td className="p-4 text-center">
                        <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider ${
                          item.paymentStatus === 'Paid'
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                            : item.paymentStatus === 'Partial'
                              ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                              : item.paymentStatus === 'Overdue'
                                ? 'bg-red-500/10 text-red-400 border border-red-500/20'
                                : 'bg-zinc-500/10 text-zinc-400 border border-zinc-500/20'
                        }`}>
                          {item.paymentStatus}
                        </span>
                      </td>

                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleEdit(item)}
                            className="p-1.5 bg-white/5 hover:bg-white/10 rounded-lg text-zinc-300 transition"
                            title="Edit Item"
                          >
                            <Edit2 size={13} />
                          </button>
                          <button
                            onClick={() => handleDelete(item.id)}
                            className="p-1.5 bg-red-500/10 hover:bg-red-500/20 rounded-lg text-red-400 transition"
                            title="Delete Item"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* CREATE / EDIT MODAL */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#0C0C0C] border border-white/10 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl">
            <div className="p-5 border-b border-white/10 flex items-center justify-between">
              <h3 className="font-display font-bold text-white text-base">
                {editingItem ? 'Edit Budget Entry' : 'Create Budget Entry'}
              </h3>
              <button 
                onClick={() => setModalOpen(false)}
                className="p-1 text-zinc-400 hover:text-white"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveItem} className="p-5 space-y-4 font-mono text-xs">
              
              <div>
                <label className="block text-zinc-400 mb-1 font-bold">Item Title *</label>
                <input
                  type="text"
                  required
                  value={formData.title || ''}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g. Line Array Audio System Rental"
                  className="w-full p-2.5 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-[#FF6B00]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-zinc-400 mb-1 font-bold">Flow Type</label>
                  <select
                    value={formData.type || 'Expense'}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
                    className="w-full p-2.5 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-[#FF6B00]"
                  >
                    <option value="Expense" className="bg-zinc-900">Expense (Outgoing)</option>
                    <option value="Income" className="bg-zinc-900">Income (Incoming)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-zinc-400 mb-1 font-bold">Category</label>
                  <select
                    value={formData.category || 'Venue & Security'}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value as any })}
                    className="w-full p-2.5 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-[#FF6B00]"
                  >
                    {categoriesList.map(cat => (
                      <option key={cat} value={cat} className="bg-zinc-900">{cat}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-zinc-400 mb-1 font-bold">Vendor / Payee / Source *</label>
                <input
                  type="text"
                  required
                  value={formData.vendorOrSource || ''}
                  onChange={(e) => setFormData({ ...formData, vendorOrSource: e.target.value })}
                  placeholder="e.g. ProSound Audio Systems"
                  className="w-full p-2.5 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-[#FF6B00]"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-zinc-400 mb-1 font-bold">Estimated (LKR)</label>
                  <input
                    type="number"
                    value={formData.estimatedAmount || 0}
                    onChange={(e) => setFormData({ ...formData, estimatedAmount: Number(e.target.value) })}
                    className="w-full p-2.5 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-[#FF6B00]"
                  />
                </div>

                <div>
                  <label className="block text-zinc-400 mb-1 font-bold">Actual Cost (LKR)</label>
                  <input
                    type="number"
                    value={formData.actualAmount || 0}
                    onChange={(e) => setFormData({ ...formData, actualAmount: Number(e.target.value) })}
                    className="w-full p-2.5 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-[#FF6B00]"
                  />
                </div>

                <div>
                  <label className="block text-zinc-400 mb-1 font-bold">Paid So Far (LKR)</label>
                  <input
                    type="number"
                    value={formData.paidAmount || 0}
                    onChange={(e) => setFormData({ ...formData, paidAmount: Number(e.target.value) })}
                    className="w-full p-2.5 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-[#FF6B00]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-zinc-400 mb-1 font-bold">Payment Status</label>
                  <select
                    value={formData.paymentStatus || 'Unpaid'}
                    onChange={(e) => setFormData({ ...formData, paymentStatus: e.target.value as any })}
                    className="w-full p-2.5 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-[#FF6B00]"
                  >
                    <option value="Unpaid" className="bg-zinc-900">Unpaid</option>
                    <option value="Partial" className="bg-zinc-900">Partial Settlement</option>
                    <option value="Paid" className="bg-zinc-900">Paid / Received</option>
                    <option value="Overdue" className="bg-zinc-900">Overdue</option>
                  </select>
                </div>

                <div>
                  <label className="block text-zinc-400 mb-1 font-bold">Due Date</label>
                  <input
                    type="date"
                    value={formData.dueDate || ''}
                    onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                    className="w-full p-2.5 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-[#FF6B00]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-zinc-400 mb-1 font-bold">Notes / Contract Details</label>
                <textarea
                  value={formData.notes || ''}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Optional payment notes or contract reference..."
                  className="w-full p-2.5 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-[#FF6B00] h-20"
                />
              </div>

              <div className="pt-3 flex justify-end gap-3 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 bg-white/5 hover:bg-white/10 rounded-xl text-zinc-300 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#FF6B00] hover:bg-[#FF852B] text-black font-bold rounded-xl"
                >
                  Save Entry
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
};
