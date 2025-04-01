const _ = require('lodash');
const ModelBuilder = require('../model.builder');
const { DataTypes, Model, Sequelize } = require('sequelize');

class FileTypes extends Model { }


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
                unique: "uqidx_fundflo_oms_template_enterprise_file_types",
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
            fileType: {
                type: DataTypes.TEXT,
                allowNull: true,
                unique: "uqidx_fundflo_oms_template_enterprise_file_types",
                field: 'file_type'
            },
            fileExtentions: {
                type: DataTypes.ARRAY(DataTypes.TEXT),
                allowNull: true,
                field: 'file_extentions'
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
    modelBuilder.configureOptions(false, false, 'file_types', 'fundflo_oms_template_enterprise', {});
    return modelBuilder;
}

FileTypes.init(
    defineModel().getModel(),
    defineModel().getOptions()
);

module.exports = FileTypes;