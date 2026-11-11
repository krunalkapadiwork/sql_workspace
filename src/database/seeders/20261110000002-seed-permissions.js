'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    const permissions = ['READ', 'CREATE', 'UPDATE', 'DELETE', 'MANAGE_MEMBERS'];

    for (const action of permissions) {
      const [existing] = await queryInterface.sequelize.query(
        `SELECT id FROM permissions WHERE action = :action AND module IS NULL LIMIT 1;`,
        {
          replacements: { action },
        },
      );

      if (existing.length === 0) {
        await queryInterface.sequelize.query(
          `INSERT INTO permissions (id, module, action, created_at, updated_at)
           VALUES (gen_random_uuid(), NULL, :action, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);`,
          {
            replacements: { action },
          },
        );
      }
    }
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete('permissions', null, {});
  },
};

