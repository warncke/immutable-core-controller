'use strict'

const ImmutableDatabaseMariaSQL = require('immutable-database-mariasql')
const ImmutableCoreController = require('../lib/immutable-core-controller')
const ImmutableCoreModel = require('immutable-core-model')
const Promise = require('bluebird')
const _ = require('lodash')
const chai = require('chai')
const immutable = require('immutable-core')

const assert = chai.assert

const dbHost = process.env.DB_HOST || 'localhost'
const dbName = process.env.DB_NAME || 'test'
const dbPass = process.env.DB_PASS || ''
const dbUser = process.env.DB_USER || 'root'

// use the same params for all connections
const connectionParams = {
    charset: 'utf8',
    db: dbName,
    host: dbHost,
    password: dbPass,
    user: dbUser,
}

describe('immutable-core-controller - schema', function () {

    // create database connection to use for testing
    var database = new ImmutableDatabaseMariaSQL(connectionParams)

    // fake session to use for testing
    var session = {
        accountId: '11111111111111111111111111111111',
        sessionId: '22222222222222222222222222222222',
    }

    var schemaProperties = {
        foo: {
            type: 'array',
        },
    }

    // define in before
    var fooModel, globalFooModel

    beforeEach(async function () {
        try {
            // reset global data
            immutable.reset()
            ImmutableCoreModel.reset()
            // drop any test tables if they exist
            await database.query('DROP TABLE IF EXISTS foo')
            // create model for controller
            globalFooModel = new ImmutableCoreModel({
                actions: {
                    delete: true,
                },
                columns: {
                    foo: {
                        index: true,
                        type: 'string',
                    },
                },
                database: database,
                name: 'foo',
                properties: schemaProperties,
            })
            // sync with database
            await globalFooModel.sync()
            // create local foo model with session
            fooModel = globalFooModel.session(session)
        }
        catch (err) {
            throw err
        }
    })

    it('should get model schema', async function () {
        // create new controller
        var fooController = new ImmutableCoreController({
            model: globalFooModel,
        })
        // get schema method
        var schemaMethod = fooController.paths['/schema'].get.method
        // catch async errors
        try {
            var schema = await schemaMethod({
                session: session,
            })
        }
        catch (err) {
            throw err
        }
        // non-meta schema should include only the data properties schema
        assert.deepEqual(schema, schemaProperties)
    })

    it('should get model meta schema', async function () {
        // create new controller
        var fooController = new ImmutableCoreController({
            model: globalFooModel,
        })
        // get schema method
        var schemaMethod = fooController.paths['/schema'].get.method
        // catch async errors
        try {
            var schema = await schemaMethod({
                meta: true,
                session: session,
            })
        }
        catch (err) {
            throw err
        }
        // validate schema
        assert.deepEqual(schema, globalFooModel.schemaMeta)
    })

    it('should get action schema', async function () {
        // create new controller
        var fooController = new ImmutableCoreController({
            model: globalFooModel,
        })
        // get schema method
        var schemaMethod = fooController.paths['/schema'].get.method
        // catch async errors
        try {
            var schema = await schemaMethod({
                action: 'delete',
                session: session,
            })
        }
        catch (err) {
            throw err
        }
        // if model does not have a data column then full meta schema
        // is always returned
        assert.deepEqual(schema, globalFooModel.actionModels.delete.schemaMeta)
    })

    it('should throw 400 error on invalid action', async function () {
        // create new controller
        var fooController = new ImmutableCoreController({
            model: globalFooModel,
        })
        // get schema method
        var schemaMethod = fooController.paths['/schema'].get.method
        // catch async errors
        try {
            var schema = await schemaMethod({
                action: 'xxx',
                session: session,
            })
        }
        catch (err) {
            var threw = err
        }
        // 400 error should be throw
        assert.isDefined(threw)
        assert.strictEqual(threw.code, 400)
        assert.strictEqual(threw.message, 'Invalid action xxx')
    })

})