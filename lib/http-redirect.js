'use strict'

/* exports */
module.exports = httpRedirect

/**
 * @function httpRedirect
 *
 * Generate a redirect exception
 *
 * @param {string} rul
 * @param {integer} code
 *
 * @throws {Error}
 */
function httpRedirect (url, code) {
    // default to 302 redirect code
    if (!code) {
        code = 302
    }
    // create new error
    var err = new Error('Redirect')
    err.code = code
    err.url = url
    // throw error which will be handled by application framework
    throw err
}