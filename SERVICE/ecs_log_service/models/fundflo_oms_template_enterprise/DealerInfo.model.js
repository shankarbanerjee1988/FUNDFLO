const _ = require('lodash');
const ModelBuilder = require('../model.builder');
const { DataTypes, Model, Sequelize } = require('sequelize');

class DealerInfo extends Model { }


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
                unique: "uqidx_fundflo_oms_template_enterprise_dealer_info",
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
            infoCode: {
                type: DataTypes.STRING(50),
                allowNull: true,
                unique: "uqidx_fundflo_oms_template_enterprise_dealer_info",
                field: 'info_code'
            },
            infoLinkName: {
                type: DataTypes.TEXT,
                allowNull: true,
                field: 'info_link_name'
            },
            infoLinkApiUrl: {
                type: DataTypes.TEXT,
                allowNull: true,
                field: 'info_link_api_url'
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
    modelBuilder.configureOptions(false, false, 'dealer_info', 'fundflo_oms_template_enterprise', {});
    return modelBuilder;
}

DealerInfo.init(
    defineModel().getModel(),
    defineModel().getOptions()
);

module.exports = DealerInfo;