/* ═══════════════════════════════════════════════════
   CaterPro — Admin Billing JavaScript Controller
   ═══════════════════════════════════════════════════ */

let allBills = [];

async function loadBilling() {
  checkAuth('admin');

  try {
    allBills = await api('/bills');
    renderBills(allBills);
  } catch (e) {
    showToast('Failed to load bills data: ' + e.message, 'error');
    $('billBody').innerHTML = '<tr><td colspan="8" class="loading">Error loading data.</td></tr>';
  }
}

function renderBills(list) {
  const body = $('billBody');
  if (!list.length) {
    body.innerHTML = '<tr><td colspan="8" class="loading">No invoices found. Generate one from Orders.</td></tr>';
    return;
  }

  body.innerHTML = list.map(b => `
    <tr>
      <td><strong>#${b.billId}</strong></td>
      <td><strong>${esc(b.customerName)}</strong></td>
      <td>${esc(b.eventType || '—')}</td>
      <td>${fmtCurrency(b.subtotal)}</td>
      <td>${fmtCurrency(b.taxAmount)}</td>
      <td><strong>${fmtCurrency(b.totalAmount)}</strong></td>
      <td><span class="badge ${b.paid ? 'badge-paid' : 'badge-unpaid'}">${b.paid ? 'Paid' : 'Unpaid'}</span></td>
      <td>
        <button class="btn-icon" onclick="viewOrderBill(${b.orderId})" title="View Invoice">🧾</button>
        ${!b.paid ? `<button class="btn-icon" onclick="markPaid(${b.orderId})" title="Mark Paid">✅</button>` : ''}
      </td>
    </tr>
  `).join('');
}

async function viewOrderBill(orderId) {
  try {
    const bill = await api(`/bills/order/${orderId}`);
    renderBillPreview(bill, orderId);
  } catch (e) {
    showToast('Failed to retrieve invoice: ' + e.message, 'error');
  }
}

async function renderBillPreview(bill, orderId) {
  const order = await api(`/orders/${orderId}`);
  const items = order.items || [];

  const itemRows = items.map(i => `
    <tr>
      <td>${esc(i.itemName)}</td>
      <td>${i.quantity}</td>
      <td>${Number(i.unitPrice).toLocaleString('en-LK',{minimumFractionDigits:2})}</td>
      <td>${Number(i.quantity * i.unitPrice).toLocaleString('en-LK',{minimumFractionDigits:2})}</td>
    </tr>
  `).join('');

  openBillModal(`
    <div class="bill-preview">
      <div class="bill-logo">
        <div class="bill-logo-name">CaterPro</div>
        <div class="bill-logo-sub">Tax Invoice</div>
      </div>
      <div class="bill-header-info">
        <p><strong>Bill #:</strong> ${bill.billId}</p>
        <p><strong>Order #:</strong> ${orderId}</p>
        <p><strong>Customer:</strong> ${esc(bill.customerName)}</p>
        <p><strong>Event:</strong> ${esc(bill.eventType || '—')}</p>
        <p><strong>Event Date:</strong> ${bill.eventDate || '—'}</p>
        <p><strong>Invoice Date:</strong> ${bill.createdAt ? new Date(bill.createdAt).toLocaleDateString('en-LK') : '—'}</p>
      </div>
      <table class="bill-items-table">
        <thead>
          <tr><th>Item</th><th>Qty</th><th>Unit Price</th><th>Subtotal</th></tr>
        </thead>
        <tbody>${itemRows || '<tr><td colspan="4" class="loading">No items</td></tr>'}</tbody>
      </table>
      <div class="bill-totals">
        <p>Subtotal: <span>${fmtCurrency(bill.subtotal)}</span></p>
        <p>Tax (${bill.taxRate}%): <span>${fmtCurrency(bill.taxAmount)}</span></p>
        ${bill.discount > 0 ? `<p>Discount (loyalty): <span>- ${fmtCurrency(bill.discount)}</span></p>` : ''}
        <p class="bill-grand-total">Total: <span>${fmtCurrency(bill.totalAmount)}</span></p>
        <p class="bill-status-row">
          Status: <span class="badge ${bill.paid ? 'badge-paid' : 'badge-unpaid'}">${bill.paid ? 'PAID' : 'UNPAID'}</span>
        </p>
        ${!bill.paid ? `<button class="btn-primary bill-pay-btn" onclick="markPaid(${orderId})">✓ Mark as Paid</button>` : ''}
      </div>
    </div>
  `);
}

async function markPaid(orderId) {
  try {
    await api(`/bills/${orderId}/pay`, 'PUT');
    showToast('Payment recorded successfully! Loyalty points awarded and ingredient quantities updated!');
    closeBillModal();
    loadBilling();
  } catch (e) {
    showToast(e.message, 'error');
  }
}

document.addEventListener('DOMContentLoaded', () => {
  loadBilling();

  $('billSearch').addEventListener('input', e => {
    const q = e.target.value.toLowerCase();
    const filtered = allBills.filter(b =>
      b.customerName.toLowerCase().includes(q) ||
      (b.eventType || '').toLowerCase().includes(q) ||
      String(b.billId).includes(q)
    );
    renderBills(filtered);
  });
});
