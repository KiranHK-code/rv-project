// AI-Powered Insights Routes using Gemini

const express = require('express');
const router = express.Router();

module.exports = (dataManager, geminiAI) => {
  /**
   * Get AI forecast insights
   */
  router.post('/forecast-insights', async (req, res) => {
    try {
      const { customerId, productId } = req.body;

      if (!customerId || !productId) {
        return res.status(400).json({
          error: 'Missing customerId or productId'
        });
      }

      const demandHistory = await dataManager.getDemandHistory(customerId, productId);
      const customer = await dataManager.getCustomer(customerId);

      // If no demand history, return mock AI insights for demo
      if (!demandHistory || demandHistory.length === 0) {
        const mockInsights = await geminiAI.generateForecastInsights(
          [100, 105, 110, 95, 120, 115, 108, 102, 98, 110, 112, 105],
          {
            customer: customer?.name || 'Demo Customer',
            productId,
            averageDemand: 107,
            maxDemand: 120,
            minDemand: 95
          }
        );
        return res.json({
          success: true,
          data: mockInsights,
          timestamp: new Date().toISOString(),
          note: 'Using demo data - no historical demand found for this customer'
        });
      }

      const insights = await geminiAI.generateForecastInsights(
        demandHistory.slice(-30),
        {
          customer: customer?.name,
          productId,
          averageDemand: demandHistory.reduce((a, b) => a + b, 0) / demandHistory.length,
          maxDemand: Math.max(...demandHistory),
          minDemand: Math.min(...demandHistory)
        }
      );

      res.json({
        success: true,
        data: insights,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error getting forecast insights:', error);
      res.status(500).json({ error: error.message });
    }
  });

  /**
   * Get supply chain insights
   */
  router.get('/supply-chain-insights', async (req, res) => {
    try {
      const stats = await dataManager.getStatistics();
      const warehouses = await dataManager.getWarehouses();
      const customers = await dataManager.getCustomers();
      const orders = await dataManager.getOrders();

      const dashboardData = {
        warehouses: warehouses.length,
        customers: customers.length,
        totalOrders: orders.length,
        pendingOrders: orders.filter(o => o.status === 'pending').length,
        deliveredOrders: orders.filter(o => o.status === 'delivered').length,
        totalCapacity: warehouses.reduce((sum, w) => sum + w.capacity, 0),
        usedCapacity: Object.values(stats.totalStock || {}).reduce((a, b) => a + b, 0)
      };

      const insights = await geminiAI.generateSupplyChainInsights(dashboardData);

      res.json({
        success: true,
        data: insights,
        summary: dashboardData
      });
    } catch (error) {
      console.error('Error getting supply chain insights:', error);
      res.status(500).json({ error: error.message });
    }
  });

  /**
   * Detect demand anomalies
   */
  router.post('/detect-anomalies', async (req, res) => {
    try {
      const { customerId, productId } = req.body;

      if (!customerId || !productId) {
        return res.status(400).json({
          error: 'Missing customerId or productId'
        });
      }

      const demandHistory = await dataManager.getDemandHistory(customerId, productId);

      // If no demand history, return mock anomaly detection for demo
      if (!demandHistory || demandHistory.length === 0) {
        const mockAnomalies = await geminiAI.detectAnomalies(
          [100, 105, 110, 95, 120, 115, 108, 102, 98, 110, 112, 105],
          [105, 108, 110]
        );
        return res.json({
          success: true,
          data: mockAnomalies,
          timestamp: new Date().toISOString(),
          note: 'Using demo data - no historical demand found for this customer'
        });
      }

      const anomalies = await geminiAI.detectAnomalies(
        demandHistory,
        demandHistory.slice(-7)
      );

      res.json({
        success: true,
        data: anomalies,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error detecting anomalies:', error);
      res.status(500).json({ error: error.message });
    }
  });

  /**
   * Optimize allocation with AI
   */
  router.post('/optimize-allocation', async (req, res) => {
    try {
      const orders = await dataManager.getOrders({ status: 'pending' });
      const warehouses = await dataManager.getWarehouses();
      const stats = await dataManager.getStatistics();

      const optimization = await geminiAI.optimizeAllocation(
        orders,
        warehouses,
        stats
      );

      res.json({
        success: true,
        data: optimization,
        ordersAnalyzed: orders.length
      });
    } catch (error) {
      console.error('Error optimizing allocation:', error);
      res.status(500).json({ error: error.message });
    }
  });

  return router;
};
