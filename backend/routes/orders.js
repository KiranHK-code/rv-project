// Order Management Routes

const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');

module.exports = (dataManager, kpiTracker, distanceMatrix, config) => {
  const isValidLocation = (location) => {
    return (
      location &&
      typeof location.lat === 'number' &&
      Number.isFinite(location.lat) &&
      typeof location.lon === 'number' &&
      Number.isFinite(location.lon)
    );
  };

  /**
   * Create new order
   */
  router.post('/', async (req, res) => {
    try {
      const { customerId, productId, quantity, requiredDate, userLocation, userLocationName } = req.body;

      if (!customerId || !productId || !quantity || !requiredDate) {
        return res.status(400).json({
          error: 'Missing required fields: customerId, productId, quantity, requiredDate'
        });
      }

      const customer = await dataManager.getCustomer(customerId);
      if (!customer) {
        return res.status(404).json({
          error: 'Customer not found'
        });
      }

      const order = {
        id: 'ORD-' + uuidv4().substring(0, 8).toUpperCase(),
        customerId,
        customerLocation: customer.location,
        userLocation: isValidLocation(userLocation) ? userLocation : null,
        userLocationName: typeof userLocationName === 'string' ? userLocationName.trim() : '',
        productId,
        quantity,
        orderedDate: new Date().toISOString(),
        requiredDate,
        status: 'pending',
        assignedWarehouse: null,
        route: null,
        disruptions: []
      };

      await dataManager.addOrder(order);

      res.status(201).json({
        success: true,
        message: 'Order created successfully',
        order
      });
    } catch (error) {
      console.error('Error creating order:', error);
      res.status(500).json({ error: error.message });
    }
  });

  /**
   * Get all orders
   */
  router.get('/', async (req, res) => {
    try {
      const status = req.query.status;
      
      const filter = status ? { status } : {};
      const orders = await dataManager.getOrders(filter);

      res.json({
        total: orders.length,
        orders
      });
    } catch (error) {
      console.error('Error fetching orders:', error);
      res.status(500).json({ error: error.message });
    }
  });

  /**
   * Get order by ID
   */
  router.get('/:id', async (req, res) => {
    try {
      const order = await dataManager.getOrder(req.params.id);
      if (!order) {
        return res.status(404).json({ error: 'Order not found' });
      }
      res.json(order);
    } catch (error) {
      console.error('Error fetching order:', error);
      res.status(500).json({ error: error.message });
    }
  });

  /**
   * Update order status
   */
  router.patch('/:id', async (req, res) => {
    try {
      const { status, assignedWarehouse, cost } = req.body;
      const order = await dataManager.getOrder(req.params.id);

      if (!order) {
        return res.status(404).json({ error: 'Order not found' });
      }

      await dataManager.updateOrderStatus(req.params.id, status, assignedWarehouse, cost);
      const updated = await dataManager.getOrder(req.params.id);

      res.json({
        success: true,
        message: 'Order updated successfully',
        order: updated
      });
    } catch (error) {
      console.error('Error updating order:', error);
      res.status(500).json({ error: error.message });
    }
  });

  /**
   * Search orders
   */
  router.get('/search/:query', async (req, res) => {
    try {
      const { customerId, warehouseId, status } = req.query;
      const filter = {};

      if (customerId) filter.customerId = customerId;
      if (warehouseId) filter.assignedWarehouse = warehouseId;
      if (status) filter.status = status;

      const filtered = await dataManager.getOrders(filter);

      res.json({
        total: filtered.length,
        orders: filtered
      });
    } catch (error) {
      console.error('Error searching orders:', error);
      res.status(500).json({ error: error.message });
    }
  });

  return router;
};
