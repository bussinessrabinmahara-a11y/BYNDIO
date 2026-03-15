import { useState, useEffect } from 'react';
import { FileText, Download, Search, Filter } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAppStore } from '../store';

interface Invoice {
  id: string;
  order_id: string;
  amount: number;
  created_at: string;
  status: string;
  items?: number;
}

function generateInvoiceHTML(invoice: Invoice, user: any) {
  const date = new Date(invoice.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' });
  return `
<!DOCTYPE html><html><head><title>Invoice ${invoice.order_id}</title>
<style>
  body { font-family: Arial, sans-serif; margin: 0; padding: 24px; color: #212121; }
  .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 24px; border-bottom: 2px solid #0D47A1; padding-bottom: 16px; }
  .brand { font-size: 24px; font-weight: 900; color: #0D47A1; }
  .sub { font-size: 11px; color: #666; }
  .invoice-title { font-size: 18px; font-weight: 700; color: #0D47A1; text-align: right; }
  .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; margin-bottom: 24px; }
  .section-title { font-size: 11px; font-weight: 700; text-transform: uppercase; color: #666; margin-bottom: 8px; letter-spacing: 1px; }
  .info-row { font-size: 13px; margin-bottom: 4px; }
  table { width: 100%; border-collapse: collapse; margin-bottom: 16px; }
  th { background: #E3F2FD; padding: 10px; text-align: left; font-size: 11px; font-weight: 700; text-transform: uppercase; color: #1565C0; }
  td { padding: 10px; border-bottom: 1px solid #eee; font-size: 13px; }
  .total-row td { font-weight: 900; font-size: 15px; border-top: 2px solid #0D47A1; color: #0D47A1; }
  .footer { text-align: center; margin-top: 24px; padding-top: 16px; border-top: 1px solid #eee; font-size: 11px; color: #999; }
  .badge { display: inline-block; background: #E8F5E9; color: #2E7D32; padding: 3px 10px; border-radius: 20px; font-size: 11px; font-weight: 700; }
</style></head><body>
<div class="header">
  <div><div class="brand">BYNDIO</div><div class="sub">SHOP • SELL • EARN</div><div class="sub" style="margin-top:4px">byndio1.netlify.app</div></div>
  <div class="invoice-title">TAX INVOICE<br><span style="font-size:13px;color:#666">INV-${invoice.order_id.slice(0,8).toUpperCase()}</span><br><span class="badge">PAID</span></div>
</div>
<div class="grid">
  <div><div class="section-title">Billed To</div><div class="info-row"><strong>${user?.name || 'Customer'}</strong></div><div class="info-row">${user?.email || ''}</div></div>
  <div><div class="section-title">Invoice Details</div><div class="info-row"><strong>Date:</strong> ${date}</div><div class="info-row"><strong>Order ID:</strong> #${invoice.order_id.slice(0,8).toUpperCase()}</div><div class="info-row"><strong>Payment:</strong> Online</div></div>
</div>
<table>
  <thead><tr><th>#</th><th>Description</th><th>Qty</th><th>Unit Price</th><th>Total</th></tr></thead>
  <tbody>
    <tr><td>1</td><td>Order Items (${invoice.items || 1} product(s))</td><td>${invoice.items || 1}</td><td>₹${Math.round(invoice.amount / (invoice.items || 1)).toLocaleString('en-IN')}</td><td>₹${invoice.amount.toLocaleString('en-IN')}</td></tr>
    <tr><td colspan="4" style="text-align:right">Shipping</td><td>₹70</td></tr>
    <tr><td colspan="4" style="text-align:right">GST (18%)</td><td>₹${Math.round(invoice.amount * 0.18).toLocaleString('en-IN')}</td></tr>
  </tbody>
  <tfoot><tr class="total-row"><td colspan="4" style="text-align:right">TOTAL PAID</td><td>₹${(invoice.amount + 70 + Math.round(invoice.amount * 0.18)).toLocaleString('en-IN')}</td></tr></tfoot>
</table>
<div class="footer">Thank you for shopping on BYNDIO! For queries: team@byndio.in | This is a computer-generated invoice.</div>
</body></html>`;
}

export default function Invoices() {
  const { user, myOrders, fetchMyOrders, isLoadingOrders } = useAppStore();
  const [search, setSearch] = useState('');

  useEffect(() => { if (user) fetchMyOrders(); }, [user?.id]);

  const handleDownload = (order: any) => {
    const invoice: Invoice = {
      id: order.id,
      order_id: order.id,
      amount: order.total_amount,
      created_at: order.created_at,
      status: order.payment_status,
      items: order.order_items?.length || 1,
    };
    const html = generateInvoiceHTML(invoice, user);
    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Invoice-${invoice.order_id.slice(0, 8).toUpperCase()}.html`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const filtered = myOrders.filter(o =>
    o.id.toLowerCase().includes(search.toLowerCase()) ||
    o.status.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-[#F5F5F5] py-5 px-4">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 bg-[#E3F2FD] rounded-xl flex items-center justify-center">
            <FileText size={20} className="text-[#1565C0]" />
          </div>
          <div>
            <div className="text-[18px] font-black">My Invoices</div>
            <div className="text-[12px] text-gray-500">Download GST invoices for all your orders</div>
          </div>
        </div>

        <div className="relative mb-4">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by order ID or status..."
            className="w-full pl-9 pr-4 py-2.5 border border-gray-300 rounded-md text-[13px] outline-none focus:border-[#1565C0] bg-white" />
        </div>

        {isLoadingOrders ? (
          <div className="bg-white rounded-xl p-8 text-center"><div className="w-6 h-6 border-2 border-[#0D47A1] border-t-transparent rounded-full animate-spin mx-auto" /></div>
        ) : filtered.length === 0 ? (
          <div className="bg-white rounded-xl p-10 text-center shadow-sm">
            <FileText size={40} className="mx-auto text-gray-200 mb-3" />
            <div className="text-gray-400 text-[13px] font-semibold">No orders found</div>
            <div className="text-[11px] text-gray-400 mt-1">Your invoices will appear here after you place orders</div>
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <table className="w-full text-[13px]">
              <thead className="bg-gray-50 text-[11px] font-bold text-gray-500 uppercase tracking-wide">
                <tr>
                  <th className="p-3 text-left border-b border-gray-200">Invoice</th>
                  <th className="p-3 text-left border-b border-gray-200">Date</th>
                  <th className="p-3 text-left border-b border-gray-200">Amount</th>
                  <th className="p-3 text-left border-b border-gray-200">Status</th>
                  <th className="p-3 text-left border-b border-gray-200">Download</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(order => (
                  <tr key={order.id} className="hover:bg-blue-50/30">
                    <td className="p-3 border-b border-gray-100 font-bold text-[#1565C0]">
                      INV-{order.id.slice(0, 8).toUpperCase()}
                    </td>
                    <td className="p-3 border-b border-gray-100 text-gray-500">
                      {new Date(order.created_at).toLocaleDateString('en-IN')}
                    </td>
                    <td className="p-3 border-b border-gray-100 font-bold">
                      ₹{order.total_amount.toLocaleString('en-IN')}
                    </td>
                    <td className="p-3 border-b border-gray-100">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${order.payment_status === 'paid' ? 'bg-[#E8F5E9] text-[#2E7D32]' : 'bg-[#FFF3E0] text-[#E65100]'}`}>
                        {order.payment_status}
                      </span>
                    </td>
                    <td className="p-3 border-b border-gray-100">
                      <button onClick={() => handleDownload(order)}
                        className="flex items-center gap-1.5 bg-[#0D47A1] hover:bg-[#1565C0] text-white px-3 py-1.5 rounded-md text-[11px] font-bold transition-colors">
                        <Download size={12} /> Download
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="mt-4 bg-[#E3F2FD] rounded-xl p-3 text-[11px] text-[#1565C0]">
          <strong>📋 GST Note:</strong> Invoices are generated in HTML format. Open in browser and use Ctrl+P / Print to save as PDF. GST number on invoices requires seller GST registration.
        </div>
      </div>
    </div>
  );
}
