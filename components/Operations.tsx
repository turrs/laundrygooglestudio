
import React, { useState, useEffect, useRef } from 'react';
import { Order, Customer, OrderStatus, Service, Location, User, UserRole, PaymentMethod } from '../types';
import { SupabaseService } from '../migration/SupabaseService';
import { supabase } from '../migration/supabaseClient';
import { ShoppingBag, CheckCircle, Package, User as UserIcon, Plus, Search, Printer, MessageCircle, X, CheckSquare, Phone, Loader2, ArrowRight, Send, CheckSquare as CheckSquareIcon, List, Users, Download, Upload, FileText, CreditCard, Trash2, Tag } from 'lucide-react';

// --- CUSTOMERS (Unchanged, included for context) ---

interface CustomerManagementProps {
  currentUser?: User;
}

export const CustomerManagement: React.FC<CustomerManagementProps> = ({ currentUser }) => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<Partial<Customer>>({});
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Broadcast State
  const [viewMode, setViewMode] = useState<'DATA' | 'BROADCAST'>('DATA');
  const [selectedCustIds, setSelectedCustIds] = useState<Set<string>>(new Set());
  const [broadcastTemplate, setBroadcastTemplate] = useState("Halo {name}, kami ada promo menarik bulan ini!");
  const [broadcastQueue, setBroadcastQueue] = useState<{customer: Customer, status: 'PENDING' | 'SENT'}[]>([]);

  useEffect(() => {
    fetchCustomers();
  }, [isEditing]);

  const fetchCustomers = async () => {
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

  const toggleSelectCustomer = (id: string) => {
      const newSet = new Set(selectedCustIds);
      if (newSet.has(id)) newSet.delete(id);
      else newSet.add(id);
      setSelectedCustIds(newSet);
  };

  const selectAllFiltered = () => {
      const newSet = new Set(selectedCustIds);
      filteredCustomers.forEach(c => newSet.add(c.id));
      setSelectedCustIds(newSet);
  };

  const clearSelection = () => setSelectedCustIds(new Set());

  const generateQueue = () => {
      if (selectedCustIds.size === 0) return;
      const queue = customers
        .filter(c => selectedCustIds.has(c.id))
        .map(c => ({ customer: c, status: 'PENDING' as const }));
      setBroadcastQueue(queue);
  };

  const sendBroadcastItem = (index: number) => {
      const item = broadcastQueue[index];
      if (!item) return;

      const msg = broadcastTemplate
        .replace(/{name}/g, item.customer.name)
        .replace(/{phone}/g, item.customer.phone);
      
      let formatted = item.customer.phone.replace(/\D/g, '');
      if (formatted.startsWith('0')) formatted = '62' + formatted.substring(1);
      if (!formatted.startsWith('62')) formatted = '62' + formatted;

      window.open(`https://wa.me/${formatted}?text=${encodeURIComponent(msg)}`, '_blank');

      const newQueue = [...broadcastQueue];
      newQueue[index].status = 'SENT';
      setBroadcastQueue(newQueue);
  };

  const handleExport = () => {
    const headers = ['Nama', 'Telepon', 'Email', 'Alamat', 'Catatan'];
    const rows = customers.map(c => [
        `"${c.name.replace(/"/g, '""')}"`,
        `"${c.phone.replace(/"/g, '""')}"`,
        `"${c.email.replace(/"/g, '""')}"`,
        `"${c.address.replace(/"/g, '""')}"`,
        `"${(c.notes || '').replace(/"/g, '""')}"`
    ].join(','));
    const csvContent = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `pelanggan_data_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleImportClick = () => {
    if (fileInputRef.current) fileInputRef.current.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (evt) => {
        const text = evt.target?.result as string;
        if (!text) return;
        
        const lines = text.split('\n').filter(line => line.trim() !== '');
        if (lines.length === 0) return;

        // Auto-detect delimiter from header row (semicolon vs comma)
        const header = lines[0];
        const delimiter = header.includes(';') ? ';' : ',';

        const dataRows = lines.slice(1);
        let successCount = 0;
        let failCount = 0;
        setLoading(true);

        for (const row of dataRows) {
            const cols = row.split(delimiter).map(c => c.trim().replace(/^"|"$/g, '').replace(/""/g, '"'));
            
            if (cols.length < 2) { failCount++; continue; }
            
            const [name, phone, email, address, notes] = cols;
            
            // Cleanup phone number
            const cleanPhone = phone ? phone.replace(/[^0-9+]/g, '') : '';

            if (!name || !cleanPhone) { failCount++; continue; }
            
            try {
                await SupabaseService.saveCustomer({
                    id: `cust-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
                    name, 
                    phone: cleanPhone, 
                    email: email || '', 
                    address: address || '', 
                    notes: notes || ''
                });
                successCount++;
            } catch (err) { failCount++; }
        }
        alert(`Import Selesai.\nBerhasil: ${successCount}\nGagal: ${failCount}`);
        setLoading(false);
        fetchCustomers();
        if (fileInputRef.current) fileInputRef.current.value = '';
    };
    reader.readAsText(file);
  };

  const filteredCustomers = customers.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    c.phone.includes(searchTerm)
  );

  return (
    <div className="space-y-6 animate-fade-in pb-20 md:pb-0">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
            <h2 className="text-2xl font-bold text-slate-800">Pelanggan</h2>
            {viewMode === 'BROADCAST' && <p className="text-sm text-slate-500">Kirim pesan massal ke pelanggan</p>}
        </div>
        <div className="flex gap-2 w-full md:w-auto overflow-x-auto pb-2 md:pb-0">
             {currentUser?.role === UserRole.OWNER && (
                <div className="bg-slate-100 p-1 rounded-lg flex mr-2 shrink-0">
                    <button onClick={() => setViewMode('DATA')} className={`px-3 py-1.5 rounded-md text-sm font-medium transition ${viewMode === 'DATA' ? 'bg-white shadow text-blue-600' : 'text-slate-500'}`}><List size={16} className="inline mr-1"/> Data</button>
                    <button onClick={() => setViewMode('BROADCAST')} className={`px-3 py-1.5 rounded-md text-sm font-medium transition ${viewMode === 'BROADCAST' ? 'bg-white shadow text-blue-600' : 'text-slate-500'}`}><Send size={16} className="inline mr-1"/> Broadcast</button>
                </div>
             )}
             {viewMode === 'DATA' && (
                <>
                <div className="relative flex-1 md:w-64 min-w-[200px]">
                    <Search className="absolute left-3 top-2.5 text-slate-400" size={18} />
                    <input type="text" placeholder="Cari nama atau telepon..." className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
                </div>
                <input type="file" accept=".csv" ref={fileInputRef} className="hidden" onChange={handleFileChange} />
                <button onClick={handleExport} className="bg-green-600 text-white p-2 rounded-lg hover:bg-green-700 transition shadow-sm"><Download size={18} /></button>
                <button onClick={handleImportClick} className="bg-slate-600 text-white p-2 rounded-lg hover:bg-slate-700 transition shadow-sm"><Upload size={18} /></button>
                <button onClick={() => { setFormData({}); setIsEditing(true); }} className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition shadow-sm shrink-0"><Plus size={18} /> <span className="hidden sm:inline">Tambah</span></button>
                </>
             )}
        </div>
      </div>
      {viewMode === 'DATA' && <div className="bg-blue-50 text-blue-800 p-3 rounded-lg text-xs flex items-start gap-2 border border-blue-100 mb-4"><FileText size={14} className="mt-0.5 shrink-0"/><div><strong>Format Import (CSV):</strong> Nama, Telepon, Email, Alamat, Catatan. <br/>Pastikan baris pertama adalah header.</div></div>}
      {viewMode === 'BROADCAST' ? (
         <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="space-y-6">
                 <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                    <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2"><CheckSquareIcon size={18} className="text-blue-500"/> 1. Pilih Penerima</h3>
                    <div className="flex justify-between items-center mb-2">
                        <div className="relative flex-1 mr-4">
                            <Search className="absolute left-3 top-2.5 text-slate-400" size={16} />
                            <input className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-lg text-sm outline-none" placeholder="Filter list..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
                        </div>
                        <div className="flex gap-2 text-xs">
                             <button onClick={selectAllFiltered} className="text-blue-600 font-medium hover:underline">Pilih Semua ({filteredCustomers.length})</button>
                             <span className="text-slate-300">|</span>
                             <button onClick={clearSelection} className="text-red-500 hover:underline">Reset</button>
                        </div>
                    </div>
                    <div className="max-h-60 overflow-y-auto border border-slate-100 rounded-lg">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-slate-50 sticky top-0"><tr><th className="p-3 w-10"><input type="checkbox" disabled /></th><th className="p-3 font-medium text-slate-500">Nama Pelanggan</th><th className="p-3 font-medium text-slate-500">Nomor HP</th></tr></thead>
                            <tbody className="divide-y divide-slate-100">
                                {filteredCustomers.map(c => (
                                    <tr key={c.id} className={`hover:bg-blue-50 cursor-pointer ${selectedCustIds.has(c.id) ? 'bg-blue-50' : ''}`} onClick={() => toggleSelectCustomer(c.id)}>
                                        <td className="p-3"><input type="checkbox" checked={selectedCustIds.has(c.id)} onChange={() => {}} className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"/></td>
                                        <td className="p-3 font-medium text-slate-700">{c.name}</td>
                                        <td className="p-3 text-slate-500">{c.phone}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    <p className="text-right text-xs text-slate-500 mt-2">{selectedCustIds.size} penerima dipilih.</p>
                 </div>
                 <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                    <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2"><MessageCircle size={18} className="text-green-500"/> 2. Tulis Pesan</h3>
                    <div className="mb-2 flex gap-2"><button onClick={() => setBroadcastTemplate(prev => prev + " {name}")} className="bg-slate-100 hover:bg-slate-200 text-xs px-2 py-1 rounded border border-slate-300 transition">+ Nama</button></div>
                    <textarea className="w-full border border-slate-300 rounded-lg p-3 h-32 outline-none focus:ring-2 focus:ring-green-500" placeholder="Ketik pesan broadcast disini..." value={broadcastTemplate} onChange={e => setBroadcastTemplate(e.target.value)} />
                    <button onClick={generateQueue} disabled={selectedCustIds.size === 0 || !broadcastTemplate} className="w-full mt-4 bg-blue-600 text-white py-3 rounded-xl font-bold hover:bg-blue-700 disabled:bg-slate-300 disabled:cursor-not-allowed transition">Buat Antrean Pengiriman</button>
                 </div>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex flex-col h-[600px]">
                <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2"><Send size={18} className="text-orange-500"/> 3. Antrean Pengiriman</h3>
                {broadcastQueue.length === 0 ? (
                    <div className="flex-1 flex flex-col items-center justify-center text-slate-400 border-2 border-dashed border-slate-100 rounded-xl"><Users size={48} className="mb-3 opacity-20"/><p>Belum ada antrean.</p></div>
                ) : (
                    <>
                    <div className="bg-orange-50 p-4 rounded-lg mb-4 text-xs text-orange-800 border border-orange-100"><p className="font-bold mb-1">Penting:</p><p>Untuk menghindari pemblokiran WhatsApp, klik "Kirim" satu per satu.</p></div>
                    <div className="flex-1 overflow-y-auto pr-2 space-y-3">
                        {broadcastQueue.map((item, idx) => (
                            <div key={idx} className={`p-3 rounded-lg border flex justify-between items-center transition-all ${item.status === 'SENT' ? 'bg-green-50 border-green-200' : 'bg-white border-slate-200 hover:border-blue-300'}`}>
                                <div><p className={`font-medium ${item.status === 'SENT' ? 'text-green-700' : 'text-slate-700'}`}>{item.customer.name}</p><p className="text-xs text-slate-500">{item.customer.phone}</p></div>
                                {item.status === 'SENT' ? (<span className="flex items-center gap-1 text-xs font-bold text-green-600 bg-white px-2 py-1 rounded border border-green-200"><CheckCircle size={14} /> Terkirim</span>) : (<button onClick={() => sendBroadcastItem(idx)} className="bg-green-600 hover:bg-green-700 text-white px-4 py-1.5 rounded-lg text-sm font-medium shadow-sm flex items-center gap-1"><Send size={14} /> Kirim</button>)}
                            </div>
                        ))}
                    </div>
                    <div className="pt-4 border-t border-slate-100 mt-2 flex justify-between items-center text-sm text-slate-500"><span>Progress: {broadcastQueue.filter(i => i.status === 'SENT').length} / {broadcastQueue.length}</span><button onClick={() => setBroadcastQueue([])} className="text-red-500 hover:underline">Hapus Antrean</button></div>
                    </>
                )}
            </div>
         </div>
      ) : (
        <>
        {isEditing && (
            <div className="bg-white p-6 rounded-xl shadow-lg border border-slate-200 relative z-10 mb-6">
            <h3 className="text-lg font-bold mb-4">{formData.id ? 'Edit Pelanggan' : 'Pelanggan Baru'}</h3>
            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div><label className="block text-sm font-medium text-slate-700 mb-1">Nama Lengkap</label><input className="w-full border border-slate-300 p-2 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" value={formData.name || ''} onChange={e => setFormData({...formData, name: e.target.value})} required /></div>
                <div><label className="block text-sm font-medium text-slate-700 mb-1">No. Telepon</label><input className="w-full border border-slate-300 p-2 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" value={formData.phone || ''} onChange={e => setFormData({...formData, phone: e.target.value})} required /></div>
                <div><label className="block text-sm font-medium text-slate-700 mb-1">Email</label><input className="w-full border border-slate-300 p-2 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" value={formData.email || ''} onChange={e => setFormData({...formData, email: e.target.value})} /></div>
                <div><label className="block text-sm font-medium text-slate-700 mb-1">Alamat</label><input className="w-full border border-slate-300 p-2 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" value={formData.address || ''} onChange={e => setFormData({...formData, address: e.target.value})} /></div>
                <div className="col-span-1 md:col-span-2 flex gap-3 mt-4 justify-end"><button type="button" onClick={() => setIsEditing(false)} className="px-5 py-2 text-slate-600 hover:bg-slate-100 rounded-lg">Batal</button><button type="submit" className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 shadow-md">Simpan</button></div>
            </form>
            </div>
        )}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            {loading ? <div className="p-8 text-center text-slate-500"><Loader2 className="animate-spin inline mr-2" /> Loading Customers...</div> : (
            <table className="w-full text-left">
            <thead className="bg-slate-50 text-slate-500 font-semibold text-sm uppercase tracking-wider"><tr><th className="p-4">Nama</th><th className="p-4">Kontak</th><th className="p-4">Alamat</th><th className="p-4 text-right">Aksi</th></tr></thead>
            <tbody className="divide-y divide-slate-100">
                {filteredCustomers.map(c => (
                <tr key={c.id} className="hover:bg-slate-50 transition-colors"><td className="p-4 font-medium text-slate-800">{c.name}</td><td className="p-4 text-slate-600 text-sm"><div className="flex items-center gap-1"><Phone size={12}/> {c.phone}</div>{c.email && <div className="text-slate-400 text-xs">{c.email}</div>}</td><td className="p-4 text-slate-600 text-sm">{c.address || '-'}</td><td className="p-4 text-right"><button onClick={() => { setFormData(c); setIsEditing(true); }} className="text-blue-600 text-sm font-medium hover:underline">Edit</button></td></tr>
                ))}
            </tbody>
            </table>
            )}
        </div>
        </>
      )}
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
  const [isPaid, setIsPaid] = useState(false); 
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('CASH'); 
  const [cart, setCart] = useState<{serviceId: string, quantity: number}[]>([]);
  
  // Discount State
  const [voucherCode, setVoucherCode] = useState('');
  const [appliedDiscount, setAppliedDiscount] = useState<{code: string, amount: number} | null>(null);
  const [discountMsg, setDiscountMsg] = useState<{type: 'success' | 'error', text: string} | null>(null);

  // Customer Search State
  const [custSearchTerm, setCustSearchTerm] = useState('');
  const [showCustDropdown, setShowCustDropdown] = useState(false);
  const searchWrapperRef = useRef<HTMLDivElement>(null);
  
  // New Customer Modal
  const [isNewCustModalOpen, setIsNewCustModalOpen] = useState(false);
  const [newCustName, setNewCustName] = useState('');
  const [newCustPhone, setNewCustPhone] = useState('');

  // Ready Status Modal
  const [isReadyModalOpen, setIsReadyModalOpen] = useState(false);
  const [orderToReady, setOrderToReady] = useState<Order | null>(null);
  const [completionStaff, setCompletionStaff] = useState('');
  const [sendWaNotification, setSendWaNotification] = useState(true);

  // Payment Modal
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [orderToPay, setOrderToPay] = useState<Order | null>(null);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<PaymentMethod>('CASH');

  const [filterStatus, setFilterStatus] = useState<'ALL' | 'UNPAID' | 'PAID'>('ALL');
  const [lastOrder, setLastOrder] = useState<Order | null>(null);

  useEffect(() => {
    if (orders.length === 0 && loading) {
        fetchInitialData();
    }
    if (currentUser && !receivedBy) {
      setReceivedBy(currentUser.name);
    }
    if (currentUser?.locationId && !newOrderLocId) {
        setNewOrderLocId(currentUser.locationId);
    }
    function handleClickOutside(event: MouseEvent) {
        if (searchWrapperRef.current && !searchWrapperRef.current.contains(event.target as Node)) {
          setShowCustDropdown(false);
        }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
        document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [currentUser, orders.length, loading]); 

  const fetchInitialData = async () => {
      setLoading(true);
      const [o, s, c, l, p] = await Promise.all([
          SupabaseService.getOrders({ limit: 100 }),
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
             id: u.id, name: u.name, email: u.email, role: u.role, locationId: u.location_id
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
    // Reset discount when cart changes
    setAppliedDiscount(null);
    setDiscountMsg(null);
    setVoucherCode('');
  };

  const updateQuantity = (serviceId: string, qty: number) => {
    if (qty < 0) return;
    if (qty === 0) {
       setCart(prev => prev.filter(i => i.serviceId !== serviceId));
    } else {
       setCart(prev => prev.map(i => i.serviceId === serviceId ? {...i, quantity: qty} : i));
    }
    setAppliedDiscount(null); 
    setDiscountMsg(null);
    setVoucherCode('');
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
      try {
        const savedCust = await SupabaseService.saveCustomer(newCust);
        setCustomers(prev => [savedCust, ...prev]); 
        setNewOrderCustId(savedCust.id);
        setCustSearchTerm(savedCust.name);
        setIsNewCustModalOpen(false);
        setNewCustName('');
        setNewCustPhone('');
      } catch (err) { console.error(err); }
    }
  };

  const handleSelectCustomer = (customer: Customer) => {
      setNewOrderCustId(customer.id);
      setCustSearchTerm(customer.name);
      setShowCustDropdown(false);
  };

  const calculateSubtotal = () => {
      return cart.reduce((sum, item) => {
        const svc = services.find(s => s.id === item.serviceId);
        return sum + (svc ? svc.price * item.quantity : 0);
      }, 0);
  };

  const handleApplyVoucher = async () => {
      if (!voucherCode) return;
      setDiscountMsg(null);
      
      const subtotal = calculateSubtotal();
      if (subtotal <= 0) {
          setDiscountMsg({ type: 'error', text: 'Keranjang kosong.'});
          return;
      }

      const res = await SupabaseService.validateDiscount(voucherCode);
      if (!res.isValid || !res.discount) {
          setDiscountMsg({ type: 'error', text: res.message || 'Kode tidak valid.'});
          setAppliedDiscount(null);
          return;
      }

      let discountVal = 0;
      if (res.discount.type === 'PERCENTAGE') {
          discountVal = Math.round(subtotal * (res.discount.value / 100));
      } else {
          discountVal = res.discount.value;
      }

      // Cap discount to subtotal (cannot be negative)
      if (discountVal > subtotal) discountVal = subtotal;

      setAppliedDiscount({ code: res.discount.code, amount: discountVal });
      setDiscountMsg({ type: 'success', text: `Diskon Rp ${discountVal.toLocaleString('id-ID')} diterapkan!`});
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

    const subtotal = calculateSubtotal();
    // Re-verify discount validity ideally, but for now trust client state
    const discountAmt = appliedDiscount ? appliedDiscount.amount : 0;
    const finalTotal = subtotal - discountAmt;

    const newOrder: Order = {
      id: `ord-${Date.now()}`,
      customerId: customer.id,
      customerName: customer.name,
      locationId: newOrderLocId,
      status: OrderStatus.PENDING,
      totalAmount: finalTotal,
      items: orderItems,
      perfume,
      receivedBy, 
      isPaid, 
      paymentMethod: isPaid ? paymentMethod : undefined,
      discountCode: appliedDiscount ? appliedDiscount.code : undefined,
      discountAmount: discountAmt,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const savedOrder = await SupabaseService.saveOrder(newOrder);
    setOrders(prev => [savedOrder, ...prev]);
    setLastOrder(savedOrder); 
    setCart([]);
    setNewOrderCustId('');
    setCustSearchTerm('');
    setIsPaid(false);
    setAppliedDiscount(null);
    setVoucherCode('');
    setDiscountMsg(null);
  };

  const handleSendWaNewOrder = (order: Order) => {
    const customer = customers.find(c => c.id === order.customerId);
    const location = locations.find(l => l.id === order.locationId);
    if (!customer) return;
    const trackingLink = `${window.location.origin}?trackingId=${order.id}`;
    const laundryName = location ? location.name : 'LaunderLink Pro';
    const laundryAddr = location ? location.address : '';
    const laundryPhone = location ? location.phone : '';
    let maxDurationHours = 0;
    order.items.forEach(item => {
        const svc = services.find(s => s.id === item.serviceId);
        const duration = svc && svc.durationHours ? svc.durationHours : 48;
        if (duration > maxDurationHours) maxDurationHours = duration;
    });
    if (maxDurationHours === 0) maxDurationHours = 48;
    const dateIn = new Date(order.createdAt);
    const dateEst = new Date(dateIn.getTime() + (maxDurationHours * 60 * 60 * 1000));
    const formattedDateIn = dateIn.toLocaleString('id-ID', {day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit'}).replace(/\./g, ':');
    const formattedDateEst = dateEst.toLocaleString('id-ID', {day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit'}).replace(/\./g, ':');
    
    let itemsDetails = "";
    order.items.forEach(item => {
        const svc = services.find(s => s.id === item.serviceId);
        const unit = svc ? svc.unit : 'item/kg';
        const subtotal = item.price * item.quantity;
        itemsDetails += `- ${item.serviceName}%0A${item.quantity} ${unit} x ${item.price} = Rp ${subtotal}%0A%0A`;
    });

    let discountLine = "";
    if (order.discountAmount && order.discountAmount > 0) {
        discountLine = `Diskon (${order.discountCode || 'Promo'}) : - Rp ${order.discountAmount.toLocaleString('id-ID')}%0A`;
    }

    let formatted = customer.phone.replace(/\D/g, '');
    if (formatted.startsWith('0')) formatted = '62' + formatted.substring(1);
    if (!formatted.startsWith('62')) formatted = '62' + formatted; 
    
    const cleanMsg = 
`NOTA ELEKTRONIK

${laundryName}
${laundryAddr}
HP : ${laundryPhone}

=======================
No Nota : TRX/${order.id.slice(4)}
Pelanggan : ${customer.name}
Masuk    : ${formattedDateIn}
Estimasi : ${formattedDateEst}

=======================
${itemsDetails.replace(/%0A/g, '\n')}=======================
${discountLine ? discountLine.replace(/%0A/g, '\n') : ''}Total        =  Rp ${order.totalAmount.toLocaleString('id-ID')}
Parfum  : ${order.perfume || 'Standard'}
Status  : ${order.isPaid ? 'LUNAS' : 'BELUM BAYAR'}
=======================

${trackingLink}

Terima Kasih`;
    window.open(`https://wa.me/${formatted}?text=${encodeURIComponent(cleanMsg)}`, '_blank');
  };
  
  const handlePrintReceipt = (order: Order) => {
    const loc = locations.find(l => l.id === order.locationId);
    const locName = loc?.name || 'LaunderLink Pro';
    const locAddr = loc?.address || '';
    const locPhone = loc?.phone || '';
    
    const line = "--------------------------------\n";
    let text = "";
    text += `${locName}\n`;
    if(locAddr) text += `${locAddr}\n`;
    if(locPhone) text += `${locPhone}\n`;
    text += line;
    text += `No Order : #${order.id.slice(0, 8)}\n`;
    text += `Tanggal  : ${new Date(order.createdAt).toLocaleString('id-ID')}\n`;
    text += `Pelanggan: ${order.customerName}\n`;
    text += `Kasir    : ${order.receivedBy || '-'}\n`;
    text += line;
    order.items.forEach(item => {
        const svc = services.find(s => s.id === item.serviceId);
        const unit = svc ? svc.unit : '';
        text += `${item.serviceName}\n`;
        text += `${item.quantity} ${unit} x Rp ${item.price.toLocaleString('id-ID')} = Rp ${(item.quantity * item.price).toLocaleString('id-ID')}\n`;
    });
    text += line;
    
    if (order.discountAmount && order.discountAmount > 0) {
        text += `DISKON (${order.discountCode}) : - Rp ${order.discountAmount.toLocaleString('id-ID')}\n`;
    }

    text += `TOTAL    : Rp ${order.totalAmount.toLocaleString('id-ID')}\n`;
    text += `STATUS   : ${order.isPaid ? 'LUNAS' : 'BELUM BAYAR'}\n`;
    text += line;
    text += `Terima Kasih\n\n\n`;
    window.location.href = 'rawbt:base64,' + btoa(text);
  };

  const initiateStatusUpdate = (order: Order, newStatus: OrderStatus) => {
    if (newStatus === OrderStatus.READY) {
      setOrderToReady(order);
      setCompletionStaff(currentUser?.name || '');
      setSendWaNotification(true);
      setIsReadyModalOpen(true);
    } else {
      updateStatus(order.id, newStatus);
    }
  };

  const updateStatus = async (orderId: string, status: OrderStatus, staffName?: string) => {
    setOrders(prevOrders => prevOrders.map(o => o.id === orderId ? { ...o, status, completedBy: staffName || o.completedBy, updatedAt: new Date().toISOString() } : o));
    if (status === OrderStatus.READY && sendWaNotification) {
       const targetOrder = orderToReady || orders.find(o => o.id === orderId);
       if (targetOrder) {
           const customer = customers.find(c => c.id === targetOrder.customerId);
           const loc = locations.find(l => l.id === targetOrder.locationId);
           const laundryName = loc ? loc.name : "Laundry";
           if (customer) {
               const msg = `Halo ${customer.name}, Cucian Anda di *${laundryName}* (Order #${targetOrder.id.slice(0, 8)}) sudah SELESAI! \nTotal: Rp ${targetOrder.totalAmount.toLocaleString('id-ID')}`;
               let formatted = customer.phone.replace(/\D/g, '');
               if (formatted.startsWith('0')) formatted = '62' + formatted.substring(1);
               if (!formatted.startsWith('62')) formatted = '62' + formatted; 
               window.open(`https://wa.me/${formatted}?text=${encodeURIComponent(msg)}`, '_blank');
           }
       }
    }
    setIsReadyModalOpen(false);
    setOrderToReady(null);
    try { await SupabaseService.updateOrderStatus(orderId, status, staffName); } catch (error) { console.error(error); }
  };

  const openPaymentModal = (order: Order) => {
      setOrderToPay(order);
      setSelectedPaymentMethod('CASH'); 
      setIsPaymentModalOpen(true);
  };

  const confirmPayment = async () => {
      if (!orderToPay) return;
      const orderId = orderToPay.id;
      const method = selectedPaymentMethod;
      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, isPaid: true, paymentMethod: method } : o));
      setIsPaymentModalOpen(false);
      setOrderToPay(null);
      try { await SupabaseService.confirmPayment(orderId, method); } catch (err) { console.error(err); }
  };

  const handleDeleteOrder = async (id: string) => {
     if (!currentUser || currentUser.role !== UserRole.OWNER) { alert("Hanya Owner yang dapat menghapus pesanan."); return; }
     if (window.confirm("Hapus pesanan ini?")) {
         setOrders(prev => prev.filter(o => o.id !== id));
         try { await SupabaseService.deleteOrder(id); } catch (e: any) { alert(`Error: ${e.message}`); fetchInitialData(); }
     }
  };

  const filteredOrders = orders.filter(o => {
      if (filterStatus === 'ALL') return true;
      if (filterStatus === 'UNPAID') return !o.isPaid;
      if (filterStatus === 'PAID') return o.isPaid;
      return true;
  });

  const unpaidCount = orders.filter(o => !o.isPaid).length;
  const subtotalCart = calculateSubtotal();
  const finalTotalCart = subtotalCart - (appliedDiscount ? appliedDiscount.amount : 0);

  if (view === 'NEW') {
    if (lastOrder) {
      return (
        <div className="flex flex-col items-center justify-center h-full p-8 animate-fade-in text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center text-green-600 mb-4"><CheckCircle size={32} /></div>
          <h2 className="text-2xl font-bold text-slate-800">Pesanan Berhasil!</h2>
          <p className="text-slate-500 mt-2">Order ID: #{lastOrder.id.slice(0, 8)}</p>
          <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 mt-6 w-full max-w-md text-sm text-left">
             <div className="flex justify-between mb-2"><span>Total</span><span className="font-bold">Rp {lastOrder.totalAmount.toLocaleString('id-ID')}</span></div>
             {lastOrder.discountAmount && lastOrder.discountAmount > 0 && (
                 <div className="flex justify-between mb-2 text-green-600"><span>Diskon ({lastOrder.discountCode})</span><span>- Rp {lastOrder.discountAmount.toLocaleString('id-ID')}</span></div>
             )}
             <div className="flex justify-between mb-2"><span>Status</span><span className={`font-bold ${lastOrder.isPaid ? 'text-green-600' : 'text-red-500'}`}>{lastOrder.isPaid ? 'LUNAS' : 'BELUM BAYAR'}</span></div>
          </div>
          <div className="mt-6 w-full max-w-md space-y-3">
             <button onClick={() => handleSendWaNewOrder(lastOrder)} className="w-full bg-green-500 hover:bg-green-600 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 shadow-md transition-all"><MessageCircle size={20} /> Kirim Nota WhatsApp</button>
             <button onClick={() => handlePrintReceipt(lastOrder)} className="w-full bg-slate-800 hover:bg-slate-900 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 shadow-md transition-all"><Printer size={20} /> Cetak Struk</button>
             <div className="flex gap-4 pt-2"><button onClick={() => setLastOrder(null)} className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700">Buat Baru</button><button onClick={() => { setLastOrder(null); setView('LIST'); }} className="flex-1 text-slate-600 py-2 rounded-lg hover:bg-slate-100 border border-slate-200">Ke Daftar</button></div>
          </div>
        </div>
      );
    }

    const currentCustomer = customers.find(c => c.id === newOrderCustId);
    const filteredSearchCustomers = customers.filter(c => c.name.toLowerCase().includes(custSearchTerm.toLowerCase()) || c.phone.includes(custSearchTerm)).slice(0, 20);

    return (
      <div className="h-full flex flex-col md:flex-row gap-6 animate-fade-in overflow-hidden relative">
        <div className="flex-1 flex flex-col overflow-y-auto md:overflow-y-auto pb-[350px] md:pb-0">
          <div className="flex items-center gap-4 mb-4 shrink-0"><button onClick={() => setView('LIST')} className="p-2 hover:bg-slate-100 rounded-full text-slate-500"><ArrowRight className="rotate-180" /></button><h2 className="text-2xl font-bold text-slate-800">Buat Pesanan Baru</h2></div>
          <div className="space-y-6">
             <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                   <label className="block text-sm font-medium text-slate-700 mb-1">Pelanggan</label>
                   <div className="flex gap-2 relative" ref={searchWrapperRef}>
                     <div className="relative flex-1"><Search className="absolute left-3 top-2.5 text-slate-400" size={18} /><input type="text" className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white" placeholder="Cari..." value={custSearchTerm} onChange={(e) => { setCustSearchTerm(e.target.value); setShowCustDropdown(true); if (newOrderCustId) setNewOrderCustId(''); }} onFocus={() => setShowCustDropdown(true)} />
                        {showCustDropdown && (<div className="absolute top-full left-0 right-0 bg-white border border-slate-200 rounded-lg shadow-xl mt-1 max-h-60 overflow-y-auto z-50">{filteredSearchCustomers.length > 0 ? (filteredSearchCustomers.map(c => <div key={c.id} onClick={() => handleSelectCustomer(c)} className="p-3 hover:bg-blue-50 cursor-pointer border-b border-slate-50 last:border-0"><div className="font-medium text-slate-800">{c.name}</div><div className="text-xs text-slate-500">{c.phone}</div></div>)) : (<div className="p-3 text-sm text-slate-400 text-center">Tidak ditemukan.</div>)}</div>)}
                     </div>
                     <button onClick={() => setIsNewCustModalOpen(true)} className="bg-blue-100 text-blue-600 p-2 rounded-lg hover:bg-blue-200"><Plus size={20}/></button>
                   </div>
                   {newOrderCustId && (<div className="text-xs text-green-600 mt-1 flex items-center gap-1"><CheckCircle size={10} /> Pelanggan terpilih</div>)}
                </div>
                <div><label className="block text-sm font-medium text-slate-700 mb-1">Outlet</label><select className="w-full border border-slate-300 p-2 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white" value={newOrderLocId} onChange={e => setNewOrderLocId(e.target.value)}><option value="">-- Pilih Lokasi --</option>{locations.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}</select></div>
                <div><label className="block text-sm font-medium text-slate-700 mb-1">Kasir</label><select className="w-full border border-slate-300 p-2 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white" value={receivedBy} onChange={e => setReceivedBy(e.target.value)}><option value="">-- Pilih --</option>{staffList.map(staff => <option key={staff.id} value={staff.name}>{staff.name}</option>)}</select></div>
                <div><label className="block text-sm font-medium text-slate-700 mb-1">Pewangi</label><select className="w-full border border-slate-300 p-2 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white" value={perfume} onChange={e => setPerfume(e.target.value)}><option>Standard</option><option>Lavender</option><option>Lily</option><option>Ocean Fresh</option><option>Sakura</option></select></div>
             </div>
             <div>
                <h3 className="font-bold text-slate-700 mb-3">Pilih Layanan</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">{services.map(svc => <div key={svc.id} onClick={() => addToCart(svc.id)} className="bg-white p-4 rounded-xl border border-slate-200 hover:border-blue-500 hover:shadow-md cursor-pointer transition flex flex-col items-center text-center group"><div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mb-2 group-hover:bg-blue-600 group-hover:text-white transition-colors"><Package size={20} /></div><span className="font-semibold text-slate-800 text-sm">{svc.name}</span><div className="flex flex-col text-xs mt-1 text-slate-500"><span>Rp {svc.price.toLocaleString('id-ID')}/{svc.unit}</span></div></div>)}</div>
             </div>
          </div>
        </div>

        <div className="fixed bottom-0 left-0 right-0 md:static w-full md:w-96 bg-white border-t md:border-t-0 md:border-l border-slate-200 flex flex-col md:h-full shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)] md:shadow-lg md:rounded-l-xl z-20 md:z-10 h-[350px] md:h-auto">
           <div className="p-3 border-b border-slate-100 bg-slate-50 flex justify-between items-center md:block"><h3 className="font-bold text-slate-800 flex items-center gap-2"><ShoppingBag size={18}/> Ringkasan <span className="md:hidden">({cart.length})</span></h3>{currentCustomer && <p className="text-xs text-slate-500 mt-1 hidden md:block">Cust: {currentCustomer.name}</p>}</div>
           <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {cart.length === 0 ? <div className="text-center text-slate-400 mt-10 text-sm">Keranjang kosong.</div> : cart.map(item => { const svc = services.find(s => s.id === item.serviceId)!; return (<div key={item.serviceId} className="flex justify-between items-center bg-slate-50 p-2 md:p-3 rounded-lg border border-slate-100"><div><div className="font-medium text-slate-700 text-sm">{svc.name}</div><div className="text-xs text-slate-500">Rp {svc.price.toLocaleString('id-ID')} x {item.quantity}</div></div><div className="flex items-center gap-2"><input type="number" step="0.1" min="0" className="w-16 border border-slate-300 rounded px-2 py-1 text-center text-sm focus:ring-2 focus:ring-blue-500 outline-none" value={item.quantity} onChange={(e) => updateQuantity(item.serviceId, parseFloat(e.target.value) || 0)} /><button onClick={() => updateQuantity(item.serviceId, 0)} className="w-6 h-6 flex items-center justify-center text-red-400 hover:text-red-600"><X size={16} /></button></div></div>); })}
           </div>
           
           <div className="p-4 border-t border-slate-100 bg-slate-50 shrink-0 space-y-3">
              {/* VOUCHER INPUT */}
              <div className="flex gap-2">
                 <div className="relative flex-1">
                     <Tag size={14} className="absolute left-3 top-2.5 text-slate-400"/>
                     <input 
                        className="w-full pl-8 pr-2 py-2 text-sm border border-slate-200 rounded-lg outline-none focus:ring-1 focus:ring-blue-400 uppercase font-medium" 
                        placeholder="KODE VOUCHER"
                        value={voucherCode}
                        onChange={e => setVoucherCode(e.target.value.toUpperCase())}
                        disabled={!!appliedDiscount}
                     />
                 </div>
                 {appliedDiscount ? (
                     <button onClick={() => { setAppliedDiscount(null); setVoucherCode(''); setDiscountMsg(null); }} className="bg-red-100 text-red-600 px-3 py-2 rounded-lg text-sm font-medium hover:bg-red-200"><X size={16}/></button>
                 ) : (
                     <button onClick={handleApplyVoucher} className="bg-slate-800 text-white px-3 py-2 rounded-lg text-sm font-medium hover:bg-slate-900">Check</button>
                 )}
              </div>
              {discountMsg && (
                  <div className={`text-xs px-2 py-1 rounded ${discountMsg.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                      {discountMsg.text}
                  </div>
              )}

              <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-sm">
                  <div className="flex justify-between items-center text-xs text-slate-500 mb-1"><span>Subtotal</span><span>Rp {subtotalCart.toLocaleString('id-ID')}</span></div>
                  {appliedDiscount && (
                      <div className="flex justify-between items-center text-xs text-green-600 mb-2 font-medium"><span>Diskon ({appliedDiscount.code})</span><span>- Rp {appliedDiscount.amount.toLocaleString('id-ID')}</span></div>
                  )}
                  <div className="flex justify-between items-center border-t border-slate-100 pt-2"><span className="text-slate-600 font-bold">Total</span><span className="text-xl font-extrabold text-blue-600">Rp {finalTotalCart.toLocaleString('id-ID')}</span></div>
              </div>
              
              <div className="flex gap-2 items-center">
                  <div className="flex-1 grid grid-cols-2 gap-2">
                      <button onClick={() => setIsPaid(false)} className={`py-2 rounded-lg text-xs font-bold transition-all ${!isPaid ? 'bg-slate-700 text-white shadow' : 'bg-slate-200 text-slate-500'}`}>Bayar Nanti</button>
                      <button onClick={() => setIsPaid(true)} className={`py-2 rounded-lg text-xs font-bold transition-all ${isPaid ? 'bg-green-600 text-white shadow' : 'bg-slate-200 text-slate-500'}`}>Bayar Sekarang</button>
                  </div>
              </div>
              {isPaid && (
                  <div className="grid grid-cols-3 gap-2">
                      {['CASH', 'QRIS', 'TRANSFER'].map((m) => <button key={m} onClick={() => setPaymentMethod(m as PaymentMethod)} className={`py-1 text-[10px] font-bold rounded border ${paymentMethod === m ? 'bg-green-50 border-green-500 text-green-700' : 'bg-white text-slate-500'}`}>{m}</button>)}
                  </div>
              )}
              
              <button onClick={submitOrder} disabled={cart.length === 0 || !newOrderCustId || !newOrderLocId} className={`w-full text-white py-3 rounded-xl font-bold hover:shadow-lg disabled:bg-slate-300 transition-all flex items-center justify-center gap-2 ${isPaid ? 'bg-green-600 hover:bg-green-700' : 'bg-blue-600 hover:bg-blue-700'}`}>{isPaid ? 'Proses & Bayar' : 'Simpan Order'}</button>
           </div>
        </div>

        {isNewCustModalOpen && (
           <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"><div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-sm"><h3 className="font-bold text-lg mb-4">Pelanggan Cepat</h3><form onSubmit={handleQuickAddCustomer} className="space-y-4"><input placeholder="Nama" className="w-full border p-2 rounded" value={newCustName} onChange={e => setNewCustName(e.target.value)} autoFocus /><input placeholder="Telepon" className="w-full border p-2 rounded" value={newCustPhone} onChange={e => setNewCustPhone(e.target.value)} /><div className="flex gap-2 justify-end mt-4"><button type="button" onClick={() => setIsNewCustModalOpen(false)} className="px-4 py-2 text-slate-600">Batal</button><button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded">Simpan</button></div></form></div></div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in pb-20 md:pb-0">
       <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
              <h2 className="text-2xl font-bold text-slate-800">Daftar Pesanan</h2>
              <div className="flex gap-2 mt-2">
                 <button onClick={() => setFilterStatus('ALL')} className={`px-3 py-1 text-xs rounded-full font-medium transition ${filterStatus === 'ALL' ? 'bg-slate-800 text-white' : 'bg-slate-200 text-slate-600'}`}>Semua</button>
                 <button onClick={() => setFilterStatus('UNPAID')} className={`px-3 py-1 text-xs rounded-full font-medium transition flex items-center gap-1 ${filterStatus === 'UNPAID' ? 'bg-red-600 text-white' : 'bg-red-100 text-red-600'}`}>Belum Bayar ({unpaidCount})</button>
                 <button onClick={() => setFilterStatus('PAID')} className={`px-3 py-1 text-xs rounded-full font-medium transition ${filterStatus === 'PAID' ? 'bg-green-600 text-white' : 'bg-green-100 text-green-600'}`}>Lunas</button>
              </div>
          </div>
          <button onClick={() => setView('NEW')} className="bg-blue-600 text-white px-5 py-2 rounded-lg hover:bg-blue-700 shadow-md flex items-center gap-2"><Plus size={18} /> Pesanan Baru</button>
       </div>

       {loading ? <div className="p-10 text-center"><Loader2 className="animate-spin mx-auto text-blue-600 mb-2"/> Loading Orders...</div> : (
        <div className="grid grid-cols-1 gap-4">
           {filteredOrders.map(order => (
              <div key={order.id} className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition">
                 <div className="flex flex-col md:flex-row justify-between md:items-center gap-4 mb-4 border-b border-slate-50 pb-4">
                    <div>
                       <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-bold text-lg text-slate-800">#{order.id.slice(0, 8)}</span>
                          <span className={`px-2 py-0.5 rounded text-xs font-bold uppercase ${order.status === 'COMPLETED' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>{order.status}</span>
                          <span className={`px-2 py-0.5 rounded text-xs font-bold uppercase flex items-center gap-1 ${order.isPaid ? 'bg-green-600 text-white' : 'bg-red-500 text-white'}`}>{order.isPaid ? <CheckCircle size={10} /> : <CreditCard size={10} />} {order.isPaid ? (order.paymentMethod || 'LUNAS') : 'BELUM BAYAR'}</span>
                          {order.discountAmount && order.discountAmount > 0 && <span className="bg-purple-100 text-purple-700 px-2 py-0.5 rounded text-xs font-bold flex items-center gap-1"><Tag size={10}/> DISKON</span>}
                       </div>
                       <p className="text-slate-500 text-sm mt-1">Cust: <span className="font-medium text-slate-700">{order.customerName}</span> | {new Date(order.createdAt).toLocaleString()}</p>
                    </div>
                    <div className="text-right">
                       <div className="font-extrabold text-xl text-slate-800">Rp {order.totalAmount.toLocaleString('id-ID')}</div>
                       {order.discountAmount && order.discountAmount > 0 && <div className="text-xs text-green-600">Hemat Rp {order.discountAmount.toLocaleString('id-ID')}</div>}
                    </div>
                 </div>
                 
                 <div className="flex justify-between items-center flex-wrap gap-4">
                    <div className="text-sm text-slate-600 flex gap-4"><span className="flex items-center gap-1"><UserIcon size={14}/> {order.receivedBy || '-'}</span><span className="flex items-center gap-1"><Package size={14}/> {order.items.length} items</span></div>
                    <div className="flex gap-2 flex-wrap justify-end">
                       {!order.isPaid && <button onClick={() => openPaymentModal(order)} className="bg-green-600 hover:bg-green-700 text-white px-3 py-1.5 rounded-lg text-sm font-medium shadow-sm flex items-center gap-1"><CreditCard size={16} /> Bayar</button>}
                       {order.status === 'PENDING' && <button onClick={() => updateStatus(order.id, OrderStatus.PROCESSING)} className="bg-yellow-500 hover:bg-yellow-600 text-white px-3 py-1.5 rounded-lg text-sm">Mulai Cuci</button>}
                       {order.status === 'PROCESSING' && <button onClick={() => initiateStatusUpdate(order, OrderStatus.READY)} className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1.5 rounded-lg text-sm">Selesai Cuci</button>}
                       {order.status === 'READY' && <button onClick={() => updateStatus(order.id, OrderStatus.COMPLETED)} className="bg-green-600 hover:bg-green-700 text-white px-3 py-1.5 rounded-lg text-sm flex items-center gap-1"><CheckSquare size={16}/> Ambil</button>}
                       <button onClick={() => handlePrintReceipt(order)} className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-1.5 rounded-lg text-sm border border-slate-300 flex items-center gap-1"><Printer size={16}/> Struk</button>
                       {currentUser?.role === UserRole.OWNER && (<div className="flex gap-2"><button onClick={() => window.open(`/?trackingId=${order.id}`, '_blank')} className="text-blue-600 hover:bg-blue-50 px-3 py-1.5 rounded-lg text-sm border border-blue-200">Tracking</button><button onClick={() => handleDeleteOrder(order.id)} className="text-red-500 hover:bg-red-50 px-3 py-1.5 rounded-lg text-sm border border-red-200"><Trash2 size={16} /></button></div>)}
                    </div>
                 </div>
              </div>
           ))}
        </div>
       )}

       {isPaymentModalOpen && orderToPay && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 animate-fade-in"><div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-sm"><h3 className="text-xl font-bold text-slate-800 mb-4">Pembayaran Order</h3><div className="bg-slate-50 p-4 rounded-lg mb-4 text-center"><p className="text-slate-500 text-xs uppercase mb-1">Total Tagihan</p><p className="text-3xl font-extrabold text-blue-600">Rp {orderToPay.totalAmount.toLocaleString('id-ID')}</p></div><p className="text-sm font-medium text-slate-700 mb-2">Pilih Metode:</p><div className="grid grid-cols-3 gap-2 mb-6">{['CASH', 'QRIS', 'TRANSFER'].map((m) => <button key={m} onClick={() => setSelectedPaymentMethod(m as PaymentMethod)} className={`flex flex-col items-center justify-center p-3 rounded-lg border transition ${selectedPaymentMethod === m ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-slate-200 text-slate-500'}`}><CreditCard size={24} className="mb-1" /><span className="text-xs font-bold">{m}</span></button>)}</div><button onClick={confirmPayment} className="w-full bg-green-600 text-white py-3 rounded-xl font-bold hover:bg-green-700 shadow-md mb-3">Konfirmasi Pembayaran</button><button onClick={() => setIsPaymentModalOpen(false)} className="w-full text-slate-500 py-2 text-sm hover:text-slate-700">Batal</button></div></div>
       )}

       {isReadyModalOpen && orderToReady && (
         <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"><div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-md"><h3 className="font-bold text-lg mb-4 text-slate-800">Konfirmasi Selesai Cuci</h3><label className="block text-xs font-bold text-slate-500 uppercase mb-1">Dikerjakan Oleh</label><select className="w-full border p-2 rounded mb-4 outline-none focus:ring-2 focus:ring-blue-500" value={completionStaff} onChange={e => setCompletionStaff(e.target.value)}><option value="">-- Pilih Pegawai --</option>{staffList.map(s => <option key={s.id} value={s.name}>{s.name}</option>)}</select><div className="bg-green-50 p-3 rounded-lg border border-green-100 mb-6 flex items-start gap-3"><input type="checkbox" id="sendWa" className="mt-1 w-4 h-4 text-green-600 rounded focus:ring-green-500" checked={sendWaNotification} onChange={e => setSendWaNotification(e.target.checked)} /><label htmlFor="sendWa" className="text-sm text-green-800 cursor-pointer select-none">Kirim Notifikasi WhatsApp ke Pelanggan</label></div><div className="flex gap-3 justify-end"><button onClick={() => setIsReadyModalOpen(false)} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg transition">Batal</button><button onClick={() => updateStatus(orderToReady.id, OrderStatus.READY, completionStaff)} className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 shadow-md transition">Simpan & Update</button></div></div></div>
       )}
    </div>
  );
};
