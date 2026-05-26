let allMenuItems = [];
let selectedFilter = 'All';

async function loadMenu() {
  checkAuth('admin');

  try {
    allMenuItems = await api('/menu');
    renderAdminMenu(allMenuItems);
  } catch (e) {
    showToast('Failed to retrieve menu items: ' + e.message, 'error');
    $('menuGrid').innerHTML =
      '<div class="loading">Error fetching menu from database.</div>';
  }
}

/* ── Fallback images per category ── */
const FALLBACK_IMAGES = {
  'Appetizer':   'https://images.unsplash.com/photo-1541529086526-db283c563270?q=80&w=400&auto=format&fit=crop',
  'Main Course': 'https://images.unsplash.com/photo-1544025162-d76694265947?q=80&w=400&auto=format&fit=crop',
  'Dessert':     'https://images.unsplash.com/photo-1563729784474-d77dbb933a9e?q=80&w=400&auto=format&fit=crop',
  'Beverage':    'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?q=80&w=400&auto=format&fit=crop',
  'Side Dish':   'https://images.unsplash.com/photo-1534939561126-855b8675edd7?q=80&w=400&auto=format&fit=crop'
};

function getFallback(category) {
  return FALLBACK_IMAGES[category] || FALLBACK_IMAGES['Main Course'];
}

/* Called by onerror on broken/blocked image URLs */
function onMenuImgError(imgEl, category) {
  imgEl.onerror = null; // prevent infinite loop if fallback also fails
  imgEl.src = getFallback(category);
}

function renderAdminMenu(list) {
  const grid = $('menuGrid');

  if (!list.length) {
    grid.innerHTML =
      '<div class="loading">No menu items found. Click Add to create one!</div>';
    return;
  }

  grid.innerHTML = list.map(item => {
    const src      = (item.imageUrl && item.imageUrl.trim() !== '')
                       ? item.imageUrl.trim()
                       : getFallback(item.category);
    const fallback = getFallback(item.category);

    return `
      <div class="menu-card">
        <div class="menu-card-img">
          <img
            src="${src}"
            alt="${esc(item.name)}"
            onerror="onMenuImgError(this, '${esc(item.category)}')"
            style="width:100%;height:100%;object-fit:cover;display:block;border-radius:inherit;"
          />
          <span class="category-badge">
            ${esc(item.category)}
          </span>
        </div>

        <div class="menu-card-body">
          <div class="menu-card-title-row">
            <h4>${esc(item.name)}</h4>
            <span class="price">
              ${fmtCurrency(item.price)}
            </span>
          </div>

          <p class="menu-card-desc">
            ${esc(item.description || 'Premium catering menu item')}
          </p>

          <div style="
            display:flex;
            justify-content:space-between;
            align-items:center;
            margin-top:16px;
          ">
            <span class="badge ${item.available ? 'badge-paid' : 'badge-unpaid'}">
              ${item.available ? 'Available' : 'Unavailable'}
            </span>

            <div>
              <button
                class="btn-icon"
                onclick="openMenuModal(${item.itemId})">
                ✏️
              </button>

              <button
                class="btn-icon btn-danger"
                onclick="deleteMenuItem(${item.itemId})">
                🗑️
              </button>
            </div>
          </div>
        </div>
      </div>
    `;
  }).join('');
}

/* Live preview inside the modal when admin types/pastes a URL */
function previewMenuImage(url, category) {
  const preview = document.getElementById('img-preview');
  if (!preview) return;
  if (url && url.trim() !== '') {
    preview.src     = url.trim();
    preview.style.display = 'block';
  } else {
    preview.src     = getFallback(category || 'Main Course');
    preview.style.display = 'block';
  }
}

function openMenuModal(id = null) {
  const isEdit = id !== null;

  const item = isEdit
    ? allMenuItems.find(i => i.itemId === id)
    : {
        name: '',
        price: 0,
        category: 'Main Course',
        description: '',
        available: true,
        imageUrl: ''
      };

  const previewSrc = (item.imageUrl && item.imageUrl.trim() !== '')
    ? item.imageUrl.trim()
    : getFallback(item.category);

  openModal(
    isEdit ? 'Edit Menu Item' : 'Add Menu Item',
    `
    <div class="form-group">
      <label>Item Name</label>
      <input
        type="text"
        class="form-control"
        id="menu-name"
        value="${esc(item.name)}"
      />
    </div>

    <div class="form-group">
      <label>Category</label>
      <select class="form-control" id="menu-category"
        onchange="previewMenuImage($('menu-image').value, this.value)">

        <option value="Appetizer"
        ${item.category === 'Appetizer' ? 'selected' : ''}>
        Appetizer</option>

        <option value="Main Course"
        ${item.category === 'Main Course' ? 'selected' : ''}>
        Main Course</option>

        <option value="Dessert"
        ${item.category === 'Dessert' ? 'selected' : ''}>
        Dessert</option>

        <option value="Beverage"
        ${item.category === 'Beverage' ? 'selected' : ''}>
        Beverage</option>

        <option value="Side Dish"
        ${item.category === 'Side Dish' ? 'selected' : ''}>
        Side Dish</option>

      </select>
    </div>

    <div class="form-group">
      <label>Price (LKR)</label>
      <input
        type="number"
        class="form-control"
        id="menu-price"
        value="${item.price}"
      />
    </div>

    <div class="form-group">
      <label>Image URL</label>
      <input
        type="text"
        class="form-control"
        id="menu-image"
        value="${esc(item.imageUrl || '')}"
        placeholder="https://example.com/image.jpg"
        oninput="previewMenuImage(this.value, $('menu-category').value)"
      />
      <img
        id="img-preview"
        src="${previewSrc}"
        alt="Image preview"
        onerror="this.src='${getFallback(item.category)}'"
        style="
          margin-top:10px;
          width:100%;
          height:140px;
          object-fit:cover;
          border-radius:8px;
          border:1px solid var(--border);
          display:block;
        "
      />
      <p style="font-size:11px;color:var(--text-secondary);margin-top:4px;">
        Preview updates as you type. Leave blank to use the category default image.
      </p>
    </div>

    <div class="form-group">
      <label>Description</label>
      <textarea
        class="form-control crm-textarea"
        id="menu-desc"
      >${esc(item.description || '')}</textarea>
    </div>

    <div class="form-group">
      <input
        type="checkbox"
        id="menu-avail"
        ${item.available ? 'checked' : ''}
      />
      Available
    </div>
    `,
    async () => {
      const payload = {
        itemId:      id,
        name:        $('menu-name').value,
        category:    $('menu-category').value,
        price:       parseFloat($('menu-price').value) || 0,
        imageUrl:    $('menu-image').value.trim(),
        description: $('menu-desc').value,
        available:   $('menu-avail').checked
      };

      if (isEdit) {
        await api('/menu', 'PUT', payload);
        showToast('Menu item updated');
      } else {
        await api('/menu', 'POST', payload);
        showToast('Menu item created');
      }

      loadMenu();
    }
  );
}

function deleteMenuItem(id) {
  openConfirmModal(
    `Delete menu item #${id}?`,
    async () => {
      await api('/menu/' + id, 'DELETE');
      showToast('Menu item deleted');
      loadMenu();
    }
  );
}

function applyFilters() {
  const filtered = allMenuItems.filter(item => {
    return (
      selectedFilter === 'All' ||
      item.category === selectedFilter
    );
  });

  renderAdminMenu(filtered);
}

document.addEventListener('DOMContentLoaded', () => {

  loadMenu();

  $('addMenuBtn')
    .addEventListener('click',
      () => openMenuModal()
    );

  $('categoryFilter')
    .addEventListener('click', e => {

      if (e.target.classList.contains('filter-tab')) {

        $$('.filter-tab')
          .forEach(t =>
            t.classList.remove('active')
          );

        e.target.classList.add('active');

        selectedFilter =
          e.target.dataset.cat;

        applyFilters();
      }
    });
});