import {HealthService} from './generated/common/health';
import * as grpc from '@grpc/grpc-js';
import * as healthHandler from "./handlers/health.handler";

const server = new grpc.Server();

server.addService(HealthService, {
    check: healthHandler.check,
    status: healthHandler.status,
    livez: healthHandler.livez,
    readyz: healthHandler.readyz,
});

export default server;

