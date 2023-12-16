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

describe('immutable-core-controller - list', function () {

    // fake session to use for testing
    var session = {
        accountId: '11111111111111111111111111111111',
        roles: ['all', 'authenticated'],
        sessionId: '22222222222222222222222222222222',
    }

    // define in before
    var fooModel, globalFooModel, mysql, origBam, origBar, origFoo

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
                accessControlRules: [
                    'list:deleted:any:1',
                    'read:deleted:any:1',
                    'unDelete:deleted:any:1',
                ],
                columns: {
                    foo: {
                        index: true,
                        type: 'string',
                    },
                },
                mysql: mysql,
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
                where: JSON.stringify({
                    foo: {eq: 'foo'}
                }),
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
        assert.strictEqual(res.result.length, 3)
        assert.deepEqual(res.records[0].data, origBam.data)
        assert.deepEqual(res.records[1].data, origFoo.data)
        assert.deepEqual(res.records[2].data, origBar.data)
    })

})