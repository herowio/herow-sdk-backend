'use strict'

require('./app')
    ({ logger: true, level: 'info', prettyPrint: true })
        .register(require('fastify-compress'))
        .register(require('fastify-redis'), { host: process.env.REDIS_URL || '127.0.0.1', closeClient: true })
        .listen(process.env.PORT || 8080, '0.0.0.0', function (err, _) {
        if (err) {
            console.log(err)
            process.exit(1)
        }
})