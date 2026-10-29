const path = require('path');
const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);
const joyCoreRoot = path.resolve(__dirname, 'joy-core');

// Allow importing the Three.js engine sources while ignoring its local install/build.
config.watchFolders = [...(config.watchFolders ?? []), joyCoreRoot];
config.resolver.blockList = [
  new RegExp(`${joyCoreRoot.replace(/[/\\]/g, '[/\\\\]')}[/\\\\]node_modules[/\\\\].*`),
  new RegExp(`${joyCoreRoot.replace(/[/\\]/g, '[/\\\\]')}[/\\\\]dist[/\\\\].*`),
];
config.resolver.extraNodeModules = {
  ...(config.resolver.extraNodeModules ?? {}),
  three: path.resolve(__dirname, 'node_modules/three'),
};

if (!config.resolver.assetExts.includes('wasm')) {
  config.resolver.assetExts.push('wasm');
}

const enhanceMiddleware = config.server.enhanceMiddleware;
config.server.enhanceMiddleware = (middleware, metroServer) => {
  const enhancedMiddleware = enhanceMiddleware
    ? enhanceMiddleware(middleware, metroServer)
    : middleware;

  return (request, response, next) => {
    response.setHeader('Cross-Origin-Embedder-Policy', 'credentialless');
    response.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
    return enhancedMiddleware(request, response, next);
  };
};

module.exports = config;
