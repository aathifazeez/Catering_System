/* ═══════════════════════════════════════════════════
   CaterPro — Public Menu JavaScript Controller
   ═══════════════════════════════════════════════════ */

let menuItems = [];
let currentCategory = 'All';

/* ── Fallback images per category (same map as admin) ── */
const PUBLIC_FALLBACK_IMAGES = {
  'Appetizer':   'https://images.unsplash.com/photo-1541529086526-db283c563270?q=80&w=400&auto=format&fit=crop',
  'Main Course': 'https://images.unsplash.com/photo-1544025162-d76694265947?q=80&w=400&auto=format&fit=crop',
  'Dessert':     'https://images.unsplash.com/photo-1563729784474-d77dbb933a9e?q=80&w=400&auto=format&fit=crop',
  'Beverage':    'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?q=80&w=400&auto=format&fit=crop',
  'Side Dish':   'https://images.unsplash.com/photo-1534939561126-855b8675edd7?q=80&w=400&auto=format&fit=crop'
};

function getPublicFallback(category) {
  return PUBLIC_FALLBACK_IMAGES[category] || PUBLIC_FALLBACK_IMAGES['Main Course'];
}

/* Called by onerror on broken/blocked image URLs in public menu */
function onPublicMenuImgError(imgEl, category) {
  imgEl.onerror = null; // prevent infinite loop
  imgEl.src = getPublicFallback(category);
}

async function initPublicMenu() {
  try {
    menuItems = await api('/menu?available=true');
    renderPublicMenu(menuItems);
  } catch (e) {
    showToast('Failed to load menu: ' + e.message, 'error');
    $('publicMenuGrid').innerHTML = `<div class="loading" style="grid-column: 1/-1;">Error loading menu items. Please reload.</div>`;
  }
}

function renderPublicMenu(items) {
  const grid = $('publicMenuGrid');
  if (!items.length) {
    grid.innerHTML = `<div class="loading" style="grid-column: 1/-1;">No matching items found.</div>`;
    return;
  }

  grid.innerHTML = items.map(item => {
    const src = (item.imageUrl && item.imageUrl.trim() !== '')
      ? item.imageUrl.trim()
      : getPublicFallback(item.category);

    return `
      <div class="menu-card">
        <div class="menu-card-img">
          <img
            src="${src}"
            alt="${esc(item.name)}"
            onerror="onPublicMenuImgError(this, '${esc(item.category)}')"
            style="width:100%;height:100%;object-fit:cover;display:block;border-radius:inherit;"
          />
          <span class="category-badge">${esc(item.category)}</span>
        </div>
        <div class="menu-card-body">
          <div class="menu-card-title-row">
            <h4>${esc(item.name)}</h4>
            <span class="price">${fmtCurrency(item.price)}</span>
          </div>
          <p class="menu-card-desc">${esc(item.description || 'Delectable catering portions crafted with gourmet ingredients.')}</p>
          <div style="display:flex; justify-content:space-between; align-items:center; margin-top:16px;">
            <span style="font-size:11px; color:var(--text-secondary);">Serves approx. 8-10 guests</span>
            <a href="book.html?item=${item.itemId}" class="btn-primary" style="padding:6px 12px; font-size:11px;">Select Item</a>
          </div>
        </div>
      </div>
    `;
  }).join('');
}

// Search and filtering event listeners
document.addEventListener('DOMContentLoaded', () => {
  initPublicMenu();

  const search = $('menuSearchInput');
  const tabs   = $('menuFilters');

  if (search) {
    search.addEventListener('input', () => {
      filterAndSearchMenu();
    });
  }

  if (tabs) {
    tabs.addEventListener('click', e => {
      if (e.target.classList.contains('filter-tab')) {
        $$('.filter-tab').forEach(t => t.classList.remove('active'));
        e.target.classList.add('active');
        currentCategory = e.target.dataset.cat;
        filterAndSearchMenu();
      }
    });
  }
});

function filterAndSearchMenu() {
  const query = $('menuSearchInput') ? $('menuSearchInput').value.toLowerCase() : '';

  const filtered = menuItems.filter(item => {
    const matchesCat    = currentCategory === 'All' || item.category === currentCategory;
    const matchesSearch = item.name.toLowerCase().includes(query) ||
                          (item.description || '').toLowerCase().includes(query) ||
                          item.category.toLowerCase().includes(query);
    return matchesCat && matchesSearch;
  });

  renderPublicMenu(filtered);
}