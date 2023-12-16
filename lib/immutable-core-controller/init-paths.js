'use strict'

/* native modules */
const assert = require('assert')

/* npm modules */
const _ = require('lodash')
const deepExtend = require('deep-extend')
const defined = require('if-defined')
const immutable = require('immutable-core')
const requireValidOptionalObject = require('immutable-require-valid-optional-object')
const ucfirst = require('ucfirst')

/* exports */
module.exports = initPaths

/* constants */

// suported http methods
const httpMethods = {
    delete: true,
    get: true,
    patch: true,
    post: true,
    put: true,
}

/**
 * @function initPaths
 *
 * create paths specified in args
 *
 * @param {object} args
 *
 * @throws {Error}
 */
function initPaths (args) {
    // set path where controller is mounted
    this.path = typeof args.path === 'string' ? args.path : ''
    // create paths if not already defined
    if (!this.paths) {
        this.paths = {}
    }
    // if paths is false then do not create any paths
    if (args.paths === false) {
        return
    }
    // get paths object
    var paths = requireValidOptionalObject(args.paths)
    // configure default paths and create paths from args
    _.each(paths, (methods, path) => {
        // if value is false then delete all default controllers for path
        if (methods === false) {
            delete this.paths[path]
            return
        }
        // iterate over methods for path
        _.each(methods, (spec, method) => {
            // if spec is false the delete any default controller for method
            if (spec === false) {
                // if path does not exist do nothing
                if (!this.paths[path]) {
                    return
                }
                // delete all entries for method
                delete this.paths[path][method]
                return
            }
            // if path does not exist create
            if (!this.paths[path]) {
                this.paths[path] = {}
            }
            // if methods does not exist create
            if (!this.paths[path][method]) {
                this.paths[path][method] = []
            }
            // args value is list of controllers for different roles
            if (Array.isArray(spec)) {
                // either add each spec or merge to existing spec
                _.each(spec, spec => {
                    // default role to all
                    if (!spec.role) {
                        spec.role = 'all'
                    }
                    // get existing controller if defined
                    var controller = this.getController(method, path, spec.role)
                    // if controller exists then merge config
                    if (controller) {
                        _.merge(controller, spec)
                    }
                    // otherwise add new controller spec
                    else {
                        this.paths[path][method].push(spec)
                    }
                })
            }
            // if spec is an object then either apply arguments to existing
            // default controller or create new controller
            else if (spec && typeof spec === 'object') {
                // default role to all
                if (!spec.role) {
                    spec.role = 'all'
                }
                // get existing controller if defined
                var controller = this.getController(method, path, spec.role)
                // if controller exists then merge config
                if (controller) {
                    _.merge(controller, spec)
                }
                // otherwise add new controller spec
                else {
                    this.paths[path][method].push(spec)
                }
            }
            // error
            else {
                throw new Error('invalid controller '+spec+' at '+path+' '+method)
            }
        })
    })
    // iterate over paths validating spec and creating methods
    _.each(this.paths, (methods, path) => {
        // iterate over (http) methods
        _.each(methods, (specs, httpMethod) => {
            // require supported http method
            assert.ok(httpMethods[httpMethod], 'invalid http method '+httpMethod+' for '+path)
            // iterate specs for different roles
            _.each(specs, spec => {
                // if function is passed then construct spec
                if (typeof spec === 'function') {
                    spec = {method: spec}
                }
                // create default method if method not defined
                if (!spec.method) {
                    spec.method = function (args) {return args}
                }
                // create method name
                if (!spec.methodName) {
                    // get method name from function
                    var matches = spec.method.toString().match(/function\s*([^\s^\)]+)\s*\(/)
                    // use function name
                    if (matches && matches[1].length) {
                        spec.methodName = matches[1]
                    }
                    // use path and method for method name
                    else {
                        // remove non-word chars
                        path = path.replace(/\W/, '')
                        // set method name as methodPath
                        spec.methodName = httpMethod+ucfirst(path)
                    }
                }
                // if method is already immutable then leave as is so that the same
                // spec can be shared between routes
                if (spec.method.meta) {
                    return
                }
                // get method signature from module and method name
                var methodSignature = this.moduleName+'.'+spec.methodName
                // create immutable method
                spec.method = immutable.method(methodSignature, spec.method)
                // if there are before functions add
                if (spec.before) {
                    var beforeMethodName = spec.methodName+'Before'
                    // create immutable method
                    spec.before = immutable.method(this.moduleName+'.'+beforeMethodName, spec.before)
                    // bind before method
                    immutable.before(methodSignature, spec.before)
                }
                // if there are after functions add
                if (spec.after) {
                    var afterMethodName = spec.methodName+'After'
                    // create immutable method
                    spec.after = immutable.method(this.moduleName+'.'+afterMethodName, spec.after)
                    // find after method
                    immutable.after(methodSignature, spec.after)
                }
            })
        })
    })
}