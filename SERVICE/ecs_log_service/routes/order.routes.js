const express = require('express');
const OrderController = require('../controller/order/OrderController');
const orderController = new OrderController();

const router = express.Router();

// C - Create API
router.post('/create/order', orderController.createOrder);
router.post('/create/item', orderController.createOrderItem);

// R - Read API
router.get('/list', orderController.getAllOrders);
router.get('/:id', orderController.getOrderById);

// U - Update API
router.patch('/:id', orderController.updateOrder);
router.patch('/item/:id', orderController.updateOrderItem);

// D - delete API
router.delete('/order/:id', orderController.deleteOrder);
router.delete('/item/:id', orderController.deleteOrderItem);

//update calculations in order item update api

router.post('/update/full/order/:id', orderController.updateFullOrder)

module.exports = router;