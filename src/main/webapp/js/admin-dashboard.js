/* ═══════════════════════════════════════════════════
   CaterPro — Admin Dashboard JavaScript Controller
   ═══════════════════════════════════════════════════ */

async function initAdminDashboard() {
  checkAuth('admin'); // Security guard

  try {
    const orders = await api('/orders');
    const customers = await api('/customers');
    const bills = await api('/bills');

    // 1. Calculations
    const totalOrders = orders.length;
    const totalCustomers = customers.length;
    const pendingOrders = orders.filter(o => o.status === 'Pending').length;
    
    const paidRevenue = bills
      .filter(b => b.paid === true)
      .reduce((sum, b) => sum + (b.totalAmount || 0), 0);

    // 2. Bind numbers to UI
    $('stat-orders').textContent = totalOrders;
    $('stat-customers').textContent = totalCustomers;
    $('stat-revenue').textContent = paidRevenue.toLocaleString('en-LK');
    $('stat-pending').textContent = pendingOrders;

    // 3. Render 5 most recent orders
    renderRecentOrders(orders);

  } catch (e) {
    showToast('Failed to load dashboard statistics: ' + e.message, 'error');
  }
}

function renderRecentOrders(orders) {
  const container = $('recentOrdersList');
  if (!orders.length) {
    container.innerHTML = '<div style="padding: 20px; text-align:center; color:var(--text-muted);">No orders found in database.</div>';
    return;
  }

  // Sort orders descending by ID to show latest
  const sorted = [...orders].sort((a, b) => b.orderId - a.orderId).slice(0, 5);

  container.innerHTML = sorted.map(o => `
    <div class="recent-order-item">
      <div class="roi-left">
        <div class="roi-name">Order #${o.orderId} &mdash; ${esc(o.customerName || 'Customer')}</div>
        <div class="roi-event">${esc(o.eventType)} | ${o.guestCount} guests</div>
      </div>
      <div>
        ${statusBadge(o.status)}
      </div>
    </div>
  `).join('');
}

document.addEventListener('DOMContentLoaded', () => {
  initAdminDashboard();
});
