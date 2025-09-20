/**
 * Size-limit configuration for the form-engine package.
 *
 * We analyze the compiled public entry emitted by the TypeScript build and
 * exclude peer/framework dependencies so the reported size only captures the
 * code we ship from this package.
 *
 * Baseline measurement (2025-09-20): importing FormRenderer, DraftRecovery,
 * and initializeFieldRegistry yields ~112 kB gzipped after tree-shaking peer
 * dependencies. The budget below leaves ~10% headroom for maintenance work.
 */
const sharedIgnore = ['react', 'react-dom', 'xstate', 'react-hook-form']

module.exports = [
  {
    name: 'form-engine: public entry',
    path: 'packages/form-engine/dist/index.js',
    ignore: sharedIgnore,
    import: '{ FormRenderer, DraftRecovery, initializeFieldRegistry }',
    limit: '125 KB',
    modifyWebpackConfig(config) {
      config.resolve = {
        ...(config.resolve || {}),
        fallback: { ...(config.resolve?.fallback || {}), crypto: false }
      }
      return config
    },
    gzip: true,
    brotli: true,
    running: false
  }
]
