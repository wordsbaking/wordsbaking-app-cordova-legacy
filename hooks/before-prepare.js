const FS = require('fs-extra');
const Path = require('path');

const makeDir = require('make-dir');
const minimist = require('minimist');
const xml2js = require('xml2js');
const v = require('villa');


const {readXML, writeFile, readPList, resolveVersion} = require('./helpers');

const {
  PROJECT_DIR,
  PLATFORMS_DIR,
  PLATFORM_ANDROID_DIR,
  PLATFORM_IOS_DIR,
} = require('./constants');

module.exports = async context => {
  let platforms = context.opts.platforms;

  let prepareOptions = {
  };

  let promises = [];

  for (let platform of platforms) {
    switch (platform) {
      case 'android':
        promises.push(prepareAndroidResources(prepareOptions));
        break;
      case 'ios':
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

async function prepareAndroidResources(prepareOptions) {
  await v.map([
    ['mdpi', 'icon_round-48-mdpi.png'],
    ['hdpi', 'icon_round-72-hdpi.png'],
    ['xhdpi', 'icon_round-96-xhdpi.png'],
    ['xxhdpi','icon_round-144-xxhdpi.png'],
    ['xxxhdpi','icon_round-192-xxxhdpi.png'],
  ], ([dpi, iconFile]) => FS.copy(
    Path.join(PROJECT_DIR, `res/icon/android/${iconFile}`),
    Path.join(PLATFORM_ANDROID_DIR, `res/mipmap-${dpi}/icon_round.png`)));

  let androidManifestXMLPath = Path.join(PLATFORM_ANDROID_DIR, './AndroidManifest.xml');

  let androidManifestXML = await readXML(androidManifestXMLPath);

  androidManifestXML.manifest.application[0].$['android:roundIcon'] = '@mipmap/icon_round';

  let xmlBuilder = new xml2js.Builder();

  await writeFile(androidManifestXMLPath, xmlBuilder.buildObject(androidManifestXML));
}
