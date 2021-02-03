'use strict';

const { BAD_REQUEST, NO_CONTENT } = require('http-status-codes');
const { Comment, ContentElement, User } = require('../shared/database');
const { createError } = require('../shared/error/helpers');
const pick = require('lodash/pick');
const pickBy = require('lodash/pickBy');

const author = {
  model: User,
  as: 'author',
  attributes: ['id', 'email', 'firstName', 'lastName', 'fullName', 'label', 'imgUrl']
};

const element = {
  model: ContentElement, as: 'contentElement', attributes: ['uid', 'type']
};

function list({ repository, opts, query }, res) {
  const { activityId, contentElementId } = query;
  if (activityId) opts.where.activityId = activityId;
  if (contentElementId) opts.where.contentElementId = contentElementId;
  return repository.getComments({ ...opts, include: [author, element] })
    .then(data => res.json({ data }));
}

function create({ user, repository: { id: repositoryId }, body }, res) {
  const attrs = ['uid', 'activityId', 'contentElementId', 'content'];
  const payload = { repositoryId, authorId: user.id, ...pick(body, attrs) };
  return Comment.create(payload, { include: [author, element] })
    .then(data => res.json({ data }));
}

function patch({ comment, body }, res) {
  const { content } = body;
  return comment.update({ content, editedAt: new Date() })
    .then(comment => comment.reload({ include: [author] }))
    .then(data => res.json({ data }));
}

function remove({ comment }, res) {
  return comment.destroy()
    .then(data => res.json({ data }));
}

async function updateResolvement({ body }, res) {
  const { id, resolvedAt, contentElementId } = body;
  if (!contentElementId && !id) {
    return createError(BAD_REQUEST, 'id or contentElementId required!');
  }
  const where = pickBy({ id, contentElementId }, val => !!val);
  const data = { resolvedAt: resolvedAt ? null : new Date() };
  await Comment.update(data, { where, paranoid: false });
  res.sendStatus(NO_CONTENT);
}

module.exports = {
  list,
  create,
  patch,
  remove,
  updateResolvement
};
