const _ = require('lodash');
const ModelBuilder = require('../model.builder');
const { DataTypes, Model, Sequelize } = require('sequelize');

class FormFields extends Model { }


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
                unique: "uqidx_fundflo_oms_template_enterprise_form_fields",
                field: 'enterprise_id'
            },
            enterpriseUuid: {
                type: DataTypes.UUID,
                allowNull: false,
                field: 'enterprise_uuid'
            },
            formTemplateUuid: {
                type: DataTypes.UUID,
                allowNull: false,
                references: {
                    model: 'form_template',
                    key: 'id'
                },
                unique: "uqidx_fundflo_oms_template_enterprise_form_fields",
                field: 'form_template_uuid'
            },
            formCode: {
                type: DataTypes.STRING(50),
                allowNull: false,
                field: 'form_code'
            },
            seqNo: {
                type: DataTypes.INTEGER,
                allowNull: true,
                defaultValue: 1,
                field: 'seq_no'
            },
            fieldBackendId: {
                type: DataTypes.TEXT,
                allowNull: false,
                field: 'field_backend_id'
            },
            fieldId: {
                type: DataTypes.TEXT,
                allowNull: false,
                unique: "uqidx_fundflo_oms_template_enterprise_form_fields",
                field: 'field_id'
            },
            fieldLabel: {
                type: DataTypes.TEXT,
                allowNull: true,
                field: 'field_label'
            },
            fieldType: {
                type: DataTypes.TEXT,
                allowNull: true,
                field: 'field_type'
            },
            fieldFormat: {
                type: DataTypes.TEXT,
                allowNull: true,
                field: 'field_format'
            },
            isReadOnly: {
                type: DataTypes.BOOLEAN,
                allowNull: true,
                defaultValue: false,
                field: 'is_read_only'
            },
            isRequired: {
                type: DataTypes.BOOLEAN,
                allowNull: true,
                defaultValue: false,
                field: 'is_required'
            },
            defaultValue: {
                type: DataTypes.JSONB,
                allowNull: true,
                field: 'default_value'
            },
            validations: {
                type: DataTypes.JSONB,
                allowNull: true
            },
            isDynamicUrl: {
                type: DataTypes.BOOLEAN,
                allowNull: true,
                defaultValue: false,
                field: 'is_dynamic_url'
            },
            dynamicUrl: {
                type: DataTypes.TEXT,
                allowNull: true,
                field: 'dynamic_url'
            },
            isDependent: {
                type: DataTypes.BOOLEAN,
                allowNull: true,
                defaultValue: false,
                field: 'is_dependent'
            },
            dependentFieldId: {
                type: DataTypes.TEXT,
                allowNull: true,
                field: 'dependent_field_id'
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
                defaultValue: Sequelize.Sequelize.fn('now'),
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
    modelBuilder.configureOptions(false, false, 'form_fields', 'fundflo_oms_template_enterprise', {});
    return modelBuilder;
}

FormFields.init(
    defineModel().getModel(),
    defineModel().getOptions()
);

module.exports = FormFields;