import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import { SupabaseService } from '../migration/SupabaseService';
import { Order, OrderStatus } from '../types';
import { TrendingUp, DollarSign, Package, Star, MessageSquare, Briefcase, UserCheck } from 'lucide-react';

export const AnalyticsDashboard: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [revenueData, setRevenueData] = useState<any[]>([]);
  const [statusData, setStatusData] = useState<any[]>([]);
  const [staffData, setStaffData] = useState<any[]>([]);
  const [staffDetails, setStaffDetails] = useState<any[]>([]);
  const [loadingData, setLoadingData] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
        const data = await SupabaseService.getOrders();
        setOrders(data);
        processData(data);
    } catch (err) {
        console.error("Failed to fetch dashboard data", err);
    } finally {
        setLoadingData(false);
    }
  };

  const processData = (data: Order[]) => {
    // 1. Revenue per day (Last 7 days)
    const last7Days = Array.from({length: 7}, (_, i) => {
        const d = new Date();
        d.setDate(d.getDate() - i);
        return d.toISOString().split('T')[0];
    }).reverse();

    const revenue = last7Days.map(date => {
        const dayTotal = data
            .filter(o => o.createdAt.startsWith(date))
            .reduce((sum, o) => sum + o.totalAmount, 0);
        return { date, amount: dayTotal };
    });
    setRevenueData(revenue);

    // 2. Status counts
    const statusCounts = Object.values(OrderStatus).map(status => ({
        name: status,
        count: data.filter(o => o.status === status).length
    }));
    setStatusData(statusCounts);

    // 3. Staff Performance (Chart & Details)
    const staffStats: Record<string, { count: number, revenue: number, ratings: number[], totalRating: number }> = {};
    
    data.forEach(o => {
      if (o.completedBy) {
        if (!staffStats[o.completedBy]) {
            staffStats[o.completedBy] = { count: 0, revenue: 0, ratings: [], totalRating: 0 };
        }
        staffStats[o.completedBy].count += 1;
        staffStats[o.completedBy].revenue += o.totalAmount;
        if (o.rating) {
            staffStats[o.completedBy].ratings.push(o.rating);
            staffStats[o.completedBy].totalRating += o.rating;
        }
      }
    });

    // For Chart
    const staffChart = Object.keys(staffStats).map(name => ({
      name,
      completed: staffStats[name].count
    }));
    setStaffData(staffChart);

    // For Detailed List
    const staffList = Object.keys(staffStats).map(name => {
        const stats = staffStats[name];
        const avgRating = stats.ratings.length > 0 ? (stats.totalRating / stats.ratings.length).toFixed(1) : '-';
        return {
            name,
            count: stats.count,
            revenue: stats.revenue,
            avgRating
        };
    }).sort((a, b) => b.count - a.count); // Sort by highest completed
    setStaffDetails(staffList);
  };

  const totalRevenue = orders.reduce((sum, o) => sum + o.totalAmount, 0);
  const ratedOrders = orders.filter(o => o.rating && o.rating > 0);
  const avgRating = ratedOrders.length > 0 
    ? (ratedOrders.reduce((sum, o) => sum + (o.rating || 0), 0) / ratedOrders.length).toFixed(1)
    : 'N/A';

  if (loadingData) {
      return <div className="p-8 text-center text-slate-500">Loading dashboard data...</div>;
  }

  return (
    <div className="space-y-8 animate-fade-in pb-10">
      <div className="flex justify-between items-center bg-white p-4 rounded-xl shadow-sm border border-slate-100">
        <div>
            <h2 className="text-2xl font-bold text-slate-800">Dashboard & Statistik</h2>
            <p className="text-slate-500 text-sm">Pantau performa bisnis laundry Anda.</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border-l-4 border-green-500 flex items-center justify-between">
           <div>
              <p className="text-slate-500 text-xs uppercase font-bold tracking-wider">Pendapatan</p>
              <p className="text-2xl font-bold text-slate-800 mt-1">Rp {totalRevenue.toLocaleString('id-ID')}</p>
           </div>
           <div className="bg-green-100 p-3 rounded-full text-green-600"><DollarSign size={24} /></div>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border-l-4 border-blue-500 flex items-center justify-between">
           <div>
              <p className="text-slate-500 text-xs uppercase font-bold tracking-wider">Total Pesanan</p>
              <p className="text-2xl font-bold text-slate-800 mt-1">{orders.length}</p>
           </div>
           <div className="bg-blue-100 p-3 rounded-full text-blue-600"><Package size={24} /></div>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border-l-4 border-purple-500 flex items-center justify-between">
           <div>
              <p className="text-slate-500 text-xs uppercase font-bold tracking-wider">Rata-rata Order</p>
              <p className="text-2xl font-bold text-slate-800 mt-1">Rp {orders.length ? (totalRevenue / orders.length).toLocaleString('id-ID') : '0'}</p>
           </div>
           <div className="bg-purple-100 p-3 rounded-full text-purple-600"><TrendingUp size={24} /></div>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border-l-4 border-yellow-400 flex items-center justify-between">
           <div>
              <p className="text-slate-500 text-xs uppercase font-bold tracking-wider">Rating Toko</p>
              <p className="text-2xl font-bold text-slate-800 mt-1">{avgRating}</p>
           </div>
           <div className="bg-yellow-100 p-3 rounded-full text-yellow-600"><Star size={24} /></div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
         {/* Charts Column */}
         <div className="lg:col-span-2 space-y-6">
             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
                    <h3 className="font-bold text-lg mb-6 text-slate-800">Tren Pendapatan</h3>
                    <div className="h-56">
                       <ResponsiveContainer width="100%" height="100%">
                          <LineChart data={revenueData}>
                             <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                             <XAxis dataKey="date" tick={{fontSize: 10, fill: '#64748b'}} axisLine={false} tickLine={false} />
                             <YAxis tick={{fontSize: 10, fill: '#64748b'}} axisLine={false} tickLine={false} tickFormatter={(value) => `${value/1000}k`} />
                             <Tooltip contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}} formatter={(value: any) => `Rp ${value.toLocaleString('id-ID')}`} />
                             <Line type="monotone" dataKey="amount" stroke="#2563eb" strokeWidth={3} dot={{r: 4, fill: '#2563eb', strokeWidth: 2, stroke: '#fff'}} />
                          </LineChart>
                       </ResponsiveContainer>
                    </div>
                 </div>

                 <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
                    <h3 className="font-bold text-lg mb-6 text-slate-800">Status Pesanan</h3>
                    <div className="h-56">
                       <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={statusData}>
                             <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                             <XAxis dataKey="name" tick={{fontSize: 10, fill: '#64748b'}} axisLine={false} tickLine={false} />
                             <YAxis tick={{fontSize: 10, fill: '#64748b'}} axisLine={false} tickLine={false} />
                             <Tooltip cursor={{fill: '#f8fafc'}} contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}} />
                             <Bar dataKey="count" fill="#4f46e5" radius={[6, 6, 0, 0]} />
                          </BarChart>
                       </ResponsiveContainer>
                    </div>
                 </div>
             </div>
             
             {/* Staff Performance Section */}
             <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
                <div className="p-6 border-b border-slate-100 flex justify-between items-center">
                    <h3 className="font-bold text-lg text-slate-800 flex items-center gap-2">
                        <UserCheck size={20} className="text-blue-500" /> Detail Kinerja Pegawai
                    </h3>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2">
                    {/* Chart Side */}
                    <div className="p-6 border-r border-slate-100">
                        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">Grafik Penyelesaian</h4>
                        <div className="h-64">
                            {staffData.length > 0 ? (
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={staffData} layout="vertical">
                                        <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                                        <XAxis type="number" tick={{fontSize: 12}} hide />
                                        <YAxis dataKey="name" type="category" tick={{fontSize: 12, fill: '#475569'}} width={100} axisLine={false} tickLine={false} />
                                        <Tooltip cursor={{fill: '#f8fafc'}} />
                                        <Bar dataKey="completed" fill="#0ea5e9" radius={[0, 4, 4, 0]} barSize={24} label={{ position: 'right', fill: '#64748b', fontSize: 12 }} />
                                    </BarChart>
                                </ResponsiveContainer>
                            ) : (
                                <div className="h-full flex flex-col items-center justify-center text-slate-400">
                                    <Briefcase size={32} className="mb-2 opacity-50" />
                                    <span className="text-sm">Belum ada data kinerja</span>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Table Side */}
                    <div className="p-0">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm">
                                <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-100">
                                    <tr>
                                        <th className="p-4">Pegawai</th>
                                        <th className="p-4 text-center">Selesai</th>
                                        <th className="p-4 text-right">Omzet</th>
                                        <th className="p-4 text-center">Rating</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {staffDetails.length > 0 ? staffDetails.map((staff, idx) => (
                                        <tr key={idx} className="hover:bg-slate-50 transition-colors">
                                            <td className="p-4 font-medium text-slate-800">{staff.name}</td>
                                            <td className="p-4 text-center">
                                                <span className="bg-blue-100 text-blue-700 py-1 px-2 rounded-full text-xs font-bold">
                                                    {staff.count}
                                                </span>
                                            </td>
                                            <td className="p-4 text-right font-medium text-green-600">Rp {staff.revenue.toLocaleString('id-ID')}</td>
                                            <td className="p-4 text-center">
                                                <div className="flex items-center justify-center gap-1 text-yellow-500 font-bold">
                                                    <Star size={14} fill="currentColor" /> {staff.avgRating}
                                                </div>
                                            </td>
                                        </tr>
                                    )) : (
                                        <tr>
                                            <td colSpan={4} className="p-8 text-center text-slate-400 italic">Belum ada data pegawai</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
             </div>
         </div>

         {/* Reviews Column */}
         <div className="lg:col-span-1">
             <div className="bg-white rounded-xl shadow-sm border border-slate-100 h-full flex flex-col overflow-hidden">
                <div className="p-6 border-b border-slate-100">
                    <h3 className="font-bold text-lg text-slate-800 flex items-center gap-2">
                        <MessageSquare size={20} className="text-pink-500" /> Ulasan Terbaru
                    </h3>
                </div>
                <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50">
                   {ratedOrders.length === 0 ? (
                      <div className="flex flex-col items-center justify-center h-40 text-slate-400">
                          <Star size={32} className="mb-2 opacity-30" />
                          <p className="text-sm italic">Belum ada ulasan.</p>
                      </div>
                   ) : (
                      ratedOrders.slice().reverse().map(order => (
                         <div key={order.id} className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
                            <div className="flex justify-between items-start mb-2">
                               <div>
                                   <span className="font-bold text-slate-800 block text-sm">{order.customerName}</span>
                                   <span className="text-xs text-slate-400">{new Date(order.updatedAt).toLocaleDateString()}</span>
                               </div>
                               <div className="bg-yellow-50 px-2 py-1 rounded-lg flex gap-1 text-yellow-400">
                                   {Array.from({length: order.rating || 0}).map((_, i) => <Star key={i} size={10} fill="currentColor" />)}
                               </div>
                            </div>
                            <p className="text-sm text-slate-600 leading-relaxed">"{order.review}"</p>
                            {order.completedBy && (
                                <div className="mt-3 pt-2 border-t border-slate-50 text-xs text-slate-400">
                                    Dilayani oleh: <span className="text-slate-600 font-medium">{order.completedBy}</span>
                                </div>
                            )}
                         </div>
                      ))
                   )}
                </div>
             </div>
         </div>
      </div>
    </div>
  );
};