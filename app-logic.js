(function (root, factory) {
  if (typeof module === "object" && module.exports) {
    module.exports = factory();
  } else {
    root.LojinhaLogic = factory();
  }
})(typeof globalThis !== "undefined" ? globalThis : this, function () {

  function normalizeProductName(name) {
    return String(name || "")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .trim()
      .replace(/\s+/g, " ")
      .toLowerCase();
  }

  function hasDuplicateProductName(products, name, currentId) {
    const normalized = normalizeProductName(name);
    return products.some(product => product.id !== currentId && normalizeProductName(product.name) === normalized);
  }
  function saleTotals(sale) {
    const price = sale.unitPrice ?? sale.productSnapshot?.price ?? 0;
    const cost = sale.unitCost ?? sale.productSnapshot?.cost ?? 0;
    const quantity = Number(sale.quantity || 0);
    const gross = Number(price || 0) * quantity;
    const discount = Math.min(Math.max(Number(sale.discount || 0), 0), gross);
    const revenue = gross - discount;
    return {
      revenue,
      profit: revenue - (Number(cost || 0) * quantity)
    };
  }

  function sum(items, pick) {
    return items.reduce((total, item) => total + pick(item), 0);
  }


  function profitPercent(cost, price) {
    const paid = Number(cost || 0);
    const sale = Number(price || 0);
    if (paid <= 0) return 0;
    return ((sale - paid) / paid) * 100;
  }
  function sameMonth(date, referenceDate) {
    return date.slice(0, 7) === referenceDate.slice(0, 7);
  }

  function monthStats(sales, referenceDate) {
    const monthSales = sales.filter(sale => sameMonth(sale.date, referenceDate));
    return {
      salesCount: monthSales.length,
      soldTotal: sum(monthSales, sale => saleTotals(sale).revenue),
      profit: sum(monthSales, sale => saleTotals(sale).profit),
      pendingTotal: sum(sales.filter(sale => sale.status === "pending"), sale => saleTotals(sale).revenue)
    };
  }

  function closingStats(sales, date) {
    const salesOnDate = sales.filter(sale => sale.date === date);
    const paidOnDate = sales.filter(sale => {
      if (sale.status === "paid") return sale.date === date;
      if (sale.status === "paid-later") return sale.paidDate === date;
      return false;
    });
    const pendingFromDate = salesOnDate.filter(sale => sale.status === "pending");
    return {
      salesCount: salesOnDate.length,
      soldTotal: sum(salesOnDate, sale => saleTotals(sale).revenue),
      receivedTotal: sum(paidOnDate, sale => saleTotals(sale).revenue),
      pendingTotal: sum(pendingFromDate, sale => saleTotals(sale).revenue),
      estimatedProfit: sum(salesOnDate, sale => saleTotals(sale).profit)
    };
  }


  function monthlyClosingStats(sales, month) {
    const salesInMonth = sales.filter(sale => sale.date.slice(0, 7) === month);
    const paidInMonth = sales.filter(sale => {
      if (sale.status === "paid") return sale.date.slice(0, 7) === month;
      if (sale.status === "paid-later" && sale.paidDate) return sale.paidDate.slice(0, 7) === month;
      return false;
    });
    const pendingFromMonth = salesInMonth.filter(sale => sale.status === "pending");
    return {
      salesCount: salesInMonth.length,
      soldTotal: sum(salesInMonth, sale => saleTotals(sale).revenue),
      receivedTotal: sum(paidInMonth, sale => saleTotals(sale).revenue),
      pendingTotal: sum(pendingFromMonth, sale => saleTotals(sale).revenue),
      estimatedProfit: sum(salesInMonth, sale => saleTotals(sale).profit)
    };
  }

  function monthHighlights(sales, products, month) {
    const salesInMonth = sales.filter(sale => sale.date && sale.date.slice(0, 7) === month);
    const soldByProduct = new Map();

    salesInMonth.forEach(sale => {
      const productId = sale.productId || sale.productSnapshot?.name || "produto";
      const current = soldByProduct.get(productId) || {
        name: sale.productSnapshot?.name || "Produto",
        quantity: 0,
        total: 0,
        profit: 0
      };
      const totals = saleTotals(sale);
      current.quantity += Number(sale.quantity || 0);
      current.total += totals.revenue;
      current.profit += totals.profit;
      soldByProduct.set(productId, current);
    });

    const soldItems = Array.from(soldByProduct.values());
    const topSelling = soldItems
      .slice()
      .sort((a, b) => b.quantity - a.quantity || b.total - a.total || a.name.localeCompare(b.name))[0] || null;
    const topProfit = soldItems
      .slice()
      .sort((a, b) => b.profit - a.profit || b.quantity - a.quantity || a.name.localeCompare(b.name))[0] || null;
    const idleStock = products
      .filter(product => Number(product.stock || 0) > 0 && !soldByProduct.has(product.id))
      .map(product => ({
        name: product.name,
        stock: Number(product.stock || 0),
        stockValue: Number(product.stock || 0) * Number(product.cost || 0)
      }))
      .sort((a, b) => b.stockValue - a.stockValue || b.stock - a.stock || a.name.localeCompare(b.name))[0] || null;

    return {
      topSelling: topSelling ? { name: topSelling.name, quantity: topSelling.quantity, total: topSelling.total } : null,
      topProfit: topProfit ? { name: topProfit.name, profit: topProfit.profit, quantity: topProfit.quantity } : null,
      idleStock
    };
  }

  function monthlyBusinessSummary(sales, purchases, month) {
    const closing = monthlyClosingStats(sales, month);
    const purchasesInMonth = purchases.filter(purchase => purchase.date && purchase.date.slice(0, 7) === month);
    const purchasesTotal = sum(purchasesInMonth, purchase => Number(purchase.quantity || 0) * Number(purchase.unitCost || 0));
    const debtorMap = new Map();

    sales
      .filter(sale => sale.status === "pending" && sale.date && sale.date.slice(0, 7) === month)
      .forEach(sale => {
        const customer = sale.customer || "Cliente";
        const current = debtorMap.get(customer) || { customer, total: 0, salesCount: 0, nextDueDate: sale.dueDate || "" };
        current.total += saleTotals(sale).revenue;
        current.salesCount += 1;
        if (sale.dueDate && (!current.nextDueDate || sale.dueDate < current.nextDueDate)) current.nextDueDate = sale.dueDate;
        debtorMap.set(customer, current);
      });

    return {
      ...closing,
      purchasesTotal,
      estimatedBalance: closing.receivedTotal - purchasesTotal,
      debtors: Array.from(debtorMap.values()).sort((a, b) => b.total - a.total || a.customer.localeCompare(b.customer))
    };
  }
  function addCustomerTotal(map, customer, sale, extra) {
    const name = String(customer || "").trim();
    if (!name) return;
    const current = map.get(name) || { customer: name, total: 0, salesCount: 0, nextDueDate: "" };
    current.total += saleTotals(sale).revenue;
    current.salesCount += 1;
    if (extra?.dueDate && (!current.nextDueDate || extra.dueDate < current.nextDueDate)) current.nextDueDate = extra.dueDate;
    map.set(name, current);
  }

  function bestCustomer(map, includeDueDate) {
    const best = Array.from(map.values()).sort((a, b) => b.total - a.total || b.salesCount - a.salesCount || a.customer.localeCompare(b.customer))[0] || null;
    if (!best) return null;
    const result = { customer: best.customer, total: best.total, salesCount: best.salesCount };
    if (includeDueDate) result.nextDueDate = best.nextDueDate;
    return result;
  }

  function weekRange(referenceDate) {
    const date = new Date(`${referenceDate}T00:00:00`);
    const day = date.getDay() || 7;
    const start = new Date(date);
    start.setDate(date.getDate() - day + 1);
    const end = new Date(start);
    end.setDate(start.getDate() + 6);
    return {
      start: start.toISOString().slice(0, 10),
      end: end.toISOString().slice(0, 10)
    };
  }

  function customerRankings(sales, referenceDate) {
    const month = referenceDate.slice(0, 7);
    const week = weekRange(referenceDate);
    const monthMap = new Map();
    const weekMap = new Map();
    const debtorMap = new Map();
    const onTimeMap = new Map();

    sales.forEach(sale => {
      const customer = sale.customer;
      if (!String(customer || "").trim()) return;
      if (sale.date && sale.date.slice(0, 7) === month) addCustomerTotal(monthMap, customer, sale);
      if (sale.date && sale.date >= week.start && sale.date <= week.end) addCustomerTotal(weekMap, customer, sale);
      if (sale.status === "pending") addCustomerTotal(debtorMap, customer, sale, { dueDate: sale.dueDate || "" });
      if (sale.status === "paid-later" && sale.dueDate && sale.paidDate && sale.paidDate <= sale.dueDate) {
        addCustomerTotal(onTimeMap, customer, sale);
      }
    });

    return {
      monthVip: bestCustomer(monthMap, false),
      weekBuyer: bestCustomer(weekMap, false),
      topDebtor: bestCustomer(debtorMap, true),
      onTimePayer: bestCustomer(onTimeMap, false)
    };
  }
  function seasonalThemeInfo(date) {
    const [, monthText, dayText] = String(date || "").split("-");
    const month = Number(monthText || 0);
    const day = Number(dayText || 0);
    if (month === 6) return { season: "june", message: "Festa junina na Lojinha da Jô" };
    if (month === 7 && day === 25) return { season: "birthday-day", message: "Feliz aniversário, mãe!!!" };
    if (month === 7) return { season: "birthday", message: "Mês de aniversário da Jô" };
    if (month === 10) return { season: "halloween", message: "Outubro especial da Lojinha" };
    if (month === 12) return { season: "christmas", message: "Natal da Lojinha da Jô" };
    return { season: "normal", message: "" };
  }
  function applySaleStockChange(products, oldSale, newSale) {
    if (oldSale) {
      const oldProduct = products.find(product => product.id === oldSale.productId);
      if (oldProduct) oldProduct.stock = Number(oldProduct.stock || 0) + Number(oldSale.quantity || 0);
    }
    if (newSale) {
      const newProduct = products.find(product => product.id === newSale.productId);
      if (newProduct) newProduct.stock = Number(newProduct.stock || 0) - Number(newSale.quantity || 0);
    }
  }
  function shoppingList(products) {
    return products
      .filter(product => Number(product.stock) <= Number(product.minStock))
      .sort((a, b) => Number(a.stock) - Number(b.stock) || a.name.localeCompare(b.name))
      .map(product => ({
        id: product.id,
        name: product.name,
        stock: Number(product.stock),
        minStock: Number(product.minStock),
        suggestedQuantity: Math.max(Number(product.minStock) * 2 - Number(product.stock), 1),
        cost: Number(product.cost)
      }));
  }

  return { saleTotals, normalizeProductName, hasDuplicateProductName, profitPercent, monthStats, monthHighlights, customerRankings, closingStats, monthlyClosingStats, monthlyBusinessSummary, seasonalThemeInfo, applySaleStockChange, shoppingList };
});










