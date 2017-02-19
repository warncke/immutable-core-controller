'use strict'

/* native modules */
const assert = require('assert')

/* npm modules */
const ImmutableCoreModel = require('immutable-core-model')
const _ = require('lodash')
const debug = require('debug')('immutable-core-controller')

/* exports */
module.exports = initModel

/* constants */
const httpErrors = {
    400: 'Application Error',
    403: 'Access Denied',
    404: 'Not Found',
    409: 'Conflict',
    500: 'Internal Server Error',
}

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
    // index inputs
    var indexInput = {
        // included deleted records
        deleted: 'query.deleted',
        // limit - overrides value in query if any
        limit: 'query.limit',
        // offset - overrides value in query if any
        offset: 'query.offset',
        // sort order value - can be comma seperated string or json
        order: 'query.order',
        // free-form search string
        search: 'query.search',
        // list of columns to select
        select: 'query.select',
        // json encoded where arguments
        where: 'query.where',
    }
    // if model has an original id column then add to query options
    if (model.columnName('originalId')) {
        indexInput.originalId = 'query.originalId'
    }
    // add extra columns as query param options
    _.each(model.extraColumns, (spec, name) => {
        // do not overwrite core inputs
        if (indexInput[name]) {
            return
        }
        // add column to inputs
        indexInput[name] = 'query.'+name
    })
    // get index
    basePath.get = {
        // load data in before function
        before: function (args) {
            return beforeIndex(controller, args)
        },
        // get takes arguments that map to query options
        input: indexInput,
        // default method returns loaded data
        method: function (args) {
            return _.pick(args, ['query', 'records', 'result'])
        },
        methodName: 'index',
    }

    /* CREATE */

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
        input.id = 'params.id'
        // the (c)rud path provides instance manipulations which very depending
        // on the model spec
        var crudPath = this.paths['/:id'] = {}

        /* READ */

        crudPath.get = {
            before: function (args) {
                return beforeRead(controller, args)
            },
            input: _.cloneDeep(input),
            method: function (args) {
                // return the object instance loaded in beforeRead
                return args[controller.model.name]
            },
            methodName: 'read',
        }
        // if model has a parentId column then updates are allowed
        if (model.columnName('parentId')) {
            // create input options for update
            var updateInput = _.cloneDeep(input)
            // if meta is set then instance data includes meta columns
            updateInput.meta = 'query.meta'
            // if force is set then update will always be performed and any
            // conflicts will be ignored - defaults to false
            updateInput.force = 'query.force'
            // update data must be passed as model name in body
            updateInput[model.name] = 'body.'+model.name

            /* UPDATE */

            crudPath.put = {
                // load model for validation before update
                before: function (args) {
                    return beforeUpdate(controller, args)
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
                deleteInput.meta = 'query.meta'
                // data must be passed as model name in body
                deleteInput[deleteModel.name] = 'body.'+deleteModel.name
            }
            // if force is set then delete will be performed on old instance
            deleteInput.force = 'query.force'

            /* DELETE */

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
        // if force is set then delete will be performed on old instance
        actionInput.force = 'query.force'

        /* PERFORM ACTION */

        var actionPath = this.paths['/:id/'+actionName.toLowerCase()] = {
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

    /* SCHEMA */

    this.paths['/schema'] = {
        get: {
            input: {
                // optionally get schema for action
                action: 'query.action',
                // get full schema including meta data
                meta: 'query.meta',
            },
            method: function (args) {
                return schema(controller, args)
            },
            methodName: 'schema',
        },
    }

    /* VALIDATE */

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

    /* TODO: AUTOCOMPLETE
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
    */
}

/* public functions */

function action (controller, actionName, args) {
    // get model from controller
    var model = controller.model
    // get instance loaded in before
    var instance = args[model.name]
    // if instance is not current and force option is not set
    // then throw 409 error
    if (!instance.isCurrent && !args.force) {
        // get current instance
        return instance.current()
        // throw 409 error with current instance data
        .then(instance => {
            httpError(409, undefined, instance)
        })
    }
    // get action model
    var actionModel = model.actionModels[actionName]
    // get action
    var action = actionModel.action
    // throw 404 if invalid action - should not happen since routes are built
    // from actions
    if (!actionModel) {
        httpError(404)
    }
    // get property to check if action already performed
    var actionProperty = actionModel.isInverse
        ? action.wasProperty
        : action.isProperty
    // if action already performed then return instance
    if (instance[actionProperty]) {
        return instance
    }
    // perform action
    return instance.action(actionName)
}

function autocomplete (controller, args) {

}

function create (controller, args) {
    // get model from controller
    var model = controller.model
    // get model data from input
    var data = args[model.name]
    // if meta flag is not set then data is instance data
    var createArgs = args.meta ? data : {data: data}
    // add session to args
    createArgs.session = args.session
    // create instance
    return model.createMeta(createArgs)
}

function beforeIndex (controller, args) {
    // get model from controller
    var model = controller.model
    // set limit
    var limit = args.limit || controller.defaultLimit
    var offset = args.offset || 0
    // set minimum limit to 2
    if (limit < 2) {
        limit = 2
    }
    // build arguments for query
    var query = {
        limit: limit,
        offset: offset,
        session: args.session,
    }
    // add order if set
    if (args.order) {
        query.order = args.order.split(',')
    }
    // add where if set
    if (args.where) {
        query.where = args.where
    }
    // included deleted records
    if (args.deleted) {
        // create where query if not set
        if (!query.where) {
            query.where = {}
        }
        // include deleted records
        query.where.isDeleted = null
    }
    // add extra columns as query param options
    _.each(model.extraColumns, (spec, name) => {
        // if param is set in args add to where query
        if (args[name]) {
            // create where query if not set
            if (!query.where) {
                query.where = {}
            }
            // set like query
            query.where[name] = {like: args[name]}
        }
    })
    // if originalId set add to query
    if (args.originalId) {
        // create where query if not set
        if (!query.where) {
            query.where = {}
        }
        // set originalId in query
        query.where.originalId = {eq: args.originalId}
    }
    // do database query
    return model.query(query)
    // prepare args for primary method
    .then(result => {
        // remove session from query args for presentation
        delete query.session
        // fetch records
        return result.fetch(limit)
        // resolve with result and record data
        .then(records => {
            // return data that will be merged into args for primary method
            return {
                query: query,
                records: records,
                result: {
                    length: result.length,
                },
            }
        })
    })
}

function beforeRead (controller, args) {
    // if no id is passed throw 404 immediately
    if (!args.id) {
        httpError(404)
    }
    // get model from controller
    var model = controller.model
    // build query args
    var queryArgs = {
        limit: 1,
        session: args.session,
        where: {id: args.id},
    }
    // add current flag if set
    if (args.current) {
        queryArgs.current = true
    }
    // query both deleted and not deleted instances if deleted option set
    if (args.deleted) {
        queryArgs.where.isDeleted = null
    }
    // get instance
    return model.query(queryArgs)
    // throw 404 if not found
    .then(instance => {
        if (!instance) {
            httpError(404)
        }
        // create new object that will be merged into args
        var merge = {}
        // add instance to args keyed by model name
        merge[model.name] = instance
        // return data to merge into args
        return merge
    })
}

function beforeUpdate (controller, args) {
    // if no id is passed throw 404 immediately
    if (!args.id) {
        httpError(404)
    }
    // get model from controller
    var model = controller.model
    // get model instance being modified
    return model.query({
        limit: 1,
        session: args.session,
        where: {id: args.id},
    })
    // throw 404 if not found
    .then(instance => {
        if (!instance) {
            httpError(404)
        }
        // create new object that will be merged into args
        var merge = {}
        // add instance to args keyed by model name + Orig since data
        // from PUT will be keyed by model name
        merge[model.name+'Orig'] = instance
        // return data to merge into args
        return merge
    })
}

function beforeValidate (controller, args) {
    // get model from controller
    var model = controller.model
    // get model data from input
    var data = args[model.name]
    // get schema id
    var schemaId = args.meta || !model.schemaDataId
        ? model.schemaId
        : model.schemaDataId
    // if validating meta data convert property names to columns names
    if (args.meta) {
        // clone data before modifying - shallow since only property names are
        // being modified
        data = _.clone(data)
        // iterate over all data properties
        _.each(data, (val, key) => {
            // get column name for key
            var columnName = model.columnName(key)
            // if property does not map to column then skip
            if (!columnName) {
                return
            }
            // use column name for validation
            if (columnName !== key) {
                // copy value to column name
                data[columnName] = val
                // delete entry for original property
                delete data[key]
            }
        })
    }
    // get global validator
    var validator = model.global().validator
    // throw error if validation failed
    if (!validator.validate(schemaId, data)) {
        // throw error
        httpError(400, 'Validation Error', validator.errors)
    }
}

function schema (controller, args) {
    // get model
    var model = controller.model
    // if action set then try to get action model
    if (args.action) {
        // require action model
        if (!model.actionModels[args.action]) {
            httpError(400, 'Invalid Action')
        }
        // use action model to get schema
        model = model.actionModels[args.action]
    }
    // get data column name for model
    var dataColumn = model.columnName('data')
    // if meta is set or there is no data column return entire schema 
    // otherwise return only schema for data
    return args.meta || !model.schemaData
        ? model.schemaMeta
        : model.schemaData
}

function update (controller, args) {
    // get model from controller
    var model = controller.model
    // get current instance loaded in before
    var instance = args[model.name+'Orig']
    // build update args depending on whether or not put data
    // includes meta data or not
    var updateArgs = args.meta ? args[model.name] : {data: args[model.name]}
    // set force flag based on input
    if (args.force) {
        updateArgs.force = true
    }
    // do update
    return instance.updateMeta(updateArgs)
    // catch errors
    .catch(err => {
        // for version conflict errors return the current instance with the
        // error data and throw a 409 http error
        if (instance.isConflictError(err)) {
            // get current instance
            return instance.current()
            // throw 409 conflic error with current instance data
            .then(current => {
                httpError(409, undefined, current)
            })
        }
        // throw generic errors
        else {
            throw err
        }
    })
}

function httpError (code, msg, data) {
    // default to 400 application error
    if (!code) {
        code = 400
    }
    // set msg based on code if not set
    if (!msg) {
        msg = httpErrors[code] || 'Unspecified Error'
    }
    // create new error
    var err = new Error(msg)
    err.code = code
    err.data = data
    // throw error which will be handled by application framework
    throw err
}