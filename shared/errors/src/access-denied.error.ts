import * as errorProto from "./contracts/proto/common/error";
import DomainError from "./domain.error";

export class AccessDeniedError extends DomainError {
    readonly code = errorProto.ErrorCode.ACCESS_DENIED;

    constructor(details = "Access denied") {
        super(details);
    }
}

export default AccessDeniedError;

