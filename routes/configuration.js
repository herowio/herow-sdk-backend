'use strict'

module.exports = async function (fastify, options) {

    fastify.get('/config', {
      preHandler: fastify.auth([ fastify.verifyOAuthToken ]),
      schema: {
        headers: {
          type: 'object',
          properties: {
            'x-herow-id': { type: 'string' },
            'x-device-id': { type: 'string' },
            'x-version': { type: 'string' },
            'x-sdk': { type: 'string' }
          },
          required: [ 'x-version', 'x-sdk', 'x-device-id', 'x-herow-id' ]
        },
        response: {
          200: {
            type: 'object',
            properties: {
                cacheInterval: { type: 'number' },
                configInterval: { type: 'number' },
                enabled: { type: 'boolean' }
            }
          }
        }
      }
    }, async (req, res) => {
      const lastCacheModified = await fastify.redis.get('last-modified-cache:' + req.client)
      res.status(200).headers({
        'x-ref-date': new Date().toUTCString(),
        'x-cache-last-modified': new Date(lastCacheModified||0).toUTCString(),
        'last-modified': new Date(0).toUTCString(),
      }).send({
          cacheInterval: 10800 * 1000,
          configInterval: 600 * 1000,
          enabled: true
      })
    })
}