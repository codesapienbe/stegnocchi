/**
 * Babel Configuration
 * Configuration for React Native and Expo with module resolution
 */

module.exports = function (api) {
  api.cache(true);

  return {
    presets: [
      'babel-preset-expo',
      '@babel/preset-typescript',
    ],
    plugins: [
      // React Native specific plugins
      'react-native-reanimated/plugin',
      
      // Module resolution
      [
        'module-resolver',
        {
          root: [
            './src',
            './assets',
          ],
          extensions: [
            '.ios.ts',
            '.android.ts',
            '.ts',
            '.ios.tsx',
            '.android.tsx',
            '.tsx',
            '.jsx',
            '.js',
            '.json',
          ],
          alias: {
            '@': './src',
            '@/core': './src/core',
            '@/components': './src/components',
            '@/hooks': './src/hooks',
            '@/navigation': './src/navigation',
            '@/screens': './src/screens',
            '@/utils': './src/utils',
            '@/types': './src/types',
            '@/platform': './src/platform',
            '@/web': './src/web',
            '@/native': './src/native',
            '@/assets': './assets',
          },
        },
      ],
      
      // Optional: Enable experimental features
      '@babel/plugin-proposal-export-namespace-from',
      '@babel/plugin-proposal-optional-chaining',
      '@babel/plugin-proposal-nullish-coalescing-operator',
    ],
    
    // Environment-specific configurations
    env: {
      development: {
        plugins: [
          // Development-only plugins
          'react-refresh/babel',
        ],
      },
      production: {
        plugins: [
          // Production optimizations
          'transform-remove-console',
          'transform-remove-debugger',
        ],
      },
      test: {
        plugins: [
          // Test-specific plugins
          '@babel/plugin-transform-modules-commonjs',
        ],
      },
    },
  };
}; 