/**
 * Metro Configuration
 * React Native bundler configuration with module resolution
 */

const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');
const fs = require('fs');

// Ensure .expo directory exists
const expoDir = path.join(__dirname, '.expo');
if (!fs.existsSync(expoDir)) {
  fs.mkdirSync(expoDir, { recursive: true });
}

// Ensure Metro externals directory exists
const metroExternalsDir = path.join(expoDir, 'metro', 'externals');
if (!fs.existsSync(metroExternalsDir)) {
  fs.mkdirSync(metroExternalsDir, { recursive: true });
}

// Windows-specific path handling
const normalizePath = (filePath) => {
  return filePath.replace(/\\/g, '/');
};

// Handle Node.js built-in modules for Windows compatibility
const createNodeExternals = () => {
  const nodeModules = [
    'node:fs',
    'node:path',
    'node:crypto',
    'node:buffer',
    'node:stream',
    'node:util',
    'node:events',
    'node:url',
    'node:querystring',
    'node:os',
    'node:child_process',
    'node:cluster',
    'node:dgram',
    'node:dns',
    'node:domain',
    'node:http',
    'node:https',
    'node:net',
    'node:punycode',
    'node:readline',
    'node:repl',
    'node:string_decoder',
    'node:tls',
    'node:tty',
    'node:v8',
    'node:vm',
    'node:zlib',
    'node:assert',
    'node:constants',
    'node:module',
    'node:process',
    'node:timers',
    'node:tty',
    'node:worker_threads',
    'node:perf_hooks',
    'node:async_hooks',
    'node:inspector',
    'node:fs/promises',
    'node:path/posix',
    'node:path/win32'
  ];

  nodeModules.forEach(moduleName => {
    const moduleDir = path.join(metroExternalsDir, moduleName.replace(':', ''));
    if (!fs.existsSync(moduleDir)) {
      fs.mkdirSync(moduleDir, { recursive: true });
    }
  });
};

// Create Node.js externals directories
createNodeExternals();

const config = getDefaultConfig(__dirname);

// Add custom resolver for module aliases with normalized paths
config.resolver.alias = {
  '@': normalizePath(path.resolve(__dirname, 'src')),
  '@/core': normalizePath(path.resolve(__dirname, 'src/core')),
  '@/components': normalizePath(path.resolve(__dirname, 'src/components')),
  '@/hooks': normalizePath(path.resolve(__dirname, 'src/hooks')),
  '@/navigation': normalizePath(path.resolve(__dirname, 'src/navigation')),
  '@/screens': normalizePath(path.resolve(__dirname, 'src/screens')),
  '@/utils': normalizePath(path.resolve(__dirname, 'src/utils')),
  '@/types': normalizePath(path.resolve(__dirname, 'src/types')),
  '@/platform': normalizePath(path.resolve(__dirname, 'src/platform')),
  '@/web': normalizePath(path.resolve(__dirname, 'src/web')),
  '@/native': normalizePath(path.resolve(__dirname, 'src/native')),
  '@/assets': normalizePath(path.resolve(__dirname, 'assets')),
  '@/api': normalizePath(path.resolve(__dirname, 'src/api')),
  '@/cli': normalizePath(path.resolve(__dirname, 'src/cli')),
};

// Add custom extensions
config.resolver.extensions = [
  '.ios.ts',
  '.android.ts',
  '.web.ts',
  '.ts',
  '.ios.tsx',
  '.android.tsx',
  '.web.tsx',
  '.tsx',
  '.jsx',
  '.web.js',
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

// Configure transformer options with optional SVG support
config.transformer = {
  ...config.transformer,
  getTransformOptions: async () => ({
    transform: {
      experimentalImportSupport: false,
      inlineRequires: true,
    },
  }),
};

// Add SVG transformer if available
try {
  config.transformer.babelTransformerPath = require.resolve('react-native-svg-transformer');
} catch (error) {
  // SVG transformer not available, continue without it
  console.warn('react-native-svg-transformer not found, SVG files will be treated as assets');
}

// Disable Node.js externals for Windows compatibility
config.resolver.platforms = ['ios', 'android', 'native', 'web'];

// Handle Node.js built-in modules for Windows compatibility
if (process.platform === 'win32') {
  config.resolver.alias = {
    ...config.resolver.alias,
    // Disable Node.js built-in modules that cause issues on Windows
    'node:fs': false,
    'node:path': false,
    'node:crypto': false,
    'node:buffer': false,
    'node:stream': false,
    'node:util': false,
    'node:events': false,
    'node:url': false,
    'node:querystring': false,
    'node:os': false,
    'node:child_process': false,
    'node:cluster': false,
    'node:dgram': false,
    'node:dns': false,
    'node:domain': false,
    'node:http': false,
    'node:https': false,
    'node:net': false,
    'node:punycode': false,
    'node:readline': false,
    'node:repl': false,
    'node:string_decoder': false,
    'node:tls': false,
    'node:tty': false,
    'node:v8': false,
    'node:vm': false,
    'node:zlib': false,
    'node:assert': false,
    'node:constants': false,
    'node:module': false,
    'node:process': false,
    'node:timers': false,
    'node:worker_threads': false,
    'node:perf_hooks': false,
    'node:async_hooks': false,
    'node:inspector': false,
    'node:fs/promises': false,
    'node:path/posix': false,
    'node:path/win32': false,
  };
}

// Configure server options
config.server = {
  ...config.server,
  port: parseInt(process.env.METRO_PORT || process.env.PORT || '3001', 10),
  enhanceMiddleware: (middleware, server) => {
    return (req, res, next) => {
      // Add custom middleware here if needed
      return middleware(req, res, next);
    };
  },
};

// Configure watchman options with normalized paths
config.watchFolders = [
  normalizePath(path.resolve(__dirname, 'src')),
  normalizePath(path.resolve(__dirname, 'assets')),
];

// Configure resolver options with normalized paths
config.resolver.nodeModulesPaths = [
  normalizePath(path.resolve(__dirname, 'node_modules')),
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