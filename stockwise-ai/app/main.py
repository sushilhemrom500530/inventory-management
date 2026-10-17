from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from datetime import datetime
from app.schemas import (
    ProductStockInput,
    StockPredictionResponse,
    BatchStockInput,
    BatchPredictionResponse,
)
from app.services.prediction import calculate_stock_prediction

app = FastAPI(
    title="StockWise AI & Demand Forecasting Microservice",
    description="Dedicated Machine Learning and Heuristic Stock Forecasting Microservice for StockWise Inventory System",
    version="1.0.0",
)

# Enable CORS for local Express server integration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def root():
    return {
        "service": "StockWise AI Service",
        "status": "online",
        "timestamp": datetime.utcnow().isoformat(),
        "documentation": "/docs",
    }

@app.get("/health")
def health_check():
    return {
        "status": "ok",
        "timestamp": datetime.utcnow().isoformat(),
        "service": "StockWise AI Microservice",
        "version": "1.0.0",
    }

@app.post("/predict", response_model=StockPredictionResponse)
def predict_stock(input_data: ProductStockInput):
    try:
        prediction = calculate_stock_prediction(input_data)
        return prediction
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error generating stock prediction: {str(e)}",
        )

@app.post("/predict/batch", response_model=BatchPredictionResponse)
def predict_batch(batch_input: BatchStockInput):
    try:
        predictions = [
            calculate_stock_prediction(prod) for prod in batch_input.products
        ]
        
        high_risk = sum(1 for p in predictions if p.risk_level in ["CRITICAL", "HIGH"])
        total_capital = sum(p.recommended_reorder_cost for p in predictions)

        return BatchPredictionResponse(
            timestamp=datetime.utcnow().isoformat(),
            total_products_analyzed=len(predictions),
            high_risk_count=high_risk,
            total_reorder_capital_needed=round(total_capital, 2),
            predictions=predictions,
        )
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error generating batch predictions: {str(e)}",
        )

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="127.0.0.1", port=8000, reload=True)
