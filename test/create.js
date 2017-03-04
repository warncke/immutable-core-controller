'use strict'

const ImmutableCoreController = require('../lib/immutable-core-controller')
const ImmutableCoreModel = require('immutable-core-model')
const ImmutableDatabaseMariaSQL = require('immutable-database-mariasql')
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

describe('immutable-core-controller - create', function () {

    // create database connection to use for testing
    var database = new ImmutableDatabaseMariaSQL(connectionParams)

    // fake session to use for testing
    var session = {
        accountId: '11111111111111111111111111111111',
        sessionId: '22222222222222222222222222222222',
    }

    // define in before
    var globalFooModel
    var fooModel

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
                properties: {
                    foo: {
                        type: 'string',
                    },
                },
                required: ['foo']
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

    it('should create new model instance', async function () {
        // create new controller
        var fooController = new ImmutableCoreController({
            model: globalFooModel,
        })
        // get create method
        var create = fooController.paths['/'].post[0].method
        // catch async errors
        try {
            // create new instance
            var origFoo = await create({
                foo: {
                    foo: 'bar',
                },
                json: true,
                session: session,
            })
            // get JSON which is what will be returned by API
            var res = origFoo.toJSON()
            // check that object created
            var foo = await fooModel.select.by.id(res.id)
            // check that data matches
            assert.deepEqual(foo.data, {foo: 'bar'})
        }
        catch (err) {
            throw err
        }
    })

    it('should redirect after create', async function () {
        // create new controller
        var fooController = new ImmutableCoreController({
            model: globalFooModel,
        })
        // get create method
        var create = fooController.paths['/'].post[0].method
        // catch async errors
        try {
            // create new instance
            var origFoo = await create({
                foo: {
                    foo: 'bar',
                },
                session: session,
            })
            // get JSON which is what will be returned by API
            var res = origFoo.toJSON()
            // check that object created
            var foo = await fooModel.select.by.id(res.id)
            // check that data matches
            assert.deepEqual(foo.data, {foo: 'bar'})
        }
        catch (err) {
            var threw = err
        }
        // check response
        assert.strictEqual(threw.code, 302)
    })

    it('should create new model instance with meta data', async function () {
        // create new controller
        var fooController = new ImmutableCoreController({
            model: globalFooModel,
        })
        // get create method
        var create = fooController.paths['/'].post[0].method
        // catch async errors
        try {
            // create new instance
            var origFoo = await create({
                foo: {
                    data: {
                        foo: 'bar',
                    },
                    parentId: '11111111111111111111111111111111',
                    sessionId: '11111111111111111111111111111111',
                },
                json: true,
                meta: true,
                session: session,
            })
            // get JSON which is what will be returned by API
            var res = origFoo.toJSON()
            // check that object created
            var foo = await fooModel.select.by.id(res.id)
            // check that data matches
            assert.deepEqual(foo.data, {foo: 'bar'})
            // check that meta data set
            assert.strictEqual(foo.parentId, '11111111111111111111111111111111')
            // sessionId should not be set
            assert.strictEqual(foo.sessionId, session.sessionId)
        }
        catch (err) {
            throw err
        }
    })

    it('should return form with validation errors', async function () {
        // create new controller
        var fooController = new ImmutableCoreController({
            model: globalFooModel,
        })
        // get create method
        var create = fooController.paths['/'].post[0].method
        // catch async errors
        try {
            // create new instance with invalid data
            var res = await create({
                foo: {},
                session: session,
            })
        }
        catch (err) {
            throw err
        }
        // check response
        assert.isObject(res.form)
        // check that field has error
        assert.strictEqual(res.form.fields[0].error, 'foo required')
    })

    it('should return form with validation errors', async function () {
        // create new controller
        var fooController = new ImmutableCoreController({
            model: globalFooModel,
        })
        // get create method
        var create = fooController.paths['/'].post[0].method
        // catch async errors
        try {
            // create new instance with invalid data
            var res = await create({
                foo: {},
                json: true,
                session: session,
            })
        }
        catch (err) {
            var threw = err
        }
        // check response
        assert.strictEqual(threw.code, 400)
    })

})