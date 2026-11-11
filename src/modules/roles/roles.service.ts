import { Role } from '../../models';

export class RolesService {
  public async getAllRoles(): Promise<Role[]> {
    return Role.findAll({
      attributes: ['id', 'name'],
      order: [['name', 'ASC']],
    });
  }
}

export const rolesService = new RolesService();

