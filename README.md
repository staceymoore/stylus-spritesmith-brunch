stylus-spritesmith-brunch
=========================

Adds Stylus support to Brunch with automatic sprite sheet generation.

Usage
-----

Install the plugin via npm with `npm install --save stylus-spritemith-brunch`.

Or, do manual install:

* Add `"stylus-spritesmith-brunch": "x.y.z"` to `package.json` of your Brunch app.
* If you want to use the `master` branch of the plugin, add `"stylus-spritesmith-brunch": "git+ssh://git@github.com:jas/stylus-spritesmith-brunch.git"`.

*Note: This plugin is a replacement for `stylus-brunch`.*

Using Sprites
-------------

This plugin defines Stylus mixins, variables, and functions that make using sprites in your stylesheets almost effortless.

Just drop images into `app/assets/images/sprites`, and a sprite sheet will be compiled to `public/images/spritesheets/default.png`.

If you need to configure the input and output directories, reference the **Plugin Options** section.

### Mixin

The `sprite` mixin is the easiest way to use a sprite image. To use the mixin, you must first import it into your stylesheets.

```
@import "sprites"
```

Then use it like so...

```styl
.logo {
  sprite('logo.png') // finds "icon-star.png" in default sprite sheet
}
```

If you have multiple sprite sheets, a second argument can be given to specify the sprite sheet to which the image belongs.
```
.icon-star {
  sprite('icon-star.png', 'icons') // finds "icon-star.png" in sprite sheet named "icons"
}
```

### Variables and Functions

The following variables and functions are also available for use in your stylesheets.

| Variable               | Type    | Description
|------------------------|---------|-------------
| `sprite-sheets`        | List    | List of sprite sheets generated
| `default-sprite-sheet` | String  | Value of config option `plugins.sprites.defaultSheet`
| `extend-sprite-sheets` | Boolean | Value of config option `plugins.sprites.useExtendDirective`

#### Sprite Sheet Functions

These functions return values about a given `sprite-sheet`.

| Function              | Description
|-----------------------|-------------
| `sprite-sheet-path`   | String — absolute path to the sprite sheet image
| `sprite-sheet-width`  | Unit, `px` — width of an entire sprite sheet
| `sprite-sheet-height` | Unit, `px` — height of an entire sprite sheet

#### Sprite Images

These functions return values about a given `image`. A second, optional `sprite-sheet` argument can be given to specify the sprite sheet to which the image belongs.

| Function              | Description
|-----------------------|-------------
| `sprite-image-width`  | Unit, `px` — width of an individual sprite image
| `sprite-image-height` | Unit, `px` — height of an individual sprite image
| `sprite-image-x`      | Unit, `px` — x-position of a sprite
| `sprite-image-y`      | Unit, `px` — y-position of a sprite

Plugin Options
--------------

Options for Stylus and Spritesmith can be set in the `plugins` object in your `brunch-config`. All values below are the defaults.

### Stylus

```js
plugins: {
  stylus: {
    // Compress CSS output.
    compress: false,

    // Emits debug info that can be used by the FireStylus Firebug plugin.
    firebug: false,

    // Emits comments in the generated CSS indicating the corresponding Stylus lines.
    lineNumbers: false,

    // Include regular CSS on @import.
    includeCss: false
  }
}
```

### Sprites

```js
plugins: {
  sprites: {
    // Use sprite features.
    enabled: true,

    // Directory in which to output sprite sheet images.
    outputDir: 'images/spritesheets',

    // File name of output sprite sheet images.
    outputFile: '{{name}}.png',

    // Include provided `sprite` mixin when compiling Stylus.
    includeMixins: true,

    // Sprite mixin will `@extend` a sprite sheet's styles, instead of
    // including them directly in the selector in which the mixin is used.
    useExtendDirective: false,

    // Name of the default sprite sheet to use when one is not passed to the
    // provided Stylus mixin or functions.
    defaultSheet: 'default',

    // Sprite sheets to generate. The regular expression matches images to
    // include in that particular sprite sheet.
    spriteSheets: {
      'default': /^app\/assets\/images\/sprites\/(.*)\.png$/
    },

    // Engine Spritemith uses to generate images ('phantomjs', 'canvas', 'gm')
    // See https://github.com/Ensighten/spritesmith for more information.
    engine: 'auto',

    // Image packing algoritm ('binary-tree', 'top-down', 'left-right', 'diagonal', 'alt-diagonal')
    algoritm: 'binary-tree',

    // Padding in pixels to add between sprite images
    padding: 0,

    // Options to pass through to engine for settings
    exportOpts: {
      // Format of output sprite sheets ('png', 'jpeg'); Canvas and gm engines only
      format: 'png',

      // Quality of output sprite sheets; gm engine only
      quality: 75,

      // Milliseconds to wait until terminating PhantomJS script; phantomjs engine only
      timeout: 10000
    },

    // Options to pass through to engine for export
    engineOpts: {},
  }
}
```

License
-------

The MIT License (MIT)

Copyright (c) 2013 Jason Sandmeyer

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
