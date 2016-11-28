const projectRoot = require('./projectRoot');

module.exports = {
  dev: {
    env: { NODE_ENV: '"development"' },
    assetsSubDirectory: 'static',
    assetsPublicPath: '/',
    cssSourceMap: false,
    port: 8080,
    proxyTable: {}
  },
  prod: {
    env: { NODE_ENV: '"production"' },
    assetsRoot: projectRoot('dist'),
    assetsSubDirectory: 'static',
    assetsPublicPath: '/',
    cssSourceMap: true,
    index: projectRoot('dist', 'index.html'),
    port: 8081,
    productionGzip: false,
    productionGzipExtensions: ['js', 'css']
  },
  test: {
    env: { NODE_ENV: '"testing"' }
  }
};