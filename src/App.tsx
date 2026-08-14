import React, { useState, useEffect } from 'react';
import { INITIAL_CATEGORIES, CHAKRA_INITIAL_BUDGET } from './data';
import { KATHAWAK_INITIAL_CATEGORIES as KATHAWAK_CATEGORIES, KATHAWAK_INITIAL_BUDGET } from './kathawakData';
import { Category, Stall } from './types';
import { StatsOverview } from './components/StatsOverview';
import { ShootListTab } from './components/ShootListTab';
import { StallDetailsTab } from './components/StallDetailsTab';
import { EventMapTab } from './components/EventMapTab';
import { EventRequirementsTab } from './components/EventRequirementsTab';
import { TaskPlannerTab } from './components/TaskPlannerTab';
import { BudgetTrackerTab } from './components/BudgetTrackerTab';
import { SponsorManagementTab } from './components/SponsorManagementTab';
import { TicketsTab } from './components/TicketsTab';
import { EventsHubView, EVENTS_LIST } from './components/EventsHubView';
import { 
  Film, 
  Calendar, 
  Sparkles, 
  Volume2,
  Menu,
  X,
  RefreshCw,
  XCircle,
  Download,
  Upload,
  Store,
  ArrowLeft,
  DollarSign,
  Award,
  Compass,
  ClipboardList,
  ListTodo,
  Layers,
  MapPin,
  Ticket
} from 'lucide-react';
import { collection, doc, setDoc, deleteDoc, onSnapshot, getDocs } from 'firebase/firestore';
import { db, auth, loginWithGoogle, logoutUser, handleFirestoreError, OperationType, checkDbOnline } from './firebase';
import { chakraLogoBase64 as chakraLogo } from './assets/images/logoBase64';

export default function App() {
  const [selectedEventId, setSelectedEventId] = useState<'chakra360' | 'kathawak' | null>(null);
  const [activeTab, setActiveTab] = useState<'shoot' | 'stalls' | 'map' | 'requirements' | 'tasks' | 'budget' | 'sponsors' | 'tickets'>('shoot');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  // Real-time Sync & Authentication States
  const [user, setUser] = useState<any>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [syncStatus, setSyncStatus] = useState<'offline' | 'loading' | 'synced' | 'error'>('offline');

  // Database Connection States
  const [isDbConnected, setIsDbConnected] = useState<boolean | null>(null);
  const [dbError, setDbError] = useState<string | null>(null);
  const [isDbChecking, setIsDbChecking] = useState<boolean>(false);

  // Custom Event Logos State & Sync
  const [eventLogos, setEventLogos] = useState<{ [key: string]: string }>({});

  useEffect(() => {
    // Load local cache
    const initialLogos: Record<string, string> = {};
    const localChakra = localStorage.getItem('custom_event_logo_chakra360');
    const localKathawak = localStorage.getItem('custom_event_logo_kathawak');
    if (localChakra) initialLogos['chakra360'] = localChakra;
    if (localKathawak) initialLogos['kathawak'] = localKathawak;
    setEventLogos(initialLogos);

    // Sync real-time with Firestore settings collection
    const unsub = onSnapshot(doc(db, 'settings', 'event_logos'), (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data();
        setEventLogos(prev => {
          const updated = { ...prev };
          if (data.chakra360) {
            updated['chakra360'] = data.chakra360;
            localStorage.setItem('custom_event_logo_chakra360', data.chakra360);
          } else if (data.chakra360 === '') {
            delete updated['chakra360'];
            localStorage.removeItem('custom_event_logo_chakra360');
          }

          if (data.kathawak) {
            updated['kathawak'] = data.kathawak;
            localStorage.setItem('custom_event_logo_kathawak', data.kathawak);
          } else if (data.kathawak === '') {
            delete updated['kathawak'];
            localStorage.removeItem('custom_event_logo_kathawak');
          }
          return updated;
        });
      }
    }, (err) => {
      console.warn("Realtime logo sync notice:", err);
    });

    return () => unsub();
  }, []);

  const handleUploadLogo = (eventId: string, file: File) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (e) => {
      const result = e.target?.result as string;
      if (!result) return;

      const img = new Image();
      img.onload = async () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;
        const maxDim = 800;

        if (width > maxDim || height > maxDim) {
          if (width > height) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          } else {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const compressed = canvas.toDataURL('image/png', 0.92);
          
          localStorage.setItem(`custom_event_logo_${eventId}`, compressed);
          setEventLogos(prev => ({ ...prev, [eventId]: compressed }));

          try {
            await setDoc(doc(db, 'settings', 'event_logos'), {
              [eventId]: compressed
            }, { merge: true });
          } catch (err) {
            console.warn("Firestore logo save:", err);
          }
        }
      };
      img.src = result;
    };
    reader.readAsDataURL(file);
  };

  const handleResetLogo = async (eventId: string) => {
    localStorage.removeItem(`custom_event_logo_${eventId}`);
    setEventLogos(prev => {
      const next = { ...prev };
      delete next[eventId];
      return next;
    });

    try {
      await setDoc(doc(db, 'settings', 'event_logos'), {
        [eventId]: ''
      }, { merge: true });
    } catch (err) {
      console.warn("Firestore logo reset:", err);
    }
  };

  const rawActiveEvent = EVENTS_LIST.find(e => e.id === selectedEventId) || EVENTS_LIST[0];
  const activeEvent = {
    ...rawActiveEvent,
    logo: eventLogos[rawActiveEvent.id] || rawActiveEvent.logo
  };

  const checkDbOnlineStatus = async () => {
    setIsDbChecking(true);
    const online = await checkDbOnline();
    setIsDbConnected(online);
    if (online) {
      setDbError(null);
    } else {
      setDbError("Unable to establish an online connection to the Firestore database. Edits are locked until connected.");
    }
    setIsDbChecking(false);
  };

  useEffect(() => {
    checkDbOnlineStatus();
    const interval = setInterval(checkDbOnlineStatus, 20000);
    return () => clearInterval(interval);
  }, []);

  // Export all application data as backup JSON
  const handleExportAllData = () => {
    try {
      const dataToBackup = {
        markers: JSON.parse(localStorage.getItem('chakra_event_layout_markers_v4') || '[]'),
        customCategories: JSON.parse(localStorage.getItem('chakra_event_custom_categories_v4') || '[]'),
        categories: JSON.parse(localStorage.getItem('chakra_cats') || '[]'),
        stalls: JSON.parse(localStorage.getItem('chakra_stalls') || '[]'),
        eventRequirements: JSON.parse(localStorage.getItem('chakra_event_requirements') || '[]'),
        generalTasks: JSON.parse(localStorage.getItem('chakra_general_tasks') || '[]')
      };

      const jsonString = JSON.stringify(dataToBackup, null, 2);
      const blob = new Blob([jsonString], { type: 'application/json' });
      const href = URL.createObjectURL(blob);
      const downloadAnchor = document.createElement('a');
      downloadAnchor.href = href;
      downloadAnchor.download = `${selectedEventId || 'sas_event'}_data_backup.json`;
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

        if (parsedData.markers) localStorage.setItem('chakra_event_layout_markers_v4', JSON.stringify(parsedData.markers));
        if (parsedData.customCategories) localStorage.setItem('chakra_event_custom_categories_v4', JSON.stringify(parsedData.customCategories));
        if (parsedData.categories) localStorage.setItem('chakra_cats', JSON.stringify(parsedData.categories));
        if (parsedData.stalls) localStorage.setItem('chakra_stalls', JSON.stringify(parsedData.stalls));
        if (parsedData.eventRequirements) localStorage.setItem('chakra_event_requirements', JSON.stringify(parsedData.eventRequirements));
        if (parsedData.generalTasks) localStorage.setItem('chakra_general_tasks', JSON.stringify(parsedData.generalTasks));

        alert("Data successfully imported! The application will now reload to apply all event configurations.");
        window.location.reload();
      } catch (err: any) {
        console.error("Failed to import data", err);
        alert("Import failed: " + err.message);
      }
    };
    fileReader.readAsText(files[0]);
  };

  const CURRENT_DATE_STRING = selectedEventId === 'kathawak' ? 'NOVEMBER 2026' : 'JANUARY 09, 2027';

  // Dynamic collection and storage key names based on active event
  const categoriesCollection = selectedEventId === 'kathawak' ? 'kathawak_categories' : 'categories';
  const stallsCollection = selectedEventId === 'kathawak' ? 'stalls_kathawak' : 'stalls';
  const categoriesStorageKey = selectedEventId === 'kathawak' ? 'kathawak_cats' : 'chakra_cats';
  const stallsStorageKey = selectedEventId === 'kathawak' ? 'kathawak_stalls' : 'chakra_stalls';

  // Categories state
  const [categories, setCategories] = useState<Category[]>(() => {
    const saved = localStorage.getItem(categoriesStorageKey);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed && parsed.length > 0) return parsed;
      } catch (e) {
        console.error('Failed to parse categories state', e);
      }
    }
    return selectedEventId === 'kathawak' ? KATHAWAK_CATEGORIES : INITIAL_CATEGORIES;
  });

  // Stalls state
  const [stalls, setStalls] = useState<Stall[]>(() => {
    const saved = localStorage.getItem(stallsStorageKey);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Failed to parse stalls state', e);
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

  // Synchronize categories & stalls to LocalStorage
  useEffect(() => {
    localStorage.setItem(categoriesStorageKey, JSON.stringify(categories));
  }, [categories, categoriesStorageKey]);

  useEffect(() => {
    localStorage.setItem(stallsStorageKey, JSON.stringify(stalls));
  }, [stalls, stallsStorageKey]);

  // Realtime listening to database updates for active event categories and stalls
  useEffect(() => {
    setSyncStatus('loading');

    const unsubscribeCats = onSnapshot(collection(db, categoriesCollection), (snapshot) => {
      const list: Category[] = [];
      snapshot.forEach(doc => {
        list.push(doc.data() as Category);
      });
      const initialRef = selectedEventId === 'kathawak' ? KATHAWAK_CATEGORIES : INITIAL_CATEGORIES;
      list.sort((a, b) => {
        const idxA = initialRef.findIndex(c => c.id === a.id);
        const idxB = initialRef.findIndex(c => c.id === b.id);
        if (idxA === -1 && idxB === -1) return a.id.localeCompare(b.id);
        if (idxA === -1) return 1;
        if (idxB === -1) return -1;
        return idxA - idxB;
      });
      if (list.length > 0) {
        setCategories(list);
      } else {
        // Seed default if empty
        const defaultSet = selectedEventId === 'kathawak' ? KATHAWAK_CATEGORIES : INITIAL_CATEGORIES;
        setCategories(defaultSet);
        defaultSet.forEach(c => {
          setDoc(doc(db, categoriesCollection, c.id), c).catch(console.error);
        });
      }
      setSyncStatus('synced');
    }, (err) => {
      handleFirestoreError(err, OperationType.GET, categoriesCollection);
      setSyncStatus('error');
    });

    const unsubscribeStalls = onSnapshot(collection(db, stallsCollection), (snapshot) => {
      const list: Stall[] = [];
      snapshot.forEach(doc => {
        list.push(doc.data() as Stall);
      });
      list.sort((a, b) => a.name.localeCompare(b.name));
      setStalls(list);
      setSyncStatus('synced');
    }, (err) => {
      handleFirestoreError(err, OperationType.GET, stallsCollection);
      setSyncStatus('error');
    });

    return () => {
      unsubscribeCats();
      unsubscribeStalls();
    };
  }, [categoriesCollection, stallsCollection, selectedEventId]);

  // Categories write handler
  const handleSetCategories = async (newCats: Category[] | ((prev: Category[]) => Category[])) => {
    let resolvedCats: Category[];
    if (typeof newCats === 'function') {
      resolvedCats = (newCats as Function)(categories);
    } else {
      resolvedCats = newCats;
    }
    
    setCategories(resolvedCats);

    try {
      setSyncStatus('loading');
      for (const cat of resolvedCats) {
        await setDoc(doc(db, categoriesCollection, cat.id), cat);
      }
      const currentIds = new Set(resolvedCats.map(c => c.id));
      for (const cat of categories) {
        if (!currentIds.has(cat.id)) {
          await deleteDoc(doc(db, categoriesCollection, cat.id));
        }
      }
      setSyncStatus('synced');
    } catch (err) {
      console.error("Firestore categories write error:", err);
      setSyncStatus('error');
    }
  };

  // Master Purge function
  const handlePurgeAllData = async () => {
    if (!confirm("Are you sure you want to PURGE data for this event from Firestore and LocalStorage?")) return;

    setSyncStatus('loading');
    try {
      setCategories([]);
      setStalls([]);

      localStorage.removeItem(categoriesStorageKey);
      localStorage.removeItem(stallsStorageKey);

      const collectionsToPurge = [categoriesCollection, stallsCollection];
      for (const colName of collectionsToPurge) {
        const snap = await getDocs(collection(db, colName));
        for (const docItem of snap.docs) {
          await deleteDoc(doc(db, colName, docItem.id));
        }
      }

      setSyncStatus('synced');
      alert("Event data successfully cleared!");
      window.location.reload();
    } catch (err: any) {
      console.error("Purge fail:", err);
      alert("Error purging database: " + err.message);
    }
  };

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
      alert("Authentication action failed.");
    }
  };

  // IF NO EVENT IS SELECTED, SHOW MULTI-EVENT HUB
  if (!selectedEventId) {
    return (
      <div className="min-h-screen bg-[#070707] text-zinc-100 p-6 md:p-12 font-sans relative overflow-x-hidden">
        {/* GLOBAL SAS ENTERTAINMENT TOP BAR */}
        <div className="max-w-6xl mx-auto flex items-center justify-between pb-8 mb-8 border-b border-white/10">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-[#FF6B00]/10 border border-[#FF6B00]/30 rounded-2xl flex items-center justify-center text-[#FF6B00]">
              <Layers size={24} />
            </div>
            <div>
              <h1 className="font-display font-extrabold text-white text-xl md:text-2xl tracking-wider">
                SAS ENTERTAINMENT
              </h1>
              <span className="text-[10px] font-mono text-[#FF6B00] tracking-widest uppercase block font-bold">
                Event Production Dashboard System
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-xs font-mono text-zinc-400 hidden sm:inline-block">
              Multi-Concert Operations Hub
            </span>
          </div>
        </div>

        <EventsHubView 
          onSelectEvent={(id) => {
            setSelectedEventId(id);
            setActiveTab('shoot');
          }} 
          eventLogos={eventLogos}
        />
      </div>
    );
  }

  return (
    <div className="h-screen bg-[#0A0A0A] text-zinc-100 flex flex-col md:flex-row overflow-hidden font-sans" id="application-root">
      
      {/* BACKGROUND DECORATIVE GLOW ACCENTS */}
      <div 
        className="absolute top-0 right-0 w-[500px] h-[500px] rounded-full blur-[150px] pointer-events-none z-0 opacity-20"
        style={{ backgroundColor: activeEvent.accentColor }}
      />

      {/* DESKTOP SIDEBAR */}
      <aside className="hidden md:flex w-72 bg-[#0C0C0C] border-r border-white/5 flex-col p-6 justify-between h-full shrink-0 z-20 relative backdrop-blur-md" id="desktop-sidebar">
        <div className="space-y-6 flex-1 flex flex-col">
          
          {/* SWITCH EVENT BACK BUTTON */}
          <button
            onClick={() => setSelectedEventId(null)}
            className="flex items-center gap-2 text-xs font-mono text-zinc-400 hover:text-white bg-white/5 hover:bg-white/10 px-3 py-2 rounded-xl transition border border-white/5 cursor-pointer"
          >
            <ArrowLeft size={14} className="text-[#FF6B00]" />
            <span>Switch Event Dashboard</span>
          </button>

          {/* EVENT BRANDING HEADER */}
          <div className="flex items-center gap-3.5 pt-1">
            <div className="min-w-12 h-12 px-2 bg-black/60 border border-white/10 rounded-2xl p-1.5 flex items-center justify-center shrink-0 shadow-md">
              <img 
                src={activeEvent.logo} 
                onError={(e) => {
                  e.currentTarget.onerror = null;
                  if (activeEvent.id === 'chakra360') e.currentTarget.src = '/chakra_logo.png';
                  else e.currentTarget.src = '/kathawak_logo.png';
                }}
                alt={activeEvent.name} 
                className="max-h-full max-w-full object-contain filter drop-shadow-[0_0_8px_rgba(255,255,255,0.2)]" 
                referrerPolicy="no-referrer"
              />
            </div>

            <div>
              <h1 className="font-display font-extrabold text-white text-sm leading-tight tracking-tight">
                {activeEvent.name}
              </h1>
              <span 
                className="text-[9px] tracking-wider font-mono block uppercase font-bold mt-1"
                style={{ color: activeEvent.accentColor }}
              >
                SAS PRODUCTION
              </span>
            </div>
          </div>

          <div className="border-t border-white/5" />

          {/* DATABASE CONNECTION STATUS */}
          <div className="px-1">
            {isDbConnected === false ? (
              <div className="bg-red-500/10 border border-red-500/20 p-3 rounded-xl space-y-1 text-red-400 font-mono text-[10px]">
                <div className="flex items-center gap-1.5 font-bold uppercase text-[9px] tracking-wider text-red-500">
                  <X size={12} />
                  Operational Warning: DB Offline
                </div>
                <button 
                  onClick={checkDbOnlineStatus}
                  className="w-full mt-1 py-1 bg-red-500/20 hover:bg-red-500/35 text-red-300 font-bold tracking-wider rounded text-[9px] uppercase transition cursor-pointer"
                >
                  Retry Connection
                </button>
              </div>
            ) : isDbConnected === true ? (
              <div className="bg-emerald-500/10 border border-emerald-500/15 p-2.5 rounded-xl flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                  </span>
                  <div>
                    <span className="block text-[8px] uppercase tracking-wider text-emerald-400 font-bold font-mono">FIRESTORE ACTIVE</span>
                    <span className="block text-[9.5px] text-zinc-300 font-mono font-medium">{activeEvent.id} cluster</span>
                  </div>
                </div>
                <span className="text-[7.5px] uppercase tracking-wider text-emerald-500 px-1 bg-emerald-500/10 rounded font-mono font-bold">Live</span>
              </div>
            ) : (
              <div className="bg-zinc-500/10 border border-zinc-500/10 p-2.5 rounded-xl flex items-center gap-2 animate-pulse">
                <RefreshCw size={11} className="animate-spin text-zinc-400" />
                <span className="text-[9px] font-mono text-zinc-400">Verifying Connection...</span>
              </div>
            )}
          </div>

          {/* NAVIGATION LINKS */}
          <div className="space-y-1.5 flex-1 overflow-y-auto pr-1" id="sidebar-nav">
            <div className="text-[10px] uppercase tracking-wider text-white/30 font-semibold px-2 mb-2 font-mono">
              Event Modules
            </div>
            
            <button
              onClick={() => setActiveTab('shoot')}
              className={`w-full flex items-center justify-between p-2.5 px-3 rounded-xl transition-all duration-200 font-display text-xs font-bold cursor-pointer text-left ${
                activeTab === 'shoot'
                  ? 'text-white bg-white/10 border border-white/20 shadow-md'
                  : 'text-white/50 hover:text-white hover:bg-white/5 border border-transparent'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Film size={14} style={{ color: activeTab === 'shoot' ? activeEvent.accentColor : undefined }} />
                <span>SHOOT LIST / MEDIA</span>
              </div>
            </button>

            <button
              onClick={() => setActiveTab('tasks')}
              className={`w-full flex items-center justify-between p-2.5 px-3 rounded-xl transition-all duration-200 font-display text-xs font-bold cursor-pointer text-left ${
                activeTab === 'tasks'
                  ? 'text-white bg-white/10 border border-white/20 shadow-md'
                  : 'text-white/50 hover:text-white hover:bg-white/5 border border-transparent'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <ListTodo size={14} style={{ color: activeTab === 'tasks' ? activeEvent.accentColor : undefined }} />
                <span>TASK PLANNER</span>
              </div>
            </button>

            <button
              onClick={() => setActiveTab('budget')}
              className={`w-full flex items-center justify-between p-2.5 px-3 rounded-xl transition-all duration-200 font-display text-xs font-bold cursor-pointer text-left ${
                activeTab === 'budget'
                  ? 'text-white bg-white/10 border border-white/20 shadow-md'
                  : 'text-white/50 hover:text-white hover:bg-white/5 border border-transparent'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <DollarSign size={14} style={{ color: activeTab === 'budget' ? activeEvent.accentColor : undefined }} />
                <span>BUDGET TRACKER</span>
              </div>
            </button>

            <button
              onClick={() => setActiveTab('map')}
              className={`w-full flex items-center justify-between p-2.5 px-3 rounded-xl transition-all duration-200 font-display text-xs font-bold cursor-pointer text-left ${
                activeTab === 'map'
                  ? 'text-white bg-white/10 border border-white/20 shadow-md'
                  : 'text-white/50 hover:text-white hover:bg-white/5 border border-transparent'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Compass size={14} style={{ color: activeTab === 'map' ? activeEvent.accentColor : undefined }} />
                <span>EVENT MAP</span>
              </div>
            </button>

            <button
              onClick={() => setActiveTab('requirements')}
              className={`w-full flex items-center justify-between p-2.5 px-3 rounded-xl transition-all duration-200 font-display text-xs font-bold cursor-pointer text-left ${
                activeTab === 'requirements'
                  ? 'text-white bg-white/10 border border-white/20 shadow-md'
                  : 'text-white/50 hover:text-white hover:bg-white/5 border border-transparent'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <ClipboardList size={14} style={{ color: activeTab === 'requirements' ? activeEvent.accentColor : undefined }} />
                <span>EVENT REQUIREMENTS</span>
              </div>
            </button>

            <button
              onClick={() => setActiveTab('stalls')}
              className={`w-full flex items-center justify-between p-2.5 px-3 rounded-xl transition-all duration-200 font-display text-xs font-bold cursor-pointer text-left ${
                activeTab === 'stalls'
                  ? 'text-white bg-white/10 border border-white/20 shadow-md'
                  : 'text-white/50 hover:text-white hover:bg-white/5 border border-transparent'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Store size={14} style={{ color: activeTab === 'stalls' ? activeEvent.accentColor : undefined }} />
                <span>STALL DETAILS</span>
              </div>
            </button>

            <button
              onClick={() => setActiveTab('sponsors')}
              className={`w-full flex items-center justify-between p-2.5 px-3 rounded-xl transition-all duration-200 font-display text-xs font-bold cursor-pointer text-left ${
                activeTab === 'sponsors'
                  ? 'text-white bg-white/10 border border-white/20 shadow-md'
                  : 'text-white/50 hover:text-white hover:bg-white/5 border border-transparent'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Award size={14} style={{ color: activeTab === 'sponsors' ? activeEvent.accentColor : undefined }} />
                <span>SPONSOR MANAGEMENT</span>
              </div>
            </button>

            <button
              onClick={() => setActiveTab('tickets')}
              className={`w-full flex items-center justify-between p-2.5 px-3 rounded-xl transition-all duration-200 font-display text-xs font-bold cursor-pointer text-left ${
                activeTab === 'tickets'
                  ? 'text-white bg-white/10 border border-white/20 shadow-md'
                  : 'text-white/50 hover:text-white hover:bg-white/5 border border-transparent'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Ticket size={14} style={{ color: activeTab === 'tickets' ? activeEvent.accentColor : undefined }} />
                <span>TICKETS</span>
              </div>
            </button>

            {/* BACKUP DATA KIT */}
            <div className="pt-3 border-t border-white/5 mt-3 space-y-2">
              <div className="flex items-center justify-between text-[9px] font-mono text-zinc-400">
                <span className="flex items-center gap-1"><Download size={10} /> Data Backup Kit</span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={handleExportAllData}
                  className="py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-[9px] font-mono text-white/80 transition cursor-pointer font-bold uppercase"
                >
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
                    className="w-full py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-[9px] font-mono text-white/80 transition cursor-pointer font-bold uppercase"
                  >
                    Import
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* SIDEBAR FOOTER */}
        <div className="space-y-3 pt-3 border-t border-white/5">
          {(() => {
            const allItemsCount = categories.flatMap(cat => cat.items).length;
            const doneItemsCount = categories.flatMap(cat => cat.items).filter(i => i.status === 'DONE').length;
            const percentage = allItemsCount > 0 ? Math.round((doneItemsCount / allItemsCount) * 100) : 0;
            return (
              <div className="bg-white/5 p-3 rounded-2xl border border-white/10">
                <div className="text-[9px] uppercase font-mono text-zinc-400 mb-1">Shoot Completion</div>
                <div className="flex justify-between items-end mb-1">
                  <span className="text-xl font-extrabold font-display text-white">{percentage}%</span>
                  <span className="text-[9px] font-mono" style={{ color: activeEvent.accentColor }}>{doneItemsCount}/{allItemsCount} Done</span>
                </div>
                <div className="w-full h-1 bg-white/10 rounded-full overflow-hidden">
                  <div 
                    className="h-full rounded-full transition-all duration-500" 
                    style={{ width: `${percentage}%`, backgroundColor: activeEvent.accentColor }}
                  />
                </div>
              </div>
            );
          })()}

          <button 
            onClick={handlePurgeAllData}
            className="w-full py-2 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 rounded-xl text-center text-[9px] font-mono text-red-400 transition cursor-pointer uppercase tracking-wider font-bold"
          >
            Reset Event Data
          </button>
        </div>
      </aside>

      {/* MOBILE STICKY NAV HEADER */}
      <header className="md:hidden sticky top-0 z-50 bg-[#0C0C0C]/95 border-b border-white/5 backdrop-blur-md flex items-center justify-between p-4 px-6" id="global-header">
        <div className="flex items-center gap-2.5">
          <button onClick={() => setSelectedEventId(null)} className="p-1 rounded bg-white/10 text-white mr-1">
            <ArrowLeft size={14} />
          </button>
          <img 
            src={activeEvent.logo} 
            onError={(e) => {
              e.currentTarget.onerror = null;
              if (activeEvent.id === 'chakra360') e.currentTarget.src = '/chakra_logo.png';
              else e.currentTarget.src = '/kathawak_logo.png';
            }}
            alt={activeEvent.name} 
            className="h-8 w-8 object-contain shrink-0" 
            referrerPolicy="no-referrer"
          />
          <div>
            <span className="font-display font-extrabold text-white text-xs block">
              {activeEvent.name}
            </span>
          </div>
        </div>

        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="p-1.5 rounded bg-white/5 text-white/80"
        >
          {mobileMenuOpen ? <X size={18} /> : <Menu size={18} />}
        </button>

        {/* MOBILE DRAWER */}
        {mobileMenuOpen && (
          <div className="absolute top-full left-0 right-0 bg-[#0C0C0C] border-b border-white/10 p-5 space-y-3 shadow-xl z-50">
            <div className="text-[10px] uppercase font-mono text-white/30">Switch Views</div>
            <div className="grid grid-cols-2 gap-1.5 font-mono text-[10px]">
              <button onClick={() => { setActiveTab('shoot'); setMobileMenuOpen(false); }} className={`p-2 rounded ${activeTab === 'shoot' ? 'bg-[#FF6B00] text-black font-bold' : 'bg-white/5 text-white'}`}>SHOOT LIST</button>
              <button onClick={() => { setActiveTab('tasks'); setMobileMenuOpen(false); }} className={`p-2 rounded ${activeTab === 'tasks' ? 'bg-[#FF6B00] text-black font-bold' : 'bg-white/5 text-white'}`}>TASKS</button>
              <button onClick={() => { setActiveTab('budget'); setMobileMenuOpen(false); }} className={`p-2 rounded ${activeTab === 'budget' ? 'bg-[#FF6B00] text-black font-bold' : 'bg-white/5 text-white'}`}>BUDGET</button>
              <button onClick={() => { setActiveTab('map'); setMobileMenuOpen(false); }} className={`p-2 rounded ${activeTab === 'map' ? 'bg-[#FF6B00] text-black font-bold' : 'bg-white/5 text-white'}`}>EVENT MAP</button>
              <button onClick={() => { setActiveTab('requirements'); setMobileMenuOpen(false); }} className={`p-2 rounded ${activeTab === 'requirements' ? 'bg-[#FF6B00] text-black font-bold' : 'bg-white/5 text-white'}`}>REQUIREMENTS</button>
              <button onClick={() => { setActiveTab('stalls'); setMobileMenuOpen(false); }} className={`p-2 rounded ${activeTab === 'stalls' ? 'bg-[#FF6B00] text-black font-bold' : 'bg-white/5 text-white'}`}>STALLS</button>
              <button onClick={() => { setActiveTab('sponsors'); setMobileMenuOpen(false); }} className={`p-2 rounded ${activeTab === 'sponsors' ? 'bg-[#FF6B00] text-black font-bold' : 'bg-white/5 text-white'}`}>SPONSORS</button>
              <button onClick={() => { setActiveTab('tickets'); setMobileMenuOpen(false); }} className={`p-2 rounded col-span-2 ${activeTab === 'tickets' ? 'bg-[#FF6B00] text-black font-bold' : 'bg-white/5 text-white'}`}>TICKETS</button>
            </div>
            <div className="pt-2 border-t border-white/10">
              <button onClick={() => { setSelectedEventId(null); setMobileMenuOpen(false); }} className="w-full py-2 bg-white/10 rounded font-mono text-[10px] text-white">← Switch Event</button>
            </div>
          </div>
        )}
      </header>

      {/* MAIN RIGHT WORKSPACE */}
      <main className="flex-1 bg-[#0A0A0A] flex flex-col h-full overflow-hidden relative z-10" id="main-scroller">
        
        {/* TOP STATUS BAR */}
        <div className="px-4 md:px-8 pt-5 pb-3 border-b border-white/5 bg-[#0C0C0C]/50 flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
          <div>
            <div className="text-[10px] uppercase font-mono tracking-widest font-bold flex items-center gap-2" style={{ color: activeEvent.accentColor }}>
              <span>{activeEvent.name}</span>
              <span className="text-zinc-600">|</span>
              <span className="text-zinc-400">SAS Entertainment Production</span>
            </div>
            <h2 className="text-lg font-bold font-display tracking-tight text-white mt-0.5">
              {activeTab === 'shoot' && 'SHOOT LIST / MEDIA PLANNER'}
              {activeTab === 'tasks' && 'TASK PLANNER & TIMELINE'}
              {activeTab === 'budget' && 'BUDGET TRACKER'}
              {activeTab === 'map' && 'EVENT MAP EDITOR'}
              {activeTab === 'requirements' && 'EVENT REQUIREMENTS'}
              {activeTab === 'stalls' && 'STALL DETAILS MANAGEMENT'}
              {activeTab === 'sponsors' && 'SPONSOR MANAGEMENT'}
              {activeTab === 'tickets' && 'TICKETS & PRICING MANAGEMENT'}
            </h2>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-xs font-mono bg-white/5 border border-white/10 px-3.5 py-1.5 rounded-xl text-zinc-300 flex items-center gap-2">
              <Calendar size={13} style={{ color: activeEvent.accentColor }} />
              <span>Target Event: <strong className="text-white">{activeEvent.date}</strong></span>
            </span>

            <button
              onClick={() => setSelectedEventId(null)}
              className="text-xs font-mono bg-white/5 hover:bg-white/10 border border-white/10 px-3 py-1.5 rounded-xl text-zinc-300 transition flex items-center gap-1.5 cursor-pointer"
            >
              <ArrowLeft size={13} />
              <span className="hidden sm:inline">All Events</span>
            </button>
          </div>
        </div>

        {/* INNER SCROLLABLE STAGE CONTAINER */}
        <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-6 max-w-7xl w-full mx-auto pb-24" id="stage-viewport">
          
          {/* STATS OVERVIEW FOR SHOOT LIST */}
          {activeTab === 'shoot' && (
            <StatsOverview 
              categories={categories} 
              stalls={stalls}
              currentDateStr={CURRENT_DATE_STRING}
            />
          )}

          {/* ACTIVE TAB VIEW */}
          <div className="bg-[#0C0C0C]/40 border border-white/5 p-1 rounded-2xl md:p-0 md:bg-transparent md:border-transparent relative min-h-[300px]" id="active-tab-container">
            {activeTab === 'shoot' && (
              <ShootListTab 
                categories={categories} 
                setCategories={handleSetCategories} 
                eventId={selectedEventId}
              />
            )}
            {activeTab === 'tasks' && (
              <TaskPlannerTab eventId={selectedEventId} />
            )}
            {activeTab === 'budget' && (
              <BudgetTrackerTab 
                eventId={selectedEventId} 
                initialItems={selectedEventId === 'kathawak' ? KATHAWAK_INITIAL_BUDGET : CHAKRA_INITIAL_BUDGET}
              />
            )}
            {activeTab === 'map' && (
              <EventMapTab eventId={selectedEventId} />
            )}
            {activeTab === 'requirements' && (
              <EventRequirementsTab eventId={selectedEventId} />
            )}
            {activeTab === 'stalls' && (
              <StallDetailsTab eventId={selectedEventId} />
            )}
            {activeTab === 'sponsors' && (
              <SponsorManagementTab eventId={selectedEventId} />
            )}
            {activeTab === 'tickets' && (
              <TicketsTab eventId={selectedEventId} />
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
                  Your live connection to the Firestore production cluster is offline. New data insertions have been locked to prevent cache state conflicts.
                </p>
                <button 
                  onClick={checkDbOnlineStatus}
                  className="px-5 py-2.5 bg-[#FF6B00] hover:bg-[#FF852B] text-zinc-950 font-black font-mono text-xs uppercase rounded-xl transition shadow-[0_0_15px_rgba(255,107,0,0.3)] cursor-pointer"
                >
                  Retry Handshake
                </button>
              </div>
            )}
          </div>
        </div>

        {/* BOTTOM FOOTER */}
        <footer className="mt-auto border-t border-white/5 bg-[#0C0C0C]/40 py-3.5 px-6 md:px-8 flex flex-col md:flex-row items-center justify-between gap-3 shrink-0 backdrop-blur-sm" id="global-footer">
          <span className="text-[10px] font-mono text-zinc-500">
            &copy; 2026 SAS ENTERTAINMENT. {activeEvent.name} Production Hub.
          </span>
          <div className="flex items-center gap-4 text-[10px] font-mono text-zinc-500">
            <span className="flex items-center gap-1.5">
              <Volume2 size={12} style={{ color: activeEvent.accentColor }} /> Live Production Staged
            </span>
            <span className="opacity-30">|</span>
            <span>Venue: {activeEvent.venue}</span>
          </div>
        </footer>
      </main>

    </div>
  );
}
