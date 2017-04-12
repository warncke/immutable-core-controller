'use strict'

const ImmutableAccessControl = require('immutable-access-control')
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

describe('immutable-core-controller - list', function () {

    // create database connection to use for testing
    var database = new ImmutableDatabaseMariaSQL(connectionParams)

    // fake session to use for testing
    var session = {
        accountId: '11111111111111111111111111111111',
        roles: ['all', 'authenticated'],
        sessionId: '22222222222222222222222222222222',
    }

    // define in before
    var fooModel, globalFooModel, origBam, origBar, origFoo

    beforeEach(async function () {
        try {
            // reset global data
            immutable.reset()
            ImmutableCoreModel.reset()
            ImmutableAccessControl.reset()
            // drop any test tables if they exist
            await database.query('DROP TABLE IF EXISTS foo')
            // create model for controller
            globalFooModel = new ImmutableCoreModel({
                accessControlRules: [
                    'list:deleted:any:1',
                    'read:deleted:any:1',
                    'unDelete:deleted:any:1',
                ],
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

    it('should get list of records', async function () {
        // create new controller
        var fooController = new ImmutableCoreController({
            model: globalFooModel,
        })
        // get index method
        var indexMethod = fooController.paths['/'].get[0].method
        // catch async errors
        try {
            // get index of model instances
            var res = await indexMethod({
                session: session,
            })
        }
        catch (err) {
            throw err
        }
        // verify results
        assert.isObject(res)
        assert.isArray(res.records)
        assert.strictEqual(res.result.length, 3)
    })

    it('should get list of records with limit and order', async function () {
        // create new controller
        var fooController = new ImmutableCoreController({
            model: globalFooModel,
        })
        // get index method
        var indexMethod = fooController.paths['/'].get[0].method
        // catch async errors
        try {
            // get index of model instances
            var res = await indexMethod({
                limit: 2,
                orderColumn: 'createTime',
                session: session,
            })
        }
        catch (err) {
            throw err
        }
        // verify results
        assert.isObject(res)
        assert.isArray(res.records)
        assert.strictEqual(res.records.length, 2)
        assert.strictEqual(res.result.length, 3)
        assert.deepEqual(res.records[0].data, origBam.data)
        assert.deepEqual(res.records[1].data, origBar.data)
    })

    it('should get list of records with limit and order desc', async function () {
        // create new controller
        var fooController = new ImmutableCoreController({
            model: globalFooModel,
        })
        // get index method
        var indexMethod = fooController.paths['/'].get[0].method
        // catch async errors
        try {
            // get index of model instances
            var res = await indexMethod({
                limit: 2,
                orderColumn: 'createTime',
                orderDirection: 'DESC',
                session: session,
            })
        }
        catch (err) {
            throw err
        }
        // verify results
        assert.isObject(res)
        assert.isArray(res.records)
        assert.strictEqual(res.records.length, 2)
        assert.strictEqual(res.result.length, 3)
        assert.deepEqual(res.records[0].data, origFoo.data)
        assert.deepEqual(res.records[1].data, origBar.data)
    })

    it('should get list of records with limit and offset', async function () {
        // create new controller
        var fooController = new ImmutableCoreController({
            model: globalFooModel,
        })
        // get index method
        var indexMethod = fooController.paths['/'].get[0].method
        // catch async errors
        try {
            // get index of model instances
            var res = await indexMethod({
                limit: 2,
                offset: 2,
                order: 'createTime',
                session: session,
            })
        }
        catch (err) {
            throw err
        }
        // verify results
        assert.isObject(res)
        assert.isArray(res.records)
        assert.strictEqual(res.records.length, 1)
        assert.strictEqual(res.result.length, 3)
        assert.deepEqual(res.records[0].data, origFoo.data)
    })

    it('should get list of records with where', async function () {
        // create new controller
        var fooController = new ImmutableCoreController({
            model: globalFooModel,
        })
        // get index method
        var indexMethod = fooController.paths['/'].get[0].method
        // catch async errors
        try {
            // get index of model instances
            var res = await indexMethod({
                limit: 2,
                order: 'createTime',
                session: session,
                where: {
                    foo: {eq: 'foo'}
                },
            })
        }
        catch (err) {
            throw err
        }
        // verify results
        assert.isObject(res)
        assert.isArray(res.records)
        assert.strictEqual(res.result.length, 1)
        assert.deepEqual(res.records[0].data, origFoo.data)
    })

    it('should get list of records with query column', async function () {
        // create new controller
        var fooController = new ImmutableCoreController({
            model: globalFooModel,
        })
        // get index method
        var indexMethod = fooController.paths['/'].get[0].method
        // catch async errors
        try {
            // get index of model instances
            var res = await indexMethod({
                foo: 'b%',
                limit: 2,
                order: 'createTime',
                session: session,
            })
        }
        catch (err) {
            throw err
        }
        // verify results
        assert.isObject(res)
        assert.isArray(res.records)
        assert.strictEqual(res.result.length, 2)
        assert.deepEqual(res.records[0].data, origBam.data)
        assert.deepEqual(res.records[1].data, origBar.data)
    })

    it('should not include deleted records', async function () {
        // create new controller
        var fooController = new ImmutableCoreController({
            model: globalFooModel,
        })
        // get index method
        var indexMethod = fooController.paths['/'].get[0].method
        // catch async errors
        try {
            // delete record
            await origBar.delete()
            // get index of model instances
            var res = await indexMethod({
                order: 'createTime',
                session: session,
            })
        }
        catch (err) {
            throw err
        }
        // verify results
        assert.isObject(res)
        assert.isArray(res.records)
        assert.strictEqual(res.result.length, 2)
        assert.deepEqual(res.records[0].data, origBam.data)
        assert.deepEqual(res.records[1].data, origFoo.data)
    })

    it('should include deleted records if flag set', async function () {
        // create new controller
        var fooController = new ImmutableCoreController({
            model: globalFooModel,
        })
        // get index method
        var indexMethod = fooController.paths['/'].get[0].method
        // catch async errors
        try {
            // delete record
            await origBar.delete()
            // get index of model instances
            var res = await indexMethod({
                deleted: true,
                order: 'createTime',
                session: session,
            })
        }
        catch (err) {
            throw err
        }
        // verify results
        assert.isObject(res)
        assert.isArray(res.records)
        assert.strictEqual(res.result.length, 3)
        assert.deepEqual(res.records[0].data, origBam.data)
        assert.deepEqual(res.records[1].data, origBar.data)
        assert.deepEqual(res.records[2].data, origFoo.data)
    })

    it.skip('should select by originalId', async function () {
        // create new controller
        var fooController = new ImmutableCoreController({
            model: globalFooModel,
        })
        // get index method
        var indexMethod = fooController.paths['/'].get[0].method
        // catch async errors
        try {
            // create revision of bam
            var updatedBam = await origBam.update({bar: 'bam'})
            // get index of model instances
            var res = await indexMethod({
                order: 'createTime',
                originalId: updatedBam.originalId,
                session: session,
            })
        }
        catch (err) {
            throw err
        }
        // verify results
        assert.isObject(res)
        assert.isArray(res.records)
        assert.strictEqual(res.result.length, 2)
        assert.deepEqual(res.records[0].data, origBam.data)
        assert.deepEqual(res.records[1].data, updatedBam.data)
    })

})