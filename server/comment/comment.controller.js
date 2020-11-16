'use strict';

const { Comment, User } = require('../shared/database');

const author = {
  model: User,
  as: 'author',
  attributes: ['id', 'email', 'firstName', 'lastName', 'fullName', 'imgUrl']
};

function list({ repository, opts, query }, res) {
  const { activityId, contentElementId } = query;
  if (activityId) opts.where.activityId = activityId;
  if (contentElementId) opts.where.contentElementId = contentElementId;
  return repository.getComments({ ...opts, include: [author] })
    .then(data => res.json({ data }));
}

function create({ user, repository: { id: repositoryId }, body }, res) {
  const { uid, activityId, contentElementId, content } = body;
  const payload = {
    uid, repositoryId, activityId, contentElementId, authorId: user.id, content
  };
  return Comment.create(payload, { include: [author] })
    .then(data => res.json({ data }));
}

function patch({ comment, body }, res) {
  const { content } = body;
  return comment.update({ content })
    .then(comment => comment.reload({ include: [author] }))
    .then(data => res.json({ data }));
}

function remove({ comment }, res) {
  return comment.destroy()
    .then(data => res.json({ data }));
}

module.exports = {
  list,
  create,
  patch,
  remove
};
