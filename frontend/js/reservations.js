/**
 * Reservations & Hold Queue Controller
 */

async function loadReservationsPage() {
  const user = checkAuth();
  if (!user) return;
  renderNavbar('reservations');

  const isStaff = user.role === 'LIBRARIAN' || user.role === 'ADMIN';
  const thMember = document.getElementById('th-hold-member');
  const viewLabel = document.getElementById('holds-view-label');

  if (thMember && isStaff) {
    thMember.classList.remove('d-none');
    if (viewLabel) viewLabel.innerText = 'Institutional Holds Ledger';
  } else if (thMember) {
    thMember.classList.add('d-none');
    if (viewLabel) viewLabel.innerText = 'Personal Queue';
  }

  const statusFilter = document.getElementById('filter-hold-status')?.value || '';
  const tbody = document.getElementById('holds-tbody');
  const colCount = isStaff ? 7 : 6;

  if (tbody) {
    tbody.innerHTML = `<tr><td colspan="${colCount}" class="text-center py-4 text-muted"><div class="spinner-border spinner-border-sm text-warning me-2"></div>Loading reservations...</td></tr>`;
  }

  try {
    let holds = [];
    if (isStaff) {
      let endpoint = '/api/holds';
      if (statusFilter) endpoint += `?status=${statusFilter}`;
      const res = await API.get(endpoint);
      holds = res.data || [];
    } else {
      const res = await API.get('/api/holds/my');
      holds = res.data || [];
      if (statusFilter) {
        holds = holds.filter(h => h.status === statusFilter);
      }
    }

    // Compute metrics
    const total = holds.length;
    const waiting = holds.filter(h => h.status === 'WAITING').length;
    const notified = holds.filter(h => h.status === 'NOTIFIED').length;
    const fulfilled = holds.filter(h => h.status === 'FULFILLED').length;

    const elTotal = document.getElementById('stat-total-holds');
    const elWaiting = document.getElementById('stat-waiting-holds');
    const elNotified = document.getElementById('stat-notified-holds');
    const elFulfilled = document.getElementById('stat-fulfilled-holds');

    if (elTotal) elTotal.innerText = total;
    if (elWaiting) elWaiting.innerText = waiting;
    if (elNotified) elNotified.innerText = notified;
    if (elFulfilled) elFulfilled.innerText = fulfilled;

    if (!tbody) return;

    if (holds.length === 0) {
      tbody.innerHTML = `<tr><td colspan="${colCount}" class="text-center py-4 text-muted">No reservations found matching this criteria. <a href="/pages/books.html">Browse catalog</a></td></tr>`;
      return;
    }

    tbody.innerHTML = holds.map(h => {
      let badgeClass = 'badge-waiting';
      if (h.status === 'NOTIFIED') badgeClass = 'badge-notified';
      if (h.status === 'FULFILLED') badgeClass = 'badge-paid';
      if (h.status === 'CANCELLED') badgeClass = 'bg-secondary text-white';

      const canCancel = h.status === 'WAITING' || h.status === 'NOTIFIED';
      const memberInfo = h.memberId ? `<div class="fw-semibold">${h.memberId.name || 'Member'}</div><small class="text-muted">${h.memberId.memberId || h.memberId.email || ''}</small>` : '<span class="text-muted">N/A</span>';

      return `
        <tr>
          ${isStaff ? `<td>${memberInfo}</td>` : ''}
          <td class="fw-semibold">${h.bookId?.title || 'Unknown Title'}</td>
          <td><code>${h.bookId?.isbn || 'N/A'}</code></td>
          <td>${new Date(h.requestedAt).toLocaleDateString()}</td>
          <td>
            <span class="badge bg-light text-dark border">#${h.queuePosition}</span>
          </td>
          <td>
            <span class="badge ${badgeClass}">${h.status}</span>
            ${h.expiresAt ? `<div class="small text-danger fw-semibold mt-1"><i class="bi bi-clock me-1"></i>Expires: ${new Date(h.expiresAt).toLocaleDateString()}</div>` : ''}
          </td>
          <td>
            ${canCancel ? `
              <button class="btn btn-sm btn-outline-danger" onclick="cancelHold('${h._id}')"><i class="bi bi-x-circle me-1"></i>Cancel</button>
            ` : '<span class="text-muted small">None</span>'}
          </td>
        </tr>
      `;
    }).join('');

  } catch (err) {
    if (tbody) {
      tbody.innerHTML = `<tr><td colspan="${colCount}" class="alert alert-danger py-2">Error: ${err.message}</td></tr>`;
    }
  }
}

async function cancelHold(holdId) {
  if (!confirm('Are you sure you want to cancel this reservation? You will lose your queue position.')) return;

  try {
    await API.delete(`/api/holds/${holdId}`);
    alert('Reservation cancelled.');
    loadReservationsPage();
  } catch (err) {
    alert(`Failed to cancel: ${err.message}`);
  }
}
