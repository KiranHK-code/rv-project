const {
  calculateDistance,
  calculateShippingCost,
  calculateCO2Emissions,
  calculateDeliveryTime,
  calculateDeliveryDate
} = require('../utils/distance');
const { ensembleForecast } = require('./forecasting');

function aggregateDemandHistories(histories = []) {
  const validHistories = histories.filter((history) => Array.isArray(history) && history.length > 0);
  const maxLength = validHistories.reduce((max, history) => Math.max(max, history.length), 0);

  if (maxLength === 0) {
    return [];
  }

  return Array.from({ length: maxLength }, (_, index) =>
    validHistories.reduce((sum, history) => sum + (history[index] || 0), 0)
  );
}

function inferDelayCause(reason, delayHours, distance) {
  const normalizedReason = (reason || '').toLowerCase();

  if (normalizedReason.includes('traffic')) {
    return {
      category: 'Traffic Congestion',
      description: 'Urban congestion or highway bottlenecks are slowing the shipment.',
      confidence: 'high'
    };
  }

  if (normalizedReason.includes('weather')) {
    return {
      category: 'Weather Disruption',
      description: 'Weather conditions are increasing travel time and route volatility.',
      confidence: 'high'
    };
  }

  if (normalizedReason.includes('accident') || normalizedReason.includes('blocked')) {
    return {
      category: 'Route Obstruction',
      description: 'An incident has blocked the primary corridor and requires rerouting.',
      confidence: 'high'
    };
  }

  if (delayHours >= 36) {
    return {
      category: 'Carrier Capacity Issue',
      description: 'The delay is long enough to suggest a carrier backlog or vehicle issue.',
      confidence: 'medium'
    };
  }

  if (distance > 350) {
    return {
      category: 'Linehaul Delay',
      description: 'Long-haul transit is likely pushing the order past its planned arrival window.',
      confidence: 'medium'
    };
  }

  return {
    category: 'Operational Delay',
    description: 'The shipment is running behind its plan due to normal operational variability.',
    confidence: 'medium'
  };
}

function buildRoutePlan(warehouse, customer, scenario = 'normal') {
  if (!warehouse?.location || !customer?.location) {
    return {
      recommendedRoute: null,
      alternativeRoutes: []
    };
  }

  const directDistance = calculateDistance(
    warehouse.location.lat,
    warehouse.location.lon,
    customer.location.lat,
    customer.location.lon
  );

  const templates = [
    {
      id: 'shortest',
      label: 'Shortest Route',
      reason: 'Direct corridor with the lowest distance.',
      distanceFactor: 1,
      timeFactor: scenario === 'blocked_route' ? 1.18 : 1,
      costFactor: 1,
      resilience: 'medium'
    },
    {
      id: 'traffic_aware',
      label: 'Traffic-Aware Route',
      reason: 'Avoids likely congestion and incident-prone segments.',
      distanceFactor: 1.08,
      timeFactor: scenario === 'blocked_route' ? 0.92 : 1.04,
      costFactor: 1.05,
      resilience: 'high'
    },
    {
      id: 'resilient',
      label: 'Best Backup Route',
      reason: 'Keeps additional contingency even if the main corridor worsens.',
      distanceFactor: 1.15,
      timeFactor: scenario === 'weather' ? 1.08 : 1.12,
      costFactor: 1.12,
      resilience: 'high'
    }
  ];

  const alternativeRoutes = templates.map((template) => {
    const distance = directDistance * template.distanceFactor;
    const deliveryHours = calculateDeliveryTime(distance) * template.timeFactor;
    const cost = calculateShippingCost(distance) * template.costFactor;

    return {
      id: template.id,
      label: template.label,
      distance: Number(distance.toFixed(2)),
      deliveryHours: Number(deliveryHours.toFixed(2)),
      deliveryDays: Math.ceil(deliveryHours / 24),
      cost: Number(cost.toFixed(2)),
      co2Emissions: Number(calculateCO2Emissions(distance).toFixed(2)),
      resilience: template.resilience,
      reason: template.reason,
      googleMapsUrl: `https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(
        `${warehouse.location.lat},${warehouse.location.lon}`
      )}&destination=${encodeURIComponent(`${customer.location.lat},${customer.location.lon}`)}&travelmode=driving`,
      embedMapUrl: `https://www.google.com/maps?q=${encodeURIComponent(
        `${customer.location.lat},${customer.location.lon}`
      )}&z=12&output=embed`
    };
  });

  const recommendedRoute = [...alternativeRoutes].sort((a, b) => {
    const scoreA = a.deliveryHours * 0.6 + a.cost * 0.25 - (a.resilience === 'high' ? 5 : 0);
    const scoreB = b.deliveryHours * 0.6 + b.cost * 0.25 - (b.resilience === 'high' ? 5 : 0);
    return scoreA - scoreB;
  })[0];

  return {
    recommendedRoute,
    alternativeRoutes
  };
}

function evaluateStockRisk({ warehouse, productId, demandHistories, extraDelayHours = 0 }) {
  const currentStock = warehouse?.currentStock?.[productId] || 0;
  const aggregateHistory = aggregateDemandHistories(demandHistories);
  const recentWindow = aggregateHistory.slice(-14);
  const forecast = recentWindow.length > 0 ? ensembleForecast(recentWindow, 7) : Array(7).fill(0);
  const avgDailyDemand = forecast.length > 0
    ? forecast.reduce((sum, value) => sum + value, 0) / forecast.length
    : 0;

  const projectedDemand3Days = avgDailyDemand * 3;
  const projectedDemandUntilDelayResolves = avgDailyDemand * (extraDelayHours / 24);
  const projectedStockAfterDelay = currentStock - projectedDemandUntilDelayResolves;
  const daysOfCover = avgDailyDemand > 0 ? currentStock / avgDailyDemand : Number.POSITIVE_INFINITY;
  const stockoutBeforeRecovery = avgDailyDemand > 0 && daysOfCover * 24 < extraDelayHours;

  let severity = 'low';
  if (stockoutBeforeRecovery || projectedStockAfterDelay < avgDailyDemand) {
    severity = 'critical';
  } else if (daysOfCover < 5) {
    severity = 'high';
  } else if (daysOfCover < 10) {
    severity = 'warning';
  }

  return {
    currentStock,
    avgDailyDemand: Number(avgDailyDemand.toFixed(2)),
    projectedDemand3Days: Number(projectedDemand3Days.toFixed(2)),
    projectedDemandUntilDelayResolves: Number(projectedDemandUntilDelayResolves.toFixed(2)),
    projectedStockAfterDelay: Number(projectedStockAfterDelay.toFixed(2)),
    daysOfCover: Number.isFinite(daysOfCover) ? Number(daysOfCover.toFixed(2)) : null,
    stockoutBeforeRecovery,
    severity
  };
}

function buildPredictiveSummary({ order, cause, routePlan, stockRisk, delayHours }) {
  const messages = [];
  const actions = [];
  let riskLevel = 'low';

  if (delayHours >= 24) {
    messages.push(`Order ${order.id} is likely to miss its expected service window by ${delayHours} hours.`);
    actions.push('Notify the customer about the revised ETA immediately.');
    riskLevel = 'high';
  }

  if (stockRisk.stockoutBeforeRecovery) {
    messages.push(`Warehouse stock for ${order.productId} is projected to run out before the delay clears.`);
    actions.push('Escalate replenishment or shift demand to another warehouse.');
    riskLevel = 'critical';
  } else if (stockRisk.severity === 'high' || stockRisk.severity === 'warning') {
    messages.push(`Current stock cover is only ${stockRisk.daysOfCover} days for ${order.productId}.`);
    actions.push('Monitor stock cover and reserve inventory for high-priority orders.');
    if (riskLevel === 'low') {
      riskLevel = 'warning';
    }
  }

  if (routePlan?.recommendedRoute) {
    messages.push(
      `${routePlan.recommendedRoute.label} is the best current route at ${routePlan.recommendedRoute.deliveryHours} hours and ${routePlan.recommendedRoute.distance} km.`
    );
    actions.push('Switch the driver manifest to the recommended route.');
  }

  messages.push(`${cause.category}: ${cause.description}`);

  return {
    riskLevel,
    summary: messages.join(' '),
    actions: Array.from(new Set(actions)),
    aiSignals: {
      delayHours,
      stockSeverity: stockRisk.severity,
      causeConfidence: cause.confidence
    }
  };
}

function calculateExpectedDelivery(order, deliveryHours) {
  const orderedDate = order.orderedDate || new Date().toISOString();
  return calculateDeliveryDate(orderedDate, deliveryHours).toISOString();
}

module.exports = {
  aggregateDemandHistories,
  inferDelayCause,
  buildRoutePlan,
  evaluateStockRisk,
  buildPredictiveSummary,
  calculateExpectedDelivery
};
