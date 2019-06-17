'use strict';

const config = require('../../config/server');
const email = require('emailjs');
const Promise = require('bluebird');

const EMAIL_ADDRESS = process.env.EMAIL_ADDRESS;

const server = email.server.connect(config.mail);

function send(message) {
  return new Promise((resolve, reject) => {
    server.send(message, (err, msg) => err ? reject(err) : resolve(msg));
  });
}

const resetUrl = token => `${config.origin}/#/reset-password/${token}`;

function invite(user, token) {
  const href = resetUrl(token);
  const message = `
    An account has been created for you on ${config.origin}.
    Please click <a href="${href}">here</a> to complete your registration.`;

  return send({
    from: EMAIL_ADDRESS,
    to: user.email,
    subject: 'Invite',
    attachment: [{ data: `<html>${message}</html>`, alternative: true }]
  });
}

function resetPassword(user, token) {
  const href = resetUrl(token);
  const message = `
    You requested password reset.
    Please click <a href="${href}">here</a> to complete the reset process.`;

  return send({
    from: EMAIL_ADDRESS,
    to: user.email,
    subject: 'Reset password',
    attachment: [{ data: `<html>${message}</html>`, alternative: true }]
  });
}

module.exports = {
  send,
  invite,
  resetPassword
};
