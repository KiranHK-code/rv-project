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
const {
  aggregateDemandHistories,
  inferDelayCause,
  buildRoutePlan,
  evaluateStockRisk,
  buildPredictiveSummary,
  calculateExpectedDelivery
} = require('../modules/disruptionInsights');

module.exports = (dataManager, kpiTracker, distanceMatrix, config, geminiAI) => {
  const getOrderContext = async (orderId) => {
    const [order, warehouses, customers] = await Promise.all([
      dataManager.getOrder(orderId),
      dataManager.getWarehouses(),
      dataManager.getCustomers()
    ]);

    if (!order) {
      return { error: 'Order not found' };
    }

    const customer = customers.find((item) => item.id === order.customerId) || null;
    const warehouse =
      warehouses.find((item) => item.id === order.assignedWarehouse) ||
      warehouses.find((item) => (item.currentStock?.[order.productId] || 0) >= order.quantity) ||
      null;

    return { order, warehouses, customers, customer, warehouse };
  };

  const buildDisruptionAnalysis = async ({ order, warehouse, customer, customers, delayHours, reason, scenario }) => {
    const demandHistories = await Promise.all(
      customers.map((item) => dataManager.getDemandHistory(item.id, order.productId))
    );

    const aggregateHistory = aggregateDemandHistories(demandHistories);
    const routePlan = buildRoutePlan(warehouse, customer, scenario);
    const cause = inferDelayCause(reason, delayHours, routePlan.recommendedRoute?.distance || order.route?.distance || 0);
    const stockRisk = evaluateStockRisk({
      warehouse,
      productId: order.productId,
      demandHistories,
      extraDelayHours: delayHours
    });
    const predictiveAnalysis = buildPredictiveSummary({
      order,
      cause,
      routePlan,
      stockRisk,
      delayHours
    });

    let aiPrediction = null;
    if (geminiAI && aggregateHistory.length > 0) {
      try {
        aiPrediction = await geminiAI.generateForecastInsights(aggregateHistory.slice(-30), {
          orderId: order.id,
          productId: order.productId,
          warehouse: warehouse?.name,
          delayHours,
          stockDaysOfCover: stockRisk.daysOfCover
        });
      } catch (error) {
        aiPrediction = { error: error.message };
      }
    }

    return {
      cause,
      recommendedRoute: routePlan.recommendedRoute,
      alternativeRoutes: routePlan.alternativeRoutes,
      stockRisk,
      predictiveAnalysis,
      aiPrediction,
      expectedDeliveryDate:
        order.route?.expectedDeliveryDate ||
        calculateExpectedDelivery(order, order.route?.deliveryHours || routePlan.recommendedRoute?.deliveryHours || 0)
    };
  };

  const saveDisruption = async (order, disruption, analysis) => {
    const disruptions = [
      ...(order.disruptions || []),
      {
        ...disruption,
        analysis,
        loggedAt: new Date().toISOString()
      }
    ];

    await dataManager.updateOrderStatus(order.id, order.status, { disruptions });
  };
  /**
   * Simulate warehouse failure
   */
  router.post('/simulate/warehouse-failure', async (req, res) => {
    const { warehouseId } = req.body;
    const warehouses = await dataManager.getWarehouses();
    const orders = await dataManager.getOrders();
    const customers = await dataManager.getCustomers();

    const disruption = simulateWarehouseFailure(
      warehouseId,
      warehouses,
      config
    );

    if (!disruption.success) {
      return res.status(404).json(disruption);
    }

    // Find affected orders
    const affectedOrders = orders.filter(o => o.assignedWarehouse === warehouseId);

    // Log disruption
    kpiTracker.recordDisruption('WAREHOUSE_FAILURE', affectedOrders.length, 4, 10000);

    // Generate strategy
    const strategy = generateResilienceStrategy(
      disruption,
      orders,
      warehouses,
      customers,
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
  router.post('/simulate/shipment-delay', async (req, res) => {
    const { orderId, delayHours = 24, reason = 'Traffic congestion' } = req.body;
    const context = await getOrderContext(orderId);

    if (context.error) {
      return res.status(404).json({ success: false, error: context.error });
    }

    const { order, warehouses, customers, customer, warehouse } = context;
    const disruption = simulateShipmentDelay(orderId, delayHours, [order]);

    if (!disruption.success) {
      return res.status(404).json(disruption);
    }

    kpiTracker.recordDisruption('SHIPMENT_DELAY', 1, delayHours / 24, 500);

    const analysis = await buildDisruptionAnalysis({
      order,
      warehouse,
      customer,
      customers,
      delayHours,
      reason,
      scenario: 'shipment_delay'
    });
    const strategy = generateResilienceStrategy(disruption, [order], warehouses, customers, distanceMatrix);
    await saveDisruption(order, disruption, analysis);

    res.json({
      disruption,
      analysis,
      resilienceStrategy: strategy,
      recommendations: [
        `Notify customer immediately about the ${delayHours} hour delay`,
        `Shift to ${analysis.recommendedRoute?.label || 'the best available route'} to reduce lateness`,
        analysis.stockRisk.stockoutBeforeRecovery
          ? 'Escalate replenishment because stock may run out before recovery'
          : 'Monitor warehouse stock cover while the shipment is delayed',
        'Review driver and carrier status for additional bottlenecks'
      ],
      timestamp: new Date().toISOString()
    });
  });

  /**
   * Simulate blocked route
   */
  router.post('/simulate/blocked-route', async (req, res) => {
    const { orderId, reason = 'Weather/Traffic/Accident', delayHours = 12 } = req.body;
    const context = await getOrderContext(orderId);

    if (context.error) {
      return res.status(404).json({ success: false, error: context.error });
    }

    const { order, warehouses, customers, customer, warehouse } = context;

    const disruption = simulateBlockedRoute(
      orderId,
      reason,
      [order],
      warehouses,
      customers,
      distanceMatrix
    );

    if (!disruption.success) {
      return res.status(404).json(disruption);
    }

    kpiTracker.recordDisruption('ROUTE_BLOCKED', 1, 1, 200);

    const analysis = await buildDisruptionAnalysis({
      order,
      warehouse,
      customer,
      customers,
      delayHours,
      reason,
      scenario: 'blocked_route'
    });
    const strategy = generateResilienceStrategy(disruption, [order], warehouses, customers, distanceMatrix);
    await saveDisruption(order, disruption, analysis);

    res.json({
      disruption,
      analysis,
      resilienceStrategy: strategy,
      alternativeRoutes: analysis.alternativeRoutes,
      timestamp: new Date().toISOString()
    });
  });

  /**
   * Get resilience metrics
   */
  router.get('/metrics', async (req, res) => {
    const warehouses = await dataManager.getWarehouses();
    const metrics = getResilienceMetrics(warehouses, config);

    res.json({
      resilience: metrics,
      timestamp: new Date().toISOString()
    });
  });

  /**
   * Simulate random disruption
   */
  router.post('/simulate/random', async (req, res) => {
    const disruptionTypes = ['warehouse_failure', 'shipment_delay', 'blocked_route'];
    const randomType = disruptionTypes[Math.floor(Math.random() * disruptionTypes.length)];

    let result;

    switch (randomType) {
      case 'warehouse_failure': {
        const warehouses = await dataManager.getWarehouses();
        const randomWh = warehouses[Math.floor(Math.random() * warehouses.length)];
        const disruption = simulateWarehouseFailure(randomWh.id, warehouses, config);
        return res.json({
          disruptionType: randomType,
          result: disruption,
          timestamp: new Date().toISOString()
        });
      }

      case 'shipment_delay': {
        const orders = await dataManager.getOrders({ status: 'assigned' });
        const pendingOrders = orders.filter(o => o.status === 'assigned');
        if (pendingOrders.length === 0) {
          return res.status(400).json({ error: 'No assigned orders to delay' });
        }
        const randomOrder = pendingOrders[Math.floor(Math.random() * pendingOrders.length)];
        const delayHours = 12 + Math.random() * 36;
        result = simulateShipmentDelay(randomOrder.id, delayHours, [randomOrder]);
        break;
      }

      case 'blocked_route': {
        const orders = await dataManager.getOrders({ status: 'assigned' });
        const pendingOrders = orders.filter(o => o.status === 'assigned');
        if (pendingOrders.length === 0) {
          return res.status(400).json({ error: 'No assigned orders with routes' });
        }
        const randomOrder = pendingOrders[Math.floor(Math.random() * pendingOrders.length)];
        const warehouses = await dataManager.getWarehouses();
        const customers = await dataManager.getCustomers();
        result = simulateBlockedRoute(randomOrder.id, 'Weather/Traffic', [randomOrder], warehouses, customers, distanceMatrix);
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
  router.get('/history', async (req, res) => {
    const stats = kpiTracker.getDisruptionStats();
    const orders = await dataManager.getOrders();
    const recent = orders
      .filter((order) => Array.isArray(order.disruptions) && order.disruptions.length > 0)
      .flatMap((order) => order.disruptions.map((disruption) => ({ orderId: order.id, ...disruption })))
      .slice(-10)
      .reverse();

    res.json({
      summary: stats,
      recent,
      timestamp: new Date().toISOString()
    });
  });

  /**
   * Generate recovery plan
   */
  router.post('/recovery-plan', async (req, res) => {
    const { disruptionType, affectedOrderCount = 10 } = req.body;

    const disruption = {
      disruptionType,
      timestamp: new Date().toISOString()
    };

    const [orders, warehouses] = await Promise.all([
      dataManager.getOrders(),
      dataManager.getWarehouses()
    ]);
    const affectedOrders = orders.slice(0, affectedOrderCount);
    const plan = generateRecoveryPlan(disruption, affectedOrders, warehouses);

    res.json(plan);
  });

  return router;
};
