import { useState, useMemo } from 'react';
import { useStore } from '../store/useStore';
import {
  PlusIcon,
  TrashIcon,
  XIcon,
  CheckIcon,
  StarIcon,
} from '../components/Icons';
import type { Product, ProductImage, ProductVariant, Order, Coupon } from '../store/types';

const CATEGORIES = ['Kadın', 'Erkek', 'Ayakkabı', 'Kozmetik', 'Aksesuar', 'Çocuk'];

const STATUS_LABELS: Record<string, string> = {
  pending: 'Beklemede',
  confirmed: 'Onaylandı',
  preparing: 'Hazırlanıyor',
  shipped: 'Kargoya Verildi',
  delivered: 'Teslim Edildi',
  cancelled: 'İptal Edildi',
  return_requested: 'İade Talep',
  returned: 'İade Tamamlandı',
};

const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-yellow-50 text-yellow-700 border-yellow-200',
  confirmed: 'bg-blue-50 text-blue-700 border-blue-200',
  preparing: 'bg-orange-50 text-orange-700 border-orange-200',
  shipped: 'bg-purple-50 text-purple-700 border-purple-200',
  delivered: 'bg-green-50 text-green-700 border-green-200',
  cancelled: 'bg-red-50 text-red-700 border-red-200',
  return_requested: 'bg-orange-50 text-orange-700 border-orange-200',
  returned: 'bg-gray-50 text-gray-600 border-gray-200',
};

// Admin Login
function AdminLogin({ onLogin, adminPassword }: { onLogin: () => void; adminPassword: string }) {
  const [pw, setPw] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (pw === adminPassword) {
      sessionStorage.setItem('moderno_admin_auth', '1');
      onLogin();
    } else {
      setError('Hatalı şifre. Lütfen tekrar deneyin.');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="bg-white shadow-sm border border-gray-100 p-10 w-full max-w-sm">
        <p className="text-2xl font-black tracking-[0.2em] text-center mb-1">MODERNO</p>
        <p className="text-[10px] text-center text-gray-400 tracking-widest uppercase mb-8">
          Yönetim Paneli
        </p>
        <form onSubmit={handleSubmit}>
          <label className="block text-xs text-gray-500 mb-1">Şifre</label>
          <input
            type="password"
            value={pw}
            onChange={(e) => { setPw(e.target.value); setError(''); }}
            className={`w-full border px-3 py-3 text-sm focus:outline-none mb-4 ${error ? 'border-red-300' : 'border-gray-200 focus:border-gray-400'}`}
            placeholder="••••••••"
            autoFocus
          />
          {error && <p className="text-xs text-red-500 mb-3">{error}</p>}
          <button
            type="submit"
            className="w-full bg-gray-900 text-white py-3 text-xs font-medium tracking-widest uppercase hover:bg-gray-700 transition-colors"
          >
            Giriş Yap
          </button>
          <p className="text-[10px] text-gray-400 text-center mt-4">Varsayılan şifre: admin123</p>
        </form>
      </div>
    </div>
  );
}

// Product Form
interface ProductFormData {
  name: string;
  description: string;
  price: string;
  originalPrice: string;
  category: string;
  featured: boolean;
  tags: string;
  images: ProductImage[];
  variants: ProductVariant[];
}

function ProductForm({
  initial,
  onSave,
  onCancel,
}: {
  initial?: Product;
  onSave: (data: Omit<Product, 'id' | 'createdAt'>) => void;
  onCancel: () => void;
}) {
  const [form, setForm] = useState<ProductFormData>({
    name: initial?.name || '',
    description: initial?.description || '',
    price: initial?.price?.toString() || '',
    originalPrice: initial?.originalPrice?.toString() || '',
    category: initial?.category || 'Kadın',
    featured: initial?.featured || false,
    tags: initial?.tags.join(', ') || '',
    images: initial?.images || [{ url: '', alt: '' }],
    variants: initial?.variants || [{ id: crypto.randomUUID(), color: '', size: '', stock: 10 }],
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const addImage = () =>
    setForm((f) => ({ ...f, images: [...f.images, { url: '', alt: '' }] }));
  const removeImage = (i: number) =>
    setForm((f) => ({ ...f, images: f.images.filter((_, idx) => idx !== i) }));
  const updateImage = (i: number, field: 'url' | 'alt', val: string) =>
    setForm((f) => ({
      ...f,
      images: f.images.map((img, idx) => (idx === i ? { ...img, [field]: val } : img)),
    }));

  const addVariant = () =>
    setForm((f) => ({
      ...f,
      variants: [...f.variants, { id: crypto.randomUUID(), color: '', size: '', stock: 10 }],
    }));
  const removeVariant = (i: number) =>
    setForm((f) => ({ ...f, variants: f.variants.filter((_, idx) => idx !== i) }));
  const updateVariant = (i: number, field: keyof ProductVariant, val: string | number) =>
    setForm((f) => ({
      ...f,
      variants: f.variants.map((v, idx) => (idx === i ? { ...v, [field]: val } : v)),
    }));

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.name.trim()) e.name = 'Ürün adı gerekli';
    if (!form.price || isNaN(Number(form.price))) e.price = 'Geçerli fiyat girin';
    if (form.images.filter((i) => i.url.trim()).length === 0) e.images = 'En az 1 görsel URL gerekli';
    if (form.variants.length === 0) e.variants = 'En az 1 varyasyon gerekli';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = () => {
    if (!validate()) return;
    onSave({
      name: form.name.trim(),
      description: form.description.trim(),
      price: Number(form.price),
      originalPrice: form.originalPrice ? Number(form.originalPrice) : undefined,
      category: form.category,
      featured: form.featured,
      tags: form.tags.split(',').map((t) => t.trim()).filter(Boolean),
      images: form.images.filter((i) => i.url.trim()),
      variants: form.variants.map((v) => ({ ...v, stock: Number(v.stock) })),
    });
  };

  return (
    <div className="bg-white border border-gray-100 p-6 mb-6">
      <h3 className="text-sm font-medium tracking-widest uppercase text-gray-700 mb-5">
        {initial ? 'Ürünü Düzenle' : 'Yeni Ürün Ekle'}
      </h3>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Left */}
        <div className="space-y-4">
          <div>
            <label className="block text-xs text-gray-500 mb-1">Ürün Adı *</label>
            <input
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              className={`w-full border px-3 py-2 text-sm focus:outline-none ${errors.name ? 'border-red-300' : 'border-gray-200 focus:border-gray-400'}`}
              placeholder="Ürün adı"
            />
            {errors.name && <p className="text-[11px] text-red-500 mt-1">{errors.name}</p>}
          </div>

          <div>
            <label className="block text-xs text-gray-500 mb-1">Açıklama</label>
            <textarea
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              rows={3}
              className="w-full border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:border-gray-400 resize-none"
              placeholder="Ürün açıklaması..."
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Fiyat (₺) *</label>
              <input
                type="number"
                value={form.price}
                onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))}
                className={`w-full border px-3 py-2 text-sm focus:outline-none ${errors.price ? 'border-red-300' : 'border-gray-200 focus:border-gray-400'}`}
                placeholder="0"
              />
              {errors.price && <p className="text-[11px] text-red-500 mt-1">{errors.price}</p>}
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Eski Fiyat (₺)</label>
              <input
                type="number"
                value={form.originalPrice}
                onChange={(e) => setForm((f) => ({ ...f, originalPrice: e.target.value }))}
                className="w-full border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:border-gray-400"
                placeholder="0 (opsiyonel)"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Kategori</label>
              <select
                value={form.category}
                onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
                className="w-full border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:border-gray-400 bg-white"
              >
                {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Etiketler</label>
              <input
                value={form.tags}
                onChange={(e) => setForm((f) => ({ ...f, tags: e.target.value }))}
                className="w-full border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:border-gray-400"
                placeholder="keten, oversize, yaz"
              />
            </div>
          </div>

          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={form.featured}
              onChange={(e) => setForm((f) => ({ ...f, featured: e.target.checked }))}
              className="w-4 h-4 accent-gray-900"
            />
            <span className="text-xs text-gray-600">Öne Çıkan Ürün</span>
          </label>
        </div>

        {/* Right */}
        <div className="space-y-4">
          {/* Images */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs text-gray-500">Görsel URL'leri *</label>
              <button onClick={addImage} className="text-xs text-gray-900 flex items-center gap-1 hover:opacity-70">
                <PlusIcon size={12} /> Ekle
              </button>
            </div>
            {errors.images && <p className="text-[11px] text-red-500 mb-1">{errors.images}</p>}
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {form.images.map((img, i) => (
                <div key={i} className="flex gap-2">
                  <input
                    value={img.url}
                    onChange={(e) => updateImage(i, 'url', e.target.value)}
                    placeholder="https://... görsel URL"
                    className="flex-1 border border-gray-200 px-2 py-1.5 text-xs focus:outline-none focus:border-gray-400"
                  />
                  <input
                    value={img.alt}
                    onChange={(e) => updateImage(i, 'alt', e.target.value)}
                    placeholder="Alt metin"
                    className="w-28 border border-gray-200 px-2 py-1.5 text-xs focus:outline-none focus:border-gray-400"
                  />
                  <button
                    onClick={() => removeImage(i)}
                    className="text-gray-300 hover:text-red-400 transition-colors"
                  >
                    <XIcon size={14} />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Variants */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs text-gray-500">Varyasyonlar (Renk / Beden / Stok) *</label>
              <button onClick={addVariant} className="text-xs text-gray-900 flex items-center gap-1 hover:opacity-70">
                <PlusIcon size={12} /> Ekle
              </button>
            </div>
            {errors.variants && <p className="text-[11px] text-red-500 mb-1">{errors.variants}</p>}
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {form.variants.map((v, i) => (
                <div key={i} className="flex gap-2 items-center">
                  <input
                    value={v.color || ''}
                    onChange={(e) => updateVariant(i, 'color', e.target.value)}
                    placeholder="Renk"
                    className="flex-1 border border-gray-200 px-2 py-1.5 text-xs focus:outline-none focus:border-gray-400"
                  />
                  <input
                    value={v.size || ''}
                    onChange={(e) => updateVariant(i, 'size', e.target.value)}
                    placeholder="Beden"
                    className="w-20 border border-gray-200 px-2 py-1.5 text-xs focus:outline-none focus:border-gray-400"
                  />
                  <input
                    type="number"
                    value={v.stock}
                    onChange={(e) => updateVariant(i, 'stock', e.target.value)}
                    placeholder="Stok"
                    className="w-20 border border-gray-200 px-2 py-1.5 text-xs focus:outline-none focus:border-gray-400"
                    min={0}
                  />
                  <button
                    onClick={() => removeVariant(i)}
                    className="text-gray-300 hover:text-red-400 transition-colors"
                  >
                    <XIcon size={14} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="flex gap-3 mt-5 pt-5 border-t border-gray-100">
        <button
          onClick={handleSubmit}
          className="flex items-center gap-2 bg-gray-900 text-white px-6 py-2.5 text-xs font-medium tracking-widest uppercase hover:bg-gray-700 transition-colors"
        >
          <CheckIcon size={14} />
          {initial ? 'Güncelle' : 'Ürünü Kaydet'}
        </button>
        <button
          onClick={onCancel}
          className="px-6 py-2.5 border border-gray-200 text-xs font-medium tracking-widest uppercase hover:bg-gray-50 transition-colors"
        >
          İptal
        </button>
      </div>
    </div>
  );
}

export default function AdminPage() {
  const store = useStore();
  const { products, orders, coupons, settings, reviews } = store;

  const [isLoggedIn, setIsLoggedIn] = useState(() =>
    sessionStorage.getItem('moderno_admin_auth') === '1'
  );
  const [activeTab, setActiveTab] = useState<'products' | 'orders' | 'coupons' | 'settings' | 'reports'>('products');
  const [showAddProduct, setShowAddProduct] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [orderFilter, setOrderFilter] = useState('all');
  const [settingsForm, setSettingsForm] = useState(settings);
  const [settingsSaved, setSettingsSaved] = useState(false);
  const [newCoupon, setNewCoupon] = useState<Coupon>({
    code: '',
    discount: 10,
    minAmount: 0,
    active: true,
  });
  const [showAddCoupon, setShowAddCoupon] = useState(false);

  if (!isLoggedIn) {
    return (
      <AdminLogin
        adminPassword={settings.adminPassword}
        onLogin={() => setIsLoggedIn(true)}
      />
    );
  }

  // Stats
  const totalRevenue = orders
    .filter((o) => o.status !== 'cancelled')
    .reduce((s, o) => s + o.total, 0);
  const totalOrders = orders.length;
  const totalProducts = products.length;
  const lowStockProducts = products.filter((p) =>
    p.variants.some((v) => v.stock > 0 && v.stock <= 3)
  );
  const outOfStockProducts = products.filter((p) =>
    p.variants.every((v) => v.stock === 0)
  );

  // Filtered orders
  const filteredOrders =
    orderFilter === 'all'
      ? orders
      : orders.filter((o) => o.status === orderFilter);

  const handleSaveProduct = (data: Omit<Product, 'id' | 'createdAt'>) => {
    if (editingProduct) {
      store.updateProduct(editingProduct.id, data);
      setEditingProduct(null);
    } else {
      store.addProduct(data);
      setShowAddProduct(false);
    }
  };

  const handleSaveSettings = () => {
    store.updateSettings(settingsForm);
    setSettingsSaved(true);
    setTimeout(() => setSettingsSaved(false), 2000);
  };

  const handleAddCoupon = () => {
    if (!newCoupon.code.trim()) return;
    store.addCoupon({ ...newCoupon, code: newCoupon.code.toUpperCase() });
    setNewCoupon({ code: '', discount: 10, minAmount: 0, active: true });
    setShowAddCoupon(false);
  };

  // Category breakdown for reports
  const categoryStats = useMemo(() => {
    const stats: Record<string, { revenue: number; count: number }> = {};
    orders
      .filter((o) => o.status !== 'cancelled')
      .forEach((o) => {
        o.items.forEach((item) => {
          const product = products.find((p) => p.id === item.productId);
          const cat = product?.category || 'Diğer';
          if (!stats[cat]) stats[cat] = { revenue: 0, count: 0 };
          stats[cat].revenue += item.price * item.quantity;
          stats[cat].count += item.quantity;
        });
      });
    return Object.entries(stats).sort((a, b) => b[1].revenue - a[1].revenue);
  }, [orders, products]);

  const TABS = [
    { id: 'products', label: 'Ürünler', count: totalProducts },
    { id: 'orders', label: 'Siparişler', count: totalOrders },
    { id: 'coupons', label: 'Kuponlar', count: coupons.length },
    { id: 'reports', label: 'Raporlar' },
    { id: 'settings', label: 'Ayarlar' },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Admin Nav */}
      <header className="bg-white border-b border-gray-100 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 flex items-center justify-between h-14">
          <p className="font-black tracking-[0.2em] text-sm">
            MODERNO <span className="font-normal text-gray-400">Admin</span>
          </p>
          <div className="flex items-center gap-4">
            <a
              href="?page=store"
              className="text-xs text-gray-500 hover:text-gray-900 transition-colors"
            >
              Mağazayı Gör ↗
            </a>
            <button
              onClick={() => { sessionStorage.removeItem('moderno_admin_auth'); setIsLoggedIn(false); }}
              className="text-xs text-gray-400 hover:text-red-500 transition-colors"
            >
              Çıkış
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {[
            { label: 'Toplam Gelir', value: `${totalRevenue.toLocaleString('tr-TR')} ₺`, color: 'text-green-600' },
            { label: 'Toplam Sipariş', value: totalOrders, color: 'text-blue-600' },
            { label: 'Toplam Ürün', value: totalProducts, color: 'text-gray-900' },
            { label: 'Stok Uyarısı', value: `${lowStockProducts.length + outOfStockProducts.length}`, color: 'text-red-500' },
          ].map((stat) => (
            <div key={stat.label} className="bg-white border border-gray-100 p-4">
              <p className="text-[10px] text-gray-400 tracking-widest uppercase mb-1">{stat.label}</p>
              <p className={`text-2xl font-light ${stat.color}`}>{stat.value}</p>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex gap-0 border-b border-gray-200 mb-6 overflow-x-auto">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as typeof activeTab)}
              className={`flex items-center gap-1.5 px-5 py-3 text-xs font-medium tracking-widest uppercase whitespace-nowrap border-b-2 transition-colors ${
                activeTab === tab.id
                  ? 'border-gray-900 text-gray-900'
                  : 'border-transparent text-gray-400 hover:text-gray-600'
              }`}
            >
              {tab.label}
              {tab.count !== undefined && (
                <span className="bg-gray-100 text-gray-600 text-[9px] px-1.5 py-0.5 rounded-full">
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* PRODUCTS TAB */}
        {activeTab === 'products' && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                {lowStockProducts.length > 0 && (
                  <p className="text-xs text-orange-600 bg-orange-50 border border-orange-100 px-3 py-1.5 inline-block">
                    ⚠️ {lowStockProducts.length} ürünün stoğu azalıyor (≤3 adet)
                  </p>
                )}
              </div>
              {!showAddProduct && !editingProduct && (
                <button
                  onClick={() => setShowAddProduct(true)}
                  className="flex items-center gap-2 bg-gray-900 text-white px-5 py-2.5 text-xs font-medium tracking-widest uppercase hover:bg-gray-700 transition-colors"
                >
                  <PlusIcon size={14} />
                  Ürün Ekle
                </button>
              )}
            </div>

            {showAddProduct && (
              <ProductForm
                onSave={handleSaveProduct}
                onCancel={() => setShowAddProduct(false)}
              />
            )}

            {editingProduct && (
              <ProductForm
                initial={editingProduct}
                onSave={handleSaveProduct}
                onCancel={() => setEditingProduct(null)}
              />
            )}

            <div className="bg-white border border-gray-100 overflow-hidden">
              <table className="w-full text-xs">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr>
                    <th className="text-left px-4 py-3 font-medium text-gray-500 tracking-widest uppercase">Ürün</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-500 tracking-widest uppercase hidden sm:table-cell">Kategori</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-500 tracking-widest uppercase">Fiyat</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-500 tracking-widest uppercase hidden md:table-cell">Stok</th>
                    <th className="text-right px-4 py-3 font-medium text-gray-500 tracking-widest uppercase">İşlem</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {products.map((product) => {
                    const totalStock = product.variants.reduce((s, v) => s + v.stock, 0);
                    const isOOS = totalStock === 0;
                    const isLow = !isOOS && product.variants.some((v) => v.stock > 0 && v.stock <= 3);
                    return (
                      <tr key={product.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-12 bg-gray-100 overflow-hidden flex-shrink-0">
                              <img
                                src={product.images[0]?.url}
                                alt={product.name}
                                className="w-full h-full object-cover"
                              />
                            </div>
                            <div>
                              <p className="font-medium text-gray-900 line-clamp-1">{product.name}</p>
                              {product.featured && (
                                <span className="text-[9px] bg-gray-100 text-gray-600 px-1.5 py-0.5">ÖNCÜL</span>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-gray-500 hidden sm:table-cell">{product.category}</td>
                        <td className="px-4 py-3 font-medium text-gray-900">{product.price.toLocaleString('tr-TR')} ₺</td>
                        <td className="px-4 py-3 hidden md:table-cell">
                          <div className="space-y-1">
                            {product.variants.slice(0, 3).map((v) => (
                              <div key={v.id} className="flex items-center gap-2">
                                <span className="text-gray-400">{[v.color, v.size].filter(Boolean).join('/')}</span>
                                <input
                                  type="number"
                                  value={v.stock}
                                  min={0}
                                  onChange={(e) =>
                                    store.updateStock(product.id, v.id, Number(e.target.value))
                                  }
                                  className={`w-16 border px-1.5 py-0.5 text-center focus:outline-none transition-colors ${
                                    v.stock === 0
                                      ? 'border-red-200 bg-red-50 text-red-600'
                                      : v.stock <= 3
                                      ? 'border-orange-200 bg-orange-50 text-orange-600'
                                      : 'border-gray-200 focus:border-gray-400'
                                  }`}
                                />
                              </div>
                            ))}
                            {product.variants.length > 3 && (
                              <p className="text-gray-400 text-[10px]">+{product.variants.length - 3} daha...</p>
                            )}
                          </div>
                          <div className="mt-1">
                            {isOOS ? (
                              <span className="text-[9px] bg-red-50 text-red-600 border border-red-100 px-1.5 py-0.5">TÜKENDİ</span>
                            ) : isLow ? (
                              <span className="text-[9px] bg-orange-50 text-orange-600 border border-orange-100 px-1.5 py-0.5">AZALIYOR</span>
                            ) : (
                              <span className="text-[9px] bg-green-50 text-green-600 border border-green-100 px-1.5 py-0.5">STOKTA</span>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex justify-end gap-2">
                            <button
                              onClick={() => setEditingProduct(product)}
                              className="text-[10px] border border-gray-200 px-2 py-1 hover:bg-gray-50 transition-colors"
                            >
                              Düzenle
                            </button>
                            <button
                              onClick={() => {
                                if (confirm(`"${product.name}" silinecek. Emin misiniz?`)) {
                                  store.deleteProduct(product.id);
                                }
                              }}
                              className="text-gray-300 hover:text-red-400 transition-colors p-1"
                            >
                              <TrashIcon size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              {products.length === 0 && (
                <div className="text-center py-12 text-gray-400">Henüz ürün eklenmedi.</div>
              )}
            </div>
          </div>
        )}

        {/* ORDERS TAB */}
        {activeTab === 'orders' && (
          <div>
            {/* Filter */}
            <div className="flex gap-2 mb-4 flex-wrap">
              {['all', 'confirmed', 'preparing', 'shipped', 'delivered', 'return_requested', 'cancelled'].map((s) => (
                <button
                  key={s}
                  onClick={() => setOrderFilter(s)}
                  className={`text-[10px] px-3 py-1.5 border transition-colors ${
                    orderFilter === s
                      ? 'border-gray-900 bg-gray-900 text-white'
                      : 'border-gray-200 text-gray-500 hover:border-gray-400'
                  }`}
                >
                  {s === 'all' ? 'Tümü' : STATUS_LABELS[s]}
                </button>
              ))}
            </div>

            <div className="space-y-3">
              {filteredOrders.length === 0 && (
                <div className="text-center py-12 text-gray-400 bg-white border border-gray-100">
                  Sipariş bulunamadı.
                </div>
              )}
              {filteredOrders.map((order) => (
                <OrderCard
                  key={order.id}
                  order={order}
                  onStatusChange={store.updateOrderStatus}
                />
              ))}
            </div>
          </div>
        )}

        {/* COUPONS TAB */}
        {activeTab === 'coupons' && (
          <div>
            <div className="flex justify-between mb-4">
              <h3 className="text-sm font-medium text-gray-700">Kupon Kodları</h3>
              <button
                onClick={() => setShowAddCoupon(!showAddCoupon)}
                className="flex items-center gap-2 bg-gray-900 text-white px-4 py-2 text-xs font-medium tracking-widest uppercase hover:bg-gray-700 transition-colors"
              >
                <PlusIcon size={12} />
                Kupon Ekle
              </button>
            </div>

            {showAddCoupon && (
              <div className="bg-white border border-gray-100 p-5 mb-4">
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Kupon Kodu</label>
                    <input
                      value={newCoupon.code}
                      onChange={(e) => setNewCoupon((c) => ({ ...c, code: e.target.value.toUpperCase() }))}
                      placeholder="WELCOME10"
                      className="w-full border border-gray-200 px-3 py-2 text-sm uppercase focus:outline-none focus:border-gray-400 font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">İndirim (%)</label>
                    <input
                      type="number"
                      value={newCoupon.discount}
                      onChange={(e) => setNewCoupon((c) => ({ ...c, discount: Number(e.target.value) }))}
                      min={1}
                      max={100}
                      className="w-full border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:border-gray-400"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Min. Tutar (₺)</label>
                    <input
                      type="number"
                      value={newCoupon.minAmount}
                      onChange={(e) => setNewCoupon((c) => ({ ...c, minAmount: Number(e.target.value) }))}
                      min={0}
                      className="w-full border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:border-gray-400"
                    />
                  </div>
                  <div className="flex items-end gap-2">
                    <button
                      onClick={handleAddCoupon}
                      className="flex-1 bg-gray-900 text-white py-2 text-xs font-medium tracking-widest uppercase hover:bg-gray-700 transition-colors"
                    >
                      Kaydet
                    </button>
                    <button
                      onClick={() => setShowAddCoupon(false)}
                      className="py-2 px-3 border border-gray-200 text-xs hover:bg-gray-50"
                    >
                      İptal
                    </button>
                  </div>
                </div>
              </div>
            )}

            <div className="bg-white border border-gray-100 overflow-hidden">
              <table className="w-full text-xs">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr>
                    <th className="text-left px-4 py-3 font-medium text-gray-500 tracking-widest uppercase">Kod</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-500 tracking-widest uppercase">İndirim</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-500 tracking-widest uppercase">Min. Tutar</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-500 tracking-widest uppercase">Durum</th>
                    <th className="text-right px-4 py-3 font-medium text-gray-500 tracking-widest uppercase">İşlem</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {coupons.map((coupon) => (
                    <tr key={coupon.code} className="hover:bg-gray-50">
                      <td className="px-4 py-3 font-mono font-bold text-gray-900">{coupon.code}</td>
                      <td className="px-4 py-3 text-green-600 font-medium">%{coupon.discount}</td>
                      <td className="px-4 py-3 text-gray-500">{coupon.minAmount > 0 ? `${coupon.minAmount.toLocaleString('tr-TR')} ₺` : 'Yok'}</td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => store.updateCoupon(coupon.code, { active: !coupon.active })}
                          className={`text-[9px] px-2 py-1 border ${coupon.active ? 'bg-green-50 text-green-600 border-green-100' : 'bg-gray-50 text-gray-400 border-gray-100'}`}
                        >
                          {coupon.active ? 'Aktif' : 'Pasif'}
                        </button>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={() => {
                            if (confirm(`"${coupon.code}" kuponu silinecek?`)) {
                              store.deleteCoupon(coupon.code);
                            }
                          }}
                          className="text-gray-300 hover:text-red-400 transition-colors"
                        >
                          <TrashIcon size={14} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* REPORTS TAB */}
        {activeTab === 'reports' && (
          <div className="space-y-6">
            {/* Revenue Chart (simple bars) */}
            <div className="bg-white border border-gray-100 p-6">
              <h3 className="text-xs font-medium tracking-widest uppercase text-gray-500 mb-5">
                Kategori Bazlı Satış Raporu
              </h3>
              {categoryStats.length === 0 ? (
                <p className="text-sm text-gray-400">Henüz satış verisi yok.</p>
              ) : (
                <div className="space-y-3">
                  {categoryStats.map(([cat, stat]) => {
                    const maxRevenue = categoryStats[0]?.[1]?.revenue || 1;
                    const pct = (stat.revenue / maxRevenue) * 100;
                    return (
                      <div key={cat}>
                        <div className="flex justify-between text-xs mb-1">
                          <span className="font-medium text-gray-700">{cat}</span>
                          <span className="text-gray-500">
                            {stat.count} adet · {stat.revenue.toLocaleString('tr-TR')} ₺
                          </span>
                        </div>
                        <div className="h-2 bg-gray-100 overflow-hidden">
                          <div
                            className="h-full bg-gray-900 transition-all duration-700"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Orders by Status */}
            <div className="bg-white border border-gray-100 p-6">
              <h3 className="text-xs font-medium tracking-widest uppercase text-gray-500 mb-5">
                Sipariş Durum Dağılımı
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {Object.entries(STATUS_LABELS).map(([status, label]) => {
                  const count = orders.filter((o) => o.status === status).length;
                  return (
                    <div key={status} className={`border p-3 ${STATUS_COLORS[status]}`}>
                      <p className="text-lg font-light">{count}</p>
                      <p className="text-[10px] font-medium tracking-widest uppercase">{label}</p>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Recent Orders Summary */}
            <div className="bg-white border border-gray-100 p-6">
              <h3 className="text-xs font-medium tracking-widest uppercase text-gray-500 mb-5">
                Son Siparişler
              </h3>
              <div className="space-y-2">
                {orders.slice(0, 5).map((order) => (
                  <div key={order.id} className="flex items-center justify-between text-xs py-2 border-b border-gray-50">
                    <span className="font-mono text-gray-600">{order.trackingCode}</span>
                    <span className="text-gray-500">{order.customer.name}</span>
                    <span className={`px-2 py-0.5 border text-[9px] ${STATUS_COLORS[order.status]}`}>
                      {STATUS_LABELS[order.status]}
                    </span>
                    <span className="font-medium text-gray-900">{order.total.toLocaleString('tr-TR')} ₺</span>
                  </div>
                ))}
                {orders.length === 0 && (
                  <p className="text-sm text-gray-400">Henüz sipariş yok.</p>
                )}
              </div>
            </div>

            {/* Product Reviews */}
            <div className="bg-white border border-gray-100 p-6">
              <h3 className="text-xs font-medium tracking-widest uppercase text-gray-500 mb-5">
                Son Ürün Yorumları
              </h3>
              <div className="space-y-3">
                {reviews.slice(0, 5).map((review) => {
                  const product = products.find((p) => p.id === review.productId);
                  return (
                    <div key={review.id} className="border-b border-gray-50 pb-3">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="text-xs font-medium text-gray-900">{review.author}</p>
                          <p className="text-[10px] text-gray-400">{product?.name}</p>
                        </div>
                        <div className="flex">
                          {[1,2,3,4,5].map((s) => (
                            <StarIcon key={s} size={10} filled={s <= review.rating} className="text-gray-900" />
                          ))}
                        </div>
                      </div>
                      <p className="text-xs text-gray-600 mt-1">{review.comment}</p>
                    </div>
                  );
                })}
                {reviews.length === 0 && (
                  <p className="text-sm text-gray-400">Henüz yorum yok.</p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* SETTINGS TAB */}
        {activeTab === 'settings' && (
          <div className="max-w-2xl">
            <div className="bg-white border border-gray-100 p-6 space-y-4">
              <h3 className="text-xs font-medium tracking-widest uppercase text-gray-500 mb-2">
                Mağaza Ayarları
              </h3>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Mağaza Adı</label>
                  <input
                    value={settingsForm.storeName}
                    onChange={(e) => setSettingsForm((f) => ({ ...f, storeName: e.target.value }))}
                    className="w-full border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:border-gray-400"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Admin Şifresi</label>
                  <input
                    type="password"
                    value={settingsForm.adminPassword}
                    onChange={(e) => setSettingsForm((f) => ({ ...f, adminPassword: e.target.value }))}
                    className="w-full border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:border-gray-400"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">WhatsApp Numarası</label>
                  <input
                    value={settingsForm.whatsapp}
                    onChange={(e) => setSettingsForm((f) => ({ ...f, whatsapp: e.target.value }))}
                    placeholder="905551234567"
                    className="w-full border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:border-gray-400"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Instagram Kullanıcı Adı</label>
                  <input
                    value={settingsForm.instagram}
                    onChange={(e) => setSettingsForm((f) => ({ ...f, instagram: e.target.value }))}
                    placeholder="modernostore"
                    className="w-full border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:border-gray-400"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Banka Adı</label>
                  <input
                    value={settingsForm.bankName}
                    onChange={(e) => setSettingsForm((f) => ({ ...f, bankName: e.target.value }))}
                    className="w-full border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:border-gray-400"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">IBAN</label>
                  <input
                    value={settingsForm.iban}
                    onChange={(e) => setSettingsForm((f) => ({ ...f, iban: e.target.value }))}
                    className="w-full border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:border-gray-400 font-mono text-xs"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-xs text-gray-500 mb-1">Hesap Sahibi</label>
                  <input
                    value={settingsForm.accountHolder}
                    onChange={(e) => setSettingsForm((f) => ({ ...f, accountHolder: e.target.value }))}
                    className="w-full border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:border-gray-400"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Kargo Gün Sayısı</label>
                  <input
                    type="number"
                    min={1}
                    value={settingsForm.cargoDays}
                    onChange={(e) => setSettingsForm((f) => ({ ...f, cargoDays: Number(e.target.value) }))}
                    className="w-full border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:border-gray-400"
                  />
                </div>
              </div>

              <button
                onClick={handleSaveSettings}
                className={`flex items-center gap-2 px-6 py-2.5 text-xs font-medium tracking-widest uppercase transition-colors ${
                  settingsSaved
                    ? 'bg-green-600 text-white'
                    : 'bg-gray-900 text-white hover:bg-gray-700'
                }`}
              >
                {settingsSaved ? <><CheckIcon size={14} /> Kaydedildi!</> : 'Ayarları Kaydet'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Order Card Component
function OrderCard({
  order,
  onStatusChange,
}: {
  order: Order;
  onStatusChange: (id: string, status: Order['status']) => void;
}) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="bg-white border border-gray-100 overflow-hidden">
      <div
        className="flex items-center justify-between px-4 py-3 cursor-pointer hover:bg-gray-50"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center gap-4 flex-wrap">
          <span className="font-mono font-bold text-sm text-gray-900">{order.trackingCode}</span>
          <span className="text-xs text-gray-500">{order.customer.name}</span>
          <span className={`text-[9px] px-2 py-1 border font-medium ${STATUS_COLORS[order.status]}`}>
            {STATUS_LABELS[order.status]}
          </span>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm font-medium text-gray-900 hidden sm:block">
            {order.total.toLocaleString('tr-TR')} ₺
          </span>
          <span className="text-[10px] text-gray-400">
            {new Date(order.createdAt).toLocaleDateString('tr-TR')}
          </span>
          <span className="text-gray-400 text-xs">{expanded ? '▲' : '▼'}</span>
        </div>
      </div>

      {expanded && (
        <div className="border-t border-gray-50 px-4 py-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <p className="text-[10px] font-medium tracking-widest uppercase text-gray-400 mb-2">Müşteri Bilgileri</p>
              <div className="text-xs text-gray-600 space-y-1">
                <p><strong className="text-gray-900">{order.customer.name}</strong></p>
                <p>{order.customer.email}</p>
                <p>{order.customer.phone}</p>
                <p>{order.customer.address}, {order.customer.city} {order.customer.postalCode}</p>
                <p className="text-gray-400">{order.paymentMethod === 'bank_transfer' ? '🏦 Havale/EFT' : '💳 Kredi Kartı'}</p>
              </div>
            </div>

            <div>
              <p className="text-[10px] font-medium tracking-widest uppercase text-gray-400 mb-2">Ürünler</p>
              <div className="space-y-1.5">
                {order.items.map((item, i) => (
                  <div key={i} className="flex items-center gap-2 text-xs">
                    <div className="w-8 h-10 bg-gray-100 overflow-hidden flex-shrink-0">
                      <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-gray-900 line-clamp-1">{item.name}</p>
                      <p className="text-gray-400">{[item.color, item.size].filter(Boolean).join('/')} × {item.quantity}</p>
                    </div>
                    <span className="text-gray-900 font-medium">{(item.price * item.quantity).toLocaleString('tr-TR')} ₺</span>
                  </div>
                ))}
              </div>
              <div className="mt-3 pt-3 border-t border-gray-100 text-xs font-bold text-gray-900 flex justify-between">
                <span>Toplam</span>
                <span>{order.total.toLocaleString('tr-TR')} ₺</span>
              </div>
            </div>
          </div>

          {order.returnReason && (
            <div className="mt-3 bg-orange-50 border border-orange-100 p-3 text-xs text-orange-700">
              <strong>İade Nedeni:</strong> {order.returnReason}
            </div>
          )}

          {/* Status Change */}
          <div className="mt-4 pt-4 border-t border-gray-100">
            <p className="text-[10px] font-medium tracking-widest uppercase text-gray-400 mb-2">Durum Güncelle</p>
            <div className="flex flex-wrap gap-2">
              {(['confirmed', 'preparing', 'shipped', 'delivered', 'cancelled', 'returned'] as Order['status'][]).map((s) => (
                <button
                  key={s}
                  onClick={() => onStatusChange(order.id, s)}
                  className={`text-[9px] px-2.5 py-1.5 border font-medium transition-colors ${
                    order.status === s
                      ? STATUS_COLORS[s] + ' font-bold'
                      : 'border-gray-200 text-gray-400 hover:border-gray-400'
                  }`}
                >
                  {STATUS_LABELS[s]}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


