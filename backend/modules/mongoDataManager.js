// MongoDB-based Data Manager
// Replaces JSON file-based storage with MongoDB collections

const { getDB } = require('../db/mongoConnection');
const fs = require('fs');
const path = require('path');

const PRODUCT_NAME_MAP = {
  'PROD-001': 'Transmissions',
  'PROD-002': 'Electric Drives',
  'PROD-003': 'Air bags and Seat belts',
  'PROD-004': 'Breaking and Safety Systems',
  'PROD-005': 'Powertrain Components'
};

function normalizeCurrentStock(currentStock = {}) {
  return Object.entries(currentStock).reduce((normalized, [productId, quantity]) => {
    const displayName = PRODUCT_NAME_MAP[productId] || productId;
    normalized[displayName] = quantity;
    return normalized;
  }, {});
}

function normalizeWarehouse(warehouse) {
  if (!warehouse || !warehouse.currentStock) {
    return warehouse;
  }

  return {
    ...warehouse,
    currentStock: normalizeCurrentStock(warehouse.currentStock)
  };
}

class MongoDataManager {
  constructor() {
    this.db = null;
    this.initialized = false;
  }

  /**
   * Initialize the data manager and load initial data from JSON files if collections are empty
   */
  async initialize() {
    this.db = getDB();
    this.initialized = true;
    
    // Check if collections exist and have data
    const whCount = await this.db.collection('warehouses').countDocuments();
    const custCount = await this.db.collection('customers').countDocuments();
    
    if (whCount === 0 || custCount === 0) {
      console.log('📥 Loading initial data from JSON files...');
      await this.loadInitialDataFromJSON();
    } else {
      console.log('✓ Data already exists in MongoDB');
    }
  }

  /**
   * Load initial data from JSON files into MongoDB
   */
  async loadInitialDataFromJSON() {
    try {
      const dataDir = path.join(__dirname, '../data');
      console.log(`📁 Loading data from: ${dataDir}`);
      
      // Load warehouses (JSON is a direct array, not wrapped)
      console.log('📦 Loading warehouses...');
      const warehousesData = JSON.parse(
        fs.readFileSync(path.join(dataDir, 'warehouses.json'), 'utf8')
      );
      console.log(`  Found ${Array.isArray(warehousesData) ? warehousesData.length : 0} warehouses in JSON`);
      
      if (Array.isArray(warehousesData) && warehousesData.length > 0) {
        await this.db.collection('warehouses').deleteMany({});
        const warehousesToInsert = warehousesData.map(w => ({
          ...w,
          createdAt: new Date()
        }));
        const whResult = await this.db.collection('warehouses').insertMany(warehousesToInsert);
        console.log(`✓ Inserted ${whResult.insertedCount} warehouses`);
      }

      // Load customers (JSON is a direct array, not wrapped)
      console.log('👥 Loading customers...');
      const customersData = JSON.parse(
        fs.readFileSync(path.join(dataDir, 'customers.json'), 'utf8')
      );
      console.log(`  Found ${Array.isArray(customersData) ? customersData.length : 0} customers in JSON`);
      
      if (Array.isArray(customersData) && customersData.length > 0) {
        await this.db.collection('customers').deleteMany({});
        const customersToInsert = customersData.map(c => ({
          ...c,
          createdAt: new Date()
        }));
        const custResult = await this.db.collection('customers').insertMany(customersToInsert);
        console.log(`✓ Inserted ${custResult.insertedCount} customers`);
      }

      // Load demand history (JSON is an object with customer IDs as keys)
      console.log('📊 Loading demand history...');
      const demandData = JSON.parse(
        fs.readFileSync(path.join(dataDir, 'demand_history.json'), 'utf8')
      );
      if (typeof demandData === 'object' && !Array.isArray(demandData)) {
        await this.db.collection('demandHistory').deleteMany({});
        const demandRecords = [];
        for (const [customerId, productData] of Object.entries(demandData)) {
          for (const [productId, quantities] of Object.entries(productData)) {
            if (Array.isArray(quantities)) {
              quantities.forEach((quantity, dayIndex) => {
                demandRecords.push({
                  customerId,
                  productId,
                  quantity,
                  day: dayIndex,
                  createdAt: new Date()
                });
              });
            }
          }
        }
        if (demandRecords.length > 0) {
          const demandResult = await this.db.collection('demandHistory').insertMany(demandRecords);
          console.log(`✓ Inserted ${demandResult.insertedCount} demand history records`);
        } else {
          console.log('  No demand records to insert');
        }
      }

      console.log('✅ Initial data loaded successfully');
      
    } catch (error) {
      console.error('❌ Error loading initial data:', error.message);
      console.error('Stack:', error.stack);
      throw error;
    }
  }

  // ========== WAREHOUSE OPERATIONS ==========

  async getWarehouses() {
    const warehouses = await this.db.collection('warehouses').find({}).toArray();
    return warehouses.map(normalizeWarehouse);
  }

  async getWarehouse(warehouseId) {
    const warehouse = await this.db.collection('warehouses').findOne({ id: warehouseId });
    return normalizeWarehouse(warehouse);
  }

  async updateWarehouseStock(warehouseId, productId, newQuantity) {
    return await this.db.collection('warehouses').updateOne(
      { id: warehouseId },
      {
        $set: {
          [`currentStock.${productId}`]: newQuantity,
          updatedAt: new Date()
        }
      }
    );
  }

  // ========== CUSTOMER OPERATIONS ==========

  async getCustomers() {
    return await this.db.collection('customers').find({}).toArray();
  }

  async getCustomer(customerId) {
    return await this.db.collection('customers').findOne({ id: customerId });
  }

  // ========== ORDER OPERATIONS ==========

  async addOrder(order) {
    const newOrder = {
      ...order,
      createdAt: new Date(),
      updatedAt: new Date(),
      status: 'pending'
    };
    const result = await this.db.collection('orders').insertOne(newOrder);
    return { ...newOrder, _id: result.insertedId };
  }

  async getOrder(orderId) {
    return await this.db.collection('orders').findOne({ id: orderId });
  }

  async getOrders(filter = {}) {
    return await this.db.collection('orders').find(filter).toArray();
  }

  async updateOrderStatus(orderId, status, allocatedWarehouse = null, cost = null) {
    const updateData = { updatedAt: new Date() };

    if (status) {
      updateData.status = status;
    }

    if (
      allocatedWarehouse &&
      typeof allocatedWarehouse === 'object' &&
      !Array.isArray(allocatedWarehouse)
    ) {
      Object.assign(updateData, allocatedWarehouse);
    } else {
      if (allocatedWarehouse) updateData.allocatedWarehouse = allocatedWarehouse;
      if (cost !== null && cost !== undefined) updateData.cost = cost;
    }

    return await this.db.collection('orders').updateOne(
      { id: orderId },
      { $set: updateData }
    );
  }

  async searchOrders(query) {
    const filter = {};
    if (query.customerId) filter.customerId = query.customerId;
    if (query.warehouseId) filter.allocatedWarehouse = query.warehouseId;
    if (query.status) filter.status = query.status;
    
    return await this.db.collection('orders').find(filter).toArray();
  }

  async getPendingOrders() {
    return await this.db.collection('orders').find({ status: 'pending' }).toArray();
  }

  // ========== DEMAND HISTORY OPERATIONS ==========

  async getDemandHistory(customerId, productId = null) {
    const filter = { customerId };
    if (productId) filter.productId = productId;

    const records = await this.db.collection('demandHistory')
      .find(filter)
      .sort({ day: 1, date: 1 })
      .toArray();

    if (productId) {
      return records.map((record) => record.quantity);
    }

    return records;
  }

  async getAllDemandHistory() {
    return await this.db.collection('demandHistory')
      .find({})
      .sort({ date: 1 })
      .toArray();
  }

  // ========== ORDER HISTORY OPERATIONS ==========

  async addToOrderHistory(order) {
    return await this.db.collection('ordersHistory').insertOne({
      ...order,
      createdAt: new Date(),
      completedAt: new Date()
    });
  }

  async getOrderHistory(filter = {}) {
    return await this.db.collection('ordersHistory').find(filter).toArray();
  }

  // ========== STATISTICS & AGGREGATIONS ==========

  async getStatistics() {
    const [orderCount, warehouseCount, customerCount] = await Promise.all([
      this.db.collection('orders').countDocuments(),
      this.db.collection('warehouses').countDocuments(),
      this.db.collection('customers').countDocuments()
    ]);

    // Get order status breakdown
    const orderStats = await this.db.collection('orders').aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]).toArray();

    // Calculate total stock and capacity
    const warehouseStats = await this.db.collection('warehouses').aggregate([
      {
        $group: {
          _id: null,
          totalCapacity: { $sum: '$capacity' },
          totalStock: { $sum: 0 }
        }
      }
    ]).toArray();

    const warehouses = await this.getWarehouses();
    const totalStock = warehouses.reduce(
      (sum, warehouse) => sum + Object.values(warehouse.currentStock || {}).reduce((acc, qty) => acc + qty, 0),
      0
    );

    return {
      totalOrders: orderCount,
      totalWarehouses: warehouseCount,
      totalCustomers: customerCount,
      ordersByStatus: orderStats,
      warehouse: {
        totalCapacity: warehouseStats[0]?.totalCapacity || 0,
        totalStock
      }
    };
  }

  // ========== BULK OPERATIONS ==========

  async clearAllData() {
    const collections = ['orders', 'ordersHistory', 'demandHistory'];
    for (const collName of collections) {
      await this.db.collection(collName).deleteMany({});
    }
    console.log('✓ Cleared all transaction data');
  }

  async resetToInitialState() {
    await this.clearAllData();
    await this.loadInitialDataFromJSON();
    console.log('✓ Reset to initial state');
  }
}

// Singleton instance
let dataManagerInstance = null;

function getDataManager() {
  if (!dataManagerInstance) {
    dataManagerInstance = new MongoDataManager();
  }
  return dataManagerInstance;
}

module.exports = {
  MongoDataManager,
  getDataManager
};
