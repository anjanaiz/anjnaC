import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Plus, 
  Trash2, 
  Edit3, 
  Check, 
  X, 
  Printer, 
  Search, 
  FolderPlus, 
  ArrowRight, 
  Grid, 
  Wrench, 
  ClipboardList,
  Sparkles,
  Layers,
  FileSpreadsheet
} from 'lucide-react';
import { db } from '../firebase';
import { collection, doc, setDoc, deleteDoc, onSnapshot, getDocs } from 'firebase/firestore';

export interface RequirementItem {
  id: string;
  name: string;
  quantity: number;
  notes?: string;
}

export interface RequirementCategory {
  id: string;
  name: string;
  items: RequirementItem[];
  isCustom?: boolean;
}

const DEFAULT_REQUIREMENTS: RequirementCategory[] = [
  {
    id: 'req_artists',
    name: 'Artist Requirements',
    items: [
      { id: 'art_1', name: 'Canopy', quantity: 2, notes: 'Premium sizing for Kasun Kalhara & Chamara greenrooms' },
      { id: 'art_2', name: 'Chairs', quantity: 2, notes: 'High-backed luxurious vanity leather chairs' },
      { id: 'art_3', name: 'Tables', quantity: 2, notes: 'Spacious cosmetics mirrors layout table' }
    ]
  },
  {
    id: 'req_furniture',
    name: 'Furniture',
    items: [
      { id: 'furn_1', name: 'Chairs', quantity: 200, notes: 'Audience VIP rows high-comfort chairs' },
      { id: 'furn_2', name: 'Tables', quantity: 15, notes: 'Corporate networking high-tables' },
      { id: 'furn_3', name: 'Cushion Sofas', quantity: 12, notes: 'Artist lounge primary backroom' }
    ]
  },
  {
    id: 'req_cleaning',
    name: 'Cleaning',
    items: [
      { id: 'clean_1', name: 'Green Waste Bins', quantity: 20, notes: 'To be placed near the bazaar & stalls' },
      { id: 'clean_2', name: 'Bio-hazard Bags', quantity: 50, notes: 'Sanitary disposal lines' },
      { id: 'clean_3', name: 'High-pressure Washers', quantity: 4, notes: 'Required pre & post active show times' }
    ]
  },
  {
    id: 'req_stage',
    name: 'Stage Setup',
    items: [
      { id: 'stg_1', name: 'Aluminium Truss', quantity: 32, notes: 'Chakra 3D dome roof framework supports' },
      { id: 'stg_2', name: 'Staging Blocks', quantity: 24, notes: 'Anti-slip heavy-load multi-level boards' },
      { id: 'stg_3', name: 'LED Clamps', quantity: 120, notes: 'Focal laser synchronization hooks' }
    ]
  },
  {
    id: 'req_stalls',
    name: 'Stalls',
    items: [
      { id: 'stl_1', name: 'Standard Food Stall Frames', quantity: 10, notes: 'Sri Lankan local fusion retailers' },
      { id: 'stl_2', name: 'Cooling Beverage Wells', quantity: 5, notes: 'Bazaar row standard refrigeration' },
      { id: 'stl_3', name: 'Display LED Banners', quantity: 15, notes: 'Digital pricing catalog boards' }
    ]
  },
  {
    id: 'req_crew',
    name: 'Crew',
    items: [
      { id: 'crw_1', name: 'Walkie-Talkies (Radio)', quantity: 40, notes: 'Dedicated channel 09 for production and security' },
      { id: 'crw_2', name: 'Neon Vests', quantity: 80, notes: 'High-visibility safety lines' },
      { id: 'crw_3', name: 'Technical Hardhats', quantity: 30, notes: 'Mandatory active rig times zone code' }
    ]
  }
];

export const EventRequirementsTab: React.FC = () => {
  // Load state or use fallback
  const [categories, setCategories] = useState<RequirementCategory[]>(() => {
    const saved = localStorage.getItem('chakra_event_requirements');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed && parsed.length > 0) return parsed;
      } catch (_) {}
    }
    return [];
  });

  useEffect(() => {
    localStorage.setItem('chakra_event_requirements', JSON.stringify(categories));
  }, [categories]);

  // Track category in active view if user prefers a grid/filter layout
  const [selectedFilterCategory, setSelectedFilterCategory] = useState<string>('all');
  
  // Track new category state form
  const [categoryInput, setCategoryInput] = useState('');
  
  // State for adding a new item
  const [newItemName, setNewItemName] = useState<Record<string, string>>({});
  const [newItemQty, setNewItemQty] = useState<Record<string, number>>({});
  const [newItemNotes, setNewItemNotes] = useState<Record<string, string>>({});

  // State to track editing of item inline
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [editingItemName, setEditingItemName] = useState('');
  const [editingItemQty, setEditingItemQty] = useState<number>(0);
  const [editingItemNotes, setEditingItemNotes] = useState('');

  // Search keyword for consolidated summary filter
  const [consolidatedSearch, setConsolidatedSearch] = useState('');

  // Real-time synchronization unconditionally
  useEffect(() => {
    const path = 'event_requirements';
    const unsubscribe = onSnapshot(collection(db, path), (snapshot) => {
      const list: RequirementCategory[] = [];
      snapshot.forEach(doc => {
        list.push(doc.data() as RequirementCategory);
      });
      list.sort((a, b) => {
        const idxA = DEFAULT_REQUIREMENTS.findIndex(r => r.id === a.id);
        const idxB = DEFAULT_REQUIREMENTS.findIndex(r => r.id === b.id);
        if (idxA === -1 && idxB === -1) return a.id.localeCompare(b.id);
        if (idxA === -1) return 1;
        if (idxB === -1) return -1;
        return idxA - idxB;
      });
      setCategories(list);
      localStorage.setItem('chakra_event_requirements', JSON.stringify(list));
    }, (err) => {
      console.error("Firestore event_requirements snapshot error:", err);
    });

    return () => unsubscribe();
  }, []);

  // Create Category
  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!categoryInput.trim()) return;

    // Avoid duplicate names
    const cleanedName = categoryInput.trim();
    if (categories.some(cat => cat.name.toLowerCase() === cleanedName.toLowerCase())) {
      alert("A category with this name already exists.");
      return;
    }

    const newCatObj: RequirementCategory = {
      id: 'cat_' + Date.now(),
      name: cleanedName,
      items: [],
      isCustom: true
    };

    setCategoryInput('');
    try {
      await setDoc(doc(db, 'event_requirements', newCatObj.id), newCatObj);
    } catch (err) {
      console.error("Failed to add requirements category in Firestore:", err);
    }
  };

  // Delete custom category
  const handleDeleteCategory = async (catId: string, name: string) => {
    if (confirm(`Are you sure you want to remove the entire category "${name}"? This deletes all associated requirement items.`)) {
      if (selectedFilterCategory === catId) {
        setSelectedFilterCategory('all');
      }
      try {
        await deleteDoc(doc(db, 'event_requirements', catId));
      } catch (err) {
        console.error("Failed to delete requirements category from Firestore:", err);
      }
    }
  };

  // Add Item inside Category
  const handleAddItem = async (catId: string) => {
    const name = newItemName[catId]?.trim() || '';
    const qty = newItemQty[catId] || 1;
    const notes = newItemNotes[catId]?.trim() || '';

    if (!name) {
      alert("Please provide a name for the requirement item.");
      return;
    }

    const newItem: RequirementItem = {
      id: 'itm_' + Date.now() + Math.random().toString(36).substring(2, 5),
      name: name,
      quantity: Math.max(1, qty),
      notes: notes || undefined
    };

    // Clear state inputs for this specific category
    setNewItemName(prev => ({ ...prev, [catId]: '' }));
    setNewItemQty(prev => ({ ...prev, [catId]: 1 }));
    setNewItemNotes(prev => ({ ...prev, [catId]: '' }));

    const targetCat = categories.find(c => c.id === catId);
    if (targetCat) {
      try {
        const updatedCat = {
          ...targetCat,
          items: [...targetCat.items, newItem]
        };
        await setDoc(doc(db, 'event_requirements', catId), updatedCat);
      } catch (err) {
        console.error("Failed to add requirement item to Firestore:", err);
      }
    }
  };

  // Delete Item from Category
  const handleDeleteItem = async (catId: string, itemId: string) => {
    const targetCat = categories.find(c => c.id === catId);
    if (targetCat) {
      try {
        const updatedCat = {
          ...targetCat,
          items: targetCat.items.filter(item => item.id !== itemId)
        };
        await setDoc(doc(db, 'event_requirements', catId), updatedCat);
      } catch (err) {
        console.error("Failed to delete requirement item from Firestore:", err);
      }
    }
  };

  // Trigger inline Edit configuration
  const startEditing = (item: RequirementItem) => {
    setEditingItemId(item.id);
    setEditingItemName(item.name);
    setEditingItemQty(item.quantity);
    setEditingItemNotes(item.notes || '');
  };

  // Save inline edits
  const saveItemEdits = async (catId: string, itemId: string) => {
    if (!editingItemName.trim()) {
      alert("Item name cannot be empty.");
      return;
    }

    setEditingItemId(null);

    const targetCat = categories.find(c => c.id === catId);
    if (targetCat) {
      try {
        const updatedCat = {
          ...targetCat,
          items: targetCat.items.map(item => {
            if (item.id === itemId) {
              return {
                ...item,
                name: editingItemName.trim(),
                quantity: Math.max(1, editingItemQty),
                notes: editingItemNotes.trim() || undefined
              };
            }
            return item;
          })
        };
        await setDoc(doc(db, 'event_requirements', catId), updatedCat);
      } catch (err) {
        console.error("Failed to update requirement item in Firestore:", err);
      }
    }
  };

  // Quick increment / decrement functions
  const adjustItemQty = async (catId: string, itemId: string, step: number) => {
    const targetCat = categories.find(c => c.id === catId);
    if (targetCat) {
      try {
        const updatedCat = {
          ...targetCat,
          items: targetCat.items.map(item => {
            if (item.id === itemId) {
              return {
                ...item,
                quantity: Math.max(1, item.quantity + step)
              };
            }
            return item;
          })
        };
        await setDoc(doc(db, 'event_requirements', catId), updatedCat);
      } catch (err) {
        console.error("Failed to adjust requirement item quantity in Firestore:", err);
      }
    }
  };

  // Reset to default
  const handleResetToDefault = async () => {
    if (confirm("Reset requirements back to template spec? This overrides current quantities and custom added requirements.")) {
      setSelectedFilterCategory('all');
      setEditingItemId(null);

      try {
        // Clear all current categories from Firestore first
        for (const cat of categories) {
          await deleteDoc(doc(db, 'event_requirements', cat.id));
        }
        // Write the defaults
        for (const cat of DEFAULT_REQUIREMENTS) {
          await setDoc(doc(db, 'event_requirements', cat.id), cat);
        }
      } catch (err) {
        console.error("Failed to reset requirements back to default, Firestore error:", err);
      }
    }
  };

  // Consolidation calculation helper
  // Groups identical items (by case-insensitive name) and maps their source categories with combined quantities
  const getConsolidatedRequirements = () => {
    const map = new Map<string, { name: string; quantity: number; categories: { name: string; qty: number; notes?: string }[] }>();

    categories.forEach(cat => {
      cat.items.forEach(item => {
        const normalizedKey = item.name.trim().toLowerCase();
        const existing = map.get(normalizedKey);

        if (existing) {
          existing.quantity += item.quantity;
          existing.categories.push({
            name: cat.name,
            qty: item.quantity,
            notes: item.notes
          });
        } else {
          map.set(normalizedKey, {
            name: item.name, // keep original case of first discovered
            quantity: item.quantity,
            categories: [
              { name: cat.name, qty: item.quantity, notes: item.notes }
            ]
          });
        }
      });
    });

    const list = Array.from(map.values());

    // Sort alphabetically (A-Z) by item name
    list.sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: 'base' }));

    // Search filter
    if (!consolidatedSearch.trim()) return list;
    const query = consolidatedSearch.toLowerCase().trim();
    return list.filter(item => 
      item.name.toLowerCase().includes(query) ||
      item.categories.some(c => c.name.toLowerCase().includes(query) || (c.notes && c.notes.toLowerCase().includes(query)))
    );
  };

  const consolidatedList = getConsolidatedRequirements();

  // Highlight specific cards depending on filter selection
  const filteredCategories = selectedFilterCategory === 'all' 
    ? categories
    : categories.filter(c => c.id === selectedFilterCategory);

  return (
    <div className="space-y-8 animate-fade-in" id="event-requirements-root">
      
      {/* HEADER SECTION CONTROLS & ADD CATEGORY FORM */}
      <div className="bg-[#0C0C0C] border border-white/10 rounded-3xl p-6 flex flex-col lg:flex-row items-stretch justify-between gap-6" id="requirements-hdr">
        <div className="space-y-2 max-w-xl">
          <div className="flex items-center gap-2">
            <ClipboardList className="text-[#FF6B00]" size={16} />
            <h3 className="text-sm font-bold font-display text-white uppercase tracking-tight">Requirement Inventory Board</h3>
          </div>
          <p className="text-[11px] text-zinc-400 leading-relaxed font-mono">
            Setup quantities, modify items, and monitor consolidated logistics lists across all active operations. Dynamic live coordination with automatic master checklist calculations active below.
          </p>
          
          {/* Quick Category Filtering Tabs */}
          <div className="pt-2 flex flex-wrap gap-1.5">
            <button
              onClick={() => setSelectedFilterCategory('all')}
              className={`px-3 py-1 rounded-xl text-[9px] font-mono uppercase font-bold transition cursor-pointer border ${
                selectedFilterCategory === 'all'
                  ? 'bg-[#FF6B00]/15 border-[#FF6B00]/30 text-[#FF6B00]'
                  : 'bg-white/5 border-transparent text-white/50 hover:bg-white/10 hover:text-white'
              }`}
            >
              All Columns ({categories.length})
            </button>
            {categories.map(cat => (
              <button
                key={cat.id}
                onClick={() => setSelectedFilterCategory(cat.id)}
                className={`px-3 py-1 rounded-xl text-[9px] font-mono uppercase font-bold transition cursor-pointer border ${
                  selectedFilterCategory === cat.id
                    ? 'bg-[#FF6B00]/15 border-[#FF6B00]/30 text-[#FF6B00]'
                    : 'bg-white/5 border-transparent text-white/50 hover:bg-white/10 hover:text-white'
                }`}
              >
                {cat.name} ({cat.items.length})
              </button>
            ))}
          </div>
        </div>

        {/* Add custom category form block */}
        <div className="border-t lg:border-t-0 lg:border-l border-white/10 pt-4 lg:pt-0 lg:pl-6 flex flex-col justify-center gap-3">
          <form onSubmit={handleAddCategory} className="space-y-2">
            <label className="text-[9px] font-mono uppercase text-white/40 block font-bold">Add Custom Requirement Category</label>
            <div className="flex gap-2">
              <input 
                type="text" 
                value={categoryInput}
                onChange={(e) => setCategoryInput(e.target.value)}
                placeholder="e.g. Catering, Audio Setup..."
                className="bg-black/90 border border-white/10 rounded-xl px-3 py-1.5 text-xs text-white placeholder-white/30 focus:outline-none focus:border-[#FF6B00]/30 w-full lg:w-56"
              />
              <button
                type="submit"
                className="bg-[#FF6B00] hover:brightness-110 text-black font-extrabold px-3 py-1.5 rounded-xl text-xs flex items-center gap-1 transition shrink-0 cursor-pointer"
              >
                <FolderPlus size={14} /> Add Cat
              </button>
            </div>
          </form>
          <div className="flex justify-between items-center text-[9px] font-mono text-zinc-500">
            <span>Template base synced</span>
            <button 
              onClick={handleResetToDefault}
              className="text-[#FF6B00]/70 hover:text-[#FF6B00] transition cursor-pointer font-bold uppercase underline"
            >
              Revert Template Spec
            </button>
          </div>
        </div>
      </div>

      {/* REQUIREMENTS CATEGORIES WORKPLACE - RENDERED AS RE-ENGINEERED SLATE CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" id="categories-grid">
        {filteredCategories.map((category) => (
          <div 
            key={category.id} 
            className="bg-[#0C0C0C]/90 border border-white/10 rounded-3xl p-5 flex flex-col justify-between space-y-4 hover:border-white/15 transition-all duration-300"
            id={`cat-card-${category.id}`}
          >
            {/* Category header */}
            <div className="flex items-center justify-between border-b border-white/5 pb-2">
              <div>
                <span className="text-[8px] font-mono text-zinc-500 block uppercase">Requirements Pool</span>
                <h4 className="text-xs font-black text-white uppercase tracking-tight flex items-center gap-1.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#FF6B00]" />
                  {category.name}
                </h4>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-[9px] px-1.5 bg-white/5 rounded-md text-white/55 font-mono">
                  {category.items.length} Items
                </span>
                {category.isCustom && (
                  <button
                    onClick={() => handleDeleteCategory(category.id, category.name)}
                    className="p-1 rounded text-red-400 hover:bg-white/5 transition"
                    title="Remove custom category"
                  >
                    <Trash2 size={12} />
                  </button>
                )}
              </div>
            </div>

            {/* List of items inside this category */}
            <div className="space-y-2 flex-1 max-h-[290px] overflow-y-auto pr-1">
              {category.items.length === 0 ? (
                <div className="text-center py-8 text-xs text-white/20 font-mono italic">
                  No registered items inside {category.name} yet. Use the pin tools below to expand.
                </div>
              ) : (
                category.items.map((item) => {
                  const isEditing = editingItemId === item.id;
                  return (
                    <div 
                      key={item.id} 
                      className={`p-2.5 rounded-xl border transition-all ${
                        isEditing 
                          ? 'bg-[#FF6B00]/5 border-[#FF6B00]/40 shadow-inner' 
                          : 'bg-white/[0.01] border-white/5 hover:border-white/10'
                      }`}
                    >
                      {isEditing ? (
                        /* Editing Panel View */
                        <div className="space-y-2 text-[10px]">
                          <div>
                            <label className="text-[8px] text-zinc-500 font-mono uppercase block mb-0.5">Item Name</label>
                            <input 
                              type="text"
                              value={editingItemName}
                              onChange={(e) => setEditingItemName(e.target.value)}
                              className="w-full bg-black border border-white/20 rounded px-2 py-0.5 text-white"
                              autoFocus
                            />
                          </div>
                          
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <label className="text-[8px] text-zinc-500 font-mono uppercase block mb-0.5">Quantity</label>
                              <input 
                                type="number"
                                min={1}
                                value={editingItemQty}
                                onChange={(e) => setEditingItemQty(parseInt(e.target.value) || 1)}
                                className="w-full bg-black border border-white/20 rounded px-2 py-0.5 text-white font-mono"
                              />
                            </div>
                            <div className="flex items-end justify-end space-x-1">
                              <button 
                                onClick={() => setEditingItemId(null)}
                                className="bg-white/5 hover:bg-white/10 text-white/60 p-1 rounded transition"
                                title="Cancel Edit"
                              >
                                <X size={12} />
                              </button>
                              <button 
                                onClick={() => saveItemEdits(category.id, item.id)}
                                className="bg-[#FF6B00] text-black hover:brightness-110 p-1 rounded font-extrabold transition"
                                title="Save Changes"
                              >
                                <Check size={12} />
                              </button>
                            </div>
                          </div>

                          <div>
                            <label className="text-[8px] text-zinc-500 font-mono uppercase block mb-0.5">Specifications Notes / Details</label>
                            <input 
                              type="text"
                              placeholder="Optional logistics notes..."
                              value={editingItemNotes}
                              onChange={(e) => setEditingItemNotes(e.target.value)}
                              className="w-full bg-black border border-white/20 rounded px-2 py-0.5 text-xs text-white"
                            />
                          </div>
                        </div>
                      ) : (
                        /* Default Display View with Interactive Actions */
                        <div className="flex flex-col gap-1 text-[11px]">
                          <div className="flex justify-between items-start gap-1">
                            <span 
                              className="font-bold text-white hover:text-[#FF6B00] transition cursor-pointer"
                              onClick={() => startEditing(item)}
                              title="Click to edit item name and specs"
                            >
                              {item.name}
                            </span>
                            
                            {/* Quantity Controls and Actions Block */}
                            <div className="flex items-center gap-1.5 shrink-0">
                              <button 
                                onClick={() => adjustItemQty(category.id, item.id, -1)}
                                className="w-4 h-4 bg-white/5 hover:bg-white/10 rounded border border-white/10 text-white flex items-center justify-center font-mono hover:text-[#FF6B00] transition cursor-pointer"
                                title="Reduce"
                              >
                                -
                              </button>
                              <span className="text-xs font-bold font-mono text-[#FF6B00] min-w-[20px] text-center inline-block bg-white/5 px-1.5 py-0.5 rounded border border-white/5">
                                {item.quantity}
                              </span>
                              <button 
                                onClick={() => adjustItemQty(category.id, item.id, 1)}
                                className="w-4 h-4 bg-white/5 hover:bg-white/10 rounded border border-white/10 text-white flex items-center justify-center font-mono hover:text-[#FF6B00] transition cursor-pointer"
                                title="Increase"
                              >
                                +
                              </button>

                              <span className="mx-1 h-3 w-[1px] bg-white/10" />

                              <button 
                                onClick={() => startEditing(item)}
                                className="p-1 hover:bg-white/5 rounded text-white/30 hover:text-white transition cursor-pointer"
                                title="Edit specs"
                              >
                                <Edit3 size={11} />
                              </button>

                              <button 
                                onClick={() => handleDeleteItem(category.id, item.id)}
                                className="p-1 hover:bg-white/5 rounded text-white/30 hover:text-red-400 transition cursor-pointer"
                                title="Remove item"
                              >
                                <Trash2 size={11} />
                              </button>
                            </div>
                          </div>

                          {item.notes && (
                            <p className="text-[9px] text-[#FF6B00]/70 italic leading-snug truncate">
                              📎 {item.notes}
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>

            {/* Quick adding input form embedded inside card footer for top efficiency */}
            <div className="pt-3 border-t border-white/5 space-y-2 mt-2">
              <span className="text-[7.5px] font-mono text-zinc-500 uppercase tracking-widest block font-extrabold">Instant Item Dispatcher</span>
              <div className="grid grid-cols-12 gap-1.5">
                <input 
                  type="text" 
                  value={newItemName[category.id] || ''}
                  onChange={(e) => setNewItemName(prev => ({ ...prev, [category.id]: e.target.value }))}
                  placeholder="e.g. Canopy, Lamp"
                  className="col-span-6 bg-black border border-white/5 rounded-lg px-2 py-1 text-[10px] text-white focus:outline-none focus:border-[#FF6B00]/40 placeholder-white/20"
                />
                <input 
                  type="number" 
                  min={1}
                  value={newItemQty[category.id] ?? 1}
                  onChange={(e) => setNewItemQty(prev => ({ ...prev, [category.id]: parseInt(e.target.value) || 1 }))}
                  placeholder="Qty"
                  className="col-span-3 bg-black border border-white/5 rounded-lg px-1.5 py-1 text-[10px] text-center text-[#FF6B00] font-mono focus:outline-none focus:border-[#FF6B00]/40 placeholder-white/20"
                />
                <button
                  onClick={() => handleAddItem(category.id)}
                  className="col-span-3 bg-[#FF6B00]/10 hover:bg-[#FF6B00] hover:text-black text-[#FF6B00] font-black py-1 rounded-lg text-[9px] transition uppercase cursor-pointer border border-[#FF6B00]/25 text-center flex items-center justify-center gap-0.5"
                >
                  <Plus size={10} /> Add
                </button>
              </div>
              <input 
                type="text" 
                value={newItemNotes[category.id] || ''}
                onChange={(e) => setNewItemNotes(prev => ({ ...prev, [category.id]: e.target.value }))}
                placeholder="Details notes (e.g. location, specifications)..."
                className="w-full bg-black border border-white/5 rounded-lg px-2 py-1 text-[9px] text-zinc-400 focus:outline-none placeholder-white/10"
              />
            </div>

          </div>
        ))}
      </div>

      {/* BOTTOM SECTION: CONSOLIDATED REQUIREMENTS REGISTER CHECKLIST */}
      <div className="bg-[#0C0C0C] border border-white/10 rounded-3xl p-6 relative overflow-hidden" id="final-requirements-section">
        
        {/* Glowing background vector line */}
        <div className="absolute right-0 top-0 h-40 w-40 bg-radial-gradient from-[#FF6B00]/5 to-transparent pointer-events-none" />

        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-white/10 pb-4 mb-4">
          <div className="space-y-1">
            <span className="text-[9px] font-mono text-[#FF6B00] uppercase tracking-widest font-black block">Bill of Deliveries Checklist</span>
            <h3 className="text-sm font-black font-display text-white uppercase tracking-tight flex items-center gap-2">
              <Sparkles size={14} className="text-[#FF6B00]" />
              Final Requirements Overview
            </h3>
            <p className="text-[10px] text-zinc-400 leading-normal">
              A complete consolidated list of all items from every category combined with their quantities and logistical specifications. Identical duplicate names across pools are summed up automatically.
            </p>
          </div>

          {/* Controls: search and quick download */}
          <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
            <div className="relative flex-1 md:flex-none">
              <Search className="absolute left-2.5 top-2 text-zinc-500" size={12} />
              <input 
                type="text" 
                value={consolidatedSearch}
                onChange={(e) => setConsolidatedSearch(e.target.value)}
                placeholder="Search master summary..."
                className="w-full md:w-48 pl-8 pr-3 py-1.5 bg-black/90 border border-white/10 rounded-xl text-[10px] text-white focus:outline-none focus:border-[#FF6B00]/30 font-mono"
              />
            </div>
            <button
              onClick={() => window.print()}
              className="bg-white/5 hover:bg-white/10 text-white border border-white/10 rounded-xl px-3 py-1.5 text-[10px] font-mono flex items-center gap-1.5 font-bold transition shrink-0 cursor-pointer"
            >
              <Printer size={12} className="text-[#FF6B00]" /> Print Blueprint Record
            </button>
          </div>
        </div>

        {/* Master Consolidated Data Grid Table */}
        <div className="overflow-x-auto rounded-xl border border-white/5">
          <table className="w-full text-left border-collapse text-[11px] font-mono">
            <thead>
              <tr className="bg-white/[0.02] border-b border-white/15 text-[8px] uppercase tracking-widest text-zinc-500 font-extrabold text-left font-mono">
                <th className="py-3 px-4">Requirement Item</th>
                <th className="py-3 px-4 text-center">Total Quantity</th>
                <th className="py-3 px-4">Allocated Pools & Volumes Breakdown</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 bg-black/20">
              {consolidatedList.length === 0 ? (
                <tr>
                  <td colSpan={3} className="text-center py-10 text-xs text-white/30 italic">
                    {categories.every(c => c.items.length === 0) 
                      ? 'No items currently in the requirement list. Add items inside any pool container to initialize.' 
                      : 'No matches found. Adjust search filter query above.'}
                  </td>
                </tr>
              ) : (
                consolidatedList.map((item, idx) => (
                  <tr key={idx} className="hover:bg-white/[0.01] transition-colors">
                    <td className="py-3 px-4 font-bold text-white uppercase flex items-center gap-1.5">
                      <div className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
                      {item.name}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className="inline-block px-2.5 py-0.5 bg-[#FF6B00]/10 border border-[#FF6B00]/25 rounded-md text-xs font-black text-[#FF6B00] tracking-tight">
                        {item.quantity}
                      </span>
                    </td>
                    <td className="py-3 px-4 max-w-xs">
                      <div className="flex flex-wrap gap-1">
                        {item.categories.map((c, cIdx) => (
                          <span 
                            key={cIdx} 
                            className="bg-white/5 px-1.5 py-0.5 rounded text-[9px] font-mono text-zinc-300 border border-white/5"
                          >
                            {c.name}: <strong className="text-white">{c.qty}</strong>
                          </span>
                        ))}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Master Log Statistics */}
        <div className="mt-4 pt-3 border-t border-white/5 flex flex-wrap items-center justify-between text-[9px] font-mono text-zinc-500 gap-2">
          <div className="flex items-center gap-3">
            <span>Total Categories: <strong className="text-white font-bold">{categories.length} Pools</strong></span>
            <span className="opacity-30">|</span>
            <span>Total Unique Item Labels: <strong className="text-white font-bold">{consolidatedList.length} Labels</strong></span>
            <span className="opacity-30">|</span>
            <span>Consolidated Total Stock: <strong className="text-[#FF6B00] font-black">{categories.reduce((acc, cat) => acc + cat.items.reduce((s, i) => s + i.quantity, 0), 0)} Units</strong></span>
          </div>
          <span>Active Session Code: <strong className="text-white font-bold">CHAKRA-360-BOM-2026</strong></span>
        </div>

      </div>

    </div>
  );
};
