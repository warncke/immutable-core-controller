'use strict'

/* native modules */
const assert = require('assert')

/* npm modules */
const ImmutableCoreModel = require('immutable-core-model')
const _ = require('lodash')
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
    // get controller
    var controller = this
    // get model
    var model = args.model
    // require something that looks like model
    assert.ok(ImmutableCoreModel.looksLike(model), 'invalid model')
    // create path entry if it does not exist
    if (!this.paths) {
        this.paths = {}
    }
    // base path is / and provides index and create
    var basePath = this.paths['/'] = {}
    // get index
    basePath.get = {
        // load data in before function
        before: function (args) {
            return beforeIndex(controller, args)
        },
        // get takes arguments that map to query options
        input: {
            // limit - overrides value in query if any
            limit: 'query.limit',
            // offset - overrides value in query if any
            offset: 'query.offset',
            // sort order value - can be comma seperated string or json
            order: 'query.order',
            // json encoded where arguments
            where: 'query.query',
            // free-form search string
            search: 'query.search',
        },
        // method name
        methodName: 'index',
    }
    // create new instance
    basePath.post = {
        input: {
            // whether or not create data includes meta columns
            meta: 'query.meta',
        },
        // create new instance
        method: function (args) {
            return create(controller, args)
        },
        // method name
        methodName: 'create',
    }
    // create must include object with data as name
    basePath.post.input[model.name] = 'body.'+model.name
    // get id column for model
    var idColumn = model.columnName('id')
    // if model has an id column then create methods for operations on instances
    if (idColumn) {
        // create input specification
        var input = {
            // if true then method will be performed on current instance of object
            // instead of the one identified by id
            current: 'query.current',
            // if true then method can be performed on deleted instance
            deleted: 'query.deleted',
        }
        // input is id column taken from url params
        input[idColumn] = 'params.'+idColumn
        // the (c)rud path provides instance manipulations which very depending
        // on the model spec
        var crudPath = this.paths['/:'+idColumn] = {}
        // all models have a read method
        crudPath.get = {
            input: _.cloneDeep(input),
            methodName: 'read',
        }
        // if model has a parentId column then updates are allowed
        if (model.columnName('parentId')) {
            // create input options for update
            var updateInput = _.cloneDeep(input)
            // add meta option
            updateInput.meta = 'query.meta'
            // update data must be passed as model name in body
            updateInput[model.name] = 'body.'+model.name
            // create path spec
            crudPath.put = {
                // load model for validation before update
                before: function (args) {
                    return beforeRead(controller, args)
                },
                // set input mapping
                input: updateInput,
                // perform update
                method: function (args) {
                    return update(controller, args)
                },
                // method name
                methodName: 'update',
            }
        }
        // if model has a delete action then add delete
        if (model.actions.delete) {
            // create input options for delete
            var deleteInput = _.cloneDeep(input)
            // get delete model
            var deleteModel = model.actionModels.delete
            // if delete model has data then data can be added with delete
            if (deleteModel.columnName('data')) {
                // add meta option
                updateInput.meta = 'query.meta'
                // data must be passed as model name in body
                updateInput[deleteModel.name] = 'body.'+deleteModel.name
            }
            // create path spec
            crudPath.delete = {
                // load model for validation before update
                before: function (args) {
                    return beforeRead(controller, args)
                },
                // set input mapping
                input: deleteInput,
                // perform delete
                method: function (args) {
                    return action(controller, 'delete', args)
                },
                // method name
                methodName: 'delete',
            }
        }
    }
    // add any other action methods
    _.each(model.actionModels, (actionModel, actionName) => {
        // skip delete which is already added
        if (actionName === 'delete') {
            return
        }
        // create input options for delete
        var actionInput = _.cloneDeep(input)
        // if delete model has data then data can be added with delete
        if (actionModel.columnName('data')) {
            // add meta option
            actionInput.meta = 'query.meta'
            // data must be passed as model name in body
            actionInput[deleteModel.name] = 'body.'+actionModel.name
        }
        // create new path for action
        var actionPath = this.paths['/:'+idColumn+'/'+actionName] = {
            // action is posted
            post: {
                // load model for validation before update
                before: function (args) {
                    return beforeRead(controller, args)
                },
                // set input mapping
                input: actionInput,
                // perform delete
                method: function (args) {
                    return action(controller, actionName, args)
                },
                // method name
                methodName: actionName,
            }
        }
    })
    // create schema path
    this.paths['/schema'] = {
        get: {
            input: {
                // optionally get schema for action
                action: 'query.action',
            },
            method: function (args) {
                return schema(controller, args)
            },
            methodName: 'schema',
        },
    }
    // create validate path
    var validatePath = this.paths['/validate'] = {
        post: {
            // validation done in before
            before: function (args) {
                return beforeValidate(controller, args)
            },
            input: {
                // whether or not meta columns are included
                meta: 'query.meta',
            },
            // before will throw exception if validation fails so if this method
            // gets hit the data is valid - this can be overridden for more
            // extensive validation
            method: function (args) {
                return {valid: true}
            },
            methodName: 'validate',
        },
    }
    // validate must include object with data as name
    validatePath.post.input[model.name] = 'body.'+model.name
    // set to true if model has an indexed extra columns
    var hasIndexedExtraColunms = false
    // check extra columns to see if any are indexed
    _.each(model.extraColumns, spec => {
        if (spec.index || spec.unique) {
            hasIndexedExtraColunms = true
        }
    })
    // create autocomplete path if there are any indexed columns
    if (hasIndexedExtraColunms || model.indexes.length) {
        this.paths['/autocomplete/:property'] = {
            get: {
                input: {
                    property: 'params.property',
                    query: 'query.query',
                    type: 'query.type',
                },
                method: function (args) {
                    return autocomplete(controller, args)
                },
                methodName: 'autocomplete',
                // json schema input requirements
                properties: {
                    query: {
                        minLength: 1,
                        type: 'string',
                    },
                    type: {
                        type: 'string',
                    }
                },
                required: ['query'],
            },
        }
    }
}

/* public functions */

function action (controller, actionName, args) {

}

function autocomplete (controller, args) {

}

function create (controller, args) {

}

function beforeIndex (controller, args) {

}

function beforeRead (controller, args) {

}

function beforeValidate (controller, args) {

}

function update (controller, args) {

}