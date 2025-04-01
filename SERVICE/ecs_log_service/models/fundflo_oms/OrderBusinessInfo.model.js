const _ = require('lodash');
const ModelBuilder = require('../model.builder');
const { DataTypes, Model, Sequelize } = require('sequelize');

class OrderBusinessInfo extends Model { }


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
			allowNull: true,
			references: {
				model: 'order',
				key: 'id'
			},
			unique: "order_business_info_order_uuid_key",
			field: 'order_uuid'
		},
		legalEntityDesc: {
			type: DataTypes.TEXT,
			allowNull: true,
			field: 'legal_entity_desc'
		},
		legalEntityCode: {
			type: DataTypes.TEXT,
			allowNull: true,
			field: 'legal_entity_code'
		},
		legalEntityUuid: {
			type: DataTypes.UUID,
			allowNull: true,
			field: 'legal_entity_uuid'
		},
		isAdvance: {
			type: DataTypes.BOOLEAN,
			allowNull: true,
			field: 'is_advance'
		},
		paytCode: {
			type: DataTypes.STRING(10),
			allowNull: true,
			field: 'payt_code'
		},
		paymentTerms: {
			type: DataTypes.TEXT,
			allowNull: true,
			field: 'payment_terms'
		},
		salesEmployeeCode: {
			type: DataTypes.TEXT,
			allowNull: true,
			field: 'sales_employee_code'
		},
		salesEmployeeUuid: {
			type: DataTypes.UUID,
			allowNull: true,
			field: 'sales_employee_uuid'
		},
		salesEmployeeName: {
			type: DataTypes.TEXT,
			allowNull: true,
			field: 'sales_employee_name'
		},
		divisionDesc: {
			type: DataTypes.TEXT,
			allowNull: true,
			field: 'division_desc'
		},
		divisionCode: {
			type: DataTypes.TEXT,
			allowNull: true,
			field: 'division_code'
		},
		divisionUuid: {
			type: DataTypes.UUID,
			allowNull: true,
			field: 'division_uuid'
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
		dcDesc: {
			type: DataTypes.TEXT,
			allowNull: true,
			field: 'dc_desc'
		},
		dcCode: {
			type: DataTypes.TEXT,
			allowNull: true,
			field: 'dc_code'
		},
		dcUuid: {
			type: DataTypes.UUID,
			allowNull: true,
			field: 'dc_uuid'
		},
		salesOfficeDesc: {
			type: DataTypes.TEXT,
			allowNull: true,
			field: 'sales_office_desc'
		},
		salesOfficeCode: {
			type: DataTypes.TEXT,
			allowNull: true,
			field: 'sales_office_code'
		},
		salesOfficeUuid: {
			type: DataTypes.UUID,
			allowNull: true,
			field: 'sales_office_uuid'
		},
		salesGroupDesc: {
			type: DataTypes.TEXT,
			allowNull: true,
			field: 'sales_group_desc'
		},
		salesGroupCode: {
			type: DataTypes.TEXT,
			allowNull: true,
			field: 'sales_group_code'
		},
		salesGroupUuid: {
			type: DataTypes.UUID,
			allowNull: true,
			field: 'sales_group_uuid'
		},
		segmentDesc: {
			type: DataTypes.TEXT,
			allowNull: true,
			field: 'segment_desc'
		},
		segmentCode: {
			type: DataTypes.TEXT,
			allowNull: true,
			field: 'segment_code'
		},
		segmentUuid: {
			type: DataTypes.UUID,
			allowNull: true,
			field: 'segment_uuid'
		},
		warehouseDesc: {
			type: DataTypes.TEXT,
			allowNull: true,
			field: 'warehouse_desc'
		},
		warehouseCode: {
			type: DataTypes.TEXT,
			allowNull: true,
			field: 'warehouse_code'
		},
		warehouseUuid: {
			type: DataTypes.UUID,
			allowNull: true,
			field: 'warehouse_uuid'
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
		businessAreaDesc: {
			type: DataTypes.TEXT,
			allowNull: true,
			field: 'business_area_desc'
		},
		businessAreaCode: {
			type: DataTypes.TEXT,
			allowNull: true,
			field: 'business_area_code'
		},
		businessAreaUuid: {
			type: DataTypes.UUID,
			allowNull: true,
			field: 'business_area_uuid'
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
	modelBuilder.configureOptions(false, false, 'order_business_info', 'fundflo_oms', {});
	return modelBuilder;
}

OrderBusinessInfo.init(
	defineModel().getModel(),
	defineModel().getOptions()
);

module.exports = OrderBusinessInfo;