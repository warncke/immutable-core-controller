'use strict'

/* npm modules */
const httpError = require('../../http-error')

/* exports */
module.exports = initModelSchema

/**
 * @function initModelSchema
 *
 * model schema controller
 *
 * @param {object} args
 */
function initModelSchema (args) {
    var controller = this
    var model = this.model
    // if model does not have schema do not create schema controller
    if (!model.schemaData) {
        return
    }
    // get accountId column
    var accountIdColumn = model.columnName('accountId') 
    // set role to authenticated if model requires account id
    var role = args.defaultRole || (accountIdColumn && model.columns[accountIdColumn].null === false ? 'authenticated' : 'all')
    // index inputs
    var input = {
        // optionally get schema for action
        action: 'query.action',
        // get full schema including meta data
        meta: 'query.meta',
    }
    // create path if it does not exist
    if (!this.paths['/schema']) {
        this.paths['/schema'] = {}
    }
    // add GET /schema handler
    this.paths['/schema'].get = [
        {
            input: input,
            method: function (args) {
                return schema(controller, args)
            },
            methodName: 'schema',
            role: role,
        }
    ]
}

/**
 * @function schema
 *
 * get schema for model or action model
 *
 * @param {ImmutableCoreController} controller
 * @param {object} args
 *
 * @returns {Promise}
 */
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