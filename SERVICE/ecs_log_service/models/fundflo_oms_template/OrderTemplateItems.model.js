const _ = require('lodash');
const ModelBuilder = require('../model.builder');
const { DataTypes, Model, Sequelize } = require('sequelize');

class OrderTemplateItem extends Model { }


function defineModel() {
    const modelBuilder = new ModelBuilder();
    modelBuilder.addAttributes({
        id: {
            autoIncrement: true,
            type: DataTypes.BIGINT,
            allowNull: false,
            primaryKey: true
        },
        sectionCode: {
            type: DataTypes.STRING(100),
            allowNull: false,
            unique: "uqidx_fundflo_oms_template_order_template_item",
            field: 'section_code'
        },
        sectionCodeFrontendName: {
            type: DataTypes.STRING(100),
            allowNull: false,
            field: 'section_code_frontend_name'
        },
        fieldId: {
            type: DataTypes.TEXT,
            allowNull: false,
            unique: "uqidx_fundflo_oms_template_order_template_item",
            field: 'field_id'
        },
        backendType: {
            type: DataTypes.TEXT,
            allowNull: false,
            field: 'backend_type'
        },
        isNullable: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: false,
            field: 'is_nullable'
        },
        frontendId: {
            type: DataTypes.TEXT,
            allowNull: false,
            field: 'frontend_id'
        },
        frontendType: {
            type: DataTypes.TEXT,
            allowNull: false,
            field: 'frontend_type'
        },
        frontendName: {
            type: DataTypes.TEXT,
            allowNull: true,
            defaultValue: "",
            field: 'frontend_name'
        },
        isGeneric: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: false,
            field: 'is_generic'
        },
        genericSeq: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 0,
            field: 'generic_seq'
        },
        dynamicUrl: {
            type: DataTypes.TEXT,
            allowNull: true,
            defaultValue: "",
            field: 'dynamic_url'
        },
        formSectionCode: {
            type: DataTypes.TEXT,
            allowNull: true,
            defaultValue: "",
            field: 'form_section_code'
        },
        updatedDate: {
            type: DataTypes.DATE,
            allowNull: false,
            defaultValue: Sequelize.fn('now'),
            field: 'updated_date'
        },
        updatedByText: {
            type: DataTypes.TEXT,
            allowNull: false,
            field: 'updated_by_text'
        }
    });
    modelBuilder.configureOptions(false, false, 'order_template_item', 'fundflo_oms_template', {});
    return modelBuilder;
}

OrderTemplateItem.init(
    defineModel().getModel(),
    defineModel().getOptions()
);

module.exports = OrderTemplateItem;