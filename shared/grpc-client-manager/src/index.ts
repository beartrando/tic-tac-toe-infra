import * as grpc from '@grpc/grpc-js';
import logger from '@shared/logger';

export type GrpcClientFactory<T> = () => T;

export type GrpcCall<TClient, TResult> = (
    client: TClient,
    cb: (
        err: grpc.ServiceError | null,
        res: TResult,
    ) => void,
) => void;

export class GrpcClientManager<TClient> {

  private client: TClient;

  constructor(
      private readonly createClient: GrpcClientFactory<TClient>,
  ) {
    this.client = this.createClient();
  }

  public async call<TResult>(
      fn: GrpcCall<TClient, TResult>,
  ): Promise<TResult> {

    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        return await this.execute(fn);
      } catch (err) {
        if (!this.isRecoverableError(err)) {
          throw err;
        }

        logger.warn(
            { err },
            '🔁 Recoverable gRPC error. Reconnecting...',
        );

        this.reconnect();
      }
    }

    // Сюда попасть нельзя, но TypeScript этого не понимает.
    return this.execute(fn);
  }

  private reconnect(): void {
    logger.warn('🔄 Reconnecting gRPC client...');

    (this.client as Partial<grpc.Client>).close?.();

    this.client = this.createClient();
  }

  private isRecoverableError(
      err: unknown,
  ): err is grpc.ServiceError {

    if (!(err instanceof Error) || !('code' in err)) {
      return false;
    }

    const grpcErr = err as grpc.ServiceError;

    const recoverableCodes = [
      grpc.status.UNAVAILABLE,
      grpc.status.DEADLINE_EXCEEDED,
      grpc.status.RESOURCE_EXHAUSTED,
      grpc.status.ABORTED,
    ];

    return Boolean(
        recoverableCodes.includes(grpcErr.code) ||
        (
            grpcErr.code === grpc.status.INTERNAL &&
            (
                grpcErr.details?.includes('connection') ||
                grpcErr.details?.includes('timeout')
            )
        )
    );
  }

  private execute<TResult>(
      fn: GrpcCall<TClient, TResult>,
  ): Promise<TResult> {

    return new Promise<TResult>((resolve, reject) => {
      fn(this.client, (err, res) => {
        if (err) {
          logger.error(
              {
                code: err.code,
                details: err.details,
                metadata: err.metadata?.getMap?.(),
              },
              'gRPC request failed',
          );

          return reject(err);
        }

        resolve(res);
      });
    });
  }
}
