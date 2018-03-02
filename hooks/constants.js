const Path = require('path');

const PROJECT_DIR = Path.join(__dirname, '../');
const PLATFORMS_DIR = Path.join(PROJECT_DIR, 'platforms');
const PLATFORM_ANDROID_DIR = Path.join(PLATFORMS_DIR, 'android');
const PLATFORM_IOS_DIR = Path.join(PLATFORM_ANDROID_DIR, 'ios');

module.exports = {
  PROJECT_DIR,
  PLATFORMS_DIR,
  PLATFORM_ANDROID_DIR,
  PLATFORM_IOS_DIR,
};
