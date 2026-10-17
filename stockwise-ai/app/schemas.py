from pydantic import BaseModel, Field
from typing import List, Optional, Union

class DailySaleRecord(BaseModel):
    date: Optional[str] = None
    quantity_sold: int = Field(ge=0, description="Units sold on this date")

class ProductStockInput(BaseModel):
    product_id: str
    name: str
    sku: str
    current_stock: int = Field(ge=0, description="Available units in warehouse")
    reorder_level: int = Field(default=5, ge=0, description="Low stock alert threshold")
    cost_price: float = Field(default=0.0, ge=0.0)
    selling_price: float = Field(default=0.0, ge=0.0)
    sales_history: List[DailySaleRecord] = Field(default_factory=list)
    lookback_days: int = Field(default=30, ge=1, le=365)

class BatchStockInput(BaseModel):
    products: List[ProductStockInput]

class StockPredictionResponse(BaseModel):
    product_id: str
    name: str
    sku: str
    current_stock: int
    risk_level: str  # "CRITICAL", "HIGH", "MEDIUM", "LOW", "STAGNANT"
    estimated_daily_demand: float
    estimated_days_until_stockout: Union[float, str]
    recommended_reorder_qty: int
    recommended_reorder_cost: float
    confidence_score: float
    model_used: str
    explanation: str
    data_points_analyzed: int

class BatchPredictionResponse(BaseModel):
    timestamp: str
    total_products_analyzed: int
    high_risk_count: int
    total_reorder_capital_needed: float
    predictions: List[StockPredictionResponse]
