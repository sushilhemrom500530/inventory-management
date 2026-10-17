import pytest
from app.schemas import ProductStockInput, DailySaleRecord
from app.services.prediction import calculate_stock_prediction

def test_critical_out_of_stock_prediction():
    input_data = ProductStockInput(
        product_id="prod_001",
        name="Micro Controller V3",
        sku="EL-MCU-003",
        current_stock=0,
        reorder_level=10,
        cost_price=12.50,
        sales_history=[
            DailySaleRecord(date="2026-10-01", quantity_sold=3),
            DailySaleRecord(date="2026-10-02", quantity_sold=4),
        ],
        lookback_days=30,
    )

    result = calculate_stock_prediction(input_data)
    assert result.risk_level == "CRITICAL"
    assert result.current_stock == 0
    assert result.recommended_reorder_qty > 0

def test_high_risk_imminent_stockout():
    # 4 units in stock, burning ~2 units per day = 2 days remaining
    input_data = ProductStockInput(
        product_id="prod_002",
        name="Industrial Valve v4",
        sku="HW-VLV-004",
        current_stock=4,
        reorder_level=10,
        cost_price=28.00,
        sales_history=[
            DailySaleRecord(date="2026-10-01", quantity_sold=2),
            DailySaleRecord(date="2026-10-02", quantity_sold=2),
            DailySaleRecord(date="2026-10-03", quantity_sold=2),
            DailySaleRecord(date="2026-10-04", quantity_sold=2),
            DailySaleRecord(date="2026-10-05", quantity_sold=2),
            DailySaleRecord(date="2026-10-06", quantity_sold=2),
            DailySaleRecord(date="2026-10-07", quantity_sold=2),
        ],
        lookback_days=7,
    )

    result = calculate_stock_prediction(input_data)
    assert result.risk_level == "HIGH"
    assert isinstance(result.estimated_days_until_stockout, (int, float))
    assert result.estimated_days_until_stockout <= 3.0

def test_stagnant_dead_stock():
    input_data = ProductStockInput(
        product_id="prod_003",
        name="Obsolete Relay",
        sku="EL-RLY-009",
        current_stock=50,
        reorder_level=5,
        cost_price=5.00,
        sales_history=[],
        lookback_days=30,
    )

    result = calculate_stock_prediction(input_data)
    assert result.risk_level == "STAGNANT"
    assert result.recommended_reorder_qty == 0
