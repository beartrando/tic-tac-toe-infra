import {getKafkaInstance} from './register';
import {KafkaConfig} from './types';
import {Partitioners} from "kafkajs";
import logger from "../../logger";

export async function createProducer(config: KafkaConfig) {
  const kafka = await getKafkaInstance(config);
  const producer = kafka.producer({
    createPartitioner: Partitioners.DefaultPartitioner,
  });

  await producer.connect();

  // проверка и создание топика
  const admin = kafka.admin();
  try {
    await admin.connect();
    const topics = await admin.listTopics();

    if (!topics.includes("battle-stream")) {
      await admin.createTopics({
        topics: [{topic: "battle-stream", numPartitions: 1, replicationFactor: 1}],
        waitForLeaders: true,
      });
      logger.info("✅ Topic created: battle-stream");
    }
  } catch (err) {
    logger.error("❌ Kafka admin error:", err);
  } finally {
    await admin.disconnect();
  }

  return {
    send: async (topic: string, message: any) => {
      try {
        await producer.send({
          topic,
          messages: [{value: JSON.stringify(message)}],
        });
      } catch (err) {
        logger.error(`❌ Failed to send to ${topic}:`, err);
        // реконнект при ошибке
        await producer.disconnect();
        await producer.connect();
      }
    },
    disconnect: async () => await producer.disconnect(),
  };
}
