import React, { useState, useEffect } from 'react';
import { Expense, User, Location } from '../types';
import { SupabaseService } from '../migration/SupabaseService';
import { Plus, Trash2, Calendar, User as UserIcon, Tag, DollarSign, Filter, Search, Loader2 } from 'lucide-react';

interface ExpenseManagementProps {
  currentUser: User;
}

export const ExpenseManagement: React.FC<ExpenseManagementProps> = ({ currentUser }) => {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [filterMonth, setFilterMonth] = useState(new Date().toISOString().slice(0, 7)); // YYYY-MM
  
  // Form State
  const [desc, setDesc] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('Operational');
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [locationId, setLocationId] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    const [exp, locs] = await Promise.all([
      SupabaseService.getExpenses(),
      SupabaseService.getLocations()
    ]);
    setExpenses(exp);
    setLocations(locs);
    
    // Default location for staff
    if (currentUser.locationId && !locationId) {
        setLocationId(currentUser.locationId);
    }
    setLoading(false);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!desc || !amount || !locationId) return;

    try {
      await SupabaseService.saveExpense({
        id: `exp-${Date.now()}`,
        description: desc,
        amount: parseFloat(amount),
        category,
        date: new Date(date).toISOString(),
        recordedBy: currentUser.name,
        locationId
      });
      
      setIsModalOpen(false);
      resetForm();
      fetchData();
    } catch (error) {
      alert("Gagal menyimpan pengeluaran.");
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm("Hapus catatan pengeluaran ini?")) {
      await SupabaseService.deleteExpense(id);
      fetchData();
    }
  };

  const resetForm = () => {
    setDesc('');
    setAmount('');
    setCategory('Operational');
    setDate(new Date().toISOString().slice(0, 10));
  };

  const filteredExpenses = expenses.filter(e => e.date.startsWith(filterMonth));
  const totalExpense = filteredExpenses.reduce((sum, e) => sum + e.amount, 0);

  return (
    <div className="space-y-6 animate-fade-in pb-20">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
           <h2 className="text-2xl font-bold text-slate-800">Catatan Pengeluaran</h2>
           <p className="text-slate-500 text-sm">Kelola biaya operasional laundry.</p>
        </div>
        <div className="flex gap-2 items-center bg-white p-2 rounded-lg shadow-sm border border-slate-200">
           <Filter size={16} className="text-slate-400 ml-2" />
           <input 
              type="month" 
              value={filterMonth} 
              onChange={e => setFilterMonth(e.target.value)}
              className="outline-none text-slate-600 text-sm"
           />
        </div>
      </div>

      {/* Summary Card */}
      <div className="bg-gradient-to-r from-red-500 to-pink-600 rounded-xl p-6 text-white shadow-lg">
          <p className="text-red-100 text-sm font-medium mb-1">Total Pengeluaran ({new Date(filterMonth).toLocaleString('default', { month: 'long', year: 'numeric' })})</p>
          <h3 className="text-3xl font-bold">Rp {totalExpense.toLocaleString('id-ID')}</h3>
      </div>

      <div className="flex justify-between items-center">
         <h3 className="font-bold text-slate-700">Riwayat Transaksi</h3>
         <button onClick={() => { resetForm(); setIsModalOpen(true); }} className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 shadow-md flex items-center gap-2">
            <Plus size={18} /> Tambah Pengeluaran
         </button>
      </div>

      {/* List */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        {loading ? <div className="p-8 text-center text-slate-500"><Loader2 className="animate-spin inline mr-2"/> Memuat data...</div> : (
          <table className="w-full text-left">
             <thead className="bg-slate-50 text-slate-500 font-semibold text-sm border-b border-slate-100">
                <tr>
                   <th className="p-4">Tanggal</th>
                   <th className="p-4">Keterangan</th>
                   <th className="p-4">Kategori</th>
                   <th className="p-4">Dicatat Oleh</th>
                   <th className="p-4 text-right">Jumlah</th>
                   <th className="p-4 w-10"></th>
                </tr>
             </thead>
             <tbody className="divide-y divide-slate-100 text-sm">
                {filteredExpenses.map(exp => (
                   <tr key={exp.id} className="hover:bg-slate-50">
                      <td className="p-4 text-slate-600 whitespace-nowrap">
                         <div className="flex items-center gap-2">
                            <Calendar size={14} className="text-slate-400"/>
                            {new Date(exp.date).toLocaleDateString('id-ID')}
                         </div>
                      </td>
                      <td className="p-4 font-medium text-slate-800">{exp.description}</td>
                      <td className="p-4">
                         <span className="px-2 py-1 bg-slate-100 text-slate-600 rounded text-xs font-medium border border-slate-200">
                            {exp.category}
                         </span>
                      </td>
                      <td className="p-4 text-slate-500">
                         <div className="flex items-center gap-1">
                            <UserIcon size={14} className="text-slate-400" /> {exp.recordedBy}
                         </div>
                      </td>
                      <td className="p-4 text-right font-bold text-red-600">Rp {exp.amount.toLocaleString('id-ID')}</td>
                      <td className="p-4 text-right">
                         <button onClick={() => handleDelete(exp.id)} className="text-slate-400 hover:text-red-500 transition">
                            <Trash2 size={16} />
                         </button>
                      </td>
                   </tr>
                ))}
                {filteredExpenses.length === 0 && (
                   <tr><td colSpan={6} className="p-8 text-center text-slate-400 italic">Tidak ada data pengeluaran bulan ini.</td></tr>
                )}
             </tbody>
          </table>
        )}
      </div>

      {/* Modal Form */}
      {isModalOpen && (
         <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 animate-fade-in">
            <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-md">
               <h3 className="text-xl font-bold text-slate-800 mb-4">Input Pengeluaran</h3>
               <form onSubmit={handleSave} className="space-y-4">
                  <div>
                     <label className="block text-sm font-medium text-slate-700 mb-1">Keterangan</label>
                     <input 
                        className="w-full border border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-red-500 outline-none" 
                        placeholder="Contoh: Beli Gas 3kg, Deterjen Cair"
                        value={desc}
                        onChange={e => setDesc(e.target.value)}
                        required
                        autoFocus
                     />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                     <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Nominal (Rp)</label>
                        <input 
                           type="number"
                           className="w-full border border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-red-500 outline-none" 
                           placeholder="0"
                           value={amount}
                           onChange={e => setAmount(e.target.value)}
                           required
                        />
                     </div>
                     <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Tanggal</label>
                        <input 
                           type="date"
                           className="w-full border border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-red-500 outline-none" 
                           value={date}
                           onChange={e => setDate(e.target.value)}
                           required
                        />
                     </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Kategori</label>
                        <select 
                            className="w-full border border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-red-500 outline-none bg-white"
                            value={category}
                            onChange={e => setCategory(e.target.value)}
                        >
                            <option value="Operational">Operasional (Gas/Listrik)</option>
                            <option value="Supplies">Bahan Baku (Sabun/Parfum)</option>
                            <option value="Maintenance">Perbaikan/Maintenance</option>
                            <option value="Snack">Konsumsi</option>
                            <option value="Other">Lainnya</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Outlet</label>
                        <select 
                            className="w-full border border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-red-500 outline-none bg-white"
                            value={locationId}
                            onChange={e => setLocationId(e.target.value)}
                            required
                        >
                            <option value="">Pilih Outlet</option>
                            {locations.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
                        </select>
                      </div>
                  </div>
                  
                  <div className="flex gap-3 justify-end mt-6 pt-4 border-t border-slate-100">
                     <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-slate-600 hover:bg-slate-50 rounded-lg">Batal</button>
                     <button type="submit" className="px-4 py-2 bg-red-600 text-white font-medium rounded-lg hover:bg-red-700 shadow">Simpan</button>
                  </div>
               </form>
            </div>
         </div>
      )}
    </div>
  );
};