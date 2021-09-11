'use strict'

const crypto = require('crypto')
const expiration = process.env.TOKEN_EXPIRATION || 10800 // 3 hours
const secret = process.env.TOKEN_SALT || "secret"

module.exports = async function (fastify, options) {

  fastify.post('/authorize/token', {
    schema: {
      body: {
        type: 'object',
        properties: {
          client_id: { type: 'string' },
          client_secret: { type: 'string' },
          grant_type: { type: 'string', enum: [ 'password' ] },
          username: { type: 'string' },
          password: { type: 'string' }
        },
        required: [ 'clientId', 'clientSecret', 'grantType', 'username', 'password' ]
      },
      headers: {
        type: 'object',
        properties: {
          'x-version': { type: 'string' },
          'x-sdk': { type: 'string' }
        },
        required: [ 'x-version', 'x-sdk' ]
      },
      response: {
        200: {
          type: 'object',
          properties: {
            accessToken: { type: 'string' },
            expiresIn: { type: 'number' }
          }
        }
      }
    }
  }, async (req, res) => {
    const client_id = req.body.clientId
    const client_secret = req.body.clientSecret
    const username = req.body.username
    const password = req.body.password

    // sha256(client_id@client_secret@username@password) => client-name
    // we generate a token, that expires 3h later and we store it : token => client-name
    // client-name should be used later as key to retrieve the user configuration
    const key_proposal = client_id + "@" + client_secret + "@" + username + "@" + password
    const client_key = crypto.createHmac("sha256", secret).update(key_proposal).digest("hex")
    const client_name = await fastify.redis.get(client_key)

    if (client_name) {
      const token = await crypto.randomBytes(5).toString('hex')
      await fastify.redis.set('token:' + token, client_name)
      await fastify.redis.expire('token:'+ token, expiration)
      res.send({
        "accessToken": token,
        "expiresIn": expiration
      })
    } else {
      res.status(401).send("credentials are wrong");
    }
  })
}