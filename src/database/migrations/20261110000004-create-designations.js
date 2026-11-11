'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('designations', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.literal('gen_random_uuid()'),
        primaryKey: true,
        allowNull: false,
      },
      admin_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT',
      },
      name: {
        type: Sequelize.STRING(100),
        allowNull: false,
      },
      description: {
        type: Sequelize.STRING(255),
        allowNull: true,
      },
      deleted_at: {
        type: Sequelize.DATE,
        allowNull: true,
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

    // Partial unique index for name within an admin workspace for active records
    await queryInterface.sequelize.query(`
      CREATE UNIQUE INDEX idx_designations_admin_name_unique
      ON designations (admin_id, lower(name))
      WHERE deleted_at IS NULL;
    `);

    await queryInterface.addIndex('designations', ['admin_id'], {
      name: 'idx_designations_admin_id',
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('designations');
  },
};

