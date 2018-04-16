const FS = require('fs');
const Path = require('path');
const xml2js = require('xml2js');
const plist = require('plist');;
const minimist = require('minimist');

const {readXML, writeFile, readPList, resolveVersion} = require('./helpers');

const {
  PLATFORMS_DIR,
  PLATFORM_ANDROID_DIR,
  PLATFORM_IOS_DIR,
} = require('./constants');

let configTplXMLPath = Path.join(__dirname, '../config-tpl.xml');
let configXMLPath = Path.join(__dirname, '../config.xml');

module.exports = async context => {
  await FS.copyFileSync(configTplXMLPath, configXMLPath);
  let platforms = context.opts.platforms;
  let compileOptions = context.opts.options;
  let configXML = await readXML(configXMLPath);
  let argv = minimist(compileOptions.argv);
  let version = argv['build-version'] ? resolveVersion(argv['build-version']) : undefined;
  let appName = configXML.widget.name[0];
  let displayName = configXML.widget.displayName[0];

  let preProcessOptions = {
    compileOptions,
    argv,
    configXML,
    version,
    isReleaseMode: !!compileOptions.release,
    appName,
    displayName,
  };

  let promises = [];

  if (platforms.length > 1) {
    throw new Error('Don\'t support build multiple platform');
  }

  for (let platform of platforms) {
    switch (platform) {
      case 'android':
        promises.push(preProcessAndroidPlatform(preProcessOptions));
        break;
      case 'ios':
        promises.push(preProcessIOSPlatform(preProcessOptions));
        break;
    }
  }

  try {
    await Promise.all(promises);
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
};

async function preProcessAndroidPlatform(options) {
  let {compileOptions, argv, configXML, version, isReleaseMode, displayName} = options;

  let androidManifestXMLPath = Path.join(PLATFORM_ANDROID_DIR, './AndroidManifest.xml');
  let androidStringsXMLPath = Path.join(PLATFORM_ANDROID_DIR, './res/values/strings.xml');

  let xmlBuilder = new xml2js.Builder();

  if (isReleaseMode && version) {
    let androidManifestXML = await readXML(androidManifestXMLPath);

    androidManifestXML.manifest.$['android:versionName'] = version.name;
    androidManifestXML.manifest.$['android:versionCode'] = version.code;

    await writeFile(androidManifestXMLPath, xmlBuilder.buildObject(androidManifestXML));
  }

  let stringsXML = await readXML(androidStringsXMLPath);

  for (let stringItem of stringsXML.resources.string) {
    if (stringItem.$.name === 'app_name') {
      stringItem._ = displayName;
    }
  }

  await writeFile(androidStringsXMLPath, xmlBuilder.buildObject(stringsXML));
}

async function preProcessIOSPlatform(options) {
  let {appName, configXML, displayName, isReleaseMode, version} = options;

  configXML.widget.$.id = 'com.vilicvane.wordsbaking-ios'

  let appInfoPlistPath = Path.join(__dirname, `../platforms/ios/${appName}/${appName}-Info.plist`);
  let appInfoPlist = await readPList(appInfoPlistPath);

  let xmlBuilder = new xml2js.Builder();

  appInfoPlist['CFBundleDevelopmentRegion'] = 'zh-Hans';
  appInfoPlist['CFBundleDisplayName'] = displayName;
  appInfoPlist['CFBundleName'] = displayName;

  if (isReleaseMode && version) {
    appInfoPlist['CFBundleShortVersionString'] = version.name;
    appInfoPlist['CFBundleVersion'] = version.name;
  }

  await writeFile(appInfoPlistPath, plist.build(appInfoPlist));
  await writeFile(configXMLPath, xmlBuilder.buildObject(configXML));
}

async function updateAndroidBuildVersion(version) {

}

async function updateIOSBuildVersion(version) {
}
