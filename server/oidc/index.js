'use strict';

const Audience = require('../shared/auth/audience');
const { authenticate } = require('../shared/auth');
const { BAD_REQUEST } = require('http-status-codes');
const { errors: OIDCError } = require('openid-client');
const path = require('path');
const router = require('express').Router();

const storageKey = process.env.STORAGE_STATE_KEY;

const ACCESS_DENIED_ROUTE = '/#/login?accessDenied';

const OIDCErrors = [
  OIDCError.OPError,
  OIDCError.RPError
];
const scope = ['openid', 'profile', 'email'].join(' ');

const isString = arg => typeof arg === 'string';
const isLogoutRequest = req => req.query.action === 'logout';
const isOIDCError = err => OIDCErrors.some(Ctor => err instanceof Ctor);

router
  .get('/', (req, res, next) => {
    const strategy = req.passport.strategy('oidc');
    if (isLogoutRequest(req)) return strategy.logout()(req, res, next);
    authenticate('oidc', { scope })(req, res, next);
  })
  .get('/callback', (req, res, next) => {
    if (isLogoutRequest(req)) return logout(req, res);
    return login(req, res, next);
  })
  .use((err, _req, res, next) => {
    if (!isOIDCError(err)) return res.redirect(ACCESS_DENIED_ROUTE);
    const template = path.resolve(__dirname, './error.mustache');
    const status = err.status || BAD_REQUEST;
    return res.render(template, err, (_, html) => {
      res.status(status).send(html);
    });
  });

module.exports = {
  path: '/oidc',
  router
};

function logout(_req, res) {
  const template = path.resolve(__dirname, './logout.mustache');
  res.render(template, { storageKey });
}

function login(req, res, next) {
  authenticate('oidc')(req, res, err => {
    if (err) return next(err);
    const { user } = req;
    const template = path.resolve(__dirname, './authenticated.mustache');
    const token = user.createToken({
      audience: Audience.Scope.Access,
      expiresIn: '5 days'
    });
    const profile = JSON.stringify(user.profile, (_, val) => {
      return isString(val) ? encodeURIComponent(val) : val;
    });
    return res.render(template, { token, profile, storageKey });
  });
}
