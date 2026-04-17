// Demand Forecasting Routes

const express = require('express');
const router = express.Router();
const { 
  movingAverageForecast, 
  linearRegressionForecast,
  seasonalForecast,
  ensembleForecast,
  calculateDemandStats
} = require('../modules/forecasting');

module.exports = (dataManager, config) => {
  /**
   * Get demand forecast
   */
  router.post('/', (req, res) => {
    const {
      customerId,
      warehouseId,
      productId,
      method = config.system.forecastMethod,
      days = config.system.planningHorizon
    } = req.body;

    let demandData = {};
    let forecastData = {};

    if (customerId && productId) {
      // Single product for specific customer
      const history = dataManager.getDemandHistory(customerId, productId);
      if (history && history.length > 0) {
        demandData[productId] = history;

        switch (method) {
          case 'linear':
            forecastData[productId] = linearRegressionForecast(history, days);
            break;
          case 'seasonal':
            forecastData[productId] = seasonalForecast(history, 7, days);
            break;
          case 'ensemble':
            forecastData[productId] = ensembleForecast(history, days);
            break;
          default:
            forecastData[productId] = movingAverageForecast(history, config.system.movingAverageWindow, days);
        }
      }
    } else if (customerId) {
      // All products for specific customer
      const customerDemand = dataManager.demandHistory[customerId] || {};
      for (const [pId, history] of Object.entries(customerDemand)) {
        if (history && history.length > 0) {
          demandData[pId] = history;

          switch (method) {
            case 'linear':
              forecastData[pId] = linearRegressionForecast(history, days);
              break;
            case 'seasonal':
              forecastData[pId] = seasonalForecast(history, 7, days);
              break;
            case 'ensemble':
              forecastData[pId] = ensembleForecast(history, days);
              break;
            default:
              forecastData[pId] = movingAverageForecast(history, config.system.movingAverageWindow, days);
          }
        }
      }
    } else {
      // All customers
      for (const [cId, products] of Object.entries(dataManager.demandHistory)) {
        for (const [pId, history] of Object.entries(products)) {
          if (!forecastData[cId]) forecastData[cId] = {};
          if (history && history.length > 0) {
            switch (method) {
              case 'linear':
                forecastData[cId][pId] = linearRegressionForecast(history, days);
                break;
              case 'seasonal':
                forecastData[cId][pId] = seasonalForecast(history, 7, days);
                break;
              case 'ensemble':
                forecastData[cId][pId] = ensembleForecast(history, days);
                break;
              default:
                forecastData[cId][pId] = movingAverageForecast(history, config.system.movingAverageWindow, days);
            }
          }
        }
      }
    }

    res.json({
      method,
      forecastDays: days,
      historicalData: demandData,
      forecast: forecastData,
      generatedAt: new Date().toISOString()
    });
  });

  /**
   * Get demand statistics
   */
  router.post('/stats', (req, res) => {
    const { customerId, productId } = req.body;

    const history = customerId && productId ?
      dataManager.getDemandHistory(customerId, productId) : [];

    const stats = calculateDemandStats(history);

    res.json({
      customerId,
      productId,
      dataPoints: history.length,
      statistics: stats,
      forecast: {
        next7days: (stats.mean * 7).toFixed(0),
        next30days: (stats.mean * 30).toFixed(0),
        confidence: '±' + stats.stdDev.toFixed(0)
      }
    });
  });

  return router;
};
