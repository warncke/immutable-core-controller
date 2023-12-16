# immutable-core-controller

Immutable Core Controller integrates with the
[Immutable App](https://www.npmjs.com/package/immutable-app) ecosystem to
provide a class for defining controllers.

If a controller is insantiated with an
[Immutable Core Model](https://www.npmjs.com/package/immutable-core-model)
default controllers will be created with standard CRUD functionality.

## Immutable Core Controller v0.12 / Immutable App v0.17

ICC v0.12 is a major revision of functionality that goes along with channges in
Immutable App v0.17 to remove support for server side rendering and focus
exclusively on providing APIs.

ICC v0.12 removes support for linking objects, relations between objects,
forms, and other functionality that was specific to server rendered pages.

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
list         | GET       | /                            |
read         | GET       | /:id                         |
replace      | PUT       | /:id                         |
update       | PATCH     | /:id                         |
undelete     | POST      | /:id/undelete                |
schema       | GET       | /schema                      |
validate     | POST      | /validate                    |

### create

Create a new model instance. Model schema will be used to validate input.

### delete

Delete an instance. Only available if model has a (d)eleted column.

Delete is done with an HTTP DELETE request to the /:id path. 

When doing an HTTP DELETE data set in the body with the model name will be
merged into the data of the undeleted object.

### list

The list method returns a list of model instances. This list is paginated and
can be sorted and filtered by columns on the model.

Parameters are mapped to Immutable Core Model query args. For more complex
queries JSON encoded query params can be set as the `query` param.

Free form queries can be executed using the `search` param.

### read

Get a model instance by id. `current` param can be set to get the current
revision of the instance and the `deleted` param can be set to return the
object even it it is deleted.

### replace

Replace an instance. Model schema will be used to validate input. If `meta`
param is set then metaData such as accountId, parentId, and createTime can be
specified.

Replace is available by doing an HTTP PUT request to /:id. Data in the request
body will replace existing object data.

If a parentId is specified and the parent has already been revised then a 409
CONFLICT error will be returned.

### undelete

Undelete an instance. Only available if model has a (d)eleted column.

Undelete is available by doing an HTTP POST to /:id/undelete.

When doing an HTTP POST data set in the body with the model name will be merged
into the data of the undeleted object.

### update

Update an instance. Model schema will be used to validate input. If `meta`
param is set then metaData such as accountId, parentId, and createTime can be
specified.

Update is available by doing an HTTP PATCH request to /:id. Data in the request
body will be merged into existing object data.

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

### Customizing query args for read and list

    var fooController = new ImmutableCoreController({
        list: {
            query: {
                resolve: true,
            },
        },
        read: {
            query: {
                resolve: true,
            },
        },
        model: fooModel,
    })

Any arguments set in the `query` object for `list` or `view` will be used as
default arguments for the Immutable Core Model query performed by the default
controller.

## Creating a custom controller

    var fooController = new ImmutableCoreController({
        paths: {
            '/foo': {
                get: {
                    method: function (args) {
                        ...
                    },
                },
            },
        },
    })

Custom controllers are created by specifying the path, the http method, and an
object defining the controller options for that path and http method.

The supported http methods are `delete`, `get`, `patch`, `post` and `put`.

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
method     | function | primary controller function                         |
methodName | string   | ImmutableCore method name                           |
role       | string   | role that controller will be used for               |

### input

The input object specifies a map of argument names to the location of that
argument in the express http request object. Input can be pulled from any
location in the request object (e.g. params, query, body, headeres, cookies).

A single path can be specified with a string or a list of paths can be given
with an array. If multiple locations for input are specified then the first one
with a defined value will be used.

### method, before and after

Typically a controller will have at least a primary `method` and for more
complex controllers it can be beneficial to break functionality into separate
methods.

Default controllers follow the pattern of doing any server side data loading
in the `before` method, doing processing of input and loaded server data in
the primary `method` and leaving the `after` method open for customization.

### methodName

The `methodName` can be specified and if not it will be created automatically.

If the function set for `method` has a name then that name will be used.
Otherwise the path and the http method with non alpha characters removed will
be used.

### role

With the ImmutableApp framework the same route and HTTP method can be served
with different controllers based on the users role(s).

The controller will only be served to sessions with the specified role.