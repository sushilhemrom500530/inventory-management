import { Product } from "../product/product.model";
import { Sale } from "../sale/sale.model";
import { Category } from "../category/category.model";

const getDashboardOverview = async (days = 30) => {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  startDate.setHours(0, 0, 0, 0);

  // 1. Product & Valuation Totals
  const [productValuation] = await Product.aggregate([
    { $match: { isDeleted: false } },
    {
      $group: {
        _id: null,
        totalProducts: { $sum: 1 },
        totalUnits: { $sum: "$quantity" },
        totalCostValue: { $sum: { $multiply: ["$quantity", "$costPrice"] } },
        totalRetailValue: { $sum: { $multiply: ["$quantity", "$sellingPrice"] } },
        inStockCount: {
          $sum: { $cond: [{ $eq: ["$status", "in_stock"] }, 1, 0] },
        },
        lowStockCount: {
          $sum: { $cond: [{ $eq: ["$status", "low_stock"] }, 1, 0] },
        },
        outOfStockCount: {
          $sum: { $cond: [{ $eq: ["$status", "out_of_stock"] }, 1, 0] },
        },
      },
    },
  ]);

  const totalProducts = productValuation?.totalProducts || 0;
  const totalCostValue = Math.round((productValuation?.totalCostValue || 0) * 100) / 100;
  const totalRetailValue = Math.round((productValuation?.totalRetailValue || 0) * 100) / 100;
  const potentialProfit = Math.round((totalRetailValue - totalCostValue) * 100) / 100;

  // 2. Period Sales Summary
  const [salesSummary] = await Sale.aggregate([
    {
      $match: {
        status: "completed",
        createdAt: { $gte: startDate },
      },
    },
    {
      $group: {
        _id: null,
        totalSalesCount: { $sum: 1 },
        totalRevenue: { $sum: "$grandTotal" },
        totalSubtotal: { $sum: "$subtotal" },
        totalDiscount: { $sum: "$discount" },
      },
    },
  ]);

  // 3. Sales Trend by Day (for UI Line/Bar Chart)
  const salesTrends = await Sale.aggregate([
    {
      $match: {
        status: "completed",
        createdAt: { $gte: startDate },
      },
    },
    {
      $group: {
        _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
        revenue: { $sum: "$grandTotal" },
        orders: { $sum: 1 },
      },
    },
    { $sort: { _id: 1 } },
  ]);

  // 4. Category Breakdown (for UI Donut Chart)
  const categoryBreakdown = await Product.aggregate([
    { $match: { isDeleted: false } },
    {
      $group: {
        _id: "$category",
        productCount: { $sum: 1 },
        totalStock: { $sum: "$quantity" },
        inventoryValue: { $sum: { $multiply: ["$quantity", "$costPrice"] } },
      },
    },
    {
      $lookup: {
        from: "categories",
        localField: "_id",
        foreignField: "_id",
        as: "categoryDetails",
      },
    },
    { $unwind: "$categoryDetails" },
    {
      $project: {
        _id: 1,
        name: "$categoryDetails.name",
        color: "$categoryDetails.color",
        productCount: 1,
        totalStock: 1,
        inventoryValue: { $round: ["$inventoryValue", 2] },
      },
    },
    { $sort: { inventoryValue: -1 } },
  ]);

  return {
    kpis: {
      totalProducts,
      totalUnits: productValuation?.totalUnits || 0,
      totalInventoryValue: totalCostValue,
      totalRetailValue,
      potentialProfit,
      periodRevenue: Math.round((salesSummary?.totalRevenue || 0) * 100) / 100,
      periodSalesCount: salesSummary?.totalSalesCount || 0,
      inStockCount: productValuation?.inStockCount || 0,
      lowStockCount: productValuation?.lowStockCount || 0,
      outOfStockCount: productValuation?.outOfStockCount || 0,
    },
    salesTrends: salesTrends.map((s) => ({
      date: s._id,
      revenue: Math.round(s.revenue * 100) / 100,
      orders: s.orders,
    })),
    categoryBreakdown,
  };
};

const getLowStockAlerts = async () => {
  const alerts = await Product.find({
    isDeleted: false,
    $or: [{ status: "low_stock" }, { status: "out_of_stock" }],
  })
    .populate("category", "name slug color")
    .sort({ quantity: 1, lowStockThreshold: -1 })
    .lean();

  const formattedAlerts = alerts.map((product) => {
    const deficit = Math.max(0, product.lowStockThreshold - product.quantity);
    return {
      ...product,
      deficit,
      urgency: product.quantity === 0 ? "CRITICAL_OUT_OF_STOCK" : "LOW_STOCK_WARNING",
    };
  });

  return {
    totalAlerts: formattedAlerts.length,
    criticalCount: formattedAlerts.filter((a) => a.quantity === 0).length,
    lowStockCount: formattedAlerts.filter((a) => a.quantity > 0).length,
    data: formattedAlerts,
  };
};

export const AnalyticsService = {
  getDashboardOverview,
  getLowStockAlerts,
};
