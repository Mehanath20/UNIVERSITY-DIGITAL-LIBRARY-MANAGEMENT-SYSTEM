/**
 * Dashboard Loader for Member, Librarian, and Admin
 */

async function loadMemberDashboard() {
  const user = checkAuth(['MEMBER']);
  if (!user) return;
  renderNavbar('dashboard');

  document.getElementById('member-name-display').innerText = user.name;
  document.getElementById('member-id-display').innerText = user.memberId || 'N/A';
  document.getElementById('member-type-display').innerText = user.memberType || 'STUDENT';

  try {
    // 1. Fetch borrowing history for active loans and total counts
    const historyRes = await API.get('/api/users/me/history?limit=100');
    const loans = historyRes.data?.data || [];

    const activeLoans = loans.filter(l => l.status === 'ISSUED' || l.status === 'OVERDUE');
    const overdueLoans = loans.filter(l => l.status === 'OVERDUE');

    document.getElementById('stat-total-borrowed').innerText = loans.length;
    document.getElementById('stat-active-loans').innerText = activeLoans.length;
    document.getElementById('stat-overdue-books').innerText = overdueLoans.length;

    // 2. Fetch fines
    const fineRes = await API.get('/api/fines/my');
    const unpaidFines = fineRes.data?.summary?.unpaidFines || 0;
    document.getElementById('stat-outstanding-fine').innerText = `$${unpaidFines.toFixed(2)}`;

    // 3. Render active loans table
    const tableBody = document.getElementById('active-loans-tbody');
    if (activeLoans.length === 0) {
      tableBody.innerHTML = `<tr><td colspan="5" class="text-center py-4 text-muted">No books currently on loan. <a href="/pages/books.html">Browse catalog</a></td></tr>`;
    } else {
      tableBody.innerHTML = activeLoans.map(l => {
        const isOverdue = new Date(l.dueDate) < new Date();
        const badgeClass = isOverdue ? 'badge-overdue' : 'badge-issued';
        const statusText = isOverdue ? 'OVERDUE' : 'ISSUED';
        return `
          <tr>
            <td class="fw-semibold">${l.bookId?.title || 'Unknown Title'}</td>
            <td><code>${l.bookId?.isbn || ''}</code></td>
            <td>${new Date(l.issueDate).toLocaleDateString()}</td>
            <td><span class="${isOverdue ? 'text-danger fw-bold' : ''}">${new Date(l.dueDate).toLocaleDateString()}</span></td>
            <td><span class="badge ${badgeClass}">${statusText}</span></td>
          </tr>
        `;
      }).join('');
    }

    // 4. Fetch notifications
    const notifRes = await API.get('/api/notifications/my?limit=5');
    const notifs = notifRes.data?.data || [];
    const notifContainer = document.getElementById('notifications-container');
    if (notifContainer) {
      if (notifs.length === 0) {
        notifContainer.innerHTML = `<p class="text-muted small mb-0">No unread notifications.</p>`;
      } else {
        notifContainer.innerHTML = notifs.map(n => `
          <div class="alert alert-light border d-flex align-items-center justify-content-between p-2 mb-2">
            <div>
              <span class="badge bg-primary me-2">${n.type.replace('_', ' ')}</span>
              <small class="text-dark">${n.message}</small>
            </div>
            <small class="text-muted">${new Date(n.createdAt).toLocaleDateString()}</small>
          </div>
        `).join('');
      }
    }

  } catch (err) {
    console.error('Failed to load member dashboard:', err);
  }
}

async function loadLibrarianDashboard() {
  const user = checkAuth(['LIBRARIAN', 'ADMIN']);
  if (!user) return;
  renderNavbar('dashboard');

  try {
    const res = await API.get('/api/admin/reports/overview');
    const stats = res.data || {};

    document.getElementById('stat-total-books').innerText = stats.totalBooks || 0;
    document.getElementById('stat-available-copies').innerText = stats.availableCopies || 0;
    document.getElementById('stat-issued-books').innerText = stats.issuedBooks || 0;
    document.getElementById('stat-overdue-books').innerText = stats.overdueTransactions || 0;
    document.getElementById('stat-outstanding-fines').innerText = `$${(stats.outstandingFines || 0).toFixed(2)}`;

    // Load recent transactions
    const txRes = await API.get('/api/transactions?limit=8');
    const transactions = txRes.data?.data || [];
    const tbody = document.getElementById('recent-transactions-tbody');
    if (tbody) {
      if (transactions.length === 0) {
        tbody.innerHTML = `<tr><td colspan="6" class="text-center py-4 text-muted">No transactions recorded yet.</td></tr>`;
      } else {
        tbody.innerHTML = transactions.map(t => {
          let badgeClass = 'badge-issued';
          if (t.status === 'RETURNED') badgeClass = 'badge-available';
          if (t.status === 'OVERDUE') badgeClass = 'badge-overdue';

          return `
            <tr>
              <td><code>${t._id.substring(t._id.length - 6)}</code></td>
              <td class="fw-semibold">${t.bookId?.title || 'Unknown'}</td>
              <td>${t.memberId?.name || 'N/A'} <small class="text-muted">(${t.memberId?.memberId || ''})</small></td>
              <td>${new Date(t.dueDate).toLocaleDateString()}</td>
              <td><span class="badge ${badgeClass}">${t.status}</span></td>
              <td>
                ${t.status === 'ISSUED' || t.status === 'OVERDUE' ? `
                  <button class="btn btn-sm btn-outline-success" onclick="openReturnModal('${t._id}', '${escapeQuotes(t.bookId?.title)}', '${escapeQuotes(t.memberId?.name)}')">Return</button>
                ` : `<span class="text-muted small">Completed</span>`}
              </td>
            </tr>
          `;
        }).join('');
      }
    }
  } catch (err) {
    console.error('Failed to load librarian dashboard:', err);
  }
}

async function loadAdminDashboard() {
  const user = checkAuth(['ADMIN']);
  if (!user) return;
  renderNavbar('dashboard');

  try {
    const res = await API.get('/api/admin/reports/overview');
    const stats = res.data || {};

    document.getElementById('admin-total-members').innerText = stats.totalMembers || 0;
    document.getElementById('admin-total-librarians').innerText = stats.totalLibrarians || 0;
    document.getElementById('admin-total-books').innerText = stats.totalBooks || 0;
    document.getElementById('admin-total-copies').innerText = stats.totalCopies || 0;
    document.getElementById('admin-outstanding-fines').innerText = `$${(stats.outstandingFines || 0).toFixed(2)}`;

    // Load Librarians list
    const libRes = await API.get('/api/admin/librarians');
    const librarians = libRes.data || [];
    const libTbody = document.getElementById('librarians-tbody');
    if (libTbody) {
      libTbody.innerHTML = librarians.map(l => `
        <tr>
          <td class="fw-semibold">${l.name}</td>
          <td>${l.email}</td>
          <td>${l.phone || 'N/A'}</td>
          <td><span class="badge ${l.isActive ? 'bg-success' : 'bg-danger'}">${l.isActive ? 'ACTIVE' : 'DISABLED'}</span></td>
          <td>
            <button class="btn btn-sm ${l.isActive ? 'btn-outline-danger' : 'btn-outline-success'}" onclick="toggleUserStatus('${l._id}')">
              ${l.isActive ? 'Disable' : 'Enable'}
            </button>
          </td>
        </tr>
      `).join('');
    }

    // Load Membership Plans
    const planRes = await API.get('/api/membership-plans');
    const plans = planRes.data || [];
    const planTbody = document.getElementById('plans-tbody');
    if (planTbody) {
      planTbody.innerHTML = plans.map(p => `
        <tr>
          <td class="fw-semibold">${p.name}</td>
          <td><span class="badge bg-info text-dark">${p.memberType}</span></td>
          <td>${p.maxBooksAllowed} books</td>
          <td>${p.loanDurationDays} days</td>
          <td>$${p.finePerDay}/day</td>
          <td>$${p.maxFine}</td>
        </tr>
      `).join('');
    }

  } catch (err) {
    console.error('Failed to load admin dashboard:', err);
  }
}

function escapeQuotes(str) {
  if (!str) return '';
  return str.replace(/'/g, "\\'").replace(/"/g, '&quot;');
}
