'use strict'

/* exports */
module.exports = ImmutableCoreController

/* application modules */
const initModule = require('./immutable-core-controller/init-module')
const initModel = require('./immutable-core-controller/init-model')
const initPaths = require('./immutable-core-controller/init-paths')

/**
 * @function ImmutableCoreController
 *
 * instantiate a new controller
 *
 * @param {object} args
 *
 * @returns {ImmutableCoreController}
 *
 * @throws {Error}
 */
function ImmutableCoreController (args) {
    // create module and set options
    this.initModule(args)
    // create default paths for model if passed
    this.initModel(args)
    // create paths from arguments
    this.initPaths(args)
}

/* public methods */
ImmutableCoreController.prototype = {
    // init modules
    initModel: initModel,
    initModule: initModule,
    initPaths: initPaths,
}