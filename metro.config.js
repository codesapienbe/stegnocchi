/**
 * Metro Configuration
 * React Native bundler configuration with module resolution
 */

const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const config = getDefaultConfig(__dirname);

// Add custom resolver for module aliases
config.resolver.alias = {
  '@': path.resolve(__dirname, 'src'),
  '@/core': path.resolve(__dirname, 'src/core'),
  '@/components': path.resolve(__dirname, 'src/components'),
  '@/hooks': path.resolve(__dirname, 'src/hooks'),
  '@/navigation': path.resolve(__dirname, 'src/navigation'),
  '@/screens': path.resolve(__dirname, 'src/screens'),
  '@/utils': path.resolve(__dirname, 'src/utils'),
  '@/types': path.resolve(__dirname, 'src/types'),
  '@/platform': path.resolve(__dirname, 'src/platform'),
  '@/web': path.resolve(__dirname, 'src/web'),
  '@/native': path.resolve(__dirname, 'src/native'),
  '@/assets': path.resolve(__dirname, 'assets'),
};

// Add custom extensions
config.resolver.extensions = [
  '.ios.ts',
  '.android.ts',
  '.ts',
  '.ios.tsx',
  '.android.tsx',
  '.tsx',
  '.jsx',
  '.js',
  '.json',
];

// Configure asset handling
config.resolver.assetExts.push(
  // Add any additional asset extensions here
  'db',
  'mp3',
  'ttf',
  'obj',
  'png',
  'jpg',
  'jpeg',
  'gif',
  'svg',
  'webp',
);

// Configure source map handling
config.transformer.minifierConfig = {
  keep_fnames: true,
  mangle: {
    keep_fnames: true,
  },
};

// Configure platform-specific file resolution
config.resolver.platforms = ['ios', 'android', 'native', 'web'];

// Configure transformer options
config.transformer = {
  ...config.transformer,
  babelTransformerPath: require.resolve('react-native-svg-transformer'),
  getTransformOptions: async () => ({
    transform: {
      experimentalImportSupport: false,
      inlineRequires: true,
    },
  }),
};

// Configure server options
config.server = {
  ...config.server,
  port: 8081,
  enhanceMiddleware: (middleware, server) => {
    return (req, res, next) => {
      // Add custom middleware here if needed
      return middleware(req, res, next);
    };
  },
};

// Configure watchman options
config.watchFolders = [
  path.resolve(__dirname, 'src'),
  path.resolve(__dirname, 'assets'),
];

// Configure resolver options
config.resolver.nodeModulesPaths = [
  path.resolve(__dirname, 'node_modules'),
];

// Configure transformer options for different environments
if (process.env.NODE_ENV === 'development') {
  config.transformer.minifierConfig = {
    ...config.transformer.minifierConfig,
    sourceMap: true,
  };
}

if (process.env.NODE_ENV === 'production') {
  config.transformer.minifierConfig = {
    ...config.transformer.minifierConfig,
    sourceMap: false,
    drop_console: true,
    drop_debugger: true,
  };
}

module.exports = config; 