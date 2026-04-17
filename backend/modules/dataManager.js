// Data Manager - handles loading and saving data

const fs = require('fs');
const path = require('path');
const config = require('../config');

class DataManager {
  constructor() {
    this.warehouses = [];
    this.customers = [];
    this.orders = [];
    this.ordersHistory = [];
    this.demandHistory = {};
    this.distanceMatrix = null;
  }

  /**
   * Load all data from files
   */
  loadData() {
    try {
      console.log('Loading data...');

      // Load warehouses
      if (fs.existsSync(config.data.warehousesFile)) {
        const data = fs.readFileSync(config.data.warehousesFile, 'utf8');
        this.warehouses = JSON.parse(data);
        console.log(`✓ Loaded ${this.warehouses.length} warehouses`);
      }

      // Load customers
      if (fs.existsSync(config.data.customersFile)) {
        const data = fs.readFileSync(config.data.customersFile, 'utf8');
        this.customers = JSON.parse(data);
        console.log(`✓ Loaded ${this.customers.length} customers`);
      }

      // Load orders
      if (fs.existsSync(config.data.ordersFile)) {
        const data = fs.readFileSync(config.data.ordersFile, 'utf8');
        this.orders = JSON.parse(data);
        console.log(`✓ Loaded ${this.orders.length} pending orders`);
      }

      // Load orders history
      if (fs.existsSync(config.data.ordersHistoryFile)) {
        const data = fs.readFileSync(config.data.ordersHistoryFile, 'utf8');
        this.ordersHistory = JSON.parse(data);
        console.log(`✓ Loaded ${this.ordersHistory.length} historical orders`);
      }

      // Load demand history
      if (fs.existsSync(config.data.demandHistoryFile)) {
        const data = fs.readFileSync(config.data.demandHistoryFile, 'utf8');
        this.demandHistory = JSON.parse(data);
        console.log(`✓ Loaded demand history`);
      }

      return true;
    } catch (error) {
      console.error('Error loading data:', error.message);
      return false;
    }
  }

  /**
   * Save data to files
   */
  saveData() {
    try {
      fs.writeFileSync(config.data.ordersFile, JSON.stringify(this.orders, null, 2));
      fs.writeFileSync(config.data.ordersHistoryFile, JSON.stringify(this.ordersHistory, null, 2));
      return true;
    } catch (error) {
      console.error('Error saving data:', error.message);
      return false;
    }
  }

  /**
   * Add new order
   */
  addOrder(order) {
    this.orders.push(order);
    this.saveData();
    return order;
  }

  /**
   * Get order by ID
   */
  getOrder(orderId) {
    return this.orders.find(o => o.id === orderId);
  }

  /**
   * Update order status
   */
  updateOrderStatus(orderId, status, additionalData = {}) {
    const order = this.getOrder(orderId);
    if (!order) return null;

    order.status = status;
    Object.assign(order, additionalData);
    this.saveData();
    return order;
  }

  /**
   * Get warehouse by ID
   */
  getWarehouse(warehouseId) {
    return this.warehouses.find(w => w.id === warehouseId);
  }

  /**
   * Get customer by ID
   */
  getCustomer(customerId) {
    return this.customers.find(c => c.id === customerId);
  }

  /**
   * Update warehouse stock
   */
  updateWarehouseStock(warehouseId, productId, quantity) {
    const warehouse = this.getWarehouse(warehouseId);
    if (!warehouse) return false;

    if (!warehouse.currentStock[productId]) {
      warehouse.currentStock[productId] = 0;
    }

    warehouse.currentStock[productId] += quantity;
    return true;
  }

  /**
   * Get demand history for customer/product
   */
  getDemandHistory(customerId, productId) {
    if (this.demandHistory[customerId] && this.demandHistory[customerId][productId]) {
      return this.demandHistory[customerId][productId];
    }
    return [];
  }

  /**
   * Get all data
   */
  getAllData() {
    return {
      warehouses: this.warehouses,
      customers: this.customers,
      orders: this.orders,
      ordersHistory: this.ordersHistory,
      demandHistory: this.demandHistory
    };
  }

  /**
   * Get statistics
   */
  getStatistics() {
    const totalStock = this.warehouses.reduce((sum, w) => {
      return sum + Object.values(w.currentStock).reduce((a, b) => a + b, 0);
    }, 0);

    const totalCapacity = this.warehouses.reduce((sum, w) => sum + w.capacity, 0);

    return {
      warehouses: {
        count: this.warehouses.length,
        totalCapacity,
        totalStock,
        utilizationPercent: ((totalStock / totalCapacity) * 100).toFixed(2)
      },
      customers: {
        count: this.customers.length
      },
      orders: {
        pending: this.orders.filter(o => o.status === 'pending').length,
        assigned: this.orders.filter(o => o.status === 'assigned').length,
        shipped: this.orders.filter(o => o.status === 'shipped').length,
        delivered: this.orders.filter(o => o.status === 'delivered').length,
        failed: this.orders.filter(o => o.status === 'failed').length,
        total: this.orders.length
      },
      historicalOrders: this.ordersHistory.length
    };
  }
}

module.exports = DataManager;
