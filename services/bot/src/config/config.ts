const [host, portStr] = (process.env.HTTP_GATEWAY || "gateway:8080").split(":");
const httpGatewayHost = host || "gateway";
const httpGatewayPort = Number(portStr) || 8080;
const httpGateway = httpGatewayHost + ':' + httpGatewayPort;


export const config = {
    grpcPort: Number(process.env.GRPC_PORT) || 50051,
    httpGatewayHost: httpGatewayHost,
    httpGatewayPort: httpGatewayPort,
    httpGateway: httpGateway,
    jwtAccessSecret: process.env.JWT_ACCESS_SECRET ?? (() => {
        throw new Error("JWT_ACCESS_SECRET missing");
    })(),
    webSocketStreaming: process.env.WEBSOCKET_STREAMING,
    deviceId: process.env.DEVICE_ID || 'bot-device-id',
};

export default config;
