import { DataTypes, Model } from "sequelize";
import { sequelize } from "../../config/db";

class Module extends Model {
  public id!: string;
  public module_code!: string;
  public module_name!: string;
  public is_active!: boolean;
}

Module.init(
  {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    module_code: { type: DataTypes.STRING(20), allowNull: false, unique: true },
    module_name: { type: DataTypes.STRING(255), allowNull: false },
    is_active: { type: DataTypes.BOOLEAN, defaultValue: false },
  },
  { sequelize, modelName: "Module", tableName: "modules", timestamps: true }
);

export default Module;