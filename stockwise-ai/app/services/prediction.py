import math
from typing import List
from app.schemas import ProductStockInput, StockPredictionResponse, DailySaleRecord

def calculate_stock_prediction(data: ProductStockInput) -> StockPredictionResponse:
    current_stock = data.current_stock
    reorder_level = data.reorder_level
    cost_price = data.cost_price
    lookback = data.lookback_days
    history = data.sales_history
    data_points = len(history)

    # 1. Calculate historical sales metrics
    total_units_sold = sum(record.quantity_sold for record in history)

    # 2. Demand Estimation Algorithm
    if data_points >= 7:
        # Weighted Exponential Moving Average (give higher weight to recent days)
        # alpha factor 0.3 for smoothing
        weights = [math.exp(0.05 * i) for i in range(data_points)]
        total_weight = sum(weights)
        weighted_sales = sum(
            history[i].quantity_sold * weights[i] for i in range(data_points)
        )
        estimated_daily_demand = round(weighted_sales / total_weight, 2)
        model_used = "exponential_moving_average"
        confidence_score = min(0.92, round(0.60 + (data_points / 30) * 0.30, 2))
    elif data_points > 0:
        # Simple velocity heuristic
        days_span = max(1, lookback)
        estimated_daily_demand = round(total_units_sold / days_span, 2)
        model_used = "linear_velocity_heuristic"
        confidence_score = 0.65
    else:
        estimated_daily_demand = 0.0
        model_used = "zero_history_baseline"
        confidence_score = 0.40

    # 3. Days until stockout computation
    if current_stock == 0:
        days_until_stockout: float | str = 0.0
    elif estimated_daily_demand > 0:
        days_until_stockout = round(current_stock / estimated_daily_demand, 1)
    else:
        days_until_stockout = "30+ Days"

    # 4. Recommended Reorder Quantity calculation (30-day buffer)
    if estimated_daily_demand > 0:
        target_buffer = math.ceil(estimated_daily_demand * 30 + reorder_level)
        recommended_reorder_qty = max(0, target_buffer - current_stock)
    elif current_stock <= reorder_level:
        recommended_reorder_qty = max(0, (reorder_level * 2) - current_stock)
    else:
        recommended_reorder_qty = 0

    recommended_reorder_cost = round(recommended_reorder_qty * cost_price, 2)

    # 5. Risk Level and Natural Language Explanation Synthesis
    if current_stock == 0 and estimated_daily_demand > 0:
        risk_level = "CRITICAL"
        explanation = (
            f"Product is completely stockout. Based on daily burn rate of {estimated_daily_demand} units/day, "
            f"potential revenue is actively being lost. Immediate replenishment of {recommended_reorder_qty} units advised."
        )
    elif current_stock == 0 and estimated_daily_demand == 0:
        risk_level = "CRITICAL"
        explanation = (
            "Zero units available in warehouse. No recent sales recorded. "
            f"Consider a conservative initial restock of {recommended_reorder_qty} units to test customer demand."
        )
    elif isinstance(days_until_stockout, (int, float)) and days_until_stockout <= 3.0:
        risk_level = "HIGH"
        explanation = (
            f"Critical stock velocity: burning {estimated_daily_demand} units/day with only {current_stock} units left "
            f"({days_until_stockout} days remaining). Restock minimum {recommended_reorder_qty} units immediately."
        )
    elif current_stock <= reorder_level or (isinstance(days_until_stockout, (int, float)) and days_until_stockout <= 7.0):
        risk_level = "MEDIUM"
        explanation = (
            f"Stock level is below safety buffer ({current_stock} units on hand vs threshold of {reorder_level}). "
            f"At current demand rate, stockout is projected within a week. Plan PO for {recommended_reorder_qty} units."
        )
    elif total_units_sold == 0 and current_stock > 0:
        risk_level = "STAGNANT"
        explanation = (
            f"Dead stock alert: zero sales recorded over the lookback period with {current_stock} units tied up in capital. "
            "Consider clearance promotions or discounting to liquidate working capital."
        )
    else:
        risk_level = "LOW"
        explanation = (
            f"Inventory velocity is healthy. At {estimated_daily_demand} units/day, current stock will sustain "
            f"{days_until_stockout} of continuous demand without requiring capital allocation."
        )

    return StockPredictionResponse(
        product_id=data.product_id,
        name=data.name,
        sku=data.sku,
        current_stock=current_stock,
        risk_level=risk_level,
        estimated_daily_demand=estimated_daily_demand,
        estimated_days_until_stockout=days_until_stockout,
        recommended_reorder_qty=recommended_reorder_qty,
        recommended_reorder_cost=recommended_reorder_cost,
        confidence_score=confidence_score,
        model_used=model_used,
        explanation=explanation,
        data_points_analyzed=data_points,
    )
