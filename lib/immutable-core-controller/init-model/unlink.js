'use strict'

/* npm modules */
const _ = require('lodash')
const defined = require('if-defined')
const httpError = require('immutable-app-http-error')
const httpRedirect = require('immutable-app-http-redirect')

/* application modules */
const loadRecordAndRelation = require('./load-record-and-relation')

/* exports */
module.exports = initModelUnlink

/**
 * @function initModelUnlink
 *
 * link instance to a related model instance
 *
 * @param {object} args
 */
function initModelUnlink (args) {
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
    if (!this.paths['/:id/unlink']) {
        this.paths['/:id/unlink'] = {}
    }
    // add handler for POST /:id/link to link record to another
    this.paths['/:id/unlink'].post = this.paths['/:id/unlink'].get = [
        {
            before: function (args) {
                // load primary record and related record
                return loadRecordAndRelation(controller, args)
            },
            input: input,
            method: function (args) {
                // unlink related record from primary record
                return unlinkModel(controller, args)
            },
            methodName: 'unlink',
            role: role,
        },
    ]
}

/**
 * @function unlinkModel
 *
 * link model to related model
 *
 * @param {object} controller
 * @param {object} args
 *
 * @returns {Promise}
 */
function unlinkModel (controller, args) {
    // get model from controller
    var model = controller.model
    // get primary record from args
    var primaryRecord = args[model.name]
    // get relation by name
    var relation = model.relation(args.relation)
    // require relation with via
    if (!defined(relation) || !defined(relation.viaModel)) {
        httpError(400, 'invalid relation')
    }
    // via model must support delete
    if (!defined(relation.viaModel.columns)) {
        httpError(400, 'unlink not supported for ${relation.viaModel.name}')
    }
    // get related record from args
    var relatedRecord = args[relation.model.name]
    // build query to select relation entries from via table - there should
    // usually be only 1 but if there are multiple delete them all
    var queryArgs = {
        session: args.session,
        where: {},
    }
    // add primary model id to where query
    queryArgs.where[relation.viaModelIdColumn] = primaryRecord.raw[relation.viaModelIdColumn]
    // add related model id to where query
    queryArgs.where[relation.viaRelationIdColumn] = relatedRecord.raw[relation.viaRelationIdColumn]
    // do query
    return relation.viaModel.query(queryArgs).then(result => {
        // delete each record
        return result.each(record => record.delete())
    })
    // take appropriate action on success
    .then(() => {
        // if json then return raw data
        if (args.json) {
            return {success: true}
        }
        // if html then redirect
        else {
            httpRedirect(args.redirect || args.referrer)
        }
    })
}