// Expo + npm-workspaces monorepo Metro config.
// Lets the host resolve @sibyl/trust and @sibyl/capsule-runtime from packages/*,
// and follow their package.json "exports" subpaths.
const { getDefaultConfig } = require("expo/metro-config");
const path = require("path");

const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, "../..");

const config = getDefaultConfig(projectRoot);
config.watchFolders = [workspaceRoot];
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, "node_modules"),
  path.resolve(workspaceRoot, "node_modules"),
];
config.resolver.unstable_enablePackageExports = true;
module.exports = config;
