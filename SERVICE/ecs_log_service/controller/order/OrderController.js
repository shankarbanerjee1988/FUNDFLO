const { logger } = require('../../../config/logger');
const OrderService = require('../../sevices/order/OrderService');
const OrderItemsService = require('../../sevices/order/orderItems.service');

class OrderController {

	#orderService = new OrderService();
	#orderItemsService = new OrderItemsService();

	createOrder = async (request, response) => {
		try {
			logger.customInfo('OrderController', 'createOrder', `url: ${JSON.stringify(request.originalUrl)}, 
        		body: ${JSON.stringify(request.body)}, params: ${JSON.stringify(request.params)}`);
			let result = await this.#orderService._createOrder(request.body);
			return response.status(200).json({ message: "order created successfully", data: result })
		} catch (error) {
			logger.customError('OrderController', 'createOrder', error.message);
			return response.status(500).json({ message: 'error in creating the order', error: error?.message });
		}
	}

	createOrderItem = async (request, response) => {
		try {
			logger.customInfo('OrderController', 'createOrderItem', `url: ${JSON.stringify(request.originalUrl)}, 
        		body: ${JSON.stringify(request.body)}, params: ${JSON.stringify(request.params)}`);
			let result = await this.#orderService._createOrderItem(request.body);
			return response.status(200).json({ message: "order item created successfully", data: result })
		} catch (error) {
			logger.customError('OrderController', 'createOrderItem', error.message);
			return response.status(500).json({ message: 'error in creating the order item', error: error?.message });
		}
	}

	getAllOrders = async (request, response) => {
		try {
			logger.customInfo('OrderController', 'getAllOrders', `url: ${JSON.stringify(request.originalUrl)}, 
        		body: ${JSON.stringify(request.body)}, params: ${JSON.stringify(request.params)}`);
			let enterpriseUuid = "4661b758-461c-b67f-3b4a-28085a269f8d";
			let result = await this.#orderService._getAllOrders({ enterpriseUuid });
			return response.status(200).json({ message: "orders fetched successfully", data: result })
		} catch (error) {
			logger.customError('OrderController', 'getAllOrders', error.message);
			return response.status(500).json({ message: 'error in fetching the orders', error: error?.message });
		}
	}

	getOrderById = async (request, response) => {
		try {
			logger.customInfo('OrderController', 'getOrderById', `url: ${JSON.stringify(request.originalUrl)}, 
        		body: ${JSON.stringify(request.body)}, params: ${JSON.stringify(request.params)}`);
			let { id } = request.params;
			let enterpriseUuid = "4661b758-461c-b67f-3b4a-28085a269f8d";
			let result = await this.#orderService._getOrderById(id, { enterpriseUuid });
			return response.status(200).json({ message: "orders fetched successfully", data: result })
		} catch (error) {
			logger.customError('OrderController', 'getOrderById', error.message);
			return response.status(500).json({ message: 'error in fetching the orders', error: error?.message });
		}
	}

	updateOrder = async (request, response) => {
		try {
			logger.customInfo('OrderController', 'updateOrder', `url: ${JSON.stringify(request.originalUrl)}, 
        		body: ${JSON.stringify(request.body)}, params: ${JSON.stringify(request.params)}`);
			let { id } = request.params;
			let result = await this.#orderService._updateOrder(id, request.body);
			return response.status(200).json({ message: "order updating successfully", data: result })
		} catch (error) {
			logger.customError('OrderController', 'updateOrder', error.message);
			return response.status(500).json({ message: 'error in updating the order', error: error?.message });
		}
	}

	updateOrderItem = async (request, response) => {
		try {
			logger.customInfo('OrderController', 'updateOrderItem', `url: ${JSON.stringify(request.originalUrl)}, 
        		body: ${JSON.stringify(request.body)}, params: ${JSON.stringify(request.params)}`);
			let { id } = request.params;
			let result = await this.#orderService._updateOrderItem(id, request.body);
			return response.status(200).json({ message: "order item updating successfully", data: result })
		} catch (error) {
			logger.customError('OrderController', 'updateOrderItem', error.message);
			return response.status(500).json({ message: 'error in updating the order item', error: error?.message });
		}
	}

	deleteOrder = async (request, response) => {
		try {
			logger.customInfo('OrderController', 'deleteOrder', `url: ${JSON.stringify(request.originalUrl)}, 
        		body: ${JSON.stringify(request.body)}, params: ${JSON.stringify(request.params)}`);
			let { id } = request.params;
			let result = await this.#orderItemsService._deleteOrder(id, request.body);
			return response.status(200).json({ message: "order deleted successfully", data: result })
		} catch (error) {
			logger.customError('OrderController', 'deleteOrder', error.message);
			return response.status(500).json({ message: 'error in deleting the order', error: error?.message });
		}
	}

	deleteOrderItem = async (request, response) => {
		try {
			logger.customInfo('OrderController', 'deleteOrderItem', `url: ${JSON.stringify(request.originalUrl)}, 
        		body: ${JSON.stringify(request.body)}, params: ${JSON.stringify(request.params)}`);
			let { id } = request.params;
			let result = await this.#orderService._deleteOrderItem(id, request.body);
			return response.status(200).json({ message: "order item deleted successfully", data: result })
		} catch (error) {
			logger.customError('OrderController', 'deleteOrderItem', error.message);
			return response.status(500).json({ message: 'error in deleting the order item', error: error?.message });
		}
	}

	updateFullOrder = async (request, response) => {
		try {
			logger.customInfo('OrderController', 'updateFullOrder', `url: ${JSON.stringify(request.originalUrl)}, 
        		body: ${JSON.stringify(request.body)}, params: ${JSON.stringify(request.params)}`);
			let { id } = request.params;
			let result = await this.#orderService._updateFullOrder(id, request.body);
			return response.status(200).json({ message: "order updated successfully", data: result })
		} catch (error) {
			logger.customError('OrderController', 'updateFullOrder', error.message);
			return response.status(500).json({ message: 'error in updating the order', error: error?.message });
		}
	}

}

module.exports = OrderController;