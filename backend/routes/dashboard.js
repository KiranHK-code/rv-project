// Dashboard Routes - Consolidates all metrics and data

const express = require('express');
const router = express.Router();

module.exports = (dataManager, kpiTracker, config) => {
  /**
   * Get comprehensive dashboard data
   */
  router.get('/', (req, res) => {
    const totalStock = dataManager.warehouses.reduce((sum, w) => {
      return sum + Object.values(w.currentStock).reduce((a, b) => a + b, 0);
    }, 0);

    const totalCapacity = dataManager.warehouses.reduce((sum, w) => sum + w.capacity, 0);

    const orders = dataManager.orders;
    const pendingOrders = orders.filter(o => o.status === 'pending');
    const assignedOrders = orders.filter(o => o.status === 'assigned');

    const dashboardData = {
      timestamp: new Date().toISOString(),
      summary: {
        systemStatus: 'operational',
        activeWarehouses: dataManager.warehouses.length,
        registeredCustomers: dataManager.customers.length,
        totalOrders: orders.length
      },
      inventory: {
        totalStock,
        totalCapacity,
        utilizationPercent: ((totalStock / totalCapacity) * 100).toFixed(2),
        warehouseDetails: dataManager.warehouses.map(w => {
          const stock = Object.values(w.currentStock).reduce((a, b) => a + b, 0);
          return {
            id: w.id,
            name: w.name,
            location: w.location,
            stock,
            capacity: w.capacity,
            utilization: ((stock / w.capacity) * 100).toFixed(2),
            lowStockAlert: stock < (w.capacity * 0.2)
          };
        })
      },
      orders: {
        pending: pendingOrders.length,
        assigned: assignedOrders.length,
        shipped: orders.filter(o => o.status === 'shipped').length,
        delivered: orders.filter(o => o.status === 'delivered').length,
        failed: orders.filter(o => o.status === 'failed').length
      },
      allocation: {
        totalCost: assignedOrders.reduce((sum, o) => sum + (o.route?.cost || 0), 0).toFixed(2),
        totalCO2: assignedOrders.reduce((sum, o) => sum + (o.route?.co2Emissions || 0), 0).toFixed(2),
        avgDeliveryDays: assignedOrders.length > 0 ?
          (assignedOrders.reduce((sum, o) => sum + (o.route?.deliveryDays || 0), 0) / assignedOrders.length).toFixed(2) : 0
      },
      kpis: kpiTracker.getDashboardMetrics(dataManager.warehouses, orders),
      disruptions: kpiTracker.getDisruptionStats(),
      alerts: generateAlerts(dataManager, kpiTracker)
    };

    res.json(dashboardData);
  });

  /**
   * Get specific dashboard widgets
   */
  router.get('/widget/:name', (req, res) => {
    const widgetName = req.params.name.toLowerCase();

    let widget = {};

    switch (widgetName) {
      case 'inventory':
        widget = getInventoryWidget();
        break;
      case 'orders':
        widget = getOrdersWidget();
        break;
      case 'kpis':
        widget = getKPIsWidget();
        break;
      case 'alerts':
        widget = getAlertsWidget();
        break;
      case 'map':
        widget = getMapWidget();
        break;
      case 'performance':
        widget = getPerformanceWidget();
        break;
      default:
        return res.status(404).json({ error: 'Widget not found' });
    }

    res.json(widget);
  });

  function getInventoryWidget() {
    const totalStock = dataManager.warehouses.reduce((sum, w) => {
      return sum + Object.values(w.currentStock).reduce((a, b) => a + b, 0);
    }, 0);

    const totalCapacity = dataManager.warehouses.reduce((sum, w) => sum + w.capacity, 0);

    return {
      type: 'inventory',
      data: {
        totalStock,
        totalCapacity,
        utilizationPercent: ((totalStock / totalCapacity) * 100).toFixed(2),
        warehouses: dataManager.warehouses.map(w => {
          const stock = Object.values(w.currentStock).reduce((a, b) => a + b, 0);
          return {
            id: w.id,
            name: w.name,
            stock,
            capacity: w.capacity,
            utilization: ((stock / w.capacity) * 100).toFixed(2)
          };
        })
      }
    };
  }

  function getOrdersWidget() {
    const orders = dataManager.orders;
    return {
      type: 'orders',
      data: {
        total: orders.length,
        byStatus: {
          pending: orders.filter(o => o.status === 'pending').length,
          assigned: orders.filter(o => o.status === 'assigned').length,
          shipped: orders.filter(o => o.status === 'shipped').length,
          delivered: orders.filter(o => o.status === 'delivered').length,
          failed: orders.filter(o => o.status === 'failed').length
        },
        recentOrders: orders.slice(-10).reverse()
      }
    };
  }

  function getKPIsWidget() {
    const assigned = dataManager.orders.filter(o => o.status === 'assigned');
    const totalCost = assigned.reduce((sum, o) => sum + (o.route?.cost || 0), 0);
    const totalCO2 = assigned.reduce((sum, o) => sum + (o.route?.co2Emissions || 0), 0);
    const avgDeliveryDays = assigned.length > 0 ?
      (assigned.reduce((sum, o) => sum + (o.route?.deliveryDays || 0), 0) / assigned.length) : 0;

    return {
      type: 'kpis',
      data: {
        averageDeliveryTime: avgDeliveryDays.toFixed(2),
        serviceLevel: kpiTracker.getServiceLevel() + '%',
        averageCostPerOrder: assigned.length > 0 ? (totalCost / assigned.length).toFixed(2) : 0,
        totalCO2Emissions: totalCO2.toFixed(2),
        warehouseUtilization: kpiTracker.getAverageWarehouseUtilization() + '%'
      }
    };
  }

  function getAlertsWidget() {
    const alerts = [];

    // Check stock levels
    for (const warehouse of dataManager.warehouses) {
      const stock = Object.values(warehouse.currentStock).reduce((a, b) => a + b, 0);
      if (stock < (warehouse.capacity * 0.2)) {
        alerts.push({
          severity: 'high',
          type: 'LOW_STOCK',
          message: `Warehouse ${warehouse.name} stock at ${((stock / warehouse.capacity) * 100).toFixed(0)}%`,
          warehouse: warehouse.id,
          timestamp: new Date()
        });
      }
    }

    // Check pending orders
    const pendingOrders = dataManager.orders.filter(o => o.status === 'pending');
    if (pendingOrders.length > 20) {
      alerts.push({
        severity: 'medium',
        type: 'PENDING_ORDERS',
        message: `${pendingOrders.length} orders pending allocation`,
        count: pendingOrders.length,
        timestamp: new Date()
      });
    }

    return {
      type: 'alerts',
      data: {
        totalAlerts: alerts.length,
        alerts
      }
    };
  }

  function getMapWidget() {
    return {
      type: 'map',
      data: {
        warehouses: dataManager.warehouses.map(w => ({
          id: w.id,
          name: w.name,
          lat: w.location.lat,
          lon: w.location.lon,
          stock: Object.values(w.currentStock).reduce((a, b) => a + b, 0),
          capacity: w.capacity
        })),
        customers: dataManager.customers.map(c => ({
          id: c.id,
          name: c.name,
          lat: c.location.lat,
          lon: c.location.lon,
          region: c.region
        })),
        routes: dataManager.orders
          .filter(o => o.route && o.status === 'assigned')
          .map(o => ({
            orderId: o.id,
            from: dataManager.getWarehouse(o.assignedWarehouse)?.location,
            to: dataManager.getCustomer(o.customerId)?.location,
            distance: o.route.distance,
            cost: o.route.cost
          }))
      }
    };
  }

  function getPerformanceWidget() {
    const allOrders = dataManager.orders;
    const deliveredOrders = allOrders.filter(o => o.status === 'delivered');

    return {
      type: 'performance',
      data: {
        totalDeliveries: deliveredOrders.length,
        averageDeliveryTime: kpiTracker.getAverageDeliveryTime() + ' days',
        serviceLevel: kpiTracker.getServiceLevel() + '%',
        totalCost: kpiTracker.getTotalCost(),
        costPerDelivery: kpiTracker.getAverageCostPerDelivery(),
        carbonFootprint: kpiTracker.getTotalCO2Emissions() + ' kg CO2',
        trends: {
          deliveryTime: 'stable',
          serviceLevel: 'improving',
          cost: 'optimized'
        }
      }
    };
  }

  function generateAlerts(dataManager, kpiTracker) {
    const alerts = [];

    // Low stock alerts
    for (const warehouse of dataManager.warehouses) {
      const stock = Object.values(warehouse.currentStock).reduce((a, b) => a + b, 0);
      if (stock < (warehouse.capacity * 0.15)) {
        alerts.push({
          id: 'ALERT-' + Math.random().toString(36).substring(7),
          severity: 'critical',
          type: 'LOW_STOCK',
          title: 'Critical Stock Level',
          message: `${warehouse.name} is running low on inventory`,
          warehouse: warehouse.id,
          action: 'Plan reorder immediately',
          timestamp: new Date().toISOString()
        });
      }
    }

    // High pending orders
    const pending = dataManager.orders.filter(o => o.status === 'pending');
    if (pending.length > 25) {
      alerts.push({
        id: 'ALERT-' + Math.random().toString(36).substring(7),
        severity: 'high',
        type: 'PENDING_ORDERS',
        title: 'Order Backlog',
        message: `${pending.length} orders waiting for allocation`,
        count: pending.length,
        action: 'Allocate pending orders',
        timestamp: new Date().toISOString()
      });
    }

    // Service level warning
    const serviceLevel = parseFloat(kpiTracker.getServiceLevel());
    if (serviceLevel < 90) {
      alerts.push({
        id: 'ALERT-' + Math.random().toString(36).substring(7),
        severity: 'high',
        type: 'SERVICE_LEVEL',
        title: 'Service Level Degradation',
        message: `Service level is ${serviceLevel.toFixed(1)}%, target is 95%`,
        value: serviceLevel,
        action: 'Review allocation strategy',
        timestamp: new Date().toISOString()
      });
    }

    return alerts;
  }

  return router;
};
