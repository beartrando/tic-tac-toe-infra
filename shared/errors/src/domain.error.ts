import * as errorProto from "./contracts/proto/common/error";

export abstract class DomainError extends Error {
    abstract readonly code: errorProto.ErrorCode;

    protected constructor(details: string) {
        super(details);
        this.name = this.constructor.name;
    }
}

export default DomainError;
