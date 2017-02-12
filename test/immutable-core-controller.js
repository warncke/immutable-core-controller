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

describe('immutable-core-controller', function () {

    // create database connection to use for testing
    var database = new ImmutableDatabaseMariaSQL(connectionParams)

    // fake session to use for testing
    var session = {
        accountId: '11111111111111111111111111111111',
        sessionId: '22222222222222222222222222222222',
    }

    beforeEach(async function () {
        try {
            // reset global data
            immutable.reset()
            ImmutableCoreModel.reset()
            // drop any test tables if they exist
            await database.query('DROP TABLE IF EXISTS foo')
        }
        catch (err) {
            throw err
        }
    })

    it('should create new controller instance', function () {
        // create new controller
        var fooController = new ImmutableCoreController({
            name: 'foo',
        })
        // should return new instance
        assert.isTrue(fooController instanceof ImmutableCoreController)
    })


    it('should create new controller instance from model', function () {
        // create model for controller
        var fooModel = new ImmutableCoreModel({
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
        // create new controller
        var fooController = new ImmutableCoreController({
            model: fooModel,
        })
        // should return new instance
        assert.isTrue(fooController instanceof ImmutableCoreController)
        // get immutable module for controller
        var module = immutable.module('fooController')
        // get module meta data
        var meta = module.meta()
        // check that meta properties stored
        assert.strictEqual(meta.class, 'ImmutableCoreController')
        assert.deepEqual(meta.instance, fooController)

        var methodNames = [
            'index',
            'indexBefore',
            'create',
            'read',
            'update',
            'updateBefore',
            'delete',
            'deleteBefore',
            'unDelete',
            'unDeleteBefore',
            'schema',
            'validate',
            'validateBefore',
            'autocomplete'
        ]

        _.each(methodNames, methodName => {
            assert.isFunction(module[methodName])
        })
    })

    it('should create new controller method with path', function () {
        // create new controller
        var fooController = new ImmutableCoreController({
            name: 'foo',
            paths: {
                '/': {
                    get: {
                        after: function (args) {
                            return {
                                bar: 'bar',
                            }
                        },
                        before: function (args) {
                            return {
                                bam: 'bam',
                            }
                        },
                        input: {
                            foo: 'query.foo',
                            bar: 'cookies.bar',
                        },
                        method: function (args) {
                            return args
                        },
                        methodName: 'index',
                    },
                },
            },
        })
        // should return new instance
        assert.isTrue(fooController instanceof ImmutableCoreController)
        // get immutable module for controller
        var module = immutable.module('fooController')
        // check module functions
        assert.isFunction(module.index)
        assert.isFunction(module.indexAfter)
        assert.isFunction(module.indexBefore)
    })
})