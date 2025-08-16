/**
 * Babel Configuration
 * Configuration for React Native and Expo with module resolution
 */

module.exports = function (api) {
  api.cache(true);

  return {
    presets: [
      'babel-preset-expo',
    ],
    plugins: [
      // React Native specific plugins
      'react-native-reanimated/plugin',
    ],
    
    // Environment-specific configurations removed - using only available plugins
  };
}; 