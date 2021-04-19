'use strict'

const crypto = require('crypto')
const expiration = process.env.USER_INFO_EXPIRATION || 2592000 // 30 days

module.exports = async function (fastify, options) {

  fastify.put('/userinfo',  {
    preHandler: fastify.auth([ fastify.verifyOAuthToken ]),
    schema: {
      body: {
        type: 'object',
        properties: {
          adId: { type: 'string', minLength: 10 },
          customId: { type: 'string' },
          optins: { type: 'array', 
            minItems: 1,
            maxItems: 1,
            items: { type: 'object', 
              properties: { 
                type: { type: 'string', enum: [ 'USER_DATA' ] }, 
                value: { type: 'boolean' } 
              } 
            } 
          }
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
        required: [ 'x-version', 'x-sdk', 'x-device-id' ]
      },
      response: {
        200: {
          type: 'object',
          properties: {
              herowId: { type: 'string' }
          }
        }
      }
    }
  }, async (req, res) => {
    const herowId = req.herowId || await crypto.randomBytes(10).toString('hex')
    req.body.herowId = herowId
    await fastify.redis.set('device:' + req.deviceId, JSON.stringify(req.body))
    await fastify.redis.expire('device:' + req.deviceId, expiration)
    res.send({
      herowId: herowId
    })
  })
}