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
    req.body.type           = "app_mobile"
    req.body.date           = Date.now()
    req.body.herow_id       = req.herowId
    req.body.data.sdk       = req.client
    req.body.data.company   = req.client
    req.body.data.db        = req.client

    const userinfo = await fastify.redis.get('device:' + req.deviceId)
    req.body.data.custom_id = JSON.parse(userinfo)?.customId

    await fastify.kafka.send({
      topic: process.env.KAFKA_TOPIC || 'stat-logs',
      messages: [{ key: req.deviceId, value: JSON.stringify(req.body) } ],
      acks: 1,
      timeout: 500
    })
    res.send()
  })
}