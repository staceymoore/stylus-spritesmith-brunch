/**
 * Define variables and functions to use within Stylus files to return
 * information about the generated sprite sheets and images.
 */

module.exports = function(context) {
  var self    = context,
      stylus  = self.stylus,
      nodes   = stylus.nodes,
      utils   = stylus.utils,
      results = self.spriteResults;

  var spriteSheets = Object.keys(results);

  function getSpriteSheet(spriteSheet) {
    spriteSheet = spriteSheet || new nodes.Null();

    if (spriteSheet.toBoolean().isFalse) {
      spriteSheet = new nodes.String(self.defaultSheet);
    }

    utils.assertType(spriteSheet, 'string', 'spriteSheet');

    if (!results[spriteSheet.val]) {
      var err = new Error('Could not find sprite sheet "' + spriteSheet.val + '"');
      throw utils.formatException(err, spriteSheet);
    }

    return results[spriteSheet.val];
  }

  function spriteSheetPath() {
    return function(spriteSheet) {
      var data = getSpriteSheet(spriteSheet);
      return new nodes.String(data.url);
    }
  }

  function spriteSheetProperty(property) {
    return function(spriteSheet) {
      var data = getSpriteSheet(spriteSheet);
      return new nodes.Unit(data.properties[property], 'px');
    }
  }

  function spriteImageProperty(property) {
    return function(image, spriteSheet) {
      var data = getSpriteSheet(spriteSheet);

      utils.assertType(image, 'string', 'image');

      if (!data.coordinates[image.val]) {
        var err = new Error('Could not find image "' + image.val + '" in sprite sheet "' + spriteSheet.val + '"');
        throw utils.formatException(err, spriteSheet);
      }

      return new nodes.Unit(data.coordinates[image.val][property], 'px');
    }
  }

  return function(compiler) {
    // Placeholder Selectors and Mixins
    if (self.includeMixins) {
      compiler.include(__dirname);
    }

    // Variables
    compiler.define('sprite-sheets', spriteSheets);
    compiler.define('default-sprite-sheet', self.defaultSheet);
    compiler.define('extend-sprite-sheets', self.useExtendDirective);

    // Functions
    compiler.define('sprite-sheet-path', spriteSheetPath());
    compiler.define('sprite-sheet-width', spriteSheetProperty('width'));
    compiler.define('sprite-sheet-height', spriteSheetProperty('height'));
    compiler.define('sprite-image-width', spriteImageProperty('width'));
    compiler.define('sprite-image-height', spriteImageProperty('height'));
    compiler.define('sprite-image-x', spriteImageProperty('x'));
    compiler.define('sprite-image-y', spriteImageProperty('y'));
  }
};
