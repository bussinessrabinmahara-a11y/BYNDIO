import { useState, useEffect } from 'react';
import { ShoppingBag, BarChart2, Users, Package, Tag, Star, DollarSign, Building2, Settings, Save, Edit, Trash2, LayoutTemplate, PlusCircle, RefreshCw } from 'lucide-react';
import { toast, toastSuccess } from '../components/Toast';
import { useAppStore } from '../store';
import { supabase } from '../lib/supabase';

interface RealOrder {
  id: string;
  total_amount: number;
  status: string;
  payment_status: string;
  created_at: string;
  buyer_id: string;
}

// Full product management: add, list, edit, delete
function ProductManager() {
  const fetchProducts = useAppStore(state => state.fetchProducts);
  const [subTab, setSubTab] = useState<'list' | 'add'>('list');
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [editingProduct, setEditingProduct] = useState<any | null>(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [newProduct, setNewProduct] = useState({
    name: '', brand: '', category: 'Fashion', price: '', mrp: '', imageUrl: '', description: ''
  });
  const [adding, setAdding] = useState(false);

  const loadProducts = async () => {
    setLoading(true);
    const { data } = await supabase.from('products').select('id, name, category, price, mrp, is_active, images, created_at').order('created_at', { ascending: false });
    setProducts(data || []);
    setLoading(false);
  };

  useEffect(() => { loadProducts(); }, []);

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this product? This cannot be undone.')) return;
    setDeletingId(id);
    const { error } = await supabase.from('products').delete().eq('id', id);
    if (!error) {
      setProducts(p => p.filter(x => x.id !== id));
      fetchProducts();
    }
    setDeletingId(null);
  };

  const handleToggleActive = async (id: string, current: boolean) => {
    await supabase.from('products').update({ is_active: !current }).eq('id', id);
    setProducts(p => p.map(x => x.id === id ? { ...x, is_active: !current } : x));
    fetchProducts();
  };

  const handleSaveEdit = async () => {
    if (!editingProduct) return;
    setSaving(true);
    const { error } = await supabase.from('products').update({
      name: editingProduct.name,
      category: editingProduct.category,
      price: parseFloat(editingProduct.price),
      mrp: parseFloat(editingProduct.mrp),
      is_active: editingProduct.is_active,
    }).eq('id', editingProduct.id);
    if (!error) {
      setProducts(p => p.map(x => x.id === editingProduct.id ? { ...x, ...editingProduct } : x));
      setEditingProduct(null);
      fetchProducts();
    }
    setSaving(false);
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setAdding(true);
    setMessage('');
    try {
      const price = parseFloat(newProduct.price);
      const mrp = parseFloat(newProduct.mrp);
      if (isNaN(price) || price <= 0) throw new Error('Enter a valid price');
      if (isNaN(mrp) || mrp < price) throw new Error('MRP must be ≥ selling price');
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) throw new Error('Not authenticated');
      const { error } = await supabase.from('products').insert({
        name: newProduct.name.trim(),
        description: newProduct.description.trim() || `Brand: ${newProduct.brand.trim()}`,
        category: newProduct.category,
        price, mrp,
        images: [newProduct.imageUrl || 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&q=80&w=1000'],
        seller_id: userData.user.id,
        is_active: true,
        specifications: { Brand: newProduct.brand.trim() },
      });
      if (error) throw error;
      setMessage('✅ Product added successfully!');
      setNewProduct({ name: '', brand: '', category: 'Fashion', price: '', mrp: '', imageUrl: '', description: '' });
      loadProducts();
      fetchProducts();
      setTimeout(() => { setSubTab('list'); setMessage(''); }, 1500);
    } catch (err: any) {
      setMessage('❌ ' + err.message);
    }
    setAdding(false);
  };

  const filtered = products.filter(p =>
    p.name?.toLowerCase().includes(search.toLowerCase()) ||
    p.category?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="text-xl font-black text-[#0D47A1]">📦 Product Management</div>
        <div className="flex gap-2">
          <button onClick={() => setSubTab('list')} className={`px-4 py-2 rounded-md text-[13px] font-bold transition-colors ${subTab === 'list' ? 'bg-[#0D47A1] text-white' : 'bg-white border border-gray-300 text-gray-600 hover:bg-gray-50'}`}>
            📋 All Products ({products.length})
          </button>
          <button onClick={() => setSubTab('add')} className={`px-4 py-2 rounded-md text-[13px] font-bold transition-colors ${subTab === 'add' ? 'bg-[#0D47A1] text-white' : 'bg-white border border-gray-300 text-gray-600 hover:bg-gray-50'}`}>
            ➕ Add Product
          </button>
        </div>
      </div>

      {subTab === 'list' && (
        <>
          {/* Search + Refresh */}
          <div className="flex gap-3 mb-3">
            <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by name or category..." className="flex-1 max-w-sm p-2.5 border border-gray-300 rounded-md text-[13px] outline-none focus:border-[#1565C0]" />
            <button onClick={loadProducts} className="flex items-center gap-1.5 text-[12px] text-[#1565C0] font-semibold hover:underline px-2">
              <RefreshCw size={13} /> Refresh
            </button>
          </div>

          {/* Product Table */}
          <div className="bg-white rounded-[10px] shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-[13px] text-left">
                <thead className="bg-gray-50 text-[11px] font-bold text-gray-500 uppercase tracking-wide">
                  <tr>
                    <th className="p-3 border-b border-gray-200">Product</th>
                    <th className="p-3 border-b border-gray-200">Category</th>
                    <th className="p-3 border-b border-gray-200">Price</th>
                    <th className="p-3 border-b border-gray-200">MRP</th>
                    <th className="p-3 border-b border-gray-200">Status</th>
                    <th className="p-3 border-b border-gray-200">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr><td colSpan={6} className="p-6 text-center text-gray-400">Loading products...</td></tr>
                  ) : filtered.length === 0 ? (
                    <tr><td colSpan={6} className="p-6 text-center text-gray-400">No products found</td></tr>
                  ) : filtered.map(p => (
                    <tr key={p.id} className="hover:bg-blue-50/30">
                      <td className="p-3 border-b border-gray-100">
                        <div className="flex items-center gap-2.5">
                          <img src={p.images?.[0]} alt={p.name} className="w-10 h-10 rounded-md object-cover bg-gray-100" onError={e => { (e.target as any).src = 'https://via.placeholder.com/40'; }} />
                          <div>
                            <div className="font-semibold text-[13px]">{p.name}</div>
                            <div className="text-[10px] text-gray-400">ID: {p.id.slice(0, 8)}...</div>
                          </div>
                        </div>
                      </td>
                      <td className="p-3 border-b border-gray-100">
                        <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-[#E3F2FD] text-[#0D47A1]">{p.category}</span>
                      </td>
                      <td className="p-3 border-b border-gray-100 font-bold text-[#0D47A1]">₹{Number(p.price).toLocaleString('en-IN')}</td>
                      <td className="p-3 border-b border-gray-100 text-gray-400 line-through text-[12px]">₹{Number(p.mrp).toLocaleString('en-IN')}</td>
                      <td className="p-3 border-b border-gray-100">
                        <button onClick={() => handleToggleActive(p.id, p.is_active)} className={`text-[11px] font-bold px-2.5 py-1 rounded-full transition-colors ${p.is_active ? 'bg-green-100 text-green-700 hover:bg-red-50 hover:text-red-600' : 'bg-red-100 text-red-600 hover:bg-green-50 hover:text-green-700'}`}>
                          {p.is_active ? '✓ Active' : '✗ Hidden'}
                        </button>
                      </td>
                      <td className="p-3 border-b border-gray-100">
                        <div className="flex items-center gap-2">
                          <button onClick={() => setEditingProduct({ ...p, price: String(p.price), mrp: String(p.mrp) })} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-md transition-colors" title="Edit">
                            <Edit size={14} />
                          </button>
                          <button onClick={() => handleDelete(p.id)} disabled={deletingId === p.id} className="p-1.5 text-red-500 hover:bg-red-50 rounded-md transition-colors disabled:opacity-40" title="Delete">
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

          {/* Edit Modal */}
          {editingProduct && (
            <div className="fixed inset-0 bg-black/50 z-[2000] flex items-center justify-center p-4">
              <div className="bg-white rounded-xl w-full max-w-md shadow-2xl p-6">
                <div className="text-[16px] font-black mb-4">✏️ Edit Product</div>
                <div className="flex flex-col gap-3">
                  {[
                    { label: 'Product Name', field: 'name', type: 'text' },
                    { label: 'Price (₹)', field: 'price', type: 'number' },
                    { label: 'MRP (₹)', field: 'mrp', type: 'number' },
                  ].map(f => (
                    <div key={f.field}>
                      <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wide block mb-1">{f.label}</label>
                      <input type={f.type} value={editingProduct[f.field]} onChange={e => setEditingProduct((p: any) => ({ ...p, [f.field]: e.target.value }))} className="w-full p-2.5 border border-gray-300 rounded-md text-[13px] outline-none focus:border-[#1565C0]" />
                    </div>
                  ))}
                  <div>
                    <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wide block mb-1">Category</label>
                    <select value={editingProduct.category} onChange={e => setEditingProduct((p: any) => ({ ...p, category: e.target.value }))} className="w-full p-2.5 border border-gray-300 rounded-md text-[13px] outline-none focus:border-[#1565C0]">
                      {['Fashion', 'Electronics', 'Beauty', 'Kids', 'Sports', 'Home'].map(c => <option key={c}>{c}</option>)}
                    </select>
                  </div>
                </div>
                <div className="flex gap-3 mt-5">
                  <button onClick={handleSaveEdit} disabled={saving} className="flex-1 bg-[#0D47A1] hover:bg-[#1565C0] text-white py-2.5 rounded-md text-[13px] font-bold disabled:opacity-50">
                    {saving ? 'Saving...' : '💾 Save Changes'}
                  </button>
                  <button onClick={() => setEditingProduct(null)} className="flex-1 border border-gray-300 text-gray-600 py-2.5 rounded-md text-[13px] font-bold hover:bg-gray-50">
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {subTab === 'add' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* Add Form */}
          <div className="lg:col-span-2 bg-white rounded-[10px] p-5 shadow-sm">
            <div className="text-[15px] font-black mb-4">➕ Add New Product</div>
            <form onSubmit={handleAdd} className="flex flex-col gap-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wide">Product Name *</label>
                  <input type="text" required value={newProduct.name} onChange={e => setNewProduct(p => ({ ...p, name: e.target.value }))} placeholder="e.g. Wireless Earbuds Pro" className="p-2.5 border border-gray-300 rounded-md text-[13px] outline-none focus:border-[#1565C0]" />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wide">Brand *</label>
                  <input type="text" required value={newProduct.brand} onChange={e => setNewProduct(p => ({ ...p, brand: e.target.value }))} placeholder="e.g. Sony, boAt, Samsung" className="p-2.5 border border-gray-300 rounded-md text-[13px] outline-none focus:border-[#1565C0]" />
                </div>
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wide">Category *</label>
                <select value={newProduct.category} onChange={e => setNewProduct(p => ({ ...p, category: e.target.value }))} className="p-2.5 border border-gray-300 rounded-md text-[13px] outline-none focus:border-[#1565C0]">
                  {['Fashion', 'Electronics', 'Beauty', 'Kids', 'Sports', 'Home'].map(c => <option key={c}>{c}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wide">Selling Price (₹) *</label>
                  <input type="number" required min="1" value={newProduct.price} onChange={e => setNewProduct(p => ({ ...p, price: e.target.value }))} placeholder="999" className="p-2.5 border border-gray-300 rounded-md text-[13px] outline-none focus:border-[#1565C0]" />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wide">MRP (₹) *</label>
                  <input type="number" required min="1" value={newProduct.mrp} onChange={e => setNewProduct(p => ({ ...p, mrp: e.target.value }))} placeholder="1499" className="p-2.5 border border-gray-300 rounded-md text-[13px] outline-none focus:border-[#1565C0]" />
                </div>
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wide">Product Image URL</label>
                <input type="url" value={newProduct.imageUrl} onChange={e => setNewProduct(p => ({ ...p, imageUrl: e.target.value }))} placeholder="https://example.com/product-image.jpg" className="p-2.5 border border-gray-300 rounded-md text-[13px] outline-none focus:border-[#1565C0]" />
                {newProduct.imageUrl && <img src={newProduct.imageUrl} alt="preview" className="w-20 h-20 object-cover rounded-md border border-gray-200 mt-1" onError={e => { (e.target as any).style.display='none'; }} />}
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wide">Description (Optional)</label>
                <textarea value={newProduct.description} onChange={e => setNewProduct(p => ({ ...p, description: e.target.value }))} placeholder="Describe the product features, materials, specifications..." rows={3} className="p-2.5 border border-gray-300 rounded-md text-[13px] outline-none focus:border-[#1565C0] resize-none" />
              </div>
              {message && (
                <div className={`text-[12px] font-semibold p-3 rounded-md ${message.startsWith('✅') ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
                  {message}
                </div>
              )}
              <button type="submit" disabled={adding} className="bg-[#0D47A1] hover:bg-[#1565C0] disabled:bg-gray-400 text-white py-3 rounded-md text-[14px] font-black flex items-center justify-center gap-2 transition-colors">
                {adding ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Adding...</> : '➕ Add Product'}
              </button>
            </form>
          </div>

          {/* Tips Panel */}
          <div className="flex flex-col gap-4">
            <div className="bg-[#E3F2FD] border border-[#90CAF9] rounded-[10px] p-4">
              <div className="text-[13px] font-black text-[#0D47A1] mb-3">💡 Tips for a Great Listing</div>
              <div className="flex flex-col gap-2.5">
                {[
                  { icon: '📝', tip: 'Use a clear, specific product name — include brand and key feature (e.g. "boAt Airdopes 141 Bluetooth Earbuds")' },
                  { icon: '🖼️', tip: 'Use a clean white-background image URL for best results. Recommended size: 800×800px minimum.' },
                  { icon: '💰', tip: 'MRP must always be higher than the selling price — this shows the discount % to buyers.' },
                  { icon: '🏷️', tip: 'Pick the most specific category. Wrong categories reduce product visibility in search.' },
                  { icon: '📖', tip: 'A good description boosts SEO and conversion — mention material, size, color, compatibility.' },
                  { icon: '⚡', tip: 'After adding, go to "All Products" to verify it appears and toggle it Active/Hidden anytime.' },
                ].map((t, i) => (
                  <div key={i} className="flex gap-2 text-[12px] text-[#1565C0]">
                    <span className="shrink-0 mt-0.5">{t.icon}</span>
                    <span>{t.tip}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="bg-[#FFF3E0] border border-[#FFCC80] rounded-[10px] p-4">
              <div className="text-[13px] font-black text-[#E65100] mb-2">⚠️ Before You Add</div>
              <div className="flex flex-col gap-1.5 text-[12px] text-[#BF360C]">
                <div>• Make sure the image URL is publicly accessible (not behind login)</div>
                <div>• Duplicate product names are allowed but confuse buyers — keep them unique</div>
                <div>• You can hide a product anytime without deleting it</div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// Reusable user table for sellers, buyers, creators
function UserTable({ role, title }: { role: string; title: string }) {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    setLoading(true);
    supabase.from('users').select('id, full_name, email, role, created_at')
      .eq('role', role).order('created_at', { ascending: false })
      .then(({ data }) => { setUsers(data || []); setLoading(false); });
  }, [role]);

  const filtered = users.filter(u =>
    u.full_name?.toLowerCase().includes(search.toLowerCase()) ||
    u.email?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <>
      <div className="flex items-center justify-between mb-4">
        <div className="text-xl font-black text-[#0D47A1]">{title}</div>
        <div className="text-[13px] font-semibold text-gray-500">{users.length} total</div>
      </div>
      <div className="bg-white rounded-[10px] shadow-sm overflow-hidden">
        <div className="p-3 border-b border-gray-100">
          <input
            type="text" value={search} onChange={e => setSearch(e.target.value)}
            placeholder={`Search ${role}s by name or email...`}
            className="w-full max-w-sm p-2 border border-gray-300 rounded-md text-[13px] outline-none focus:border-[#1565C0]"
          />
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-[13px] text-left">
            <thead className="bg-gray-50 text-[11px] font-bold text-gray-500 uppercase tracking-wide">
              <tr>
                <th className="p-3 border-b border-gray-200">#</th>
                <th className="p-3 border-b border-gray-200">Name</th>
                <th className="p-3 border-b border-gray-200">Email</th>
                <th className="p-3 border-b border-gray-200">Role</th>
                <th className="p-3 border-b border-gray-200">Joined</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={5} className="p-5 text-center text-gray-400">Loading...</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={5} className="p-5 text-center text-gray-400">No {role}s found</td></tr>
              ) : filtered.map((u, i) => (
                <tr key={u.id} className="hover:bg-blue-50/40">
                  <td className="p-3 border-b border-gray-100 text-gray-400">{i + 1}</td>
                  <td className="p-3 border-b border-gray-100 font-semibold">{u.full_name || '—'}</td>
                  <td className="p-3 border-b border-gray-100 text-gray-600">{u.email}</td>
                  <td className="p-3 border-b border-gray-100">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#E3F2FD] text-[#0D47A1] capitalize">{u.role}</span>
                  </td>
                  <td className="p-3 border-b border-gray-100 text-gray-500">
                    {u.created_at ? new Date(u.created_at).toLocaleDateString('en-IN') : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}

export default function Admin() {
  const [tab, setTab] = useState('overview');
  const siteSettings = useAppStore(state => state.siteSettings);
  const fetchSiteSettings = useAppStore(state => state.fetchSiteSettings);
  const fetchProducts = useAppStore(state => state.fetchProducts);

  // Real orders from Supabase
  const [realOrders, setRealOrders] = useState<RealOrder[]>([]);
  const [isLoadingOrders, setIsLoadingOrders] = useState(false);

  // Site Content State
  const [heroTitle, setHeroTitle] = useState('');
  const [heroSubtitle, setHeroSubtitle] = useState('');
  const [footerAbout, setFooterAbout] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [contactAddress, setContactAddress] = useState('');
  const [isSavingSettings, setIsSavingSettings] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');

  // New Product State
  const [newProduct, setNewProduct] = useState({
    name: '', brand: '', category: 'Fashion',
    price: '', mrp: '', imageUrl: ''
  });
  const [isAddingProduct, setIsAddingProduct] = useState(false);
  const [productMessage, setProductMessage] = useState('');

  useEffect(() => {
    if (siteSettings) {
      setHeroTitle(siteSettings.hero_title || '');
      setHeroSubtitle(siteSettings.hero_subtitle || '');
      setFooterAbout(siteSettings.footer_about || '');
      setContactEmail(siteSettings.contact_email || '');
      setContactPhone(siteSettings.contact_phone || '');
      setContactAddress(siteSettings.contact_address || '');
    }
  }, [siteSettings]);

  useEffect(() => {
    if (tab === 'overview' || tab === 'orders') {
      fetchRealOrders();
    }
  }, [tab]);

  const fetchRealOrders = async () => {
    setIsLoadingOrders(true);
    try {
      const { data, error } = await supabase
        .from('orders')
        .select('id, total_amount, status, payment_status, created_at, buyer_id')
        .order('created_at', { ascending: false })
        .limit(20);
      if (!error && data) setRealOrders(data);
    } catch (err) {
      console.error('Error fetching orders:', err);
    } finally {
      setIsLoadingOrders(false);
    }
  };

  const handleSaveSiteContent = async () => {
    setIsSavingSettings(true);
    setSaveMessage('');
    try {
      const { error } = await supabase.from('site_settings').upsert({
        id: 1, hero_title: heroTitle, hero_subtitle: heroSubtitle,
        footer_about: footerAbout, contact_email: contactEmail,
        contact_phone: contactPhone, contact_address: contactAddress,
      });
      if (error) throw error;
      setSaveMessage('✅ Saved successfully!');
      fetchSiteSettings();
    } catch (error: any) {
      setSaveMessage('❌ Error: ' + error.message);
    } finally {
      setIsSavingSettings(false);
      setTimeout(() => setSaveMessage(''), 3000);
    }
  };

  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsAddingProduct(true);
    setProductMessage('');
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) throw new Error('Not authenticated');

      const price = parseFloat(newProduct.price);
      const mrp = parseFloat(newProduct.mrp);
      if (isNaN(price) || price <= 0) throw new Error('Enter a valid price');
      if (isNaN(mrp) || mrp < price) throw new Error('MRP must be greater than or equal to price');

      const { error } = await supabase.from('products').insert({
        name: newProduct.name.trim(),
        description: `Brand: ${newProduct.brand.trim()}`,
        category: newProduct.category,
        price, mrp,
        images: [newProduct.imageUrl || 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&q=80&w=1000'],
        seller_id: userData.user.id,
        is_active: true,
        specifications: { Brand: newProduct.brand.trim() },
      });
      if (error) throw error;
      setProductMessage('✅ Product added!');
      fetchProducts();
      setNewProduct({ name: '', brand: '', category: 'Fashion', price: '', mrp: '', imageUrl: '' });
    } catch (error: any) {
      setProductMessage('❌ ' + error.message);
    } finally {
      setIsAddingProduct(false);
    }
  };

  const getStatusColor = (status: string) => {
    if (['delivered', 'Delivered', 'Active', 'active'].includes(status)) return 'bg-[#E8F5E9] text-[#2E7D32]';
    if (['shipped', 'Shipped', 'paid'].includes(status)) return 'bg-[#E3F2FD] text-[#0D47A1]';
    if (['processing', 'Processing', 'pending', 'Pending'].includes(status)) return 'bg-[#FFF3E0] text-[#E65100]';
    if (['cancelled', 'Cancelled', 'failed'].includes(status)) return 'bg-[#FFEBEE] text-[#C62828]';
    return 'bg-gray-100 text-gray-800';
  };

  const navItems = [
    { id: 'overview', icon: BarChart2, label: 'Overview' },
    { id: 'site_content', icon: LayoutTemplate, label: 'Site Content' },
    { id: 'manage_products', icon: PlusCircle, label: 'Products' },
    { id: 'categories', icon: Tag, label: 'Categories' },
    { id: 'flash_sales', icon: Tag, label: 'Flash Sales' },
    { id: 'banners', icon: LayoutTemplate, label: 'Banners & Ads' },
    { id: 'campaign_approval', icon: Star, label: 'Campaigns' },
    { id: 'sellers', icon: ShoppingBag, label: 'Sellers' },
    { id: 'buyers', icon: Users, label: 'Buyers' },
    { id: 'orders', icon: Package, label: 'All Orders' },
    { id: 'creators', icon: Star, label: 'Creators' },
    { id: 'revenue', icon: DollarSign, label: 'Revenue' },
    { id: 'b2b', icon: Building2, label: 'B2B Leads' },
    { id: 'suspicious', icon: Settings, label: 'Security' },
    { id: 'settings', icon: Settings, label: 'Settings' },
  ];

  const renderContent = () => {
    switch (tab) {
      case 'overview':
        return (
          <>
            <div className="flex items-center justify-between mb-4">
              <div className="text-xl font-black text-[#0D47A1]">🔒 Platform Overview</div>
              <button onClick={fetchRealOrders} className="flex items-center gap-1.5 text-[12px] text-[#1565C0] font-semibold hover:underline">
                <RefreshCw size={13} /> Refresh
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 mb-5">
              {[
                { icon: '🏪', label: 'Total Sellers', value: '50,247', sub: '+342 this week' },
                { icon: '👤', label: 'Total Buyers', value: '5,12,890', sub: '+2,341 this week' },
                { icon: '📦', label: 'Real Orders', value: realOrders.length.toString(), sub: 'from database' },
                { icon: '💰', label: 'GMV (Monthly)', value: '₹48.2Cr', sub: '+22.4% MoM' },
              ].map((stat, i) => (
                <div key={i} className="bg-white rounded-[10px] p-4 shadow-sm flex items-center gap-3.5">
                  <div className="w-12 h-12 rounded-[10px] bg-[#E3F2FD] flex items-center justify-center text-[26px] shrink-0">{stat.icon}</div>
                  <div>
                    <div className="text-[20px] font-black">{stat.value}</div>
                    <div className="text-xs text-gray-500">{stat.label}</div>
                    <div className="text-[11px] text-[#388E3C] font-semibold">{stat.sub}</div>
                  </div>
                </div>
              ))}
            </div>

            <div className="bg-white rounded-[10px] shadow-sm overflow-hidden">
              <div className="flex items-center justify-between p-3.5 border-b border-gray-200">
                <span className="text-[15px] font-black">Recent Orders (Live from Database)</span>
                {isLoadingOrders && <div className="w-4 h-4 border-2 border-[#0D47A1] border-t-transparent rounded-full animate-spin" />}
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-[13px] text-left">
                  <thead className="bg-gray-50 text-[11px] font-bold text-gray-500 uppercase tracking-wide">
                    <tr>
                      <th className="p-3 border-b border-gray-200">Order ID</th>
                      <th className="p-3 border-b border-gray-200">Amount</th>
                      <th className="p-3 border-b border-gray-200">Date</th>
                      <th className="p-3 border-b border-gray-200">Status</th>
                      <th className="p-3 border-b border-gray-200">Payment</th>
                    </tr>
                  </thead>
                  <tbody>
                    {realOrders.length === 0 ? (
                      <tr><td colSpan={5} className="p-5 text-center text-gray-500">No orders yet in database</td></tr>
                    ) : (
                      realOrders.map(o => (
                        <tr key={o.id} className="hover:bg-blue-50/50">
                          <td className="p-3 border-b border-gray-200 font-bold text-[#1565C0]">#{o.id.slice(0, 8).toUpperCase()}</td>
                          <td className="p-3 border-b border-gray-200 font-bold">₹{o.total_amount.toLocaleString('en-IN')}</td>
                          <td className="p-3 border-b border-gray-200">{new Date(o.created_at).toLocaleDateString('en-IN')}</td>
                          <td className="p-3 border-b border-gray-200">
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full capitalize ${getStatusColor(o.status)}`}>{o.status}</span>
                          </td>
                          <td className="p-3 border-b border-gray-200">
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full capitalize ${getStatusColor(o.payment_status)}`}>{o.payment_status}</span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        );

      case 'site_content':
        return (
          <>
            <div className="flex items-center justify-between mb-4">
              <div className="text-xl font-black text-[#0D47A1]">📝 Site Content</div>
              <div className="flex items-center gap-3">
                {saveMessage && <span className="text-[12px] font-semibold">{saveMessage}</span>}
                <button
                  onClick={handleSaveSiteContent}
                  disabled={isSavingSettings}
                  className="bg-[#0D47A1] hover:bg-[#1565C0] text-white px-4 py-2 rounded-md text-sm font-bold flex items-center gap-2 transition-colors disabled:opacity-50"
                >
                  <Save size={16} /> {isSavingSettings ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white rounded-[10px] p-5 shadow-sm">
                <h3 className="text-[15px] font-bold mb-4 border-b border-gray-100 pb-2">Hero Section</h3>
                <div className="flex flex-col gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wide">Hero Title</label>
                    <input type="text" value={heroTitle} onChange={e => setHeroTitle(e.target.value)} className="w-full p-2.5 border border-gray-300 rounded-md text-[13px] outline-none focus:border-[#1565C0]" />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wide">Hero Subtitle</label>
                    <textarea value={heroSubtitle} onChange={e => setHeroSubtitle(e.target.value)} className="w-full p-2.5 border border-gray-300 rounded-md text-[13px] outline-none focus:border-[#1565C0] min-h-[80px]" />
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-[10px] p-5 shadow-sm">
                <h3 className="text-[15px] font-bold mb-4 border-b border-gray-100 pb-2">Footer & Contact</h3>
                <div className="flex flex-col gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wide">About Text</label>
                    <textarea value={footerAbout} onChange={e => setFooterAbout(e.target.value)} className="w-full p-2.5 border border-gray-300 rounded-md text-[13px] outline-none focus:border-[#1565C0] min-h-[60px]" />
                  </div>
                  {[
                    { label: 'Contact Email', val: contactEmail, set: setContactEmail, type: 'email' },
                    { label: 'Contact Phone', val: contactPhone, set: setContactPhone, type: 'text' },
                    { label: 'Contact Address', val: contactAddress, set: setContactAddress, type: 'text' },
                  ].map(f => (
                    <div key={f.label} className="flex flex-col gap-1.5">
                      <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wide">{f.label}</label>
                      <input type={f.type} value={f.val} onChange={e => f.set(e.target.value)} className="w-full p-2.5 border border-gray-300 rounded-md text-[13px] outline-none focus:border-[#1565C0]" />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </>
        );

      case 'manage_products':
        return <ProductManager />;

      case 'orders':
        return (
          <>
            <div className="flex items-center justify-between mb-4">
              <div className="text-xl font-black text-[#0D47A1]">📦 All Orders (Live)</div>
              <button onClick={fetchRealOrders} className="flex items-center gap-1.5 text-[12px] text-[#1565C0] font-semibold hover:underline">
                <RefreshCw size={13} /> Refresh
              </button>
            </div>
            <div className="bg-white rounded-[10px] shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-[13px] text-left">
                  <thead className="bg-gray-50 text-[11px] font-bold text-gray-500 uppercase tracking-wide">
                    <tr>
                      <th className="p-3 border-b border-gray-200">Order ID</th>
                      <th className="p-3 border-b border-gray-200">Amount</th>
                      <th className="p-3 border-b border-gray-200">Date</th>
                      <th className="p-3 border-b border-gray-200">Status</th>
                      <th className="p-3 border-b border-gray-200">Payment</th>
                      <th className="p-3 border-b border-gray-200">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {realOrders.length === 0 ? (
                      <tr><td colSpan={6} className="p-5 text-center text-gray-500">No orders yet</td></tr>
                    ) : (
                      realOrders.map(o => (
                        <tr key={o.id} className="hover:bg-blue-50/50">
                          <td className="p-3 border-b border-gray-200 font-bold text-[#1565C0]">#{o.id.slice(0, 8).toUpperCase()}</td>
                          <td className="p-3 border-b border-gray-200 font-bold">₹{o.total_amount.toLocaleString('en-IN')}</td>
                          <td className="p-3 border-b border-gray-200">{new Date(o.created_at).toLocaleDateString('en-IN')}</td>
                          <td className="p-3 border-b border-gray-200">
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full capitalize ${getStatusColor(o.status)}`}>{o.status}</span>
                          </td>
                          <td className="p-3 border-b border-gray-200">
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full capitalize ${getStatusColor(o.payment_status)}`}>{o.payment_status}</span>
                          </td>
                          <td className="p-3 border-b border-gray-200">
                            <button className="text-blue-600 hover:text-blue-800" title="View Order"><Edit size={14} /></button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        );

      case 'b2b':
        return (
          <>
            <div className="flex items-center justify-between mb-4">
              <div className="text-xl font-black text-[#0D47A1]">🏢 B2B Leads (Live)</div>
              <button onClick={fetchRealOrders} className="flex items-center gap-1.5 text-[12px] text-[#1565C0] font-semibold hover:underline">
                <RefreshCw size={13} /> Refresh
              </button>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
              {[
                { label: 'Total Leads', val: '—', sub: 'from b2b_leads table', icon: '📋' },
                { label: 'Open Leads', val: '—', sub: 'awaiting match', icon: '🔍' },
                { label: 'Matched', val: '—', sub: 'sent to suppliers', icon: '✅' },
                { label: 'Lead Revenue', val: '—', sub: 'pay-per-lead', icon: '💰' },
              ].map((s, i) => (
                <div key={i} className="bg-white rounded-[10px] p-4 shadow-sm flex items-center gap-3">
                  <div className="text-[22px]">{s.icon}</div>
                  <div><div className="text-[18px] font-black">{s.val}</div><div className="text-[10px] text-gray-500">{s.label}</div><div className="text-[9px] text-gray-400">{s.sub}</div></div>
                </div>
              ))}
            </div>
            <div className="bg-white rounded-[10px] p-5 shadow-sm">
              <div className="text-[14px] font-bold mb-3">B2B Subscription Plans Active</div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { name: 'Basic', price: '₹2,999/mo', leads: '20/mo' },
                  { name: 'Silver', price: '₹6,999/mo', leads: '60/mo' },
                  { name: 'Gold', price: '₹12,999/mo', leads: '150/mo' },
                  { name: 'Premium', price: '₹19,999/mo', leads: 'Unlimited' },
                ].map((p, i) => (
                  <div key={i} className="border border-gray-200 rounded-lg p-3 text-center">
                    <div className="font-black text-[14px]">{p.name}</div>
                    <div className="text-[12px] text-[#1B5E20] font-bold">{p.price}</div>
                    <div className="text-[11px] text-gray-500">{p.leads}</div>
                  </div>
                ))}
              </div>
            </div>
          </>
        );

      case 'revenue':
        return (
          <>
            <div className="text-xl font-black text-[#0D47A1] mb-4">💰 Platform Revenue</div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 mb-5">
              {[
                { icon: '🚚', label: 'Logistics Revenue', val: '₹8.4Cr', sub: '₹15/order margin' },
                { icon: '📣', label: 'Ads & Boost', val: '₹3.2Cr', sub: 'Seller boost packs' },
                { icon: '💳', label: 'Subscriptions', val: '₹1.8Cr', sub: 'Seller + Influencer + B2B' },
                { icon: '🔗', label: 'Affiliate Fees', val: '₹28L', sub: 'Platform share on affiliate sales' },
              ].map((s, i) => (
                <div key={i} className="bg-white rounded-[10px] p-4 shadow-sm flex items-center gap-3">
                  <div className="w-12 h-12 rounded-[10px] bg-[#E3F2FD] flex items-center justify-center text-[24px] shrink-0">{s.icon}</div>
                  <div><div className="text-[20px] font-black">{s.val}</div><div className="text-xs text-gray-500">{s.label}</div><div className="text-[10px] text-[#388E3C] font-semibold">{s.sub}</div></div>
                </div>
              ))}
            </div>
            <div className="bg-white rounded-[10px] p-5 shadow-sm">
              <div className="text-[14px] font-black mb-3">Revenue Breakdown (Per Order)</div>
              <div className="flex flex-col gap-2">
                {[
                  { label: 'Customer pays shipping', amount: '₹70', keep: 'Byndio keeps ₹15 (logistics margin)' },
                  { label: 'Platform handling fee', amount: '₹5–10', keep: 'Byndio keeps full amount' },
                  { label: 'COD processing fee', amount: '₹3', keep: 'Byndio keeps full amount' },
                  { label: 'Affiliate commission (platform share)', amount: '~10%', keep: 'Byndio keeps platform margin on top' },
                ].map((r, i) => (
                  <div key={i} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                    <div className="flex-1"><div className="text-[13px] font-semibold">{r.label}</div><div className="text-[11px] text-gray-500">{r.keep}</div></div>
                    <div className="font-black text-[14px] text-[#0D47A1]">{r.amount}</div>
                  </div>
                ))}
              </div>
            </div>
          </>
        );

      case 'flash_sales':
        return (
          <>
            <div className="text-xl font-black text-[#0D47A1] mb-4">⚡ Flash Sale Management</div>
            <div className="bg-white rounded-[10px] p-5 shadow-sm mb-4">
              <div className="text-[14px] font-black mb-4">Create New Flash Sale</div>
              <form onSubmit={async (e) => {
                e.preventDefault();
                const fd = new FormData(e.target as HTMLFormElement);
                try {
                  const { error } = await supabase.from('flash_sales').insert({
                    title: fd.get('title'),
                    product_id: fd.get('product_id'),
                    discount_pct: parseInt(fd.get('discount_pct') as string),
                    original_price: parseFloat(fd.get('original_price') as string),
                    sale_price: parseFloat(fd.get('sale_price') as string),
                    max_quantity: parseInt(fd.get('max_quantity') as string),
                    starts_at: fd.get('starts_at'),
                    ends_at: fd.get('ends_at'),
                    is_active: true,
                  });
                  if (error) throw error;
                  toastSuccess('Flash sale created successfully!');
                } catch(err: any) { toast('Error: ' + (err as any).message, 'error'); }
              }} className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {[
                  { name: 'title', label: 'Sale Title', type: 'text', placeholder: 'e.g. Holi Flash Sale' },
                  { name: 'product_id', label: 'Product ID (UUID)', type: 'text', placeholder: 'Product UUID from DB' },
                  { name: 'discount_pct', label: 'Discount %', type: 'number', placeholder: '40' },
                  { name: 'original_price', label: 'Original Price (₹)', type: 'number', placeholder: '999' },
                  { name: 'sale_price', label: 'Sale Price (₹)', type: 'number', placeholder: '599' },
                  { name: 'max_quantity', label: 'Max Qty', type: 'number', placeholder: '100' },
                  { name: 'starts_at', label: 'Starts At', type: 'datetime-local', placeholder: '' },
                  { name: 'ends_at', label: 'Ends At', type: 'datetime-local', placeholder: '' },
                ].map(f => (
                  <div key={f.name} className="flex flex-col gap-1">
                    <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wide">{f.label}</label>
                    <input name={f.name} type={f.type} required placeholder={f.placeholder} className="p-2.5 border border-gray-300 rounded-md text-[13px] outline-none focus:border-[#1565C0]" />
                  </div>
                ))}
                <div className="sm:col-span-2">
                  <button type="submit" className="bg-[#E65100] hover:bg-[#F57C00] text-white px-5 py-2.5 rounded-md text-sm font-bold transition-colors">
                    ⚡ Create Flash Sale
                  </button>
                </div>
              </form>
            </div>
          </>
        );

      case 'sellers':
        return <UserTable role="seller" title="🏪 All Sellers" />;

      case 'buyers':
        return <UserTable role="buyer" title="👤 All Buyers" />;

      case 'creators':
        return <UserTable role="influencer" title="⭐ All Creators" />;

      case 'settings':
        return (
          <>
            <div className="text-xl font-black text-[#0D47A1] mb-4">⚙️ Platform Settings</div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              <div className="bg-white rounded-[10px] p-5 shadow-sm">
                <h3 className="text-[15px] font-bold mb-4 border-b border-gray-100 pb-2">Commission Rates</h3>
                <div className="flex flex-col gap-3">
                  {[
                    { label: 'Seller Commission', value: '0%', note: 'Zero commission model' },
                    { label: 'Affiliate Commission', value: '8–10%', note: 'Paid to affiliates/creators' },
                    { label: 'Platform Margin', value: '2–3%', note: 'On affiliate sales' },
                    { label: 'COD Fee', value: '₹3/order', note: 'Cash on delivery handling' },
                    { label: 'Logistics Margin', value: '₹15/order', note: 'On ₹70 shipping charge' },
                  ].map((s, i) => (
                    <div key={i} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <div className="text-[13px] font-semibold">{s.label}</div>
                        <div className="text-[11px] text-gray-400">{s.note}</div>
                      </div>
                      <div className="text-[15px] font-black text-[#0D47A1]">{s.value}</div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="bg-white rounded-[10px] p-5 shadow-sm">
                <h3 className="text-[15px] font-bold mb-4 border-b border-gray-100 pb-2">Platform Info</h3>
                <div className="flex flex-col gap-3">
                  {[
                    { label: 'Platform Name', value: 'BYNDIO' },
                    { label: 'Support Email', value: 'team@byndio.in' },
                    { label: 'Admin Email', value: 'bussiness.rabinmahara@gmail.com' },
                    { label: 'Version', value: '1.0.0' },
                    { label: 'Hosted On', value: 'Netlify + Supabase' },
                  ].map((s, i) => (
                    <div key={i} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="text-[13px] font-semibold text-gray-600">{s.label}</div>
                      <div className="text-[13px] font-bold">{s.value}</div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="bg-white rounded-[10px] p-5 shadow-sm lg:col-span-2">
                <h3 className="text-[15px] font-bold mb-4 border-b border-gray-100 pb-2">Subscription Plan Pricing</h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {[
                    { name: 'Seller Basic', price: '₹999/mo', features: 'Up to 50 products' },
                    { name: 'Seller Pro', price: '₹2,499/mo', features: 'Unlimited products + analytics' },
                    { name: 'Influencer Starter', price: '₹499/mo', features: '10% commission rate' },
                    { name: 'Influencer Pro', price: '₹1,499/mo', features: '15% commission + priority' },
                  ].map((p, i) => (
                    <div key={i} className="border-2 border-gray-200 rounded-lg p-3 text-center">
                      <div className="font-black text-[13px]">{p.name}</div>
                      <div className="text-[15px] font-black text-[#0D47A1] my-1">{p.price}</div>
                      <div className="text-[11px] text-gray-500">{p.features}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </>
        );

      case 'categories':
        return (
          <>
            <div className="text-xl font-black text-[#0D47A1] mb-4">🏷️ Category Management</div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              <div className="bg-white rounded-[10px] p-5 shadow-sm">
                <div className="text-[14px] font-black mb-3">Add New Category</div>
                <div className="flex flex-col gap-3">
                  <div><label className="text-[11px] font-bold text-gray-500 uppercase tracking-wide block mb-1">Category Name *</label>
                    <input placeholder="e.g. Furniture" className="w-full p-2.5 border border-gray-300 rounded-md text-[13px] outline-none focus:border-[#1565C0]" /></div>
                  <div><label className="text-[11px] font-bold text-gray-500 uppercase tracking-wide block mb-1">Icon / Emoji</label>
                    <input placeholder="🪑" className="w-full p-2.5 border border-gray-300 rounded-md text-[13px] outline-none focus:border-[#1565C0]" /></div>
                  <div><label className="text-[11px] font-bold text-gray-500 uppercase tracking-wide block mb-1">Parent Category</label>
                    <select className="w-full p-2.5 border border-gray-300 rounded-md text-[13px] outline-none focus:border-[#1565C0] bg-white">
                      <option>None (Top Level)</option>
                      <option>Fashion</option><option>Electronics</option><option>Beauty</option><option>Home</option><option>Sports</option><option>Kids</option>
                    </select></div>
                  <div><label className="text-[11px] font-bold text-gray-500 uppercase tracking-wide block mb-1">Commission Rate (%)</label>
                    <input type="number" placeholder="0" defaultValue="0" className="w-full p-2.5 border border-gray-300 rounded-md text-[13px] outline-none focus:border-[#1565C0]" /></div>
                  <button className="bg-[#0D47A1] hover:bg-[#1565C0] text-white py-2.5 rounded-md text-[13px] font-bold transition-colors">+ Add Category</button>
                </div>
              </div>
              <div className="bg-white rounded-[10px] p-5 shadow-sm">
                <div className="text-[14px] font-black mb-3">Existing Categories</div>
                <div className="flex flex-col gap-2">
                  {[
                    { icon: '👗', name: 'Fashion', products: 2840, commission: '0%', active: true },
                    { icon: '📱', name: 'Electronics', products: 1520, commission: '0%', active: true },
                    { icon: '💄', name: 'Beauty', products: 980, commission: '0%', active: true },
                    { icon: '🏠', name: 'Home', products: 1340, commission: '0%', active: true },
                    { icon: '🏋️', name: 'Sports', products: 760, commission: '0%', active: true },
                    { icon: '🧸', name: 'Kids', products: 590, commission: '0%', active: true },
                  ].map((cat, i) => (
                    <div key={i} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                      <span className="text-xl shrink-0">{cat.icon}</span>
                      <div className="flex-1">
                        <div className="text-[13px] font-bold">{cat.name}</div>
                        <div className="text-[10px] text-gray-500">{cat.products.toLocaleString()} products • Commission: {cat.commission}</div>
                      </div>
                      <div className="flex gap-2">
                        <button className="p-1.5 text-blue-500 hover:bg-blue-50 rounded"><Edit size={13}/></button>
                        <button className="p-1.5 text-red-400 hover:bg-red-50 rounded"><Trash2 size={13}/></button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </>
        );

      case 'banners':
        return (
          <>
            <div className="text-xl font-black text-[#0D47A1] mb-4">🖼️ Banners & Ads Control</div>
            <div className="flex flex-col gap-5">
              <div className="bg-white rounded-[10px] p-5 shadow-sm">
                <div className="text-[14px] font-black mb-3">Create Banner / Ad</div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
                  <div><label className="text-[11px] font-bold text-gray-500 uppercase tracking-wide block mb-1">Title *</label>
                    <input placeholder="e.g. Summer Sale — 50% Off" className="w-full p-2.5 border border-gray-300 rounded-md text-[13px] outline-none focus:border-[#1565C0]" /></div>
                  <div><label className="text-[11px] font-bold text-gray-500 uppercase tracking-wide block mb-1">Type</label>
                    <select className="w-full p-2.5 border border-gray-300 rounded-md text-[13px] outline-none focus:border-[#1565C0] bg-white">
                      <option>Hero Banner</option><option>Promo Strip</option><option>Category Ad</option><option>Sponsored Listing</option><option>Pop-up</option>
                    </select></div>
                  <div><label className="text-[11px] font-bold text-gray-500 uppercase tracking-wide block mb-1">Image URL</label>
                    <input type="url" placeholder="https://..." className="w-full p-2.5 border border-gray-300 rounded-md text-[13px] outline-none focus:border-[#1565C0]" /></div>
                  <div><label className="text-[11px] font-bold text-gray-500 uppercase tracking-wide block mb-1">Link To (URL)</label>
                    <input placeholder="/products?cat=fashion" className="w-full p-2.5 border border-gray-300 rounded-md text-[13px] outline-none focus:border-[#1565C0]" /></div>
                  <div><label className="text-[11px] font-bold text-gray-500 uppercase tracking-wide block mb-1">Start Date</label>
                    <input type="datetime-local" className="w-full p-2.5 border border-gray-300 rounded-md text-[13px] outline-none focus:border-[#1565C0]" /></div>
                  <div><label className="text-[11px] font-bold text-gray-500 uppercase tracking-wide block mb-1">End Date</label>
                    <input type="datetime-local" className="w-full p-2.5 border border-gray-300 rounded-md text-[13px] outline-none focus:border-[#1565C0]" /></div>
                </div>
                <button className="bg-[#0D47A1] hover:bg-[#1565C0] text-white px-5 py-2.5 rounded-md text-[13px] font-bold transition-colors">🖼️ Create Banner</button>
              </div>
              <div className="bg-white rounded-[10px] p-5 shadow-sm">
                <div className="text-[14px] font-black mb-3">Active Banners & Ads</div>
                <div className="flex flex-col gap-3">
                  {[
                    { title: 'Holi Flash Sale', type: 'Hero Banner', status: 'active', clicks: 2340, impressions: 18200, starts: '2026-03-10', ends: '2026-03-20' },
                    { title: 'Electronics Week', type: 'Category Ad', status: 'active', clicks: 890, impressions: 7400, starts: '2026-03-12', ends: '2026-03-18' },
                    { title: 'Seller Spotlight', type: 'Promo Strip', status: 'scheduled', clicks: 0, impressions: 0, starts: '2026-03-20', ends: '2026-03-27' },
                  ].map((b, i) => (
                    <div key={i} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg flex-wrap">
                      <div className="w-10 h-10 bg-[#E3F2FD] rounded-lg flex items-center justify-center text-lg shrink-0">🖼️</div>
                      <div className="flex-1 min-w-0">
                        <div className="text-[13px] font-bold">{b.title}</div>
                        <div className="text-[10px] text-gray-500">{b.type} • {b.clicks} clicks • {b.impressions.toLocaleString()} impressions</div>
                        <div className="text-[10px] text-gray-400">{b.starts} → {b.ends}</div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${b.status === 'active' ? 'bg-[#E8F5E9] text-[#2E7D32]' : 'bg-[#FFF3E0] text-[#E65100]'}`}>{b.status}</span>
                        <button className="p-1.5 text-blue-500 hover:bg-blue-50 rounded"><Edit size={13}/></button>
                        <button className="p-1.5 text-red-400 hover:bg-red-50 rounded"><Trash2 size={13}/></button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </>
        );

      case 'campaign_approval':
        return (
          <>
            <div className="text-xl font-black text-[#0D47A1] mb-4">🎯 Campaign Approval</div>
            <div className="bg-white rounded-[10px] shadow-sm overflow-hidden">
              <div className="p-4 border-b border-gray-100 flex items-center justify-between">
                <div className="text-[14px] font-black">Pending Campaign Applications</div>
                <span className="bg-[#FFF3E0] text-[#E65100] text-[11px] font-bold px-2.5 py-1 rounded-full">3 pending</span>
              </div>
              <div className="divide-y divide-gray-100">
                {[
                  { id: 'CA001', creator: 'Priya Sharma', brand: 'GlowCare India', campaign: 'Summer Skincare', followers: '45K', platform: 'Instagram', msg: 'I create beauty content for 3+ years and my audience is 80% female aged 18-35.', status: 'pending' },
                  { id: 'CA002', creator: 'Rahul Verma', brand: 'TechWrist Co.', campaign: 'Smartwatch Launch', followers: '120K', platform: 'YouTube', msg: 'Tech reviewer with 120K subs. Specialise in gadget reviews with high CTR.', status: 'pending' },
                  { id: 'CA003', creator: 'Anjali Singh', brand: 'FitIndia', campaign: 'Protein Launch', followers: '28K', platform: 'Instagram', msg: 'Fitness creator, certified PT. My audience trusts my supplement recommendations.', status: 'pending' },
                ].map((app) => (
                  <div key={app.id} className="p-4">
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <div>
                        <div className="text-[13px] font-black">{app.creator}</div>
                        <div className="text-[11px] text-gray-500">{app.campaign} • {app.brand} • {app.followers} followers • {app.platform}</div>
                      </div>
                      <span className="text-[10px] font-bold px-2 py-0.5 bg-[#FFF3E0] text-[#E65100] rounded-full shrink-0">Pending</span>
                    </div>
                    <p className="text-[12px] text-gray-600 bg-gray-50 rounded-lg p-2.5 mb-3 italic">"{app.msg}"</p>
                    <div className="flex gap-2">
                      <button className="bg-[#2E7D32] hover:bg-[#388E3C] text-white px-4 py-1.5 rounded-md text-[12px] font-bold transition-colors">✅ Approve</button>
                      <button className="bg-[#C62828] hover:bg-[#D32F2F] text-white px-4 py-1.5 rounded-md text-[12px] font-bold transition-colors">❌ Reject</button>
                      <button className="border border-gray-300 text-gray-600 px-4 py-1.5 rounded-md text-[12px] font-bold hover:bg-gray-50 transition-colors">View Profile</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        );

      case 'suspicious':
        return (
          <>
            <div className="text-xl font-black text-[#0D47A1] mb-4">🔍 Suspicious Activity Monitor</div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-5">
              {[
                { icon: '⚠️', label: 'Flagged Accounts', value: '3', color: 'text-[#E65100]', bg: 'bg-[#FFF3E0]' },
                { icon: '🚫', label: 'Blocked This Week', value: '1', color: 'text-[#C62828]', bg: 'bg-[#FFEBEE]' },
                { icon: '🔎', label: 'Under Review', value: '7', color: 'text-[#F9A825]', bg: 'bg-[#FFFDE7]' },
              ].map((s, i) => (
                <div key={i} className={`${s.bg} rounded-[10px] p-4 flex items-center gap-3`}>
                  <div className="text-2xl">{s.icon}</div>
                  <div><div className={`text-[22px] font-black ${s.color}`}>{s.value}</div><div className="text-[11px] text-gray-600">{s.label}</div></div>
                </div>
              ))}
            </div>
            <div className="bg-white rounded-[10px] shadow-sm overflow-hidden mb-4">
              <div className="p-4 border-b border-gray-100 text-[14px] font-black">🚨 Recent Alerts</div>
              <div className="divide-y divide-gray-100">
                {[
                  { type: 'Fake Reviews', user: 'seller_abc@...',  severity: 'high', time: '2h ago', desc: '14 reviews posted from same IP within 1 hour' },
                  { type: 'Multiple Accounts', user: 'buyer_xyz@...', severity: 'medium', time: '5h ago', desc: 'Same device fingerprint detected across 3 accounts' },
                  { type: 'Affiliate Fraud', user: 'creator_123@...', severity: 'high', time: '1d ago', desc: 'Self-referral loop detected — affiliate clicking own links' },
                  { type: 'Payment Anomaly', user: 'seller_def@...', severity: 'low', time: '2d ago', desc: 'Unusual withdrawal pattern — 5 withdrawals in 24h' },
                  { type: 'Unusual Login', user: 'admin_test@...', severity: 'medium', time: '3d ago', desc: 'Login from new country: Nigeria (VPN suspected)' },
                ].map((alert, i) => (
                  <div key={i} className="p-4 flex items-start gap-3">
                    <div className={`w-2 h-2 rounded-full mt-2 shrink-0 ${alert.severity === 'high' ? 'bg-red-500' : alert.severity === 'medium' ? 'bg-yellow-400' : 'bg-blue-400'}`} />
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                        <span className="text-[13px] font-bold">{alert.type}</span>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${alert.severity === 'high' ? 'bg-red-100 text-red-700' : alert.severity === 'medium' ? 'bg-yellow-100 text-yellow-700' : 'bg-blue-100 text-blue-700'}`}>{alert.severity}</span>
                        <span className="text-[10px] text-gray-400 ml-auto">{alert.time}</span>
                      </div>
                      <div className="text-[11px] text-gray-500 mb-0.5">{alert.user}</div>
                      <div className="text-[12px] text-gray-600">{alert.desc}</div>
                    </div>
                    <div className="flex gap-1.5 shrink-0">
                      <button className="px-2.5 py-1 bg-red-50 text-red-600 rounded text-[11px] font-bold hover:bg-red-100 transition-colors">Block</button>
                      <button className="px-2.5 py-1 bg-gray-100 text-gray-600 rounded text-[11px] font-bold hover:bg-gray-200 transition-colors">Dismiss</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="bg-white rounded-[10px] p-5 shadow-sm">
              <div className="text-[14px] font-black mb-3">⚙️ Auto-Detection Rules</div>
              <div className="flex flex-col gap-2.5">
                {[
                  { rule: 'Flag accounts with 5+ reviews in 1 hour from same IP', enabled: true },
                  { rule: 'Block login if same device used by 3+ accounts', enabled: true },
                  { rule: 'Alert on affiliate self-referral loops', enabled: true },
                  { rule: 'Monitor withdrawals > ₹50,000 in 24 hours', enabled: false },
                  { rule: 'Flag logins from new countries/VPN', enabled: true },
                ].map((rule, i) => (
                  <div key={i} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg gap-3">
                    <span className="text-[12px] text-gray-700">{rule.rule}</span>
                    <div className={`w-10 h-5 rounded-full px-0.5 flex items-center transition-colors cursor-pointer shrink-0 ${rule.enabled ? 'bg-[#2E7D32]' : 'bg-gray-300'}`}>
                      <div className={`w-4 h-4 bg-white rounded-full shadow transition-transform ${rule.enabled ? 'translate-x-5' : ''}`} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        );

      default:
        return (
          <div className="bg-white rounded-[10px] p-6 shadow-sm">
            <div className="text-xl font-black text-[#0D47A1] mb-2">
              {navItems.find(n => n.id === tab)?.label || tab}
            </div>
            <p className="text-gray-500 text-[13px]">This section is coming soon.</p>
          </div>
        );
    }
  };

  return (
    <div className="flex flex-col md:flex-row min-h-[calc(100vh-115px)] bg-[#F5F5F5]">
      <div className="w-full md:w-[220px] bg-[#0D1117] text-white flex flex-col shrink-0">
        <div className="p-4 border-b border-white/10 flex items-center gap-2">
          <div className="bg-[#E53935] w-8 h-8 rounded-t-md rounded-b-xl flex items-center justify-center text-white shrink-0">
            <ShoppingBag size={18} />
          </div>
          <div>
            <div className="text-lg font-black leading-none">BYNDIO</div>
            <div className="text-[10px] opacity-50 uppercase tracking-widest mt-0.5">Admin Panel</div>
          </div>
        </div>
        <div className="py-2 flex-1 overflow-y-auto">
          {navItems.map(item => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => setTab(item.id)}
                className={`w-full flex items-center gap-2.5 px-4 py-2.5 text-[13px] transition-colors border-l-[3px] ${tab === item.id ? 'bg-white/10 text-white border-[#E53935]' : 'text-white/70 border-transparent hover:bg-white/5 hover:text-white'}`}
              >
                <Icon size={16} /> {item.label}
              </button>
            );
          })}
        </div>
      </div>
      <div className="flex-1 p-4 md:p-6 overflow-y-auto">{renderContent()}</div>
    </div>
  );
}
