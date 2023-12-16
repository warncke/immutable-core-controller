'use strict'

/* native modules */
const assert = require('assert')
const defined = require('if-defined')

/* exports */
module.exports = initModel

/**
 * @function initModel
 *
 * create default paths for model if passed
 *
 * @param {object} args
 *
 * @throws {Error}
 */
function initModel (args) {
    // if model is not passed then do nothing
    if (!args.model) {
        return
    }
    // if paths is false then do not create any default paths
    if (args.paths === false) {
        return
    }
    // require object to have ImmutableCoreObject class property
    assert.ok(args.model.ImmutableCoreModel, 'invalid model')
    // save model
    this.model = args.model
    // register controller with model
    this.model.controller = this
    // create path entry if it does not exist
    if (!this.paths) {
        this.paths = {}
    }
    // create actions object
    this.actions = {}
    // merge actions from controller spec
    if (defined(args.actions)) {
        // do not allow array
        if (Array.isArray(args.actions)) {
            throw new Error(`actions array deprecated for controller ${this.model.name}`)
        }
        // get actions from controller spec
        _.merge(this.actions, args.actions)
    }
    // create list view controller
    this.initModelList(args)
    // create instance controller
    this.initModelCreate(args)
    // get instance controller
    this.initModelRead(args)
    // update instance controller
    this.initModelUpdate(args)
    // replace instance controller
    this.initModelReplace(args)
    // delete instance controller
    this.initModelDelete(args)
    // model schema controller
    this.initModelSchema(args)
    // validate data controller
    this.initModelValidate(args)
}