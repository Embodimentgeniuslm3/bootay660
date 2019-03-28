'use strict';

const Promise = require('bluebird');
const exists = require('path-exists');
const fs = Promise.promisifyAll(require('fs'));
const Joi = require('joi');
const mkdirp = Promise.promisify(require('mkdirp'));
const path = require('path');
const { validateConfig } = require('../validation');

const isNotFound = err => err.code === 'ENOENT';

const schema = Joi.object().keys({
  path: Joi.string().required()
});

class FilesystemStorage {
  constructor(config) {
    config = validateConfig(config, schema);
    this.root = path.resolve(config.path);
  }

  static create(config) {
    return new FilesystemStorage(config);
  }

  path(...segments) {
    segments = [this.root, ...segments];
    return path.join(...segments);
  }

  getFile(key, options = {}) {
    return fs.readFileAsync(this.path(key), options)
      .catch(err => {
        if (isNotFound(err)) return null;
        return Promise.reject(err);
      });
  }

  saveFile(key, data, options = {}) {
    const filePath = this.path(key);
    return mkdirp(path.dirname(filePath))
      .then(() => fs.writeFileAsync(filePath, data, options));
  }

  copyFile(key, newKey) {
    const src = this.path(key);
    const dest = this.path(newKey);
    return mkdirp(path.dirname(dest))
      .then(() => fs.copyFileAsync(src, dest));
  }

  moveFile(key, newKey) {
    return this.copyFile(key, newKey)
      .then(file => this.deleteFile(key).then(() => file));
  }

  deleteFile(key) {
    return fs.unlinkAsync(this.path(key));
  }

  listFiles(options = {}) {
    return fs.readdirAsync(this.root, options);
  }

  fileExists(key) {
    return exists(this.path(key));
  }

  getFileUrl(key) {
    return Promise.resolve(path.join('/', key));
  }
}

module.exports = {
  schema,
  create: FilesystemStorage.create
};
