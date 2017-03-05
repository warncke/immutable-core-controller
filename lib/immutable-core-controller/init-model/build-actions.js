'use strict'

/* npm modules */
const _ = require('lodash')
const changeCase = require('change-case')

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
}