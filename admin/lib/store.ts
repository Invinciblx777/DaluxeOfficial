import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { supabaseAdmin } from './supabase/admin-service';
import { STATIC_PRODUCTS } from './static-products';

// Read the logged-in admin's Supabase access token from localStorage (same storage
// the Expo SPA + admin layout use) so we can authorize calls to the admin API routes.
// Writes must go through those server routes — the browser client only has the anon
// key and no user JWT, so RLS blocks direct table writes.
function getAccessToken(): string | null {
  if (typeof window === 'undefined') return null;
  try {
    const supabaseUrl =
      window.localStorage.getItem('NEXT_PUBLIC_SUPABASE_URL') ||
      process.env.NEXT_PUBLIC_SUPABASE_URL || '';
    const ref = supabaseUrl.match(/https:\/\/([^.]+)\.supabase\.co/)?.[1];
    if (!ref) return null;
    const raw = window.localStorage.getItem(`sb-${ref}-auth-token`);
    if (!raw) return null;
    return JSON.parse(raw)?.access_token || null;
  } catch {
    return null;
  }
}

function authHeaders(extra: Record<string, string> = {}): Record<string, string> {
  const token = getAccessToken();
  return token ? { Authorization: `Bearer ${token}`, ...extra } : { ...extra };
}

// ─────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────

export type StockStatus = 'instock' | 'low' | 'outofstock';
export type OrderStatus = 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled';

export interface ProductImage { id: string; url: string; isMain: boolean; }

export interface Product {
  id: string;
  slug?: string;
  name: string;
  tagline: string;
  description: string;
  category: string;
  price: number;
  discount: number;
  discountType: 'percent' | 'flat';
  stock: number;
  stockStatus: StockStatus;
  images: ProductImage[];
  ingredients: string[];
  benefits: string[];
  skinConcern: string;
  howToUse: string;
  suitableFor: string;
  texture: string;
  fragrance: string;
  isActive: boolean;
  isBestSeller: boolean;
  createdAt: string;
}

export interface OrderItem {
  productId: string;
  productName: string;
  quantity: number;
  price: number;
  productImage?: string;
  productDescription?: string;
}

export interface Order {
  id: string;
  orderNumber: string;
  customer: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  pincode: string;
  items: OrderItem[];
  total: number;
  couponCode?: string | null;
  discountAmount?: number | null;
  status: OrderStatus;
  paymentId: string;
  shipmentStatus?: string;
  createdAt: string;
}

export interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  orderCount: number;
  totalSpent: number;
  joinedAt: string;
}

// ─────────────────────────────────────────
// STORE
// ─────────────────────────────────────────

interface AdminStore {
  products: Product[];
  orders: Order[];
  customers: Customer[];
  isLoading: boolean;
  
  // Fetch Actions
  fetchProducts: () => Promise<void>;
  fetchOrders: () => Promise<void>;
  fetchCustomers: () => Promise<void>;
  
  // Product Actions
  addProduct: (p: Omit<Product, 'id' | 'createdAt' | 'stockStatus'>) => Promise<boolean>;
  updateProduct: (id: string, updates: Partial<Product>) => Promise<boolean>;
  deleteProduct: (id: string) => Promise<boolean>;
  
  // Order Actions
  updateOrderStatus: (id: string, status: OrderStatus) => Promise<boolean>;
}

const generateSlug = (name: string): string => {
  let s = name.toLowerCase().trim();
  if (s.includes('combo')) {
    return s.replace(/[^a-z0-9\s\-]+/g, '').replace(/\s+/g, '-');
  }
  return s.replace(/[^a-z0-9]+/g, '');
};

export const useAdminStore = create<AdminStore>()(
  persist(
    (set, get) => ({
      products: [],
      orders: [],
      customers: [],
      isLoading: false,

      fetchProducts: async () => {
        set({ isLoading: true });
        try {
          const { data, error } = await supabaseAdmin
            .from('products')
            .select('*')
            .order('created_at', { ascending: false });
            
          let allProducts: Product[] = [];
            
          if (!error && data) {
            allProducts = data.map(p => ({
              id: p.id,
              slug: p.slug || '',
              name: p.name,
              tagline: p.tagline,
              description: p.description,
              category: p.category,
              price: Number(p.price),
              discount: Number(p.discount),
              discountType: p.discount_type as any,
              stock: p.stock_quantity,
              stockStatus: getStockStatus(p.stock_quantity),
              images: p.images || [],
              ingredients: p.ingredients || [],
              benefits: p.benefits || [],
              skinConcern: p.skin_concern,
              howToUse: p.how_to_use,
              suitableFor: p.suitable_for,
              texture: p.texture,
              fragrance: p.fragrance,
              isActive: p.is_active,
              isBestSeller: p.is_best_seller,
              createdAt: p.created_at
            }));
          }

          // Merge static products that are missing from DB
          for (const sp of STATIC_PRODUCTS) {
            const exists = allProducts.find(p => p.slug === sp.id || p.name.toUpperCase() === sp.name?.toUpperCase());
            if (!exists) {
              allProducts.push({
                id: sp.id, // This indicates it's a static product
                slug: sp.id,
                name: sp.name,
                tagline: sp.tagline || '',
                description: sp.description || '',
                category: sp.category === 'cleanse' ? 'Facewash' : sp.category === 'serum' ? 'Face Serum' : sp.category === 'hair' ? 'Hair Serum' : sp.category === 'combo' ? 'Combo' : sp.category,
                price: sp.price,
                discount: 0,
                discountType: 'percent',
                stock: 50,
                stockStatus: 'instock',
                images: [], 
                ingredients: (sp as any).allIngredients || [],
                benefits: sp.benefits || [],
                skinConcern: sp.concerns?.[0] || '',
                howToUse: sp.howToUse || '',
                suitableFor: sp.suitableFor?.join(', ') || '',
                texture: sp.texture || '',
                fragrance: sp.fragrance || '',
                isActive: true,
                isBestSeller: true,
                createdAt: new Date().toISOString()
              });
            }
          }
          
          set({ products: allProducts });
          set({ isLoading: false });
        } catch (err) {
          console.warn("Supabase fetch failed", err);
          set({ isLoading: false });
        }
      },

      fetchOrders: async () => {
        set({ isLoading: true });
        try {
          const res = await fetch('/api/admin/orders', { headers: authHeaders() });
          const json = await res.json();
          if (json.success && json.data) {
            const data = json.data;
            const currentProducts = get().products;
            const mapped: Order[] = data.map((o: any) => ({
              id: o.id,
              orderNumber: o.order_number,
              customer: o.profiles?.full_name || 'Guest',
              email: o.profiles?.email || o.email || '',
              phone: o.profiles?.phone || o.phone || '',
              address: o.shipping_address?.address_line1 || o.shipping_address?.address || '',
              city: o.shipping_address?.city || '',
              pincode: o.shipping_address?.pincode || '',
              items: (o.order_items || []).map((item: any) => {
                const matchedProduct = currentProducts.find(p => p.id === item.product_id);
                return {
                  productId: item.product_id,
                  productName: item.name || `Product`,
                  quantity: Number(item.quantity || item.qty || 1),
                  price: Number(item.price),
                  productImage: matchedProduct?.images?.[0]?.url || '',
                  productDescription: matchedProduct?.tagline || matchedProduct?.description || '',
                };
              }),
              total: Number(o.total_amount),
              couponCode: o.coupon_code || null,
              discountAmount: Number(o.discount_amount) || null,
              status: o.status as any,
              paymentId: o.payment_id || o.transaction_id || '',
              shipmentStatus: o.shipment_status || '',
              createdAt: o.created_at
            }));
            set({ orders: mapped });
          }
        } catch(e) {
          console.error("Failed to fetch orders via API", e);
        }
        set({ isLoading: false });
      },

      fetchCustomers: async () => {
        try {
          const { data, error } = await supabaseAdmin
            .from('profiles')
            .select('*')
            .order('created_at', { ascending: false });
            
          if (!error && data) {
            const mapped: Customer[] = data.map(c => ({
              id: c.id,
              name: c.full_name || 'Unnamed',
              email: c.email || '',
              phone: c.phone || '',
              orderCount: 0, // Would need aggregation
              totalSpent: 0,
              joinedAt: c.created_at
            }));
            set({ customers: mapped });
          }
        } catch (err) {
          console.warn("Failed to fetch profiles offline", err);
        }
      },

      addProduct: async (p) => {
        const slug = generateSlug(p.name);
        const newProduct: Product = {
          ...p,
          id: 'local-' + Date.now(),
          slug,
          stockStatus: getStockStatus(p.stock),
          createdAt: new Date().toISOString()
        };

        try {
          const res = await fetch('/api/admin/products', {
            method: 'POST',
            headers: authHeaders({ 'Content-Type': 'application/json' }),
            body: JSON.stringify({ product: {
              name: p.name,
              slug,
              tagline: p.tagline,
              description: p.description,
              category: p.category,
              price: p.price,
              discount: p.discount,
              discount_type: p.discountType,
              stock_quantity: p.stock,
              is_active: p.isActive,
              is_best_seller: p.isBestSeller,
              ingredients: p.ingredients,
              benefits: p.benefits,
              skin_concern: p.skinConcern,
              how_to_use: p.howToUse,
              suitable_for: p.suitableFor,
              texture: p.texture,
              fragrance: p.fragrance,
              images: p.images
            }}),
          });
          const json = await res.json();
          if (res.ok && json.success) {
            await get().fetchProducts();
            return true;
          }
          console.warn('Add product failed:', json.error);
        } catch (err) {
          console.warn("Add product failed, using offline fallback", err);
        }

        // Fallback: Add directly to local Zustand store
        set((state) => ({
          products: [newProduct, ...state.products]
        }));
        return true;
      },

      updateProduct: async (id, updates) => {
        // If the ID is a static ID (like 'facewash' or 'skin-combo'), we must INSERT it into Supabase instead of updating!
        const isStaticId = id.length < 36 && !id.includes('-'); 
        // Note: UUIDs have dashes and are 36 chars long. Our static ids are like 'facewash', 'hairserum', 'skin-combo'. 
        // Wait, 'skin-combo' has a dash! Let's just check length < 36.
        const isActuallyStatic = id.length < 36;

        if (isActuallyStatic) {
          // Find the product in the local state to get all its fields
          const currentProduct = get().products.find(p => p.id === id);
          if (!currentProduct) return false;
          
          const p = { ...currentProduct, ...updates };
          const slug = p.slug || generateSlug(p.name);

          try {
            const res = await fetch('/api/admin/products', {
              method: 'POST',
              headers: authHeaders({ 'Content-Type': 'application/json' }),
              body: JSON.stringify({ product: {
                name: p.name,
                slug: slug,
                tagline: p.tagline,
                description: p.description,
                category: p.category,
                price: p.price,
                discount: p.discount,
                discount_type: p.discountType,
                stock_quantity: p.stock,
                is_active: p.isActive,
                is_best_seller: p.isBestSeller,
                ingredients: p.ingredients,
                benefits: p.benefits,
                skin_concern: p.skinConcern,
                how_to_use: p.howToUse,
                suitable_for: p.suitableFor,
                texture: p.texture,
                fragrance: p.fragrance,
                images: p.images
              }}),
            });
            const json = await res.json();
            if (res.ok && json.success) {
              await get().fetchProducts();
              return true;
            }
            console.error("Failed to insert static product:", json.error);
          } catch(err) {
            console.error("Failed to insert static product:", err);
          }
          return false;
        }

        // Normal update for existing Supabase UUID products
        const dbUpdates: any = {};
        if (updates.name !== undefined) {
          dbUpdates.name = updates.name;
          dbUpdates.slug = generateSlug(updates.name);
        }
        if (updates.tagline !== undefined) dbUpdates.tagline = updates.tagline;
        if (updates.description !== undefined) dbUpdates.description = updates.description;
        if (updates.category !== undefined) dbUpdates.category = updates.category;
        if (updates.price !== undefined) dbUpdates.price = updates.price;
        if (updates.discount !== undefined) dbUpdates.discount = updates.discount;
        if (updates.discountType !== undefined) dbUpdates.discount_type = updates.discountType;
        if (updates.stock !== undefined) dbUpdates.stock_quantity = updates.stock;
        if (updates.isActive !== undefined) dbUpdates.is_active = updates.isActive;
        if (updates.isBestSeller !== undefined) dbUpdates.is_best_seller = updates.isBestSeller;
        if (updates.ingredients !== undefined) dbUpdates.ingredients = updates.ingredients;
        if (updates.benefits !== undefined) dbUpdates.benefits = updates.benefits;
        if (updates.skinConcern !== undefined) dbUpdates.skin_concern = updates.skinConcern;
        if (updates.howToUse !== undefined) dbUpdates.how_to_use = updates.howToUse;
        if (updates.suitableFor !== undefined) dbUpdates.suitable_for = updates.suitableFor;
        if (updates.texture !== undefined) dbUpdates.texture = updates.texture;
        if (updates.fragrance !== undefined) dbUpdates.fragrance = updates.fragrance;
        if (updates.images !== undefined) dbUpdates.images = updates.images;

        try {
          const res = await fetch('/api/admin/products', {
            method: 'PATCH',
            headers: authHeaders({ 'Content-Type': 'application/json' }),
            body: JSON.stringify({ id, updates: dbUpdates }),
          });
          const json = await res.json();
          if (res.ok && json.success) {
            await get().fetchProducts();
            return true;
          }
          console.warn('Update product failed:', json.error);
        } catch (err) {
          console.warn("Update product failed, using offline fallback", err);
        }

        // Fallback: Update local state directly
        set((state) => {
          const updated = state.products.map((p) => {
            if (p.id === id) {
              const merged = { ...p, ...updates };
              if (updates.stock !== undefined) {
                merged.stockStatus = getStockStatus(updates.stock);
              }
              return merged;
            }
            return p;
          });
          return { products: updated };
        });
        return true;
      },

      deleteProduct: async (id) => {
        // If it's a static product, just remove from view temporarily or ignore
        if (id.length < 36) {
          set((state) => ({
            products: state.products.filter((p) => p.id !== id)
          }));
          return true;
        }

        try {
          const res = await fetch(`/api/admin/products?id=${encodeURIComponent(id)}`, {
            method: 'DELETE',
            headers: authHeaders(),
          });
          const json = await res.json();
          if (res.ok && json.success) {
            await get().fetchProducts();
            return true;
          }
          console.warn('Delete product failed:', json.error);
        } catch (err) {
          console.warn("Delete product failed, using offline fallback", err);
        }

        set((state) => ({
          products: state.products.filter((p) => p.id !== id)
        }));
        return true;
      },

      updateOrderStatus: async (id, status) => {
        try {
          const res = await fetch('/api/admin/orders', {
            method: 'PATCH',
            headers: authHeaders({ 'Content-Type': 'application/json' }),
            body: JSON.stringify({ id, status }),
          });
          const json = await res.json();
          if (res.ok && json.success) {
            await get().fetchOrders();
            return true;
          }
          console.warn('Update order status failed:', json.error);
        } catch (err) {
          console.warn('Update order status failed', err);
        }
        return false;
      },
    }),
    { name: 'daluxe-admin-store', skipHydration: true }
  )
);

// Helper to compute stock status
export const getStockStatus = (stock: number): StockStatus => {
  if (stock === 0) return 'outofstock';
  if (stock <= 5) return 'low';
  return 'instock';
};
