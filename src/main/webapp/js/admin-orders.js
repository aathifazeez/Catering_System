/* ═══════════════════════════════════════════════════
   CaterPro — Admin Orders JavaScript Controller
   ═══════════════════════════════════════════════════ */

let allOrders = [];
let dbCustomers = [];
let dbMenuItems = [];

async function loadOrders() {
  checkAuth('admin');

  try {
    allOrders = await api('/orders');
    dbCustomers = await api('/customers');
    dbMenuItems = await api('/menu');
    renderOrders(allOrders);
  } catch (e) {
    showToast('Failed to load orders data: ' + e.message, 'error');
    $('orderBody').innerHTML = '<tr><td colspan="7" class="loading">Error fetching records.</td></tr>';
  }
}

function renderOrders(list) {
  const body = $('orderBody');
  if (!list.length) {
    body.innerHTML = '<tr><td colspan="7" class="loading">No bookings found.</td></tr>';
    return;
  }

  body.innerHTML = list.map(o => `
    <tr>
      <td><strong>#${o.orderId}</strong></td>
      <td><strong>${esc(o.customerName || 'Customer')}</strong></td>
      <td>${esc(o.eventType)}</td>
      <td>${fmtDate(o.eventDate)}</td>
      <td>${o.guestCount} guests</td>
      <td>${statusBadge(o.status)}</td>
      <td>
        <button class="btn-icon" onclick="viewOrderItems(${o.orderId})" title="View Details">👁️</button>
        <button class="btn-icon" onclick="viewOrderBill(${o.orderId})" title="Invoice Info">🧾</button>
        <select class="form-control" style="width:120px; display:inline-block; padding:4px; font-size:11px; margin-left:6px;" onchange="changeOrderStatus(${o.orderId}, this.value)">
          <option value="Pending" ${o.status==='Pending'?'selected':''}>Pending</option>
          <option value="Confirmed" ${o.status==='Confirmed'?'selected':''}>Confirmed</option>
          <option value="In Progress" ${o.status==='In Progress'?'selected':''}>In Progress</option>
          <option value="Completed" ${o.status==='Completed'?'selected':''}>Completed</option>
          <option value="Cancelled" ${o.status==='Cancelled'?'selected':''}>Cancelled</option>
        </select>
        <button class="btn-icon btn-danger" onclick="deleteOrder(${o.orderId})" title="Delete">🗑️</button>
      </td>
    </tr>
  `).join('');
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

    openModal(`Order #${orderId} Summary`, `
      <div style="padding: 10px 0;">
        <p style="font-size:12.5px; color:var(--text-secondary); margin-bottom:14px; line-height:1.5;">
          <strong>Venue:</strong> ${esc(order.venue || '—')} <br/>
          <strong>Dietaries/Notes:</strong> ${esc(order.notes || 'None')}
        </p>
        <h4 style="font-family:var(--font-serif); color:var(--gold-light); border-bottom:1px solid var(--border); padding-bottom:6px; margin-bottom:10px;">Select portions list:</h4>
        ${rows || '<p style="color:var(--text-muted);">No items matched.</p>'}
      </div>
    `, null);
    
    $('modalSave').style.display = 'none';
  } catch (e) {
    showToast(e.message, 'error');
  }
}

async function changeOrderStatus(orderId, newStatus) {
  try {
    await api(`/orders/${orderId}`, 'PUT', { status: newStatus });
    showToast(`Order status updated to ${newStatus}`);
    
    // Confirmed triggers recipe-based ingredient reduction
    if (newStatus === 'Confirmed' || newStatus === 'In Progress') {
      showToast('Inventory quantities automatically checked and deducted!');
    }
    loadOrders();
  } catch (e) {
    showToast(e.message, 'error');
  }
}

async function deleteOrder(id) {
  openConfirmModal(`Are you sure you want to delete order #${id}? This will remove associated billing files!`, async () => {
    await api('/orders/' + id, 'DELETE');
    showToast('Order record deleted successfully');
    loadOrders();
  });
}

/* ── Invoice Operations ── */
async function viewOrderBill(orderId) {
  try {
    let bill;
    try {
      bill = await api(`/bills/order/${orderId}`);
      renderBillPreview(bill, orderId);
    } catch {
      // Prompt point redemption during manual invoice creation
      const order = await api(`/orders/${orderId}`);
      const customer = dbCustomers.find(c => c.customerId === order.customerId);
      const points = customer ? customer.loyaltyPoints || 0 : 0;

      if (points > 0) {
        openModal('Generate Invoice & Redeem Points', `
          <div style="padding: 4px 0;">
            <p style="margin-bottom: 12px; font-size:13.5px; color:var(--text-secondary);">
              Customer <strong>${esc(customer.name)}</strong> is a loyalty member with <strong>${points}</strong> points.
            </p>
            <p style="margin-bottom: 16px; font-size:13.5px; color:var(--text-secondary);">
              1 loyalty point = 10 LKR discount. Max discount available: <strong>LKR ${(points * 10).toLocaleString('en-LK')}</strong>.
            </p>
            <div class="form-group">
              <label>Redeem Points (Max ${points})</label>
              <input type="number" class="form-control" id="redeem-pts-input" min="0" max="${points}" value="0" style="background:var(--bg-elevated); border:1px solid var(--border); color:var(--text-primary); font-family:var(--font-sans); padding:8px;" />
            </div>
          </div>
        `, async () => {
          const ptsToUse = parseInt($('redeem-pts-input').value) || 0;
          if (ptsToUse < 0 || ptsToUse > points) throw new Error('Invalid points value entered');
          const discount = ptsToUse * 10;
          await api('/bills', 'POST', { orderId, discount });
          const newBill = await api(`/bills/order/${orderId}`);
          renderBillPreview(newBill, orderId);
        });
      } else {
        await api('/bills', 'POST', { orderId, discount: 0 });
        const newBill = await api(`/bills/order/${orderId}`);
        renderBillPreview(newBill, orderId);
      }
    }
  } catch (e) {
    showToast(e.message, 'error');
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
    showToast('Invoice paid successfully! Loyalty points balanced and recipe-ingredients deducted.');
    closeBillModal();
    loadOrders();
  } catch (e) {
    showToast(e.message, 'error');
  }
}

/* ── Manual Manual Creator ── */
let manualSelections = [];

function openManualOrderModal() {
  manualSelections = [];
  openModal('Manual Catering Order Creation', `
    <div class="form-group" style="margin-bottom:12px;">
      <label>Customer profile</label>
      <select class="form-control" id="m-cust">
        ${dbCustomers.map(c => `<option value="${c.customerId}">${esc(c.name)} (${esc(c.email)})</option>`).join('')}
      </select>
    </div>
    <div style="display:grid; grid-template-columns:1fr 1fr; gap:12px; margin-bottom:12px;">
      <div class="form-group">
        <label>Event Date</label>
        <input type="date" class="form-control" id="m-date" required />
      </div>
      <div class="form-group">
        <label>Event Type</label>
        <select class="form-control" id="m-type">
          <option value="Corporate Event">Corporate Event</option>
          <option value="Wedding">Wedding</option>
          <option value="Social Gathering">Social Gathering</option>
          <option value="Birthday Party">Birthday Party</option>
        </select>
      </div>
    </div>
    <div style="display:grid; grid-template-columns:1fr 1fr; gap:12px; margin-bottom:12px;">
      <div class="form-group">
        <label>Guest Count</label>
        <input type="number" class="form-control" id="m-guests" min="1" value="20" required />
      </div>
      <div class="form-group">
        <label>Venue Address</label>
        <input type="text" class="form-control" id="m-venue" required />
      </div>
    </div>
    <div class="form-group" style="margin-bottom:12px;">
      <label>Special Instructions</label>
      <input type="text" class="form-control" id="m-notes" placeholder="dietaries etc..." />
    </div>
    <h4 style="font-family:var(--font-serif); color:var(--gold-light); margin-bottom:8px; border-top:1px solid var(--border); padding-top:12px;">Portions selections:</h4>
    <div style="max-height:160px; overflow-y:auto; border:1px solid var(--border); padding:10px; border-radius:6px;" id="m-items-deck">
      ${dbMenuItems.filter(m=>m.available).map(m => `
        <div style="display:flex; justify-content:space-between; align-items:center; padding:6px 0; border-bottom:1px solid var(--border);">
          <span style="font-size:12.5px;">${esc(m.name)} (${fmtCurrency(m.price)})</span>
          <input type="number" class="form-control" style="width:70px; padding:4px;" id="m-qty-${m.itemId}" min="0" value="0" />
        </div>
      `).join('')}
    </div>
  `, async () => {
    // Compile items
    const items = [];
    dbMenuItems.filter(m=>m.available).forEach(m => {
      const q = parseInt($('m-qty-' + m.itemId).value) || 0;
      if (q > 0) items.push({ itemId: m.itemId, quantity: q, unitPrice: m.price });
    });

    if (!items.length) throw new Error('Please select at least one menu item.');

    const payload = {
      customerId: parseInt($('m-cust').value),
      eventDate: $('m-date').value,
      eventType: $('m-type').value,
      guestCount: parseInt($('m-guests').value) || 20,
      venue: $('m-venue').value,
      notes: $('m-notes').value || '',
      status: 'Pending',
      items: items
    };

    await api('/orders', 'POST', payload);
    showToast('Manual reservation registered successfully!');
    loadOrders();
  });
}

document.addEventListener('DOMContentLoaded', () => {
  loadOrders();

  $('addOrderBtn').addEventListener('click', openManualOrderModal);

  // Restore Modal Save button on close
  const mo = $('modalOverlay');
  if (mo) {
    mo.addEventListener('click', e => {
      if (e.target === mo || e.target.classList.contains('modal-close') || e.target.id === 'modalCancel') {
        $('modalSave').style.display = 'block';
      }
    });
  }

  $('orderSearch').addEventListener('input', e => {
    const q = e.target.value.toLowerCase();
    const filtered = allOrders.filter(o =>
      (o.customerName || '').toLowerCase().includes(q) ||
      o.eventType.toLowerCase().includes(q) ||
      String(o.orderId).includes(q)
    );
    renderOrders(filtered);
  });
});
