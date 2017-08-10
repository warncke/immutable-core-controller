'use strict'

/* npm modules */
const _ = require('lodash')
const changeCase = require('change-case')
const defined = require('if-defined')

/* application modules */
const resolveLinkVariables = require('./resolve-link-variables')

/* exports */
module.exports = buildActions

/**
 * @function buildActions
 *
 * create action links for record
 *
 * @param {ImmutableCoreController} controller
 * @param {ImmutableCoreModelRecord} record
 * @param {ImmutableCoreController|undefined} parentController
 * @param {ImmutableCoreModelRecord|undefined} parentRecord
 *
 */
function buildActions (controller, record, parentController, parentRecord) {
    // create actions object keyed by action name
    var actions = {}
    // if record has id then add view/edit action
    if (record.id) {
        actions.view = {
            href: '/'+controller.path+'/'+record.id,
            title: 'View',
        }
    }
    // if parent controller is set this is related record
    if (defined(parentController)) {
        // get the relation between the parent model and this model
        var relation = parentController.model.relation(controller.model.name)
        // if relation is via another model then add unlink action
        if (defined(relation.viaModel) && defined(relation.viaModel.columns.d)) {
            actions.unlink = {
                href: `/${parentController.path}/${parentRecord.id}/unlink?relation=${controller.model.name}&relationId=${record.id}`,
                title: 'Unlink',
            }
        }
        // if relation is direct then give option to delete record
        else if (defined(controller.model.columns.d)) {
            actions.delete = {
                href: `/${controller.path}/${record.id}/delete`,
                title: 'Delete',
            }
        }
    }
    // otherwise this is the primary record
    else {
        // add delete action if supported
        if (controller.model.columns.d) {
            actions.delete = {
                href: `/${controller.path}/${record.id}/delete`,
                title: 'Delete',
            }
        }
    }
    // add custom actions specified in controller
    if (defined(controller.actions)) {
        // get copy of actions
        var controllerActions = _.cloneDeep(controller.actions)
        // add actions
        _.each(controllerActions, (action, actionName) => {
            // do variable sub with record data
            resolveLinkVariables(action, record)
            // merge custom action config over default action
            if (defined(actions[actionName])) {
                _.merge(actions[actionName], action)
            }
            // add new action
            else {
                actions[actionName] = action
            }
        })
    }
    // get list of actions sorted by name
    record.actions = _.map(_.sortBy(_.keys(actions)), actionName => {
        var action = actions[actionName]
        action.action = actionName
        return action
    })
}