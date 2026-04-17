// MongoDB-based Data Manager
// Replaces JSON file-based storage with MongoDB collections

const { getDB } = require('../db/mongoConnection');
const fs = require('fs');
const path = require('path');

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
      const dataDir = path.join(__dirname, '../../backend/data');
      
      // Load warehouses
      const warehousesData = JSON.parse(
        fs.readFileSync(path.join(dataDir, 'warehouses.json'), 'utf8')
      );
      if (warehousesData.warehouses) {
        await this.db.collection('warehouses').deleteMany({});
        const warehousesToInsert = warehousesData.warehouses.map(w => ({
          ...w,
          createdAt: new Date()
        }));
        await this.db.collection('warehouses').insertMany(warehousesToInsert);
        console.log(`✓ Loaded ${warehousesData.warehouses.length} warehouses`);
      }

      // Load customers
      const customersData = JSON.parse(
        fs.readFileSync(path.join(dataDir, 'customers.json'), 'utf8')
      );
      if (customersData.customers) {
        await this.db.collection('customers').deleteMany({});
        const customersToInsert = customersData.customers.map(c => ({
          ...c,
          createdAt: new Date()
        }));
        await this.db.collection('customers').insertMany(customersToInsert);
        console.log(`✓ Loaded ${customersData.customers.length} customers`);
      }

      // Load demand history
      const demandData = JSON.parse(
        fs.readFileSync(path.join(dataDir, 'demand_history.json'), 'utf8')
      );
      if (demandData.demandHistory) {
        await this.db.collection('demandHistory').deleteMany({});
        const demandToInsert = demandData.demandHistory.map(d => ({
          ...d,
          date: new Date(d.date)
        }));
        await this.db.collection('demandHistory').insertMany(demandToInsert);
        console.log(`✓ Loaded ${demandData.demandHistory.length} demand history records`);
      }

      console.log('✅ Initial data loaded successfully');
      
    } catch (error) {
      console.error('Error loading initial data:', error.message);
      throw error;
    }
  }

  // ========== WAREHOUSE OPERATIONS ==========

  async getWarehouses() {
    return await this.db.collection('warehouses').find({}).toArray();
  }

  async getWarehouse(warehouseId) {
    return await this.db.collection('warehouses').findOne({ id: warehouseId });
  }

  async updateWarehouseStock(warehouseId, productId, newQuantity) {
    return await this.db.collection('warehouses').updateOne(
      { id: warehouseId, 'currentStock.productId': productId },
      { $set: { 'currentStock.$.quantity': newQuantity, updatedAt: new Date() } }
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
    const updateData = {
      status,
      updatedAt: new Date()
    };
    
    if (allocatedWarehouse) updateData.allocatedWarehouse = allocatedWarehouse;
    if (cost) updateData.cost = cost;

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
    
    return await this.db.collection('demandHistory')
      .find(filter)
      .sort({ date: 1 })
      .toArray();
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
          totalStock: {
            $sum: {
              $sum: '$currentStock.quantity'
            }
          }
        }
      }
    ]).toArray();

    return {
      totalOrders: orderCount,
      totalWarehouses: warehouseCount,
      totalCustomers: customerCount,
      ordersByStatus: orderStats,
      warehouse: warehouseStats[0] || { totalCapacity: 0, totalStock: 0 }
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
