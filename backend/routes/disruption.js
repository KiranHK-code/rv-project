// Disruption Handling Routes

const express = require('express');
const router = express.Router();
const {
  simulateWarehouseFailure,
  simulateShipmentDelay,
  simulateBlockedRoute,
  generateResilienceStrategy,
  getResilienceMetrics,
  generateRecoveryPlan
} = require('../modules/disruption');

module.exports = (dataManager, kpiTracker, config) => {
  /**
   * Simulate warehouse failure
   */
  router.post('/simulate/warehouse-failure', (req, res) => {
    const { warehouseId } = req.body;

    const disruption = simulateWarehouseFailure(
      warehouseId,
      dataManager.warehouses,
      config
    );

    if (!disruption.success) {
      return res.status(404).json(disruption);
    }

    // Find affected orders
    const affectedOrders = dataManager.orders.filter(o => o.assignedWarehouse === warehouseId);

    // Log disruption
    kpiTracker.recordDisruption('WAREHOUSE_FAILURE', affectedOrders.length, 4, 10000);

    // Generate strategy
    const strategy = generateResilienceStrategy(
      disruption,
      dataManager.orders,
      dataManager.warehouses,
      dataManager.customers,
      null
    );

    res.json({
      disruption,
      affectedOrders: affectedOrders.length,
      affectedOrderIds: affectedOrders.map(o => o.id),
      resilienceStrategy: strategy,
      timestamp: new Date().toISOString()
    });
  });

  /**
   * Simulate shipment delay
   */
  router.post('/simulate/shipment-delay', (req, res) => {
    const { orderId, delayHours = 24 } = req.body;

    const disruption = simulateShipmentDelay(orderId, delayHours, dataManager.orders);

    if (!disruption.success) {
      return res.status(404).json(disruption);
    }

    kpiTracker.recordDisruption('SHIPMENT_DELAY', 1, delayHours / 24, 500);

    const strategy = generateResilienceStrategy(disruption, [dataManager.getOrder(orderId)], dataManager.warehouses, null, null);

    res.json({
      disruption,
      resilienceStrategy: strategy,
      recommendations: [
        `Notify customer immediately about ${delayHours} hour delay`,
        `Offer expedited shipping option or discount`,
        `Monitor shipment tracking closely`,
        `Prepare fallback delivery date`
      ],
      timestamp: new Date().toISOString()
    });
  });

  /**
   * Simulate blocked route
   */
  router.post('/simulate/blocked-route', (req, res) => {
    const { orderId, reason = 'Weather/Traffic/Accident' } = req.body;

    const disruption = simulateBlockedRoute(
      orderId,
      reason,
      dataManager.orders,
      dataManager.warehouses,
      dataManager.customers,
      null
    );

    if (!disruption.success) {
      return res.status(404).json(disruption);
    }

    kpiTracker.recordDisruption('ROUTE_BLOCKED', 1, 1, 200);

    const strategy = generateResilienceStrategy(disruption, [dataManager.getOrder(orderId)], dataManager.warehouses, null, null);

    res.json({
      disruption,
      resilienceStrategy: strategy,
      alternativeRoutes: [
        { option: 1, distance: '+15 km', time: '+45 mins', cost: '+$75' },
        { option: 2, distance: '+8 km', time: '+25 mins', cost: '+$40' },
        { option: 3, suggestion: 'Reroute via different warehouse' }
      ],
      timestamp: new Date().toISOString()
    });
  });

  /**
   * Get resilience metrics
   */
  router.get('/metrics', (req, res) => {
    const metrics = getResilienceMetrics(dataManager.warehouses, config);

    res.json({
      resilience: metrics,
      timestamp: new Date().toISOString()
    });
  });

  /**
   * Simulate random disruption
   */
  router.post('/simulate/random', (req, res) => {
    const disruptionTypes = ['warehouse_failure', 'shipment_delay', 'blocked_route'];
    const randomType = disruptionTypes[Math.floor(Math.random() * disruptionTypes.length)];

    let result;

    switch (randomType) {
      case 'warehouse_failure': {
        const randomWh = dataManager.warehouses[Math.floor(Math.random() * dataManager.warehouses.length)];
        return res.redirect(`/disruption/simulate/warehouse-failure?warehouseId=${randomWh.id}`);
      }

      case 'shipment_delay': {
        const pendingOrders = dataManager.orders.filter(o => o.status === 'assigned');
        if (pendingOrders.length === 0) {
          return res.status(400).json({ error: 'No assigned orders to delay' });
        }
        const randomOrder = pendingOrders[Math.floor(Math.random() * pendingOrders.length)];
        const delayHours = 12 + Math.random() * 36;
        result = simulateShipmentDelay(randomOrder.id, delayHours, dataManager.orders);
        break;
      }

      case 'blocked_route': {
        const pendingOrders = dataManager.orders.filter(o => o.status === 'assigned');
        if (pendingOrders.length === 0) {
          return res.status(400).json({ error: 'No assigned orders with routes' });
        }
        const randomOrder = pendingOrders[Math.floor(Math.random() * pendingOrders.length)];
        result = simulateBlockedRoute(randomOrder.id, 'Weather/Traffic', dataManager.orders, dataManager.warehouses, dataManager.customers, null);
        break;
      }
    }

    res.json({
      disruptionType: randomType,
      result,
      timestamp: new Date().toISOString()
    });
  });

  /**
   * Get disruption history
   */
  router.get('/history', (req, res) => {
    const stats = kpiTracker.getDisruptionStats();

    res.json({
      summary: stats,
      timestamp: new Date().toISOString()
    });
  });

  /**
   * Generate recovery plan
   */
  router.post('/recovery-plan', (req, res) => {
    const { disruptionType, affectedOrderCount = 10 } = req.body;

    const disruption = {
      disruptionType,
      timestamp: new Date().toISOString()
    };

    const affectedOrders = dataManager.orders.slice(0, affectedOrderCount);
    const plan = generateRecoveryPlan(disruption, affectedOrders, dataManager.warehouses);

    res.json(plan);
  });

  return router;
};
