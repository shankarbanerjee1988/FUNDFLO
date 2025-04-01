const _ = require('lodash');
const ModelBuilder = require('../model.builder');
const { DataTypes, Model, Sequelize } = require('sequelize');

class OrderItem extends Model { }


function defineModel() {
	const modelBuilder = new ModelBuilder();
	modelBuilder.addAttributes({
		id: {
			type: DataTypes.UUID,
			allowNull: false,
			defaultValue: DataTypes.UUIDV4,
			primaryKey: true
		},
		temporaryOrderUuid: {
			type: DataTypes.UUID,
			allowNull: true,
			references: {
				model: 'temporary_order',
				key: 'id'
			},
			field: 'temporary_order_uuid'
		},
		ffTempOrderNo: {
			type: DataTypes.TEXT,
			allowNull: true,
			field: 'ff_temp_order_no'
		},
		orderUuid: {
			type: DataTypes.UUID,
			allowNull: true,
			references: {
				model: 'order',
				key: 'id'
			},
			field: 'order_uuid'
		},
		ffOrderNo: {
			type: DataTypes.TEXT,
			allowNull: true,
			field: 'ff_order_no'
		},
		groupBy: {
			type: DataTypes.BOOLEAN,
			allowNull: false,
			defaultValue: false,
			field: 'group_by'
		},
		groupCode: {
			type: DataTypes.TEXT,
			allowNull: true,
			field: 'group_code'
		},
		seqNo: {
			type: DataTypes.INTEGER,
			allowNull: false,
			field: 'seq_no'
		},
		soNumber: {
			type: DataTypes.TEXT,
			allowNull: true,
			field: 'so_number'
		},
		soDate: {
			type: DataTypes.DATEONLY,
			allowNull: true,
			field: 'so_date'
		},
		invoiceNumber: {
			type: DataTypes.TEXT,
			allowNull: true,
			field: 'invoice_number'
		},
		invoiceDate: {
			type: DataTypes.DATEONLY,
			allowNull: true,
			field: 'invoice_date'
		},
		trackingId: {
			type: DataTypes.TEXT,
			allowNull: true,
			field: 'tracking_id'
		},
		trackingDetails: {
			type: DataTypes.JSON,
			allowNull: true,
			field: 'tracking_details'
		},
		plantDesc: {
			type: DataTypes.TEXT,
			allowNull: true,
			field: 'plant_desc'
		},
		plantCode: {
			type: DataTypes.TEXT,
			allowNull: true,
			field: 'plant_code'
		},
		plantUuid: {
			type: DataTypes.UUID,
			allowNull: true,
			field: 'plant_uuid'
		},
		itemVendorDesc: {
			type: DataTypes.TEXT,
			allowNull: true,
			field: 'item_vendor_desc'
		},
		itemVendorCode: {
			type: DataTypes.TEXT,
			allowNull: true,
			field: 'item_vendor_code'
		},
		itemVendorUuid: {
			type: DataTypes.UUID,
			allowNull: true,
			field: 'item_vendor_uuid'
		},
		profitCenterDesc: {
			type: DataTypes.TEXT,
			allowNull: true,
			field: 'profit_center_desc'
		},
		profitCenterCode: {
			type: DataTypes.TEXT,
			allowNull: true,
			field: 'profit_center_code'
		},
		profitCenterUuid: {
			type: DataTypes.UUID,
			allowNull: true,
			field: 'profit_center_uuid'
		},
		orderItemUniqueCode: {
			type: DataTypes.TEXT,
			field: 'order_item_unique_code'
		},
		materialCode: {
			type: DataTypes.TEXT,
			allowNull: false,
			field: 'material_code'
		},
		hsnCode: {
			type: DataTypes.TEXT,
			allowNull: false,
			field: 'hsn_code'
		},
		qualityCode: {
			type: DataTypes.TEXT,
			allowNull: true,
			field: 'quality_code'
		},
		qualityDesc: {
			type: DataTypes.TEXT,
			allowNull: true,
			field: 'quality_desc'
		},
		isTradingItem: {
			type: DataTypes.BOOLEAN,
			allowNull: true,
			defaultValue: false,
			field: 'is_trading_item'
		},
		tradingMaterialCode: {
			type: DataTypes.TEXT,
			allowNull: true,
			field: 'trading_material_code'
		},
		itemRate: {
			type: DataTypes.DOUBLE,
			allowNull: false,
			field: 'item_rate'
		},
		itemRateOn: {
			type: DataTypes.STRING(100),
			allowNull: false,
			field: 'item_rate_on'
		},
		itemQuantity: {
			type: DataTypes.DOUBLE,
			allowNull: false,
			defaultValue: 0,
			field: 'item_quantity'
		},
		itemQuantityUnit: {
			type: DataTypes.TEXT,
			allowNull: true,
			field: 'item_quantity_unit'
		},
		itemCalculationQuantity: {
			type: DataTypes.DOUBLE,
			allowNull: false,
			defaultValue: 0,
			field: 'item_calculation_quantity'
		},
		itemCalculationUnit: {
			type: DataTypes.TEXT,
			allowNull: true,
			field: 'item_calculation_unit'
		},
		itemBaseAmount: {
			type: DataTypes.DOUBLE,
			allowNull: false,
			defaultValue: 0,
			field: 'item_base_amount'
		},
		itemDiscountAmount: {
			type: DataTypes.DOUBLE,
			allowNull: false,
			defaultValue: 0,
			field: 'item_discount_amount'
		},
		itemManualDiscountAmount: {
			type: DataTypes.DOUBLE,
			allowNull: false,
			defaultValue: 0,
			field: 'item_manual_discount_amount'
		},
		itemHandlingAmount: {
			type: DataTypes.DOUBLE,
			allowNull: false,
			defaultValue: 0,
			field: 'item_handling_amount'
		},
		itemOtherAdditionAmount: {
			type: DataTypes.DOUBLE,
			allowNull: false,
			defaultValue: 0,
			field: 'item_other_addition_amount'
		},
		itemTaxAmount: {
			type: DataTypes.DOUBLE,
			allowNull: false,
			defaultValue: 0,
			field: 'item_tax_amount'
		},
		itemFinalAmount: {
			type: DataTypes.DOUBLE,
			allowNull: false,
			defaultValue: 0,
			field: 'item_final_amount'
		},
		saleUnit: {
			type: DataTypes.TEXT,
			allowNull: true,
			field: 'sale_unit'
		},
		otherInfo1: {
			type: DataTypes.TEXT,
			allowNull: true,
			field: 'other_info1'
		},
		otherInfo2: {
			type: DataTypes.TEXT,
			allowNull: true,
			field: 'other_info2'
		},
		otherInfo3: {
			type: DataTypes.TEXT,
			allowNull: true,
			field: 'other_info3'
		},
		createdDate: {
			type: DataTypes.DATE,
			allowNull: false,
			field: 'created_date'
		},
		createdByUuid: {
			type: DataTypes.UUID,
			allowNull: true,
			field: 'created_by_uuid'
		},
		createdByText: {
			type: DataTypes.TEXT,
			allowNull: true,
			field: 'created_by_text'
		},
		createdByCode: {
			type: DataTypes.TEXT,
			allowNull: true,
			field: 'created_by_code'
		},
		updatedDate: {
			type: DataTypes.DATE,
			allowNull: false,
			defaultValue: Sequelize.fn('now'),
			field: 'updated_date'
		},
		updatedByUuid: {
			type: DataTypes.UUID,
			allowNull: true,
			field: 'updated_by_uuid'
		},
		updatedByText: {
			type: DataTypes.TEXT,
			allowNull: true,
			field: 'updated_by_text'
		},
		updatedByCode: {
			type: DataTypes.TEXT,
			allowNull: true,
			field: 'updated_by_code'
		},
		enterpriseId: {
			type: DataTypes.INTEGER,
			field: 'enterprise_id'
		}
	});
	modelBuilder.configureOptions(false, false, 'order_item', 'fundflo_oms', {});
	return modelBuilder;
}

OrderItem.init(
	defineModel().getModel(),
	defineModel().getOptions()
);

module.exports = OrderItem;