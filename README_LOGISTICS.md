# 🚚 AI-Powered Logistics & Supply Chain Optimization System

A comprehensive, hackathon-ready supply chain management system featuring demand forecasting, inventory optimization, dynamic routing, and disruption resilience.

## 📋 Overview

This system simulates a complex supply chain network with:
- **5 Warehouses** strategically distributed across the US
- **10 Customers** across different regions
- **Real-time Operations** with order creation, allocation, and tracking
- **AI-Powered Forecasting** using multiple algorithms
- **Optimization Algorithms** for inventory and routing
- **Disruption Simulation** for testing system resilience
- **Interactive Dashboard** for visualization and management

## 🏗️ System Architecture

```
Frontend (React.js)          Backend (Express.js)         Data Layer
┌──────────────────┐         ┌──────────────────┐        ┌──────────┐
│  Dashboard UI    │────────▶│   API Server     │───────▶│ JSON DB  │
│  - Orders        │ HTTP    │   - Forecasting  │        │ - Orders │
│  - Inventory     │ REST    │   - Routing      │        │ - Stock  │
│  - Disruptions   │         │   - Allocation   │        │ - Demand │
│  - KPIs          │         │   - Disruption   │        │ - Routes │
└──────────────────┘         └──────────────────┘        └──────────┘
                                     │
                        ┌────────────┴──────────────┐
                        │  Optimization Modules     │
                        ├───────────────────────────┤
                        │ • Moving Average          │
                        │ • Linear Regression       │
                        │ • Seasonal Forecasting    │
                        │ • Warehouse Selection     │
                        │ • Route Optimization      │
                        │ • Safety Stock Calc.      │
                        │ • Cost Minimization       │
                        └───────────────────────────┘
```

## 🚀 Quick Start

### Prerequisites
- Node.js 16+
- npm or yarn
- Modern web browser (Chrome, Firefox, Safari, Edge)

### Installation & Running

#### 1. Front End Setup
```bash
# Navigate to project root
cd /path/to/project

# Install dependencies
npm install

# Start development server
npm run dev
```
Frontend will run on `http://localhost:5173`

#### 2. Backend Setup
```bash
# Navigate to backend
cd backend

# Install dependencies
npm install

# Start server
npm run dev
# Or: npm start
```
Backend API will run on `http://localhost:3000`

#### 3. Access the Application
Open http://localhost:5173 in your browser

## 📊 Dashboard Features

### 1. **Dashboard Tab** (Overview)
- Real-time system status
- Warehouse stock levels with visual indicators
- Order status distribution
- Key performance metrics (delivery time, service level, cost, emissions)
- Active alerts and disruptions

### 2. **Warehouses Tab** (Inventory Management)
- View all 5 warehouses
- Current stock levels by product
- Warehouse utilization rates
- Capacity analysis
- Warehouse comparison

### 3. **Orders Tab** (Order Management)
- Create new orders with customer, product, quantity, and delivery date
- View all orders with filtering by status
- Real-time order tracking
- Cost and warehouse assignment details
- Batch order operations

### 4. **Forecast Tab** (Demand Prediction)
- Generate demand forecasts using multiple methods:
  - **Moving Average**: Simple trend based forecasting
  - **Linear Regression**: Captures linear trends
  - **Seasonal**: Identifies weekly/monthly patterns
  - **Ensemble**: Weighted combination of methods
- Visualize historical data and forecasts
- 30-day demand projection for each product

### 5. **KPIs Tab** (Performance Metrics)
- **Delivery Time**: Average days to deliver (target: ≤3 days)
- **Service Level**: % of on-time deliveries (target: ≥95%)
- **Cost per Order**: Average shipping cost (target: ≤$500)
- **CO₂Emissions**: Total carbon footprint
- **Warehouse Utilization**: Stock as %  of capacity
- Real-time status indicators

### 6. **Disruptions Tab** (Resilience Testing)
- Simulate warehouse failures
- Test shipment delays (24-48 hours)
- Blocked route scenarios
- Random disruption generation
- Automatic resilience strategies with recovery plans
- Alternative routing recommendations

### 7. **Alerts Tab** (Monitoring)
- Real-time alert notifications
- Severity levels: Critical, High, Warning
- Stock level warnings
- Order backlog alerts
- Service level degradation alerts
- Capacity warnings
- Configurable thresholds

## 💻 Technology Stack

### Frontend
- **React 19** - UI framework
- **Vite** - Build tool and dev server
- **CSS3** - Styling (custom, no frameworks)
- **Fetch API** - API communication

### Backend
- **Node.js/Express.js** - Server framework
- **UUID** - Unique identifiers
- **CORS** - Cross-origin requests
- **JSON** - Data persistence

### Algorithms
- **Moving Average** - Demand forecasting
- **Linear Regression** - Trend analysis
- **Haversine Formula** - Distance calculation
- **Dijkstra's Algorithm** - Route optimization (simplified)
- **Multi-criteria Scoring** - Warehouse selection
- **EOQ Model** - Inventory optimization
- **Safety Stock Formula** - Stock level calculation

## 📁 Project Structure

```
rv-project/
├── src/
│   ├── components/
│   │   ├── Dashboard.jsx
│   │   ├── WarehousesPanel.jsx
│   │   ├── OrdersPanel.jsx
│   │   ├── ForecastPanel.jsx
│   │   ├── DisruptionPanel.jsx
│   │   ├── KPIMetrics.jsx
│   │   └── AlertsPanel.jsx
│   ├── App.jsx
│   ├── App.css
│   └── main.jsx
├── backend/
│   ├── modules/
│   │   ├── forecasting.js           # Demand forecasting algorithms
│   │   ├── inventory.js             # Inventory optimization
│   │   ├── routing.js               # Dynamic routing & allocation
│   │   ├── disruption.js            # Disruption handling
│   │   ├── dataManager.js           # Data persistence
│   │   └── kpiTracker.js            # KPI metrics
│   ├── routes/
│   │   ├── orders.js                # Order endpoints
│   │   ├── forecast.js              # Forecasting endpoints
│   │   ├── optimize.js              # Optimization endpoints
│   │   ├── allocate.js              # Allocation endpoints
│   │   ├── disruption.js            # Disruption endpoints
│   │   └── dashboard.js             # Dashboard endpoints
│   ├── utils/
│   │   └── distance.js              # Distance & cost calculations
│   ├── data/
│   │   ├── warehouses.json          # Warehouse data
│   │   ├── customers.json           # Customer data
│   │   ├── orders.json              # Current orders
│   │   ├── orders_history.json      # Completed orders
│   │   └── demand_history.json      # Historical demand
│   ├── config.js                    # Configuration
│   ├── server.js                    # Express server
│   └── package.json
├── SYSTEM_ARCHITECTURE.md           # Detailed architecture
├── README.md                        # This file
└── vite.config.js
```

## 🔌 API Endpoints

### Warehouses
```
GET  /api/warehouses              - List all warehouses
GET  /api/warehouses/:id          - Get warehouse details
```

### Customers
```
GET  /api/customers               - List all customers
GET  /api/customers/:id           - Get customer details
GET  /api/customers/:id/demand    - Get demand history
```

### Orders
```
POST /api/orders                  - Create new order
GET  /api/orders                  - List all orders
GET  /api/orders/:id              - Get order details
PATCH /api/orders/:id             - Update order status
GET  /api/orders/search           - Search orders
```

### Forecasting
```
POST /api/forecast                - Generate demand forecast
POST /api/forecast/stats          - Get demand statistics
```

### Optimization
```
POST /api/optimize/distribution   - Optimize inventory distribution
POST /api/optimize/reorder        - Get reorder recommendations
GET  /api/optimize/health/:id     - Warehouse health status
POST /api/optimize/safety-stock   - Calculate safety stock
GET  /api/optimize/urgent-reorders - Get urgent reorders
```

### Allocation
```
POST /api/allocate/single         - Allocate single order
POST /api/allocate/batch          - Batch allocate orders
POST /api/allocate/optimize       - Optimize allocation
POST /api/allocate/split          - Split shipment
POST /api/allocate/reroute        - Reroute on failure
GET  /api/allocate/stats          - Allocation statistics
```

### Disruptions
```
POST /api/disruption/simulate/warehouse-failure
POST /api/disruption/simulate/shipment-delay
POST /api/disruption/simulate/blocked-route
POST /api/disruption/simulate/random
GET  /api/disruption/metrics      - Resilience metrics
GET  /api/disruption/history      - Disruption history
POST /api/disruption/recovery-plan - Generate recovery plan
```

### Dashboard
```
GET  /api/dashboard               - Full dashboard data
GET  /api/dashboard/widget/:name  - Specific widget data
GET  /api/statistics              - System statistics
GET  /api/health                  - Server health check
```

## 📊 Key Algorithms

### 1. Demand Forecasting

**Moving Average**
```
F(t+1) = (D(t) + D(t-1) + ... + D(t-n+1)) / n
```
Best for: Quick, baseline forecasts

**Linear Regression**
```
y = mx + b
Captures linear trends in demand
```
Best for: Trending markets

**Seasonal Forecasting**
```
Identifies weekly/monthly patterns
F(t+1) = average_value(same_day_previous_weeks)
```
Best for: Products with clear seasonality

### 2. Warehouse Selection (Multi-Criteria Scoring)
```
Score = α·distance_score + β·stock_score + γ·cost_score

Where:
- distance_score = (max_distance - actual_distance) / max_distance
- stock_score = available_quantity / required_quantity
- cost_score = (max_cost - actual_cost) / max_cost
```

### 3. Safety Stock Calculation
```
Safety_Stock = Z(service_level) × σ(demand) × √lead_time

Where:
- Z = Z-score for desired service level (95% = 1.645)
- σ = Standard deviation of demand
- lead_time = Days to receive stock
```

### 4. Economic Order Quantity (EOQ)
```
EOQ = √(2 × D × S / H)

Where:
- D = Annual demand
- S = Cost per order
- H = Holding cost per unit
```

## 📈 Sample Data

### Warehouses
- **WH-NYC**: New York (50,000 unit capacity)
- **WH-LA**: Los Angeles (60,000 unit capacity)
- **WH-CHI**: Chicago (45,000 unit capacity)
- **WH-ATL**: Atlanta (40,000 unit capacity)
- **WH-SEA**: Seattle (35,000 unit capacity)

### Products
- PROD-001 through PROD-005 (5 product types)

### Customers
- 10 customers across US regions (Northeast, Southeast, Midwest, South, Southwest, West, Northwest)

### Demand Patterns
- 25 days of historical data per customer-product combination
- Realistic daily demand variations
- Seasonal patterns embedded in data

## 🎯 Use Cases & Demos

### Demo 1: New Order Creation
1. Go to "Orders" tab
2. Select customer, product, quantity, delivery date
3. Click "Create"
4. See order appear in the list with status "pending"

### Demo 2: Order Allocation
1. Note pending orders in Orders tab
2. View warehouse inventory in Warehouses tab
3. System auto-allocates orders based on:
   - Available stock
   - Distance to customer
   - Delivery cost
4. Orders transition to "assigned" status

### Demo 3: Demand Forecasting
1. Go to "Forecast" tab
2. Select customer and forecasting method
3. Click "Generate Forecast"
4. View 30-day demand projection
5. Compare different methods (Moving Avg vs Linear vs Seasonal)

### Demo 4: Disruption Resilience
1. Go to "Disruptions" tab
2. Click "Warehouse Failure" (simulates NYC warehouse going down)
3. System shows:
   - Affected orders
   - Resilience strategies with priorities
   - Alternative routings
   - Cost impact
4. Recovery plan shows phases to restore operations

### Demo 5: KPI Monitoring
1. Go to "KPIs" tab
2. View real-time metrics
3. Identify if metrics meet targets
4. See status indicators (Good/Warning)
5. Track CO₂ emissions for sustainability

### Demo 6: Alert Management
1. Go to "Alerts" tab
2. View active alerts by severity
3. Critical alerts are immediately visible
4. Each alert includes:
   - Description
   - Recommended action
   - Timestamp
5. Thresholds config shown in table

## ⚙️ Configuration

Edit `backend/config.js` to customize:

```javascript
// Service level target
defaultServiceLevel: 0.95

// Forecasting parameters
planningHorizon: 30           // Days to forecast
movingAverageWindow: 7        // Days for moving average

// Logistics parameters
avgFuelCostPerKm: 0.5
laborCostPerHour: 25
avgSpeedKmPerHour: 60
co2PerKm: 0.12

// Inventory parameters
holdingCostPerUnitPerDay: 0.5
orderingCostPerOrder: 100

// Disruption probabilities
warehouseFailureRate: 0.01
shipmentDelayRate: 0.05
routeBlockageRate: 0.02
```

## 📊 Performance Expectations

### Metrics to Track
- **Delivery Time**: Average 2-3 days (target ≤3 days)
- **Service Level**: 95%+ on-time delivery (target ≥95%)
- **Cost per Order**: $200-500 (target ≤$500)
- **Warehouse Util**: 50-80% (optimal range)
- **CO₂ per Shipment**: ~50-150kg (minimize)

### Optimization Goals
1. **Minimize Total Cost** while maintaining service level
2. **Maximize Service Level** within budget constraints
3. **Reduce Carbon Emissions** through efficient routing
4. **Optimize Inventory Levels** (ABC analysis)
5. **Maximize Warehouse Utilization** (60-80% target)

## 🔄 Data Flow

1. **Order Creation** → Order added to pending queue
2. **Demand Forecasting** → Historical data analyzed
3. **Inventory Analysis** → Stock levels checked
4. **Warehouse Selection** → Multi-criteria scoring applied
5. **Route Optimization** → Distance/cost calculated
6. **Order Allocation** → Best warehouse assigned
7. **KPI Tracking** → Metrics updated
8. **Delivery** → Order moved to shipped/delivered
9. **Analytics** → Historical data accumulated

## 🧪 Testing the System

### Quick Tests
1. Create 5-10 orders
2. Watch real-time allocation in action
3. Simulate a warehouse failure
4. Generate forecasts with different methods
5. Monitor KPI changes in real-time

### Stress Tests
1. Create 50+ orders (watch allocation performance)
2. Trigger multiple disruptions (test resilience)
3. Run all forecasting methods (compare accuracy)
4. Generate detailed KPI reports

### Edge Cases
1. No stock available in any warehouse
2. Customer with no demand history
3. All warehouses below minimum stock
4. Multiple disruptions in sequence

## 📚 Future Enhancements

### Short-term (MVP+)
- [ ] LSTM demand forecasting (Python service)
- [ ] MongoDB integration (replace JSON)
- [ ] Authentication & role-based access
- [ ] Email/SMS notifications
- [ ] Export reports (PDF, Excel)
- [ ] Real map visualization
- [ ] WebSocket for real-time updates

### Medium-term
- [ ] Machine learning models for anomaly detection
- [ ] Advanced route optimization (traveling salesman)
- [ ] Multi-echelon inventory management
- [ ] Supplier integration
- [ ] Real-time traffic data
- [ ] Vehicle routing with time windows

### Long-term
- [ ] Blockchain for supply chain tracking
- [ ] IoT sensor integration
- [ ] Predictive maintenance
- [ ] Autonomous vehicles
- [ ] Dynamic pricing
- [ ] Global network optimization

## 📝 Notes

- **Demo-ready**: All features work with sample data
- **Extensible**: Easy to add new modules
- **Educational**: Great for learning supply chain concepts
- **Real-world**: Based on actual industry practices
- **No external dependencies**: Runs standalone (no APIs required)

## 🤝 Contributing

This is a hackathon project. To extend:

1. Add new modules in `backend/modules/`
2. Add API routes in `backend/routes/`
3. Add React components in `src/components/`
4. Update `backend/config.js` for parameters
5. Test with sample data

## 📄 License

ISC

## 👤 Author

Supply Chain Optimization System
Built for educational and hackathon purposes

---

**🎯 Key Takeaway**: This system demonstrates how AI, optimization algorithms, and a comprehensive dashboard can transform logistics operations, reduce costs, improve service levels, and enhance supply chain resilience.

**Ready to optimize your logistics?** Start the system and explore the features!
