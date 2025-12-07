import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import { SupabaseService } from '../migration/SupabaseService';
import { Order, OrderStatus, Expense } from '../types';
import { TrendingUp, DollarSign, Star, MessageSquare, Briefcase, UserCheck, Wallet, ArrowUpRight, ArrowDownRight, Calendar, Filter } from 'lucide-react';

export const AnalyticsDashboard: React.FC = () => {
  // Raw Data
  const [rawOrders, setRawOrders] = useState<Order[]>([]);
  const [rawExpenses, setRawExpenses] = useState<Expense[]>([]);
  
  // Filter State
  const [startDate, setStartDate] = useState(() => {
    const date = new Date();
    return new Date(date.getFullYear(), date.getMonth(), 1).toISOString().split('T')[0]; // Start of current month
  });
  const [endDate, setEndDate] = useState(() => {
    const date = new Date();
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).toISOString().split('T')[0]; // End of current month
  });
  console.log(rawExpenses);
  // Processed Data
  const [filteredExpensesAmount, setFilteredExpensesAmount] = useState(0);
  const [revenueData, setRevenueData] = useState<any[]>([]);
  const [statusData, setStatusData] = useState<any[]>([]);
  const [staffData, setStaffData] = useState<any[]>([]);
  const [staffDetails, setStaffDetails] = useState<any[]>([]);
  
  const [loadingData, setLoadingData] = useState(true);

  // Fetch data whenever date range changes
  useEffect(() => {
    fetchData();
  }, [startDate, endDate]);

  const fetchData = async () => {
    setLoadingData(true);
    try {
        // Optimized: Only fetch orders and expenses within the selected date range
        const [ordersData, expensesData] = await Promise.all([
          SupabaseService.getOrders({ startDate, endDate }),
          SupabaseService.getExpenses({ startDate, endDate })
        ]);
        
        setRawOrders(ordersData);
        setRawExpenses(expensesData);
        processMetrics(ordersData, expensesData);
    } catch (err) {
        console.error("Failed to fetch dashboard data", err);
    } finally {
        setLoadingData(false);
    }
  };

  const setQuickFilter = (type: 'TODAY' | 'WEEK' | 'MONTH' | 'LAST_MONTH') => {
      const now = new Date();
      let start = '';
      let end = '';

      switch (type) {
          case 'TODAY':
              start = end = now.toISOString().split('T')[0];
              break;
          case 'WEEK':
              const weekAgo = new Date(now);
              weekAgo.setDate(now.getDate() - 6);
              start = weekAgo.toISOString().split('T')[0];
              end = now.toISOString().split('T')[0];
              break;
          case 'MONTH':
              start = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
              end = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];
              break;
          case 'LAST_MONTH':
              start = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString().split('T')[0];
              end = new Date(now.getFullYear(), now.getMonth(), 0).toISOString().split('T')[0];
              break;
      }
      setStartDate(start);
      setEndDate(end);
  };

  const getDatesInRange = (startStr: string, endStr: string) => {
    const dateArray = [];
    let currentDate = new Date(startStr);
    const stopDate = new Date(endStr);
    
    // Safety check to prevent infinite loop if dates are huge
    const MAX_DAYS = 366; 
    let count = 0;

    while (currentDate <= stopDate && count < MAX_DAYS) {
        dateArray.push(currentDate.toISOString().split('T')[0]);
        currentDate.setDate(currentDate.getDate() + 1);
        count++;
    }
    return dateArray;
  };

  const processMetrics = (orders: Order[], expenses: Expense[]) => {
    // 1. Calculate Expenses Total
    const totalExp = expenses.reduce((sum, e) => sum + e.amount, 0);
    setFilteredExpensesAmount(totalExp);

    // 2. Prepare Revenue Chart Data (Daily)
    const dateRange = getDatesInRange(startDate, endDate);
    const revenueMap: Record<string, number> = {};
    
    // Init map with 0
    dateRange.forEach(date => revenueMap[date] = 0);

    // Fill with data
    orders.forEach(o => {
        const d = o.createdAt.split('T')[0];
        if (revenueMap[d] !== undefined) {
            revenueMap[d] += o.totalAmount;
        }
    });

    const chartData = dateRange.map(date => ({
        date: new Date(date).toLocaleDateString('id-ID', { day: '2-digit', month: 'short' }),
        originalDate: date,
        amount: revenueMap[date]
    }));
    setRevenueData(chartData);

    // 3. Status Counts
    const statusCounts = Object.values(OrderStatus).map(status => ({
        name: status,
        count: orders.filter(o => o.status === status).length
    }));
    setStatusData(statusCounts);

    // 4. Staff Performance
    const staffStats: Record<string, { count: number, revenue: number, ratings: number[], totalRating: number }> = {};
    
    orders.forEach(o => {
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

    const staffChart = Object.keys(staffStats).map(name => ({
      name,
      completed: staffStats[name].count
    }));
    setStaffData(staffChart);

    const staffList = Object.keys(staffStats).map(name => {
        const stats = staffStats[name];
        const avgRating = stats.ratings.length > 0 ? (stats.totalRating / stats.ratings.length).toFixed(1) : '-';
        return {
            name,
            count: stats.count,
            revenue: stats.revenue,
            avgRating
        };
    }).sort((a, b) => b.count - a.count);
    setStaffDetails(staffList);
  };

  const totalRevenue = rawOrders.reduce((sum, o) => sum + o.totalAmount, 0);
  const netProfit = totalRevenue - filteredExpensesAmount;
  const ratedOrders = rawOrders.filter(o => o.rating && o.rating > 0);
  const avgRating = ratedOrders.length > 0 
    ? (ratedOrders.reduce((sum, o) => sum + (o.rating || 0), 0) / ratedOrders.length).toFixed(1)
    : 'N/A';

  if (loadingData && rawOrders.length === 0) {
      return <div className="p-8 text-center text-slate-500">Loading dashboard data...</div>;
  }

  return (
    <div className="space-y-6 animate-fade-in pb-10">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-white p-4 rounded-xl shadow-sm border border-slate-100 gap-4">
        <div>
            <h2 className="text-2xl font-bold text-slate-800">Dashboard & Statistik</h2>
            <p className="text-slate-500 text-sm">Pantau performa bisnis laundry Anda.</p>
        </div>
        
        {/* Date Filter Controls */}
        <div className="flex flex-col md:flex-row gap-3 items-end md:items-center w-full md:w-auto">
             <div className="flex bg-slate-100 p-1 rounded-lg">
                <button onClick={() => setQuickFilter('TODAY')} className="px-3 py-1 text-xs font-medium text-slate-600 hover:bg-white hover:shadow-sm rounded transition">Hari Ini</button>
                <button onClick={() => setQuickFilter('WEEK')} className="px-3 py-1 text-xs font-medium text-slate-600 hover:bg-white hover:shadow-sm rounded transition">7 Hari</button>
                <button onClick={() => setQuickFilter('MONTH')} className="px-3 py-1 text-xs font-medium text-slate-600 hover:bg-white hover:shadow-sm rounded transition">Bulan Ini</button>
                <button onClick={() => setQuickFilter('LAST_MONTH')} className="px-3 py-1 text-xs font-medium text-slate-600 hover:bg-white hover:shadow-sm rounded transition">Bulan Lalu</button>
             </div>
             <div className="flex items-center gap-2 border border-slate-200 rounded-lg p-1 bg-white">
                <Calendar size={16} className="text-slate-400 ml-2" />
                <input 
                    type="date" 
                    value={startDate} 
                    onChange={e => setStartDate(e.target.value)}
                    className="text-sm text-slate-600 outline-none w-32"
                />
                <span className="text-slate-300">-</span>
                <input 
                    type="date" 
                    value={endDate} 
                    onChange={e => setEndDate(e.target.value)}
                    className="text-sm text-slate-600 outline-none w-32"
                />
             </div>
        </div>
      </div>

      {/* Filter Info */}
      <div className="flex items-center gap-2 text-xs text-slate-500 px-1">
         <Filter size={12} />
         <span>Menampilkan data dari <strong>{new Date(startDate).toLocaleDateString('id-ID')}</strong> sampai <strong>{new Date(endDate).toLocaleDateString('id-ID')}</strong></span>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border-l-4 border-green-500 flex items-center justify-between">
           <div>
              <p className="text-slate-500 text-xs uppercase font-bold tracking-wider">Omzet Kotor</p>
              <p className="text-2xl font-bold text-slate-800 mt-1">Rp {totalRevenue.toLocaleString('id-ID')}</p>
              <div className="flex items-center text-xs text-green-600 mt-1 font-medium"><ArrowUpRight size={14}/> Pendapatan</div>
           </div>
           <div className="bg-green-100 p-3 rounded-full text-green-600"><DollarSign size={24} /></div>
        </div>
        
        <div className="bg-white p-6 rounded-xl shadow-sm border-l-4 border-red-500 flex items-center justify-between">
           <div>
              <p className="text-slate-500 text-xs uppercase font-bold tracking-wider">Pengeluaran</p>
              <p className="text-2xl font-bold text-slate-800 mt-1">Rp {filteredExpensesAmount.toLocaleString('id-ID')}</p>
              <div className="flex items-center text-xs text-red-500 mt-1 font-medium"><ArrowDownRight size={14}/> Beban Operasional</div>
           </div>
           <div className="bg-red-100 p-3 rounded-full text-red-600"><Wallet size={24} /></div>
        </div>

        <div className="bg-gradient-to-br from-blue-600 to-blue-700 p-6 rounded-xl shadow-lg flex items-center justify-between text-white">
           <div>
              <p className="text-blue-100 text-xs uppercase font-bold tracking-wider">Profit Bersih</p>
              <p className="text-2xl font-bold mt-1">Rp {netProfit.toLocaleString('id-ID')}</p>
              <p className="text-xs text-blue-200 mt-1">Omzet - Pengeluaran</p>
           </div>
           <div className="bg-white/20 p-3 rounded-full text-white"><TrendingUp size={24} /></div>
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