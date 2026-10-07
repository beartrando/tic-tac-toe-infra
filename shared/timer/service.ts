export interface TimerServiceInterface<KEntity, TEntity> {
    start(key: KEntity, entity: TEntity, timeoutMs?: number): void;

    stop(key: KEntity): void;

    restart(key: KEntity, entity: TEntity, timeoutMs?: number): void;
}

export interface TimerCallbackInterface {
    (): void | Promise<void>;
}

export interface TimerCallbackFactoryInterface<TEntity> {
    create(entity: TEntity): TimerCallbackInterface;
}

export interface TimerCallbackFactoryHolderInterface<TEntity> {
    set factory(factory: TimerCallbackFactoryInterface<TEntity>);

    get factory(): TimerCallbackFactoryInterface<TEntity>;
}

export class TimerService<KEntity, TEntity>
    implements TimerServiceInterface<KEntity, TEntity>
{
    private readonly timers = new Map<KEntity, NodeJS.Timeout>();

    constructor(
        private readonly _callbackFactoryHolder: TimerCallbackFactoryHolderInterface<TEntity>,
        private readonly timeoutS: number,
    ) {
    }

    start(key: KEntity, entity: TEntity, timeoutS?: number): void {
        const timeout = 1000 * (timeoutS ?? this.timeoutS);

        const callbackFactory = this._callbackFactoryHolder.factory;

        const callback = callbackFactory.create(entity);

        this.stop(key);

        const timer = setTimeout(async () => {
            this.timers.delete(key);
            await callback();
        }, timeout);

        this.timers.set(key, timer);
    }

    stop(key: KEntity): void {
        const timer = this.timers.get(key);

        if (!timer) {
            return;
        }

        clearTimeout(timer);
        this.timers.delete(key);
    }

    restart(key: KEntity, entity: TEntity, timeoutS?: number): void {
        this.start(key, entity, timeoutS);
    }
}

export default TimerService;