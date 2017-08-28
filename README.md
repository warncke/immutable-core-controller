# immutable-core-controller

Immutable Core Controller integrates with the
[Immutable App](https://www.npmjs.com/package/immutable-app) ecosystem to
provide a class for defining controllers.

If a controller is insantiated with an
[Immutable Core Model](https://www.npmjs.com/package/immutable-core-model)
default controllers will be created with standard CRUD functionality.

## Immutable Core Controller v0.7 and Immutable Core Model v3

Immutable Core Controller v0.7.0 is required to support the breaking changes
that were made in Immutable Core Model v3.

Immutable Core Controller v0.7 is not compatible with Imutable Core Model v2.

## Creating a default controller for model

    const ImmutableCoreController = require('immutable-core-controller')
    const ImmutableCoreModel = require('immutable-core-model')

    var fooModel = new ImmutableCoreModel({
        properties: {
            bar: {type: string},
            foo: {type: string},
        },
        required: ['bar', 'foo'],
    })

    var fooController = new ImmutableCoreController({
        model: fooModel,
    })

In this example a controller is created for fooModel using all default options.

With ImmutableApp a default controller will be created for every model
automatically. The default controller can be customized and extended with
additional controller file(s) in the same directory as the model.

## Default methods

Method Name  | Method    | Path                         |
-------------|-----------|------------------------------|
create       | POST      | /                            |
delete       | DELETE    | /:id                         |
delete       | GET       | /:id/delete                  |
link         | GET, POST | /:id/link                    |
list         | GET       | /                            |
new          | GET       | /new                         |
read         | GET       | /:id                         |
update       | POST, PUT | /:id                         |
undelete     | GET, POST | /:id/undelete                |
schema       | GET       | /schema                      |
unlink       | GET, POST | /:id/unlink                  |
validate     | POST      | /validate                    |

### create

Create a new model instance. Model schema will be used to validate input.

### delete

Delete an instance. Only available if model has a (d)eleted column.

Delete is available as either an HTTP POST on the /:id path or an HTTP GET on
the /:id/delete path.

When doing an HTTP DELETE data set in the body with the model name will be
merged into the data of the undeleted object.

### link

For models that have relations via another model the link method creates a new
entry linking the record identified by the path and id to the related record.

The link method can be used with either GET or POST.

The name of the related model must be specified with the `relation` property
either as a query param or in the post body.

The id of the record to link to must be specified with the `relationId`
property which can also be in either the query params or post body.

### list

The list method returns a list of model instances. This list is paginated and
can be sorted and filtered by columns on the model.

Parameters are mapped to Immutable Core Model query args. For more complex
queries JSON encoded query params can be set as the `query` param.

Free form queries can be executed using the `search` param.

### new

The new method renders the form to create a new record.

### read

Get a model instance by id. `current` param can be set to get the current
revision of the instance and the `deleted` param can be set to return the
object even it it is deleted.

### undelete

Undelete an instance. Only available if model has a (d)eleted column.

Undelete is available by doing either an HTTP POST or HTTP GET to
/:id/undelete.

When doing an HTTP POST data set in the body with the model name will be merged
into the data of the undeleted object.

### unlink

For models that have relations via another model the unlink method deletes the
linking record between two records.

The unlink method can be used with either GET or POST.

The name of the related model must be specified with the `relation` property
either as a query param or in the post body.

The id of the record to unlink must be specified with the `relationId`
property which can also be in either the query params or post body.

### update

Update an instance. Model schema will be used to validate input. If `meta`
param is set then metaData such as accountId, parentId, and createTime can be
specified.

If a parentId is specified and the parent has already been revised then a 409
CONFLICT error will be returned.

### schema

Returns the JSON schema for the create method which is the same as the JSON
schema for the model by default.

### validate

Validates the data provided without saving it

## Default method role

    var fooController = new ImmutableCoreController({
        defaultRole: 'foo'
    })

If a `defaultRole` is specified then all default methods will be created with
that role.

Otherwise the default role will be `all` for read methods (list, read, schema,
validate) and `authenticated` for write methods (create, delete, undelete,
update).

## Customizing default controllers

    var fooController = new ImmutableCoreController({
        list: {
            fields: [
                'foo',
                'bar',
            ],
        },
        model: fooModel,
        update: false,
    })

Options can be set for each default controller method with an object under the
method name. The default controller for a method can be disabled by setting the
value false.

### Setting links to include for all default methods

    var fooController = new ImmutableCoreController({
        links: [
            {href: '/foo', title: 'FooBar!'},
        ],
        model: fooModel,
    })

Links specified at the top level will be included with all methods that render
an HTML view. These links should be static only.

### Setting links for a specific method

    var fooController = new ImmutableCoreController({
        read: {
            links: [
                {href: '/foo/${id}/bar', title: 'Foo ${data.bar}'},
            ],
        },
        model: fooModel,
    })

Links for a specific view can be specified under the method name. Links for the
read method can contain variables that will be resolved from the record instance
being read.

### Creating related records by default

    var fooController = new ImmutableCoreController({
        create: {
            relations: {
                bar: {
                    bam: true
                },
            },
        },
        model: fooModel,
    })

The relations option for the create method allows related model records to be
created by default whenever a record is created.

In this example `bar` references the bar model and the object {bam: true} will
be used as the data for the new bar record.

When the related record is created all of the linking id columns will be set by
default.

### Customizing the fields displayed by list method

    var fooController = new ImmutableCoreController({
        list: {
            fields: [
                {
                    meta: true,
                    property: 'originalId',
                    title: 'Foo Id'
                },
                'bar'
            ],
        },
        model: fooModel,
    })

The fields to display on the list view can be specified either with a string or
object.

If an object is provided then the `property` for the field must be set.

If the `property` is a meta data column other than createTime (id, originalId,
parentId) then the meta:true option must be set.

The property value will be converted to title case to provide the `title` if
none is specified.

### Adding custom link form to read method

    var fooController = new ImmutableCoreController({
        read: {
            forms: [
                {
                    input: {
                        optionTitleProperty: 'barName',
                        optionValueProperty: 'barOriginalId',
                    },
                    inputType: 'select',
                    model: 'bar',
                    query: {
                        raw: true,
                        order: ['barName'],
                    },
                    type: 'link',
                },
            ],
        },
        model: fooModel,
    })

The `forms` option for the `read` method allows custom forms for specific
records to be created. Currently the only supported form type is `link` which
allows the current record to the linked to another record via the link method.

The `model` specifies the name of the related model.

The `query` arguments are used to perform an ImmutableCoreModel query for
records to link to.

The `optionTitleProperty` and `optionValueProperty` for `input` specify the
properties from the loaded records to populate the select with.

## Creating a custom controller

    var fooController = new ImmutableCoreController({
        paths: {
            '/foo': {
                get: {
                    method: function (args) {
                        ...
                    },
                    template: 'foo',
                },
            },
        },
    })

Custom controllers are created by specifying the path, the http method, and an
object defining the controller options for that path and http method.

The supported http methods are `delete`, `get`, `post` and `put`.

## Specifying input for a controller

    var fooController = new ImmutableCoreController({
        paths: {
            '/foo/:bar': {
                get: {
                    input: {
                        bar: 'params.bar',
                    },
                },
            },
        },
    })

Controllers do not have access to the express request object directly so input
must be specified.

In this this example the value from '/foo/:bar' which is in the express request
object under params.bar will be passed in the `before` and `method` args object
as the property bar.

## Specifying multiple input options

    var fooController = new ImmutableCoreController({
        paths: {
            '/foo/:bar': {
                post: {
                    input: {
                        bam: ['query.bam', 'body.bam'],
                    },
                },
            },
        },
    })

In this example an array is used to specify multiple locations where the bam
argument may be fetched from. The first location with a value defined will be
used.

## Controller Options

Property   | Type     | Description                                         |
-----------|----------|-----------------------------------------------------|
after      | function | called after executing `method`                     |
before     | function | called before executing `method`                    |
input      | object   | properties from request mapped to args              |
json       | boolean  | when true will always return json, when false never |
method     | function | primary controller function                         |
methodName | string   | ImmutableCore method name                           |
role       | string   | role that controller will be used for               |
template   | string   | path for template file                              |

### input

The input object specifies a map of argument names to the location of that
argument in the express http request object. Input can be pulled from any
location in the request object (e.g. params, query, body, headeres, cookies).

A single path can be specified with a string or a list of paths can be given
with an array. If multiple locations for input are specified then the first one
with a defined value will be used.

### json

With the ImmutableApp framework all routes are served as either JSON or HTML
by default.

To disable dynamic switching between JSON and HTML and force a route to be
served as either always JSON or always HTML set the json option to either
true or false.

### method, before and after

Typically a controller will have at least a primary `method` and for more
complex controllers it can be beneficial to break functionality into separate
methods.

Default controllers follow the pattern of doing any server side data loading
in the `before` method, doing processing of input and loaded server data in
the primary `method` and leaving the `after` method open for customization.

If no methods at all are specified a default controller will be used to render
the specified template file.

### methodName

The `methodName` can be specified and if not it will be created automatically.

If the function set for `method` has a name then that name will be used.
Otherwise the path and the http method with non alpha characters removed will
be used.

### role

With the ImmutableApp framework the same route and HTTP method can be served
with different controllers based on the users role(s).

The controller will only be servered to sessions with the specified role.

### template

Name of template to use. This may be a path relative to any template
directories specified in the assets configuration or relative to location of
the controller.

If the default extension is used the file extension should not be used.