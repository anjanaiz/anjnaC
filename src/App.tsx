import { useState, useEffect } from 'react';
import { INITIAL_CATEGORIES, INITIAL_TIMELINE } from './data';
import { Category, TimelineDay } from './types';
import { StatsOverview } from './components/StatsOverview';
import { ShootListTab } from './components/ShootListTab';
import { TimelineTab } from './components/TimelineTab';
import { EventMapTab } from './components/EventMapTab';
import { EventRequirementsTab } from './components/EventRequirementsTab';
import { 
  Film, 
  Calendar, 
  Sliders, 
  Info, 
  Sparkles, 
  HardCap, 
  Flame,
  Volume2,
  Menu,
  X,
  LogIn,
  LogOut,
  RefreshCw,
  Clock,
  CheckCircle,
  Database,
  Users,
  Compass,
  ClipboardList,
  ListTodo,
  GitBranch,
  Github,
  XCircle,
  History,
  Download,
  Upload
} from 'lucide-react';
import { collection, doc, setDoc, deleteDoc, onSnapshot, getDocs } from 'firebase/firestore';
import { db, auth, loginWithGoogle, logoutUser, handleFirestoreError, OperationType, checkDbOnline } from './firebase';
import { TaskPlannerTab } from './components/TaskPlannerTab';
import { chakraLogoBase64 as chakraLogo } from './assets/images/logoBase64';

export default function App() {
  const [activeTab, setActiveTab] = useState<'shoot' | 'timeline' | 'map' | 'requirements' | 'tasks'>('shoot');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  // Real-time Sync & Authentication States
  const [user, setUser] = useState<any>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [syncStatus, setSyncStatus] = useState<'offline' | 'loading' | 'synced' | 'error'>('offline');

  // Database Connection States
  const [isDbConnected, setIsDbConnected] = useState<boolean | null>(null); // null = checking, true = connected, false = offline
  const [dbError, setDbError] = useState<string | null>(null);
  const [isDbChecking, setIsDbChecking] = useState<boolean>(false);

  const checkDbOnlineStatus = async () => {
    setIsDbChecking(true);
    const online = await checkDbOnline();
    setIsDbConnected(online);
    if (online) {
      setDbError(null);
    } else {
      setDbError("Unable to establish an online connection to the Firestore database. To prevent entering data that may be lost, additions and edits are locked until connected.");
    }
    setIsDbChecking(false);
  };

  useEffect(() => {
    checkDbOnlineStatus();
    const interval = setInterval(checkDbOnlineStatus, 20000); // Check every 20 seconds
    return () => clearInterval(interval);
  }, []);

  // Export all application data as backup JSON
  const handleExportAllData = () => {
    try {
      const dataToBackup = {
        markers: JSON.parse(localStorage.getItem('chakra_event_layout_markers_v4') || '[]'),
        customCategories: JSON.parse(localStorage.getItem('chakra_event_custom_categories_v4') || '[]'),
        categories: JSON.parse(localStorage.getItem('chakra_cats') || '[]'),
        timeline: JSON.parse(localStorage.getItem('chakra_timeline') || '[]'),
        eventRequirements: JSON.parse(localStorage.getItem('chakra_event_requirements') || '[]'),
        generalTasks: JSON.parse(localStorage.getItem('chakra_general_tasks') || '[]')
      };

      const jsonString = JSON.stringify(dataToBackup, null, 2);
      const blob = new Blob([jsonString], { type: 'application/json' });
      const href = URL.createObjectURL(blob);
      const downloadAnchor = document.createElement('a');
      downloadAnchor.href = href;
      downloadAnchor.download = "chakra360_data_backup.json";
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      document.body.removeChild(downloadAnchor);
      URL.revokeObjectURL(href);
    } catch (err: any) {
      console.error("Failed to export backup data", err);
      alert("Error exporting local storage data: " + err.message);
    }
  };

  // Import application data back into LocalStorage and reload
  const handleImportAllData = (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileReader = new FileReader();
    const files = e.target.files;
    if (!files || files.length === 0) return;

    fileReader.onload = (event) => {
      try {
        const parsedData = JSON.parse(event.target?.result as string);
        if (!parsedData || typeof parsedData !== 'object') {
          throw new Error("Invalid backup file format: data is not a valid JSON object");
        }

        // Restore keys
        if (parsedData.markers) {
          localStorage.setItem('chakra_event_layout_markers_v4', JSON.stringify(parsedData.markers));
        }
        if (parsedData.customCategories) {
          localStorage.setItem('chakra_event_custom_categories_v4', JSON.stringify(parsedData.customCategories));
        }
        if (parsedData.categories) {
          localStorage.setItem('chakra_cats', JSON.stringify(parsedData.categories));
        }
        if (parsedData.timeline) {
          localStorage.setItem('chakra_timeline', JSON.stringify(parsedData.timeline));
        }
        if (parsedData.eventRequirements) {
          localStorage.setItem('chakra_event_requirements', JSON.stringify(parsedData.eventRequirements));
        }
        if (parsedData.generalTasks) {
          localStorage.setItem('chakra_general_tasks', JSON.stringify(parsedData.generalTasks));
        }

        alert("Data successfully imported! The application will now reload to apply all event configurations.");
        window.location.reload();
      } catch (err: any) {
        console.error("Failed to import data", err);
        alert("Import failed: " + err.message + ". Please ensure you uploaded a valid backup JSON file (e.g., chakra360_data_backup.json).");
      }
    };
    fileReader.readAsText(files[0]);
  };

  // Read current date from metadata config / prompt
  const CURRENT_DATE_STRING = 'JUNE 13'; // Today is June 13, 2026

  // 1. Initialize State with LocalStorage supporting persistence (or blank arrays if empty, no auto-seeding mock data)
  const [categories, setCategories] = useState<Category[]>(() => {
    const saved = localStorage.getItem('chakra_cats');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Failed to parse categories state', e);
      }
    }
    return [];
  });

  const [timeline, setTimeline] = useState<TimelineDay[]>(() => {
    const saved = localStorage.getItem('chakra_timeline');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Failed to parse timeline state', e);
      }
    }
    return [];
  });

  // Track auth state
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (currentUser) => {
      setUser(currentUser);
      setAuthLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // 2. Synchronize to LocalStorage upon changes (FALLBACK)
  useEffect(() => {
    localStorage.setItem('chakra_cats', JSON.stringify(categories));
  }, [categories]);

  useEffect(() => {
    localStorage.setItem('chakra_timeline', JSON.stringify(timeline));
  }, [timeline]);

  // 3. Realtime listening to database updates
  useEffect(() => {
    setSyncStatus('loading');

    // Live Subscribe: Categories
    const unsubscribeCats = onSnapshot(collection(db, 'categories'), (snapshot) => {
      const list: Category[] = [];
      snapshot.forEach(doc => {
        list.push(doc.data() as Category);
      });
      list.sort((a, b) => {
        const idxA = INITIAL_CATEGORIES.findIndex(c => c.id === a.id);
        const idxB = INITIAL_CATEGORIES.findIndex(c => c.id === b.id);
        if (idxA === -1 && idxB === -1) return a.id.localeCompare(b.id);
        if (idxA === -1) return 1;
        if (idxB === -1) return -1;
        return idxA - idxB;
      });
      setCategories(list);
      setSyncStatus('synced');
    }, (err) => {
      console.error("Firestore categories snapshot error", err);
      setSyncStatus('error');
    });

    // Live Subscribe: Timeline Days
    const unsubscribeTimeline = onSnapshot(collection(db, 'timeline'), (snapshot) => {
      const list: TimelineDay[] = [];
      snapshot.forEach(doc => {
        list.push(doc.data() as TimelineDay);
      });
      list.sort((a, b) => {
        const idxA = INITIAL_TIMELINE.findIndex(d => d.date === a.date);
        const idxB = INITIAL_TIMELINE.findIndex(d => d.date === b.date);
        return idxA - idxB;
      });
      setTimeline(list);
      setSyncStatus('synced');
    }, (err) => {
      console.error("Firestore timeline snapshot error", err);
      setSyncStatus('error');
    });

    return () => {
      unsubscribeCats();
      unsubscribeTimeline();
    };
  }, []);

  // 4. Overwrite setCategories with cloud synchronization wrapper
  const handleSetCategories = async (newCats: Category[] | ((prev: Category[]) => Category[])) => {
    let resolvedCats: Category[];
    if (typeof newCats === 'function') {
      resolvedCats = (newCats as Function)(categories);
    } else {
      resolvedCats = newCats;
    }
    
    // Always update React state immediately for zero-delay UI response
    setCategories(resolvedCats);

    try {
      setSyncStatus('loading');
      // Save each modified category
      for (const cat of resolvedCats) {
        await setDoc(doc(db, 'categories', cat.id), cat);
      }
      // Prune deleted categories
      const currentIds = new Set(resolvedCats.map(c => c.id));
      for (const cat of categories) {
        if (!currentIds.has(cat.id)) {
          await deleteDoc(doc(db, 'categories', cat.id));
        }
      }
      setSyncStatus('synced');
    } catch (err) {
      console.error("Firestore categories write field error:", err);
      setSyncStatus('error');
    }
  };

  // 5. Overwrite setTimeline with cloud synchronization wrapper
  const handleSetTimeline = async (newTimeline: TimelineDay[] | ((prev: TimelineDay[]) => TimelineDay[])) => {
    let resolvedTimeline: TimelineDay[];
    if (typeof newTimeline === 'function') {
      resolvedTimeline = (newTimeline as Function)(timeline);
    } else {
      resolvedTimeline = newTimeline;
    }

    // Always update React state immediately for zero-delay UI response
    setTimeline(resolvedTimeline);

    try {
      setSyncStatus('loading');
      // Save each modified timeline day
      for (const day of resolvedTimeline) {
        const dayId = 'day_' + day.date.replace(/\s+/g, '_').toLowerCase();
        await setDoc(doc(db, 'timeline', dayId), day);
      }
      // Prune deleted days
      const currentDates = new Set(resolvedTimeline.map(d => d.date));
      for (const day of timeline) {
        if (!currentDates.has(day.date)) {
          const dayId = 'day_' + day.date.replace(/\s+/g, '_').toLowerCase();
          await deleteDoc(doc(db, 'timeline', dayId));
        }
      }
      setSyncStatus('synced');
    } catch (err) {
      console.error("Firestore timeline write field error:", err);
      setSyncStatus('error');
    }
  };

  // Master Purge function to clean all data and databases completely
  const handlePurgeAllData = async () => {
    if (!confirm("Are you absolutely sure you want to completely PURGE and delete ALL data from the live Firestore database and LocalStorage? This will wipe out all categories, timeline days, operational tasks, map markers, and requirements for a completely fresh start. This action is permanent!")) {
      return;
    }

    setSyncStatus('loading');
    try {
      // Clear React states
      setCategories([]);
      setTimeline([]);

      // Clear LocalStorage
      localStorage.removeItem('chakra_cats');
      localStorage.removeItem('chakra_timeline');
      localStorage.removeItem('chakra_event_layout_markers_v4');
      localStorage.removeItem('chakra_event_custom_categories_v4');
      localStorage.removeItem('chakra_event_requirements');
      localStorage.removeItem('chakra_general_tasks');

      // Delete doc records in Firestore of all collections
      const collectionsToPurge = ['categories', 'timeline', 'general_tasks', 'map_markers', 'map_categories', 'event_requirements'];
      for (const colName of collectionsToPurge) {
        const snap = await getDocs(collection(db, colName));
        for (const docItem of snap.docs) {
          await deleteDoc(doc(db, colName, docItem.id));
        }
      }

      setSyncStatus('synced');
      alert("All live database collections and local cache keys have been successfully purged! The system is now 100% clean and ready.");
      window.location.reload();
    } catch (err: any) {
      console.error("Purge fail:", err);
      alert("Error purging database: " + err.message);
    }
  };

  // Handle Google Login triggers securely
  const handleAuthAction = async () => {
    try {
      if (user) {
        if (confirm("Sign out of current master production session?")) {
          await logoutUser();
        }
      } else {
        await loginWithGoogle();
      }
    } catch (e) {
      alert("Authentication action failed. See console logs for details.");
    }
  };


  return (
    <div className="h-screen bg-[#0A0A0A] text-zinc-100 flex flex-col md:flex-row overflow-hidden font-sans" id="application-root">
      
      {/* BACKGROUND DECORATIVE GLOW ACCENTS */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[#FF6B00]/[0.02] rounded-full blur-[150px] pointer-events-none z-0" />
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-[#FF6B00]/[0.01] rounded-full blur-[150px] pointer-events-none z-0" />

      {/* DESKTOP SIDEBAR (Bento Style Left Rail) */}
      <aside className="hidden md:flex w-68 bg-[#0C0C0C] border-r border-white/5 flex-col p-6 justify-between h-full shrink-0 z-20 relative backdrop-blur-md" id="desktop-sidebar">
        {/* Sidebar Header / Logo */}
        <div className="space-y-8 flex-1 flex flex-col">
          <div className="flex items-center gap-3.5">
            <img 
              src={chakraLogo} 
              onError={(e) => {
                e.currentTarget.onerror = null;
                e.currentTarget.src = '/chakra_logo.png';
              }}
              alt="Chakra 360 Logo" 
              className="h-11 w-11 object-contain select-none shrink-0 filter drop-shadow-[0_0_12px_rgba(255,107,0,0.5)]" 
              referrerPolicy="no-referrer"
            />
            <div>
              <h1 className="font-display font-extrabold text-[#FF6B00] tracking-wider text-base leading-none">
                CHAKRA 360
              </h1>
              <span className="text-[9px] tracking-[0.25em] font-mono text-white/40 block mt-1 uppercase">
                LIVE IN CONCERT
              </span>
            </div>
          </div>

          <div className="border-t border-white/5 my-1" />

          {/* Database Connection Status Card / Indicator */}
          <div className="px-2 mb-4">
            {isDbConnected === false ? (
              <div className="bg-red-500/10 border border-red-500/20 p-3.5 rounded-xl space-y-1.5 text-red-400 font-mono text-[10px]">
                <div className="flex items-center gap-1.5 font-bold uppercase text-[9px] tracking-wider text-red-500">
                  <X className="text-red-500 select-none" size={12} />
                  Operational Warning: DB Offline
                </div>
                <p className="leading-relaxed text-zinc-400 text-[9.5px]">
                  Unable to connect to live Firestore server <b>ai-studio-98bb09c5...</b>. Editing is locked.
                </p>
                <button 
                  onClick={checkDbOnlineStatus}
                  className="w-full mt-1.5 py-1 bg-red-500/20 hover:bg-red-500/35 text-red-300 font-bold tracking-wider rounded text-[9px] uppercase transition cursor-pointer"
                >
                  Retry Connection
                </button>
              </div>
            ) : isDbConnected === true ? (
              <div className="bg-emerald-500/10 border border-emerald-500/15 p-3 rounded-xl flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                  </span>
                  <div>
                    <span className="block text-[8px] uppercase tracking-wider text-emerald-400 font-bold font-mono">FIRESTORE ACTIVE</span>
                    <span className="block text-[10px] text-zinc-300 font-medium font-mono">ai-studio-98bb09c5-...</span>
                  </div>
                </div>
                <span className="text-[7.5px] uppercase tracking-wider text-emerald-500 px-1 bg-emerald-500/10 rounded font-mono font-bold">Live</span>
              </div>
            ) : (
              <div className="bg-zinc-500/10 border border-zinc-500/10 p-3 rounded-xl flex items-center justify-between">
                <div className="flex items-center gap-2.5 animate-pulse">
                  <RefreshCw size={11} className="animate-spin text-zinc-400" />
                  <div>
                    <span className="block text-[8px] uppercase tracking-wider text-zinc-400 font-bold font-mono">VERIFYING DB...</span>
                    <span className="block text-[10px] text-zinc-400 font-mono">Checking connection...</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Navigation Link Items */}
          <div className="space-y-2 flex-1" id="sidebar-nav">
            <div className="text-[10px] uppercase tracking-wider text-white/30 font-semibold px-2 mb-3">
              Dashboard Controls
            </div>
            
            <button
              onClick={() => setActiveTab('shoot')}
              className={`w-full flex items-center justify-between p-2.5 px-3.5 rounded-xl transition-all duration-300 font-display text-xs font-semibold cursor-pointer text-left ${
                activeTab === 'shoot'
                  ? 'text-[#FF6B00] bg-[#FF6B00]/10 border border-[#FF6B00]/25'
                  : 'text-white/50 hover:text-white hover:bg-white/5 border border-transparent'
              }`}
            >
              <div className="flex items-center gap-3">
                <Film size={14} className={activeTab === 'shoot' ? 'text-[#FF6B00]' : 'text-white/40'} />
                <span>SHOOT LIST & STATUS</span>
              </div>
              <div className={`w-1.5 h-1.5 rounded-full ${
                activeTab === 'shoot' 
                  ? 'bg-[#FF6B00] shadow-[0_0_8px_#FF6B00]' 
                  : 'bg-white/20'
              }`} />
            </button>

            <button
              onClick={() => setActiveTab('timeline')}
              className={`w-full flex items-center justify-between p-2.5 px-3.5 rounded-xl transition-all duration-300 font-display text-xs font-semibold cursor-pointer text-left ${
                activeTab === 'timeline'
                  ? 'text-[#FF6B00] bg-[#FF6B00]/10 border border-[#FF6B00]/25'
                  : 'text-white/50 hover:text-white hover:bg-white/5 border border-transparent'
              }`}
            >
              <div className="flex items-center gap-3">
                <Calendar size={14} className={activeTab === 'timeline' ? 'text-[#FF6B00]' : 'text-white/40'} />
                <span>PRODUCTION TIMELINE</span>
              </div>
              <div className={`w-1.5 h-1.5 rounded-full ${
                activeTab === 'timeline' 
                  ? 'bg-[#FF6B00] shadow-[0_0_8px_#FF6B00]' 
                  : 'bg-white/20'
              }`} />
            </button>

            <button
              onClick={() => setActiveTab('map')}
              className={`w-full flex items-center justify-between p-2.5 px-3.5 rounded-xl transition-all duration-300 font-display text-xs font-semibold cursor-pointer text-left ${
                activeTab === 'map'
                  ? 'text-[#FF6B00] bg-[#FF6B00]/10 border border-[#FF6B00]/25'
                  : 'text-white/50 hover:text-white hover:bg-white/5 border border-transparent'
              }`}
            >
              <div className="flex items-center gap-3">
                <Compass size={14} className={activeTab === 'map' ? 'text-[#FF6B00]' : 'text-white/40'} />
                <span>EVENT MAP</span>
              </div>
              <div className={`w-1.5 h-1.5 rounded-full ${
                activeTab === 'map' 
                  ? 'bg-[#FF6B00] shadow-[0_0_8px_#FF6B00]' 
                  : 'bg-white/20'
              }`} />
            </button>

            <button
              onClick={() => setActiveTab('requirements')}
              className={`w-full flex items-center justify-between p-2.5 px-3.5 rounded-xl transition-all duration-300 font-display text-xs font-semibold cursor-pointer text-left ${
                activeTab === 'requirements'
                  ? 'text-[#FF6B00] bg-[#FF6B00]/10 border border-[#FF6B00]/25'
                  : 'text-white/50 hover:text-white hover:bg-white/5 border border-transparent'
              }`}
            >
              <div className="flex items-center gap-3">
                <ClipboardList size={14} className={activeTab === 'requirements' ? 'text-[#FF6B00]' : 'text-white/40'} />
                <span>EVENT REQUIREMENTS</span>
              </div>
              <div className={`w-1.5 h-1.5 rounded-full ${
                activeTab === 'requirements' 
                  ? 'bg-[#FF6B00] shadow-[0_0_8px_#FF6B00]' 
                  : 'bg-white/20'
              }`} />
            </button>

            <button
              onClick={() => setActiveTab('tasks')}
              className={`w-full flex items-center justify-between p-2.5 px-3.5 rounded-xl transition-all duration-300 font-display text-xs font-semibold cursor-pointer text-left ${
                activeTab === 'tasks'
                  ? 'text-[#FF6B00] bg-[#FF6B00]/10 border border-[#FF6B00]/25'
                  : 'text-white/50 hover:text-white hover:bg-white/5 border border-transparent'
              }`}
            >
              <div className="flex items-center gap-3">
                <ListTodo size={14} className={activeTab === 'tasks' ? 'text-[#FF6B00]' : 'text-white/40'} />
                <span>TASK PLANNER</span>
              </div>
              <div className={`w-1.5 h-1.5 rounded-full ${
                activeTab === 'tasks' 
                  ? 'bg-[#FF6B00] shadow-[0_0_8px_#FF6B00]' 
                  : 'bg-white/20'
              }`} />
            </button>

            {/* Storage Backup Kit */}
            <div className="pt-4 border-t border-white/5 mt-4">
              <div className="bg-white/5 p-4 rounded-xl border border-white/10 space-y-3" id="vercel-migration-section">
                <div className="flex items-center justify-between">
                  <span className="text-[9px] uppercase text-white/40 font-mono tracking-wider font-semibold flex items-center gap-1.5">
                    <Download size={10} className="text-[#FF6B00]" /> Storage Backup Kit
                  </span>
                  <span className="text-[7.5px] font-mono text-zinc-400 bg-white/5 px-1 py-0.5 rounded">
                    JSON File
                  </span>
                </div>
                
                <p className="text-[9px] text-white/40 leading-relaxed font-mono">
                  Export your compiled event configs, timelines, tasks and layout maps to a backup file, or load them back instantly.
                </p>

                <div className="grid grid-cols-2 gap-2 pt-1">
                  <button
                    onClick={handleExportAllData}
                    className="flex items-center justify-center gap-1 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-[9px] font-mono text-white/80 transition cursor-pointer font-medium uppercase tracking-wider"
                    id="export-dashboard-btn"
                    title="Download backup file"
                  >
                    <Download size={10} className="text-[#FF6B00]" />
                    Export
                  </button>

                  <div className="relative">
                    <input
                      type="file"
                      accept=".json"
                      onChange={handleImportAllData}
                      className="hidden"
                      id="import-backup-file-input"
                    />
                    <button
                      onClick={() => document.getElementById('import-backup-file-input')?.click()}
                      className="w-full flex items-center justify-center gap-1 py-1.5 bg-[#FF6B00]/10 hover:bg-[#FF6B00]/25 border border-[#FF6B00]/25 rounded-lg text-[9px] font-mono text-[#FF6B00] font-bold transition cursor-pointer uppercase tracking-wider"
                      id="import-dashboard-btn"
                      title="Load backup file"
                    >
                      <Upload size={10} />
                      Import
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar Footer Area containing visual Project Status */}
        <div className="space-y-4 pt-4 border-t border-white/5">
          {/* Dynamic Progress Card */}
          {(() => {
            const allItemsCount = categories.flatMap(cat => cat.items).length;
            const doneItemsCount = categories.flatMap(cat => cat.items).filter(i => i.status === 'DONE').length;
            const percentage = allItemsCount > 0 ? Math.round((doneItemsCount / allItemsCount) * 100) : 0;
            return (
              <div className="bg-white/5 p-4 rounded-2xl border border-white/10" id="sidebar-progress-widget">
                <div className="text-[10px] uppercase font-mono text-white/40 mb-2">Project Status</div>
                <div className="flex justify-between items-end mb-1">
                  <span className="text-2xl font-black font-display text-white">{percentage}%</span>
                  <span className="text-[10px] font-mono text-[#FF6B00]">{doneItemsCount}/{allItemsCount} Done</span>
                </div>
                <div className="w-full h-1 bg-white/10 rounded-full overflow-hidden">
                  <div 
                    className="bg-[#FF6B00] h-full rounded-full shadow-[0_0_8px_#FF6B00] transition-all duration-500" 
                    style={{ width: `${percentage}%` }}
                  />
                </div>
              </div>
            );
          })()}

          {/* Reset controller action */}
          <button 
            onClick={handlePurgeAllData}
            className="w-full py-2.5 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 rounded-xl text-center text-[10px] font-mono text-red-400 hover:text-red-300 transition cursor-pointer uppercase tracking-wider font-bold"
          >
            Factory Reset (Clean DB)
          </button>
        </div>
      </aside>

      {/* MOBILE STICKY STAGED NAV HEADER */}
      <header className="md:hidden sticky top-0 z-50 bg-[#0C0C0C]/95 border-b border-white/5 backdrop-blur-md flex items-center justify-between p-4 px-6" id="global-header">
        <div className="flex items-center gap-2.5">
          <img 
            src={chakraLogo} 
            onError={(e) => {
              e.currentTarget.onerror = null;
              e.currentTarget.src = '/chakra_logo.png';
            }}
            alt="Chakra 360 Logo" 
            className="h-9 w-9 object-contain select-none shrink-0 filter drop-shadow-[0_0_10px_rgba(255,107,0,0.4)]" 
            referrerPolicy="no-referrer"
          />
          <div>
            <span className="font-display font-extrabold text-[#FF6B00] tracking-wider text-xs">
              CHAKRA 360
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              if (activeTab === 'shoot') setActiveTab('timeline');
              else if (activeTab === 'timeline') setActiveTab('map');
              else if (activeTab === 'map') setActiveTab('requirements');
              else if (activeTab === 'requirements') setActiveTab('tasks');
              else setActiveTab('shoot');
            }}
            className="px-3 py-1.5 rounded-lg border border-[#FF6B00]/20 bg-[#FF6B00]/10 text-[#FF6B00] text-[10px] font-mono font-bold uppercase transition"
          >
            {activeTab === 'shoot' 
              ? 'To Timeline >' 
              : activeTab === 'timeline' 
                ? 'To EVENT MAP >' 
                : activeTab === 'map' 
                  ? 'To Requirements >' 
                  : activeTab === 'requirements'
                    ? 'To Tasks >'
                    : 'To Shoots >'}
          </button>

          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-1.5 rounded bg-white/5 text-white/80"
          >
            {mobileMenuOpen ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>

        {/* MOBILE DRAWER */}
        {mobileMenuOpen && (
          <div className="absolute top-full left-0 right-0 bg-[#0C0C0C] border-b border-white/10 p-5 space-y-4 shadow-xl z-50">
            <div className="text-[10px] uppercase font-mono text-white/30">Switch Workspace Views</div>
            <div className="grid grid-cols-2 gap-1.5">
              <button
                onClick={() => {
                  setActiveTab('shoot');
                  setMobileMenuOpen(false);
                }}
                className={`p-2.5 rounded-lg text-center font-mono text-[10px] font-bold leading-none ${
                  activeTab === 'shoot' ? 'bg-[#FF6B00] text-black font-black' : 'bg-white/5 text-white/70'
                }`}
              >
                P01: SHOOT LIST & STATUS
              </button>
              <button
                onClick={() => {
                  setActiveTab('timeline');
                  setMobileMenuOpen(false);
                }}
                className={`p-2.5 rounded-lg text-center font-mono text-[10px] font-bold leading-none ${
                  activeTab === 'timeline' ? 'bg-[#FF6B00] text-black font-black' : 'bg-white/5 text-white/70'
                }`}
              >
                P02: PRODUCTION TIMELINE
              </button>
              <button
                onClick={() => {
                  setActiveTab('map');
                  setMobileMenuOpen(false);
                }}
                className={`p-2.5 rounded-lg text-center font-mono text-[10px] font-bold leading-none ${
                  activeTab === 'map' ? 'bg-[#FF6B00] text-black font-black' : 'bg-white/5 text-white/70'
                }`}
              >
                EVENT MAP
              </button>
              <button
                onClick={() => {
                  setActiveTab('requirements');
                  setMobileMenuOpen(false);
                }}
                className={`p-2.5 rounded-lg text-center font-mono text-[10px] font-bold leading-none ${
                  activeTab === 'requirements' ? 'bg-[#FF6B00] text-black font-black' : 'bg-white/5 text-white/70'
                }`}
              >
                EVENT REQUIREMENTS
              </button>
              <button
                onClick={() => {
                  setActiveTab('tasks');
                  setMobileMenuOpen(false);
                }}
                className={`p-2.5 rounded-lg text-center font-mono text-[10px] font-bold leading-none col-span-2 ${
                  activeTab === 'tasks' ? 'bg-[#FF6B00] text-black font-black' : 'bg-white/5 text-white/70'
                }`}
              >
                DAILY OPERATIONAL TASKS
              </button>
            </div>
            <div className="pt-3 border-t border-white/10 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono text-white/40">Real-time Connection:</span>
                <span className={`text-[9px] font-mono px-2 py-0.5 rounded font-bold uppercase ${
                  user ? 'bg-emerald-500/10 text-emerald-400' : 'bg-white/10 text-white/40'
                }`}>
                  {user ? 'Linked' : 'Local Only'}
                </span>
              </div>
              
              <button
                onClick={() => {
                  handleAuthAction();
                  setMobileMenuOpen(false);
                }}
                className={`w-full py-2.5 rounded-xl font-mono text-center text-[10px] font-bold uppercase tracking-wider ${
                  user 
                    ? 'bg-red-500/10 border border-red-500/20 text-red-400' 
                    : 'bg-[#FF6B00]/10 border border-[#FF6B00]/20 text-[#FF6B00]'
                }`}
              >
                {user ? 'Disconnect Session' : 'Google Auth Sync'}
              </button>
            </div>

            <div className="pt-2 flex justify-between items-center border-t border-white/5">
              <button
                onClick={() => {
                  handlePurgeAllData();
                  setMobileMenuOpen(false);
                }}
                className="text-[10px] font-mono text-red-400 py-1 font-bold uppercase"
              >
                FACTORY RESET (WIPE DB)
              </button>
              <span className="text-[10px] font-mono text-white/30 font-semibold uppercase">Venue: Air Force Grounds</span>
            </div>
          </div>
        )}
      </header>

      {/* MAIN RIGHT WORKSPACE: Scrollable Dashboard Content */}
      <main className="flex-1 bg-[#0A0A0A] flex flex-col h-full overflow-hidden relative z-10" id="main-scroller">
        
        {/* TOP STATUS BAR ACCENT */}
        <div className="px-4 md:px-8 pt-6 pb-2 border-b border-white/5 bg-[#0C0C0C]/50 flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
          <div>
            <div className="text-[10px] uppercase font-mono tracking-widest text-[#FF6B00] font-bold">
              Chakra Master Controller
            </div>
            <h2 className="text-lg font-bold font-display tracking-tight text-white mt-0.5">
              {activeTab === 'shoot' 
                ? 'SHOOT LIST & STATUS' 
                : activeTab === 'timeline' 
                  ? 'PRODUCTION TIMELINE SEQUENCE'
                  : activeTab === 'map'
                    ? 'EVENT MAP'
                    : activeTab === 'requirements'
                      ? 'EVENT REQUIREMENTS'
                      : 'GENERAL TASK PLANNER'}
            </h2>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-mono bg-white/5 border border-white/10 px-3.5 py-1.5 rounded-xl text-zinc-400">
              Concert Target: <span className="text-[#FF6B00] font-black">JUNE 28</span>
            </span>
          </div>
        </div>

        {/* INNER SCROLLABLE STAGE CONTAINER */}
        <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-6 max-w-7xl w-full mx-auto pb-24" id="stage-viewport">
          

          {/* DYNAMIC GRID METRICS (REACTIVE WIDGETS) */}
          {activeTab !== 'map' && activeTab !== 'requirements' && activeTab !== 'tasks' && (
            <StatsOverview 
              categories={categories} 
              timeline={timeline}
              currentDateStr={CURRENT_DATE_STRING}
            />
          )}

          {/* WORK AREA CHANGER */}
          <div className="bg-[#0C0C0C]/40 border border-white/5 p-1 rounded-2xl md:p-0 md:bg-transparent md:border-transparent relative overflow-hidden min-h-[300px]" id="active-tab-container">
            {activeTab === 'shoot' ? (
              <ShootListTab 
                categories={categories} 
                setCategories={handleSetCategories} 
              />
            ) : activeTab === 'timeline' ? (
              <TimelineTab 
                timeline={timeline} 
                setTimeline={handleSetTimeline} 
                currentDateStr={CURRENT_DATE_STRING}
              />
            ) : activeTab === 'map' ? (
              <EventMapTab />
            ) : activeTab === 'requirements' ? (
              <EventRequirementsTab />
            ) : (
              <TaskPlannerTab />
            )}

            {/* Locked Database Offline Overlay Banner */}
            {isDbConnected === false && (
              <div className="absolute inset-0 bg-black/85 backdrop-blur-md z-50 flex flex-col items-center justify-center p-6 text-center space-y-4">
                <div className="w-16 h-16 bg-red-500/10 border border-red-500/30 rounded-full flex items-center justify-center text-red-500 animate-pulse">
                  <XCircle size={32} />
                </div>
                <h3 className="font-display font-extrabold text-white text-lg tracking-wide uppercase">
                  Database Connection Locked
                </h3>
                <p className="text-zinc-400 text-xs max-w-sm leading-relaxed font-mono">
                  Your live connection to the Firestore production cluster is offline. New data insertions have been locked to prevent cache state conflicts and unexpected data loss.
                </p>
                <button 
                  onClick={checkDbOnlineStatus}
                  className="px-5 py-2.5 bg-[#FF6B00] hover:bg-[#FF852B] text-zinc-950 font-black font-mono text-xs uppercase rounded-xl transition shadow-[0_0_15px_rgba(255,107,0,0.3)] cursor-pointer"
                >
                  Retry Host Handshake
                </button>
              </div>
            )}
          </div>
        </div>

        {/* BOTTOM METADATA BAR FOOTER */}
        <footer className="mt-auto border-t border-white/5 bg-[#0C0C0C]/40 py-4 px-6 md:px-8 flex flex-col md:flex-row items-center justify-between gap-3 shrink-0 backdrop-blur-sm" id="global-footer">
          <span className="text-[10px] font-mono text-zinc-600">
            &copy; 2026 CHAKRA 360 LIVE IN CONCERT. FOH Master Board.
          </span>
          <div className="flex items-center gap-4 text-[10px] font-mono text-zinc-500">
            <span className="flex items-center gap-1.5">
              <Volume2 size={12} className="text-[#FF6B00]" /> Front of House Audio Staged
            </span>
            <span className="opacity-30">|</span>
            <span>Venue: Air Force Ground Colombo</span>
          </div>
        </footer>
      </main>

    </div>
  );
}
