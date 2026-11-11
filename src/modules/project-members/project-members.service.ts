import { sequelize } from '../../config/database';
import {
  Project,
  ProjectMember,
  ProjectMemberPermission,
  Permission,
  User,
  Designation,
} from '../../models';
import {
  ConflictError,
  ForbiddenError,
  NotFoundError,
  ValidationError,
} from '../../common/errors';
import { AuthenticatedUser } from '../../common/types';
import { invalidateProjectPermissionCache } from '../../common/middleware/permission-guard';
import { AddProjectMemberInput, UpdateMemberPermissionsInput } from './project-members.schema';

export class ProjectMembersService {
  /**
   * Helper: fetches caller's granted permissions on a project
   */
  private async getCallerProjectPermissions(
    projectId: string,
    caller: AuthenticatedUser,
  ): Promise<string[]> {
    if (caller.role === 'SUPER_ADMIN' || caller.role === 'ADMIN') {
      const all = await Permission.findAll({ attributes: ['id'] });
      return all.map((p) => p.id);
    }

    const membership = await ProjectMember.findOne({
      where: { projectId, userId: caller.id },
      include: [{ model: Permission, as: 'permissions', attributes: ['id'] }],
    });

    if (!membership) return [];
    return (membership.permissions || []).map((p) => p.id);
  }

  public async listMembers(
    projectId: string,
    currentUser: AuthenticatedUser,
  ): Promise<ProjectMember[]> {
    // Project tenant check
    const project = await Project.findByPk(projectId);
    if (!project) throw new NotFoundError('Project not found');

    if (currentUser.role === 'ADMIN' && project.adminId !== currentUser.id) {
      throw new NotFoundError('Project not found');
    }
    if (currentUser.role === 'USER' && project.adminId !== currentUser.adminId) {
      throw new NotFoundError('Project not found');
    }

    return ProjectMember.findAll({
      where: { projectId },
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'email', 'firstName', 'lastName'],
          include: [{ model: Designation, as: 'designation', attributes: ['id', 'name'] }],
        },
        {
          model: Permission,
          as: 'permissions',
          through: { attributes: [] },
          attributes: ['id', 'action', 'module'],
        },
      ],
      order: [['createdAt', 'ASC']],
    });
  }

  public async addMember(
    projectId: string,
    input: AddProjectMemberInput,
    currentUser: AuthenticatedUser,
  ): Promise<ProjectMember> {
    const project = await Project.findByPk(projectId);
    if (!project) throw new NotFoundError('Project not found');

    // Tenant check
    if (currentUser.role === 'ADMIN' && project.adminId !== currentUser.id) {
      throw new NotFoundError('Project not found');
    }
    if (currentUser.role === 'USER' && project.adminId !== currentUser.adminId) {
      throw new NotFoundError('Project not found');
    }

    // Admins implicitly have full access and are not added as project members (BR-23, D24)
    if (input.userId === project.adminId) {
      throw new ValidationError(
        'Workspace Admin already has full access and cannot be added as a project member',
      );
    }

    // Verify user exists, belongs to same workspace, and is active (BR-28, BR-32)
    const targetUser = await User.findOne({
      where: { id: input.userId, adminId: project.adminId, status: 'ACTIVE' },
      include: [
        {
          model: Designation,
          as: 'designation',
          include: [{ model: Permission, as: 'permissions', attributes: ['id'] }],
        },
      ],
    });

    if (!targetUser) {
      throw new NotFoundError('Active user not found in this workspace');
    }

    // Check if already a member
    const existing = await ProjectMember.findOne({
      where: { projectId, userId: input.userId },
    });
    if (existing) {
      throw new ConflictError('User is already a member of this project');
    }

    // Caller permission check: Must be Admin, Super Admin, or have MANAGE_MEMBERS
    const callerPermIds = await this.getCallerProjectPermissions(projectId, currentUser);
    const manageMembersPerm = await Permission.findOne({ where: { action: 'MANAGE_MEMBERS' } });

    if (
      currentUser.role === 'USER' &&
      (!manageMembersPerm || !callerPermIds.includes(manageMembersPerm.id))
    ) {
      throw new ForbiddenError('You do not have permission to manage members in this project');
    }

    // Resolve permissions to grant
    const readPerm = await Permission.findOne({ where: { action: 'READ' } });
    if (!readPerm) throw new Error('READ permission not found');

    let permissionIdsToGrant: string[] = [];

    if (input.permissionIds && input.permissionIds.length > 0) {
      // Custom overrides provided (BR-27)
      permissionIdsToGrant = input.permissionIds;

      // Escalation check (BR-29, D7): Non-admin can only grant permissions they hold
      if (currentUser.role === 'USER') {
        const hasUnheldPerms = permissionIdsToGrant.some((id) => !callerPermIds.includes(id));
        if (hasUnheldPerms) {
          throw new ForbiddenError('Cannot grant permissions that you do not hold yourself');
        }
      }
    } else {
      // Copy defaults from designation template (BR-27, D5, BR-18)
      const designationPerms = targetUser.designation?.permissions || [];
      permissionIdsToGrant = designationPerms.map((p: Permission) => p.id);

      // If caller is non-admin, filter by caller permissions (BR-29)
      if (currentUser.role === 'USER') {
        permissionIdsToGrant = permissionIdsToGrant.filter((id) => callerPermIds.includes(id));
      }
    }

    // READ is always granted (BR-25)
    if (!permissionIdsToGrant.includes(readPerm.id)) {
      permissionIdsToGrant.push(readPerm.id);
    }

    let createdMember: ProjectMember;

    await sequelize.transaction(async (t) => {
      createdMember = await ProjectMember.create(
        {
          projectId,
          userId: input.userId,
          addedBy: currentUser.id,
        },
        { transaction: t },
      );

      const grantRecords = permissionIdsToGrant.map((permId) => ({
        projectMemberId: createdMember.id,
        permissionId: permId,
      }));

      await ProjectMemberPermission.bulkCreate(grantRecords, { transaction: t });
    });

    // Invalidate Redis cache for user permissions in this project
    await invalidateProjectPermissionCache(projectId, input.userId);

    return createdMember!;
  }

  public async updateMemberPermissions(
    projectId: string,
    memberId: string,
    input: UpdateMemberPermissionsInput,
    currentUser: AuthenticatedUser,
  ): Promise<void> {
    const member = await ProjectMember.findOne({
      where: { id: memberId, projectId },
      include: [{ model: Permission, as: 'permissions', attributes: ['id'] }],
    });

    if (!member) throw new NotFoundError('Project member not found');

    // Escalation limits (BR-29):
    // 1. Cannot change own permissions
    if (member.userId === currentUser.id) {
      throw new ForbiddenError('Cannot modify your own project permissions');
    }

    const callerPermIds = await this.getCallerProjectPermissions(projectId, currentUser);
    const manageMembersPerm = await Permission.findOne({ where: { action: 'MANAGE_MEMBERS' } });

    if (
      currentUser.role === 'USER' &&
      (!manageMembersPerm || !callerPermIds.includes(manageMembersPerm.id))
    ) {
      throw new ForbiddenError('You do not have permission to manage members in this project');
    }

    if (currentUser.role === 'USER') {
      // 2. Cannot modify a member who holds a permission the caller does not have
      const targetCurrentPermIds = (member.permissions || []).map((p) => p.id);
      const targetHasHigherPerms = targetCurrentPermIds.some((id) => !callerPermIds.includes(id));
      if (targetHasHigherPerms) {
        throw new ForbiddenError(
          'Cannot modify permissions of a member who holds permissions you do not have',
        );
      }

      // 3. Can only grant permissions the caller holds
      const grantingUnheld = input.permissionIds.some((id) => !callerPermIds.includes(id));
      if (grantingUnheld) {
        throw new ForbiddenError('Cannot grant permissions that you do not hold yourself');
      }
    }

    // Always ensure READ is granted (BR-25)
    const readPerm = await Permission.findOne({ where: { action: 'READ' } });
    if (readPerm && !input.permissionIds.includes(readPerm.id)) {
      input.permissionIds.push(readPerm.id);
    }

    await sequelize.transaction(async (t) => {
      await ProjectMemberPermission.destroy({
        where: { projectMemberId: member.id },
        transaction: t,
      });

      const records = input.permissionIds.map((permId) => ({
        projectMemberId: member.id,
        permissionId: permId,
      }));

      await ProjectMemberPermission.bulkCreate(records, { transaction: t });
    });

    await invalidateProjectPermissionCache(projectId, member.userId);
  }

  public async removeMember(
    projectId: string,
    memberId: string,
    currentUser: AuthenticatedUser,
  ): Promise<void> {
    const member = await ProjectMember.findOne({
      where: { id: memberId, projectId },
      include: [{ model: Permission, as: 'permissions', attributes: ['id'] }],
    });

    if (!member) throw new NotFoundError('Project member not found');

    // Escalation limits (BR-29):
    // 1. Cannot remove self
    if (member.userId === currentUser.id) {
      throw new ForbiddenError('Cannot remove yourself from the project');
    }

    if (currentUser.role === 'USER') {
      const callerPermIds = await this.getCallerProjectPermissions(projectId, currentUser);
      const manageMembersPerm = await Permission.findOne({ where: { action: 'MANAGE_MEMBERS' } });

      if (!manageMembersPerm || !callerPermIds.includes(manageMembersPerm.id)) {
        throw new ForbiddenError('You do not have permission to manage members in this project');
      }

      // 2. Cannot remove a member who holds a permission the caller does not have
      const targetCurrentPermIds = (member.permissions || []).map((p) => p.id);
      const targetHasHigher = targetCurrentPermIds.some((id) => !callerPermIds.includes(id));
      if (targetHasHigher) {
        throw new ForbiddenError(
          'Cannot remove a member who holds permissions that you do not have',
        );
      }
    }

    await member.destroy(); // Soft delete (paranoid)
    await invalidateProjectPermissionCache(projectId, member.userId);
  }
}

export const projectMembersService = new ProjectMembersService();
