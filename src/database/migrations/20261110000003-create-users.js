'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('users', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.literal('gen_random_uuid()'),
        primaryKey: true,
        allowNull: false,
      },
      email: {
        type: 'citext',
        allowNull: false,
        unique: true,
      },
      password_hash: {
        type: Sequelize.STRING(255),
        allowNull: true,
      },
      first_name: {
        type: Sequelize.STRING(100),
        allowNull: false,
      },
      last_name: {
        type: Sequelize.STRING(100),
        allowNull: false,
      },
      role_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'roles',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT',
      },
      admin_id: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'users',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT',
      },
      designation_id: {
        type: Sequelize.UUID,
        allowNull: true,
      },
      status: {
        type: Sequelize.STRING(20),
        allowNull: false,
        defaultValue: 'INVITED',
      },
      must_change_password: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      password_changed_at: {
        type: Sequelize.DATE,
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

    await queryInterface.addIndex('users', ['role_id'], {
      name: 'idx_users_role_id',
    });

    await queryInterface.addIndex('users', ['admin_id'], {
      name: 'idx_users_admin_id',
    });

    await queryInterface.addIndex('users', ['status'], {
      name: 'idx_users_status',
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('users');
  },
};

