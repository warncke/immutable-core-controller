'use strict'

/* npm modules */
const _ = require('lodash')

/* application modules */
const action = require('./action')
const loadInstance = require('./load-instance')

/* exports */
module.exports = initModelActions

/**
 * @function initModelActions
 *
 * instance action controllers
 *
 * @param {object} args
 */
function initModelActions (args) {
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
        // ignore conflicts
        force: 'query.force',
        // instance id
        id: 'params.id',
    }
    // create controllers for model actions
    _.each(model.actionModels, (actionModel, actionName) => {
        // skip delete which is already added
        if (actionName === 'delete') {
            return
        }
        // create input options for delete
        var actionInput = _.cloneDeep(input)
        // if delete model has data then data can be added with delete
        if (actionModel.columnName('data')) {
            // add meta option
            actionInput.meta = 'query.meta'
            // data must be passed as model name in body
            actionInput[actionModel.name] = 'body.'+actionModel.name
        }
        // build path for action
        var actionPath = '/:id/'+actionName.toLowerCase()
        // create path if it does not exist
        if (!this.paths[actionPath]) {
            this.paths[actionPath] = {}
        }
        // add handler for POST /:id/action
        this.paths[actionPath].post = {
            before: function (args) {
                return loadInstance(controller, args)
            },
            input: actionInput,
            method: function (args) {
                return action(controller, actionName, args)
            },
            methodName: actionName,
        }
    })
}