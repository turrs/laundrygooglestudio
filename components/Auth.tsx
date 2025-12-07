
import React, { useState } from 'react';
import { User, UserRole } from '../types';
import { supabase } from '../migration/supabaseClient';
import { Lock, User as UserIcon, Building2, Loader2, AlertCircle, CheckCircle } from 'lucide-react';

interface AuthProps {
  onLogin: (user: User) => void;
}

export const Auth: React.FC<AuthProps> = ({ onLogin }) => {
  const [view, setView] = useState<'LOGIN' | 'REGISTER'>('LOGIN');
  const [role, setRole] = useState<UserRole>(UserRole.OWNER);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');
    setLoading(true);

    const cleanEmail = email.trim();
    const cleanPassword = password.trim();

    try {
      // Cast to any to bypass type definition mismatch (v2 methods on v1 types)
      const { data, error: authError } = await (supabase.auth as any).signInWithPassword({
        email: cleanEmail,
        password: cleanPassword,
      });

      if (authError) throw authError;

      // Fetch Profile
      if (data.user) {
        // We look for a profile that matches the Auth ID or Email
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .or(`auth_id.eq.${data.user.id},id.eq.${data.user.id}`) // Check both FK and legacy PK
          .single();

        if (profileError) {
             console.error("Profile fetch error:", JSON.stringify(profileError));
             
             if (profileError.code === 'PGRST116') {
                 // PGRST116 means 0 rows found
                 throw new Error("Login successful, but user profile is missing. Please register again to recreate your profile.");
             }
             
             throw new Error(profileError.message || "Failed to retrieve user profile.");
        }

        if (profile.role !== role) {
          setError(`Account found, but role does not match. Please switch tabs.`);
          await (supabase.auth as any).signOut();
          setLoading(false);
          return;
        }

        // --- CHECK APPROVAL ---
        // If it's a STAFF and is_approved is false, deny login.
        if (profile.role === UserRole.STAFF && profile.is_approved === false) {
           await (supabase.auth as any).signOut();
           setError("Akun Anda belum disetujui oleh Owner. Silakan hubungi Owner toko.");
           setLoading(false);
           return;
        }

        onLogin({
             id: profile.id,
             name: profile.name,
             email: profile.email,
             role: profile.role as UserRole,
             locationId: profile.location_id,
             isApproved: profile.is_approved
        });
      }
    } catch (err: any) {
      console.error("Login Error:", err);
      setError(err.message === 'Invalid login credentials' ? 'Invalid email or password.' : err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');
    setLoading(true);

    const cleanEmail = email.trim();
    const cleanPassword = password.trim();
    const cleanName = name.trim();

    try {
      // 1. Sign Up
      const { data, error: authError } = await (supabase.auth as any).signUp({
        email: cleanEmail,
        password: cleanPassword,
      });

      if (authError) {
        if (authError.message.includes("invalid")) {
            throw new Error(`Email is invalid. Please check for extra spaces or typos.`);
        }
        throw authError;
      }

      if (data.user) {
        // 2. Create Profile Record
        // Logic: Owner is auto-approved, Staff needs approval.
        const isApproved = role === UserRole.OWNER;
        
        const { error: profileError } = await supabase
          .from('profiles')
          .insert([
            {
              id: data.user.id, // Keep PK as Auth ID for owners for simplicity
              auth_id: data.user.id,
              name: cleanName,
              email: cleanEmail,
              role: role,
              is_approved: isApproved
            }
          ]);

        if (profileError) {
           console.error("Profile creation error:", JSON.stringify(profileError));
           if (profileError.code !== '23505') { // 23505 is unique_violation
              console.warn("Could not create profile, possibly already exists.");
           }
        }

        setLoading(false);

        // 3. Post-Registration Logic
        if (!isApproved) {
            // Staff flow: Show message, don't login
            setSuccessMsg("Registrasi berhasil! Akun Anda sedang menunggu persetujuan Owner. Silakan tunggu konfirmasi.");
            // Force logout just in case supabase session persisted
            await (supabase.auth as any).signOut();
        } else {
             // Owner flow: Login immediately
             if (data.user && !data.session) {
                setSuccessMsg("Registration successful! Please check your email to confirm your account before logging in.");
                return;
             }

             onLogin({
                id: data.user.id,
                name: cleanName,
                email: cleanEmail,
                role: UserRole.OWNER,
                isApproved: true
            });
        }
      }
    } catch (err: any) {
      setError(err.message || 'Registration failed.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden flex flex-col">
        <div className="bg-blue-600 p-6 text-center">
          <h1 className="text-2xl font-bold text-white flex items-center justify-center gap-2">
            <Building2 /> LaunderLink Pro
          </h1>
          <p className="text-blue-100 mt-2">Management System</p>
        </div>

        <div className="p-8">
          <div className="flex gap-4 mb-6 bg-slate-100 p-1 rounded-lg">
             <button 
                onClick={() => { setRole(UserRole.OWNER); setError(''); setSuccessMsg(''); }}
                className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${role === UserRole.OWNER ? 'bg-white shadow text-blue-600' : 'text-slate-500 hover:text-slate-700'}`}
             >
               Owner
             </button>
             <button 
                onClick={() => { setRole(UserRole.STAFF); setError(''); setSuccessMsg(''); }}
                className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${role === UserRole.STAFF ? 'bg-white shadow text-blue-600' : 'text-slate-500 hover:text-slate-700'}`}
             >
               Staff
             </button>
          </div>

          {successMsg && (
            <div className="mb-4 p-4 bg-green-50 text-green-700 rounded-lg text-sm flex gap-2 items-start">
               <CheckCircle size={16} className="mt-0.5 shrink-0" />
               <span>{successMsg}</span>
            </div>
          )}

          {view === 'LOGIN' ? (
            <form onSubmit={handleLogin} className="space-y-4">
              <h2 className="text-xl font-semibold text-slate-800 mb-4">{role === UserRole.OWNER ? 'Owner Login' : 'Staff Login'}</h2>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
                <div className="relative">
                  <UserIcon className="absolute left-3 top-3 h-5 w-5 text-slate-400" />
                  <input 
                    type="email" 
                    required
                    className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                    placeholder="you@example.com"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-5 w-5 text-slate-400" />
                  <input 
                    type="password" 
                    required
                    className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                    placeholder="••••••••"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                  />
                </div>
              </div>
              
              {error && (
                <div className="p-3 bg-red-50 text-red-600 rounded-lg text-sm flex gap-2 items-start">
                  <AlertCircle size={16} className="mt-0.5 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <button type="submit" disabled={loading} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 rounded-lg transition shadow-md hover:shadow-lg flex items-center justify-center">
                {loading ? <Loader2 className="animate-spin" /> : 'Login'}
              </button>

              <p className="text-center text-sm text-slate-600 mt-4">
                 Don't have an account? <button type="button" onClick={() => { setView('REGISTER'); setError(''); setSuccessMsg(''); }} className="text-blue-600 font-medium hover:underline">Register here</button>
              </p>
            </form>
          ) : (
            <form onSubmit={handleRegister} className="space-y-4">
              <h2 className="text-xl font-semibold text-slate-800 mb-4">{role === UserRole.OWNER ? 'Owner Registration' : 'Staff Registration'}</h2>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Full Name</label>
                <input 
                  type="text" 
                  required
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="John Doe"
                  value={name}
                  onChange={e => setName(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
                <input 
                  type="email" 
                  required
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder={role === UserRole.OWNER ? "owner@laundry.com" : "staff@laundry.com"}
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Password</label>
                <input 
                  type="password" 
                  required
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="••••••••"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                />
              </div>

              {error && (
                <div className="p-3 bg-red-50 text-red-600 rounded-lg text-sm flex gap-2 items-start">
                  <AlertCircle size={16} className="mt-0.5 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <button type="submit" disabled={loading} className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-2.5 rounded-lg transition shadow-md flex items-center justify-center">
                {loading ? <Loader2 className="animate-spin" /> : (role === UserRole.OWNER ? 'Create Owner Account' : 'Register as Staff')}
              </button>
              
              <p className="text-center text-sm text-slate-600 mt-4">
                Already have an account? <button type="button" onClick={() => { setView('LOGIN'); setError(''); setSuccessMsg(''); }} className="text-blue-600 font-medium hover:underline">Login</button>
              </p>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
