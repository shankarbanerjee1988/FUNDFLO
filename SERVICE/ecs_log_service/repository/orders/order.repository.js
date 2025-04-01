const Order = require('../../models/fundflo_oms/Order.model');
const BusinessInfo = require('../../models/fundflo_oms/OrderBusinessInfo.model');
const OrderAdditionalInfo = require('../../models/fundflo_oms/OrderAdditionalInfo.model');
const TemporaryOrder = require('../../models/fundflo_oms/TemporaryOrder.model');
const OrderItems = require('../../models/fundflo_oms/OrderItem.model');
const OrderItemProductDetails = require('../../models/fundflo_oms/OrderItemProductDetails.model');
const Material = require('../../models/fundflo_oms_inventory/Material.model');
const MaterialUniqueConfig = require('../../models/fundflo_oms_inventory/MaterialUniqueConfig.model');
const OrderItemCalculation = require('../../models/fundflo_oms/OrderItemCalculation.model');
const OrderCalculationConfig = require('../../models/fundflo_oms_config/OrderCalculation.model');
const { sequelize } = require('../../../config/db/db');


class OrderRepository {

	createOrder = async (createObj, transaction) => {
		return await Order.create(createObj, {
			returning: true,
			raw: true,
			...(transaction ? { transaction } : {})
		})
	}

	updateOrderGeneric = async (whereObj, updateObj, transaction) => {
		return await Order.update(updateObj, {
			where: whereObj,
			returning: true,
			...(transaction ? { transaction } : {})
		});
	}

	createBusinessInfo = async (createObj, transaction) => {
		return await BusinessInfo.create(createObj, {
			returning: true,
			raw: true,
			...(transaction ? { transaction } : {})
		});
	}

	createAdditionalInfo = async (createObj, transaction) => {
		return await OrderAdditionalInfo.create(createObj, {
			returning: true,
			raw: true,
			...(transaction ? { transaction } : {})
		})
	}

	createTemporaryOrder = async (createObj, transaction) => {
		return await TemporaryOrder.create(createObj, {
			returning: true,
			raw: true,
			...(transaction ? { transaction } : {})
		})
	}

	createOrderItemDB = async (createObj, transaction) => {
		return await OrderItems.create(createObj, {
			returning: true,
			raw: true,
			...(transaction ? { transaction } : {})
		})
	}

	getUniqueConstraint = async (enterpriseUuid) => {
		return await MaterialUniqueConfig.findAll({
			where: {
				enterpriseUuid: enterpriseUuid
			},
			raw: true
		})
	}

	getMaterials = async (whereObj, transaction) => {
		return await Material.findAndCountAll({
			where: whereObj,
			raw: true,
			...(transaction ? { transaction } : {})
		})
	}

	createItemProduct = async (createObj, transaction) => {
		return await OrderItemProductDetails.create(createObj, {
			returning: true,
			raw: true,
			...(transaction ? { transaction } : {})
		})
	}

	createOrderItemCalculation = async (createObj, transaction) => {
		return await OrderItemCalculation.create(createObj, {
			returning: true,
			raw: true,
			...(transaction ? { transaction } : {})
		})
	}

	getAllCalculationConfig = async (enterpriseUuid) => {
		return await OrderCalculationConfig.findAll({
			where: {
				enterpriseUuid: enterpriseUuid
			},
			raw: true,
			nest: true,
			order: [['seqNo', 'ASC']]
		})
	}


	getBusinessInfo = async (legalEntityCode, divisionCode, plantCode, salesGroupCode, salesOfficeCode, salesEmployeeCode,
		userCode, dcCode, segmentCode, warehouseCode, profitCenterCode, businessAreaCode, enterpriseUuid) => {
		let query = `
			select id as id, entity_code as code , entity_name as desc , 'legal_entity' as type
			from fundflo_admin.legal_entity le
			where enterprise_uuid = $enterpriseUuid and entity_code = $legalEntityCode

			union 

			select id as id, division_code as code, division_description as desc, 'division' as type
			from fundflo_admin.division 
			where enterprise_uuid = $enterpriseUuid and division_code = $divisionCode

			union 

			select id as id, plant_code as code, plant_description as desc, 'plant' as type
			from fundflo_admin.plant p 
			where enterprise_uuid = $enterpriseUuid and plant_code = $plantCode

			union 

			select id as id, sales_group_code as code , sales_group_description as desc , 'sales_group' as type
			from fundflo_admin.sales_group sg 
			where enterprise_uuid = $enterpriseUuid and sales_group_code = $salesGroupCode

			union 

			select id as id, sales_office_code as code , sales_office_description as desc , 'sales_office' as type
			from fundflo_admin.sales_office so
			where enterprise_uuid = $enterpriseUuid and sales_office_code = $salesOfficeCode

			union 

			select id as id, employee_code as code , employee_name as desc , 'sales_employee' as type
			from fundflo_temp.sales_employee se
			where enterprise_uuid = $enterpriseUuid and employee_code = $salesEmployeeCode and distributor_code = $userCode

			union 

			select id as id, dc_code as code , dc_desc as desc , 'dc' as type
			from fundflo_admin.distribution_channel dc
			where enterprise_uuid = $enterpriseUuid and dc_code = $dcCode

			union 

			select id as id, segment_code as code, segment_description as desc , 'segment' as type 
			from fundflo_admin.segment s 
			where segment_code = $segmentCode and enterprise_uuid = $enterpriseUuid

			union 

			select id as id, warehouse_code as code, warehouse_description as desc , 'warehouse' as type 
			from fundflo_admin.warehouse w 
			where warehouse_code = $warehouseCode and enterprise_uuid = $enterpriseUuid

			union 

			select id as id, profit_center_code as code, profit_center_description as desc,  'profit_center' as type  
			from fundflo_admin.profit_center pc 
			where profit_center_code = $profitCenterCode and enterprise_uuid = $enterpriseUuid

			union 

			select id as id, business_area_code as code, business_area_description as desc, 'business_area' as type  
			from fundflo_admin.business_area ba 
			where business_area_code = $businessAreaCode and enterprise_uuid = $enterpriseUuid
		`;
		let data = await sequelize.query(query, {
			bind: {
				legalEntityCode, divisionCode, plantCode, salesGroupCode, salesOfficeCode, salesEmployeeCode,
				userCode, dcCode, segmentCode, warehouseCode, profitCenterCode, businessAreaCode, enterpriseUuid
			}
		});
		return data[0];
	}


	getAllOrderItems = async (whereObj, transaction) => {
		let data = await OrderItems.findAll({
			where: whereObj,
			include: [
				{
					model: OrderItemCalculation,
					association: OrderItems.hasMany(OrderItemCalculation, { foreignKey: 'itemUuid', sourceKey: 'id' })
				}
			],
			...(transaction ? { transaction: transaction } : {}),
			raw: false,
			nest: true
		})
		data = JSON.stringify(data);
		return JSON.parse(data);
	};


	updateOrderItemGeneric = (whereObj, updateObj, transaction) => {
		if (!whereObj) throw new Error('where object cant be empty');
		return OrderItems.update(updateObj, {
			where: whereObj,
			returning: true,
			...(transaction ? { transaction: transaction } : {})
		});
	}

	updateOrderAdditionalInfo = async (whereObj, updateObj, transaction) => {
		if (!whereObj) throw new Error('where object cant be empty');
		return OrderAdditionalInfo.update(updateObj, {
			where: whereObj,
			returning: true,
			...(transaction ? { transaction: transaction } : {})
		});
	}

	getAllOrdersData = async (body) => {
		let data = await Order.findAndCountAll({
			where: {
				enterpriseUuid: body.enterpriseUuid
			},
			include: [
				{
					model: OrderAdditionalInfo,
					association: Order.hasOne(OrderAdditionalInfo, { foreignKey: 'orderUuid', sourceKey: 'id' })
				},
				{
					model: BusinessInfo,
					association: Order.hasOne(BusinessInfo, { foreignKey: 'orderUuid', sourceKey: 'id' })
				}
			]
		});
		data = JSON.stringify(data);
		return JSON.parse(data);
	}

	getOneOrderDetailsById = async (id, body) => {
		let data = await Order.findOne({
			where: {
				id: id,
				enterpriseUuid: body.enterpriseUuid
			},
			include: [
				{
					model: OrderAdditionalInfo,
					association: Order.hasOne(OrderAdditionalInfo, { foreignKey: 'orderUuid', sourceKey: 'id' })
				},
				{
					model: BusinessInfo,
					association: Order.hasOne(BusinessInfo, { foreignKey: 'orderUuid', sourceKey: 'id' })
				},
				{
					model: OrderItems,
					association: Order.hasMany(OrderItems, { foreignKey: 'orderUuid', sourceKey: 'id' }),
					include: [
						{
							model: OrderItemCalculation,
							association: OrderItems.hasMany(OrderItemCalculation, { foreignKey: 'itemUuid', sourceKey: 'id' })
						}
					]
				},
			]
		});
		data = JSON.stringify(data);
		return JSON.parse(data);
	}

	deleteOrderItemGeneric = async (whereObj, transaction) => {
		return await OrderItems.destroy({
			where: whereObj,
			returning: true,
			...(transaction ? { transaction } : {})
		})
	}

	getOneOrderGeneric = async (whereObj, transaction) => {
		return await Order.findOne({
			where: whereObj,
			...(transaction ? { transaction } : {})
		})
	}

	destroyOrderItemCalculationsGeneric = async (whereObj, transaction) => {
		return await OrderItemCalculation.destroy({
			where: whereObj,
			returning: true,
			...(transaction ? { transaction } : {})
		})
	}

	getAllOrderItemCalculations = async (whereObj, transaction) => {
		return await OrderItemCalculation.findAll({
			where: whereObj,
			raw: true,
			...(transaction ? { transaction } : {})
		})
	}

	getOneOrderItemGeneric = async (whereObj, transaction) => {
		return await OrderItems.findOne({
			where: whereObj,
			...(transaction ? { transaction } : {})
		})
	}

	deleteOrderGeneric = async (id, transaction) => {
		return await Order.destroy({
			where: {
				id: id
			},
			returning: true,
			...(transaction ? { transaction } : {})
		})
	}

	updateBusinessInfoGeneric = async (whereObj, updateObj, transaction) => {
		if (!whereObj) throw new Error('where object cant be empty');
		return await BusinessInfo.update(updateObj, {
			where: whereObj,
			returning: true,
			...(transaction ? { transaction } : {})
		});
	}

	getBusinessInfoGeneric = async (whereObj, transaction) => {
		return await BusinessInfo.findOne({
			where: whereObj,
			raw: true,
			...(transaction ? { transaction } : {})
		});
	}

	getOneOrderAdditionInfoGeneric = async (whereObj, transaction) => {
		return await OrderAdditionalInfo.findOne({
			where: whereObj,
			raw: true,
			...(transaction ? { transaction } : {})
		});
	}

	getOneOrderItemCalculationGeneric = async (whereObj, transaction) => {
		return await OrderItemCalculation.findOne({
			where: whereObj,
			raw: true,
			...(transaction ? { transaction } : {})
		})
	}

	updateOrderItemCalculationGeneric = async (whereObj, updateObj, transaction) => {
		return await OrderItemCalculation.update(updateObj, {
			where: whereObj,
			returning: true,
			...(transaction ? { transaction } : {})
		})
	}
}

module.exports = OrderRepository;