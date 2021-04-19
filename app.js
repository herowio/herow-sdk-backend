'use strict'

const fastify = require('fastify')

function build(opts={}) {
    return fastify(opts)
        .decorate('verifyOAuthToken', async function (request, reply, done) {
            const authorization = request.headers['authorization']
            if (!authorization || !authorization.startsWith('OAuth ')) {
                done(new Error('accessToken is missing'))
            }
            
            const accessToken = authorization.substring(6)
            const client = await this.redis.get('token:' + accessToken)
            if (!client) {
                done(new Error('accessToken is unknown'))
            }
            
            request.client = client
            request.log.debug('verifyOAuthToken - accessToken:' + accessToken + ' -> client:' + client)
            done()
        })
        .decorateRequest('deviceId','')
        .decorateRequest('herowId','')
        .addHook('preHandler', function(request, reply, done) {
            request.deviceId = request.headers['x-device-id']
            request.herowId = request.headers['x-herow-id']
            done()
        })
        .register(require('fastify-auth'))
        .register(require('./routes/authentication'), { prefix: '/auth' })
        .register(require('./routes/configuration'),  { prefix: '/v2/sdk' })
        .register(require('./routes/information'), { prefix: '/v2/sdk' })
        .register(require('./routes/cache'), { prefix: '/v2/sdk' })
        .register(require('./routes/logs'), { prefix: '/stat' })
}

module.exports = build