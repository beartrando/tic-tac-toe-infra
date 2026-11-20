import * as grpc from "@grpc/grpc-js";
import * as healthProto from "../../../contracts/proto/common/health";
import * as emptyProto from "../../../contracts/proto/common/empty";
import callbackError from "./callback.error";
import logger from "@shared/logger";
import HealthUseCase from "../../../application/use-cases/health/health";
import StatusUseCase from "../../../application/use-cases/health/status";
import LivezUseCase from "../../../application/use-cases/health/livez";
import ReadyzUseCase from "../../../application/use-cases/health/readyz";

export class HealthHandler {
    constructor(
        private readonly healthUseCase: HealthUseCase,
        private readonly statusUseCase: StatusUseCase,
        private readonly livezUseCase: LivezUseCase,
        private readonly readyzUseCase: ReadyzUseCase,
    ) {
    }

    check = async (
        call: grpc.ServerUnaryCall<emptyProto.Empty, healthProto.HealthReport>,
        callback: grpc.sendUnaryData<healthProto.HealthReport>,
    ) => {
        try {
            const response = await this.healthUseCase.execute();
            callback(null, response,);
        } catch (err) {
            logger.log(err);
            callbackError(callback, err,);
        }
    };
    status = async (
        call: grpc.ServerUnaryCall<emptyProto.Empty, healthProto.ServiceStatus>,
        callback: grpc.sendUnaryData<healthProto.ServiceStatus>,
    ) => {
        try {
            const response = await this.statusUseCase.execute();
            callback(null, response,);
        } catch (err) {
            logger.log(err);
            callbackError(callback, err,);
        }
    };
    livez = async (
        call: grpc.ServerUnaryCall<emptyProto.Empty, healthProto.LiveStatus>,
        callback: grpc.sendUnaryData<healthProto.LiveStatus>,
    ) => {
        try {
            const response = await this.livezUseCase.execute();
            callback(null, response,);
        } catch (err) {
            logger.log(err);
            callbackError(callback, err,);
        }
    };
    readyz = async (
        call: grpc.ServerUnaryCall<emptyProto.Empty, healthProto.ReadyStatus>,
        callback: grpc.sendUnaryData<healthProto.ReadyStatus>,
    ) => {
        try {
            const response = await this.readyzUseCase.execute();
            callback(null, response,);
        } catch (err) {
            logger.log(err);
            callbackError(callback, err,);
        }
    };
}

export default HealthHandler;
