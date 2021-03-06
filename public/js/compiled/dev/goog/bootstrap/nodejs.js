// Copyright 2013 The Closure Library Authors.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS-IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

/**
 * @fileoverview A nodejs script for dynamically requiring Closure within
 * nodejs.
 *
 * Example of usage:
 * <code>
 * require('./bootstrap/nodejs')
 * goog.require('goog.ui.Component')
 * </code>
 *
 * This loads goog.ui.Component in the global scope.
 *
 * If you want to load custom libraries, you can require the custom deps file
 * directly. If your custom libraries introduce new globals, you may
 * need to run goog.nodeGlobalRequire to get them to load correctly.
 *
 * <code>
 * require('./path/to/my/deps.js')
 * goog.bootstrap.nodeJs.nodeGlobalRequire('./path/to/my/base.js')
 * goog.require('my.Class')
 * </code>
 *
 * @author nick@medium.com (Nick Santos)
 *
 * @nocompile
 */

var fs        = require("fs");
var vm        = require("vm");
var path      = require("path");
var CLJS_ROOT = ".";


/**
 * The goog namespace in the global scope.
 */
global.goog = {};
global.require = require;

/**
 * Imports a script using Node's require() API.
 *
 * @param {string} src The script source.
 * @return {boolean} True if the script was imported, false otherwise.
 */
global.CLOSURE_IMPORT_SCRIPT = function(src) {
  // if CLJS_ROOT has been rewritten (by REPLs) need to compute require path
  // so we can delete the old entry from the Node.js require cache
  if(CLJS_ROOT !== ".") {
    var cached = null;
    if(src.substring(0, 2) == "..") {
      cached = path.join(CLJS_ROOT, src.substring(3));
    } else {
      cached = path.join(CLJS_ROOT, "goog", src);
    }
    if(require.cache[cached]) delete require.cache[cached];
  }

  // Sources are always expressed relative to closure's base.js, but
  // require() is always relative to the current source.
  nodeGlobalRequire(path.resolve(__dirname, '..', src));
  return true;
};


// Declared here so it can be used to require base.js
function nodeGlobalRequire(file) {
  var _module = global.module, _exports = global.exports;
  global.module = undefined;
  global.exports = undefined;
  global.__dirname = file.substring(0, file.lastIndexOf('/'));
  global.__filename = file;
  vm.runInThisContext(fs.readFileSync(file), file);
  global.__dirname = undefined;
  global.__filename = undefined;
  global.exports = _exports;
  global.module = _module;
}


// Load Closure's base.js into memory.  It is assumed base.js is in the
// directory above this directory given this script's location in
// bootstrap/nodejs.js.
nodeGlobalRequire(path.resolve(__dirname, '..', 'base.js'));


/**
 * Bootstraps a file into the global scope.
 *
 * This is strictly for cases where normal require() won't work,
 * because the file declares global symbols with 'var' that need to
 * be added to the global scope.
 * @suppress {missingProvide}
 *
 * @param {string} file The path to the file.
 */
goog.nodeGlobalRequire = nodeGlobalRequire;

