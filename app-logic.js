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




  function sortProductsByName(products) {
    return (products || []).slice().sort((a, b) => normalizeProductName(a.name).localeCompare(normalizeProductName(b.name), "pt-BR") || String(a.name || "").localeCompare(String(b.name || ""), "pt-BR"));
  }
  function categoryText(item) {
    return String(item?.category || item?.productCategory || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
  }

  function isSupplyProduct(product) {
    const category = categoryText(product);
    return category.includes("insumo") || category.includes("material");
  }

  function filterSellableProducts(products) {
    return (products || []).filter(product => !isSupplyProduct(product));
  }

  function purchaseCategory(purchase, products) {
    if (purchase.category) return purchase.category;
    const product = (products || []).find(item => item.id === purchase.productId || item.name === purchase.productName);
    return product?.category || "";
  }

  function purchaseBreakdown(purchases, products, month) {
    const inPeriod = (purchases || []).filter(purchase => !month || (purchase.date && purchase.date.slice(0, 7) === month));
    let merchandiseTotal = 0;
    let suppliesTotal = 0;
    inPeriod.forEach(purchase => {
      const total = Number(purchase.quantity || 0) * Number(purchase.unitCost || 0);
      const category = purchaseCategory(purchase, products);
      if (isSupplyProduct({ category })) suppliesTotal += total;
      else merchandiseTotal += total;
    });
    return { merchandiseTotal, suppliesTotal, total: merchandiseTotal + suppliesTotal };
  }

  function filterProductsByCategory(products, category) {
    const normalizedCategory = normalizeProductName(category);
    if (!normalizedCategory) return (products || []).slice();
    return (products || []).filter(product => normalizeProductName(product.category) === normalizedCategory);
  }
  function filterProducts(products, query) {
    const normalizedQuery = normalizeProductName(query);
    if (!normalizedQuery) return products.slice();
    return products.filter(product => normalizeProductName(product.name).includes(normalizedQuery));
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


  function saleDisplayRows(sales) {
    const groups = new Map();
    (sales || []).forEach((sale, index) => {
      const groupId = sale.saleGroupId || "";
      const key = groupId ? `group:${groupId}` : `sale:${sale.id || index}`;
      if (!groups.has(key)) groups.set(key, { groupId, sales: [] });
      groups.get(key).sales.push(sale);
    });

    return Array.from(groups.values()).map(group => {
      const groupSales = group.sales;
      const first = groupSales[0] || {};
      const isGroup = Boolean(group.groupId && groupSales.length > 1);
      if (!isGroup) {
        const sale = first;
        return {
          id: sale.id,
          sale,
          sales: [sale],
          isGroup: false,
          saleGroupId: sale.saleGroupId || "",
          salesCount: 1,
          date: sale.date || "",
          customer: sale.customer || "Cliente",
          productName: sale.quickSale || (!sale.productId && !sale.productSnapshot?.name) ? "Venda por valor" : sale.productSnapshot?.name || "Produto",
          category: sale.productSnapshot?.category || "-",
          quantity: Number(sale.quantity || 0),
          total: saleTotals(sale).revenue,
          status: sale.status,
          paymentType: sale.paymentType
        };
      }

      return {
        id: `group:${group.groupId}`,
        sale: first,
        sales: groupSales,
        isGroup: true,
        saleGroupId: group.groupId,
        salesCount: groupSales.length,
        date: first.date || "",
        customer: first.customer || "Cliente",
        productName: `Carrinho (${groupSales.length} ${groupSales.length === 1 ? "item" : "itens"})`,
        category: "Venda com carrinho",
        quantity: sum(groupSales, sale => Number(sale.quantity || 0)),
        total: sum(groupSales, sale => saleTotals(sale).revenue),
        status: groupSales.some(sale => sale.status === "pending") ? "pending" : first.status,
        paymentType: first.paymentType
      };
    }).sort((a, b) => String(b.date || "").localeCompare(String(a.date || "")) || String(b.id || "").localeCompare(String(a.id || "")));
  }
  function sum(items, pick) {
    return items.reduce((total, item) => total + pick(item), 0);
  }


  function cartTotals(items, discount) {
    const gross = sum(items, item => Number(item.unitPrice ?? item.productSnapshot?.price ?? 0) * Number(item.quantity || 0));
    const cost = sum(items, item => Number(item.unitCost ?? item.productSnapshot?.cost ?? 0) * Number(item.quantity || 0));
    const safeDiscount = Math.min(Math.max(Number(discount || 0), 0), gross);
    const revenue = gross - safeDiscount;
    return {
      gross,
      revenue,
      profit: revenue - cost,
      discount: safeDiscount
    };
  }

  function roundMoney(value) {
    return Math.round(Number(value || 0) * 100) / 100;
  }

  function quickSaleEstimate(products, value) {
    const revenue = roundMoney(Math.max(Number(value || 0), 0));
    const validProducts = filterSellableProducts(products || []).filter(product => Number(product.price || 0) > 0);
    const totalPrice = sum(validProducts, product => Number(product.price || 0));
    const totalProfit = sum(validProducts, product => Math.max(Number(product.price || 0) - Number(product.cost || 0), 0));
    const margin = totalPrice > 0 ? totalProfit / totalPrice : 0;
    const estimatedProfit = roundMoney(revenue * margin);
    const estimatedCost = roundMoney(revenue - estimatedProfit);
    return { revenue, estimatedCost, estimatedProfit, profitRate: Math.round(margin * 100) };
  }

  function stockConferencePlan(products, countedStockById) {
    const sold = [];
    const adjustments = [];
    (products || []).forEach(product => {
      if (!Object.prototype.hasOwnProperty.call(countedStockById || {}, product.id)) return;
      const previousStock = Number(product.stock || 0);
      const countedStock = Number(countedStockById[product.id] || 0);
      const difference = countedStock - previousStock;
      if (difference === 0) return;
      adjustments.push({ productId: product.id, productName: product.name, previousStock, countedStock, difference });
      if (difference < 0 && !isSupplyProduct(product)) {
        const quantitySold = Math.abs(difference);
        const unitCost = Number(product.cost || 0);
        const unitPrice = Number(product.price || 0);
        sold.push({
          productId: product.id,
          productName: product.name,
          category: product.category || "",
          previousStock,
          countedStock,
          quantitySold,
          unitCost,
          unitPrice,
          revenue: roundMoney(unitPrice * quantitySold),
          profit: roundMoney((unitPrice - unitCost) * quantitySold)
        });
      }
    });
    return { sold, adjustments };
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

  function previousMonth(month) {
    const [yearText, monthText] = String(month).split("-");
    const date = new Date(Number(yearText), Number(monthText) - 2, 1);
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
  }

  function monthComparison(sales, month) {
    const current = monthlyClosingStats(sales, month);
    const previous = monthlyClosingStats(sales, previousMonth(month));
    const percent = (currentValue, previousValue) => previousValue > 0 ? ((currentValue - previousValue) / previousValue) * 100 : 0;
    return {
      revenueDiff: current.soldTotal - previous.soldTotal,
      revenuePercent: percent(current.soldTotal, previous.soldTotal),
      profitDiff: current.estimatedProfit - previous.estimatedProfit,
      profitPercent: percent(current.estimatedProfit, previous.estimatedProfit),
      current,
      previous
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

  function monthlyBusinessSummary(sales, purchases, month, products) {
    const closing = monthlyClosingStats(sales, month);
    const purchaseTotals = purchaseBreakdown(purchases, products, month);
    const purchasesTotal = purchaseTotals.merchandiseTotal;
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
      suppliesTotal: purchaseTotals.suppliesTotal,
      totalPurchases: purchaseTotals.total,
      finalEstimatedProfit: closing.estimatedProfit - purchaseTotals.suppliesTotal,
      estimatedBalance: closing.receivedTotal - purchaseTotals.total,
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
  function formatMoneyBR(value) {
    return Number(value || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" }).replace(/\u00a0/g, " ");
  }

  function formatDateBR(date) {
    if (!date) return "-";
    const [year, month, day] = String(date).split("-");
    return `${day}/${month}/${year}`;
  }

  function salePaymentText(sale) {
    if (sale.status === "pending") return sale.paymentType === "voucher" ? "Vale" : "Pagamento";
    if (sale.paymentType === "voucher") return "Vale recebido";
    if (sale.paymentType === "payday") return "Pagamento recebido";
    return "Pago na hora";
  }

  function saleReceiptText(sale) {
    const totals = saleTotals(sale);
    const lines = [
      "Venda registrada com sucesso",
      `Cliente: ${sale.customer || "Cliente"}`,
      `Produto: ${sale.productSnapshot?.name || "Produto"}`,
      `Quantidade: ${Number(sale.quantity || 0)}`,
      `Total: ${formatMoneyBR(totals.revenue)}`,
      `Pagamento: ${salePaymentText(sale)}`
    ];
    if (sale.status === "pending") lines.push(`Prazo: ${formatDateBR(sale.dueDate)}`);
    return lines.join("\n");
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
      .sort((a, b) => normalizeProductName(a.name).localeCompare(normalizeProductName(b.name), "pt-BR") || String(a.name || "").localeCompare(String(b.name || ""), "pt-BR"))
      .map(product => ({
        id: product.id,
        name: product.name,
        stock: Number(product.stock),
        minStock: Number(product.minStock),
        suggestedQuantity: Math.max(Number(product.minStock) * 2 - Number(product.stock), 1),
        cost: Number(product.cost)
      }));
  }

  return { saleTotals, saleDisplayRows, normalizeProductName, sortProductsByName, filterProducts, filterProductsByCategory, filterSellableProducts, isSupplyProduct, purchaseBreakdown, cartTotals, quickSaleEstimate, stockConferencePlan, hasDuplicateProductName, profitPercent, monthStats, monthComparison, monthHighlights, customerRankings, closingStats, monthlyClosingStats, monthlyBusinessSummary, seasonalThemeInfo, saleReceiptText, applySaleStockChange, shoppingList };
});
























