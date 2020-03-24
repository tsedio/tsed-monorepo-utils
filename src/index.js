Object.assign(exports, {
  ...require('./build'),
  ...require('./clean'),
  ...require('./copy'),
  ...require('./findPackages'),
  ...require('./getDependencies'),
  ...require('./glob'),
  ...require('./MonoRepo'),
  ...require('./publishPackages'),
  ...require('./readPackage'),
  ...require('./syncDependencies'),
  ...require('./updateVersions'),
  ...require('./writePackage'),
  ...require('./writePackages')
})
