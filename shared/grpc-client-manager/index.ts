export interface GrpcClientManagerInterface<ServiceInterface> {
    call<T>(
        operation: (client: ServiceInterface, callback: (err: Error | null, result?: any) => void) => void,
    ): Promise<T>;
}

export class GrpcClientManager<ServiceInterface> implements GrpcClientManagerInterface<ServiceInterface> {
    private readonly clientFactory: () => ServiceInterface;

    constructor(clientFactory: () => ServiceInterface) {
        this.clientFactory = clientFactory;
    }

    async call<T>(
        operation: (client: ServiceInterface, callback: (err: Error | null, result?: any) => void) => void,
    ): Promise<T> {
        const client = this.clientFactory();
        try {
            return await new Promise<T>((resolve, reject) => {
                operation(client, (err: Error | null, result?: any) => {
                    if (err) {
                        reject(err);
                    } else {
                        resolve(result as T);
                    }
                });
            });
        } finally {
            // Client cleanup can be handled here if needed
        }
    }
}

export default GrpcClientManager;