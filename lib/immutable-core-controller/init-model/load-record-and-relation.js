'use strict'

/* exports */
module.exports = loadRecordAndRelation

/* npm modules */
const _ = require('lodash')
const defined = require('if-defined')
const httpError = require('../../http-error')

/**
 * @function loadRecordAndRelation
 *
 * load record and related record
 *
 * @param {ImmutableCoreController} controller
 * @param {object} args
 *
 * @returns {Promise}
 */
async function loadRecordAndRelation (controller, args) {
    // if no id is passed throw error
    if (!defined(args.id)) {
        httpError(404)
    }
    // if no relationId is set throw error
    if (!defined(args.relationId)) {
        httpError(400, 'relationId required')
    }
    // get primary model from controller
    var primaryModel = controller.model
    // get relation
    var relation = primaryModel.relation(args.relation)
    // throw error on invalid relation
    if (!defined(relation)) {
        httpError(400, `invalid relation ${args.relation}`)
    }
    // get related model
    var relatedModel = relation.model
    // build common query args for both queries
    var queryArgs = {
        limit: 1,
        session: args.session,
    }
    // add current flag if set
    if (args.current) {
        queryArgs.current = true
    }
    // query both deleted and not deleted instances if deleted option set
    if (args.deleted) {
        queryArgs.where.isDeleted = null
    }
    // build args for primary record query
    var primaryQueryArgs = _.clone(queryArgs)
    primaryQueryArgs.where = {id: args.id}
    // get args for related 
    var relatedQueryArgs = _.clone(queryArgs)
    relatedQueryArgs.where = {id: args.relationId}
    // load records
    var [primaryRecord, relatedRecord] = await Promise.all([
        primaryModel.query(primaryQueryArgs),
        relatedModel.query(relatedQueryArgs),
    ])
    // throw error if primary record not found
    if (!defined(primaryRecord)) {
        httpError(404)
    }
    // throw error if related record not found
    if (!defined(relatedModel)) {
        httpError(400, `related record ${args.relation}#${args.relationId} not found`)
    }
    // create new object that will be merged into args
    var merge = {}
    // add records to return data
    merge[primaryModel.name] = primaryRecord
    merge[relatedModel.name] = relatedRecord
    // return data to merge into args
    return merge
}