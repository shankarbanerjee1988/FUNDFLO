const _ = require('lodash');
const ModelBuilder = require('../model.builder');
const { DataTypes, Model, Sequelize } = require('sequelize');

class Material extends Model { }


function defineModel() {
  const modelBuilder = new ModelBuilder(true, false, true);
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
      field: 'enterprise_id'
    },
    enterpriseUuid: {
      type: DataTypes.UUID,
      allowNull: false,
      field: 'enterprise_uuid'
    },
    materialUniqueValue: {
      type: DataTypes.TEXT,
      allowNull: false,
      unique: "material_material_unique_value_key",
      field: 'material_unique_value'
    },
    orderType: {
      type: DataTypes.STRING(4),
      allowNull: false,
      defaultValue: "O1",
      field: 'order_type'
    },
    parentCode: {
      type: DataTypes.STRING(30),
      allowNull: true,
      field: 'parent_code'
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      allowNull: true,
      defaultValue: true,
      field: 'is_active'
    },
    hsnCode: {
      type: DataTypes.STRING(20),
      allowNull: true,
      field: 'hsn_code'
    },
    materialHierarchyCode: {
      type: DataTypes.STRING(30),
      allowNull: true,
      field: 'material_hierarchy_code'
    },
    materialHierarchyDesc: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: 'material_hierarchy_desc'
    },
    materialGroupCode: {
      type: DataTypes.STRING(50),
      allowNull: false,
      field: 'material_group_code'
    },
    materialGroupDesc: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: 'material_group_desc'
    },
    materialTypeCode: {
      type: DataTypes.STRING(50),
      allowNull: true,
      field: 'material_type_code'
    },
    materialTypeDesc: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: 'material_type_desc'
    },
    materialCode: {
      type: DataTypes.STRING(50),
      allowNull: false,
      field: 'material_code'
    },
    materialDesc: {
      type: DataTypes.TEXT,
      allowNull: false,
      field: 'material_desc'
    },
    materialCustomName: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: 'material_custom_name'
    },
    materialBrandCode: {
      type: DataTypes.STRING(50),
      allowNull: true,
      field: 'material_brand_code'
    },
    materialBrandDesc: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: 'material_brand_desc'
    },
    materialVerticalCode: {
      type: DataTypes.STRING(50),
      allowNull: true,
      field: 'material_vertical_code'
    },
    materialVerticalDesc: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: 'material_vertical_desc'
    },
    sizeCode: {
      type: DataTypes.STRING(50),
      allowNull: true,
      field: 'size_code'
    },
    sizeDesc: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: 'size_desc'
    },
    thicknessCode: {
      type: DataTypes.STRING(50),
      allowNull: true,
      field: 'thickness_code'
    },
    thicknessDesc: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: 'thickness_desc'
    },
    categoryCode: {
      type: DataTypes.STRING(30),
      allowNull: true,
      field: 'category_code'
    },
    categoryDesc: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: 'category_desc'
    },
    qualityCode: {
      type: DataTypes.STRING(30),
      allowNull: true,
      field: 'quality_code'
    },
    qualityDesc: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: 'quality_desc'
    },
    gradeCode: {
      type: DataTypes.STRING(30),
      allowNull: true,
      field: 'grade_code'
    },
    gradeDesc: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: 'grade_desc'
    },
    finishCode: {
      type: DataTypes.STRING(30),
      allowNull: true,
      field: 'finish_code'
    },
    finishDesc: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: 'finish_desc'
    },
    designCode: {
      type: DataTypes.STRING(30),
      allowNull: true,
      field: 'design_code'
    },
    designDesc: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: 'design_desc'
    },
    topDesignCode: {
      type: DataTypes.STRING(30),
      allowNull: true,
      field: 'top_design_code'
    },
    topDesignDesc: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: 'top_design_desc'
    },
    bottomDesignCode: {
      type: DataTypes.STRING(30),
      allowNull: true,
      field: 'bottom_design_code'
    },
    bottomDesignDesc: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: 'bottom_design_desc'
    },
    grossWeight: {
      type: DataTypes.DOUBLE,
      allowNull: false,
      defaultValue: 0,
      field: 'gross_weight'
    },
    netWeight: {
      type: DataTypes.DOUBLE,
      allowNull: false,
      defaultValue: 0,
      field: 'net_weight'
    },
    weightUnit: {
      type: DataTypes.STRING(10),
      allowNull: true,
      field: 'weight_unit'
    },
    volume: {
      type: DataTypes.DOUBLE,
      allowNull: false,
      defaultValue: 0
    },
    volumeUnit: {
      type: DataTypes.STRING(10),
      allowNull: true,
      field: 'volume_unit'
    },
    baseUom: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: 'base_uom'
    },
    altUom: {
      type: DataTypes.STRING(10),
      allowNull: true,
      field: 'alt_uom'
    },
    materialCounter: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: 'material_counter'
    },
    materialDenominator: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: 'material_denominator'
    },
    saleUnit: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: 'sale_unit'
    },
    displayUnit: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: 'display_unit'
    },
    calculationUnit: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: 'calculation_unit'
    },
    minQuantitySale: {
      type: DataTypes.DOUBLE,
      allowNull: false,
      defaultValue: 0,
      field: 'min_quantity_sale'
    },
    acctAssignmentGrp: {
      type: DataTypes.STRING(10),
      allowNull: true,
      field: 'acct_assignment_grp'
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
      allowNull: false,
      field: 'updated_by_text'
    }
  });
  modelBuilder.configureOptions(false, false, 'material', 'fundflo_oms_inventory', {});
  return modelBuilder;
}

Material.init(
  defineModel().getModel(),
  defineModel().getOptions()
);

module.exports = Material;