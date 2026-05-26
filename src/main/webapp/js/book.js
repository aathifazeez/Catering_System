/* ═══════════════════════════════════════════════════
   CaterPro — Public Booking JavaScript Controller
   ═══════════════════════════════════════════════════ */

let availableMenu = [];
let selectedQuantities = {}; // itemId -> qty
let currentUser = null;
let customerPoints = 0;
let appliedDiscount = 0;
let pointsToRedeem = 0;

async function initBookingPage() {
  // 1. Force Customer authentication
  currentUser = checkAuth('customer');
  if (!currentUser) return; // checkAuth redirects automatically

  // 2. Fetch customer details to get real loyalty points
  try {
    const cust = await api('/customers/' + currentUser.customerId);
    customerPoints = cust.loyaltyPoints || 0;
    setupLoyaltyPanel();
  } catch (e) {
    console.error('Failed to load customer profile details', e);
  }

  // 3. Set minimum date of booking to tomorrow
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowStr = tomorrow.toISOString().split('T')[0];
  $('book-date').setAttribute('min', tomorrowStr);
  $('book-date').value = tomorrowStr;

  // 4. Fetch available menu items
  try {
    availableMenu = await api('/menu?available=true');
    renderSelectorDeck(availableMenu);
    
    // Check if an item was pre-selected via URL query parameter
    const urlParams = new URLSearchParams(window.location.search);
    const preselectedId = parseInt(urlParams.get('item'));
    if (preselectedId) {
      selectedQuantities[preselectedId] = 1;
      const qtyInput = $('qty-' + preselectedId);
      if (qtyInput) {
        qtyInput.value = 1;
      }
      updateSummary();
    }
  } catch (e) {
    showToast('Failed to load menu list: ' + e.message, 'error');
  }
}

function setupLoyaltyPanel() {
  if (customerPoints > 0) {
    $('loyalty-redeem-panel').style.display = 'flex';
    $('loyalty-pts-avail').textContent = customerPoints + ' pts';
    $('booking-redeem-pts').setAttribute('max', customerPoints);
    
    // Apply points button handler
    $('apply-pts-btn').addEventListener('click', () => {
      const inputVal = parseInt($('booking-redeem-pts').value) || 0;
      if (inputVal < 0) {
        showToast('Please enter a valid points value', 'error');
        return;
      }
      if (inputVal > customerPoints) {
        showToast('Cannot redeem more than your available ' + customerPoints + ' points', 'error');
        $('booking-redeem-pts').value = customerPoints;
        return;
      }
      pointsToRedeem = inputVal;
      appliedDiscount = pointsToRedeem * 10;
      
      if (pointsToRedeem > 0) {
        $('pts-applied-msg').style.display = 'block';
        $('pts-applied-msg').textContent = `Applied points! LKR ${appliedDiscount.toLocaleString('en-LK')} discount will be deducted.`;
      } else {
        $('pts-applied-msg').style.display = 'none';
      }
      updateSummary();
    });
  }
}

function renderSelectorDeck(menu) {
  const container = $('bookingItemSelector');
  if (!menu.length) {
    container.innerHTML = '<div style="padding:20px; color:var(--text-muted);">No items currently available.</div>';
    return;
  }

  container.innerHTML = menu.map(item => `
    <div class="booking-item-row">
      <div>
        <div class="booking-item-name">${esc(item.name)}</div>
        <div style="font-size:11.5px; color:var(--text-secondary); margin-top:2px;">${esc(item.category)} — serves 10</div>
      </div>
      <div style="display:flex; align-items:center; gap:16px;">
        <span class="booking-item-price">${fmtCurrency(item.price)}</span>
        <input type="number" class="booking-item-qty" id="qty-${item.itemId}" min="0" max="99" value="0" oninput="onQtyChange(${item.itemId}, this.value)" />
      </div>
    </div>
  `).join('');
}

function onQtyChange(itemId, val) {
  const qty = parseInt(val) || 0;
  if (qty > 0) {
    selectedQuantities[itemId] = qty;
  } else {
    delete selectedQuantities[itemId];
  }
  updateSummary();
}

function updateSummary() {
  const itemsContainer = $('summary-items');
  const selectedKeys = Object.keys(selectedQuantities);

  if (!selectedKeys.length) {
    itemsContainer.innerHTML = '<div style="font-size:12px; color:var(--text-muted); text-align:center; padding:20px 0;">No items selected yet.</div>';
    $('sum-subtotal').textContent = 'LKR 0.00';
    $('sum-tax').textContent = 'LKR 0.00';
    $('sum-total').textContent = 'LKR 0.00';
    $('sum-discount-row').style.display = 'none';
    return;
  }

  let subtotal = 0;
  itemsContainer.innerHTML = selectedKeys.map(key => {
    const item = availableMenu.find(m => m.itemId === parseInt(key));
    if (!item) return '';
    const qty = selectedQuantities[key];
    const lineTotal = item.price * qty;
    subtotal += lineTotal;
    
    return `
      <div class="summary-row" style="margin-bottom:6px;">
        <span>${esc(item.name)} (x${qty})</span>
        <span>${fmtCurrency(lineTotal)}</span>
      </div>
    `;
  }).join('');

  const tax = subtotal * 0.10;
  let total = subtotal + tax - appliedDiscount;
  if (total < 0) total = 0;

  $('sum-subtotal').textContent = fmtCurrency(subtotal);
  $('sum-tax').textContent = fmtCurrency(tax);
  
  if (appliedDiscount > 0) {
    $('sum-discount-row').style.display = 'flex';
    $('sum-discount').textContent = `- ${fmtCurrency(appliedDiscount)}`;
  } else {
    $('sum-discount-row').style.display = 'none';
  }
  
  $('sum-total').textContent = fmtCurrency(total);
}

async function submitCateringOrder() {
  const selectedKeys = Object.keys(selectedQuantities);
  if (!selectedKeys.length) {
    showToast('Please select at least one gourmet item', 'error');
    return;
  }

  const items = selectedKeys.map(key => ({
    itemId: parseInt(key),
    quantity: selectedQuantities[key]
  }));

  const orderData = {
    customerId: currentUser.customerId,
    eventDate: $('book-date').value,
    eventType: $('book-type').value,
    guestCount: parseInt($('book-guests').value) || 20,
    venueAddress: $('book-venue').value,
    specialInstructions: $('book-notes').value || '',
    status: 'Pending',
    items: items
  };

  try {
    // 1. Create order
    const result = await api('/orders', 'POST', orderData);
    const orderId = result.id;

    // 2. Automatically generate invoice (and apply points redemption if points > 0)
    // Discount is recorded in the invoice creation endpoint.
    await api('/bills', 'POST', { orderId: orderId, discount: appliedDiscount });

    showToast('Catering reservation booked successfully!');
    
    // Clear selections
    selectedQuantities = {};
    pointsToRedeem = 0;
    appliedDiscount = 0;

    setTimeout(() => {
      window.location.href = 'my-account.html';
    }, 1500);

  } catch (e) {
    showToast('Failed to place booking: ' + e.message, 'error');
  }
}

document.addEventListener('DOMContentLoaded', () => {
  initBookingPage();
});
