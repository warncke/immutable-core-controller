'use strict'

/* native modules */
const assert = require('assert')

/* npm modules */
const _ = require('lodash')
const deepExtend = require('deep-extend')
const immutable = require('immutable-core')
const requireValidOptionalObject = require('immutable-require-valid-optional-object')

/* exports */
module.exports = initPaths

/* constants */

// suported http methods
const httpMethods = {
    delete: true,
    get: true,
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
    // create paths if not already defined
    if (!this.paths) {
        this.paths = {}
    }
    if (args.paths) {
        // require paths to be object
        assert.ok(typeof args.paths === 'object', 'paths must be object')
        // merge paths from args over any created for model
        deepExtend(this.paths, args.paths)
    }
    // iterate over paths validating spec and creating methods
    _.each(this.paths, (methods, path) => {
        // iterate over (http) methods
        _.each(methods, (spec, httpMethod) => {
            // require supported http method
            assert.ok(httpMethods[httpMethod], 'invalid http method '+httpMethod+' for '+path)
            // if spec is GET and has a template but no method
            // then do not require method
            if (spec.template && !spec.after && !spec.before && !spec.method) {
                return
            }
            // if function is passed then construct spec
            if (typeof spec === 'function') {
                // get method name from function
                var matches = spec.toString().match(/function\s*([^\s^\)]+)\s*\(/)
                // require matches to get method name
                assert.ok(matches && matches[1] && matches[1].length, 'method name required for '+httpMethod+' '+path)
                // build spec
                spec = {
                    method: spec,
                    methodName: matches[1],
                }
            }
            // require method name
            assert.ok(typeof spec.methodName === 'string' && spec.methodName.length, 'method name required for '+httpMethod+' '+path)
            // create default method if method not defined
            if (!spec.method) {
                spec.method = function (args) {return args}
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
}