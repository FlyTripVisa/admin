/* =========================================================
   FlyTripVisa Admin – Dashboard Module
   Sidebar nav, metrics, tables, filters, modal CRUD, charts.
   Uses seeded mock data stored in localStorage so the UI
   is fully interactive out of the box.
   ========================================================= */

(function () {
  "use strict";

  const STORE_KEY = "ftv_applications";

  /* ==================== MOCK DATA SEED ==================== */
  const COUNTRIES = [
    "UAE / Dubai", "Turkey", "Malaysia", "Singapore", "Thailand", "Vietnam",
    "China", "India", "Sri Lanka", "Egypt", "Kenya", "Saudi Arabia",
    "Qatar", "Japan", "South Korea", "UK", "Schengen EU", "USA", "Canada",
    "Australia", "New Zealand", "Indonesia", "Philippines", "Laos", "Nepal"
  ];

  const STATUSES = ["approved", "pending", "rejected"];
  const STATUS_WEIGHTS = [0.6, 0.28, 0.12];

  const FIRST = [
    "Ahmed", "Fatima", "Mohammed", "Aisha", "Wei", "Li", "Hassan", "Sara",
    "Raj", "Priya", "Chen", "Yuki", "Omar", "Layla", "Khalid", "Nadia",
    "Arjun", "Mei", "Tariq", "Zara", "Daniel", "Sofia", "Ali", "Maya",
    "Yusuf", "Hana", "Ben", "Lina", "Karim", "Jana", "Theo", "Amira"
  ];

  const LAST = [
    "Khan", "Rahman", "Wang", "Zhang", "Hassan", "Ali", "Patel", "Sharma",
    "Tanaka", "Sato", "Mahmoud", "Iqbal", "Silva", "Costa", "Garcia",
    "Müller", "Dubois", "Lefevre", "Brown", "Wilson", "Taylor", "Anderson",
    "Lee", "Park", "Nguyen", "Tran", "Lim", "Goh", "Wong", "Chan"
  ];

  function seededRandom(seed) {
    const x = Math.sin(seed * 999 + 137) * 10000;
    return x - Math.floor(x);
  }

  function pick(arr, seed) {
    return arr[Math.floor(seededRandom(seed) * arr.length)];
  }

  function pad(n) {
    return n < 10 ? "0" + n : "" + n;
  }

  function generateApplications(count) {
    const list = [];
    const now = Date.now();
    for (let i = 0; i < count; i++) {
      const seed = i + 1;
      const r = seededRandom(seed);
      let status;
      const w = seededRandom(seed + 0.5);
      let acc = 0;
      for (let s = 0; s < STATUSES.length; s++) {
        acc += STATUS_WEIGHTS[s];
        if (w <= acc) {
          status = STATUSES[s];
          break;
        }
      }
      const daysAgo = Math.floor(seededRandom(seed + 0.2) * 30);
      const date = new Date(now - daysAgo * 86400000);
      const idNum = 10000 + i;
      list.push({
        id: "FTV-" + idNum,
        applicant: pick(FIRST, seed) + " " + pick(LAST, seed + 0.7),
        country: pick(COUNTRIES, seed + 0.3),
        type: pick(["Tourist", "Business", "Transit", "Student", "Work"], seed + 0.9),
        status: status,
        amount: (Math.floor(seededRandom(seed + 0.4) * 480) + 45) * 1,
        date: date.toISOString().slice(0, 10),
        email: pick(FIRST, seed).toLowerCase() + "." + pick(LAST, seed).toLowerCase() + "@" +
          pick(["gmail.com", "outlook.com", "yahoo.com", "icloud.com"], seed + 0.6)
      });
    }
    return list;
  }

  function getApplications() {
    let data = null;
    try {
      data = JSON.parse(localStorage.getItem(STORE_KEY));
    } catch (e) {
      data = null;
    }
    if (!Array.isArray(data) || data.length === 0) {
      data = generateApplications(48);
      localStorage.setItem(STORE_KEY, JSON.stringify(data));
    }
    return data;
  }

  function saveApplications(data) {
    localStorage.setItem(STORE_KEY, JSON.stringify(data));
  }

  /* ==================== STATE ==================== */
  const state = {
    applications: [],
    currentPage: 1,
    perPage: 8,
    filterStatus: "all",
    filterCountry: "all",
    search: "",
    activeSection: "overview"
  };

  /* ==================== DOM HELPERS ==================== */
  const $ = (sel, ctx) => (ctx || document).querySelector(sel);
  const $$ = (sel, ctx) => Array.prototype.slice.call((ctx || document).querySelectorAll(sel));

  function escapeHtml(str) {
    return String(str || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  /* ==================== AUTH GUARD ==================== */
  function guard() {
    const session = window.FTV && window.FTV.Auth
      ? window.FTV.Auth.requireAuth("login.html")
      : null;

    if (!session) {
      // Stop further execution if redirecting
      return null;
    }

    // Populate user chip
    const nameEl = $("#user-name");
    const roleEl = $("#user-role");
    const avatarEl = $("#user-avatar");
    const welcomeEl = $("#welcome-name");

    if (nameEl) nameEl.textContent = session.username;
    if (roleEl) roleEl.textContent = (session.role || "admin") + " · " + session.email;
    if (avatarEl) avatarEl.textContent = session.avatar || "?";
    if (welcomeEl) welcomeEl.textContent = session.username;

    return session;
  }

  /* ==================== SIDEBAR ==================== */
  function bindSidebar() {
    const toggle = $("#menu-toggle");
    const sidebar = $("#sidebar");
    const overlay = $("#sidebar-overlay");
    const closeBtn = $("#sidebar-close");

    function close() {
      sidebar.classList.remove("show");
      overlay.classList.remove("show");
    }

    toggle.addEventListener("click", () => {
      sidebar.classList.toggle("show");
      overlay.classList.toggle("show");
    });

    closeBtn.addEventListener("click", close);
    overlay.addEventListener("click", close);

    // Navigation
    $$(".nav-item").forEach(item => {
      item.addEventListener("click", () => {
        const target = item.getAttribute("data-section");
        if (!target) return;
        switchSection(target);
        if (window.innerWidth < 1024) close();
      });
    });

    // Logout
    const logoutBtn = $("#logout-btn");
    if (logoutBtn) {
      logoutBtn.addEventListener("click", () => {
        if (window.FTV && window.FTV.Auth) window.FTV.Auth.logout();
        window.location.href = "login.html";
      });
    }

    // Listen for logout from other tabs
    window.addEventListener("ftv:logout", () => {
      window.location.href = "login.html";
    });
  }

  function switchSection(id) {
    state.activeSection = id;
    $$(".content-section").forEach(s => s.classList.remove("active"));
    $$(".nav-item").forEach(n => n.classList.remove("active"));

    const section = $("#section-" + id);
    const nav = $(".nav-item[data-section='" + id + "']");

    if (section) section.classList.add("active");
    if (nav) nav.classList.add("active");

    // Update page header
    const titleMap = {
      overview: "Dashboard Overview",
      applications: "Visa Applications",
      users: "User Management",
      analytics: "Analytics",
      settings: "Settings"
    };
    const titleEl = $("#page-title");
    const subEl = $("#page-sub");
    if (titleEl) titleEl.textContent = titleMap[id] || "Dashboard";
    if (subEl) {
      const map = {
        overview: "Welcome back! Here's what's happening today.",
        applications: "Review, approve, or reject visa applications.",
        users: "Manage registered admin accounts.",
        analytics: "Performance trends across the platform.",
        settings: "Configure your admin preferences."
      };
      subEl.textContent = map[id] || "";
    }

    window.scrollTo(0, 0);
  }

  /* ==================== METRICS ==================== */
  function computeMetrics() {
    const apps = state.applications;
    const total = apps.length;
    const approved = apps.filter(a => a.status === "approved").length;
    const pending = apps.filter(a => a.status === "pending").length;
    const revenue = apps
      .filter(a => a.status === "approved")
      .reduce((sum, a) => sum + (a.amount || 0), 0);

    return {
      total: total,
      approved: approved,
      pending: pending,
      rejected: total - approved - pending,
      revenue: revenue
    };
  }

  function renderMetrics() {
    const m = computeMetrics();
    setMetric("metric-total", m.total);
    setMetric("metric-approved", m.approved);
    setMetric("metric-pending", m.pending);
    setMetric("metric-revenue", "$" + m.revenue.toLocaleString());
  }

  function setMetric(id, value) {
    const el = document.getElementById(id);
    if (el) el.textContent = value;
  }

  /* ==================== APPLICATIONS TABLE ==================== */
  function filteredApplications() {
    let list = state.applications;

    if (state.filterStatus !== "all") {
      list = list.filter(a => a.status === state.filterStatus);
    }
    if (state.filterCountry !== "all") {
      list = list.filter(a => a.country === state.filterCountry);
    }
    if (state.search) {
      const q = state.search.toLowerCase();
      list = list.filter(a =>
        (a.applicant || "").toLowerCase().includes(q) ||
        (a.id || "").toLowerCase().includes(q) ||
        (a.country || "").toLowerCase().includes(q) ||
        (a.email || "").toLowerCase().includes(q)
      );
    }
    return list;
  }

  function renderApplications() {
    const list = filteredApplications();
    const totalPages = Math.max(1, Math.ceil(list.length / state.perPage));

    if (state.currentPage > totalPages) state.currentPage = totalPages;

    const start = (state.currentPage - 1) * state.perPage;
    const slice = list.slice(start, start + state.perPage);

    const tbody = $("#applications-tbody");
    if (!tbody) return;

    if (slice.length === 0) {
      tbody.innerHTML =
        '<tr><td colspan="8"><div class="empty-state">' +
        '<i class="fas fa-folder-open"></i><p>No applications match your filters.</p></div></td></tr>';
    } else {
      tbody.innerHTML = slice.map(app => {
        const statusClass = "status-" + app.status;
        const statusLabel = app.status.charAt(0).toUpperCase() + app.status.slice(1);
        return (
          '<tr data-id="' + escapeHtml(app.id) + '">' +
          '<td class="font-mono">' + escapeHtml(app.id) + '</td>' +
          '<td><strong>' + escapeHtml(app.applicant) + '</strong><br>' +
          '<span class="font-mono">' + escapeHtml(app.email) + '</span></td>' +
          '<td>' + escapeHtml(app.country) + '</td>' +
          '<td>' + escapeHtml(app.type) + '</td>' +
          '<td><span class="status ' + statusClass + '">' +
          '<span class="status-dot"></span>' + statusLabel + '</span></td>' +
          '<td class="font-mono">$' + app.amount + '</td>' +
          '<td class="font-mono">' + escapeHtml(app.date) + '</td>' +
          '<td><div class="row-actions">' +
          '<button class="icon-btn" title="View" onclick="FTV.Dashboard.viewApp(\'' + app.id + '\')"><i class="fas fa-eye"></i></button>' +
          '<button class="icon-btn" title="Approve" onclick="FTV.Dashboard.setStatus(\'' + app.id + '\',\'approved\')"><i class="fas fa-check"></i></button>' +
          '<button class="icon-btn danger" title="Reject" onclick="FTV.Dashboard.setStatus(\'' + app.id + '\',\'rejected\')"><i class="fas fa-times"></i></button>' +
          '</div></td></tr>'
        );
      }).join("");
    }

    renderPagination(list.length, totalPages);
    updateCounts();
  }

  function renderPagination(total, totalPages) {
    const info = $("#pagination-info");
    if (info) {
      info.textContent =
        "Showing " + Math.min(total, (state.currentPage - 1) * state.perPage + 1) +
        "–" + Math.min(total, state.currentPage * state.perPage) +
        " of " + total;
    }

    const btns = $("#page-btns");
    if (!btns) return;

    let html =
      '<button class="page-btn" ' + (state.currentPage === 1 ? "disabled" : "") +
      ' onclick="FTV.Dashboard.goToPage(' + (state.currentPage - 1) + ')"><i class="fas fa-chevron-left"></i></button>';

    const maxBtns = 5;
    let start = Math.max(1, state.currentPage - Math.floor(maxBtns / 2));
    let end = Math.min(totalPages, start + maxBtns - 1);
    start = Math.max(1, end - maxBtns + 1);

    for (let p = start; p <= end; p++) {
      html +=
        '<button class="page-btn ' + (p === state.currentPage ? "active" : "") +
        '" onclick="FTV.Dashboard.goToPage(' + p + ')">' + p + '</button>';
    }

    html +=
      '<button class="page-btn" ' + (state.currentPage === totalPages ? "disabled" : "") +
      ' onclick="FTV.Dashboard.goToPage(' + (state.currentPage + 1) + ')"><i class="fas fa-chevron-right"></i></button>';

    btns.innerHTML = html;
  }

  function updateCounts() {
    const list = filteredApplications();
    const total = list.length;
    const pending = list.filter(a => a.status === "pending").length;
    const approved = list.filter(a => a.status === "approved").length;

    const el = $("#filter-count");
    if (el) el.textContent = total + " total · " + pending + " pending · " + approved + " approved";
  }

  function bindToolbar() {
    const searchInput = $("#app-search");
    if (searchInput) {
      searchInput.addEventListener("input", e => {
        state.search = e.target.value;
        state.currentPage = 1;
        renderApplications();
      });
    }

    const statusFilter = $("#filter-status");
    if (statusFilter) {
      statusFilter.addEventListener("change", e => {
        state.filterStatus = e.target.value;
        state.currentPage = 1;
        renderApplications();
      });
    }

    const countryFilter = $("#filter-country");
    if (countryFilter) {
      // Populate countries
      const countries = Array.from(new Set(state.applications.map(a => a.country))).sort();
      countries.forEach(c => {
        const opt = document.createElement("option");
        opt.value = c;
        opt.textContent = c;
        countryFilter.appendChild(opt);
      });
      countryFilter.addEventListener("change", e => {
        state.filterCountry = e.target.value;
        state.currentPage = 1;
        renderApplications();
      });
    }
  }

  /* ==================== APPLICATION CRUD ==================== */
  function findApp(id) {
    return state.applications.find(a => a.id === id);
  }

  function setStatus(id, status) {
    const app = findApp(id);
    if (!app) return;
    app.status = status;
    saveApplications(state.applications);
    renderApplications();
    renderMetrics();
    if (window.FTV && window.FTV.toast) {
      window.FTV.toast("Application " + id + " marked as " + status + ".", "success");
    }
  }

  function viewApp(id) {
    const app = findApp(id);
    if (!app) return;

    const statusClass = "status-" + app.status;
    const statusLabel = app.status.charAt(0).toUpperCase() + app.status.slice(1);

    const body = $("#modal-body");
    if (!body) return;

    body.innerHTML =
      '<div style="display:flex;flex-direction:column;gap:14px;">' +
      '<div style="display:flex;align-items:center;gap:14px;">' +
      '<div class="avatar" style="width:52px;height:52px;font-size:18px;">' +
      escapeHtml(app.applicant.charAt(0)) + '</div>' +
      '<div><div style="font-size:16px;font-weight:700;color:#fff;">' +
      escapeHtml(app.applicant) + '</div>' +
      '<div class="font-mono" style="font-size:11.5px;">' + escapeHtml(app.email) + '</div></div>' +
      '</div>' +
      '<div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;">' +
      detailField("Reference", app.id) +
      detailField("Country", app.country) +
      detailField("Visa Type", app.type) +
      detailField("Amount", "$" + app.amount) +
      detailField("Submitted", app.date) +
      '<div><div class="form-label">Status</div><span class="status ' + statusClass +
      '"><span class="status-dot"></span>' + statusLabel + '</span></div>' +
      '</div></div>';

    openModal();
  }

  function detailField(label, value) {
    return (
      '<div><div class="form-label">' + label + '</div>' +
      '<div style="font-size:13.5px;color:#fff;font-weight:500;">' +
      escapeHtml(value) + '</div></div>'
    );
  }

  /* ==================== MODAL ==================== */
  function openModal() {
    const overlay = $("#modal-overlay");
    if (overlay) overlay.classList.add("show");
  }

  function closeModal() {
    const overlay = $("#modal-overlay");
    if (overlay) overlay.classList.remove("show");
  }

  function bindModal() {
    const closeBtn = $("#modal-close");
    const cancelBtn = $("#modal-cancel");
    const overlay = $("#modal-overlay");

    if (closeBtn) closeBtn.addEventListener("click", closeModal);
    if (cancelBtn) cancelBtn.addEventListener("click", closeModal);
    if (overlay) {
      overlay.addEventListener("click", e => {
        if (e.target === overlay) closeModal();
      });
    }
  }

  /* ==================== USERS ==================== */
  function renderUsers() {
    const users = window.FTV && window.FTV.Auth ? getStoredUsers() : [];
    const container = $("#users-list");
    if (!container) return;

    if (users.length === 0) {
      container.innerHTML =
        '<div class="empty-state"><i class="fas fa-users"></i><p>No admin users found.</p></div>';
      return;
    }

    container.innerHTML = users.map(u => {
      const initial = (u.username || "?").charAt(0).toUpperCase();
      const joined = u.createdAt ? u.createdAt.slice(0, 10) : "—";
      return (
        '<div class="user-row">' +
        '<div class="avatar">' + initial + '</div>' +
        '<div class="user-detail">' +
        '<div class="name">' + escapeHtml(u.username) +
        ' <span class="tag">' + escapeHtml(u.role || "admin") + '</span></div>' +
        '<div class="email">' + escapeHtml(u.email) + '</div>' +
        '</div>' +
        '<div style="text-align:right;"><div class="font-mono" style="font-size:11px;">' +
        'Joined ' + joined + '</div>' +
        '<div class="font-mono" style="font-size:11px;color:var(--text-muted);">' +
        (u.lastLogin ? 'Last ' + u.lastLogin.slice(0, 10) : 'Never logged in') +
        '</div></div></div>'
      );
    }).join("");
  }

  function getStoredUsers() {
    try {
      const raw = JSON.parse(localStorage.getItem("ftv_users")) || {};
      return Object.keys(raw).map(k => raw[k]);
    } catch (e) {
      return [];
    }
  }

  /* ==================== ANALYTICS CHART ==================== */
  function renderChart() {
    const canvas = $("#analytics-chart");
    if (!canvas || !window.Chart) return;

    // Aggregate last 7 days of approved applications
    const days = 7;
    const labels = [];
    const data = [];
    const today = new Date();

    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(today.getTime() - i * 86400000);
      const key = d.toISOString().slice(5, 10);
      labels.push(key);
      const seedBase = i * 13;
      // Deterministic-ish count based on day
      const count = Math.floor(
        state.applications.filter(a => a.status === "approved").length / days
      ) + (Math.floor(Math.sin(seedBase) * 5) + 3);
      data.push(Math.max(0, count));
    }

    new window.Chart(canvas, {
      type: "line",
      data: {
        labels: labels,
        datasets: [{
          label: "Approved Applications",
          data: data,
          borderColor: "#07c160",
          backgroundColor: "rgba(7,193,96,0.12)",
          borderWidth: 2,
          fill: true,
          tension: 0.4,
          pointBackgroundColor: "#07c160",
          pointBorderColor: "#000",
          pointBorderWidth: 2,
          pointRadius: 4
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            labels: { color: "#a1a1a1", font: { size: 11 } }
          }
        },
        scales: {
          x: {
            ticks: { color: "#71717a", font: { size: 11 } },
            grid: { color: "rgba(255,255,255,0.04)" }
          },
          y: {
            ticks: { color: "#71717a", font: { size: 11 } },
            grid: { color: "rgba(255,255,255,0.04)" },
            beginAtZero: true
          }
        }
      }
    });
  }

  /* ==================== REFRESH ==================== */
  function refreshAll() {
    state.applications = getApplications();
    renderMetrics();
    renderApplications();
    renderUsers();
  }

  /* ==================== INIT ==================== */
  function init() {
    const session = guard();
    if (!session) return; // redirected

    state.applications = getApplications();

    bindSidebar();
    bindToolbar();
    bindModal();

    refreshAll();

    // Default section
    switchSection(state.activeSection);

    // Expose for inline handlers
    window.FTV = window.FTV || {};
    window.FTV.Dashboard = {
      goToPage: function (p) {
        state.currentPage = p;
        renderApplications();
      },
      setStatus: setStatus,
      viewApp: viewApp,
      refresh: refreshAll
    };

    // Chart.js may load after; retry once
    if (window.Chart) {
      renderChart();
    } else {
      setTimeout(renderChart, 400);
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
