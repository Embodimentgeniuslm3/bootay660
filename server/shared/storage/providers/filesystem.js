'use strict';

const Promise = require('bluebird');
const contentDisposition = require('content-disposition');
const exists = require('path-exists');
const fs = Promise.promisifyAll(require('fs'));
const Joi = require('joi');
const mkdirp = Promise.promisify(require('mkdirp'));
const path = require('path');
const { URLSearchParams } = require('url');

const RESPONSE_CONTENT_DISPOSITION = 'response-content-disposition';
const isNotFound = err => err.code === 'ENOENT';

const schema = Joi.object().keys({
  path: Joi.string().required(),
  publicPath: Joi.string().required()
});

class FilesystemStorage {
  constructor(config) {
    this.root = path.resolve(config.path);
    this.publicPath = path.join('/', config.publicPath);
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

  getFileUrl(key, { download }) {
    const searchParams = new URLSearchParams();
    searchParams.append('key', key);
    if (download) {
      searchParams.append(
        RESPONSE_CONTENT_DISPOSITION,
        contentDisposition(download)
      );
    }
    return Promise.resolve(`${this.publicPath}?${searchParams}`);
  }

  get serveHandler() {
    if (!this._serveHandler) {
      this._serveHandler = createServeHandler({ root: this.root });
    }
    return this._serveHandler;
  }
}

module.exports = {
  schema,
  create: FilesystemStorage.create
};

function createServeHandler({ root }) {
  return (req, res, next) => {
    if (req.method !== 'GET' && req.method !== 'HEAD') return next();
    const headers = {};
    const contentDisposition = req.query[RESPONSE_CONTENT_DISPOSITION];
    if (contentDisposition) {
      headers['Content-Disposition'] = contentDisposition;
    }
    const options = { root, headers };
    const { key } = req.query;
    if (!key) return next();
    res.sendFile(key, options, err => {
      if (err && !isNotFound(err)) return next(err);
      next();
    });
  };
}
