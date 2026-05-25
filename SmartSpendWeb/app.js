const USERS_KEY = "smartspend.users.v1";
const SESSION_KEY = "smartspend.session.v1";
const EXPENSES_KEY_PREFIX = "smartspend.expenses.v2.";

const categories = [
  "Groceries",
  "Eating Out",
  "Coffee",
  "Rent",
  "Car",
  "Gas",
  "Shopping",
  "Subscriptions",
  "Gym",
  "Family",
  "Medical",
  "Travel",
  "Other",
];

const paymentMethods = ["Credit Card", "Debit Card", "Cash", "Apple Pay", "Other"];

const categoryMeta = {
  Groceries: { icon: "🛒", color: "#16a34a" },
  "Eating Out": { icon: "🍽️", color: "#f97316" },
  Coffee: { icon: "☕", color: "#92400e" },
  Rent: { icon: "🏠", color: "#4f46e5" },
  Car: { icon: "🚗", color: "#0891b2" },
  Gas: { icon: "⛽", color: "#0f766e" },
  Shopping: { icon: "🛍️", color: "#db2777" },
  Subscriptions: { icon: "🔁", color: "#7c3aed" },
  Gym: { icon: "🏋️", color: "#dc2626" },
  Family: { icon: "👨‍👩‍👧", color: "#0284c7" },
  Medical: { icon: "🏥", color: "#2563eb" },
  Travel: { icon: "✈️", color: "#ca8a04" },
  Other: { icon: "✨", color: "#64748b" },
};

const paymentMeta = {
  "Credit Card": "💳",
  "Debit Card": "🏦",
  Cash: "💵",
  "Apple Pay": "📱",
  Other: "💰",
};

const viewMeta = {
  dashboard: { title: "Dashboard", kicker: "Overview" },
  add: { title: "Add Expense", kicker: "Quick capture" },
  expenses: { title: "Expenses", kicker: "Transactions" },
  analytics: { title: "Analytics", kicker: "Insights" },
  budgets: { title: "Budgets", kicker: "Planning" },
  advisor: { title: "Savings Advisor", kicker: "AI-style guidance" },
  reports: { title: "Reports", kicker: "Monthly review" },
  profile: { title: "Profile", kicker: "Account" },
  settings: { title: "Settings", kicker: "Preferences" },
};

const chartColors = [
  "#2563eb",
  "#16a34a",
  "#f97316",
  "#7c3aed",
  "#0f766e",
  "#dc2626",
  "#0891b2",
  "#ca8a04",
  "#db2777",
  "#4f46e5",
  "#65a30d",
  "#ea580c",
  "#64748b",
];

let currentUser = null;
let expenses = [];
let currentView = "dashboard";
let historyFilter = "This Month";
let expenseSearch = "";
let expenseSort = "Newest";
let editingExpenseId = null;
let toastTimer;

const moneyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
});

const dateFormatter = new Intl.DateTimeFormat(undefined, {
  month: "short",
  day: "numeric",
  year: "numeric",
});

const monthFormatter = new Intl.DateTimeFormat(undefined, { month: "short" });

const elements = {
  authScreen: document.querySelector("#auth-screen"),
  appShell: document.querySelector("#app-shell"),
  sidebar: document.querySelector("#sidebar"),
  mobileBackdrop: document.querySelector("#mobile-backdrop"),
  mobileMenuButton: document.querySelector("#mobile-menu-button"),
  profileButton: document.querySelector("#profile-button"),
  profileDropdown: document.querySelector("#profile-dropdown"),
  authTabs: document.querySelectorAll(".auth-tab"),
  loginForm: document.querySelector("#login-form"),
  signupForm: document.querySelector("#signup-form"),
  loginMessage: document.querySelector("#login-message"),
  signupMessage: document.querySelector("#signup-message"),
  loginUsername: document.querySelector("#login-username"),
  loginPassword: document.querySelector("#login-password"),
  signupName: document.querySelector("#signup-name"),
  signupUsername: document.querySelector("#signup-username"),
  signupPassword: document.querySelector("#signup-password"),
  topbarKicker: document.querySelector("#topbar-kicker"),
  topbarTitle: document.querySelector("#topbar-title"),
  userDisplay: document.querySelector("#user-display"),
  welcomeName: document.querySelector("#welcome-name"),
  topbarAvatar: document.querySelector("#topbar-avatar"),
  sidebarAvatar: document.querySelector("#sidebar-avatar"),
  sidebarUserName: document.querySelector("#sidebar-user-name"),
  sidebarUserMeta: document.querySelector("#sidebar-user-meta"),
  views: document.querySelectorAll(".view"),
  navItems: document.querySelectorAll(".nav-item[data-view]"),
  dashboardHero: document.querySelector("#dashboard-hero"),
  dashboardBreakdown: document.querySelector("#dashboard-breakdown"),
  summaryGrid: document.querySelector("#summary-grid"),
  recentExpenses: document.querySelector("#recent-expenses"),
  categoryPreview: document.querySelector("#category-preview"),
  recentCategoryGrid: document.querySelector("#recent-category-grid"),
  form: document.querySelector("#expense-form"),
  expenseSubmitButton: document.querySelector("#expense-submit-button"),
  formMessage: document.querySelector("#form-message"),
  amount: document.querySelector("#amount"),
  date: document.querySelector("#date"),
  category: document.querySelector("#category"),
  paymentMethod: document.querySelector("#paymentMethod"),
  note: document.querySelector("#note"),
  resetForm: document.querySelector("#reset-form"),
  addSampleData: document.querySelector("#add-sample-data"),
  filterChips: document.querySelectorAll(".filter-chip"),
  expenseSearch: document.querySelector("#expense-search"),
  expenseSort: document.querySelector("#expense-sort"),
  historyList: document.querySelector("#history-list"),
  historyTotal: document.querySelector("#history-total"),
  analyticsInsights: document.querySelector("#analytics-insights"),
  budgetsContent: document.querySelector("#budgets-content"),
  advisorSummary: document.querySelector("#advisor-summary"),
  advisorList: document.querySelector("#advisor-list"),
  reportsContent: document.querySelector("#reports-content"),
  profileContent: document.querySelector("#profile-content"),
  settingsContent: document.querySelector("#settings-content"),
  toast: document.querySelector("#toast"),
};

initializeApp();

function initializeApp() {
  fillSelect(elements.category, categories, categoryLabel);
  fillSelect(elements.paymentMethod, paymentMethods, paymentLabel);
  elements.date.value = toInputDate(new Date());

  elements.authTabs.forEach((tab) => {
    tab.addEventListener("click", () => showAuthMode(tab.dataset.authMode));
  });

  elements.loginForm.addEventListener("submit", handleLogin);
  elements.signupForm.addEventListener("submit", handleSignup);
  elements.form.addEventListener("submit", saveExpense);
  elements.resetForm.addEventListener("click", resetForm);
  elements.addSampleData.addEventListener("click", addSampleData);

  elements.navItems.forEach((item) => {
    item.addEventListener("click", () => showView(item.dataset.view));
  });

  elements.filterChips.forEach((chip) => {
    chip.addEventListener("click", () => {
      historyFilter = chip.dataset.filter;
      elements.filterChips.forEach((item) => item.classList.toggle("is-active", item === chip));
      renderAll();
    });
  });

  elements.expenseSearch.addEventListener("input", () => {
    expenseSearch = elements.expenseSearch.value.trim().toLowerCase();
    renderExpenses();
  });

  elements.expenseSort.addEventListener("change", () => {
    expenseSort = elements.expenseSort.value;
    renderExpenses();
  });

  elements.mobileMenuButton.addEventListener("click", openMobileMenu);
  elements.mobileBackdrop.addEventListener("click", closeMobileMenu);
  elements.profileButton.addEventListener("click", toggleProfileDropdown);
  document.addEventListener("click", closeProfileDropdownOnOutsideClick);
  window.addEventListener("resize", debounce(drawVisibleCharts, 140));

  if ("serviceWorker" in navigator && location.protocol !== "file:") {
    navigator.serviceWorker.register("service-worker.js").catch(() => {});
  }

  bindGlobalActions();
  renderQuickCategories();
  restoreSession();
}

function fillSelect(select, options, labeler) {
  select.innerHTML = options
    .map((option) => `<option value="${escapeHtml(option)}">${escapeHtml(labeler(option))}</option>`)
    .join("");
}

function categoryLabel(category) {
  return `${categoryTheme(category).icon} ${category}`;
}

function paymentLabel(method) {
  return `${paymentMeta[method] || "💰"} ${method}`;
}

function showView(viewName) {
  if (!currentUser) {
    showAuthScreen();
    return;
  }

  const targetView = viewName === "history" ? "expenses" : viewName;
  currentView = targetView;
  const meta = viewMeta[targetView] || viewMeta.dashboard;
  elements.topbarTitle.textContent = meta.title;
  elements.topbarKicker.textContent = meta.kicker;

  elements.views.forEach((view) => {
    view.classList.toggle("is-active", view.id === targetView);
  });

  elements.navItems.forEach((item) => {
    item.classList.toggle("is-active", item.dataset.view === targetView);
  });

  closeMobileMenu();
  closeProfileDropdown();
  renderAll();
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function showAuthMode(mode) {
  const isLogin = mode === "login";
  elements.loginForm.hidden = !isLogin;
  elements.signupForm.hidden = isLogin;
  elements.authTabs.forEach((tab) => {
    tab.classList.toggle("is-active", tab.dataset.authMode === mode);
  });
  setAuthMessage(elements.loginMessage, "");
  setAuthMessage(elements.signupMessage, "");
}

async function handleLogin(event) {
  event.preventDefault();
  const username = normalizeUsername(elements.loginUsername.value);
  const password = elements.loginPassword.value;
  const user = loadUsers().find((item) => item.username === username);

  if (!user) {
    setAuthMessage(elements.loginMessage, "Username or password is incorrect.", true);
    return;
  }

  const passwordHash = await hashPassword(password, user.passwordSalt);
  if (passwordHash !== user.passwordHash) {
    setAuthMessage(elements.loginMessage, "Username or password is incorrect.", true);
    return;
  }

  signIn(user);
}

async function handleSignup(event) {
  event.preventDefault();
  const name = elements.signupName.value.trim();
  const username = normalizeUsername(elements.signupUsername.value);
  const password = elements.signupPassword.value;

  if (name.length < 2) {
    setAuthMessage(elements.signupMessage, "Enter your name.", true);
    return;
  }

  if (username.length < 3) {
    setAuthMessage(elements.signupMessage, "Choose a username with at least 3 characters.", true);
    return;
  }

  if (password.length < 6) {
    setAuthMessage(elements.signupMessage, "Choose a password with at least 6 characters.", true);
    return;
  }

  const users = loadUsers();
  if (users.some((user) => user.username === username)) {
    setAuthMessage(elements.signupMessage, "That username already exists on this device.", true);
    return;
  }

  const passwordSalt = createSalt();
  const user = {
    id: createId(),
    name,
    username,
    passwordSalt,
    passwordHash: await hashPassword(password, passwordSalt),
    createdAt: new Date().toISOString(),
  };

  saveUsers([...users, user]);
  signIn(user);
}

function signIn(user) {
  currentUser = user;
  localStorage.setItem(SESSION_KEY, user.username);
  expenses = loadExpenses();
  populateUserChrome();
  elements.authScreen.hidden = true;
  elements.appShell.hidden = false;
  elements.loginForm.reset();
  elements.signupForm.reset();
  showToast(`Welcome back, ${user.name}.`);
  showView("dashboard");
}

function logout() {
  localStorage.removeItem(SESSION_KEY);
  currentUser = null;
  expenses = [];
  resetForm();
  closeMobileMenu();
  closeProfileDropdown();
  showAuthScreen();
}

function restoreSession() {
  const sessionUsername = localStorage.getItem(SESSION_KEY);
  const user = loadUsers().find((item) => item.username === sessionUsername);

  if (user) {
    signIn(user);
  } else {
    showAuthScreen();
  }
}

function showAuthScreen() {
  elements.authScreen.hidden = false;
  elements.appShell.hidden = true;
  showAuthMode("login");
  elements.loginUsername.focus();
}

function populateUserChrome() {
  const initial = currentUser.name.slice(0, 1).toUpperCase();
  elements.userDisplay.textContent = currentUser.name;
  elements.welcomeName.textContent = currentUser.name.split(" ")[0];
  elements.topbarAvatar.textContent = initial;
  elements.sidebarAvatar.textContent = initial;
  elements.sidebarUserName.textContent = currentUser.name;
  elements.sidebarUserMeta.textContent = `@${currentUser.username}`;
}

function saveExpense(event) {
  event.preventDefault();

  if (!currentUser) {
    showAuthScreen();
    return;
  }

  const amount = parseAmount(elements.amount.value);
  if (!amount) {
    setFormMessage("Enter an amount greater than 0.", true);
    return;
  }

  const payload = {
    amount,
    category: elements.category.value,
    note: elements.note.value.trim(),
    paymentMethod: elements.paymentMethod.value,
    type: getSelectedType(),
    date: parseDateInput(elements.date.value).toISOString(),
  };

  const wasEditing = Boolean(editingExpenseId);

  if (wasEditing) {
    expenses = expenses.map((expense) =>
      expense.id === editingExpenseId ? { ...expense, ...payload } : expense
    );
    showToast("Expense updated.");
  } else {
    expenses = [
      {
        id: createId(),
        ...payload,
        createdAt: new Date().toISOString(),
      },
      ...expenses,
    ];
    showToast("Expense saved locally.");
  }

  expenses = expenses.sort(sortByNewest);
  saveExpenses();
  resetForm();
  renderAll();
  showView(wasEditing ? "expenses" : "dashboard");
}

function parseAmount(value) {
  const cleaned = value.replace(/[$,\s]/g, "");
  const amount = Number(cleaned);
  return Number.isFinite(amount) && amount > 0 ? amount : null;
}

function getSelectedType() {
  return new FormData(elements.form).get("type") || "Need";
}

function resetForm() {
  elements.form.reset();
  elements.date.value = toInputDate(new Date());
  editingExpenseId = null;
  elements.expenseSubmitButton.textContent = "Save Expense";
  elements.formMessage.textContent = "";
  elements.formMessage.classList.remove("is-error");
}

function setFormMessage(message, isError = false) {
  elements.formMessage.textContent = message;
  elements.formMessage.classList.toggle("is-error", isError);
}

function renderAll() {
  if (!currentUser) {
    return;
  }

  expenses = expenses.sort(sortByNewest);
  renderDashboard();
  renderExpenses();
  renderAnalytics();
  renderBudgets();
  renderAdvisor();
  renderReports();
  renderProfile();
  renderSettings();
  renderQuickCategories();
  bindGlobalActions();
  drawVisibleCharts();
}

function renderDashboard() {
  const stats = getSpendingStats();
  elements.addSampleData.hidden = expenses.length > 0;

  elements.dashboardHero.innerHTML = `
    <div class="hero-content">
      <div>
        <span class="hero-kicker">This month</span>
        <strong>${currency(stats.monthTotal)}</strong>
        <p>${stats.monthExpenses.length} expense${stats.monthExpenses.length === 1 ? "" : "s"} tracked so far</p>
      </div>
      <div class="hero-illustration" aria-hidden="true">
        <span class="hero-ring"></span>
        <span class="hero-bubble hero-bubble-one">💸</span>
        <span class="hero-bubble hero-bubble-two">🚀</span>
      </div>
    </div>
    <div class="hero-stats">
      <div>
        <span>Top category</span>
        <strong>${stats.topCategory ? `${escapeHtml(stats.topCategory.category)} - ${currency(stats.topCategory.amount)}` : "No category yet"}</strong>
      </div>
      <div>
        <span>Budget health</span>
        <strong>${stats.budgetHealthLabel}</strong>
      </div>
      <div>
        <span>Advisor savings</span>
        <strong>${stats.possibleSavings > 0 ? currency(stats.possibleSavings) : "No flags"}</strong>
      </div>
    </div>
  `;

  elements.dashboardBreakdown.innerHTML = renderNeedWantBreakdown(stats);

  const cards = [
    statCard("Today", currency(stats.todayTotal), stats.todayTotal > 0 ? "Already tracked" : "No spending yet", "☀️", "orange"),
    statCard("Weekly Spending", currency(stats.weekTotal), "Current week total", "📅", "blue"),
    statCard("Monthly Spending", currency(stats.monthTotal), "Current month total", "💳", "purple"),
    statCard("Yearly Spending", currency(stats.yearTotal), "Year to date", "📈", "green"),
    statCard("Top Category", stats.topCategory?.category || "No data", stats.topCategory ? currency(stats.topCategory.amount) : "Add an expense", stats.topCategory ? categoryTheme(stats.topCategory.category).icon : "✨", "teal"),
    statCard("Budget Health", stats.budgetHealthLabel, `${stats.budgetUsed}% of $3,000 guide`, "🚀", "green"),
    statCard("Possible Savings", currency(stats.possibleSavings), stats.possibleSavings > 0 ? "Advisor found opportunities" : "No obvious flags", "💡", "yellow"),
    statCard("Need vs Want", `${stats.wantShare}% wants`, `${currency(stats.wantTotal)} flexible spend`, "⚖️", "blue"),
  ];
  elements.summaryGrid.innerHTML = cards.join("");

  const recent = expenses.slice(0, 5);
  elements.recentExpenses.innerHTML = recent.length
    ? recent.map((expense) => renderExpenseRow(expense, false)).join("")
    : renderEmptyState("No expenses yet 🧾", "Add your first expense to start tracking.", "Start with one quick entry.");

  elements.categoryPreview.innerHTML = renderCategoryPreview(stats.categoryTotals);
}

function renderNeedWantBreakdown(stats) {
  return `
    <div class="section-header compact">
      <div>
        <h2>Need vs Want</h2>
        <p>Monthly spending quality</p>
      </div>
      <span class="pill">${stats.wantShare}% wants</span>
    </div>
    <div class="split-bars">
      ${renderSplitBar("Need", stats.needTotal, stats.needShare, "need")}
      ${renderSplitBar("Want", stats.wantTotal, stats.wantShare, "want")}
    </div>
    <div class="micro-insight">Budget looking ${stats.budgetUsed < 75 ? "strong 🚀" : "tight ⚠️"}</div>
  `;
}

function renderSplitBar(label, amount, share, type) {
  return `
    <div class="split-row">
      <div>
        <strong>${label}</strong>
        <span>${currency(amount)}</span>
      </div>
      <div class="progress-track">
        <span class="${type}" style="width: ${Math.max(2, share)}%"></span>
      </div>
    </div>
  `;
}

function statCard(title, value, note, icon, tone) {
  return `
    <article class="summary-card tone-${tone}">
      <div class="card-icon">${icon}</div>
      <div>
        <span>${escapeHtml(title)}</span>
        <strong>${escapeHtml(value)}</strong>
        <small>${escapeHtml(note)}</small>
      </div>
    </article>
  `;
}

function renderCategoryPreview(totals) {
  const visibleTotals = totals.slice(0, 5);
  const max = Math.max(...visibleTotals.map((item) => item.amount), 1);
  return `
    <div class="section-header">
      <div>
        <h2>Top Categories</h2>
        <p>Your biggest spending groups this month</p>
      </div>
      <button class="text-action" data-view-link="analytics" type="button">Charts</button>
    </div>
    <div class="category-list">
      ${
        visibleTotals.length
          ? visibleTotals.map((item) => renderCategoryPreviewRow(item, max)).join("")
          : renderEmptyState("No categories yet ✨", "Your category breakdown will appear here.", "Add sample data or save an expense.")
      }
    </div>
  `;
}

function renderCategoryPreviewRow(item, max) {
  const width = Math.max(3, Math.round((item.amount / max) * 100));
  const theme = categoryTheme(item.category);
  return `
    <div class="category-row">
      <div class="category-row-main">
        ${renderCategoryIcon(item.category)}
        <div>
          <strong>${escapeHtml(item.category)}</strong>
          <span>${currency(item.amount)}</span>
        </div>
      </div>
      <div class="category-track">
        <span style="width: ${width}%; background: ${theme.color}"></span>
      </div>
    </div>
  `;
}

function renderExpenses() {
  const filtered = getFilteredExpenses();
  elements.historyTotal.textContent = currency(total(filtered));

  if (!filtered.length) {
    elements.historyList.innerHTML = renderEmptyState(
      "No expenses found 🧾",
      "Try another filter or add a new transaction.",
      "Your expense table will appear here."
    );
    return;
  }

  elements.historyList.innerHTML = `
    <div class="expense-table">
      <div class="expense-table-head">
        <span>Expense</span>
        <span>Payment</span>
        <span>Type</span>
        <span>Amount</span>
        <span>Actions</span>
      </div>
      ${filtered.map((expense) => renderExpenseRow(expense, true)).join("")}
    </div>
  `;

  elements.historyList.querySelectorAll("[data-delete-id]").forEach((button) => {
    button.onclick = () => deleteExpense(button.dataset.deleteId);
  });

  elements.historyList.querySelectorAll("[data-edit-id]").forEach((button) => {
    button.onclick = () => editExpense(button.dataset.editId);
  });
}

function getFilteredExpenses() {
  const interval = historyFilter === "All" ? null : currentInterval(filterToUnit(historyFilter));
  let filtered = interval ? filterByInterval(expenses, interval) : [...expenses];

  if (expenseSearch) {
    filtered = filtered.filter((expense) => {
      const haystack = [
        expense.category,
        expense.note,
        expense.paymentMethod,
        expense.type,
        formatExpenseDate(expense.date),
      ]
        .join(" ")
        .toLowerCase();
      return haystack.includes(expenseSearch);
    });
  }

  return filtered.sort((a, b) => {
    if (expenseSort === "Oldest") return new Date(a.date) - new Date(b.date);
    if (expenseSort === "Amount High") return b.amount - a.amount;
    if (expenseSort === "Amount Low") return a.amount - b.amount;
    return new Date(b.date) - new Date(a.date);
  });
}

function filterToUnit(filter) {
  return {
    Today: "day",
    "This Week": "week",
    "This Month": "month",
    "This Year": "year",
  }[filter] || "month";
}

function renderExpenseRow(expense, includeActions = false) {
  const actionButtons = includeActions
    ? `
      <div class="expense-actions">
        <button class="ghost-action" data-edit-id="${expense.id}" type="button">Edit</button>
        <button class="danger-action" data-delete-id="${expense.id}" type="button">Delete</button>
      </div>
    `
    : "";

  return `
    <article class="expense-row">
      <div class="expense-main">
        ${renderCategoryIcon(expense.category)}
        <div>
          <strong>${escapeHtml(expense.category)}</strong>
          <span>${escapeHtml(expense.note || "No note")} · ${escapeHtml(formatExpenseDate(expense.date))}</span>
        </div>
      </div>
      <div>${paymentBadge(expense.paymentMethod)}</div>
      <div>${needWantBadge(expense.type)}</div>
      <strong class="expense-amount">${currency(expense.amount)}</strong>
      ${actionButtons}
    </article>
  `;
}

function editExpense(id) {
  const expense = expenses.find((item) => item.id === id);
  if (!expense) return;
  editingExpenseId = id;
  elements.amount.value = expense.amount.toFixed(2);
  elements.category.value = expense.category;
  elements.paymentMethod.value = expense.paymentMethod;
  elements.date.value = toInputDate(new Date(expense.date));
  elements.note.value = expense.note;
  elements.form.querySelector(`input[name="type"][value="${expense.type}"]`).checked = true;
  elements.expenseSubmitButton.textContent = "Update Expense";
  setFormMessage("Editing this expense. Save to update it.", false);
  showView("add");
}

function deleteExpense(id) {
  expenses = expenses.filter((expense) => expense.id !== id);
  saveExpenses();
  showToast("Expense deleted.");
  renderAll();
}

function renderAnalytics() {
  const stats = getSpendingStats();
  const highestDay = dailyTotals(stats.monthExpenses).reduce(
    (winner, item) => (item.amount > winner.amount ? item : winner),
    { date: new Date(), amount: 0 }
  );
  elements.analyticsInsights.innerHTML = [
    statCard("Average Daily Spend", currency(stats.averageDailySpend), "Current month", "📊", "blue"),
    statCard("Highest Spend Day", currency(highestDay.amount), formatExpenseDate(highestDay.date), "🔥", "orange"),
    statCard("Biggest Category", stats.topCategory?.category || "No data", stats.topCategory ? currency(stats.topCategory.amount) : "Add data", stats.topCategory ? categoryTheme(stats.topCategory.category).icon : "✨", "purple"),
    statCard("Saving Opportunity", currency(stats.possibleSavings), "Advisor estimate", "💡", "green"),
  ].join("");
}

function renderBudgets() {
  const stats = getSpendingStats();
  elements.budgetsContent.innerHTML = `
    ${budgetCard("Monthly guide", "$3,000.00", `${stats.budgetUsed}% used`, stats.budgetUsed, "🚀")}
    ${budgetCard("Needs budget", "$2,100.00", currency(stats.needTotal), Math.min(100, Math.round((stats.needTotal / 2100) * 100)), "🏠")}
    ${budgetCard("Wants budget", "$900.00", currency(stats.wantTotal), Math.min(100, Math.round((stats.wantTotal / 900) * 100)), "✨")}
    <section class="panel setting-card">
      <h2>Budget notes</h2>
      <p>Budget settings are visual placeholders for the MVP. Real editable budgets can be added without changing the expense database.</p>
    </section>
  `;
}

function budgetCard(title, limit, value, progress, icon) {
  return `
    <section class="panel budget-card">
      <div class="card-icon">${icon}</div>
      <span>${escapeHtml(title)}</span>
      <strong>${escapeHtml(limit)}</strong>
      <p>${escapeHtml(value)}</p>
      <div class="progress-track"><span style="width: ${Math.min(100, Math.max(3, progress))}%"></span></div>
    </section>
  `;
}

function renderAdvisor() {
  const suggestions = getSuggestions(expenses);
  const savings = suggestions.reduce((sum, item) => sum + item.estimatedSavings, 0);
  elements.advisorSummary.innerHTML = `
    <section class="advisor-hero">
      <div>
        <span class="hero-kicker">Potential savings 💡</span>
        <strong>${currency(savings)}</strong>
        <p>${suggestions.length ? `${suggestions.length} recommendation${suggestions.length === 1 ? "" : "s"} ready` : "No savings flags this month"}</p>
      </div>
      <div class="advisor-art" aria-hidden="true">💎</div>
    </section>
  `;
  elements.advisorList.innerHTML = suggestions.length
    ? suggestions.map(renderSuggestion).join("")
    : renderEmptyState("Looking good 🚀", "Your spending is within the current advisor rules.", "Keep tracking daily for smarter suggestions.");
}

function renderSuggestion(suggestion) {
  return `
    <article class="advisor-card impact-${suggestion.impact.toLowerCase()}">
      ${renderCategoryIcon(suggestion.category)}
      <div>
        <div class="advisor-card-header">
          <strong>${escapeHtml(suggestion.title)}</strong>
          <span class="impact-badge">${escapeHtml(suggestion.impact)} impact</span>
        </div>
        <p>${escapeHtml(suggestion.message)}</p>
        <div class="suggestion-action">
          <span>${escapeHtml(suggestion.action)}</span>
          <strong>${currency(suggestion.estimatedSavings)}</strong>
        </div>
        <div class="progress-track"><span style="width: ${suggestion.progress}%"></span></div>
      </div>
    </article>
  `;
}

function renderReports() {
  const stats = getSpendingStats();
  elements.reportsContent.innerHTML = `
    ${statCard("Month Total", currency(stats.monthTotal), `${stats.monthExpenses.length} transactions`, "📑", "blue")}
    ${statCard("Top Category", stats.topCategory?.category || "No data", stats.topCategory ? currency(stats.topCategory.amount) : "Add expenses", stats.topCategory ? categoryTheme(stats.topCategory.category).icon : "✨", "purple")}
    ${statCard("Needs", currency(stats.needTotal), `${stats.needShare}% of total`, "🏠", "green")}
    ${statCard("Wants", currency(stats.wantTotal), `${stats.wantShare}% of total`, "✨", "orange")}
    <section class="panel report-card">
      <h2>Executive summary</h2>
      <p>${stats.monthTotal ? `You spent ${currency(stats.monthTotal)} this month. ${stats.topCategory?.category || "Your top category"} is the biggest driver, and SmartSpend sees ${currency(stats.possibleSavings)} in potential monthly savings.` : "Add expenses to generate a monthly report."}</p>
    </section>
  `;
}

function renderProfile() {
  const memberSince = currentUser.createdAt ? formatExpenseDate(currentUser.createdAt) : "Today";
  elements.profileContent.innerHTML = `
    <div class="profile-layout">
      <section class="panel profile-card">
        <div class="profile-avatar" aria-hidden="true">${currentUser.name.slice(0, 1).toUpperCase()}</div>
        <h2>${escapeHtml(currentUser.name)}</h2>
        <p>@${escapeHtml(currentUser.username)}</p>
        <button class="secondary-action" data-logout type="button">Log out</button>
      </section>
      <section class="panel settings-stack">
        ${settingRow("Full name", currentUser.name, "👤")}
        ${settingRow("Email", "Not connected for local MVP", "✉️")}
        ${settingRow("Member since", memberSince, "📅")}
        ${settingRow("Preferred currency", "USD", "💵")}
        ${settingRow("Financial goal", "Spend smarter every week", "🎯")}
        ${settingRow("Default payment", "Credit Card", "💳")}
        ${settingRow("Default category", "Groceries", "🛒")}
      </section>
    </div>
  `;
}

function renderSettings() {
  elements.settingsContent.innerHTML = `
    <div class="settings-grid">
      <section class="panel settings-stack">
        <h2>Account settings</h2>
        ${toggleRow("Local account active", true)}
        ${toggleRow("Require login on this browser", true)}
        ${settingRow("Privacy", "Data stays in this browser", "🔒")}
      </section>
      <section class="panel settings-stack">
        <h2>Appearance</h2>
        ${toggleRow("Premium light theme", true)}
        ${toggleRow("Subtle motion", true)}
        ${settingRow("Currency", "USD", "💵")}
      </section>
      <section class="panel settings-stack">
        <h2>Data</h2>
        ${settingRow("Export data", "Coming soon", "📤")}
        ${settingRow("Delete account", "Placeholder", "⚠️")}
        <button class="danger-action wide" data-logout type="button">Log out</button>
      </section>
    </div>
  `;
}

function settingRow(label, value, icon) {
  return `
    <div class="setting-row">
      <span aria-hidden="true">${icon}</span>
      <div>
        <strong>${escapeHtml(label)}</strong>
        <p>${escapeHtml(value)}</p>
      </div>
    </div>
  `;
}

function toggleRow(label, checked) {
  return `
    <label class="toggle-row">
      <span>${escapeHtml(label)}</span>
      <input type="checkbox" ${checked ? "checked" : ""} />
    </label>
  `;
}

function renderQuickCategories() {
  if (!elements.recentCategoryGrid) return;
  const top = categoryTotals(expenses).slice(0, 6);
  const source = top.length ? top.map((item) => item.category) : categories.slice(0, 6);
  elements.recentCategoryGrid.innerHTML = source
    .map((category) => {
      const theme = categoryTheme(category);
      return `
        <button class="quick-category" data-category="${escapeHtml(category)}" type="button">
          <span>${theme.icon}</span>
          <strong>${escapeHtml(category)}</strong>
        </button>
      `;
    })
    .join("");

  elements.recentCategoryGrid.querySelectorAll("[data-category]").forEach((button) => {
    button.onclick = () => {
      elements.category.value = button.dataset.category;
      showToast(`${button.dataset.category} selected.`);
    };
  });
}

function renderEmptyState(title, message, hint = "") {
  return `
    <div class="empty-state">
      <span class="empty-illustration" aria-hidden="true">✨</span>
      <strong>${escapeHtml(title)}</strong>
      <span>${escapeHtml(message)}</span>
      ${hint ? `<small>${escapeHtml(hint)}</small>` : ""}
    </div>
  `;
}

function renderCategoryIcon(category) {
  const theme = categoryTheme(category);
  return `
    <div
      class="expense-icon"
      style="--category-color: ${theme.color}; --category-bg: ${theme.background}"
      aria-hidden="true"
    >
      ${theme.icon}
    </div>
  `;
}

function categoryTheme(category) {
  const meta = categoryMeta[category] || categoryMeta.Other;
  return {
    color: meta.color,
    background: `${meta.color}18`,
    icon: meta.icon,
  };
}

function paymentBadge(method) {
  return `<span class="payment-badge">${paymentMeta[method] || "💰"} ${escapeHtml(method)}</span>`;
}

function needWantBadge(type) {
  const badgeClass = type === "Need" ? "need" : "want";
  return `<span class="badge ${badgeClass}">${escapeHtml(type)}</span>`;
}

function getSuggestions(allExpenses) {
  const monthExpenses = filterByInterval(allExpenses, currentInterval("month"));
  const monthlyTotal = total(monthExpenses);
  const eatingOutTotal = total(monthExpenses.filter((expense) => expense.category === "Eating Out"));
  const coffeeTotal = total(monthExpenses.filter((expense) => expense.category === "Coffee"));
  const subscriptionsTotal = total(monthExpenses.filter((expense) => expense.category === "Subscriptions"));
  const wantTotal = total(monthExpenses.filter((expense) => expense.type === "Want"));
  const results = [];

  if (eatingOutTotal > 250) {
    results.push(suggestion("Eating Out", "Watch Eating Out ⚠️", `You spent ${currency(eatingOutTotal)} on Eating Out this month. Reducing this by 25% could save around ${currency(eatingOutTotal * 0.25)}.`, eatingOutTotal * 0.25, "Book two home-cooked nights this week.", "High", 86));
  }

  if (coffeeTotal > 75) {
    results.push(suggestion("Coffee", "Coffee optimization ☕", `Coffee is at ${currency(coffeeTotal)} this month. Replacing a few cafe visits could quickly lower this.`, coffeeTotal - 75, "Set a weekly coffee cap and track it.", "Medium", 62));
  }

  if (subscriptionsTotal > 80) {
    results.push(suggestion("Subscriptions", "Subscription audit 🔁", `Subscriptions are at ${currency(subscriptionsTotal)} this month. Review plans that are not used weekly.`, subscriptionsTotal - 80, "Cancel or pause one unused service.", "Medium", 58));
  }

  if (monthlyTotal > 0 && wantTotal / monthlyTotal > 0.4) {
    const targetWantTotal = monthlyTotal * 0.4;
    results.push(suggestion("Shopping", "Want spending balance ✨", "Want spending is more than 40% of this month's total.", wantTotal - targetWantTotal, "Move one want purchase to next month.", "High", 78));
  }

  return results;
}

function suggestion(category, title, message, estimatedSavings, action, impact, progress) {
  return {
    category,
    title,
    message,
    estimatedSavings: Math.max(0, estimatedSavings),
    action,
    impact,
    progress,
  };
}

function getSpendingStats() {
  const intervals = {
    today: currentInterval("day"),
    week: currentInterval("week"),
    month: currentInterval("month"),
    year: currentInterval("year"),
  };
  const monthExpenses = filterByInterval(expenses, intervals.month);
  const monthTotal = total(monthExpenses);
  const needTotal = total(monthExpenses.filter((expense) => expense.type === "Need"));
  const wantTotal = total(monthExpenses.filter((expense) => expense.type === "Want"));
  const categoryData = categoryTotals(monthExpenses);
  const possibleSavings = getSuggestions(expenses).reduce((sum, item) => sum + item.estimatedSavings, 0);
  const budgetUsed = Math.min(100, Math.round((monthTotal / 3000) * 100));
  const daysSoFar = new Date().getDate();
  return {
    todayTotal: total(filterByInterval(expenses, intervals.today)),
    weekTotal: total(filterByInterval(expenses, intervals.week)),
    monthTotal,
    yearTotal: total(filterByInterval(expenses, intervals.year)),
    monthExpenses,
    needTotal,
    wantTotal,
    needShare: monthTotal ? Math.round((needTotal / monthTotal) * 100) : 0,
    wantShare: monthTotal ? Math.round((wantTotal / monthTotal) * 100) : 0,
    averageDailySpend: monthTotal / Math.max(1, daysSoFar),
    categoryTotals: categoryData,
    topCategory: categoryData[0],
    possibleSavings,
    budgetUsed,
    budgetHealthLabel: budgetUsed < 70 ? "Strong 🚀" : budgetUsed < 90 ? "Watch closely" : "Over target",
  };
}

function drawVisibleCharts() {
  if (!currentUser) return;
  if (currentView === "dashboard") {
    const monthExpenses = filterByInterval(expenses, currentInterval("month"));
    drawLineChart(document.querySelector("#dashboard-trend-chart"), dailyTotals(monthExpenses));
    drawHorizontalBarChart(document.querySelector("#dashboard-category-chart"), categoryTotals(monthExpenses));
  }

  if (currentView === "analytics") {
    const monthExpenses = filterByInterval(expenses, currentInterval("month"));
    drawHorizontalBarChart(document.querySelector("#category-chart"), categoryTotals(monthExpenses));
    drawLineChart(document.querySelector("#daily-chart"), dailyTotals(monthExpenses));
    drawDonutChart(document.querySelector("#type-chart"), typeTotals(monthExpenses));
    drawVerticalBarChart(document.querySelector("#monthly-chart"), monthlyTotals(expenses));
  }
}

function drawHorizontalBarChart(canvas, data) {
  if (!canvas) return;
  const ctx = setupCanvas(canvas);
  const width = canvas.clientWidth || 320;
  const height = canvas.clientHeight || 240;
  clearCanvas(ctx, width, height);

  if (!data.length) {
    drawNoData(ctx, width, height, "No category data yet");
    return;
  }

  const max = Math.max(...data.map((item) => item.amount), 1);
  const rowHeight = Math.min(34, (height - 34) / data.length);
  const labelWidth = Math.min(132, width * 0.35);

  ctx.font = "12px system-ui";
  data.slice(0, 7).forEach((item, index) => {
    const y = 22 + index * rowHeight;
    const barWidth = ((width - labelWidth - 28) * item.amount) / max;
    ctx.fillStyle = "#697386";
    ctx.fillText(trimLabel(`${categoryTheme(item.category).icon} ${item.category}`, 16), 0, y + 12);
    ctx.fillStyle = categoryTheme(item.category).color;
    roundRect(ctx, labelWidth, y, Math.max(4, barWidth), 18, 7);
    ctx.fill();
    const valueText = currency(item.amount);
    const valueWidth = ctx.measureText(valueText).width;
    const outsideX = labelWidth + barWidth + 8;
    ctx.fillStyle = outsideX + valueWidth <= width ? "#172033" : "#ffffff";
    ctx.textAlign = outsideX + valueWidth <= width ? "left" : "right";
    ctx.fillText(valueText, outsideX + valueWidth <= width ? outsideX : labelWidth + barWidth - 8, y + 13);
    ctx.textAlign = "left";
  });
}

function drawLineChart(canvas, data) {
  if (!canvas) return;
  const ctx = setupCanvas(canvas);
  const width = canvas.clientWidth || 320;
  const height = canvas.clientHeight || 240;
  clearCanvas(ctx, width, height);
  const max = Math.max(...data.map((item) => item.amount), 1);
  const padding = { top: 18, right: 12, bottom: 34, left: 44 };
  const plotWidth = width - padding.left - padding.right;
  const plotHeight = height - padding.top - padding.bottom;

  drawAxes(ctx, width, height, padding);
  ctx.beginPath();
  data.forEach((item, index) => {
    const x = padding.left + (plotWidth * index) / Math.max(1, data.length - 1);
    const y = padding.top + plotHeight - (plotHeight * item.amount) / max;
    if (index === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  });
  ctx.strokeStyle = "#2563eb";
  ctx.lineWidth = 3;
  ctx.stroke();
  ctx.fillStyle = "#697386";
  ctx.font = "12px system-ui";
  ctx.fillText(currency(max), 0, padding.top + 4);
  ctx.fillText("1", padding.left, height - 8);
  ctx.fillText(String(data.length), width - 26, height - 8);
}

function drawDonutChart(canvas, data) {
  if (!canvas) return;
  const ctx = setupCanvas(canvas);
  const width = canvas.clientWidth || 320;
  const height = canvas.clientHeight || 240;
  clearCanvas(ctx, width, height);
  const filtered = data.filter((item) => item.amount > 0);
  const sum = total(filtered);

  if (!sum) {
    drawNoData(ctx, width, height, "No need/want data yet");
    return;
  }

  const radius = Math.min(width, height) * 0.29;
  const centerX = width * 0.38;
  const centerY = height * 0.5;
  let start = -Math.PI / 2;

  filtered.forEach((item) => {
    const angle = (item.amount / sum) * Math.PI * 2;
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, start, start + angle);
    ctx.arc(centerX, centerY, radius * 0.58, start + angle, start, true);
    ctx.closePath();
    ctx.fillStyle = item.type === "Need" ? "#16a34a" : "#f97316";
    ctx.fill();
    start += angle;
  });

  ctx.fillStyle = "#172033";
  ctx.font = "700 14px system-ui";
  ctx.fillText(currency(sum), centerX - radius * 0.58, centerY + 5);
  filtered.forEach((item, index) => {
    const x = width * 0.7;
    const y = centerY - 24 + index * 34;
    ctx.fillStyle = item.type === "Need" ? "#16a34a" : "#f97316";
    roundRect(ctx, x, y - 11, 16, 16, 5);
    ctx.fill();
    ctx.fillStyle = "#172033";
    ctx.font = "13px system-ui";
    ctx.fillText(`${item.type} ${currency(item.amount)}`, x + 24, y + 2);
  });
}

function drawVerticalBarChart(canvas, data) {
  if (!canvas) return;
  const ctx = setupCanvas(canvas);
  const width = canvas.clientWidth || 320;
  const height = canvas.clientHeight || 240;
  clearCanvas(ctx, width, height);
  const max = Math.max(...data.map((item) => item.amount), 1);
  const padding = { top: 18, right: 12, bottom: 34, left: 44 };
  const plotWidth = width - padding.left - padding.right;
  const plotHeight = height - padding.top - padding.bottom;
  const gap = 6;
  const barWidth = Math.max(8, (plotWidth - gap * (data.length - 1)) / data.length);

  drawAxes(ctx, width, height, padding);
  data.forEach((item, index) => {
    const barHeight = (plotHeight * item.amount) / max;
    const x = padding.left + index * (barWidth + gap);
    const y = padding.top + plotHeight - barHeight;
    ctx.fillStyle = chartColors[index % chartColors.length];
    roundRect(ctx, x, y, barWidth, Math.max(2, barHeight), 6);
    ctx.fill();
    if (index % 2 === 0) {
      ctx.fillStyle = "#697386";
      ctx.font = "11px system-ui";
      ctx.fillText(monthFormatter.format(item.date), x - 1, height - 8);
    }
  });
  ctx.fillStyle = "#697386";
  ctx.font = "12px system-ui";
  ctx.fillText(currency(max), 0, padding.top + 4);
}

function setupCanvas(canvas) {
  const ratio = window.devicePixelRatio || 1;
  const width = canvas.clientWidth || canvas.parentElement?.clientWidth || 320;
  const height = Number(canvas.getAttribute("height")) || 260;
  canvas.width = width * ratio;
  canvas.height = height * ratio;
  canvas.style.height = `${height}px`;
  const ctx = canvas.getContext("2d");
  ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
  return ctx;
}

function clearCanvas(ctx, width, height) {
  ctx.clearRect(0, 0, width, height);
}

function drawNoData(ctx, width, height, message) {
  ctx.fillStyle = "#697386";
  ctx.font = "600 14px system-ui";
  ctx.textAlign = "center";
  ctx.fillText(message, width / 2, height / 2);
  ctx.textAlign = "left";
}

function drawAxes(ctx, width, height, padding) {
  ctx.strokeStyle = "#dbe3ee";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(padding.left, padding.top);
  ctx.lineTo(padding.left, height - padding.bottom);
  ctx.lineTo(width - padding.right, height - padding.bottom);
  ctx.stroke();
}

function roundRect(ctx, x, y, width, height, radius) {
  const safeRadius = Math.min(radius, width / 2, height / 2);
  ctx.beginPath();
  ctx.moveTo(x + safeRadius, y);
  ctx.arcTo(x + width, y, x + width, y + height, safeRadius);
  ctx.arcTo(x + width, y + height, x, y + height, safeRadius);
  ctx.arcTo(x, y + height, x, y, safeRadius);
  ctx.arcTo(x, y, x + width, y, safeRadius);
  ctx.closePath();
}

function categoryTotals(source) {
  const map = new Map();
  source.forEach((expense) => {
    map.set(expense.category, (map.get(expense.category) || 0) + expense.amount);
  });
  return [...map.entries()]
    .map(([category, amount]) => ({ category, amount }))
    .sort((a, b) => b.amount - a.amount);
}

function dailyTotals(source) {
  const now = new Date();
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  return Array.from({ length: daysInMonth }, (_, index) => {
    const date = new Date(now.getFullYear(), now.getMonth(), index + 1);
    const amount = source
      .filter((expense) => isSameDay(new Date(expense.date), date))
      .reduce((sum, expense) => sum + expense.amount, 0);
    return { date, amount };
  });
}

function typeTotals(source) {
  return [
    { type: "Need", amount: total(source.filter((expense) => expense.type === "Need")) },
    { type: "Want", amount: total(source.filter((expense) => expense.type === "Want")) },
  ];
}

function monthlyTotals(source) {
  const now = new Date();
  return Array.from({ length: 12 }, (_, month) => {
    const date = new Date(now.getFullYear(), month, 1);
    const amount = source
      .filter((expense) => {
        const expenseDate = new Date(expense.date);
        return expenseDate.getFullYear() === now.getFullYear() && expenseDate.getMonth() === month;
      })
      .reduce((sum, expense) => sum + expense.amount, 0);
    return { date, amount };
  });
}

function total(source) {
  return source.reduce((sum, expense) => sum + expense.amount, 0);
}

function filterByInterval(source, interval) {
  return source.filter((expense) => {
    const date = new Date(expense.date);
    return date >= interval.start && date < interval.end;
  });
}

function currentInterval(unit) {
  const now = new Date();
  if (unit === "day") {
    const start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    return { start, end: new Date(start.getFullYear(), start.getMonth(), start.getDate() + 1) };
  }
  if (unit === "week") {
    const start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - now.getDay());
    return { start, end: new Date(start.getFullYear(), start.getMonth(), start.getDate() + 7) };
  }
  if (unit === "month") {
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    return { start, end: new Date(now.getFullYear(), now.getMonth() + 1, 1) };
  }
  const start = new Date(now.getFullYear(), 0, 1);
  return { start, end: new Date(now.getFullYear() + 1, 0, 1) };
}

function addSampleData() {
  if (!currentUser) {
    showAuthScreen();
    return;
  }

  const now = new Date();
  const samples = [
    sampleExpense(68.45, "Groceries", "Weekly groceries", "Debit Card", "Need", now),
    sampleExpense(42.8, "Eating Out", "Dinner", "Credit Card", "Want", addDays(now, -1)),
    sampleExpense(18.9, "Coffee", "Coffee with Sam", "Apple Pay", "Want", addDays(now, -2)),
    sampleExpense(130, "Subscriptions", "Streaming and apps", "Credit Card", "Want", addDays(now, -4)),
    sampleExpense(1600, "Rent", "Monthly rent", "Debit Card", "Need", addDays(now, -9)),
    sampleExpense(72.1, "Gas", "Fill up", "Credit Card", "Need", addDays(now, -14)),
    sampleExpense(110, "Shopping", "Clothes", "Credit Card", "Want", addDays(now, -18)),
  ];

  expenses = [...samples, ...expenses].sort(sortByNewest);
  saveExpenses();
  showToast("Sample data added.");
  renderAll();
}

function sampleExpense(amount, category, note, paymentMethod, type, date) {
  return {
    id: createId(),
    amount,
    category,
    note,
    paymentMethod,
    type,
    date: date.toISOString(),
    createdAt: new Date().toISOString(),
  };
}

function loadExpenses() {
  if (!currentUser) return [];
  try {
    const stored = JSON.parse(localStorage.getItem(expenseStorageKey()) || "[]");
    return Array.isArray(stored) ? stored : [];
  } catch {
    return [];
  }
}

function saveExpenses() {
  if (!currentUser) return;
  localStorage.setItem(expenseStorageKey(), JSON.stringify(expenses));
}

function expenseStorageKey() {
  return `${EXPENSES_KEY_PREFIX}${currentUser.username}`;
}

function loadUsers() {
  try {
    const stored = JSON.parse(localStorage.getItem(USERS_KEY) || "[]");
    return Array.isArray(stored) ? stored : [];
  } catch {
    return [];
  }
}

function saveUsers(users) {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

function normalizeUsername(value) {
  return value.trim().toLowerCase();
}

function createSalt() {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return [...bytes].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

async function hashPassword(password, salt) {
  if (!crypto.subtle) {
    return fallbackHash(`${salt}:${password}`);
  }
  const input = new TextEncoder().encode(`${salt}:${password}`);
  const digest = await crypto.subtle.digest("SHA-256", input);
  return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

function createId() {
  return crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`;
}

function fallbackHash(value) {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return String(hash >>> 0);
}

function sortByNewest(a, b) {
  return new Date(b.date) - new Date(a.date);
}

function currency(value) {
  return moneyFormatter.format(value || 0);
}

function formatExpenseDate(value) {
  return dateFormatter.format(new Date(value));
}

function toInputDate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function parseDateInput(value) {
  return value ? new Date(`${value}T12:00:00`) : new Date();
}

function addDays(date, days) {
  const copy = new Date(date);
  copy.setDate(copy.getDate() + days);
  return copy;
}

function isSameDay(left, right) {
  return (
    left.getFullYear() === right.getFullYear() &&
    left.getMonth() === right.getMonth() &&
    left.getDate() === right.getDate()
  );
}

function trimLabel(value, maxLength) {
  return value.length > maxLength ? `${value.slice(0, maxLength - 1)}...` : value;
}

function openMobileMenu() {
  elements.sidebar.classList.add("is-open");
  elements.mobileBackdrop.hidden = false;
}

function closeMobileMenu() {
  elements.sidebar.classList.remove("is-open");
  elements.mobileBackdrop.hidden = true;
}

function toggleProfileDropdown(event) {
  event.stopPropagation();
  elements.profileDropdown.hidden = !elements.profileDropdown.hidden;
}

function closeProfileDropdown() {
  elements.profileDropdown.hidden = true;
}

function closeProfileDropdownOnOutsideClick(event) {
  if (!elements.profileDropdown.hidden && !event.target.closest(".profile-menu")) {
    closeProfileDropdown();
  }
}

function bindGlobalActions() {
  document.querySelectorAll("[data-view-link]").forEach((item) => {
    item.onclick = () => showView(item.dataset.viewLink);
  });
  document.querySelectorAll("[data-logout]").forEach((item) => {
    item.onclick = logout;
  });
}

function showToast(message) {
  elements.toast.textContent = message;
  elements.toast.classList.add("is-visible");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    elements.toast.classList.remove("is-visible");
  }, 2600);
}

function setAuthMessage(target, message, isError = false) {
  target.textContent = message;
  target.classList.toggle("is-error", isError);
}

function debounce(callback, delay) {
  let timer;
  return () => {
    clearTimeout(timer);
    timer = setTimeout(callback, delay);
  };
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
