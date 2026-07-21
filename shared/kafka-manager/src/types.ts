export type KafkaConfig = {
    clientId: string;
    brokers: string[];
    groupId: string;
};

export type ConsumerConfig<T = unknown> = {
    topic: string;
    handler: (
        topic: string,
        partition: number,
        message: T,
    ) => Promise<void>;
};

export type ProducerMessage = Record<string, unknown>;
