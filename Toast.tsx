import { Link } from 'react-router-dom';
import { ShoppingBag } from 'lucide-react';
import { useAppStore } from '../store';

export default function Footer() {
  const siteSettings = useAppStore(s => s.siteSettings);
  const footerAbout = siteSettings?.footer_about || "India's 0% commission social commerce ecosystem. Revenue from logistics, ads & subscriptions — never from seller margins.";
  const contactEmail = siteSettings?.contact_email || "support@byndio.in";
  const contactPhone = siteSettings?.contact_phone || "1800-BYNDIO (toll free)";
  const contactAddress = siteSettings?.contact_address || "Mumbai, Maharashtra, India";

  return (
    <footer className="bg-[#0D47A1] text-white pt-10 pb-5 px-6 mt-auto">
      <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-5 gap-8 mb-8 max-w-6xl mx-auto">
        {/* Brand */}
        <div className="col-span-2 md:col-span-1">
          <div className="text-xl font-black flex items-center gap-2 mb-2.5">
            <span className="bg-[#F57C00] px-2 py-0.5 rounded text-sm"><ShoppingBag size={16} /></span> BYNDIO
          </div>
          <div className="text-xs opacity-75 leading-relaxed max-w-[240px] mb-3">{footerAbout}</div>
          <div className="flex gap-1.5 flex-wrap">
            {['0% Commission', 'Secure Payments', 'Fast Delivery', 'Easy Returns'].map(t => (
              <span key={t} className="bg-white/10 px-2.5 py-1 rounded-full text-[10px] font-semibold">{t}</span>
            ))}
          </div>
        </div>

        {/* For Sellers */}
        <div>
          <h4 className="text-[11px] font-black uppercase tracking-wider opacity-85 mb-3">For Sellers</h4>
          <Link to="/seller" className="block text-xs opacity-65 hover:opacity-100 mb-1.5 transition-opacity">Start Selling FREE</Link>
          <Link to="/seller-dashboard" className="block text-xs opacity-65 hover:opacity-100 mb-1.5 transition-opacity">Seller Dashboard</Link>
          <Link to="/affiliate" className="block text-xs opacity-65 hover:opacity-100 mb-1.5 transition-opacity">Affiliate Program</Link>
          <Link to="/b2b" className="block text-xs opacity-65 hover:opacity-100 mb-1.5 transition-opacity">B2B Supply</Link>
        </div>

        {/* For Buyers */}
        <div>
          <h4 className="text-[11px] font-black uppercase tracking-wider opacity-85 mb-3">For Buyers</h4>
          <Link to="/products" className="block text-xs opacity-65 hover:opacity-100 mb-1.5 transition-opacity">Browse Products</Link>
          <Link to="/my-orders" className="block text-xs opacity-65 hover:opacity-100 mb-1.5 transition-opacity">Track My Orders</Link>
          <Link to="/returns" className="block text-xs opacity-65 hover:opacity-100 mb-1.5 transition-opacity">Returns & Refunds</Link>
          <Link to="/rewards" className="block text-xs opacity-65 hover:opacity-100 mb-1.5 transition-opacity">Rewards & Wallet</Link>
          <Link to="/flash-sales" className="block text-xs opacity-65 hover:opacity-100 mb-1.5 transition-opacity">⚡ Flash Sales</Link>
        </div>

        {/* For Creators */}
        <div>
          <h4 className="text-[11px] font-black uppercase tracking-wider opacity-85 mb-3">Creators & Partners</h4>
          <Link to="/influencer" className="block text-xs opacity-65 hover:opacity-100 mb-1.5 transition-opacity">Join Creator Hub</Link>
          <Link to="/creator-dashboard" className="block text-xs opacity-65 hover:opacity-100 mb-1.5 transition-opacity">Creator Dashboard</Link>
          <Link to="/affiliate" className="block text-xs opacity-65 hover:opacity-100 mb-1.5 transition-opacity">Affiliate Engine</Link>
          <Link to="/leaderboard" className="block text-xs opacity-65 hover:opacity-100 mb-1.5 transition-opacity">🏆 Leaderboard</Link>
          <Link to="/compare" className="block text-xs opacity-65 hover:opacity-100 mb-1.5 transition-opacity">Compare Products</Link>
        </div>

        {/* Contact */}
        <div>
          <h4 className="text-[11px] font-black uppercase tracking-wider opacity-85 mb-3">Contact Us</h4>
          <div className="text-xs opacity-70 mb-1.5">📧 {contactEmail}</div>
          <div className="text-xs opacity-70 mb-1.5">📞 {contactPhone}</div>
          <div className="text-xs opacity-70 mb-4">📍 {contactAddress}</div>
          <h4 className="text-[11px] font-black uppercase tracking-wider opacity-85 mb-2">Revenue Model</h4>
          <div className="text-[10px] opacity-60 leading-relaxed">Logistics margin · Platform fees · Seller ads · Subscriptions · B2B leads · Affiliate commissions</div>
        </div>
      </div>

      <div className="border-t border-white/15 pt-4 flex flex-wrap justify-between gap-2.5 max-w-6xl mx-auto">
        <p className="text-[11px] opacity-55">© 2024 Byndio Technologies Pvt Ltd. All rights reserved.</p>
        <div className="flex gap-4">
          <button className="text-[11px] opacity-55 hover:opacity-90 transition-opacity">Privacy Policy</button>
          <button className="text-[11px] opacity-55 hover:opacity-90 transition-opacity">Terms of Use</button>
          <button className="text-[11px] opacity-55 hover:opacity-90 transition-opacity">Refund Policy</button>
          <button className="text-[11px] opacity-55 hover:opacity-90 transition-opacity">Sitemap</button>
        </div>
      </div>
    </footer>
  );
}
