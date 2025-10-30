export type UserRole = 'provider' | 'renter';

export interface User {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string;
  role?: UserRole;
  university?: string; // college/university name
  college?: string; // alias
  phone?: string;
  bio?: string;
  notificationsEnabled?: boolean;
  tutorialCompleted?: boolean;
  isVerified: boolean;
  createdAt: Date;
}

export interface Item {
  id: string;
  providerId: string;
  providerName: string;
  title: string;
  description: string;
  category: 'clothes' | 'gadgets' | 'books' | 'accessories';
  price: number;
  // images can be simple URLs (legacy) or objects with url + thumbnail
  images: Array<string | { url: string; thumb?: string }>;
  available: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Booking {
  id: string;
  itemId: string;
  renterId: string;
  providerId: string;
  renterName?: string;
  renterEmail?: string;
  itemTitle?: string;
  providerName?: string;
  startDate: Date;
  endDate: Date;
  totalPrice: number;
  status: 'pending' | 'confirmed' | 'active' | 'completed' | 'cancelled';
  paymentStatus?: 'pending' | 'success' | 'failed';
  paymentMethod?: PaymentMethod;
  transactionId?: string;
  createdAt: Date;
}

export interface Transaction {
  id: string;
  bookingId: string;
  amount: number;
  renterId: string;
  providerId: string;
  method: PaymentMethod;
  status: 'pending' | 'success' | 'failed';
  referenceId: string;
  itemTitle?: string;
  renterName?: string;
  providerName?: string;
  createdAt: Date;
}

export type PaymentMethod = 'card' | 'upi' | 'wallet';
