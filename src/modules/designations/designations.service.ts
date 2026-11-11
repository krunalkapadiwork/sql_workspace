import { Op } from 'sequelize';
import { sequelize } from '../../config/database';
import { Designation, DesignationPermission, Permission, User } from '../../models';
import { ConflictError, NotFoundError, ValidationError } from '../../common/errors';
import { AuthenticatedUser } from '../../common/types';
import {
  CreateDesignationInput,
  UpdateDesignationInput,
  SetDesignationPermissionsInput,
} from './designations.schema';

export class DesignationsService {
  private resolveAdminId(currentUser: AuthenticatedUser, queryAdminId?: string): string {
    if (currentUser.role === 'SUPER_ADMIN') {
      if (!queryAdminId) {
        throw new ValidationError('adminId query parameter is required for Super Admin');
      }
      return queryAdminId;
    }
    return currentUser.id;
  }

  public async createDesignation(
    input: CreateDesignationInput,
    currentUser: AuthenticatedUser,
    queryAdminId?: string,
  ): Promise<Designation> {
    const adminId = this.resolveAdminId(currentUser, queryAdminId);

    // Case-insensitive name uniqueness within workspace (BR-14)
    const existing = await Designation.findOne({
      where: {
        adminId,
        [Op.and]: sequelize.where(
          sequelize.fn('lower', sequelize.col('name')),
          input.name.toLowerCase(),
        ),
      },
    });

    if (existing) {
      throw new ConflictError(`Designation '${input.name}' already exists in this workspace`);
    }

    return Designation.create({
      adminId,
      name: input.name,
      description: input.description,
    });
  }

  public async listDesignations(
    currentUser: AuthenticatedUser,
    queryAdminId?: string,
  ): Promise<Designation[]> {
    const adminId = this.resolveAdminId(currentUser, queryAdminId);

    return Designation.findAll({
      where: { adminId },
      include: [
        {
          model: Permission,
          as: 'permissions',
          through: { attributes: [] },
          attributes: ['id', 'action', 'module'],
        },
      ],
      order: [['name', 'ASC']],
    });
  }

  public async getDesignationById(
    id: string,
    currentUser: AuthenticatedUser,
    queryAdminId?: string,
  ): Promise<Designation> {
    const adminId = this.resolveAdminId(currentUser, queryAdminId);

    const designation = await Designation.findOne({
      where: { id, adminId },
      include: [
        {
          model: Permission,
          as: 'permissions',
          through: { attributes: [] },
          attributes: ['id', 'action', 'module'],
        },
      ],
    });

    if (!designation) {
      throw new NotFoundError('Designation not found');
    }

    return designation;
  }

  public async updateDesignation(
    id: string,
    input: UpdateDesignationInput,
    currentUser: AuthenticatedUser,
    queryAdminId?: string,
  ): Promise<Designation> {
    const designation = await this.getDesignationById(id, currentUser, queryAdminId);

    if (input.name && input.name.toLowerCase() !== designation.name.toLowerCase()) {
      const existing = await Designation.findOne({
        where: {
          adminId: designation.adminId,
          id: { [Op.ne]: designation.id },
          [Op.and]: sequelize.where(
            sequelize.fn('lower', sequelize.col('name')),
            input.name.toLowerCase(),
          ),
        },
      });

      if (existing) {
        throw new ConflictError(`Designation '${input.name}' already exists in this workspace`);
      }
    }

    await designation.update({
      ...(input.name ? { name: input.name } : {}),
      ...(input.description !== undefined ? { description: input.description } : {}),
    });

    return designation;
  }

  public async deleteDesignation(
    id: string,
    currentUser: AuthenticatedUser,
    queryAdminId?: string,
  ): Promise<void> {
    const designation = await this.getDesignationById(id, currentUser, queryAdminId);

    // Block deletion while users are assigned to it (BR-16, D16)
    const assignedUsersCount = await User.count({
      where: { designationId: id },
    });

    if (assignedUsersCount > 0) {
      throw new ConflictError(
        `Cannot delete designation because ${assignedUsersCount} user(s) are currently assigned to it. Reassign users first.`,
      );
    }

    await designation.destroy();
  }

  public async setDesignationPermissions(
    id: string,
    input: SetDesignationPermissionsInput,
    currentUser: AuthenticatedUser,
    queryAdminId?: string,
  ): Promise<void> {
    const designation = await this.getDesignationById(id, currentUser, queryAdminId);

    // Verify all permission IDs exist
    const validPermissions = await Permission.findAll({
      where: { id: input.permissionIds },
      attributes: ['id'],
    });

    if (validPermissions.length !== input.permissionIds.length) {
      throw new ValidationError('One or more permission IDs are invalid');
    }

    await sequelize.transaction(async (t) => {
      // Clear existing default template
      await DesignationPermission.destroy({
        where: { designationId: designation.id },
        transaction: t,
      });

      // Insert new defaults (BR-17, BR-18)
      const records = input.permissionIds.map((permId) => ({
        designationId: designation.id,
        permissionId: permId,
      }));

      await DesignationPermission.bulkCreate(records, { transaction: t });
    });
  }
}

export const designationsService = new DesignationsService();

