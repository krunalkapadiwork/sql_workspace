import { Model, DataTypes, Optional } from 'sequelize';
import { sequelize } from '../config/database';

export type SystemRole = 'SUPER_ADMIN' | 'ADMIN' | 'USER';

export interface RoleAttributes {
  id: string;
  name: SystemRole;
  createdAt?: Date;
  updatedAt?: Date;
}

export type RoleCreationAttributes = Optional<RoleAttributes, 'id' | 'createdAt' | 'updatedAt'>;

export class Role extends Model<RoleAttributes, RoleCreationAttributes> implements RoleAttributes {
  declare id: string;
  declare name: SystemRole;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

Role.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      allowNull: false,
    },
    name: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true,
    },
  },
  {
    sequelize,
    tableName: 'roles',
    timestamps: true,
    underscored: true,
  },
);
