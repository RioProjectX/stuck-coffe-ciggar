export type ProductCategory = 'coffee' | 'non-coffee' | 'food' | 'cigar';

export interface Product {
  id: string;
  name: string;
  category: ProductCategory;
  subcategory: string;
  price: number;
  description: string;
  rating: number;
  stock: number;
  status: 'available' | 'out_of_stock';
  images: string[]; // URLs or base64
  details?: {
    origin?: string;
    roastLevel?: string;
    notes?: string; // e.g., Chocolate, Citrus, Cedar wood notes
    strength?: string; // For cigars or coffee strength
    ringGauge?: number; // Cigar specific
    length?: string; // Cigar specific
  };
}

export interface CartItem {
  id: string;
  product: Product;
  quantity: number;
}

export type MembershipTier = 'Bronze' | 'Silver' | 'Gold' | 'Platinum' | 'Member';

export interface BrandLogo {
  type: 'icon' | 'image';
  image: string; // URL or base64 data
  text: string;
  subtext: string;
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: 'super_admin' | 'admin' | 'staff' | 'buyer';
  membershipLevel: MembershipTier;
  points: number;
  totalPurchase: number;
  totalOrdersCount: number;
  address?: string;
}

export interface Reservation {
  id: string;
  customerName: string;
  email: string;
  phone: string;
  date: string;
  time: string;
  guests: number;
  tableArea: 'Lounge Seat' | 'Private Cigar Room' | 'VIP Patio' | 'Bar Area';
  notes?: string;
  status: 'Pending' | 'Approved' | 'Cancelled';
  reservationCode: string;
  createdAt: string;
}

export type OrderStatus = 'Pending' | 'Paid' | 'Processing' | 'Shipped' | 'Delivered' | 'Completed' | 'Cancelled';

export interface OrderItem {
  id: string;
  productId: string;
  name: string;
  price: number;
  quantity: number;
}

export interface Order {
  id: string;
  customerEmail: string;
  customerName: string;
  phone: string;
  address?: string;
  items: OrderItem[];
  subtotal: number;
  tax: number;
  discount: number;
  total: number;
  pointsEarned: number;
  status: OrderStatus;
  paymentMethod: 'Midtrans' | 'Xendit' | 'QRIS' | 'Transfer Bank';
  voucherCode?: string;
  createdAt: string;
  invoiceNumber: string;
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'admin' | 'sommelier';
  text: string;
  timestamp: string;
  isAI?: boolean;
}

export interface BlogItem {
  id: string;
  title: string;
  category: 'Coffee Craft' | 'Cigar Tasting' | 'Lifestyle' | 'Events' | 'News';
  image: string;
  content: string;
  slug: string;
  date: string;
  author: string;
  readTime: string;
  summary: string;
}

export interface EventItem {
  id: string;
  title: string;
  category: 'Workshop' | 'Tasting Session' | 'Social Gathering' | 'Review Event';
  description: string;
  date: string;
  time: string;
  price: number;
  seatsLimit: number;
  seatsLeft: number;
  image: string;
  location: string;
}

export interface Coupon {
  code: string;
  discountPercent: number;
  minPurchase: number;
  description: string;
}

export interface Review {
  id: string;
  productId: string;
  productName: string;
  customerName: string;
  email: string;
  rating: number;
  comment: string;
  status: 'approved' | 'pending';
  date: string;
}
