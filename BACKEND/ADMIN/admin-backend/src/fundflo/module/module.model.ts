import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../../config/db';
import { v4 as uuidv4 } from 'uuid';

class Module extends Model {
  public id!: string;
  public module_code!: string;
  public module_name!: string;
  public is_active!: boolean;
  public in_mobile!: boolean;
  public in_web!: boolean;
  public updated_date!: Date;
  public updated_by_text!: string | null;
}

Module.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: uuidv4,
      primaryKey: true,
      allowNull: false,
    },
    module_code: {
      type: DataTypes.STRING(20),
      allowNull: false,
      unique: true,
      validate: {
        isIn: [['AR', 'DMS', 'AP', 'NOTIFICATION', 'CF', 'ADMIN']],
      },
    },
    module_name: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    in_mobile: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
    in_web: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
    updated_date: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
    updated_by_text: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
  },
  {
    sequelize,
    tableName: 'modules',
    timestamps: false,
  }
);

export default Module;
