const _ = require('lodash');
const ModelBuilder = require('../model.builder');
const { DataTypes, Model, Sequelize } = require('sequelize');

class OrderValidateSchema extends Model { }


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
            legalEntityUuid: {
                type: DataTypes.ARRAY(DataTypes.UUID),
                allowNull: true,
                field: 'legal_entity_uuid'
            },
            roleUuid: {
                type: DataTypes.UUID,
                allowNull: true,
                field: 'role_uuid'
            },
            roleName: {
                type: DataTypes.STRING(255),
                allowNull: true,
                field: 'role_name'
            },
            roleCode: {
                type: DataTypes.STRING(20),
                allowNull: true,
                field: 'role_code'
            },
            customRoleCode: {
                type: DataTypes.STRING(20),
                allowNull: true,
                field: 'custom_role_code'
            },
            orderStatus: {
                type: DataTypes.STRING(20),
                allowNull: true,
                field: 'order_status'
            },
            orderStatusSeq: {
                type: DataTypes.INTEGER,
                allowNull: true,
                field: 'order_status_seq'
            },
            fullSchema: {
                type: DataTypes.JSONB,
                allowNull: true,
                field: 'full_schema'
            },
            temporaryOrderSchema: {
                type: DataTypes.JSONB,
                allowNull: true,
                field: 'temporary_order_schema'
            },
            orderSchema: {
                type: DataTypes.JSONB,
                allowNull: true,
                field: 'order_schema'
            },
            orderFilesSchema: {
                type: DataTypes.JSONB,
                allowNull: true,
                field: 'order_files_schema'
            },
            orderBusinessObjectSchema: {
                type: DataTypes.JSONB,
                allowNull: true,
                field: 'order_business_object_schema'
            },
            orderAdditionalObjectSchema: {
                type: DataTypes.JSONB,
                allowNull: true,
                field: 'order_additional_object_schema'
            },
            orderCalculationSchema: {
                type: DataTypes.JSONB,
                allowNull: true,
                field: 'order_calculation_schema'
            },
            orderItemSchema: {
                type: DataTypes.JSONB,
                allowNull: true,
                field: 'order_item_schema'
            },
            orderItemCalculationSchema: {
                type: DataTypes.JSONB,
                allowNull: true,
                field: 'order_item_calculation_schema'
            },
            createdDate: {
                type: DataTypes.DATE,
                allowNull: false,
                field: 'created_date'
            },
            updatedDate: {
                type: DataTypes.DATE,
                allowNull: true,
                defaultValue: Sequelize.fn('now'),
                field: 'updated_date'
            },
            createdBy: {
                type: DataTypes.UUID,
                allowNull: true,
                field: 'created_by'
            },
            updatedBy: {
                type: DataTypes.UUID,
                allowNull: true,
                field: 'updated_by'
            },
            createdByText: {
                type: DataTypes.TEXT,
                allowNull: true,
                field: 'created_by_text'
            },
            updatedByText: {
                type: DataTypes.TEXT,
                allowNull: true,
                field: 'updated_by_text'
            }
        }
    );
    modelBuilder.configureOptions(false, false, 'order_validate_schema', 'fundflo_oms', {});
    return modelBuilder;
}

OrderValidateSchema.init(
    defineModel().getModel(),
    defineModel().getOptions()
);

module.exports = OrderValidateSchema;