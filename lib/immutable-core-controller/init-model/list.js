'use strict'

/* native modules */
const assert = require('assert')

/* npm modules */
const _ = require('lodash')
const changeCase = require('change-case')
const pluralize = require('pluralize')

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
    // create title from name
    var title = pluralize(model.title)
    // create new form instance configured to submit from list page
    if (controller.form) {
        var form = controller.form.newInstance({
            action: './?redirect=./',
        })
    }
    // list of fields to display for view
    var fields
    // if list of fields is specified by args use if
    if (args.list && args.list.fields) {
        // require fields list to be array
        assert.ok(Array.isArray(args.list.fields), 'list fields must be array')
        // use field list from args
        fields = args.list.fields
    }
    //  build list of fields from columns and properties properties
    else {
        fields = _.keys(model.extraColumns)
        // if model has schema and properties
        if (model.schemaData) {
            fields = _.uniq( fields.concat( _.keys(model.schemaData.properties) ) )
        }
        // add create time field
        fields.push({
            meta: true,
            property: 'createTime',
            orderAscIcon: 'sort-numeric-asc',
            orderAscUrl: './?orderColumn=createTime&orderDirection=ASC',
            orderDescIcon: 'sort-numeric-desc',
            orderDescUrl: './?orderColumn=createTime&orderDirection=DESC',
        })
        // add actions field
        fields.push({
            actions: true,
            title: 'Actions'
        })
    }
    // process fields
    fields = _.map(fields, field => {
        // if field is a string the build object
        if (typeof field === 'string') {
            field = {
                property: field,
            }
        }
        // create default label if label not set
        if (!field.title) {
            // use property name converted to upper case first words
            field.title = changeCase.titleCase(field.property)
        }
        // get column for property (if any)
        var column = model.columns[field.property]
        // if field is column then set properties based on column
        if (column) {
            // if column has index allow filter and search on column
            if (column.index || column.unique) {
                field.orderAscIcon = 'sort-alpha-asc'
                field.orderAscUrl = './?orderColumn='+field.property+'&orderDirection=ASC'
                field.orderDescIcon = 'sort-alpha-desc'
                field.orderDescUrl = './?orderColumn='+field.property+'&orderDirection=DESC'
                field.searchBy = true
                field.searchIcon =  'search'
            }
        }
        // return field spec
        return field
    })
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
    // create path if it does not exist
    if (!this.paths['/']) {
        this.paths['/'] = {}
    }
    // add list handler for GET on /
    this.paths['/'].get = {
        before: function (args) {
            // load records
            return beforeList(controller, args, _.cloneDeep(fields), title, form)
        },
        input: input,
        method: function (args) {
            return _.pick(args, ['clear', 'fields', 'form', 'pager', 'query', 'records', 'result', 'title'])
        },
        methodName: 'list',
    }
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
 *
 * @returns {Promise}
 */
function beforeList (controller, args, fields, title, form) {
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
    // add order if set
    if (args.orderColumn) {
        query.order = [args.orderColumn]
        // if custom order is set add clear option
        clear = true
        // add direction if set
        if (args.orderDirection) {
            query.order.push(args.orderDirection)
        }
    }
    // add where if set
    if (args.where) {
        query.where = args.where
    }
    // included deleted records
    if (args.deleted) {
        // create where query if not set
        if (!query.where) {
            query.where = {}
        }
        // include deleted records - if argument is only then only deleted
        query.where.isDeleted = args.deleted === 'only'
            ? true: null
    }
    // add extra columns as query param options
    _.each(model.extraColumns, (spec, name) => {
        // if param is set in args add to where query
        if (args[name]) {
            // create where query if not set
            if (!query.where) {
                query.where = {}
            }
            // set like query
            query.where[name] = {like: args[name]}
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
                // create list of actions for record
                var actions = record.actions = []
                // if record has id then add view/edit action
                if (record.id) {
                    actions.push({
                        href: './'+record.id,
                        title: 'View',
                    })
                }
                // add actions for model actions
                _.each(model.actions, (spec, name) => {
                    // action has already been performed
                    if (record[spec.isProperty]) {

                    }
                    // action has not been performed
                    else {
                        actions.push({
                            href: './'+record.id+'/'+changeCase.paramCase(name),
                            title: changeCase.titleCase(name),
                        })
                    }
                })
            })
            // return data that will be merged into args for primary method
            return {
                clear: clear,
                fields: fields,
                form: form,
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