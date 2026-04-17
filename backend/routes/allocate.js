// Order Allocation Routes

const express = require('express');
const router = express.Router();
const {
  allocateOrderToWarehouse,
  batchAllocateOrders,
  optimizeAllocation,
  rerouteOnWarehouseFailure,
  splitShipmentAcrossWarehouses
} = require('../modules/routing');

module.exports = (dataManager, kpiTracker, distanceMatrix, config) => {
  /**
   * Allocate single order to best warehouse
   */
  router.post('/single', (req, res) => {
    const { orderId } = req.body;

    const order = dataManager.getOrder(orderId);
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    const allocation = allocateOrderToWarehouse(
      order,
      dataManager.warehouses,
      dataManager.customers,
      distanceMatrix
    );

    if (allocation.success) {
      // Update order
      dataManager.updateOrderStatus(orderId, 'assigned', {
        assignedWarehouse: allocation.allocatedWarehouse.id,
        route: allocation.route
      });
    }

    res.json(allocation);
  });

  /**
   * Batch allocate multiple orders
   */
  router.post('/batch', (req, res) => {
    const { orderIds = [] } = req.body;

    const orders = orderIds.length > 0 ?
      dataManager.orders.filter(o => orderIds.includes(o.id)) :
      dataManager.orders.filter(o => o.status === 'pending');

    const allocations = batchAllocateOrders(
      orders,
      dataManager.warehouses,
      dataManager.customers,
      distanceMatrix
    );

    // Update allocated orders
    for (const allocation of allocations) {
      if (allocation.success) {
        dataManager.updateOrderStatus(allocation.orderId, 'assigned', {
          assignedWarehouse: allocation.allocatedWarehouse.id,
          route: allocation.route
        });
      }
    }

    res.json({
      totalOrders: orders.length,
      allocations,
      summary: {
        successful: allocations.filter(a => a.success).length,
        failed: allocations.filter(a => !a.success).length,
        totalCost: allocations
          .filter(a => a.success)
          .reduce((sum, a) => sum + a.route.cost, 0)
          .toFixed(2),
        totalCO2: allocations
          .filter(a => a.success)
          .reduce((sum, a) => sum + a.route.co2Emissions, 0)
          .toFixed(2)
      },
      timestamp: new Date().toISOString()
    });
  });

  /**
   * Optimize allocation for service level
   */
  router.post('/optimize', (req, res) => {
    const { serviceLevel = config.system.defaultServiceLevel } = req.body;

    const pendingOrders = dataManager.orders.filter(o => o.status === 'pending');

    const result = optimizeAllocation(
      pendingOrders,
      dataManager.warehouses,
      dataManager.customers,
      distanceMatrix,
      serviceLevel
    );

    // Update orders
    for (const allocation of result.allocations) {
      dataManager.updateOrderStatus(allocation.orderId, 'assigned', {
        assignedWarehouse: allocation.allocatedWarehouse.id,
        route: allocation.route
      });
    }

    res.json({
      optimizationTarget: `Service Level: ${(serviceLevel * 100).toFixed(1)}%`,
      results: result
    });
  });

  /**
   * Split shipment across warehouses
   */
  router.post('/split-shipment', (req, res) => {
    const { orderId } = req.body;

    const order = dataManager.getOrder(orderId);
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    const split = splitShipmentAcrossWarehouses(
      order,
      dataManager.warehouses,
      dataManager.customers,
      distanceMatrix
    );

    res.json({
      orderId: order.id,
      originalQuantity: order.quantity,
      split,
      recommendation: split.canFulfill ? 'Can fully fulfill' : 'Cannot fully fulfill - stock shortage'
    });
  });

  /**
   * Re-route on warehouse failure
   */
  router.post('/reroute', (req, res) => {
    const { orderId, failedWarehouseId } = req.body;

    const order = dataManager.getOrder(orderId);
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    const currentAllocation = {
      orderId: order.id,
      customerId: order.customerId,
      productId: order.productId,
      quantity: order.quantity
    };

    const newAllocation = rerouteOnWarehouseFailure(
      currentAllocation,
      dataManager.warehouses,
      dataManager.customers,
      distanceMatrix,
      failedWarehouseId
    );

    if (newAllocation.success) {
      dataManager.updateOrderStatus(orderId, 'assigned', {
        assignedWarehouse: newAllocation.allocatedWarehouse.id,
        route: newAllocation.route
      });
    }

    res.json({
      orderId,
      failedWarehouse: failedWarehouseId,
      originalAllocation: {
        warehouseId: order.assignedWarehouse,
        cost: order.route?.cost
      },
      newAllocation: {
        warehouseId: newAllocation.allocatedWarehouse?.id,
        cost: newAllocation.route?.cost,
        additionalCost: newAllocation.route ?
          (newAllocation.route.cost - order.route?.cost).toFixed(2) : 'N/A'
      },
      success: newAllocation.success
    });
  });

  /**
   * Get allocation statistics
   */
  router.get('/stats', (req, res) => {
    const assigned = dataManager.orders.filter(o => o.status === 'assigned');
    const totalCost = assigned.reduce((sum, o) => sum + (o.route?.cost || 0), 0);
    const totalCO2 = assigned.reduce((sum, o) => sum + (o.route?.co2Emissions || 0), 0);

    const byWarehouse = {};
    for (const order of assigned) {
      const whId = order.assignedWarehouse;
      if (!byWarehouse[whId]) {
        byWarehouse[whId] = { orders: 0, cost: 0, co2: 0 };
      }
      byWarehouse[whId].orders++;
      byWarehouse[whId].cost += order.route?.cost || 0;
      byWarehouse[whId].co2 += order.route?.co2Emissions || 0;
    }

    res.json({
      summary: {
        totalAssignedOrders: assigned.length,
        totalCost: totalCost.toFixed(2),
        totalCO2: totalCO2.toFixed(2),
        avgCostPerOrder: assigned.length > 0 ? (totalCost / assigned.length).toFixed(2) : 0
      },
      byWarehouse,
      timestamp: new Date().toISOString()
    });
  });

  return router;
};
