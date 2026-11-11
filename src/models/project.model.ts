import { Model, DataTypes, Optional } from 'sequelize';
import { sequelize } from '../config/database';
import { User } from './user.model';
import { ProjectMember } from './project-member.model';

export type ProjectStatus = 'ACTIVE' | 'ARCHIVED';

export interface ProjectAttributes {
  id: string;
  adminId: string;
  name: string;
  description?: string | null;
  status: ProjectStatus;
  startDate?: string | null;
  endDate?: string | null;
  deletedAt?: Date | null;
  createdAt?: Date;
  updatedAt?: Date;
}

export type ProjectCreationAttributes = Optional<
  ProjectAttributes,
  'id' | 'description' | 'status' | 'startDate' | 'endDate' | 'deletedAt' | 'createdAt' | 'updatedAt'
>;

export class Project
  extends Model<ProjectAttributes, ProjectCreationAttributes>
  implements ProjectAttributes
{
  declare id: string;
  declare adminId: string;
  declare name: string;
  declare description: string | null;
  declare status: ProjectStatus;
  declare startDate: string | null;
  declare endDate: string | null;
  declare readonly deletedAt: Date | null;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;

  declare readonly admin?: User;
  declare readonly members?: ProjectMember[];
}

Project.init(
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
      type: DataTypes.TEXT,
      allowNull: true,
    },
    status: {
      type: DataTypes.STRING(20),
      allowNull: false,
      defaultValue: 'ACTIVE',
    },
    startDate: {
      type: DataTypes.DATEONLY,
      allowNull: true,
      field: 'start_date',
    },
    endDate: {
      type: DataTypes.DATEONLY,
      allowNull: true,
      field: 'end_date',
    },
  },
  {
    sequelize,
    tableName: 'projects',
    timestamps: true,
    paranoid: true,
    underscored: true,
  },
);

