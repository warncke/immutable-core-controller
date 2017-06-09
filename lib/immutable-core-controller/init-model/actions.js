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
    // create actions array that has actions applying to all model instances
    controller.actions = []
    // add actions from args to controller
    _.each(args.actions, action => controller.actions.push(action))
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
        this.paths[actionPath].post = [
            {
                before: function (args) {
                    return loadInstance(controller, args)
                },
                input: actionInput,
                method: function (args) {
                    return action(controller, actionName, args)
                },
                role: role,
                methodName: actionName,
            },
        ]
    })
}