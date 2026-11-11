import { Role, Permission, User } from '../../src/models';
import { env } from '../../src/config/env';
import { UniqueConstraintError } from 'sequelize';

describe('Database Seeds & Integrity Constraints', () => {
  it('should have exactly 3 seeded roles', async () => {
    const roles = await Role.findAll();
    expect(roles).toHaveLength(3);
    const names = roles.map((r) => r.name);
    expect(names.sort()).toEqual(['ADMIN', 'SUPER_ADMIN', 'USER'].sort());
  });

  it('should have exactly 5 seeded global permissions', async () => {
    const permissions = await Permission.findAll();
    expect(permissions).toHaveLength(5);
    for (const perm of permissions) {
      expect(perm.module).toBeNull();
      expect(['READ', 'CREATE', 'UPDATE', 'DELETE', 'MANAGE_MEMBERS']).toContain(perm.action);
    }
  });

  it('should have seeded the initial Super Admin with required attributes', async () => {
    const superAdminRole = await Role.findOne({ where: { name: 'SUPER_ADMIN' } });
    expect(superAdminRole).not.toBeNull();

    const superAdmin = await User.findOne({ where: { roleId: superAdminRole!.id } });
    expect(superAdmin).not.toBeNull();
    expect(superAdmin!.email.toLowerCase()).toBe(env.SUPER_ADMIN_EMAIL.toLowerCase());
    expect(superAdmin!.status).toBe('ACTIVE');
    expect(superAdmin!.mustChangePassword).toBe(true);
    expect(superAdmin!.adminId).toBeNull();
    expect(superAdmin!.passwordHash).not.toBeNull();
  });

  it('should reject creating a duplicate user with the same email (case-insensitive citext)', async () => {
    const superAdminRole = await Role.findOne({ where: { name: 'SUPER_ADMIN' } });

    await expect(
      User.create({
        email: env.SUPER_ADMIN_EMAIL.toUpperCase(), // Test case-insensitivity of citext
        firstName: 'Another',
        lastName: 'Admin',
        roleId: superAdminRole!.id,
        status: 'ACTIVE',
      }),
    ).rejects.toThrow(UniqueConstraintError);
  });

  it('should reject creating a duplicate role with the same name', async () => {
    await expect(
      Role.create({
        name: 'ADMIN',
      }),
    ).rejects.toThrow(UniqueConstraintError);
  });

  it('should reject creating a duplicate global permission with the same action', async () => {
    await expect(
      Permission.create({
        module: null,
        action: 'READ',
      }),
    ).rejects.toThrow(UniqueConstraintError);
  });
});

