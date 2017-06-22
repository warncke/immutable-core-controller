'use strict'

/* npm modules */
const _ = require('lodash')
const changeCase = require('change-case')
const requireValidOptionalObject = require('immutable-require-valid-optional-object')

/* application modules */
const buildActions = require('./build-actions')
const buildFields = require('./build-fields')
const buildForms = require('./build-forms')
const loadInstance = require('./load-instance')
const resolveLinkVariables = require('./resolve-link-variables')

/* exports */
module.exports = initModelRead

/**
 * @function initModelRead
 *
 * get instance controller
 *
 * @param {object} args
 */
function initModelRead (args) {
    var controller = this
    var model = this.model
    // if model does not have id column then cannot use default controller
    if (!model.columnName('id')) {
        return
    }
    // make sure args is object
    args = requireValidOptionalObject(args)
    // make sure read is defined
    args.read = requireValidOptionalObject(args.read)
    // with args for query
    var withArgs
    // load related records
    _.each(model.relations, (relation, relationName) => {
        // create with if not defined
        if (!withArgs) {
            withArgs = {}
        }
        // add all ready models - limit results to 20
        withArgs[relationName] = {
            limit: 20,
        }
    })
    // get role
    var role = args.defaultRole || 'all'
    // save forms
    var forms = args.read && args.read.forms
    // index inputs
    var input = {
        // get current revision of instance
        current: 'query.current',
        // get record even if deleted
        deleted: 'query.deleted',
        // instance id
        id: 'params.id',
    }
    // links to display at top of page
    var links
    // use links from read view
    if (Array.isArray(args.read.links)) {
        links = _.cloneDeep(args.read.links)
    }
    // use global controller links
    else if (Array.isArray(args.links)) {
        links = _.cloneDeep(args.links)
    }
    // set default links
    else {
        links = []
    }
    // create path if it does not exist
    if (!this.paths['/:id']) {
        this.paths['/:id'] = {}
    }
    // add handler for GET /:id to get model instance
    this.paths['/:id'].get = [
        {
            before: function (args) {
                return beforeRead(controller, args, forms, withArgs)
            },
            input: input,
            method: function (args) {
                // format response
                return read(controller, args, links)
            },
            methodName: 'read',
            role: role,
            template: 'instance',
        },
    ]
}

/**
 * @function beforeRead
 *
 * load record, related data, and any form data
 *
 * @param {ImmutableCoreController} controller
 * @param {object} args
 * @param {object} forms
 * @param {object} withArgs
 *
 * @returns {object}
 */
function beforeRead (controller, args, forms, withArgs) {
    // load model instance
    var instancePromise = args.json
        ? loadInstance(controller, args)
        : loadInstance(controller, args, withArgs)
    // if forms are specified build them
    return instancePromise.then(res => {
        // if forms being loaded wait for those too
        if (forms) {
            return buildForms(args, controller, forms, res[controller.model.name])
            // merge forms to res which will go to args
            .then(forms => {
                res.forms = forms
                // return response with instance and forms
                return res
            })
        }
        else {
            // return response with instance
            return res
        }
    })
}

/**
 * @function read
 *
 * return record data
 *
 * @param {ImmutableCoreController} controller
 * @param {object} args
 * @param {array} links
 *
 * @returns {object}
 */
function read (controller, args, links) {
    var record = args[controller.model.name]
    // get local copy of links
    links = _.cloneDeep(links)
    // subsitute any variables in links with values from record
    resolveLinkVariables(links, record)
    // if this is json response return raw data
    if (args.json) {
        return record
    }
    // javascript for page
    var js = []
    // create form to edit instance data
    if (controller.form) {
        var form = controller.form.newInstance({
            action: './'+record.id+'/update',
            mode: 'update',
            record: record,
            submit: {title: 'Update '+changeCase.titleCase(controller.model.name)},
            title: changeCase.titleCase(controller.model.name)+' Record',
        })
        // if form uses ckeditor add js
        if (form.ckeditor) {
            js.push({
                crossorigin: 'anonymous',
                //integrity: 'sha256-TTtB6JD2qVpmE4ydlMyYH52d7OSMq5FQh2f0ECHR0Bw=',
                src: '//cdn.jsdelivr.net/ckeditor/4.3.1/ckeditor.js',
            })
        }
    }
    // related records
    var related = []
    // add related records
    _.each(_.keys(record.related).sort(), relatedName => {
        // get related model
        var relatedModel = controller.model.relation(relatedName).model
        // related records
        var relatedRecords = record.related[relatedName]
        // build actions for related records
        _.each(relatedRecords, record => {
            buildActions(relatedModel.controller, relatedModel, record)
        })
        // get fields for displaying model from controller or build
        var fields = relatedModel.controller && relatedModel.controller.fields || buildFields(relatedModel)
        // add related record with data needed to render
        related.push({
            fields: fields,
            model: relatedModel,
            records: relatedRecords,
        })
    })
    // return form
    return {
        form: form,
        forms: args.forms,
        js: js,
        links: links,
        model: controller.model,
        record: record,
        related: related,
    }
}