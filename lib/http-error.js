'use strict'

/* exports */
module.exports = httpError

/* constants */
const httpErrors = {
    400: 'Application Error',
    403: 'Access Denied',
    404: 'Not Found',
    409: 'Conflict',
    500: 'Internal Server Error',
}

/**
 * @function httpError
 *
 * Generate an error exception with http error codes
 *
 * @param {integer} code
 * @param {string} msg
 * @param {object} data
 *
 * @throws {Error}
 */
function httpError (code, msg, data) {
    // default to 400 application error
    if (!code) {
        code = 400
    }
    // set msg based on code if not set
    if (!msg) {
        msg = httpErrors[code] || 'Unspecified Error'
    }
    // create new error
    var err = new Error(msg)
    err.code = code
    err.data = data
    // throw error which will be handled by application framework
    throw err
}