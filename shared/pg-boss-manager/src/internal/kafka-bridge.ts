import { KafkaConfig } from '@shared/kafka-manager';

import {
    createProducer,
} from '@shared/kafka-manager';

import WorkerManager from './worker-manager';


export class KafkaBridge {

    private readonly workers: WorkerManager;


    constructor(
        workers: WorkerManager,
    ) {

        this.workers = workers;
    }


    /**
     * Start PgBoss -> Kafka bridge.
     */
    public async start(
        kafkaConfig: KafkaConfig,
        topic: string,
    ): Promise<void> {

        const producer = await createProducer(
            kafkaConfig,
        );


        await this.workers.registerBatchWorker(
            topic,
            10,
            async jobs => {

                for (const job of jobs) {

                    await producer.send(
                        topic,
                        job,
                    );
                }

            },
        );
    }

}

export default KafkaBridge;
