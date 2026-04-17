# AI-Powered Logistics & Supply Chain Optimization System

## System Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        FRONTEND (React.js)                       │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  Dashboard with:                                         │   │
│  │  - Demand Forecast Visualizations                        │   │
│  │  - Warehouse Stock Levels                                │   │
│  │  - Delivery Routes (Map)                                 │   │
│  │  - Disruption Alerts                                     │   │
│  │  - KPI Metrics                                           │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                              │
                    REST APIs (HTTP)
                              │
┌─────────────────────────────────────────────────────────────────┐
│                  BACKEND (Node.js/Express)                       │
│  ┌────────────────────────────────────────────────────────┐    │
│  │ API Layer                                              │    │
│  │ - /api/orders, /api/warehouses, /api/customers        │    │
│  │ - /api/forecast, /api/optimize, /api/routes           │    │
│  └────────────────────────────────────────────────────────┘    │
│  ┌────────────────────────────────────────────────────────┐    │
│  │ Core Modules                                           │    │
│  ├─ Demand Forecasting (Moving Avg, Linear Regression)   │    │
│  ├─ Inventory Optimization (Safety Stock, Distribution)   │    │
│  ├─ Dynamic Routing (Distance Matrix, Cost Calc)          │    │
│  ├─ Allocation Engine (Warehouse Selection)               │    │
│  ├─ Disruption Handler (Fallback Strategies)              │    │
│  ├─ KPI Tracker (Delivery Time, Cost, Service Level)      │    │
│  └─ Data Manager (In-Memory DB / JSON)                    │    │
│  ┌────────────────────────────────────────────────────────┐    │
│  │ Python Integration (Optional Flask/FastAPI Service)    │    │
│  │ - LSTM Demand Forecasting                              │    │
│  │ - Advanced Optimization (Column Generation)            │    │
│  └────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────┘
```

## Data Model

### Core Entities

**Warehouses**
```
{
  id: string,
  name: string,
  location: {lat: number, lon: number},
  capacity: number,
  currentStock: {productId: number},
  operationalCost: number/day,
  failureRate: number (0-1)
}
```

**Customers**
```
{
  id: string,
  name: string,
  location: {lat: number, lon: number},
  demand: {date: quantity}
}
```

**Orders**
```
{
  id: string,
  customerId: string,
  productId: number,
  quantity: number,
  orderedDate: Date,
  requiredDate: Date,
  assignedWarehouse?: string,
  route?: Route,
  status: 'pending' | 'assigned' | 'shipped' | 'delivered' | 'failed'
}
```

**Routes**
```
{
  id: string,
  orderId: string,
  from: Location,
  to: Location,
  distance: number,
  estimatedTime: number,
  cost: number,
  co2Emissions: number,
  waypoints?: Location[]
}
```

## Module Descriptions

### 1. Demand Forecasting
- **Moving Average**: Simple N-period moving average for baseline
- **Linear Regression**: Captures trends in historical data
- **LSTM** (Python): Captures complex temporal patterns
- **Hierarchical**: Aggregate forecasts by region, warehouse, or product category

### 2. Inventory Optimization
- **Stock Level Calculation**: EOQ (Economic Order Quantity) model
- **Safety Stock**: Based on demand variance and service level targets
- **Reorder Points**: Trigger restocking when inventory falls below threshold
- **Distribution Suggestion**: Allocate stock optimally across warehouses

### 3. Dynamic Routing & Allocation
- **Warehouse Selection**: Multi-criteria scoring (distance, stock, cost)
- **Route Optimization**: Dijkstra's algorithm for shortest path
- **Distance Matrix**: Pre-computed or real-time calculation
- **Cost Calculation**: Fuel, labor, vehicle wear; optional CO2 tracking

### 4. Disruption Handling
- **Warehouse Failure**: Mark as unavailable, reassign orders to next best warehouse
- **Delivery Delays**: Simulate delayed shipments, adjust arrival time estimates
- **Blocked Routes**: Reroute through alternative paths
- **Fallback Strategies**: Queue orders, use expedited shipping, split shipment

### 5. Optimization Engine
- **Objective**: Minimize(Total Cost) subject to Service Level ≥ target
- **Constraints**: Capacity, delivery time, stock availability
- **KPIs Tracked**:
  - Average delivery time
  - Total cost per order
  - Service level (% on-time)
  - Carbon emissions (kg CO2 per shipment)

## API Endpoints

```
Frontend -> Backend APIs

GET /api/warehouses                    - List all warehouses
GET /api/warehouses/:id                - Warehouse details with stock
GET /api/customers                     - List customers
GET /api/customers/:id/demand          - Customer demand history

POST /api/orders                       - Create new order
GET /api/orders                        - List all orders
GET /api/orders/:id                    - Order details

POST /api/forecast                     - Get demand forecast
  { method: 'movingAverage'|'linear'|'lstm', 
    warehouseId?: string, 
    days: number }

POST /api/optimize                     - Optimize inventory distribution
  { targetServiceLevel: 0.95 }
  -> Returns: { suggestions: [] }

POST /api/allocate                     - Allocate order to warehouse
  { orderId: string }
  -> Returns: { orderId, warehouseId, route, cost, deliveryDays }

POST /api/disruption/simulate          - Simulate disruption
  { type: 'warehouse_failure'|'route_blocked'|'delayed_shipment',
    targetId: string,
    duration?: number }

GET /api/kpis                          - Fetch KPI metrics
GET /api/dashboard                     - Full dashboard data
```

## Deployment Architecture

### Development
- Frontend: Vite dev server (localhost:5173)
- Backend: Express (localhost:3000)
- Data: JSON files in ./data (can upgrade to MongoDB)
- Python Service: Flask (localhost:5000) - optional

### Production
- Frontend: Build → Vite output, deploy to CDN
- Backend: Node.js process, containerized (Docker)
- Database: PostgreSQL or MongoDB
- Python Service: FastAPI with Gunicorn
- Monitoring: ELK stack for logs, Prometheus for metrics

## Key Algorithms

### 1. Warehouse Selection (Scoring)
```
score = α * distance_score + β * stock_score + γ * cost_score
distance_score = (max_distance - actual_distance) / max_distance
stock_score = available_quantity / required_quantity
cost_score = (max_cost - actual_cost) / max_cost
Best warehouse = argmax(score)
```

### 2. Route Optimization (Dijkstra)
```
For each order:
  Open set = {origin}
  Closed set = {}
  While goal not reached:
    current = node with lowest cost
    For each neighbor:
      If not visited:
        Update tentative cost
        Add to open set
  Return shortest path
```

### 3. Safety Stock (Service Level Based)
```
Safety_Stock = Z_score(service_level) * σ_demand * √lead_time
Reorder_Point = average_daily_demand * lead_time + Safety_Stock
EOQ = √(2 * annual_demand * order_cost / holding_cost)
```

### 4. Demand Forecasting (Moving Average)
```
F(t+1) = (D(t) + D(t-1) + ... + D(t-n+1)) / n
Where:
  F = forecast
  D = actual demand
  n = window size
```

## Success Metrics (Hackathon Demo)
✅ Core modules operational
✅ Sample data flowing through system
✅ Dashboard showing real-time updates
✅ Disruption simulation with auto-recovery
✅ Cost vs Service Level trade-off visualization
✅ Deployable and easy to understand
