import { User, Role, Designation, ProjectMember } from '../../models';
import { ConflictError, NotFoundError, ValidationError } from '../../common/errors';
import { invitationService } from '../invitations/invitations.service';
import { revokeAllUserSessions } from '../../common/utils/tokens';
import { redis } from '../../config/redis';
import { AuthenticatedUser } from '../../common/types';
import { CreateUserInput, UpdateUserInput } from './users.schema';

export class UsersService {
  private resolveAdminId(currentUser: AuthenticatedUser, queryAdminId?: string): string {
    if (currentUser.role === 'SUPER_ADMIN') {
      if (!queryAdminId) {
        throw new ValidationError('adminId query parameter is required for Super Admin');
      }
      return queryAdminId;
    }
    return currentUser.id;
  }

  public async createUser(
    input: CreateUserInput,
    currentUser: AuthenticatedUser,
    queryAdminId?: string,
  ): Promise<User> {
    const adminId = this.resolveAdminId(currentUser, queryAdminId);

    // Global case-insensitive email uniqueness (BR-7, BR-12, D12)
    const existing = await User.findOne({
      where: { email: input.email },
      paranoid: false,
    });

    if (existing) {
      throw new ConflictError('A user with this email address already exists');
    }

    // Verify designation exists in this Admin's workspace (BR-15, D17)
    const designation = await Designation.findOne({
      where: { id: input.designationId, adminId },
    });

    if (!designation) {
      throw new ValidationError('Selected designation does not exist in this workspace');
    }

    const userRole = await Role.findOne({ where: { name: 'USER' } });
    if (!userRole) {
      throw new Error('USER role not found');
    }

    const createdUser = await User.create({
      email: input.email,
      firstName: input.firstName,
      lastName: input.lastName,
      roleId: userRole.id, // Always USER role (BR-6, D4)
      adminId,
      designationId: input.designationId,
      status: 'INVITED',
    });

    // Send invitation email
    await invitationService.issueInvitation(createdUser, currentUser, designation.name);

    return createdUser;
  }

  public async listUsers(
    currentUser: AuthenticatedUser,
    options: { page?: number; limit?: number },
    queryAdminId?: string,
  ): Promise<{ rows: User[]; total: number }> {
    const adminId = this.resolveAdminId(currentUser, queryAdminId);
    const page = Math.max(1, options.page || 1);
    const limit = Math.min(100, Math.max(1, options.limit || 20));
    const offset = (page - 1) * limit;

    const { rows, count } = await User.findAndCountAll({
      where: { adminId },
      attributes: { exclude: ['passwordHash'] },
      include: [
        { model: Role, as: 'role', attributes: ['id', 'name'] },
        { model: Designation, as: 'designation', attributes: ['id', 'name'] },
      ],
      order: [['createdAt', 'DESC']],
      limit,
      offset,
    });

    return { rows, total: count };
  }

  public async getUserById(
    id: string,
    currentUser: AuthenticatedUser,
    queryAdminId?: string,
  ): Promise<User> {
    const adminId = this.resolveAdminId(currentUser, queryAdminId);

    const user = await User.findOne({
      where: { id, adminId },
      attributes: { exclude: ['passwordHash'] },
      include: [
        { model: Role, as: 'role', attributes: ['id', 'name'] },
        { model: Designation, as: 'designation', attributes: ['id', 'name'] },
      ],
    });

    if (!user) {
      throw new NotFoundError('User not found');
    }

    return user;
  }

  public async updateUser(
    id: string,
    input: UpdateUserInput,
    currentUser: AuthenticatedUser,
    queryAdminId?: string,
  ): Promise<User> {
    const user = await this.getUserById(id, currentUser, queryAdminId);

    if (input.designationId && input.designationId !== user.designationId) {
      const designation = await Designation.findOne({
        where: { id: input.designationId, adminId: user.adminId! },
      });
      if (!designation) {
        throw new ValidationError('Selected designation does not exist in this workspace');
      }
    }

    await user.update({
      ...(input.firstName ? { firstName: input.firstName } : {}),
      ...(input.lastName ? { lastName: input.lastName } : {}),
      ...(input.designationId ? { designationId: input.designationId } : {}),
    });

    return user;
  }

  public async activateUser(
    id: string,
    currentUser: AuthenticatedUser,
    queryAdminId?: string,
  ): Promise<void> {
    const user = await this.getUserById(id, currentUser, queryAdminId);
    await user.update({ status: 'ACTIVE' });
    await redis.del(`user_status:${user.id}`);
  }

  public async deactivateUser(
    id: string,
    currentUser: AuthenticatedUser,
    queryAdminId?: string,
  ): Promise<void> {
    const user = await this.getUserById(id, currentUser, queryAdminId);
    await user.update({ status: 'INACTIVE' });
    await revokeAllUserSessions(user.id);
  }

  public async deleteUser(
    id: string,
    currentUser: AuthenticatedUser,
    queryAdminId?: string,
  ): Promise<void> {
    const user = await this.getUserById(id, currentUser, queryAdminId);

    // Revoke sessions
    await revokeAllUserSessions(user.id);

    // Remove user from all projects (BR-32)
    await ProjectMember.destroy({
      where: { userId: user.id },
    });

    // Soft delete user (BR-11, D14)
    await user.destroy();
  }
}

export const usersService = new UsersService();

