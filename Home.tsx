import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAppStore } from '../store';
import { supabase } from '../lib/supabase';
import { validateAddress, sanitizeText } from '../lib/validators';
import { AlertCircle } from 'lucide-react';

// Razorpay types
declare global {
  interface Window {
    Razorpay: any;
  }
}

interface CheckoutProps {
  onOpenLogin?: () => void;
}

export default function Checkout({ onOpenLogin }: CheckoutProps) {
  const { cart, clearCart, user } = useAppStore();
  const navigate = useNavigate();
  const [payment, setPayment] = useState('upi');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [globalError, setGlobalError] = useState('');

  // Detect affiliate code from cart items or URL
  const affiliateCode = cart.find(i => i.affiliate_code)?.affiliate_code ||
    new URLSearchParams(window.location.search).get('ref') || null;

  const [address, setAddress] = useState({
    fullName: user?.name || '',
    mobile: '',
    line1: '',
    city: '',
    state: 'Maharashtra',
    pin: '',
  });

  const subtotal = cart.reduce((sum, item) => sum + item.price * item.qty, 0);
  const disc = Math.round(subtotal * 0.05);
  const platformFee = 10;
  const codFee = payment === 'cod' ? 3 : 0;
  const shippingFee = subtotal > 500 ? 0 : 70;
  const total = subtotal - disc + platformFee + codFee + shippingFee;

  const handleFieldChange = (field: string, value: string) => {
    setAddress(prev => ({ ...prev, [field]: value }));
    if (fieldErrors[field]) {
      setFieldErrors(prev => { const e = { ...prev }; delete e[field]; return e; });
    }
  };

  const createOrderInDB = async (paymentId: string, paymentStatus: 'paid' | 'pending') => {
    // Calculate affiliate commission if ref code present
    let affiliateCommission = 0;
    let affiliateLinkId: string | null = null;
    if (affiliateCode) {
      const { data: linkData } = await supabase
        .from('affiliate_links').select('id, user_id, commission_rate').eq('link_code', affiliateCode).single();
      if (linkData) {
        affiliateLinkId = linkData.id;
        affiliateCommission = Math.round(subtotal * (linkData.commission_rate / 100));
      }
    }

    // 1. Create the Order
    const { data: orderData, error: orderError } = await supabase
      .from('orders')
      .insert({
        buyer_id: user!.id,
        total_amount: total,
        status: 'pending',
        payment_status: paymentStatus,
        payment_id: paymentId,
        affiliate_code: affiliateCode,
        affiliate_commission: affiliateCommission,
        platform_fee: platformFee,
        shipping_fee: shippingFee,
        cod_fee: codFee,
        shipping_address: {
          fullName: sanitizeText(address.fullName),
          mobile: address.mobile,
          line1: sanitizeText(address.line1),
          city: sanitizeText(address.city),
          state: address.state,
          pin: address.pin,
        },
        payment_method: payment,
      })
      .select()
      .single();

    if (orderError) throw orderError;

    // 2. Fetch seller_ids for products
    const productIds = cart.map(item => item.id);
    const { data: productsData } = await supabase
      .from('products')
      .select('id, seller_id')
      .in('id', productIds);

    // 3. Create Order Items
    const itemsToInsert = cart.map(item => {
      const dbProduct = productsData?.find(p => p.id === item.id);
      return {
        order_id: orderData.id,
        product_id: item.id,
        seller_id: dbProduct?.seller_id || null,
        quantity: item.qty,
        price: item.price,
      };
    });

    const { error: itemsError } = await supabase
      .from('order_items')
      .insert(itemsToInsert);

    if (itemsError) throw itemsError;

    // 3. Credit affiliate commission + track conversion
    if (affiliateLinkId && affiliateCommission > 0) {
      const { data: link } = await supabase
        .from('affiliate_links').select('user_id, conversions, total_earnings').eq('id', affiliateLinkId).single();
      if (link) {
        // Update link stats
        await supabase.from('affiliate_links').update({
          conversions: link.conversions + 1,
          total_earnings: link.total_earnings + affiliateCommission,
        }).eq('id', affiliateLinkId);
        // Credit wallet
        const { data: wallet } = await supabase.from('wallets').select('balance, total_earned').eq('user_id', link.user_id).single();
        if (wallet) {
          await supabase.from('wallets').update({
            balance: wallet.balance + affiliateCommission,
            total_earned: wallet.total_earned + affiliateCommission,
          }).eq('user_id', link.user_id);
        }
        // Award reward points to buyer too (1 pt per ₹10)
        const buyerPoints = Math.floor(total / 10);
        if (buyerPoints > 0) {
          await supabase.from('reward_points').insert({ user_id: user!.id, points: buyerPoints, action: 'purchase', order_id: orderData.id });
          // INCREMENT not SET — use rpc to avoid race condition
          await supabase.rpc('increment_reward_points', { p_user_id: user!.id, p_points: buyerPoints });
        }
      }
    }

    return orderData;
  };

  const handleRazorpay = () => {
    const razorpayKeyId = import.meta.env.VITE_RAZORPAY_KEY_ID;

    if (!razorpayKeyId || !window.Razorpay) {
      // Razorpay not configured — fallback to demo mode
      return handleDemoOrder();
    }

    const options = {
      key: razorpayKeyId,
      amount: total * 100, // Razorpay expects paise
      currency: 'INR',
      name: 'BYNDIO',
      description: `Order of ${cart.length} item${cart.length > 1 ? 's' : ''}`,
      handler: async (response: { razorpay_payment_id: string }) => {
        setIsSubmitting(true);
        try {
          await createOrderInDB(response.razorpay_payment_id, 'paid');
          clearCart();
          navigate('/order-success');
        } catch (err: any) {
          setGlobalError(err.message || 'Failed to save order after payment.');
        } finally {
          setIsSubmitting(false);
        }
      },
      prefill: {
        name: address.fullName,
        contact: address.mobile,
        email: user?.email || '',
      },
      theme: { color: '#0D47A1' },
      modal: {
        ondismiss: () => setIsSubmitting(false),
      },
    };

    const rzp = new window.Razorpay(options);
    rzp.on('payment.failed', () => {
      setGlobalError('Payment failed. Please try again or use a different payment method.');
      setIsSubmitting(false);
    });
    rzp.open();
  };

  const handleDemoOrder = async () => {
    // Demo mode when Razorpay key is not configured
    setIsSubmitting(true);
    try {
      await createOrderInDB('DEMO-' + Date.now(), 'pending');
      clearCart();
      navigate('/order-success');
    } catch (err: any) {
      setGlobalError(err.message || 'Failed to place order. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePlaceOrder = async () => {
    if (cart.length === 0) return;
    setGlobalError('');

    const errors = validateAddress(address);
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    setIsSubmitting(true);
    handleRazorpay();
  };

  if (cart.length === 0) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center text-center p-6">
        <span className="text-6xl mb-4">🛒</span>
        <h2 className="text-xl font-bold mb-2">Your cart is empty</h2>
        <p className="text-gray-500 mb-6">Add some items to your cart to proceed to checkout.</p>
        <Link to="/products" className="bg-[#0D47A1] text-white px-6 py-2.5 rounded-md font-bold">
          Browse Products
        </Link>
      </div>
    );
  }

  const InputField = ({
    label, field, type = 'text', placeholder, maxW
  }: {
    label: string; field: keyof typeof address; type?: string; placeholder: string; maxW?: string
  }) => (
    <div className="flex flex-col gap-1" style={maxW ? { maxWidth: maxW } : {}}>
      <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wide">{label}</label>
      <input
        type={type}
        value={address[field]}
        onChange={e => handleFieldChange(field, e.target.value)}
        placeholder={placeholder}
        className={`p-2.5 border rounded-md text-[13px] outline-none transition-colors
          ${fieldErrors[field]
            ? 'border-red-400 bg-red-50 focus:border-red-500'
            : 'border-gray-300 focus:border-[#1565C0]'}`}
      />
      {fieldErrors[field] && (
        <span className="text-[11px] text-red-600 flex items-center gap-1">
          <AlertCircle size={11} /> {fieldErrors[field]}
        </span>
      )}
    </div>
  );

  return (
    <div className="bg-[#F5F5F5] min-h-screen">
      <div className="flex items-center gap-1.5 text-xs text-gray-500 px-4 py-2.5 bg-white border-b border-gray-200">
        <Link to="/" className="text-[#1565C0] hover:underline">Home</Link> ›
        <Link to="/products" className="text-[#1565C0] hover:underline">Products</Link> ›
        <span className="font-semibold text-gray-800">Checkout</span>
      </div>

      {globalError && (
        <div className="max-w-6xl mx-auto px-4 pt-3">
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-red-700 text-sm flex items-center gap-2">
            <AlertCircle size={16} /> {globalError}
          </div>
        </div>
      )}

      <div className="max-w-6xl mx-auto p-4 grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-4">
        <div>
          {/* Address */}
          <div className="bg-white rounded-xl p-5 shadow-sm mb-4">
            <div className="flex items-center gap-2.5 mb-4">
              <div className="w-6 h-6 bg-[#0D47A1] text-white rounded-full flex items-center justify-center text-[13px] font-bold">1</div>
              <div className="text-base font-black text-[#0D47A1]">Delivery Address</div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 mb-3.5">
              <InputField label="Full Name" field="fullName" placeholder="Your full name" />
              <InputField label="Mobile Number" field="mobile" type="tel" placeholder="+91 98765 43210" />
            </div>

            <div className="mb-3.5">
              <InputField label="Address Line 1" field="line1" placeholder="House/Flat No, Street, Area" />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 mb-3.5">
              <InputField label="City" field="city" placeholder="City" />
              <div className="flex flex-col gap-1">
                <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wide">State</label>
                <select
                  value={address.state}
                  onChange={e => handleFieldChange('state', e.target.value)}
                  className="p-2.5 border border-gray-300 rounded-md text-[13px] outline-none focus:border-[#1565C0] bg-white"
                >
                  {['Maharashtra','Delhi','Karnataka','Tamil Nadu','Uttar Pradesh','Gujarat','Rajasthan','West Bengal','Telangana','Kerala','Punjab','Haryana','Madhya Pradesh','Bihar','Odisha','Jharkhand','Assam','Himachal Pradesh','Uttarakhand','Goa'].map(s => (
                    <option key={s}>{s}</option>
                  ))}
                </select>
              </div>
            </div>

            <InputField label="PIN Code" field="pin" placeholder="400001" maxW="150px" />
          </div>

          {/* Payment */}
          <div className="bg-white rounded-xl p-5 shadow-sm">
            <div className="flex items-center gap-2.5 mb-4">
              <div className="w-6 h-6 bg-[#0D47A1] text-white rounded-full flex items-center justify-center text-[13px] font-bold">2</div>
              <div className="text-base font-black text-[#0D47A1]">Payment Method</div>
            </div>

            <div className="flex flex-col gap-2">
              {[
                { id: 'upi', icon: '📲', label: 'UPI / PhonePe / GPay', desc: 'Instant transfer' },
                { id: 'card', icon: '💳', label: 'Credit / Debit Card', desc: 'All major cards accepted' },
                { id: 'nb', icon: '🏦', label: 'Net Banking', desc: '50+ banks supported' },
                { id: 'wallet', icon: '👛', label: 'Paytm Wallet', desc: 'Quick checkout' },
                { id: 'cod', icon: '💵', label: 'Cash on Delivery (COD)', desc: '₹3 COD handling fee applies' },
              ].map(opt => (
                <label
                  key={opt.id}
                  className={`flex items-center gap-3 border rounded-lg p-3 cursor-pointer transition-colors ${
                    payment === opt.id ? 'border-[#1565C0] bg-[#E3F2FD]' : 'border-gray-300 hover:border-gray-400'
                  }`}
                >
                  <input type="radio" name="pay" checked={payment === opt.id} onChange={() => setPayment(opt.id)} className="accent-[#1565C0]" />
                  <span className="text-xl">{opt.icon}</span>
                  <div>
                    <div className="text-[13px] font-bold">{opt.label}</div>
                    <div className="text-[11px] text-gray-500">{opt.desc}</div>
                  </div>
                </label>
              ))}
            </div>

            <div className="mt-3 p-3 bg-[#E8F5E9] rounded-lg flex items-start gap-2">
              <span className="text-green-600 text-lg">🔒</span>
              <p className="text-[12px] text-green-800">
                Your payment is secured by <strong>Razorpay</strong> with 256-bit SSL encryption. BYNDIO never stores your payment details.
              </p>
            </div>
          </div>
        </div>

        {/* Summary */}
        <div>
          <div className="bg-white rounded-xl p-5 shadow-sm sticky top-[80px]">
            <div className="text-[15px] font-black mb-3.5">Order Summary</div>

            <div className="flex flex-col gap-2 mb-3 max-h-[240px] overflow-y-auto">
              {cart.map(item => (
                <div key={item.id} className="flex items-center gap-2.5 py-2 border-b border-gray-100 last:border-0">
                  <span className="text-2xl w-9 text-center">{item.icon}</span>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-bold truncate">{item.name}</div>
                    <div className="text-[11px] text-gray-500">Qty: {item.qty}</div>
                  </div>
                  <span className="text-[13px] font-bold whitespace-nowrap">₹{(item.price * item.qty).toLocaleString('en-IN')}</span>
                </div>
              ))}
            </div>

            <div className="flex flex-col gap-1.5 pt-3 border-t border-gray-200">
              <div className="flex justify-between text-[13px]">
                <span className="text-gray-500">Subtotal ({cart.reduce((s, i) => s + i.qty, 0)} items)</span>
                <span>₹{subtotal.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between text-[13px] text-[#388E3C] font-semibold">
                <span>Discount (5%)</span>
                <span>-₹{disc.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between text-[13px]">
                <span className="text-gray-500">Delivery</span>
                <span className={shippingFee === 0 ? 'text-[#388E3C] font-semibold' : ''}>{shippingFee === 0 ? 'FREE' : `₹${shippingFee}`}</span>
              </div>
              <div className="flex justify-between text-[13px]">
                <span className="text-gray-500">Platform Fee</span>
                <span>₹{platformFee}</span>
              </div>
              {codFee > 0 && (
                <div className="flex justify-between text-[13px]">
                  <span className="text-gray-500">COD Fee</span>
                  <span>₹{codFee}</span>
                </div>
              )}
              <div className="flex justify-between text-[17px] font-black pt-3 mt-1.5 border-t border-gray-200">
                <span>Total</span>
                <span>₹{total.toLocaleString('en-IN')}</span>
              </div>
            </div>

            <button
              disabled={isSubmitting}
              onClick={handlePlaceOrder}
              className="w-full bg-[#E65100] hover:bg-[#F57C00] disabled:bg-gray-400 disabled:cursor-not-allowed text-white border-none p-3 rounded-md text-[15px] font-extrabold mt-4 transition-colors flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Processing...
                </>
              ) : (
                '🎉 Place Order & Pay'
              )}
            </button>
            <p className="text-[11px] text-gray-500 text-center mt-2">
              By placing order you agree to our{' '}
              <button className="text-[#1565C0] hover:underline">Terms & Conditions</button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
