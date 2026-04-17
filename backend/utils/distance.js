// Utility functions for distance calculation and cost recovery

/**
 * Haversine formula: Calculate distance between two lat/lon points
 * Returns distance in kilometers
 */
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Earth's radius in km
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRad(deg) {
  return deg * (Math.PI / 180);
}

/**
 * Calculate shipping cost between two locations
 * Cost = distance * fuel_cost_per_km + labor_cost
 */
function calculateShippingCost(distance, fuelCostPerKm = 0.5, laborCostPerHour = 25, avgSpeedKmPerHour = 60) {
  const fuelCost = distance * fuelCostPerKm;
  const hoursRequired = distance / avgSpeedKmPerHour;
  const laborCost = hoursRequired * laborCostPerHour;
  return fuelCost + laborCost;
}

/**
 * Calculate CO2 emissions for shipping
 */
function calculateCO2Emissions(distance, co2PerKm = 0.12) {
  return distance * co2PerKm;
}

/**
 * Calculate delivery time in hours
 */
function calculateDeliveryTime(distance, avgSpeedKmPerHour = 60) {
  return distance / avgSpeedKmPerHour;
}

/**
 * Calculate estimated delivery date
 */
function calculateDeliveryDate(orderedDate, deliveryHours) {
  const date = new Date(orderedDate);
  date.setHours(date.getHours() + deliveryHours);
  return date;
}

/**
 * Calculate distance matrix between all warehouses and customers
 */
function buildDistanceMatrix(warehouses, customers) {
  const matrix = {};
  
  for (const warehouse of warehouses) {
    matrix[warehouse.id] = {};
    for (const customer of customers) {
      const distance = calculateDistance(
        warehouse.location.lat,
        warehouse.location.lon,
        customer.location.lat,
        customer.location.lon
      );
      matrix[warehouse.id][customer.id] = distance;
    }
  }
  
  return matrix;
}

/**
 * Calculate warehouse score for order allocation
 * Score = α * distance_score + β * stock_score + γ * cost_score
 */
function calculateWarehouseScore(
  warehouse,
  customer,
  requiredQuantity,
  distanceMatrix,
  weights = { distance: 0.3, stock: 0.5, cost: 0.2 }
) {
  // Distance score (0-1, higher is better)
  const distance = distanceMatrix[warehouse.id][customer.id];
  const maxDistance = 5000; // km
  const distanceScore = Math.max(0, 1 - (distance / maxDistance));

  // Stock availability score (0-1)
  const availableStock = warehouse.currentStock[Object.keys(warehouse.currentStock)[0]] || 0; // Simplified
  const stockScore = Math.min(1, availableStock / requiredQuantity);

  // Cost score (0-1, lower is better)
  const shippingCost = calculateShippingCost(distance);
  const maxCost = 5000; // $
  const costScore = Math.max(0, 1 - (shippingCost / maxCost));

  // Weighted score
  const score = 
    weights.distance * distanceScore +
    weights.stock * stockScore +
    weights.cost * costScore;

  return {
    score,
    distance,
    distanceScore,
    stockScore,
    costScore,
    shippingCost
  };
}

module.exports = {
  calculateDistance,
  calculateShippingCost,
  calculateCO2Emissions,
  calculateDeliveryTime,
  calculateDeliveryDate,
  buildDistanceMatrix,
  calculateWarehouseScore
};
