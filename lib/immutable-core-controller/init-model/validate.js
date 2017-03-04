'use strict'

/* npm modules */
const _ = require('lodash')
const httpError = require('immutable-app-http-error')

/* exports */
module.exports = initModelValidate

/**
 * @function initModelValidate
 *
 * validate data controller
 *
 * @param {object} args
 */
function initModelValidate (args) {
    var controller = this
    var model = this.model
    // if model does not have schema do not add validate controller
    if (!model.schemaData) {
        return
    }
    // get accountId column
    var accountIdColumn = model.columnName('accountId') 
    // set role to authenticated if model requires account id
    var role = args.defaultRole || (accountIdColumn && model.columns[accountIdColumn].null === false ? 'authenticated' : 'all')
    // index inputs
    var input = {
        // validate schema data
        meta: 'query.meta',
    }
    // instance data is in body under model name
    input[model.name] = 'body.'+model.name
    // create path if it does not exist
    if (!this.paths['/validate']) {
        this.paths['/validate'] = {}
    }
    // add POST /validate handler
    this.paths['/validate'].post = [
        {
            before: function (args) {
                // do validation
                return beforeValidate(controller, args)
            },
            input: input,
            method: function (args) {
                // if before didnt have errors data is valid
                return {valid: true}
            },
            role: role,
            methodName: 'validate',
        },
    ]
}

/**
 * @function beforeValidate
 *
 * validate input data
 *
 * @param {ImmutableCoreController} controller
 * @param {object} args
 *
 * @returns {Promise}
 */
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