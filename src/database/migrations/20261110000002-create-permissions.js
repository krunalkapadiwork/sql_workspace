'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('permissions', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.literal('gen_random_uuid()'),
        primaryKey: true,
        allowNull: false,
      },
      module: {
        type: Sequelize.STRING(100),
        allowNull: true,
      },
      action: {
        type: Sequelize.STRING(50),
        allowNull: false,
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
    });

    // Unique index for scoped permissions (when module is NOT NULL)
    await queryInterface.addIndex('permissions', ['module', 'action'], {
      unique: true,
      name: 'idx_permissions_module_action_unique',
      where: {
        module: { [Sequelize.Op.ne]: null },
      },
    });

    // Partial unique index for global project permissions (when module IS NULL)
    await queryInterface.sequelize.query(`
      CREATE UNIQUE INDEX idx_permissions_global_action_unique 
      ON permissions (action) 
      WHERE module IS NULL;
    `);
  },

  async down(queryInterface) {
    await queryInterface.dropTable('permissions');
  },
};

