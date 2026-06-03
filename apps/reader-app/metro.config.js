// metro.config.js
const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const projectRoot = __dirname;
const monorepoRoot = path.resolve(projectRoot, '../..');

const config = getDefaultConfig(projectRoot);

// Watch monorepo root node_modules + src/
config.watchFolders = [
  monorepoRoot,
  path.resolve(projectRoot, 'src'),
];

// Resolve modules from monorepo root first, then app root
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(monorepoRoot, 'node_modules'),
];

// Handle @/ → src/ alias
config.resolver.alias = {
  '@': path.resolve(projectRoot, 'src'),
};

module.exports = config;
