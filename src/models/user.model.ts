import { Model, DataTypes, Optional } from 'sequelize';
import { sequelize } from '../config/database';
import { Role } from './role.model';
import type { Designation } from './designation.model';

export type UserStatus = 'INVITED' | 'ACTIVE' | 'INACTIVE';

export interface UserAttributes {
  id: string;
  email: string;
  passwordHash: string | null;
  firstName: string;
  lastName: string;
  roleId: string;
  adminId: string | null;
  designationId: string | null;
  status: UserStatus;
  mustChangePassword: boolean;
  passwordChangedAt: Date | null;
  deletedAt?: Date | null;
  createdAt?: Date;
  updatedAt?: Date;
}

export type UserCreationAttributes = Optional<
  UserAttributes,
  | 'id'
  | 'passwordHash'
  | 'adminId'
  | 'designationId'
  | 'status'
  | 'mustChangePassword'
  | 'passwordChangedAt'
  | 'deletedAt'
  | 'createdAt'
  | 'updatedAt'
>;

export class User extends Model<UserAttributes, UserCreationAttributes> implements UserAttributes {
  declare id: string;
  declare email: string;
  declare passwordHash: string | null;
  declare firstName: string;
  declare lastName: string;
  declare roleId: string;
  declare adminId: string | null;
  declare designationId: string | null;
  declare status: UserStatus;
  declare mustChangePassword: boolean;
  declare passwordChangedAt: Date | null;
  declare readonly deletedAt: Date | null;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;

  // Association mixins / properties
  declare readonly role?: Role;
  declare readonly admin?: User;
  declare readonly managedUsers?: User[];
  declare readonly designation?: Designation;
}

User.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      allowNull: false,
    },
    email: {
      type: 'citext',
      allowNull: false,
      unique: true,
    },
    passwordHash: {
      type: DataTypes.STRING(255),
      allowNull: true,
      field: 'password_hash',
    },
    firstName: {
      type: DataTypes.STRING(100),
      allowNull: false,
      field: 'first_name',
    },
    lastName: {
      type: DataTypes.STRING(100),
      allowNull: false,
      field: 'last_name',
    },
    roleId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: 'role_id',
    },
    adminId: {
      type: DataTypes.UUID,
      allowNull: true,
      field: 'admin_id',
    },
    designationId: {
      type: DataTypes.UUID,
      allowNull: true,
      field: 'designation_id',
    },
    status: {
      type: DataTypes.STRING(20),
      allowNull: false,
      defaultValue: 'INVITED',
    },
    mustChangePassword: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
      field: 'must_change_password',
    },
    passwordChangedAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'password_changed_at',
    },
  },
  {
    sequelize,
    tableName: 'users',
    timestamps: true,
    paranoid: true,
    underscored: true,
  },
);
