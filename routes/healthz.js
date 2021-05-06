'use strict'

module.exports = async function (fastify, options) {

  fastify.get('/healthz', (req, res) => {
    return 'OK'
  })
}