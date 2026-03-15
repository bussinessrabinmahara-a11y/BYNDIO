import { X, Trash2, ShoppingCart, LogIn } from 'lucide-react';
import { useAppStore } from '../store';
import { useNavigate } from 'react-router-dom';

export default function CartDrawer({ isOpen, onClose, onOpenLogin }: {
  isOpen: boolean;
  onClose: () => void;
  onOpenLogin?: () => void;
}) {
  const { cart, updateQty, removeFromCart, user } = useAppStore();
  const navigate = useNavigate();

  const total = cart.reduce((sum, item) => sum + item.price * item.qty, 0);
  const savings = cart.reduce((sum, item) => sum + (item.mrp - item.price) * item.qty, 0);

  const handleCheckout = () => {
    if (!user) {
      onClose();
      onOpenLogin?.();
      return;
    }
    onClose();
    navigate('/checkout');
  };

  return (
    <>
      <div 
        className={`fixed inset-0 bg-black/45 z-[2000] transition-opacity duration-300 ${isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
        onClick={onClose}
      />
      <div className={`fixed right-0 top-0 bottom-0 w-[380px] max-w-[95vw] bg-white z-[2001] flex flex-col shadow-[-4px_0_20px_rgba(0,0,0,0.2)] transition-transform duration-300 ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        <div className="p-4 border-b border-gray-200 flex items-center justify-between">
          <span className="text-[17px] font-black text-[#0D47A1] flex items-center gap-2">
            <ShoppingCart size={20} /> Your Cart
          </span>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-800 transition-colors">
            <X size={22} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-2.5">
          {cart.length === 0 ? (
            <div className="text-center py-16 px-5 text-gray-500">
              <span className="text-6xl block mb-4">🛒</span>
              <h3 className="text-lg font-bold text-gray-800">Cart is empty</h3>
              <p>Add products to get started</p>
            </div>
          ) : (
            cart.map(item => (
              <div key={item.id} className="flex gap-3 items-center p-3 border border-gray-200 rounded-lg bg-gray-50">
                <div className="text-[32px] w-[52px] h-[52px] bg-white rounded-md flex items-center justify-center shrink-0">
                  {item.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[13px] font-semibold mb-1 truncate">{item.name}</div>
                  <div className="text-[14px] font-black text-[#E65100]">₹{item.price.toLocaleString('en-IN')}</div>
                  <div className="flex items-center gap-2 mt-1.5">
                    <button onClick={() => updateQty(item.id, -1)} className="w-6 h-6 border border-gray-200 bg-white rounded flex items-center justify-center font-bold hover:bg-gray-100">−</button>
                    <span className="text-[14px] font-bold min-w-[20px] text-center">{item.qty}</span>
                    <button onClick={() => updateQty(item.id, 1)} className="w-6 h-6 border border-gray-200 bg-white rounded flex items-center justify-center font-bold hover:bg-gray-100">+</button>
                  </div>
                </div>
                <button onClick={() => removeFromCart(item.id)} className="text-gray-400 hover:text-red-500 ml-auto transition-colors">
                  <Trash2 size={18} />
                </button>
              </div>
            ))
          )}
        </div>

        {cart.length > 0 && (
          <div className="border-t border-gray-200 p-4 bg-white">
            {savings > 0 && (
              <div className="text-[11px] text-[#388E3C] font-bold mb-1.5 flex items-center gap-1">
                🎉 You're saving ₹{savings.toLocaleString('en-IN')} on this order!
              </div>
            )}
            <div className="flex justify-between items-center mb-3">
              <span className="text-[14px] text-gray-500">Subtotal</span>
              <span className="text-[18px] font-black">₹{total.toLocaleString('en-IN')}</span>
            </div>
            <div className="text-[12px] text-[#388E3C] font-semibold mb-3">✓ Free delivery on this order</div>
            <button onClick={handleCheckout} className="w-full bg-[#0D47A1] hover:bg-[#1565C0] text-white border-none p-3.5 rounded-md text-[15px] font-extrabold transition-colors flex items-center justify-center gap-2">
              {!user && <LogIn size={16} />}
              {user ? 'Proceed to Checkout' : 'Login to Checkout'}
            </button>
          </div>
        )}
      </div>
    </>
  );
}
