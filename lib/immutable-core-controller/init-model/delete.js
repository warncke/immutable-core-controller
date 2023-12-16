'use strict'

/* npm modules */
const defined = require('if-defined')
const httpError = require('../../http-error')

/* application modules */
const loadRecordForUpdate = require('./load-record-for-update')

/* exports */
module.exports = initModelDelete

/**
 * @function initModelDelete
 *
 * delete record controller
 *
 * @param {object} args
 */
function initModelDelete (args) {
    var controller = this
    var model = this.model
    // if model does not have delete action then do not add
    if (!defined(model.columns.d)) {
        return
    }
    // if model does not have id column then cannot use default controller
    if (!model.columnName('id')) {
        return
    }
    // get accountId column
    var accountIdColumn = model.columnName('accountId') 
    // set role to authenticated if model requires account id
    var role = args.defaultRole || (accountIdColumn && model.columns[accountIdColumn].null === false ? 'authenticated' : 'all')
    // index inputs
    var input = {
        // get current revision of record
        current: 'query.current',
        // get record even if deleted
        deleted: 'query.deleted',
        // ignore conflicts
        force: 'query.force',
        // record id
        id: 'params.id',
        // add option to set meta data for query
        meta: 'query.meta',
        // url to redirect to when done
        redirect: 'params.redirect',
        // http referrer
        referrer: 'headers.referer',
    }
    // record data is in body under model name
    input[model.name] = 'body.'+model.name
    // create path if it does not exist
    if (!defined(this.paths['/:id'])) {
        this.paths['/:id'] = {}
    }
    if (!defined(this.paths['/:id/delete'])) {
        this.paths['/:id/delete'] = {}
    }
    if (!defined(this.paths['/:id/undelete'])) {
        this.paths['/:id/undelete'] = {}
    }
    // add handler for DELETE /:id to delete
    this.paths['/:id'].delete = [
        {
            before: function (args) {
                // load record
                return loadRecordForUpdate(controller, args)
            },
            input: input,
            method: function (args) {
                // perform delete
                return deleteMethod(controller, 'delete', args)
            },
            role: role,
            methodName: 'delete',
        },
    ]
    // add handler for POST /:id/undelete to undelete
    this.paths['/:id/undelete'].post = [
        {
            before: function (args) {
                // load record
                return loadRecordForUpdate(controller, args)
            },
            input: input,
            method: function (args) {
                // perform undelete
                return deleteMethod(controller, 'undelete', args)
            },
            role: role,
            methodName: 'undelete',
        },
    ]
}

/**
 * @function deleteMethod
 *
 * perform model action
 *
 * @param {ImmutableCoreController} controller
 * @param {string} actionName
 * @param {object} args
 *
 * @returns {Promise}
 */
function deleteMethod (controller, actionName, args) {
    // get model from controller
    var model = controller.model
    // get record loaded in before
    var record = args[`${model.name}Orig`]
    // perform action
    return record[actionName]()
    // catch errors
    .catch(err => {
        // throw 409 on duplicate key error
        if (record.isConflictError(err)) {
            // get current instance
            return record.current()
            // throw 409 conflic error with current instance data
            .then(current => {
                // check if current defined
                record.assert(defined(current), 'could not fetch current')
                httpError(409, undefined, current)
            })
        }
        // throw original error
        else {
            throw err
        }
    })
}