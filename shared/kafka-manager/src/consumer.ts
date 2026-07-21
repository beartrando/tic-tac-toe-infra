import { Consumer, KafkaJSProtocolError } from 'kafkajs';
import logger from '../../logger';
import { ensureTopic } from './admin';
import { getKafkaInstance } from './register';
import { ConsumerConfig, KafkaConfig } from './types';

const sleep = (ms: number) =>
    new Promise(resolve => setTimeout(resolve, ms));

export async function createConsumer<T>(
    config: KafkaConfig,
    consumerConfig: ConsumerConfig<T>,
): Promise<Consumer> {
    const kafka = getKafkaInstance(config);

    await ensureTopic(kafka, consumerConfig.topic);

    const consumer = kafka.consumer({
        groupId: config.groupId,
    });

    consumer.on(consumer.events.CRASH, async event => {
        logger.error(
            `Consumer crashed (${consumerConfig.topic}) restart=${event.payload.restart}`,
            event.payload.error,
        );
    });

    await consumer.connect();

    let i = 0;
    while (true) {
        try {
            await consumer.subscribe({
                topic: consumerConfig.topic,
                fromBeginning: true,
            });

            break;
        } catch (err) {
            if (
                err instanceof KafkaJSProtocolError &&
                err.type === 'UNKNOWN_TOPIC_OR_PARTITION'
            ) {
                logger.warn(
                    `Topic "${consumerConfig.topic}" isn't ready yet. Retrying...`,
                );

                await sleep(Math.min(1000 * (++i), 3000));

                continue;
            }

            throw err;
        }
    }


    logger.info(`Consumer started: ${consumerConfig.topic}`);

    await consumer.run({
        eachMessage: async ({ topic, partition, message }) => {
            if (!message.value) {
                return;
            }

            try {
                const payload = JSON.parse(message.value.toString()) as T;

                await consumerConfig.handler(
                    topic,
                    partition,
                    payload,
                );
            } catch (err) {
                logger.error(
                    `Consumer handler failed (${topic})`,
                    err,
                );
            }
        },
    });

    return consumer;
}
