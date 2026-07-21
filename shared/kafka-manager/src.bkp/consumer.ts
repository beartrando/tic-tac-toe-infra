import {getKafkaInstance} from './register';
import {ConsumerConfig, KafkaConfig} from './types';
import {Kafka, KafkaJSProtocolError} from 'kafkajs';
import logger from "../../logger";

export async function createConsumer(config: KafkaConfig, consumerConfig: ConsumerConfig) {
  const kafka = await getKafkaInstance(config);
  const admin = kafka.admin();
  const consumer = kafka.consumer({groupId: config.groupId});

  await admin.connect();

  // Проверка существования топика
  const metadata = await admin.fetchTopicMetadata();
  const topicExists = metadata.topics.some(t => t.name === consumerConfig.topic);

  // logger.log('createConsumer kafka config = ');
  // logger.log(config);
  // logger.log('kafka.createConsumer consumer config = ');
  // logger.log(consumerConfig);
  if (!topicExists) {
    await admin.createTopics({
      topics: [{topic: consumerConfig.topic, numPartitions: 1, replicationFactor: 1}],
      waitForLeaders: true,
    });
    logger.info(`✅ Created topic ${consumerConfig.topic}`);
    await waitForLeader(admin, consumerConfig.topic);
    await admin.fetchTopicMetadata({topics: [consumerConfig.topic]});
  }

  consumer.on(consumer.events.CRASH, async (event) => {
    console.error('Consumer crashed', event.payload.error);
    // перезапуск
    await consumer.connect();
    await consumer.subscribe({topic: 'battle-events'});
  });

  await admin.disconnect();
  await consumer.connect();


  // Подписка с retry
  for (let attempt = 0; attempt < 5; attempt++) {
    try {
      await consumer.subscribe({topic: consumerConfig.topic, fromBeginning: true});
      break;
    } catch (err) {
      if (err instanceof KafkaJSProtocolError && err.type === 'UNKNOWN_TOPIC_OR_PARTITION') {
        logger.warn(`⚠️ Partition not ready for ${consumerConfig.topic}, retrying...`);
        await new Promise(res => setTimeout(res, 1000 * (attempt + 1)));
        continue;
      }
      throw err;
    }
  }

  await consumer.run({
    eachMessage: async ({topic, partition, message}) => {
      const value = message.value?.toString();
      if (value) {
        await consumerConfig.handler(topic, partition, JSON.parse(value));
      }
    }
  });

  return consumer;
}

async function waitForLeader(admin: ReturnType<Kafka["admin"]>, topic: string, maxAttempts = 5) {
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    const metadata = await admin.fetchTopicMetadata({topics: [topic]});
    const partitions = metadata.topics[0]?.partitions ?? [];
    const leaderReady = partitions.every(p => p.leader !== -1);

    if (leaderReady) {
      logger.info(`✅ Leader assigned for topic ${topic}`);
      return;
    }

    const delay = 500 * attempt; // экспоненциальный backoff
    logger.warn(`⚠️ Leader not ready for ${topic}, retry ${attempt}/${maxAttempts} in ${delay}ms`);
    await new Promise(res => setTimeout(res, delay));
  }

  throw new Error(`❌ Leader not assigned for topic ${topic} after ${maxAttempts} attempts`);
}
