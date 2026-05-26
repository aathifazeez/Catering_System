/* ═══════════════════════════════════════════════════
   CaterPro — Login Page JavaScript Controller
   ═══════════════════════════════════════════════════ */

let dbCustomers = [];

async function initLoginPage() {
  // Fetch real database customer profiles to allow seamless customer role switching
  try {
    dbCustomers = await api('/customers');
    const select = $('customer-select');
    if (!dbCustomers.length) {
      select.innerHTML = '<option value="">No customers found. Sign up!</option>';
      return;
    }
    
    select.innerHTML = dbCustomers.map(c => `
      <option value="${c.customerId}">${esc(c.name)} (${c.loyaltyPoints || 0} points — ${esc(c.email)})</option>
    `).join('');
  } catch (e) {
    $('customer-select').innerHTML = '<option value="">Error loading profiles dropdown</option>';
    showToast('Failed to retrieve customer profiles: ' + e.message, 'error');
  }
}

function submitCustomerLogin() {
  const selectVal = $('customer-select').value;
  if (!selectVal) {
    showToast('Please select a customer profile to access', 'error');
    return;
  }

  const customerId = parseInt(selectVal);
  const matched = dbCustomers.find(c => c.customerId === customerId);
  if (!matched) return;

  // Save Customer user session state
  const sessionUser = {
    role: 'customer',
    customerId: matched.customerId,
    name: matched.name,
    email: matched.email
  };
  setCurrentUser(sessionUser);

  showToast(`Welcome back, ${matched.name}!`);

  // Redirect to original page or home
  setTimeout(() => {
    handleLoginRedirect();
  }, 1000);
}

async function submitCustomerSignup() {
  const name = $('signup-name').value;
  const email = $('signup-email').value;
  const phone = $('signup-phone').value;
  const address = $('signup-address').value;

  const newCust = {
    name: name,
    email: email,
    phone: phone,
    address: address,
    loyaltyPoints: 10 // Welcome Promo Gift points!
  };

  try {
    const res = await api('/customers', 'POST', newCust);
    const customerId = res.id;

    // Save newly registered Customer session
    const sessionUser = {
      role: 'customer',
      customerId: customerId,
      name: name,
      email: email
    };
    setCurrentUser(sessionUser);

    showToast('Welcome starting bonus claimed! Registered successfully!');

    setTimeout(() => {
      handleLoginRedirect();
    }, 1200);

  } catch (e) {
    showToast('Registration failed: ' + e.message, 'error');
  }
}

function submitAdminLogin() {
  const email = $('admin-email').value;
  const password = $('admin-pass').value;

  // Simulate simple Admin check
  if (email === 'admin@caterpro.com' && password === 'admin123') {
    const adminUser = {
      role: 'admin',
      name: 'Admin Manager',
      email: 'admin@caterpro.com'
    };
    setCurrentUser(adminUser);
    
    showToast('Admin access authorized!');
    
    setTimeout(() => {
      window.location.href = 'admin-dashboard.html';
    }, 1000);
  } else {
    showToast('Invalid administrator credentials entered', 'error');
  }
}

function handleLoginRedirect() {
  const urlParams = new URLSearchParams(window.location.search);
  const redirect = urlParams.get('redirect');
  if (redirect) {
    window.location.href = decodeURIComponent(redirect);
  } else {
    window.location.href = 'index.html';
  }
}

// Setup login tabs logic
document.addEventListener('DOMContentLoaded', () => {
  initLoginPage();

  const tabs = $('loginTabs');
  if (tabs) {
    tabs.addEventListener('click', e => {
      if (e.target.classList.contains('login-tab')) {
        $$('.login-tab').forEach(t => t.classList.remove('active'));
        e.target.classList.add('active');

        // Hide all forms
        $$('.login-form-content').forEach(f => f.style.display = 'none');

        // Show matching form
        const formId = 'form-' + e.target.dataset.role;
        $(formId).style.display = 'block';
      }
    });
  }
});
