import { Model, DataTypes, Optional } from 'sequelize';
import { sequelize } from '../config/database';
import { User } from './user.model';
import { Permission } from './permission.model';

export interface DesignationAttributes {
  id: string;
  adminId: string;
  name: string;
  description?: string | null;
  deletedAt?: Date | null;
  createdAt?: Date;
  updatedAt?: Date;
}

export type DesignationCreationAttributes = Optional<
  DesignationAttributes,
  'id' | 'description' | 'deletedAt' | 'createdAt' | 'updatedAt'
>;

export class Designation
  extends Model<DesignationAttributes, DesignationCreationAttributes>
  implements DesignationAttributes
{
  declare id: string;
  declare adminId: string;
  declare name: string;
  declare description: string | null;
  declare readonly deletedAt: Date | null;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;

  declare readonly admin?: User;
  declare readonly users?: User[];
  declare readonly permissions?: Permission[];
}

Designation.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      allowNull: false,
    },
    adminId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: 'admin_id',
    },
    name: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    description: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
  },
  {
    sequelize,
    tableName: 'designations',
    timestamps: true,
    paranoid: true,
    underscored: true,
  },
);

