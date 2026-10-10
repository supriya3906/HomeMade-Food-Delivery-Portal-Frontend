// Display-only mirror of backend/src/pricing.js. The backend is the source of truth:
// checkout asks the server for the real quote and the server recalculates on every order.

export const DELIVERY_FEE = 35; // cash on delivery only (free for online payment or premium member)
export const TAX_PERCENT = 5; // GST on the food total

export const MEMBERSHIP_TIERS = [
  { id: 'silver', name: 'Silver Card', discountPct: 5, badge: '🥈 Silver', color: '#94a3b8', freeDelivery: false, desc: '5% off on all orders' },
  { id: 'gold', name: 'Gold Card', discountPct: 10, badge: '🥇 Gold', color: '#f59e0b', freeDelivery: false, desc: '10% off on all orders' },
  { id: 'premium', name: 'Premium Card', discountPct: 15, badge: '💎 Premium VIP', color: '#8b5cf6', freeDelivery: true, desc: '15% off + Free Delivery' }
];

export const UPI_APPS = [
  { id: 'gpay', label: 'Google Pay', suffix: '@okaxis', color: '#1a73e8' },
  { id: 'phonepe', label: 'PhonePe', suffix: '@ybl', color: '#5f259f' },
  { id: 'paytm', label: 'Paytm', suffix: '@paytm', color: '#00a1e4' },
  { id: 'cred', label: 'CRED UPI', suffix: '@cred', color: '#111827' },
  { id: 'bhim', label: 'BHIM UPI', suffix: '@upi', color: '#f47216' }
];

export const POPULAR_BANKS = [
  { id: 'hdfc', name: 'HDFC Bank', code: 'HDFC' },
  { id: 'sbi', name: 'State Bank of India', code: 'SBI' },
  { id: 'icici', name: 'ICICI Bank', code: 'ICICI' },
  { id: 'axis', name: 'Axis Bank', code: 'AXIS' },
  { id: 'kotak', name: 'Kotak Mahindra Bank', code: 'KOTAK' },
  { id: 'pnb', name: 'Punjab National Bank', code: 'PNB' }
];
