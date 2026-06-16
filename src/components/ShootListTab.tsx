import React, { useState } from 'react';
import { Category, VideoItem, TaskStatus } from '../types';
import { 
  Plus, 
  Trash2, 
  Copy, 
  Edit3, 
  Check, 
  X, 
  FolderPlus, 
  Sparkles, 
  ChevronRight, 
  ChevronDown, 
  Play, 
  Loader2, 
  CheckCircle,
  HelpCircle
} from 'lucide-react';

interface ShootListTabProps {
  categories: Category[];
  setCategories: React.Dispatch<React.SetStateAction<Category[]>>;
}

export const ShootListTab: React.FC<ShootListTabProps> = ({
  categories,
  setCategories,
}) => {
  const [newCatName, setNewCatName] = useState('');
  const [isAddingCat, setIsAddingCat] = useState(false);
  const [collapsedCategories, setCollapsedCategories] = useState<Record<string, boolean>>({});

  // Inline inputs state for adding new video item
  const [addingToCatId, setAddingToCatId] = useState<string | null>(null);
  const [newVideoPerson, setNewVideoPerson] = useState('');
  const [newVideoName, setNewVideoName] = useState('');
  const [newVideoStatus, setNewVideoStatus] = useState<TaskStatus>('TO SHOOT');

  // Inline editing state
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [editPerson, setEditPerson] = useState('');
  const [editName, setEditName] = useState('');

  // Search filter
  const [searchQuery, setSearchQuery] = useState('');

  const toggleCollapse = (id: string) => {
    setCollapsedCategories(prev => ({ ...prev, [id]: !prev[id] }));
  };

  // 1. ADD NEW CATEGORY
  const handleAddCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName.trim()) return;

    const newCat: Category = {
      id: `cat_custom_${Date.now()}`,
      name: newCatName.trim().toUpperCase(),
      items: [],
      isCustom: true,
    };

    setCategories([...categories, newCat]);
    setNewCatName('');
    setIsAddingCat(false);
  };

  // 2. DELETE CATEGORY
  const handleDeleteCategory = (catId: string) => {
    if (confirm("Are you sure you want to delete this entire category and all its videos?")) {
      setCategories(categories.filter(c => c.id !== catId));
    }
  };

  // 3. ADD VIDEO TO CATEGORY
  const handleAddVideo = (catId: string) => {
    if (!newVideoPerson.trim() || !newVideoName.trim()) return;

    const newItem: VideoItem = {
      id: `vi_${Date.now()}`,
      person: newVideoPerson.trim(),
      name: newVideoName.trim(),
      status: newVideoStatus,
    };

    setCategories(prev => 
      prev.map(cat => {
        if (cat.id === catId) {
          return { ...cat, items: [...cat.items, newItem] };
        }
        return cat;
      })
    );

    // Reset inputs
    setNewVideoPerson('');
    setNewVideoName('');
    setNewVideoStatus('TO SHOOT');
    setAddingToCatId(null);
  };

  // 4. CHANGE STATUS OF VIDEO
  const handleStatusChange = (catId: string, itemId: string, nextStatus: TaskStatus) => {
    setCategories(prev =>
      prev.map(cat => {
        if (cat.id === catId) {
          return {
            ...cat,
            items: cat.items.map(item => 
              item.id === itemId ? { ...item, status: nextStatus } : item
            )
          };
        }
        return cat;
      })
    );
  };

  // 5. INITIATE EDIT VIDEO
  const handleStartEdit = (item: VideoItem) => {
    setEditingItemId(item.id);
    setEditPerson(item.person);
    setEditName(item.name);
  };

  // 6. SAVE EDIT VIDEO
  const handleSaveEdit = (catId: string, itemId: string) => {
    if (!editPerson.trim() || !editName.trim()) return;

    setCategories(prev =>
      prev.map(cat => {
        if (cat.id === catId) {
          return {
            ...cat,
            items: cat.items.map(item => 
              item.id === itemId ? { ...item, person: editPerson.trim(), name: editName.trim() } : item
            )
          };
        }
        return cat;
      })
    );
    setEditingItemId(null);
  };

  // 7. DUPLICATE VIDEO
  const handleDuplicateVideo = (catId: string, item: VideoItem) => {
    const duplicatedItem: VideoItem = {
      id: `vi_dup_${Date.now()}`,
      person: item.person,
      name: `${item.name} (Copy)`,
      status: item.status,
    };

    setCategories(prev =>
      prev.map(cat => {
        if (cat.id === catId) {
          const index = cat.items.findIndex(it => it.id === item.id);
          const updatedItems = [...cat.items];
          // Insert after original item
          updatedItems.splice(index + 1, 0, duplicatedItem);
          return { ...cat, items: updatedItems };
        }
        return cat;
      })
    );
  };

  // 8. DELETE VIDEO
  const handleDeleteVideo = (catId: string, itemId: string) => {
    setCategories(prev =>
      prev.map(cat => {
        if (cat.id === catId) {
          return {
            ...cat,
            items: cat.items.filter(it => it.id !== itemId)
          };
        }
        return cat;
      })
    );
  };

  return (
    <div className="space-y-6" id="shoot-list-page">
      {/* Category controls / Search Bar */}
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between bg-zinc-950/40 p-4 border border-zinc-800/40 rounded-xl" id="controls-panel">
        <div className="w-full sm:w-80">
          <input
            type="text"
            placeholder="Search by Artist / Video Title..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#111] hover:bg-[#151515] focus:bg-[#151515] border border-zinc-800 focus:border-[#FF6B00] rounded-lg px-4 py-2 text-sm text-zinc-300 outline-none transition-all placeholder:text-zinc-600"
            id="search-input"
          />
        </div>

        <div className="flex gap-3 w-full sm:w-auto justify-end">
          {isAddingCat ? (
            <form onSubmit={handleAddCategory} className="flex gap-2 w-full sm:w-auto" id="add-cat-form">
              <input
                type="text"
                placeholder="Category Name..."
                value={newCatName}
                onChange={(e) => setNewCatName(e.target.value)}
                autoFocus
                className="bg-[#111] border border-[#FF6B00] text-white rounded-lg px-3 py-1.5 text-xs font-mono tracking-wider outline-none"
                id="new-cat-name"
              />
              <button 
                type="submit"
                className="bg-[#FF6B00] hover:bg-orange-600 text-black font-semibold rounded-lg px-3 py-1.5 text-xs flex items-center gap-1 transition"
              >
                <Check size={14} /> Save
              </button>
              <button 
                type="button"
                onClick={() => setIsAddingCat(false)}
                className="bg-zinc-800 hover:bg-zinc-700 text-zinc-400 rounded-lg px-2.5 py-1.5 text-xs"
              >
                <X size={14} />
              </button>
            </form>
          ) : (
            <button
              onClick={() => setIsAddingCat(true)}
              className="bg-zinc-900 border border-[#FF6B00]/30 hover:border-[#FF6B00] hover:bg-[#FF6B00]/5 text-white rounded-lg px-4 py-2 text-xs font-mono tracking-wider flex items-center gap-2 transition duration-300 w-full sm:w-auto justify-center cursor-pointer"
              id="add-category-btn"
            >
              <FolderPlus size={15} className="text-[#FF6B00]" />
              ADD NEW CATEGORY
            </button>
          )}
        </div>
      </div>

      {/* Render Categories */}
      <div className="space-y-6" id="categories-container">
        {categories.map((cat) => {
          // Filter items based on search query
          const filteredItems = cat.items.filter(
            item => 
              item.person.toLowerCase().includes(searchQuery.toLowerCase()) ||
              item.name.toLowerCase().includes(searchQuery.toLowerCase())
          );

          // Category progress calculations
          const totalTasks = cat.items.length;
          const toShootCount = cat.items.filter(i => i.status === 'TO SHOOT').length;
          const editPendingCount = cat.items.filter(i => i.status === 'EDIT PENDING').length;
          const doneCount = cat.items.filter(i => i.status === 'DONE').length;
          const completionPercentage = totalTasks > 0 ? Math.round((doneCount / totalTasks) * 100) : 0;

          // If searching and this category has no matches, hide it
          if (searchQuery && filteredItems.length === 0) return null;

          const isCollapsed = collapsedCategories[cat.id];

          return (
            <div 
              key={cat.id} 
              className="bg-[#0C0C0C]/80 border border-white/10 rounded-3xl overflow-hidden transition-all duration-300 relative hover:border-[#FF6B00]/40 shadow-xl backdrop-blur-md"
              id={`cat-card-${cat.id}`}
            >
              {/* Category Header */}
              <div 
                className="p-4 md:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white/5 border-b border-light border-white/5 cursor-pointer select-none"
                onClick={() => toggleCollapse(cat.id)}
              >
                <div className="flex items-center gap-3">
                  <div className="text-white/40 hover:text-[#FF6B00] transition">
                    {isCollapsed ? <ChevronRight size={18} /> : <ChevronDown size={18} />}
                  </div>
                  <div>
                    <h3 className="font-display font-bold text-sm md:text-base tracking-wider text-white flex items-center gap-2">
                      {cat.name}
                      {cat.isCustom && (
                        <span className="text-[9px] bg-[#FF6B00]/10 border border-[#FF6B00]/30 text-[#FF6B00] px-1.5 py-0.5 rounded font-mono">
                          CUSTOM
                        </span>
                      )}
                    </h3>
                    <p className="text-[10px] text-white/40 font-mono mt-0.5">
                      {totalTasks} Total Video Targets
                    </p>
                  </div>
                </div>

                {/* Status Badges on header */}
                <div className="flex flex-wrap items-center gap-3" onClick={(e) => e.stopPropagation()}>
                  <div className="flex items-center gap-2 font-mono text-[10px] bg-white/5 px-3 py-1.5 rounded-xl border border-white/5">
                    <span className="flex h-1.5 w-1.5 rounded-full bg-[#FF6B00] shadow-[0_0_6px_#FF6B00]" />
                    <span className="text-white/40">TO SHOOT: </span>
                    <span className="font-bold text-[#FF6B00]">{toShootCount}</span>

                    <span className="mx-1 text-white/10">|</span>

                    <span className="flex h-1.5 w-1.5 rounded-full bg-amber-400 shadow-[0_0_6px_#fbbf24]" />
                    <span className="text-white/40">EDIT: </span>
                    <span className="font-bold text-amber-400">{editPendingCount}</span>

                    <span className="mx-1 text-white/10">|</span>

                    <span className="flex h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-[0_0_6px_#34d399]" />
                    <span className="text-white/40">DONE: </span>
                    <span className="font-bold text-emerald-400">{doneCount}</span>
                  </div>

                  {/* Progress bar on header */}
                  <div className="flex items-center gap-2 bg-white/5 px-3 py-1.5 rounded-xl border border-white/5">
                    <span className="text-[10px] font-bold font-mono text-[#FF6B00] min-w-8 text-right">
                      {completionPercentage}%
                    </span>
                    <div className="w-16 bg-white/10 rounded-full h-1">
                      <div 
                        className="bg-[#FF6B00] h-1 rounded-full shadow-[0_0_6px_#FF6B00]" 
                        style={{ width: `${completionPercentage}%` }} 
                      />
                    </div>
                  </div>

                  {/* Custom category delete */}
                  {cat.isCustom && (
                    <button
                      onClick={() => handleDeleteCategory(cat.id)}
                      className="p-1 px-2 rounded bg-red-950/20 hover:bg-red-950/40 border border-red-500/20 hover:border-red-500/50 text-red-400 text-xs flex items-center gap-1 transition"
                      title="Delete category"
                    >
                      <Trash2 size={13} />
                    </button>
                  )}
                </div>
              </div>

              {/* Items List (only if not collapsed) */}
              {!isCollapsed && (
                <div className="p-4 md:p-6 space-y-3 bg-zinc-950/25">
                  {filteredItems.length === 0 ? (
                    <div className="py-6 text-center text-zinc-650 text-xs font-mono text-zinc-600 bg-zinc-900/10 rounded-lg border border-zinc-900/40 max-w-md mx-auto">
                      No videos listed under this category.
                    </div>
                  ) : (
                    <div className="divide-y divide-zinc-900/60" id={`cat-itemlist-${cat.id}`}>
                      {filteredItems.map((item) => {
                        const isEditing = editingItemId === item.id;
                        return (
                          <div 
                            key={item.id} 
                            className="py-3 flex flex-all flex-col sm:flex-row items-start sm:items-center justify-between gap-4 group transition duration-200 hover:bg-zinc-900/10 px-2 rounded-lg"
                            id={`item-${item.id}`}
                          >
                            {/* Left Side: Detail & Inline Edit */}
                            <div className="flex-1 min-w-0">
                              {isEditing ? (
                                <div className="flex flex-wrap gap-2 w-full max-w-xl">
                                  <input
                                    type="text"
                                    value={editPerson}
                                    onChange={(e) => setEditPerson(e.target.value)}
                                    placeholder="Artist/Person Name"
                                    className="bg-zinc-900 border border-zinc-800 text-white text-xs font-semibold px-3 py-1 rounded focus:border-[#FF6B00] outline-none"
                                  />
                                  <input
                                    type="text"
                                    value={editName}
                                    onChange={(e) => setEditName(e.target.value)}
                                    placeholder="Video Title"
                                    className="bg-zinc-900 border border-zinc-800 text-white text-xs px-3 py-1 rounded focus:border-[#FF6B00] outline-none flex-1 min-w-[150px]"
                                  />
                                  <button
                                    onClick={() => handleSaveEdit(cat.id, item.id)}
                                    className="bg-emerald-500 text-black p-1 px-2.5 rounded font-bold text-xs flex items-center gap-1 hover:bg-emerald-600"
                                  >
                                    <Check size={12} /> Save
                                  </button>
                                  <button
                                    onClick={() => setEditingItemId(null)}
                                    className="bg-zinc-800 text-zinc-400 p-1 px-2 rounded text-xs hover:bg-zinc-700"
                                  >
                                    <X size={12} />
                                  </button>
                                </div>
                              ) : (
                                <div>
                                  <div className="flex items-center gap-2">
                                    <span className="text-white text-sm font-semibold tracking-wide block">
                                      {item.person}
                                    </span>
                                    <span className="text-zinc-600 font-mono text-[10px] bg-zinc-900 px-1.5 py-0.5 rounded border border-zinc-850">
                                      {item.id.includes('dup') ? 'COPY' : 'STAGED'}
                                    </span>
                                  </div>
                                  <span className="text-xs text-zinc-450 text-zinc-400 mt-1 block font-medium">
                                    {item.name}
                                  </span>
                                </div>
                              )}
                            </div>

                            {/* Right Side: Status Select & Actions */}
                            {!isEditing && (
                              <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end border-t border-zinc-900 pt-3 sm:pt-0 sm:border-0">
                                {/* Status Changer dropdown */}
                                <div className="relative">
                                  <select
                                    value={item.status}
                                    onChange={(e) => handleStatusChange(cat.id, item.id, e.target.value as TaskStatus)}
                                    className={`text-xs font-mono font-bold tracking-wider rounded-lg px-3 py-1.5 outline-none border cursor-pointer appearance-none pr-8 relative transition ${statusSelectColor(item.status)}`}
                                  >
                                    <option value="TO SHOOT">TO SHOOT</option>
                                    <option value="EDIT PENDING">EDIT PENDING</option>
                                    <option value="DONE">DONE</option>
                                  </select>
                                  <span className="absolute right-3 top-2.5 pointer-events-none text-zinc-500">
                                    <ChevronDown size={12} />
                                  </span>
                                </div>

                                {/* Operations: Edit, Duplicate, Delete */}
                                <div className="flex items-center gap-1.5 opacity-80 sm:opacity-0 group-hover:opacity-100 transition-opacity">
                                  <button
                                    onClick={() => handleStartEdit(item)}
                                    className="p-1.5 rounded bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-400 hover:text-white transition"
                                    title="Edit details"
                                  >
                                    <Edit3 size={12} />
                                  </button>
                                  <button
                                    onClick={() => handleDuplicateVideo(cat.id, item)}
                                    className="p-1.5 rounded bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-400 hover:text-[#FF6B00] transition"
                                    title="Duplicate clip"
                                  >
                                    <Copy size={12} />
                                  </button>
                                  <button
                                    onClick={() => handleDeleteVideo(cat.id, item.id)}
                                    className="p-1.5 rounded bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-400 hover:text-red-400 transition"
                                    title="Delete clip"
                                  >
                                    <Trash2 size={12} />
                                  </button>
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Inline Form to Add Video to Category */}
                  <div className="mt-4 pt-3 border-t border-zinc-900/60">
                    {addingToCatId === cat.id ? (
                      <div className="bg-[#0e0e0e]/50 border border-zinc-850 p-4 rounded-xl space-y-3 max-w-xl" id={`add-video-panel-${cat.id}`}>
                        <h4 className="text-xs uppercase font-mono text-zinc-500 flex items-center gap-1.5">
                          <Sparkles size={11} className="text-[#FF6B00]" /> ADDING NEW VIDEO ENTRY
                        </h4>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="text-[10px] uppercase font-mono text-zinc-500 block mb-1">Artist / Lead Person</label>
                            <input
                              type="text"
                              placeholder="e.g. Athula Adikari"
                              value={newVideoPerson}
                              onChange={(e) => setNewVideoPerson(e.target.value)}
                              className="w-full bg-zinc-950 border border-zinc-800 focus:border-[#FF6B00] rounded px-2.5 py-1.5 text-xs text-white outline-none"
                            />
                          </div>
                          <div>
                            <label className="text-[10px] uppercase font-mono text-zinc-500 block mb-1">Video Name / Description</label>
                            <input
                              type="text"
                              placeholder="e.g. Promotional Clip 02"
                              value={newVideoName}
                              onChange={(e) => setNewVideoName(e.target.value)}
                              className="w-full bg-zinc-950 border border-zinc-800 focus:border-[#FF6B00] rounded px-2.5 py-1.5 text-xs text-white outline-none"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="text-[10px] uppercase font-mono text-zinc-500 block mb-1">Target Status</label>
                          <div className="flex items-center gap-2">
                            {(['TO SHOOT', 'EDIT PENDING', 'DONE'] as TaskStatus[]).map((st) => (
                              <button
                                key={st}
                                type="button"
                                onClick={() => setNewVideoStatus(st)}
                                className={`px-3 py-1 rounded text-[10px] font-mono font-bold border transition ${
                                  newVideoStatus === st 
                                    ? statusCheckedClass(st)
                                    : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:text-white'
                                }`}
                              >
                                {st}
                              </button>
                            ))}
                          </div>
                        </div>

                        <div className="flex gap-2 justify-end pt-2">
                          <button
                            type="button"
                            onClick={() => setAddingToCatId(null)}
                            className="bg-zinc-900 border border-zinc-800 hover:bg-zinc-850 text-zinc-400 rounded-lg px-3 py-1.5 text-xs font-semibold transition"
                          >
                            Cancel
                          </button>
                          <button
                            type="button"
                            onClick={() => handleAddVideo(cat.id)}
                            className="bg-[#FF6B00] hover:bg-orange-600 text-black rounded-lg px-4 py-1.5 text-xs font-semibold flex items-center gap-1 transition"
                          >
                            <Plus size={13} /> Add Video entry
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button
                        onClick={() => {
                          setAddingToCatId(cat.id);
                          setNewVideoPerson('');
                          setNewVideoName('');
                          setNewVideoStatus('TO SHOOT');
                        }}
                        className="text-zinc-500 hover:text-[#FF6B00] text-xs font-mono py-1.5 px-3 rounded-lg hover:bg-zinc-900/30 border border-dashed border-zinc-900 hover:border-zinc-800/80 transition flex items-center gap-1.5 cursor-pointer"
                        id={`btn-open-addvideo-${cat.id}`}
                      >
                        <Plus size={14} /> Add new video entry
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

function statusSelectColor(status: TaskStatus): string {
  switch (status) {
    case 'TO SHOOT':
      return 'bg-[#FF6B00]/10 border-[#FF6B00]/40 text-[#FF6B00] hover:bg-[#FF6B00]/20';
    case 'EDIT PENDING':
      return 'bg-amber-400/10 border-amber-400/30 text-amber-300 hover:bg-amber-400/20';
    case 'DONE':
      return 'bg-emerald-400/10 border-emerald-400/30 text-emerald-300 hover:bg-emerald-400/20';
    default:
      return 'bg-zinc-900 border-zinc-800 text-zinc-400';
  }
}

function statusCheckedClass(status: TaskStatus): string {
  switch (status) {
    case 'TO SHOOT':
      return 'bg-[#FF6B00] text-black border-[#FF6B05]';
    case 'EDIT PENDING':
      return 'bg-amber-400 text-black border-amber-450';
    case 'DONE':
      return 'bg-emerald-400 text-black border-emerald-450';
  }
}
