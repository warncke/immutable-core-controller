'use strict'

/* npm modules */
const _ = require('lodash')
const httpError = require('immutable-app-http-error')
const httpRedirect = require('immutable-app-http-redirect')

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
    // get accountId column
    var accountIdColumn = model.columnName('accountId')
    // set role to authenticated if model requires account id
    var role = args.defaultRole || (accountIdColumn && model.columns[accountIdColumn].null === false ? 'authenticated' : 'all')
    // get relations to create from args if any
    var relations = args.create && args.create.relations
    // validate relations
    _.each(relations, (createArgs, relation) => {
        // this will throw error on invalid relation
        model.relation(relation)
    })
    // index inputs
    var input = {
        // whether or not create data includes meta columns
        meta: 'query.meta',
        // url to redirect to on success
        redirect: ['body.redirect', 'query.redirect'],
    }
    // instance data is in body under model name
    input[model.name] = 'body.'+model.name
    // create path if it does not exist
    if (!this.paths['/']) {
        this.paths['/'] = {}
    }
    // controller spec
    var node = {
        input: input,
        method: function (args) {
            return create(controller, args, node, relations)
        },
        methodName: 'create',
        role: role,
        template: 'instance',
    }
    // add handler for POST / to create instance
    this.paths['/'].post = [node]
}

/**
 * @function create
 *
 * @param {ImmutableCoreController} controller
 * @param {object} args
 * @param {object} node
 * @param {object} relations
 *
 * @returns {Promise}
 */
function create (controller, args, node, relations) {
    // get model from controller
    var model = controller.model
    // get model data from input
    var data = args[model.name]
    // if meta flag is not set then data is instance data
    var createArgs = args.meta ? data : {data: data}
    // do not accept allow flag
    if (createArgs.allow) {
        httpError(403)
    }
    // add session to args
    createArgs.session = args.session
    // create instance
    return model.createMeta(createArgs)
    // create any relation models
    .then(instance => {
        // if no relations do nothing
        if (!relations) {
            return instance
        }
        // create all relations
        return Promise.all(_.map(_.keys(relations), relation => {
            // get relation through instance
            return instance.createMeta({
                data: relations[relation],
                relation: relation,
            })
        }))
        // resolve with instance
        .then(() => instance)
    })
    // redirect on success
    .then(instance => {
        // if being called in json mode or there is an after function
        // return the created instace
        if (args.json || node.after) {
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