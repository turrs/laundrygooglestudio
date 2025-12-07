
import { supabase } from './supabaseClient';
import { User, Location, Service, Customer, Order, OrderStatus, UserRole, Expense } from '../types';

/**
 * SupabaseService
 * Handles all database interactions.
 */

export const SupabaseService = {
  
  // --- AUTH / PROFILES ---
  
  async getCurrentProfile(): Promise<User | null> {
    const { data: { user } } = await (supabase.auth as any).getUser();
    if (!user) return null;

    // Try fetching by auth_id (new schema) OR id (legacy schema compatibility)
    // We try to find a profile where auth_id matches OR id matches
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('*')
      .or(`auth_id.eq.${user.id},id.eq.${user.id}`) // Flexible check
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 is 'not found'
        console.error("Error fetching profile:", JSON.stringify(error));
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
  },

  async approveStaff(profileId: string): Promise<void> {
      const { error } = await supabase
        .from('profiles')
        .update({ is_approved: true })
        .eq('id', profileId);
      
      if (error) throw error;
  },

  async rejectStaff(profileId: string): Promise<void> {
      // Option A: Just delete the profile
      const { error } = await supabase
        .from('profiles')
        .delete()
        .eq('id', profileId);
        
      if (error) throw error;
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
    } catch (err) {
      console.error("Failed to save location:", err);
      alert("Gagal menyimpan lokasi. Cek console untuk detail.");
      throw err;
    }
  },

  async deleteLocation(id: string): Promise<void> {
    await supabase.from('locations').delete().eq('id', id);
  },

  // --- SERVICES ---

  async getServices(): Promise<Service[]> {
    const { data, error } = await supabase.from('services').select('*');
    if (error) throw error;
    return data || [];
  },

  async saveService(svc: Service): Promise<void> {
    try {
      const { id, ...payload } = svc;
      const isNew = id.startsWith('svc-');

      if (isNew) {
        const { error } = await supabase.from('services').insert([payload]);
        if(error) throw error;
      } else {
        const { error } = await supabase.from('services').update(payload).eq('id', id);
        if(error) throw error;
      }
    } catch (err) {
      console.error("Failed to save service:", err);
      alert("Gagal menyimpan layanan. Pastikan harga berupa angka.");
      throw err;
    }
  },

  async deleteService(id: string): Promise<void> {
    await supabase.from('services').delete().eq('id', id);
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
    } catch (err) {
       console.error("Failed to save customer:", JSON.stringify(err));
       alert("Gagal menyimpan pelanggan.");
       throw err;
    }
  },

  // --- ORDERS ---

  // OPTIMIZED: Added limit and date range options
  async getOrders(options?: { limit?: number, startDate?: string, endDate?: string }): Promise<Order[]> {
    // Join with order_items
    let query = supabase
      .from('orders')
      .select(`
        *,
        items:order_items (*)
      `)
      .order('created_at', { ascending: false });

    // Apply Limits (Pagination)
    if (options?.limit) {
        query = query.limit(options.limit);
    }

    // Apply Date Filters (for Dashboard)
    // IMPORTANT: endDate usually needs to cover the full day, so we might need to adjust logic if just 'YYYY-MM-DD' is passed.
    // Here we assume ISO strings or dates provided correctly.
    if (options?.startDate) {
        query = query.gte('created_at', options.startDate); // Start of day
    }
    if (options?.endDate) {
        // Ensure we get everything up to the end of that day if a simple date string is passed
        let end = options.endDate;
        if (end.length === 10) end = `${end}T23:59:59`;
        query = query.lte('created_at', end);
    }

    const { data, error } = await query;

    if (error) throw error;
    if (!data) return [];

    // Map DB snake_case to App camelCase
    return data.map((o: any) => ({
      id: o.id,
      customerId: o.customer_id,
      customerName: o.customer_name,
      locationId: o.location_id,
      totalAmount: o.total_amount,
      status: o.status as OrderStatus,
      createdAt: o.created_at,
      updatedAt: o.updated_at,
      perfume: o.perfume,
      receivedBy: o.received_by,
      completedBy: o.completed_by,
      rating: o.rating,
      review: o.review,
      items: o.items.map((i: any) => ({
        serviceId: i.service_id,
        serviceName: i.service_name,
        price: i.price,
        quantity: i.quantity
      }))
    }));
  },

  async getOrderById(orderId: string): Promise<Order | null> {
    const { data, error } = await supabase
      .from('orders')
      .select(`
        *,
        items:order_items (*)
      `)
      .eq('id', orderId)
      .single();

    if (error) {
        console.error("Error fetching specific order:", error);
        return null;
    }
    if (!data) return null;

    return {
      id: data.id,
      customerId: data.customer_id,
      customerName: data.customer_name,
      locationId: data.location_id,
      totalAmount: data.total_amount,
      status: data.status as OrderStatus,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
      perfume: data.perfume,
      receivedBy: data.received_by,
      completedBy: data.completed_by,
      rating: data.rating,
      review: data.review,
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
      
      // Prepare Order Payload
      const orderPayload = {
        customer_id: ord.customerId,
        customer_name: ord.customerName,
        location_id: ord.locationId,
        total_amount: ord.totalAmount,
        status: ord.status,
        perfume: ord.perfume,
        received_by: ord.receivedBy,
        completed_by: ord.completedBy,
        rating: ord.rating,
        review: ord.review,
        updated_at: new Date().toISOString()
      };

      let orderId = ord.id;
      let savedOrderData: any = null;

      if (isNew) {
        // Insert new order and get the REAL UUID
        const { data, error } = await supabase
          .from('orders')
          .insert([{ ...orderPayload, created_at: new Date().toISOString() }])
          .select()
          .single();
        
        if (error) throw error;
        savedOrderData = data;
        orderId = data.id;

        // Insert Items
        const itemsPayload = ord.items.map(i => ({
          order_id: orderId,
          service_id: i.serviceId,
          service_name: i.serviceName,
          price: i.price,
          quantity: i.quantity
        }));
        
        const { error: itemsError } = await supabase.from('order_items').insert(itemsPayload);
        if(itemsError) throw itemsError;

      } else {
        // Update Order
        const { data, error } = await supabase
            .from('orders')
            .update(orderPayload)
            .eq('id', orderId)
            .select()
            .single();
            
        if(error) throw error;
        savedOrderData = data;
      }

      // Return the full Order object to update local state
      return {
        id: orderId,
        customerId: savedOrderData.customer_id,
        customerName: savedOrderData.customer_name,
        locationId: savedOrderData.location_id,
        totalAmount: savedOrderData.total_amount,
        status: savedOrderData.status,
        createdAt: savedOrderData.created_at,
        updatedAt: savedOrderData.updated_at,
        perfume: savedOrderData.perfume,
        receivedBy: savedOrderData.received_by,
        completedBy: savedOrderData.completed_by,
        rating: savedOrderData.rating,
        review: savedOrderData.review,
        items: ord.items // Items are usually static or we assume they saved correctly
      };

    } catch (err) {
      console.error("Failed to save order:", JSON.stringify(err));
      alert("Gagal menyimpan pesanan. Cek koneksi atau data input.");
      throw err;
    }
  },

  async updateOrderStatus(orderId: string, status: OrderStatus, completedBy?: string): Promise<void> {
    const payload: any = { status, updated_at: new Date().toISOString() };
    if (completedBy) payload.completed_by = completedBy;
    
    await supabase.from('orders').update(payload).eq('id', orderId);
  },

  // --- EXPENSES ---

  // OPTIMIZED: Added date range
  async getExpenses(options?: { startDate?: string, endDate?: string }): Promise<Expense[]> {
    let query = supabase
      .from('expenses')
      .select('*')
      .order('date', { ascending: false });

    if (options?.startDate) {
        query = query.gte('date', options.startDate);
    }
    if (options?.endDate) {
        let end = options.endDate;
        if (end.length === 10) end = `${end}T23:59:59`;
        query = query.lte('date', end);
    }

    const { data, error } = await query;

    if (error) throw error;
    if (!data) return [];

    return data.map((e: any) => ({
      id: e.id,
      description: e.description,
      amount: e.amount,
      category: e.category,
      date: e.date,
      recordedBy: e.recorded_by,
      locationId: e.location_id
    }));
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
     } catch (err) {
       console.error("Failed to save expense:", err);
       throw err;
     }
  },

  async deleteExpense(id: string): Promise<void> {
    await supabase.from('expenses').delete().eq('id', id);
  }
};
