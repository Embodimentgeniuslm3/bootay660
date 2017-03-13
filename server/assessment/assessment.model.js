'use strict';

const isNumber = require('lodash/isNumber');
const { processAssessment, resolveAssessment } = require('../shared/storage/helpers');

module.exports = function (sequelize, DataTypes) {
  const Assessment = sequelize.define('assessment', {
    type: {
      type: DataTypes.ENUM,
      values: ['MC', 'SC', 'TF', 'NR', 'TR', 'FB', 'HS'],
      allowNull: false
    },
    data: {
      type: DataTypes.JSON,
      allowNull: false,
      validate: { notEmpty: true }
    },
    createdAt: {
      type: DataTypes.DATE,
      field: 'created_at'
    },
    updatedAt: {
      type: DataTypes.DATE,
      field: 'updated_at'
    },
    deletedAt: {
      type: DataTypes.DATE,
      field: 'deleted_at'
    }
  }, {
    classMethods: {
      associate(models) {
        Assessment.belongsTo(models.Course, {
          foreignKey: { name: 'courseId', field: 'course_id' }
        });
        Assessment.belongsTo(models.Activity, {
          foreignKey: { name: 'activityId', field: 'activity_id' },
          onDelete: 'CASCADE'
        });
      },
      fetch(opt) {
        return isNumber(opt)
          ? Assessment.findById(opt).then(it => it && resolveAssessment(it))
          : Assessment.findAll(opt)
              .then(arr => Promise.all(arr.map(it => resolveAssessment(it))));
      }
    },
    hooks: {
      beforeCreate(assessment) {
        return processAssessment(assessment);
      },
      beforeUpdate(assessment) {
        return processAssessment(assessment);
      }
    },
    underscored: true,
    timestamps: true,
    paranoid: true,
    freezeTableName: true
  });

  return Assessment;
};
