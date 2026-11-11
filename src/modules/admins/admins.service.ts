

import { sequelize } from '../../config/database';
import { User, Role, Designation } from '../../models';
import { ConflictError, NotFoundError, ValidationError } from '../../common/errors';
import { invitationService } from '../invitations/invitations.service';
import { revokeAllUserSessions } from '../../common/utils/tokens';
import { redis } from '../../config/redis';
import { AuthenticatedUser } from '../../common/types';
import { CreateAdminInput, UpdateAdminInput } from './admins.schema';

const DEFAULT_DESIGNATIONS = [
  { name: 'Project Manager', description: 'Leads project planning and execution' },
  { name: 'Project Coordinator', description: 'Coordinates project activities and communications' },
  { name: 'Developer', description: 'Implements software features and bug fixes' },
  { name: 'QA Engineer', description: 'Quality assurance and software testing' },
];

export class AdminsService {
  public async createAdmin(
    input: CreateAdminInput,
    currentUser: AuthenticatedUser,
  ): Promise<User> {
    const existing = await User.findOne({
      where: { email: input.email },
      paranoid: false, // Check even soft-deleted users (BR-7, BR-12)
    });

    if (existing) {
      throw new ConflictError('A user with this email address already exists');
    }

    const adminRole = await Role.findOne({ where: { name: 'ADMIN' } });
    if (!adminRole) {
      throw new Error('ADMIN role not found');
    }

    let createdAdmin: User;

    await sequelize.transaction(async (t) => {
      createdAdmin = await User.create(
        {
          email: input.email,
          firstName: input.firstName,
          lastName: input.lastName,
          roleId: adminRole.id,
          adminId: null,
          status: 'INVITED',
        },
        { transaction: t },
      );

      // Seed 4 default designations for this new Admin workspace (BR-13, D15)
      for (const d of DEFAULT_DESIGNATIONS) {
        await Designation.create(
          {
            adminId: createdAdmin.id,
            name: d.name,
            description: d.description,
          },
          { transaction: t },
        );
      }
    });

    // Issue invitation after transaction commits (BR-33)
    await invitationService.issueInvitation(createdAdmin!, currentUser, 'Admin');

    return createdAdmin!;
  }

  public async listAdmins(options: { page?: number; limit?: number }): Promise<{
    rows: User[];
    total: number;
  }> {
    const page = Math.max(1, options.page || 1);
    const limit = Math.min(100, Math.max(1, options.limit || 20));
    const offset = (page - 1) * limit;

    const adminRole = await Role.findOne({ where: { name: 'ADMIN' } });
    if (!adminRole) return { rows: [], total: 0 };

    const { rows, count } = await User.findAndCountAll({
      where: { roleId: adminRole.id },
      attributes: { exclude: ['passwordHash'] },
      order: [['createdAt', 'DESC']],
      limit,
      offset,
    });

    return { rows, total: count };
  }

  public async getAdminById(id: string): Promise<User> {
    const adminRole = await Role.findOne({ where: { name: 'ADMIN' } });
    const admin = await User.findOne({
      where: { id, roleId: adminRole?.id },
      attributes: { exclude: ['passwordHash'] },
      include: [{ model: Designation, as: 'designations' }],
    });

    if (!admin) {
      throw new NotFoundError('Admin not found');
    }

    return admin;
  }

  public async updateAdmin(id: string, input: UpdateAdminInput): Promise<User> {
    const admin = await this.getAdminById(id);

    await admin.update({
      ...(input.firstName ? { firstName: input.firstName } : {}),
      ...(input.lastName ? { lastName: input.lastName } : {}),
    });

    return admin;
  }

  public async activateAdmin(id: string): Promise<void> {
    const admin = await this.getAdminById(id);
    await admin.update({ status: 'ACTIVE' });

    // Invalidate status cache in Redis
    await redis.del(`user_status:${admin.id}`);
  }

  public async deactivateAdmin(id: string): Promise<void> {
    const admin = await this.getAdminById(id);
    await admin.update({ status: 'INACTIVE' });

    // Cascade: Revoke sessions for Admin and all users in their workspace (BR-9, D13)
    await revokeAllUserSessions(admin.id);

    const workspaceUsers = await User.findAll({
      where: { adminId: admin.id },
      attributes: ['id'],
    });

    for (const u of workspaceUsers) {
      await revokeAllUserSessions(u.id);
    }
  }

  public async deleteAdmin(id: string): Promise<void> {
    const admin = await this.getAdminById(id);

    if (admin.role?.name === 'SUPER_ADMIN') {
      throw new ValidationError('Cannot delete Super Admin account');
    }

    // Cascade session revoking
    await this.deactivateAdmin(id);

    // Soft delete (BR-11, D14)
    await admin.destroy();
  }
}

export const adminsService = new AdminsService();
