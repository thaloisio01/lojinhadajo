(function (root, factory) {
  if (typeof module === "object" && module.exports) {
    module.exports = factory();
  } else {
    root.LojinhaLogic = factory();
  }
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  function saleTotals(sale) {
    const price = sale.unitPrice ?? sale.productSnapshot?.price ?? 0;
    const cost = sale.unitCost ?? sale.productSnapshot?.cost ?? 0;
    return {
      revenue: price * sale.quantity,
      profit: (price - cost) * sale.quantity
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
  function shoppingList(products) {
    return products
      .filter(product => Number(product.stock) < Number(product.minStock))
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

  return { saleTotals, profitPercent, monthStats, closingStats, monthlyClosingStats, shoppingList };
});



