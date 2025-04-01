const _ = require('lodash');
const ModelBuilder = require('../model.builder');
const { DataTypes, Model, Sequelize } = require('sequelize');

class HideFormFields extends Model { }


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
                unique: "uqidx_fundflo_oms_template_enterprise_hide_form_fields",
                field: 'enterprise_id'
            },
            enterpriseUuid: {
                type: DataTypes.UUID,
                allowNull: false,
                field: 'enterprise_uuid'
            },
            hideType: {
                type: DataTypes.STRING(50),
                allowNull: true,
                unique: "uqidx_fundflo_oms_template_enterprise_hide_form_fields",
                field: 'hide_type'
            },
            hideTypeCode: {
                type: DataTypes.STRING(100),
                allowNull: true,
                unique: "uqidx_fundflo_oms_template_enterprise_hide_form_fields",
                field: 'hide_type_code'
            },
            formFieldUuid: {
                type: DataTypes.ARRAY(DataTypes.UUID),
                allowNull: true,
                field: 'form_field_uuid'
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
    modelBuilder.configureOptions(false, false, 'hide_form_fields', 'fundflo_oms_template_enterprise', {});
    return modelBuilder;
}

HideFormFields.init(
    defineModel().getModel(),
    defineModel().getOptions()
);

module.exports = HideFormFields;