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
const dbPass = process.env.DB_PASS || 'test'
const dbUser = process.env.DB_USER || 'test'

// use the same params for all connections
const connectionParams = {
    database: dbName,
    host: dbHost,
    password: dbPass,
    user: dbUser,
}

describe('immutable-core-controller - validate', function () {

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
        await mysql.end()
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

    it('should validate instance data', async function () {
        // create new controller
        var fooController = new ImmutableCoreController({
            model: globalFooModel,
        })
        // get validate method
        var validateMethod = fooController.paths['/validate'].post[0].method
        // catch async errors
        try {
            var res = await validateMethod({
                foo: {
                    foo: 'test'
                },
                session: session,
            })
        }
        catch (err) {
            throw err
        }
        // check response
        assert.deepEqual(res, {valid: true})
    })

    it('should validate meta data', async function () {
        // create new controller
        var fooController = new ImmutableCoreController({
            model: globalFooModel,
        })
        // get validate method
        var validateMethod = fooController.paths['/validate'].post[0].method
        // catch async errors
        try {
            // create foo instance
            var foo = await fooModel.create({foo: 'foo'})
            // call validate good data
            var res = await validateMethod({
                foo: foo.toJSON(),
                meta: true,
                session: session,
            })
        }
        catch (err) {
            throw err
        }
        // check response
        assert.deepEqual(res, {valid: true})
    })

    it('should throw error on invalid data', async function () {
        // create new controller
        var fooController = new ImmutableCoreController({
            model: globalFooModel,
        })
        // get validate method
        var validateMethod = fooController.paths['/validate'].post[0].method
        // catch async errors
        try {
            var res = await validateMethod({
                foo: {
                    foo: [0, 1, 2]
                },
                session: session,
            })
        }
        catch (err) {
            var threw =  err
        }
        // 400 error should be throw
        assert.isDefined(threw)
        assert.strictEqual(threw.code, 400)
        assert.strictEqual(threw.data[0].message, 'must be string')
    })

    it('should throw error on invalid meta data', async function () {
        // create new controller
        var fooController = new ImmutableCoreController({
            model: globalFooModel,
        })
        // get validate method
        var validateMethod = fooController.paths['/validate'].post[0].method
        // catch async errors
        try {
            var res = await validateMethod({
                foo: {},
                meta: true,
                session: session,
            })
        }
        catch (err) {
            var threw =  err
        }
        // 400 error should be throw
        assert.isDefined(threw)
        assert.strictEqual(threw.code, 400)
        assert.strictEqual(threw.data.length, 5)
    })

})