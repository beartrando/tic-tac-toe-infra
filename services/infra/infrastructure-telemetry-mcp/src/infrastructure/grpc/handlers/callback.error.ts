import * as grpc from "@grpc/grpc-js";
import * as errorProto from "../../../contracts/proto/common/error";
import {DomainError} from "@shared/errors";

export function callbackError(
    callback: grpc.sendUnaryData<any>,
    err: unknown,
) {
    if (err instanceof DomainError) {
        return callback(
            null,
            {
                error: errorProto.ErrorObject.create({
                    code: err.code, details: err.message
                })
            }
        );
    }
    const message = err instanceof Error ? err.message : "Unknown error";
    return callback({code: grpc.status.INTERNAL, details: message}, null);
}

export default callbackError;
