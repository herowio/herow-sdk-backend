'use strict'

const DEFAULT_HOST = '127.0.0.1'
const DEFAULT_PORT = 8080

const fastify = require('./app')
    ({ logger: true, level: 'info', prettyPrint: true })

fastify
    .register(require('fastify-redis'), { url: process.env.REDIS_URL })
    .decorateRequest('kafka', null).addHook('onReady', async () => {
        const { Kafka } = require('kafkajs')
        const producer = new Kafka({ clientId: 'herow-sdk-backend', brokers: (process.env.KAFKA_URL || DEFAULT_HOST + ':9092').split(',') }).producer()
        await producer.connect()
        fastify.kafka = producer
    })
    .listen(process.env.PORT || DEFAULT_PORT, '0.0.0.0', (err) => {
        if (err) {
            console.log(err)
            process.exit(1)
        }
    })