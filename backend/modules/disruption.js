// Disruption and Resilience Handling Module

/**
 * Simulate warehouse failure
 * Mark warehouse as unavailable and log disruption
 */
function simulateWarehouseFailure(warehouseId, warehouses, config) {
  const warehouse = warehouses.find(w => w.id === warehouseId);
  if (!warehouse) {
    return { success: false, error: 'Warehouse not found' };
  }

  return {
    success: true,
    disruptionType: 'WAREHOUSE_FAILURE',
    timestamp: new Date().toISOString(),
    affectedWarehouse: {
      id: warehouse.id,
      name: warehouse.name,
      location: warehouse.location
    },
    estimatedRecoveryTime: '4-8 hours',
    impact: {
      stockAffected: Object.values(warehouse.currentStock).reduce((a, b) => a + b, 0),
      dailyCostImpact: warehouse.operationalCostPerDay
    },
    action: 'REROUTE_ORDERS'
  };
}

/**
 * Simulate delayed shipment
 */
function simulateShipmentDelay(orderId, delayHours, orders) {
  const order = orders.find(o => o.id === orderId);
  if (!order) {
    return { success: false, error: 'Order not found' };
  }

  const originalDeliveryDate = new Date(order.requiredDate);
  const delayedDeliveryDate = new Date(originalDeliveryDate);
  delayedDeliveryDate.setHours(delayedDeliveryDate.getHours() + delayHours);

  return {
    success: true,
    disruptionType: 'SHIPMENT_DELAY',
    timestamp: new Date().toISOString(),
    affectedOrder: orderId,
    delayHours,
    originalDeliveryDate: originalDeliveryDate.toISOString(),
    newDeliveryDate: delayedDeliveryDate.toISOString(),
    delayDays: Math.ceil(delayHours / 24),
    action: 'NOTIFY_CUSTOMER'
  };
}

/**
 * Simulate blocked route
 */
function simulateBlockedRoute(orderId, reason, orders, warehouses, customers, distanceMatrix) {
  const order = orders.find(o => o.id === orderId);
  if (!order) {
    return { success: false, error: 'Order not found' };
  }

  return {
    success: true,
    disruptionType: 'ROUTE_BLOCKED',
    timestamp: new Date().toISOString(),
    affectedOrder: orderId,
    reason: reason || 'Weather/Traffic/Accident',
    action: 'FIND_ALTERNATIVE_ROUTE',
    recommendations: ['Use alternate route +15km', 'Reroute through different warehouse', 'Expedited delivery option']
  };
}

/**
 * Generate resilience strategy
 */
function generateResilienceStrategy(disruption, orders, warehouses, customers, distanceMatrix) {
  const strategy = {
    disruption,
    strategies: []
  };

  switch (disruption.disruptionType) {
    case 'WAREHOUSE_FAILURE':
      strategy.strategies = [
        {
          priority: 1,
          name: 'REROUTE_TO_NEAREST',
          description: `Reroute all orders from failed warehouse to nearest alternative`,
          cost: 'Medium (additional shipping)',
          timeToImplement: '30-60 minutes'
        },
        {
          priority: 2,
          name: 'SPLIT_SHIPMENTS',
          description: `Split orders across multiple warehouses for quicker fulfillment`,
          cost: 'High (multiple shipments)',
          timeToImplement: '2-4 hours'
        },
        {
          priority: 3,
          name: 'QUEUE_ORDERS',
          description: `Queue orders until warehouse recovery (estimated 4-8 hours)`,
          cost: 'Low (delayed revenue)',
          timeToImplement: 'Immediate'
        }
      ];
      break;

    case 'SHIPMENT_DELAY':
      strategy.strategies = [
        {
          priority: 1,
          name: 'EXPEDITE_DELIVERY',
          description: `Use overnight/express shipping to minimize delay impact`,
          cost: 'High (+$50-200 per order)',
          timeToImplement: 'Immediate'
        },
        {
          priority: 2,
          name: 'PARTIAL_SHIPMENT',
          description: `Send available items immediately, rest in follow-up shipment`,
          cost: 'Medium (2 shipments)',
          timeToImplement: '2-4 hours'
        },
        {
          priority: 3,
          name: 'CUSTOMER_COMMUNICATION',
          description: `Inform customer and offer alternatives (discount, store pickup)`,
          cost: 'Low (customer goodwill)',
          timeToImplement: 'Immediate'
        }
      ];
      break;

    case 'ROUTE_BLOCKED':
      strategy.strategies = [
        {
          priority: 1,
          name: 'ALTERNATE_ROUTE',
          description: `Use GPS/routing service to find best alternate route`,
          cost: 'Low (+5-20 min delivery)',
          timeToImplement: 'Immediate'
        },
        {
          priority: 2,
          name: 'TRANSFER_SHIPMENT',
          description: `Transfer shipment to another vehicle/courier with different route`,
          cost: 'Medium (logistics coordination)',
          timeToImplement: '30-60 minutes'
        },
        {
          priority: 3,
          name: 'DELIVERY_POSTPONE',
          description: `Postpone delivery until route is cleared (24+ hours)`,
          cost: 'Low (delayed revenue)',
          timeToImplement: 'Immediate'
        }
      ];
      break;

    default:
      strategy.strategies = [
        {
          priority: 1,
          name: 'ASSESS_IMPACT',
          description: 'Evaluate impact on supply chain',
          cost: 'Low',
          timeToImplement: 'Immediate'
        }
      ];
  }

  return strategy;
}

/**
 * Get system resilience metrics
 */
function getResilienceMetrics(warehouses, config) {
  const metrics = {
    systemRedundancy: warehouses.length,
    averageWarehouseFailureRate: (
      warehouses.reduce((sum, w) => sum + w.failureRate, 0) / warehouses.length
    ).toFixed(4),
    networkCoverage: calculateNetworkCoverage(warehouses),
    riskAssessment: {
      singlePointOfFailure: warehouses.length <= 2,
      geographicRisks: getGeographicRisks(warehouses),
      capacityRisks: getCapacityRisks(warehouses)
    }
  };

  return metrics;
}

/**
 * Calculate geographic coverage
 */
function calculateNetworkCoverage(warehouses) {
  // Very simplified: count regions with warehouses
  const regions = new Set();
  const estimatedRadius = 800; // km

  // Estimate coverage based on warehouse locations
  let coverage = 0;
  // This could be more sophisticated using actual geographic data
  if (warehouses.length >= 3) coverage = 0.7;
  if (warehouses.length >= 5) coverage = 0.85;
  if (warehouses.length >= 8) coverage = 0.95;

  return (coverage * 100).toFixed(1) + '%';
}

/**
 * Identify geographic risks
 */
function getGeographicRisks(warehouses) {
  const risks = [];

  // Check if all warehouses are in same region (simplified)
  const avgLat = warehouses.reduce((sum, w) => sum + w.location.lat, 0) / warehouses.length;
  const avgLon = warehouses.reduce((sum, w) => sum + w.location.lon, 0) / warehouses.length;

  const maxDistance = warehouses.reduce((max, w) => {
    const dist = Math.sqrt(
      Math.pow(w.location.lat - avgLat, 2) + Math.pow(w.location.lon - avgLon, 2)
    );
    return Math.max(max, dist);
  }, 0);

  if (maxDistance < 5) {
    risks.push('HIGH: Warehouses clustered in same region - vulnerable to regional disruptions');
  } else if (maxDistance < 15) {
    risks.push('MEDIUM: Limited geographic diversity');
  } else {
    risks.push('LOW: Good geographic spread');
  }

  return risks;
}

/**
 * Identify capacity risks
 */
function getCapacityRisks(warehouses) {
  const risks = [];
  const totalCapacity = warehouses.reduce((sum, w) => sum + w.capacity, 0);
  const avgCapacity = totalCapacity / warehouses.length;

  warehouses.forEach(w => {
    if (w.capacity > avgCapacity * 1.5) {
      risks.push(`MEDIUM: Warehouse ${w.id} is too large (${w.capacity} units) - single point of failure`);
    }
  });

  // Check if any warehouse holds >30% of capacity
  warehouses.forEach(w => {
    const capacityPercent = (w.capacity / totalCapacity) * 100;
    if (capacityPercent > 30) {
      risks.push(`HIGH: Warehouse ${w.id} holds ${capacityPercent.toFixed(1)}% of total capacity`);
    }
  });

  return risks;
}

/**
 * Recovery plan for disruption
 */
function generateRecoveryPlan(disruption, affectedOrders, warehouses) {
  const plan = {
    disruption,
    executionPlan: [
      {
        phase: 1,
        name: 'IMMEDIATE_RESPONSE',
        timeframe: '0-15 minutes',
        actions: [
          'Activate incident response team',
          'Assess affected orders: ' + affectedOrders.length,
          'Notify affected customers',
          'Identify available alternatives'
        ]
      },
      {
        phase: 2,
        name: 'SHORT_TERM_MITIGATION',
        timeframe: '15-60 minutes',
        actions: [
          'Reroute/reallocate orders',
          'Arrange alternative shipping methods',
          'Monitor implement alternative strategies',
          'Track all changes in system'
        ]
      },
      {
        phase: 3,
        name: 'MEDIUM_TERM_RECOVERY',
        timeframe: '1-6 hours',
        actions: [
          'Begin recovery of primary system',
          'Complete delayed fulfillments',
          'Validate all orders in system',
          'Adjust inventory levels'
        ]
      },
      {
        phase: 4,
        name: 'POST_INCIDENT_REVIEW',
        timeframe: '24 hours',
        actions: [
          'Full system status check',
          'Customer impact analysis',
          'Financial impact determination',
          'Implement preventive measures'
        ]
      }
    ],
    estimatedImpact: {
      affectedOrders: affectedOrders.length,
      delayedOrders: affectedOrders.filter(o => o.status === 'pending').length,
      financialImpact: 'TBD'
    }
  };

  return plan;
}

module.exports = {
  simulateWarehouseFailure,
  simulateShipmentDelay,
  simulateBlockedRoute,
  generateResilienceStrategy,
  getResilienceMetrics,
  generateRecoveryPlan
};
