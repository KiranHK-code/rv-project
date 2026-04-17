// Order Management Routes

const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');

module.exports = (dataManager, kpiTracker, distanceMatrix, config) => {
  /**
   * Create new order
   */
  router.post('/', (req, res) => {
    const { customerId, productId, quantity, requiredDate } = req.body;

    if (!customerId || !productId || !quantity || !requiredDate) {
      return res.status(400).json({
        error: 'Missing required fields: customerId, productId, quantity, requiredDate'
      });
    }

    const order = {
      id: 'ORD-' + uuidv4().substring(0, 8).toUpperCase(),
      customerId,
      productId,
      quantity,
      orderedDate: new Date().toISOString(),
      requiredDate,
      status: 'pending',
      assignedWarehouse: null,
      route: null,
      disruptions: []
    };

    dataManager.addOrder(order);

    res.status(201).json({
      success: true,
      message: 'Order created successfully',
      order
    });
  });

  /**
   * Get all orders
   */
  router.get('/', (req, res) => {
    const status = req.query.status;
    let orders = dataManager.orders;

    if (status) {
      orders = orders.filter(o => o.status === status);
    }

    res.json({
      total: orders.length,
      orders
    });
  });

  /**
   * Get order by ID
   */
  router.get('/:id', (req, res) => {
    const order = dataManager.getOrder(req.params.id);
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }
    res.json(order);
  });

  /**
   * Update order status
   */
  router.patch('/:id', (req, res) => {
    const { status, assignedWarehouse, route } = req.body;
    const order = dataManager.getOrder(req.params.id);

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    const updated = dataManager.updateOrderStatus(req.params.id, status, {
      assignedWarehouse,
      route,
      updatedAt: new Date().toISOString()
    });

    res.json({
      success: true,
      message: 'Order updated successfully',
      order: updated
    });
  });

  /**
   * Search orders
   */
  router.get('/search', (req, res) => {
    const { customerId, warehouseId, status } = req.query;
    let filtered = dataManager.orders;

    if (customerId) {
      filtered = filtered.filter(o => o.customerId === customerId);
    }
    if (warehouseId) {
      filtered = filtered.filter(o => o.assignedWarehouse === warehouseId);
    }
    if (status) {
      filtered = filtered.filter(o => o.status === status);
    }

    res.json({
      total: filtered.length,
      orders: filtered
    });
  });

  return router;
};
