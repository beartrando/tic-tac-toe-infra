import * as grpc from '@grpc/grpc-js';

export const callbackError = (callback: grpc.sendUnaryData<any>, err: unknown) => {
    const message = err instanceof Error ? err.message : 'Unknown error';
    callback({code: grpc.status.INTERNAL, message}, null);
};
