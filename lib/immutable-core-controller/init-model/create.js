'use strict'

/* application modules */
const httpError = require('../../http-error')
const httpRedirect = require('../../http-redirect')

/* exports */
module.exports = initModelCreate

/**
 * @function initModelCreate
 *
 * create instance controller
 *
 * @param {object} args
 */
function initModelCreate (args) {
    var controller = this
    var model = this.model
    // index inputs
    var input = {
        // whether or not create data includes meta columns
        meta: 'query.meta',
        // url to redirect to on success
        redirect: 'query.redirect',
    }
    // instance data is in body under model name
    input[model.name] = 'body.'+model.name
    // create path if it does not exist
    if (!this.paths['/']) {
        this.paths['/'] = {}
    }
    // add handler for POST / to create instance
    this.paths['/'].post = {
        input: input,
        // create new instance
        method: function (args) {
            return create(controller, args)
        },
        methodName: 'create',
        template: 'instance',
    }
}

/**
 * @function create
 *
 * @param {ImmutableCoreController} controller
 * @param {object} args
 *
 * @returns {Promise}
 */
function create (controller, args) {
    // get model from controller
    var model = controller.model
    // get model data from input
    var data = args[model.name]
    // if meta flag is not set then data is instance data
    var createArgs = args.meta ? data : {data: data}
    // add session to args
    createArgs.session = args.session
    // create instance
    return model.createMeta(createArgs)
    // redirect on success
    .then(instance => {
        // if in json mode return instance data
        if (args.json) {
            return instance
        }
        // otherwise redirect to instance page
        else {
            // use redirect from input or redirect to new instance
            var url = args.redirect || './'+instance.id
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
        // if in json mode or there is no form return 400 error
        if (args.json || !controller.form) {
            httpError(400, undefined, error.data)
        }
        // create new form instance with input and error data
        var form = controller.form.newInstance({
            input: data,
            error: error,
        })
        // return form
        return {form: form}
    })
}