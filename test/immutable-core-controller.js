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

describe('immutable-core-controller', function () {

    // fake session to use for testing
    var session = {
        accountId: '11111111111111111111111111111111',
        roles: ['all', 'authenticated'],
        sessionId: '22222222222222222222222222222222',
    }

    var mysql

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
            columns: {
                foo: {
                    index: true,
                    type: 'string',
                },
            },
            mysql: mysql,
            name: 'foo',
            properties: {
                foo: {
                    type: 'string',
                },
            },
        })
        // create new controller
        var fooController = new ImmutableCoreController({
            model: fooModel,
        })
        // should return new instance
        assert.isTrue(fooController instanceof ImmutableCoreController)
        // get immutable module for controller
        var module = immutable.module('fooController')
        // check that meta properties stored
        assert.strictEqual(module.meta.class, 'ImmutableCoreController')
        assert.deepEqual(module.meta.instance, fooController)

        var methodNames = [
            'create',
            'delete',
            'deleteBefore',
            'list',
            'listBefore',
            'read',
            'update',
            'updateBefore',
            'undelete',
            'undeleteBefore',
            'schema',
            'validate',
            'validateBefore',
            //'autocomplete',
        ]

        _.each(methodNames, methodName => {
            assert.isFunction(module[methodName], methodName+' not a function')
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