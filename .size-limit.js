/**
 * Size-limit configuration for the form-engine package.
 *
 * The remediation plan (R-13) requires tracking the raw distributable size
 * and the bundled footprint when consumers import the public API. We keep a
 * single source of truth for the entry path/import expression and apply the
 * same peer dependency externals across the webpack measurement.
 */
const entryPath = 'packages/form-engine/dist/index.js';
const publicImport = '{ FormRenderer, DraftRecovery, initializeFieldRegistry }';
const peerDeps = ['react', 'react-dom', 'react-hook-form', 'xstate'];

const applySharedWebpackGuards = (config) => {
  const externals = config.externals
    ? Array.isArray(config.externals)
      ? [...config.externals]
      : [config.externals]
    : [];

  externals.push(({ request }, callback) => {
    if (request && peerDeps.includes(request)) {
      return callback(null, `commonjs ${request}`);
    }
    return callback();
  });

  config.externals = externals;
  config.resolve = {
    ...(config.resolve || {}),
    fallback: { ...(config.resolve?.fallback || {}), crypto: false },
  };

  return config;
};

module.exports = [
  {
    name: 'form-engine: raw dist entry',
    path: entryPath,
    limit: '125 KB',
    gzip: true,
    brotli: true,
    webpack: false,
    running: false,
  },
  {
    name: 'form-engine: webpack bundle',
    path: entryPath,
    import: publicImport,
    limit: '125 KB',
    gzip: true,
    brotli: true,
    webpack: true,
    ignore: peerDeps,
    running: false,
    modifyWebpackConfig: applySharedWebpackGuards,
  },
];
