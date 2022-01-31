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
          optins: {
            type: 'array',
            minItems: 1,
            maxItems: 1,
            items: {
              type: 'object',
              properties: {
                type: { type: 'string', enum: [ 'USER_DATA' ] }, 
                value: { type: 'boolean' } 
              }
            }
          },
          location: {
            type: 'object',
            properties: {
              status: { type: 'string', enum: [ 'ALWAYS', 'WHILE_IN_USE', 'NOT_DETERMINED', 'DENIED' ] },
              precision: { type: 'string', enum: [ 'FINE', 'COARSE' ] }
            }
          },
          predictions: {
            type: 'object',
            properties: {
              tags: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    tag: { type: 'string', minLength: 2 },
                    pattern: {
                      type: 'object',
                      properties: {
                        monday_early_morning: { type: 'number' },
                        monday_late_morning: { type: 'number' },
                        monday_lunch_time: { type: 'number' },
                        monday_early_afternoon: { type: 'number' },
                        monday_late_afternoon: { type: 'number' },
                        monday_evening: { type: 'number' },
                        monday_night: { type: 'number' },
                        tuesday_early_morning: { type: 'number' },
                        tuesday_late_morning: { type: 'number' },
                        tuesday_lunch_time: { type: 'number' },
                        tuesday_early_afternoon: { type: 'number' },
                        tuesday_late_afternoon: { type: 'number' },
                        tuesday_evening: { type: 'number' },
                        tuesday_night: { type: 'number' },
                        wednesday_early_morning: { type: 'number' },
                        wednesday_late_morning: { type: 'number' },
                        wednesday_lunch_time: { type: 'number' },
                        wednesday_early_afternoon: { type: 'number' },
                        wednesday_late_afternoon: { type: 'number' },
                        wednesday_evening: { type: 'number' },
                        wednesday_night: { type: 'number' },
                        thursday_early_morning: { type: 'number' },
                        thursday_late_morning: { type: 'number' },
                        thursday_lunch_time: { type: 'number' },
                        thursday_early_afternoon: { type: 'number' },
                        thursday_late_afternoon: { type: 'number' },
                        thursday_evening: { type: 'number' },
                        thursday_night: { type: 'number' },
                        friday_early_morning: { type: 'number' },
                        friday_late_morning: { type: 'number' },
                        friday_lunch_time: { type: 'number' },
                        friday_early_afternoon: { type: 'number' },
                        friday_late_afternoon: { type: 'number' },
                        friday_evening: { type: 'number' },
                        friday_night: { type: 'number' },
                        saturday_early_morning: { type: 'number' },
                        saturday_late_morning: { type: 'number' },
                        saturday_lunch_time: { type: 'number' },
                        saturday_early_afternoon: { type: 'number' },
                        saturday_late_afternoon: { type: 'number' },
                        saturday_evening: { type: 'number' },
                        saturday_night: { type: 'number' },
                        sunday_early_morning: { type: 'number' },
                        sunday_late_morning: { type: 'number' },
                        sunday_lunch_time: { type: 'number' },
                        sunday_early_afternoon: { type: 'number' },
                        sunday_late_afternoon: { type: 'number' },
                        sunday_evening: { type: 'number' },
                        sunday_night: { type: 'number' },
                      }
                    }
                  }
                }
              },
              zones: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    id: { type: 'string', minLength: 2 },
                    pattern: {
                      type: 'object',
                      properties: {
                        monday_early_morning: { type: 'number' },
                        monday_late_morning: { type: 'number' },
                        monday_lunch_time: { type: 'number' },
                        monday_early_afternoon: { type: 'number' },
                        monday_late_afternoon: { type: 'number' },
                        monday_evening: { type: 'number' },
                        monday_night: { type: 'number' },
                        tuesday_early_morning: { type: 'number' },
                        tuesday_late_morning: { type: 'number' },
                        tuesday_lunch_time: { type: 'number' },
                        tuesday_early_afternoon: { type: 'number' },
                        tuesday_late_afternoon: { type: 'number' },
                        tuesday_evening: { type: 'number' },
                        tuesday_night: { type: 'number' },
                        wednesday_early_morning: { type: 'number' },
                        wednesday_late_morning: { type: 'number' },
                        wednesday_lunch_time: { type: 'number' },
                        wednesday_early_afternoon: { type: 'number' },
                        wednesday_late_afternoon: { type: 'number' },
                        wednesday_evening: { type: 'number' },
                        wednesday_night: { type: 'number' },
                        thursday_early_morning: { type: 'number' },
                        thursday_late_morning: { type: 'number' },
                        thursday_lunch_time: { type: 'number' },
                        thursday_early_afternoon: { type: 'number' },
                        thursday_late_afternoon: { type: 'number' },
                        thursday_evening: { type: 'number' },
                        thursday_night: { type: 'number' },
                        friday_early_morning: { type: 'number' },
                        friday_late_morning: { type: 'number' },
                        friday_lunch_time: { type: 'number' },
                        friday_early_afternoon: { type: 'number' },
                        friday_late_afternoon: { type: 'number' },
                        friday_evening: { type: 'number' },
                        friday_night: { type: 'number' },
                        saturday_early_morning: { type: 'number' },
                        saturday_late_morning: { type: 'number' },
                        saturday_lunch_time: { type: 'number' },
                        saturday_early_afternoon: { type: 'number' },
                        saturday_late_afternoon: { type: 'number' },
                        saturday_evening: { type: 'number' },
                        saturday_night: { type: 'number' },
                        sunday_early_morning: { type: 'number' },
                        sunday_late_morning: { type: 'number' },
                        sunday_lunch_time: { type: 'number' },
                        sunday_early_afternoon: { type: 'number' },
                        sunday_late_afternoon: { type: 'number' },
                        sunday_evening: { type: 'number' },
                        sunday_night: { type: 'number' },
                      }
                    }
                  }
                }
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
              herowId: { type: 'string' },
              modifiedDate: { type: 'number' }
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
      herowId: herowId,
      modifiedDate: 0
    })
  })
}