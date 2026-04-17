# 🚀 Quick Start Guide

Get the logistics optimization system up and running in 5 minutes!

## ✅ Prerequisites

- **Node.js 16+** installed ([Download](https://nodejs.org/))
- **npm** (comes with Node.js)
- **Two terminal windows** (one for backend, one for frontend)

## 🎯 5-Minute Setup

### Step 1: Install Backend Dependencies (2 minutes)

```bash
# Navigate to backend folder
cd backend

# Install packages
npm install

# Expected: node_modules created, ~50 packages installed
```

### Step 2: Start Backend Server (1 minute)

```bash
# In the same backend folder
npm run dev
```

**Expected Output:**
```
╔════════════════════════════════════════╗
║   🚀 LOGISTICS OPTIMIZATION SYSTEM    ║
╚════════════════════════════════════════╝
✓ Loaded 5 warehouses
✓ Loaded 10 customers
✓ Loaded 25 demand history records
✓ Distance matrix built

🔗 API Routes:
  - /api/warehouses        (GET)
  - /api/customers         (GET)
  - /api/orders            (POST/GET/PATCH)
  - /api/forecast          (POST)
  - /api/optimize          (POST)
  - /api/allocate          (POST)
  - /api/disruption        (POST)
  - /api/dashboard         (GET)

✅ Server Online: http://localhost:3000
```

✅ **Backend is ready!** Keep this terminal running.

### Step 3: Install Frontend Dependencies (1 minute)

Open a **new terminal window** in the project root:

```bash
# Make sure you're in project root (rv-project)
npm install
```

### Step 4: Start Frontend Dev Server (1 minute)

```bash
# In project root
npm run dev
```

**Expected Output:**
```
  VITE v5.x.x  ready in xxx ms

  ➜  Local:   http://localhost:5173/
  ➜  Press h to show help
```

### Step 5: Open in Browser (30 seconds)

```
http://localhost:5173
```

✅ **You're live!** 🎉

---

## 📋 What You Should See

1. **Blue header** with "Logistics Optimization System" title
2. **Navigation tabs**: Dashboard, Warehouses, Orders, Forecast, KPIs, Disruptions, Alerts
3. **Loading spinner** while connecting to backend
4. **Dashboard view** showing warehouses, orders, KPIs

---

## 🧪 First Test: Create an Order

1. Click **"Orders"** tab
2. Select a customer (e.g., "Customer-001")
3. Select a product (e.g., "PROD-001")
4. Enter quantity: `100`
5. Set delivery date: tomorrow
6. Click **"Create Order"**
7. See order appear in the list with status "pending"

✅ **Success!** You've created your first order!

---

## 🔮 Next: Try the Features

### Forecasting Demo
1. Go to **"Forecast"** tab
2. Select a customer
3. Choose method: **"Linear"**
4. Click **"Generate Forecast"**
5. See 30-day demand projection with trend

### Disruption Simulation
1. Go to **"Disruptions"** tab
2. Click **"Warehouse Failure"** button
3. Watch system generate resilience strategies
4. See alternative routing options

### KPI Monitoring
1. Go to **"KPIs"** tab
2. Monitor real-time metrics:
   - Delivery time (days)
   - Service level (%)
   - Cost per order ($)
   - CO₂ emissions (kg)

---

## 🔧 Troubleshooting

### ❌ "Cannot connect to server"

**Problem**: Frontend shows error about connecting to localhost:3000

**Solution**:
1. Check backend terminal is showing "Server Online"
2. Backend must be running on port 3000
3. Try: `http://localhost:3000/api/health` in browser (should show "OK")

### ❌ "npm ERR! not found"

**Problem**: npm install failed

**Solution**:
```bash
# Clear cache
npm cache clean --force

# Try install again
npm install
```

### ❌ "Port 3000 already in use"

**Problem**: Backend won't start (port conflict)

**Solution**:
```bash
# Find process using port 3000
# On Windows:
netstat -ano | findstr :3000

# Kill the process or use different port
# Edit backend/server.js, change port to 3001
```

### ❌ "CORS error" in browser console

**Problem**: Frontend can't call backend API

**Solution**:
1. Restart backend server
2. Check backend is running on :3000
3. Check API_BASE in App.jsx is `http://localhost:3000/api`

---

## 📁 File Structure Quick Reference

```
rv-project/
├── backend/                  # Express server (port 3000)
│   ├── modules/             # Core algorithms
│   ├── routes/              # API endpoints
│   ├── data/                # Sample data (JSON)
│   ├── server.js            # Main server file
│   └── package.json
│
├── src/                     # React frontend (port 5173)
│   ├── components/          # React components
│   ├── App.jsx             # Main app shell
│   ├── App.css             # Styles
│   └── main.jsx
│
├── README_LOGISTICS.md      # Complete documentation
└── QUICK_START.md          # This file
```

---

## 🎮 API Quick Reference

### Create Order
```bash
curl -X POST http://localhost:3000/api/orders \
  -H "Content-Type: application/json" \
  -d '{
    "customerId": "C001",
    "productId": "PROD-001",
    "quantity": 100,
    "requiredDate": "2024-12-25"
  }'
```

### Generate Forecast
```bash
curl -X POST http://localhost:3000/api/forecast \
  -H "Content-Type: application/json" \
  -d '{
    "customerId": "C001",
    "method": "linear",
    "days": 30
  }'
```

### Get Dashboard Data
```bash
curl http://localhost:3000/api/dashboard
```

---

## ⌨️ Keyboard Shortcuts (Dashboard)

- **Tab key**: Navigate between sections
- **Click tab name**: Switch to different feature
- **Refresh**: Data refreshes every 3-5 seconds automatically

---

## 📊 Sample Test Scenarios

### Scenario 1: High Demand
1. Create 10+ orders for same product
2. Watch inventory levels drop
3. Note warehouse utilization changes
4. See cost increase in KPIs

### Scenario 2: Disruption Recovery
1. Go to Disruptions tab
2. Click "Warehouse Failure"
3. View affected orders
4. See recovery strategies ranked by priority
5. Check alternative routes

### Scenario 3: Forecasting Comparison
1. Generate forecast with "Moving Average"
2. Generate same with "Linear"
3. Generate same with "Seasonal"
4. Compare accuracy/trends

---

## 🚫 Common Questions

**Q: Do I need a database?**
A: No! System uses JSON files in `/backend/data/`. Perfect for demo/hackathon.

**Q: Can I modify warehouse data?**
A: Yes! Edit `/backend/data/warehouses.json` or via API. Changes persist.

**Q: How do I reset data?**
A: Delete orders files (keep demand_history.json):
```bash
rm backend/data/orders.json
rm backend/data/orders_history.json
```

**Q: Can I run without terminal?**
A: For development, no. For production, use PM2:
```bash
npm install -g pm2
pm2 start backend/server.js
```

**Q: How many orders can it handle?**
A: Tested with 100+ orders. Performance depends on forecasting method.

---

## 🎓 Learning Path

1. **5 min**: Get it running (this guide)
2. **15 min**: Create orders, view dashboard
3. **30 min**: Try each tab (Forecast, Disruptions, KPIs)
4. **1 hour**: Read SYSTEM_ARCHITECTURE.md
5. **2 hours**: Explore backend code, understand algorithms
6. **4 hours**: Modify config, create custom scenarios

---

## 🚀 Next Steps

1. ✅ Run the system (you did this!)
2. Read [README_LOGISTICS.md](README_LOGISTICS.md) for detailed docs
3. Read [SYSTEM_ARCHITECTURE.md](SYSTEM_ARCHITECTURE.md) for technical details
4. Modify config in `backend/config.js` for your scenario
5. Add new modules in `backend/modules/`

---

## 💡 Pro Tips

- **Responsive Design**: Test on mobile (resize browser to ~375px width)
- **Dark Theme**: All-dark interface, easy on eyes for hackathons
- **Real Data**: 5 warehouses, 10 customers, 25 days demand history (realistic)
- **No Secrets**: All code open, easy to explain to judges
- **Modular**: Each module (Forecasting, Inventory, Routing) can be extended

---

## 📞 Need Help?

1. Check terminal for error messages
2. Open browser DevTools (F12) → Console tab
3. Look for red errors (use those to debug)
4. Restart both servers (backend first, then frontend)

---

## ✨ Ready?

```bash
# Terminal 1 (Backend)
cd backend && npm install && npm run dev

# Terminal 2 (Frontend)  
npm install && npm run dev

# Browser
http://localhost:5173
```

**You're live! 🎉**

Good luck with your demo! Questions? Check the README_LOGISTICS.md for detailed documentation.
