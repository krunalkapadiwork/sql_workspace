import { Model, DataTypes, Optional } from 'sequelize';
import { sequelize } from '../config/database';

export type PermissionAction = 'READ' | 'CREATE' | 'UPDATE' | 'DELETE' | 'MANAGE_MEMBERS';

export interface PermissionAttributes {
  id: string;
  module: string | null;
  action: PermissionAction;
  createdAt?: Date;
  updatedAt?: Date;
}

export type PermissionCreationAttributes = Optional<
  PermissionAttributes,
  'id' | 'module' | 'createdAt' | 'updatedAt'
>;

export class Permission
  extends Model<PermissionAttributes, PermissionCreationAttributes>
  implements PermissionAttributes
{
  declare id: string;
  declare module: string | null;
  declare action: PermissionAction;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

Permission.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      allowNull: false,
    },
    module: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    action: {
      type: DataTypes.STRING(50),
      allowNull: false,
    },
  },
  {
    sequelize,
    tableName: 'permissions',
    timestamps: true,
    underscored: true,
  },
);
