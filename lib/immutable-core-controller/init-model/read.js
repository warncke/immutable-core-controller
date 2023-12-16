'use strict'

/* npm modules */
const _ = require('lodash')
const requireValidOptionalObject = require('immutable-require-valid-optional-object')

/* application modules */
const loadRecord = require('./load-record')

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
    // make sure query args are object
    var queryArgs = requireValidOptionalObject(args.read.query)
    // get role
    var role = args.defaultRole || 'all'
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
                return loadRecord(controller, args, queryArgs)
            },
            input: input,
            method: function (args) {
                return args[controller.model.name]
            },
            methodName: 'read',
            role: role,
        },
    ]
}
