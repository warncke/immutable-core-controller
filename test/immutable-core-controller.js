'use strict'

const ImmutableCoreController = require('../lib/immutable-core-controller')
const ImmutableCoreModel = require('immutable-core-model')
const Promise = require('bluebird')
const _ = require('lodash')
const chai = require('chai')
const immutable = require('immutable-core')

const assert = chai.assert

describe('immutable-core-controller', function () {

    beforeEach(function () {
        // reset global data
        immutable.reset()
    })

    it('should create new controller instance', function () {
        // create new controller
        var fooController = new ImmutableCoreController()
        // should return new instance
        assert.isTrue(fooController instanceof ImmutableCoreController)
    })

})