import { Kafka } from 'kafkajs';
import logger from '../../logger';

const initializedTopics = new Set<string>();

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
    if (initializedTopics.has(topic)) {
        return;
    }

    await withAdmin(kafka, async admin => {
        const topics = await admin.listTopics();

        if (!topics.includes(topic)) {
            logger.info(`Creating Kafka topic "${topic}"`);

            await admin.createTopics({
                waitForLeaders: true,
                topics: [
                    {
                        topic,
                        numPartitions: partitions,
                        replicationFactor: 1,
                    },
                ],
            });
        }

        await waitForLeader(admin, topic);

        initializedTopics.add(topic);
    });
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

        await sleep(Math.min(1000 * (i + 1), 3000));
    }

    throw new Error(
        `Leader was not assigned for topic "${topic}"`,
    );
}
