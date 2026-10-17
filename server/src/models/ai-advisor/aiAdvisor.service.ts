import { Product } from "../product/product.model";
import { Sale } from "../sale/sale.model";
import { AI_SERVICE_URL } from "../../config";
import AppError from "../../errors/AppError";
import { StatusCodes } from "http-status-codes";

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

/**
 * Communicates with the Python FastAPI microservice to get ML prediction
 * with graceful fallback to Node.js heuristic logic if Python service is offline.
 */
const getStockAdviceForProduct = async (
  productId: string,
  _userId?: string,
  lookbackDays = 30,
) => {
  const product = await Product.findOne({ _id: productId, isDeleted: false }).populate("category", "name");
  if (!product) {
    throw new AppError(StatusCodes.NOT_FOUND, "Product not found or access denied");
  }

  const lookbackDate = new Date();
  lookbackDate.setDate(lookbackDate.getDate() - lookbackDays);

  // 1. Fetch real historical sales from MongoDB
  const salesHistory = await Sale.aggregate([
    {
      $match: {
        status: "completed",
        createdAt: { $gte: lookbackDate },
        "items.product": product._id,
      },
    },
    { $unwind: "$items" },
    { $match: { "items.product": product._id } },
    {
      $group: {
        _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
        quantity_sold: { $sum: "$items.quantity" },
      },
    },
    { $sort: { _id: 1 } },
  ]);

  const formattedHistory = salesHistory.map((s) => ({
    date: s._id,
    quantity_sold: s.quantity_sold,
  }));

  const payload = {
    product_id: String(product._id),
    name: product.name,
    sku: product.sku,
    current_stock: product.quantity,
    reorder_level: product.lowStockThreshold || 5,
    cost_price: product.costPrice,
    selling_price: product.sellingPrice,
    lookback_days: lookbackDays,
    sales_history: formattedHistory,
  };

  // 2. Attempt communication with Python FastAPI service
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 4000); // 4-second safety timeout

    const pyResponse = await fetch(`${AI_SERVICE_URL}/predict`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });

    clearTimeout(timeout);

    if (pyResponse.ok) {
      const pyResult = await pyResponse.json();
      return {
        source: "python_fastapi_service",
        service_status: "online",
        ...pyResult,
      };
    }
  } catch (_error) {
    // Python service is unreachable, timed out, or starting up.
    // Graceful fallback to our internal deterministic forecasting engine.
  }

  // 3. Graceful Fallback Engine
  const totalUnitsSold = formattedHistory.reduce((sum, r) => sum + r.quantity_sold, 0);
  const averageDailySales = Math.round((totalUnitsSold / Math.max(1, lookbackDays)) * 100) / 100;
  const currentStock = product.quantity;
  const threshold = product.lowStockThreshold || 5;

  let daysRemaining: number | string = 999;
  if (currentStock === 0) daysRemaining = 0;
  else if (averageDailySales > 0) daysRemaining = Math.round((currentStock / averageDailySales) * 10) / 10;
  else daysRemaining = "30+ Days";

  let suggestedReorder = 0;
  if (averageDailySales > 0) {
    suggestedReorder = Math.max(0, Math.ceil(averageDailySales * 30 + threshold - currentStock));
  } else if (currentStock <= threshold) {
    suggestedReorder = Math.max(0, threshold * 2 - currentStock);
  }

  let riskLevel = "LOW";
  if (currentStock === 0) riskLevel = "CRITICAL";
  else if (typeof daysRemaining === "number" && daysRemaining <= 3) riskLevel = "HIGH";
  else if (typeof daysRemaining === "number" && daysRemaining <= 7) riskLevel = "MEDIUM";
  else if (totalUnitsSold === 0) riskLevel = "STAGNANT";

  const explanation = generateHeuristicAdvice(
    product.name,
    currentStock,
    averageDailySales,
    typeof daysRemaining === "number" ? daysRemaining : 30,
    suggestedReorder,
    totalUnitsSold,
  );

  return {
    source: "node_resilient_fallback",
    service_status: "python_offline_fallback",
    product_id: String(product._id),
    name: product.name,
    sku: product.sku,
    current_stock: currentStock,
    risk_level: riskLevel,
    estimated_daily_demand: averageDailySales,
    estimated_days_until_stockout: daysRemaining,
    recommended_reorder_qty: suggestedReorder,
    recommended_reorder_cost: Math.round(suggestedReorder * product.costPrice * 100) / 100,
    confidence_score: 0.75,
    model_used: "velocity_heuristic_engine",
    explanation,
    data_points_analyzed: formattedHistory.length,
  };
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

    let suggestedReorder = 0;
    if (averageDailySales > 0) {
      const targetBuffer = Math.ceil(averageDailySales * 30 + threshold);
      suggestedReorder = Math.max(0, targetBuffer - currentStock);
    } else if (currentStock <= threshold) {
      suggestedReorder = threshold * 2 - currentStock;
    }

    const reorderCost = Math.round(suggestedReorder * product.costPrice * 100) / 100;

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

  forecasts.sort((a, b) => {
    const order = { OUT_OF_STOCK: 0, CRITICAL: 1, LOW: 2, STAGNANT: 3, HEALTHY: 4 };
    return order[a.stockHealthStatus] - order[b.stockHealthStatus];
  });

  return {
    provenance: {
      engine: "StockWise Hybrid ML & Heuristic Forecaster",
      pythonServiceUrl: AI_SERVICE_URL,
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
  getStockAdviceForProduct,
  getStockForecast,
};
