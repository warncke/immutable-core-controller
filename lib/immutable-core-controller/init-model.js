'use strict'

/* native modules */
const assert = require('assert')
const defined = require('if-defined')

/* npm modules */
const ImmutableCoreModel = require('immutable-core-model')
const ImmutableCoreModelForm = require('immutable-core-model-form')
const _ = require('lodash')
const changeCase = require('change-case')
const debug = require('debug')('immutable-core-controller')

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
    // if model has data then create form for it
    if (this.model.schemaData && _.keys(this.model.schemaData.properties).length) {
        // build args for new form
        var formArgs = {
            action: './',
            method: 'POST',
            model: this.model,
            submit: {
                title: 'Create '+changeCase.titleCase(this.model.name),
            },
            title: 'New '+changeCase.titleCase(this.model.name),
        }
        // merge any args for form
        _.merge(formArgs, args.form)
        // create new form instance from model
        this.form = new ImmutableCoreModelForm(formArgs)
    }
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
    // new instance controller
    this.initModelNew(args)
    // create instance controller
    this.initModelCreate(args)
    // get instance controller
    this.initModelRead(args)
    // update instance controller
    this.initModelUpdate(args)
    // link model to relations controller
    this.initModelLink(args)
    // unlink model from relation controller
    this.initModelUnlink(args)
    // delete instance controller
    this.initModelDelete(args)
    // model schema controller
    this.initModelSchema(args)
    // validate data controller
    this.initModelValidate(args)
}