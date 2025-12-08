
export enum UserRole {
  OWNER = 'OWNER',
  STAFF = 'STAFF'
}

export enum OrderStatus {
  PENDING = 'PENDING',
  PROCESSING = 'PROCESSING',
  READY = 'READY',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED'
}

export type PaymentMethod = 'CASH' | 'QRIS' | 'TRANSFER';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  locationId?: string; // For staff
  password?: string; // Mocking auth
  isApproved?: boolean; // New field for approval workflow
}

export interface Location {
  id: string;
  name: string;
  address: string;
  phone: string;
}

export interface Service {
  id: string;
  name: string;
  price: number;
  unit: string; // e.g., "kg", "item"
  description: string;
  durationHours?: number; // Estimated duration in hours
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  email: string;
  address: string;
  notes?: string;
}

export interface OrderItem {
  serviceId: string;
  serviceName: string; // Snapshot
  price: number; // Snapshot
  quantity: number;
}

export interface Order {
  id: string;
  customerId: string;
  customerName: string; // Snapshot
  locationId: string;
  staffId?: string;
  items: OrderItem[];
  totalAmount: number;
  status: OrderStatus;
  isPaid: boolean; // New Field: Payment Status
  paymentMethod?: PaymentMethod; // New Field: Payment Method
  createdAt: string; // ISO date
  updatedAt: string;
  perfume?: string;
  receivedBy?: string;
  completedBy?: string; // Staff who finished the job
  rating?: number;
  review?: string;
}

export interface Expense {
  id: string;
  description: string;
  amount: number;
  category: string; // 'Operational', 'Supplies', 'Maintenance', 'Other'
  date: string;
  recordedBy: string; // User Name
  locationId?: string;
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
}
