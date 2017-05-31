'use strict'

/* npm modules */
const defined = require('if-defined')

/* exports */
module.exports = initModelNew

/**
 * @function initModelNew
 *
 * new instance controller
 *
 * @param {object} args
 */
function initModelNew (args) {
    var controller = this
    var model = this.model
    // if model/controller does not have form then cannot create new controller
    if (!this.form) {
        return
    }
    // create path if it does not exist
    if (!this.paths['/new']) {
        this.paths['/new'] = {}
    }
    // get accountId column
    var accountIdColumn = model.columnName('accountId') 
    // set role to authenticated if model requires account id
    var role = args.defaultRole || (accountIdColumn && model.columns[accountIdColumn].null === false ? 'authenticated' : 'all')
    // form inputs
    var input = {
        redirect: 'query.redirect',
    }
    // input may include pre-filled form values
    input[model.name] = 'query.'+model.name
    // add handler for GET /new
    this.paths['/new'].get = [
        {
            before: function (args) {
                return newInstance(controller, args)
            },
            input: input,
            method: function (args) {
                return {form: args.form}
            },
            methodName: 'new',
            role: role,
            template: 'instance',
        },
    ]
}

/**
 * @function newInstance
 *
 * @param {ImmutableCoreController} controller
 * @param {object} args
 *
 * @returns {Promise}
 */
function newInstance (controller, args) {
    // get model from controller
    var model = controller.model
    // form to create new instance
    var form
    // get model data from input
    var data = args[model.name]
    // if pre-fill input is passed then initialize form with it
    if (defined(data)) {
        form = controller.form.newInstance({
            input: data,
            redirect: args.redirect,
        })
    }
    // otherwise use default form
    else {
        form = controller.form
    }

    return {
        form: form,
    }
}