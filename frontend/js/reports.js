/**
 * Reports & Library Intelligence Analytics
 */

async function loadReportsPage() {
  const user = checkAuth(['LIBRARIAN', 'ADMIN']);
  if (!user) return;
  renderNavbar('reports');

  try {
    // 1. Overview
    const overviewRes = await API.get('/api/admin/reports/overview');
    const o = overviewRes.data || {};
    document.getElementById('rep-total-books').innerText = o.totalBooks || 0;
    document.getElementById('rep-total-copies').innerText = o.totalCopies || 0;
    document.getElementById('rep-available-copies').innerText = o.availableCopies || 0;
    document.getElementById('rep-issued-books').innerText = o.issuedBooks || 0;
    document.getElementById('rep-overdue').innerText = o.overdueTransactions || 0;
    document.getElementById('rep-outstanding-fines').innerText = `$${(o.outstandingFines || 0).toFixed(2)}`;

    // 2. Most Borrowed
    const mostRes = await API.get('/api/admin/reports/most-borrowed?limit=10');
    const mostList = mostRes.data || [];
    const mostTbody = document.getElementById('most-borrowed-tbody');
    if (mostTbody) {
      if (mostList.length === 0) {
        mostTbody.innerHTML = `<tr><td colspan="4" class="text-center py-3 text-muted">No borrowing trends recorded yet.</td></tr>`;
      } else {
        mostTbody.innerHTML = mostList.map((item, idx) => `
          <tr>
            <td><span class="badge ${idx === 0 ? 'bg-warning text-dark' : 'bg-light text-dark border'}">#${idx + 1}</span></td>
            <td class="fw-semibold">${item.title}</td>
            <td><span class="badge bg-secondary-subtle text-secondary">${item.category}</span></td>
            <td class="fw-bold text-primary">${item.borrowCount} time(s)</td>
          </tr>
        `).join('');
      }
    }

    // 3. Overdue List
    const overdueRes = await API.get('/api/admin/reports/overdue');
    const overdueList = overdueRes.data || [];
    const overdueTbody = document.getElementById('overdue-tbody');
    if (overdueTbody) {
      if (overdueList.length === 0) {
        overdueTbody.innerHTML = `<tr><td colspan="6" class="text-center py-3 text-success"><i class="bi bi-check-circle me-1"></i>No loans currently overdue! Excellent return compliance.</td></tr>`;
      } else {
        overdueTbody.innerHTML = overdueList.map(item => `
          <tr>
            <td class="fw-semibold">${item.book?.title || 'Unknown'}</td>
            <td>${item.member?.name || 'N/A'} <small class="text-muted">(${item.member?.memberId || item.member?.email})</small></td>
            <td>${new Date(item.dueDate).toLocaleDateString()}</td>
            <td><span class="badge badge-overdue">${item.daysOverdue} day(s)</span></td>
            <td class="fw-bold text-danger">$${item.estimatedFine.toFixed(2)}</td>
            <td><button class="btn btn-sm btn-outline-primary" onclick="triggerNotice('${item.transactionId}')">Send Notice</button></td>
          </tr>
        `).join('');
      }
    }

    // 4. Inventory Health
    const healthRes = await API.get('/api/admin/reports/inventory');
    const h = healthRes.data || {};
    document.getElementById('inv-total').innerText = h.totalCopies || 0;
    document.getElementById('inv-available').innerText = h.availableCopies || 0;
    document.getElementById('inv-issued').innerText = h.issuedCopies || 0;
    document.getElementById('inv-lost').innerText = h.lostCopies || 0;
    document.getElementById('inv-damaged').innerText = h.damagedCopies || 0;
    document.getElementById('inv-pct').innerText = h.availabilityPercentage || '0%';

    // 5. Fine Report
    const fineRes = await API.get('/api/admin/reports/fines');
    const f = fineRes.data || {};
    document.getElementById('fin-total').innerText = `$${(f.totalFines || 0).toFixed(2)}`;
    document.getElementById('fin-collected').innerText = `$${(f.paidFines || 0).toFixed(2)}`;
    document.getElementById('fin-unpaid').innerText = `$${(f.unpaidFines || 0).toFixed(2)}`;
    document.getElementById('fin-waived').innerText = `$${(f.waivedFines || 0).toFixed(2)}`;

  } catch (err) {
    console.error('Failed to load reports:', err);
  }
}

async function triggerNotice() {
  try {
    const res = await API.post('/api/notifications/scan', {});
    alert(`Overdue scanner executed!\n${res.data.notificationsGenerated} overdue notification record(s) created.`);
  } catch (err) {
    alert(err.message);
  }
}
