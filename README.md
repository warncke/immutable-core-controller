# immutable-core-controller

Immutable Core Controller provides a class for defining controllers built
on Immutable Core and tied into the Immutable App and Immutable Core Model
infrastructure.

The ImmutableCoreController class starts from a foundation of default behavior
that allows controllers with standard CRUD functionality to be instatiated for models without any additional configuration in most cases.

More complex controllers can be created by modifying and extending default
controller functionality.

Controllers return data as an object and it is up to the application
infrastructure to determine how that data is presented.

Controller methods, like all immutable-core methods, take a single object as an
argument.

Controllers include a JSON schema specification of the requirements for each
method as well as a mapping of how properties should be extracted from the request
body, params, query, cookies, and headers.

Controllers inherit JSON schema specifications from the model(s) that they provide
interfaces for as well as having their own requirements.

## Execution order

1. Map express request to arguments
2. Validate arguments
3. Execute data load method if defined
4. Execute controller method

## Creating a controller

    const ImmutableCoreController = require('immutable-core-controller')
    const ImmutableCoreModel = require('immutable-core-model')

    var fooModel = new ImmutableCoreModel({
        actions: {
            delete: true,
            favorite: false,
        },
        columns: {
            foo: {
                index: true,
                type: string,
            },
        },
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
unDelete     | POST   | /:id/undelete                |
favorite     | POST   | /:id/favorite                |
schema       | GET    | /schema                      |
validate     | POST   | /validate                    |
autocomplete | GET    | /autocomplete/:property      |

### index

The index method returns a list of model instances. This list is paginated and
can be sorted and filtered by columns on the model.

Parameters are mapped to immutable-core-model query args. For more complex queries
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

Delete an instance. Only available if action is enabled.

### unDelete

UnDelete an instance. Only available if action is enabled.

### favorite

Another custom action performed on instance.

### schema

Returns the JSON schema for the create method which is the same as the JSON
schema for the model by default.

### validate

Validates the data provided without saving it

### autocomplete

Takes a partial column value and returns a list of suggestions for it.
Autocomplete routes are automatically created for all indexed columns.
