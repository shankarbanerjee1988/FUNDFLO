const _ = require('lodash');
const ModelBuilder = require('../model.builder');
const { DataTypes, Model, Sequelize } = require('sequelize');

class Material extends Model { }


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
            unique: "uqidx_fundflo_inventory_material_unique_config",
            field: 'enterprise_id'
        },
        enterpriseUuid: {
            type: DataTypes.UUID,
            allowNull: true,
            field: 'enterprise_uuid'
        },
        seqNo: {
            type: DataTypes.INTEGER,
            allowNull: false,
            field: 'seq_no'
        },
        fieldName: {
            type: DataTypes.TEXT,
            allowNull: true,
            unique: "uqidx_fundflo_inventory_material_unique_config",
            field: 'field_name'
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
    modelBuilder.configureOptions(false, false, 'material_unique_config', 'fundflo_oms_inventory', {});
    return modelBuilder;
}

Material.init(
    defineModel().getModel(),
    defineModel().getOptions()
);

module.exports = Material;