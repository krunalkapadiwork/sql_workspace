'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('designation_permissions', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.literal('gen_random_uuid()'),
        primaryKey: true,
        allowNull: false,
      },
      designation_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'designations',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      permission_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'permissions',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT',
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

    await queryInterface.addIndex('designation_permissions', ['designation_id', 'permission_id'], {
      unique: true,
      name: 'idx_designation_permissions_unique',
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('designation_permissions');
  },
};

