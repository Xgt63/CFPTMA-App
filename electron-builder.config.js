/**
 * Configuration Electron Builder pour Windows
 */

module.exports = {
  appId: 'com.cfpt-ivato.evaluation-system',
  productName: 'CFPT - Syst�me de gestion des �valuations',
  
  directories: {
    output: 'dist-electron',
    buildResources: 'assets'
  },
  
  files: [
    'main.js',
    'dist/**/*',
    'electron/**/*',
    'assets/**/*',
    'package.json',
    'node_modules/**/*',
    '!node_modules/.cache/**/*',
    '!**/node_modules/*/{CHANGELOG.md,README.md,readme.md,readme}',
    '!**/node_modules/*/{test,__tests__,tests,powered-test,example,examples}',
    '!**/node_modules/*.d.ts',
    '!**/node_modules/.bin',
    '!**/*.{iml,o,hprof,orig,pyc,pyo,rbc,swp,csproj,sln,xproj}',
    '!**/{.DS_Store,.git,.hg,.svn,CVS,RCS,SCCS,.gitignore,.gitattributes}',
    '!**/{__pycache__,thumbs.db,.flowconfig,.idea,.vs,.nyc_output}',
    '!**/{appveyor.yml,.travis.yml,circle.yml}',
    '!**/{npm-debug.log,yarn.lock,.yarn-integrity,.yarn-metadata.json}'
  ],
  
  // ✅ Utiliser asarUnpack pour laisser dist/** en dehors de asar
  asarUnpack: [
    'dist/**/*'
  ],
  
  extraMetadata: {
    main: 'main.js'
  },
  
  win: {
    target: [{ target: 'nsis', arch: ['x64'] }],
    icon: 'assets/icon.ico',
    artifactName: '${productName} Setup ${version}.${ext}'
  },
  
  nsis: {
    oneClick: false,
    allowElevation: true,
    allowToChangeInstallationDirectory: true,
    installerIcon: 'assets/icon.ico',
    uninstallerIcon: 'assets/icon.ico',
    installerHeaderIcon: 'assets/icon.ico',
    createDesktopShortcut: true,
    createStartMenuShortcut: true,
    shortcutName: 'CFPT Manager',
    artifactName: '${productName} Setup ${version}.${ext}'
  },
  
  copyright: '© 2026 CFPT Ivato',
  compression: 'normal',
  buildDependenciesFromSource: false
};
