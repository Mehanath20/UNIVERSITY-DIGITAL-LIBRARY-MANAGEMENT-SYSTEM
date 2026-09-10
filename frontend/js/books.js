/**
 * Books Catalog & Operations Handler
 */

let currentPage = 1;
const pageSize = 12;

async function loadBooks(page = 1) {
  currentPage = page;
  const user = API.getUser();
  renderNavbar('books');

  const title = document.getElementById('search-title')?.value.trim() || '';
  const category = document.getElementById('search-category')?.value || '';
  const availableOnly = document.getElementById('filter-available')?.checked || false;

  let query = `/api/books/search?page=${page}&limit=${pageSize}`;
  if (title) query += `&title=${encodeURIComponent(title)}`;
  if (category) query += `&category=${encodeURIComponent(category)}`;
  if (availableOnly) query += `&available=true`;

  const container = document.getElementById('books-grid');
  if (!container) return;

  container.innerHTML = `<div class="col-12 text-center py-5"><div class="spinner-border text-primary" role="status"></div><p class="mt-2 text-muted">Searching catalog...</p></div>`;

  try {
    const res = await API.get(query);
    const books = res.data?.data || [];
    const pagination = res.data?.pagination || { total: 0, pages: 1 };

    document.getElementById('total-results-count').innerText = `${pagination.total} book(s) found`;

    if (books.length === 0) {
      container.innerHTML = `
        <div class="col-12 text-center py-5">
          <i class="bi bi-journal-x display-4 text-muted"></i>
          <h5 class="mt-3 text-secondary">No books matched your criteria</h5>
          <p class="text-muted small">Try broadening your search keywords or removing filters.</p>
        </div>
      `;
      renderPagination(pagination);
      return;
    }

    container.innerHTML = books.map(book => {
      const isAvailable = book.availableCopies > 0;
      const badgeClass = isAvailable ? 'badge-available' : 'badge-unavailable';
      const badgeText = isAvailable ? `${book.availableCopies} in stock` : 'Out of Stock';

      let actionBtn = '';
      if (user?.role === 'MEMBER') {
        if (isAvailable) {
          actionBtn = `<button class="btn btn-sm btn-success w-100" onclick="borrowBook('${book._id}', '${escapeQuotes(book.title)}')"><i class="bi bi-check-circle me-1"></i>Borrow Book</button>`;
        } else {
          actionBtn = `<button class="btn btn-sm btn-outline-warning w-100" onclick="placeHold('${book._id}', '${escapeQuotes(book.title)}')"><i class="bi bi-bookmark-plus me-1"></i>Place Hold</button>`;
        }
      } else if (user?.role === 'LIBRARIAN' || user?.role === 'ADMIN') {
        actionBtn = `
          <div class="d-flex gap-2">
            <button class="btn btn-sm btn-primary flex-grow-1" ${!isAvailable ? 'disabled' : ''} onclick="openIssueModal('${book._id}', '${escapeQuotes(book.title)}')">Issue Book</button>
            <a href="/pages/book-details.html?id=${book._id}" class="btn btn-sm btn-outline-secondary">Details</a>
          </div>
        `;
      } else {
        actionBtn = `<a href="/pages/login.html" class="btn btn-sm btn-outline-primary w-100">Sign in to Borrow</a>`;
      }

      return `
        <div class="col-md-6 col-lg-4 col-xl-3 mb-4">
          <div class="card h-100 shadow-sm border-0 stat-card">
            <div class="card-body d-flex flex-column">
              <div class="d-flex justify-content-between align-items-start mb-2">
                <span class="badge bg-light text-primary border">${book.category}</span>
                <span class="badge ${badgeClass}">${badgeText}</span>
              </div>
              <h5 class="card-title fs-6 fw-bold mb-1 text-dark text-truncate" title="${book.title}">${book.title}</h5>
              <p class="card-subtitle mb-2 text-muted small"><i class="bi bi-person me-1"></i>${book.author}</p>
              <p class="card-text text-muted small flex-grow-1" style="display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;">
                ${book.description || 'Academic curriculum text.'}
              </p>
              <div class="small text-muted mb-3">
                <div><strong>ISBN:</strong> <code>${book.isbn}</code></div>
                <div><strong>Copies:</strong> ${book.availableCopies} / ${book.totalCopies}</div>
              </div>
              <div class="mt-auto">
                ${actionBtn}
              </div>
            </div>
          </div>
        </div>
      `;
    }).join('');

    renderPagination(pagination);

  } catch (err) {
    container.innerHTML = `<div class="col-12 alert alert-danger">Error loading books: ${err.message}</div>`;
  }
}

async function borrowBook(bookId, title) {
  if (!confirm(`Borrow "${title}" now?`)) return;
  try {
    const result = await API.post('/api/transactions/borrow', { bookId });
    alert(`Book borrowed successfully!\nDue date: ${new Date(result.data.dueDate).toLocaleDateString()}`);
    window.location.href = '/pages/member-dashboard.html';
  } catch (err) {
    alert(`Could not borrow book: ${err.message}`);
  }
}

function escapeQuotes(value = '') {
  return String(value).replace(/\\/g, '\\\\').replace(/'/g, "\\'").replace(/\r?\n/g, ' ');
}

function renderPagination(pagination) {
  const container = document.getElementById('pagination-container');
  if (!container) return;

  if (pagination.pages <= 1) {
    container.innerHTML = '';
    return;
  }

  let items = '';
  for (let p = 1; p <= pagination.pages; p++) {
    items += `
      <li class="page-item ${p === pagination.page ? 'active' : ''}">
        <button class="page-link" onclick="loadBooks(${p})">${p}</button>
      </li>
    `;
  }

  container.innerHTML = `
    <nav>
      <ul class="pagination justify-content-center">
        <li class="page-item ${pagination.page <= 1 ? 'disabled' : ''}">
          <button class="page-link" onclick="loadBooks(${pagination.page - 1})">Previous</button>
        </li>
        ${items}
        <li class="page-item ${pagination.page >= pagination.pages ? 'disabled' : ''}">
          <button class="page-link" onclick="loadBooks(${pagination.page + 1})">Next</button>
        </li>
      </ul>
    </nav>
  `;
}

async function placeHold(bookId, bookTitle) {
  if (!confirm(`Confirm placing a reservation hold for "${bookTitle}"? You will be notified when a copy becomes available.`)) return;

  try {
    const res = await API.post('/api/holds', { bookId });
    alert(`Reservation placed! Your position in the queue is #${res.data.queuePosition}.`);
    loadBooks(currentPage);
  } catch (err) {
    alert(err.message);
  }
}

function openIssueModal(bookId, bookTitle) {
  document.getElementById('issue-book-id').value = bookId;
  document.getElementById('issue-book-title').value = bookTitle;
  const modal = new bootstrap.Modal(document.getElementById('issueBookModal'));
  modal.show();
}

async function submitIssueBook(e) {
  e.preventDefault();
  const bookId = document.getElementById('issue-book-id').value;
  const memberId = document.getElementById('issue-member-id').value.trim();
  const notes = document.getElementById('issue-notes')?.value || '';

  try {
    const res = await API.post('/api/transactions/issue', { bookId, memberId, notes });
    alert(`Book successfully issued!\nDue Date: ${new Date(res.data.dueDate).toLocaleDateString()}`);
    bootstrap.Modal.getInstance(document.getElementById('issueBookModal')).hide();
    loadBooks(currentPage);
  } catch (err) {
    alert(`Cannot issue book: ${err.message}`);
  }
}

async function submitCreateBook(e) {
  e.preventDefault();
  const payload = {
    title: document.getElementById('new-book-title').value.trim(),
    author: document.getElementById('new-book-author').value.trim(),
    isbn: document.getElementById('new-book-isbn').value.trim(),
    category: document.getElementById('new-book-category').value.trim(),
    description: document.getElementById('new-book-desc').value.trim(),
    publisher: document.getElementById('new-book-publisher').value.trim(),
    publicationYear: parseInt(document.getElementById('new-book-year').value, 10),
    totalCopies: parseInt(document.getElementById('new-book-copies').value, 10)
  };

  try {
    await API.post('/api/books', payload);
    alert('Book added to library catalog successfully!');
    bootstrap.Modal.getInstance(document.getElementById('newBookModal')).hide();
    loadBooks(1);
  } catch (err) {
    alert(`Failed to add book: ${err.message}`);
  }
}
