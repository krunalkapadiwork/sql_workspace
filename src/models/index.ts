import { sequelize } from '../config/database';
import { Role } from './role.model';
import { Permission } from './permission.model';
import { User } from './user.model';
import { Designation } from './designation.model';
import { DesignationPermission } from './designation-permission.model';
import { Project } from './project.model';
import { ProjectMember } from './project-member.model';
import { ProjectMemberPermission } from './project-member-permission.model';
import { Invitation } from './invitation.model';

let initialized = false;

/**
 * Centralized Models Registry (D25)
 * Initializes model definitions and sets up relationships.
 */
export const initModels = (): void => {
  if (initialized) return;

  // Role <-> User
  Role.hasMany(User, { foreignKey: 'roleId', as: 'users' });
  User.belongsTo(Role, { foreignKey: 'roleId', as: 'role' });

  // Self-referencing Admin <-> User
  User.hasMany(User, { foreignKey: 'adminId', as: 'managedUsers' });
  User.belongsTo(User, { foreignKey: 'adminId', as: 'admin' });

  // Designation <-> User
  Designation.hasMany(User, { foreignKey: 'designationId', as: 'users' });
  User.belongsTo(Designation, { foreignKey: 'designationId', as: 'designation' });

  // Admin <-> Designation
  User.hasMany(Designation, { foreignKey: 'adminId', as: 'designations' });
  Designation.belongsTo(User, { foreignKey: 'adminId', as: 'admin' });

  // Designation <-> Permission (many-to-many template)
  Designation.belongsToMany(Permission, {
    through: DesignationPermission,
    foreignKey: 'designationId',
    otherKey: 'permissionId',
    as: 'permissions',
  });
  Permission.belongsToMany(Designation, {
    through: DesignationPermission,
    foreignKey: 'permissionId',
    otherKey: 'designationId',
    as: 'designations',
  });

  // Admin <-> Project
  User.hasMany(Project, { foreignKey: 'adminId', as: 'projects' });
  Project.belongsTo(User, { foreignKey: 'adminId', as: 'admin' });

  // Project <-> ProjectMember
  Project.hasMany(ProjectMember, { foreignKey: 'projectId', as: 'members' });
  ProjectMember.belongsTo(Project, { foreignKey: 'projectId', as: 'project' });

  // User <-> ProjectMember
  User.hasMany(ProjectMember, { foreignKey: 'userId', as: 'projectMemberships' });
  ProjectMember.belongsTo(User, { foreignKey: 'userId', as: 'user' });
  ProjectMember.belongsTo(User, { foreignKey: 'addedBy', as: 'adder' });

  // ProjectMember <-> Permission (many-to-many grants)
  ProjectMember.belongsToMany(Permission, {
    through: ProjectMemberPermission,
    foreignKey: 'projectMemberId',
    otherKey: 'permissionId',
    as: 'permissions',
  });
  Permission.belongsToMany(ProjectMember, {
    through: ProjectMemberPermission,
    foreignKey: 'permissionId',
    otherKey: 'projectMemberId',
    as: 'projectMembers',
  });

  // User <-> Invitation
  User.hasMany(Invitation, { foreignKey: 'userId', as: 'invitations' });
  Invitation.belongsTo(User, { foreignKey: 'userId', as: 'user' });

  User.hasMany(Invitation, { foreignKey: 'invitedBy', as: 'sentInvitations' });
  Invitation.belongsTo(User, { foreignKey: 'invitedBy', as: 'inviter' });

  initialized = true;
};

// Initialize models and associations automatically on import
initModels();

export {
  sequelize,
  Role,
  Permission,
  User,
  Designation,
  DesignationPermission,
  Project,
  ProjectMember,
  ProjectMemberPermission,
  Invitation,
};
