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

## Default methods

Method Name  | Method | Path                         |
-------------|--------|------------------------------|
index        | GET    | /                            |
create       | POST   | /                            |
read         | GET    | /:id                         |
update       | PUT    | /:id                         |
delete       | DELETE | /:id                         |
delete       | GET    | /:id/delete                  |
undelete     | POST   | /:id/undelete                |
undelete     | GET    | /:id/undelete                |
schema       | GET    | /schema                      |
validate     | POST   | /validate                    |

### index

The index method returns a list of model instances. This list is paginated and
can be sorted and filtered by columns on the model.

Parameters are mapped to Immutable Core Model query args. For more complex queries
JSON encoded query params can be set as the `query` param.

Free form queries can be executed using the `search` param.

### create

Create a new model instance. Model schema will be used to validate input.

### read

Get a model instance by id. `current` param can be set to get the current revision
of the instance and the `deleted` param can be set to return the object even it
it is deleted.

### update

Update an instance. Model schema will be used to validate input. If `meta`
param is set then metaData such as accountId, parentId, and createTime can be
specified.

If a parentId is specified and the parent has already been revised then a 409
CONFLICT error will be returned.

### delete

Delete an instance. Only available if model has a (d)eleted column.

Delete is available as either an HTTP POST on the /:id path or an HTTP GET on
the /:id/delete path.

When doing an HTTP DELETE data set in the body with the model name will be merged
into the data of the undeleted object.

### undelete

Undelete an instance. Only available if model has a (d)eleted column.

Undelete is available by doing either an HTTP POST or HTTP GET to
/:id/undelete.

When doing an HTTP POST data set in the body with the model name will be merged
into the data of the undeleted object.

### schema

Returns the JSON schema for the create method which is the same as the JSON
schema for the model by default.

### validate

Validates the data provided without saving it

## Creating a custom controller

    var fooController = new ImmutableCoreController({
        paths: {
            '/foo': {

            },
        },
    })