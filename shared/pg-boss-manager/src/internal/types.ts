import {
    BatchWorkerHandler,
    WorkerHandler,
} from '../types';


export type InternalWorkerRegistration = {
    topic: string;
    handler: WorkerHandler<any>;
};


export type InternalBatchWorkerRegistration = {
    topic: string;
    batchSize: number;
    handler: BatchWorkerHandler<any>;
};
