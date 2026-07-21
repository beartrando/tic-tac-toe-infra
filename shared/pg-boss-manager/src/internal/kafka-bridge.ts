import {
    createProducer,
    KafkaConfig,
} from '../../kafka-manager';

import { PgBossManager } from './manager';

export class KafkaBridge {

    constructor(
        private readonly manager: PgBossManager,
    ) {
    }

    /**
     * Bridge PgBoss queue to Kafka topic.
     */
    public async startWorker<T>(
        kafkaConfig: KafkaConfig,
        topic: string,
        batchSize = 10,
    ): Promise<void> {

        const producer = await createProducer(
            kafkaConfig,
        );

        await this.manager.workers.startBatchWorker<T>(
            topic,
            async messages => {

                for (const message of messages) {
                    await producer.send(
                        topic,
                        message,
                    );
                }
            },
            batchSize,
        );
    }
}
