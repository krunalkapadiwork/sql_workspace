import { Model, DataTypes, Optional } from 'sequelize';
import { sequelize } from '../config/database';

export interface DesignationPermissionAttributes {
  id: string;
  designationId: string;
  permissionId: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export type DesignationPermissionCreationAttributes = Optional<
  DesignationPermissionAttributes,
  'id' | 'createdAt' | 'updatedAt'
>;

export class DesignationPermission
  extends Model<DesignationPermissionAttributes, DesignationPermissionCreationAttributes>
  implements DesignationPermissionAttributes
{
  declare id: string;
  declare designationId: string;
  declare permissionId: string;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

DesignationPermission.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      allowNull: false,
    },
    designationId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: 'designation_id',
    },
    permissionId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: 'permission_id',
    },
  },
  {
    sequelize,
    tableName: 'designation_permissions',
    timestamps: true,
    underscored: true,
  },
);

