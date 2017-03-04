'use strict'

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
    // add handler for GET /new
    this.paths['/new'].get = [
        {
            before: function (args) {
                return {form: controller.form}
            },
            method: function (args) {
                return {form: args.form}
            },
            methodName: 'new',
            role: role,
            template: 'instance',
        },
    ]
}