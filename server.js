'use strict'

const DEFAULT_KAFKA_URL = 'kafka://127.0.0.1:9092'
const DEFAULT_REDIS_URL = 'redis://127.0.0.1:6379'
const DEFAULT_PORT = 8080

const fs = require('fs')

const fastify = require('./app')
    ({ logger: {level: 'warn' } })

const { Kafka } = require('kafkajs')
const kafkaProducer = () => {
    const uri = (process.env.KAFKA_URL || DEFAULT_KAFKA_URL).split(',')
    const withSsl = new URL(uri[0]).protocol === 'kafka+ssl:'
    const brokers = uri.map(url => new URL(url).host)

    return new Kafka({
        clientId: 'herow-sdk-backend',
        brokers: brokers,
        ssl: withSsl && {
            rejectUnauthorized: false,
            ca: [fs.readFileSync(process.env.KAFKA_TRUSTED_CERT || '/secrets/ca.crt', 'utf-8')],
            key: fs.readFileSync(process.env.KAFKA_CLIENT_CERT_KEY || '/secrets/client-key.pem', 'utf-8'),
            cert: fs.readFileSync(process.env.KAFKA_CLIENT_CERT || '/secrets/client-cert.pem', 'utf-8')
        }
    }).producer()
}

const redisOptions = () => {
    const uri = new URL(process.env.REDIS_URL || DEFAULT_REDIS_URL)
    const withSentinel = uri.protocol === 'sentinel:'
    if (withSentinel) {
        return {
            sentinels : [ { host: uri.hostname, port: uri.port } ],
            name: "redis-cluster-master",
            username: uri.username,
            password: uri.password,
            db: uri.pathname.substr(1),
        }
    } else {
        return { url: uri.href }
    }
}

fastify
    .register(require('fastify-redis'), redisOptions())
    .decorateRequest('kafka', null).addHook('onReady', async () => {
        const producer = kafkaProducer()
        await producer.connect()
        fastify.kafka = producer
    })
    .listen(process.env.PORT || DEFAULT_PORT, '0.0.0.0', (err) => {
        if (err) {
            console.log(err)
            process.exit(1)
        }
    })