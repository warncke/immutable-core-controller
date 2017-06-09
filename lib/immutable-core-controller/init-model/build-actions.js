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
    // add actions for model actions
    _.each(model.actions, (spec, name) => {
        // action has already been performed
        if (record[spec.isProperty]) {

        }
        // action has not been performed
        else {
            actions.push({
                href: '/'+controller.path+'/'+record.id+'/'+changeCase.paramCase(name),
                title: changeCase.titleCase(name),
            })
        }
    })
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