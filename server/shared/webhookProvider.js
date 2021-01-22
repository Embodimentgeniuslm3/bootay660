'use strict';

const {
  clientId,
  clientSecret,
  tokenHost,
  tokenPath,
  webhookUrl
} = require('../../config/server/consumer');
const { ClientCredentials } = require('simple-oauth2');
const request = require('axios');

const client = new ClientCredentials({
  client: { id: clientId, secret: clientSecret },
  auth: { tokenHost, tokenPath }
});

let accessToken;

getAccessToken();

async function send(payload) {
  if (!accessToken || accessToken.expired()) {
    await getAccessToken();
  }
  return request.post(webhookUrl, payload, {
    headers: { Authorization: `Bearer ${accessToken.token.access_token}` }
  });
}

function getAccessToken() {
  return client.getToken()
    .then(token => { accessToken = token; })
    .catch(error => console.error('Access Token Error', error.message));
}

module.exports = { send };