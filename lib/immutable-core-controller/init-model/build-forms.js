'use strict'

/* npm modules */
const ImmutableCoreModelForm = require('immutable-core-model-form')
const Promise = require('bluebird')
const _ = require('lodash')
const defined = require('if-defined')
const requireValidOptionalObject = require('immutable-require-valid-optional-object')
const resolveVariables = require('./resolve-variables')

/* exports */
module.exports = buildForms

/**
 * @function buildForms
 *
 * take controller form specifications and build ImmutableCoreModelForm
 * forms
 *
 * @param {object} args
 * @param {object} controller
 * @param {array} forms
 * @param {object} instance
 *
 * @returns {Promise}
 */
function buildForms (args, controller, forms, instance) {
    // promises to be resolved once all forms built
    var promises = []
    // build forms from controller spec
    _.each(forms, form => {
        if (form.type === 'link') {
            var promise = buildFormLink(args, controller, form, instance)
        }
        // add promise to list
        promises.push(promise)
    })
    // wait for promises to resolve then resolve with forms
    return Promise.all(promises)
}

/**
 * @function buildFormLink
 *
 * build a form that links the current instance to another instance.
 *
 * @param {object} args
 * @param {object} controller
 * @param {array} form
 *
 * @returns {Promise}
 */
function buildFormLink (args, controller, form, instance) {
    // get model from controller
    var model = controller.model
    // get relation from the model to be linked to to the current instance
    var relation = model.relation(form.model)
    // require relation to continue
    if (!relation) {
        throw new Error('no relation found for form model '+form.model)
    }
    // get relation models
    var relationModel = relation.model
    var viaModel = relation.viaModel
    // link forms can only be created for related models that are linked
    // via another model
    if (!viaModel) {
        throw new Error('no viaModel for relation to form model '+relationModel.name)
    }
    // if input type for form is select then get values for select from
    if (form.inputType === 'select') {
        // get input args
        var input = requireValidOptionalObject(form.input)
        // option value property is either specified or id
        var optionValueProperty = defined(input.optionValueProperty) ?  input.optionValueProperty : 'id'
        // option title is either specified or it - should be specified
        var optionTitleProperty = defined(input.optionTitleProperty) ?  input.optionTitleProperty : 'id'
        // build args for query
        var queryArgs = {
            all: true,
            session: args.session,
        }
        // merge any args from form
        _.merge(queryArgs, form.query)
        // load reladed records
        return relationModel.query(queryArgs)
        // create from with select built from related records
        .then(records => {
            // list of select options
            var options = _.map(records, record => {
                // title for select option
                var title
                // resolve title string from record if set
                if (defined(input.optionTitle)) {
                    title = resolveVariables(input.optionTitle, record)
                }
                // otherwise use property name
                else {
                    // try to get title from record
                    title = _.get(record, optionTitleProperty)
                    // try to get title from data if not in record
                    if (!defined(title)) {
                        title = _.get(record.data, optionTitleProperty)
                    }
                }
                // try to get value from record
                var value = _.get(record, optionValueProperty)
                // try to get value from data if not in record
                if (!defined(value)) {
                    value = _.get(record.data, optionValueProperty)
                }
                // return select option
                return {
                    title: title,
                    value: value,
                }
            })
            // build field
            var field = {
                inputType: 'select',
                label: relationModel.title,
                name: 'relationId',
                options: options,
                property: 'relationId',
            }
            // create form
            var form = new ImmutableCoreModelForm({
                action: './'+instance.id+'/link',
                fields: [
                    field,
                    {
                        name: 'relation',
                        property: 'relation',
                        value: relationModel.name,
                        inputType: 'hidden',
                    },
                ],
                method: 'POST',
                model: model,
                submit: {
                    title: 'Add '+relationModel.title,
                },
                title: 'Add '+relationModel.title,
            })
            // resolve with form
            return form
        })
    }
}