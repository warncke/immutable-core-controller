'use strict'

/* npm modules */
const httpError = require('immutable-app-http-error')
const httpRedirect = require('immutable-app-http-redirect')

/* exports */
module.exports = initModelUpdate

/**
 * @function initModelUpdate
 *
 * update instance controller
 *
 * @param {object} args
 */
function initModelUpdate (args) {
    var controller = this
    var model = this.model
    // if model does not have id column then cannot use default controller
    if (!model.columnName('id') || !model.columnName('parentId')) {
        return
    }
    // get accountId column
    var accountIdColumn = model.columnName('accountId') 
    // set role to authenticated if model requires account id
    var role = args.defaultRole || (accountIdColumn && model.columns[accountIdColumn].null === false ? 'authenticated' : 'all')
    // index inputs
    var input = {
        // get current revision of instance
        current: 'query.current',
        // get record even if deleted
        deleted: 'query.deleted',
        // ignore conflicts
        force: 'query.force',
        // instance id
        id: 'params.id',
        // input data includes meta columns
        meta: 'query.meta',
    }
    // instance data is in body under model name
    input[model.name] = 'body.'+model.name
    // create path for PUT for API requests
    if (!this.paths['/:id']) {
        this.paths['/:id'] = {}
    }
    // create path for POST for form requests
    if (!this.paths['/:id/update']) {
        this.paths['/:id/update'] = {}
    }
    // add handler for PUT /:id and POST /:id/update
    // to update instance
    this.paths['/:id'].put = this.paths['/:id/update'].post = [
        {
            before: function (args) {
                // load model
                return beforeUpdate(controller, args)
            },
            input: input,
            method: function (args) {
                // perform update
                return update(controller, args)
            },
            methodName: 'update',
            role: role,
            template: 'instance',
        },
    ]
}

/**
 * @function beforeUpdate
 *
 * @param {ImmutableCoreController} controller
 * @param {object} args
 *
 * @returns {Promise}
 */
function beforeUpdate (controller, args) {
    // if no id is passed throw 404 immediately
    if (!args.id) {
        httpError(404)
    }
    // get model from controller
    var model = controller.model
    // get model instance being modified
    return model.query({
        limit: 1,
        session: args.session,
        where: {id: args.id},
    })
    // throw 404 if not found
    .then(instance => {
        if (!instance) {
            httpError(404)
        }
        // create new object that will be merged into args
        var merge = {}
        // add instance to args keyed by model name + Orig since data
        // from PUT will be keyed by model name
        merge[model.name+'Orig'] = instance
        // return data to merge into args
        return merge
    })
}

/**
 * @function update
 *
 * @param {ImmutableCoreController} controller
 * @param {object} args
 *
 * @returns {Promise}
 */
function update (controller, args) {
    // get model from controller
    var model = controller.model
    // get current instance loaded in before
    var instance = args[model.name+'Orig']
    // get model data from input
    var data = args[model.name]
    //  build update args
    var updateArgs = args.meta ? data : {data: data}
    // set force flag based on input
    if (args.force) {
        updateArgs.force = true
    }
    // do update
    return instance.updateMeta(updateArgs)
    // redirect on success
    .then(instance => {
        // if in json mode return instance data
        if (args.json) {
            return instance
        }
        // otherwise redirect to instance page
        else {
            // use redirect from input or redirect to new instance
            var url = args.redirect || '../'+instance.id
            // redirect
            httpRedirect(url)
        }
    })
    // catch errors
    .catch(error => {
        // if error is redirect throw it
        if (error.code === 302) {
            throw error
        }
        // for version conflict errors return the current instance with the
        // error data and throw a 409 http error
        if (instance.isConflictError(error)) {
            // get current instance
            return instance.current()
            // throw 409 conflic error with current instance data
            .then(current => {
                // if in json mode return error with data
                if (args.json) {
                    httpError(409, undefined, current)
                }
                // otherwise redirect to current instance
                else {
                    httpRedirect('../'+current.id+'?error=conflict')
                }
            })
        }
        // if in json mode or there is no form return 400 error
        if (args.json || !controller.form) {
            httpError(400, undefined, error.data)
        }
        // create new form instance with input and error data
        var form = controller.form.newInstance({
            action: './update',
            input: data,
            error: error,
        })
        // javascript for page
        var js = []
        // if form uses ckeditor add js
        if (form.ckeditor) {
            js.push({
                crossorigin: 'anonymous',
                //integrity: 'sha256-TTtB6JD2qVpmE4ydlMyYH52d7OSMq5FQh2f0ECHR0Bw=',
                src: '//cdn.jsdelivr.net/ckeditor/4.3.1/ckeditor.js',
            })
        }
        // return form
        return {
            form: form,
            js: js,
        }
    })
}