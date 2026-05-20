"use client";

import { useState, useRef, useEffect } from 'react';
import { useAdminStore, Product, getStockStatus } from '@/lib/store';
import { supabaseAdmin } from '@/lib/supabase/admin-service';
import { Plus, Pencil, Trash2, X, Upload, Search, ChevronDown, Star, ToggleLeft, ToggleRight, Share2 } from 'lucide-react';
import { toast } from 'sonner';
import Image from 'next/image';

const CATEGORIES = ['Face Serum', 'Facewash', 'Moisturizer', 'Sunscreen', 'Eye Cream', 'Hair Serum', 'Toner', 'Body Oil', 'Lip Balm', 'Mask', 'Combo'];

const STOCK_BADGE: Record<string, string> = {
  instock: 'badge-instock',
  low: 'badge-low',
  outofstock: 'badge-outofstock'
};
const STOCK_LABEL: Record<string, string> = {
  instock: 'In Stock',
  low: 'Low Stock',
  outofstock: 'Out of Stock'
};

// ─── Add/Edit Modal ───────────────────────────────────────────────

function ProductModal({ product, onClose }: { product?: Product; onClose: () => void }) {
  const { addProduct, updateProduct } = useAdminStore();
  const fileRef = useRef<HTMLInputElement>(null);
  const [step, setStep] = useState(0);

  const [form, setForm] = useState({
    name: product?.name ?? '',
    tagline: product?.tagline ?? '',
    description: product?.description ?? '',
    category: product?.category ?? 'Face Serum',
    price: product?.price ?? 0,
    discount: product?.discount ?? 0,
    discountType: product?.discountType ?? 'percent' as 'percent' | 'flat',
    stock: product?.stock ?? 0,
    ingredients: product?.ingredients ?? [''],
    benefits: product?.benefits ?? [''],
    skinConcern: product?.skinConcern ?? '',
    howToUse: product?.howToUse ?? '',
    suitableFor: product?.suitableFor ?? '',
    texture: product?.texture ?? '',
    fragrance: product?.fragrance ?? '',
    isActive: product?.isActive ?? true,
    isBestSeller: product?.isBestSeller ?? false,
    images: product?.images ?? [] as any[],
  });
  const [isUploading, setIsUploading] = useState(false);

  async function handleFileUpload(files: File[]) {
    setIsUploading(true);
    for (const file of files) {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random().toString(36).substring(2, 10)}.${fileExt}`;
      const filePath = `${fileName}`;

      try {
        const { data, error } = await supabaseAdmin.storage
          .from('product-images')
          .upload(filePath, file);

        if (!error && data) {
          const { data: { publicUrl } } = supabaseAdmin.storage
            .from('product-images')
            .getPublicUrl(filePath);

          setForm(f => ({
            ...f,
            images: [...f.images, { id: fileName, url: publicUrl, isMain: f.images.length === 0 }]
          }));
          toast.success("Image uploaded successfully!");
          continue;
        }
      } catch (err) {
        console.warn("Storage upload failed, using Base64 local fallback", err);
      }

      // Base64 local fallback
      const reader = new FileReader();
      reader.onload = (e) => {
        const base64Url = e.target?.result as string;
        if (base64Url) {
          setForm(f => ({
            ...f,
            images: [...f.images, { id: `local-${Date.now()}-${fileName}`, url: base64Url, isMain: f.images.length === 0 }]
          }));
          toast.success(`Image added locally (offline fallback)`);
        }
      };
      reader.onerror = () => {
        toast.error(`Could not read file locally`);
      };
      reader.readAsDataURL(file);
    }
    setIsUploading(false);
  }

  function handleSave() {
    const stockStatus = getStockStatus(form.stock);
    if (product) {
      updateProduct(product.id, { ...form, stockStatus });
    } else {
      addProduct({ ...form, stockStatus } as any);
    }
    onClose();
  }

  const steps = ['Basic Info', 'Pricing & Stock', 'Details', 'Images'];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center modal-overlay">
      <div className="glass-card w-full max-w-2xl max-h-[90vh] flex flex-col" style={{ border: '1px solid rgba(212,175,55,0.2)', background: '#111111' }}>
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-5" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          <div>
            <h3 className="text-base font-semibold" style={{ color: '#FAFAFA' }}>{product ? 'Edit Product' : 'Add New Product'}</h3>
            <p className="text-xs mt-0.5" style={{ color: '#52525B' }}>Step {step + 1} of {steps.length} — {steps[step]}</p>
          </div>
          <button onClick={onClose} className="ghost-btn p-2 rounded-lg">
            <X size={16} />
          </button>
        </div>

        {/* Step Tabs */}
        <div className="flex px-6 pt-4 gap-2">
          {steps.map((s, i) => (
            <button key={s} onClick={() => setStep(i)}
              className="text-xs px-3 py-1.5 rounded-full transition-all"
              style={step === i
                ? { background: 'linear-gradient(135deg, #D4AF37, #F5D06F)', color: '#0B0B0B', fontWeight: 700 }
                : { background: 'rgba(255,255,255,0.04)', color: '#52525B', border: '1px solid rgba(255,255,255,0.06)' }
              }
            >{s}</button>
          ))}
        </div>

        {/* Form Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">

          {/* STEP 0: Basic Info */}
          {step === 0 && (
            <>
              <FormField label="Product Name *">
                <input className="dark-input w-full px-3 py-2.5 text-sm" placeholder="e.g. Radiance Renewal Serum"
                  value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
              </FormField>
              <FormField label="Tagline">
                <input className="dark-input w-full px-3 py-2.5 text-sm" placeholder="Short punchy tagline"
                  value={form.tagline} onChange={e => setForm(f => ({ ...f, tagline: e.target.value }))} />
              </FormField>
              <FormField label="Description">
                <textarea rows={4} className="dark-input w-full px-3 py-2.5 text-sm resize-none"
                  placeholder="Detailed product description…"
                  value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
              </FormField>
              <FormField label="Category">
                <select className="dark-input w-full px-3 py-2.5 text-sm"
                  value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}>
                  {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </FormField>
              <div className="flex items-center justify-between p-4 rounded-xl" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                <div>
                  <p className="text-sm font-medium" style={{ color: '#FAFAFA' }}>Active Product</p>
                  <p className="text-xs" style={{ color: '#52525B' }}>Visible on store</p>
                </div>
                <button onClick={() => setForm(f => ({ ...f, isActive: !f.isActive }))}>
                  {form.isActive ? <ToggleRight size={28} style={{ color: '#D4AF37' }} /> : <ToggleLeft size={28} style={{ color: '#52525B' }} />}
                </button>
              </div>
              <div className="flex items-center justify-between p-4 rounded-xl" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                <div>
                  <p className="text-sm font-medium" style={{ color: '#FAFAFA' }}>Best Seller</p>
                  <p className="text-xs" style={{ color: '#52525B' }}>Show on homepage carousel</p>
                </div>
                <button onClick={() => setForm(f => ({ ...f, isBestSeller: !f.isBestSeller }))}>
                  {form.isBestSeller ? <Star size={20} fill="#D4AF37" style={{ color: '#D4AF37' }} /> : <Star size={20} style={{ color: '#52525B' }} />}
                </button>
              </div>
            </>
          )}

          {/* STEP 1: Pricing & Stock */}
          {step === 1 && (
            <>
              <div className="grid grid-cols-2 gap-4">
                <FormField label="Price (₹) *">
                  <input type="number" className="dark-input w-full px-3 py-2.5 text-sm" placeholder="1299"
                    value={form.price || ''} onChange={e => setForm(f => ({ ...f, price: Number(e.target.value) }))} />
                </FormField>
                <FormField label="Stock Quantity">
                  <input type="number" className="dark-input w-full px-3 py-2.5 text-sm" placeholder="100"
                    value={form.stock || ''} onChange={e => setForm(f => ({ ...f, stock: Number(e.target.value) }))} />
                </FormField>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <FormField label="Discount">
                  <input type="number" className="dark-input w-full px-3 py-2.5 text-sm" placeholder="10"
                    value={form.discount || ''} onChange={e => setForm(f => ({ ...f, discount: Number(e.target.value) }))} />
                </FormField>
                <FormField label="Discount Type">
                  <select className="dark-input w-full px-3 py-2.5 text-sm"
                    value={form.discountType} onChange={e => setForm(f => ({ ...f, discountType: e.target.value as any }))}>
                    <option value="percent">Percentage (%)</option>
                    <option value="flat">Flat Amount (₹)</option>
                  </select>
                </FormField>
              </div>
              <div className="p-4 rounded-xl flex items-center justify-between" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                <span className="text-sm" style={{ color: '#A1A1AA' }}>Stock Status</span>
                <span className={`text-xs font-bold px-3 py-1 rounded-full badge-${getStockStatus(form.stock)}`}>
                  {STOCK_LABEL[getStockStatus(form.stock)]}
                </span>
              </div>
              <div className="p-4 rounded-xl" style={{ background: 'rgba(212,175,55,0.05)', border: '1px solid rgba(212,175,55,0.1)' }}>
                <p className="text-xs" style={{ color: '#A1A1AA' }}>Effective Price After Discount</p>
                <p className="text-xl font-bold mt-1 gold-text">
                  ₹{form.discountType === 'percent' ? Math.round(form.price * (1 - form.discount / 100)).toLocaleString() : (form.price - form.discount).toLocaleString()}
                </p>
              </div>
            </>
          )}

          {/* STEP 2: Details */}
          {step === 2 && (
            <>
              <MultiInput label="Key Ingredients" values={form.ingredients}
                onChange={v => setForm(f => ({ ...f, ingredients: v }))} placeholder="e.g. Vitamin C" />
              <MultiInput label="Benefits" values={form.benefits}
                onChange={v => setForm(f => ({ ...f, benefits: v }))} placeholder="e.g. Brightens skin tone" />
              <div className="grid grid-cols-2 gap-4">
                <FormField label="Skin Concern">
                  <input className="dark-input w-full px-3 py-2.5 text-sm" placeholder="Dullness, Pigmentation"
                    value={form.skinConcern} onChange={e => setForm(f => ({ ...f, skinConcern: e.target.value }))} />
                </FormField>
                <FormField label="Suitable For">
                  <input className="dark-input w-full px-3 py-2.5 text-sm" placeholder="All skin types"
                    value={form.suitableFor} onChange={e => setForm(f => ({ ...f, suitableFor: e.target.value }))} />
                </FormField>
                <FormField label="Texture">
                  <input className="dark-input w-full px-3 py-2.5 text-sm" placeholder="Lightweight serum"
                    value={form.texture} onChange={e => setForm(f => ({ ...f, texture: e.target.value }))} />
                </FormField>
                <FormField label="Fragrance">
                  <input className="dark-input w-full px-3 py-2.5 text-sm" placeholder="Fragrance-free"
                    value={form.fragrance} onChange={e => setForm(f => ({ ...f, fragrance: e.target.value }))} />
                </FormField>
              </div>
              <FormField label="How to Use">
                <textarea rows={3} className="dark-input w-full px-3 py-2.5 text-sm resize-none"
                  placeholder="Step-by-step application guide…"
                  value={form.howToUse} onChange={e => setForm(f => ({ ...f, howToUse: e.target.value }))} />
              </FormField>
            </>
          )}

          {/* STEP 3: Images */}
          {step === 3 && (
            <>
              <input ref={fileRef} type="file" accept="image/*" multiple className="hidden"
                onChange={(e) => {
                  const files = Array.from(e.target.files || []);
                  handleFileUpload(files);
                }}
              />
              <div
                onClick={() => !isUploading && fileRef.current?.click()}
                className={`w-full h-36 rounded-xl flex flex-col items-center justify-center gap-3 cursor-pointer transition-all ${isUploading ? 'opacity-50 cursor-wait' : ''}`}
                style={{ border: '2px dashed rgba(212,175,55,0.3)', background: 'rgba(212,175,55,0.03)' }}
                onDragOver={e => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  if (isUploading) return;
                  const files = Array.from(e.dataTransfer.files);
                  handleFileUpload(files);
                }}
              >
                {isUploading ? (
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#D4AF37]" />
                ) : (
                  <Upload size={24} style={{ color: '#D4AF37' }} />
                )}
                <div className="text-center">
                  <p className="text-sm font-medium" style={{ color: '#FAFAFA' }}>{isUploading ? 'Uploading...' : 'Drag & drop images here'}</p>
                  <p className="text-xs mt-0.5" style={{ color: '#52525B' }}>or click to browse · Max 6 images</p>
                </div>
              </div>

              {/* Direct image URL input field */}
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Paste direct image URL (e.g. Unsplash, Imgur)..."
                  className="dark-input flex-1 px-3 py-2.5 text-sm"
                  id="direct-img-url-input"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      const input = e.currentTarget as HTMLInputElement;
                      const url = input.value.trim();
                      if (url) {
                        setForm(f => ({
                          ...f,
                          images: [...f.images, { id: `url-${Date.now()}`, url, isMain: f.images.length === 0 }]
                        }));
                        input.value = '';
                        toast.success('Image URL added!');
                      }
                    }
                  }}
                />
                <button
                  type="button"
                  onClick={() => {
                    const el = document.getElementById('direct-img-url-input') as HTMLInputElement;
                    const url = el?.value?.trim();
                    if (url) {
                      setForm(f => ({
                        ...f,
                        images: [...f.images, { id: `url-${Date.now()}`, url, isMain: f.images.length === 0 }]
                      }));
                      el.value = '';
                      toast.success('Image URL added!');
                    } else {
                      toast.error('Please enter a valid URL');
                    }
                  }}
                  className="gold-btn px-4 text-xs font-semibold py-2.5 shrink-0"
                >
                  Add URL
                </button>
              </div>

              {form.images.length > 0 && (
                <div className="grid grid-cols-4 gap-3">
                  {form.images.map((img, i) => (
                    <div
                      key={img.id}
                      onClick={() => {
                        setForm(f => ({
                          ...f,
                          images: f.images.map(im => ({
                            ...im,
                            isMain: im.id === img.id
                          }))
                        }));
                      }}
                      className="relative rounded-lg overflow-hidden group cursor-pointer border-2 transition-all duration-200"
                      style={{
                        aspectRatio: '1',
                        background: '#1A1A1A',
                        borderColor: img.isMain ? '#D4AF37' : 'rgba(255,255,255,0.06)'
                      }}
                      title="Click to set as main cover image"
                    >
                      <img src={img.url} alt="" className="w-full h-full object-cover" />
                      
                      {/* Hover overlay to set cover */}
                      {!img.isMain && (
                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                          <span className="text-[10px] font-bold tracking-wider text-white bg-black/60 px-2.5 py-1.5 rounded border border-white/10 uppercase">
                            Set Main
                          </span>
                        </div>
                      )}

                      {img.isMain && (
                        <div className="absolute top-1.5 left-1.5 text-[9px] px-1.5 py-0.5 rounded font-bold uppercase tracking-wider shadow-lg" style={{ background: 'linear-gradient(135deg,#D4AF37,#F5D06F)', color: '#0B0B0B' }}>
                          Main
                        </div>
                      )}
                      
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setForm(f => {
                            const nextImages = f.images.filter(im => im.id !== img.id);
                            if (img.isMain && nextImages.length > 0) {
                              nextImages[0] = { ...nextImages[0], isMain: true };
                            }
                            return { ...f, images: nextImages };
                          });
                        }}
                        className="absolute top-1 right-1 w-5 h-5 rounded-full flex items-center justify-center hover:scale-110 transition-transform"
                        style={{ background: 'rgba(0,0,0,0.6)' }}
                        title="Delete image"
                      >
                        <X size={10} style={{ color: '#fff' }} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
          <button onClick={() => setStep(s => Math.max(0, s - 1))} disabled={step === 0}
            className="ghost-btn px-4 py-2 text-sm disabled:opacity-30 disabled:cursor-not-allowed">
            Back
          </button>
          <div className="flex gap-2">
            {step < steps.length - 1
              ? <button onClick={() => setStep(s => s + 1)} className="gold-btn px-5 py-2 text-sm">Continue →</button>
              : <button onClick={handleSave} className="gold-btn px-6 py-2 text-sm">
                  {product ? 'Save Changes' : 'Add Product'}
                </button>
            }
          </div>
        </div>
      </div>
    </div>
  );
}

function FormField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-medium mb-1.5" style={{ color: '#A1A1AA' }}>{label}</label>
      {children}
    </div>
  );
}

function MultiInput({ label, values, onChange, placeholder }: { label: string; values: string[]; onChange: (v: string[]) => void; placeholder: string }) {
  return (
    <FormField label={label}>
      <div className="space-y-2">
        {values.map((v, i) => (
          <div key={i} className="flex gap-2">
            <input className="dark-input flex-1 px-3 py-2 text-sm" placeholder={placeholder}
              value={v} onChange={e => { const n = [...values]; n[i] = e.target.value; onChange(n); }} />
            <button onClick={() => onChange(values.filter((_, j) => j !== i))}
              className="ghost-btn px-2 rounded-lg"><X size={14} /></button>
          </div>
        ))}
        <button onClick={() => onChange([...values, ''])}
          className="ghost-btn text-xs px-3 py-1.5 rounded-lg w-full">+ Add</button>
      </div>
    </FormField>
  );
}

// ─── Main Products Page ───────────────────────────────────────────

export default function ProductsPage() {
  const { products, deleteProduct, fetchProducts, isLoading } = useAdminStore();
  const [modal, setModal] = useState<'none' | 'add' | 'edit'>('none');
  const [editing, setEditing] = useState<Product | undefined>();
  const [search, setSearch] = useState('');
  const [delConfirm, setDelConfirm] = useState<string | null>(null);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const filtered = products.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.category.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="flex-1 overflow-y-auto p-8">
      {/* Modal */}
      {(modal === 'add' || modal === 'edit') && (
        <ProductModal product={editing} onClose={() => { setModal('none'); setEditing(undefined); }} />
      )}

      {/* Delete Confirm */}
      {delConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center modal-overlay">
          <div className="glass-card p-6 w-80" style={{ border: '1px solid rgba(248,113,113,0.2)', background: '#111111' }}>
            <h4 className="font-semibold mb-2" style={{ color: '#FAFAFA' }}>Delete Product?</h4>
            <p className="text-sm mb-5" style={{ color: '#71717A' }}>This action cannot be undone. The product will be permanently removed.</p>
            <div className="flex gap-3">
              <button onClick={() => setDelConfirm(null)} className="ghost-btn flex-1 py-2 text-sm rounded-lg">Cancel</button>
              <button onClick={() => { deleteProduct(delConfirm); setDelConfirm(null); }}
                className="flex-1 py-2 text-sm rounded-lg font-semibold transition-all hover:opacity-90"
                style={{ background: '#EF4444', color: '#fff' }}>Delete</button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-light tracking-tight" style={{ color: '#FAFAFA' }}>Products</h2>
          <p className="text-sm mt-1" style={{ color: '#52525B' }}>{products.length} products in catalog</p>
        </div>
        <button onClick={() => { setEditing(undefined); setModal('add'); }} className="gold-btn flex items-center gap-2 px-5 py-2.5 text-sm">
          <Plus size={16} /> Add Product
        </button>
      </div>

      {/* Search */}
      <div className="flex gap-3 mb-5">
        <div className="relative flex-1 max-w-xs">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: '#52525B' }} />
          <input className="dark-input w-full pl-9 pr-3 py-2.5 text-sm" placeholder="Search products…"
            value={search} onChange={e => setSearch(e.target.value)} />
        </div>
      </div>

      {/* Table */}
      <div className="glass-card overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
              {['Product', 'Category', 'Price', 'Stock', 'Status', ''].map(h => (
                <th key={h} className="px-5 py-3.5 text-left text-xs font-medium uppercase tracking-wider" style={{ color: '#3F3F46' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr><td colSpan={6} className="px-5 py-12 text-center text-sm" style={{ color: '#3F3F46' }}>No products found</td></tr>
            )}
            {filtered.map(p => (
              <tr key={p.id} className="table-row-hover" style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                <td className="px-5 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0" style={{ background: 'rgba(212,175,55,0.06)', border: '1px solid rgba(212,175,55,0.12)' }}>
                      {p.images[0]
                        ? <img src={p.images[0].url} alt={p.name} className="w-full h-full object-cover rounded-lg" />
                        : <span className="text-xs gold-text font-bold">{p.name[0]}</span>
                      }
                    </div>
                    <div>
                      <p className="font-medium text-sm" style={{ color: '#FAFAFA' }}>{p.name}</p>
                      <p className="text-[11px] mt-0.5" style={{ color: '#52525B' }}>{p.tagline}</p>
                    </div>
                  </div>
                </td>
                <td className="px-5 py-4 text-xs" style={{ color: '#71717A' }}>{p.category}</td>
                <td className="px-5 py-4">
                  <p className="text-sm font-semibold" style={{ color: '#FAFAFA' }}>₹{p.price.toLocaleString()}</p>
                  {p.discount > 0 && (
                    <p className="text-[10px]" style={{ color: '#4ADE80' }}>
                      -{p.discount}{p.discountType === 'percent' ? '%' : '₹'} off
                    </p>
                  )}
                </td>
                <td className="px-5 py-4 text-xs" style={{ color: '#71717A' }}>{p.stock} units</td>
                <td className="px-5 py-4">
                  <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-full badge-${p.stockStatus}`}>
                    {STOCK_LABEL[p.stockStatus]}
                  </span>
                </td>
                <td className="px-5 py-4">
                  <div className="flex items-center gap-2 justify-end">
                    <button 
                    onClick={async () => {
                        if (typeof window !== 'undefined') {
                          const storefrontOrigin = window.location.origin.includes(':3002') 
                            ? 'http://localhost:8081' 
                            : window.location.origin;
                          const shareUrl = `${storefrontOrigin}/collections/${p.slug || p.id}`;
                          
                          let copied = false;

                          // 1. Try execCommand (synchronous, works on insecure origins)
                          try {
                            const el = document.createElement('textarea');
                            el.value = shareUrl;
                            el.setAttribute('readonly', '');
                            el.style.position = 'absolute';
                            el.style.left = '-9999px';
                            document.body.appendChild(el);
                            el.select();
                            copied = document.execCommand('copy');
                            document.body.removeChild(el);
                          } catch (e) {}

                          // 2. Try navigator.clipboard
                          if (!copied) {
                            try {
                              if (navigator.clipboard && navigator.clipboard.writeText) {
                                await navigator.clipboard.writeText(shareUrl);
                                copied = true;
                              }
                            } catch (err) {}
                          }

                          if (copied) {
                            toast.success("Product link copied to clipboard!");
                          } else {
                            // 3. Final fallback: prompt
                            window.prompt("Copy product link:", shareUrl);
                          }
                        }
                      }}
                      className="ghost-btn p-2 rounded-lg" 
                      style={{ color: '#D4AF37' }}
                      title="Share Product Link"
                    >
                      <Share2 size={14} />
                    </button>
                    <button onClick={() => { setEditing(p); setModal('edit'); }}
                      className="ghost-btn p-2 rounded-lg" title="Edit">
                      <Pencil size={14} />
                    </button>
                    <button onClick={() => setDelConfirm(p.id)}
                      className="p-2 rounded-lg transition-all hover:opacity-80"
                      style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.15)', color: '#F87171' }}
                      title="Delete">
                      <Trash2 size={14} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
