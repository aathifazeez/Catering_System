/* ═══════════════════════════════════════════════════
   CaterPro — Shared Utilities & Authentication
   Included on every page before page-specific JS.
   ═══════════════════════════════════════════════════ */

// Auto-detect backend: if served from Tomcat use relative path, else point to Tomcat directly
const API_BASE = (window.location.port === '8080' || window.location.port === '')
  ? '/catering-system/api'
  : 'http://localhost:8080/catering-system/api';
const $ = id => document.getElementById(id);
const $$ = sel => document.querySelectorAll(sel);

/* ── Authentication Helpers ── */
function getCurrentUser() {
  try {
    const u = localStorage.getItem('caterpro_user');
    return u ? JSON.parse(u) : null;
  } catch {
    return null;
  }
}

function setCurrentUser(user) {
  if (user) {
    localStorage.setItem('caterpro_user', JSON.stringify(user));
  } else {
    localStorage.removeItem('caterpro_user');
  }
}

function logout() {
  setCurrentUser(null);
  showToast('Logged out successfully');
  setTimeout(() => {
    window.location.href = 'login.html';
  }, 1000);
}

function checkAuth(roleRequired) {
  const user = getCurrentUser();
  if (!user) {
    if (roleRequired) {
      window.location.href = 'login.html?redirect=' + encodeURIComponent(window.location.pathname) + '&msg=please_login';
    }
    return null;
  }
  if (roleRequired === 'admin' && user.role !== 'admin') {
    window.location.href = 'login.html?msg=admin_only';
    return null;
  }
  return user;
}

/* ── API ── */
async function api(path, method = 'GET', body = null) {
  const opts = { method, headers: { 'Content-Type': 'application/json' } };
  if (body) opts.body = JSON.stringify(body);
  const res = await fetch(API_BASE + path, opts);
  if (!res.ok) throw new Error(await res.text() || `Error ${res.status}`);
  const text = await res.text();
  return text ? JSON.parse(text) : {};
}

/* ── Formatters ── */
function fmtCurrency(n) {
  return 'LKR ' + Number(n || 0).toLocaleString('en-LK', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
function fmtDate(d) {
  if (!d) return '—';
  try { return new Date(d).toLocaleDateString('en-LK', { year: 'numeric', month: 'short', day: 'numeric' }); }
  catch { return String(d); }
}
function esc(str) {
  return String(str || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');
}
function statusBadge(status) {
  const cls = { 'Pending':'badge-pending','Confirmed':'badge-confirmed','In Progress':'badge-progress','Completed':'badge-completed','Cancelled':'badge-cancelled' };
  return `<span class="badge ${cls[status]||'badge-pending'}">${esc(status)}</span>`;
}

/* ── Toast ── */
function showToast(msg, type = 'success') {
  const t = document.getElementById('toast'); if (!t) return;
  t.textContent = (type === 'success' ? '✓ ' : '✕ ') + msg;
  t.className = `toast show ${type}`;
  clearTimeout(t._timer);
  t._timer = setTimeout(() => { t.className = 'toast'; }, 3500);
}

/* ── Modal ── */
let _modalCb = null;
function openModal(title, bodyHTML, onSave) {
  $('modalTitle').textContent = title;
  $('modalBody').innerHTML = bodyHTML;
  _modalCb = onSave;
  $('modalOverlay').classList.add('open');
}
function closeModal() {
  $('modalOverlay').classList.remove('open');
  _modalCb = null;
}
function openConfirmModal(msg, fn) {
  if (confirm(msg)) Promise.resolve(fn()).catch(e => showToast(e.message, 'error'));
}

/* ── Bill Modal ── */
function openBillModal(html) {
  $('billModalBody').innerHTML = html;
  $('billOverlay').classList.add('open');
}
function closeBillModal() { $('billOverlay').classList.remove('open'); }

/* ── Active nav link & Auth elements ── */
function initNav() {
  const page = window.location.pathname.split('/').pop() || 'index.html';
  $$('.nav-item[data-page]').forEach(el => {
    el.classList.toggle('active', el.dataset.page === page);
  });

  // Dynamic header updates
  const headerAuth = $('header-auth');
  if (headerAuth) {
    const user = getCurrentUser();
    if (user) {
      if (user.role === 'admin') {
        headerAuth.innerHTML = `
          <a href="admin-dashboard.html" class="btn-primary" style="margin-right:12px;">Admin Dashboard</a>
          <button class="btn-ghost" onclick="logout()">Logout</button>
        `;
      } else {
        // Fetch real customer points
        api('/customers/' + user.customerId).then(c => {
          headerAuth.innerHTML = `
            <div style="display:flex; align-items:center; gap:16px;">
              <span style="font-size:13px; color:var(--text-secondary);">
                Welcome, <strong>${esc(c.name)}</strong> 
                <span class="badge badge-paid" style="margin-left:6px; font-weight:600; color:var(--gold-light); background:var(--gold-dim); border:1px solid var(--border-gold);">
                  ${c.loyaltyPoints || 0} pts
                </span>
              </span>
              <a href="my-account.html" class="btn-ghost">My Account</a>
              <button class="btn-ghost" onclick="logout()">Logout</button>
            </div>
          `;
        }).catch(() => {
          headerAuth.innerHTML = `
            <div style="display:flex; align-items:center; gap:16px;">
              <span style="font-size:13px; color:var(--text-secondary);">Welcome, <strong>${esc(user.name)}</strong></span>
              <a href="my-account.html" class="btn-ghost">My Account</a>
              <button class="btn-ghost" onclick="logout()">Logout</button>
            </div>
          `;
        });
      }
    } else {
      headerAuth.innerHTML = `
        <a href="login.html" class="btn-primary">Login / Register</a>
      `;
    }
  }
}

/* ── DOM Ready init ── */
document.addEventListener('DOMContentLoaded', () => {
  initNav();

  // Show page restriction toast based on URL parameters
  const urlParams = new URLSearchParams(window.location.search);
  const msgType = urlParams.get('msg');
  if (msgType === 'please_login') {
    showToast('Please login to continue.', 'error');
  } else if (msgType === 'admin_only') {
    showToast('Access Denied: Admins Only.', 'error');
  }

  const dd = $('dateDisplay');
  if (dd) dd.textContent = new Date().toLocaleDateString('en-US', { weekday:'long', year:'numeric', month:'long', day:'numeric' });

  const toggle = $('menuToggle'), sidebar = $('sidebar');
  if (toggle && sidebar) {
    toggle.addEventListener('click', () => sidebar.classList.toggle('open'));
    document.addEventListener('click', e => {
      if (sidebar.classList.contains('open') && !sidebar.contains(e.target) && e.target !== toggle)
        sidebar.classList.remove('open');
    });
  }

  const mo = $('modalOverlay');
  if (mo) {
    $('modalClose').addEventListener('click', closeModal);
    $('modalCancel').addEventListener('click', closeModal);
    mo.addEventListener('click', e => { if (e.target === mo) closeModal(); });
    $('modalSave').addEventListener('click', async () => {
      if (_modalCb) { try { await _modalCb(); closeModal(); } catch(e) { showToast(e.message,'error'); } }
    });
  }

  const bo = $('billOverlay');
  if (bo) {
    $('billModalClose').addEventListener('click', closeBillModal);
    $('billModalClose2').addEventListener('click', closeBillModal);
    bo.addEventListener('click', e => { if (e.target === bo) closeBillModal(); });
    $('printBillBtn').addEventListener('click', () => window.print());
  }
});
