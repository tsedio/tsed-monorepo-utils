"use strict";

const fse = require("fs-extra");
const path = require("path");
const findUp = require("find-up");
const glob = require("glob");

const loadPackageJson = (packagePath) => {
  try {
    return fse.readJsonSync(packagePath);
  } catch (err) {
    throw err;
  }
};

const getWorkspacesRootConfig = (dir) => {
  const packageJsonUp = findUp.sync("package.json", {cwd: dir});

  if (packageJsonUp === null) {
    return false;
  }

  const packageObj = loadPackageJson(packageJsonUp);

  if (packageObj.workspaces && (Array.isArray(packageObj.workspaces) || Reflect.has(packageObj.workspaces, "packages"))) {
    return {
      root: path.dirname(packageJsonUp),
      workspaces: packageObj.workspaces
    };
  }

  return getWorkspacesRootConfig(path.dirname(dir));
};

const getPackagePaths = (root, workspacesList) => {
  const packageList = [];

  workspacesList.forEach((workspace) => {
    const workspaceDir = path.dirname(workspace);
    const workspaceAbsDir = path.join(root, workspaceDir);
    const packageJsonGlob = path.join("**!(node_modules)", "package.json");
    const packageJsonAbsPaths = glob.sync(packageJsonGlob, {cwd: workspaceAbsDir}).map((pkgPath) => path.join(workspaceAbsDir, pkgPath));

    packageList.push(...packageJsonAbsPaths);
  });

  return packageList;
};

const getDeep = (obj, keyChain) => {
  const nextKey = keyChain.shift();
  const has = Reflect.has(obj, nextKey);
  const val = obj[nextKey];

  if (keyChain.length === 0) {
    return val;
  }

  if (has) {
    return getDeep(val, keyChain);
  }

  return false;
};

const resolveBabelLoaderPaths = ({root, workspacesList}, packageEntry) => {
  const packageJsonPaths = getPackagePaths(root, workspacesList);
  const babelLoaderPaths = [];

  packageJsonPaths.map((absPkgPath) => {
    const packageJson = loadPackageJson(absPkgPath);
    const mainSrcFile = getDeep(packageJson, [packageEntry]);

    if (mainSrcFile) {
      const mainSrcPath = path.dirname(mainSrcFile);
      const packageAbsDir = path.dirname(absPkgPath);
      const absSrcPath = path.join(packageAbsDir, mainSrcPath);
      babelLoaderPaths.push(absSrcPath);
    }
  });

  return babelLoaderPaths;
};

const loadAppSettings = (appPackageJson) => {
  const result = {workspaces: {}, dependencies: {}};

  const appPackageObj = loadPackageJson(appPackageJson);
  const dependencies = getDeep(appPackageObj, ["dependencies"]);
  const devDependencies = getDeep(appPackageObj, ["devDependencies"]);

  if (!dependencies && !devDependencies) {
    return result;
  }

  if (dependencies) {
    result.dependencies = Object.assign(result.dependencies, dependencies);
  }

  if (devDependencies) {
    result.dependencies = Object.assign(result.dependencies, devDependencies);
  }

  const reactScripts = getDeep(appPackageObj, ["react-scripts"]);

  if (!reactScripts) {
    return result;
  }

  const workspaces = getDeep(reactScripts, ["workspaces"]);

  result.workspaces = workspaces;
  if (!workspaces) {
    return result;
  }

  return workspaces;
};

const guard = (appDirectory, appPackageJson) => {
  if (!appDirectory) {
    throw new Error("appDirectory not provided");
  }

  if (typeof appDirectory !== "string") {
    throw new Error("appDirectory should be a string");
  }

  if (!appPackageJson) {
    throw new Error("appPackageJson not provided");
  }

  if (typeof appPackageJson !== "string") {
    throw new Error("appPackageJson should be a string");
  }
};

const getPkg = (path) => {
  const pkgPath = findUp.sync("package.json", {cwd: path});
  return loadPackageJson(pkgPath);
};

const getDeps = (pkg) => {
  const deps = getDeep(pkg, ["dependencies"]);
  const devDeps = getDeep(pkg, ["devDependencies"]);

  let dependencies = {};

  if (deps) {
    dependencies = Object.assign(dependencies, deps);
  }

  if (devDeps) {
    dependencies = Object.assign(dependencies, devDeps);
  }

  return dependencies;
};

const depsTable = {};

const buildDepsTable = (srcPaths) => {
  srcPaths.forEach((path) => {
    const pkg = getPkg(path);
    const name = pkg.name;
    const deps = getDeps(pkg);
    depsTable[name] = {path, deps};
  });
};

const filterSrcPaths = (srcPaths, dependencies) => {
  const filteredPaths = [];

  srcPaths.forEach((path) => {
    const pkg = getPkg(path);

    if (dependencies && Reflect.has(dependencies, pkg.name)) {
      filteredPaths.push(path);

      const subDeps = depsTable[pkg.name].deps;
      const subPaths = filterSrcPaths(srcPaths, subDeps);
      filteredPaths.push(...subPaths);
    }
  });

  return filteredPaths;
};

const init = (paths) => {
  guard(paths.appPath, paths.appPackageJson);

  const config = {
    root: null,
    paths: [],
    packageEntry: "main",
    development: true,
    production: true
  };

  const {root, workspaces} = getWorkspacesRootConfig(path.resolve(paths.appPath));

  const workspacesList = [];

  // Normally "workspaces" in package.json is an array
  if (Array.isArray(workspaces)) {
    workspacesList.push(...workspaces);
  }

  // Sometimes "workspaces" in package.json is an object
  // with a ".packages" sub-array, eg: when used with "nohoist"
  // See: https://yarnpkg.com/blog/2018/02/15/nohoist
  if (workspaces && !Array.isArray(workspaces) && Reflect.has(workspaces, "packages")) {
    workspacesList.push(...workspaces.packages);
  }

  if (workspacesList.length === 0) {
    return config;
  }
  console.log("Yarn Workspaces paths detected.");
  config.root = root;

  const appSettings = loadAppSettings(paths.appPackageJson);

  if (Reflect.has(appSettings.workspaces, "development")) {
    config.development = !!appSettings.workspaces.development;
  }

  if (Reflect.has(appSettings.workspaces, "production")) {
    config.production = !!appSettings.workspaces.production;
  }

  if (Reflect.has(appSettings.workspaces, "package-entry")) {
    config.packageEntry = appSettings.workspaces["package-entry"];
  }

  const babelSrcPaths = resolveBabelLoaderPaths({root, workspacesList}, config.packageEntry);

  buildDepsTable(babelSrcPaths);

  const applicableSrcPaths = [...new Set(filterSrcPaths(babelSrcPaths, appSettings.dependencies))];

  console.log(`Found ${babelSrcPaths.length} path(s) with "${config.packageEntry}" entry.`);

  if (applicableSrcPaths.length > 0) {
    config.paths.push(...applicableSrcPaths);
  }

  console.log("Exporting Workspaces config to Webpack.");

  return config;
};

module.exports = {
  init,
  configure(webpackConfig, {env, paths}) {
    const workspacesConfig = init(paths);

    const dev = env === "development";
    const prod = env === "production";
    const node_modules = [workspacesConfig.root].concat(workspacesConfig.paths).map((p) => `${p}/node_modules`);

    // update node_modules paths
    webpackConfig.resolve.modules = Array.from(webpackConfig.resolve.modules).concat(node_modules);

    webpackConfig.resolve.plugins = [webpackConfig.resolve.plugins[0]];

    const include =
      dev && workspacesConfig.development
        ? [workspacesConfig.paths, paths.appSrc]
        : prod && workspacesConfig.production
        ? [workspacesConfig.paths, paths.appSrc]
        : paths.appSrc;

    const rule = webpackConfig.module.rules[1];

    // linter
    rule.include = include;
    // skip package node_modules from linter
    rule.exclude = node_modules;
    // loader
    rule.oneOf[2].include = include;

    // process.exit()
    return webpackConfig;
  },
  ensureReact(webpackConfig) {
    webpackConfig.resolve.alias = {
      ...webpackConfig.resolve.alias,
      "react/jsx-dev-runtime": require.resolve("react/jsx-dev-runtime"),
      "react/jsx-runtime": require.resolve("react/jsx-runtime"),
      react: require.resolve("react")
    };

    return webpackConfig;
  }
};
