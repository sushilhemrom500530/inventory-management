# StockWise AI & Demand Forecasting Microservice

Dedicated Python + FastAPI microservice for the StockWise Inventory System. Provides demand forecasting, stockout risk assessments, and reorder recommendations based on historical sales velocity.

---

## 🚀 Setup & Execution

### 1. Prerequisites
- Python 3.10+ (Python 3.12 verified)

### 2. Virtual Environment & Dependencies
```bash
cd stockwise-ai

# Create virtual environment
python -m venv venv

# Activate on Windows
.\venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt
```

### 3. Run the Microservice
```bash
# Starts the server on http://127.0.0.1:8000
uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```
Interactive Swagger documentation is available at `http://127.0.0.1:8000/docs`.

### 4. Run Unit Tests
```bash
pytest tests/
```

---

## 📡 API Endpoints

### 1. Health Check
- **GET** `/health`
- Response: `{"status": "ok", "service": "StockWise AI Microservice", "version": "1.0.0"}`

### 2. Single Product Prediction
- **POST** `/predict`
- **Request Body**:
```json
{
  "product_id": "67389201928374",
  "name": "Industrial Valve v4",
  "sku": "HW-VLV-004",
  "current_stock": 4,
  "reorder_level": 10,
  "cost_price": 28.00,
  "selling_price": 45.00,
  "lookback_days": 30,
  "sales_history": [
    { "date": "2026-10-15", "quantity_sold": 2 },
    { "date": "2026-10-16", "quantity_sold": 3 }
  ]
}
```
- **Response**:
```json
{
  "product_id": "67389201928374",
  "name": "Industrial Valve v4",
  "sku": "HW-VLV-004",
  "current_stock": 4,
  "risk_level": "HIGH",
  "estimated_daily_demand": 2.5,
  "estimated_days_until_stockout": 1.6,
  "recommended_reorder_qty": 45,
  "recommended_reorder_cost": 1260.0,
  "confidence_score": 0.82,
  "model_used": "exponential_moving_average",
  "explanation": "Critical stock velocity: burning 2.5 units/day with only 4 units left (1.6 days remaining). Restock minimum 45 units immediately.",
  "data_points_analyzed": 2
}
```

### 3. Batch Forecast
- **POST** `/predict/batch`
- Returns an aggregated portfolio analysis across multiple inventory items.
