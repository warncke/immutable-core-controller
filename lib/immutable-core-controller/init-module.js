'use strict'

/* native modules */
const assert = require('assert')

/* npm modules */
const debug = require('debug')('immutable-core-controller')

/* application modules */
const immutable = require('immutable-core')

/* exports */
module.exports = initModule

/* constants */
const DEFAULT_LIMIT = 20

/**
 * @function initModule
 *
 * called by new ImmutableCoreController to create module and set options
 *
 * @param {object} args
 *
 * @throws {Error}
 */
function initModule (args) {
    debug('new ImmutableCoreController', args)
    // require object for args
    assert.equal(typeof args, 'object', 'argument must be object')
    // get name from args if set
    if (args.name) {
        // require name to be string
        assert.equal(typeof args.name, 'string', 'name must be string')
        // set name
        this.name = args.name
    }
    else {
        // use model name if set
        if (args.model) {
            this.name = args.model.name
        }
        // require name
        else {
            throw new Error('name required')
        }
    }
    // set model
    this.model = args.model
    // module name is model name with Controller appended
    this.moduleName = this.name+'Controller'
    // create new immutable module for model - this will throw error
    // if moduleName is already defined
    this.module = immutable.module(this.moduleName, {})
    // get module meta data
    var meta = this.module.meta()
    // add info to module meta
    meta.class = 'ImmutableCoreController'
    meta.instance = this
    // set default limit for index results
    this.defaultLimit = args.defaultLimit || DEFAULT_LIMIT
}