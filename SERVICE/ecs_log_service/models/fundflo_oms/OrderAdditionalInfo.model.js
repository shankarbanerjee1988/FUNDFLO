const _ = require('lodash');
const ModelBuilder = require('../model.builder');
const { DataTypes, Model, Sequelize } = require('sequelize');

class OrderAdditionalInfo extends Model { }


function defineModel() {
	const modelBuilder = new ModelBuilder();
	modelBuilder.addAttributes({
		id: {
			type: DataTypes.UUID,
			allowNull: false,
			defaultValue: DataTypes.UUIDV4,
			primaryKey: true
		},
		orderUuid: {
			type: DataTypes.UUID,
			allowNull: false,
			references: {
				model: 'order',
				key: 'id'
			},
			unique: "order_additional_info_order_uuid_key",
			field: 'order_uuid'
		},
		ffOrderNo: {
			type: DataTypes.TEXT,
			allowNull: false,
			field: 'ff_order_no'
		},
		truckSize: {
			type: DataTypes.DOUBLE,
			allowNull: true,
			field: 'truck_size'
		},
		totalQuantity: {
			type: DataTypes.DOUBLE,
			allowNull: false,
			defaultValue: 0,
			field: 'total_quantity'
		},
		totalQuantityUnit: {
			type: DataTypes.TEXT,
			allowNull: true,
			field: 'total_quantity_unit'
		},
		totalCalculationQuantity: {
			type: DataTypes.DOUBLE,
			allowNull: false,
			defaultValue: 0,
			field: 'total_calculation_quantity'
		},
		totalCalculationUnit: {
			type: DataTypes.TEXT,
			allowNull: true,
			field: 'total_calculation_unit'
		},
		totalWeight: {
			type: DataTypes.DOUBLE,
			allowNull: false,
			defaultValue: 0,
			field: 'total_weight'
		},
		totalWeightUnit: {
			type: DataTypes.TEXT,
			allowNull: true,
			field: 'total_weight_unit'
		},
		baseAmount: {
			type: DataTypes.DOUBLE,
			allowNull: false,
			defaultValue: 0,
			field: 'base_amount'
		},
		totalTax: {
			type: DataTypes.DOUBLE,
			allowNull: false,
			defaultValue: 0,
			field: 'total_tax'
		},
		totalHandlingCharges: {
			type: DataTypes.DOUBLE,
			allowNull: false,
			defaultValue: 0,
			field: 'total_handling_charges'
		},
		totalDiscount: {
			type: DataTypes.DOUBLE,
			allowNull: false,
			defaultValue: 0,
			field: 'total_discount'
		},
		roundOff: {
			type: DataTypes.DOUBLE,
			allowNull: false,
			defaultValue: 0,
			field: 'round_off'
		},
		orderFinalAmount: {
			type: DataTypes.DOUBLE,
			allowNull: false,
			defaultValue: 0,
			field: 'order_final_amount'
		},
		materialCodes: {
			type: DataTypes.TEXT,
			allowNull: true,
			field: 'material_codes'
		},
		materialDesc: {
			type: DataTypes.TEXT,
			allowNull: true,
			field: 'material_desc'
		},
		materialBrandDesc: {
			type: DataTypes.TEXT,
			allowNull: true,
			field: 'material_brand_desc'
		},
		materialVerticalDesc: {
			type: DataTypes.TEXT,
			allowNull: true,
			field: 'material_vertical_desc'
		},
		categoryDesc: {
			type: DataTypes.TEXT,
			allowNull: true,
			field: 'category_desc'
		},
		qualityDesc: {
			type: DataTypes.TEXT,
			allowNull: true,
			field: 'quality_desc'
		},
		creditCheckOverdueInfo: {
			type: DataTypes.JSONB,
			allowNull: true,
			field: 'credit_check_overdue_info'
		},
		ffWarningMessage: {
			type: DataTypes.JSONB,
			allowNull: true,
			field: 'ff_warning_message'
		},
		ffErrorMessage: {
			type: DataTypes.JSONB,
			allowNull: true,
			field: 'ff_error_message'
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
		createdByRole: {
			type: DataTypes.TEXT,
			allowNull: true,
			field: 'created_by_role'
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
		}
	});
	modelBuilder.configureOptions(false, false, 'order_additional_info', 'fundflo_oms', {});
	return modelBuilder;
}

OrderAdditionalInfo.init(
	defineModel().getModel(),
	defineModel().getOptions()
);

module.exports = OrderAdditionalInfo;