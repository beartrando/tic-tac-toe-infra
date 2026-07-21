import { Kafka } from 'kafkajs';
import { KafkaConfig } from './types';

const kafkaMap = new Map<string, Kafka>();

export function getKafkaInstance(config: KafkaConfig): Kafka {
  const { clientId, brokers } = config;

  let kafka = kafkaMap.get(clientId);

  if (!kafka) {
    kafka = new Kafka({
      clientId,
      brokers: brokers.map(b => b.trim()),
      retry: {
        retries: 10,
        initialRetryTime: 300,
      },
      requestTimeout: 5000,
    });

    kafkaMap.set(clientId, kafka);
  }

  return kafka;
}

export function destroyKafkaInstance(clientId: string): void {
  kafkaMap.delete(clientId);
}