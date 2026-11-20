export const messageConfig = {
    brokers: process.env.KAFKA_BROKERS?.split(',') ?? ['10.100.0.1:9092'],
    clientId: process.env.KAFKA_CLIENT_ID ?? 'infrastructure-telemetry-mcp-client',
    groupId: process.env.KAFKA_GROUP_ID ?? 'infrastructure-telemetry-mcp-service',
};

export default messageConfig;
