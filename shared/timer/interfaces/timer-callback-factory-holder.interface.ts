import TimerCallbackFactoryInterface from "./timer-callback-factory.interface";

export interface TimerCallbackFactoryHolderInterface<TEntity> {
    set factory(factory: TimerCallbackFactoryInterface<TEntity>);

    get factory(): TimerCallbackFactoryInterface<TEntity>;
}

export default TimerCallbackFactoryHolderInterface;
