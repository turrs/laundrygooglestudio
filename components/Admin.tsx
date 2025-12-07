import React, { useState, useEffect } from 'react';
import { Location, User, Service, UserRole } from '../types';
import { SupabaseService } from '../migration/SupabaseService';
import { supabase } from '../migration/supabaseClient';
import { MapPin, Users, Tag, Trash2, Plus, Edit2, Loader2 } from 'lucide-react';

// --- LOCATIONS ---
export const LocationManagement: React.FC = () => {
  const [locations, setLocations] = useState<Location[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<Partial<Location>>({});
  const [loading, setLoading] = useState(true);

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
    if(window.confirm("Are you sure?")) {
        await SupabaseService.deleteLocation(id);
        fetchLocations();
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-slate-800">Locations</h2>
        <button onClick={() => { setFormData({}); setIsEditing(true); }} className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition">
          <Plus size={18} /> Add Location
        </button>
      </div>

      {isEditing && (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <h3 className="text-lg font-semibold mb-4">{formData.id ? 'Edit' : 'New'} Location</h3>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <input 
              placeholder="Store Name" 
              className="border p-2 rounded" 
              value={formData.name || ''} 
              onChange={e => setFormData({...formData, name: e.target.value})} 
              required 
            />
            <input 
              placeholder="Address" 
              className="border p-2 rounded" 
              value={formData.address || ''} 
              onChange={e => setFormData({...formData, address: e.target.value})} 
              required 
            />
            <input 
              placeholder="Phone" 
              className="border p-2 rounded" 
              value={formData.phone || ''} 
              onChange={e => setFormData({...formData, phone: e.target.value})} 
              required 
            />
            <div className="flex gap-2">
              <button type="submit" className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700">Save</button>
              <button type="button" onClick={() => setIsEditing(false)} className="bg-slate-300 text-slate-800 px-4 py-2 rounded hover:bg-slate-400">Cancel</button>
            </div>
          </form>
        </div>
      )}

      {loading ? <p>Loading locations...</p> : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {locations.map(loc => (
            <div key={loc.id} className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 hover:shadow-md transition">
                <div className="flex justify-between items-start mb-4">
                <div className="bg-blue-100 p-3 rounded-full text-blue-600">
                    <MapPin size={24} />
                </div>
                <div className="flex gap-2">
                    <button onClick={() => { setFormData(loc); setIsEditing(true); }} className="text-slate-400 hover:text-blue-600"><Edit2 size={18} /></button>
                    <button onClick={() => handleDelete(loc.id)} className="text-slate-400 hover:text-red-600"><Trash2 size={18} /></button>
                </div>
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
    const [locs, allCustomers] = await Promise.all([
        SupabaseService.getLocations(),
        // We need to fetch profiles that are STAFF. 
        // Note: Standard Supabase client query.
        supabase.from('profiles').select('*').eq('role', 'STAFF')
    ]);
    
    setLocations(locs);
    if(allCustomers.data) {
        setStaff(allCustomers.data.map((p: any) => ({
            id: p.id,
            name: p.name,
            email: p.email,
            role: p.role as UserRole,
            locationId: p.location_id
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
          // Create new profile (Note: This doesn't create an Auth User, just a Profile record for the list)
          // In a real app, you would use an Admin function to create the Auth user.
          await supabase.from('profiles').insert([{ ...payload, id: crypto.randomUUID() }]);
      }
      
      setIsEditing(false);
      setFormData({});
      fetchData();
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-slate-800">Staff Management</h2>
        <button onClick={() => { setFormData({}); setIsEditing(true); }} className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition">
          <Plus size={18} /> Add Staff
        </button>
      </div>

      {isEditing && (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input placeholder="Name" className="border p-2 rounded" value={formData.name || ''} onChange={e => setFormData({...formData, name: e.target.value})} required />
            <input placeholder="Email" type="email" className="border p-2 rounded" value={formData.email || ''} onChange={e => setFormData({...formData, email: e.target.value})} required />
            <select className="border p-2 rounded" value={formData.locationId || ''} onChange={e => setFormData({...formData, locationId: e.target.value})} required>
                <option value="">Select Location</option>
                {locations.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
            </select>
            <div className="col-span-1 md:col-span-2 flex gap-2">
              <button type="submit" className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700">Save Staff</button>
              <button type="button" onClick={() => setIsEditing(false)} className="bg-slate-300 text-slate-800 px-4 py-2 rounded hover:bg-slate-400">Cancel</button>
            </div>
            <p className="col-span-2 text-xs text-orange-500">Note: This creates a staff profile record. To allow them to login, an Auth User must be created in the Supabase Dashboard matching this email.</p>
          </form>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-slate-50 text-slate-500 font-medium">
            <tr>
              <th className="p-4">Name</th>
              <th className="p-4">Email</th>
              <th className="p-4">Assigned Location</th>
              <th className="p-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {staff.map(s => (
              <tr key={s.id} className="hover:bg-slate-50">
                <td className="p-4 font-medium text-slate-800 flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xs font-bold">{s.name.charAt(0)}</div>
                    {s.name}
                </td>
                <td className="p-4 text-slate-600">{s.email}</td>
                <td className="p-4 text-slate-600">
                    {locations.find(l => l.id === s.locationId)?.name || <span className="text-red-400 italic">Unassigned</span>}
                </td>
                <td className="p-4 text-right">
                  <button onClick={() => { setFormData(s); setIsEditing(true); }} className="text-blue-600 hover:underline text-sm">Edit</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
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
        description: formData.description || ''
      });
      setIsEditing(false);
      setFormData({});
      fetchServices();
    }
  };

  const handleDelete = async (id: string) => {
      if(window.confirm("Are you sure?")) {
          await SupabaseService.deleteService(id);
          fetchServices();
      }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-slate-800">Services & Pricing</h2>
        <button onClick={() => { setFormData({}); setIsEditing(true); }} className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition">
          <Plus size={18} /> Add Service
        </button>
      </div>

      {isEditing && (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
           <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <input placeholder="Service Name" className="border p-2 rounded" value={formData.name || ''} onChange={e => setFormData({...formData, name: e.target.value})} required />
            <input placeholder="Price" type="number" step="0.01" className="border p-2 rounded" value={formData.price || ''} onChange={e => setFormData({...formData, price: parseFloat(e.target.value)})} required />
            <input placeholder="Unit (e.g. kg, item)" className="border p-2 rounded" value={formData.unit || ''} onChange={e => setFormData({...formData, unit: e.target.value})} required />
            <input placeholder="Description" className="border p-2 rounded" value={formData.description || ''} onChange={e => setFormData({...formData, description: e.target.value})} />
            <div className="col-span-1 md:col-span-4 flex gap-2">
                <button type="submit" className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700">Save Service</button>
                <button type="button" onClick={() => setIsEditing(false)} className="bg-slate-300 text-slate-800 px-4 py-2 rounded hover:bg-slate-400">Cancel</button>
            </div>
           </form>
        </div>
      )}

      {loading ? <p>Loading services...</p> : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {services.map(svc => (
            <div key={svc.id} className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex flex-col justify-between">
                <div>
                    <div className="flex justify-between items-start">
                        <h3 className="font-bold text-lg text-slate-800">{svc.name}</h3>
                        <Tag size={20} className="text-slate-400" />
                    </div>
                    <p className="text-2xl font-bold text-blue-600 mt-2">${svc.price.toFixed(2)} <span className="text-sm text-slate-500 font-normal">/ {svc.unit}</span></p>
                    <p className="text-slate-500 text-sm mt-2">{svc.description}</p>
                </div>
                <div className="flex justify-end gap-2 mt-4 pt-4 border-t border-slate-100">
                <button onClick={() => { setFormData(svc); setIsEditing(true); }} className="text-blue-600 text-sm font-medium hover:underline">Edit</button>
                <button onClick={() => handleDelete(svc.id)} className="text-red-500 text-sm font-medium hover:underline">Delete</button>
                </div>
            </div>
            ))}
        </div>
      )}
    </div>
  );
};