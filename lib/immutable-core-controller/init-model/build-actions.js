'use strict'

/* npm modules */
const _ = require('lodash')
const changeCase = require('change-case')

/* application modules */
const resolveLinkVariables = require('./resolve-link-variables')

/* exports */
module.exports = buildActions

/**
 * @function buildActions
 *
 * create action links for record
 *
 * @param {object} controller
 * @param {object} model
 * @param {object} record
 *
 */
function buildActions (controller, model, record) {
    // create list of actions for record
    var actions = record.actions = []
    // if record has id then add view/edit action
    if (record.id) {
        actions.push({
            href: '/'+controller.path+'/'+record.id,
            title: 'View',
        })
    }
    // add delete action if supported
    if (model.columns.d) {
        actions.push({
            href: `/${controller.path}/${record.id}/delete`,
            title: 'Delete',
        })
    }
    // add custom actions specified in controller
    if (Array.isArray(controller.actions)) {
        // get copy of actions
        var controllerActions = _.cloneDeep(controller.actions)
        // do variable sub with record data
        resolveLinkVariables(controllerActions, record)
        // add actions to list
        _.each(controllerActions, action => actions.push(action))
    }
}