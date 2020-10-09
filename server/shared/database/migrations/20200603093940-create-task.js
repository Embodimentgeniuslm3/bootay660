'use strict';

const TABLE_NAME = 'task';

exports.up = (queryInterface, Sequelize) => queryInterface.createTable(TABLE_NAME, {
  id: {
    type: Sequelize.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  uid: {
    type: Sequelize.UUID,
    unique: true,
    allowNull: false,
    defaultValue: Sequelize.literal('uuid_generate_v4()')
  },
  authorId: {
    type: Sequelize.INTEGER,
    field: 'author_id',
    references: { model: 'user', key: 'id' }
  },
  assigneeId: {
    type: Sequelize.INTEGER,
    field: 'assignee_id',
    references: { model: 'user', key: 'id' }
  },
  repositoryId: {
    type: Sequelize.INTEGER,
    field: 'repository_id',
    references: { model: 'repository', key: 'id' }
  },
  activityId: {
    type: Sequelize.INTEGER,
    field: 'activity_id',
    references: { model: 'activity', key: 'id' }
  },
  priority: {
    type: Sequelize.ENUM(['TRIVIAL', 'LOW', 'MEDIUM', 'HIGH', 'CRITICAL']),
    allowNull: false
  },
  dueDate: {
    type: Sequelize.DATE,
    field: 'due_date'
  },
  status: {
    type: Sequelize.STRING(50),
    allowNull: false
  },
  name: {
    type: Sequelize.STRING,
    allowNull: false
  },
  description: {
    type: Sequelize.TEXT
  },
  column_position: {
    type: Sequelize.FLOAT,
    allowNull: false
  },
  archivedAt: {
    type: Sequelize.DATE,
    field: 'archived_at'
  },
  createdAt: {
    type: Sequelize.DATE,
    field: 'created_at',
    allowNull: false
  },
  updatedAt: {
    type: Sequelize.DATE,
    field: 'updated_at',
    allowNull: false
  },
  deletedAt: {
    type: Sequelize.DATE,
    field: 'deleted_at'
  }
});

exports.down = queryInterface => queryInterface.dropTable(TABLE_NAME);
