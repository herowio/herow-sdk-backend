'use strict'

module.exports = async function (fastify, options) {

  fastify.post('/queue', {
    preHandler: fastify.auth([ fastify.verifyOAuthToken ]),
    schema: {
      body: {
        type: 'object',
        properties: {
          t: { type: 'string', enum: [ 'app_mobile' ] },
          data: { type: 'object' }
        },
        required: [ 't', 'data' ]
      },
      headers: {
        type: 'object',
        properties: {
          'x-version': { type: 'string' },
          'x-sdk': { type: 'string' },
          'x-device-id': { type: 'string' },
          'x-herow-id': { type: 'string' }
        },
        required: [ 'x-version', 'x-sdk', 'x-device-id', 'x-herow-id' ]
      }
    }
  }, async (req, res) => {
    req.log.info(req.body)
    res.send()
  })
}