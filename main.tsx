// GST Invoice Generator — pure browser implementation (no external deps)
export interface InvoiceData {
  orderId: string;
  orderDate: string;
  buyerName: string;
  buyerAddress: string;
  sellerName: string;
  sellerGST: string;
  items: { name: string; qty: number; price: number; gstRate: number; hsn: string }[];
  shippingFee: number;
  platformFee: number;
  totalAmount: number;
}

export async function generateGSTInvoice(data: InvoiceData): Promise<void> {
  const subtotalExGST = data.items.reduce((s, i) => s + (i.price / (1 + i.gstRate / 100)) * i.qty, 0);
  const totalGST = data.items.reduce((s, i) => s + (i.price - i.price / (1 + i.gstRate / 100)) * i.qty, 0);
  const cgst = totalGST / 2;
  const sgst = totalGST / 2;
  const date = new Date(data.orderDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });
  const invoiceNo = `INV-${data.orderId.slice(0, 8).toUpperCase()}`;

  const itemRows = data.items.map(item => {
    const exGST = item.price / (1 + item.gstRate / 100);
    return `
      <tr>
        <td style="padding:8px;border:1px solid #ddd">${item.name}</td>
        <td style="padding:8px;border:1px solid #ddd;text-align:center">${item.hsn || '—'}</td>
        <td style="padding:8px;border:1px solid #ddd;text-align:center">${item.qty}</td>
        <td style="padding:8px;border:1px solid #ddd;text-align:right">₹${exGST.toFixed(2)}</td>
        <td style="padding:8px;border:1px solid #ddd;text-align:center">${item.gstRate}%</td>
        <td style="padding:8px;border:1px solid #ddd;text-align:right">₹${(item.price * item.qty).toFixed(2)}</td>
      </tr>`;
  }).join('');

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"/>
<title>GST Invoice - ${invoiceNo}</title>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: Arial, sans-serif; font-size: 13px; color: #222; padding: 20px; max-width: 800px; margin: auto; }
  .header { background: #0D47A1; color: white; padding: 20px; border-radius: 8px 8px 0 0; display: flex; justify-content: space-between; align-items: center; }
  .header h1 { font-size: 22px; }
  .header .inv-meta { text-align: right; font-size: 12px; opacity: .85; }
  .body { border: 1px solid #ddd; border-top: none; padding: 20px; }
  .parties { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 20px; }
  .party { background: #f9f9f9; padding: 12px; border-radius: 6px; border: 1px solid #eee; }
  .party h3 { color: #0D47A1; font-size: 11px; text-transform: uppercase; letter-spacing: .05em; margin-bottom: 6px; }
  table { width: 100%; border-collapse: collapse; margin: 16px 0; }
  th { background: #0D47A1; color: white; padding: 9px 8px; text-align: left; font-size: 11px; text-transform: uppercase; }
  th:not(:first-child) { text-align: center; }
  th:last-child { text-align: right; }
  tr:nth-child(even) td { background: #f5f9ff; }
  .totals { margin-left: auto; width: 300px; }
  .totals tr td { padding: 5px 8px; }
  .totals tr td:last-child { text-align: right; font-weight: bold; }
  .total-row td { background: #0D47A1 !important; color: white; font-size: 15px; padding: 10px 8px; }
  .footer { margin-top: 20px; padding-top: 14px; border-top: 1px solid #eee; font-size: 11px; color: #888; text-align: center; }
  @media print { body { padding: 0; } }
</style>
</head>
<body>
<div class="header">
  <div>
    <h1>BYNDIO</h1>
    <div style="font-size:12px;opacity:.8">BYNDIO Technologies Pvt Ltd</div>
    <div style="font-size:11px;opacity:.7;margin-top:4px">GSTIN: 27AABCB1234R1Z5 | support@byndio.in</div>
  </div>
  <div class="inv-meta">
    <div style="font-size:18px;font-weight:bold;color:#FFD600">TAX INVOICE</div>
    <div style="margin-top:6px"><b>Invoice No:</b> ${invoiceNo}</div>
    <div><b>Date:</b> ${date}</div>
  </div>
</div>
<div class="body">
  <div class="parties">
    <div class="party">
      <h3>Bill To (Buyer)</h3>
      <div style="font-weight:bold;font-size:14px">${data.buyerName}</div>
      <div style="color:#555;margin-top:4px;font-size:12px;line-height:1.5">${data.buyerAddress}</div>
    </div>
    <div class="party">
      <h3>Sold By (Seller)</h3>
      <div style="font-weight:bold;font-size:14px">${data.sellerName}</div>
      <div style="color:#555;margin-top:4px;font-size:12px">GSTIN: ${data.sellerGST || 'N/A'}</div>
    </div>
  </div>
  <table>
    <thead>
      <tr>
        <th style="width:35%">Description</th>
        <th>HSN</th>
        <th>Qty</th>
        <th>Rate (excl.)</th>
        <th>GST%</th>
        <th>Amount</th>
      </tr>
    </thead>
    <tbody>${itemRows}</tbody>
  </table>
  <table class="totals">
    <tbody>
      <tr><td>Sub-total (excl. GST)</td><td>₹${subtotalExGST.toFixed(2)}</td></tr>
      <tr><td>CGST (9%)</td><td>₹${cgst.toFixed(2)}</td></tr>
      <tr><td>SGST (9%)</td><td>₹${sgst.toFixed(2)}</td></tr>
      ${data.shippingFee > 0 ? `<tr><td>Shipping</td><td>₹${data.shippingFee.toFixed(2)}</td></tr>` : '<tr><td>Shipping</td><td style="color:green">FREE</td></tr>'}
      <tr><td>Platform Fee</td><td>₹${data.platformFee.toFixed(2)}</td></tr>
      <tr class="total-row"><td><b>TOTAL AMOUNT</b></td><td><b>₹${data.totalAmount.toFixed(2)}</b></td></tr>
    </tbody>
  </table>
  <div class="footer">
    This is a computer-generated invoice and does not require a physical signature.<br/>
    BYNDIO Technologies Pvt Ltd | Mumbai, Maharashtra, India | 1800-BYNDIO (Toll Free)
  </div>
</div>
<script>window.onload = function(){ window.print(); }</script>
</body>
</html>`;

  const blob = new Blob([html], { type: 'text/html' });
  const url = URL.createObjectURL(blob);
  const win = window.open(url, '_blank');
  if (win) {
    win.onafterprint = () => { URL.revokeObjectURL(url); };
  } else {
    // Fallback: trigger download if popup blocked
    const a = document.createElement('a');
    a.href = url;
    a.download = `BYNDIO-Invoice-${invoiceNo}.html`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 5000);
  }
}
