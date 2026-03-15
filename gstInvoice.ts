import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import CartDrawer from './components/CartDrawer';
import LoginModal from './components/LoginModal';
import ProtectedRoute from './components/ProtectedRoute';
import ToastContainer from './components/Toast';
import { useAppStore } from './store';

import Home from './pages/Home';
import Products from './pages/Products';
import ProductDetail from './pages/ProductDetail';
import Checkout from './pages/Checkout';
import OrderSuccess from './pages/OrderSuccess';
import Wishlist from './pages/Wishlist';
import Seller from './pages/Seller';
import B2B from './pages/B2B';
import Influencer from './pages/Influencer';
import Dashboard from './pages/Dashboard';
import Admin from './pages/Admin';
import Messages from './pages/Messages';
import MyOrders from './pages/MyOrders';
import CreatorDashboard from './pages/CreatorDashboard';
import CreatorStorefront from './pages/CreatorStorefront';
import Affiliate from './pages/Affiliate';
import FlashSales from './pages/FlashSales';
import Returns from './pages/Returns';
import RewardsWallet from './pages/RewardsWallet';
import Compare from './pages/Compare';
import Leaderboard from './pages/Leaderboard';
import SupplierLeads from './pages/SupplierLeads';
import KYC from './pages/KYC';
import Notifications from './pages/Notifications';
import Dropshipping from './pages/Dropshipping';
import Campaigns from './pages/Campaigns';
import Gamification from './pages/Gamification';
import Invoices from './pages/Invoices';

export default function App() {
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const fetchProducts = useAppStore(s => s.fetchProducts);
  const fetchSiteSettings = useAppStore(s => s.fetchSiteSettings);
  const initAuth = useAppStore(s => s.initAuth);

  useEffect(() => {
    initAuth();
    fetchProducts();
    fetchSiteSettings();
  }, []);

  return (
    <Router>
      <div className="flex flex-col min-h-screen font-sans text-[#212121]">
        <Navbar onOpenCart={() => setIsCartOpen(true)} onOpenLogin={() => setIsLoginOpen(true)} />

        <main className="flex-1 flex flex-col">
          <Routes>
            {/* Public */}
            <Route path="/" element={<Home />} />
            <Route path="/products" element={<Products />} />
            <Route path="/product/:id" element={<ProductDetail />} />
            <Route path="/seller" element={<Seller />} />
            <Route path="/b2b" element={<B2B />} />
            <Route path="/influencer" element={<Influencer />} />
            <Route path="/affiliate" element={<Affiliate />} />
            <Route path="/flash-sales" element={<FlashSales />} />
            <Route path="/compare" element={<Compare />} />
            <Route path="/leaderboard" element={<Leaderboard />} />
            <Route path="/supplier-leads" element={<ProtectedRoute><SupplierLeads /></ProtectedRoute>} />
            <Route path="/kyc" element={<ProtectedRoute><KYC /></ProtectedRoute>} />
            <Route path="/notifications" element={<ProtectedRoute><Notifications /></ProtectedRoute>} />
            <Route path="/dropshipping" element={<Dropshipping />} />
            <Route path="/campaigns" element={<Campaigns />} />
            <Route path="/gamification" element={<ProtectedRoute><Gamification /></ProtectedRoute>} />
            <Route path="/invoices" element={<ProtectedRoute><Invoices /></ProtectedRoute>} />
            <Route path="/creator/:creatorId" element={<CreatorStorefront />} />

            {/* Auth required */}
            <Route path="/checkout" element={<ProtectedRoute><Checkout onOpenLogin={() => setIsLoginOpen(true)} /></ProtectedRoute>} />
            <Route path="/order-success" element={<ProtectedRoute><OrderSuccess /></ProtectedRoute>} />
            <Route path="/wishlist" element={<Wishlist onOpenLogin={() => setIsLoginOpen(true)} />} />
            <Route path="/my-orders" element={<ProtectedRoute><MyOrders /></ProtectedRoute>} />
            <Route path="/messages" element={<ProtectedRoute><Messages /></ProtectedRoute>} />
            <Route path="/returns" element={<ProtectedRoute><Returns /></ProtectedRoute>} />
            <Route path="/rewards" element={<ProtectedRoute><RewardsWallet /></ProtectedRoute>} />

            {/* Role-protected */}
            <Route path="/seller-dashboard" element={<ProtectedRoute requiredRole="seller"><Dashboard /></ProtectedRoute>} />
            <Route path="/creator-dashboard" element={<ProtectedRoute requiredRole="influencer"><CreatorDashboard /></ProtectedRoute>} />
            <Route path="/admin" element={<ProtectedRoute requiredRole="admin"><Admin /></ProtectedRoute>} />
          </Routes>
        </main>

        <Footer />
        <CartDrawer isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} onOpenLogin={() => setIsLoginOpen(true)} />
        <LoginModal isOpen={isLoginOpen} onClose={() => setIsLoginOpen(false)} />
        <ToastContainer />
      </div>
    </Router>
  );
}
