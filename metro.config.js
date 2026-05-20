const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Exclude admin directory and build files from Metro watcher to prevent file-watching ENOENT crashes on Windows
config.resolver.blockList = [
  /c:\\Users\\Invinciblx777\\Downloads\\DaluxeOfficial-main\\admin\/.*/,
  /.*\/admin\/.*/,
  /.*\.next\/.*/
];

module.exports = config;
