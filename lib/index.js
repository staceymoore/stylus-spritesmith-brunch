var logger      = require('loggy'),
    path        = require('path'),
    fs          = require('fs'),
    async       = require('async'),
    progeny     = require('progeny'),
    find        = require('findit'),
    mkdirp      = require('mkdirp'),
    stylus      = require('stylus'),
    spritesmith = require('spritesmith'),
    nib         = require('nib'),
    spriteFns   = require('./sprite_functions');

/**
 * Stylus Compiler with Spritesmith
 *
 * Generates sprite sheets from series of images, defines sprite variables
 * and functions for use in Stylus, and compiles stylesheets to CSS.
 */
function StylusCompiler(config) {
  var plugins = config.plugins;

  // Config
  this.config = config;
  this.stylusConfig = (plugins && plugins.stylus) || {};
  this.spriteConfig = (plugins && plugins.sprites) || {};

  // Modules
  this.stylus = this.stylusConfig.module || stylus;
  this.spritesmith = this.spriteConfig.module || spritesmith;

  // Is sprite generation enabled?
  this.spritesEnabled = this.spriteConfig.enabled === undefined ? true : this.spriteConfig.enabled;

  // Collection of sprite sheets to generate
  this.spriteSheets = this.spriteConfig.spriteSheets || {
    'default': /^app\/assets\/images\/sprites\/(.*)\.png$/
  };

  // Directory in which to output sprite sheets
  this.outputDir = this.spriteConfig.outputDir || 'images/spritesheets';

  // File name to give to output sprite sheets
  this.outputFile = this.spriteConfig.outputFile || '{{name}}.png';

  // Include sprite placeholder selectors and mixins
  this.includeMixins = this.spriteConfig.includeMixins === undefined ? true : this.spriteConfig.includeMixins;

  // Each sprite will `@extend` a sprite sheet class instead of mixing in properties
  this.useExtendDirective = !!this.spriteConfig.useExtendDirective;

  // Default stylesheet when one is not specified in Stylus `sprite` function
  this.defaultSheet = this.spriteConfig.defaultSheet || 'default';

  // Directories to ignore while walking the project for sprites
  this.ignoredDirs = ['.git', 'node_modules', 'bower_components', 'vendor'];

  // Resulting generated sprite data
  this.spriteResults = {};

  // Flags
  this.generatingSprites = false;
  this.spritesCreated = false;

  // Get dependencies
  this.getDependencies = progeny({
    rootPath: this.config.paths.root
  });
}

StylusCompiler.prototype.brunchPlugin = true;
StylusCompiler.prototype.type = 'stylesheet';
StylusCompiler.prototype.extension = 'styl';

/**
 * Invoked by Brunch before compilation of each stylesheet file. Places the
 * arguments passed to the function into a queue while the sprite sheets are
 * prepared and generated once. Afterwards, each callback and Brunch proceeds
 * to `compile`.
 */
StylusCompiler.prototype.lint = function buildSprites(data, filePath, callback) {
  var self = this;

  self.queue = self.queue || [];

  // Proceed to `compile` if sprite sheets are disabled or already generated
  if (!this.spritesEnabled || this.spritesCreated) {
    return callback();
  }

  // Start spritesheet generation if it has not already started or completed
  if (!this.generatingSprites && !this.spritesCreated) {
    self.findSprites(function(sprites) {
      self.generateSprites(sprites, function() {
        self.queue.forEach(function(args) {
          var callback = args[2];
          callback();
        });
      });
    });

  }

  if (!this.spritesCreated) {
    self.queue.push([data, filePath, callback]);
  } else {
    callback();
  }
};

/**
 * Compile Stylus files to CSS with given options.
 */
StylusCompiler.prototype.compile = function compileStylus(data, filePath, callback) {
  var self = this,
      config = this.stylusConfig,
      compiler = this.stylus(data);

  // Set options on the compiler
  compiler
    .set('filename', filePath)
    .set('compress', !!config.compress)
    .set('firebug', !!config.firebug)
    .set('linenos', !!config.lineNumbers)
    .set('include css', !!config.includeCss)

  // Use sprite variables and functions
  if (this.spritesEnabled) {
    compiler.use(spriteFns(this));
  }

  // Use any additional plugins
  compiler.use(nib());

  return compiler.render(callback);
};

/**
 * Walk project directories to find sprite images that match the regular
 * expressions set for each sprite in `this.spriteSheets`.
 */
StylusCompiler.prototype.findSprites = function(callback) {
  var self = this,
      spriteSheets = {},
      finder;

  this.generatingSprites = true;

  // Start walking from the Brunch project root
  finder = find(this.config.paths.root);

  // Stop walking a directory if it's in `this.ignoredDirs`
  finder.on('directory', function(dir, stat, stop) {
    if (self.ignoredDirs.indexOf(dir) > -1) {
      return stop();
    }
  });

  // Test each sprite sheet's regex against each file
  finder.on('file', function(filePath, stat) {
    Object.keys(self.spriteSheets).forEach(function(name) {
      var regex = self.spriteSheets[name];

      if (regex.test(filePath)) {
        spriteSheets[name] = spriteSheets[name] || [];
        spriteSheets[name].push(filePath);
      }
    });
  });

  // Callback with the sprite file paths
  finder.on('end', function() {
    callback(spriteSheets);
  });
};

/**
 * Generate sprite images, coordinates, and properties.
 */
StylusCompiler.prototype.generateSprites = function(spriteSheets, callback) {
  var self = this,
      config = this.spriteConfig,
      publicDir = this.config.paths.public;

  // Generate each sprite sheet
  async.each(Object.keys(spriteSheets), function(spriteSheet, callback) {
    var outputDir = path.join(publicDir, self.outputDir),
        outputFile = self.outputFile.replace(/\{\{name\}\}/, spriteSheet),
        outputPath = path.join(outputDir, outputFile),
        cssPath = '/' + self.outputDir + '/' + outputFile;

    // Spritesmith options
    var options = {
      src: spriteSheets[spriteSheet],
      engine: config.engine || 'auto',
      algorithm: config.algorith || 'binary-tree',
      padding: config.padding,
      exportOpts: config.exportOpts || {},
      engineOpts: config.engineOpts || {}
    };

    options.exportOpts = options.exportOpts.format || 'png';
    options.exportOpts = options.exportOpts.quality || 75;
    options.exportOpts = options.exportOpts.timeout || 10000;

    self.spritesmith(options, function(err, result) {
      if (err) {
        logger.error('failed to generate sprite sheet "' + outputPath + '"');
        return callback(err);
      }

      result.url = cssPath;

      // Store sprite data for use in Stylus functions
      renameCoordinatesKeys(result.coordinates, function(coordinates) {
        result.coordinates = coordinates;
        self.spriteResults[spriteSheet] = result;
      });

      // Write image to disk
      mkdirp(outputDir, function(err) {
        fs.writeFile(outputPath, result.image, 'binary', function(err) {
          if (err) {
            logger.error('failed to write sprite sheet "' + outputPath + '" to disk');
            return callback(err);
          }

          logger.info('generated sprite sheet "' + outputPath + '"');
          callback();
        });
      });
    });
  }, function(err) {
    if (err) return callback(err);

    self.generatingSprites = false;
    self.spritesCreated = true;

    return callback();
  });
};

/**
 * Rename coordinate keys from full image path to just the filename.
 */
function renameCoordinatesKeys(coordinates, callback) {
  var newCoordinates = {};

  Object.keys(coordinates).forEach(function(spriteSheet) {
    newCoordinates[path.basename(spriteSheet)] = coordinates[spriteSheet];
  });

  callback(newCoordinates);
};

module.exports = StylusCompiler;
