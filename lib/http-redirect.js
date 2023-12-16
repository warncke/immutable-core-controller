'use strict'

/* exports */
module.exports = httpRedirect

/**
 * @function httpRedirect
 *
 * Generate a redirect exception
 *
 * @param {string} url
 * @param {integer} code
 * @param {object} headers
 *
 * @throws {Error}
 */
function httpRedirect (url, code, headers) {
    // direct redirect to /
    if (!url) {
        url = '/'
    }
    // default to 302 redirect code
    if (!code) {
        code = 302
    }
    // create new error
    var err = new Error('Redirect')
    err.code = code
    err.headers = headers
    err.url = url
    // throw error which will be handled by application framework
    throw err
}
