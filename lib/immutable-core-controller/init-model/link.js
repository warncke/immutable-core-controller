'use strict'

/* npm modules */
const _ = require('lodash')
const defined = require('if-defined')
const httpError = require('immutable-app-http-error')
const httpRedirect = require('immutable-app-http-redirect')

/* application modules */
const loadRecord = require('./load-record')

/* exports */
module.exports = initModelLink

/**
 * @function initModelLink
 *
 * link instance to a related model instance
 *
 * @param {object} args
 */
function initModelLink (args) {
    var controller = this
    var model = this.model
    // if model does not have id column then cannot use default controller
    if (!defined(model.columnName('id'))) {
        return
    }
    // set true if model has ny relations that link via another model
    var hasVia = false
    // check for relations
    _.each(model.relations, relation => {
        if (defined(relation.via)) {
            hasVia = true
        }
    })
    // if model does not have via then do not create link endpoing
    if (!hasVia) {
        return
    }
    // get accountId column
    var accountIdColumn = model.columnName('accountId') 
    // set role to authenticated if model requires account id
    var role = defined(args.defaultRole) 
        ? args.defaultRole
        : defined(accountIdColumn) && model.columns[accountIdColumn].null === false
            ? 'authenticated'
            : 'all'
    // index inputs
    var input = {
        // get current revision of record
        current: ['query.current', 'body.current'],
        // get record even if deleted
        deleted: ['query.deleted', 'body.deleted'],
        // ignore conflicts
        force: ['query.force', 'body.force'],
        // record id
        id: 'params.id',
        // url to redirect to when done
        redirect: ['query.redirect', 'body.redirect'],
        // http referrer
        referrer: 'headers.referer',
        // name of model to link to
        relation: ['query.relation', 'body.relation'],
        // id of model to link to
        relationId: ['query.relationId', 'body.relationId'],
    }
    // create path if it does not exist
    if (!defined(this.paths['/:id/link'])) {
        this.paths['/:id/link'] = {}
    }
    // add handler for POST /:id/link to link record to another
    this.paths['/:id/link'].post = this.paths['/:id/link'].get = [
        {
            before: function (args) {
                // load instance
                return loadRecord(controller, args)
            },
            input: input,
            method: function (args) {
                return linkModel(controller, args)
            },
            methodName: 'link',
            role: role,
        },
    ]
}

/**
 * @function linkModel
 *
 * link model to related model
 *
 * @param {object} controller
 * @param {object} args
 *
 * @returns {Promise}
 */
function linkModel (controller, args) {
    // get model from controller
    var model = controller.model
    // get record from args
    var record = args[model.name]
    // get relation by name
    var relation = model.relation(args.relation)
    // require relation with via
    if (!relation || !relation.via) {
        httpError(400, 'Invalid Relation')
    }
    // args for create
    var createArgs = {
        session: args.session,
    }
    // set model id
    createArgs[relation.viaModelIdColumn] = record.raw[relation.modelIdColumn]
    createArgs[relation.viaRelationIdColumn] = args.relationId
    // create relation
    return relation.viaModel.createMeta(createArgs)
    // take appropriate action on success
    .then(record => {
        // if json then return raw data
        if (args.json) {
            return record
        }
        // if html then redirect
        else {
            httpRedirect(args.redirect || args.referrer)
        }
    })
}