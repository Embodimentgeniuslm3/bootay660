'use strict';

const config = require('../../config/server/storage');
const { ContentElement } = require('../shared/database');
const { getAssetsPath } = require('../shared/storage/util');
const { Op } = require('sequelize');
const Promise = require('bluebird');
const storage = require('../shared/storage');

const regex = /repository\/assets\/(\d+)?\/?(.*)?/;
const types = ['IMAGE', 'VIDEO', 'AUDIO', 'PDF', 'SCORM'];

migrateContentElement()
  .then(() => {
    console.info('Migrated content elements.');
    process.exit(0);
  })
  .catch(error => {
    console.error(error.message);
    process.exit(1);
  });

const mapTypesToActions = {
  IMAGE: imageMigrationHandler,
  VIDEO: defaultMigrationHandler,
  AUDIO: defaultMigrationHandler,
  PDF: defaultMigrationHandler,
  SCORM: scormMigrationHandler
};

async function migrateContentElement() {
  const contentElements = await ContentElement.findAll({
    where: { type: { [Op.in]: types } }
  });
  return Promise.each(
    contentElements,
    it => mapTypesToActions[it.type] && mapTypesToActions[it.type](it)
  );
}

async function imageMigrationHandler(element) {
  const { repositoryId, data: { url } } = element;
  if (!url) return;
  const assetUrl = url.match(regex);
  if (!assetUrl) return;
  const [, id, fileName] = assetUrl;
  const newKey = `${getAssetsPath(repositoryId)}/${id}/${fileName}`;
  await cpAssets(url, newKey);
  return element.update({ ...element, data: { ...element.data, url: newKey } });
}

function defaultMigrationHandler(element) {}

function scormMigrationHandler(element) {}

function cpAssets(key, newKey) {
  return storage.copyFile(key, newKey);
}

// function migrateRevisions() {}