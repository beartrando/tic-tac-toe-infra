import TimerCallbackInterface from "../interfaces/timer-callback.interface";

export interface TimerCallbackFactoryInterface<TEntity> {
    create(entity: TEntity): TimerCallbackInterface;
}

export default TimerCallbackFactoryInterface;
