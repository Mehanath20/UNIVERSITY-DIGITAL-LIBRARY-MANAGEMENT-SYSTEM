/**
 * Authentication and Navigation Controller
 */

function checkAuth(allowedRoles = []) {
  const user = API.getUser();
  const token = API.getToken();

  if (!token || !user) {
    window.location.href = '/pages/login.html';
    return null;
  }

  if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
    alert(`Access Denied: Your account role '${user.role}' does not have access to this page.`);
    redirectToDashboard(user.role);
    return null;
  }

  return user;
}

function redirectToDashboard(role) {
  if (role === 'ADMIN') {
    window.location.href = '/pages/admin-dashboard.html';
  } else if (role === 'LIBRARIAN') {
    window.location.href = '/pages/librarian-dashboard.html';
  } else {
    window.location.href = '/pages/member-dashboard.html';
  }
}

function logout() {
  API.clearAuth();
  window.location.href = '/pages/login.html';
}

function renderNavbar(activePage = '') {
  const user = API.getUser();
  const navContainer = document.getElementById('navbar-container');
  if (!navContainer) return;

  let linksHtml = '';

  if (user) {
    if (user.role === 'MEMBER') {
      linksHtml = `
        <li class="nav-item"><a class="nav-link ${activePage === 'dashboard' ? 'active' : ''}" href="/pages/member-dashboard.html"><i class="bi bi-speedometer2 me-1"></i>Dashboard</a></li>
        <li class="nav-item"><a class="nav-link ${activePage === 'books' ? 'active' : ''}" href="/pages/books.html"><i class="bi bi-book me-1"></i>Books</a></li>
        <li class="nav-item"><a class="nav-link ${activePage === 'history' ? 'active' : ''}" href="/pages/borrowing-history.html"><i class="bi bi-clock-history me-1"></i>My Loans</a></li>
        <li class="nav-item"><a class="nav-link ${activePage === 'reservations' ? 'active' : ''}" href="/pages/reservations.html"><i class="bi bi-bookmark-check me-1"></i>Reservations</a></li>
        <li class="nav-item"><a class="nav-link ${activePage === 'fines' ? 'active' : ''}" href="/pages/fines.html"><i class="bi bi-cash-coin me-1"></i>Fines</a></li>
      `;
    } else if (user.role === 'LIBRARIAN') {
      linksHtml = `
        <li class="nav-item"><a class="nav-link ${activePage === 'dashboard' ? 'active' : ''}" href="/pages/librarian-dashboard.html"><i class="bi bi-speedometer2 me-1"></i>Dashboard</a></li>
        <li class="nav-item"><a class="nav-link ${activePage === 'books' ? 'active' : ''}" href="/pages/books.html"><i class="bi bi-book me-1"></i>Books</a></li>
        <li class="nav-item"><a class="nav-link ${activePage === 'inventory' ? 'active' : ''}" href="/pages/inventory.html"><i class="bi bi-box-seam me-1"></i>Inventory</a></li>
        <li class="nav-item"><a class="nav-link ${activePage === 'reservations' ? 'active' : ''}" href="/pages/reservations.html"><i class="bi bi-bookmark-check me-1"></i>Reservations</a></li>
        <li class="nav-item"><a class="nav-link ${activePage === 'fines' ? 'active' : ''}" href="/pages/fines.html"><i class="bi bi-cash-coin me-1"></i>Fines</a></li>
        <li class="nav-item"><a class="nav-link ${activePage === 'reports' ? 'active' : ''}" href="/pages/reports.html"><i class="bi bi-bar-chart-line me-1"></i>Reports</a></li>
      `;
    } else if (user.role === 'ADMIN') {
      linksHtml = `
        <li class="nav-item"><a class="nav-link ${activePage === 'dashboard' ? 'active' : ''}" href="/pages/admin-dashboard.html"><i class="bi bi-speedometer2 me-1"></i>Dashboard</a></li>
        <li class="nav-item"><a class="nav-link ${activePage === 'books' ? 'active' : ''}" href="/pages/books.html"><i class="bi bi-book me-1"></i>Books</a></li>
        <li class="nav-item"><a class="nav-link ${activePage === 'inventory' ? 'active' : ''}" href="/pages/inventory.html"><i class="bi bi-box-seam me-1"></i>Inventory</a></li>
        <li class="nav-item"><a class="nav-link ${activePage === 'reports' ? 'active' : ''}" href="/pages/reports.html"><i class="bi bi-bar-chart-line me-1"></i>Reports</a></li>
      `;
    }
  } else {
    linksHtml = `
      <li class="nav-item"><a class="nav-link ${activePage === 'home' ? 'active' : ''}" href="/index.html">Home</a></li>
      <li class="nav-item"><a class="nav-link ${activePage === 'books' ? 'active' : ''}" href="/pages/books.html">Catalog</a></li>
      <li class="nav-item"><a class="nav-link ${activePage === 'login' ? 'active' : ''}" href="/pages/login.html">Sign In</a></li>
      <li class="nav-item"><a class="nav-link ${activePage === 'register' ? 'active' : ''}" href="/pages/register.html">Register</a></li>
    `;
  }

  const userControls = user ? `
    <div class="d-flex align-items-center gap-3">
      <div class="text-end d-none d-md-block">
        <div class="fw-semibold text-white small">${user.name}</div>
        <span class="badge bg-light text-dark text-uppercase" style="font-size: 0.65rem;">${user.role} ${user.memberType ? `• ${user.memberType}` : ''}</span>
      </div>
      <button onclick="logout()" class="btn btn-outline-light btn-sm"><i class="bi bi-box-arrow-right me-1"></i>Logout</button>
    </div>
  ` : `
    <div class="d-flex gap-2">
      <a href="/pages/login.html" class="btn btn-outline-light btn-sm">Sign In</a>
      <a href="/pages/register.html" class="btn btn-warning btn-sm">Register</a>
    </div>
  `;

  navContainer.innerHTML = `
    <nav class="navbar navbar-expand-lg navbar-dark" style="background-color: var(--primary);">
      <div class="container-fluid px-4">
        <a class="navbar-brand" href="/index.html">
          <i class="bi bi-journal-bookmark-fill text-warning"></i>
          <span>DIGITAL LIBRARY</span>
          <span class="brand-badge">UNIVERSITY</span>
        </a>
        <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#dlmsNav">
          <span class="navbar-toggler-icon"></span>
        </button>
        <div class="collapse navbar-collapse" id="dlmsNav">
          <ul class="navbar-nav me-auto mb-2 mb-lg-0">
            ${linksHtml}
          </ul>
          ${userControls}
        </div>
      </div>
    </nav>
  `;
}
