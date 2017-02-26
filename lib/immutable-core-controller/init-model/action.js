'use strict'

/* application modules */
const httpError = require('../../http-error')
const httpRedirect = require('../../http-redirect')

/* exports */
module.exports = action

/**
 * @function action
 *
 * perform model action
 *
 * @param {ImmutableCoreController} controller
 * @param {string} actionName
 * @param {object} args
 *
 * @returns {Promise}
 */
function action (controller, actionName, args) {
    // get model from controller
    var model = controller.model
    // get instance loaded in before
    var instance = args[model.name]
    // if instance is not current and force option is not set
    // then throw 409 error
    if (!instance.isCurrent && !args.force) {
        // get current instance
        return instance.current()
        // throw 409 error with current instance data
        .then(instance => {
            httpError(409, undefined, instance)
        })
    }
    // get action model
    var actionModel = model.actionModels[actionName]
    // get action
    var action = actionModel.action
    // throw 404 if invalid action - should not happen since routes are built
    // from actions
    if (!actionModel) {
        httpError(404)
    }
    // get property to check if action already performed
    var actionProperty = actionModel.isInverse
        ? action.wasProperty
        : action.isProperty
    // if action already performed then return instance
    if (instance[actionProperty]) {
        return instance
    }
    // perform action
    return instance.action(actionName)
    // do response
    .then(instance => {
        // if request is in json mode the return instance data
        if (args.json) {
            return instance
        }
        // otherwise redirect
        else {
            // redirect url is either eplicity passed, from http referrer,
            // or to instance url
            var url = args.redirect || args.referrer || '../'
            // do 302 redirect
            return httpRedirect(url)
        }
    })
}