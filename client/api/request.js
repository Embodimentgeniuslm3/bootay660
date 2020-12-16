import axios, { Axios } from 'axios';
import { FORBIDDEN, UNAUTHORIZED } from 'http-status-codes';
import buildFullPath from 'axios/lib/core/buildFullPath';
import { EventEmitter } from 'events';

Axios.prototype.submitForm = function (url, fields, options) {
  const action = buildFullPath(this.defaults.baseURL, url);
  return Promise.resolve(submitForm(action, fields, options));
};

const config = {
  baseURL: process.env.API_PATH,
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' }
};

// Instance of axios to be used for all API requests.
const client = axios.create(config);

// Attach additional instance without interceptors
Object.defineProperty(client, 'base', {
  get() {
    if (!this.base_) this.base_ = axios.create(config);
    return this.base_;
  }
});

client.auth = new EventEmitter();

client.interceptors.response.use(res => res, err => {
  if (err.response && [FORBIDDEN, UNAUTHORIZED].includes(err.response.status)) {
    client.auth.emit('error');
  }
  throw err;
});

export default client;

function submitForm(action, fields = {}, options) {
  const form = document.createElement('form');
  Object.assign(form, { method: 'POST', target: 'blank', action }, options);
  Object.entries(fields).forEach(([name, attrs]) => {
    const input = document.createElement('input');
    Object.assign(input, { name }, attrs);
    form.appendChild(input);
  });
  document.body.appendChild(form);
  form.submit();
  form.remove();
}
