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
    // if model/controller does not have form then cannot create new controller
    if (!this.form) {
        return
    }
    // create path if it does not exist
    if (!this.paths['/new']) {
        this.paths['/new'] = {}
    }
    // add handler for GET /new
    this.paths['/new'].get = {
        before: function (args) {
            return {form: controller.form}
        },
        method: function (args) {
            return {form: args.form}
        },
        methodName: 'new',
        template: 'instance',
    }
}