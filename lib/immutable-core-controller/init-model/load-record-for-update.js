'use strict'

/* exports */
module.exports = loadRecordForUpdate

/* npm modules */
const httpError = require('immutable-app-http-error')

/**
 * @function loadRecordForUpdate
 *
 * @param {ImmutableCoreController} controller
 * @param {object} args
 *
 * @returns {Promise}
 */
async function loadRecordForUpdate (controller, args) {
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
    }
    // add current flag if set
    if (args.current) {
        queryArgs.current = true
    }
    // query both deleted and not deleted instances if deleted option set
    if (args.deleted) {
        queryArgs.where.isDeleted = null
    }
    // get model instance being modified
    var record = await model.query(queryArgs)
    // throw 404 if not found
    if (!record) {
        httpError(404)
    }
    // create new object that will be merged into args
    var merge = {}
    // add instance to args keyed by model name + Orig since data
    // from PUT will be keyed by model name
    merge[`${model.name}Orig`] = record
    // return data to merge into args
    return merge
}