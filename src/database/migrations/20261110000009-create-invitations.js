'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('invitations', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.literal('gen_random_uuid()'),
        primaryKey: true,
        allowNull: false,
      },
      user_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      invited_by: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT',
      },
      token_hash: {
        type: Sequelize.STRING(64),
        allowNull: false,
      },
      status: {
        type: Sequelize.STRING(20),
        allowNull: false,
        defaultValue: 'PENDING',
      },
      expires_at: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      accepted_at: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      revoked_at: {
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

    // Enforce only one active PENDING invitation per user (BR-42)
    await queryInterface.sequelize.query(`
      CREATE UNIQUE INDEX idx_invitations_user_pending_unique
      ON invitations (user_id)
      WHERE status = 'PENDING';
    `);

    await queryInterface.addIndex('invitations', ['token_hash'], {
      name: 'idx_invitations_token_hash',
    });

    await queryInterface.addIndex('invitations', ['status'], {
      name: 'idx_invitations_status',
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('invitations');
  },
};

