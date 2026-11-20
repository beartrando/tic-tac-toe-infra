export interface MessageConsumerHandlerInterface<TMessage> {
    (
        topic: string,
        partition: number,
        message: TMessage,
    ): Promise<void>;
}

export default MessageConsumerHandlerInterface;
