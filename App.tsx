import React, { useState, useEffect } from 'react';
import { User, UserRole } from './types';
import { Auth } from './components/Auth';
import { AnalyticsDashboard } from './components/Dashboard';
import { LocationManagement, StaffManagement, ServiceConfiguration } from './components/Admin';
import { OrderManagement, CustomerManagement } from './components/Operations';
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
  AlertTriangle
} from 'lucide-react';
import { supabase, isSupabaseConfigured } from './migration/supabaseClient';
import { SupabaseSchema } from './migration/SupabaseSchema';

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [activeTab, setActiveTab] = useState('DASHBOARD');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [trackingId, setTrackingId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setIsLoading(false);
      return;
    }

    const initSession = async () => {
      try {
        // 1. Check for tracking URL param
        const params = new URLSearchParams(window.location.search);
        const tid = params.get('trackingId');
        if (tid) {
          setTrackingId(tid);
          // CRITICAL FIX: Do NOT return here. 
          // We must proceed to getSession() so Supabase loads the token from localStorage.
          // Otherwise, the new tab starts with a "cold" client and might fail data fetching.
        }

        // 2. Check Local Storage Session
        // This ensures the client is authenticated if a token exists.
        const { data: { session } } = await supabase.auth.getSession();

        if (!session) {
           setUser(null);
           return;
        }

        // 3. If session exists, verify with server and get Profile
        const profile = await SupabaseService.getCurrentProfile();
        if (profile) {
          setUser(profile);
          // Only change tab if we are NOT in tracking mode
          if (!tid) {
             setActiveTab(profile.role === UserRole.OWNER ? 'DASHBOARD' : 'ORDERS');
          }
        } else {
          // Session exists but no profile? Might be a mismatch, clear it.
          setUser(null);
        }
      } catch (error) {
        console.error("Session initialization failed:", error);
        setUser(null);
      } finally {
        // 4. CRITICAL: Always turn off loading, even if errors occur
        setIsLoading(false);
      }
    };

    initSession();

    // Listen for auth changes
    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session) {
        // Only fetch profile if we don't have it (avoid redundant fetches)
        if (!user) {
            const profile = await SupabaseService.getCurrentProfile();
            if (profile) setUser(profile);
        }
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
        setActiveTab('DASHBOARD'); // Reset tab
      }
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

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

  if (trackingId) {
    return <TrackingPage orderId={trackingId} />;
  }

  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center bg-slate-50 text-blue-600">
        <Loader2 className="animate-spin w-10 h-10" />
      </div>
    );
  }

  const handleLogin = (u: User) => {
    setUser(u);
    setActiveTab(u.role === UserRole.OWNER ? 'DASHBOARD' : 'ORDERS');
  };

  const handleLogout = async () => {
    setIsLoading(true); // Show loader during logout
    try {
        await supabase.auth.signOut();
        setUser(null);
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
        activeTab === id ? 'bg-blue-600 text-white shadow-md' : 'text-slate-600 hover:bg-blue-50 hover:text-blue-600'
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
              <NavItem id="CUSTOMERS" label="Customers" icon={UserIcon} />
              <button onClick={handleLogout} className="flex items-center gap-3 text-red-600 px-4 py-3 w-full border-t mt-4">
                 <LogOut size={20} /> Logout
              </button>
           </div>
        )}

        <main className="flex-1 overflow-auto p-4 md:p-8">
           {activeTab === 'DASHBOARD' && user.role === UserRole.OWNER && <AnalyticsDashboard />}
           {activeTab === 'LOCATIONS' && user.role === UserRole.OWNER && <LocationManagement />}
           {activeTab === 'STAFF' && user.role === UserRole.OWNER && <StaffManagement />}
           {activeTab === 'SERVICES' && user.role === UserRole.OWNER && <ServiceConfiguration />}
           {activeTab === 'ORDERS' && <OrderManagement currentUser={user} />}
           {activeTab === 'CUSTOMERS' && <CustomerManagement />}
        </main>
      </div>
    </div>
  );
};

export default App;