'use strict'

/* npm modules */
const _ = require('lodash')
const defined = require('if-defined')

/* application modules */
const resolveVariables = require('./resolve-variables')

/* exports */
module.exports = resolveLinkVariables

/**
 * @function resolveLinkVariables
 *
 * take a list of links and resolve any variables in the href or title with
 * values from passed in object.
 *
 * variables must be in the ${variable.name} format and are retrieved from the
 * passed in object using lodash _.get.
 *
 * original array values are modified
 *
 * @param {array|object} links
 * @param {object} record
 */
function resolveLinkVariables (links, record) {
    // handle array
    if (Array.isArray(links)) {
        _.each(links, link => {
            resolveLinkVariablesObject(link, record)
        })
    }
    // handle object
    else if (typeof links === 'object' && links) {
        resolveLinkVariablesObject(links, record)
    }
}

/* private functions */

function resolveLinkVariablesObject (link, record) {
    // do substitution on href if defined
    if (typeof link.href === 'string') {
        link.href = resolveVariables(link.href, record)
    }
    // do substitution on title if defined
    if (typeof link.title === 'string') {
        link.title = resolveVariables(link.title, record)
    }
}