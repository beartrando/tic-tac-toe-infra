import prisma from '../lib/prisma';
import logger from '@shared/logger';
import kafkaConfig from '../config/kafka.config';
import {createProducer} from '@shared/kafka-manager';
import * as healthGrpc from '../grpc/generated/common/health';

const startedAt = Date.now();

export const check = async (): Promise<healthGrpc.HealthReport> => {
    const [pgOk, kafkaOk] = await Promise.all([checkPostgres(), checkKafka()]);

    return {
        service: 'bot',
        status:
            pgOk && kafkaOk
                ? healthGrpc.HealthStatus.HEALTH_STATUS_OK
                : healthGrpc.HealthStatus.HEALTH_STATUS_FAIL,
        components: {
            postgres: pgOk
                ? healthGrpc.HealthStatus.HEALTH_STATUS_OK
                : healthGrpc.HealthStatus.HEALTH_STATUS_FAIL,
            kafka: kafkaOk
                ? healthGrpc.HealthStatus.HEALTH_STATUS_OK
                : healthGrpc.HealthStatus.HEALTH_STATUS_FAIL,
        },
        timestamp: new Date(),
    };
};

export const status = async (): Promise<healthGrpc.ServiceStatus> => {
    const uptimeMs = Date.now() - startedAt;

    return {
        name: 'bot',
        version: process.env.BUILD_VERSION || 'dev',
        env: process.env.NODE_ENV || 'development',
        uptimeSeconds: {
            seconds: Math.floor(uptimeMs / 1000),
            nanos: (uptimeMs % 1000) * 1_000_000,
        },
        timestamp: new Date(),
    };
}

export const livez = async (): Promise<healthGrpc.LiveStatus> => ({
    live: true,
});

export const readyz = async (): Promise<healthGrpc.ReadyStatus> => {
    const [pgOk, kafkaOk] = await Promise.all([checkPostgres(), checkKafka()]);
    return {ready: pgOk && kafkaOk};
};

export const checkPostgres = async (): Promise<boolean> => {
    try {
        await prisma.$queryRaw`SELECT 1`;
        return true;
    } catch (err) {
        logger.error('❌ Prisma/Postgres health check failed:', err);
        return false;
    }
};

export const checkKafka = async (): Promise<boolean> => {
    try {
        const producer = await createProducer(kafkaConfig);
        producer.send('healthcheck', [{value: 'ping'}]);
        return true;
    } catch (err) {
        logger.error('❌ Kafka health check failed:', err);
        return false;
    }
};
