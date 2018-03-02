
const FS = require('fs-extra');
const Path = require('path');

const xml2js = require('xml2js');
const plist = require('plist');
const v = require('villa');

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

async function readXML(path) {
  let content = await readFile(path);
  return parseXML(content);
}

async function readPList(path) {
  let content = await readFile(path);
  return plist.parse(content);
}

function parseXML(xml) {
  return v.call(xml2js.parseString, xml);
}

function readFile(path) {
  return v.call(FS.readFile, path, 'utf8')
}

function writeFile(path, data) {
  return v.call(FS.writeFile, path, data, 'utf8');
}

module.exports = {
  resolveVersion,
  readXML,
  readPList,
  parseXML,
  readFile,
  writeFile,
};
