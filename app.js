const STORAGE_KEY = "lojinha-da-jo-v1";
const SESSION_KEY = "lojinha-da-jo-logada";
const AUTO_BACKUP_KEY = "lojinha-da-jo-auto-backup";
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
let officialMonthSummaryVisible = false;
let lastSaleReceiptText = "";
let saleCart = [];

const logic = window.LojinhaLogic;

const els = {
  loginScreen: document.getElementById("loginScreen"),
  appShell: document.getElementById("appShell"),
  loginForm: document.getElementById("loginForm"),
  loginUser: document.getElementById("loginUser"),
  loginPassword: document.getElementById("loginPassword"),
  loginError: document.getElementById("loginError"),
  loginSeasonDecor: document.getElementById("loginSeasonDecor"),
  loginSeasonMessage: document.getElementById("loginSeasonMessage"),
  logoutBtn: document.getElementById("logoutBtn"),
  syncStatus: document.getElementById("syncStatus"),
  tabs: document.querySelectorAll(".tab"),
  screens: document.querySelectorAll(".screen"),
  todayLabel: document.getElementById("todayLabel"),
  dashboardGreeting: document.getElementById("dashboardGreeting"),
  joTodaySales: document.getElementById("joTodaySales"),
  joTodayProfit: document.getElementById("joTodayProfit"),
  joPendingClients: document.getElementById("joPendingClients"),
  joLowStock: document.getElementById("joLowStock"),
  monthRevenue: document.getElementById("monthRevenue"),
  monthProfit: document.getElementById("monthProfit"),
  monthSalesCount: document.getElementById("monthSalesCount"),
  monthPendingAmount: document.getElementById("monthPendingAmount"),
  monthTopSelling: document.getElementById("monthTopSelling"),
  monthTopSellingDetail: document.getElementById("monthTopSellingDetail"),
  monthTopProfit: document.getElementById("monthTopProfit"),
  monthTopProfitDetail: document.getElementById("monthTopProfitDetail"),
  monthIdleStock: document.getElementById("monthIdleStock"),
  monthIdleStockDetail: document.getElementById("monthIdleStockDetail"),
  customerVipName: document.getElementById("customerVipName"),
  customerVipDetail: document.getElementById("customerVipDetail"),
  weeklyBuyerName: document.getElementById("weeklyBuyerName"),
  weeklyBuyerDetail: document.getElementById("weeklyBuyerDetail"),
  topDebtorName: document.getElementById("topDebtorName"),
  topDebtorDetail: document.getElementById("topDebtorDetail"),
  onTimePayerName: document.getElementById("onTimePayerName"),
  onTimePayerDetail: document.getElementById("onTimePayerDetail"),
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
  saleMode: document.getElementById("saleMode"),
  saleCategoryWrap: document.getElementById("saleCategoryWrap"),
  saleCategory: document.getElementById("saleCategory"),
  saleProductSearchWrap: document.getElementById("saleProductSearchWrap"),
  saleProductWrap: document.getElementById("saleProductWrap"),
  saleQuantityWrap: document.getElementById("saleQuantityWrap"),
  quickSaleAmountWrap: document.getElementById("quickSaleAmountWrap"),
  quickSaleNoteWrap: document.getElementById("quickSaleNoteWrap"),
  quickSaleAmount: document.getElementById("quickSaleAmount"),
  quickSaleNote: document.getElementById("quickSaleNote"),
  quickSaleEstimateText: document.getElementById("quickSaleEstimateText"),
  saleDiscountWrap: document.getElementById("saleDiscountWrap"),
  cancelEditSale: document.getElementById("cancelEditSale"),
  addToCartBtn: document.getElementById("addToCartBtn"),
  saleProductSearch: document.getElementById("saleProductSearch"),
  saleProduct: document.getElementById("saleProduct"),
  saleQuantity: document.getElementById("saleQuantity"),
  saleDiscount: document.getElementById("saleDiscount"),
  saleDate: document.getElementById("saleDate"),
  customerName: document.getElementById("customerName"),
  paymentStatus: document.getElementById("paymentStatus"),
  dueDate: document.getElementById("dueDate"),
  dueDateWrap: document.getElementById("dueDateWrap"),
  salePreview: document.getElementById("salePreview"),
  saleReceiptPanel: document.getElementById("saleReceiptPanel"),
  saleReceiptText: document.getElementById("saleReceiptText"),
  copyReceiptBtn: document.getElementById("copyReceiptBtn"),
  saleCartPanel: document.getElementById("saleCartPanel"),
  saleCartTable: document.getElementById("saleCartTable"),
  cartCountLabel: document.getElementById("cartCountLabel"),
  cartTotal: document.getElementById("cartTotal"),
  clearCartBtn: document.getElementById("clearCartBtn"),
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
  generateMonthSummary: document.getElementById("generateMonthSummary"),
  officialMonthSummary: document.getElementById("officialMonthSummary"),
  stockCheckForm: document.getElementById("stockCheckForm"),
  stockCheckDate: document.getElementById("stockCheckDate"),
  stockCheckTable: document.getElementById("stockCheckTable"),
  stockCheckPreview: document.getElementById("stockCheckPreview"),
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
  monthComparisonText: document.getElementById("monthComparisonText"),
  backupStatus: document.getElementById("backupStatus"),
  autoBackupStatus: document.getElementById("autoBackupStatus"),
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

function automaticBackupSnapshot() {
  try {
    return JSON.parse(localStorage.getItem(AUTO_BACKUP_KEY) || "null");
  } catch (error) {
    return null;
  }
}

function saveAutomaticBackup() {
  try {
    const snapshot = {
      savedAt: new Date().toISOString(),
      data: sanitizedState()
    };
    localStorage.setItem(AUTO_BACKUP_KEY, JSON.stringify(snapshot));
  } catch (error) {
    // Se o navegador bloquear espaço local, o app continua funcionando e o Supabase ainda tenta sincronizar.
  }
}

function formatAutoBackupTime() {
  const snapshot = automaticBackupSnapshot();
  if (!snapshot?.savedAt) return "Backup automático ainda não foi feito.";
  return `Backup automático: ${new Date(snapshot.savedAt).toLocaleString("pt-BR")}`;
}
function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  saveAutomaticBackup();
  if (cloudReady && !cloudApplying) scheduleCloudPush();
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

function dashboardGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Bom dia, Joelma 🌸";
  if (hour < 18) return "Boa tarde, Joelma 🌸";
  return "Boa noite, Joelma 🌸";
}

function applySeasonalTheme() {
  const info = logic.seasonalThemeInfo(todayISO());
  document.body.dataset.season = info.season;
  if (!els.loginSeasonDecor || !els.loginSeasonMessage) return;
  const hasTheme = info.season !== "normal";
  els.loginSeasonDecor.classList.add("hidden");
  els.loginSeasonDecor.textContent = "";
  els.loginSeasonMessage.classList.toggle("hidden", !hasTheme);
  els.loginSeasonMessage.textContent = info.message;
}

function renderRankingCard(rank, nameEl, detailEl, emptyName, detailBuilder) {
  if (!nameEl || !detailEl) return;
  if (!rank) {
    nameEl.textContent = emptyName;
    detailEl.textContent = "-";
    return;
  }
  nameEl.textContent = rank.customer;
  detailEl.textContent = detailBuilder(rank);
}

function renderCustomerRankings() {
  const rankings = logic.customerRankings(state.sales, todayISO());
  renderRankingCard(rankings.monthVip, els.customerVipName, els.customerVipDetail, "Sem vendas ainda", rank => `${money(rank.total)} no mês - ${rank.salesCount} venda(s)`);
  renderRankingCard(rankings.weekBuyer, els.weeklyBuyerName, els.weeklyBuyerDetail, "Sem vendas na semana", rank => `${money(rank.total)} nesta semana - ${rank.salesCount} venda(s)`);
  renderRankingCard(rankings.topDebtor, els.topDebtorName, els.topDebtorDetail, "Ninguém devendo", rank => `${money(rank.total)} em aberto - prazo ${formatDate(rank.nextDueDate)}`);
  renderRankingCard(rankings.onTimePayer, els.onTimePayerName, els.onTimePayerDetail, "Sem histórico ainda", rank => `${rank.salesCount} pagamento(s) no prazo - ${money(rank.total)}`);
}
function render() {
  saveState();
  applySeasonalTheme();
  renderDates();
  renderProductOptions();
  renderProducts();
  renderPurchases();
  renderSales();
  renderDebts();
  renderClosing();
  renderShoppingList();
  renderStockConference();
  renderDashboard();
  renderReports();
  updateSalePreview();
  updatePurchasePreview();
}

function renderDates() {
  els.todayLabel.textContent = `Hoje: ${formatDate(todayISO())}`;
  if (!els.saleDate.value) els.saleDate.value = todayISO();
  if (!els.purchaseDate.value) els.purchaseDate.value = todayISO();
  if (els.stockCheckDate && !els.stockCheckDate.value) els.stockCheckDate.value = todayISO();
  if (els.closingDate && !els.closingDate.value) els.closingDate.value = todayISO();
  if (els.closingMonth && !els.closingMonth.value) els.closingMonth.value = todayISO().slice(0, 7);
}

function fillProductSelect(select, emptyText, products = state.products) {
  select.innerHTML = "";
  if (!state.products.length) {
    select.innerHTML = `<option value="">${emptyText}</option>`;
    select.disabled = true;
    return;
  }
  if (!products.length) {
    select.innerHTML = '<option value="">Nenhum produto encontrado</option>';
    select.disabled = true;
    return;
  }
  select.disabled = false;
  logic.sortProductsByName(products).forEach(product => {
    const option = document.createElement("option");
    option.value = product.id;
    option.textContent = `${product.name}${logic.isSupplyProduct(product) ? " (insumo)" : ""} - estoque: ${product.stock}`;
    select.appendChild(option);
  });
}

function renderProductOptions() {
  const selectedSaleProduct = els.saleProduct.value;
  const saleBaseProducts = logic.filterProductsByCategory(logic.filterSellableProducts(state.products), els.saleCategory.value);
  const saleProducts = logic.sortProductsByName(logic.filterProducts(saleBaseProducts, els.saleProductSearch.value));
  fillProductSelect(els.saleProduct, "Cadastre um produto primeiro", saleProducts);
  if (saleProducts.some(product => product.id === selectedSaleProduct)) els.saleProduct.value = selectedSaleProduct;
  fillProductSelect(els.purchaseProduct, "Cadastre um produto primeiro");
}
function renderProducts() {
  if (!state.products.length) {
    els.productsTable.innerHTML = '<tr><td colspan="8">Nenhum produto cadastrado ainda.</td></tr>';
    return;
  }
  els.productsTable.innerHTML = logic.sortProductsByName(state.products).map(product => {
    const profit = product.price - product.cost;
    const stockClass = product.stock <= product.minStock ? "badge late" : "badge paid";
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
    els.purchasesTable.innerHTML = '<tr><td colspan="7">Nenhuma compra registrada ainda.</td></tr>';
    return;
  }
  els.purchasesTable.innerHTML = recent.map(purchase => `
    <tr>
      <td>${formatDate(purchase.date)}</td>
      <td>${escapeHTML(purchase.productName)}</td>
      <td>${escapeHTML(purchase.category || "Mercadoria")}</td>
      <td>${purchase.quantity}</td>
      <td>${money(purchase.unitCost)}</td>
      <td>${money(purchase.quantity * purchase.unitCost)}</td>
      <td>${escapeHTML(purchase.note || "-")}</td>
    </tr>`).join("");
}

function isPendingPaymentType(value) {
  return value === "payday" || value === "voucher" || value === "pending";
}

function salePaymentLabel(sale) {
  if (sale.status === "pending") return sale.paymentType === "payday" ? "Pagamento" : "Vale";
  if (sale.paymentType === "payday") return "Pagamento recebido";
  if (sale.paymentType === "voucher") return "Vale recebido";
  return "Pago na hora";
}

function paymentSelectValueForSale(sale) {
  if (sale.status === "pending") return sale.paymentType === "payday" ? "payday" : "voucher";
  return sale.paymentType || "paid-now";
}
function renderSales() {
  const recent = logic.saleDisplayRows(state.sales).slice(0, 8);
  if (!recent.length) {
    els.recentSalesTable.innerHTML = '<tr><td colspan="8">Nenhuma venda registrada ainda.</td></tr>';
    return;
  }
  els.recentSalesTable.innerHTML = recent.map(row => {
    const paidText = salePaymentLabel(row.sale);
    const badgeClass = row.status === "pending" ? "pending" : "paid";
    const actions = row.isGroup
      ? `<button class="secondary danger" type="button" data-delete-sale-group="${row.saleGroupId}">Excluir</button>`
      : `<button class="secondary" type="button" data-edit-sale="${row.sale.id}">Editar</button><button class="secondary danger" type="button" data-delete-sale="${row.sale.id}">Excluir</button>`;
    return `
      <tr>
        <td>${formatDate(row.date)}</td>
        <td>${escapeHTML(row.customer || "Cliente")}</td>
        <td>${escapeHTML(row.productName)}</td>
        <td>${escapeHTML(row.category || "-")}</td>
        <td>${row.quantity}</td>
        <td>${money(row.total)}</td>
        <td><span class="badge ${badgeClass}">${paidText}</span></td>
        <td class="actions">${actions}</td>
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
  renderOfficialMonthSummary(isMonth, period, periodLabel);
}

function renderOfficialMonthSummary(isMonth, period, periodLabel) {
  if (!els.officialMonthSummary) return;
  if (!officialMonthSummaryVisible || !isMonth) {
    els.officialMonthSummary.classList.add("hidden");
    return;
  }

  const summary = logic.monthlyBusinessSummary(state.sales, state.purchases, period, state.products);
  const debtors = summary.debtors.length ? summary.debtors.map(debtor => `
    <div class="summary-line debtor-summary"><span>${escapeHTML(debtor.customer)}<small>${debtor.salesCount} venda(s), prazo ${formatDate(debtor.nextDueDate)}</small></span><strong>${money(debtor.total)}</strong></div>
  `).join("") : '<div class="summary-line"><span>Lista de devedores</span><strong>Ninguém devendo neste mês</strong></div>';

  els.officialMonthSummary.classList.remove("hidden");
  els.officialMonthSummary.innerHTML = `
    <div class="panel-title-row">
      <div>
        <p class="eyebrow accent-text">resumo oficial</p>
        <h3>Fechamento de ${periodLabel}</h3>
      </div>
      <span class="soft-label">Gerado agora</span>
    </div>
    <div class="official-grid">
      <div class="summary-line"><span>Vendido no mês</span><strong>${money(summary.soldTotal)}</strong></div>
      <div class="summary-line"><span>Lucro bruto</span><strong>${money(summary.estimatedProfit)}</strong></div>
      <div class="summary-line"><span>Pendente para receber</span><strong>${money(summary.pendingTotal)}</strong></div>
      <div class="summary-line"><span>Mercadorias compradas</span><strong>${money(summary.purchasesTotal)}</strong></div>
      <div class="summary-line"><span>Insumos / materiais</span><strong>${money(summary.suppliesTotal)}</strong></div>
      <div class="summary-line balance-line"><span>Lucro final estimado</span><strong>${money(summary.finalEstimatedProfit)}</strong></div>
      <div class="summary-line balance-line"><span>Saldo estimado</span><strong>${money(summary.estimatedBalance)}</strong></div>
    </div>
    <h4>Lista de devedores do mês</h4>
    <div class="closing-summary">${debtors}</div>`;
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


function stockCheckCountMap() {
  const counts = {};
  if (!els.stockCheckTable) return counts;
  els.stockCheckTable.querySelectorAll("[data-stock-count]").forEach(input => {
    counts[input.dataset.stockCount] = Number(input.value || 0);
  });
  return counts;
}

function updateStockCheckPreview() {
  if (!els.stockCheckPreview) return;
  const plan = logic.stockConferencePlan(state.products, stockCheckCountMap());
  if (!plan.adjustments.length) {
    els.stockCheckPreview.textContent = "Nenhuma diferença.";
    return;
  }
  const soldQuantity = sum(plan.sold, item => item.quantitySold);
  const soldRevenue = sum(plan.sold, item => item.revenue);
  const soldProfit = sum(plan.sold, item => item.profit);
  els.stockCheckPreview.textContent = soldQuantity
    ? `${soldQuantity} un. vendida(s) pela conferência - ${money(soldRevenue)} | lucro ${money(soldProfit)}`
    : `${plan.adjustments.length} ajuste(s) de estoque sem venda.`;
}

function renderStockConference() {
  if (!els.stockCheckTable) return;
  if (!state.products.length) {
    els.stockCheckTable.innerHTML = '<tr><td colspan="5">Cadastre produtos antes de conferir o estoque.</td></tr>';
    els.stockCheckPreview.textContent = "Nenhuma diferença.";
    return;
  }
  els.stockCheckTable.innerHTML = logic.sortProductsByName(state.products).map(product => `
    <tr>
      <td><strong>${escapeHTML(product.name)}</strong></td>
      <td>${escapeHTML(product.category || "Sem categoria")}</td>
      <td>${Number(product.stock || 0)}</td>
      <td><input class="stock-count-input" type="number" min="0" step="1" value="${Number(product.stock || 0)}" data-stock-count="${product.id}"></td>
      <td data-stock-diff="${product.id}">0</td>
    </tr>`).join("");
  updateStockCheckPreview();
}

function refreshStockCheckDiffs() {
  if (!els.stockCheckTable) return;
  const counts = stockCheckCountMap();
  logic.sortProductsByName(state.products).forEach(product => {
    const cell = els.stockCheckTable.querySelector(`[data-stock-diff="${product.id}"]`);
    if (!cell) return;
    const difference = Number(counts[product.id] || 0) - Number(product.stock || 0);
    cell.textContent = difference > 0 ? `+${difference}` : String(difference);
    cell.className = difference < 0 ? "stock-negative" : difference > 0 ? "stock-positive" : "";
  });
  updateStockCheckPreview();
}

function handleStockCheckSubmit(event) {
  event.preventDefault();
  const plan = logic.stockConferencePlan(state.products, stockCheckCountMap());
  if (!plan.adjustments.length) return showToast("Nenhuma diferença para salvar.");
  const date = els.stockCheckDate.value || todayISO();
  const sales = plan.sold.map(item => ({
    id: uid("sale"),
    productId: item.productId,
    productSnapshot: { name: item.productName, category: item.category || "Sem categoria", cost: item.unitCost, price: item.unitPrice },
    unitCost: item.unitCost,
    unitPrice: item.unitPrice,
    quantity: item.quantitySold,
    discount: 0,
    date,
    customer: "Conferência de estoque",
    status: "paid",
    paymentType: "paid-now",
    dueDate: "",
    paidDate: date,
    source: "stock-check"
  }));
  plan.adjustments.forEach(adjustment => {
    const product = getProduct(adjustment.productId);
    if (product) product.stock = adjustment.countedStock;
  });
  state.sales.push(...sales);
  render();
  if (sales.length) {
    lastSaleReceiptText = cartReceiptText(sales);
    els.saleReceiptText.textContent = lastSaleReceiptText;
    els.saleReceiptPanel.classList.remove("hidden");
  }
  showToast(sales.length ? "Conferência salva e venda registrada." : "Estoque ajustado.");
}
function renderDashboard() {
  const today = todayISO();
  const todaySales = state.sales.filter(sale => sale.date === today);
  const todayRevenue = sum(todaySales, sale => saleTotals(sale).revenue);
  const todayProfit = sum(todaySales, sale => saleTotals(sale).profit);
  const pendingSales = state.sales.filter(sale => sale.status === "pending");
  const pendingAmount = sum(pendingSales, sale => saleTotals(sale).revenue);
  const pendingClients = new Set(pendingSales.map(sale => (sale.customer || "Cliente sem nome").trim()).filter(Boolean)).size;
  const lowStockCount = logic.shoppingList(state.products).length;
  const stockCost = sum(state.products, product => product.cost * product.stock);
  const month = logic.monthStats(state.sales, today);
  els.dashboardGreeting.textContent = dashboardGreeting();
  els.joTodaySales.textContent = todaySales.length
    ? "Hoje a lojinha já teve movimento. Os detalhes estão nos cards abaixo."
    : "Hoje ainda não teve venda registrada. Quando vender, os cards abaixo atualizam sozinhos.";
  els.joPendingClients.textContent = pendingClients
    ? `${pendingClients} cliente(s) para acompanhar no a receber.`
    : "Nenhum cliente pendente hoje.";
  els.joLowStock.textContent = lowStockCount
    ? `${lowStockCount} produto(s) para colocar na lista de compras.`
    : "Estoque sem alerta de reposição.";
  els.joTodayProfit.textContent = pendingClients || lowStockCount
    ? "Prioridade do dia: olhar os avisos antes de fechar."
    : "Tudo em ordem por enquanto.";
  document.getElementById("todayRevenue").textContent = money(todayRevenue);
  document.getElementById("todayProfit").textContent = money(todayProfit);
  document.getElementById("pendingAmount").textContent = money(pendingAmount);
  document.getElementById("stockCost").textContent = money(stockCost);
  els.monthRevenue.textContent = money(month.soldTotal);
  els.monthProfit.textContent = money(month.profit);
  els.monthSalesCount.textContent = month.salesCount;
  els.monthPendingAmount.textContent = money(month.pendingTotal);

  const highlights = logic.monthHighlights(state.sales, state.products, today.slice(0, 7));
  if (highlights.topSelling) {
    els.monthTopSelling.textContent = highlights.topSelling.name;
    els.monthTopSellingDetail.textContent = `${highlights.topSelling.quantity} un. vendida(s) - ${money(highlights.topSelling.total)}`;
  } else {
    els.monthTopSelling.textContent = "Nenhuma venda no mês";
    els.monthTopSellingDetail.textContent = "-";
  }
  if (highlights.topProfit) {
    els.monthTopProfit.textContent = highlights.topProfit.name;
    els.monthTopProfitDetail.textContent = `${money(highlights.topProfit.profit)} de lucro - ${highlights.topProfit.quantity} un.`;
  } else {
    els.monthTopProfit.textContent = "Nenhuma venda no mês";
    els.monthTopProfitDetail.textContent = "-";
  }
  if (highlights.idleStock) {
    els.monthIdleStock.textContent = highlights.idleStock.name;
    els.monthIdleStockDetail.textContent = `${highlights.idleStock.stock} em estoque - ${money(highlights.idleStock.stockValue)} parado`;
  } else {
    els.monthIdleStock.textContent = "Tudo girando bem";
    els.monthIdleStockDetail.textContent = "Nenhum produto parado com estoque";
  }

  renderCustomerRankings();

  const lowStock = logic.shoppingList(state.products);
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

function comparisonLine(label, diff, percent) {
  if (diff === 0) return `${label} ficou igual ao mês anterior.`;
  const direction = diff > 0 ? "aumentou" : "caiu";
  return `${label} ${direction} ${money(Math.abs(diff))} (${formatPercent(Math.abs(percent))}) em relação ao mês anterior.`;
}

function renderMonthComparison(range) {
  if (!els.monthComparisonText) return;
  if (!range.start || !range.end || range.start.slice(0, 7) !== range.end.slice(0, 7)) {
    els.monthComparisonText.innerHTML = "Escolha um mês fechado para comparar com o mês anterior.";
    return;
  }
  const comparison = logic.monthComparison(state.sales, range.start.slice(0, 7));
  els.monthComparisonText.innerHTML = `
    <div class="summary-line"><span>Vendas</span><strong>${comparisonLine("Você vendeu", comparison.revenueDiff, comparison.revenuePercent)}</strong></div>
    <div class="summary-line"><span>Lucro</span><strong>${comparisonLine("O lucro", comparison.profitDiff, comparison.profitPercent)}</strong></div>`;
}
function renderReports() {
  const range = getReportRange();
  const isCustom = els.reportFilter.value === "custom";
  els.reportStartWrap.classList.toggle("hidden", !isCustom);
  els.reportEndWrap.classList.toggle("hidden", !isCustom);
  els.reportPeriodLabel.textContent = range.label;
  renderMonthComparison(range);

  const filteredSales = state.sales.filter(sale => {
    if (range.start && sale.date < range.start) return false;
    if (range.end && sale.date > range.end) return false;
    return true;
  });
  const allRevenue = sum(filteredSales, sale => saleTotals(sale).revenue);
  const allProfit = sum(filteredSales, sale => saleTotals(sale).profit);
  const sellableProducts = logic.filterSellableProducts(state.products);
  const stockSaleValue = sum(sellableProducts, product => product.price * product.stock);
  const stockCost = sum(sellableProducts, product => product.cost * product.stock);
  const filteredPurchases = state.purchases.filter(purchase => {
    if (range.start && purchase.date < range.start) return false;
    if (range.end && purchase.date > range.end) return false;
    return true;
  });
  const purchaseTotals = logic.purchaseBreakdown(filteredPurchases, state.products);
  document.getElementById("allRevenue").textContent = money(allRevenue);
  document.getElementById("allProfit").textContent = money(allProfit);
  document.getElementById("suppliesExpense").textContent = money(purchaseTotals.suppliesTotal);
  document.getElementById("finalProfit").textContent = money(allProfit - purchaseTotals.suppliesTotal);
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
  els.autoBackupStatus.textContent = formatAutoBackupTime();
}

function currentCartGross() {
  return logic.cartTotals(saleCart, 0).gross;
}

function cartReceiptText(sales) {
  const first = sales[0];
  const total = sum(sales, sale => saleTotals(sale).revenue);
  const lines = [
    "Venda registrada com sucesso",
    `Cliente: ${first.customer || "Cliente"}`,
    "Itens:"
  ];
  sales.forEach(sale => lines.push(`- ${sale.productSnapshot.name} (${sale.productSnapshot.category || "Sem categoria"}) x${sale.quantity}: ${money(saleTotals(sale).revenue)}`));
  lines.push(`Total: ${money(total)}`);
  lines.push(`Pagamento: ${salePaymentLabel(first)}`);
  if (first.status === "pending") lines.push(`Prazo: ${formatDate(first.dueDate)}`);
  return lines.join("\n");
}

function renderSaleCart() {
  if (!els.saleCartPanel) return;
  els.saleCartPanel.classList.toggle("hidden", !saleCart.length);
  els.cartCountLabel.textContent = saleCart.length === 1 ? "1 item" : `${saleCart.length} itens`;
  const totals = logic.cartTotals(saleCart, Number(els.saleDiscount.value || 0));
  els.cartTotal.textContent = money(totals.revenue);
  if (saleCart.length) els.salePreview.textContent = money(totals.revenue);
  els.saleCartTable.innerHTML = saleCart.map(item => `
    <tr>
      <td>${escapeHTML(item.productSnapshot.name)}</td>
      <td>${escapeHTML(item.productSnapshot.category || "-")}</td>
      <td>${item.quantity}</td>
      <td>${money(Number(item.unitPrice || 0) * Number(item.quantity || 0))}</td>
      <td class="actions"><button class="secondary danger" type="button" data-remove-cart="${item.productId}">Remover</button></td>
    </tr>`).join("");
}

function addCurrentItemToCart() {
  const product = getProduct(els.saleProduct.value);
  const quantity = Number(els.saleQuantity.value || 0);
  if (!product) return showToast("Escolha um produto para adicionar.");
  if (quantity <= 0) return showToast("Informe a quantidade.");
  const alreadyInCart = sum(saleCart.filter(item => item.productId === product.id), item => item.quantity);
  if (alreadyInCart + quantity > product.stock) return showToast("Não tem essa quantidade em estoque para o carrinho.");
  const existing = saleCart.find(item => item.productId === product.id);
  if (existing) existing.quantity += quantity;
  else saleCart.push({
    productId: product.id,
    productSnapshot: { name: product.name, category: product.category || "", cost: product.cost, price: product.price },
    unitCost: product.cost,
    unitPrice: product.price,
    quantity
  });
  els.saleQuantity.value = 1;
  els.saleProductSearch.value = "";
  renderProductOptions();
  renderSaleCart();
  updateSalePreview();
  showToast("Produto adicionado ao carrinho.");
}

function clearSaleCart() {
  saleCart = [];
  renderSaleCart();
  updateSalePreview();
}

function removeCartItem(productId) {
  saleCart = saleCart.filter(item => item.productId !== productId);
  renderSaleCart();
  updateSalePreview();
}

function buildSalesFromCart() {
  const discount = Number(els.saleDiscount.value || 0);
  const gross = currentCartGross();
  if (discount > gross) return null;
  let usedDiscount = 0;
  const groupId = uid("cart");
  return saleCart.map((item, index) => {
    const itemGross = Number(item.unitPrice || 0) * Number(item.quantity || 0);
    const itemDiscount = index === saleCart.length - 1 ? discount - usedDiscount : Math.round((discount * (itemGross / gross)) * 100) / 100;
    usedDiscount += itemDiscount;
    return {
      id: uid("sale"),
      saleGroupId: groupId,
      productId: item.productId,
      productSnapshot: item.productSnapshot,
      unitCost: item.unitCost,
      unitPrice: item.unitPrice,
      quantity: item.quantity,
      discount: itemDiscount,
      date: els.saleDate.value,
      customer: els.customerName.value.trim(),
      status: isPendingPaymentType(els.paymentStatus.value) ? "pending" : "paid",
      paymentType: els.paymentStatus.value,
      dueDate: isPendingPaymentType(els.paymentStatus.value) ? els.dueDate.value : "",
      paidDate: els.paymentStatus.value === "paid-now" ? els.saleDate.value : ""
    };
  });
}

function saveCartSale() {
  if (isPendingPaymentType(els.paymentStatus.value) && !els.customerName.value.trim()) return showToast("Informe o nome de quem vai pagar depois.");
  const sales = buildSalesFromCart();
  if (!sales) return showToast("O desconto não pode ser maior que o total da venda.");
  const requestedByProduct = new Map();
  saleCart.forEach(item => requestedByProduct.set(item.productId, (requestedByProduct.get(item.productId) || 0) + Number(item.quantity || 0)));
  for (const [productId, requested] of requestedByProduct) {
    const product = getProduct(productId);
    if (!product || requested > Number(product.stock || 0)) return showToast("Não tem essa quantidade em estoque para o carrinho.");
  }
  for (const sale of sales) logic.applySaleStockChange(state.products, null, sale);
  state.sales.push(...sales);
  resetSaleForm();
  saleCart = [];
  render();
  lastSaleReceiptText = cartReceiptText(sales);
  els.saleReceiptText.textContent = lastSaleReceiptText;
  els.saleReceiptPanel.classList.remove("hidden");
  showToast("Venda registrada com carrinho.");
}
function showSaleReceipt(sale) {
  if (!els.saleReceiptPanel || !els.saleReceiptText) return;
  lastSaleReceiptText = logic.saleReceiptText(sale);
  els.saleReceiptText.textContent = lastSaleReceiptText;
  els.saleReceiptPanel.classList.remove("hidden");
}

async function copySaleReceipt() {
  if (!lastSaleReceiptText) return showToast("Nenhum recibinho para copiar ainda.");
  try {
    await navigator.clipboard.writeText(lastSaleReceiptText);
    showToast("Resumo copiado para o WhatsApp.");
  } catch (error) {
    const area = document.createElement("textarea");
    area.value = lastSaleReceiptText;
    document.body.appendChild(area);
    area.select();
    document.execCommand("copy");
    area.remove();
    showToast("Resumo copiado para o WhatsApp.");
  }
}
function updateSalePreview() {
  setSaleModeUI();
  const quick = isQuickSaleMode();
  if (quick) {
    const amount = Number(els.quickSaleAmount.value || 0);
    const estimate = logic.quickSaleEstimate(state.products, amount);
    els.salePreview.textContent = money(estimate.revenue);
    els.quickSaleEstimateText.textContent = amount > 0 ? `Lucro estimado pela média: ${money(estimate.estimatedProfit)} (${formatPercent(estimate.profitRate)})` : "";
  } else {
    els.quickSaleEstimateText.textContent = "";
    const product = getProduct(els.saleProduct.value);
    const quantity = Number(els.saleQuantity.value || 0);
    const discount = Number(els.saleDiscount.value || 0);
    if (saleCart.length) {
      els.salePreview.textContent = money(logic.cartTotals(saleCart, discount).revenue);
      renderSaleCart();
    } else {
      els.salePreview.textContent = money(product ? logic.saleTotals({ unitPrice: product.price, unitCost: product.cost, quantity, discount }).revenue : 0);
    }
  }
  els.dueDateWrap.classList.toggle("hidden", !isPendingPaymentType(els.paymentStatus.value));
  if (isPendingPaymentType(els.paymentStatus.value) && !els.dueDate.value) els.dueDate.value = todayISO();
}

function updatePurchasePreview() {
  const quantity = Number(els.purchaseQuantity.value || 0);
  const unitCost = Number(els.purchaseUnitCost.value || 0);
  const product = getProduct(els.purchaseProduct.value);
  if (product && !els.purchaseUnitCost.value) els.purchaseUnitCost.value = product.cost;
  els.purchasePreview.textContent = money(quantity * Number(els.purchaseUnitCost.value || unitCost));
}

async function handleLogin(event) {
  event.preventDefault();
  const userOk = els.loginUser.value.trim().toLowerCase() === LOGIN_USER.toLowerCase();
  const passwordOk = els.loginPassword.value === LOGIN_PASSWORD;
  if (!userOk || !passwordOk) {
    els.loginError.textContent = "Login ou senha incorretos.";
    return;
  }
  const cloudLoginOk = await signInSupabaseIfConfigured(els.loginPassword.value);
  if (!cloudLoginOk) return;
  sessionStorage.setItem(SESSION_KEY, "sim");
  els.loginError.textContent = "";
  showApp();
  initSupabaseSync();
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


function isQuickSaleMode() {
  return els.saleMode && els.saleMode.value === "amount";
}

function setSaleModeUI() {
  const quick = isQuickSaleMode();
  [els.saleCategoryWrap, els.saleProductSearchWrap, els.saleProductWrap, els.saleQuantityWrap, els.saleDiscountWrap].forEach(element => element?.classList.toggle("hidden", quick));
  [els.quickSaleAmountWrap, els.quickSaleNoteWrap].forEach(element => element?.classList.toggle("hidden", !quick));
  els.saleProduct.disabled = quick;
  els.saleProduct.required = !quick;
  els.saleQuantity.disabled = quick;
  els.saleQuantity.required = !quick;
  els.saleCategory.disabled = quick;
  els.saleProductSearch.disabled = quick;
  els.saleDiscount.disabled = quick;
  els.addToCartBtn.disabled = quick || Boolean(els.editingSaleId.value);
}

function buildQuickSaleFromForm(id) {
  const amount = Number(els.quickSaleAmount.value || 0);
  const estimate = logic.quickSaleEstimate(state.products, amount);
  const note = els.quickSaleNote.value.trim();
  return {
    id,
    productId: "",
    productSnapshot: { name: note ? `Venda por valor - ${note}` : "Venda por valor", category: "Sem produto", cost: estimate.estimatedCost, price: estimate.revenue },
    unitCost: estimate.estimatedCost,
    unitPrice: estimate.revenue,
    quantity: 1,
    discount: 0,
    date: els.saleDate.value,
    customer: els.customerName.value.trim(),
    status: isPendingPaymentType(els.paymentStatus.value) ? "pending" : "paid",
    paymentType: els.paymentStatus.value,
    dueDate: isPendingPaymentType(els.paymentStatus.value) ? els.dueDate.value : "",
    paidDate: els.paymentStatus.value === "paid-now" ? els.saleDate.value : "",
    quickSale: true,
    estimatedProfitRate: estimate.profitRate,
    note
  };
}

function handleQuickSaleSubmit(editingId, oldSale) {
  const amount = Number(els.quickSaleAmount.value || 0);
  if (amount <= 0) return showToast("Informe o valor vendido.");
  if (isPendingPaymentType(els.paymentStatus.value) && !els.customerName.value.trim()) return showToast("Informe o nome de quem vai pagar depois.");
  const nextSale = buildQuickSaleFromForm(editingId || uid("sale"));
  logic.applySaleStockChange(state.products, oldSale, nextSale);
  if (oldSale) {
    const index = state.sales.findIndex(sale => sale.id === oldSale.id);
    state.sales[index] = nextSale;
  } else {
    state.sales.push(nextSale);
  }
  resetSaleForm();
  render();
  showSaleReceipt(nextSale);
  showToast(oldSale ? "Venda por valor atualizada." : "Venda por valor registrada.");
}
function buildSaleFromForm(id, product, quantity) {
  return {
    id,
    productId: product.id,
    productSnapshot: { name: product.name, category: product.category || "", cost: product.cost, price: product.price },
    unitCost: product.cost,
    unitPrice: product.price,
    quantity,
    discount: Number(els.saleDiscount.value || 0),
    date: els.saleDate.value,
    customer: els.customerName.value.trim(),
    status: isPendingPaymentType(els.paymentStatus.value) ? "pending" : "paid",
    paymentType: els.paymentStatus.value,
    dueDate: isPendingPaymentType(els.paymentStatus.value) ? els.dueDate.value : "",
    paidDate: els.paymentStatus.value === "paid-now" ? els.saleDate.value : ""
  };
}

function resetSaleForm() {
  els.saleForm.reset();
  els.editingSaleId.value = "";
  els.saleMode.value = "product";
  els.quickSaleAmount.value = "";
  els.quickSaleNote.value = "";
  els.saleQuantity.value = 1;
  els.saleDiscount.value = 0;
  els.saleDate.value = todayISO();
  els.saleSubmitBtn.textContent = "Salvar venda";
  els.cancelEditSale.classList.add("hidden");
  updateSalePreview();
}

function handleSaleSubmit(event) {
  event.preventDefault();
  const editingId = els.editingSaleId.value;
  const oldSale = editingId ? state.sales.find(sale => sale.id === editingId) : null;
  if (isQuickSaleMode()) return handleQuickSaleSubmit(editingId, oldSale);
  if (saleCart.length) return saveCartSale();
  const product = getProduct(els.saleProduct.value);
  const quantity = Number(els.saleQuantity.value);
  const availableStock = product ? product.stock + (oldSale && oldSale.productId === product.id ? Number(oldSale.quantity) : 0) : 0;
  if (!product) return showToast("Cadastre um produto primeiro.");
  if (quantity > availableStock) return showToast("Não tem essa quantidade em estoque.");
  if (Number(els.saleDiscount.value || 0) > product.price * quantity) return showToast("O desconto não pode ser maior que o total da venda.");
  if (isPendingPaymentType(els.paymentStatus.value) && !els.customerName.value.trim()) return showToast("Informe o nome de quem vai pagar depois.");
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
  showSaleReceipt(nextSale);
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
    category: product.category || "Mercadoria",
    purchaseKind: logic.isSupplyProduct(product) ? "supply" : "merchandise",
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
  if (sale.quickSale || !sale.productId) {
    els.saleMode.value = "amount";
    els.quickSaleAmount.value = saleTotals(sale).revenue;
    els.quickSaleNote.value = sale.note || "";
    els.saleDiscount.value = 0;
  } else {
    els.saleMode.value = "product";
    els.saleProduct.value = sale.productId;
    els.saleQuantity.value = sale.quantity;
    els.saleDiscount.value = sale.discount || 0;
  }
  els.saleDate.value = sale.date;
  els.customerName.value = sale.customer || "";
  els.paymentStatus.value = paymentSelectValueForSale(sale);
  els.dueDate.value = sale.dueDate || "";
  els.saleSubmitBtn.textContent = "Atualizar venda";
  els.cancelEditSale.classList.remove("hidden");
  updateSalePreview();
  setScreen("sale");
}

function deleteSale(id) {
  const sale = state.sales.find(item => item.id === id);
  if (!sale) return;
  const message = sale.quickSale || !sale.productId ? "Excluir esta venda por valor?" : "Excluir esta venda e devolver o produto ao estoque?";
  if (!confirm(message)) return;
  logic.applySaleStockChange(state.products, sale, null);
  state.sales = state.sales.filter(item => item.id !== id);
  if (els.editingSaleId.value === id) resetSaleForm();
  render();
  showToast(sale.quickSale || !sale.productId ? "Venda por valor excluída." : "Venda excluída e estoque devolvido.");
}

function deleteSaleGroup(groupId) {
  const sales = state.sales.filter(item => item.saleGroupId === groupId);
  if (!sales.length) return;
  if (!confirm("Excluir este carrinho e devolver todos os produtos ao estoque?")) return;
  sales.forEach(sale => logic.applySaleStockChange(state.products, sale, null));
  state.sales = state.sales.filter(item => item.saleGroupId !== groupId);
  if (sales.some(sale => els.editingSaleId.value === sale.id)) resetSaleForm();
  render();
  showToast("Carrinho excluído e estoque devolvido.");
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

function hasLocalBusinessData(data) {
  return Boolean(
    (Array.isArray(data.products) && data.products.length) ||
    (Array.isArray(data.sales) && data.sales.length) ||
    (Array.isArray(data.purchases) && data.purchases.length)
  );
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

function readableError(error) {
  return error?.message || error?.error_description || error?.details || String(error || "erro desconhecido");
}
function setSyncStatus(message) {
  if (els.syncStatus) els.syncStatus.textContent = message;
}

function hasSupabaseConfig(config) {
  return Boolean(config && config.url && config.anonKey && !config.url.includes("COLOQUE") && !config.anonKey.includes("COLOQUE"));
}

async function ensureCloudClient() {
  const config = window.LOJINHA_SUPABASE;
  if (!hasSupabaseConfig(config)) return false;
  if (!cloudClient) {
    const module = await import("https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm");
    cloudClient = module.createClient(config.url, config.anonKey);
  }
  cloudTable = config.table || cloudTable;
  cloudRowId = config.rowId || cloudRowId;
  return true;
}

async function signInSupabaseIfConfigured(password) {
  const config = window.LOJINHA_SUPABASE;
  if (!hasSupabaseConfig(config) || location.protocol === "file:") return true;
  try {
    setSyncStatus("Entrando no sync...");
    await ensureCloudClient();
    const result = await cloudClient.auth.signInWithPassword({
      email: config.authEmail,
      password
    });
    if (result.error) throw result.error;
    return true;
  } catch (error) {
    console.error("Supabase login error", error);
    const message = readableError(error);
    setSyncStatus(`Login falhou: ${message}`);
    els.loginError.textContent = `Login correto, mas o Supabase recusou: ${message}`;
    return false;
  }
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
    await ensureCloudClient();
    const sessionResult = await cloudClient.auth.getSession();
    if (!sessionResult.data.session) {
      sessionStorage.removeItem(SESSION_KEY);
      showLogin();
      setSyncStatus("Faça login para sincronizar");
      return;
    }

    const result = await cloudClient.from(cloudTable).select("data").eq("id", cloudRowId).maybeSingle();
    if (result.error) throw result.error;

    const cloudData = result.data?.data;
    const localData = sanitizedState();
    if (cloudData && hasLocalBusinessData(cloudData)) {
      cloudApplying = true;
      replaceState(cloudData);
      lastCloudJson = JSON.stringify(sanitizedState());
      render();
      cloudApplying = false;
    } else if (hasLocalBusinessData(localData)) {
      await pushCloudState(true);
    } else if (cloudData) {
      cloudApplying = true;
      replaceState(cloudData);
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
    console.error("Supabase sync error", error);
    const message = readableError(error);
    cloudReady = false;
    setSyncStatus(`Sync erro: ${message}`);
    showToast(`Supabase: ${message}`);
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
    console.error("Supabase save error", error);
    const message = readableError(error);
    setSyncStatus(`Erro no sync: ${message}`);
    showToast(`Não salvei na nuvem: ${message}`);
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
els.saleMode.addEventListener("change", () => { if (isQuickSaleMode() && saleCart.length) clearSaleCart(); updateSalePreview(); });
els.quickSaleAmount.addEventListener("input", updateSalePreview);
els.quickSaleNote.addEventListener("input", updateSalePreview);
els.purchaseForm.addEventListener("submit", handlePurchaseSubmit);
els.saleCategory.addEventListener("change", () => { renderProductOptions(); updateSalePreview(); });
els.saleProductSearch.addEventListener("input", () => { renderProductOptions(); updateSalePreview(); });
els.addToCartBtn.addEventListener("click", addCurrentItemToCart);
els.saleProduct.addEventListener("change", updateSalePreview);
els.saleQuantity.addEventListener("input", updateSalePreview);
els.saleDiscount.addEventListener("input", updateSalePreview);
els.cancelEditSale.addEventListener("click", resetSaleForm);
els.copyReceiptBtn.addEventListener("click", copySaleReceipt);
els.clearCartBtn.addEventListener("click", clearSaleCart);
els.saleCartTable.addEventListener("click", event => { if (event.target.dataset.removeCart) removeCartItem(event.target.dataset.removeCart); });
els.paymentStatus.addEventListener("change", updateSalePreview);
els.purchaseProduct.addEventListener("change", () => {
  const product = getProduct(els.purchaseProduct.value);
  els.purchaseUnitCost.value = product ? product.cost : "";
  updatePurchasePreview();
});
els.purchaseQuantity.addEventListener("input", updatePurchasePreview);
els.purchaseUnitCost.addEventListener("input", updatePurchasePreview);
els.stockCheckForm.addEventListener("submit", handleStockCheckSubmit);
els.stockCheckTable.addEventListener("input", event => { if (event.target.dataset.stockCount) refreshStockCheckDiffs(); });
els.reportFilter.addEventListener("change", renderReports);
els.reportStart.addEventListener("input", renderReports);
els.reportEnd.addEventListener("input", renderReports);
els.closingMode.addEventListener("change", renderClosing);
els.closingDate.addEventListener("input", renderClosing);
els.closingMonth.addEventListener("input", renderClosing);
els.generateMonthSummary.addEventListener("click", () => {
  officialMonthSummaryVisible = true;
  els.closingMode.value = "month";
  if (!els.closingMonth.value) els.closingMonth.value = todayISO().slice(0, 7);
  renderClosing();
});
els.recentSalesTable.addEventListener("click", event => {
  const editId = event.target.dataset.editSale;
  const deleteId = event.target.dataset.deleteSale;
  const deleteGroupId = event.target.dataset.deleteSaleGroup;
  if (editId) editSale(editId);
  if (deleteId) deleteSale(deleteId);
  if (deleteGroupId) deleteSaleGroup(deleteGroupId);
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

applySeasonalTheme();
if (sessionStorage.getItem(SESSION_KEY) === "sim") {
  showApp();
  initSupabaseSync();
} else {
  showLogin();
}










































































