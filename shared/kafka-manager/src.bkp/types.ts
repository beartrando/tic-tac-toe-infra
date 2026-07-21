export type KafkaConfig = {
  clientId: string;
  brokers: string[];
  groupId: string;
};

export type ConsumerConfig = {
  topic: string;
  handler: (topic: string, partition: number, message: any) => Promise<void>;
};
