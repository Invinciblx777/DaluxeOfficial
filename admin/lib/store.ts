import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { supabaseAdmin } from './supabase/admin-service';

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

// Seed data removed for dynamic Supabase fetching

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
            
          if (!error && data) {
            const mapped: Product[] = data.map(p => ({
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
            set({ products: mapped });
            set({ isLoading: false });
            return;
          }
        } catch (err) {
          console.warn("Supabase fetch failed, keeping local Zustand products if any", err);
        }

        // Offline fallback/seed products if no products exist
        const currentProducts = get().products;
        if (!currentProducts || currentProducts.length === 0) {
          const seedProducts: Product[] = [
            {
              id: 'facewash',
              name: 'ULTRA SENSITIVE GOLD GLOW FACEWASH',
              tagline: 'Sulfate-Free · Gentle Cleansing · Sensitive Skin Safe',
              description: 'A luxurious daily cleanser designed to purify skin, wash away impurities, and restore hydration without any irritation.',
              category: 'Facewash',
              price: 199,
              discount: 0,
              discountType: 'percent',
              stock: 25,
              stockStatus: 'instock',
              images: [{ id: 'facewash-seed', url: 'https://images.unsplash.com/photo-1556228720-195a672e8a03?auto=format&fit=crop&w=800&q=80', isMain: true }],
              ingredients: ['Aloe Vera', 'Rose Hydrosol', 'Licorice Extract', 'Gold Dust'],
              benefits: ['Gently cleanses skin', 'Restores natural glow', 'Soothes dry patches'],
              skinConcern: 'acne',
              howToUse: 'Pump a small amount onto palms and lather on damp skin, then rinse.',
              suitableFor: 'Sensitive Skin',
              texture: 'Slightly golden gel',
              fragrance: 'Mild herbal rose',
              isActive: true,
              isBestSeller: true,
              createdAt: new Date().toISOString()
            },
            {
              id: 'nightcream',
              name: 'ULTRA SENSITIVE REPAIR NIGHT CREAM',
              tagline: 'Low Irritation · Acne Safe · Overnight Skin Repair',
              description: 'A gentle night cream formulated with hydrosols, botanical extracts and vitamins to calm, hydrate and repair skin overnight.',
              category: 'Moisturizer',
              price: 399,
              discount: 0,
              discountType: 'percent',
              stock: 12,
              stockStatus: 'instock',
              images: [{ id: 'nightcream-seed', url: 'https://images.unsplash.com/photo-1608248597279-f99d160bfcbc?auto=format&fit=crop&w=800&q=80', isMain: true }],
              ingredients: ['Rose Hydrosol', 'Aloe Vera', 'Squalane', 'Niacinamide'],
              benefits: ['Calms and repairs skin', 'Overnight nourishment', 'Repairs skin barrier'],
              skinConcern: 'acne',
              howToUse: 'Apply a small amount on clean face at night and massage gently.',
              suitableFor: 'Normal to Dry Sensitive Skin',
              texture: 'Rich non-greasy cream',
              fragrance: 'Mild rose',
              isActive: true,
              isBestSeller: true,
              createdAt: new Date().toISOString()
            }
          ];
          set({ products: seedProducts });
        }
        set({ isLoading: false });
      },

      fetchOrders: async () => {
        set({ isLoading: true });
        try {
          const res = await fetch('/api/admin/orders');
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
          const { data, error } = await supabaseAdmin
            .from('products')
            .insert([{
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
            }])
            .select()
            .single();

          if (!error && data) {
            await get().fetchProducts();
            return true;
          }
        } catch (err) {
          console.warn("Supabase insert failed, using offline fallback", err);
        }

        // Fallback: Add directly to local Zustand store
        set((state) => ({
          products: [newProduct, ...state.products]
        }));
        return true;
      },

      updateProduct: async (id, updates) => {
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
          const { error } = await supabaseAdmin
            .from('products')
            .update(dbUpdates)
            .eq('id', id);

          if (!error) {
            await get().fetchProducts();
            return true;
          }
        } catch (err) {
          console.warn("Supabase update failed, using offline fallback", err);
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
        try {
          const { error } = await supabaseAdmin
            .from('products')
            .delete()
            .eq('id', id);

          if (!error) {
            await get().fetchProducts();
            return true;
          }
        } catch (err) {
          console.warn("Supabase delete failed, using offline fallback", err);
        }

        // Fallback: Delete local state directly
        set((state) => ({
          products: state.products.filter((p) => p.id !== id)
        }));
        return true;
      },

      updateOrderStatus: async (id, status) => {
        try {
          const { error } = await supabaseAdmin
            .from('orders')
            .update({ status })
            .eq('id', id);

          if (!error) {
            await get().fetchOrders();
            return true;
          }
        } catch (err) {
          console.warn("Supabase update order status failed", err);
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
