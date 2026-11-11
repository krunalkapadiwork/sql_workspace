import { Model, DataTypes, Optional } from 'sequelize';
import { sequelize } from '../config/database';
import { User } from './user.model';
import { Project } from './project.model';
import { Permission } from './permission.model';

export interface ProjectMemberAttributes {
  id: string;
  projectId: string;
  userId: string;
  addedBy: string;
  deletedAt?: Date | null;
  createdAt?: Date;
  updatedAt?: Date;
}

export type ProjectMemberCreationAttributes = Optional<
  ProjectMemberAttributes,
  'id' | 'deletedAt' | 'createdAt' | 'updatedAt'
>;

export class ProjectMember
  extends Model<ProjectMemberAttributes, ProjectMemberCreationAttributes>
  implements ProjectMemberAttributes
{
  declare id: string;
  declare projectId: string;
  declare userId: string;
  declare addedBy: string;
  declare readonly deletedAt: Date | null;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;

  declare readonly project?: Project;
  declare readonly user?: User;
  declare readonly adder?: User;
  declare readonly permissions?: Permission[];
}

ProjectMember.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      allowNull: false,
    },
    projectId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: 'project_id',
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: 'user_id',
    },
    addedBy: {
      type: DataTypes.UUID,
      allowNull: false,
      field: 'added_by',
    },
  },
  {
    sequelize,
    tableName: 'project_members',
    timestamps: true,
    paranoid: true,
    underscored: true,
  },
);

