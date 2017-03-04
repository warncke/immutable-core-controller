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

describe('immutable-core-controller - delete', function () {

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

    it('should delete model instance', async function () {
        // create new controller
        var fooController = new ImmutableCoreController({
            model: globalFooModel,
        })
        // get delete method
        var deleteMethod = fooController.paths['/:id'].delete[0].method
        // catch async errors
        try {
            // delete instance
            var bam = await deleteMethod({
                id: origBam.id,
                json: true,
                session: session,
            })
        }
        catch (err) {
            throw err
        }
        // instance should be deleted
        assert.isTrue(bam.isDeleted)
    })

    it('should throw 404 when trying to access deleted instance', async function () {
        // create new controller
        var fooController = new ImmutableCoreController({
            model: globalFooModel,
        })
        // get delete method
        var deleteMethod = fooController.paths['/:id'].delete[0].method
        // catch async errors
        try {
            // delete instance
            var deletedBar = await deleteMethod({
                id: origBar.id,
                json: true,
                session: session,
            })
            // attempt to delete again - should 404
            await deleteMethod({
                id: origBar.id,
                session: session,
            })
        }
        catch (err) {
            var threw = err
        }
        // 404 error should be throw
        assert.isDefined(threw)
        assert.strictEqual(threw.code, 404)
        assert.strictEqual(threw.message, 'Not Found')
        // instance should be deleted
        assert.isTrue(deletedBar.isDeleted)
    })

    it('should access deleted instance with option set and undelete', async function () {
        // create new controller
        var fooController = new ImmutableCoreController({
            model: globalFooModel,
        })
        // get delete method
        var getMethod = fooController.paths['/:id'].get[0].method
        var deleteMethod = fooController.paths['/:id'].delete[0].method
        var unDeleteMethod = fooController.paths['/:id/undelete'].post[0].method
        // catch async errors
        try {
            // delete instance
            await deleteMethod({
                id: origBar.id,
                json: true,
                session: session,
            })
            // should get deleted with flag set
            await getMethod({
                deleted: true,
                id: origBar.id,
                json: true,
                session: session,
            })
            // attempt to delete again - should not 404 - should be no-op since
            // instance already deleted
            var deletedBar = await deleteMethod({
                deleted: true,
                id: origBar.id,
                session: session,
            })
            // unDelete
            await unDeleteMethod({
                deleted: true,
                id: origBar.id,
                json: true,
                session: session,
            })
            // performaing action again should be noop and not throw error
            var unDeletedBar = await unDeleteMethod({
                deleted: true,
                id: origBar.id,
                session: session,
            })
        }
        catch (err) {
            throw err
        }
        // instance should be deleted
        assert.isTrue(deletedBar.isDeleted)
        // instance should be unDeleted
        assert.isFalse(unDeletedBar.isDeleted)
        assert.isTrue(unDeletedBar.wasDeleted)
    })

    it('should throw 409 error when attempting to delete old revision', async function () {
        // create new controller
        var fooController = new ImmutableCoreController({
            model: globalFooModel,
        })
        // get delete method
        var deleteMethod = fooController.paths['/:id'].delete[0].method
        // catch async errors
        try {
            // do update
            var updateFoo = await origFoo.update({foo: 'xxx'})
            // delete instance - should throw error
            await deleteMethod({
                id: origFoo.id,
                json: true,
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
        assert.strictEqual(threw.data.id, updateFoo.id)
    })

    it('should delete/undelete old instance when force set', async function () {
        // create new controller
        var fooController = new ImmutableCoreController({
            model: globalFooModel,
        })
        // get delete method
        var deleteMethod = fooController.paths['/:id'].delete[0].method
        var unDeleteMethod = fooController.paths['/:id/undelete'].post[0].method
        // catch async errors
        try {
            // do update
            var updateFoo = await origFoo.update({foo: 'xxx'})
            // delete old instace
            var deletedFoo = await deleteMethod({
                force: true,
                id: origBar.id,
                json: true,
                session: session,
            })
            // undelete old instace
            var unDeletedFoo = await unDeleteMethod({
                deleted: true,
                force: true,
                id: origBar.id,
                json: true,
                session: session,
            })
        }
        catch (err) {
            throw err
        }
        // instance should be deleted
        assert.isTrue(deletedFoo.isDeleted)
        // instance should be unDeleted
        assert.isFalse(unDeletedFoo.isDeleted)
        assert.isTrue(unDeletedFoo.wasDeleted)
    })

    it('should delete/undelete old instance when current is set', async function () {
        // create new controller
        var fooController = new ImmutableCoreController({
            model: globalFooModel,
        })
        // get delete method
        var deleteMethod = fooController.paths['/:id'].delete[0].method
        var unDeleteMethod = fooController.paths['/:id/undelete'].post[0].method
        // catch async errors
        try {
            // do update
            var updateFoo = await origFoo.update({foo: 'xxx'})
            // delete old instace
            var deletedFoo = await deleteMethod({
                current: true,
                id: origBar.id,
                json: true,
                session: session,
            })
            // undelete old instace
            var unDeletedFoo = await unDeleteMethod({
                deleted: true,
                current: true,
                id: origBar.id,
                json: true,
                session: session,
            })
        }
        catch (err) {
            throw err
        }
        // instance should be deleted
        assert.isTrue(deletedFoo.isDeleted)
        // instance should be unDeleted
        assert.isFalse(unDeletedFoo.isDeleted)
        assert.isTrue(unDeletedFoo.wasDeleted)
    })

    it('should throw 404 error on delete if id not found', async function () {
        // create new controller
        var fooController = new ImmutableCoreController({
            model: globalFooModel,
        })
        // get delete method
        var deleteMethod = fooController.paths['/:id'].delete[0].method
        // catch async errors
        try {
            // delete non-existent instance
            await deleteMethod({
                force: true,
                id: 'xxx',
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

    it('should throw 404 error on undelete if id not found', async function () {
        // create new controller
        var fooController = new ImmutableCoreController({
            model: globalFooModel,
        })
        // get undelete method
        var unDeleteMethod = fooController.paths['/:id/undelete'].post[0].method
        // catch async errors
        try {
            // undelete non-existent instance
            await unDeleteMethod({
                force: true,
                id: 'xxx',
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