export interface TimerCallbackInterface {
    (): void | Promise<void>;
}

export default TimerCallbackInterface;
