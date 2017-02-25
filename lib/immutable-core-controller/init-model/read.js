'use strict'

/* exports */
module.exports = initModelRead

/* npm modules */
const changeCase = require('change-case')

/* application modules */
const loadInstance = require('./load-instance')

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
    this.paths['/:id'].get = {
        before: function (args) {
            // load model instance
            return loadInstance(controller, args)
        },
        input: input,
        method: function (args) {
            // format response
            return read(controller, args)
        },
        methodName: 'read',
        template: 'instance',
    }
}

/**
 * @function read
 *
 * return record data
 *
 * @param {ImmutableCoreController} controller
 * @param {object} args
 *
 * @returns {object}
 */
function read (controller, args) {
    // recrod
    var record = args[controller.model.name]
    // if this is json response return raw data
    if (args.json || !controller.form) {
        return record
    }
    // create form to edit instance data
    var form = controller.form.newInstance({
        action: './'+record.id+'/update',
        record: record,
        submit: {title: 'Update '+changeCase.titleCase(controller.model.name)},
        title: 'Edit '+changeCase.titleCase(controller.model.name),
    })
    // return form
    return {form: form}
}