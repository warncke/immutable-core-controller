'use strict'

/* npm modules */
const Promise = require('bluebird')
const _ = require('lodash')

/* exports */
module.exports = buildForms

/**
 * @function buildForms
 *
 * take controller form specifications and build ImmutableCoreModelForm
 * forms
 *
 * @param {array} forms
 *
 * @returns {Promise}
 */
function buildForms (forms) {
    // promises to be resolved once all forms built
    var promises = []
    // list of built forms to return
    var builtForms = []
    // wait for promises to resolve then resolve with forms
    return Promise.all(promises).then(() => builtForms)
}