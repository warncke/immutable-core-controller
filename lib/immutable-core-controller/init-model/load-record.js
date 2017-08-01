'use strict'

/* exports */
module.exports = loadRecord

/* npm modules */
const httpError = require('immutable-app-http-error')

/**
 * @function loadRecord
 *
 * load record
 *
 * @param {ImmutableCoreController} controller
 * @param {object} args
 * @param {object} withArgs
 *
 * @returns {Promise}
 */
async function loadRecord (controller, args, withArgs) {
    // if no id is passed throw 404 immediately
    if (!args.id) {
        httpError(404)
    }
    // get model from controller
    var model = controller.model
    // build query args
    var queryArgs = {
        limit: 1,
        session: args.session,
        where: {id: args.id},
        with: withArgs,
    }
    // add current flag if set
    if (args.current) {
        queryArgs.current = true
    }
    // query both deleted and not deleted instances if deleted option set
    if (args.deleted) {
        queryArgs.where.isDeleted = null
    }
    // load record
    var record = await model.query(queryArgs)
    // throw 404 if not found
    if (!record) {
        httpError(404)
    }
    // create new object that will be merged into args
    var merge = {}
    // add record to args keyed by model name
    merge[model.name] = record
    // return data to merge into args
    return merge
}