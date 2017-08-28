'use strict'

/* npm modules */
const _ = require('lodash')
const defined = require('if-defined')

/* exports */
module.exports = resolveVariables

/**
 * @function resolveVariables
 *
 * resolve any variables in string with values from passed in object.
 *
 * variables must be in the ${variable.name} format and are retrieved from the
 * passed in object using lodash _.get. If variable cannot be resolved from
 * root of object an attempt will be made to resolve it from object.data.
 *
 * @param {string} template
 * @param {object} record
 *
 * @returns {string}
 */
function resolveVariables (template, record) {
    // if template is not string return empty string
    if (typeof template !== 'string') {
        return ''
    }
    // replace all variables with interpolated value
    return template.replace(/\$\{[^}]+\}/g, function (match) {
        return resolveVariable(match, record)
    })
}

/* private functions */

function resolveVariable (match, record) {
    // return empty string if no record
    if (!defined(record)) {
        return ''
    }
    // remove ${} from variable
    match = match.substr(2, match.length - 3)
    // try to get value from record
    var value = _.get(record, match)
    // try to get value from data if not found
    if (!defined(value)) {
        value = _.get(record.data, match)
    }
    // return value or empty string
    return defined(value) ? value : ''
}