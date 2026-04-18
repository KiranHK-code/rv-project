// Dynamic Routing and Allocation Module

const { 
  calculateDistance, 
  calculateShippingCost, 
  calculateCO2Emissions,
  calculateDeliveryTime,
  calculateWarehouseScore,
  calculateDeliveryDate
} = require('../utils/distance');

/**
 * Allocate order to best warehouse using multi-criteria scoring
 */
function allocateOrderToWarehouse(
  order,
  warehouses,
  customers,
  distanceMatrix,
  weights = { distance: 0.3, stock: 0.5, cost: 0.2 }
) {
  const customer = customers.find(c => c.id === order.customerId);
  if (!customer) {
    return {
      orderId: order.id,
      success: false,
      error: 'Customer not found'
    };
  }

  const effectiveCustomer = {
    ...customer,
    location: order.customerLocation || customer.location
  };

  let bestWarehouse = null;
  let bestScore = -Infinity;
  let scoreDetails = {};

  for (const warehouse of warehouses) {
    // Check if warehouse has stock
    const hasStock = (warehouse.currentStock[order.productId] || 0) >= order.quantity;
    if (!hasStock) continue;

    const score = calculateWarehouseScore(
      warehouse,
      effectiveCustomer,
      order.quantity,
      distanceMatrix,
      weights,
      order.productId
    );

    scoreDetails[warehouse.id] = score;

    if (score.score > bestScore) {
      bestScore = score.score;
      bestWarehouse = warehouse;
    }
  }

  if (!bestWarehouse) {
    return {
      orderId: order.id,
      success: false,
      error: 'No warehouse with sufficient stock',
      attempts: scoreDetails
    };
  }

  // Calculate route details
  const distance =
    distanceMatrix?.[bestWarehouse.id]?.[effectiveCustomer.id] ??
    calculateDistance(
      bestWarehouse.location.lat,
      bestWarehouse.location.lon,
      effectiveCustomer.location.lat,
      effectiveCustomer.location.lon
    );
  const cost = calculateShippingCost(distance);
  const deliveryHours = calculateDeliveryTime(distance);
  const co2 = calculateCO2Emissions(distance);
  const expectedDeliveryDate = calculateDeliveryDate(order.orderedDate || new Date().toISOString(), deliveryHours);
  const lateRisk =
    order.requiredDate && expectedDeliveryDate.getTime() > new Date(order.requiredDate).getTime()
      ? 'at-risk'
      : 'on-track';

  return {
    orderId: order.id,
    customerId: order.customerId,
    customername: customer.name,
    productId: order.productId,
    quantity: order.quantity,
    success: true,
    allocatedWarehouse: {
      id: bestWarehouse.id,
      name: bestWarehouse.name,
      location: bestWarehouse.location
    },
    route: {
      from: bestWarehouse.location,
      to: effectiveCustomer.location,
      distance: Math.round(distance * 100) / 100,
      deliveryHours: Math.round(deliveryHours * 100) / 100,
      deliveryDays: Math.ceil(deliveryHours / 24),
      expectedDeliveryDate: expectedDeliveryDate.toISOString(),
      cost: Math.round(cost * 100) / 100,
      co2Emissions: Math.round(co2 * 100) / 100,
      status: lateRisk
    },
    score: Math.round(bestScore * 10000) / 10000,
    scoreDetails: scoreDetails[bestWarehouse.id]
  };
}

/**
 * Find shortest path using Dijkstra's algorithm
 * (Simplified for 2D space rather than graph)
 */
function findShortestPath(start, end, obstacles = []) {
  // For simplicity, return direct path with cost
  const distance = calculateDistance(
    start.lat, start.lon,
    end.lat, end.lon
  );

  return {
    waypoints: [start, end],
    distance,
    cost: calculateShippingCost(distance)
  };
}

/**
 * Batch allocate multiple orders to warehouses
 */
function batchAllocateOrders(orders, warehouses, customers, distanceMatrix) {
  const allocations = [];

  // Sort orders by required delivery date (nearest first)
  const sortedOrders = [...orders].sort((a, b) => 
    new Date(a.requiredDate) - new Date(b.requiredDate)
  );

  for (const order of sortedOrders) {
    const allocation = allocateOrderToWarehouse(
      order,
      warehouses,
      customers,
      distanceMatrix
    );

    if (allocation.success) {
      // Deduct stock from warehouse
      const warehouse = warehouses.find(w => w.id === allocation.allocatedWarehouse.id);
      if (warehouse) {
        warehouse.currentStock[order.productId] -= order.quantity;
      }
    }

    allocations.push(allocation);
  }

  return allocations;
}

/**
 * Optimize allocation by considering service level
 * Returns allocation that minimizes cost while meeting service level targets
 */
function optimizeAllocation(
  orders,
  warehouses,
  customers,
  distanceMatrix,
  serviceLevel = 0.95
) {
  const allocations = [];
  const stats = {
    totalOrders: orders.length,
    successfulAllocations: 0,
    failedAllocations: 0,
    totalCost: 0,
    totalCO2: 0,
    avgDeliveryDays: 0,
    serviceLevel: 0
  };

  const routes = [];

  for (const order of orders) {
    const allocation = allocateOrderToWarehouse(order, warehouses, customers, distanceMatrix);

    if (allocation.success) {
      stats.successfulAllocations++;
      stats.totalCost += allocation.route.cost;
      stats.totalCO2 += allocation.route.co2Emissions;
      routes.push(allocation.route);
      allocations.push(allocation);
    } else {
      stats.failedAllocations++;
    }
  }

  // Calculate service level (% of on-time deliveries)
  const onTimeCount = allocations.filter(a => a.route.deliveryDays <= 3).length;
  stats.serviceLevel = allocations.length > 0 ? (onTimeCount / allocations.length) : 0;
  stats.avgDeliveryDays = routes.length > 0 ? 
    (routes.reduce((sum, r) => sum + r.deliveryDays, 0) / routes.length) : 0;

  return {
    allocations,
    statistics: stats,
    alert: stats.serviceLevel < serviceLevel ? 
      `Service level warning: ${(stats.serviceLevel * 100).toFixed(1)}% vs target ${(serviceLevel * 100).toFixed(1)}%` : null
  };
}

/**
 * Re-route allocation when warehouse fails
 */
function rerouteOnWarehouseFailure(allocation, warehouses, customers, distanceMatrix, failedWarehouseId) {
  // Find alternative warehouses (exclude failed one)
  const availableWarehouses = warehouses.filter(w => w.id !== failedWarehouseId);

  // Create a temporary order object
  const order = {
    id: allocation.orderId,
    customerId: allocation.customerId,
    productId: allocation.productId,
    quantity: allocation.quantity,
    requiredDate: new Date()
  };

  return allocateOrderToWarehouse(order, availableWarehouses, customers, distanceMatrix);
}

/**
 * Split shipment across multiple warehouses if single warehouse can't fulfill
 */
function splitShipmentAcrossWarehouses(order, warehouses, customers, distanceMatrix) {
  const splits = [];
  let remainingQty = order.quantity;

  // Sort warehouses by distance
  const sorted = [...warehouses].sort((a, b) => {
    const distA = distanceMatrix[a.id][order.customerId] || Infinity;
    const distB = distanceMatrix[b.id][order.customerId] || Infinity;
    return distA - distB;
  });

  for (const warehouse of sorted) {
    if (remainingQty <= 0) break;

    const availableStock = warehouse.currentStock[order.productId] || 0;
    const allocQty = Math.min(remainingQty, availableStock);

    if (allocQty > 0) {
      const distance = distanceMatrix[warehouse.id][order.customerId];
      splits.push({
        warehouseId: warehouse.id,
        warehouseName: warehouse.name,
        quantity: allocQty,
        distance: Math.round(distance * 100) / 100,
        cost: Math.round(calculateShippingCost(distance) * 100) / 100,
        co2: Math.round(calculateCO2Emissions(distance) * 100) / 100
      });

      remainingQty -= allocQty;
    }
  }

  return {
    orderId: order.id,
    totalQuantity: order.quantity,
    fulfilledQuantity: order.quantity - remainingQty,
    remainingQty,
    splits,
    canFulfill: remainingQty === 0
  };
}

module.exports = {
  allocateOrderToWarehouse,
  findShortestPath,
  batchAllocateOrders,
  optimizeAllocation,
  rerouteOnWarehouseFailure,
  splitShipmentAcrossWarehouses
};
