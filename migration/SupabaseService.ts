
import { supabase } from './supabaseClient';
import { User, Location, Service, Customer, Order, OrderStatus, UserRole, Expense, PaymentMethod, Discount } from '../types';

/**
 * SupabaseService
 * Handles all database interactions.
 */

export const SupabaseService = {
  
  // --- AUTH / PROFILES ---
  
  async getCurrentProfile(userId?: string): Promise<User | null> {
    const fetchLogic = async () => {
        try {
            let uid = userId;
            if (!uid) {
                const { data: { session }, error: sessionError } = await supabase.auth.getSession();
                if (sessionError || !session?.user) return null; 
                uid = session.user.id;
            }
            if (!uid) return null;

            const { data: profile, error } = await supabase
            .from('profiles')
            .select('*')
            .or(`auth_id.eq.${uid},id.eq.${uid}`)
            .single();

            if (error) {
                if (error.code !== 'PGRST116') console.error("DB Error fetching profile:", error.message);
                return null;
            }
            if (!profile) return null;

            return {
            id: profile.id,
            name: profile.name,
            email: profile.email,
            role: profile.role as UserRole,
            locationId: profile.location_id,
            isApproved: profile.is_approved
            };
        } catch (err) {
            console.error("Critical error in getCurrentProfile:", err);
            return null;
        }
    };

    const timeoutPromise = new Promise<null>((resolve) => 
        setTimeout(() => {
            console.warn("getCurrentProfile timed out");
            resolve(null);
        }, 10000)
    );

    return Promise.race([fetchLogic(), timeoutPromise]);
  },

  async approveStaff(profileId: string): Promise<void> {
      const { error } = await supabase.from('profiles').update({ is_approved: true }).eq('id', profileId);
      if (error) throw error;
  },

  async rejectStaff(profileId: string): Promise<void> {
      const { error } = await supabase.from('profiles').delete().eq('id', profileId);
      if (error) throw error;
  },

  // --- DISCOUNTS ---

  async getDiscounts(): Promise<Discount[]> {
    const { data, error } = await supabase.from('discounts').select('*').order('created_at', { ascending: false });
    if (error) throw error;
    return data.map((d: any) => ({
      id: d.id,
      code: d.code,
      type: d.type,
      value: d.value,
      quota: d.quota,
      usedCount: d.used_count,
      isActive: d.is_active
    }));
  },

  async saveDiscount(disc: Discount): Promise<void> {
    try {
      const isNew = disc.id.startsWith('disc-');
      const payload = {
        code: disc.code.toUpperCase(),
        type: disc.type,
        value: disc.value,
        quota: disc.quota,
        is_active: disc.isActive
      };

      if (isNew) {
        const { error } = await supabase.from('discounts').insert([payload]);
        if(error) throw error;
      } else {
        const { error } = await supabase.from('discounts').update(payload).eq('id', disc.id);
        if(error) throw error;
      }
    } catch (err: any) {
      console.error("Failed to save discount:", err);
      alert(`Gagal menyimpan voucher: ${err.message || 'Unknown error'}`);
      throw err;
    }
  },

  async deleteDiscount(id: string): Promise<void> {
    const { error } = await supabase.from('discounts').delete().eq('id', id);
    if (error) throw error;
  },

  async validateDiscount(code: string): Promise<{ isValid: boolean; discount?: Discount; message?: string }> {
    const { data, error } = await supabase
      .from('discounts')
      .select('*')
      .eq('code', code.toUpperCase())
      .single();

    if (error || !data) {
      return { isValid: false, message: 'Kode voucher tidak ditemukan.' };
    }

    if (!data.is_active) {
      return { isValid: false, message: 'Voucher tidak aktif.' };
    }

    if (data.quota > 0 && data.used_count >= data.quota) {
      return { isValid: false, message: 'Kuota voucher habis.' };
    }

    return { 
      isValid: true, 
      discount: {
        id: data.id,
        code: data.code,
        type: data.type,
        value: data.value,
        quota: data.quota,
        usedCount: data.used_count,
        isActive: data.is_active
      } 
    };
  },

  // --- LOCATIONS ---

  async getLocations(): Promise<Location[]> {
    const { data, error } = await supabase.from('locations').select('*');
    if (error) throw error;
    return data || [];
  },

  async saveLocation(loc: Location): Promise<void> {
    try {
      const { id, ...payload } = loc;
      const isNew = id.startsWith('loc-');
      if (isNew) {
        const { error } = await supabase.from('locations').insert([payload]);
        if(error) throw error;
      } else {
        const { error } = await supabase.from('locations').update(payload).eq('id', id);
        if(error) throw error;
      }
    } catch (err: any) {
      throw err;
    }
  },

  async deleteLocation(id: string): Promise<void> {
    const { error } = await supabase.from('locations').delete().eq('id', id);
    if (error) throw error;
  },

  // --- SERVICES ---

  async getServices(): Promise<Service[]> {
    const { data, error } = await supabase.from('services').select('*');
    if (error) throw error;
    return data?.map((s: any) => ({
        id: s.id,
        name: s.name,
        price: s.price,
        unit: s.unit,
        description: s.description,
        durationHours: s.duration_hours !== null ? s.duration_hours : 48
    })) || [];
  },

  async saveService(svc: Service): Promise<void> {
    try {
      const isNew = svc.id.startsWith('svc-');
      const payload = {
          name: svc.name,
          price: svc.price,
          unit: svc.unit,
          description: svc.description,
          duration_hours: svc.durationHours ?? 48
      };
      if (isNew) {
        const { error } = await supabase.from('services').insert([payload]);
        if(error) throw error;
      } else {
        const { error } = await supabase.from('services').update(payload).eq('id', svc.id);
        if(error) throw error;
      }
    } catch (err: any) {
      throw err;
    }
  },

  async deleteService(id: string): Promise<void> {
    const { error } = await supabase.from('services').delete().eq('id', id);
    if (error) throw error;
  },

  // --- CUSTOMERS ---

  async getCustomers(): Promise<Customer[]> {
    const { data, error } = await supabase.from('customers').select('*');
    if (error) throw error;
    return data || [];
  },

  async saveCustomer(cust: Customer): Promise<Customer> {
    try {
      const { id, ...payload } = cust;
      const isNew = id.startsWith('cust-');
      if (isNew) {
        const { data, error } = await supabase.from('customers').insert([payload]).select().single();
        if(error) throw error;
        return data as Customer;
      } else {
        const { data, error } = await supabase.from('customers').update(payload).eq('id', id).select().single();
        if(error) throw error;
        return data as Customer;
      }
    } catch (err: any) {
       throw err;
    }
  },

  // --- ORDERS ---

  async getOrders(options?: { limit?: number, startDate?: string, endDate?: string }): Promise<Order[]> {
    let query = supabase.from('orders').select(`*, items:order_items (*)`).order('created_at', { ascending: false });

    if (options?.limit) query = query.limit(options.limit);
    if (options?.startDate) query = query.gte('created_at', options.startDate);
    if (options?.endDate) {
        let end = options.endDate;
        if (end.length === 10) end = `${end}T23:59:59`;
        query = query.lte('created_at', end);
    }

    const { data, error } = await query;
    if (error) throw error;
    if (!data) return [];

    return data.map((o: any) => ({
      id: o.id,
      customerId: o.customer_id,
      customerName: o.customer_name,
      locationId: o.location_id,
      totalAmount: o.total_amount,
      status: o.status as OrderStatus,
      isPaid: o.is_paid || false,
      paymentMethod: o.payment_method as PaymentMethod,
      createdAt: o.created_at,
      updatedAt: o.updated_at,
      perfume: o.perfume,
      receivedBy: o.received_by,
      completedBy: o.completed_by,
      rating: o.rating,
      review: o.review,
      discountCode: o.discount_code,
      discountAmount: o.discount_amount || 0,
      items: o.items.map((i: any) => ({
        serviceId: i.service_id,
        serviceName: i.service_name,
        price: i.price,
        quantity: i.quantity
      }))
    }));
  },

  async getOrderById(orderId: string): Promise<Order | null> {
    const { data, error } = await supabase.from('orders').select(`*, items:order_items (*)`).eq('id', orderId).single();

    if (error) { console.error("Error fetching specific order:", error); return null; }
    if (!data) return null;

    return {
      id: data.id,
      customerId: data.customer_id,
      customerName: data.customer_name,
      locationId: data.location_id,
      totalAmount: data.total_amount,
      status: data.status as OrderStatus,
      isPaid: data.is_paid || false,
      paymentMethod: data.payment_method as PaymentMethod,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
      perfume: data.perfume,
      receivedBy: data.received_by,
      completedBy: data.completed_by,
      rating: data.rating,
      review: data.review,
      discountCode: data.discount_code,
      discountAmount: data.discount_amount || 0,
      items: data.items.map((i: any) => ({
        serviceId: i.service_id,
        serviceName: i.service_name,
        price: i.price,
        quantity: i.quantity
      }))
    };
  },

  async saveOrder(ord: Order): Promise<Order> {
    try {
      const isNew = ord.id.startsWith('ord-');
      
      const orderPayload = {
        customer_id: ord.customerId,
        customer_name: ord.customerName,
        location_id: ord.locationId,
        total_amount: ord.totalAmount,
        status: ord.status,
        is_paid: ord.isPaid,
        payment_method: ord.paymentMethod,
        perfume: ord.perfume,
        received_by: ord.receivedBy,
        completed_by: ord.completedBy,
        rating: ord.rating,
        review: ord.review,
        discount_code: ord.discountCode,
        discount_amount: ord.discountAmount,
        updated_at: new Date().toISOString()
      };

      let orderId = ord.id;
      let savedOrderData: any = null;

      if (isNew) {
        // 1. Insert Order
        const { data, error } = await supabase
          .from('orders')
          .insert([{ ...orderPayload, created_at: new Date().toISOString() }])
          .select()
          .single();
        
        if (error) throw error;
        savedOrderData = data;
        orderId = data.id;

        // 2. Insert Items
        const itemsPayload = ord.items.map(i => ({
          order_id: orderId,
          service_id: i.serviceId,
          service_name: i.serviceName,
          price: i.price,
          quantity: i.quantity
        }));
        const { error: itemsError } = await supabase.from('order_items').insert(itemsPayload);
        if(itemsError) throw itemsError;

        // 3. Increment Discount Usage (if applicable)
        if (ord.discountCode) {
            // Using RPC or raw query is better for atomic increment, but let's do simple read-write or SQL increment
            // Supabase doesn't support easy `increment` via JS client without RPC.
            // We'll fetching the discount ID by code then increment.
            const { data: disc } = await supabase.from('discounts').select('id, used_count').eq('code', ord.discountCode).single();
            if (disc) {
                await supabase.from('discounts').update({ used_count: disc.used_count + 1 }).eq('id', disc.id);
            }
        }

      } else {
        const { data, error } = await supabase
            .from('orders')
            .update(orderPayload)
            .eq('id', orderId)
            .select()
            .single();
        if(error) throw error;
        savedOrderData = data;
      }

      return {
        id: orderId,
        customerId: savedOrderData.customer_id,
        customerName: savedOrderData.customer_name,
        locationId: savedOrderData.location_id,
        totalAmount: savedOrderData.total_amount,
        status: savedOrderData.status,
        isPaid: savedOrderData.is_paid || false,
        paymentMethod: savedOrderData.payment_method,
        createdAt: savedOrderData.created_at,
        updatedAt: savedOrderData.updated_at,
        perfume: savedOrderData.perfume,
        receivedBy: savedOrderData.received_by,
        completedBy: savedOrderData.completed_by,
        rating: savedOrderData.rating,
        review: savedOrderData.review,
        discountCode: savedOrderData.discount_code,
        discountAmount: savedOrderData.discount_amount || 0,
        items: ord.items
      };

    } catch (err: any) {
      console.error("Failed to save order:", err);
      alert(`Gagal menyimpan pesanan: ${err.message || 'Unknown error'}`);
      throw err;
    }
  },

  async deleteOrder(orderId: string): Promise<void> {
    const { error: itemsError } = await supabase.from('order_items').delete().eq('order_id', orderId);
    if (itemsError) throw itemsError;
    const { error } = await supabase.from('orders').delete().eq('id', orderId);
    if (error) throw error;
  },

  async updateOrderStatus(orderId: string, status: OrderStatus, completedBy?: string): Promise<void> {
    const payload: any = { status, updated_at: new Date().toISOString() };
    if (completedBy) payload.completed_by = completedBy;
    await supabase.from('orders').update(payload).eq('id', orderId);
  },

  async confirmPayment(orderId: string, method: PaymentMethod): Promise<void> {
    await supabase.from('orders').update({ is_paid: true, payment_method: method, updated_at: new Date().toISOString() }).eq('id', orderId);
  },

  // --- EXPENSES ---

  async getExpenses(options?: { startDate?: string, endDate?: string }): Promise<Expense[]> {
    let query = supabase.from('expenses').select('*').order('date', { ascending: false });
    if (options?.startDate) query = query.gte('date', options.startDate);
    if (options?.endDate) {
        let end = options.endDate;
        if (end.length === 10) end = `${end}T23:59:59`;
        query = query.lte('date', end);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data?.map((e: any) => ({
      id: e.id,
      description: e.description,
      amount: e.amount,
      category: e.category,
      date: e.date,
      recordedBy: e.recorded_by,
      locationId: e.location_id
    })) || [];
  },

  async saveExpense(exp: Expense): Promise<void> {
     try {
       const isNew = exp.id.startsWith('exp-');
       const payload = {
         description: exp.description,
         amount: exp.amount,
         category: exp.category,
         date: exp.date,
         recorded_by: exp.recordedBy,
         location_id: exp.locationId
       };
       if (isNew) {
         const { error } = await supabase.from('expenses').insert([payload]);
         if(error) throw error;
       } else {
         const { error } = await supabase.from('expenses').update(payload).eq('id', exp.id);
         if(error) throw error;
       }
     } catch (err: any) { throw err; }
  },

  async deleteExpense(id: string): Promise<void> {
    const { error } = await supabase.from('expenses').delete().eq('id', id);
    if (error) throw error;
  }
};
