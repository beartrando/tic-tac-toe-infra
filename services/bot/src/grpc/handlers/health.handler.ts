import * as grpc from '@grpc/grpc-js';
import * as healthGrpc from '../generated/common/health';
import * as emptyGrpc from '../generated/common/empty';
import * as heathService from '../../services/health.service';
import {callbackError} from './callback.error';
import logger from "@shared/logger";

export const check = async (
    call: grpc.ServerUnaryCall<emptyGrpc.Empty, healthGrpc.HealthReport>,
    callback: grpc.sendUnaryData<healthGrpc.HealthReport>
) => {
    try {
        const response = await heathService.check();

        callback(null, response);

    } catch (err: any) {
        logger.log(err);
        callbackError(callback, err);
    }
};

export const status = async (
    call: grpc.ServerUnaryCall<emptyGrpc.Empty, healthGrpc.ServiceStatus>,
    callback: grpc.sendUnaryData<healthGrpc.ServiceStatus>
) => {
    try {
        const response = await heathService.status();

        callback(null, response);

    } catch (err: any) {
        logger.log(err);
        callbackError(callback, err);
    }
};

export const livez = async (
    call: grpc.ServerUnaryCall<emptyGrpc.Empty, healthGrpc.LiveStatus>,
    callback: grpc.sendUnaryData<healthGrpc.LiveStatus>
) => {
    try {
        const response = await heathService.livez();

        callback(null, response);

    } catch (err: any) {
        logger.log(err);
        callbackError(callback, err);
    }
};

export const readyz = async (
    call: grpc.ServerUnaryCall<emptyGrpc.Empty, healthGrpc.ReadyStatus>,
    callback: grpc.sendUnaryData<healthGrpc.ReadyStatus>
) => {
    try {
        const response = await heathService.readyz();

        callback(null, response);

    } catch (err: any) {
        logger.log(err);
        callbackError(callback, err);
    }
};
