/* ═══════════════════════════════════════════════════
   CaterPro — Customer Account JavaScript Controller
   ═══════════════════════════════════════════════════ */

let currentUser = null;
let profileData = null;
let customerOrders = [];
let customerBills = [];

async function initAccountPage() {
  currentUser = checkAuth('customer');
  if (!currentUser) return;

  await loadCustomerProfile();
  await loadCustomerOrders();
  await loadCustomerBills();
  renderNotifLogs();
}

async function loadCustomerProfile() {
  try {
    profileData = await api('/customers/' + currentUser.customerId);
    $('profile-name').textContent = esc(profileData.name);
    $('profile-details').innerHTML = `
      <strong>Email:</strong> ${esc(profileData.email)} &nbsp;|&nbsp; 
      <strong>Phone:</strong> ${esc(profileData.phone)} &nbsp;|&nbsp; 
      <strong>Delivery Address:</strong> ${esc(profileData.address)}
    `;
    const pts = profileData.loyaltyPoints || 0;
    $('profile-points').textContent = pts;
    $('profile-pts-value').textContent = (pts * 10).toLocaleString('en-LK');
  } catch (e) {
    showToast('Failed to load profile details: ' + e.message, 'error');
  }
}

async function loadCustomerOrders() {
  try {
    const allOrders = await api('/orders');
    // Filter orders client-side for this logged-in customer
    customerOrders = allOrders.filter(o => o.customerId === currentUser.customerId);
    
    const body = $('myOrdersBody');
    if (!customerOrders.length) {
      body.innerHTML = '<tr><td colspan="7" class="loading">You have no active catering bookings.</td></tr>';
      return;
    }
    
    body.innerHTML = customerOrders.map(o => `
      <tr>
        <td><strong>#${o.orderId}</strong></td>
        <td>${fmtDate(o.eventDate)}</td>
        <td>${esc(o.eventType)}</td>
        <td>${o.guestCount} guests</td>
        <td>${esc(o.venueAddress)}</td>
        <td>${statusBadge(o.status)}</td>
        <td>
          <button class="btn-primary" style="padding:4px 8px; font-size:11px;" onclick="viewOrderItems(${o.orderId})">View Items</button>
        </td>
      </tr>
    `).join('');
  } catch (e) {
    $('myOrdersBody').innerHTML = '<tr><td colspan="7" class="loading">Error loading bookings.</td></tr>';
  }
}

async function loadCustomerBills() {
  try {
    const allBills = await api('/bills');
    // Filter bills corresponding to this customer's orders
    const orderIds = customerOrders.map(o => o.orderId);
    customerBills = allBills.filter(b => orderIds.includes(b.orderId));

    const body = $('myBillsBody');
    if (!customerBills.length) {
      body.innerHTML = '<tr><td colspan="8" class="loading">No invoices generated yet.</td></tr>';
      return;
    }

    body.innerHTML = customerBills.map(b => `
      <tr>
        <td><strong>#${b.billId}</strong></td>
        <td>#${b.orderId}</td>
        <td>${fmtCurrency(b.subtotal)}</td>
        <td>${fmtCurrency(b.taxAmount)}</td>
        <td>${b.discount > 0 ? `<span style="color:var(--rose);">${fmtCurrency(b.discount)}</span>` : '—'}</td>
        <td><strong>${fmtCurrency(b.totalAmount)}</strong></td>
        <td><span class="badge ${b.paid ? 'badge-paid' : 'badge-unpaid'}">${b.paid ? 'Paid' : 'Unpaid'}</span></td>
        <td>
          <button class="btn-icon" onclick="viewOrderBill(${b.orderId})" title="View Invoice">🧾</button>
          ${!b.paid ? `<button class="btn-primary" style="padding:4px 8px; font-size:11px;" onclick="customerPayBill(${b.orderId})">Pay LKR ${b.totalAmount.toLocaleString('en-LK')}</button>` : ''}
        </td>
      </tr>
    `).join('');
  } catch (e) {
    $('myBillsBody').innerHTML = '<tr><td colspan="8" class="loading">Error loading invoices.</td></tr>';
  }
}

async function viewOrderItems(orderId) {
  try {
    const order = await api('/orders/' + orderId);
    const items = order.items || [];
    
    const rows = items.map(i => `
      <div style="display:flex; justify-content:space-between; padding:8px 0; border-bottom:1px solid var(--border); font-size:13px;">
        <span>${esc(i.itemName)} (x${i.quantity})</span>
        <span style="color:var(--gold-light); font-weight:600;">${fmtCurrency(i.quantity * i.unitPrice)}</span>
      </div>
    `).join('');

    openModal(`Order #${orderId} Items`, `
      <div style="padding: 10px 0;">
        ${rows || '<p style="color:var(--text-muted);">No items in this order.</p>'}
      </div>
    `, null);
    
    // Hide save button on confirm details modal
    $('modalSave').style.display = 'none';
  } catch (e) {
    showToast(e.message, 'error');
  }
}

async function viewOrderBill(orderId) {
  try {
    const bill = await api(`/bills/order/${orderId}`);
    await renderBillPreview(bill, orderId);
  } catch (e) {
    showToast('Failed to view invoice: ' + e.message, 'error');
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
        ${!bill.paid ? `<button class="btn-primary bill-pay-btn" onclick="customerPayBill(${orderId})">✓ Pay Invoice Now</button>` : ''}
      </div>
    </div>
  `);
}

async function customerPayBill(orderId) {
  try {
    await api(`/bills/${orderId}/pay`, 'PUT');
    showToast('Payment successful! Loyalty points awarded and ingredient quantities updated!');
    closeBillModal();
    
    // Refresh all tables and profile
    await initAccountPage();
  } catch (e) {
    showToast('Payment failed: ' + e.message, 'error');
  }
}

function renderNotifLogs() {
  const container = $('myNotifLogs');
  try {
    const logs = JSON.parse(localStorage.getItem('crm_logs') || '[]');
    // Filter notifications addressed to all or specifically containing this customer's details
    const filtered = logs.filter(log => {
      const targetMatches = log.target === 'all' || 
                            (log.target === 'loyalty' && (profileData.loyaltyPoints || 0) > 50) ||
                            (log.body || '').toLowerCase().includes(profileData.name.toLowerCase()) ||
                            (log.body || '').toLowerCase().includes(profileData.phone);
      return targetMatches;
    });

    if (!filtered.length) {
      container.innerHTML = '<div style="color:var(--text-muted); font-size:12px;">No notification activities recorded for your profile.</div>';
      return;
    }

    container.innerHTML = filtered.reverse().map(log => `
      <div class="log-item">
        <div style="display:flex; justify-content:space-between; margin-bottom:4px;">
          <strong style="color:var(--gold-light); font-size:12px;">${esc(log.type)} Broadcast</strong>
          <span style="font-size:10px; color:var(--text-muted);">${log.timestamp || 'Just Now'}</span>
        </div>
        <p style="font-size:12.5px; color:var(--text-secondary); line-height:1.4;">${esc(log.body)}</p>
      </div>
    `).join('');
  } catch {
    container.innerHTML = '<div style="color:var(--text-muted);">No notification logs found.</div>';
  }
}

// Tabs switching handler
document.addEventListener('DOMContentLoaded', () => {
  initAccountPage();

  const tabs = $('accountTabs');
  if (tabs) {
    tabs.addEventListener('click', e => {
      if (e.target.classList.contains('filter-tab')) {
        $$('#accountTabs .filter-tab').forEach(t => t.classList.remove('active'));
        e.target.classList.add('active');

        // Hide all contents
        $$('.account-tab-content').forEach(c => c.style.display = 'none');
        
        // Show correct content
        const tabId = 'tab-' + e.target.dataset.tab;
        $(tabId).style.display = 'block';
      }
    });
  }

  // Restore Modal Save button on close
  const mo = $('modalOverlay');
  if (mo) {
    mo.addEventListener('click', e => {
      if (e.target === mo || e.target.classList.contains('modal-close') || e.target.id === 'modalCancel') {
        $('modalSave').style.display = 'block';
      }
    });
  }
});
