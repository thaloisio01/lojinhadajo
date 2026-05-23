const STORAGE_KEY = "lojinha-da-jo-v1";
const SESSION_KEY = "lojinha-da-jo-logada";
const LOGIN_USER = "Joelma";
const LOGIN_PASSWORD = "22111996";

const state = loadState();
let debtView = "pending";
let deferredInstallPrompt = null;
let cloudClient = null;
let cloudTable = "lojinha_state";
let cloudRowId = "lojinha-da-jo";
let cloudReady = false;
let cloudApplying = false;
let cloudPushTimer = null;
let lastCloudJson = "";

const logic = window.LojinhaLogic;

const els = {
  loginScreen: document.getElementById("loginScreen"),
  appShell: document.getElementById("appShell"),
  loginForm: document.getElementById("loginForm"),
  loginUser: document.getElementById("loginUser"),
  loginPassword: document.getElementById("loginPassword"),
  loginError: document.getElementById("loginError"),
  logoutBtn: document.getElementById("logoutBtn"),
  syncStatus: document.getElementById("syncStatus"),
  tabs: document.querySelectorAll(".tab"),
  screens: document.querySelectorAll(".screen"),
  todayLabel: document.getElementById("todayLabel"),
  monthRevenue: document.getElementById("monthRevenue"),
  monthProfit: document.getElementById("monthProfit"),
  monthSalesCount: document.getElementById("monthSalesCount"),
  monthPendingAmount: document.getElementById("monthPendingAmount"),
  productForm: document.getElementById("productForm"),
  editingProductId: document.getElementById("editingProductId"),
  productName: document.getElementById("productName"),
  productCategory: document.getElementById("productCategory"),
  productCost: document.getElementById("productCost"),
  productPrice: document.getElementById("productPrice"),
  productStock: document.getElementById("productStock"),
  productMinStock: document.getElementById("productMinStock"),
  cancelEditProduct: document.getElementById("cancelEditProduct"),
  productsTable: document.getElementById("productsTable"),
  saleForm: document.getElementById("saleForm"),
  editingSaleId: document.getElementById("editingSaleId"),
  saleSubmitBtn: document.getElementById("saleSubmitBtn"),
  cancelEditSale: document.getElementById("cancelEditSale"),
  saleProduct: document.getElementById("saleProduct"),
  saleQuantity: document.getElementById("saleQuantity"),
  saleDate: document.getElementById("saleDate"),
  customerName: document.getElementById("customerName"),
  paymentStatus: document.getElementById("paymentStatus"),
  dueDate: document.getElementById("dueDate"),
  dueDateWrap: document.getElementById("dueDateWrap"),
  salePreview: document.getElementById("salePreview"),
  recentSalesTable: document.getElementById("recentSalesTable"),
  purchaseForm: document.getElementById("purchaseForm"),
  purchaseProduct: document.getElementById("purchaseProduct"),
  purchaseQuantity: document.getElementById("purchaseQuantity"),
  purchaseUnitCost: document.getElementById("purchaseUnitCost"),
  purchaseDate: document.getElementById("purchaseDate"),
  purchaseNote: document.getElementById("purchaseNote"),
  purchasePreview: document.getElementById("purchasePreview"),
  purchasesTable: document.getElementById("purchasesTable"),
  closingMode: document.getElementById("closingMode"),
  closingDate: document.getElementById("closingDate"),
  closingMonth: document.getElementById("closingMonth"),
  closingDateWrap: document.getElementById("closingDateWrap"),
  closingMonthWrap: document.getElementById("closingMonthWrap"),
  closingSoldLabel: document.getElementById("closingSoldLabel"),
  closingReceivedLabel: document.getElementById("closingReceivedLabel"),
  closingPendingLabel: document.getElementById("closingPendingLabel"),
  closingDateLabel: document.getElementById("closingDateLabel"),
  closingSold: document.getElementById("closingSold"),
  closingReceived: document.getElementById("closingReceived"),
  closingPending: document.getElementById("closingPending"),
  closingProfit: document.getElementById("closingProfit"),
  closingSummary: document.getElementById("closingSummary"),
  shoppingList: document.getElementById("shoppingList"),
  shoppingCountLabel: document.getElementById("shoppingCountLabel"),
  debtsTable: document.getElementById("debtsTable"),
  debtCards: document.getElementById("debtCards"),
  pendingCustomersCount: document.getElementById("pendingCustomersCount"),
  pendingDebtTotal: document.getElementById("pendingDebtTotal"),
  lateDebtCount: document.getElementById("lateDebtCount"),
  paidLaterCount: document.getElementById("paidLaterCount"),
  showPending: document.getElementById("showPending"),
  showPaidLater: document.getElementById("showPaidLater"),
  reportFilter: document.getElementById("reportFilter"),
  reportStart: document.getElementById("reportStart"),
  reportEnd: document.getElementById("reportEnd"),
  reportStartWrap: document.getElementById("reportStartWrap"),
  reportEndWrap: document.getElementById("reportEndWrap"),
  reportPeriodLabel: document.getElementById("reportPeriodLabel"),
  backupStatus: document.getElementById("backupStatus"),
  exportCsv: document.getElementById("exportCsv"),
  exportJson: document.getElementById("exportJson"),
  importJson: document.getElementById("importJson"),
  installBtn: document.getElementById("installBtn"),
  toast: document.getElementById("toast")
};

function loadState() {
  const fallback = { products: [], sales: [], purchases: [], lastBackupAt: "" };
  try {
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY)) || fallback;
    return {
      products: Array.isArray(stored.products) ? stored.products : [],
      sales: Array.isArray(stored.sales) ? stored.sales : [],
      purchases: Array.isArray(stored.purchases) ? stored.purchases : [],
      lastBackupAt: stored.lastBackupAt || ""
    };
  } catch (error) {
    return fallback;
  }
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function money(value) {
  return Number(value || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function formatPercent(value) {
  return `${Number(value || 0).toLocaleString("pt-BR", { maximumFractionDigits: 1 })}%`;
}
function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

function formatDate(date) {
  if (!date) return "-";
  const [year, month, day] = date.split("-");
  return `${day}/${month}/${year}`;
}

function formatDateTime(iso) {
  if (!iso) return "Nenhum backup baixado ainda.";
  return `Último backup: ${new Date(iso).toLocaleString("pt-BR")}`;
}

function uid(prefix) {
  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function getProduct(id) {
  return state.products.find(product => product.id === id);
}

function saleTotals(sale) {
  const product = getProduct(sale.productId) || sale.productSnapshot;
  const price = sale.unitPrice ?? product?.price ?? 0;
  const cost = sale.unitCost ?? product?.cost ?? 0;
  return {
    revenue: price * sale.quantity,
    profit: (price - cost) * sale.quantity
  };
}

function showToast(message) {
  els.toast.textContent = message;
  els.toast.classList.add("show");
  window.clearTimeout(showToast.timer);
  showToast.timer = window.setTimeout(() => els.toast.classList.remove("show"), 2400);
}

function showApp() {
  els.loginScreen.classList.add("hidden");
  els.appShell.classList.remove("hidden");
  render();
}

function showLogin() {
  els.appShell.classList.add("hidden");
  els.loginScreen.classList.remove("hidden");
  els.loginPassword.value = "";
  els.loginUser.focus();
}

function setScreen(screenId) {
  els.tabs.forEach(tab => tab.classList.toggle("active", tab.dataset.screen === screenId));
  els.screens.forEach(screen => screen.classList.toggle("active", screen.id === screenId));
}

function render() {
  saveState();
  renderDates();
  renderProductOptions();
  renderProducts();
  renderPurchases();
  renderSales();
  renderDebts();
  renderDashboard();
  renderReports();
  updateSalePreview();
  updatePurchasePreview();
}

function renderDates() {
  els.todayLabel.textContent = `Hoje: ${formatDate(todayISO())}`;
  if (!els.saleDate.value) els.saleDate.value = todayISO();
  if (!els.purchaseDate.value) els.purchaseDate.value = todayISO();
  if (els.closingDate && !els.closingDate.value) els.closingDate.value = todayISO();
  if (els.closingMonth && !els.closingMonth.value) els.closingMonth.value = todayISO().slice(0, 7);
}

function fillProductSelect(select, emptyText) {
  select.innerHTML = "";
  if (!state.products.length) {
    select.innerHTML = `<option value="">${emptyText}</option>`;
    select.disabled = true;
    return;
  }
  select.disabled = false;
  state.products.forEach(product => {
    const option = document.createElement("option");
    option.value = product.id;
    option.textContent = `${product.name} - estoque: ${product.stock}`;
    select.appendChild(option);
  });
}

function renderProductOptions() {
  fillProductSelect(els.saleProduct, "Cadastre um produto primeiro");
  fillProductSelect(els.purchaseProduct, "Cadastre um produto primeiro");
}

function renderProducts() {
  if (!state.products.length) {
    els.productsTable.innerHTML = '<tr><td colspan="8">Nenhum produto cadastrado ainda.</td></tr>';
    return;
  }
  els.productsTable.innerHTML = state.products.map(product => {
    const profit = product.price - product.cost;
    const stockClass = product.stock < product.minStock ? "badge late" : "badge paid";
    return `
      <tr>
        <td><strong>${escapeHTML(product.name)}</strong></td>
                <td>${escapeHTML(product.category || "Sem categoria")}</td>
<td>${money(product.cost)}</td>
        <td>${money(product.price)}</td>
        <td>${money(profit)}</td>
        <td><span class="profit-percent">${formatPercent(logic.profitPercent(product.cost, product.price))}</span></td>
        <td><span class="${stockClass}">${product.stock}</span></td>
        <td class="actions">
          <button class="secondary" type="button" data-edit-product="${product.id}">Editar</button>
          <button class="secondary danger" type="button" data-delete-product="${product.id}">Excluir</button>
        </td>
      </tr>`;
  }).join("");
}

function renderPurchases() {
  const recent = [...state.purchases].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 10);
  if (!recent.length) {
    els.purchasesTable.innerHTML = '<tr><td colspan="6">Nenhuma compra registrada ainda.</td></tr>';
    return;
  }
  els.purchasesTable.innerHTML = recent.map(purchase => `
    <tr>
      <td>${formatDate(purchase.date)}</td>
      <td>${escapeHTML(purchase.productName)}</td>
      <td>${purchase.quantity}</td>
      <td>${money(purchase.unitCost)}</td>
      <td>${money(purchase.quantity * purchase.unitCost)}</td>
      <td>${escapeHTML(purchase.note || "-")}</td>
    </tr>`).join("");
}

function renderSales() {
  const recent = [...state.sales].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 8);
  if (!recent.length) {
    els.recentSalesTable.innerHTML = '<tr><td colspan="6">Nenhuma venda registrada ainda.</td></tr>';
    return;
  }
  els.recentSalesTable.innerHTML = recent.map(sale => {
    const totals = saleTotals(sale);
    const paidText = sale.status === "paid" || sale.status === "paid-later" ? "Pagamento" : "Vale";
    const badgeClass = sale.status === "pending" ? "pending" : "paid";
    return `
      <tr>
        <td>${formatDate(sale.date)}</td>
        <td>${escapeHTML(sale.productSnapshot.name)}</td>
        <td>${sale.quantity}</td>
        <td>${money(totals.revenue)}</td>
        <td><span class="badge ${badgeClass}">${paidText}</span></td>
        <td class="actions"><button class="secondary" type="button" data-edit-sale="${sale.id}">Editar</button><button class="secondary danger" type="button" data-delete-sale="${sale.id}">Excluir</button></td>
      </tr>`;
  }).join("");
}

function renderDebts() {
  const pending = state.sales.filter(sale => sale.status === "pending");
  const paidLater = state.sales.filter(sale => sale.status === "paid-later");
  const debts = debtView === "pending" ? pending : paidLater;
  const late = pending.filter(sale => sale.dueDate && sale.dueDate < todayISO());
  const customerNames = new Set(pending.map(sale => sale.customer || "Cliente"));
  els.pendingCustomersCount.textContent = customerNames.size;
  els.pendingDebtTotal.textContent = money(sum(pending, sale => saleTotals(sale).revenue));
  els.lateDebtCount.textContent = late.length;
  els.paidLaterCount.textContent = paidLater.length;
  els.showPending.classList.toggle("active-filter", debtView === "pending");
  els.showPaidLater.classList.toggle("active-filter", debtView === "paid-later");

  if (!debts.length) {
    els.debtCards.innerHTML = '<div class="empty-state debt-empty">Nada para mostrar aqui.</div>';
    els.debtsTable.innerHTML = '<tr><td colspan="6">Nada para mostrar aqui.</td></tr>';
    return;
  }

  const orderedDebts = [...debts].sort((a, b) => (a.dueDate || a.date).localeCompare(b.dueDate || b.date));
  els.debtCards.innerHTML = orderedDebts.map(sale => {
    const totals = saleTotals(sale);
    const isLate = sale.status === "pending" && sale.dueDate && sale.dueDate < todayISO();
    const statusText = sale.status === "pending" ? (isLate ? "Prazo vencido" : "Dentro do prazo") : `Recebido em ${formatDate(sale.paidDate)}`;
    const action = sale.status === "pending"
      ? `<button class="primary" type="button" data-mark-paid="${sale.id}">Marcar como pago</button>`
      : `<span class="badge paid">Já recebido</span>`;
    return `
      <article class="debt-card ${isLate ? "debt-late" : ""}">
        <div>
          <span class="debt-label">Cliente</span>
          <h3>${escapeHTML(sale.customer || "Cliente")}</h3>
        </div>
        <div class="debt-card-row"><span>Quanto deve</span><strong>${money(totals.revenue)}</strong></div>
        <div class="debt-card-row"><span>Produto</span><strong>${escapeHTML(sale.productSnapshot.name)} (${sale.quantity})</strong></div>
        <div class="debt-card-row"><span>Prazo combinado</span><strong>${formatDate(sale.dueDate)}</strong></div>
        <div class="debt-footer"><span class="badge ${isLate ? "late" : sale.status === "pending" ? "pending" : "paid"}">${statusText}</span>${action}</div>
      </article>`;
  }).join("");

  els.debtsTable.innerHTML = orderedDebts.map(sale => {
    const totals = saleTotals(sale);
    const isLate = sale.status === "pending" && sale.dueDate && sale.dueDate < todayISO();
    const dueBadge = isLate ? "badge late" : "badge pending";
    const action = sale.status === "pending"
      ? `<button class="primary" type="button" data-mark-paid="${sale.id}">Recebi</button>`
      : `<span class="badge paid">Recebido em ${formatDate(sale.paidDate)}</span>`;
    return `
      <tr>
        <td><strong>${escapeHTML(sale.customer || "Cliente")}</strong></td>
        <td>${escapeHTML(sale.productSnapshot.name)} (${sale.quantity})</td>
        <td>${money(totals.revenue)}</td>
        <td>${formatDate(sale.date)}</td>
        <td><span class="${dueBadge}">${formatDate(sale.dueDate)}</span></td>
        <td class="actions">${action}</td>
      </tr>`;
  }).join("");
}

function renderClosing() {
  if (!els.closingDate) return;
  const mode = els.closingMode.value;
  const isMonth = mode === "month";
  els.closingDateWrap.classList.toggle("hidden", isMonth);
  els.closingMonthWrap.classList.toggle("hidden", !isMonth);
  const period = isMonth ? (els.closingMonth.value || todayISO().slice(0, 7)) : (els.closingDate.value || todayISO());
  const stats = isMonth ? logic.monthlyClosingStats(state.sales, period) : logic.closingStats(state.sales, period);
  const periodLabel = isMonth ? monthName(new Date(`${period}-01T00:00:00`)) : formatDate(period);
  els.closingDateLabel.textContent = isMonth ? `Fechamento de ${periodLabel}` : `Fechamento de ${periodLabel}`;
  els.closingSoldLabel.textContent = isMonth ? "Vendido no mês" : "Vendido no dia";
  els.closingReceivedLabel.textContent = isMonth ? "Recebido no mês" : "Recebido no dia";
  els.closingPendingLabel.textContent = isMonth ? "Fiado do mês" : "Fiado do dia";
  els.closingSold.textContent = money(stats.soldTotal);
  els.closingReceived.textContent = money(stats.receivedTotal);
  els.closingPending.textContent = money(stats.pendingTotal);
  els.closingProfit.textContent = money(stats.estimatedProfit);
  els.closingSummary.innerHTML = `
    <div class="summary-line"><span>Vendas registradas</span><strong>${stats.salesCount}</strong></div>
    <div class="summary-line"><span>Entrou no caixa</span><strong>${money(stats.receivedTotal)}</strong></div>
    <div class="summary-line"><span>Ficou para receber</span><strong>${money(stats.pendingTotal)}</strong></div>
    <div class="summary-line"><span>Lucro estimado das vendas ${isMonth ? "do mês" : "do dia"}</span><strong>${money(stats.estimatedProfit)}</strong></div>`;
}

function renderShoppingList() {
  if (!els.shoppingList) return;
  const list = logic.shoppingList(state.products);
  els.shoppingCountLabel.textContent = list.length ? `${list.length} item(ns) para comprar` : "Tudo certo no estoque";
  if (!list.length) {
    els.shoppingList.innerHTML = "Nenhum produto precisa comprar agora.";
    return;
  }
  els.shoppingList.innerHTML = list.map(item => `
    <article class="shopping-card">
      <div class="shopping-card-head"><strong>${escapeHTML(item.name)}</strong><span class="badge late">Estoque ${item.stock}</span></div>
      <div class="shopping-card-row"><span>Mínimo definido</span><strong>${item.minStock}</strong></div>
      <div class="shopping-card-row"><span>Sugestão de compra</span><strong>${item.suggestedQuantity} unidade(s)</strong></div>
      <div class="shopping-card-row"><span>Custo estimado</span><strong>${money(item.suggestedQuantity * item.cost)}</strong></div>
    </article>`).join("");
}

function renderDashboard() {
  const today = todayISO();
  const todaySales = state.sales.filter(sale => sale.date === today);
  const todayRevenue = sum(todaySales, sale => saleTotals(sale).revenue);
  const todayProfit = sum(todaySales, sale => saleTotals(sale).profit);
  const pendingAmount = sum(state.sales.filter(sale => sale.status === "pending"), sale => saleTotals(sale).revenue);
  const stockCost = sum(state.products, product => product.cost * product.stock);
  const month = logic.monthStats(state.sales, today);
  document.getElementById("todayRevenue").textContent = money(todayRevenue);
  document.getElementById("todayProfit").textContent = money(todayProfit);
  document.getElementById("pendingAmount").textContent = money(pendingAmount);
  document.getElementById("stockCost").textContent = money(stockCost);
  els.monthRevenue.textContent = money(month.soldTotal);
  els.monthProfit.textContent = money(month.profit);
  els.monthSalesCount.textContent = month.salesCount;
  els.monthPendingAmount.textContent = money(month.pendingTotal);

  const lowStock = state.products.filter(product => product.stock < product.minStock);
  document.getElementById("lowStockList").innerHTML = lowStock.length ? lowStock.map(product => `
    <div class="list-item"><div><strong>${escapeHTML(product.name)}</strong><small>Comprar mais quando puder</small></div><span class="badge late">${product.stock}</span></div>
  `).join("") : "Nenhum produto acabando agora.";

  const upcoming = state.sales.filter(sale => sale.status === "pending").sort((a, b) => (a.dueDate || a.date).localeCompare(b.dueDate || b.date)).slice(0, 5);
  document.getElementById("upcomingDebts").innerHTML = upcoming.length ? upcoming.map(sale => `
    <div class="list-item"><div><strong>${escapeHTML(sale.customer || "Cliente")}</strong><small>${escapeHTML(sale.productSnapshot.name)} - ${formatDate(sale.dueDate)}</small></div><span>${money(saleTotals(sale).revenue)}</span></div>
  `).join("") : "Nenhuma venda pendente.";
}
function updateReportFilterLabels() {
  const now = new Date();
  const current = monthName(new Date(now.getFullYear(), now.getMonth(), 1));
  const previous = monthName(new Date(now.getFullYear(), now.getMonth() - 1, 1));
  const currentOption = els.reportFilter.querySelector('option[value="this-month"]');
  const previousOption = els.reportFilter.querySelector('option[value="last-month"]');
  if (currentOption) currentOption.textContent = capitalize(current);
  if (previousOption) previousOption.textContent = capitalize(previous);
}
function getReportRange() {
  const filter = els.reportFilter.value;
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  if (filter === "all") return { start: "", end: "", label: "Mostrando todas as vendas." };
  if (filter === "last-month") {
    const start = new Date(year, month - 1, 1);
    const end = new Date(year, month, 0);
    return { start: toISODate(start), end: toISODate(end), label: `Mostrando ${monthName(start)}.` };
  }
  if (filter === "custom") {
    return { start: els.reportStart.value, end: els.reportEnd.value, label: `Mostrando de ${formatDate(els.reportStart.value)} até ${formatDate(els.reportEnd.value)}.` };
  }
  const start = new Date(year, month, 1);
  const end = new Date(year, month + 1, 0);
  return { start: toISODate(start), end: toISODate(end), label: `Mostrando ${monthName(start)}.` };
}

function renderReports() {
  const range = getReportRange();
  const isCustom = els.reportFilter.value === "custom";
  els.reportStartWrap.classList.toggle("hidden", !isCustom);
  els.reportEndWrap.classList.toggle("hidden", !isCustom);
  els.reportPeriodLabel.textContent = range.label;

  const filteredSales = state.sales.filter(sale => {
    if (range.start && sale.date < range.start) return false;
    if (range.end && sale.date > range.end) return false;
    return true;
  });
  const allRevenue = sum(filteredSales, sale => saleTotals(sale).revenue);
  const allProfit = sum(filteredSales, sale => saleTotals(sale).profit);
  const stockSaleValue = sum(state.products, product => product.price * product.stock);
  const stockCost = sum(state.products, product => product.cost * product.stock);
  document.getElementById("allRevenue").textContent = money(allRevenue);
  document.getElementById("allProfit").textContent = money(allProfit);
  document.getElementById("stockSaleValue").textContent = money(stockSaleValue);
  document.getElementById("expectedProfit").textContent = money(stockSaleValue - stockCost);

  const ranking = {};
  filteredSales.forEach(sale => {
    const name = sale.productSnapshot.name;
    ranking[name] = (ranking[name] || 0) + sale.quantity;
  });
  const best = Object.entries(ranking).sort((a, b) => b[1] - a[1])[0];
  document.getElementById("bestSeller").textContent = best ? `${best[0]}: ${best[1]} unidade(s) vendida(s).` : "Nenhuma venda neste período.";
  els.backupStatus.textContent = formatDateTime(state.lastBackupAt);
}

function updateSalePreview() {
  const product = getProduct(els.saleProduct.value);
  const quantity = Number(els.saleQuantity.value || 0);
  els.salePreview.textContent = money(product ? product.price * quantity : 0);
  els.dueDateWrap.classList.toggle("hidden", els.paymentStatus.value !== "pending");
  if (els.paymentStatus.value === "pending" && !els.dueDate.value) els.dueDate.value = todayISO();
}

function updatePurchasePreview() {
  const quantity = Number(els.purchaseQuantity.value || 0);
  const unitCost = Number(els.purchaseUnitCost.value || 0);
  const product = getProduct(els.purchaseProduct.value);
  if (product && !els.purchaseUnitCost.value) els.purchaseUnitCost.value = product.cost;
  els.purchasePreview.textContent = money(quantity * Number(els.purchaseUnitCost.value || unitCost));
}

function handleLogin(event) {
  event.preventDefault();
  const userOk = els.loginUser.value.trim().toLowerCase() === LOGIN_USER.toLowerCase();
  const passwordOk = els.loginPassword.value === LOGIN_PASSWORD;
  if (!userOk || !passwordOk) {
    els.loginError.textContent = "Login ou senha incorretos.";
    return;
  }
  sessionStorage.setItem(SESSION_KEY, "sim");
  els.loginError.textContent = "";
  showApp();
}

function handleProductSubmit(event) {
  event.preventDefault();
  const id = els.editingProductId.value || uid("product");
  const product = {
    id,
    name: els.productName.value.trim(),
        category: els.productCategory.value.trim(),
    cost: Number(els.productCost.value),
    price: Number(els.productPrice.value),
    stock: Number(els.productStock.value),
    minStock: Number(els.productMinStock.value)
  };
  if (logic.hasDuplicateProductName(state.products, product.name, id)) return showToast("Esse produto já existe. Edite o produto cadastrado em vez de criar outro.");
  if (product.price < product.cost) showToast("Atenção: o preço de venda está menor que o valor pago.");
  const index = state.products.findIndex(item => item.id === id);
  if (index >= 0) state.products[index] = product;
  else state.products.push(product);
  els.productForm.reset();
  els.productMinStock.value = 3;
  els.editingProductId.value = "";
  els.cancelEditProduct.classList.add("hidden");
  render();
  showToast("Produto salvo.");
}

function buildSaleFromForm(id, product, quantity) {
  return {
    id,
    productId: product.id,
    productSnapshot: { name: product.name, category: product.category || "", cost: product.cost, price: product.price },
    unitCost: product.cost,
    unitPrice: product.price,
    quantity,
    date: els.saleDate.value,
    customer: els.customerName.value.trim(),
    status: els.paymentStatus.value === "pending" ? "pending" : "paid",
    dueDate: els.paymentStatus.value === "pending" ? els.dueDate.value : "",
    paidDate: els.paymentStatus.value === "paid" ? els.saleDate.value : ""
  };
}

function resetSaleForm() {
  els.saleForm.reset();
  els.editingSaleId.value = "";
  els.saleQuantity.value = 1;
  els.saleDate.value = todayISO();
  els.saleSubmitBtn.textContent = "Salvar venda";
  els.cancelEditSale.classList.add("hidden");
  updateSalePreview();
}

function handleSaleSubmit(event) {
  event.preventDefault();
  const product = getProduct(els.saleProduct.value);
  const quantity = Number(els.saleQuantity.value);
  const editingId = els.editingSaleId.value;
  const oldSale = editingId ? state.sales.find(sale => sale.id === editingId) : null;
  const availableStock = product ? product.stock + (oldSale && oldSale.productId === product.id ? Number(oldSale.quantity) : 0) : 0;
  if (!product) return showToast("Cadastre um produto primeiro.");
  if (quantity > availableStock) return showToast("Não tem essa quantidade em estoque.");
  if (els.paymentStatus.value === "pending" && !els.customerName.value.trim()) return showToast("Informe o nome de quem ficará no vale.");
  const nextSale = buildSaleFromForm(editingId || uid("sale"), product, quantity);
  logic.applySaleStockChange(state.products, oldSale, nextSale);
  if (oldSale) {
    const index = state.sales.findIndex(sale => sale.id === oldSale.id);
    state.sales[index] = nextSale;
  } else {
    state.sales.push(nextSale);
  }
  resetSaleForm();
  render();
  showToast(oldSale ? "Venda atualizada." : "Venda registrada.");
}

function handlePurchaseSubmit(event) {
  event.preventDefault();
  const product = getProduct(els.purchaseProduct.value);
  const quantity = Number(els.purchaseQuantity.value);
  const unitCost = Number(els.purchaseUnitCost.value);
  if (!product) return showToast("Cadastre o produto antes de registrar a compra.");
  product.stock += quantity;
  product.cost = unitCost;
  state.purchases.push({
    id: uid("purchase"),
    productId: product.id,
    productName: product.name,
    quantity,
    unitCost,
    date: els.purchaseDate.value,
    note: els.purchaseNote.value.trim()
  });
  els.purchaseForm.reset();
  els.purchaseQuantity.value = 1;
  els.purchaseDate.value = todayISO();
  render();
  showToast("Compra registrada e estoque atualizado.");
}


function editSale(id) {
  const sale = state.sales.find(item => item.id === id);
  if (!sale) return;
  els.editingSaleId.value = sale.id;
  els.saleProduct.value = sale.productId;
  els.saleQuantity.value = sale.quantity;
  els.saleDate.value = sale.date;
  els.customerName.value = sale.customer || "";
  els.paymentStatus.value = sale.status === "pending" ? "pending" : "paid";
  els.dueDate.value = sale.dueDate || "";
  els.saleSubmitBtn.textContent = "Atualizar venda";
  els.cancelEditSale.classList.remove("hidden");
  updateSalePreview();
  setScreen("sale");
}

function deleteSale(id) {
  const sale = state.sales.find(item => item.id === id);
  if (!sale) return;
  if (!confirm("Excluir esta venda e devolver o produto ao estoque?")) return;
  logic.applySaleStockChange(state.products, sale, null);
  state.sales = state.sales.filter(item => item.id !== id);
  if (els.editingSaleId.value === id) resetSaleForm();
  render();
  showToast("Venda excluída e estoque devolvido.");
}
function editProduct(id) {
  const product = getProduct(id);
  if (!product) return;
  els.editingProductId.value = product.id;
  els.productName.value = product.name;
    els.productCategory.value = product.category || "";
  els.productCost.value = product.cost;
  els.productPrice.value = product.price;
  els.productStock.value = product.stock;
  els.productMinStock.value = product.minStock;
  els.cancelEditProduct.classList.remove("hidden");
  setScreen("products");
}

function deleteProduct(id) {
  const hasSales = state.sales.some(sale => sale.productId === id);
  const hasPurchases = state.purchases.some(purchase => purchase.productId === id);
  if (hasSales || hasPurchases) return showToast("Esse produto tem histórico. Edite o estoque em vez de excluir.");
  if (!confirm("Excluir este produto?")) return;
  state.products = state.products.filter(product => product.id !== id);
  render();
  showToast("Produto excluído.");
}

function markPaid(id) {
  const sale = state.sales.find(item => item.id === id);
  if (!sale) return;
  sale.status = "paid-later";
  sale.paidDate = todayISO();
  render();
  showToast("Pagamento marcado como recebido.");
}

function exportCsv() {
  const rows = [["Data", "Cliente", "Produto", "Quantidade", "Valor total", "Lucro", "Pagamento", "Data combinada", "Data recebida"]];
  state.sales.forEach(sale => {
    const totals = saleTotals(sale);
    rows.push([sale.date, sale.customer, sale.productSnapshot.name, sale.quantity, totals.revenue, totals.profit, sale.status, sale.dueDate, sale.paidDate]);
  });
  download("vendas-lojinha-da-jo.csv", rows.map(row => row.map(cell => `"${String(cell ?? "").replaceAll('"', '""')}"`).join(";")).join("\n"), "text/csv;charset=utf-8");
}

function exportJson() {
  state.lastBackupAt = new Date().toISOString();
  saveState();
  renderReports();
  download("backup-lojinha-da-jo.json", JSON.stringify(state, null, 2), "application/json");
  showToast("Backup baixado e data atualizada.");
}

function importJson(event) {
  const file = event.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    try {
      const data = JSON.parse(reader.result);
      if (!Array.isArray(data.products) || !Array.isArray(data.sales)) throw new Error("Formato inválido");
      state.products = data.products;
      state.sales = data.sales;
      state.purchases = Array.isArray(data.purchases) ? data.purchases : [];
      state.lastBackupAt = data.lastBackupAt || new Date().toISOString();
      render();
      showToast("Backup importado.");
    } catch (error) {
      showToast("Não consegui importar esse arquivo.");
    }
  };
  reader.readAsText(file);
}

function download(filename, content, type) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function sum(items, pick) {
  return items.reduce((total, item) => total + pick(item), 0);
}

function toISODate(date) {
  return date.toISOString().slice(0, 10);
}

function monthName(date) {
  return date.toLocaleDateString("pt-BR", { month: "long", year: "numeric" });
}

function capitalize(value) {
  return value ? value.charAt(0).toUpperCase() + value.slice(1) : value;
}

function sanitizedState() {
  return {
    products: state.products,
    sales: state.sales,
    purchases: state.purchases,
    lastBackupAt: state.lastBackupAt || ""
  };
}

function replaceState(nextState) {
  state.products = Array.isArray(nextState.products) ? nextState.products : [];
  state.sales = Array.isArray(nextState.sales) ? nextState.sales : [];
  state.purchases = Array.isArray(nextState.purchases) ? nextState.purchases : [];
  state.lastBackupAt = nextState.lastBackupAt || "";
}

function setSyncStatus(message) {
  if (els.syncStatus) els.syncStatus.textContent = message;
}

function hasSupabaseConfig(config) {
  return Boolean(config && config.url && config.anonKey && !config.url.includes("COLOQUE") && !config.anonKey.includes("COLOQUE"));
}

async function initSupabaseSync() {
  const config = window.LOJINHA_SUPABASE;
  if (!hasSupabaseConfig(config)) {
    setSyncStatus("Modo local");
    return;
  }
  if (location.protocol === "file:") {
    setSyncStatus("Publique para sincronizar");
    return;
  }
  try {
    setSyncStatus("Conectando...");
    const module = await import("https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm");
    cloudClient = module.createClient(config.url, config.anonKey);
    cloudTable = config.table || cloudTable;
    cloudRowId = config.rowId || cloudRowId;

    const result = await cloudClient.from(cloudTable).select("data").eq("id", cloudRowId).maybeSingle();
    if (result.error) throw result.error;

    if (result.data?.data) {
      cloudApplying = true;
      replaceState(result.data.data);
      lastCloudJson = JSON.stringify(sanitizedState());
      render();
      cloudApplying = false;
    } else {
      await pushCloudState(true);
    }

    cloudReady = true;
    setSyncStatus("Sincronizado");
    cloudClient
      .channel("lojinha-da-jo-sync")
      .on("postgres_changes", { event: "*", schema: "public", table: cloudTable, filter: `id=eq.${cloudRowId}` }, payload => {
        if (!payload.new?.data) return;
        const incomingJson = JSON.stringify(payload.new.data);
        if (incomingJson === lastCloudJson) return;
        cloudApplying = true;
        replaceState(payload.new.data);
        lastCloudJson = incomingJson;
        render();
        cloudApplying = false;
        setSyncStatus("Atualizado");
      })
      .subscribe(status => {
        if (status === "SUBSCRIBED") setSyncStatus("Sincronizado");
        if (status === "CHANNEL_ERROR") setSyncStatus("Erro no sync");
      });
  } catch (error) {
    console.error(error);
    cloudReady = false;
    setSyncStatus("Sync desligado");
    showToast("Não consegui conectar ao Supabase. O app continua local.");
  }
}

function scheduleCloudPush() {
  window.clearTimeout(cloudPushTimer);
  cloudPushTimer = window.setTimeout(() => pushCloudState(false), 450);
}

async function pushCloudState(force) {
  if (!cloudClient) return;
  const data = sanitizedState();
  const json = JSON.stringify(data);
  if (!force && json === lastCloudJson) return;
  try {
    setSyncStatus("Salvando...");
    const result = await cloudClient.from(cloudTable).upsert({
      id: cloudRowId,
      data,
      updated_at: new Date().toISOString()
    });
    if (result.error) throw result.error;
    lastCloudJson = json;
    setSyncStatus("Sincronizado");
  } catch (error) {
    console.error(error);
    setSyncStatus("Erro no sync");
    showToast("Não consegui salvar na nuvem agora.");
  }
}
function escapeHTML(value) {
  return String(value ?? "").replace(/[&<>'"]/g, char => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" }[char]));
}

els.loginForm.addEventListener("submit", handleLogin);
els.logoutBtn.addEventListener("click", () => {
  sessionStorage.removeItem(SESSION_KEY);
  showLogin();
});
els.tabs.forEach(tab => tab.addEventListener("click", () => setScreen(tab.dataset.screen)));
els.productForm.addEventListener("submit", handleProductSubmit);
els.saleForm.addEventListener("submit", handleSaleSubmit);
els.purchaseForm.addEventListener("submit", handlePurchaseSubmit);
els.saleProduct.addEventListener("change", updateSalePreview);
els.saleQuantity.addEventListener("input", updateSalePreview);
els.cancelEditSale.addEventListener("click", resetSaleForm);
els.paymentStatus.addEventListener("change", updateSalePreview);
els.purchaseProduct.addEventListener("change", () => {
  const product = getProduct(els.purchaseProduct.value);
  els.purchaseUnitCost.value = product ? product.cost : "";
  updatePurchasePreview();
});
els.purchaseQuantity.addEventListener("input", updatePurchasePreview);
els.purchaseUnitCost.addEventListener("input", updatePurchasePreview);
els.reportFilter.addEventListener("change", renderReports);
els.reportStart.addEventListener("input", renderReports);
els.reportEnd.addEventListener("input", renderReports);
els.closingMode.addEventListener("change", renderClosing);
els.closingDate.addEventListener("input", renderClosing);
els.closingMonth.addEventListener("input", renderClosing);
els.recentSalesTable.addEventListener("click", event => {
  const editId = event.target.dataset.editSale;
  const deleteId = event.target.dataset.deleteSale;
  if (editId) editSale(editId);
  if (deleteId) deleteSale(deleteId);
});
els.productsTable.addEventListener("click", event => {
  const editId = event.target.dataset.editProduct;
  const deleteId = event.target.dataset.deleteProduct;
  if (editId) editProduct(editId);
  if (deleteId) deleteProduct(deleteId);
});
els.debtsTable.addEventListener("click", event => {
  if (event.target.dataset.markPaid) markPaid(event.target.dataset.markPaid);
});
els.cancelEditProduct.addEventListener("click", () => {
  els.productForm.reset();
  els.productMinStock.value = 3;
  els.editingProductId.value = "";
  els.cancelEditProduct.classList.add("hidden");
});
els.showPending.addEventListener("click", () => { debtView = "pending"; renderDebts(); });
els.showPaidLater.addEventListener("click", () => { debtView = "paid-later"; renderDebts(); });
els.exportCsv.addEventListener("click", exportCsv);
els.exportJson.addEventListener("click", exportJson);
els.importJson.addEventListener("change", importJson);

window.addEventListener("beforeinstallprompt", event => {
  event.preventDefault();
  deferredInstallPrompt = event;
  els.installBtn.classList.remove("hidden");
});
els.installBtn.addEventListener("click", async () => {
  if (!deferredInstallPrompt) return;
  deferredInstallPrompt.prompt();
  await deferredInstallPrompt.userChoice;
  deferredInstallPrompt = null;
  els.installBtn.classList.add("hidden");
});

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => navigator.serviceWorker.register("service-worker.js"));
}

if (sessionStorage.getItem(SESSION_KEY) === "sim") showApp();
else showLogin();





















