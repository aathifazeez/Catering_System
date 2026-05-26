/* ═══════════════════════════════════════════════════
   CaterPro — Admin CRM & Loyalty JavaScript Controller
   ═══════════════════════════════════════════════════ */

let allCustomers = [];

async function loadCustomers() {
  checkAuth('admin');

  try {
    allCustomers = await api('/customers');
    renderCustomers(allCustomers);
  } catch (e) {
    showToast('Failed to load customers: ' + e.message, 'error');
    $('customerBody').innerHTML = '<tr><td colspan="6" class="loading">Error loading data.</td></tr>';
  }
}

function renderCustomers(list) {
  const body = $('customerBody');
  if (!list.length) {
    body.innerHTML = '<tr><td colspan="6" class="loading">No customers found.</td></tr>';
    return;
  }

  body.innerHTML = list.map(c => `
    <tr>
      <td><strong>${esc(c.name)}</strong></td>
      <td>${esc(c.email)}</td>
      <td>${esc(c.phone)}</td>
      <td>${esc(c.address)}</td>
      <td>
        <span class="badge badge-paid" style="font-weight:600; color:var(--gold-light); background:var(--gold-dim); border:1px solid var(--border-gold);">
          ${c.loyaltyPoints || 0} pts
        </span>
      </td>
      <td>
        <button class="btn-icon" onclick="openCustomerModal(${c.customerId})" title="Edit">✏️</button>
        <button class="btn-icon btn-danger" onclick="deleteCustomer(${c.customerId})" title="Delete">🗑️</button>
      </td>
    </tr>
  `).join('');
}

function openCustomerModal(id = null) {
  const isEdit = id !== null;
  const customer = isEdit ? allCustomers.find(c => c.customerId === id) : { name:'', email:'', phone:'', address:'', loyaltyPoints:0 };

  openModal(isEdit ? 'Edit Customer' : 'Add Customer', `
    <div class="form-group" style="margin-bottom:12px;">
      <label>Full Name</label>
      <input type="text" class="form-control" id="cust-name" value="${esc(customer.name)}" required />
    </div>
    <div class="form-group" style="margin-bottom:12px;">
      <label>Email Address</label>
      <input type="email" class="form-control" id="cust-email" value="${esc(customer.email)}" required />
    </div>
    <div class="form-group" style="margin-bottom:12px;">
      <label>Phone Number</label>
      <input type="text" class="form-control" id="cust-phone" value="${esc(customer.phone)}" required />
    </div>
    <div class="form-group" style="margin-bottom:12px;">
      <label>Default Venue / Delivery Address</label>
      <input type="text" class="form-control" id="cust-address" value="${esc(customer.address)}" required />
    </div>
    <div class="form-group">
      <label>Loyalty Points Balance</label>
      <input type="number" class="form-control" id="cust-points" value="${customer.loyaltyPoints || 0}" min="0" required />
    </div>
  `, async () => {
    const payload = {
      customerId: id,
      name: $('cust-name').value,
      email: $('cust-email').value,
      phone: $('cust-phone').value,
      address: $('cust-address').value,
      loyaltyPoints: parseInt($('cust-points').value) || 0
    };

    if (isEdit) {
      await api('/customers', 'PUT', payload);
      showToast('Customer profile updated');
    } else {
      await api('/customers', 'POST', payload);
      showToast('Customer profile created');
    }
    loadCustomers();
  });
}

function deleteCustomer(id) {
  openConfirmModal(`Are you sure you want to delete customer profile #${id}? This will remove all their records!`, async () => {
    await api('/customers/' + id, 'DELETE');
    showToast('Customer profile deleted');
    loadCustomers();
  });
}

/* ── CRM System Dispatcher ── */
function dispatchCRMNotif() {
  const target = $('notif-target').value;
  const type = $('notif-type').value;
  const msg = $('notif-message').value.trim();

  if (!msg) {
    showToast('Please type announcement content to broadcast', 'error');
    return;
  }

  const logEntry = {
    target: target,
    type: type,
    body: msg,
    timestamp: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
  };

  // Save to persistent crm logs
  const logs = JSON.parse(localStorage.getItem('crm_logs') || '[]');
  logs.push(logEntry);
  localStorage.setItem('crm_logs', JSON.stringify(logs));

  showToast(`${type} broadcast announcement successfully dispatched to segment!`);
  $('notif-message').value = '';
  renderCrmLogs();
}

function renderCrmLogs() {
  const container = $('notif-logs');
  const logs = JSON.parse(localStorage.getItem('crm_logs') || '[]');

  if (!logs.length) {
    container.innerHTML = 'No announcements dispatched yet.';
    return;
  }

  container.innerHTML = logs.reverse().map(log => `
    <div class="log-item">
      <div style="display:flex; justify-content:space-between; margin-bottom:2px; font-weight:600; color:var(--gold-light);">
        <span>${esc(log.type)} [Target: ${esc(log.target)}]</span>
        <span style="font-size:9.5px; color:var(--text-muted);">${log.timestamp}</span>
      </div>
      <p style="color:var(--text-secondary); line-height:1.3;">${esc(log.body)}</p>
    </div>
  `).join('');
}

document.addEventListener('DOMContentLoaded', () => {
  loadCustomers();
  renderCrmLogs();

  $('addCustomerBtn').addEventListener('click', () => openCustomerModal());
  $('sendNotifBtn').addEventListener('click', dispatchCRMNotif);

  $('customerSearch').addEventListener('input', e => {
    const q = e.target.value.toLowerCase();
    const filtered = allCustomers.filter(c =>
      c.name.toLowerCase().includes(q) ||
      c.email.toLowerCase().includes(q) ||
      c.phone.includes(q)
    );
    renderCustomers(filtered);
  });
});
