import * as errorProto from "./contracts/proto/common/error";

export class ValidationError extends DomainError {
    readonly code = errorProto.ErrorCode.VALIDATION_FAILED;

    constructor(message: string) {
        super(message);
    }
}
