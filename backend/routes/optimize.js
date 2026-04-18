// Inventory Optimization Routes

const express = require('express');
const router = express.Router();
const {
  suggestInventoryDistribution,
  checkStockLevels,
  getInventoryHealthStatus,
  calculateSafetyStock,
  calculateReorderPoint,
  calculateEOQ
} = require('../modules/inventory');
const { calculateDemandStats } = require('../modules/forecasting');

module.exports = (dataManager, config) => {
  /**
   * Optimize inventory distribution across warehouses
   */
  router.post('/distribution', (req, res) => {
    const { totalStock = 100000, weights = { capacity: 0.4, demand: 0.6 } } = req.body;

    const suggestions = suggestInventoryDistribution(
      dataManager.warehouses,
      dataManager.customers,
      totalStock,
      weights
    );

    res.json({
      strategy: 'inventory distribution',
      totalStock,
      suggestions,
      generatedAt: new Date().toISOString()
    });
  });

  /**
   * Check stock levels and get reorder recommendations
   */
  router.post('/reorder', (req, res) => {
    const { warehouseId, demandForecast } = req.body;

    const warehouse = warehouseId ?
      dataManager.getWarehouse(warehouseId) :
      dataManager.warehouses[0];

    if (!warehouse) {
      return res.status(404).json({ error: 'Warehouse not found' });
    }

    const recommendations = checkStockLevels(warehouse, demandForecast || {}, config);

    res.json({
      warehouseId: warehouse.id,
      warehouseName: warehouse.name,
      recommendations,
      totalRecommendedOrders: recommendations.length,
      generatedAt: new Date().toISOString()
    });
  });

  /**
   * Get inventory health status
   */
  router.get('/health/:warehouseId', (req, res) => {
    const warehouse = dataManager.getWarehouse(req.params.warehouseId);
    if (!warehouse) {
      return res.status(404).json({ error: 'Warehouse not found' });
    }

    // Get forecast data for this warehouse's served customers
    const demandForecast = {};
    for (const customer of dataManager.customers) {
      const demand = dataManager.getDemandHistory(customer.id, 'Transmissions');
      if (demand && demand.length > 0) {
        demandForecast.Transmissions = demand.slice(-30);
      }
    }

    const health = getInventoryHealthStatus(warehouse, demandForecast, config);

    res.json(health);
  });

  /**
   * Calculate safety stock
   */
  router.post('/safety-stock', (req, res) => {
    const {
      stdDevDemand = 15,
      leadTimeDays = config.logistics.leadTimeDays,
      serviceLevel = config.logistics.safetyStockServiceLevel
    } = req.body;

    const safetyStock = calculateSafetyStock(stdDevDemand, leadTimeDays, serviceLevel);

    const reorderPoint = calculateReorderPoint(50, leadTimeDays, safetyStock); // avg demand = 50

    res.json({
      safetyStock,
      reorderPoint,
      leadTimeDays,
      serviceLevel: (serviceLevel * 100).toFixed(1) + '%',
      demandStdDev: stdDevDemand,
      calculation: {
        formula: 'Safety Stock = Z * σ * √(LT)',
        zScore: 1.645, // for 95%
        result: safetyStock
      }
    });
  });

  /**
   * Get products requiring urgent reorder
   */
  router.get('/urgent-reorders', (req, res) => {
    const urgentReorders = [];

    for (const warehouse of dataManager.warehouses) {
      for (const [productId, stock] of Object.entries(warehouse.currentStock)) {
        // Simple threshold: if stock < 5000, mark urgent
        if (stock < 5000) {
          urgentReorders.push({
            warehouseId: warehouse.id,
            warehouseName: warehouse.name,
            productId,
            currentStock: stock,
            recommendedReorderQty: 10000,
            priority: stock < 2000 ? 'critical' : 'high',
            estimatedLeadTime: '2 days'
          });
        }
      }
    }

    res.json({
      urgentReorders,
      totalUrgent: urgentReorders.length,
      generatedAt: new Date().toISOString()
    });
  });

  /**
   * Calculate EOQ (Economic Order Quantity)
   */
  router.post('/eoq', (req, res) => {
    const {
      annualDemand = 100000,
      orderingCost = config.inventory.orderingCostPerOrder,
      holdingCost = config.inventory.holdingCostPerUnitPerDay * 365
    } = req.body;

    const eoq = calculateEOQ(annualDemand, orderingCost, holdingCost);

    res.json({
      eoq,
      annualDemand,
      orderingCost,
      holdingCostPerYear: holdingCost,
      totalRelevantCost: (2 * Math.sqrt(annualDemand * orderingCost * holdingCost)).toFixed(2),
      ordersPerYear: Math.round(annualDemand / eoq),
      daysPerOrder: Math.round(365 / (annualDemand / eoq))
    });
  });

  return router;
};
