// KPI Tracker - monitors and calculates key performance indicators

class KPITracker {
  constructor() {
    this.metrics = {
      deliveryTime: [],
      cost: [],
      serviceLevel: [],
      co2Emissions: [],
      warehouseUtilization: [],
      stockouts: [],
      disruptions: []
    };
    this.period = {
      startDate: new Date(),
      endDate: null
    };
  }

  /**
   * Record delivery metrics
   */
  recordDelivery(order, allocation, actualDeliveryDate) {
    const requiredDate = new Date(order.requiredDate);
    const actualDate = new Date(actualDeliveryDate);
    
    const deliveryTime = Math.ceil((actualDate - new Date(order.orderedDate)) / (1000 * 60 * 60 * 24));
    const isOnTime = actualDate <= requiredDate;

    this.metrics.deliveryTime.push({
      orderId: order.id,
      planedDays: Math.ceil((requiredDate - new Date(order.orderedDate)) / (1000 * 60 * 60 * 24)),
      actualDays: deliveryTime,
      isOnTime,
      delay: isOnTime ? 0 : Math.ceil((actualDate - requiredDate) / (1000 * 60 * 60 * 24)),
      cost: allocation?.route?.cost || 0,
      co2: allocation?.route?.co2Emissions || 0,
      timestamp: new Date()
    });

    return {
      deliveryTime,
      isOnTime,
      cost: allocation?.route?.cost || 0,
      co2: allocation?.route?.co2Emissions || 0
    };
  }

  /**
   * Calculate average delivery time (ADT)
   */
  getAverageDeliveryTime() {
    if (this.metrics.deliveryTime.length === 0) return 0;
    const sum = this.metrics.deliveryTime.reduce((acc, d) => acc + d.actualDays, 0);
    return (sum / this.metrics.deliveryTime.length).toFixed(2);
  }

  /**
   * Calculate service level (% on-time delivery)
   */
  getServiceLevel() {
    if (this.metrics.deliveryTime.length === 0) return 0;
    const onTime = this.metrics.deliveryTime.filter(d => d.isOnTime).length;
    return ((onTime / this.metrics.deliveryTime.length) * 100).toFixed(2);
  }

  /**
   * Calculate average cost per delivery
   */
  getAverageCostPerDelivery() {
    if (this.metrics.deliveryTime.length === 0) return 0;
    const sum = this.metrics.deliveryTime.reduce((acc, d) => acc + d.cost, 0);
    return (sum / this.metrics.deliveryTime.length).toFixed(2);
  }

  /**
   * Calculate total cost
   */
  getTotalCost() {
    return this.metrics.deliveryTime.reduce((acc, d) => acc + d.cost, 0).toFixed(2);
  }

  /**
   * Calculate carbon footprint (kg CO2)
   */
  getTotalCO2Emissions() {
    return this.metrics.deliveryTime.reduce((acc, d) => acc + d.co2, 0).toFixed(2);
  }

  /**
   * Calculate cost per unit CO2
   */
  getCostPerCO2() {
    const totalCost = parseFloat(this.getTotalCost());
    const totalCO2 = parseFloat(this.getTotalCO2Emissions());
    
    if (totalCO2 === 0) return 0;
    return (totalCost / totalCO2).toFixed(2);
  }

  /**
   * Get warehouse utilization
   */
  recordWarehouseUtilization(warehouseId, utilized, capacity) {
    this.metrics.warehouseUtilization.push({
      warehouseId,
      utilized,
      capacity,
      utilizationPercent: ((utilized / capacity) * 100).toFixed(2),
      timestamp: new Date()
    });
  }

  /**
   * Get average warehouse utilization
   */
  getAverageWarehouseUtilization() {
    if (this.metrics.warehouseUtilization.length === 0) return 0;
    const sum = this.metrics.warehouseUtilization.reduce(
      (acc, w) => acc + parseFloat(w.utilizationPercent), 0
    );
    return (sum / this.metrics.warehouseUtilization.length).toFixed(2);
  }

  /**
   * Record disruption
   */
  recordDisruption(disruptionType, affectedOrders, recoveryTime, costImpact) {
    this.metrics.disruptions.push({
      type: disruptionType,
      affectedOrders,
      recoveryTime,
      costImpact,
      timestamp: new Date()
    });
  }

  /**
   * Get disruption stats
   */
  getDisruptionStats() {
    const total = this.metrics.disruptions.length;
    if (total === 0) {
      return {
        totalDisruptions: 0,
        averageRecoveryTime: 0,
        totalCostImpact: 0,
        byType: {}
      };
    }

    const byType = {};
    let maxRecoveryTime = 0;
    let totalCost = 0;

    for (const disruption of this.metrics.disruptions) {
      if (!byType[disruption.type]) {
        byType[disruption.type] = 0;
      }
      byType[disruption.type]++;
      maxRecoveryTime = Math.max(maxRecoveryTime, disruption.recoveryTime || 0);
      totalCost += (disruption.costImpact || 0);
    }

    return {
      totalDisruptions: total,
      averageRecoveryTime: (maxRecoveryTime).toFixed(2),
      totalCostImpact: totalCost.toFixed(2),
      byType
    };
  }

  /**
   * Get comprehensive dashboard metrics
   */
  getDashboardMetrics(warehouses = [], orders = []) {
    const totalStock = warehouses.reduce((sum, w) => {
      return sum + Object.values(w.currentStock).reduce((a, b) => a + b, 0);
    }, 0);

    const totalCapacity = warehouses.reduce((sum, w) => sum + w.capacity, 0);

    return {
      timeRange: {
        start: this.period.startDate.toISOString(),
        end: this.period.endDate ? this.period.endDate.toISOString() : new Date().toISOString()
      },
      deviations: {
        averageDeliveryTime: {
          value: this.getAverageDeliveryTime(),
          unit: 'days',
          target: 3,
          status: parseFloat(this.getAverageDeliveryTime()) <= 3 ? 'good' : 'warning'
        },
        serviceLevel: {
          value: this.getServiceLevel(),
          unit: '%',
          target: 95,
          status: parseFloat(this.getServiceLevel()) >= 95 ? 'good' : 'warning'
        },
        averageCost: {
          value: this.getAverageCostPerDelivery(),
          unit: '$',
          target: 500,
          status: parseFloat(this.getAverageCostPerDelivery()) <= 500 ? 'good' : 'warning'
        },
        co2Emissions: {
          value: this.getTotalCO2Emissions(),
          unit: 'kg',
          target: 'minimize',
          status: 'informational'
        }
      },
      inventory: {
        totalStock: totalStock,
        totalCapacity: totalCapacity,
        utilizationPercent: totalCapacity > 0 ? ((totalStock / totalCapacity) * 100).toFixed(2) : 0
      },
      orders: {
        total: orders.length,
        byStatus: {
          pending: orders.filter(o => o.status === 'pending').length,
          assigned: orders.filter(o => o.status === 'assigned').length,
          shipped: orders.filter(o => o.status === 'shipped').length,
          delivered: orders.filter(o => o.status === 'delivered').length,
          failed: orders.filter(o => o.status === 'failed').length
        }
      },
      disruptions: this.getDisruptionStats()
    };
  }

  /**
   * Reset metrics
   */
  resetMetrics() {
    this.metrics = {
      deliveryTime: [],
      cost: [],
      serviceLevel: [],
      co2Emissions: [],
      warehouseUtilization: [],
      stockouts: [],
      disruptions: []
    };
    this.period.startDate = new Date();
    this.period.endDate = null;
  }

  /**
   * Export metrics report
   */
  generateReport() {
    return {
      period: this.period,
      summary: {
        totalDeliveries: this.metrics.deliveryTime.length,
        averageDeliveryTime: this.getAverageDeliveryTime() + ' days',
        serviceLevel: this.getServiceLevel() + '%',
        averageCostPerDelivery: '$' + this.getAverageCostPerDelivery(),
        totalCo2Emissions: this.getTotalCO2Emissions() + ' kg',
        averageWarehouseUtilization: this.getAverageWarehouseUtilization() + '%'
      },
      disruptions: this.getDisruptionStats(),
      detailedMetrics: this.metrics
    };
  }
}

module.exports = KPITracker;
