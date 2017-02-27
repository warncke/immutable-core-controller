'use strict'

/* npm modules */
const _ = require('lodash')
const changeCase = require('change-case')

/* exports */
module.exports = buildFields

/* constants */
const metaFields = {
    actions: {
        actions: true,
        title: 'Actions'
    },
    createTime: {
        meta: true,
        property: 'createTime',
        orderAscIcon: 'sort-numeric-asc',
        orderAscUrl: './?orderColumn=createTime&orderDirection=ASC',
        orderDescIcon: 'sort-numeric-desc',
        orderDescUrl: './?orderColumn=createTime&orderDirection=DESC',
    },
}

/**
 * @function buildFields
 *
 * build fields for table view from model and args
 *
 * @param {object} model
 * @param {array} fields
 *
 * @param 
 *
 */
function buildFields (model, fields) {
    //  build list of fields from columns and properties properties
    if (!fields) {
        fields = _.keys(model.extraColumns)
        // if model has schema and properties
        if (model.schemaData) {
            fields = _.uniq( fields.concat( _.keys(model.schemaData.properties) ) )
        }
        // add create time field
        fields.push(metaFields.createTime)
        // add actions field
        fields.push(metaFields.actions)
    }
    // process fields
    fields = _.map(fields, field => {
        // if field is a string the build object
        if (typeof field === 'string') {
            // if field is a meta column then add spec
            if (metaFields[field]) {
                return metaFields[field]
            }
            // create spec
            else {
                field = {
                    property: field,
                }
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
    // return formatted fields
    return fields
}