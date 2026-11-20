import * as grpc from "@grpc/grpc-js";
import * as healthProto from "../../../contracts/proto/common/health";
import * as emptyProto from "../../../contracts/proto/common/empty";
import callbackError from "./callback.error";
import logger from "@shared/logger";
import HealthUseCase from "../../../application/use-cases/health/health";
import StatusUseCase from "../../../application/use-cases/health/status";
import LivezUseCase from "../../../application/use-cases/health/livez";
import ReadyzUseCase from "../../../application/use-cases/health/readyz";

export class InfrastructureTelemetryMcpHandler {
    constructor(
    ) {
    }

}

export default InfrastructureTelemetryMcpHandler;
