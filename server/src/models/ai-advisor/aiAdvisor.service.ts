import { Product } from "../product/product.model";
import { Sale } from "../sale/sale.model";

export interface IProductForecast {
  productId: string;
  name: string;
  sku: string;
  categoryName: string;
  currentStock: number;
  lowStockThreshold: number;
  costPrice: number;
  sellingPrice: number;
  unitsSold30Days: number;
  averageDailySales: number;
  estimatedDaysRemaining: number | string;
  suggestedReorderQuantity: number;
  estimatedReorderCost: number;
  stockHealthStatus: "CRITICAL" | "LOW" | "HEALTHY" | "OUT_OF_STOCK" | "STAGNANT";
  aiRecommendation: string;
  isAiGenerated: boolean;
}

const generateHeuristicAdvice = (
  name: string,
  currentStock: number,
  dailyVelocity: number,
  daysRemaining: number,
  suggestedReorder: number,
  unitsSold: number,
): string => {
  if (currentStock === 0 && dailyVelocity > 0) {
    return `Currently out of stock. Based on 30-day sales velocity of ${dailyVelocity.toFixed(1)} units/day, store is actively losing revenue. Immediate priority restock of ${suggestedReorder} units recommended.`;
  }
  if (currentStock === 0 && dailyVelocity === 0) {
    return `Inventory depleted with zero sales in the last 30 days. Evaluate customer demand before allocating reorder capital.`;
  }
  if (daysRemaining <= 3) {
    return `Critical stock velocity: burning ${dailyVelocity.toFixed(1)} units/day with only ${currentStock} units remaining (${daysRemaining.toFixed(1)} days left). Restock ${suggestedReorder} units immediately to maintain a 30-day safety buffer.`;
  }
  if (daysRemaining <= 7) {
    return `Moderate stock depletion warning. At current sales rate (${dailyVelocity.toFixed(1)} units/day), stockout is projected within a week. Plan purchase order of ${suggestedReorder} units.`;
  }
  if (unitsSold === 0) {
    return `Zero sales recorded over the past 30 days with ${currentStock} units on hand. Consider promotional bundling or discount pricing to liberate working capital.`;
  }
  return `Stock velocity is healthy (${dailyVelocity.toFixed(1)} units/day). Inventory will sustain approximately ${Math.round(daysRemaining)} days of continuous demand. No immediate action required.`;
};

const getStockForecast = async () => {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  // 1. Calculate sales velocity per product over last 30 days
  const salesVelocity = await Sale.aggregate([
    {
      $match: {
        status: "completed",
        createdAt: { $gte: thirtyDaysAgo },
      },
    },
    { $unwind: "$items" },
    {
      $group: {
        _id: "$items.product",
        totalUnitsSold: { $sum: "$items.quantity" },
        totalRevenue: { $sum: "$items.subtotal" },
      },
    },
  ]);

  const velocityMap = new Map(
    salesVelocity.map((v) => [String(v._id), v.totalUnitsSold]),
  );

  // 2. Fetch all active products
  const products = await Product.find({ isDeleted: false })
    .populate("category", "name slug")
    .lean();

  let atRiskValue = 0;
  let projectedStockoutsIn7Days = 0;
  let suggestedReorderCapital = 0;

  const forecasts: IProductForecast[] = products.map((product: any) => {
    const unitsSold = velocityMap.get(String(product._id)) || 0;
    const averageDailySales = Math.round((unitsSold / 30) * 100) / 100;
    const currentStock = product.quantity;
    const threshold = product.lowStockThreshold || 5;

    let daysRemaining: number = 999;
    if (currentStock === 0) {
      daysRemaining = 0;
    } else if (averageDailySales > 0) {
      daysRemaining = Math.round((currentStock / averageDailySales) * 10) / 10;
    }

    // Suggested reorder = enough for 30 days buffer + threshold - currentStock
    let suggestedReorder = 0;
    if (averageDailySales > 0) {
      const targetBuffer = Math.ceil(averageDailySales * 30 + threshold);
      suggestedReorder = Math.max(0, targetBuffer - currentStock);
    } else if (currentStock <= threshold) {
      suggestedReorder = threshold * 2 - currentStock;
    }

    const reorderCost = Math.round(suggestedReorder * product.costPrice * 100) / 100;

    // Determine status
    let healthStatus: IProductForecast["stockHealthStatus"] = "HEALTHY";
    if (currentStock === 0) {
      healthStatus = "OUT_OF_STOCK";
      atRiskValue += product.costPrice * threshold;
      projectedStockoutsIn7Days++;
    } else if (daysRemaining <= 3 || currentStock <= threshold) {
      healthStatus = "CRITICAL";
      atRiskValue += product.costPrice * currentStock;
      projectedStockoutsIn7Days++;
    } else if (daysRemaining <= 7) {
      healthStatus = "LOW";
      projectedStockoutsIn7Days++;
    } else if (unitsSold === 0) {
      healthStatus = "STAGNANT";
    }

    suggestedReorderCapital += reorderCost;

    const recommendation = generateHeuristicAdvice(
      product.name,
      currentStock,
      averageDailySales,
      daysRemaining,
      suggestedReorder,
      unitsSold,
    );

    return {
      productId: String(product._id),
      name: product.name,
      sku: product.sku,
      categoryName: product.category?.name || "Uncategorized",
      currentStock,
      lowStockThreshold: threshold,
      costPrice: product.costPrice,
      sellingPrice: product.sellingPrice,
      unitsSold30Days: unitsSold,
      averageDailySales,
      estimatedDaysRemaining: daysRemaining >= 999 ? "30+ Days" : `${daysRemaining} Days`,
      suggestedReorderQuantity: suggestedReorder,
      estimatedReorderCost: reorderCost,
      stockHealthStatus: healthStatus,
      aiRecommendation: recommendation,
      isAiGenerated: true,
    };
  });

  // Sort by urgency: Out of stock first, then lowest days remaining
  forecasts.sort((a, b) => {
    const order = { OUT_OF_STOCK: 0, CRITICAL: 1, LOW: 2, STAGNANT: 3, HEALTHY: 4 };
    return order[a.stockHealthStatus] - order[b.stockHealthStatus];
  });

  return {
    provenance: {
      engine: "StockWise Heuristic Velocity & Demand Forecaster",
      dataTimeframe: "Last 30 Days Sales Records",
      lastRefreshed: new Date().toISOString(),
    },
    summary: {
      atRiskInventoryValue: Math.round(atRiskValue * 100) / 100,
      projectedStockoutsNext7Days: projectedStockoutsIn7Days,
      totalSuggestedReorderCapital: Math.round(suggestedReorderCapital * 100) / 100,
      totalMonitoredProducts: products.length,
    },
    forecasts,
  };
};

export const AIAdvisorService = {
  getStockForecast,
};
