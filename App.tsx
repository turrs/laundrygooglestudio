
import React, { useState, useEffect } from 'react';
import { User, UserRole } from './types';
import { Auth } from './components/Auth';
import { AnalyticsDashboard } from './components/Dashboard';
import { LocationManagement, StaffManagement, ServiceConfiguration } from './components/Admin';
import { OrderManagement, CustomerManagement } from './components/Operations';
import { ExpenseManagement } from './components/Expenses';
import { TrackingPage } from './components/Tracking';
import { SupabaseService } from './migration/SupabaseService';
import { 
  LayoutDashboard, 
  MapPin, 
  Users, 
  Settings, 
  ShoppingBag, 
  User as UserIcon, 
  LogOut,
  Menu,
  X,
  Loader2,
  AlertTriangle,
  Wallet
} from 'lucide-react';
import { supabase, isSupabaseConfigured } from './migration/supabaseClient';
import { SupabaseSchema } from './migration/SupabaseSchema';

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [activeTab, setActiveTab] = useState('DASHBOARD');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  // FIX: Initialize trackingId immediately from URL
  const [trackingId] = useState<string | null>(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get('trackingId');
  });
  
  // Initial loading state
  const [isLoading, setIsLoading] = useState(!trackingId);

  useEffect(() => {
    if (!isSupabaseConfigured) {
      if (isLoading) setIsLoading(false);
      return;
    }

    // Flag to prevent state updates on unmounted component
    let mounted = true;

    // --- SAFETY VALVE ---
    const safetyTimer = setTimeout(() => {
        if (mounted && isLoading) {
            console.warn("Auth check timed out. Forcing UI to load.");
            setIsLoading(false);
        }
    }, 5000);

    const checkSession = async () => {
      try {
        // STEP 1: Cek Penyimpanan Lokal (Instant)
        // Jika tidak ada token di localStorage, jangan buang waktu ke server.
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!session) {
            if (mounted) {
                setUser(null);
                setIsLoading(false);
            }
            return; 
        }

        // STEP 2: Verifikasi Token ke Server (Secure)
        // Token ada di lokal, tapi apakah masih valid? (Tidak expired/revoked)
        const { data: { user: authUser }, error } = await supabase.auth.getUser();

        if (error || !authUser) {
           // Token lokal basi atau tidak valid
           if (mounted) {
             console.warn("Token exists but invalid/expired on server.");
             await supabase.auth.signOut(); // Bersihkan token basi
             setUser(null);
             setIsLoading(false);
           }
           return;
        }

        // STEP 3: Ambil Data Profil Aplikasi
        const profile = await SupabaseService.getCurrentProfile();
        
        if (mounted) {
            if (profile) {
                setUser(profile);
                if (!trackingId) {
                    setActiveTab(profile.role === UserRole.OWNER ? 'DASHBOARD' : 'ORDERS');
                }
            } else {
                // User login valid, tapi data profile hilang di DB
                console.error("User authenticated but no profile found. Forcing logout.");
                await supabase.auth.signOut();
                setUser(null);
            }
        }
      } catch (error) {
        console.error("Auth initialization crashed:", error);
        if (mounted) setUser(null);
      } finally {
        if (mounted) setIsLoading(false);
      }
    };

    // Run the check
    checkSession();

    // Listen for changes (Sign In, Sign Out, Auto-Refresh)
    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
      // Only react to specific events after initial load is done
      if (event === 'SIGNED_OUT') {
         if (mounted) {
            setUser(null);
            if (!trackingId) setActiveTab('DASHBOARD'); // Reset tab context
            setIsLoading(false); // Ensure loading stops on logout
         }
      } else if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
         // Re-fetch profile on explicit sign-in or refresh
         // Only fetch if we don't have the user yet (optimization)
         if (!user) {
             const profile = await SupabaseService.getCurrentProfile();
             if (mounted && profile) {
                 setUser(profile);
                 if (!trackingId) {
                     setActiveTab(profile.role === UserRole.OWNER ? 'DASHBOARD' : 'ORDERS');
                 }
                 setIsLoading(false);
             }
         }
      }
    });

    return () => {
      mounted = false;
      clearTimeout(safetyTimer);
      authListener.subscription.unsubscribe();
    };
  }, [trackingId]); // Remove 'user' from dep array to prevent loop

  if (!isSupabaseConfigured) {
    return (
      <div className="min-h-screen bg-slate-100 p-4 overflow-auto">
        <div className="max-w-4xl mx-auto pt-10">
          <div className="bg-white p-8 rounded-xl shadow-lg text-center mb-8">
             <div className="w-16 h-16 bg-red-100 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertTriangle size={32} />
             </div>
             <h2 className="text-xl font-bold text-slate-800 mb-2">Supabase Configuration Missing</h2>
             <p className="text-slate-500 text-sm mb-6">
               To run this application, you must connect it to a Supabase project.
             </p>
             <div className="bg-slate-50 p-4 rounded-lg text-left text-xs font-mono text-slate-600 overflow-x-auto mb-4 border border-slate-200 inline-block max-w-full">
                REACT_APP_SUPABASE_URL=...<br/>
                REACT_APP_SUPABASE_ANON_KEY=...
             </div>
             <p className="text-xs text-slate-400">Please add these to your .env file.</p>
          </div>
          
          <SupabaseSchema />
        </div>
      </div>
    );
  }

  // Priority Render: Tracking Page overrides Auth check logic
  if (trackingId) {
    return <TrackingPage orderId={trackingId} />;
  }

  if (isLoading) {
    return (
      <div className="h-screen flex flex-col items-center justify-center bg-slate-50 text-blue-600 gap-4">
        <Loader2 className="animate-spin w-10 h-10" />
        <p className="text-sm text-slate-400 animate-pulse">Memverifikasi sesi...</p>
      </div>
    );
  }

  const handleLogin = (u: User) => {
    setUser(u);
    setActiveTab(u.role === UserRole.OWNER ? 'DASHBOARD' : 'ORDERS');
  };

  const handleLogout = async () => {
    // Optimistic Logout UI
    setUser(null);
    setIsLoading(true);
    try {
        await supabase.auth.signOut();
    } catch (e) {
        console.error("Logout error", e);
        // Force reload if logout hangs (clears memory state)
        window.location.reload();
    } finally {
        setIsLoading(false);
    }
  };

  if (!user) {
    return <Auth onLogin={handleLogin} />;
  }

  const NavItem = ({ id, label, icon: Icon }: { id: string, label: string, icon: any }) => (
    <button
      onClick={() => { setActiveTab(id); setIsMobileMenuOpen(false); }}
      className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
        activeTab === id ? 'bg-blue-600 text-white shadow-md' : 'text-slate-600 hover:text-blue-600'
      }`}
    >
      <Icon size={20} />
      <span className="font-medium">{label}</span>
    </button>
  );

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      {/* Sidebar - Desktop */}
      <aside className="hidden md:flex flex-col w-64 bg-white border-r border-slate-200">
         <div className="p-6 border-b border-slate-100">
           <h1 className="text-xl font-bold text-blue-600 flex items-center gap-2">
             LaunderLink Pro
           </h1>
           <p className="text-xs text-slate-500 mt-1">Logged in as {user.name}</p>
         </div>
         
         <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
            {user.role === UserRole.OWNER && (
              <>
                <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider pl-4 mt-4 mb-2">Analytics</div>
                <NavItem id="DASHBOARD" label="Dashboard" icon={LayoutDashboard} />
                
                <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider pl-4 mt-6 mb-2">Management</div>
                <NavItem id="LOCATIONS" label="Locations" icon={MapPin} />
                <NavItem id="STAFF" label="Staff" icon={Users} />
                <NavItem id="SERVICES" label="Services" icon={Settings} />
              </>
            )}

            <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider pl-4 mt-6 mb-2">Operations</div>
            <NavItem id="ORDERS" label="Orders" icon={ShoppingBag} />
            <NavItem id="EXPENSES" label="Pengeluaran" icon={Wallet} />
            <NavItem id="CUSTOMERS" label="Customers" icon={UserIcon} />
         </nav>

         <div className="p-4 border-t border-slate-100">
           <button onClick={handleLogout} className="flex items-center gap-3 text-slate-500 hover:text-red-600 px-4 py-2 w-full transition">
             <LogOut size={20} /> Logout
           </button>
         </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* Mobile Header */}
        <header className="md:hidden bg-white border-b border-slate-200 p-4 flex justify-between items-center z-20">
           <h1 className="font-bold text-blue-600">LaunderLink</h1>
           <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="text-slate-600">
              {isMobileMenuOpen ? <X /> : <Menu />}
           </button>
        </header>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
           <div className="absolute inset-0 bg-white z-10 pt-16 px-4 space-y-2 md:hidden">
              {user.role === UserRole.OWNER && (
                <>
                  <NavItem id="DASHBOARD" label="Dashboard" icon={LayoutDashboard} />
                  <NavItem id="LOCATIONS" label="Locations" icon={MapPin} />
                  <NavItem id="STAFF" label="Staff" icon={Users} />
                  <NavItem id="SERVICES" label="Services" icon={Settings} />
                </>
              )}
              <NavItem id="ORDERS" label="Orders" icon={ShoppingBag} />
              <NavItem id="EXPENSES" label="Pengeluaran" icon={Wallet} />
              <NavItem id="CUSTOMERS" label="Customers" icon={UserIcon} />
              <button onClick={handleLogout} className="flex items-center gap-3 text-red-600 px-4 py-3 w-full border-t mt-4">
                 <LogOut size={20} /> Logout
              </button>
           </div>
        )}

        <main className="flex-1 overflow-auto p-4 md:p-8">
           {activeTab === 'DASHBOARD' && user.role === UserRole.OWNER && <AnalyticsDashboard />}
           {activeTab === 'LOCATIONS' && user.role === UserRole.OWNER && <LocationManagement currentUser={user} />}
           {activeTab === 'STAFF' && user.role === UserRole.OWNER && <StaffManagement />}
           {activeTab === 'SERVICES' && user.role === UserRole.OWNER && <ServiceConfiguration />}
           {activeTab === 'ORDERS' && <OrderManagement currentUser={user} />}
           {activeTab === 'EXPENSES' && <ExpenseManagement currentUser={user} />}
           {activeTab === 'CUSTOMERS' && <CustomerManagement currentUser={user} />}
        </main>
      </div>
    </div>
  );
};

export default App;
