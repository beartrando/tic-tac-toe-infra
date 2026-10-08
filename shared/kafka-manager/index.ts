export interface KafkaConfig {
    brokers: string[];
    topics: Record<string, string>;
    groupId?: string;
}

export default KafkaConfig;