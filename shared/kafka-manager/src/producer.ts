import { Partitioners, Producer } from 'kafkajs';
import logger from '@shared/logger';
import { ensureTopic } from './admin';
import { getKafkaInstance } from './register';
import { KafkaConfig } from './types';

export type KafkaProducer = {
    send(topic: string, message: unknown): Promise<void>;
    disconnect(): Promise<void>;
};

export async function createProducer(
    config: KafkaConfig,
): Promise<KafkaProducer> {
    const kafka = getKafkaInstance(config);

    const producer: Producer = kafka.producer({
        createPartitioner: Partitioners.DefaultPartitioner,
    });

    await producer.connect();


    return {
        async send(topic: string, message: unknown) {
            try {
                await ensureTopic(kafka, topic);

                await producer.send({
                    topic,
                    messages: [
                        {
                            value: JSON.stringify(message),
                        },
                    ],
                });
            } catch (err) {
                logger.error(`Failed to send message to "${topic}"`, err);
                throw err;
            }
        },

        async disconnect() {
            await producer.disconnect();
        },
    };
}
