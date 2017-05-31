'use strict'

/* npm modules */
const _ = require('lodash')
const defined = require('if-defined')

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
 * @param {array} links
 * @param {object} record
 */
function resolveLinkVariables (links, record) {
    // check each links for variables
    _.each(links, link => {
        // do substitution on href if defined
        if (typeof link.href === 'string') {
            link.href = link.href.replace(/\$\{[^}]+\}/g, function (match) {
                return resolveLinkVariable(match, record)
            })
        }
        // do substitution on title if defined
        if (typeof link.title === 'string') {
            link.title = link.title.replace(/\$\{[^}]+\}/g, function (match) {
                return resolveLinkVariable(match, record)
            })
        }
    })
}

/* private functions */

function resolveLinkVariable (match, record) {
    // remove ${} from variable
    match = match.substr(2, match.length - 3)
    // return empty string if no record
    if (!defined(record)) {
        return ''
    }
    // if record has data then try to resolve variable from data first
    if (defined(record.data) && defined(record.data[match])) {
        return record.data[match]
    }
    // otherwise try to get from main object
    else if (defined(record[match])) {
        return record[match]
    }
    // otherwise try to get with lodash
    else {
        var value = _.get(record, match)
        // return value or empty string
        return defined(value) ? value : ''
    }
}