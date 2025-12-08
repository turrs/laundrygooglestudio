
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
  Wallet
} from 'lucide-react';
import { supabase, isSupabaseConfigured } from './migration/supabaseClient';
import { SupabaseSchema } from './migration/SupabaseSchema';

const App: React.FC = () => {
  // State User bersih, tidak ada inisialisasi kompleks dari localStorage manual
  const [user, setUser] = useState<User | null>(null);
  
  // Tracking ID logic
  const [trackingId, setTrackingId] = useState<string | null>(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get('trackingId');
  });

  const [activeTab, setActiveTab] = useState('ORDERS');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  // DEFAULT LOADING TRUE
  // Kita berasumsi aplikasi sedang memuat sampai Supabase bilang "ada session" atau "tidak ada".
  const [isLoading, setIsLoading] = useState(true);

  // --- CORE AUTH LOGIC ---
  useEffect(() => {
    // 1. Jika Tracking ID ada, kita tidak butuh auth user, matikan loading segera.
    if (trackingId) {
      setIsLoading(false);
      return;
    }

    if (!isSupabaseConfigured) {
      setIsLoading(false);
      return;
    }

    const initSession = async () => {
      try {
        // A. Cek apakah ada session tersimpan di LocalStorage (SDK Handle ini)
        const { data: { session } } = await supabase.auth.getSession();

        if (session?.user) {
          // B. Jika ada session, ambil data profil lengkap dari DB
          // Token otomatis dipakai oleh SupabaseService
          const profile = await SupabaseService.getCurrentProfile();
          
          if (profile) {
            setUser(profile);
            // Set default tab based on role
            setActiveTab(profile.role === UserRole.OWNER ? 'DASHBOARD' : 'ORDERS');
          } else {
            // Edge Case: Ada session auth, tapi tidak ada row di tabel profiles
            // Logout untuk pembersihan
            await supabase.auth.signOut();
            setUser(null);
          }
        } else {
            // Tidak ada session (User belum login)
            setUser(null);
        }
      } catch (error) {
        console.error("Auth initialization error:", error);
        setUser(null);
      } finally {
        // Apapun yang terjadi (Login/Tidak/Error), loading selesai.
        setIsLoading(false);
      }
    };

    initSession();

    // C. Listener untuk perubahan Auth (Login/Logout realtime)
    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session) {
         // User baru saja login
         const profile = await SupabaseService.getCurrentProfile();
         if (profile) {
             setUser(profile);
             setActiveTab(profile.role === UserRole.OWNER ? 'DASHBOARD' : 'ORDERS');
         }
      } else if (event === 'SIGNED_OUT') {
         // User logout
         setUser(null);
         setActiveTab('ORDERS');
      }
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, [trackingId]); 


  // --- HANDLERS ---

  const handleClearTracking = () => {
      const url = new URL(window.location.href);
      url.searchParams.delete('trackingId');
      window.history.pushState({}, '', url);
      setTrackingId(null);
      
      // Saat keluar tracking, jika user null, kita set loading true sebentar
      // untuk memastikan cek ulang session (walaupun useEffect akan handle)
      if (!user) setIsLoading(true);
  };

  const handleLogin = (u: User) => {
    setUser(u);
    setActiveTab(u.role === UserRole.OWNER ? 'DASHBOARD' : 'ORDERS');
  };

  const handleLogout = async () => {
    try {
        await supabase.auth.signOut();
        // State update dihandle oleh onAuthStateChange ('SIGNED_OUT')
    } catch (e) {
        console.error("Logout error", e);
        // Fallback manual jika listener gagal
        setUser(null);
    }
  };

  // --- RENDERERS ---

  // 1. Schema Check
  if (!isSupabaseConfigured) {
    return (
      <div className="min-h-screen bg-slate-100 p-4 overflow-auto">
        <div className="max-w-4xl mx-auto pt-10">
             <SupabaseSchema />
        </div>
      </div>
    );
  }

  // 2. Tracking Page (Priority High)
  if (trackingId) {
    return <TrackingPage orderId={trackingId} onClearTracking={handleClearTracking} />;
  }

  // 3. Loading Screen (Saat cek session)
  if (isLoading) {
    return (
      <div className="h-screen flex flex-col items-center justify-center bg-slate-50 text-blue-600 gap-4">
        <Loader2 className="animate-spin w-10 h-10" />
        <p className="text-sm text-slate-400 font-medium">Memuat data...</p>
      </div>
    );
  }

  // 4. Auth Screen (Jika tidak ada user)
  if (!user) {
    return <Auth onLogin={handleLogin} />;
  }

  // 5. Main App (Jika user login)
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
