const _ = require('lodash');
const ModelBuilder = require('../model.builder');
const { DataTypes, Model, Sequelize } = require('sequelize');

class TemporaryOrder extends Model { }


function defineModel() {
	const modelBuilder = new ModelBuilder();
	modelBuilder.addAttributes({
		id: {
			type: DataTypes.UUID,
			allowNull: false,
			defaultValue: DataTypes.UUIDV4,
			primaryKey: true
		},
		enterpriseId: {
			type: DataTypes.INTEGER,
			allowNull: false,
			field: 'enterprise_id'
		},
		enterpriseUuid: {
			type: DataTypes.UUID,
			allowNull: false,
			field: 'enterprise_uuid'
		},
		sessionId: {
			type: DataTypes.TEXT,
			allowNull: true,
			field: 'session_id'
		},
		ffTempOrderNo: {
			type: DataTypes.TEXT,
			unique: "temporary_order_ff_temp_order_no_key",
			field: 'ff_temp_order_no'
		},
		userUuid: {
			type: DataTypes.UUID,
			allowNull: false,
			field: 'user_uuid'
		},
		userCode: {
			type: DataTypes.STRING(20),
			allowNull: false,
			field: 'user_code'
		},
		headerDetails: {
			type: DataTypes.JSONB,
			allowNull: true,
			field: 'header_details'
		},
		financeDetails: {
			type: DataTypes.JSONB,
			allowNull: true,
			field: 'finance_details'
		},
		otherDetails: {
			type: DataTypes.JSONB,
			allowNull: true,
			field: 'other_details'
		},
		updatedDate: {
			type: DataTypes.DATE,
			allowNull: true,
			defaultValue: Sequelize.Sequelize.fn('now'),
			field: 'updated_date'
		}
	});
	modelBuilder.configureOptions(false, false, 'temporary_order', 'fundflo_oms', {});
	return modelBuilder;
}

TemporaryOrder.init(
	defineModel().getModel(),
	defineModel().getOptions()
);

module.exports = TemporaryOrder;