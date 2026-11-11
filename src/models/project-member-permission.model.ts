import { Model, DataTypes, Optional } from 'sequelize';
import { sequelize } from '../config/database';

export interface ProjectMemberPermissionAttributes {
  id: string;
  projectMemberId: string;
  permissionId: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export type ProjectMemberPermissionCreationAttributes = Optional<
  ProjectMemberPermissionAttributes,
  'id' | 'createdAt' | 'updatedAt'
>;

export class ProjectMemberPermission
  extends Model<ProjectMemberPermissionAttributes, ProjectMemberPermissionCreationAttributes>
  implements ProjectMemberPermissionAttributes
{
  declare id: string;
  declare projectMemberId: string;
  declare permissionId: string;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

ProjectMemberPermission.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      allowNull: false,
    },
    projectMemberId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: 'project_member_id',
    },
    permissionId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: 'permission_id',
    },
  },
  {
    sequelize,
    tableName: 'project_member_permissions',
    timestamps: true,
    underscored: true,
  },
);

