import * as errorProto from "../contracts/proto/common/error";
import DomainError from "./domain.error";

export class ValidationFailedError extends DomainError {
    readonly code = errorProto.ErrorCode.VALIDATION_FAILED;

    constructor(message: string) {
        super(message);
    }
}

export default ValidationFailedError;
