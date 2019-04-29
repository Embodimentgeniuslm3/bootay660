'use strict';

const { createError, validationError } = require('../shared/error/helpers');
const { NOT_FOUND } = require('http-status-codes');
const { User } = require('../shared/database');

function index(req, res) {
  const attributes = ['id', 'email', 'role'];
  return User.findAll({ attributes })
    .then(users => res.json({ data: users }));
}

function forgotPassword({ body }, res) {
  const { email } = body;
  return User.findOne({ where: { email } })
    .then(user => user || createError(NOT_FOUND, 'User not found'))
    .then(user => user.sendResetToken())
    .then(() => res.end());
}

function resetPassword({ body, params }, res) {
  const { password, token } = body;
  return User.findOne({ where: { token } })
    .then(user => user || createError(NOT_FOUND, 'Invalid token'))
    .then(user => {
      user.password = password;
      return user.save().catch(validationError);
    })
    .then(() => res.end());
}

function login({ body }, res) {
  const { email, password } = body;
  if (!email || !password) {
    createError(400, 'Please enter email and password');
  }
  return User.findOne({ where: { email } })
    .then(user => user || createError(NOT_FOUND, 'User does not exist'))
    .then(user => user.authenticate(password))
    .then(user => user || createError(NOT_FOUND, 'Wrong password'))
    .then(user => {
      const token = user.createToken({ expiresIn: '5 days' });
      res.json({ data: { token, user: user.profile } });
    });
}

function updateProfile({ user, body: { userCredentials } }, res, next) {
  const { email, firstName, lastName } = userCredentials;
  return user.update({ email, firstName, lastName })
    .then(({ profile }) => res.json({ user: profile }))
    .catch(err => next(err));
}

function changePassword({ user, body: { currentPassword, newPassword } }, res) {
  return user.authenticate(currentPassword)
    .then(user => user || createError(NOT_FOUND, 'Incorrect current password'))
    .then(user => user.update({ password: newPassword }))
    .then(() => res.sendStatus(200));
}

function updateImageUrl({ user, body: { key } }, res, next) {
  return user.update({ imgUrl: key })
    .then(({ profile }) => res.json({ user: profile }))
    .catch(err => next(err));
}

module.exports = {
  index,
  forgotPassword,
  resetPassword,
  login,
  updateProfile,
  changePassword,
  updateImageUrl
};
