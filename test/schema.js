'use strict'

const ImmutableAccessControl = require('immutable-access-control')
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
    database: dbName,
    host: dbHost,
    password: dbPass,
    user: dbUser,
}

describe('immutable-core-controller - schema', function () {

    // fake session to use for testing
    var session = {
        accountId: '11111111111111111111111111111111',
        roles: ['all', 'authenticated'],
        sessionId: '22222222222222222222222222222222',
    }

    var schemaProperties = {
        foo: {
            type: 'string',
        },
    }

    // define in before
    var fooModel, globalFooModel, mysql

    before(async function () {
        // create database connection to use for testing
        mysql = await ImmutableCoreModel.createMysqlConnection(connectionParams)
    })

    after(async function () {
        await mysql.close()
    })

    beforeEach(async function () {
        try {
            // reset global data
            immutable.reset()
            ImmutableCoreModel.reset()
            ImmutableAccessControl.reset()
            // drop any test tables if they exist
            await mysql.query('DROP TABLE IF EXISTS foo')
            // create model for controller
            globalFooModel = new ImmutableCoreModel({
                columns: {
                    foo: {
                        index: true,
                        type: 'string',
                    },
                },
                mysql: mysql,
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
        var schemaMethod = fooController.paths['/schema'].get[0].method
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
        assert.deepEqual(schema.properties, schemaProperties)
    })

    it('should get model meta schema', async function () {
        // create new controller
        var fooController = new ImmutableCoreController({
            model: globalFooModel,
        })
        // get schema method
        var schemaMethod = fooController.paths['/schema'].get[0].method
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

})