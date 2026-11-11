import { Permission } from '../../models';

export class PermissionsService {
  public async getAllPermissions(): Promise<Permission[]> {
    return Permission.findAll({
      attributes: ['id', 'module', 'action'],
      order: [
        ['module', 'ASC'],
        ['action', 'ASC'],
      ],
    });
  }
}

export const permissionsService = new PermissionsService();

