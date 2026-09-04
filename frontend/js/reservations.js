/**
 * Reservations & Hold Queue Controller
 */

async function loadReservationsPage() {
  const user = checkAuth();
  if (!user) return;
  renderNavbar('reservations');

  const tbody = document.getElementById('holds-tbody');
  if (!tbody) return;

  try {
    const res = await API.get('/api/holds/my');
    const holds = res.data || [];

    if (holds.length === 0) {
      tbody.innerHTML = `<tr><td colspan="6" class="text-center py-4 text-muted">You have no active or previous reservations. <a href="/pages/books.html">Browse catalog</a></td></tr>`;
      return;
    }

    tbody.innerHTML = holds.map(h => {
      let badgeClass = 'badge-waiting';
      if (h.status === 'NOTIFIED') badgeClass = 'badge-notified';
      if (h.status === 'FULFILLED') badgeClass = 'badge-paid';
      if (h.status === 'CANCELLED') badgeClass = 'bg-secondary text-white';

      const canCancel = h.status === 'WAITING' || h.status === 'NOTIFIED';

      return `
        <tr>
          <td class="fw-semibold">${h.bookId?.title || 'Unknown Title'}</td>
          <td><code>${h.bookId?.isbn || 'N/A'}</code></td>
          <td>${new Date(h.requestedAt).toLocaleDateString()}</td>
          <td>
            <span class="badge bg-light text-dark border">#${h.queuePosition}</span>
          </td>
          <td>
            <span class="badge ${badgeClass}">${h.status}</span>
            ${h.expiresAt ? `<div class="small text-danger">Expires: ${new Date(h.expiresAt).toLocaleDateString()}</div>` : ''}
          </td>
          <td>
            ${canCancel ? `
              <button class="btn btn-sm btn-outline-danger" onclick="cancelHold('${h._id}')">Cancel</button>
            ` : '<span class="text-muted small">None</span>'}
          </td>
        </tr>
      `;
    }).join('');

  } catch (err) {
    tbody.innerHTML = `<tr><td colspan="6" class="alert alert-danger py-2">Error: ${err.message}</td></tr>`;
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
