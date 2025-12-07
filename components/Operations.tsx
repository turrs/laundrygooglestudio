import React, { useState, useEffect } from 'react';
import { Order, Customer, OrderStatus, Service, Location, User, UserRole } from '../types';
import { SupabaseService } from '../migration/SupabaseService';
import { supabase } from '../migration/supabaseClient';
import { ShoppingBag, Clock, CheckCircle, Package, User as UserIcon, Plus, Search, Printer, MessageCircle, X, CheckSquare, ChevronRight, Phone, Loader2, ArrowRight, Send } from 'lucide-react';

// --- CUSTOMERS ---
export const CustomerManagement: React.FC = () => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<Partial<Customer>>({});
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCustomers();
  }, [isEditing]);

  const fetchCustomers = async () => {
      // Avoid spinner if we already have data and are just refreshing
      if (customers.length === 0) setLoading(true);
      const data = await SupabaseService.getCustomers();
      setCustomers(data);
      setLoading(false);
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await SupabaseService.saveCustomer({
      id: formData.id || `cust-${Date.now()}`,
      name: formData.name || 'Unknown',
      phone: formData.phone || '',
      email: formData.email || '',
      address: formData.address || '',
      notes: formData.notes
    });
    setIsEditing(false);
    setFormData({});
  };

  const filteredCustomers = customers.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    c.phone.includes(searchTerm)
  );

  return (
    <div className="space-y-6 animate-fade-in pb-20 md:pb-0">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <h2 className="text-2xl font-bold text-slate-800">Pelanggan</h2>
        <div className="flex gap-2 w-full md:w-auto">
            <div className="relative flex-1 md:w-64">
                <Search className="absolute left-3 top-2.5 text-slate-400" size={18} />
                <input 
                    type="text" 
                    placeholder="Cari nama atau telepon..." 
                    className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                />
            </div>
            <button onClick={() => { setFormData({}); setIsEditing(true); }} className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition shadow-sm">
            <Plus size={18} /> Tambah
            </button>
        </div>
      </div>

      {isEditing && (
        <div className="bg-white p-6 rounded-xl shadow-lg border border-slate-200 relative z-10">
           <h3 className="text-lg font-bold mb-4">{formData.id ? 'Edit Pelanggan' : 'Pelanggan Baru'}</h3>
           <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Nama Lengkap</label>
                  <input className="w-full border border-slate-300 p-2 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" value={formData.name || ''} onChange={e => setFormData({...formData, name: e.target.value})} required />
              </div>
              <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">No. Telepon (WhatsApp)</label>
                  <input className="w-full border border-slate-300 p-2 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" value={formData.phone || ''} onChange={e => setFormData({...formData, phone: e.target.value})} required />
              </div>
              <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Email (Opsional)</label>
                  <input className="w-full border border-slate-300 p-2 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" value={formData.email || ''} onChange={e => setFormData({...formData, email: e.target.value})} />
              </div>
              <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Alamat</label>
                  <input className="w-full border border-slate-300 p-2 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" value={formData.address || ''} onChange={e => setFormData({...formData, address: e.target.value})} />
              </div>
              <div className="col-span-1 md:col-span-2 flex gap-3 mt-4 justify-end">
                 <button type="button" onClick={() => setIsEditing(false)} className="px-5 py-2 text-slate-600 hover:bg-slate-100 rounded-lg">Batal</button>
                 <button type="submit" className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 shadow-md">Simpan</button>
              </div>
           </form>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        {loading ? <div className="p-8 text-center text-slate-500"><Loader2 className="animate-spin inline mr-2" /> Loading Customers...</div> : (
        <table className="w-full text-left">
           <thead className="bg-slate-50 text-slate-500 font-semibold text-sm uppercase tracking-wider">
             <tr>
               <th className="p-4">Nama</th>
               <th className="p-4">Kontak</th>
               <th className="p-4">Alamat</th>
               <th className="p-4 text-right">Aksi</th>
             </tr>
           </thead>
           <tbody className="divide-y divide-slate-100">
             {filteredCustomers.map(c => (
               <tr key={c.id} className="hover:bg-slate-50 transition-colors">
                 <td className="p-4 font-medium text-slate-800">{c.name}</td>
                 <td className="p-4 text-slate-600 text-sm">
                   <div className="flex items-center gap-1"><Phone size={12}/> {c.phone}</div>
                   {c.email && <div className="text-slate-400 text-xs">{c.email}</div>}
                 </td>
                 <td className="p-4 text-slate-600 text-sm">{c.address || '-'}</td>
                 <td className="p-4 text-right">
                   <button onClick={() => { setFormData(c); setIsEditing(true); }} className="text-blue-600 text-sm font-medium hover:underline">Edit</button>
                 </td>
               </tr>
             ))}
             {filteredCustomers.length === 0 && (
                <tr>
                    <td colSpan={4} className="p-8 text-center text-slate-400">Tidak ada pelanggan ditemukan.</td>
                </tr>
             )}
           </tbody>
        </table>
        )}
      </div>
    </div>
  );
};

// --- ORDERS ---

interface OrderManagementProps {
  currentUser?: User;
}

export const OrderManagement: React.FC<OrderManagementProps> = ({ currentUser }) => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [view, setView] = useState<'LIST' | 'NEW'>('LIST');
  const [services, setServices] = useState<Service[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [staffList, setStaffList] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  // New Order State
  const [newOrderCustId, setNewOrderCustId] = useState('');
  const [newOrderLocId, setNewOrderLocId] = useState('');
  const [perfume, setPerfume] = useState('Standard');
  const [receivedBy, setReceivedBy] = useState('');
  const [cart, setCart] = useState<{serviceId: string, quantity: number}[]>([]);
  
  // New Customer Modal State
  const [isNewCustModalOpen, setIsNewCustModalOpen] = useState(false);
  const [newCustName, setNewCustName] = useState('');
  const [newCustPhone, setNewCustPhone] = useState('');

  // Ready Status Modal State
  const [isReadyModalOpen, setIsReadyModalOpen] = useState(false);
  const [orderToReady, setOrderToReady] = useState<Order | null>(null);
  const [completionStaff, setCompletionStaff] = useState('');
  const [sendWaNotification, setSendWaNotification] = useState(true);

  // Success State
  const [lastOrder, setLastOrder] = useState<Order | null>(null);

  useEffect(() => {
    // Optimization: Only fetch initial data if we haven't loaded anything yet.
    if (orders.length === 0 && loading) {
        fetchInitialData();
    }
    
    // Default receivedBy to currentUser if available
    if (currentUser && !receivedBy) {
      setReceivedBy(currentUser.name);
    }
    // Default location if user has one
    if (currentUser?.locationId && !newOrderLocId) {
        setNewOrderLocId(currentUser.locationId);
    }
  }, [currentUser]); 

  const fetchInitialData = async () => {
      setLoading(true);
      const [o, s, c, l, p] = await Promise.all([
          SupabaseService.getOrders(),
          SupabaseService.getServices(),
          SupabaseService.getCustomers(),
          SupabaseService.getLocations(),
          supabase.from('profiles').select('*') 
      ]);

      setOrders(o);
      setServices(s);
      setCustomers(c);
      setLocations(l);
      
      if(p.data) {
        const users = p.data.map((u: any) => ({
             id: u.id,
             name: u.name,
             email: u.email,
             role: u.role,
             locationId: u.location_id
        }));
        setStaffList(users);
      }
      setLoading(false);
  }

  const addToCart = (serviceId: string) => {
    setCart(prev => {
      const existing = prev.find(i => i.serviceId === serviceId);
      if (existing) {
        return prev.map(i => i.serviceId === serviceId ? {...i, quantity: i.quantity + 1} : i);
      }
      return [...prev, { serviceId, quantity: 1 }];
    });
  };

  const updateQuantity = (serviceId: string, qty: number) => {
    if (qty <= 0) {
      setCart(prev => prev.filter(i => i.serviceId !== serviceId));
    } else {
      setCart(prev => prev.map(i => i.serviceId === serviceId ? {...i, quantity: qty} : i));
    }
  };

  const handleQuickAddCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newCustName && newCustPhone) {
      const newCust: Customer = {
        id: `cust-${Date.now()}`,
        name: newCustName,
        phone: newCustPhone,
        email: '',
        address: ''
      };
      await SupabaseService.saveCustomer(newCust);
      setCustomers(prev => [...prev, newCust]);
      setNewOrderCustId(newCust.id);
      setIsNewCustModalOpen(false);
      setNewCustName('');
      setNewCustPhone('');
    }
  };

  const submitOrder = async () => {
    if (!newOrderCustId || !newOrderLocId || cart.length === 0) return;
    
    const customer = customers.find(c => c.id === newOrderCustId);
    if (!customer) return;

    const orderItems = cart.map(item => {
      const svc = services.find(s => s.id === item.serviceId)!;
      return {
        serviceId: svc.id,
        serviceName: svc.name,
        price: svc.price,
        quantity: item.quantity
      };
    });

    const total = orderItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);

    const newOrder: Order = {
      id: `ord-${Date.now()}`,
      customerId: customer.id,
      customerName: customer.name,
      locationId: newOrderLocId,
      status: OrderStatus.PENDING,
      totalAmount: total,
      items: orderItems,
      perfume,
      receivedBy, 
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const savedOrder = await SupabaseService.saveOrder(newOrder);
    setOrders(prev => [savedOrder, ...prev]);
    setLastOrder(savedOrder); 
    setCart([]);
    setNewOrderCustId('');
  };

  // Helper for WhatsApp
  const sendWhatsApp = (phone: string, message: string) => {
    let formatted = phone.replace(/\D/g, '');
    if (formatted.startsWith('0')) formatted = '62' + formatted.substring(1);
    if (!formatted.startsWith('62')) formatted = '62' + formatted; // Default to ID if no code
    const url = `https://wa.me/${formatted}?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
  };

  const handleSendWaNewOrder = (order: Order) => {
    const customer = customers.find(c => c.id === order.customerId);
    if (!customer) return;
    
    const trackingLink = `${window.location.origin}?trackingId=${order.id}`;
    const msg = `Halo ${customer.name}, pesanan laundry #${order.id.slice(0, 8)} telah diterima.\n\nTotal: $${order.totalAmount.toFixed(2)}\nItem: ${order.items.length}\n\nPantau status pesanan: ${trackingLink}\n\nTerima kasih!`;
    sendWhatsApp(customer.phone, msg);
  };

  const initiateStatusUpdate = (order: Order, newStatus: OrderStatus) => {
    if (newStatus === OrderStatus.READY) {
      setOrderToReady(order);
      setCompletionStaff(currentUser?.name || '');
      setSendWaNotification(true); // Default checked
      setIsReadyModalOpen(true);
    } else {
      updateStatus(order.id, newStatus);
    }
  };

  const updateStatus = async (orderId: string, status: OrderStatus, staffName?: string) => {
    // 1. Optimistic Update
    setOrders(prevOrders => prevOrders.map(o => 
        o.id === orderId 
        ? { ...o, status, completedBy: staffName || o.completedBy, updatedAt: new Date().toISOString() } 
        : o
    ));
    
    // 2. Handle WhatsApp Notification for READY status
    if (status === OrderStatus.READY && sendWaNotification) {
       // Need to find order details to get customerId. 
       // We can use 'orderToReady' if available, or find in 'orders' (before update logic runs, but we have optimistic state)
       // Safer to use the order object if we have it.
       const targetOrder = orderToReady || orders.find(o => o.id === orderId);
       if (targetOrder) {
           const customer = customers.find(c => c.id === targetOrder.customerId);
           if (customer) {
               const trackingLink = `${window.location.origin}?trackingId=${targetOrder.id}`;
               const msg = `Halo ${customer.name}, Laundry #${targetOrder.id.slice(0, 8)} sudah SELESAI dan siap diambil! \n\nTotal: $${targetOrder.totalAmount.toFixed(2)}\n\nTerima kasih telah mempercayakan laundry Anda kepada kami.`;
               sendWhatsApp(customer.phone, msg);
           }
       }
    }

    // 3. Close modal & cleanup
    setIsReadyModalOpen(false);
    setOrderToReady(null);

    // 4. Send to server
    try {
        await SupabaseService.updateOrderStatus(orderId, status, staffName);
    } catch (error) {
        console.error("Failed to update status", error);
    }
  };

  if (view === 'NEW') {
    if (lastOrder) {
      return (
        <div className="flex flex-col items-center justify-center h-full p-8 animate-fade-in text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center text-green-600 mb-4">
            <CheckCircle size={32} />
          </div>
          <h2 className="text-2xl font-bold text-slate-800">Pesanan Berhasil Dibuat!</h2>
          <p className="text-slate-500 mt-2">Order ID: #{lastOrder.id.slice(0, 8)}</p>
          <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 mt-6 w-full max-w-md text-sm text-left">
             <div className="flex justify-between mb-2"><span>Total</span><span className="font-bold">${lastOrder.totalAmount.toFixed(2)}</span></div>
             <div className="flex justify-between mb-2"><span>Customer</span><span>{lastOrder.customerName}</span></div>
             <div className="flex justify-between"><span>Tracking Link</span><span className="text-blue-600 underline cursor-pointer" onClick={() => navigator.clipboard.writeText(`${window.location.origin}?trackingId=${lastOrder.id}`)}>Copy Link</span></div>
          </div>
          
          <div className="mt-6 w-full max-w-md">
             <button 
                onClick={() => handleSendWaNewOrder(lastOrder)}
                className="w-full bg-green-500 hover:bg-green-600 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 mb-4 shadow-md transition-all"
             >
                <MessageCircle size={20} /> Kirim Nota WhatsApp
             </button>
             
             <div className="flex gap-4">
                <button onClick={() => setLastOrder(null)} className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700">Buat Baru</button>
                <button onClick={() => { setLastOrder(null); setView('LIST'); }} className="flex-1 text-slate-600 py-2 rounded-lg hover:bg-slate-100 border border-slate-200">Ke Daftar</button>
             </div>
          </div>
        </div>
      );
    }

    const currentCustomer = customers.find(c => c.id === newOrderCustId);
    const cartTotal = cart.reduce((sum, item) => {
      const svc = services.find(s => s.id === item.serviceId);
      return sum + (svc ? svc.price * item.quantity : 0);
    }, 0);

    return (
      <div className="h-full flex flex-col md:flex-row gap-6 animate-fade-in overflow-hidden relative">
        {/* Left: Selection - Scrollable on mobile/desktop */}
        <div className="flex-1 flex flex-col overflow-y-auto md:overflow-y-auto pb-40 md:pb-0">
          <div className="flex items-center gap-4 mb-4 shrink-0">
             <button onClick={() => setView('LIST')} className="p-2 hover:bg-slate-100 rounded-full text-slate-500"><ArrowRight className="rotate-180" /></button>
             <h2 className="text-2xl font-bold text-slate-800">Buat Pesanan Baru</h2>
          </div>
          
          <div className="space-y-6">
             {/* Customer & Location */}
             <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                   <label className="block text-sm font-medium text-slate-700 mb-1">Pelanggan</label>
                   <div className="flex gap-2">
                     <select 
                        className="flex-1 border border-slate-300 p-2 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                        value={newOrderCustId}
                        onChange={e => setNewOrderCustId(e.target.value)}
                     >
                        <option value="">-- Pilih Pelanggan --</option>
                        {customers.map(c => <option key={c.id} value={c.id}>{c.name} - {c.phone}</option>)}
                     </select>
                     <button onClick={() => setIsNewCustModalOpen(true)} className="bg-blue-100 text-blue-600 p-2 rounded-lg hover:bg-blue-200"><Plus size={20}/></button>
                   </div>
                </div>
                <div>
                   <label className="block text-sm font-medium text-slate-700 mb-1">Lokasi Outlet</label>
                   <select 
                      className="w-full border border-slate-300 p-2 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                      value={newOrderLocId}
                      onChange={e => setNewOrderLocId(e.target.value)}
                   >
                      <option value="">-- Pilih Lokasi --</option>
                      {locations.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
                   </select>
                </div>
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Diterima Oleh (Kasir)</label>
                    <select
                        className="w-full border border-slate-300 p-2 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                        value={receivedBy}
                        onChange={e => setReceivedBy(e.target.value)}
                    >
                        <option value="">-- Pilih Pegawai --</option>
                        {staffList.map(staff => (
                            <option key={staff.id} value={staff.name}>{staff.name} ({staff.role})</option>
                        ))}
                    </select>
                </div>
                <div>
                   <label className="block text-sm font-medium text-slate-700 mb-1">Pewangi</label>
                   <select 
                      className="w-full border border-slate-300 p-2 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                      value={perfume}
                      onChange={e => setPerfume(e.target.value)}
                   >
                      <option>Standard</option>
                      <option>Lavender</option>
                      <option>Lily</option>
                      <option>Ocean Fresh</option>
                      <option>Sakura</option>
                   </select>
                </div>
             </div>

             {/* Services Grid */}
             <div>
                <h3 className="font-bold text-slate-700 mb-3">Pilih Layanan</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                   {services.map(svc => (
                     <div key={svc.id} onClick={() => addToCart(svc.id)} className="bg-white p-4 rounded-xl border border-slate-200 hover:border-blue-500 hover:shadow-md cursor-pointer transition flex flex-col items-center text-center group">
                        <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mb-2 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                            <Package size={20} />
                        </div>
                        <span className="font-semibold text-slate-800 text-sm">{svc.name}</span>
                        <span className="text-xs text-slate-500">${svc.price}/{svc.unit}</span>
                     </div>
                   ))}
                </div>
             </div>
          </div>
        </div>

        {/* Right: Cart Summary - Sticky on mobile bottom, Sidebar on Desktop */}
        <div className="fixed bottom-0 left-0 right-0 md:static w-full md:w-80 bg-white border-t md:border-t-0 md:border-l border-slate-200 flex flex-col md:h-full shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)] md:shadow-lg md:rounded-l-xl z-20 md:z-10 h-[250px] md:h-auto">
           {/* Mobile Handle / Header */}
           <div className="p-3 border-b border-slate-100 bg-slate-50 flex justify-between items-center md:block">
              <h3 className="font-bold text-slate-800 flex items-center gap-2"><ShoppingBag size={18}/> Ringkasan <span className="md:hidden">({cart.length} item)</span></h3>
              {currentCustomer && <p className="text-xs text-slate-500 mt-1 hidden md:block">Cust: {currentCustomer.name}</p>}
              {/* Mobile Only: Collapse toggle could go here, but fixed height is easier for now */}
           </div>
           
           <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {cart.length === 0 ? (
                <div className="text-center text-slate-400 mt-10 text-sm">Keranjang kosong. <br/>Pilih layanan.</div>
              ) : (
                cart.map(item => {
                   const svc = services.find(s => s.id === item.serviceId)!;
                   return (
                     <div key={item.serviceId} className="flex justify-between items-center bg-slate-50 p-2 md:p-3 rounded-lg border border-slate-100">
                        <div>
                           <div className="font-medium text-slate-700 text-sm">{svc.name}</div>
                           <div className="text-xs text-slate-500">${svc.price} x {item.quantity}</div>
                        </div>
                        <div className="flex items-center gap-2">
                           <button onClick={() => updateQuantity(item.serviceId, item.quantity - 1)} className="w-6 h-6 bg-white border rounded flex items-center justify-center text-slate-600 hover:bg-slate-100">-</button>
                           <span className="text-sm font-medium w-4 text-center">{item.quantity}</span>
                           <button onClick={() => updateQuantity(item.serviceId, item.quantity + 1)} className="w-6 h-6 bg-white border rounded flex items-center justify-center text-slate-600 hover:bg-slate-100">+</button>
                        </div>
                     </div>
                   );
                })
              )}
           </div>

           <div className="p-4 border-t border-slate-100 bg-slate-50 shrink-0">
              <div className="flex justify-between items-center mb-3">
                 <span className="text-slate-600">Total</span>
                 <span className="text-2xl font-bold text-blue-600">${cartTotal.toFixed(2)}</span>
              </div>
              <button 
                onClick={submitOrder} 
                disabled={cart.length === 0 || !newOrderCustId || !newOrderLocId}
                className="w-full bg-blue-600 text-white py-3 rounded-xl font-bold hover:bg-blue-700 disabled:bg-slate-300 disabled:cursor-not-allowed transition shadow-lg shadow-blue-200"
              >
                 Buat Pesanan
              </button>
           </div>
        </div>

        {/* Modal: New Customer */}
        {isNewCustModalOpen && (
           <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-sm">
                 <h3 className="font-bold text-lg mb-4">Pelanggan Cepat</h3>
                 <form onSubmit={handleQuickAddCustomer} className="space-y-4">
                    <input placeholder="Nama" className="w-full border p-2 rounded" value={newCustName} onChange={e => setNewCustName(e.target.value)} autoFocus />
                    <input placeholder="Telepon" className="w-full border p-2 rounded" value={newCustPhone} onChange={e => setNewCustPhone(e.target.value)} />
                    <div className="flex gap-2 justify-end mt-4">
                       <button type="button" onClick={() => setIsNewCustModalOpen(false)} className="px-4 py-2 text-slate-600">Batal</button>
                       <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded">Simpan</button>
                    </div>
                 </form>
              </div>
           </div>
        )}
      </div>
    );
  }

  // LIST VIEW
  return (
    <div className="space-y-6 animate-fade-in pb-20 md:pb-0">
       <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold text-slate-800">Daftar Pesanan</h2>
          <button onClick={() => setView('NEW')} className="bg-blue-600 text-white px-5 py-2 rounded-lg hover:bg-blue-700 shadow-md flex items-center gap-2">
             <Plus size={18} /> Pesanan Baru
          </button>
       </div>

       {loading ? <div className="p-10 text-center"><Loader2 className="animate-spin mx-auto text-blue-600 mb-2"/> Loading Orders...</div> : (
        <div className="grid grid-cols-1 gap-4">
           {orders.map(order => (
              <div key={order.id} className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition">
                 <div className="flex flex-col md:flex-row justify-between md:items-center gap-4 mb-4 border-b border-slate-50 pb-4">
                    <div>
                       <div className="flex items-center gap-2">
                          <span className="font-bold text-lg text-slate-800">#{order.id.slice(0, 8)}</span>
                          <span className={`px-2 py-0.5 rounded text-xs font-bold uppercase tracking-wide ${
                             order.status === 'COMPLETED' ? 'bg-green-100 text-green-700' :
                             order.status === 'READY' ? 'bg-blue-100 text-blue-700' :
                             'bg-yellow-100 text-yellow-700'
                          }`}>{order.status}</span>
                       </div>
                       <p className="text-slate-500 text-sm mt-1">Cust: <span className="font-medium text-slate-700">{order.customerName}</span> | {new Date(order.createdAt).toLocaleString()}</p>
                    </div>
                    <div className="text-right">
                       <div className="font-extrabold text-xl text-slate-800">${order.totalAmount.toFixed(2)}</div>
                       <div className="text-xs text-slate-400">Total</div>
                    </div>
                 </div>
                 
                 <div className="flex justify-between items-center">
                    <div className="text-sm text-slate-600 flex gap-4">
                        <span className="flex items-center gap-1"><UserIcon size={14}/> {order.receivedBy || '-'}</span>
                        <span className="flex items-center gap-1"><Package size={14}/> {order.items.length} items</span>
                    </div>
                    
                    <div className="flex gap-2">
                       {order.status === 'PENDING' && (
                          <button onClick={() => updateStatus(order.id, OrderStatus.PROCESSING)} className="bg-yellow-500 hover:bg-yellow-600 text-white px-3 py-1.5 rounded-lg text-sm font-medium transition">
                             Mulai Cuci
                          </button>
                       )}
                       {order.status === 'PROCESSING' && (
                          <button onClick={() => initiateStatusUpdate(order, OrderStatus.READY)} className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1.5 rounded-lg text-sm font-medium transition">
                             Selesai Cuci
                          </button>
                       )}
                       {order.status === 'READY' && (
                          <button onClick={() => updateStatus(order.id, OrderStatus.COMPLETED)} className="bg-green-600 hover:bg-green-700 text-white px-3 py-1.5 rounded-lg text-sm font-medium transition flex items-center gap-1">
                             <CheckSquare size={16}/> Ambil
                          </button>
                       )}
                       <button onClick={() => window.open(`/?trackingId=${order.id}`, '_blank')} className="text-blue-600 hover:bg-blue-50 px-3 py-1.5 rounded-lg text-sm transition border border-blue-200">
                          Tracking
                       </button>
                    </div>
                 </div>
              </div>
           ))}
           {orders.length === 0 && <div className="text-center p-10 text-slate-400 bg-slate-50 rounded-xl border border-dashed border-slate-300">Belum ada pesanan hari ini.</div>}
        </div>
       )}

       {/* Ready Modal */}
       {isReadyModalOpen && orderToReady && (
         <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-md">
               <h3 className="font-bold text-lg mb-4 text-slate-800">Konfirmasi Selesai Cuci</h3>
               <p className="text-slate-600 mb-4 text-sm">Siapa yang menyelesaikan tugas ini?</p>
               
               <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Dikerjakan Oleh</label>
               <select 
                  className="w-full border p-2 rounded mb-4 outline-none focus:ring-2 focus:ring-blue-500"
                  value={completionStaff}
                  onChange={e => setCompletionStaff(e.target.value)}
               >
                   <option value="">-- Pilih Pegawai --</option>
                   {staffList.map(s => <option key={s.id} value={s.name}>{s.name}</option>)}
               </select>

               <div className="bg-green-50 p-3 rounded-lg border border-green-100 mb-6 flex items-start gap-3">
                  <input 
                     type="checkbox" 
                     id="sendWa" 
                     className="mt-1 w-4 h-4 text-green-600 rounded focus:ring-green-500"
                     checked={sendWaNotification}
                     onChange={e => setSendWaNotification(e.target.checked)}
                  />
                  <label htmlFor="sendWa" className="text-sm text-green-800 cursor-pointer select-none">
                     Kirim Notifikasi WhatsApp ke Pelanggan <br/>
                     <span className="text-xs text-green-600 font-normal">Pesan: "Laundry sudah selesai dan siap diambil"</span>
                  </label>
               </div>

               <div className="flex gap-3 justify-end">
                  <button onClick={() => setIsReadyModalOpen(false)} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg transition">Batal</button>
                  <button 
                    onClick={() => updateStatus(orderToReady.id, OrderStatus.READY, completionStaff)} 
                    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 shadow-md transition"
                  >
                    Simpan & Update
                  </button>
               </div>
            </div>
         </div>
       )}
    </div>
  );
};