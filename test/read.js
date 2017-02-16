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

describe('immutable-core-controller - read', function () {

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

    it('should read model instance', async function () {
        // create new controller
        var fooController = new ImmutableCoreController({
            model: globalFooModel,
        })
        // get read method
        var read = fooController.paths['/:id'].get.method
        // catch async errors
        try {
            // get instance
            var bam = await read({
                id: origBam.id,
                session: session,
            })
        }
        catch (err) {
            throw err
        }
        // check that data matches
        assert.deepEqual(bam.toJSON(), origBam.toJSON())
    })

    it('should throw 404 error if id not found', async function () {
        // create new controller
        var fooController = new ImmutableCoreController({
            model: globalFooModel,
        })
        // get read method
        var read = fooController.paths['/:id'].get.method
        // catch async errors
        try {
            // get instance
            var bam = await read({
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