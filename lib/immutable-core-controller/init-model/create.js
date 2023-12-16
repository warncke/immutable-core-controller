'use strict'

/* npm modules */
const _ = require('lodash')
const httpError = require('../../http-error')

/* exports */
module.exports = initModelCreate

/**
 * @function initModelCreate
 *
 * create instance controller
 *
 * @param {object} args
 */
function initModelCreate (args) {
    var controller = this
    var model = this.model
    // get accountId column
    var accountIdColumn = model.columnName('accountId')
    // set role to authenticated if model requires account id
    var role = args.defaultRole || (accountIdColumn && model.columns[accountIdColumn].null === false ? 'authenticated' : 'all')
    // index inputs
    var input = {
        // whether or not create data includes meta columns
        meta: 'query.meta'
    }
    // instance data is in body under model name
    input[model.name] = 'body.'+model.name
    // create path if it does not exist
    if (!this.paths['/']) {
        this.paths['/'] = {}
    }
    // controller spec
    var node = {
        input: input,
        method: function (args) {
            return create(controller, args)
        },
        methodName: 'create',
        role: role,
    }
    // add handler for POST / to create instance
    this.paths['/'].post = [node]
}

/**
 * @function create
 *
 * @param {ImmutableCoreController} controller
 * @param {object} args
 *
 * @returns {Promise}
 */
function create (controller, args) {
    // get model from controller
    var model = controller.model
    // get model data from input
    var data = args[model.name]
    // if meta flag is not set then data is instance data
    var createArgs = args.meta ? _.clone(data) : {data: data}
    // do not accept allow flag
    if (createArgs.allow) {
        httpError(403)
    }
    // add session to args
    createArgs.session = args.session
    // create instance
    return model.createMeta(createArgs)
    // catch errors
    .catch(error => {
        // if error is redirect throw it
        if (error.code === 302) {
            throw error
        }
        httpError(400, undefined, error.data)
    })
}