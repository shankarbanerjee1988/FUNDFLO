const _ = require('lodash');
const ModelBuilder = require('../model.builder');
const { DataTypes, Model, Sequelize } = require('sequelize');

class OrderCalculation extends Model { }


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
            unique: "uqidx_fundflo_oms_config_order_calculation",
            field: 'enterprise_id'
        },
        enterpriseUuid: {
            type: DataTypes.UUID,
            allowNull: false,
            field: 'enterprise_uuid'
        },
        seqNo: {
            type: DataTypes.INTEGER,
            allowNull: false,
            field: 'seq_no'
        },
        calEntityType: {
            type: DataTypes.ENUM("ORDER", "ITEM", "ORDER", "ITEM"),
            allowNull: false,
            unique: "uqidx_fundflo_oms_config_order_calculation",
            field: 'cal_entity_type'
        },
        calType: {
            type: DataTypes.ENUM("PRICE", "DISCOUNT", "TAX", "MANUAL_DISCOUNT", "HANDLING_CHARGE", "OTHER_CHARGES", "PRICE", "DISCOUNT", "TAX", "MANUAL_DISCOUNT", "HANDLING_CHARGE", "OTHER_CHARGES"),
            allowNull: false,
            unique: "uqidx_fundflo_oms_config_order_calculation",
            field: 'cal_type'
        },
        priceBasedOnMrp: {
            type: DataTypes.BOOLEAN,
            allowNull: true,
            defaultValue: false,
            field: 'price_based_on_mrp'
        },
        calCode: {
            type: DataTypes.STRING(50),
            allowNull: false,
            unique: "uqidx_fundflo_oms_config_order_calculation",
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
        isActive: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: false,
            field: 'is_active'
        },
        isBasedOnUser: {
            type: DataTypes.BOOLEAN,
            allowNull: true,
            defaultValue: false,
            field: 'is_based_on_user'
        },
        isEnterpriseLevel: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: false,
            field: 'is_enterprise_level'
        },
        notMentionFf: {
            type: DataTypes.BOOLEAN,
            allowNull: true,
            defaultValue: false,
            field: 'not_mention_ff'
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
    modelBuilder.configureOptions(false, false, 'order_calculation', 'fundflo_oms_config', {});
    return modelBuilder;
}

OrderCalculation.init(
    defineModel().getModel(),
    defineModel().getOptions()
);

module.exports = OrderCalculation;