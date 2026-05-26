/* ═══════════════════════════════════════════════════
   CaterPro — Admin Inventory JavaScript Controller
   ═══════════════════════════════════════════════════ */

let allInventory = [];

async function loadInventory() {
  checkAuth('admin');

  try {
    allInventory = await api('/inventory');
    renderInventory(allInventory);
  } catch (e) {
    showToast('Failed to retrieve inventory supplies: ' + e.message, 'error');
    $('inventoryBody').innerHTML = '<tr><td colspan="7" class="loading">Error loading data.</td></tr>';
  }
}

function renderInventory(list) {
  const body = $('inventoryBody');
  if (!list.length) {
    body.innerHTML = '<tr><td colspan="7" class="loading">No ingredients in inventory registry.</td></tr>';
    return;
  }

  body.innerHTML = list.map(item => {
    // Calculate percentage relative to a safe threshold (alert level * 2)
    const alertLvl = item.alertLevel || 1;
    const current = item.quantity || 0;
    let pct = Math.round((current / (alertLvl * 2)) * 100);
    if (pct > 100) pct = 100;
    if (pct < 0) pct = 0;

    let barClass = 'progress-safe';
    let statusText = 'Safe';
    if (current <= 0) {
      barClass = 'progress-danger';
      statusText = 'OUT OF STOCK';
    } else if (current <= alertLvl) {
      barClass = 'progress-danger';
      statusText = 'Low Level';
    } else if (current <= alertLvl * 1.5) {
      barClass = 'progress-warning';
      statusText = 'Moderate';
    }

    return `
      <tr>
        <td><strong>${esc(item.name)}</strong></td>
        <td><strong>${current}</strong></td>
        <td>${esc(item.unit)}</td>
        <td>${alertLvl}</td>
        <td>
          <div style="display:flex; align-items:center; gap:8px;">
            <div class="progress-bar-container">
              <div class="progress-bar ${barClass}" style="width: ${pct}%"></div>
            </div>
            <span style="font-size:11px; font-weight:600; color:${current <= alertLvl ? 'var(--rose)' : 'var(--text-secondary)'};">
              ${statusText}
            </span>
          </div>
        </td>
        <td>${item.updatedAt ? new Date(item.updatedAt).toLocaleDateString('en-LK') : '—'}</td>
        <td>
          <button class="btn-icon" onclick="openInventoryModal(${item.itemId})" title="Edit">✏️</button>
          <button class="btn-icon btn-danger" onclick="deleteInventoryItem(${item.itemId})" title="Delete">🗑️</button>
        </td>
      </tr>
    `;
  }).join('');
}

function openInventoryModal(id = null) {
  const isEdit = id !== null;
  const item = isEdit ? allInventory.find(i => i.itemId === id) : { name:'', quantity:0, unit:'kg', alertLevel:5 };

  openModal(isEdit ? 'Edit Stock Item' : 'Add Stock Item', `
    <div class="form-group" style="margin-bottom:12px;">
      <label>Ingredient / Supply Name</label>
      <input type="text" class="form-control" id="inv-name" value="${esc(item.name)}" required />
    </div>
    <div style="display:grid; grid-template-columns:1fr 1fr; gap:12px; margin-bottom:12px;">
      <div class="form-group">
        <label>Current Stock Quantity</label>
        <input type="number" class="form-control" id="inv-qty" value="${item.quantity}" min="0" step="0.1" required />
      </div>
      <div class="form-group">
        <label>Measurement Unit</label>
        <input type="text" class="form-control" id="inv-unit" value="${esc(item.unit)}" placeholder="e.g. kg, liters, units" required />
      </div>
    </div>
    <div class="form-group">
      <label>Alert Threshold (Minimum Level)</label>
      <input type="number" class="form-control" id="inv-alert" value="${item.alertLevel}" min="0" required />
    </div>
  `, async () => {
    const payload = {
      itemId: id,
      name: $('inv-name').value,
      quantity: parseFloat($('inv-qty').value) || 0,
      unit: $('inv-unit').value,
      alertLevel: parseFloat($('inv-alert').value) || 0
    };

    if (isEdit) {
      await api('/inventory', 'PUT', payload);
      showToast('Stock ingredient updated');
    } else {
      await api('/inventory', 'POST', payload);
      showToast('Stock ingredient created');
    }
    loadInventory();
  });
}

function deleteInventoryItem(id) {
  openConfirmModal(`Remove inventory item #${id}? This will disrupt recipe auto-reductions matching this ingredient!`, async () => {
    await api('/inventory/' + id, 'DELETE');
    showToast('Inventory item deleted');
    loadInventory();
  });
}

document.addEventListener('DOMContentLoaded', () => {
  loadInventory();

  $('addInventoryBtn').addEventListener('click', () => openInventoryModal());

  $('inventorySearch').addEventListener('input', e => {
    const q = e.target.value.toLowerCase();
    const filtered = allInventory.filter(i =>
      i.name.toLowerCase().includes(q) ||
      i.unit.toLowerCase().includes(q)
    );
    renderInventory(filtered);
  });
});
