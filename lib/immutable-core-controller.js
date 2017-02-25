'use strict'

/* exports */
module.exports = ImmutableCoreController

/* application modules */
const initModel = require('./immutable-core-controller/init-model')
const initModelActions = require('./immutable-core-controller/init-model/actions')
const initModelCreate = require('./immutable-core-controller/init-model/create')
const initModelDelete = require('./immutable-core-controller/init-model/delete')
const initModelList = require('./immutable-core-controller/init-model/list')
const initModelNew = require('./immutable-core-controller/init-model/new')
const initModelRead = require('./immutable-core-controller/init-model/read')
const initModelSchema = require('./immutable-core-controller/init-model/schema')
const initModelUpdate = require('./immutable-core-controller/init-model/update')
const initModelValidate = require('./immutable-core-controller/init-model/validate')
const initModule = require('./immutable-core-controller/init-module')
const initPaths = require('./immutable-core-controller/init-paths')

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
    // create module and set options
    this.initModule(args)
    // create default paths for model if passed
    this.initModel(args)
    // create paths from arguments
    this.initPaths(args)
}

/* public methods */
ImmutableCoreController.prototype = {
    initModel: initModel,
    initModelActions: initModelActions,
    initModelCreate: initModelCreate,
    initModelDelete: initModelDelete,
    initModelList: initModelList,
    initModelNew: initModelNew,
    initModelRead: initModelRead,
    initModelSchema: initModelSchema,
    initModelUpdate: initModelUpdate,
    initModelValidate: initModelValidate,
    initModule: initModule,
    initPaths: initPaths,
}