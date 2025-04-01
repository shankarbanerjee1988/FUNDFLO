const _ = require('lodash');
const ModelBuilder = require('../model.builder');
const { DataTypes, Model, Sequelize } = require('sequelize');

class OrderCalculation extends Model { }


function defineModel() {
    const modelBuilder = new ModelBuilder();
    modelBuilder.addAttributes(
        {
            id: {
                type: DataTypes.UUID,
                allowNull: false,
                defaultValue: DataTypes.UUIDV4,
                primaryKey: true
            },
            orderCalculationUuid: {
                type: DataTypes.UUID,
                allowNull: true,
                references: {
                    model: 'order_calculation',
                    key: 'id'
                },
                unique: "order_calculation_business_info_order_calculation_uuid_key",
                field: 'order_calculation_uuid'
            },
            calCode: {
                type: DataTypes.STRING(10),
                allowNull: false,
                field: 'cal_code'
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
            }
        }
    );
    modelBuilder.configureOptions(false, false, 'order_calculation_business_info', 'fundflo_oms_config', {});
    return modelBuilder;
}

OrderCalculation.init(
    defineModel().getModel(),
    defineModel().getOptions()
);

module.exports = OrderCalculation;