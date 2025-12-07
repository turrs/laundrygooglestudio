import React, { useState, useEffect } from 'react';
import { SupabaseService } from '../migration/SupabaseService';
import { Order, OrderStatus } from '../types';
import { Package, CheckCircle, Clock, Star, MapPin, Phone } from 'lucide-react';

interface TrackingPageProps {
  orderId: string;
}

export const TrackingPage: React.FC<TrackingPageProps> = ({ orderId }) => {
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [rating, setRating] = useState(0);
  const [review, setReview] = useState('');
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    fetchOrder();
  }, [orderId]);

  const fetchOrder = async () => {
    try {
        const orders = await SupabaseService.getOrders(); // Optimization: In real app, make getOrderById(id)
        const found = orders.find(o => o.id === orderId);
        setOrder(found || null);
        if (found && found.rating) {
            setRating(found.rating);
            setReview(found.review || '');
            setSubmitted(true);
        }
    } catch (e) {
        console.error(e);
    } finally {
        setLoading(false);
    }
  };

  const handleSubmitFeedback = async (e: React.FormEvent) => {
    e.preventDefault();
    if (order && rating > 0) {
      const updatedOrder = { ...order, rating, review };
      await SupabaseService.saveOrder(updatedOrder);
      setOrder(updatedOrder);
      setSubmitted(true);
    }
  };

  const getStatusStep = (status: OrderStatus) => {
    switch (status) {
      case OrderStatus.PENDING: return 1;
      case OrderStatus.PROCESSING: return 2;
      case OrderStatus.READY: return 3;
      case OrderStatus.COMPLETED: return 4;
      default: return 0;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
        <Package size={64} className="text-slate-300 mb-4" />
        <h1 className="text-2xl font-bold text-slate-800">Pesanan Tidak Ditemukan</h1>
        <p className="text-slate-500 mt-2">Silakan periksa kembali link tracking Anda.</p>
      </div>
    );
  }

  const currentStep = getStatusStep(order.status);

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8 font-sans">
      <div className="max-w-2xl mx-auto bg-white rounded-2xl shadow-xl overflow-hidden">
        {/* Header */}
        <div className="bg-blue-600 p-8 text-white text-center">
          <h1 className="text-2xl font-bold mb-2">LaunderLink Tracking</h1>
          <p className="opacity-90 bg-blue-700 inline-block px-3 py-1 rounded-lg text-sm">Order #{order.id.slice(0, 8)}</p>
        </div>

        <div className="p-6 md:p-8 space-y-10">
          {/* Status Tracker */}
          <div className="relative pt-4">
             <div className="absolute left-0 top-1/2 w-full h-1 bg-slate-100 -z-10 transform -translate-y-1/2 rounded"></div>
             <div className="flex justify-between">
                {[
                  { s: OrderStatus.PENDING, label: 'Diterima', icon: Clock },
                  { s: OrderStatus.PROCESSING, label: 'Dicuci', icon: Package },
                  { s: OrderStatus.READY, label: 'Siap', icon: CheckCircle },
                  { s: OrderStatus.COMPLETED, label: 'Selesai', icon: CheckCircle },
                ].map((step, idx) => {
                  const stepNum = idx + 1;
                  const isActive = stepNum <= currentStep;
                  const isCurrent = stepNum === currentStep;
                  return (
                    <div key={step.s} className="flex flex-col items-center bg-white px-1 relative z-10">
                       <div className={`w-12 h-12 rounded-full flex items-center justify-center border-4 transition-all duration-300 ${isActive ? 'bg-blue-600 border-blue-100 text-white shadow-lg scale-110' : 'bg-white border-slate-200 text-slate-300'}`}>
                          <step.icon size={20} />
                       </div>
                       <span className={`text-xs mt-3 font-bold uppercase tracking-wide ${isCurrent ? 'text-blue-600' : 'text-slate-400'}`}>{step.label}</span>
                    </div>
                  );
                })}
             </div>
          </div>

          {/* Order Details */}
          <div className="bg-slate-50 rounded-2xl p-6 border border-slate-100">
             <h3 className="font-bold text-slate-800 mb-4 border-b border-slate-200 pb-2">Ringkasan Pesanan</h3>
             <div className="space-y-3">
                {order.items.map((item, i) => (
                  <div key={i} className="flex justify-between text-sm items-center">
                    <span className="text-slate-700 font-medium">{item.serviceName} <span className="text-slate-400 text-xs ml-1">x {item.quantity}</span></span>
                    <span className="font-bold text-slate-800">${(item.price * item.quantity).toFixed(2)}</span>
                  </div>
                ))}
                <div className="border-t border-slate-200 pt-3 flex justify-between items-center mt-4">
                   <span className="text-slate-500 font-medium">Total Tagihan</span>
                   <span className="text-xl font-extrabold text-blue-600">${order.totalAmount.toFixed(2)}</span>
                </div>
             </div>
          </div>

          {/* Feedback Section */}
          <div className="text-center pt-6 border-t border-slate-100">
             <h3 className="text-xl font-bold text-slate-800 mb-2">
                {submitted ? 'Terima Kasih atas Masukan Anda!' : 'Beri Nilai Layanan Kami'}
             </h3>
             
             {!submitted ? (
               <form onSubmit={handleSubmitFeedback} className="space-y-6 mt-6">
                  <div className="flex justify-center gap-3">
                     {[1, 2, 3, 4, 5].map((star) => (
                        <button 
                          key={star} 
                          type="button"
                          onClick={() => setRating(star)}
                          className={`transition-all hover:scale-125 duration-200 ${rating >= star ? 'text-yellow-400 drop-shadow-sm' : 'text-slate-200'}`}
                        >
                           <Star size={40} fill={rating >= star ? "currentColor" : "none"} strokeWidth={1.5} />
                        </button>
                     ))}
                  </div>
                  
                  <textarea 
                    className="w-full border border-slate-200 bg-slate-50 rounded-xl p-4 focus:ring-2 focus:ring-blue-500 focus:bg-white outline-none resize-none transition-colors"
                    rows={3}
                    placeholder="Ceritakan pengalaman Anda..."
                    value={review}
                    onChange={(e) => setReview(e.target.value)}
                  />

                  <button 
                    type="submit" 
                    disabled={rating === 0}
                    className="w-full bg-blue-600 text-white py-4 rounded-xl font-bold hover:bg-blue-700 disabled:bg-slate-300 disabled:cursor-not-allowed transition shadow-xl shadow-blue-200"
                  >
                    Kirim Ulasan
                  </button>
               </form>
             ) : (
               <div className="space-y-4 animate-fade-in mt-6 bg-yellow-50 p-6 rounded-2xl border border-yellow-100">
                  <div className="flex justify-center gap-1 text-yellow-400">
                     {Array.from({length: rating}).map((_, i) => <Star key={i} size={28} fill="currentColor" />)}
                  </div>
                  <p className="text-slate-700 italic font-medium">"{review}"</p>
                  <p className="text-green-600 font-bold flex items-center justify-center gap-2 mt-2">
                     <CheckCircle size={20} /> Masukan diterima
                  </p>
               </div>
             )}
          </div>
        </div>

        {/* Footer */}
        <div className="bg-slate-50 p-6 text-center text-xs text-slate-400 border-t border-slate-200">
           &copy; {new Date().getFullYear()} LaunderLink Pro.
        </div>
      </div>
    </div>
  );
};