import { Kafka } from 'kafkajs';
import logger from '@shared/logger';

const sleep = (ms: number) =>
    new Promise(resolve => setTimeout(resolve, ms));

export async function withAdmin<T>(
    kafka: Kafka,
    fn: (admin: ReturnType<Kafka['admin']>) => Promise<T>,
): Promise<T> {
    const admin = kafka.admin();

    await admin.connect();

    try {
        return await fn(admin);
    } finally {
        await admin.disconnect().catch(() => {});
    }
}

const initializingTopics = new Map<string, Promise<void>>();

export async function ensureTopic(
    kafka: Kafka,
    topic: string,
    partitions = 1,
): Promise<void> {
    const existing = initializingTopics.get(topic);

    if (existing) {
        return existing;
    }

    const promise = (async () => {
        await withAdmin(kafka, async admin => {
            const topics = await admin.listTopics();///@TODO если будет 1000 топиков, listTopics() начнет становиться дорогой операцией. Можно определять существование по результату fetchTopicMetadata(). Это масштабируется лучше.

            if (!topics.includes(topic)) {
                logger.info(`Creating Kafka topic "${topic}"`);

                await admin.createTopics({
                    waitForLeaders: true,
                    topics: [{
                        topic,
                        numPartitions: partitions,
                        replicationFactor: 1,
                    }],
                });
            }

            await waitForLeader(admin, topic);
        });
    })();

    initializingTopics.set(topic, promise);

    try {
        await promise;
    } finally {
        initializingTopics.delete(topic);
    }
}

export async function waitForLeader(
    admin: ReturnType<Kafka['admin']>,
    topic: string,
    attempts = 30,
): Promise<void> {
    for (let i = 0; i < attempts; i++) {
        const metadata = await admin.fetchTopicMetadata({
            topics: [topic],
        });

        const partitions = metadata.topics[0]?.partitions ?? [];

        if (
            partitions.length > 0 &&
            partitions.every(p => p.leader >= 0)
        ) {
            return;
        }

        const delay = Math.min((i + 1) * 1000, 3000);
        await sleep(delay);
    }

    throw new Error(
        `Leader was not assigned for topic "${topic}"`,
    );
}
