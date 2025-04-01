const _ = require('lodash');
const ModelBuilder = require('../model.builder');
const { DataTypes, Model, Sequelize } = require('sequelize');

class FormTemplate extends Model { }


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
            unique: "uqidx_fundflo_oms_template_enterprise_form_template",
            field: 'enterprise_id'
        },
        enterpriseUuid: {
            type: DataTypes.UUID,
            allowNull: false,
            field: 'enterprise_uuid'
        },
        formCode: {
            type: DataTypes.TEXT,
            allowNull: false,
            unique: "uqidx_fundflo_oms_template_enterprise_form_template",
            field: 'form_code'
        },
        formLabel: {
            type: DataTypes.TEXT,
            allowNull: true,
            field: 'form_label'
        },
        repeatableHeader: {
            type: DataTypes.BOOLEAN,
            allowNull: true,
            defaultValue: false,
            field: 'repeatable_header'
        },
        seqNo: {
            type: DataTypes.INTEGER,
            allowNull: true,
            defaultValue: 1,
            field: 'seq_no'
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
    });
    modelBuilder.configureOptions(false, false, 'form_template', 'fundflo_oms_template_enterprise', {});
    return modelBuilder;
}

FormTemplate.init(
    defineModel().getModel(),
    defineModel().getOptions()
);

module.exports = FormTemplate;