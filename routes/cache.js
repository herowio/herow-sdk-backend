'use strict'

module.exports = async function (fastify, options) {

  fastify.get('/cache/content/:geohash', {
    preHandler: fastify.auth([ fastify.verifyOAuthToken ]),
    schema: {
      params: {
        type: 'object',
        properties: {
          geohash: { type: 'string', minLength: 4, maxLength: 4 }
        }
      },
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
              campaigns: { type: 'array' },
              zones: { type: 'array' },
              pois: { type: 'array' }
          }
        }
      }
    }
  }, async (req, res) => {
    const client = req.client
    const geohash = req.params.geohash
    res.status(200).send({
      campaigns: JSON.parse(await fastify.redis.get('campaigns:' + client))||[],
      zones: JSON.parse(await fastify.redis.get('zones:' + client + ':' + geohash))||[],
      pois: JSON.parse(await fastify.redis.get('pois:' + geohash))||[]
    })
  })
}