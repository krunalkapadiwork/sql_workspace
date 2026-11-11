import { Op } from 'sequelize';
import { sequelize } from '../../config/database';
import { Project, ProjectMember, Permission } from '../../models';
import { ConflictError, NotFoundError, ValidationError, ForbiddenError } from '../../common/errors';
import { AuthenticatedUser } from '../../common/types';
import { CreateProjectInput, UpdateProjectInput } from './projects.schema';

export class ProjectsService {
  private resolveAdminId(currentUser: AuthenticatedUser, queryAdminId?: string): string {
    if (currentUser.role === 'SUPER_ADMIN') {
      if (!queryAdminId) {
        throw new ValidationError('adminId query parameter is required for Super Admin');
      }
      return queryAdminId;
    }
    return currentUser.role === 'ADMIN' ? currentUser.id : currentUser.adminId!;
  }

  public async createProject(
    input: CreateProjectInput,
    currentUser: AuthenticatedUser,
    queryAdminId?: string,
  ): Promise<Project> {
    const adminId = this.resolveAdminId(currentUser, queryAdminId);

    // Case-insensitive name uniqueness within workspace (BR-20)
    const existing = await Project.findOne({
      where: {
        adminId,
        [Op.and]: sequelize.where(
          sequelize.fn('lower', sequelize.col('name')),
          input.name.toLowerCase(),
        ),
      },
    });

    if (existing) {
      throw new ConflictError(`Project '${input.name}' already exists in this workspace`);
    }

    return Project.create({
      adminId,
      name: input.name,
      description: input.description,
      status: input.status,
      startDate: input.startDate || null,
      endDate: input.endDate || null,
    });
  }

  public async listProjects(
    currentUser: AuthenticatedUser,
    options: { page?: number; limit?: number },
    queryAdminId?: string,
  ): Promise<{ rows: Project[]; total: number }> {
    const page = Math.max(1, options.page || 1);
    const limit = Math.min(100, Math.max(1, options.limit || 20));
    const offset = (page - 1) * limit;

    const where: Record<string, unknown> = {};

    if (currentUser.role === 'SUPER_ADMIN') {
      if (queryAdminId) {
        where.adminId = queryAdminId;
      }
    } else if (currentUser.role === 'ADMIN') {
      where.adminId = currentUser.id;
    } else {
      // User: sees only projects where they are a member (BR-22)
      where.adminId = currentUser.adminId;
      const memberships = await ProjectMember.findAll({
        where: { userId: currentUser.id },
        attributes: ['projectId'],
      });
      const memberProjectIds = memberships.map((m) => m.projectId);
      where.id = { [Op.in]: memberProjectIds };
    }

    const { rows, count } = await Project.findAndCountAll({
      where,
      order: [['createdAt', 'DESC']],
      limit,
      offset,
    });

    return { rows, total: count };
  }

  public async getProjectById(id: string, currentUser: AuthenticatedUser): Promise<Project> {
    const project = await Project.findByPk(id, {
      include: [
        {
          model: ProjectMember,
          as: 'members',
          include: [
            {
              model: Permission,
              as: 'permissions',
              through: { attributes: [] },
              attributes: ['action'],
            },
          ],
        },
      ],
    });

    if (!project) {
      throw new NotFoundError('Project not found');
    }

    // Tenant check
    if (currentUser.role === 'ADMIN' && project.adminId !== currentUser.id) {
      throw new NotFoundError('Project not found');
    }
    if (currentUser.role === 'USER') {
      if (project.adminId !== currentUser.adminId) {
        throw new NotFoundError('Project not found');
      }
      const isMember = (project.members || []).some((m) => m.userId === currentUser.id);
      if (!isMember) {
        throw new NotFoundError('Project not found');
      }
    }

    return project;
  }

  public async updateProject(
    id: string,
    input: UpdateProjectInput,
    currentUser: AuthenticatedUser,
  ): Promise<Project> {
    const project = await this.getProjectById(id, currentUser);

    if (input.status && currentUser.role === 'USER') {
      throw new ForbiddenError('Only Admins can change project status');
    }

    if (input.name && input.name.toLowerCase() !== project.name.toLowerCase()) {
      const existing = await Project.findOne({
        where: {
          adminId: project.adminId,
          id: { [Op.ne]: project.id },
          [Op.and]: sequelize.where(
            sequelize.fn('lower', sequelize.col('name')),
            input.name.toLowerCase(),
          ),
        },
      });

      if (existing) {
        throw new ConflictError(`Project '${input.name}' already exists in this workspace`);
      }
    }

    await project.update({
      ...(input.name ? { name: input.name } : {}),
      ...(input.description !== undefined ? { description: input.description } : {}),
      ...(input.status ? { status: input.status } : {}),
      ...(input.startDate !== undefined ? { startDate: input.startDate } : {}),
      ...(input.endDate !== undefined ? { endDate: input.endDate } : {}),
    });

    return project;
  }

  public async deleteProject(id: string, currentUser: AuthenticatedUser): Promise<void> {
    // Only Admin or Super Admin can delete a project (BR-30)
    if (currentUser.role === 'USER') {
      throw new ForbiddenError('Only Admins can delete projects');
    }

    const project = await Project.findByPk(id);
    if (!project) {
      throw new NotFoundError('Project not found');
    }

    if (currentUser.role === 'ADMIN' && project.adminId !== currentUser.id) {
      throw new NotFoundError('Project not found');
    }

    await project.destroy();
  }
}

export const projectsService = new ProjectsService();

