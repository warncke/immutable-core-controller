'use strict'

/* npm modules */
const _ = require('lodash')
const changeCase = require('change-case')

/* application modules */
const buildFields = require('./build-fields')
const buildForms = require('./build-forms')
const loadInstance = require('./load-instance')

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
                return read(controller, args)
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
 *
 * @returns {object}
 */
function read (controller, args) {
    var record = args[controller.model.name]
    // if this is json response return raw data
    if (args.json) {
        return record
    }
    // create form to edit instance data
    if (controller.form) {
        var form = controller.form.newInstance({
            action: './'+record.id+'/update',
            mode: 'update',
            record: record,
            submit: {title: 'Update '+changeCase.titleCase(controller.model.name)},
            title: changeCase.titleCase(controller.model.name)+' Record',
        })
    }
    // related records
    var related = []
    // add related records
    _.each(_.keys(record.related).sort(), relatedName => {
        // get related model
        var relatedModel = controller.model.relation(relatedName).model
        // get fields for displaying model from controller or build
        var fields = relatedModel.controller && relatedModel.controller.fields || buildFields(relatedModel)
        // add related record with data needed to render
        related.push({
            fields: fields,
            model: relatedModel,
            records: record.related[relatedName],
        })
    })
    // return form
    return {
        form: form,
        forms: args.forms,
        model: controller.model,
        record: record,
        related: related,
    }
}