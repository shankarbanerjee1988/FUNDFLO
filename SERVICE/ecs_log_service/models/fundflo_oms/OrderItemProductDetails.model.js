const _ = require('lodash');
const ModelBuilder = require('../model.builder');
const { DataTypes, Model, Sequelize } = require('sequelize');

class OrderItemProductDetails extends Model { }


function defineModel() {
	const modelBuilder = new ModelBuilder();
	modelBuilder.addAttributes({
		id: {
			type: DataTypes.UUID,
			allowNull: false,
			defaultValue: DataTypes.UUIDV4,
			primaryKey: true
		},
		itemUuid: {
			type: DataTypes.UUID,
			allowNull: false,
			references: {
				model: 'order_item',
				key: 'id'
			},
			unique: "order_item_product_details_item_uuid_key",
			field: 'item_uuid'
		},
		inventoryMaterialUuid: {
			type: DataTypes.UUID,
			allowNull: true,
			field: 'inventory_material_uuid'
		},
		productDetails: {
			type: DataTypes.JSONB,
			allowNull: true,
			field: 'product_details'
		},
		saleUnit: {
			type: DataTypes.TEXT,
			allowNull: true,
			field: 'sale_unit'
		},
		uniqueCode: {
			type: DataTypes.TEXT,
			allowNull: false,
			unique: "order_item_product_details_unique_code_key",
			field: 'unique_code'
		}
	});
	modelBuilder.configureOptions(false, false, 'order_item_product_details', 'fundflo_oms', {});
	return modelBuilder;
}

OrderItemProductDetails.init(
	defineModel().getModel(),
	defineModel().getOptions()
);

module.exports = OrderItemProductDetails;