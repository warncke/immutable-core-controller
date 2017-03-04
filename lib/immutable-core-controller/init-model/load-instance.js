'use strict'

/* exports */
module.exports = loadInstance

/* npm modules */
const httpError = require('immutable-app-http-error')

/**
 * @function loadInstance
 *
 * load model instance
 *
 * @param {ImmutableCoreController} controller
 * @param {object} args
 * @param {object} withArgs
 *
 * @returns {Promise}
 */
function loadInstance (controller, args, withArgs) {
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
    // get instance
    return model.query(queryArgs)
    // throw 404 if not found
    .then(instance => {
        if (!instance) {
            httpError(404)
        }
        // create new object that will be merged into args
        var merge = {}
        // add instance to args keyed by model name
        merge[model.name] = instance
        // return data to merge into args
        return merge
    })
}