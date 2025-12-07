import React, { useState, useEffect } from 'react';
import { Order, Customer, OrderStatus, Service, Location, User, UserRole } from '../types';
import { SupabaseService } from '../migration/SupabaseService';
import { supabase } from '../migration/supabaseClient';
import { ShoppingBag, Clock, CheckCircle, Package, User as UserIcon, Plus, Search, Printer, MessageCircle, X, CheckSquare, ChevronRight, Phone, Loader2 } from 'lucide-react';

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
      setLoading(true);
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
    <div className="space-y-6 animate-fade-in">
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

  // Success State
  const [lastOrder, setLastOrder] = useState<Order | null>(null);

  useEffect(() => {
    fetchInitialData();
    if (currentUser) {
      setReceivedBy(currentUser.name);
    }
  }, [view, currentUser]);

  const fetchInitialData = async () => {
      setLoading(true);
      const [o, s, c, l, p] = await Promise.all([
          SupabaseService.getOrders(),
          SupabaseService.getServices(),
          SupabaseService.getCustomers(),
          SupabaseService.getLocations(),
          supabase.from('profiles').select('*').eq('role', 'STAFF') // Simple workaround for staff list
      ]);

      setOrders(o);
      setServices(s);
      setCustomers(c);
      setLocations(l);
      
      if(p.data) {
        // Map profiles to Users for the dropdown
        setStaffList(p.data.map((u: any) => ({
             id: u.id,
             name: u.name,
             email: u.email,
             role: u.role,
             locationId: u.location_id
        })));
        // Also add current user if they are owner
        if (currentUser && currentUser.role === UserRole.OWNER) {
            setStaffList(prev => [...prev, currentUser]);
        }
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
      
      // Refresh customers and select new one
      const updatedCustomers = await SupabaseService.getCustomers();
      setCustomers(updatedCustomers);
      // Try to find the one we just added (using name/phone as we might get a real UUID back if we changed logic, but here we used cust- timestamp)
      const added = updatedCustomers.find(c => c.name === newCustName && c.phone === newCustPhone);
      if(added) setNewOrderCustId(added.id);
      
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

    await SupabaseService.saveOrder(newOrder);
    setLastOrder(newOrder); 
    setCart([]);
    setNewOrderCustId('');
  };

  const initiateStatusUpdate = (order: Order, newStatus: OrderStatus) => {
    if (newStatus === OrderStatus.READY) {
      setOrderToReady(order);
      setCompletionStaff(currentUser?.name || '');
      setIsReadyModalOpen(true);
    } else {
      updateStatus(order, newStatus);
    }
  };

  const updateStatus = async (order: Order, status: OrderStatus, completedBy?: string) => {
    await SupabaseService.updateOrderStatus(order.id, status, completedBy);
    
    // Optimistic update
    const updated = { 
      ...order, 
      status, 
      updatedAt: new Date().toISOString(),
      ...(completedBy ? { completedBy } : {}) 
    };
    setOrders(prev => prev.map(o => o.id === updated.id ? updated : o));
  };

  const confirmReady = () => {
    if (orderToReady && completionStaff) {
      updateStatus(orderToReady, OrderStatus.READY, completionStaff);
      
      const cust = customers.find(c => c.id === orderToReady.customerId);
      if (cust && cust.phone) {
         // Indonesian Message
         const message = `Halo ${cust.name},%0A%0A` +
          `Kabar gembira! Pesanan laundry Anda #${orderToReady.id.slice(-6)} sudah SELESAI dan siap diambil.%0A` +
          `Diproses oleh: ${completionStaff}%0A` +
          `Total Tagihan: $${orderToReady.totalAmount.toFixed(2)}%0A%0A` +
          `Silakan datang untuk mengambil. Terima kasih!`;
         
         const phone = cust.phone.replace(/\D/g, '');
         window.open(`https://wa.me/${phone}?text=${message}`, '_blank');
      }

      setIsReadyModalOpen(false);
      setOrderToReady(null);
    }
  };

  const getStatusColor = (s: OrderStatus) => {
    switch (s) {
      case OrderStatus.PENDING: return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case OrderStatus.PROCESSING: return 'bg-blue-100 text-blue-800 border-blue-200';
      case OrderStatus.READY: return 'bg-purple-100 text-purple-800 border-purple-200';
      case OrderStatus.COMPLETED: return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const printReceipt = (order: Order) => {
    const w = window.open('', '', 'width=400,height=600');
    if (w) {
      const date = new Date(order.createdAt).toLocaleString('id-ID');
      const orderIdShort = order.id.slice(-6);
      
      // Indonesian Receipt Template
      w.document.write(`
        <html>
          <head>
            <title>Struk #${orderIdShort}</title>
            <style>
              body { font-family: 'Courier New', monospace; font-size: 12px; margin: 0; padding: 10px; width: 300px; }
              .header { text-align: center; margin-bottom: 15px; border-bottom: 2px dashed #000; padding-bottom: 10px; }
              .header h2 { margin: 0; font-size: 16px; text-transform: uppercase; }
              .info { margin-bottom: 10px; font-size: 11px; }
              .item { display: flex; justify-content: space-between; margin-bottom: 5px; }
              .item-details { width: 60%; }
              .item-price { width: 40%; text-align: right; }
              .divider { border-top: 1px dashed #000; margin: 10px 0; }
              .total { display: flex; justify-content: space-between; font-weight: bold; font-size: 14px; margin-top: 5px; }
              .footer { margin-top: 20px; text-align: center; font-size: 10px; border-top: 1px dashed #000; padding-top: 10px; }
            </style>
          </head>
          <body>
            <div class="header">
              <h2>LaunderLink Pro</h2>
              <div>Nota Pembayaran</div>
            </div>
            <div class="info">
              ID Pesanan: #${orderIdShort}<br/>
              Tanggal: ${date}<br/>
              Kasir: ${order.receivedBy || '-'}<br/>
              Selesai Oleh: ${order.completedBy || '-'}<br/>
              Pelanggan: ${order.customerName}<br/>
              Parfum: ${order.perfume || 'Standar'}
            </div>
            <div class="divider"></div>
            ${order.items.map(item => `
              <div class="item">
                <div class="item-details">${item.serviceName}<br/>${item.quantity} x $${item.price.toFixed(2)}</div>
                <div class="item-price">$${(item.quantity * item.price).toFixed(2)}</div>
              </div>
            `).join('')}
            <div class="divider"></div>
            <div class="total">
              <span>TOTAL TAGIHAN</span>
              <span>$${order.totalAmount.toFixed(2)}</span>
            </div>
            <div class="footer">
              Terima kasih atas kepercayaan Anda.<br/>
              Simpan struk ini sebagai bukti pengambilan.
            </div>
            <script>
              window.print();
              setTimeout(() => window.close(), 1000);
            </script>
          </body>
        </html>
      `);
      w.document.close();
    }
  };

  const sendWhatsApp = (order: Order) => {
    const cust = customers.find(c => c.id === order.customerId);
    if (!cust || !cust.phone) {
        alert("Nomor telepon pelanggan tidak ditemukan.");
        return;
    }

    const trackingUrl = `${window.location.origin}?trackingId=${order.id}`;

    // Indonesian Message
    const message = `Halo ${cust.name},%0A%0A` +
      `Pesanan laundry Anda #${order.id.slice(-6)} telah kami terima.%0A` +
      `Status saat ini: ${order.status}%0A` +
      `Total Tagihan: $${order.totalAmount.toFixed(2)}%0A%0A` +
      `Pantau status pesanan & beri ulasan di sini:%0A${trackingUrl}%0A%0A` +
      `Terima kasih telah menggunakan jasa LaunderLink!`;
    
    const phone = cust.phone.replace(/\D/g, '');
    window.open(`https://wa.me/${phone}?text=${message}`, '_blank');
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Ready Modal */}
      {isReadyModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-sm w-full transform transition-all scale-100">
            <h3 className="text-xl font-bold mb-4 flex items-center gap-2 text-indigo-700">
              <CheckSquare size={24}/> Selesaikan Pesanan
            </h3>
            <p className="text-sm text-slate-600 mb-6 leading-relaxed">
              Siapa pegawai yang telah menyelesaikan proses pengerjaan pesanan <strong>#{orderToReady?.id.slice(0,8)}</strong>?
            </p>
            <div className="mb-6">
               <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Nama Pegawai</label>
               <select 
                 className="w-full border-2 border-slate-200 p-3 rounded-xl bg-slate-50 focus:border-indigo-500 focus:bg-white outline-none transition-colors font-medium" 
                 value={completionStaff} 
                 onChange={(e) => setCompletionStaff(e.target.value)}
               >
                 <option value="">Pilih Pegawai...</option>
                 {staffList.map(u => <option key={u.id} value={u.name}>{u.name}</option>)}
               </select>
            </div>
            <div className="bg-green-50 p-4 rounded-xl text-xs text-green-800 mb-6 border border-green-100 flex gap-2">
              <MessageCircle size={16} className="shrink-0 mt-0.5" />
              <span>Pesan WhatsApp "Siap Diambil" akan otomatis terbuka setelah konfirmasi.</span>
            </div>
            <div className="flex gap-3 justify-end">
               <button onClick={() => setIsReadyModalOpen(false)} className="px-5 py-2.5 text-slate-600 hover:bg-slate-100 rounded-xl font-medium transition-colors">Batal</button>
               <button onClick={confirmReady} disabled={!completionStaff} className="px-5 py-2.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 disabled:bg-slate-300 disabled:cursor-not-allowed font-medium shadow-lg shadow-indigo-200 transition-all transform active:scale-95">
                  Konfirmasi & Kirim WA
               </button>
            </div>
          </div>
        </div>
      )}

      {/* Success Modal */}
      {lastOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-sm w-full text-center space-y-6 animate-scale-in">
            <div className="mx-auto w-20 h-20 bg-green-100 rounded-full flex items-center justify-center text-green-600 mb-2 ring-8 ring-green-50">
               <CheckCircle size={48} />
            </div>
            <div>
              <h2 className="text-2xl font-extrabold text-slate-800">Pesanan Dibuat!</h2>
              <p className="text-slate-500 mt-2 font-mono bg-slate-100 inline-block px-3 py-1 rounded-lg">ID: {lastOrder.id.slice(0,8)}</p>
            </div>
            
            <div className="space-y-3 pt-2">
               <button onClick={() => printReceipt(lastOrder)} className="w-full flex items-center justify-center gap-3 bg-slate-800 text-white py-3.5 rounded-xl hover:bg-slate-900 transition shadow-lg">
                  <Printer size={20} /> Cetak Struk
               </button>
               <button onClick={() => sendWhatsApp(lastOrder)} className="w-full flex items-center justify-center gap-3 bg-green-500 text-white py-3.5 rounded-xl hover:bg-green-600 transition shadow-lg shadow-green-200">
                  <MessageCircle size={20} /> Kirim WhatsApp
               </button>
               <button onClick={() => { setLastOrder(null); setView('LIST'); }} className="w-full text-slate-500 py-3 hover:text-slate-800 font-medium">
                  Tutup
               </button>
            </div>
          </div>
        </div>
      )}

      {/* New Order View */}
      {view === 'NEW' ? (
        <div className="space-y-6 relative animate-fade-in">
          {isNewCustModalOpen && (
             <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
                <div className="bg-white p-6 rounded-2xl shadow-xl w-full max-w-sm">
                   <h3 className="text-xl font-bold mb-6 text-slate-800">Pelanggan Baru</h3>
                   <form onSubmit={handleQuickAddCustomer} className="space-y-4">
                      <div>
                          <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Nama</label>
                          <input autoFocus className="w-full border-2 border-slate-200 p-3 rounded-xl outline-none focus:border-blue-500" value={newCustName} onChange={e => setNewCustName(e.target.value)} required />
                      </div>
                      <div>
                          <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Telepon</label>
                          <input className="w-full border-2 border-slate-200 p-3 rounded-xl outline-none focus:border-blue-500" value={newCustPhone} onChange={e => setNewCustPhone(e.target.value)} required />
                      </div>
                      <div className="flex gap-3 justify-end mt-6">
                         <button type="button" onClick={() => setIsNewCustModalOpen(false)} className="px-5 py-2.5 text-slate-600 hover:bg-slate-100 rounded-xl font-medium">Batal</button>
                         <button type="submit" className="px-5 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 font-medium shadow-lg">Simpan</button>
                      </div>
                   </form>
                </div>
             </div>
          )}

          <div className="flex items-center justify-between">
             <div className="flex items-center gap-2">
                <button onClick={() => setView('LIST')} className="bg-white border border-slate-200 p-2 rounded-lg hover:bg-slate-50 text-slate-600">
                    <ChevronRight size={20} className="rotate-180" />
                </button>
                <h2 className="text-2xl font-bold text-slate-800">Buat Pesanan Baru</h2>
             </div>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
             <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 space-y-6">
                <div className="flex items-center gap-2 border-b border-slate-100 pb-4">
                    <div className="bg-blue-100 p-2 rounded-lg text-blue-600"><CheckSquare size={20}/></div>
                    <h3 className="font-bold text-lg text-slate-800">Data Pesanan</h3>
                </div>
                
                <div className="grid grid-cols-2 gap-5">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Lokasi</label>
                    <select className="w-full border-2 border-slate-100 p-3 rounded-xl bg-slate-50 focus:bg-white focus:border-blue-500 outline-none transition" value={newOrderLocId} onChange={e => setNewOrderLocId(e.target.value)}>
                      <option value="">Pilih Lokasi...</option>
                      {locations.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
                    </select>
                  </div>
                  <div>
                     <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Penerima (Kasir)</label>
                     <input className="w-full border-2 border-slate-100 p-3 rounded-xl bg-slate-100 text-slate-500 font-medium" value={receivedBy} readOnly />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Pelanggan</label>
                  <div className="flex gap-2">
                     <select className="w-full border-2 border-slate-100 p-3 rounded-xl bg-slate-50 focus:bg-white focus:border-blue-500 outline-none transition" value={newOrderCustId} onChange={e => setNewOrderCustId(e.target.value)}>
                       <option value="">Pilih Pelanggan...</option>
                       {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                     </select>
                     <button onClick={() => setIsNewCustModalOpen(true)} className="bg-blue-600 text-white px-4 rounded-xl hover:bg-blue-700 shadow-md transition-transform active:scale-95">
                       <Plus size={24} />
                     </button>
                  </div>
                </div>

                <div>
                   <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Pilihan Parfum</label>
                   <select className="w-full border-2 border-slate-100 p-3 rounded-xl bg-slate-50 focus:bg-white focus:border-blue-500 outline-none transition" value={perfume} onChange={e => setPerfume(e.target.value)}>
                      <option value="Standard">Standard (Fresh)</option>
                      <option value="Lavender">Lavender</option>
                      <option value="Sakura">Sakura</option>
                      <option value="Lily">Lily</option>
                      <option value="Unscented">Tanpa Parfum</option>
                   </select>
                </div>

                <div className="pt-2">
                   <h4 className="font-bold text-sm text-slate-700 mb-3 flex items-center gap-2"><ShoppingBag size={16}/> Pilih Layanan</h4>
                   <div className="grid grid-cols-2 gap-3 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
                      {services.map(s => (
                         <button key={s.id} onClick={() => addToCart(s.id)} className="p-3 border-2 border-slate-100 rounded-xl hover:border-blue-500 hover:bg-blue-50 text-left transition-all group flex flex-col">
                            <span className="font-bold text-slate-700 group-hover:text-blue-700">{s.name}</span>
                            <span className="text-xs text-slate-500 font-medium mt-1">${s.price} / {s.unit}</span>
                         </button>
                      ))}
                   </div>
                </div>
             </div>

             <div className="bg-white p-6 rounded-2xl shadow-lg border border-slate-100 flex flex-col h-full ring-4 ring-slate-50">
                <h3 className="font-bold text-lg mb-6 border-b border-slate-100 pb-4 flex justify-between items-center">
                    <span>Keranjang</span>
                    <span className="text-sm font-normal text-slate-500">{cart.length} Item</span>
                </h3>
                {cart.length === 0 ? (
                    <div className="flex-1 flex flex-col items-center justify-center text-slate-400">
                        <ShoppingBag size={48} className="opacity-20 mb-3" />
                        <p className="italic">Belum ada item dipilih</p>
                    </div>
                ) : (
                 <div className="flex-1 space-y-3 overflow-y-auto max-h-[400px] pr-2 custom-scrollbar">
                    {cart.map((item, idx) => {
                       const s = services.find(ser => ser.id === item.serviceId);
                       if (!s) return null;
                       return (
                          <div key={idx} className="flex justify-between items-center p-3 bg-slate-50 rounded-xl border border-slate-100 group hover:border-blue-200 transition-colors">
                             <div className="flex-1">
                                <div className="font-bold text-slate-800">{s.name}</div>
                                <div className="text-xs text-slate-500 font-medium">Per {s.unit}</div>
                             </div>
                             <div className="flex items-center gap-3">
                                <input 
                                  type="number" 
                                  min="0" 
                                  step={s.unit.toLowerCase().includes('kg') ? "0.1" : "1"}
                                  className="w-16 p-1.5 border border-slate-200 rounded-lg text-center text-sm font-bold outline-none focus:border-blue-500"
                                  value={item.quantity}
                                  onChange={(e) => updateQuantity(s.id, parseFloat(e.target.value))}
                                />
                                <div className="w-20 text-right font-bold text-blue-600">
                                   ${(s.price * item.quantity).toFixed(2)}
                                </div>
                                <button onClick={() => updateQuantity(s.id, 0)} className="text-red-300 hover:text-red-500 p-1 rounded-full hover:bg-red-50 transition"><X size={18} /></button>
                             </div>
                          </div>
                       );
                    })}
                 </div>
              )}
              
              <div className="mt-auto pt-6">
                 <div className="flex justify-between font-extrabold text-2xl text-slate-800 mb-6">
                    <span>Total</span>
                    <span className="text-blue-600">${cart.reduce((sum, i) => sum + ((services.find(s => s.id === i.serviceId)?.price || 0) * i.quantity), 0).toFixed(2)}</span>
                 </div>
                 <button 
                   onClick={submitOrder} 
                   disabled={cart.length === 0 || !newOrderCustId || !newOrderLocId}
                   className="w-full bg-blue-600 text-white py-4 rounded-xl disabled:bg-slate-300 disabled:cursor-not-allowed hover:bg-blue-700 font-bold shadow-xl shadow-blue-200 transition-all transform active:scale-95 text-lg flex justify-center items-center gap-2"
                 >
                   Konfirmasi Pesanan
                 </button>
              </div>
           </div>
          </div>
        </div>
      ) : (
         // Order List View
         <div className="space-y-6 animate-fade-in">
            <div className="flex justify-between items-center bg-white p-4 rounded-xl shadow-sm border border-slate-100">
              <div>
                  <h2 className="text-2xl font-bold text-slate-800">Daftar Pesanan</h2>
                  <p className="text-slate-500 text-sm">Kelola semua pesanan masuk</p>
              </div>
              <button onClick={() => setView('NEW')} className="flex items-center gap-2 bg-blue-600 text-white px-5 py-2.5 rounded-lg hover:bg-blue-700 transition shadow-lg hover:shadow-xl hover:-translate-y-0.5 transform duration-200">
                <Plus size={20} /> Buat Pesanan
              </button>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
               {loading ? <div className="p-12 text-center text-slate-500"><Loader2 className="animate-spin inline mr-2"/> Loading Orders...</div> : (
               <table className="w-full text-left border-collapse">
                  <thead className="bg-slate-50 text-slate-500 font-semibold text-sm uppercase tracking-wider">
                     <tr>
                        <th className="p-4 border-b border-slate-100">ID Order</th>
                        <th className="p-4 border-b border-slate-100">Pelanggan</th>
                        <th className="p-4 border-b border-slate-100">Total</th>
                        <th className="p-4 border-b border-slate-100">Staff (Masuk/Keluar)</th>
                        <th className="p-4 border-b border-slate-100">Status</th>
                        <th className="p-4 border-b border-slate-100 text-right">Aksi</th>
                     </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                     {orders.map(o => (
                        <tr key={o.id} className="hover:bg-blue-50/30 transition-colors group">
                           <td className="p-4 font-mono text-sm font-medium text-slate-500">#{o.id.slice(0,6)}</td>
                           <td className="p-4">
                              <div className="font-bold text-slate-800">{o.customerName}</div>
                              <div className="text-xs text-slate-400 font-medium flex items-center gap-1 mt-0.5">
                                <Package size={10} /> {o.perfume || 'Standard'}
                              </div>
                           </td>
                           <td className="p-4 font-bold text-slate-700">${o.totalAmount.toFixed(2)}</td>
                           <td className="p-4 text-sm text-slate-600">
                              <div className="flex flex-col gap-1">
                                 <div className="flex items-center gap-1 text-xs"><div className="w-1.5 h-1.5 rounded-full bg-slate-300"></div> In: {o.receivedBy || '-'}</div>
                                 {o.completedBy && <div className="flex items-center gap-1 text-xs font-bold text-indigo-600"><div className="w-1.5 h-1.5 rounded-full bg-indigo-500"></div> Out: {o.completedBy}</div>}
                              </div>
                           </td>
                           <td className="p-4">
                              <span className={`px-3 py-1 rounded-full text-xs font-bold border ${getStatusColor(o.status)}`}>{o.status}</span>
                           </td>
                           <td className="p-4 text-right">
                              <div className="flex items-center justify-end gap-2 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                                 <select 
                                   value={o.status} 
                                   onChange={(e) => initiateStatusUpdate(o, e.target.value as OrderStatus)}
                                   className="text-xs border border-slate-300 rounded-md p-1.5 bg-white shadow-sm focus:border-blue-500 outline-none cursor-pointer"
                                 >
                                     {Object.values(OrderStatus).map(s => <option key={s} value={s}>{s}</option>)}
                                 </select>
                                 <button onClick={() => printReceipt(o)} title="Cetak Struk" className="p-2 bg-white border border-slate-200 rounded-lg text-slate-500 hover:text-slate-800 hover:border-slate-400 transition shadow-sm"><Printer size={16} /></button>
                                 <button onClick={() => sendWhatsApp(o)} title="Kirim WhatsApp" className="p-2 bg-white border border-green-200 rounded-lg text-green-500 hover:text-green-700 hover:bg-green-50 transition shadow-sm"><MessageCircle size={16} /></button>
                              </div>
                           </td>
                        </tr>
                     ))}
                  </tbody>
               </table>
               )}
               {!loading && orders.length === 0 && (
                   <div className="p-12 text-center text-slate-400 bg-slate-50">
                       <ShoppingBag size={48} className="mx-auto mb-3 opacity-20" />
                       <p>Belum ada pesanan.</p>
                   </div>
               )}
            </div>
         </div>
      )}
    </div>
  );
};