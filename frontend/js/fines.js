/**
 * Fines & Payment Management
 */

async function loadFinesPage() {
  const user = checkAuth();
  if (!user) return;
  renderNavbar('fines');

  const isStaff = user.role === 'LIBRARIAN' || user.role === 'ADMIN';

  try {
    let finesData;
    if (!isStaff) {
      const res = await API.get('/api/fines/my');
      finesData = res.data;
    } else {
      // Staff view: fetch fine report + transactions with fines
      const res = await API.get('/api/admin/reports/fines');
      const txRes = await API.get('/api/transactions?fineStatus=UNPAID&limit=50');
      finesData = {
        summary: {
          totalFines: res.data.totalFines,
          unpaidFines: res.data.unpaidFines,
          paidFines: res.data.paidFines,
          waivedFines: res.data.waivedFines
        },
        transactions: txRes.data?.data || []
      };
    }

    document.getElementById('fine-total-amount').innerText = `$${(finesData.summary.totalFines || 0).toFixed(2)}`;
    document.getElementById('fine-unpaid-amount').innerText = `$${(finesData.summary.unpaidFines || 0).toFixed(2)}`;
    document.getElementById('fine-paid-amount').innerText = `$${(finesData.summary.paidFines || 0).toFixed(2)}`;
    document.getElementById('fine-waived-amount').innerText = `$${(finesData.summary.waivedFines || 0).toFixed(2)}`;

    const tbody = document.getElementById('fines-tbody');
    if (!tbody) return;

    const list = finesData.transactions || [];
    if (list.length === 0) {
      tbody.innerHTML = `<tr><td colspan="7" class="text-center py-4 text-muted">No fine records found. Outstanding balance is zero.</td></tr>`;
      return;
    }

    tbody.innerHTML = list.map(t => {
      let statusBadge = 'badge-unpaid';
      if (t.fineStatus === 'PAID') statusBadge = 'badge-paid';
      if (t.fineStatus === 'WAIVED') statusBadge = 'bg-secondary text-white';

      let actions = '';
      if (t.fineStatus === 'UNPAID' || t.fineStatus === 'PARTIAL') {
        actions = `
          <button class="btn btn-sm btn-success" onclick="openPayFineModal('${t._id}', ${t.fine})"><i class="bi bi-credit-card me-1"></i>Pay</button>
        `;
        if (isStaff) {
          actions += `
            <button class="btn btn-sm btn-outline-danger ms-1" onclick="openWaiveFineModal('${t._id}', ${t.fine})">Waive</button>
          `;
        }
      } else {
        actions = `<span class="badge bg-light text-dark border">Resolved</span>`;
      }

      return `
        <tr>
          <td><code>${t._id.substring(t._id.length - 6)}</code></td>
          <td class="fw-semibold">${t.bookId?.title || 'Unknown Title'}</td>
          ${isStaff ? `<td>${t.memberId?.name || 'N/A'}</td>` : ''}
          <td>${t.returnDate ? new Date(t.returnDate).toLocaleDateString() : 'Active'}</td>
          <td class="fw-bold text-danger">$${t.fine.toFixed(2)}</td>
          <td><span class="badge ${statusBadge}">${t.fineStatus}</span></td>
          <td>${actions}</td>
        </tr>
      `;
    }).join('');

  } catch (err) {
    console.error('Failed to load fines:', err);
  }
}

function openPayFineModal(txId, amount) {
  document.getElementById('pay-tx-id').value = txId;
  document.getElementById('pay-amount').value = amount.toFixed(2);
  const modal = new bootstrap.Modal(document.getElementById('payFineModal'));
  modal.show();
}

async function submitPayFine(e) {
  e.preventDefault();
  const txId = document.getElementById('pay-tx-id').value;
  const amount = parseFloat(document.getElementById('pay-amount').value);
  const paymentMethod = document.getElementById('pay-method').value;

  try {
    const res = await API.post(`/api/fines/${txId}/pay`, { amount, paymentMethod });
    alert(`Payment successful! Reference: ${res.data.payment.referenceNumber}\nFine status is now PAID.`);
    bootstrap.Modal.getInstance(document.getElementById('payFineModal')).hide();
    loadFinesPage();
  } catch (err) {
    alert(`Payment failed: ${err.message}`);
  }
}

function openWaiveFineModal(txId, amount) {
  document.getElementById('waive-tx-id').value = txId;
  document.getElementById('waive-amount').innerText = `$${amount.toFixed(2)}`;
  document.getElementById('waive-reason').value = '';
  const modal = new bootstrap.Modal(document.getElementById('waiveFineModal'));
  modal.show();
}

async function submitWaiveFine(e) {
  e.preventDefault();
  const txId = document.getElementById('waive-tx-id').value;
  const reason = document.getElementById('waive-reason').value.trim();

  try {
    await API.put(`/api/fines/${txId}/waive`, { reason });
    alert('Fine successfully waived!');
    bootstrap.Modal.getInstance(document.getElementById('waiveFineModal')).hide();
    loadFinesPage();
  } catch (err) {
    alert(`Waive failed: ${err.message}`);
  }
}
