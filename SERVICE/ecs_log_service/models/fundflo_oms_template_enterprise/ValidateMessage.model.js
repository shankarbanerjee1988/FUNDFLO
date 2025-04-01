const _ = require('lodash');
const ModelBuilder = require('../model.builder');
const { DataTypes, Model, Sequelize } = require('sequelize');

class ValidateMessage extends Model { }


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
                unique: "uqidx_fundflo_oms_template_enterprise_validation_message",
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
                defaultValue: 1,
                field: 'seq_no'
            },
            validationCode: {
                type: DataTypes.STRING(50),
                allowNull: true,
                unique: "uqidx_fundflo_oms_template_enterprise_validation_message",
                field: 'validation_code'
            },
            messageType: {
                type: DataTypes.STRING(50),
                allowNull: true,
                field: 'message_type'
            },
            messageText: {
                type: DataTypes.JSONB,
                allowNull: true,
                field: 'message_text'
            },
            validationType: {
                type: DataTypes.STRING(15),
                allowNull: true,
                field: 'validation_type'
            },
            apiUrl: {
                type: DataTypes.TEXT,
                allowNull: true,
                field: 'api_url'
            },
            percentageLimitFrom: {
                type: DataTypes.INTEGER,
                allowNull: false,
                defaultValue: 0,
                field: 'percentage_limit_from'
            },
            percentageLimitTo: {
                type: DataTypes.INTEGER,
                allowNull: false,
                defaultValue: 100,
                field: 'percentage_limit_to'
            },
            percentageBufferLimitTo: {
                type: DataTypes.INTEGER,
                allowNull: false,
                defaultValue: 100,
                field: 'percentage_buffer_limit_to'
            },
            amountLimitFrom: {
                type: DataTypes.INTEGER,
                allowNull: false,
                defaultValue: 0,
                field: 'amount_limit_from'
            },
            amountLimitTo: {
                type: DataTypes.INTEGER,
                allowNull: false,
                defaultValue: 100,
                field: 'amount_limit_to'
            },
            amountBufferLimitTo: {
                type: DataTypes.INTEGER,
                allowNull: false,
                defaultValue: 100,
                field: 'amount_buffer_limit_to'
            },
            overrideByCustomRoleCode: {
                type: DataTypes.ARRAY(DataTypes.TEXT),
                allowNull: true,
                field: 'override_by_custom_role_code'
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
                allowNull: false,
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
                allowNull: false,
                field: 'updated_by_text'
            }
        }
    );
    modelBuilder.configureOptions(false, false, 'validate_message', 'fundflo_oms_template_enterprise', {});
    return modelBuilder;
}

ValidateMessage.init(
    defineModel().getModel(),
    defineModel().getOptions()
);

module.exports = ValidateMessage;