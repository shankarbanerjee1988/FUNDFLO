const { logger } = require('../../../config/logger');
const { sequelize } = require('../../../config/db/db');
const moment = require('moment');
const _ = require('lodash');
const { removeEmptyAndNullFields, getChangedValues } = require('../../utility/common');

// const OrderValidateService = require('../mapper/OrderValidate.service');

const OrderRepository = require('../../repository/orders/order.repository');

const OrderBusinessInfoService = require('./business-info.service');
const AdditionalInfoService = require('./additionl-info.service');
const OrderItemsService = require('./orderItems.service');
const OrderCalculationsService = require('./OrderCalculations.service');
const OrderItemCalculationService = require('./OrderItemCalculation.service');
const RecalculationsService = require('./recalculate/Recalculations.service');
const OrderValidateService = require('../validator/OrderValidate.service');

class OrderService {

	// #orderValidateService = new OrderValidateService();
	#orderBusinessInfoService = new OrderBusinessInfoService();
	#additionalInfoService = new AdditionalInfoService();
	#orderItemsService = new OrderItemsService();
	#orderCalculationsService = new OrderCalculationsService();
	#orderItemCalculationService = new OrderItemCalculationService();
	#recalculationsService = new RecalculationsService();
	#orderValidateService = new OrderValidateService();

	#orderRepository = new OrderRepository();

	_createOrder = async (requestBody) => {
		await this.#orderValidateService._validateOrder(requestBody);
		let createOrderTransaction = await sequelize.transaction();
		try {
			// let temporaryOrder = await this.createTemporaryOrder(requestBody, createOrderTransaction);
			let orderData = await this.createOrderData(requestBody, createOrderTransaction);
			let businessInfo = await this.#orderBusinessInfoService.createBusinessInfo(orderData,
				requestBody.orderBusinessInfo, createOrderTransaction);
			let additionalInfo = await this.#additionalInfoService.createAdditionalInfo(orderData,
				requestBody.additionalInfo, createOrderTransaction);
			let calculationsConfig = await this.#orderRepository.getAllCalculationConfig(orderData.enterpriseUuid);
			let createdItems = await this.#orderItemsService.createOrderItems(orderData, requestBody, calculationsConfig,
				createOrderTransaction);
			let orderCalculations = await this.#orderCalculationsService.processOrderCalculations(orderData,
				requestBody.orderCalculations, createOrderTransaction);
			logger.customInfo('OrderItemsService', 'createOrderItems', `order created successfully, recalc starts`);
			await this.#recalculationsService.prcoessRecalculations(orderData.id, createOrderTransaction);
			await createOrderTransaction.commit();
			return {
				orderData,
				businessInfo,
				additionalInfo,
				createdItems
			};
		} catch (error) {
			await createOrderTransaction.rollback();
			throw new Error(error);
		}
	}

	createOrderData = async (requestBody, createOrderTransaction) => {
		if (!requestBody) requestBody = {};
		let order = {
			...requestBody.order,
			"createdDate": moment().local(),
			"userName": "Rajat"
		};
		order = removeEmptyAndNullFields(order);
		logger.customInfo('OrderService', 'createOrderData', `creating order, createObj: ${JSON.stringify(order)}`);
		let orderData = await this.#orderRepository.createOrder(order, createOrderTransaction);
		logger.customInfo('OrderService', 'createOrderData', `order created successfully, 
			DB obj: ${JSON.stringify(orderData?.dataValues)}`);
		return orderData?.dataValues;
	}

	updateOrderData = async (id, requestBody, transaction) => {
		if (!requestBody) requestBody = {};
		let order = {
			...requestBody.order,
			"updatedDate": moment().local()
		};
		order = removeEmptyAndNullFields(order);
		let existingOrder = await this.#orderRepository.getOneOrderGeneric({ id: id }, transaction);
		existingOrder = existingOrder?.dataValues;
		if (!existingOrder) throw new Error('Invalid Order Uuid');
		let changes = getChangedValues(existingOrder, order);
		if (!changes || _.isEmpty(changes)) return existingOrder;
		logger.customInfo('OrderService', 'updateOrderData', `updating order, existing order 
			obj: ${JSON.stringify(existingOrder)}, new order obj: ${JSON.stringify(order)}, updateObj: ${JSON.stringify(changes)}`);
		let orderData = await this.#orderRepository.updateOrderGeneric({ id: id }, changes, transaction);
		if (orderData?.length > 1 && orderData[1]?.length > 0) {
			logger.customInfo('OrderService', 'updateOrderData', `order updated successfully, DB obj: ${JSON.stringify(orderData?.dataValues)}`);
			return orderData[1][0]?.dataValues;
		}
		return null
	}

	createTemporaryOrder = async (requestBody, createOrderTransaction) => {
		let createObj = {
			"enterpriseId": requestBody?.order?.enterpriseId,
			"enterpriseUuid": requestBody?.order?.enterpriseUuid,
			"sessionId": "",
			"userUuid": requestBody?.order?.userUuid,
			"userCode": "",
			"groupOrderHeaderDetails": "",
			"groupOrderFinanceDetails": "",
			"groupOrderOtherDetails": "",
		};
		logger.customInfo('OrderService', 'createTemporaryOrder', `creating temporary order, createObj: 
      ${JSON.stringify(createObj)}`);
		let data = await this.#orderRepository.createTemporaryOrder(createObj, createOrderTransaction);
		logger.customInfo('OrderService', 'createTemporaryOrder', `temporary order created successfully, 
      DB obj: ${JSON.stringify(data?.dataValues)}`);
		return data?.dataValues;
	}

	_createOrderItem = async (requestBody, transaction) => {
		try {
			let createOrderItemTransaction = transaction ?? await sequelize.transaction();
			let { orderItems, orderUuid } = requestBody;
			let orderData = await this.#orderRepository.getOneOrderGeneric({ id: orderUuid }, null);
			let calculationsConfig = await this.#orderRepository.getAllCalculationConfig(orderData.enterpriseUuid);
			let createdItems = await this.#orderItemsService.createOrderItems(orderData, requestBody, calculationsConfig,
				createOrderItemTransaction);
			if (!transaction) await this.#recalculationsService.prcoessRecalculations(orderData.id, createOrderItemTransaction);
			if (!transaction) await createOrderItemTransaction.commit();
			return createdItems;
		} catch (error) {
			if (!transaction) await createOrderItemTransaction.rollback();
			throw new Error(error);
		}


	}

	_getAllOrders = async (body) => {
		return await this.#orderRepository.getAllOrdersData(body);
	}

	_getOrderById = async (id, body) => {
		return await this.#orderRepository.getOneOrderDetailsById(id, body);
	}

	_updateOrder = async (id, body) => {
		return await this.#orderRepository.updateOrderGeneric({ id }, body, null);
	}

	_updateOrderItem = async (id, body, transaction) => {
		try {
			let updateOrderItemTransaction = transaction ?? await sequelize.transaction();
			let itemData = await this.#orderRepository.getOneOrderItemGeneric({ id }, updateOrderItemTransaction);
			let updatedItem = await this.#orderRepository.updateOrderItemGeneric({ id }, body, updateOrderItemTransaction);
			if (!transaction) await this.#recalculationsService.prcoessRecalculations(itemData.orderUuid, updateOrderItemTransaction);
			if (!transaction) await updateOrderItemTransaction.commit();
			if (updatedItem.length > 1 && updatedItem[1].length > 0) return updatedItem[1][0];
			return null;
		} catch (error) {
			if (!transaction) await updateOrderItemTransaction.rollback();
			throw new Error(error);
		}
	}

	_deleteOrder = async (id, body) => {
		let orderData = await this.#orderRepository.getOneOrderGeneric({ id: orderUuid }, null);
		if (!orderData) throw new Error('Order Not Found');
		return await this.#orderRepository.deleteOrderGeneric({ id }, null);
	}

	_updateFullOrder = async (id, requestBody) => {
		let updateOrderTransaction = await sequelize.transaction();
		try {
			let orderData = await this.updateOrderData(id, requestBody, updateOrderTransaction);
			let businessInfo = await this.#orderBusinessInfoService.updateBusinessInfo(orderData,
				requestBody.businessInfo, updateOrderTransaction);
			let additionalInfo = await this.#additionalInfoService.updateAdditionalInfo(orderData,
				requestBody.additionalInfo, updateOrderTransaction);
			let calculationsConfig = await this.#orderRepository.getAllCalculationConfig(orderData.enterpriseUuid);
			await this.deleteOrderRelatedObjs(requestBody, updateOrderTransaction);
			await this.#orderItemsService.upsertOrderItems(orderData, requestBody.orderItems, calculationsConfig,
				updateOrderTransaction);
			await this.#recalculationsService.prcoessRecalculations(orderData.id, updateOrderTransaction);
			await updateOrderTransaction.commit();
		} catch (error) {
			await updateOrderTransaction.rollback();
			throw new Error(error);
		}
	}

	deleteOrderRelatedObjs = async (requestBody, updateOrderTransaction) => {
		await this.#orderCalculationsService.deleteOrderCalculations(requestBody.deletedOrderCalculations,
			updateOrderTransaction);
		await this.#orderItemsService.deleteOrderItems(requestBody.deletedOrderItems, updateOrderTransaction);
		await this.#orderItemCalculationService.deleteOrderItemCalculations(requestBody.deletedOrderItemCalculations,
			updateOrderTransaction);
	}

}

module.exports = OrderService;