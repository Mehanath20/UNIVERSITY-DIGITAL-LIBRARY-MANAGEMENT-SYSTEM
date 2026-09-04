/**
 * Transactions & Return Processor
 */

function openReturnModal(txId, bookTitle, memberName) {
  document.getElementById('return-tx-id').value = txId;
  document.getElementById('return-book-title').value = bookTitle || 'Unknown';
  document.getElementById('return-member-name').value = memberName || 'Unknown';
  document.getElementById('return-notes').value = '';
  document.getElementById('return-date').value = ''; // default today

  const modal = new bootstrap.Modal(document.getElementById('returnBookModal'));
  modal.show();
}

async function submitReturnBook(e) {
  e.preventDefault();
  const txId = document.getElementById('return-tx-id').value;
  const returnDate = document.getElementById('return-date').value;
  const notes = document.getElementById('return-notes').value;

  const payload = {};
  if (returnDate) payload.returnDate = new Date(returnDate).toISOString();
  if (notes) payload.notes = notes;

  try {
    const res = await API.put(`/api/transactions/${txId}/return`, payload);
    const result = res.data;

    let msg = `Book returned successfully!`;
    if (result.fine > 0) {
      msg += `\n⚠️ Book is overdue by ${result.overdueDays} day(s).\nAssessed Fine: $${result.fine.toFixed(2)} (Status: ${result.fineStatus})`;
    } else {
      msg += `\nReturned on time. No overdue fines.`;
    }

    if (result.holdNotification) {
      msg += `\n🔔 Next hold in queue has been notified! Copy held until ${new Date(result.holdNotification.expiresAt).toLocaleDateString()}.`;
    }

    alert(msg);
    bootstrap.Modal.getInstance(document.getElementById('returnBookModal')).hide();

    // Reload page data
    if (typeof loadLibrarianDashboard === 'function') loadLibrarianDashboard();
    if (typeof loadTransactionsPage === 'function') loadTransactionsPage();
  } catch (err) {
    alert(`Return failed: ${err.message}`);
  }
}

async function loadBorrowingHistory(page = 1) {
  const user = checkAuth();
  if (!user) return;
  renderNavbar('history');

  const status = document.getElementById('filter-status')?.value || '';
  let endpoint = user.role === 'MEMBER' ? '/api/users/me/history' : '/api/transactions';
  let query = `${endpoint}?page=${page}&limit=15`;
  if (status) query += `&status=${status}`;

  const tbody = document.getElementById('history-tbody');
  if (!tbody) return;

  tbody.innerHTML = `<tr><td colspan="7" class="text-center py-4"><div class="spinner-border spinner-border-sm text-primary"></div> Loading...</td></tr>`;

  try {
    const res = await API.get(query);
    const list = res.data?.data || [];

    if (list.length === 0) {
      tbody.innerHTML = `<tr><td colspan="7" class="text-center py-4 text-muted">No records found.</td></tr>`;
      return;
    }

    tbody.innerHTML = list.map(t => {
      let badgeClass = 'badge-issued';
      if (t.status === 'RETURNED') badgeClass = 'badge-available';
      if (t.status === 'OVERDUE') badgeClass = 'badge-overdue';

      return `
        <tr>
          <td><code>${t._id.substring(t._id.length - 6)}</code></td>
          <td class="fw-semibold">${t.bookId?.title || 'Unknown Title'}</td>
          ${user.role !== 'MEMBER' ? `<td>${t.memberId?.name || 'N/A'}</td>` : ''}
          <td>${new Date(t.issueDate).toLocaleDateString()}</td>
          <td>${new Date(t.dueDate).toLocaleDateString()}</td>
          <td>${t.returnDate ? new Date(t.returnDate).toLocaleDateString() : '<span class="text-muted">—</span>'}</td>
          <td>
            ${t.fine > 0 ? `<span class="badge ${t.fineStatus === 'PAID' ? 'badge-paid' : 'badge-unpaid'}">$${t.fine.toFixed(2)} (${t.fineStatus})</span>` : '<span class="text-muted">$0.00</span>'}
          </td>
          <td><span class="badge ${badgeClass}">${t.status}</span></td>
        </tr>
      `;
    }).join('');

  } catch (err) {
    tbody.innerHTML = `<tr><td colspan="7" class="alert alert-danger py-2">Error: ${err.message}</td></tr>`;
  }
}
