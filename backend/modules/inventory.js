// Inventory Optimization Module

/**
 * Calculate Economic Order Quantity (EOQ)
 * EOQ = √(2 * D * S / H)
 * D = annual demand, S = order cost, H = holding cost per unit per year
 */
function calculateEOQ(annualDemand, orderingCost, holdingCostPerUnit) {
  if (holdingCostPerUnit === 0) return annualDemand; // Avoid division by zero
  const eoq = Math.sqrt((2 * annualDemand * orderingCost) / holdingCostPerUnit);
  return Math.round(eoq);
}

/**
 * Calculate Reorder Point
 * ROP = (average daily demand * lead time) + safety stock
 */
function calculateReorderPoint(avgDailyDemand, leadTimeDays, safetyStock) {
  return Math.ceil(avgDailyDemand * leadTimeDays + safetyStock);
}

/**
 * Calculate Safety Stock based on service level
 * Safety Stock = Z * σ * √(LT)
 * Z = Z-score for service level
 * σ = standard deviation of demand
 * LT = lead time in days
 */
function calculateSafetyStock(stdDevDemand, leadTimeDays, serviceLevel = 0.95) {
  // Z-scores for common service levels
  const zScores = {
    0.90: 1.28,
    0.91: 1.35,
    0.92: 1.41,
    0.93: 1.48,
    0.94: 1.55,
    0.95: 1.645,
    0.96: 1.75,
    0.97: 1.88,
    0.98: 2.05,
    0.99: 2.33,
  };

  // Find closest Z-score
  let zScore = zScores[serviceLevel] || 1.645; // Default to 95%
  
  // If exact value not found, interpolate
  if (!zScores[serviceLevel]) {
    const levels = Object.keys(zScores).map(Number).sort((a, b) => a - b);
    for (let i = 0; i < levels.length - 1; i++) {
      if (serviceLevel > levels[i] && serviceLevel < levels[i + 1]) {
        const ratio = (serviceLevel - levels[i]) / (levels[i + 1] - levels[i]);
        zScore = zScores[levels[i]] + ratio * (zScores[levels[i + 1]] - zScores[levels[i]]);
        break;
      }
    }
  }

  return Math.round(zScore * stdDevDemand * Math.sqrt(leadTimeDays));
}

/**
 * Calculate minimum stock level (warning trigger)
 */
function calculateMinimumStock(reorderPoint, safetyStock) {
  // Minimum stock should be lower than reorder point
  return Math.ceil((reorderPoint + safetyStock) / 2);
}

/**
 * Suggest optimal inventory distribution across warehouses
 * Uses weighted allocation based on capacity and demand proximity
 */
function suggestInventoryDistribution(
  warehouses,
  customers,
  totalStock,
  weights = { capacity: 0.4, demand: 0.6 }
) {
  const suggestions = {};

  // Calculate total capacity weight
  let totalCapacityWeight = 0;
  const capacityWeights = {};

  for (const warehouse of warehouses) {
    capacityWeights[warehouse.id] = warehouse.capacity;
    totalCapacityWeight += warehouse.capacity;
  }

  // Calculate demand proximity weight (simplified - count nearby customers)
  const demandWeights = {};
  for (const warehouse of warehouses) {
    let proximityScore = 0;
    for (const customer of customers) {
      // Simple proximity: if customer is "closer" to this warehouse
      const distance = Math.sqrt(
        Math.pow(warehouse.location.lat - customer.location.lat, 2) +
        Math.pow(warehouse.location.lon - customer.location.lon, 2)
      );
      proximityScore += 1 / (1 + distance); // Inverse distance weighting
    }
    demandWeights[warehouse.id] = proximityScore;
  }

  // Normalize demand weights
  const maxDemandWeight = Math.max(...Object.values(demandWeights));
  for (const whId in demandWeights) {
    demandWeights[whId] = demandWeights[whId] / maxDemandWeight;
  }

  // Calculate final allocation
  let totalWeight = 0;
  const finalWeights = {};

  for (const warehouse of warehouses) {
    const whId = warehouse.id;
    const normalizedCapacity = capacityWeights[whId] / totalCapacityWeight;
    const weightedScore =
      normalizedCapacity * weights.capacity +
      demandWeights[whId] * weights.demand;
    
    finalWeights[whId] = weightedScore;
    totalWeight += weightedScore;
  }

  // Allocate stock
  for (const warehouse of warehouses) {
    const whId = warehouse.id;
    const allocation = Math.round((finalWeights[whId] / totalWeight) * totalStock);
    suggestions[whId] = {
      warehouseId: whId,
      warehouseName: warehouse.name,
      allocatedStock: allocation,
      capacityUtilization: ((allocation / warehouse.capacity) * 100).toFixed(2) + '%',
      currentStock: warehouse.currentStock,
      reorderNeeded: false
    };
  }

  return suggestions;
}

/**
 * Check stock levels and recommend orders
 */
function checkStockLevels(warehouse, demandForecast, config) {
  const recommendations = [];

  for (const [productId, forecast] of Object.entries(demandForecast)) {
    const currentStock = warehouse.currentStock[productId] || 0;
    const avgForecastedDemand = Math.round(forecast.reduce((a, b) => a + b, 0) / forecast.length);
    
    // Simple check: if stock < forecasted demand, recommend order
    if (currentStock < avgForecastedDemand) {
      const requiredQty = avgForecastedDemand - currentStock;
      const eoq = calculateEOQ(
        avgForecastedDemand * 365, // annualized
        config.inventory.orderingCostPerOrder,
        config.inventory.holdingCostPerUnitPerDay * 365
      );

      recommendations.push({
        warehouseId: warehouse.id,
        productId,
        currentStock,
        forecastedDemand: avgForecastedDemand,
        recommendedOrderQty: Math.max(requiredQty, eoq),
        eoq,
        priority: currentStock < requiredQty * 0.5 ? 'high' : 'medium'
      });
    }
  }

  return recommendations;
}

/**
 * Calculate holding cost for inventory
 */
function calculateHoldingCost(quantity, costPerUnitPerDay, days = 30) {
  return quantity * costPerUnitPerDay * days;
}

/**
 * Get inventory health status
 */
function getInventoryHealthStatus(warehouse, demandForecast, config) {
  const stats = {
    warehouseId: warehouse.id,
    warehouseName: warehouse.name,
    totalCapacity: warehouse.capacity,
    totalCurrentStock: Object.values(warehouse.currentStock).reduce((a, b) => a + b, 0),
    capacityUtilization: 0,
    stockHealth: {},
    warnings: []
  };

  stats.capacityUtilization = ((stats.totalCurrentStock / warehouse.capacity) * 100).toFixed(2);

  // Check each product
  for (const [productId, forecast] of Object.entries(demandForecast)) {
    const currentStock = warehouse.currentStock[productId] || 0;
    const avgDemand = Math.round(forecast.reduce((a, b) => a + b, 0) / forecast.length);
    const daysOfSupply = avgDemand > 0 ? (currentStock / avgDemand).toFixed(2) : 'N/A';

    stats.stockHealth[productId] = {
      currentStock,
      forecastedDemand: avgDemand,
      daysOfSupply,
      status: daysOfSupply < 3 ? 'critical' : daysOfSupply < 7 ? 'low' : 'healthy'
    };

    if (daysOfSupply < 3) {
      stats.warnings.push(`${productId}: Critical stock level (${daysOfSupply} days of supply)`);
    }
  }

  return stats;
}

module.exports = {
  calculateEOQ,
  calculateReorderPoint,
  calculateSafetyStock,
  calculateMinimumStock,
  suggestInventoryDistribution,
  checkStockLevels,
  calculateHoldingCost,
  getInventoryHealthStatus
};
