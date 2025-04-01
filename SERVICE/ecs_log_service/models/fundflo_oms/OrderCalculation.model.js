const _ = require('lodash');
const ModelBuilder = require('../model.builder');
const { DataTypes, Model, Sequelize } = require('sequelize');

class OrderCalculation extends Model { }


function defineModel() {
	const modelBuilder = new ModelBuilder(true, true);
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
			unique: "uqidx_fundflo_oms_order_calculation",
			field: 'order_uuid'
		},
		ffOrderNo: {
			type: DataTypes.TEXT,
			allowNull: false,
			field: 'ff_order_no'
		},
		calType: {
			type: DataTypes.ENUM("PRICE", "DISCOUNT", "TAX", "MANUAL_DISCOUNT", "HANDLING_CHARGE", "OTHER_CHARGES", "PRICE", "DISCOUNT", "TAX", "MANUAL_DISCOUNT", "HANDLING_CHARGE", "OTHER_CHARGES"),
			allowNull: false,
			unique: "uqidx_fundflo_oms_order_calculation",
			field: 'cal_type'
		},
		seqNo: {
			type: DataTypes.INTEGER,
			allowNull: false,
			field: 'seq_no'
		},
		calStartValue: {
			type: DataTypes.DOUBLE,
			allowNull: false,
			defaultValue: 0,
			field: 'cal_start_value'
		},
		calCode: {
			type: DataTypes.STRING(50),
			allowNull: false,
			unique: "uqidx_fundflo_oms_order_calculation",
			field: 'cal_code'
		},
		calDesc: {
			type: DataTypes.TEXT,
			allowNull: true,
			field: 'cal_desc'
		},
		calCustomName: {
			type: DataTypes.TEXT,
			allowNull: false,
			field: 'cal_custom_name'
		},
		calValue: {
			type: DataTypes.DOUBLE,
			allowNull: false,
			defaultValue: 0,
			field: 'cal_value'
		},
		calUnit: {
			type: DataTypes.STRING(10),
			allowNull: false,
			defaultValue: "%",
			field: 'cal_unit'
		},
		calAmount: {
			type: DataTypes.DOUBLE,
			allowNull: false,
			defaultValue: 0,
			field: 'cal_amount'
		},
		showInGroup: {
			type: DataTypes.BOOLEAN,
			allowNull: false,
			defaultValue: false,
			field: 'show_in_group'
		},
		groupCode: {
			type: DataTypes.TEXT,
			allowNull: true,
			field: 'group_code'
		},
		groupDisplayName: {
			type: DataTypes.TEXT,
			allowNull: true,
			field: 'group_display_name'
		},
		isAddition: {
			type: DataTypes.BOOLEAN,
			allowNull: true,
			defaultValue: false,
			field: 'is_addition'
		},
		isCompound: {
			type: DataTypes.BOOLEAN,
			allowNull: true,
			defaultValue: false,
			field: 'is_compound'
		},
		dependsOnField: {
			type: DataTypes.TEXT,
			allowNull: true,
			field: 'depends_on_field'
		},
		isBasedOnUser: {
			type: DataTypes.BOOLEAN,
			allowNull: true,
			defaultValue: false,
			field: 'is_based_on_user'
		},
		notMentionFf: {
			type: DataTypes.BOOLEAN,
			allowNull: true,
			defaultValue: false,
			field: 'not_mention_ff'
		},
		calEndValue: {
			type: DataTypes.DOUBLE,
			allowNull: false,
			defaultValue: 0,
			field: 'cal_end_value'
		},
		isActive: {
			type: DataTypes.BOOLEAN,
			allowNull: false,
			defaultValue: true,
			field: 'is_active'
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
		}
	});
	modelBuilder.configureOptions(false, false, 'order_calculation', 'fundflo_oms', {});
	return modelBuilder;
}

OrderCalculation.init(
	defineModel().getModel(),
	defineModel().getOptions()
);

module.exports = OrderCalculation;