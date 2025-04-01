const _ = require('lodash');
const ModelBuilder = require('../model.builder');
const { DataTypes, Model, Sequelize } = require('sequelize');

class OrderTemplate extends Model { }


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
            unique: "order_template_section_code_key",
            field: 'section_code'
        },
        sectionCodeFrontendName: {
            type: DataTypes.STRING(100),
            allowNull: false,
            unique: "order_template_section_code_frontend_name_key",
            field: 'section_code_frontend_name'
        },
        sectionCustomName: {
            type: DataTypes.TEXT,
            allowNull: false,
            field: 'section_custom_name'
        },
        isDisplay: {
            type: DataTypes.BOOLEAN,
            allowNull: true,
            defaultValue: true,
            field: 'is_display'
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
    modelBuilder.configureOptions(false, false, 'order_template', 'fundflo_oms_template', {});
    return modelBuilder;
}

OrderTemplate.init(
    defineModel().getModel(),
    defineModel().getOptions()
);

module.exports = OrderTemplate;