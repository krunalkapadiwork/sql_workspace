'use strict';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const bcrypt = require('bcrypt');
// eslint-disable-next-line @typescript-eslint/no-var-requires
require('dotenv').config();

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    const email = process.env.SUPER_ADMIN_EMAIL || 'superadmin@sqlworkspace.com';
    const rawPassword = process.env.SUPER_ADMIN_PASSWORD || 'SuperAdmin@Secure123!';
    const saltRounds = parseInt(process.env.BCRYPT_ROUNDS || '12', 10);

    // 1. Find SUPER_ADMIN role id
    const [roles] = await queryInterface.sequelize.query(
      `SELECT id FROM roles WHERE name = 'SUPER_ADMIN' LIMIT 1;`,
    );

    if (roles.length === 0) {
      throw new Error("SUPER_ADMIN role not found. Run 'seed-roles' first.");
    }

    const roleId = roles[0].id;

    // 2. Check if a Super Admin already exists (BR-2: Exactly one Super Admin)
    const [existingSuperAdmin] = await queryInterface.sequelize.query(
      `SELECT id FROM users WHERE role_id = :roleId LIMIT 1;`,
      {
        replacements: { roleId },
      },
    );

    if (existingSuperAdmin.length > 0) {
      // Super Admin already seeded, idempotent no-op
      return;
    }

    // 3. Hash password
    const passwordHash = await bcrypt.hash(rawPassword, saltRounds);

    // 4. Insert Super Admin
    await queryInterface.sequelize.query(
      `INSERT INTO users (
        id, email, password_hash, first_name, last_name, role_id, admin_id, designation_id,
        status, must_change_password, created_at, updated_at
      ) VALUES (
        gen_random_uuid(), :email, :passwordHash, 'Super', 'Admin', :roleId, NULL, NULL,
        'ACTIVE', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
      );`,
      {
        replacements: {
          email,
          passwordHash,
          roleId,
        },
      },
    );
  },

  async down(queryInterface) {
    const [roles] = await queryInterface.sequelize.query(
      `SELECT id FROM roles WHERE name = 'SUPER_ADMIN' LIMIT 1;`,
    );
    if (roles.length > 0) {
      await queryInterface.bulkDelete('users', { role_id: roles[0].id }, {});
    }
  },
};

