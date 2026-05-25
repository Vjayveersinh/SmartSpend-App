const STORAGE_KEY = "smartspend.expenses.v1";

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

const categoryIcons = {
  Groceries: "G",
  "Eating Out": "E",
  Coffee: "C",
  Rent: "R",
  Car: "A",
  Gas: "F",
  Shopping: "S",
  Subscriptions: "N",
  Gym: "Y",
  Family: "M",
  Medical: "+",
  Travel: "T",
  Other: ".",
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

let expenses = loadExpenses();
let currentView = "dashboard";
let historyFilter = "This Month";

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
  views: document.querySelectorAll(".view"),
  navItems: document.querySelectorAll(".nav-item"),
  viewLinks: document.querySelectorAll("[data-view-link]"),
  summaryGrid: document.querySelector("#summary-grid"),
  recentExpenses: document.querySelector("#recent-expenses"),
  form: document.querySelector("#expense-form"),
  formMessage: document.querySelector("#form-message"),
  amount: document.querySelector("#amount"),
  date: document.querySelector("#date"),
  category: document.querySelector("#category"),
  paymentMethod: document.querySelector("#paymentMethod"),
  note: document.querySelector("#note"),
  resetForm: document.querySelector("#reset-form"),
  addSampleData: document.querySelector("#add-sample-data"),
  filterChips: document.querySelectorAll(".filter-chip"),
  historyList: document.querySelector("#history-list"),
  historyTotal: document.querySelector("#history-total"),
  advisorList: document.querySelector("#advisor-list"),
  advisorSavings: document.querySelector("#advisor-savings"),
};

initializeApp();

function initializeApp() {
  fillSelect(elements.category, categories);
  fillSelect(elements.paymentMethod, paymentMethods);
  elements.date.value = toInputDate(new Date());

  elements.navItems.forEach((item) => {
    item.addEventListener("click", () => showView(item.dataset.view));
  });

  elements.viewLinks.forEach((item) => {
    item.addEventListener("click", () => showView(item.dataset.viewLink));
  });

  elements.filterChips.forEach((chip) => {
    chip.addEventListener("click", () => {
      historyFilter = chip.dataset.filter;
      elements.filterChips.forEach((item) => item.classList.toggle("is-active", item === chip));
      renderAll();
    });
  });

  elements.form.addEventListener("submit", saveExpense);
  elements.resetForm.addEventListener("click", resetForm);
  elements.addSampleData.addEventListener("click", addSampleData);
  window.addEventListener("resize", debounce(drawCharts, 120));

  if ("serviceWorker" in navigator && location.protocol !== "file:") {
    navigator.serviceWorker.register("service-worker.js").catch(() => {});
  }

  renderAll();
}

function fillSelect(select, options) {
  select.innerHTML = options
    .map((option) => `<option value="${escapeHtml(option)}">${escapeHtml(option)}</option>`)
    .join("");
}

function showView(viewName) {
  currentView = viewName;

  elements.views.forEach((view) => {
    view.classList.toggle("is-active", view.id === viewName);
  });

  elements.navItems.forEach((item) => {
    item.classList.toggle("is-active", item.dataset.view === viewName);
  });

  if (viewName === "analytics") {
    requestAnimationFrame(drawCharts);
  }

  window.scrollTo({ top: 0, behavior: "smooth" });
}

function saveExpense(event) {
  event.preventDefault();

  const amount = parseAmount(elements.amount.value);
  if (!amount) {
    setFormMessage("Enter an amount greater than 0.", true);
    return;
  }

  const expense = {
    id: crypto.randomUUID(),
    amount,
    category: elements.category.value,
    note: elements.note.value.trim(),
    paymentMethod: elements.paymentMethod.value,
    type: getSelectedType(),
    date: parseDateInput(elements.date.value).toISOString(),
    createdAt: new Date().toISOString(),
  };

  expenses = [expense, ...expenses].sort(sortByNewest);
  saveExpenses();
  resetForm();
  setFormMessage("Expense saved locally.");
  renderAll();
  showView("dashboard");
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
  elements.formMessage.textContent = "";
  elements.formMessage.classList.remove("is-error");
}

function setFormMessage(message, isError = false) {
  elements.formMessage.textContent = message;
  elements.formMessage.classList.toggle("is-error", isError);
}

function renderAll() {
  expenses = expenses.sort(sortByNewest);
  renderDashboard();
  renderHistory();
  renderAdvisor();

  if (currentView === "analytics") {
    drawCharts();
  }
}

function renderDashboard() {
  elements.addSampleData.hidden = expenses.length > 0;

  const intervals = {
    today: currentInterval("day"),
    week: currentInterval("week"),
    month: currentInterval("month"),
    year: currentInterval("year"),
  };

  const monthExpenses = filterByInterval(expenses, intervals.month);
  const topCategory = categoryTotals(monthExpenses)[0];
  const possibleSavings = getSuggestions(expenses).reduce((sum, item) => sum + item.estimatedSavings, 0);

  const cards = [
    {
      title: "Today",
      value: currency(total(filterByInterval(expenses, intervals.today))),
      note: "Spent today",
      icon: "D",
      color: "var(--orange)",
    },
    {
      title: "This Week",
      value: currency(total(filterByInterval(expenses, intervals.week))),
      note: "Current week",
      icon: "W",
      color: "var(--blue)",
    },
    {
      title: "This Month",
      value: currency(total(monthExpenses)),
      note: "Current month",
      icon: "M",
      color: "var(--purple)",
    },
    {
      title: "This Year",
      value: currency(total(filterByInterval(expenses, intervals.year))),
      note: "Year to date",
      icon: "Y",
      color: "var(--green)",
    },
    {
      title: "Top Category",
      value: topCategory ? topCategory.category : "No data",
      note: topCategory ? `${currency(topCategory.amount)} this month` : "Add expenses to see trends",
      icon: "T",
      color: "var(--teal)",
    },
    {
      title: "Possible Savings",
      value: currency(possibleSavings),
      note: possibleSavings > 0 ? "Based on advisor rules" : "No obvious savings flags",
      icon: "$",
      color: "var(--green)",
    },
  ];

  elements.summaryGrid.innerHTML = cards.map(renderSummaryCard).join("");

  const recent = expenses.slice(0, 5);
  elements.recentExpenses.innerHTML = recent.length
    ? recent.map((expense) => renderExpenseRow(expense)).join("")
    : renderEmptyState("No expenses yet", "Add your first expense to start tracking.");
}

function renderSummaryCard(card) {
  return `
    <article class="summary-card">
      <div class="card-icon" style="color: ${card.color}">${card.icon}</div>
      <div>
        <span>${escapeHtml(card.title)}</span>
        <strong>${escapeHtml(card.value)}</strong>
        <small>${escapeHtml(card.note)}</small>
      </div>
    </article>
  `;
}

function renderHistory() {
  const filtered = getFilteredHistory();
  elements.historyTotal.textContent = currency(total(filtered));
  elements.historyList.innerHTML = filtered.length
    ? filtered.map((expense) => renderExpenseRow(expense, true)).join("")
    : renderEmptyState("No expenses", "No expenses match this filter.");

  elements.historyList.querySelectorAll("[data-delete-id]").forEach((button) => {
    button.addEventListener("click", () => deleteExpense(button.dataset.deleteId));
  });
}

function getFilteredHistory() {
  if (historyFilter === "All") {
    return expenses;
  }

  const intervalName = {
    Today: "day",
    "This Week": "week",
    "This Month": "month",
    "This Year": "year",
  }[historyFilter];

  return filterByInterval(expenses, currentInterval(intervalName));
}

function renderExpenseRow(expense, includeDelete = false) {
  const badgeClass = expense.type === "Need" ? "need" : "want";
  const note = expense.note || expense.paymentMethod;
  const deleteButton = includeDelete
    ? `<button class="danger-action" data-delete-id="${expense.id}" type="button">Delete</button>`
    : "";

  return `
    <article class="expense-row">
      <div class="expense-icon">${escapeHtml(categoryIcons[expense.category] || ".")}</div>
      <div class="expense-main">
        <strong>${escapeHtml(expense.category)}</strong>
        <span>${escapeHtml(note)} • ${escapeHtml(formatExpenseDate(expense.date))}</span>
      </div>
      <div class="expense-side">
        <strong>${currency(expense.amount)}</strong>
        <span class="badge ${badgeClass}">${escapeHtml(expense.type)}</span>
        ${deleteButton}
      </div>
    </article>
  `;
}

function deleteExpense(id) {
  expenses = expenses.filter((expense) => expense.id !== id);
  saveExpenses();
  renderAll();
}

function renderAdvisor() {
  const suggestions = getSuggestions(expenses);
  const possibleSavings = suggestions.reduce((sum, item) => sum + item.estimatedSavings, 0);
  elements.advisorSavings.textContent = currency(possibleSavings);

  elements.advisorList.innerHTML = suggestions.length
    ? suggestions.map(renderSuggestion).join("")
    : renderEmptyState("Looking good", "Your spending is within the current advisor rules.");
}

function renderSuggestion(suggestion) {
  return `
    <article class="advisor-card">
      <div class="expense-icon">${escapeHtml(suggestion.icon)}</div>
      <div>
        <strong>${escapeHtml(suggestion.title)}</strong>
        <p>${escapeHtml(suggestion.message)}</p>
        <span class="saving">Estimated savings: ${currency(suggestion.estimatedSavings)}</span>
      </div>
    </article>
  `;
}

function renderEmptyState(title, message) {
  return `
    <div class="empty-state">
      <strong>${escapeHtml(title)}</strong>
      <span>${escapeHtml(message)}</span>
    </div>
  `;
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
    results.push({
      title: "Trim Eating Out",
      message: "Eating Out is above $250 this month. A few more meals at home could lower this quickly.",
      estimatedSavings: eatingOutTotal - 250,
      icon: "E",
    });
  }

  if (coffeeTotal > 75) {
    results.push({
      title: "Reduce Coffee Runs",
      message: "Coffee spending is above $75 this month. Replacing a few shop visits can help.",
      estimatedSavings: coffeeTotal - 75,
      icon: "C",
    });
  }

  if (subscriptionsTotal > 80) {
    results.push({
      title: "Review Subscriptions",
      message: "Subscriptions are above $80 this month. Canceling one unused plan may be an easy win.",
      estimatedSavings: subscriptionsTotal - 80,
      icon: "N",
    });
  }

  if (monthlyTotal > 0 && wantTotal / monthlyTotal > 0.4) {
    const targetWantTotal = monthlyTotal * 0.4;
    results.push({
      title: "Lower Want Spending",
      message: "Want spending is more than 40% of this month's total.",
      estimatedSavings: wantTotal - targetWantTotal,
      icon: "W",
    });
  }

  return results;
}

function drawCharts() {
  if (currentView !== "analytics") {
    return;
  }

  const monthExpenses = filterByInterval(expenses, currentInterval("month"));
  drawHorizontalBarChart(document.querySelector("#category-chart"), categoryTotals(monthExpenses), "category");
  drawLineChart(document.querySelector("#daily-chart"), dailyTotals(monthExpenses));
  drawDonutChart(document.querySelector("#type-chart"), typeTotals(monthExpenses));
  drawVerticalBarChart(document.querySelector("#monthly-chart"), monthlyTotals(expenses));
}

function drawHorizontalBarChart(canvas, data) {
  const ctx = setupCanvas(canvas);
  const width = canvas.clientWidth;
  const height = canvas.clientHeight;
  clearCanvas(ctx, width, height);

  if (!data.length) {
    drawNoData(ctx, width, height);
    return;
  }

  const max = Math.max(...data.map((item) => item.amount), 1);
  const rowHeight = Math.min(34, (height - 42) / data.length);
  const labelWidth = Math.min(128, width * 0.36);

  ctx.font = "12px system-ui";
  data.slice(0, 8).forEach((item, index) => {
    const y = 28 + index * rowHeight;
    const barWidth = ((width - labelWidth - 28) * item.amount) / max;
    ctx.fillStyle = "#657085";
    ctx.fillText(trimLabel(item.category, 14), 0, y + 12);
    ctx.fillStyle = chartColors[index % chartColors.length];
    roundRect(ctx, labelWidth, y, Math.max(4, barWidth), 18, 6);
    ctx.fill();

    const valueText = currency(item.amount);
    const valueWidth = ctx.measureText(valueText).width;
    const outsideX = labelWidth + barWidth + 8;
    if (outsideX + valueWidth <= width) {
      ctx.fillStyle = "#182033";
      ctx.fillText(valueText, outsideX, y + 13);
    } else if (barWidth > valueWidth + 16) {
      ctx.fillStyle = "#ffffff";
      ctx.textAlign = "right";
      ctx.fillText(valueText, labelWidth + barWidth - 8, y + 13);
      ctx.textAlign = "left";
    }
  });
}

function drawLineChart(canvas, data) {
  const ctx = setupCanvas(canvas);
  const width = canvas.clientWidth;
  const height = canvas.clientHeight;
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
    if (index === 0) {
      ctx.moveTo(x, y);
    } else {
      ctx.lineTo(x, y);
    }
  });
  ctx.strokeStyle = "#2563eb";
  ctx.lineWidth = 3;
  ctx.stroke();

  ctx.fillStyle = "#657085";
  ctx.font = "12px system-ui";
  ctx.fillText(currency(max), 0, padding.top + 4);
  ctx.fillText("1", padding.left, height - 8);
  ctx.fillText(String(data.length), width - 26, height - 8);
}

function drawDonutChart(canvas, data) {
  const ctx = setupCanvas(canvas);
  const width = canvas.clientWidth;
  const height = canvas.clientHeight;
  clearCanvas(ctx, width, height);

  const filtered = data.filter((item) => item.amount > 0);
  const sum = total(filtered);
  if (!sum) {
    drawNoData(ctx, width, height);
    return;
  }

  const radius = Math.min(width, height) * 0.31;
  const centerX = width * 0.38;
  const centerY = height * 0.5;
  let start = -Math.PI / 2;

  filtered.forEach((item, index) => {
    const angle = (item.amount / sum) * Math.PI * 2;
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, start, start + angle);
    ctx.arc(centerX, centerY, radius * 0.58, start + angle, start, true);
    ctx.closePath();
    ctx.fillStyle = item.type === "Need" ? "#16a34a" : "#f97316";
    ctx.fill();
    start += angle;
  });

  ctx.fillStyle = "#182033";
  ctx.font = "700 14px system-ui";
  ctx.fillText(currency(sum), centerX - radius * 0.58, centerY + 5);

  filtered.forEach((item, index) => {
    const x = width * 0.72;
    const y = centerY - 24 + index * 34;
    ctx.fillStyle = item.type === "Need" ? "#16a34a" : "#f97316";
    roundRect(ctx, x, y - 11, 16, 16, 4);
    ctx.fill();
    ctx.fillStyle = "#182033";
    ctx.font = "13px system-ui";
    ctx.fillText(`${item.type} ${currency(item.amount)}`, x + 24, y + 2);
  });
}

function drawVerticalBarChart(canvas, data) {
  const ctx = setupCanvas(canvas);
  const width = canvas.clientWidth;
  const height = canvas.clientHeight;
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
    roundRect(ctx, x, y, barWidth, Math.max(2, barHeight), 5);
    ctx.fill();

    if (index % 2 === 0) {
      ctx.fillStyle = "#657085";
      ctx.font = "11px system-ui";
      ctx.fillText(monthFormatter.format(item.date), x - 1, height - 8);
    }
  });

  ctx.fillStyle = "#657085";
  ctx.font = "12px system-ui";
  ctx.fillText(currency(max), 0, padding.top + 4);
}

function setupCanvas(canvas) {
  const ratio = window.devicePixelRatio || 1;
  const width = canvas.clientWidth;
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

function drawNoData(ctx, width, height) {
  ctx.fillStyle = "#657085";
  ctx.font = "600 14px system-ui";
  ctx.textAlign = "center";
  ctx.fillText("No chart data yet", width / 2, height / 2);
  ctx.textAlign = "left";
}

function drawAxes(ctx, width, height, padding) {
  ctx.strokeStyle = "#dce1e8";
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
    const dayTotal = source
      .filter((expense) => isSameDay(new Date(expense.date), date))
      .reduce((sum, expense) => sum + expense.amount, 0);
    return { date, amount: dayTotal };
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
  renderAll();
}

function sampleExpense(amount, category, note, paymentMethod, type, date) {
  return {
    id: crypto.randomUUID(),
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
  try {
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
    return Array.isArray(stored) ? stored : [];
  } catch {
    return [];
  }
}

function saveExpenses() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(expenses));
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
