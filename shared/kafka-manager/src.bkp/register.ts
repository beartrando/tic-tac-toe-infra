import {Kafka} from "kafkajs";
import {KafkaConfig} from "./types";
import logger from "../../logger";

const kafkaMap = new Map<string, Kafka>();
const reconnectAttempts = new Map<string, number>();

export async function getKafkaInstance(
  config: KafkaConfig
): Promise<Kafka> {
  const {clientId, brokers} = config;

  if (!kafkaMap.has(clientId)) {
    const kafka = new Kafka({
      clientId,
      brokers: brokers.map(b => b.trim()),
      retry: {
        retries: 5,
        initialRetryTime: 300,
      },
      requestTimeout: 3000,
    });

    kafkaMap.set(clientId, kafka);

    try {
      await ensureTopics(kafka, clientId);
    } catch (error) {
      logger.error(
        `Kafka initialization failed for ${clientId}`,
        error
      );

      scheduleReconnect(config, clientId);
    }
  }

  return kafkaMap.get(clientId)!;
}

async function ensureTopics(
  kafka: Kafka,
  clientId: string
) {
  const admin = kafka.admin();

  try {
    await admin.connect();

    const topics = await admin.listTopics();

    logger.info(
      `[Kafka:${clientId}] Connected. Found ${topics.length} topics`
    );

    reconnectAttempts.set(clientId, 0);
  } finally {
    await admin.disconnect().catch(() => {
    });
  }
}

function scheduleReconnect(
  config: KafkaConfig,
  clientId: string
) {
  const attempts = reconnectAttempts.get(clientId) ?? 0;

  const delay = Math.min(
    1000 * Math.pow(2, attempts),
    30000
  );

  reconnectAttempts.set(clientId, attempts + 1);

  logger.warn(
    `[Kafka:${clientId}] Reconnect scheduled in ${delay} ms`
  );

  setTimeout(async () => {
    try {
      kafkaMap.delete(clientId);

      await getKafkaInstance(config);

      logger.info(
        `[Kafka:${clientId}] Reconnected successfully`
      );
    } catch (error) {
      logger.error(
        `[Kafka:${clientId}] Reconnect failed`,
        error
      );

      scheduleReconnect(config, clientId);
    }
  }, delay);
}
