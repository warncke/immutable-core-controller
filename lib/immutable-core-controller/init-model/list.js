'use strict'

/* native modules */
const assert = require('assert')

/* npm modules */
const _ = require('lodash')
const defined = require('if-defined')
const requireValidOptionalObject = require('immutable-require-valid-optional-object')

/* application modules */
const buildActions = require('./build-actions')
const buildFields = require('./build-fields')

/* exports */
module.exports = initModelList

/**
 * @function initModelIndex
 *
 * create list view controller
 *
 * @param {object} args
 */
function initModelList (args) {
    var controller = this
    var model = this.model
    // make sure args is object
    args = requireValidOptionalObject(args)
    // make sure list is defined
    args.list = requireValidOptionalObject(args.list)
    // make sure query args are object
    var queryArgs = requireValidOptionalObject(args.list.query)
    // create title from name
    var title = model.title+' Records'
    // create new form instance configured to submit from list page
    if (controller.form && _.get(args, 'list.form') !== false) {
        var form = controller.form.newInstance({
            action: './?redirect=./',
        })
    }
    // get role
    var role = args.defaultRole || 'all'
    // build fields for table view
    this.fields = buildFields(model, args.list && args.list.fields)
    // index inputs
    var input = {
        // included deleted records
        deleted: 'query.deleted',
        // limit - overrides value in query if any
        limit: 'query.limit',
        // offset - overrides value in query if any
        offset: 'query.offset',
        // column to sort by
        orderColumn: 'query.orderColumn',
        // direction to sort in
        orderDirection: 'query.orderDirection',
        // free-form search string
        search: 'query.search',
        // list of columns to select
        select: 'query.select',
        // json encoded where arguments
        where: 'query.where',
    }
    // if model has an original id column then add to query options
    if (model.columnName('originalId')) {
        input.originalId = 'query.originalId'
    }
    // add extra columns as query param options
    _.each(model.extraColumns, (spec, name) => {
        // only add column if it has index
        if (!spec.index && !spec.unique) {
            return
        }
        // do not overwrite core inputs
        if (input[name]) {
            return
        }
        // add column to inputs
        input[name] = 'query.'+name
    })
    // links to display at top of page
    var links
    // use links from list view
    if (Array.isArray(args.list.links)) {
        links = args.list.links
    }
    // use global controller links
    else if (Array.isArray(args.links)) {
        links = args.links
    }
    // set default links
    else {
        links = [
            {href: './new', title: 'Create New'},
        ]
    }
    // create path if it does not exist
    if (!this.paths['/']) {
        this.paths['/'] = {}
    }
    // add list handler for GET on /
    this.paths['/'].get = [
        {
            before: function (args) {
                // load records
                return beforeList(controller, args, _.cloneDeep(controller.fields), title, form, links, queryArgs)
            },
            input: input,
            method: function (args) {
                return args.json
                    ? _.pick(args, ['records', 'result'])
                    : _.pick(args, ['clear', 'fields', 'form', 'links', 'pager', 'query', 'records', 'result', 'title'])
            },
            methodName: 'list',
            role: role,
        },
    ]
}

/**
 * @function beforeList
 *
 * load records for list view
 *
 * @param {ImmutableCoreController} controller
 * @param {object} args
 * @param {array} fields
 * @param {string} title
 * @param {object} form
 * @param {object} defaultQueryArgs
 *
 * @returns {Promise}
 */
function beforeList (controller, args, fields, title, form, links, defaultQueryArgs) {
    // get model from controller
    var model = controller.model
    // set limit
    var limit = args.limit || controller.defaultLimit
    var offset = args.offset || 0
    // set to true to show clear option for filters/sort
    var clear = false
    // set minimum limit to 2
    if (limit < 2) {
        limit = 2
    }
    // build arguments for query
    var query = {
        session: args.session,
    }
    // if query args are passed use them
    if (defined(defaultQueryArgs)) {
        _.merge(query, defaultQueryArgs)
    }
    // add order if set
    if (defined(args.orderColumn)) {
        query.order = [args.orderColumn]
        // if custom order is set add clear option
        clear = true
        // add direction if set
        if (defined(args.orderDirection)) {
            query.order.push(args.orderDirection)
        }
    }
    // add where if set
    if (defined(args.where)) {
        query.where = JSON.parse(args.where)
    }
    // included deleted records
    if (defined(args.deleted)) {
        // create where query if not set
        if (!defined(query.where)) {
            query.where = {}
        }
        // include deleted records - if argument is only then only deleted
        query.where.isDeleted = args.deleted === 'only'
            ? true: null
    }
    // add extra columns as query param options
    _.each(model.extraColumns, (spec, name) => {
        // if param is set in args add to where query
        if (typeof args[name] === 'string') {
            // create where query if not set
            if (!defined(query.where)) {
                query.where = {}
            }
            // if query is quoted then do exact match
            var queryArg = args[name].charAt(0) === '"' && args[name].charAt(args[name].length - 1) === '"'
                // strip leading and trailing quotes
                ? args[name].substr(1, args[name].length - 2)
                // add wildcards to string
                : `%${args[name]}%`
            // set like query
            query.where[name] = {like: queryArg}
            // if filter is set add clear option
            clear = true
            // and param to sort links
            _.each(fields, field => {
                if (field.orderAscUrl) {
                    field.orderAscUrl += '&'+name+'='+args[name]
                }
                if (field.orderDescUrl) {
                    field.orderDescUrl += '&'+name+'='+args[name]
                }
            })
        }
    })
    // if originalId set add to query
    if (args.originalId) {
        // create where query if not set
        if (!query.where) {
            query.where = {}
        }
        // set originalId in query
        query.where.originalId = {eq: args.originalId}
    }
    // do database query
    return model.query(query)
    // prepare args for primary method
    .then(result => {
        // remove session from query args for presentation
        delete query.session
        // fetch records
        return result.fetch(limit, offset)
        // resolve with result and record data
        .then(records => {
            // add actions to records
            _.each(records, record => {
                buildActions(controller, record)
            })
            // return data that will be merged into args for primary method
            return {
                clear: clear,
                fields: fields,
                form: form,
                links: links,
                query: query,
                records: records,
                result: {
                    length: result.length,
                },
                title: title,
            }
        })
    })
}