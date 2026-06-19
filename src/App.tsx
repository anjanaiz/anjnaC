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
  History
} from 'lucide-react';
import { collection, doc, setDoc, deleteDoc, onSnapshot, getDocs } from 'firebase/firestore';
import { db, auth, loginWithGoogle, logoutUser, handleFirestoreError, OperationType } from './firebase';
import { TaskPlannerTab } from './components/TaskPlannerTab';
import chakraLogo from './assets/images/chakra_logo.png';

export default function App() {
  const [activeTab, setActiveTab] = useState<'shoot' | 'timeline' | 'map' | 'requirements' | 'tasks'>('shoot');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  // Real-time Sync & Authentication States
  const [user, setUser] = useState<any>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [syncStatus, setSyncStatus] = useState<'offline' | 'loading' | 'synced' | 'error'>('offline');

  // GitHub Repository Sync State
  const [githubRepo, setGithubRepo] = useState<{
    owner: string;
    repoName: string;
    branch: string;
    connected: boolean;
  } | null>(() => {
    const saved = localStorage.getItem('chakra_github_repo');
    if (saved === 'null') return null;
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed && typeof parsed === 'object') {
          // If the old repository 'anjnaC' is still stored, migrate/replace it with the new repository 'Chakra'
          if (parsed.repoName === 'anjnaC') {
            const migrated = {
              owner: 'anjanaiz',
              repoName: 'Chakra',
              branch: 'main',
              connected: true
            };
            localStorage.setItem('chakra_github_repo', JSON.stringify(migrated));
            return migrated;
          }
          return parsed;
        }
      } catch (e) {
        console.error('Failed to parse github repo config', e);
      }
    }
    // Default to the user's new configured repo as requested
    const defaultRepo = {
      owner: 'anjanaiz',
      repoName: 'Chakra',
      branch: 'main',
      connected: true
    };
    localStorage.setItem('chakra_github_repo', JSON.stringify(defaultRepo));
    return defaultRepo;
  });

  const [repoOwnerInput, setRepoOwnerInput] = useState('anjanaiz');
  const [repoNameInput, setRepoNameInput] = useState('Chakra');
  const [repoBranchInput, setRepoBranchInput] = useState('main');
  const [isConfiguringRepo, setIsConfiguringRepo] = useState(false);

  // High-fidelity GitHub sync tracker states
  const [gitLastSynced, setGitLastSynced] = useState<string | null>(() => {
    return localStorage.getItem('chakra_github_last_synced') || null;
  });
  const [gitCommits, setGitCommits] = useState<any[]>([]);
  const [gitIsSyncing, setGitIsSyncing] = useState(false);
  const [gitSyncError, setGitSyncError] = useState<string | null>(null);

  // Primary function for pushing all layout items to GitHub
  const syncLayoutToGitHub = async (customMessage?: string | null) => {
    // If not connected, we can't sync
    const savedRepoRaw = localStorage.getItem('chakra_github_repo');
    let activeRepo = githubRepo;
    if (!activeRepo && savedRepoRaw && savedRepoRaw !== 'null') {
      try { activeRepo = JSON.parse(savedRepoRaw); } catch (_) {}
    }
    
    if (!activeRepo || !activeRepo.connected) return;

    setGitIsSyncing(true);
    setGitSyncError(null);

    try {
      // Fetch currently added map elements from local storage
      const rawMarkers = localStorage.getItem('chakra_event_layout_markers_v4');
      const rawCategories = localStorage.getItem('chakra_event_custom_categories_v4');

      let markers = [];
      let customCategories = [];

      if (rawMarkers) {
        try { markers = JSON.parse(rawMarkers); } catch (_) {}
      }
      if (rawCategories) {
        try { customCategories = JSON.parse(rawCategories); } catch (_) {}
      }

      const response = await fetch("/api/github/sync", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          owner: activeRepo.owner,
          repoName: activeRepo.repoName,
          branch: activeRepo.branch,
          markers,
          customCategories,
          commitMessage: customMessage || `Sync ${markers.length} live map anchors & operational resources`
        })
      });

      const result = await response.json();
      if (result.success) {
        setGitLastSynced(result.timestamp);
        localStorage.setItem('chakra_github_last_synced', result.timestamp);
        setGitCommits(result.commits || []);
      } else {
        setGitSyncError(result.error || "GitHub sync failed.");
      }
    } catch (e: any) {
      setGitSyncError(e.message || "Failed to sync to GitHub.");
    } finally {
      setGitIsSyncing(false);
    }
  };

  // Synchronize on startup and setup custom event listeners
  useEffect(() => {
    const fetchInitialGitData = async () => {
      try {
        const response = await fetch("/api/github/data");
        const json = await response.json();
        if (json.success) {
          if (json.commits && json.commits.length > 0) {
            setGitCommits(json.commits);
          }
        }
      } catch (e) {
        console.error("Failed to load initial git history", e);
      }
    };
    fetchInitialGitData();
  }, []);

  // Listen to changes in map layouts and upload silently
  useEffect(() => {
    const handleMapDataChange = () => {
      syncLayoutToGitHub();
    };

    window.addEventListener('chakra_map_data_changed', handleMapDataChange);
    return () => {
      window.removeEventListener('chakra_map_data_changed', handleMapDataChange);
    };
  }, [githubRepo]);

  const handleDisconnectGithub = () => {
    setGithubRepo(null);
    localStorage.setItem('chakra_github_repo', 'null');
    setGitCommits([]);
    setGitLastSynced(null);
    localStorage.removeItem('chakra_github_last_synced');
  };

  const handleConnectGithub = async (owner: string, name: string, branch: string) => {
    const newRepo = {
      owner: owner.trim() || 'anjanaiz',
      repoName: name.trim() || 'Chakra',
      branch: branch.trim() || 'main',
      connected: true
    };
    setGithubRepo(newRepo);
    localStorage.setItem('chakra_github_repo', JSON.stringify(newRepo));
    setIsConfiguringRepo(false);
    
    // Auto sync on connection to save all current data right away
    setTimeout(() => {
      syncLayoutToGitHub("init: establish repository connection & seed map elements");
    }, 100);
  };

  // Read current date from metadata config / prompt
  const CURRENT_DATE_STRING = 'JUNE 13'; // Today is June 13, 2026

  // 1. Initialize State with LocalStorage supporting persistence (used as fallback when unauthenticated)
  const [categories, setCategories] = useState<Category[]>(() => {
    const saved = localStorage.getItem('chakra_cats');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Failed to parse categories state', e);
      }
    }
    return INITIAL_CATEGORIES;
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
    return INITIAL_TIMELINE;
  });

  // Track auth state
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (currentUser) => {
      setUser(currentUser);
      setAuthLoading(false);
      
      if (currentUser) {
        setSyncStatus('loading');
        // Initial setup/seed if database was empty
        await seedDatabaseIfEmpty();
      } else {
        setSyncStatus('offline');
      }
    });
    return () => unsubscribe();
  }, []);

  // Helper: Seed empty DB with standard defaults so user's project starts live instantly
  const seedDatabaseIfEmpty = async () => {
    try {
      const catsSnapshot = await getDocs(collection(db, 'categories'));
      if (catsSnapshot.empty) {
        for (const cat of INITIAL_CATEGORIES) {
          await setDoc(doc(db, 'categories', cat.id), cat);
        }
      }

      const timelineSnapshot = await getDocs(collection(db, 'timeline'));
      if (timelineSnapshot.empty) {
        for (const day of INITIAL_TIMELINE) {
          const dayId = 'day_' + day.date.replace(/\s+/g, '_').toLowerCase();
          await setDoc(doc(db, 'timeline', dayId), day);
        }
      }
    } catch (e) {
      console.error("Error checking or seeding database:", e);
      setSyncStatus('error');
    }
  };

  // 2. Synchronize to LocalStorage upon changes (FALLBACK when unauthenticated)
  useEffect(() => {
    if (!user) {
      localStorage.setItem('chakra_cats', JSON.stringify(categories));
    }
  }, [categories, user]);

  useEffect(() => {
    if (!user) {
      localStorage.setItem('chakra_timeline', JSON.stringify(timeline));
    }
  }, [timeline, user]);

  // 3. Realtime listening to database updates (only when logged in)
  useEffect(() => {
    if (!user) return;

    setSyncStatus('loading');

    // Live Subscribe: Categories
    const unsubscribeCats = onSnapshot(collection(db, 'categories'), (snapshot) => {
      const list: Category[] = [];
      snapshot.forEach(doc => {
        list.push(doc.data() as Category);
      });
      if (list.length > 0) {
        // Maintain consistent display order
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
      }
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
      if (list.length > 0) {
        // Maintain chronological order (June 12 -> June 28)
        list.sort((a, b) => {
          const idxA = INITIAL_TIMELINE.findIndex(d => d.date === a.date);
          const idxB = INITIAL_TIMELINE.findIndex(d => d.date === b.date);
          return idxA - idxB;
        });
        setTimeline(list);
        setSyncStatus('synced');
      }
    }, (err) => {
      console.error("Firestore timeline snapshot error", err);
      setSyncStatus('error');
    });

    return () => {
      unsubscribeCats();
      unsubscribeTimeline();
    };
  }, [user]);

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

    if (user) {
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

    if (user) {
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
    }
  };

  // Reset function to default data (wipes / overwrites DB)
  const handleResetData = async () => {
    if (confirm("Are you sure you want to reset all tracking progress data back to concert defaults?")) {
      setCategories(INITIAL_CATEGORIES);
      setTimeline(INITIAL_TIMELINE);

      if (user) {
        try {
          setSyncStatus('loading');
          // Clear and rewrite categories
          for (const cat of INITIAL_CATEGORIES) {
            await setDoc(doc(db, 'categories', cat.id), cat);
          }
          // Clear and rewrite timeline days
          for (const day of INITIAL_TIMELINE) {
            const dayId = 'day_' + day.date.replace(/\s+/g, '_').toLowerCase();
            await setDoc(doc(db, 'timeline', dayId), day);
          }
          setSyncStatus('synced');
        } catch (err) {
          console.error("Firestore reset database overwrite error:", err);
          setSyncStatus('error');
        }
      }
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
                e.currentTarget.src = './chakra_logo.png';
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

            {/* Real-time Google Authentication & Sync panel */}
            <div className="pt-4 border-t border-white/5 mt-4">
              <div className="bg-white/5 p-4 rounded-xl border border-white/10 relative overflow-hidden space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[9px] uppercase text-white/40 font-mono tracking-wider font-semibold flex items-center gap-1">
                    <Database size={10} className="text-[#FF6B00]" /> Collaboration
                  </span>
                  
                  {/* Status Indicator */}
                  {syncStatus === 'synced' && (
                    <span className="text-[8px] font-mono text-emerald-400 font-bold bg-emerald-500/10 px-1.5 py-0.5 rounded flex items-center gap-1">
                      <span className="h-1 w-1 bg-emerald-400 rounded-full animate-pulse" /> Live Sync
                    </span>
                  )}
                  {syncStatus === 'loading' && (
                    <span className="text-[8px] font-mono text-amber-400 font-bold bg-amber-500/10 px-1.5 py-0.5 rounded flex items-center gap-1">
                      <RefreshCw size={8} className="animate-spin" /> Syncing
                    </span>
                  )}
                  {syncStatus === 'offline' && (
                    <span className="text-[8px] font-mono text-white/40 font-bold bg-white/5 px-1.5 py-0.5 rounded flex items-center gap-1">
                      <span className="h-1 w-1 bg-white/40 rounded-full" /> Local Info
                    </span>
                  )}
                  {syncStatus === 'error' && (
                    <span className="text-[8px] font-mono text-red-400 font-bold bg-red-500/10 px-1.5 py-0.5 rounded flex items-center gap-1">
                      <span className="h-1 w-1 bg-red-400 rounded-full animate-pulse" /> Sync Err
                    </span>
                  )}
                </div>

                {user ? (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      {user.photoURL ? (
                        <img 
                          src={user.photoURL} 
                          alt={user.displayName || "User"} 
                          className="h-7 w-7 rounded-full border border-[#FF6B00]/40"
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <div className="h-7 w-7 rounded-full bg-[#FF6B00]/25 flex items-center justify-center font-bold text-xs text-[#FF6B00]">
                          {user.displayName?.charAt(0) || "U"}
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <div className="text-white text-[11px] font-bold font-display truncate leading-tight">
                          {user.displayName || "Manager"}
                        </div>
                        <div className="text-[8px] text-white/40 truncate font-mono">
                          {user.email}
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={handleAuthAction}
                      className="w-full flex items-center justify-center gap-1 py-1 bg-red-500/5 hover:bg-red-500/15 border border-red-500/10 rounded text-[9px] font-mono text-red-400 transition cursor-pointer"
                    >
                      <LogOut size={8} />
                      DISCONNECT
                    </button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <p className="text-[9px] text-white/40 leading-relaxed font-mono">
                      Authorize with Google to sync edits in real-time.
                    </p>
                    <button
                      onClick={handleAuthAction}
                      className="w-full flex items-center justify-center gap-1.5 py-1.5 bg-[#FF6B00]/10 hover:bg-[#FF6B00]/20 border border-[#FF6B00]/20 rounded-lg text-[9px] font-mono text-[#FF6B00] hover:text-[#FF6B00] transition cursor-pointer uppercase tracking-wider font-bold"
                    >
                      <LogIn size={10} />
                      Share & Live Sync
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Sync to GitHub Section */}
            <div className="pt-4 border-t border-white/5 mt-4">
              <div className="bg-white/5 p-4 rounded-xl border border-white/10 relative overflow-hidden space-y-3" id="github-sync-section">
                <div className="flex items-center justify-between">
                  <span className="text-[9px] uppercase text-white/40 font-mono tracking-wider font-semibold flex items-center gap-1.5">
                    <GitBranch size={10} className="text-[#FF6B00]" /> Sync to GitHub
                  </span>
                  {githubRepo?.connected && !isConfiguringRepo ? (
                    <span className="text-[8px] font-mono text-emerald-400 font-bold bg-emerald-500/10 px-1.5 py-0.5 rounded flex items-center gap-1">
                      <span className="h-1.5 w-1.5 bg-emerald-400 rounded-full animate-pulse" /> Connected
                    </span>
                  ) : (
                    <span className="text-[8px] font-mono text-white/30 bg-white/5 px-1.5 py-0.5 rounded flex items-center gap-1">
                      Setup Repo
                    </span>
                  )}
                </div>

                {githubRepo && githubRepo.connected && !isConfiguringRepo ? (
                  <div className="space-y-3">
                    <div className="bg-black/20 p-2.5 rounded-lg border border-white/5 space-y-1.5">
                      <div className="text-[11px] font-bold text-white font-display truncate">
                        {githubRepo.owner}/{githubRepo.repoName}
                      </div>
                      <div className="flex items-center justify-between text-[8px] text-white/40 font-mono">
                        <span className="flex items-center gap-1">
                          <span className="inline-block w-1.5 h-1.5 rounded-full bg-[#FF6B00]" /> branch: <span className="text-white/60">{githubRepo.branch}</span>
                        </span>
                        <span className="text-[7.5px] uppercase tracking-wider px-1 bg-white/5 rounded text-white/50">GitHub Live Sync</span>
                      </div>
                    </div>

                    {/* LAST SYNCED TIMESTAMP DISPLAY */}
                    <div className="space-y-1" id="last-synced-container">
                      <label className="text-[7.5px] text-white/30 uppercase font-mono tracking-wider">Sync Status</label>
                      {gitLastSynced ? (
                        <div className="flex items-center gap-1.5 text-[9px] bg-emerald-500/5 border border-emerald-500/10 px-2 py-1.5 rounded-lg">
                          <CheckCircle size={10} className="text-emerald-400 shrink-0" />
                          <div className="leading-tight flex-1">
                            <span className="text-[7.5px] text-emerald-400/80 block uppercase font-mono tracking-wider font-semibold">Synchronization Active</span>
                            <span className="font-mono text-zinc-300 font-medium text-[9px]">{gitLastSynced}</span>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1.5 text-[9px] bg-[#FF6B00]/5 border border-[#FF6B00]/10 px-2 py-1.5 rounded-lg">
                          <Info size={10} className="text-[#FF6B00] shrink-0 animate-pulse" />
                          <div className="leading-tight flex-1">
                            <span className="text-[7.5px] text-[#FF6B00]/80 block uppercase font-mono tracking-wider font-semibold">Pending Initial Push</span>
                            <span className="font-mono text-zinc-400 text-[8.5px]">Seeding workspace directory...</span>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* RECENT ACTIVITY / RECENT COMMITS TIMELINE DISPLAY */}
                    <div className="space-y-1">
                      <label className="text-[7.5px] text-white/30 uppercase font-mono tracking-wider flex items-center gap-1">
                        <History size={7.5} /> Recent Workspace Commits
                      </label>
                      {gitCommits && gitCommits.length > 0 ? (
                        <div className="space-y-1 max-h-[140px] overflow-y-auto pr-1 select-none custom-scrollbar pb-1">
                          {gitCommits.slice(0, 3).map((commit: any, idx: number) => (
                            <div key={idx} className="bg-black/35 border border-white/5 rounded-md p-1.5 font-mono text-[8.2px] leading-normal transition hover:border-white/10">
                              <div className="flex items-center justify-between">
                                <span className="text-[#FF6B00] font-bold">git commit #{commit.hash}</span>
                                <span className="text-[7.5px] text-white/30">{commit.timestamp.split(', ')[1] || commit.timestamp}</span>
                              </div>
                              <p className="text-zinc-400 mt-0.5 line-clamp-1">{commit.message}</p>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-[8px] font-mono text-white/20 italic py-1 bg-black/10 rounded-md text-center border border-white/5">
                          No recent pushes. Trigger manual sync below.
                        </div>
                      )}
                    </div>

                    {/* MANUAL TRIGGER SYNC BUTTON */}
                    <button
                      onClick={() => syncLayoutToGitHub()}
                      disabled={gitIsSyncing}
                      className={`w-full flex items-center justify-center gap-2 py-1.5 border rounded-lg text-[9px] font-mono font-bold transition uppercase tracking-wider cursor-pointer ${
                        gitIsSyncing 
                        ? "bg-zinc-800 text-zinc-400 border-zinc-700 pointer-events-none" 
                        : "bg-[#FF6B00]/10 hover:bg-[#FF6B00]/25 border-[#FF6B00]/25 text-[#FF6B00]"
                      }`}
                      id="manual-sync-github-btn"
                    >
                      {gitIsSyncing ? (
                        <>
                          <RefreshCw size={10} className="animate-spin" />
                          Pushing Map Layout...
                        </>
                      ) : (
                        <>
                          <RefreshCw size={10} />
                          Manual Push Sync
                        </>
                      )}
                    </button>

                    {gitSyncError && (
                      <div className="text-[8px] font-mono text-red-400 bg-red-500/5 px-2 py-1 border border-red-500/10 rounded">
                        Error: {gitSyncError}
                      </div>
                    )}

                    <div className="grid grid-cols-2 gap-2 pt-1">
                      <button
                        onClick={() => {
                          setRepoOwnerInput(githubRepo.owner);
                          setRepoNameInput(githubRepo.repoName);
                          setRepoBranchInput(githubRepo.branch);
                          setIsConfiguringRepo(true);
                        }}
                        className="flex items-center justify-center gap-1 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-[9px] font-mono text-white/80 transition cursor-pointer font-medium uppercase tracking-wider"
                        id="edit-github-btn"
                      >
                        Edit Repo
                      </button>
                      <button
                        onClick={handleDisconnectGithub}
                        className="flex items-center justify-center gap-1 py-1.5 bg-red-500/5 hover:bg-red-500/15 border border-red-500/10 rounded-lg text-[9px] font-mono text-red-400 transition cursor-pointer font-medium uppercase tracking-wider"
                        id="disconnect-github-btn"
                      >
                        Disconnect
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="space-y-1.5">
                      <div>
                        <label className="text-[8px] text-white/40 block mb-1 font-semibold tracking-wider font-mono">OWNER / ORGANIZATION</label>
                        <input
                          type="text"
                          value={repoOwnerInput}
                          onChange={(e) => setRepoOwnerInput(e.target.value)}
                          placeholder="e.g. anjanaiz"
                          className="w-full bg-black/40 border border-white/10 rounded-lg text-white text-[10px] px-2 py-1.5 focus:outline-none focus:border-[#FF6B00] font-mono"
                        />
                      </div>
                      <div>
                        <label className="text-[8px] text-white/40 block mb-1 font-semibold tracking-wider font-mono">REPOSITORY NAME</label>
                        <input
                          type="text"
                          value={repoNameInput}
                          onChange={(e) => setRepoNameInput(e.target.value)}
                          placeholder="e.g. Chakra"
                          className="w-full bg-black/40 border border-white/10 rounded-lg text-white text-[10px] px-2 py-1.5 focus:outline-none focus:border-[#FF6B00] font-mono"
                        />
                      </div>
                      <div>
                        <label className="text-[8px] text-white/40 block mb-1 font-semibold tracking-wider font-mono">BRANCH</label>
                        <input
                          type="text"
                          value={repoBranchInput}
                          onChange={(e) => setRepoBranchInput(e.target.value)}
                          placeholder="e.g. main"
                          className="w-full bg-black/40 border border-white/10 rounded-lg text-white text-[10px] px-2 py-1.5 focus:outline-none focus:border-[#FF6B00] font-mono"
                        />
                      </div>
                    </div>

                    <div className="flex gap-2 pt-1">
                      {isConfiguringRepo && (
                        <button
                          onClick={() => setIsConfiguringRepo(false)}
                          className="flex-1 py-1.5 bg-white/5 border border-white/10 rounded-lg text-[9px] font-mono text-white/60 transition cursor-pointer hover:bg-white/10 text-center"
                        >
                          Cancel
                        </button>
                      )}
                      <button
                        onClick={() => handleConnectGithub(repoOwnerInput, repoNameInput, repoBranchInput)}
                        className="flex-1 py-1.5 bg-[#FF6B00]/20 hover:bg-[#FF6B00]/30 border border-[#FF6B00]/40 rounded-lg text-[9px] font-mono text-[#FF6B00] font-bold transition cursor-pointer text-center uppercase tracking-wider"
                      >
                        Connect & Sync
                      </button>
                    </div>
                  </div>
                )}
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
            onClick={handleResetData}
            className="w-full py-2 bg-white/5 hover:bg-white/10 border border-white/5 rounded-xl text-center text-[10px] font-mono text-white/50 hover:text-white transition cursor-pointer uppercase tracking-wider"
          >
            Reset All Staging Data
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
              e.currentTarget.src = './chakra_logo.png';
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
                  handleResetData();
                  setMobileMenuOpen(false);
                }}
                className="text-[10px] font-mono text-red-400 py-1"
              >
                RESET ALL DATA
              </button>
              <span className="text-[10px] font-mono text-white/30">Venue: Air Force Grounds</span>
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
          <div className="bg-[#0C0C0C]/40 border border-white/5 p-1 rounded-2xl md:p-0 md:bg-transparent md:border-transparent" id="active-tab-container">
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
