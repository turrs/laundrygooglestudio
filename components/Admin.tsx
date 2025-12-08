
import React, { useState, useEffect } from 'react';
import { Location, User, Service, UserRole } from '../types';
import { SupabaseService } from '../migration/SupabaseService';
import { supabase } from '../migration/supabaseClient';
import { MapPin, Tag, Trash2, Plus, Edit2, Loader2, ShieldAlert, CheckCircle, XCircle, Clock } from 'lucide-react';

// --- LOCATIONS ---
interface LocationManagementProps {
  currentUser?: User | null;
}

export const LocationManagement: React.FC<LocationManagementProps> = ({ currentUser }) => {
  const [locations, setLocations] = useState<Location[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<Partial<Location>>({});
  const [loading, setLoading] = useState(true);

  // Security Check: If not owner, prevent access entirely
  if (currentUser?.role !== UserRole.OWNER) {
      return (
          <div className="flex flex-col items-center justify-center h-64 text-slate-500 bg-slate-50 rounded-xl border border-slate-200 border-dashed">
              <ShieldAlert size={48} className="text-red-400 mb-2" />
              <h3 className="text-lg font-bold text-slate-700">Akses Ditolak</h3>
              <p>Hanya Owner yang dapat mengelola lokasi.</p>
          </div>
      );
  }

  useEffect(() => {
    fetchLocations();
  }, []);

  const fetchLocations = async () => {
    setLoading(true);
    const data = await SupabaseService.getLocations();
    setLocations(data);
    setLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.name && formData.address && formData.phone) {
      await SupabaseService.saveLocation({
        id: formData.id || `loc-${Date.now()}`,
        name: formData.name,
        address: formData.address,
        phone: formData.phone
      });
      setIsEditing(false);
      setFormData({});
      fetchLocations();
    }
  };

  const handleDelete = async (id: string) => {
    if(window.confirm("Apakah Anda yakin ingin menghapus lokasi ini?")) {
        await SupabaseService.deleteLocation(id);
        fetchLocations();
    }
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-slate-800">Manajemen Lokasi</h2>
        {/* Extra check for UI consistency, though the component is already guarded */}
        {currentUser.role === UserRole.OWNER && (
          <button onClick={() => { setFormData({}); setIsEditing(true); }} className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition">
            <Plus size={18} /> Tambah Lokasi
          </button>
        )}
      </div>

      {isEditing && (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <h3 className="text-lg font-semibold mb-4">{formData.id ? 'Edit' : 'Tambah'} Lokasi</h3>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <input 
              placeholder="Nama Outlet" 
              className="border p-2 rounded focus:ring-2 focus:ring-blue-500 outline-none" 
              value={formData.name || ''} 
              onChange={e => setFormData({...formData, name: e.target.value})} 
              required 
            />
            <input 
              placeholder="Alamat Lengkap" 
              className="border p-2 rounded focus:ring-2 focus:ring-blue-500 outline-none" 
              value={formData.address || ''} 
              onChange={e => setFormData({...formData, address: e.target.value})} 
              required 
            />
            <input 
              placeholder="Nomor Telepon" 
              className="border p-2 rounded focus:ring-2 focus:ring-blue-500 outline-none" 
              value={formData.phone || ''} 
              onChange={e => setFormData({...formData, phone: e.target.value})} 
              required 
            />
            <div className="flex gap-2">
              <button type="submit" className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700">Simpan</button>
              <button type="button" onClick={() => setIsEditing(false)} className="bg-slate-300 text-slate-800 px-4 py-2 rounded hover:bg-slate-400">Batal</button>
            </div>
          </form>
        </div>
      )}

      {loading ? <div className="text-center p-8 text-slate-500"><Loader2 className="animate-spin inline mr-2"/> Memuat lokasi...</div> : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {locations.map(loc => (
            <div key={loc.id} className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 hover:shadow-md transition">
                <div className="flex justify-between items-start mb-4">
                <div className="bg-blue-100 p-3 rounded-full text-blue-600">
                    <MapPin size={24} />
                </div>
                {currentUser.role === UserRole.OWNER && (
                  <div className="flex gap-2">
                      <button onClick={() => { setFormData(loc); setIsEditing(true); }} className="text-slate-400 hover:text-blue-600"><Edit2 size={18} /></button>
                      <button onClick={() => handleDelete(loc.id)} className="text-slate-400 hover:text-red-600"><Trash2 size={18} /></button>
                  </div>
                )}
                </div>
                <h3 className="font-bold text-lg text-slate-800">{loc.name}</h3>
                <p className="text-slate-500 text-sm mt-1">{loc.address}</p>
                <p className="text-slate-500 text-sm mt-1">{loc.phone}</p>
            </div>
            ))}
        </div>
      )}
    </div>
  );
};

// --- STAFF ---
export const StaffManagement: React.FC = () => {
  const [staff, setStaff] = useState<User[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<Partial<User>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    const [locs, allProfiles] = await Promise.all([
        SupabaseService.getLocations(),
        // We need to fetch profiles that are STAFF. 
        supabase.from('profiles').select('*').eq('role', 'STAFF')
    ]);
    
    setLocations(locs);
    if(allProfiles.data) {
        setStaff(allProfiles.data.map((p: any) => ({
            id: p.id,
            name: p.name,
            email: p.email,
            role: p.role as UserRole,
            locationId: p.location_id,
            isApproved: p.is_approved
        })));
    }
    setLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.name && formData.email) {
      
      const payload = {
          name: formData.name,
          email: formData.email,
          role: UserRole.STAFF,
          location_id: formData.locationId
      };

      if (formData.id) {
          // Update existing profile
          await supabase.from('profiles').update(payload).eq('id', formData.id);
      } else {
          // Create new profile (Admin creating staff manually)
          // We default to approved because Owner created it.
          await supabase.from('profiles').insert([{ ...payload, id: crypto.randomUUID(), is_approved: true }]);
      }
      
      setIsEditing(false);
      setFormData({});
      fetchData();
    }
  };

  const handleApprove = async (id: string) => {
      await SupabaseService.approveStaff(id);
      fetchData();
  };

  const handleReject = async (id: string) => {
      if (window.confirm("Tolak dan hapus data staff ini?")) {
        await SupabaseService.rejectStaff(id);
        fetchData();
      }
  };

  const pendingStaff = staff.filter(s => !s.isApproved);
  const activeStaff = staff.filter(s => s.isApproved);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-slate-800">Manajemen Staff</h2>
        <button onClick={() => { setFormData({}); setIsEditing(true); }} className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition">
          <Plus size={18} /> Tambah Staff Manual
        </button>
      </div>

      {isEditing && (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input placeholder="Nama Lengkap" className="border p-2 rounded" value={formData.name || ''} onChange={e => setFormData({...formData, name: e.target.value})} required />
            <input placeholder="Email" type="email" className="border p-2 rounded" value={formData.email || ''} onChange={e => setFormData({...formData, email: e.target.value})} required />
            <select className="border p-2 rounded" value={formData.locationId || ''} onChange={e => setFormData({...formData, locationId: e.target.value})} required>
                <option value="">Pilih Lokasi Penugasan</option>
                {locations.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
            </select>
            <div className="col-span-1 md:col-span-2 flex gap-2">
              <button type="submit" className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700">Simpan Staff</button>
              <button type="button" onClick={() => setIsEditing(false)} className="bg-slate-300 text-slate-800 px-4 py-2 rounded hover:bg-slate-400">Batal</button>
            </div>
            <p className="col-span-2 text-xs text-orange-500">Catatan: Ini membuat data profil staff. Untuk login, Auth User harus dibuat di Supabase Dashboard dengan email yang sama.</p>
          </form>
        </div>
      )}

      {loading ? (
         <div className="text-center p-8 text-slate-500"><Loader2 className="animate-spin inline mr-2"/> Memuat staff...</div>
      ) : (
      <div className="space-y-8">
        
        {/* Pending Approval Section */}
        {pendingStaff.length > 0 && (
            <div className="bg-orange-50 border border-orange-200 rounded-xl overflow-hidden">
                <div className="p-4 bg-orange-100 border-b border-orange-200 flex items-center gap-2">
                    <ShieldAlert size={20} className="text-orange-600"/>
                    <h3 className="font-bold text-orange-800">Menunggu Persetujuan ({pendingStaff.length})</h3>
                </div>
                <table className="w-full text-left">
                    <thead className="text-orange-700 text-sm font-medium border-b border-orange-200">
                        <tr>
                        <th className="p-4">Nama</th>
                        <th className="p-4">Email</th>
                        <th className="p-4 text-right">Aksi</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-orange-100">
                        {pendingStaff.map(s => (
                        <tr key={s.id} className="hover:bg-orange-100/50">
                            <td className="p-4 font-medium text-slate-800">{s.name}</td>
                            <td className="p-4 text-slate-600">{s.email}</td>
                            <td className="p-4 text-right flex justify-end gap-2">
                                <button onClick={() => handleApprove(s.id)} className="flex items-center gap-1 bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700 text-sm">
                                    <CheckCircle size={14}/> Setujui
                                </button>
                                <button onClick={() => handleReject(s.id)} className="flex items-center gap-1 bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600 text-sm">
                                    <XCircle size={14}/> Tolak
                                </button>
                            </td>
                        </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        )}

        {/* Active Staff Section */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="p-4 bg-slate-50 border-b border-slate-200">
                 <h3 className="font-bold text-slate-700">Staff Aktif</h3>
            </div>
            <table className="w-full text-left">
            <thead className="bg-slate-50 text-slate-500 font-medium">
                <tr>
                <th className="p-4">Nama</th>
                <th className="p-4">Email</th>
                <th className="p-4">Lokasi</th>
                <th className="p-4 text-right">Aksi</th>
                </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
                {activeStaff.map(s => (
                <tr key={s.id} className="hover:bg-slate-50">
                    <td className="p-4 font-medium text-slate-800 flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xs font-bold">{s.name.charAt(0)}</div>
                        {s.name}
                    </td>
                    <td className="p-4 text-slate-600">{s.email}</td>
                    <td className="p-4 text-slate-600">
                        {locations.find(l => l.id === s.locationId)?.name || <span className="text-red-400 italic">Belum Ditugaskan</span>}
                    </td>
                    <td className="p-4 text-right">
                    <button onClick={() => { setFormData(s); setIsEditing(true); }} className="text-blue-600 hover:underline text-sm">Edit</button>
                    </td>
                </tr>
                ))}
                {activeStaff.length === 0 && (
                    <tr><td colSpan={4} className="p-8 text-center text-slate-400 italic">Belum ada staff aktif.</td></tr>
                )}
            </tbody>
            </table>
        </div>
      </div>
      )}
    </div>
  );
};

// --- SERVICES ---
export const ServiceConfiguration: React.FC = () => {
  const [services, setServices] = useState<Service[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<Partial<Service>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchServices();
  }, []);

  const fetchServices = async () => {
    setLoading(true);
    const data = await SupabaseService.getServices();
    setServices(data);
    setLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.name && formData.price) {
      await SupabaseService.saveService({
        id: formData.id || `svc-${Date.now()}`,
        name: formData.name,
        price: Number(formData.price),
        unit: formData.unit || 'item',
        description: formData.description || '',
        durationHours: Number(formData.durationHours) || 48 // Default 48h
      });
      setIsEditing(false);
      setFormData({});
      fetchServices();
    }
  };

  const handleDelete = async (id: string) => {
      if(window.confirm("Yakin ingin menghapus layanan ini?")) {
          await SupabaseService.deleteService(id);
          fetchServices();
      }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-slate-800">Layanan & Harga</h2>
        <button onClick={() => { setFormData({}); setIsEditing(true); }} className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition">
          <Plus size={18} /> Tambah Layanan
        </button>
      </div>

      {isEditing && (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
           <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <input placeholder="Nama Layanan" className="border p-2 rounded" value={formData.name || ''} onChange={e => setFormData({...formData, name: e.target.value})} required />
            <input placeholder="Harga" type="number" step="100" className="border p-2 rounded" value={formData.price || ''} onChange={e => setFormData({...formData, price: parseFloat(e.target.value)})} required />
            <input placeholder="Satuan (kg, item)" className="border p-2 rounded" value={formData.unit || ''} onChange={e => setFormData({...formData, unit: e.target.value})} required />
            <input placeholder="Estimasi (Jam)" type="number" className="border p-2 rounded" value={formData.durationHours || ''} onChange={e => setFormData({...formData, durationHours: parseFloat(e.target.value)})} title="Lama pengerjaan dalam jam" />
            <input placeholder="Deskripsi" className="border p-2 rounded" value={formData.description || ''} onChange={e => setFormData({...formData, description: e.target.value})} />
            
            <div className="col-span-1 md:col-span-5 flex gap-2">
                <button type="submit" className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700">Simpan</button>
                <button type="button" onClick={() => setIsEditing(false)} className="bg-slate-300 text-slate-800 px-4 py-2 rounded hover:bg-slate-400">Batal</button>
            </div>
           </form>
        </div>
      )}

      {loading ? <div className="text-center p-8 text-slate-500"><Loader2 className="animate-spin inline mr-2"/> Memuat layanan...</div> : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {services.map(svc => (
            <div key={svc.id} className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex flex-col justify-between">
                <div>
                    <div className="flex justify-between items-start">
                        <h3 className="font-bold text-lg text-slate-800">{svc.name}</h3>
                        <Tag size={20} className="text-slate-400" />
                    </div>
                    <p className="text-2xl font-bold text-blue-600 mt-2">Rp {svc.price.toLocaleString('id-ID')} <span className="text-sm text-slate-500 font-normal">/ {svc.unit}</span></p>
                    
                    <div className="flex items-center gap-1 mt-2 text-xs text-orange-600 font-medium bg-orange-50 w-fit px-2 py-1 rounded">
                        <Clock size={12} />
                        Estimasi: {svc.durationHours ? `${svc.durationHours} Jam` : '2 Hari (Default)'}
                    </div>

                    <p className="text-slate-500 text-sm mt-2">{svc.description}</p>
                </div>
                <div className="flex justify-end gap-2 mt-4 pt-4 border-t border-slate-100">
                <button onClick={() => { setFormData(svc); setIsEditing(true); }} className="text-blue-600 text-sm font-medium hover:underline">Edit</button>
                <button onClick={() => handleDelete(svc.id)} className="text-red-500 text-sm font-medium hover:underline">Hapus</button>
                </div>
            </div>
            ))}
        </div>
      )}
    </div>
  );
};
