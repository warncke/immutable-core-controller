'use strict'

/* application modules */
const action = require('./action')
const loadInstance = require('./load-instance')

/* exports */
module.exports = initModelDelete

/**
 * @function initModelDelete
 *
 * delete instance controller
 *
 * @param {object} args
 */
function initModelDelete (args) {
    var controller = this
    var model = this.model
    // if model does not have delete action then do not add
    if (!model.actions.delete) {
        return
    }
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
        // ignore conflicts
        force: 'query.force',
        // instance id
        id: 'params.id',
    }
    // get delete model
    var deleteModel = model.actionModels.delete
    // if delete model has data then data can be posted with delete
    if (deleteModel.columnName('data')) {
        // add meta option
        input.meta = 'query.meta'
        // data must be passed as model name in body
        input[deleteModel.name] = 'body.'+deleteModel.name
    }
    // create path if it does not exist
    if (!this.paths['/:id']) {
        this.paths['/:id'] = {}
    }
    // add handler for DELETE /:id to delete model instance
    this.paths['/:id'].delete = {
        before: function (args) {
            // load instance
            return loadInstance(controller, args)
        },
        input: input,
        method: function (args) {
            // perform delete
            return action(controller, 'delete', args)
        },
        methodName: 'delete',
    }
}