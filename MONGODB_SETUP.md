# MongoDB Setup Guide for Logistics System

Your system is now configured to use MongoDB instead of JSON files!

## 📋 Quick Setup (Choose One)

### Option 1: MongoDB Community Edition (Recommended for Demo)

**On Windows:**

1. **Download MongoDB Community Edition**
   - Visit: https://www.mongodb.com/try/download/community
   - Choose Windows, MSI installer
   - Download and run installer

2. **Install MongoDB**
   - Run the MSI installer
   - Choose "Complete" installation
   - Check "Install MongoDB Compass" (visual tool)
   - Finish installation

3. **Start MongoDB Service**
   ```powershell
   # MongoDB starts automatically as a Windows Service
   # Or manually start it:
   "C:\Program Files\MongoDB\Server\6.0\bin\mongod.exe"
   ```

4. **Verify Installation**
   ```powershell
   mongosh
   > db.version()
   ```
   You should see MongoDB version output.

**On macOS:**

```bash
# Using Homebrew
brew tap mongodb/brew
brew install mongodb-community

# Start MongoDB
brew services start mongodb-community
```

**On Linux:**

```bash
# For Ubuntu/Debian
curl -fsSL https://www.mongodb.org/static/pgp/server-6.0.asc | apt-key add -
echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu focal/mongodb-org/6.0 multiverse" | tee /etc/apt/sources.list.d/mongodb-org-6.0.list
apt-get update
apt-get install -y mongodb-org

sudo systemctl start mongod
```

### Option 2: MongoDB Atlas Cloud (No Installation)

1. Visit: https://www.mongodb.com/cloud/atlas
2. Create free account
3. Create a cluster (free tier)
4. Get connection string
5. Set environment variable:
   ```powershell
   $env:MONGODB_URL = "mongodb+srv://username:password@cluster.mongodb.net/?retryWrites=true&w=majority"
   ```

### Option 3: Docker (If Docker Installed)

```bash
docker run -d -p 27017:27017 --name mongodb mongo:latest
```

---

## ✅ Verify MongoDB is Running

### Check Connection:
```powershell
# In PowerShell
mongosh
```

You should see:
```
Enterprise test>
```

### Create Test Database:
```javascript
// In mongosh
use testdb
db.test.insertOne({ message: "MongoDB is working!" })
db.test.findOne()
```

---

## 🚀 Start Your Logistics System

Now that MongoDB is running on `localhost:27017`:

### Terminal 1 (Backend):
```powershell
cd backend
npm run dev
```

**Expected Output:**
```
🔌 Connecting to MongoDB...
MongoDB connected successfully
📦 Database: logistics_optimization
✓ Collections and indexes initialized
📥 Loading initial data from JSON files...
✓ Loaded 5 warehouses
✓ Loaded 10 customers
✓ Loaded 25+ demand history records
✅ Initial data loaded successfully

✅ Supply Chain Logistics & Optimization System
   Backend Server Online & Connected to MongoDB

📊 Data Status:
   🏭 Warehouses: 5
   👥 Customers: 10
   📦 Orders: 0
   
Ready to handle logistics operations!
```

### Terminal 2 (Frontend):
```powershell
npm run dev
```

### Browser:
```
http://localhost:5173
```

---

## 📊 Monitor Your Data

### Using MongoDB Compass (GUI)

1. Open **MongoDB Compass** (installed with MongoDB)
2. Connect to `mongodb://localhost:27017`
3. Navigate to `logistics_optimization` database
4. View collections:
   - **warehouses** - Your 5 warehouse locations
   - **customers** - Your 10 customers
   - **orders** - New orders created via dashboard
   - **demandHistory** - Historical demand data
   - **ordersHistory** - Completed orders

### Using MongoDB Shell (CLI)

```javascript
// Connect
mongosh

// Use the database
use logistics_optimization

// View collections
show collections

// Count documents
db.warehouses.countDocuments()
db.customers.countDocuments()
db.orders.countDocuments()

// View sample data
db.orders.find().limit(5)

// Search data
db.orders.find({ status: "pending" })
db.orders.find({ customerId: "C001" })
```

---

## 🔧 Connection Configuration

Your system automatically connects to:
- **Host**: `localhost` (or `127.0.0.1`)
- **Port**: `27017` (MongoDB default)
- **Database**: `logistics_optimization`
- **Connection Pool**: 5 connections (optimized for development)

To change, edit `backend/db/mongoConnection.js`:

```javascript
const mongoConfig = {
  url: process.env.MONGODB_URL || 'mongodb://localhost:27017',
  dbName: process.env.DB_NAME || 'logistics_optimization',
  // ...
};
```

Or use environment variables:
```powershell
$env:MONGODB_URL = "mongodb://your-host:27017"
$env:DB_NAME = "your-database-name"
npm run dev
```

---

## 📁 Data Structure

Your data is organized in MongoDB collections:

### **warehouses** collection
```json
{
  "id": "WH-NYC",
  "name": "New York",
  "location": {
    "city": "New York",
    "state": "NY",
    "lat": 40.7128,
    "lon": -74.0060
  },
  "capacity": 50000,
  "currentStock": [
    { "productId": "PROD-001", "quantity": 15000 },
    // ...
  ],
  "createdAt": "2024-04-17T..."
}
```

### **orders** collection
```json
{
  "id": "ORD-xxx",
  "customerId": "C001",
  "productId": "PROD-001",
  "quantity": 100,
  "status": "pending",
  "requiredDate": "2024-04-20T...",
  "allocatedWarehouse": "WH-NYC",
  "cost": 325.50,
  "createdAt": "2024-04-17T...",
  "updatedAt": "2024-04-17T..."
}
```

### **demandHistory** collection
```json
{
  "customerId": "C001",
  "productId": "PROD-001",
  "date": "2024-04-01T...",
  "demand": 250
}
```

---

## 🧪 Test Your Setup

1. **Create an Order via Dashboard**
   - Go to frontend: http://localhost:5173
   - Click "Orders" tab
   - Create a new order
   - Check MongoDB Compass - see order in `orders` collection

2. **Run Forecast**
   - Click "Forecast" tab
   - Generate a forecast
   - Backend pulls from `demandHistory` automatically

3. **Simulate Disruption**
   - Click "Disruptions" tab
   - Orders in database are updated with status changes
   - View in MongoDB Compass

---

## 🛠️ Troubleshooting

### "Cannot connect to MongoDB"

**Check 1: Is MongoDB running?**
```powershell
mongosh
```
Should show `Enterprise test>` prompt.

**Check 2: Wrong host/port?**
Verify in backend console output. Should say:
```
🔌 Connecting to MongoDB: mongodb://localhost:27017/logistics_optimization
```

**Check 3: Firewall blocking?**
- Windows Firewall may block MongoDB
- Open Windows Defender Firewall
- Allow "MongoDB Server" or port 27017

### "Database already exists"

This is fine! First run creates the database and loads initial data. Subsequent runs use existing data.

To reset:
```javascript
// In mongosh
use logistics_optimization
db.dropDatabase()
// Restart server - data reloads from JSON files
```

### "Out of memory" or "Too slow"

Your development setup uses a small connection pool (5 connections). This is optimized for demo/hackathon. For production, increase in `mongoConnection.js`:
```javascript
maxPoolSize: 50,    // Increase for high concurrency
minPoolSize: 10,
```

---

## 📖 Additional Resources

- **MongoDB Official Docs**: https://docs.mongodb.com
- **MongoDB Compass GUI**: https://www.mongodb.com/products/compass
- **MongoDB Shell (mongosh)**: https://www.mongodb.com/docs/mongodb-shell/
- **MongoDB Atlas Cloud**: https://www.mongodb.com/cloud/atlas

---

## ✨ You're All Set!

Your logistics system now uses MongoDB for persistent, scalable data storage instead of JSON files!

**Next Steps:**
1. Start MongoDB service ✓
2. Run `npm run dev` in backend ✓
3. Run `npm run dev` in frontend ✓
4. Visit http://localhost:5173 ✓
5. Create test orders and explore data ✓

Questions? Check the logs in both terminal windows!
