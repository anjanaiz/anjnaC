import React, { useState, useEffect } from 'react';
import { Sponsor, SponsorTier } from '../types';
import { 
  Award, 
  Plus, 
  Trash2, 
  Edit2, 
  CheckSquare, 
  Square, 
  Phone, 
  Mail, 
  DollarSign, 
  Search, 
  X,
  FileCheck,
  ShieldCheck,
  ExternalLink,
  UserCheck
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

interface SponsorManagementTabProps {
  eventId?: 'chakra360' | 'kathawak';
  initialSponsors?: Sponsor[];
}

export const SponsorManagementTab: React.FC<SponsorManagementTabProps> = ({
  eventId = 'chakra360',
  initialSponsors = []
}) => {
  const storageKey = `sponsors_${eventId}`;
  const collectionName = `sponsors_${eventId}`;

  const [sponsors, setSponsors] = useState<Sponsor[]>(() => {
    const saved = localStorage.getItem(storageKey);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.length > 0) return parsed;
      } catch (e) {
        console.error("Failed to parse local sponsors data", e);
      }
    }
    return initialSponsors;
  });

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTier, setSelectedTier] = useState<string>('ALL');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingSponsor, setEditingSponsor] = useState<Sponsor | null>(null);

  // Form State
  const [formData, setFormData] = useState<Partial<Sponsor>>({
    name: '',
    brandName: '',
    tier: 'Gold',
    contactPerson: '',
    phone: '',
    email: '',
    contractValue: 0,
    amountReceived: 0,
    paymentStatus: 'Pending',
    status: 'Confirmed',
    notes: '',
    deliverables: []
  });

  const [newDeliverableText, setNewDeliverableText] = useState('');

  // Sync to localStorage
  useEffect(() => {
    localStorage.setItem(storageKey, JSON.stringify(sponsors));
  }, [sponsors, storageKey]);

  // Firestore real-time listener
  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, collectionName), (snapshot) => {
      const list: Sponsor[] = [];
      snapshot.forEach(docSnap => {
        list.push(docSnap.data() as Sponsor);
      });
      if (list.length > 0) {
        setSponsors(list);
      } else if (initialSponsors.length > 0) {
        initialSponsors.forEach(s => {
          setDoc(doc(db, collectionName, s.id), cleanUndefined(s)).catch(console.error);
        });
      }
    }, (err) => {
      handleFirestoreError(err, OperationType.GET, collectionName);
    });

    return () => unsubscribe();
  }, [collectionName, initialSponsors]);

  const handleSaveSponsor = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.brandName) {
      alert("Please provide the Sponsor Organization Name and Brand Name.");
      return;
    }

    const sponsorToSave: Sponsor = {
      id: editingSponsor ? editingSponsor.id : `sp_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      name: formData.name,
      brandName: formData.brandName,
      tier: (formData.tier as SponsorTier) || 'Gold',
      contactPerson: formData.contactPerson || '',
      phone: formData.phone || '',
      email: formData.email || '',
      contractValue: Number(formData.contractValue) || 0,
      amountReceived: Number(formData.amountReceived) || 0,
      paymentStatus: formData.paymentStatus || 'Pending',
      status: formData.status || 'Confirmed',
      notes: formData.notes || '',
      deliverables: formData.deliverables || []
    };

    setSponsors(prev => {
      const exists = prev.some(s => s.id === sponsorToSave.id);
      if (exists) {
        return prev.map(s => s.id === sponsorToSave.id ? sponsorToSave : s);
      }
      return [...prev, sponsorToSave];
    });

    try {
      await setDoc(doc(db, collectionName, sponsorToSave.id), cleanUndefined(sponsorToSave));
    } catch (err) {
      console.error("Firestore sponsor write error:", err);
    }

    setModalOpen(false);
    setEditingSponsor(null);
    resetForm();
  };

  const handleDeleteSponsor = async (id: string) => {
    if (!confirm("Are you sure you want to delete this sponsor entry?")) return;
    setSponsors(prev => prev.filter(s => s.id !== id));
    try {
      await deleteDoc(doc(db, collectionName, id));
    } catch (err) {
      console.error("Firestore sponsor delete error:", err);
    }
  };

  const handleToggleDeliverable = async (sponsorId: string, deliverableId: string) => {
    const updated = sponsors.map(sp => {
      if (sp.id === sponsorId) {
        return {
          ...sp,
          deliverables: sp.deliverables.map(d => d.id === deliverableId ? { ...d, completed: !d.completed } : d)
        };
      }
      return sp;
    });

    setSponsors(updated);
    const target = updated.find(s => s.id === sponsorId);
    if (target) {
      try {
        await setDoc(doc(db, collectionName, sponsorId), cleanUndefined(target));
      } catch (err) {
        console.error("Firestore deliverable toggle error:", err);
      }
    }
  };

  const handleAddDeliverable = () => {
    if (!newDeliverableText.trim()) return;
    const item = {
      id: `del_${Date.now()}`,
      text: newDeliverableText.trim(),
      completed: false
    };
    setFormData(prev => ({
      ...prev,
      deliverables: [...(prev.deliverables || []), item]
    }));
    setNewDeliverableText('');
  };

  const handleRemoveDeliverable = (delId: string) => {
    setFormData(prev => ({
      ...prev,
      deliverables: (prev.deliverables || []).filter(d => d.id !== delId)
    }));
  };

  const resetForm = () => {
    setFormData({
      name: '',
      brandName: '',
      tier: 'Gold',
      contactPerson: '',
      phone: '',
      email: '',
      contractValue: 0,
      amountReceived: 0,
      paymentStatus: 'Pending',
      status: 'Confirmed',
      notes: '',
      deliverables: []
    });
    setNewDeliverableText('');
  };

  const handleEdit = (sp: Sponsor) => {
    setEditingSponsor(sp);
    setFormData(sp);
    setModalOpen(true);
  };

  // Metrics
  const totalContractValue = sponsors.reduce((acc, s) => acc + s.contractValue, 0);
  const totalAmountReceived = sponsors.reduce((acc, s) => acc + s.amountReceived, 0);
  const totalPendingCollection = totalContractValue - totalAmountReceived;
  const allDeliverables = sponsors.flatMap(s => s.deliverables);
  const completedDeliverables = allDeliverables.filter(d => d.completed).length;

  const filteredSponsors = sponsors.filter(sp => {
    const matchesSearch = sp.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          sp.brandName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          sp.contactPerson.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesTier = selectedTier === 'ALL' || sp.tier === selectedTier;
    return matchesSearch && matchesTier;
  });

  const tiersList: SponsorTier[] = [
    'Title Sponsor',
    'Platinum',
    'Gold',
    'Silver',
    'Media Partner',
    'Beverage Partner',
    'Official Supporter'
  ];

  return (
    <div className="space-y-6">
      
      {/* STATS OVERVIEW CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        <div className="bg-[#0D0D0D] border border-amber-500/20 p-5 rounded-2xl relative overflow-hidden">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[10px] uppercase font-mono tracking-wider text-amber-400 font-bold">Total Committed Sponsorship</span>
            <div className="p-2 bg-amber-500/10 rounded-xl text-amber-400">
              <Award size={16} />
            </div>
          </div>
          <div className="text-2xl font-black font-display text-white tracking-tight">
            LKR {totalContractValue.toLocaleString()}
          </div>
          <div className="mt-2 text-[10px] font-mono text-zinc-400">
            Across {sponsors.length} Active Sponsor Partners
          </div>
        </div>

        <div className="bg-[#0D0D0D] border border-emerald-500/20 p-5 rounded-2xl relative overflow-hidden">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[10px] uppercase font-mono tracking-wider text-emerald-400 font-bold">Funds Received</span>
            <div className="p-2 bg-emerald-500/10 rounded-xl text-emerald-400">
              <DollarSign size={16} />
            </div>
          </div>
          <div className="text-2xl font-black font-display text-white tracking-tight">
            LKR {totalAmountReceived.toLocaleString()}
          </div>
          <div className="mt-2 text-[10px] font-mono text-emerald-400 font-bold">
            {totalContractValue > 0 ? Math.round((totalAmountReceived / totalContractValue) * 100) : 0}% Collected
          </div>
        </div>

        <div className="bg-[#0D0D0D] border border-red-500/20 p-5 rounded-2xl relative overflow-hidden">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[10px] uppercase font-mono tracking-wider text-red-400 font-bold">Pending Receivables</span>
            <div className="p-2 bg-red-500/10 rounded-xl text-red-400">
              <FileCheck size={16} />
            </div>
          </div>
          <div className="text-2xl font-black font-display text-white tracking-tight">
            LKR {totalPendingCollection.toLocaleString()}
          </div>
          <div className="mt-2 text-[10px] font-mono text-zinc-400">
            Pending Milestones Settlement
          </div>
        </div>

        <div className="bg-[#0D0D0D] border border-blue-500/20 p-5 rounded-2xl relative overflow-hidden">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[10px] uppercase font-mono tracking-wider text-blue-400 font-bold">Deliverables Fulfilled</span>
            <div className="p-2 bg-blue-500/10 rounded-xl text-blue-400">
              <ShieldCheck size={16} />
            </div>
          </div>
          <div className="text-2xl font-black font-display text-white tracking-tight">
            {completedDeliverables} / {allDeliverables.length}
          </div>
          <div className="w-full h-1.5 bg-white/10 rounded-full mt-3 overflow-hidden">
            <div 
              className="bg-blue-500 h-full rounded-full transition-all duration-500"
              style={{ width: `${allDeliverables.length > 0 ? (completedDeliverables / allDeliverables.length) * 100 : 0}%` }}
            />
          </div>
        </div>

      </div>

      {/* SEARCH AND FILTERS */}
      <div className="bg-[#0D0D0D] border border-white/10 p-4 rounded-2xl flex flex-col md:flex-row items-center justify-between gap-4">
        
        <div className="relative w-full md:w-80">
          <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/40" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search sponsor brand or contact..."
            className="w-full pl-9 pr-4 py-2 bg-white/5 border border-white/10 rounded-xl text-xs text-white placeholder-white/30 focus:outline-none focus:border-[#FF6B00] font-mono"
          />
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-end">
          <select
            value={selectedTier}
            onChange={(e) => setSelectedTier(e.target.value)}
            className="bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-zinc-300 font-mono focus:outline-none focus:border-[#FF6B00] cursor-pointer"
          >
            <option value="ALL" className="bg-zinc-900">All Tiers</option>
            {tiersList.map(t => (
              <option key={t} value={t} className="bg-zinc-900">{t}</option>
            ))}
          </select>

          <button
            onClick={() => {
              resetForm();
              setEditingSponsor(null);
              setModalOpen(true);
            }}
            className="flex items-center gap-2 px-4 py-2 bg-[#FF6B00] hover:bg-[#FF852B] text-black font-bold font-mono text-xs uppercase rounded-xl transition cursor-pointer shadow-[0_0_15px_rgba(255,107,0,0.3)]"
          >
            <Plus size={14} />
            <span>Add Sponsor</span>
          </button>
        </div>

      </div>

      {/* SPONSOR CARDS GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredSponsors.length === 0 ? (
          <div className="col-span-full bg-[#0D0D0D] border border-white/10 p-12 rounded-2xl text-center text-zinc-500 font-mono">
            <Award size={36} className="mx-auto mb-3 opacity-30 text-[#FF6B00]" />
            <p className="text-xs">No sponsors configured for this filter.</p>
          </div>
        ) : (
          filteredSponsors.map(sp => {
            const isFullyPaid = sp.amountReceived >= sp.contractValue && sp.contractValue > 0;
            return (
              <div key={sp.id} className="bg-[#0D0D0D] border border-white/10 rounded-2xl p-5 flex flex-col justify-between space-y-4 hover:border-white/20 transition relative group">
                
                {/* TOP BRAND HEADER */}
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className={`inline-block px-2.5 py-0.5 rounded-full text-[9px] font-bold uppercase font-mono tracking-wider mb-2 ${
                        sp.tier === 'Title Sponsor'
                          ? 'bg-amber-400/20 text-amber-300 border border-amber-400/40'
                          : sp.tier === 'Platinum'
                            ? 'bg-zinc-300/20 text-zinc-200 border border-zinc-300/40'
                            : sp.tier === 'Gold'
                              ? 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/40'
                              : 'bg-blue-500/20 text-blue-300 border border-blue-500/40'
                      }`}>
                        {sp.tier}
                      </span>
                      <h3 className="font-display font-bold text-white text-base leading-snug">
                        {sp.brandName}
                      </h3>
                      <p className="text-[11px] font-mono text-zinc-400">{sp.name}</p>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleEdit(sp)}
                        className="p-1.5 bg-white/5 hover:bg-white/10 rounded-lg text-zinc-300 transition"
                      >
                        <Edit2 size={12} />
                      </button>
                      <button
                        onClick={() => handleDeleteSponsor(sp.id)}
                        className="p-1.5 bg-red-500/10 hover:bg-red-500/20 rounded-lg text-red-400 transition"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </div>

                  {/* FINANCIAL BAR */}
                  <div className="bg-white/5 border border-white/10 p-3 rounded-xl mt-3 space-y-1 font-mono">
                    <div className="flex justify-between text-[10px]">
                      <span className="text-zinc-400">Contract Value:</span>
                      <span className="text-white font-bold">LKR {sp.contractValue.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-[10px]">
                      <span className="text-zinc-400">Received:</span>
                      <span className={`font-bold ${isFullyPaid ? 'text-emerald-400' : 'text-amber-400'}`}>
                        LKR {sp.amountReceived.toLocaleString()}
                      </span>
                    </div>
                  </div>

                  {/* CONTACT PERSON */}
                  {sp.contactPerson && (
                    <div className="mt-3 pt-3 border-t border-white/5 font-mono text-[11px] text-zinc-300 space-y-1">
                      <div className="flex items-center gap-1.5 text-zinc-400 font-bold">
                        <UserCheck size={12} className="text-[#FF6B00]" />
                        <span>{sp.contactPerson}</span>
                      </div>
                      {sp.phone && (
                        <div className="flex items-center gap-1.5 text-zinc-400 text-[10px]">
                          <Phone size={10} />
                          <span>{sp.phone}</span>
                        </div>
                      )}
                      {sp.email && (
                        <div className="flex items-center gap-1.5 text-zinc-400 text-[10px]">
                          <Mail size={10} />
                          <span>{sp.email}</span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* DELIVERABLES CHECKLIST */}
                  {sp.deliverables.length > 0 && (
                    <div className="mt-4 pt-3 border-t border-white/5 space-y-2">
                      <span className="text-[9px] uppercase font-mono text-zinc-400 font-bold tracking-wider block">
                        Deliverables Tracker ({sp.deliverables.filter(d => d.completed).length}/{sp.deliverables.length})
                      </span>
                      <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                        {sp.deliverables.map(del => (
                          <button
                            key={del.id}
                            onClick={() => handleToggleDeliverable(sp.id, del.id)}
                            className="w-full flex items-start gap-2 text-left p-1.5 rounded bg-white/[0.02] hover:bg-white/[0.05] transition cursor-pointer"
                          >
                            {del.completed ? (
                              <CheckSquare size={13} className="text-emerald-400 shrink-0 mt-0.5" />
                            ) : (
                              <Square size={13} className="text-zinc-500 shrink-0 mt-0.5" />
                            )}
                            <span className={`text-[10px] font-mono ${del.completed ? 'text-zinc-400 line-through' : 'text-zinc-200'}`}>
                              {del.text}
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                </div>

                {sp.notes && (
                  <p className="text-[10px] font-mono text-zinc-500 italic pt-2 border-t border-white/5">
                    "{sp.notes}"
                  </p>
                )}

              </div>
            );
          })
        )}
      </div>

      {/* CREATE / EDIT MODAL */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#0C0C0C] border border-white/10 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl max-h-[90vh] flex flex-col">
            <div className="p-5 border-b border-white/10 flex items-center justify-between">
              <h3 className="font-display font-bold text-white text-base">
                {editingSponsor ? 'Edit Sponsor Details' : 'Add New Sponsor'}
              </h3>
              <button 
                onClick={() => setModalOpen(false)}
                className="p-1 text-zinc-400 hover:text-white"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveSponsor} className="p-5 space-y-4 font-mono text-xs overflow-y-auto flex-1">
              
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-zinc-400 mb-1 font-bold">Brand Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.brandName || ''}
                    onChange={(e) => setFormData({ ...formData, brandName: e.target.value })}
                    placeholder="e.g. Commercial Bank"
                    className="w-full p-2.5 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-[#FF6B00]"
                  />
                </div>

                <div>
                  <label className="block text-zinc-400 mb-1 font-bold">Company Legal Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.name || ''}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g. Commercial Bank PLC"
                    className="w-full p-2.5 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-[#FF6B00]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-zinc-400 mb-1 font-bold">Sponsor Tier</label>
                  <select
                    value={formData.tier || 'Gold'}
                    onChange={(e) => setFormData({ ...formData, tier: e.target.value as any })}
                    className="w-full p-2.5 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-[#FF6B00]"
                  >
                    {tiersList.map(t => (
                      <option key={t} value={t} className="bg-zinc-900">{t}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-zinc-400 mb-1 font-bold">Agreement Status</label>
                  <select
                    value={formData.status || 'Confirmed'}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                    className="w-full p-2.5 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-[#FF6B00]"
                  >
                    <option value="In Discussion" className="bg-zinc-900">In Discussion</option>
                    <option value="Confirmed" className="bg-zinc-900">Confirmed</option>
                    <option value="Signed" className="bg-zinc-900">Signed & Sealed</option>
                    <option value="Fulfilled" className="bg-zinc-900">Fully Fulfilled</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-zinc-400 mb-1 font-bold">Contact Person</label>
                  <input
                    type="text"
                    value={formData.contactPerson || ''}
                    onChange={(e) => setFormData({ ...formData, contactPerson: e.target.value })}
                    placeholder="Name"
                    className="w-full p-2.5 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-[#FF6B00]"
                  />
                </div>

                <div>
                  <label className="block text-zinc-400 mb-1 font-bold">Phone</label>
                  <input
                    type="text"
                    value={formData.phone || ''}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="+94 77 ..."
                    className="w-full p-2.5 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-[#FF6B00]"
                  />
                </div>

                <div>
                  <label className="block text-zinc-400 mb-1 font-bold">Email</label>
                  <input
                    type="email"
                    value={formData.email || ''}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="email@domain.com"
                    className="w-full p-2.5 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-[#FF6B00]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-zinc-400 mb-1 font-bold">Contract Value (LKR)</label>
                  <input
                    type="number"
                    value={formData.contractValue || 0}
                    onChange={(e) => setFormData({ ...formData, contractValue: Number(e.target.value) })}
                    className="w-full p-2.5 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-[#FF6B00]"
                  />
                </div>

                <div>
                  <label className="block text-zinc-400 mb-1 font-bold">Amount Received (LKR)</label>
                  <input
                    type="number"
                    value={formData.amountReceived || 0}
                    onChange={(e) => setFormData({ ...formData, amountReceived: Number(e.target.value) })}
                    className="w-full p-2.5 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-[#FF6B00]"
                  />
                </div>
              </div>

              {/* DELIVERABLES EDITOR */}
              <div>
                <label className="block text-zinc-400 mb-1 font-bold">Deliverables Checklist</label>
                <div className="flex gap-2 mb-2">
                  <input
                    type="text"
                    value={newDeliverableText}
                    onChange={(e) => setNewDeliverableText(e.target.value)}
                    placeholder="e.g. VIP Booth Branding..."
                    className="flex-1 p-2 bg-white/5 border border-white/10 rounded-xl text-white text-xs"
                  />
                  <button
                    type="button"
                    onClick={handleAddDeliverable}
                    className="px-3 py-2 bg-white/10 hover:bg-white/20 rounded-xl text-white text-xs font-bold"
                  >
                    Add
                  </button>
                </div>

                <div className="space-y-1 max-h-28 overflow-y-auto">
                  {(formData.deliverables || []).map(d => (
                    <div key={d.id} className="flex items-center justify-between bg-white/5 p-2 rounded-lg text-xs">
                      <span className="text-zinc-200">{d.text}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveDeliverable(d.id)}
                        className="text-red-400 hover:text-red-300"
                      >
                        <X size={12} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-zinc-400 mb-1 font-bold">Notes</label>
                <textarea
                  value={formData.notes || ''}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Contract terms, pass allocations..."
                  className="w-full p-2.5 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-[#FF6B00] h-16"
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
                  Save Sponsor
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
};
