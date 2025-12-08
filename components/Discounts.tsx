
import React, { useState, useEffect } from 'react';
import { Discount, Order } from '../types';
import { SupabaseService } from '../migration/SupabaseService';
import { Plus, Trash2, Tag, Percent, DollarSign, Users, Loader2, XCircle, ShoppingBag } from 'lucide-react';

export const DiscountManagement: React.FC = () => {
  const [discounts, setDiscounts] = useState<Discount[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<Partial<Discount>>({});
  const [loading, setLoading] = useState(true);
  
  // Usage Details Modal
  const [showUsageModal, setShowUsageModal] = useState(false);
  const [selectedDiscount, setSelectedDiscount] = useState<Discount | null>(null);
  const [usageOrders, setUsageOrders] = useState<Order[]>([]);
  const [loadingUsage, setLoadingUsage] = useState(false);

  useEffect(() => {
    fetchDiscounts();
  }, []);

  const fetchDiscounts = async () => {
    setLoading(true);
    const data = await SupabaseService.getDiscounts();
    setDiscounts(data);
    setLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.code && formData.value) {
      await SupabaseService.saveDiscount({
        id: formData.id || `disc-${Date.now()}`,
        code: formData.code.toUpperCase(),
        type: formData.type || 'FIXED',
        value: Number(formData.value),
        quota: Number(formData.quota || 0),
        usedCount: formData.usedCount || 0,
        isActive: formData.isActive ?? true
      });
      setIsEditing(false);
      setFormData({});
      fetchDiscounts();
    }
  };

  const handleDelete = async (id: string) => {
      if(window.confirm("Yakin ingin menghapus voucher ini?")) {
          try {
            await SupabaseService.deleteDiscount(id);
            fetchDiscounts();
          } catch (e: any) {
            alert("Gagal menghapus voucher: " + (e.message || "Unknown error"));
          }
      }
  }

  const handleShowUsage = async (discount: Discount) => {
      setSelectedDiscount(discount);
      setShowUsageModal(true);
      setLoadingUsage(true);
      // Fetch all orders that used this code
      // Note: This isn't efficient for huge datasets but works for this scale. 
      // Ideally SupabaseService should expose a getOrdersByDiscountCode
      const allOrders = await SupabaseService.getOrders({ limit: 500 }); // Limit search
      const filtered = allOrders.filter(o => o.discountCode === discount.code);
      setUsageOrders(filtered);
      setLoadingUsage(false);
  };

  return (
    <div className="space-y-6 animate-fade-in pb-20">
      <div className="flex justify-between items-center">
        <div>
            <h2 className="text-2xl font-bold text-slate-800">Voucher Diskon</h2>
            <p className="text-slate-500 text-sm">Kelola kode promo dan kupon pelanggan.</p>
        </div>
        <button onClick={() => { setFormData({ type: 'FIXED', isActive: true, quota: 100 }); setIsEditing(true); }} className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition shadow-sm">
          <Plus size={18} /> Buat Voucher
        </button>
      </div>

      {isEditing && (
        <div className="bg-white p-6 rounded-xl shadow-lg border border-slate-200">
           <h3 className="font-bold text-lg mb-4">{formData.id ? 'Edit Voucher' : 'Buat Voucher Baru'}</h3>
           <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="col-span-1 md:col-span-2 lg:col-span-3 bg-blue-50 p-3 rounded-lg border border-blue-100 flex items-start gap-2 mb-2">
                <Tag size={16} className="text-blue-500 mt-1" />
                <div className="text-sm text-blue-800">
                    Tips: Gunakan kode yang mudah diingat seperti <strong>MERDEKA45</strong> atau <strong>DISKON10</strong>.
                </div>
            </div>
            
            <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Kode Voucher</label>
                <input 
                    placeholder="Contoh: PROMO10" 
                    className="w-full border p-2 rounded focus:ring-2 focus:ring-blue-500 outline-none uppercase font-bold tracking-wide" 
                    value={formData.code || ''} 
                    onChange={e => setFormData({...formData, code: e.target.value.toUpperCase()})} 
                    required 
                />
            </div>
            
            <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Tipe Potongan</label>
                <div className="flex bg-slate-100 p-1 rounded-lg">
                    <button 
                        type="button" 
                        onClick={() => setFormData({...formData, type: 'FIXED'})}
                        className={`flex-1 py-1.5 text-sm font-medium rounded transition flex items-center justify-center gap-1 ${formData.type === 'FIXED' ? 'bg-white shadow text-green-600' : 'text-slate-500'}`}
                    >
                        <DollarSign size={14}/> Nominal (Rp)
                    </button>
                    <button 
                        type="button" 
                        onClick={() => setFormData({...formData, type: 'PERCENTAGE'})}
                        className={`flex-1 py-1.5 text-sm font-medium rounded transition flex items-center justify-center gap-1 ${formData.type === 'PERCENTAGE' ? 'bg-white shadow text-blue-600' : 'text-slate-500'}`}
                    >
                        <Percent size={14}/> Persentase (%)
                    </button>
                </div>
            </div>

            <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Nilai Potongan</label>
                <input 
                    type="number" 
                    placeholder={formData.type === 'PERCENTAGE' ? "Contoh: 10 (untuk 10%)" : "Contoh: 5000"} 
                    className="w-full border p-2 rounded focus:ring-2 focus:ring-blue-500 outline-none" 
                    value={formData.value || ''} 
                    onChange={e => setFormData({...formData, value: parseFloat(e.target.value)})} 
                    required 
                />
            </div>

            <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Kuota Penggunaan</label>
                <input 
                    type="number" 
                    placeholder="Jumlah maks penggunaan" 
                    className="w-full border p-2 rounded focus:ring-2 focus:ring-blue-500 outline-none" 
                    value={formData.quota || ''} 
                    onChange={e => setFormData({...formData, quota: parseFloat(e.target.value)})} 
                    required 
                />
            </div>

            <div className="flex items-center gap-4">
                <label className="flex items-center gap-2 cursor-pointer mt-6">
                    <input 
                        type="checkbox" 
                        className="w-5 h-5 text-blue-600 rounded"
                        checked={formData.isActive}
                        onChange={e => setFormData({...formData, isActive: e.target.checked})}
                    />
                    <span className="font-medium text-slate-700">Status Aktif</span>
                </label>
            </div>
            
            <div className="col-span-1 md:col-span-2 lg:col-span-3 flex gap-2 justify-end mt-4">
                <button type="button" onClick={() => setIsEditing(false)} className="bg-slate-100 text-slate-600 px-6 py-2 rounded-lg hover:bg-slate-200">Batal</button>
                <button type="submit" className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 shadow-md">Simpan Voucher</button>
            </div>
           </form>
        </div>
      )}

      {loading ? <div className="text-center p-8 text-slate-500"><Loader2 className="animate-spin inline mr-2"/> Memuat voucher...</div> : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {discounts.map(disc => (
            <div key={disc.id} className={`p-6 rounded-xl shadow-sm border transition relative overflow-hidden ${disc.isActive ? 'bg-white border-slate-200' : 'bg-slate-50 border-slate-200 opacity-75'}`}>
                {/* Status Badge */}
                <div className={`absolute top-4 right-4 text-xs font-bold px-2 py-1 rounded-full ${disc.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'}`}>
                    {disc.isActive ? 'AKTIF' : 'NON-AKTIF'}
                </div>

                <div className="flex items-center gap-3 mb-4">
                    <div className="bg-purple-100 p-3 rounded-full text-purple-600">
                        <Tag size={24} />
                    </div>
                    <div>
                        <h3 className="font-bold text-xl text-slate-800 tracking-wide">{disc.code}</h3>
                        <p className="text-sm text-slate-500">{disc.type === 'PERCENTAGE' ? `Diskon ${disc.value}%` : `Potongan Rp ${disc.value.toLocaleString('id-ID')}`}</p>
                    </div>
                </div>

                <div className="space-y-3">
                    <div className="flex justify-between items-center text-sm">
                        <span className="text-slate-500">Kuota Terpakai</span>
                        <span className="font-bold text-slate-700">{disc.usedCount} / {disc.quota}</span>
                    </div>
                    {/* Progress Bar */}
                    <div className="w-full bg-slate-100 rounded-full h-2">
                        <div 
                            className={`h-2 rounded-full ${disc.usedCount >= disc.quota ? 'bg-red-500' : 'bg-blue-500'}`} 
                            style={{ width: `${Math.min((disc.usedCount / disc.quota) * 100, 100)}%` }}
                        ></div>
                    </div>
                </div>

                <div className="flex gap-2 mt-6 pt-4 border-t border-slate-100">
                    <button onClick={() => { setFormData(disc); setIsEditing(true); }} className="flex-1 text-blue-600 text-sm font-medium hover:bg-blue-50 py-2 rounded transition">Edit</button>
                    <button onClick={() => handleShowUsage(disc)} className="flex-1 text-slate-600 text-sm font-medium hover:bg-slate-50 py-2 rounded transition flex items-center justify-center gap-1">
                        <Users size={14} /> Riwayat
                    </button>
                    <button onClick={() => handleDelete(disc.id)} className="text-red-400 hover:text-red-600 p-2 hover:bg-red-50 rounded transition"><Trash2 size={18} /></button>
                </div>
            </div>
            ))}
        </div>
      )}

      {/* Usage Modal */}
      {showUsageModal && selectedDiscount && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 animate-fade-in">
            <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-lg max-h-[80vh] flex flex-col">
                <div className="flex justify-between items-start mb-4">
                    <div>
                        <h3 className="text-xl font-bold text-slate-800">Riwayat Penggunaan</h3>
                        <p className="text-slate-500 text-sm">Voucher: <span className="font-bold text-purple-600">{selectedDiscount.code}</span></p>
                    </div>
                    <button onClick={() => setShowUsageModal(false)} className="text-slate-400 hover:text-slate-600"><XCircle size={24} /></button>
                </div>

                <div className="flex-1 overflow-y-auto pr-2">
                    {loadingUsage ? (
                        <div className="text-center p-8 text-slate-500"><Loader2 className="animate-spin inline mr-2"/> Mencari data order...</div>
                    ) : usageOrders.length > 0 ? (
                        <div className="space-y-3">
                            <div className="bg-purple-50 p-3 rounded-lg text-sm text-purple-800 border border-purple-100 mb-2">
                                Total penggunaan di {usageOrders.length} pesanan.
                            </div>
                            {usageOrders.map(order => (
                                <div key={order.id} className="flex justify-between items-center p-3 border border-slate-200 rounded-lg hover:bg-slate-50">
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <span className="font-bold text-slate-700">#{order.id.slice(0, 8)}</span>
                                            <span className="text-xs text-slate-400">{new Date(order.createdAt).toLocaleDateString('id-ID')}</span>
                                        </div>
                                        <div className="text-sm text-slate-600">{order.customerName}</div>
                                    </div>
                                    <div className="text-right">
                                        <div className="font-bold text-green-600">- Rp {order.discountAmount?.toLocaleString('id-ID')}</div>
                                        <div className="text-xs text-slate-400">Total Akhir: Rp {order.totalAmount.toLocaleString('id-ID')}</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center h-48 text-slate-400">
                            <ShoppingBag size={48} className="mb-2 opacity-30" />
                            <p>Belum ada order yang menggunakan voucher ini.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
      )}
    </div>
  );
};
