const _ = require('lodash');
const ModelBuilder = require('../model.builder');
const { DataTypes, Model, Sequelize } = require('sequelize');

class Order extends Model { }


function defineModel() {
	const modelBuilder = new ModelBuilder();
	modelBuilder.addAttributes({
		id: {
			type: DataTypes.UUID,
			allowNull: false,
			defaultValue: DataTypes.UUIDV4,
			primaryKey: true
		},
		ffOrderNo: {
			type: DataTypes.TEXT,
			unique: "order_ff_order_no_key",
			field: 'ff_order_no'
		},
		enterpriseId: {
			type: DataTypes.INTEGER,
			allowNull: false,
			field: 'enterprise_id'
		},
		enterpriseUuid: {
			type: DataTypes.UUID,
			allowNull: false,
			field: 'enterprise_uuid'
		},
		userUuid: {
			type: DataTypes.UUID,
			allowNull: false,
			field: 'user_uuid'
		},
		userCode: {
			type: DataTypes.STRING(20),
			allowNull: false,
			field: 'user_code'
		},
		userName: {
			type: DataTypes.TEXT,
			allowNull: false,
			field: 'user_name'
		},
		endUserName: {
			type: DataTypes.TEXT,
			allowNull: true,
			field: 'end_user_name'
		},
		endUserIndustry: {
			type: DataTypes.TEXT,
			allowNull: true,
			field: 'end_user_industry'
		},
		endUserOtherInfo: {
			type: DataTypes.JSON,
			allowNull: true,
			field: 'end_user_other_info'
		},
		orderDate: {
			type: DataTypes.DATEONLY,
			allowNull: false,
			field: 'order_date'
		},
		submittedDate: {
			type: DataTypes.DATE,
			allowNull: true,
			field: 'submitted_date'
		},
		requestedDeliveryDate: {
			type: DataTypes.DATEONLY,
			allowNull: true,
			field: 'requested_delivery_date'
		},
		expectedDeliveryDate: {
			type: DataTypes.DATEONLY,
			allowNull: true,
			field: 'expected_delivery_date'
		},
		modifiedDeliveryDate: {
			type: DataTypes.DATEONLY,
			allowNull: true,
			field: 'modified_delivery_date'
		},
		ffOrderStatus: {
			type: DataTypes.ENUM("CART", "DRAFT", "DEALER_PENDING", "SUBMITTED", "MODIFIED", "APPROVED", "REJECTED", "POSTED"),
			allowNull: false,
			field: 'ff_order_status'
		},
		soStatus: {
			type: DataTypes.ENUM("SO_PENDING", "SO_CREATED", "SO_FAILED", "ERP_DIRECT_CREATED", "ERP_DIRECT_DELETED", "ERP_BLOCKED", "ERP_RELEASEDINVOICED", "IN_TRANSIT", "DELIVERED"),
			allowNull: true,
			field: 'so_status'
		},
		creditCheckApprovalPending: {
			type: DataTypes.BOOLEAN,
			allowNull: true,
			defaultValue: false,
			field: 'credit_check_approval_pending'
		},
		discountApprovalPending: {
			type: DataTypes.BOOLEAN,
			allowNull: true,
			defaultValue: false,
			field: 'discount_approval_pending'
		},
		overdueApprovalPending: {
			type: DataTypes.BOOLEAN,
			allowNull: true,
			defaultValue: false,
			field: 'overdue_approval_pending'
		},
		remarks: {
			type: DataTypes.TEXT,
			allowNull: true
		},
		remarks1: {
			type: DataTypes.TEXT,
			allowNull: true
		},
		tpNo: {
			type: DataTypes.TEXT,
			allowNull: true,
			field: 'tp_no'
		},
		tpId: {
			type: DataTypes.TEXT,
			allowNull: true,
			field: 'tp_id'
		},
		sapOrderType: {
			type: DataTypes.TEXT,
			allowNull: true,
			field: 'sap_order_type'
		},
		createdFrom: {
			type: DataTypes.TEXT,
			allowNull: true,
			field: 'created_from'
		},
		shipToAddress: {
			type: DataTypes.JSONB,
			allowNull: true,
			field: 'ship_to_address'
		},
		billToAddress: {
			type: DataTypes.JSONB,
			allowNull: true,
			field: 'bill_to_address'
		},
		orderType: {
			type: DataTypes.STRING(4),
			allowNull: false,
			defaultValue: "O1",
			field: 'order_type'
		},
		parentUuid: {
			type: DataTypes.UUID,
			allowNull: true,
			field: 'parent_uuid'
		},
		isSplitOrder: {
			type: DataTypes.BOOLEAN,
			allowNull: true,
			defaultValue: false,
			field: 'is_split_order'
		},
		lastApprovedByUuid: {
			type: DataTypes.UUID,
			allowNull: true,
			field: 'last_approved_by_uuid'
		},
		lastApprovedByCode: {
			type: DataTypes.TEXT,
			allowNull: true,
			field: 'last_approved_by_code'
		},
		lastApproverRole: {
			type: DataTypes.TEXT,
			allowNull: true,
			field: 'last_approver_role'
		},
		lastApprovalStatus: {
			type: DataTypes.TEXT,
			allowNull: true,
			field: 'last_approval_status'
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
			allowNull: true,
			field: 'created_by_text'
		},
		createdByRole: {
			type: DataTypes.TEXT,
			allowNull: true,
			field: 'created_by_role'
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
			allowNull: true,
			field: 'updated_by_text'
		}
	});
	modelBuilder.configureOptions(false, false, 'order', 'fundflo_oms', {});
	return modelBuilder;
}

Order.init(
	defineModel().getModel(),
	defineModel().getOptions()
);

module.exports = Order;