import {connectingRequest} from '../lib/consumers';

export const kafkaConfig = {
    brokers: process.env.KAFKA_BROKERS?.split(',') ?? ['kafka:9092',],
    clientId: process.env.KAFKA_CLIENT_ID ?? 'bot-client',
    groupId: process.env.KAFKA_GROUP_ID ?? 'bot-service',
};


export const kafkaConsumersConfig = {
    botConnectingRequest: {
        topic:
            process.env.KAFKA_TOPIC_AI_CONNECTING_REQUEST ??
            "bot.connecting-request",
        handler: connectingRequest,
    },
};

export const kafkaProducersConfig: Record<string, string> = {};

export default kafkaConfig;

