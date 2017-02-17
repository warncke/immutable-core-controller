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

describe('immutable-core-controller - update', function () {

    // create database connection to use for testing
    var database = new ImmutableDatabaseMariaSQL(connectionParams)

    // fake session to use for testing
    var session = {
        accountId: '11111111111111111111111111111111',
        sessionId: '22222222222222222222222222222222',
    }

    // define in before
    var fooModel, globalFooModel, origBam, origBar, origFoo

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
            })
            // sync with database
            await globalFooModel.sync()
            // create local foo model with session
            fooModel = globalFooModel.session(session)
            // create instances
            origBam = await fooModel.create({foo: 'bam'})
            origBar = await fooModel.create({foo: 'bar'})
            origFoo = await fooModel.create({foo: 'foo'})

        }
        catch (err) {
            throw err
        }
    })

    it('should update model instance', async function () {
        // create new controller
        var fooController = new ImmutableCoreController({
            model: globalFooModel,
        })
        // get update method
        var update = fooController.paths['/:id'].put.method
        // catch async errors
        try {
            // update instance
            var bam = await update({
                foo: {
                    foo: 'xxx'
                },
                id: origBam.id,
                session: session,
            })
        }
        catch (err) {
            throw err
        }
        // check that data matches
        assert.deepEqual(bam.toJSON().data, {foo: 'xxx'})
        // check that ids correct
        assert.notEqual(bam.toJSON().id, origBam.id)
        assert.strictEqual(bam.toJSON().originalId, origBam.id)
        assert.strictEqual(bam.toJSON().parentId, origBam.id)
    })

    it('should update model instance with meta', async function () {
        // create new controller
        var fooController = new ImmutableCoreController({
            model: globalFooModel,
        })
        // get update method
        var update = fooController.paths['/:id'].put.method
        // catch async errors
        try {
            // update instance
            var bam = await update({
                foo: {
                    data: {
                        foo: 'xxx'
                    }
                },
                id: origBam.id,
                meta: true,
                session: session,
            })
        }
        catch (err) {
            throw err
        }
        // check that data matches
        assert.deepEqual(bam.toJSON().data, {foo: 'xxx'})
        // check that ids correct
        assert.notEqual(bam.toJSON().id, origBam.id)
        assert.strictEqual(bam.toJSON().originalId, origBam.id)
        assert.strictEqual(bam.toJSON().parentId, origBam.id)
    })

    it('should update old instance with force', async function () {
        // create new controller
        var fooController = new ImmutableCoreController({
            model: globalFooModel,
        })
        // get update method
        var update = fooController.paths['/:id'].put.method
        // catch async errors
        try {
            // do update
            var updateBam = await origBam.update({bar: 'xxx'})
            // update instance
            var bam = await update({
                foo: {
                    foo: 'xxx'
                },
                force: true,
                id: origBam.id,
                session: session,
            })
        }
        catch (err) {
            throw err
        }
        // data from updates should be merged
        assert.deepEqual(bam.toJSON().data, {bar: 'xxx', foo: 'xxx'})
        // check that ids correct
        assert.notEqual(bam.toJSON().id, origBam.id)
        assert.strictEqual(bam.toJSON().originalId, origBam.id)
        assert.strictEqual(bam.toJSON().parentId, updateBam.id)
    })

    it('should throw 409 error when attempting to update old revision', async function () {
        // create new controller
        var fooController = new ImmutableCoreController({
            model: globalFooModel,
        })
        // get update method
        var update = fooController.paths['/:id'].put.method
        // catch async errors
        try {
            // do update
            var updateBam = await origBam.update({foo: 'xxx'})
            // update instance - should fail
            var bam = await update({
                foo: {
                    foo: 'yyy'
                },
                id: origBam.id,
                session: session,
            })
        }
        catch (err) {
            var threw = err
        }
        // check error
        assert.isDefined(threw)
        assert.strictEqual(threw.code, 409)
        assert.strictEqual(threw.message, 'Conflict')
        assert.isObject(threw.data)
        assert.deepEqual(threw.data.data, {foo: 'xxx'})
        assert.strictEqual(threw.data.id, updateBam.id)
    })

    it('should throw 404 error if id not found', async function () {
        // create new controller
        var fooController = new ImmutableCoreController({
            model: globalFooModel,
        })
        // get update method
        var update = fooController.paths['/:id'].put.method
        // catch async errors
        try {
            // update non-existent instance
            var bam = await update({
                foo: {
                    foo: 'xxx'
                },
                id: 'XXX',
                session: session,
            })
        }
        catch (err) {
            var threw = err
        }
        // check error
        assert.isDefined(threw)
        assert.strictEqual(threw.code, 404)
        assert.strictEqual(threw.message, 'Not Found')
    })

})