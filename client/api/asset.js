import path from 'path';
import request from './request';

const url = {
  root: () => '/asset'
};

export const root = path.join(request.defaults.baseURL, url.root());

function getUrl(key) {
  const params = { key };
  return request.get(url.root(), { params }).then(res => res.data.url);
}

function upload(data) {
  return request
    .post(url.root(), data)
    .then(res => res.data);
}

export default {
  getUrl,
  upload
};