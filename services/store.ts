import { User, Location, Service, Customer, Order, OrderStatus, UserRole } from '../types';

// Initial Seed Data
const SEED_LOCATIONS: Location[] = [
  { id: 'loc-1', name: 'Downtown Branch', address: '123 Main St', phone: '555-0101' },
  { id: 'loc-2', name: 'Westside Hub', address: '456 West Ave', phone: '555-0102' }
];

const SEED_SERVICES: Service[] = [
  { id: 'svc-1', name: 'Wash & Fold', price: 1.50, unit: 'kg', description: 'Standard machine wash' },
  { id: 'svc-2', name: 'Dry Cleaning', price: 5.00, unit: 'item', description: 'Delicate dry clean' },
  { id: 'svc-3', name: 'Ironing', price: 2.00, unit: 'item', description: 'Steam ironing' },
  { id: 'svc-4', name: 'Comforter Wash', price: 15.00, unit: 'item', description: 'Large item wash' }
];

const SEED_CUSTOMERS: Customer[] = [
  { id: 'cust-1', name: 'Alice Johnson', phone: '555-1001', email: 'alice@example.com', address: '789 Oak Ln' },
  { id: 'cust-2', name: 'Bob Smith', phone: '555-1002', email: 'bob@example.com', address: '321 Pine St' }
];

const SEED_ORDERS: Order[] = [
  {
    id: 'ord-1',
    customerId: 'cust-1',
    customerName: 'Alice Johnson',
    locationId: 'loc-1',
    status: OrderStatus.PROCESSING,
    totalAmount: 25.50,
    createdAt: new Date(Date.now() - 86400000).toISOString(),
    updatedAt: new Date().toISOString(),
    items: [{ serviceId: 'svc-1', serviceName: 'Wash & Fold', price: 1.50, quantity: 10 }, { serviceId: 'svc-3', serviceName: 'Ironing', price: 2.00, quantity: 5 }]
  },
  {
    id: 'ord-2',
    customerId: 'cust-2',
    customerName: 'Bob Smith',
    locationId: 'loc-1',
    status: OrderStatus.READY,
    totalAmount: 15.00,
    createdAt: new Date(Date.now() - 172800000).toISOString(),
    updatedAt: new Date().toISOString(),
    items: [{ serviceId: 'svc-4', serviceName: 'Comforter Wash', price: 15.00, quantity: 1 }]
  }
];

const STORAGE_KEYS = {
  USERS: 'launderlink_users',
  LOCATIONS: 'launderlink_locations',
  SERVICES: 'launderlink_services',
  CUSTOMERS: 'launderlink_customers',
  ORDERS: 'launderlink_orders',
  CURRENT_USER: 'launderlink_current_user'
};

// Helper to get/set
const get = <T>(key: string, defaultVal: T): T => {
  const stored = localStorage.getItem(key);
  return stored ? JSON.parse(stored) : defaultVal;
};

const set = (key: string, val: any) => {
  localStorage.setItem(key, JSON.stringify(val));
};

export const store = {
  // Users (Auth)
  getUsers: () => get<User[]>(STORAGE_KEYS.USERS, []),
  addUser: (user: User) => {
    const users = get<User[]>(STORAGE_KEYS.USERS, []);
    users.push(user);
    set(STORAGE_KEYS.USERS, users);
  },
  // Locations
  getLocations: () => get<Location[]>(STORAGE_KEYS.LOCATIONS, SEED_LOCATIONS),
  saveLocation: (loc: Location) => {
    const list = get<Location[]>(STORAGE_KEYS.LOCATIONS, SEED_LOCATIONS);
    const idx = list.findIndex(l => l.id === loc.id);
    if (idx >= 0) list[idx] = loc;
    else list.push(loc);
    set(STORAGE_KEYS.LOCATIONS, list);
  },
  deleteLocation: (id: string) => {
    const list = get<Location[]>(STORAGE_KEYS.LOCATIONS, SEED_LOCATIONS);
    set(STORAGE_KEYS.LOCATIONS, list.filter(l => l.id !== id));
  },
  // Services
  getServices: () => get<Service[]>(STORAGE_KEYS.SERVICES, SEED_SERVICES),
  saveService: (svc: Service) => {
    const list = get<Service[]>(STORAGE_KEYS.SERVICES, SEED_SERVICES);
    const idx = list.findIndex(s => s.id === svc.id);
    if (idx >= 0) list[idx] = svc;
    else list.push(svc);
    set(STORAGE_KEYS.SERVICES, list);
  },
  deleteService: (id: string) => {
    const list = get<Service[]>(STORAGE_KEYS.SERVICES, SEED_SERVICES);
    set(STORAGE_KEYS.SERVICES, list.filter(s => s.id !== id));
  },
  // Customers
  getCustomers: () => get<Customer[]>(STORAGE_KEYS.CUSTOMERS, SEED_CUSTOMERS),
  saveCustomer: (cust: Customer) => {
    const list = get<Customer[]>(STORAGE_KEYS.CUSTOMERS, SEED_CUSTOMERS);
    const idx = list.findIndex(c => c.id === cust.id);
    if (idx >= 0) list[idx] = cust;
    else list.push(cust);
    set(STORAGE_KEYS.CUSTOMERS, list);
  },
  // Orders
  getOrders: () => get<Order[]>(STORAGE_KEYS.ORDERS, SEED_ORDERS),
  saveOrder: (ord: Order) => {
    const list = get<Order[]>(STORAGE_KEYS.ORDERS, SEED_ORDERS);
    const idx = list.findIndex(o => o.id === ord.id);
    if (idx >= 0) list[idx] = ord;
    else list.push(ord);
    set(STORAGE_KEYS.ORDERS, list);
  },
  
  // Helpers
  init: () => {
    if (!localStorage.getItem(STORAGE_KEYS.LOCATIONS)) set(STORAGE_KEYS.LOCATIONS, SEED_LOCATIONS);
    if (!localStorage.getItem(STORAGE_KEYS.SERVICES)) set(STORAGE_KEYS.SERVICES, SEED_SERVICES);
    if (!localStorage.getItem(STORAGE_KEYS.CUSTOMERS)) set(STORAGE_KEYS.CUSTOMERS, SEED_CUSTOMERS);
    if (!localStorage.getItem(STORAGE_KEYS.ORDERS)) set(STORAGE_KEYS.ORDERS, SEED_ORDERS);
  }
};

store.init();
