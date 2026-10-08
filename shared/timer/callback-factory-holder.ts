import TimerCallbackFactoryHolderInterface from "./interfaces/timer-callback-factory-holder.interface";
import TimerCallbackFactoryInterface from "./interfaces/timer-callback-factory.interface";

export class TimerCallbackFactoryHolder<TEntity> implements TimerCallbackFactoryHolderInterface<TEntity> {
    private _factory: TimerCallbackFactoryInterface<TEntity> | null = null;

    get factory(): TimerCallbackFactoryInterface<TEntity> {
        if (!this._factory) {
            throw new Error("Timer callback factory is not initialized");
        }

        return this._factory;
    }

    set factory(factory: TimerCallbackFactoryInterface<TEntity>) {
        if (this._factory) {
            throw new Error("Timer callback factory is already initialized");
        }

        this._factory = factory;
    }
}

export default TimerCallbackFactoryHolder;
