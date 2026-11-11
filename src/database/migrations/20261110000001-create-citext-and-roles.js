'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Enable extensions
    await queryInterface.sequelize.query('CREATE EXTENSION IF NOT EXISTS citext;');
    await queryInterface.sequelize.query('CREATE EXTENSION IF NOT EXISTS "uuid-ossp";');

    await queryInterface.createTable('roles', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.literal('gen_random_uuid()'),
        primaryKey: true,
        allowNull: false,
      },
      name: {
        type: Sequelize.STRING(50),
        allowNull: false,
        unique: true,
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
  },

  async down(queryInterface) {
    await queryInterface.dropTable('roles');
  },
};

