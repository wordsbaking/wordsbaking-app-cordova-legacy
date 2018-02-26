const FS = require('fs');
const Path = require('path');
const minimist = require('minimist');
const xml2js = require('xml2js');
const plist = require('plist');

const PLATFORMS_DIR = Path.join(__dirname, '../platforms');
const PLATFORM_ANDROID_DIR = Path.join(PLATFORMS_DIR, 'android');
const PLATFORM_IOS_DIR = Path.join(PLATFORM_ANDROID_DIR, 'ios');

const configXMLPath = Path.join(__dirname, '../config.xml');

module.exports = async function(context) {
  let configXML = await readXML(configXMLPath);
  let platforms = context.opts.platforms;
  let compileOptions = context.opts.options;
  let argv = minimist(compileOptions.argv);
  let version = argv.version ? resolveVersion(argv.version) : undefined;
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

  return Promise.all(promises);
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
  let {appName, displayName, isReleaseMode, version} = options;

  let appInfoPlistPath = Path.join(__dirname, `../platforms/ios/${appName}/${appName}-Info.plist`);
  let appInfoPlist = await readPList(appInfoPlistPath);

  appInfoPlist['CFBundleDevelopmentRegion'] = 'zh-Hans';
  appInfoPlist['CFBundleDisplayName'] = displayName;
  appInfoPlist['CFBundleName'] = displayName;

  if (isReleaseMode && version) {
    appInfoPlist['CFBundleShortVersionString'] = version.name;
    appInfoPlist['CFBundleVersion'] = version.name;
  }

  await writeFile(appInfoPlistPath, plist.build(appInfoPlist));
}

function resolveVersion(versionName) {
  if (!/^\d+\.\d+\.\d+$/.test(versionName)) {
    throw new Error('Invalid version');
  }

  let [major, minor, patch] = versionName.split('.').map(Number);

  return {
    name: versionName,
    code: major * 10000 + minor * 100 + patch,
  };
}

async function updateAndroidBuildVersion(version) {

}

async function updateIOSBuildVersion(version) {
}

async function readXML(path) {
  let content = await readFile(path);
  return parseXML(content);
}

async function readPList(path) {
  let content = await readFile(path);
  return plist.parse(content);
}

function parseXML(xml) {
  return new Promise((resolve, reject) => {
    xml2js.parseString(xml, (error, result) => {
      if (error) {
        reject(error);
      } else {
        resolve(result);
      }
    });
  });
}

function readFile(path) {
  return new Promise((resolve, reject) => {
    FS.readFile(path, 'utf8', (error, data) => {
      if (error) {
        reject(error);
      } else {
        resolve(data);
      }
    });
  });
}

function writeFile(path, data) {
  return new Promise((resolve, reject) => {
    FS.writeFile(path, data, 'utf8', (error) => {
      if (error) {
        reject(error);
      } else {
        resolve();
      }
    });
  });
}
