'use strict'

/* npm modules */
const _ = require('lodash')
const httpError = require('../../http-error')

/* application modules */
const loadRecordForUpdate = require('./load-record-for-update')

/* exports */
module.exports = initModelReplace

/**
 * @function initModelReplace
 *
 * replace instance controller
 *
 * @param {object} args
 */
function initModelReplace (args) {
    var controller = this
    var model = this.model
    // if model does not have id column then cannot use default controller
    if (!model.columnName('id') || !model.columnName('parentId')) {
        return
    }
    // get accountId column
    var accountIdColumn = model.columnName('accountId') 
    // set role to authenticated if model requires account id
    var role = args.defaultRole || (accountIdColumn && model.columns[accountIdColumn].null === false ? 'authenticated' : 'all')
    // index inputs
    var input = {
        // get current revision of instance
        current: 'query.current',
        // get record even if deleted
        deleted: 'query.deleted',
        // ignore conflicts
        force: 'query.force',
        // instance id
        id: 'params.id',
        // input data includes meta columns
        meta: 'query.meta',
    }
    // instance data is in body under model name
    input[model.name] = 'body.'+model.name
    // create path for API requests
    if (!this.paths['/:id']) {
        this.paths['/:id'] = {}
    }
    // add handler for PUT /:id
    this.paths['/:id'].put = [
        {
            before: function (args) {
                // load model
                return loadRecordForUpdate(controller, args)
            },

            input: input,
            method: function (args) {
                // perform update
                return update(controller, args)
            },
            methodName: 'replace',
            role: role,
        },
    ]
}

/**
 * @function update
 *
 * @param {ImmutableCoreController} controller
 * @param {object} args
 *
 * @returns {Promise}
 */
function update (controller, args) {
    // get model from controller
    var model = controller.model
    // get current instance loaded in before
    var instance = args[model.name+'Orig']
    // get model data from input
    var data = args[model.name]
    //  build update args
    var updateArgs = args.meta ? _.clone(data) : {data: data}
    // set force flag based on input
    if (args.force) {
        updateArgs.force = true
    }
    // force replace
    updateArgs.merge = false
    // do replace
    return instance.updateMeta(updateArgs)
    // catch errors
    .catch(error => {
        // if error is redirect throw it
        if (error.code === 302) {
            throw error
        }
        // for version conflict errors return the current instance with the
        // error data and throw a 409 http error
        if (instance.isConflictError(error)) {
            // get current instance
            return instance.current()
            // throw 409 conflic error with current instance data
            .then(current => {
                httpError(409, undefined, current)
            })
        }
        httpError(400, undefined, _.pick(error, ['data', 'message']))
    })
}