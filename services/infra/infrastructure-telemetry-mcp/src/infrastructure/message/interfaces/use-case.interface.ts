import MessageConsumerHandlerInterface from "./message-consumer-handler.interface";

export interface UseCaseInterface<TMessage> {
    execute: MessageConsumerHandlerInterface<TMessage>
}

export default UseCaseInterface;
