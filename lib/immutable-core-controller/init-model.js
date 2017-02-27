'use strict'

/* native modules */
const assert = require('assert')

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
    // require something that looks like model
    assert.ok(ImmutableCoreModel.looksLike(args.model), 'invalid model')
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
    // delete instance controller
    this.initModelDelete(args)
    // action controller(s)
    this.initModelActions(args)
    // model schema controller
    this.initModelSchema(args)
    // validate data controller
    this.initModelValidate(args)
}