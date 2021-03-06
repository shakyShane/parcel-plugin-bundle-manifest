const path = require('path');
const hasha = require('hasha');
const fs = require('fs');

module.exports = function (bundler) {

  /**
   * Read the paths already registered within the manifest.json
   * @param {string} path 
   * @returns {Object}
   */
  const readManifestJson = (path) => {
    if (!fs.existsSync(path)) {
      return {};
    };

    try {
      return JSON.parse(fs.readFileSync(path, 'utf8'));
    } catch(e) {

      throw e; 
    }
  };

  /**
   * Feed the manifest exploring childBundles recursively
   * @param {Bundle} bundle 
   * @param {Object} manifestValue 
   * @param {string} publicURL 
   */
  const feedManifestValue = (bundle, manifestValue, publicURL) => {
    let output = path.join(publicURL, path.basename(bundle.name));
    let input = bundle.entryAsset ? bundle.entryAsset.basename : bundle.assets.values().next().value.basename;
    manifestValue[input] = output;
    bundle.childBundles.forEach(function (bundle) {
      feedManifestValue(bundle, manifestValue, publicURL);
    });
  }

  bundler.on('bundled', (bundle) => {
    const dir = bundle.entryAsset.options.outDir;
    const publicURL = bundle.entryAsset.options.publicURL;

    const manifestPath = path.resolve(dir, 'parcel-manifest.json');
    const manifestValue = readManifestJson(manifestPath);

    feedManifestValue(bundle, manifestValue, publicURL);

    fs.writeFileSync(manifestPath, JSON.stringify(manifestValue));
  });
};
