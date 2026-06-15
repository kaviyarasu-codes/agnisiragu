// metro.config.js
const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const projectRoot = __dirname;

const config = getDefaultConfig(projectRoot);

// Handle @/ → src/ alias
config.resolver.alias = {
  '@': path.resolve(projectRoot, 'src'),
};

module.exports = config;
