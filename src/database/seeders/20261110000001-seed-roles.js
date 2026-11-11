'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    const roles = ['SUPER_ADMIN', 'ADMIN', 'USER'];

    for (const roleName of roles) {
      const [existing] = await queryInterface.sequelize.query(
        `SELECT id FROM roles WHERE name = :name LIMIT 1;`,
        {
          replacements: { name: roleName },
        },
      );

      if (existing.length === 0) {
        await queryInterface.sequelize.query(
          `INSERT INTO roles (id, name, created_at, updated_at)
           VALUES (gen_random_uuid(), :name, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);`,
          {
            replacements: { name: roleName },
          },
        );
      }
    }
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete('roles', null, {});
  },
};

