import * as errorProto from "./contracts/proto/common/error";
import DomainError from "./domain.error";

export class InvalidSessionError extends DomainError {
    readonly code = errorProto.ErrorCode.INVALID_SESSION;

    constructor() {
        super("Invalid session");
    }
}

export default InvalidSessionError;

