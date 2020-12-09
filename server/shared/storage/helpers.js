'use strict';

const crypto = require('crypto');
const { elementRegistry } = require('../content-plugins');
const find = require('lodash/find');
const get = require('lodash/get');
const isString = require('lodash/isString');
const isUrl = require('is-url');
const config = require('../../../config/server').storage;
const mime = require('mime-types');
const Promise = require('bluebird');
const proxy = require('./proxy');
const set = require('lodash/set');
const storage = require('./');
const toPairs = require('lodash/toPairs');
const values = require('lodash/values');
const xmlParser = require('fast-xml-parser');

const STORAGE_PROTOCOL = 'storage://';
const DEFAULT_IMAGE_EXTENSION = 'png';

const isPrimitive = element => !get(element, 'data.embeds');
const isQuestion = element => get(element, 'data.question');

function processStatics(item) {
  const customProcessor = elementRegistry.getStaticsHandler(item.type);
  return customProcessor
    ? customProcessor(item, defaultStaticsProcessor, processStatics)
    : defaultStaticsProcessor(item);
}

function defaultStaticsProcessor(item) {
  return isQuestion(item)
    ? processQuestion(item)
    : processAsset(item);
}

function processAsset(asset) {
  return isPrimitive(asset)
    ? processPrimitive(asset)
    : processComposite(asset);
}

function processQuestion(element) {
  const question = element.data.question;
  if (!question || question.length < 1) return Promise.resolve(element);
  return Promise.each(question, it => processAsset(it));
}

function processPrimitive(primitive) {
  if (!isPrimitive(primitive)) throw new Error('Invalid primitive');
  if (!processor[primitive.type]) return Promise.resolve(primitive);
  return processor[primitive.type](primitive);
}

function processComposite(composite) {
  return Promise.each(values(composite.data.embeds), processPrimitive)
    .then(() => composite);
}

const processor = {};

processor.IMAGE = asset => {
  const image = asset.data.url;
  const base64Pattern = /^data:image\/(\w+);base64,/;

  if (!isString(image) || (!isUrl(image) && !image.match(base64Pattern))) {
    return Promise.resolve(asset);
  }

  if (isUrl(image)) {
    const url = new URL(image);
    asset.data.url = url.pathname.substr(1, image.length);
    return Promise.resolve(asset);
  }

  const file = Buffer.from(image.replace(base64Pattern, ''), 'base64');
  const extension = image.match(base64Pattern)[1] || DEFAULT_IMAGE_EXTENSION;
  const hashString = `${asset.id}${file}`;
  const hash = crypto.createHash('md5').update(hashString).digest('hex');
  const key = `${config.path}/${asset.id}/${hash}.${extension}`;
  asset.data.url = key;
  return saveFile(key, file).then(() => asset);
};

processor.SCORM = async element => {
  const manifestKey = find(element.data.assets, it => it.endsWith('imsmanifest.xml'));
  const manifest = await storage.getFile(manifestKey.substr(STORAGE_PROTOCOL.length, manifestKey.length));
  const options = { ignoreAttributes: false, attributeNamePrefix: '$_' };
  const { manifest: parsedManifest } = xmlParser.parse(manifest.toString(), options);
  const { $_href: resourcePath } = parsedManifest.resources.resource;
  const key = `${config.path}/${element.data.root}/${resourcePath}`;
  element.data.launchUrl = key;
  return element;
};

// TODO: Temp patch until asset embeding is unified
function resolveStatics(item) {
  const customResolver = elementRegistry.getStaticsHandler(item.type);
  return customResolver
    ? customResolver(item, defaultStaticsResolver, resolveStatics)
    : defaultStaticsResolver(item);
}

function defaultStaticsResolver(item) {
  return isQuestion(item)
    ? resolveQuestion(item)
    : resolveAsset(item);
}

async function resolveAssetsMap(element) {
  if (!get(element, 'data.assets')) return element;
  await Promise.map(toPairs(element.data.assets), ([key, url]) => {
    if (!url) return set(element.data, key, url);
    const isStorageResource = url.startsWith(STORAGE_PROTOCOL);
    const resolvedUrl = isStorageResource
      ? proxy.getFileUrl(url.substr(STORAGE_PROTOCOL.length, url.length))
      : url;
    set(element.data, key, resolvedUrl);
  });
  return element;
}

async function resolveQuestion(element) {
  await resolveAssetsMap(element);
  const question = element.data.question;
  if (!question || question.length < 1) return Promise.resolve(element);
  return Promise.each(question, resolveAsset).then(() => element);
}

function resolveAsset(element) {
  return isPrimitive(element)
    ? resolvePrimitive(element)
    : resolveComposite(element);
}

function resolvePrimitive(primitive) {
  if (!isPrimitive(primitive)) throw new Error('Invalid primitive');
  const primitiveResolver = resolver[primitive.type] || resolveAssetsMap;
  return primitiveResolver(primitive);
}

async function resolveComposite(composite) {
  await resolveAssetsMap(composite);
  return Promise.each(values(composite.data.embeds), resolvePrimitive)
    .then(() => composite);
}

const resolver = {};

resolver.IMAGE = asset => {
  if (!asset.data || !asset.data.url) return Promise.resolve(asset);

  function getUrl(key) {
    asset.data.url = proxy.getFileUrl(key);
    return asset;
  }

  return storage.fileExists(asset.data.url)
    .then(exists => exists ? getUrl(asset.data.url) : asset);
};

resolver.SCORM = element => {
  const { launchUrl } = element.data || {};
  if (!launchUrl) return element;
  element.data.launchUrl = proxy.getFileUrl(launchUrl);
  return element;
};

function saveFile(key, file) {
  // TODO: Investigate and properly set 'ACL' grant in options
  const options = { ContentType: mime.lookup(key) };
  return storage.saveFile(key, file, options);
}

module.exports = {
  STORAGE_PROTOCOL,
  processStatics,
  resolveStatics
};
