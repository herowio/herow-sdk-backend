'use strict'

const { test } = require('tap')
const build = require('./app')
const app = build()

const RedisMock = require('ioredis-mock');
app.decorate('redis', new RedisMock({
    data: {
        d52066c26e3803659e5d1a4b75cdbaab2b26474f371eb17c7e582be67fdca0df: 'client', // sha256(keys) - client
        'token:test': 'client',
        'token:default': 'unset',
        'last-modified-cache:client': 1000, // timestamp in milliseconds
        'campaigns:client': '[ { "id": "1"} ]',
        'zones:client:u7ge': '[ { "hash": "1"} ]',
        'pois:u7ge': '[ { "id": "1" } ]'
    }
}) )
app.decorate('kafka', { send: (log) => new Promise((resolve, revoke) => resolve() ) })

test('should accept authentication', async t => {

    const response = await app.inject({
        method: 'POST',
        url: '/auth/authorize/token',
        payload: {grantType: 'password', username: 'test', password: 'test', clientId: 'test', clientSecret: 'test'},
        headers: {'x-version': '7.0.0', 'x-sdk': 'test'}
    })

    t.equal(response.statusCode, 200,  'with a status code 200')
})

test('should refuse authentication when clientSecret is test2', async t => {

    const response = await app.inject({
        method: 'POST',
        url: '/auth/authorize/token',
        payload: {grantType: 'password', username: 'test', password: 'test', clientId: 'test', clientSecret: 'test2'},
        headers: {'x-version': '7.0.0', 'x-sdk': 'test'}
    })

    t.equal(response.statusCode, 400, 'with a status code 400')
})

test('should refuse authentication when grantType is missing', async t => {

    const response = await app.inject({
        method: 'POST',
        url: '/auth/authorize/token',
        payload: {username: 'test', password: 'test', clientId: 'test', clientSecret: 'test'},
        headers: {'x-version': '7.0.0', 'x-sdk': 'test'}
    })

    t.equal(response.statusCode, 400, 'with a status code 400')
})

test('should refuse authentication when username is missing', async t => {

    const response = await app.inject({
        method: 'POST',
        url: '/auth/authorize/token',
        payload: {grantType: 'password', password: 'test', clientId: 'test', clientSecret: 'test'},
        headers: {'x-version': '7.0.0', 'x-sdk': 'test'}
    })

    t.equal(response.statusCode, 400, 'with a status code 400')
})

test('should refuse authentication when password is missing', async t => {

    const response = await app.inject({
        method: 'POST',
        url: '/auth/authorize/token',
        payload: {grantType: 'password', username: 'test', clientId: 'test', clientSecret: 'test'},
        headers: {'x-version': '7.0.0', 'x-sdk': 'test'}
    })

    t.equal(response.statusCode, 400, 'with a status code 400')
})

test('should refuse authentication when clientId is missing', async t => {

    const response = await app.inject({
        method: 'POST',
        url: '/auth/authorize/token',
        payload: {grantType: 'password', username: 'test', password: 'test', clientSecret: 'test'},
        headers: {'x-version': '7.0.0', 'x-sdk': 'test'}
    })

    t.equal(response.statusCode, 400, 'with a status code 400')
})

test('should refuse authentication when clientSecret is missing', async t => {

    const response = await app.inject({
        method: 'POST',
        url: '/auth/authorize/token',
        payload: {grantType: 'password', username: 'test', password: 'test', clientId: 'test'},
        headers: {'x-version': '7.0.0', 'x-sdk': 'test'}
    })

    t.equal(response.statusCode, 400, 'with a status code 400')
})

test('should refuse authentication when x-version is missing', async t => {

    const response = await app.inject({
        method: 'POST',
        url: '/auth/authorize/token',
        payload: {grantType: 'password', username: 'test', password: 'test', clientId: 'test', clientSecret: 'test'},
        headers: {'x-sdk': 'test'}
    })

    t.equal(response.statusCode, 400, 'with a status code 400')
})

test('should refuse authentication when x-sdk is missing', async t => {

    const response = await app.inject({
        method: 'POST',
        url: '/auth/authorize/token',
        payload: {grantType: 'password', username: 'test', password: 'test', clientId: 'test', clientSecret: 'test'},
        headers: {'x-version': '7.0.0'}
    })

    t.equal(response.statusCode, 400, 'with a status code 400')
})

test('should fail to retrieve configuration when authorization is missing', async t => {

    const response = await app.inject({
        method: 'GET',
        url: '/v2/sdk/config',
        headers: {'x-version': '7.0.0', 'x-sdk': 'test', 'x-device-id': 'test', 'x-herow-id': 'test'}
    })

    t.equal(response.statusCode, 401, 'with a status code 401')
})

test('should fail to retrieve configuration when accessToken is wrong', async t => {

    const response = await app.inject({
        method: 'GET',
        url: '/v2/sdk/config',
        headers: {'authorization': 'OAuth wrong', 'x-version': '7.0.0', 'x-sdk': 'test', 'x-device-id': 'test', 'x-herow-id': 'test'}
    })

    t.equal(response.statusCode, 401, 'with a status code 401')
})

test('should retrieve configuration', async t => {

    const response = await app.inject({
        method: 'GET',
        url: '/v2/sdk/config',
        headers: {'authorization': 'OAuth test', 'x-version': '7.0.0', 'x-sdk': 'test', 'x-device-id': 'test', 'x-herow-id': 'test'}
    })

    t.equal(response.statusCode, 200, 'with a status code 200')
    t.not(response.headers['x-ref-date'], undefined)
    t.same(response.headers['x-cache-last-modified'], 'Thu, 01 Jan 1970 00:00:01 GMT')
    t.same(response.headers['last-modified'], 'Thu, 01 Jan 1970 00:00:00 GMT')
    t.same(response.json(), {
        cacheInterval: 10800 * 1000,
        configInterval: 600 * 1000,
        enabled: true
    }, 'with correct body')
})

test('should retrieve default configuration', async t => {

    const response = await app.inject({
        method: 'GET',
        url: '/v2/sdk/config',
        headers: {'authorization': 'OAuth default', 'x-version': '7.0.0', 'x-sdk': 'test', 'x-device-id': 'test', 'x-herow-id': 'test'}
    })

    t.equal(response.statusCode, 200, 'with a status code 200')
    t.not(response.headers['x-ref-date'], undefined)
    t.same(response.headers['x-cache-last-modified'], 'Thu, 01 Jan 1970 00:00:00 GMT')
    t.same(response.headers['last-modified'], 'Thu, 01 Jan 1970 00:00:00 GMT')
    t.same(response.json(), {
        cacheInterval: 10800 * 1000,
        configInterval: 600 * 1000,
        enabled: true
    }, 'with correct body')
})

test('should fail to send informations when adId is less than 10 characters', async t => {

    const response = await app.inject({
        method: 'PUT',
        url: '/v2/sdk/userinfo',
        headers: {'authorization': 'OAuth test', 'x-version': '7.0.0', 'x-sdk': 'test', 'x-device-id': 'test', 'x-herow-id': 'test'},
        payload: { adId: 'a' }
    })

    t.equal(response.statusCode, 400, 'with a status code 400')
})

test('should fail to send informations when optins contains []', async t => {

    const response = await app.inject({
        method: 'PUT',
        url: '/v2/sdk/userinfo',
        headers: {'authorization': 'OAuth test', 'x-version': '7.0.0', 'x-sdk': 'test', 'x-device-id': 'test', 'x-herow-id': 'test'},
        payload: { optins: [] }
    })

    t.equal(response.statusCode, 400, 'with a status code 400')
})

test('should fail to send informations when optins does not contain USER_DATA', async t => {

    const response = await app.inject({
        method: 'PUT',
        url: '/v2/sdk/userinfo',
        headers: {'authorization': 'OAuth test', 'x-version': '7.0.0', 'x-sdk': 'test', 'x-device-id': 'test', 'x-herow-id': 'test'},
        payload: { optins: [ { type: 'OTHER', value: false } ] }
    })

    t.equal(response.statusCode, 400, 'with a status code 400')
})

test('should fail to send informations when optins contains more than one element', async t => {

    const response = await app.inject({
        method: 'PUT',
        url: '/v2/sdk/userinfo',
        headers: {'authorization': 'OAuth test', 'x-version': '7.0.0', 'x-sdk': 'test', 'x-device-id': 'test', 'x-herow-id': 'test'},
        payload: { optins: [ { type: 'USER_DATA', value: false }, { type: 'USER_DATA', value: false } ] }
    })

    t.equal(response.statusCode, 400, 'with a status code 400')
})

test('should send informations when adId is more than 10 characters and optins contains USER_DATA', async t => {

    const response = await app.inject({
        method: 'PUT',
        url: '/v2/sdk/userinfo',
        headers: {'authorization': 'OAuth test', 'x-version': '7.0.0', 'x-sdk': 'test', 'x-device-id': 'test', 'x-herow-id': 'test'},
        payload: { adId: 'morethan10characters', optins: [ { type: 'USER_DATA', value: true } ], customId: "test" }
    })

    t.equal(response.statusCode, 200, 'with a status code 200')
    t.same(response.json(), {
        herowId: 'test'
    }, 'with test as herowId')
})

test('should return herowId from informations when herowId is not given', async t => {

    const response = await app.inject({
        method: 'PUT',
        url: '/v2/sdk/userinfo',
        headers: {'authorization': 'OAuth test', 'x-version': '7.0.0', 'x-sdk': 'test', 'x-device-id': 'test'},
        payload: { adId: 'morethan10characters', customId: 'test' }
    })

    t.equal(response.statusCode, 200, 'with a status code 200')
    t.not(response.json().herowId, undefined, 'with a correct set herowId')
})

test('should fail to send log if not authenticated', async t => {

    const response = await app.inject({
        method: 'POST',
        url: '/stat/queue',
        headers: {'authorization': 'OAuth wrong', 'x-version': '7.0.0', 'x-sdk': 'test', 'x-device-id': 'test', 'x-herow-id': 'test'},
        payload: {t: "app_mobile", data:{}}
    })

    t.equal(response.statusCode, 401, 'with a status code 401')
})

test('should send log', async t => {

    const response = await app.inject({
        method: 'POST',
        url: '/stat/queue',
        headers: {'authorization': 'OAuth test', 'x-version': '7.0.0', 'x-sdk': 'test', 'x-device-id': 'test', 'x-herow-id': 'test'},
        payload: {t: "app_mobile", data:{phone_id: "test"}}
    })

    t.equal(response.statusCode, 200, 'with a status code 200')
})

test('should no retrieve cache content is not authenticated', async t => {
    const response = await app.inject({
        method: 'GET',
        url: '/v2/sdk/cache/content/test',
        headers: {'authorization': 'OAuth wrong', 'x-version': '7.0.0', 'x-sdk': 'test', 'x-device-id': 'test', 'x-herow-id': 'test'}
    })

    t.equal(response.statusCode, 401, 'with a status code 401')
})

test('should not retrieve cache content when geohash is less than 4 characters', async t => {

    const response = await app.inject({
        method: 'GET',
        url: '/v2/sdk/cache/content/a',
        headers: {'authorization': 'OAuth test', 'x-version': '7.0.0', 'x-sdk': 'test', 'x-device-id': 'test', 'x-herow-id': 'test'}
    })

    t.equal(response.statusCode, 400, 'with a status code 400')
})

test('should not retrieve cache content when geohash is greater than 4 characters', async t => {

    const response = await app.inject({
        method: 'GET',
        url: '/v2/sdk/cache/content/abcde',
        headers: {'authorization': 'OAuth test', 'x-version': '7.0.0', 'x-sdk': 'test', 'x-device-id': 'test', 'x-herow-id': 'test'}
    })

    t.equal(response.statusCode, 400, 'with a status code 400')
})

test('should retrieve empty cache content', async t => {
    const response = await app.inject({
        method: 'GET',
        url: '/v2/sdk/cache/content/test',
        headers: {'authorization': 'OAuth default', 'x-version': '7.0.0', 'x-sdk': 'test', 'x-device-id': 'test', 'x-herow-id': 'test'}
    })

    t.equal(response.statusCode, 200, 'with a status code 200')
    t.same(response.json(), {
        campaigns: [],
        zones: [],
        pois: []
    }, 'with a correct content')
})

test('should retrieve populated cache content', async t => {
    const response = await app.inject({
        method: 'GET',
        url: '/v2/sdk/cache/content/u7ge',
        headers: {'authorization': 'OAuth test', 'x-version': '7.0.0', 'x-sdk': 'test', 'x-device-id': 'test', 'x-herow-id': 'test'}
    })

    t.equal(response.statusCode, 200, 'with a status code 200')
    t.same(response.json(), {
        campaigns: [{id:'1'}],
        zones: [{hash:'1'}],
        pois: [{id:'1'}]
    }, 'with a correct content')
})

test('should just return OK', async t => {
    const response = await app.inject({
        method: 'GET',
        url: '/healthz'
    })
    
    t.equal(response.statusCode, 200, 'with a status code 200')
    t.same(response.payload, "OK", 'with a correct content')
})