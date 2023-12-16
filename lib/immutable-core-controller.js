'use strict'

/* npm modules */
const _ = require('lodash')

/* application modules */
const httpError = require('./http-error')
const httpRedirect = require('./http-redirect')
const initModel = require('./immutable-core-controller/init-model')
const initModelCreate = require('./immutable-core-controller/init-model/create')
const initModelDelete = require('./immutable-core-controller/init-model/delete')
const initModelList = require('./immutable-core-controller/init-model/list')
const initModelRead = require('./immutable-core-controller/init-model/read')
const initModelReplace = require('./immutable-core-controller/init-model/replace')
const initModelSchema = require('./immutable-core-controller/init-model/schema')
const initModelUpdate = require('./immutable-core-controller/init-model/update')
const initModelValidate = require('./immutable-core-controller/init-model/validate')
const initModule = require('./immutable-core-controller/init-module')
const initPaths = require('./immutable-core-controller/init-paths')

/* exports */
module.exports = ImmutableCoreController

/**
 * @function ImmutableCoreController
 *
 * instantiate a new controller
 *
 * @param {object} args
 *
 * @returns {ImmutableCoreController}
 *
 * @throws {Error}
 */
function ImmutableCoreController (args) {
    // get copy of original args
    this.args = _.cloneDeep(args)
    // create module and set options
    this.initModule(args)
    // create default paths for model if passed
    this.initModel(args)
    // create paths from arguments
    this.initPaths(args)
    // sort controllers
    this.orderControllers()
}

/* public methods */
ImmutableCoreController.prototype = {
    getController: getController,
    initModel: initModel,
    initModelCreate: initModelCreate,
    initModelDelete: initModelDelete,
    initModelList: initModelList,
    initModelRead: initModelRead,
    initModelReplace: initModelReplace,
    initModelSchema: initModelSchema,
    initModelUpdate: initModelUpdate,
    initModelValidate: initModelValidate,
    initModule: initModule,
    initPaths: initPaths,
    orderControllers: orderControllers,
}

/* static methods */
ImmutableCoreController.httpError = httpError
ImmutableCoreController.httpRedirect = httpRedirect

/**
 * @function getController
 *
 * get controller specification for a give method, path and role
 *
 * @param {string} method
 * @param {string} path
 * @param {string} role
 *
 * @returns {object|undefined}
 */
function getController (method, path, role) {
    // if path does not exist return
    if (!this.paths[path]) {
        return
    }
    // if method does not exist return
    if (!this.paths[path][method]) {
        return
    }
    // set role to default if not defined
    if (role === undefined) {
        role = 'all'
    }
    // find controller matching role
    return _.find(this.paths[path][method], controller => {
        return controller.role === role ? true : false
    })
}

/**
 * @function orderControllers
 *
 * sort controllers by roll - when multiple controllers exist for a single
 * path:method with different rolls then those controllers will be used as
 * follows:
 *
 * - any custom defined rolls first
 * - authenticated default roll
 * - anonymous default roll
 * - all default roll
 *
 * when the presenter is determining which controller to use it will go through
 * the list and pick the first controller that the client has a role for
 *
 * because rolls are added to this list during the build process the list needs
 * to be resorted to put authenticated, anonymous, and all pseudo rolls at the
 * bottom while leaving all custom defined rolls in the order that they were
 * added.
 */
function orderControllers () {
    // iterate over all paths
    _.each(this.paths, path => {
        // iterate over methods
        _.each(path, (controllers, method) => {
            // if there is only one controller then nothing to sort
            if (controllers.length === 1) {
                return
            }
            // psuedo controllers that will be added to end of list
            var all, anonymous, authenticated
            // ordered list of controllers
            var orderedControllers = []
            // add controllers in order skipping psuedo roles
            _.each(controllers, controller => {
                if (controller.role === 'all') {
                    all = controller
                }
                else if (controller.role === 'anonymous') {
                    anonymous = controller
                }
                else if (controller.role === 'authenticated') {
                    authenticated = controller
                }
                else {
                    orderedControllers.push(controller)
                }
            })
            // add psuedo controllers in order they should be used
            if (authenticated) {
                orderedControllers.push(authenticated)
            }
            if (anonymous) {
                orderedControllers.push(anonymous)
            }
            if (all) {
                orderedControllers.push(all)
            }
            // replace original list with ordered list
            path[method] = orderedControllers
        })
    })
}