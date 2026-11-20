import MessageConsumerHandlerInterface from "./message-consumer-handler.interface";

export interface MessageConsumerInterface<TMessage> {
    topic: string;
    handler: MessageConsumerHandlerInterface<TMessage>;
}

export default MessageConsumerInterface;
